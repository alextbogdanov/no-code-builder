"use client";

// ============================================================================
// ### IMPORTS ###
// ============================================================================
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
	Sparkles,
	ArrowRight,
	Zap,
	Globe,
	Code2,
	Wand2,
	LogIn,
	UserPlus,
	LogOut,
	User,
	ChevronDown,
	Check,
	Cpu,
} from "lucide-react";

// ============================================================================
// ### CONVEX ###
// ============================================================================
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// ============================================================================
// ### CONSTANTS ###
// ============================================================================
import {
	STARTER_PROMPTS,
	AVAILABLE_MODELS,
	DEFAULT_MODEL_ID,
} from "@/lib/constants";

// ============================================================================
// ### TYPES ###
// ============================================================================
import type { ModelId } from "@/types/project";

// ============================================================================
// ### STORES ###
// ============================================================================
import { saveProjectState, createProjectState } from "@/lib/storage";

// ============================================================================
// ### COMPONENTS ###
// ============================================================================
import { AuthModal } from "@/components/auth-modal";

// ============================================================================
// ### TYPES ###
// ============================================================================
const FEATURES = [
	{
		icon: Wand2,
		title: "AI-Powered",
		description: "Describe your vision and watch it come to life",
	},
	{
		icon: Zap,
		title: "Instant Deploy",
		description: "See your creation live in seconds",
	},
	{
		icon: Globe,
		title: "Shareable",
		description: "Get a real URL to share with anyone",
	},
	{
		icon: Code2,
		title: "Export Ready",
		description: "Download the code anytime",
	},
];

// ============================================================================
// ### CUSTOM ###
// ============================================================================
export default function LandingPage() {
	const [prompt, setPrompt] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedModel, setSelectedModel] = useState<ModelId>(DEFAULT_MODEL_ID);
	const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
	const [authModal, setAuthModal] = useState<{
		isOpen: boolean;
		mode: "signin" | "signup";
		forceOnboarding: boolean;
	}>({
		isOpen: false,
		mode: "signin",
		forceOnboarding: false,
	});
	const router = useRouter();

	// Get the selected model config
	const selectedModelConfig =
		AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

	// Auth hooks
	const { signOut } = useAuthActions();
	const currentUser = useQuery(api.queries.users.getCurrentUser);
	const createChat = useMutation(api.mutations.chats.createChat);

	// Auto-show onboarding modal if user is logged in but hasn't completed onboarding
	useEffect(() => {
		if (currentUser && !currentUser.onboardingComplete) {
			setAuthModal({ isOpen: true, mode: "signup", forceOnboarding: true });
		}
	}, [currentUser]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!prompt.trim() || isSubmitting) return;

		// Check if user is authenticated
		if (!currentUser) {
			// Show auth modal for sign up
			setAuthModal({ isOpen: true, mode: "signup", forceOnboarding: false });
			return;
		}

		// Check if onboarding is complete
		if (!currentUser.onboardingComplete) {
			setAuthModal({ isOpen: true, mode: "signup", forceOnboarding: true });
			return;
		}

		setIsSubmitting(true);

		try {
			// Create new project state with selected model
			const projectName =
				prompt.slice(0, 50).replace(/[^a-zA-Z0-9\s]/g, "") || "My Project";

			// Create chat in Convex
			const chatId = await createChat({
				name: projectName,
				initialMessage: prompt.trim(),
				selectedModel,
			});

			// Ensure chatId is a string for the URL
			const chatIdStr = String(chatId);

			// Create local project state with chatId for the builder page
			const projectState = createProjectState(
				projectName,
				prompt.trim(),
				selectedModel
			);
			// Add chatId to project state
			(projectState as { chatId?: string }).chatId = chatIdStr;
			saveProjectState(projectState);

			// Navigate to builder with chatId using window.location for reliable navigation
			window.location.href = `/builder?chatId=${chatIdStr}`;
		} catch (error) {
			console.error("Failed to create chat:", error);
			setIsSubmitting(false);
		}
	};

	const handleStarterPrompt = (starterPrompt: string) => {
		setPrompt(starterPrompt);
	};

	const openAuthModal = (mode: "signin" | "signup") => {
		setAuthModal({ isOpen: true, mode, forceOnboarding: false });
	};

	const closeAuthModal = () => {
		setAuthModal({ isOpen: false, mode: "signin", forceOnboarding: false });
	};

	const handleSignOut = async () => {
		await signOut();
	};

	const getUserDisplayName = () => {
		if (!currentUser) return null;
		return (
			currentUser.displayName ||
			currentUser.name ||
			currentUser.email?.split("@")[0] ||
			"User"
		);
	};

	return (
		<main className="min-h-screen bg-midnight-950 overflow-hidden">
			{/* Background effects */}
			<div className="fixed inset-0 pointer-events-none">
				{/* Gradient orbs */}
				<div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-aurora-purple/10 rounded-full blur-[120px] animate-pulse-slow" />
				<div
					className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-aurora-cyan/10 rounded-full blur-[100px] animate-pulse-slow"
					style={{ animationDelay: "-2s" }}
				/>

				{/* Grid pattern */}
				<div className="absolute inset-0 pattern-grid opacity-30" />
			</div>

			{/* Header */}
			<header className="relative z-10 py-6 px-8">
				<nav className="max-w-7xl mx-auto flex items-center justify-between">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center gap-3"
					>
						<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aurora-cyan to-aurora-purple flex items-center justify-center">
							<Sparkles className="w-5 h-5 text-white" />
						</div>
						<span className="font-display font-bold text-xl text-white">
							NoCode<span className="text-aurora-cyan">Builder</span>
						</span>
					</motion.div>

					{/* Auth buttons */}
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center gap-3"
					>
						{currentUser ? (
							<>
								{/* User info */}
								<div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-midnight-800/50 border border-midnight-700">
									<div className="w-8 h-8 rounded-full bg-gradient-to-br from-aurora-cyan to-aurora-purple flex items-center justify-center">
										{currentUser.image ? (
											<img
												src={currentUser.image}
												className="w-8 h-8 rounded-full object-cover"
											/>
										) : (
											<User className="w-4 h-4 text-white" />
										)}
									</div>
									<span className="text-white text-sm font-medium hidden sm:block">
										{getUserDisplayName()}
									</span>
								</div>

								{/* Sign out button */}
								<button
									onClick={handleSignOut}
									className="
                    flex items-center gap-2 px-4 py-2 rounded-xl
                    text-midnight-300 hover:text-white
                    bg-midnight-800/50 border border-midnight-700
                    hover:bg-midnight-700 hover:border-midnight-600
                    transition-all duration-200
                  "
								>
									<LogOut className="w-4 h-4" />
									<span className="hidden sm:block">Sign out</span>
								</button>
							</>
						) : (
							<>
								{/* Sign in button */}
								<button
									onClick={() => openAuthModal("signin")}
									className="
                    flex items-center gap-2 px-4 py-2 rounded-xl
                    text-midnight-300 hover:text-white
                    hover:bg-midnight-800/50
                    transition-all duration-200
                  "
								>
									<LogIn className="w-4 h-4" />
									<span>Sign in</span>
								</button>

								{/* Sign up button */}
								<button
									onClick={() => openAuthModal("signup")}
									className="
                    flex items-center gap-2 px-5 py-2 rounded-xl
                    bg-gradient-to-r from-aurora-cyan to-aurora-purple
                    text-white font-medium
                    hover:scale-105 hover:shadow-lg
                    transition-all duration-200
                  "
								>
									<UserPlus className="w-4 h-4" />
									<span>Sign up</span>
								</button>
							</>
						)}
					</motion.div>
				</nav>
			</header>

			{/* Hero section */}
			<section className="relative z-10 pt-16 pb-32 px-8">
				<div className="max-w-4xl mx-auto text-center">
					{/* Badge */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-aurora-cyan/10 border border-aurora-cyan/20 mb-8"
					>
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aurora-cyan opacity-75" />
							<span className="relative inline-flex rounded-full h-2 w-2 bg-aurora-cyan" />
						</span>
						<span className="text-aurora-cyan text-sm font-medium">
							Powered by AI
						</span>
					</motion.div>

					{/* Headline */}
					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className="font-display font-bold text-5xl md:text-7xl leading-tight mb-6"
					>
						Build anything
						<br />
						<span className="gradient-text">with words</span>
					</motion.h1>

					{/* Subheadline */}
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className="text-midnight-300 text-xl md:text-2xl max-w-2xl mx-auto mb-12 leading-relaxed"
					>
						Describe what you want to create and watch AI build it in real-time.
						No coding experience needed.
					</motion.p>

					{/* Model selector */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.35 }}
						className="max-w-2xl mx-auto mb-4"
					>
						<div className="relative">
							<button
								type="button"
								onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
								className="
									flex items-center gap-2 px-4 py-2 rounded-xl
									bg-midnight-900/50 border border-midnight-700
									text-midnight-200 hover:text-white
									hover:bg-midnight-800 hover:border-midnight-600
									transition-all duration-200
								"
							>
								<Cpu className="w-4 h-4 text-aurora-cyan" />
								<span className="text-sm font-medium">
									{selectedModelConfig.name}
								</span>
								<ChevronDown
									className={`w-4 h-4 transition-transform ${
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
									className="absolute top-full mt-2 left-0 w-72 bg-midnight-900 border border-midnight-700 rounded-xl shadow-xl z-50 overflow-hidden"
								>
									{AVAILABLE_MODELS.map((model) => (
										<button
											key={model.id}
											type="button"
											onClick={() => {
												setSelectedModel(model.id);
												setIsModelDropdownOpen(false);
											}}
											className={`
												w-full px-4 py-3 flex items-start gap-3 text-left
												hover:bg-midnight-800 transition-colors
												${selectedModel === model.id ? "bg-midnight-800/50" : ""}
											`}
										>
											<div
												className={`
												w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5
												${
													selectedModel === model.id
														? "border-aurora-cyan bg-aurora-cyan/20"
														: "border-midnight-600"
												}
											`}
											>
												{selectedModel === model.id && (
													<Check className="w-3 h-3 text-aurora-cyan" />
												)}
											</div>
											<div className="flex-1">
												<div className="flex items-center gap-2">
													<span className="text-white font-medium text-sm">
														{model.name}
													</span>
													<span className="text-midnight-500 text-xs capitalize">
														({model.provider})
													</span>
												</div>
												<p className="text-midnight-400 text-xs mt-0.5">
													{model.description}
												</p>
											</div>
										</button>
									))}
								</motion.div>
							)}
						</div>
					</motion.div>

					{/* Input form */}
					<motion.form
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}
						onSubmit={handleSubmit}
						className="relative max-w-2xl mx-auto mb-8"
					>
						<div className="relative group">
							{/* Glow effect */}
							<div className="absolute -inset-1 bg-gradient-to-r from-aurora-cyan via-aurora-purple to-aurora-pink rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />

							<div className="relative flex items-center bg-midnight-900 rounded-2xl border border-midnight-700 overflow-hidden">
								<input
									type="text"
									value={prompt}
									onChange={(e) => setPrompt(e.target.value)}
									placeholder="Describe what you want to build..."
									disabled={isSubmitting}
									className="
                    flex-1 px-6 py-5 bg-transparent text-white text-lg
                    placeholder-midnight-500 focus:outline-none
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
								/>
								<button
									type="submit"
									disabled={!prompt.trim() || isSubmitting}
									className="
                    m-2 px-6 py-3 rounded-xl font-display font-semibold
                    bg-gradient-to-r from-aurora-cyan to-aurora-purple
                    text-white transition-all duration-300
                    hover:scale-105 hover:shadow-lg
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    flex items-center gap-2
                  "
								>
									{isSubmitting ? (
										<>
											<motion.div
												animate={{ rotate: 360 }}
												transition={{
													duration: 1,
													repeat: Infinity,
													ease: "linear",
												}}
												className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
											/>
											Creating...
										</>
									) : (
										<>
											Start Building
											<ArrowRight className="w-5 h-5" />
										</>
									)}
								</button>
							</div>
						</div>
					</motion.form>

					{/* Starter prompts */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.5 }}
						className="flex flex-wrap justify-center gap-3"
					>
						<span className="text-midnight-500 text-sm">Try:</span>
						{STARTER_PROMPTS.slice(0, 3).map((starterPrompt, index) => (
							<button
								key={index}
								onClick={() => handleStarterPrompt(starterPrompt)}
								className="
                  px-4 py-2 rounded-full text-sm
                  bg-midnight-800/50 text-midnight-300 border border-midnight-700
                  hover:bg-midnight-700 hover:text-white hover:border-midnight-600
                  transition-all duration-200
                "
							>
								{starterPrompt}
							</button>
						))}
					</motion.div>
				</div>
			</section>

			{/* Features section */}
			<section className="relative z-10 py-20 px-8">
				<div className="max-w-5xl mx-auto">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
						{FEATURES.map((feature, index) => (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.6 + index * 0.1 }}
								className="
                  p-6 rounded-2xl bg-midnight-900/50 border border-midnight-800
                  hover:border-midnight-700 transition-all duration-300
                  group
                "
							>
								<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-aurora-cyan/20 to-aurora-purple/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
									<feature.icon className="w-6 h-6 text-aurora-cyan" />
								</div>
								<h3 className="font-display font-semibold text-white mb-2">
									{feature.title}
								</h3>
								<p className="text-midnight-400 text-sm leading-relaxed">
									{feature.description}
								</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* How it works */}
			<section className="relative z-10 py-20 px-8">
				<div className="max-w-4xl mx-auto text-center">
					<motion.h2
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="font-display font-bold text-3xl md:text-4xl text-white mb-16"
					>
						How it works
					</motion.h2>

					<div className="grid md:grid-cols-3 gap-8">
						{[
							{
								step: "01",
								title: "Describe",
								text: "Tell us what you want to build in plain English",
							},
							{
								step: "02",
								title: "Generate",
								text: "AI creates your project with beautiful code",
							},
							{
								step: "03",
								title: "Deploy",
								text: "Get a live URL instantly, iterate and improve",
							},
						].map((item, index) => (
							<motion.div
								key={item.step}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.1 }}
								className="relative"
							>
								{/* Connector line */}
								{index < 2 && (
									<div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-midnight-700 to-transparent" />
								)}

								<div className="relative z-10">
									<span className="font-display font-bold text-5xl gradient-text opacity-50">
										{item.step}
									</span>
									<h3 className="font-display font-semibold text-xl text-white mt-4 mb-2">
										{item.title}
									</h3>
									<p className="text-midnight-400">{item.text}</p>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="relative z-10 py-8 px-8 border-t border-midnight-800">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aurora-cyan to-aurora-purple flex items-center justify-center">
							<Sparkles className="w-4 h-4 text-white" />
						</div>
						<span className="font-display font-bold text-white">
							NoCode<span className="text-aurora-cyan">Builder</span>
						</span>
					</div>
					<p className="text-midnight-500 text-sm">
						Built with AI, for everyone
					</p>
				</div>
			</footer>

			{/* Auth Modal */}
			<AuthModal
				isOpen={authModal.isOpen}
				onClose={closeAuthModal}
				mode={authModal.mode}
				forceOnboarding={authModal.forceOnboarding}
			/>
		</main>
	);
}
