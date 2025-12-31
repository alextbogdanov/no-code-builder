"use client";

// ============================================================================
// ### IMPORTS ###
// ============================================================================
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, ChevronDown, Check, Cpu } from "lucide-react";

// ============================================================================
// ### COMPONENTS ###
// ============================================================================
import { ChatInterface } from "@/components/chat-interface";
import { PreviewPanel } from "@/components/preview-panel";

// ============================================================================
// ### STORES ###
// ============================================================================
import {
	getProjectState,
	addMessage,
	updateProjectFiles,
	updateDeploymentUrl,
	addHistoryEntry,
	generateId,
	updateSelectedModel,
} from "@/lib/storage";

// ============================================================================
// ### CONSTANTS ###
// ============================================================================
import { AVAILABLE_MODELS, DEFAULT_MODEL_ID } from "@/lib/constants";

// ============================================================================
// ### TYPES ###
// ============================================================================
import type {
	ChatMessage,
	FileMap,
	ProjectState,
	ModelId,
} from "@/types/project";

type LoadingStage =
	| "analyzing"
	| "designing"
	| "recovering"
	| "deploying"
	| null;

// ============================================================================
// ### CUSTOM ###
// ============================================================================
export default function BuilderPage() {
	const router = useRouter();

	// State
	const [projectState, setProjectState] = useState<ProjectState | null>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [files, setFiles] = useState<FileMap>({});
	const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isDeploying, setIsDeploying] = useState(false);
	const [loadingStage, setLoadingStage] = useState<LoadingStage>(null);
	const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
	const [streamingCode, setStreamingCode] = useState<string>("");
	const [abortController, setAbortController] =
		useState<AbortController | null>(null);
	const [selectedModel, setSelectedModel] = useState<ModelId>(DEFAULT_MODEL_ID);
	const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

	// Get the selected model config
	const selectedModelConfig =
		AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

	// Load project state on mount
	useEffect(() => {
		const state = getProjectState();
		if (!state) {
			// No project state, redirect to landing
			router.push("/");
			return;
		}

		setProjectState(state);
		setMessages(state.messages);
		setFiles(state.files);
		setDeploymentUrl(state.deploymentUrl);

		// Load selected model from project state
		if (state.selectedModel) {
			setSelectedModel(state.selectedModel);
		}

		// Check if this is a new project (has initial message but no assistant responses)
		const hasOnlyUserMessage =
			state.messages.length === 1 && state.messages[0].role === "user";

		if (hasOnlyUserMessage) {
			// New project - go straight to building and trigger generation
			setInitialPrompt(state.messages[0].content);
		}
	}, [router]);

	// Process initial prompt when set (new project)
	useEffect(() => {
		if (initialPrompt && projectState) {
			processMessage(initialPrompt, true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initialPrompt, projectState]);

	// Stop the current generation
	const handleStopGeneration = () => {
		if (abortController) {
			abortController.abort();
			setAbortController(null);
		}
	};

	// Process a message (user or initial)
	const processMessage = async (content: string, isInitial = false) => {
		// Create new abort controller for this request
		const controller = new AbortController();
		setAbortController(controller);

		setIsLoading(true);
		setLoadingStage("analyzing");
		setIsDeploying(false);
		setStreamingCode(""); // Clear any previous streaming code

		// Add user message if not initial
		if (!isInitial) {
			const userMessage: ChatMessage = {
				id: generateId(),
				role: "user",
				content,
				timestamp: Date.now(),
				status: "complete",
			};
			setMessages((prev) => [...prev, userMessage]);
			addMessage({ role: "user", content, status: "complete" });
		}

		try {
			// Call the generate API with selected model
			const response = await fetch("/api/generate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userMessage: content,
					files,
					projectName: projectState?.name || "My Project",
					modelId: selectedModel,
				}),
				signal: controller.signal,
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			// Process SSE stream
			const reader = response.body?.getReader();
			if (!reader) throw new Error("No response body");

			const decoder = new TextDecoder();
			let buffer = "";
			let updatedFiles = files;
			let finalMessage = "";
			let errorMessage: string | null = null;

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop() || "";

				let currentEvent = "";

				for (const line of lines) {
					if (line.startsWith("event: ")) {
						currentEvent = line.slice(7);
						continue;
					}

					if (line.startsWith("data: ")) {
						const data = line.slice(6);
						try {
							const parsed = JSON.parse(data);

							switch (currentEvent) {
								case "stage":
									setLoadingStage(parsed.stage);
									if (parsed.stage === "deploying") {
										setIsDeploying(true);
									}
									break;

								case "code_stream":
									// Append streamed code chunk
									setStreamingCode((prev) => prev + parsed.chunk);
									break;

								case "files":
									updatedFiles = parsed as FileMap;
									setFiles(updatedFiles);
									updateProjectFiles(updatedFiles);
									// Add to history for undo
									addHistoryEntry({
										files: updatedFiles,
										deploymentUrl,
									});
									break;

								case "deployment":
									if (parsed.url) {
										setDeploymentUrl(parsed.url);
										updateDeploymentUrl(parsed.url);
										setIsDeploying(false);
									}
									break;

								case "done":
									finalMessage = parsed.message;
									break;

								case "error":
									errorMessage = parsed.message;
									// If recoverable, still continue (deployment failed but generation succeeded)
									if (!parsed.recoverable) {
										throw new Error(parsed.message);
									}
									break;
							}
						} catch (parseError) {
							// Skip unparseable data unless it's a thrown error
							if (
								parseError instanceof Error &&
								parseError.message !== "Unexpected token"
							) {
								throw parseError;
							}
						}
					}
				}
			}

			// Add assistant message with the final result
			if (finalMessage) {
				const assistantMessage: ChatMessage = {
					id: generateId(),
					role: "assistant",
					content: errorMessage
						? `${finalMessage}\n\n⚠️ Note: ${errorMessage}`
						: finalMessage,
					timestamp: Date.now(),
					status: "complete",
				};
				setMessages((prev) => [...prev, assistantMessage]);
				addMessage({
					role: "assistant",
					content: assistantMessage.content,
					status: "complete",
				});
			}
		} catch (error) {
			// Handle abort (user stopped generation)
			if (error instanceof Error && error.name === "AbortError") {
				const stoppedMessage: ChatMessage = {
					id: generateId(),
					role: "assistant",
					content: "⏹️ Generation stopped by user.",
					timestamp: Date.now(),
					status: "complete",
				};
				setMessages((prev) => [...prev, stoppedMessage]);
				addMessage({
					role: "assistant",
					content: stoppedMessage.content,
					status: "complete",
				});
				return;
			}

			console.error("Generation error:", error);

			// Add error message
			const errorMsg =
				error instanceof Error ? error.message : "An error occurred";
			const assistantMessage: ChatMessage = {
				id: generateId(),
				role: "assistant",
				content: `❌ Error: ${errorMsg}`,
				timestamp: Date.now(),
				status: "error",
			};
			setMessages((prev) => [...prev, assistantMessage]);
		} finally {
			setIsLoading(false);
			setLoadingStage(null);
			setIsDeploying(false);
			setStreamingCode(""); // Clear streaming code when done
			setAbortController(null);
		}
	};

	// Handle sending a new message
	const handleSendMessage = (content: string) => {
		processMessage(content);
	};

	// Handle going back to landing
	const handleBack = () => {
		router.push("/");
	};

	// Handle model change
	const handleModelChange = (modelId: ModelId) => {
		setSelectedModel(modelId);
		setIsModelDropdownOpen(false);
		updateSelectedModel(modelId);
	};

	// Show nothing while loading project state
	if (!projectState) {
		return null;
	}

	return (
		<div className="min-h-screen bg-midnight-950">
			<motion.div
				key="building"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="h-screen flex flex-col"
			>
				{/* Header */}
				<header className="flex-shrink-0 h-14 border-b border-midnight-800 bg-midnight-950 px-4 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<button
							onClick={handleBack}
							className="p-2 rounded-lg text-midnight-400 hover:text-white hover:bg-midnight-800 transition-colors"
						>
							<ArrowLeft className="w-5 h-5" />
						</button>
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aurora-cyan to-aurora-purple flex items-center justify-center">
								<Sparkles className="w-4 h-4 text-white" />
							</div>
							<div>
								<h1 className="font-display font-semibold text-white text-sm">
									{projectState.name}
								</h1>
								<p className="text-midnight-500 text-xs">NoCode Builder</p>
							</div>
						</div>
					</div>

					{/* Model selector & Status indicator */}
					<div className="flex items-center gap-3">
						{/* Model selector */}
						<div className="relative">
							<button
								type="button"
								onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
								disabled={isLoading}
								className="
									flex items-center gap-2 px-3 py-1.5 rounded-lg
									bg-midnight-800/50 border border-midnight-700
									text-midnight-200 hover:text-white
									hover:bg-midnight-700 hover:border-midnight-600
									transition-all duration-200
									disabled:opacity-50 disabled:cursor-not-allowed
								"
							>
								<Cpu className="w-3.5 h-3.5 text-aurora-cyan" />
								<span className="text-xs font-medium">
									{selectedModelConfig.name}
								</span>
								<ChevronDown
									className={`w-3.5 h-3.5 transition-transform ${
										isModelDropdownOpen ? "rotate-180" : ""
									}`}
								/>
							</button>

							{/* Dropdown menu */}
							{isModelDropdownOpen && (
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									className="absolute top-full mt-1 right-0 w-64 bg-midnight-900 border border-midnight-700 rounded-xl shadow-xl z-50 overflow-hidden"
								>
									{AVAILABLE_MODELS.map((model) => (
										<button
											key={model.id}
											type="button"
											onClick={() => handleModelChange(model.id)}
											className={`
												w-full px-3 py-2.5 flex items-start gap-2.5 text-left
												hover:bg-midnight-800 transition-colors
												${selectedModel === model.id ? "bg-midnight-800/50" : ""}
											`}
										>
											<div
												className={`
												w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5
												${
													selectedModel === model.id
														? "border-aurora-cyan bg-aurora-cyan/20"
														: "border-midnight-600"
												}
											`}
											>
												{selectedModel === model.id && (
													<Check className="w-2.5 h-2.5 text-aurora-cyan" />
												)}
											</div>
											<div className="flex-1">
												<div className="flex items-center gap-1.5">
													<span className="text-white font-medium text-xs">
														{model.name}
													</span>
													<span className="text-midnight-500 text-[10px] capitalize">
														({model.provider})
													</span>
												</div>
												<p className="text-midnight-400 text-[10px] mt-0.5">
													{model.description}
												</p>
											</div>
										</button>
									))}
								</motion.div>
							)}
						</div>

						{/* Status indicator */}
						{isLoading && (
							<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-aurora-cyan/10 border border-aurora-cyan/20">
								<motion.div
									animate={{ rotate: 360 }}
									transition={{
										duration: 1,
										repeat: Infinity,
										ease: "linear",
									}}
									className="w-3 h-3 border-2 border-aurora-cyan border-t-transparent rounded-full"
								/>
								<span className="text-aurora-cyan text-xs font-medium">
									{loadingStage === "analyzing" &&
										"Crafting a beautiful design..."}
									{loadingStage === "designing" &&
										"Building your startup from scratch..."}
									{loadingStage === "recovering" && "Recovering..."}
									{loadingStage === "deploying" &&
										"Deploying your website to the web..."}
								</span>
							</div>
						)}
						{deploymentUrl && !isLoading && (
							<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
								<span className="relative flex h-2 w-2">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
									<span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
								</span>
								<span className="text-green-400 text-xs font-medium">Live</span>
							</div>
						)}
					</div>
				</header>

				{/* Main content - split view */}
				<div className="flex-1 flex overflow-hidden">
					{/* Chat panel */}
					<div className="w-[400px] flex-shrink-0 border-r border-midnight-800">
						<ChatInterface
							messages={messages}
							onSendMessage={handleSendMessage}
							isLoading={isLoading}
							loadingStage={loadingStage}
							streamingCode={streamingCode}
							onStopGeneration={handleStopGeneration}
						/>
					</div>

					{/* Preview panel */}
					<div className="flex-1">
						<PreviewPanel
							deploymentUrl={deploymentUrl}
							files={files}
							isDeploying={isDeploying}
							projectName={projectState.name}
						/>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
