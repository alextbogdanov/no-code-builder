"use client";

// ============================================================================
// ### IMPORTS ###
// ============================================================================

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import {
	Send,
	Sparkles,
	User,
	Bot,
	Wand2,
	Rocket,
	RefreshCw,
	Code2,
	ChevronDown,
	ChevronUp,
	Square,
} from "lucide-react";

// ============================================================================
// ### TYPES ###
// ============================================================================

import type { ChatMessage } from "@/types/project";

interface ChatInterfaceProps {
	messages: ChatMessage[];
	onSendMessage: (message: string) => void;
	isLoading: boolean;
	loadingStage: "analyzing" | "designing" | "recovering" | "deploying" | null;
	streamingCode?: string;
	onStopGeneration?: () => void;
}

// ============================================================================
// ### CONSTANTS ###
// ============================================================================

const LOADING_STAGES = {
	analyzing: {
		icon: Wand2,
		label: "Crafting a beautiful design",
		messages: [
			"Understanding your vision...",
			"Planning the perfect solution...",
			"Preparing to build...",
		],
	},
	designing: {
		icon: Code2,
		label: "Building your startup from scratch",
		messages: [
			"Writing the code...",
			"Creating components...",
			"Assembling your app...",
		],
	},
	recovering: {
		icon: RefreshCw,
		label: "Recovering files",
		messages: [
			"Regenerating truncated file...",
			"Completing the code...",
			"Almost there...",
		],
	},
	deploying: {
		icon: Rocket,
		label: "Deploying your website to the web",
		messages: [
			"Packaging your creation...",
			"Spinning up servers...",
			"Almost ready...",
		],
	},
};

// ============================================================================
// ### CUSTOM ###
// ============================================================================

function LoadingIndicator({
	stage,
}: {
	stage: "analyzing" | "designing" | "recovering" | "deploying";
}) {
	const [messageIndex, setMessageIndex] = useState(0);
	const stageConfig = LOADING_STAGES[stage];
	const Icon = stageConfig.icon;

	useEffect(() => {
		const interval = setInterval(() => {
			setMessageIndex((prev) => (prev + 1) % stageConfig.messages.length);
		}, 2000);
		return () => clearInterval(interval);
	}, [stage, stageConfig.messages.length]);

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			className="flex gap-4"
		>
			{/* Animated avatar */}
			<div className="flex-shrink-0 relative">
				<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aurora-cyan to-aurora-purple flex items-center justify-center">
					<Icon className="w-5 h-5 text-white" />
				</div>
				{/* Pulsing ring */}
				<div className="absolute inset-0 rounded-xl border-2 border-aurora-cyan/50 animate-ping" />
			</div>

			{/* Loading content */}
			<div className="flex-1 p-5 rounded-2xl bg-gradient-to-br from-midnight-900 to-midnight-900/50 border border-midnight-700">
				{/* Stage label */}
				<div className="flex items-center gap-2 mb-3">
					<motion.div
						animate={{ rotate: 360 }}
						transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
						className="w-4 h-4 border-2 border-aurora-cyan border-t-transparent rounded-full"
					/>
					<span className="text-aurora-cyan font-display font-medium text-sm">
						{stageConfig.label}
					</span>
				</div>

				{/* Animated message */}
				<AnimatePresence mode="wait">
					<motion.p
						key={messageIndex}
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -5 }}
						className="text-midnight-300 text-sm"
					>
						{stageConfig.messages[messageIndex]}
					</motion.p>
				</AnimatePresence>

				{/* Progress dots */}
				<div className="flex gap-1 mt-4">
					{[0, 1, 2, 3, 4].map((i) => (
						<motion.div
							key={i}
							animate={{
								scale: [1, 1.2, 1],
								opacity: [0.3, 1, 0.3],
							}}
							transition={{
								duration: 1,
								repeat: Infinity,
								delay: i * 0.15,
							}}
							className="w-2 h-2 rounded-full bg-aurora-cyan"
						/>
					))}
				</div>
			</div>
		</motion.div>
	);
}

function LiveCodeStream({ code }: { code: string }) {
	const codeContainerRef = useRef<HTMLPreElement>(null);
	const [isExpanded, setIsExpanded] = useState(true);

	// Auto-scroll to bottom as code streams in
	useEffect(() => {
		if (codeContainerRef.current && isExpanded) {
			codeContainerRef.current.scrollTop =
				codeContainerRef.current.scrollHeight;
		}
	}, [code, isExpanded]);

	// Calculate stats
	const lineCount = code.split("\n").length;
	const charCount = code.length;

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			className="flex gap-4"
		>
			{/* Code icon avatar */}
			<div className="flex-shrink-0 relative">
				<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-aurora-cyan flex items-center justify-center">
					<Code2 className="w-5 h-5 text-white" />
				</div>
				{/* Pulsing ring */}
				<motion.div
					className="absolute inset-0 rounded-xl border-2 border-emerald-500/50"
					animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
					transition={{ duration: 1.5, repeat: Infinity }}
				/>
			</div>

			{/* Code stream content */}
			<div className="flex-1 rounded-2xl bg-gradient-to-br from-midnight-950 to-midnight-900 border border-emerald-500/30 overflow-hidden">
				{/* Header */}
				<div
					className="flex items-center justify-between px-4 py-3 bg-midnight-900/50 border-b border-midnight-700 cursor-pointer hover:bg-midnight-800/50 transition-colors"
					onClick={() => setIsExpanded(!isExpanded)}
				>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2">
							<motion.div
								animate={{ opacity: [1, 0.5, 1] }}
								transition={{ duration: 1, repeat: Infinity }}
								className="w-2 h-2 rounded-full bg-emerald-400"
							/>
							<span className="text-emerald-400 font-display font-medium text-sm">
								Live Code Stream
							</span>
						</div>
						<span className="text-midnight-500 text-xs">
							{lineCount} lines · {charCount.toLocaleString()} chars
						</span>
					</div>
					<button className="p-1 rounded text-midnight-400 hover:text-white transition-colors">
						{isExpanded ? (
							<ChevronUp className="w-4 h-4" />
						) : (
							<ChevronDown className="w-4 h-4" />
						)}
					</button>
				</div>

				{/* Code content */}
				<AnimatePresence>
					{isExpanded && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.2 }}
						>
							<pre
								ref={codeContainerRef}
								className="p-4 max-h-64 overflow-y-auto text-xs font-mono text-midnight-200 whitespace-pre-wrap break-all scrollbar-thin scrollbar-thumb-midnight-700 scrollbar-track-transparent"
							>
								{code}
								<motion.span
									animate={{ opacity: [1, 0, 1] }}
									transition={{ duration: 0.8, repeat: Infinity }}
									className="inline-block w-2 h-4 bg-emerald-400 ml-0.5 align-middle"
								/>
							</pre>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</motion.div>
	);
}

export function ChatInterface({
	messages,
	onSendMessage,
	isLoading,
	loadingStage,
	streamingCode = "",
	onStopGeneration,
}: ChatInterfaceProps) {
	const [input, setInput] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	// Auto-scroll to bottom when messages change or code streams
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isLoading, streamingCode]);

	// Auto-resize textarea
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.style.height = "auto";
			inputRef.current.style.height = `${Math.min(
				inputRef.current.scrollHeight,
				150
			)}px`;
		}
	}, [input]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || isLoading) return;

		onSendMessage(input.trim());
		setInput("");
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	return (
		<div className="flex flex-col h-full bg-midnight-950">
			{/* Header */}
			<div className="flex-shrink-0 px-6 py-4 border-b border-midnight-800">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aurora-cyan to-aurora-purple flex items-center justify-center">
						<Sparkles className="w-5 h-5 text-white" />
					</div>
					<div>
						<h2 className="font-display text-white text-lg">AI Builder</h2>
						<p className="text-midnight-400 text-sm">Describe your changes</p>
					</div>
				</div>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
				<AnimatePresence mode="popLayout">
					{messages.map((message) => (
						<motion.div
							key={message.id}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className={`flex gap-4 ${
								message.role === "user" ? "flex-row-reverse" : ""
							}`}
						>
							{/* Avatar */}
							<div
								className={`
                  flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                  ${
										message.role === "user"
											? "bg-aurora-purple/20"
											: "bg-gradient-to-br from-aurora-cyan/20 to-aurora-purple/20"
									}
                `}
							>
								{message.role === "user" ? (
									<User className="w-5 h-5 text-aurora-purple" />
								) : (
									<Bot className="w-5 h-5 text-aurora-cyan" />
								)}
							</div>

							{/* Message content */}
							<div
								className={`
                  flex-1 max-w-[85%] p-4 rounded-2xl
                  ${
										message.role === "user"
											? "bg-aurora-purple/10 border border-aurora-purple/20"
											: "bg-midnight-900 border border-midnight-700"
									}
                `}
							>
								<p
									className={`
                    text-sm leading-relaxed whitespace-pre-wrap
                    ${
											message.role === "user"
												? "text-white"
												: "text-midnight-200"
										}
                  `}
								>
									{message.content}
								</p>
								<span className="text-midnight-500 text-xs mt-2 block">
									{new Date(message.timestamp).toLocaleTimeString()}
								</span>
							</div>
						</motion.div>
					))}

					{/* Live code stream */}
					{isLoading && streamingCode && (
						<LiveCodeStream code={streamingCode} />
					)}

					{/* Loading indicator */}
					{isLoading && loadingStage && (
						<LoadingIndicator stage={loadingStage} />
					)}
				</AnimatePresence>
				<div ref={messagesEndRef} />
			</div>

			{/* Input area */}
			<div className="flex-shrink-0 p-4 border-t border-midnight-800">
				{isLoading && streamingCode && onStopGeneration ? (
					<div className="flex flex-col gap-2">
						<button
							onClick={onStopGeneration}
							className="
                w-full py-3 rounded-xl font-display font-medium
                bg-red-500/10 border border-red-500/30 text-red-400
                hover:bg-red-500/20 hover:border-red-500/50
                transition-all duration-200
                flex items-center justify-center gap-2
              "
						>
							<Square className="w-4 h-4 fill-current" />
							Stop Generating
						</button>
						<p className="text-midnight-500 text-xs text-center">
							Click to stop the current generation
						</p>
					</div>
				) : (
					<>
						<form onSubmit={handleSubmit} className="relative">
							<textarea
								ref={inputRef}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Describe what you want to build or change..."
								disabled={isLoading}
								rows={1}
								className="
                  w-full px-4 py-3 pr-14 bg-midnight-900 border border-midnight-700
                  rounded-xl text-white placeholder-midnight-500
                  focus:outline-none focus:border-aurora-cyan/50 focus:ring-1 focus:ring-aurora-cyan/20
                  resize-none transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
							/>
							<button
								type="submit"
								disabled={!input.trim() || isLoading}
								className="
                  absolute right-2 bottom-2 p-2 rounded-lg
                  bg-gradient-to-r from-aurora-cyan to-aurora-purple
                  text-white transition-all duration-200
                  hover:opacity-90 hover:scale-105
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
                "
							>
								<Send className="w-5 h-5" />
							</button>
						</form>
						<p className="text-midnight-500 text-xs mt-2 text-center">
							Press Enter to send, Shift+Enter for new line
						</p>
					</>
				)}
			</div>
		</div>
	);
}
