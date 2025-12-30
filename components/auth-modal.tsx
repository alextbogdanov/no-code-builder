"use client";

// ============================================================================
// ### IMPORTS ###
// ============================================================================
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	X,
	Mail,
	Github,
	Loader2,
	ArrowLeft,
	User,
	CheckCircle2,
} from "lucide-react";

// ============================================================================
// ### CONVEX ###
// ============================================================================
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// ============================================================================
// ### TYPES ###
// ============================================================================
type AuthStep = "initial" | "email" | "otp" | "name";

interface AuthModalProps {
	isOpen: boolean;
	onClose: () => void;
	mode: "signin" | "signup";
	/** When true, forces the modal to show the name step without option to close (for onboarding) */
	forceOnboarding?: boolean;
}

// ============================================================================
// ### CONSTANTS ###
// ============================================================================
const BACKDROP_VARIANTS = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
};

const MODAL_VARIANTS = {
	hidden: { opacity: 0, scale: 0.95, y: 20 },
	visible: { opacity: 1, scale: 1, y: 0 },
};

// ============================================================================
// ### CUSTOM ###
// ============================================================================
export function AuthModal({
	isOpen,
	onClose,
	mode,
	forceOnboarding = false,
}: AuthModalProps) {
	const { signIn } = useAuthActions();
	const currentUser = useQuery(api.queries.users.getCurrentUser);
	const updateUserName = useMutation(api.mutations.users.updateUserName);

	const [step, setStep] = useState<AuthStep>("initial");
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [name, setName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	// Determine if we're in a state where the modal can't be closed
	const isOnboardingStep = step === "name";
	const canClose = !isOnboardingStep && !forceOnboarding;

	// Reset state when modal closes
	useEffect(() => {
		if (!isOpen && !forceOnboarding) {
			setStep("initial");
			setEmail("");
			setOtp("");
			setName("");
			setError("");
			setIsLoading(false);
		}
	}, [isOpen, forceOnboarding]);

	// If forceOnboarding is true, go directly to name step
	useEffect(() => {
		if (forceOnboarding && isOpen) {
			setStep("name");
		}
	}, [forceOnboarding, isOpen]);

	// Check if user needs to set their name after OAuth login
	useEffect(() => {
		if (
			currentUser &&
			!currentUser.displayName &&
			!currentUser.name &&
			!currentUser.onboardingComplete
		) {
			setStep("name");
		} else if (currentUser && currentUser.onboardingComplete) {
			onClose();
		}
	}, [currentUser, onClose]);

	// Safe close handler that respects canClose
	const handleClose = () => {
		if (canClose) {
			onClose();
		}
	};

	const handleOAuthSignIn = async (provider: "github" | "google") => {
		setIsLoading(true);
		setError("");
		try {
			await signIn(provider, { redirectTo: window.location.href });
		} catch (err) {
			setError("Failed to sign in. Please try again.");
			setIsLoading(false);
		}
	};

	const handleEmailSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim()) return;

		setIsLoading(true);
		setError("");

		try {
			await signIn("resend-otp", { email });
			setStep("otp");
		} catch (err) {
			setError("Failed to send verification code. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleOtpSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!otp.trim() || otp.length !== 6) return;

		setIsLoading(true);
		setError("");

		try {
			await signIn("resend-otp", { email, code: otp });
			// Check if user needs to set their name
			setStep("name");
		} catch (err) {
			setError("Invalid verification code. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleNameSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		setIsLoading(true);
		setError("");

		try {
			await updateUserName({ displayName: name.trim() });
			onClose();
		} catch (err) {
			setError("Failed to save your name. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const renderContent = () => {
		switch (step) {
			case "initial":
				return (
					<motion.div
						key="initial"
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						className="space-y-6"
					>
						<div className="text-center mb-8">
							<h2 className="font-display font-bold text-2xl text-white mb-2">
								{mode === "signin" ? "Welcome back" : "Create your account"}
							</h2>
							<p className="text-midnight-400">
								{mode === "signin"
									? "Sign in to continue building"
									: "Start building amazing things with AI"}
							</p>
						</div>

						{/* OAuth Buttons */}
						<div className="space-y-3">
							<button
								onClick={() => handleOAuthSignIn("google")}
								disabled={isLoading}
								className="
                  w-full flex items-center justify-center gap-3
                  px-6 py-4 rounded-xl
                  bg-white text-gray-900 font-medium
                  hover:bg-gray-100 transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
							>
								<GoogleIcon className="w-5 h-5" />
								Continue with Google
							</button>

							<button
								onClick={() => handleOAuthSignIn("github")}
								disabled={isLoading}
								className="
                  w-full flex items-center justify-center gap-3
                  px-6 py-4 rounded-xl
                  bg-[#24292e] text-white font-medium
                  hover:bg-[#2f363d] transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
							>
								<Github className="w-5 h-5" />
								Continue with GitHub
							</button>
						</div>

						{/* Divider */}
						<div className="flex items-center gap-4">
							<div className="flex-1 h-px bg-midnight-700" />
							<span className="text-midnight-500 text-sm">or</span>
							<div className="flex-1 h-px bg-midnight-700" />
						</div>

						{/* Email Button */}
						<button
							onClick={() => setStep("email")}
							disabled={isLoading}
							className="
                w-full flex items-center justify-center gap-3
                px-6 py-4 rounded-xl
                bg-midnight-800 text-white font-medium
                border border-midnight-700
                hover:bg-midnight-700 hover:border-midnight-600
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              "
						>
							<Mail className="w-5 h-5" />
							Continue with Email
						</button>

						{error && (
							<p className="text-red-400 text-sm text-center">{error}</p>
						)}
					</motion.div>
				);

			case "email":
				return (
					<motion.div
						key="email"
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						className="space-y-6"
					>
						<button
							onClick={() => setStep("initial")}
							className="flex items-center gap-2 text-midnight-400 hover:text-white transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
							Back
						</button>

						<div className="text-center mb-8">
							<h2 className="font-display font-bold text-2xl text-white mb-2">
								Enter your email
							</h2>
							<p className="text-midnight-400">
								We&apos;ll send you a verification code
							</p>
						</div>

						<form onSubmit={handleEmailSubmit} className="space-y-4">
							<input
								type="email"
								placeholder="you@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="
                  w-full px-6 py-4 rounded-xl
                  bg-midnight-900 border border-midnight-700
                  text-white placeholder-midnight-500
                  focus:outline-none focus:border-aurora-cyan/50 focus:ring-2 focus:ring-aurora-cyan/20
                  transition-all duration-200
                "
								autoFocus
							/>

							<button
								type="submit"
								disabled={!email.trim() || isLoading}
								className="
                  w-full px-6 py-4 rounded-xl font-display font-semibold
                  bg-gradient-to-r from-aurora-cyan to-aurora-purple
                  text-white transition-all duration-200
                  hover:scale-[1.02] hover:shadow-lg
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  flex items-center justify-center gap-2
                "
							>
								{isLoading ? (
									<>
										<Loader2 className="w-5 h-5 animate-spin" />
										Sending...
									</>
								) : (
									"Send verification code"
								)}
							</button>
						</form>

						{error && (
							<p className="text-red-400 text-sm text-center">{error}</p>
						)}
					</motion.div>
				);

			case "otp":
				return (
					<motion.div
						key="otp"
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						className="space-y-6"
					>
						<button
							onClick={() => setStep("email")}
							className="flex items-center gap-2 text-midnight-400 hover:text-white transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
							Back
						</button>

						<div className="text-center mb-8">
							<h2 className="font-display font-bold text-2xl text-white mb-2">
								Check your email
							</h2>
							<p className="text-midnight-400">
								We sent a 6-digit code to{" "}
								<span className="text-aurora-cyan">{email}</span>
							</p>
						</div>

						<form onSubmit={handleOtpSubmit} className="space-y-4">
							<div className="flex justify-center">
								<input
									type="text"
									placeholder="000000"
									value={otp}
									onChange={(e) => {
										const value = e.target.value.replace(/\D/g, "").slice(0, 6);
										setOtp(value);
									}}
									className="
                    w-48 px-6 py-4 rounded-xl text-center
                    bg-midnight-900 border border-midnight-700
                    text-white text-2xl font-mono tracking-[0.5em]
                    placeholder-midnight-600
                    focus:outline-none focus:border-aurora-cyan/50 focus:ring-2 focus:ring-aurora-cyan/20
                    transition-all duration-200
                  "
									autoFocus
									maxLength={6}
								/>
							</div>

							<button
								type="submit"
								disabled={otp.length !== 6 || isLoading}
								className="
                  w-full px-6 py-4 rounded-xl font-display font-semibold
                  bg-gradient-to-r from-aurora-cyan to-aurora-purple
                  text-white transition-all duration-200
                  hover:scale-[1.02] hover:shadow-lg
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  flex items-center justify-center gap-2
                "
							>
								{isLoading ? (
									<>
										<Loader2 className="w-5 h-5 animate-spin" />
										Verifying...
									</>
								) : (
									<>
										<CheckCircle2 className="w-5 h-5" />
										Verify code
									</>
								)}
							</button>
						</form>

						<p className="text-center text-midnight-500 text-sm">
							Didn&apos;t receive the code?{" "}
							<button
								onClick={() => {
									setOtp("");
									handleEmailSubmit({
										preventDefault: () => {},
									} as React.FormEvent);
								}}
								className="text-aurora-cyan hover:underline"
							>
								Resend
							</button>
						</p>

						{error && (
							<p className="text-red-400 text-sm text-center">{error}</p>
						)}
					</motion.div>
				);

			case "name":
				return (
					<motion.div
						key="name"
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						className="space-y-6"
					>
						<div className="text-center mb-8">
							<div className="w-16 h-16 rounded-full bg-gradient-to-br from-aurora-cyan to-aurora-purple flex items-center justify-center mx-auto mb-4">
								<User className="w-8 h-8 text-white" />
							</div>
							<h2 className="font-display font-bold text-2xl text-white mb-2">
								What should we call you?
							</h2>
							<p className="text-midnight-400">
								This helps personalize your experience
							</p>
						</div>

						<form onSubmit={handleNameSubmit} className="space-y-4">
							<input
								type="text"
								placeholder="Your name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="
                  w-full px-6 py-4 rounded-xl
                  bg-midnight-900 border border-midnight-700
                  text-white placeholder-midnight-500
                  focus:outline-none focus:border-aurora-cyan/50 focus:ring-2 focus:ring-aurora-cyan/20
                  transition-all duration-200
                "
								autoFocus
							/>

							<button
								type="submit"
								disabled={!name.trim() || isLoading}
								className="
                  w-full px-6 py-4 rounded-xl font-display font-semibold
                  bg-gradient-to-r from-aurora-cyan to-aurora-purple
                  text-white transition-all duration-200
                  hover:scale-[1.02] hover:shadow-lg
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  flex items-center justify-center gap-2
                "
							>
								{isLoading ? (
									<>
										<Loader2 className="w-5 h-5 animate-spin" />
										Saving...
									</>
								) : (
									"Continue"
								)}
							</button>
						</form>

						{error && (
							<p className="text-red-400 text-sm text-center">{error}</p>
						)}
					</motion.div>
				);
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className="fixed inset-0 z-50 flex items-center justify-center p-4"
					initial="hidden"
					animate="visible"
					exit="hidden"
				>
					{/* Backdrop */}
					<motion.div
						className="absolute inset-0 bg-black/60 backdrop-blur-sm"
						variants={BACKDROP_VARIANTS}
						onClick={handleClose}
					/>

					{/* Modal */}
					<motion.div
						className="relative w-full max-w-md bg-midnight-900 rounded-2xl border border-midnight-700 shadow-2xl overflow-hidden"
						variants={MODAL_VARIANTS}
						transition={{ type: "spring", damping: 25, stiffness: 300 }}
					>
						{/* Background glow */}
						<div className="absolute inset-0 pointer-events-none">
							<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-aurora-purple/10 rounded-full blur-[80px]" />
						</div>

						{/* Close button - hidden when modal can't be closed */}
						{canClose && (
							<button
								onClick={handleClose}
								className="absolute top-4 right-4 p-2 rounded-lg text-midnight-400 hover:text-white hover:bg-midnight-800 transition-all z-10"
							>
								<X className="w-5 h-5" />
							</button>
						)}

						{/* Content */}
						<div className="relative p-8">
							<AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

// ============================================================================
// ### COMPONENTS ###
// ============================================================================
function GoogleIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24">
			<path
				fill="#4285F4"
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
			/>
			<path
				fill="#34A853"
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
			/>
			<path
				fill="#FBBC05"
				d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
			/>
			<path
				fill="#EA4335"
				d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
			/>
		</svg>
	);
}
