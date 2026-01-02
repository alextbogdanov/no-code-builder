"use client";

// ============================================================================
// ### IMPORTS ###
// ============================================================================
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, MessageSquare, Eye, Globe } from "lucide-react";

// ============================================================================
// ### CONVEX ###
// ============================================================================
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// ============================================================================
// ### COMPONENTS ###
// ============================================================================
import { ChatInterface } from "@/components/chat-interface";
import { PreviewPanel } from "@/components/preview-panel";
import { AuthModal } from "@/components/auth-modal";
import { MobileDomainsPanel } from "@/components/preview/MobileDomainsPanel";

// ============================================================================
// ### STORES ###
// ============================================================================
import {
	saveProjectState,
	addMessage as addLocalMessage,
	updateProjectFiles,
	updateDeploymentUrl,
	addHistoryEntry,
	generateId,
	updateSelectedModel,
} from "@/lib/storage";

// ============================================================================
// ### CONSTANTS ###
// ============================================================================
import { DEFAULT_MODEL_ID } from "@/lib/constants";

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

/**
 * Loading fallback for Suspense boundary
 */
function BuilderLoading() {
	return (
		<div className="min-h-screen bg-midnight-950 flex items-center justify-center">
			<div className="flex items-center gap-3">
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
					className="w-8 h-8 border-2 border-aurora-cyan border-t-transparent rounded-full"
				/>
				<span className="text-midnight-300 font-medium">
					Loading builder...
				</span>
			</div>
		</div>
	);
}

/**
 * Main builder page content - uses useSearchParams which requires Suspense
 */
function BuilderPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const chatIdParam = searchParams.get("chatId");

	// Auth - builder requires authentication
	const currentUser = useQuery(api.queries.users.getCurrentUser);
	const isAuthLoading = currentUser === undefined;
	const isAuthenticated = !!currentUser;
	const [showAuthModal, setShowAuthModal] = useState(false);

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
	const [mobileTab, setMobileTab] = useState<"chat" | "preview" | "domains">(
		"preview"
	);
	const [isMobile, setIsMobile] = useState<boolean>(false);

	// Convex mutations and actions
	const addConvexMessage = useMutation(api.mutations.chats.addMessage);
	const updateChatFiles = useAction(api.mutations.chats.updateChatFiles);
	const getChatFilesAction = useAction(api.queries.chats.getChatFiles);
	const updateConvexDeployment = useMutation(
		api.mutations.chats.updateDeployment
	);
	const updateConvexModel = useMutation(
		api.mutations.chats.updateSelectedModel
	);

	// Get chat from Convex if chatId is provided
	const convexChat = useQuery(
		api.queries.chats.getChat,
		chatIdParam ? { chatId: chatIdParam as Id<"chats"> } : "skip"
	);

	// Track if R2 files have been loaded
	const [r2FilesLoaded, setR2FilesLoaded] = useState(false);

	// Track if initial generation has been triggered (to prevent re-triggering)
	const [initialGenerationTriggered, setInitialGenerationTriggered] =
		useState(false);

	// Detect mobile viewport
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	// Check authentication - show auth modal if not authenticated
	useEffect(() => {
		if (!isAuthLoading && !isAuthenticated) {
			setShowAuthModal(true);
		}
	}, [isAuthLoading, isAuthenticated]);

	// Load project state on mount or from Convex (only if authenticated)
	useEffect(() => {
		// Wait for auth check to complete
		if (isAuthLoading) return;

		// If not authenticated, don't load project state
		if (!isAuthenticated) return;

		// For authenticated users, chatId is REQUIRED
		if (!chatIdParam) {
			// No chatId for authenticated user - redirect to home
			router.push("/");
			return;
		}

		// Load from Convex chat
		if (convexChat) {
			// Only initialize project state once (on first load)
			// After that, let local state handle updates to prevent overwrites
			if (!projectState) {
				const state: ProjectState = {
					id: convexChat._id,
					name: convexChat.name,
					files: {}, // Files will be loaded separately from R2
					messages: convexChat.messages as ChatMessage[],
					deploymentUrl: convexChat.deploymentUrl || null,
					createdAt: convexChat.createdAt,
					updatedAt: convexChat.updatedAt,
					selectedModel: convexChat.selectedModel as ModelId,
					chatId: convexChat._id,
				};

				setProjectState(state);
				setMessages(state.messages);
				setDeploymentUrl(state.deploymentUrl);

				if (state.selectedModel) {
					setSelectedModel(state.selectedModel);
				}

				// Save to localStorage for history/undo functionality (but don't use it for routing)
				saveProjectState(state);

				// Check if this is a new project (has initial message but no assistant responses)
				const hasOnlyUserMessage =
					state.messages.length === 1 && state.messages[0].role === "user";

				if (hasOnlyUserMessage) {
					setInitialPrompt(state.messages[0].content);
				}
			}
		}
	}, [router, chatIdParam, convexChat, isAuthLoading, isAuthenticated, projectState]);

	// Load files from R2 when chat is loaded and has an r2Key
	useEffect(() => {
		const loadFilesFromR2 = async () => {
			if (chatIdParam && convexChat?.r2Key && !r2FilesLoaded) {
				try {
					const r2Files = await getChatFilesAction({
						chatId: chatIdParam as Id<"chats">,
					});
					if (r2Files && Object.keys(r2Files).length > 0) {
						setFiles(r2Files as FileMap);
					}
					setR2FilesLoaded(true);
				} catch (err) {
					console.error("Failed to load files from R2:", err);
					setR2FilesLoaded(true);
				}
			}
		};

		loadFilesFromR2();
	}, [chatIdParam, convexChat?.r2Key, r2FilesLoaded, getChatFilesAction]);

	// Process initial prompt when set (new project)
	// Only trigger once to prevent double generation
	useEffect(() => {
		if (initialPrompt && projectState && !initialGenerationTriggered) {
			setInitialGenerationTriggered(true);
			processMessage(initialPrompt, true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initialPrompt, projectState, initialGenerationTriggered]);

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

			// Save to Convex if authenticated
			if (chatIdParam) {
				try {
					await addConvexMessage({
						chatId: chatIdParam as Id<"chats">,
						message: userMessage,
					});
				} catch (err) {
					console.error("Failed to save message to Convex:", err);
				}
			} else {
				// Save to local storage for anonymous users
				addLocalMessage({ role: "user", content, status: "complete" });
			}
		}

		try {
			// Call the generate API with selected model and chatId
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
					chatId: chatIdParam || undefined,
				}),
				signal: controller.signal,
			});

			if (!response.ok) {
				throw new Error(`Something went wrong. Please try again.`);
			}

			// Process SSE stream
			const reader = response.body?.getReader();
			if (!reader) throw new Error("No response body");

			const decoder = new TextDecoder();
			let buffer = "";
			let updatedFiles = files;
			let finalMessage = "";
			let errorMessage: string | null = null;
			let newDeploymentUrl: string | null = null;
			let newSandboxId: string | null = null;

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
										newDeploymentUrl = parsed.url;
										newSandboxId = parsed.sandboxId;
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

			// Save files to R2 via Convex if authenticated
			if (chatIdParam && Object.keys(updatedFiles).length > 0) {
				try {
					await updateChatFiles({
						chatId: chatIdParam as Id<"chats">,
						files: updatedFiles,
					});
				} catch (err) {
					console.error("Failed to save files to R2:", err);
				}
			}

			// Update deployment info in Convex if authenticated
			if (chatIdParam && newDeploymentUrl) {
				try {
					await updateConvexDeployment({
						chatId: chatIdParam as Id<"chats">,
						deploymentUrl: newDeploymentUrl,
						sandboxId: newSandboxId || undefined,
					});
				} catch (err) {
					console.error("Failed to save deployment to Convex:", err);
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

				// Save to Convex if authenticated
				if (chatIdParam) {
					try {
						await addConvexMessage({
							chatId: chatIdParam as Id<"chats">,
							message: assistantMessage,
						});
					} catch (err) {
						console.error("Failed to save assistant message to Convex:", err);
					}
				} else {
					addLocalMessage({
						role: "assistant",
						content: assistantMessage.content,
						status: "complete",
					});
				}
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
				if (!chatIdParam) {
					addLocalMessage({
						role: "assistant",
						content: stoppedMessage.content,
						status: "complete",
					});
				}
				return;
			}

			console.error("Generation error:", error);

			// Add error message
			const errorMsg =
				error instanceof Error ? error.message : "Something went wrong";
			const assistantMessage: ChatMessage = {
				id: generateId(),
				role: "assistant",
				content: `❌ Oops! ${errorMsg}`,
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

	// Show loading spinner while checking auth
	if (isAuthLoading) {
		return (
			<div className="min-h-screen bg-midnight-950 flex items-center justify-center">
				<div className="w-12 h-12 border-4 border-aurora-cyan border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	// Show auth modal if not authenticated
	if (!isAuthenticated) {
		return (
			<div className="min-h-screen bg-midnight-950 flex items-center justify-center">
				{/* Background effects */}
				<div className="fixed inset-0 pointer-events-none">
					<div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-aurora-purple/10 rounded-full blur-[120px]" />
					<div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-aurora-cyan/10 rounded-full blur-[100px]" />
				</div>

				<div className="relative z-10 text-center">
					<h1 className="text-2xl font-display font-bold text-white mb-4">
						Sign in to continue
					</h1>
					<p className="text-midnight-400 mb-6">
						The builder requires an account to use.
					</p>
					<button
						onClick={() => setShowAuthModal(true)}
						className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-aurora-cyan to-aurora-purple text-white hover:scale-105 transition-all"
					>
						Sign in or Sign up
					</button>
				</div>

				<AuthModal
					isOpen={showAuthModal}
					onClose={() => {
						setShowAuthModal(false);
						// Redirect to home if they close the modal without signing in
						router.push("/");
					}}
					mode="signin"
				/>
			</div>
		);
	}

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
								<p className="text-midnight-500 text-xs">startupAI</p>
							</div>
						</div>
						<Link
							href="/projects"
							className="ml-4 px-3 py-1.5 rounded-lg text-midnight-400 hover:text-white hover:bg-midnight-800 transition-colors text-sm"
						>
							My Apps
						</Link>
					</div>

					{/* Status indicator only */}
					<div className="flex items-center gap-3">
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
										"Understanding your vision..."}
									{loadingStage === "designing" &&
										"Creating your app..."}
									{loadingStage === "recovering" && "Finishing up..."}
									{loadingStage === "deploying" &&
										"Making it live..."}
									{!loadingStage && "Working on it..."}
								</span>
							</div>
						)}
						{deploymentUrl && !isLoading && (
							<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
								<span className="relative flex h-2 w-2">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
									<span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
								</span>
								<span className="text-green-400 text-xs font-medium">Ready</span>
							</div>
						)}
					</div>
				</header>

				{/* Mobile Tab Bar */}
				{isMobile && (
					<div className="flex items-center bg-midnight-900 border-b border-midnight-700 px-2 py-1.5">
						<button
							onClick={() => setMobileTab("chat")}
							className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all focus:ring-2 focus:ring-aurora-cyan focus:ring-offset-2 focus:ring-offset-midnight-900 focus:outline-none ${
								mobileTab === "chat"
									? "bg-aurora-cyan text-midnight-950"
									: "text-midnight-400 hover:bg-midnight-800"
							}`}
						>
							<MessageSquare className="w-4 h-4" />
							Chat
						</button>
						<button
							onClick={() => setMobileTab("preview")}
							className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all focus:ring-2 focus:ring-aurora-cyan focus:ring-offset-2 focus:ring-offset-midnight-900 focus:outline-none ${
								mobileTab === "preview"
									? "bg-aurora-cyan text-midnight-950"
									: "text-midnight-400 hover:bg-midnight-800"
							}`}
						>
							<Eye className="w-4 h-4" />
							Preview
						</button>
						<button
							onClick={() => setMobileTab("domains")}
							className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all focus:ring-2 focus:ring-aurora-cyan focus:ring-offset-2 focus:ring-offset-midnight-900 focus:outline-none ${
								mobileTab === "domains"
									? "bg-aurora-cyan text-midnight-950"
									: "text-midnight-400 hover:bg-midnight-800"
							}`}
						>
							<Globe className="w-4 h-4" />
							Domains
						</button>
					</div>
				)}

				{/* Main content - split view on desktop, tabs on mobile */}
				<div className="flex-1 flex overflow-hidden">
					{isMobile ? (
						<>
							{/* Mobile Chat Tab */}
							{mobileTab === "chat" && (
								<div className="w-full flex-shrink-0 border-r border-midnight-800">
									<ChatInterface
										messages={messages}
										onSendMessage={handleSendMessage}
										isLoading={isLoading}
										loadingStage={loadingStage}
										streamingCode={streamingCode}
										onStopGeneration={handleStopGeneration}
									/>
								</div>
							)}

							{/* Mobile Preview Tab */}
							{mobileTab === "preview" && (
								<div className="w-full">
									<PreviewPanel
										deploymentUrl={deploymentUrl}
										files={files}
										isDeploying={isDeploying}
										projectName={projectState.name}
										ideaText={
											messages.find((m) => m.role === "user")?.content || ""
										}
										isStreaming={isLoading && !!streamingCode}
										isAppReady={
											!!deploymentUrl && Object.keys(files).length > 0
										}
									/>
								</div>
							)}

							{/* Mobile Domains Tab */}
							{mobileTab === "domains" && (
								<div className="w-full bg-midnight-950">
									<MobileDomainsPanel
										ideaText={
											messages.find((m) => m.role === "user")?.content || ""
										}
										className="h-full"
									/>
								</div>
							)}
						</>
					) : (
						<>
							{/* Desktop: Chat panel */}
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

							{/* Desktop: Preview panel */}
							<div className="flex-1">
								<PreviewPanel
									deploymentUrl={deploymentUrl}
									files={files}
									isDeploying={isDeploying}
									projectName={projectState.name}
									ideaText={
										messages.find((m) => m.role === "user")?.content || ""
									}
									isStreaming={isLoading && !!streamingCode}
									isAppReady={
										!!deploymentUrl && Object.keys(files).length > 0
									}
								/>
							</div>
						</>
					)}
				</div>
			</motion.div>
		</div>
	);
}

/**
 * Builder page with Suspense boundary for useSearchParams
 */
export default function BuilderPage() {
	return (
		<Suspense fallback={<BuilderLoading />}>
			<BuilderPageContent />
		</Suspense>
	);
}
