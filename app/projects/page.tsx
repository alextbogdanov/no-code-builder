"use client";

// ============================================================================
// ### IMPORTS ###
// ============================================================================
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";

// ============================================================================
// ### CONVEX ###
// ============================================================================
import { api } from "@/convex/_generated/api";

// ============================================================================
// ### CUSTOM ###
// ============================================================================
export default function ProjectsPage() {
	const router = useRouter();
	const chats = useQuery(api.queries.chats.listChats);

	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return "Just now";
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	};

	return (
		<div className="min-h-screen bg-midnight-950">
			{/* Background effects */}
			<div className="fixed inset-0 pointer-events-none">
				<div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-aurora-purple/10 rounded-full blur-[120px] animate-pulse-slow" />
				<div
					className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-aurora-cyan/10 rounded-full blur-[100px] animate-pulse-slow"
					style={{ animationDelay: "-2s" }}
				/>
				<div className="absolute inset-0 pattern-grid opacity-30" />
			</div>

			{/* Header */}
			<header className="relative z-10 py-6 px-8 border-b border-midnight-800">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<Link
						href="/"
						className="flex items-center gap-3 hover:opacity-80 transition-opacity"
					>
						<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aurora-cyan to-aurora-purple flex items-center justify-center">
							<Sparkles className="w-5 h-5 text-white" />
						</div>
						<span className="font-display font-bold text-xl text-white">
							Startup<span className="text-aurora-cyan">Lab</span>
						</span>
					</Link>
					<Link
						href="/"
						className="text-midnight-400 hover:text-white transition-colors"
					>
						Back to Home
					</Link>
				</div>
			</header>

			{/* Main content */}
			<main className="relative z-10 max-w-6xl mx-auto px-8 py-12">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="mb-8"
				>
					<h1 className="font-display font-bold text-4xl text-white mb-2">
						My Apps
					</h1>
					<p className="text-midnight-400 text-lg">
						All your projects and apps in one place
					</p>
				</motion.div>

				{chats === undefined ? (
					<div className="flex items-center justify-center py-20">
						<div className="w-12 h-12 border-4 border-aurora-cyan border-t-transparent rounded-full animate-spin" />
					</div>
				) : chats.length === 0 ? (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-center py-20"
					>
						<div className="w-20 h-20 rounded-full bg-midnight-800 flex items-center justify-center mx-auto mb-6">
							<Sparkles className="w-10 h-10 text-midnight-500" />
						</div>
						<h2 className="font-display font-semibold text-2xl text-white mb-2">
							No apps yet
						</h2>
						<p className="text-midnight-400 mb-6">
							Start building your first app to see it here
						</p>
						<Link
							href="/"
							className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-aurora-cyan to-aurora-purple text-white font-medium hover:scale-105 transition-all"
						>
							Get Started
							<ArrowRight className="w-5 h-5" />
						</Link>
					</motion.div>
				) : (
					<div className="grid gap-4">
						{chats.map((chat, index) => (
							<motion.div
								key={chat._id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05 }}
							>
								<Link
									href={`/builder?chatId=${chat._id}`}
									className="block p-6 rounded-2xl bg-midnight-900/50 border border-midnight-800 hover:border-midnight-700 transition-all group"
								>
									<div className="flex items-start justify-between gap-4">
										<div className="flex-1">
											<h3 className="font-display font-semibold text-xl text-white mb-2 group-hover:text-aurora-cyan transition-colors">
												{chat.name}
											</h3>
											{chat.lastMessage && (
												<p className="text-midnight-400 text-sm mb-4 line-clamp-2">
													{chat.lastMessage}
												</p>
											)}
											<div className="flex items-center gap-4 text-midnight-500 text-sm">
												<div className="flex items-center gap-1.5">
													<MessageSquare className="w-4 h-4" />
													<span>{chat.messageCount} messages</span>
												</div>
												<div className="flex items-center gap-1.5">
													<Calendar className="w-4 h-4" />
													<span>{formatDate(chat.updatedAt)}</span>
												</div>
												{chat.deploymentUrl && (
													<div className="flex items-center gap-1.5">
														<span className="relative flex h-2 w-2">
															<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
															<span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
														</span>
														<span className="text-green-400">Live</span>
													</div>
												)}
											</div>
										</div>
										<ArrowRight className="w-5 h-5 text-midnight-500 group-hover:text-aurora-cyan group-hover:translate-x-1 transition-all" />
									</div>
								</Link>
							</motion.div>
						))}
					</div>
				)}
			</main>
		</div>
	);
}

