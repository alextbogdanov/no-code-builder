"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Sparkles,
  ArrowLeft,
  Edit2,
} from "lucide-react";

// Convex auth
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DEFAULT_MODEL_ID } from "@/lib/constants";

// FOMO components
import {
  useDelayedViewCount,
  useSimilarIdeaCount,
  FomoToast,
  PublicWarningBanner,
  StickyCTABar,
} from "@/components/startup/fomo-elements";

// Auth modal
import { AuthModal } from "@/components/auth-modal";

// =============================================================================
// Markdown Rendering
// =============================================================================

function renderInlineFormatting(text: string): React.ReactNode {
  // Handle _italic_ formatting
  const parts = text.split(/(_[^_]+_)/g);
  return parts.map((part, i) => {
    if (part.startsWith("_") && part.endsWith("_")) {
      return (
        <em key={i} className="text-aurora-cyan font-medium">
          {part.slice(1, -1)}
        </em>
      );
    }
    // Handle **bold** formatting
    if (part.includes("**")) {
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bp, j) => {
        if (bp.startsWith("**") && bp.endsWith("**")) {
          return (
            <strong key={`${i}-${j}`} className="font-semibold">
              {bp.slice(2, -2)}
            </strong>
          );
        }
        return bp;
      });
    }
    return part;
  });
}

function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    // H1
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={index} className="text-2xl font-bold text-white mt-4 mb-2">
          {line.substring(2)}
        </h1>
      );
    }
    // H2
    else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={index} className="text-xl font-semibold text-white/90 mt-3 mb-2">
          {line.substring(3)}
        </h2>
      );
    }
    // H3
    else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={index} className="text-lg font-medium text-white/80 mt-3 mb-1.5">
          {line.substring(4)}
        </h3>
      );
    }
    // Bullet list
    else if (line.startsWith("- ")) {
      elements.push(
        <li key={index} className="ml-4 text-midnight-200 my-0.5 list-disc">
          {renderInlineFormatting(line.substring(2))}
        </li>
      );
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^\d+\.\s(.*)$/);
      if (match) {
        elements.push(
          <li key={index} className="ml-4 text-midnight-200 my-0.5 list-decimal">
            {renderInlineFormatting(match[1])}
          </li>
        );
      }
    }
    // Regular paragraph
    else if (line.trim()) {
      elements.push(
        <p key={index} className="text-midnight-200 my-1.5 leading-relaxed">
          {renderInlineFormatting(line)}
        </p>
      );
    }
  });

  return elements;
}

// =============================================================================
// Evaluate Page Content
// =============================================================================

function EvaluatePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentUser = useQuery(api.queries.users.getCurrentUser);
  const isAuthenticated = !!currentUser;
  const createChat = useMutation(api.mutations.chats.createChat);

  const [loading, setLoading] = useState(false);
  const [streamData, setStreamData] = useState<string>("");
  const [inputValue, setInputValue] = useState("");
  const [evaluationData, setEvaluationData] = useState<{
    slug: string;
    shortTitle: string | null;
    category: string | null;
    domains: string[];
    score: number | null;
  } | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingApp, setIsCreatingApp] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFomoToast, setShowFomoToast] = useState(false);
  const fomoToastShownRef = useRef(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Track when streaming actually completes
  const streamingComplete = !loading && streamData.length > 0;

  // FOMO hooks
  const viewCount = useDelayedViewCount(streamingComplete);
  const similarIdeaCount = useSimilarIdeaCount(streamingComplete);

  // FOMO: Show toast when streaming completes
  useEffect(() => {
    if (streamingComplete && !fomoToastShownRef.current) {
      fomoToastShownRef.current = true;
      const timer = setTimeout(() => {
        setShowFomoToast(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [streamingComplete]);

  // FOMO: Handle protect action
  const handleProtectIdea = useCallback(() => {
    setShowFomoToast(false);
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      // TODO: Implement upgrade flow
      alert("Subscription feature coming soon!");
    }
  }, [isAuthenticated]);

  // Initialize from URL
  useEffect(() => {
    const idea = searchParams.get("idea");
    if (idea && !hasStarted) {
      setInputValue(idea);
      handleEvaluate(idea);
      setHasStarted(true);
    }
  }, [searchParams, hasStarted]);

  const handleEvaluate = async (idea: string) => {
    setLoading(true);
    setStreamData("");
    setEvaluationData(null);
    fomoToastShownRef.current = false;

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/evaluate-idea", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idea }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Evaluation failed");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data) {
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "chunk") {
                  setStreamData((prev) => prev + parsed.content);
                } else if (parsed.type === "done" && parsed.evaluation) {
                  setEvaluationData(parsed.evaluation);
                } else if (parsed.type === "error") {
                  throw new Error(parsed.error);
                }
              } catch {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Error:", error);
      setStreamData("An error occurred while evaluating your idea. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApp = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setIsCreatingApp(true);

    try {
      // Create a new chat/project for this idea
      const projectName = evaluationData?.shortTitle || inputValue.substring(0, 60) || "My Startup";
      
      // Combine idea and market analysis into initial message
      const initialMessage = `Idea: ${inputValue}\n\nMarket Analysis:\n${streamData}`;

      const chatId = await createChat({
        name: projectName,
        initialMessage: initialMessage,
        selectedModel: DEFAULT_MODEL_ID,
      });

      // Navigate to builder with the new chatId
      router.push(`/builder?chatId=${chatId}`);
    } catch (error) {
      console.error("Failed to create chat:", error);
      setIsCreatingApp(false);
      // Show error to user
      alert("Failed to create project. Please try again.");
    }
  };

  // Redirect if no idea
  useEffect(() => {
    const idea = searchParams.get("idea");
    if (!idea) {
      router.push("/");
    }
  }, [searchParams, router]);

  return (
    <>
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode="signup"
      />

      {/* FOMO Toast */}
      <FomoToast
        isVisible={showFomoToast}
        onAction={handleProtectIdea}
        onDismiss={() => setShowFomoToast(false)}
        isAuthenticated={isAuthenticated}
      />

      <div className="min-h-screen bg-midnight-950">
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-aurora-purple/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-aurora-cyan/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0 pattern-grid opacity-30" />
        </div>

        {/* Header */}
        <header className="relative z-10 border-b border-midnight-800 bg-midnight-950/80 backdrop-blur-sm sticky top-0">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-midnight-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </Link>
          </div>
        </header>

        <main className="relative z-10 max-w-5xl w-full mx-auto px-4 py-8">
          {/* Idea Display/Edit Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {!isEditing ? (
              <div className="bg-midnight-900 p-4 rounded-xl border border-midnight-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-aurora-cyan/20 p-2 rounded-lg">
                      <Sparkles className="w-5 h-5 text-aurora-cyan" />
                    </div>
                    <div>
                      <p className="text-xs text-midnight-500 font-medium uppercase tracking-wide">
                        Your Idea
                      </p>
                      <h1 className="text-lg font-semibold text-white">
                        {inputValue}
                      </h1>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-midnight-400 hover:text-aurora-cyan font-medium px-3 py-1.5 hover:bg-midnight-800 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-midnight-900 p-6 rounded-xl border border-aurora-cyan/30">
                <label className="block text-sm font-medium text-white mb-2">
                  Refine your idea
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1 p-3 bg-midnight-800 border border-midnight-700 rounded-lg focus:ring-2 focus:ring-aurora-cyan focus:border-aurora-cyan outline-none transition-all text-white"
                  />
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setHasStarted(false);
                      handleEvaluate(inputValue);
                    }}
                    className="bg-aurora-cyan text-midnight-950 px-6 py-3 rounded-lg font-semibold hover:bg-aurora-cyan/90 transition-colors"
                  >
                    Re-analyze
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-midnight-400 px-4 py-3 font-medium hover:text-white hover:bg-midnight-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Public Warning Banner - AGGRESSIVE FOMO */}
          {hasStarted && streamingComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <PublicWarningBanner
                viewCount={viewCount}
                similarIdeaCount={similarIdeaCount}
                seoSlug={evaluationData?.slug || null}
                isAuthenticated={isAuthenticated}
                onClaimClick={handleProtectIdea}
              />
            </motion.div>
          )}

          {/* Sticky CTA Bar */}
          {hasStarted && streamingComplete && (
            <StickyCTABar
              onStartBuilding={handleCreateApp}
              isCreating={isCreatingApp}
            />
          )}

          {/* Main Content - Analysis Box */}
          {(loading || streamData) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`transition-all duration-500 ${
                streamData ? "opacity-100" : "opacity-75"
              }`}
            >
              <div className="bg-midnight-900 rounded-xl border border-midnight-700 overflow-hidden mb-6">
                {/* Header */}
                <div className="border-b border-midnight-700 p-4 flex items-center justify-between bg-midnight-800/50">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-aurora-cyan" />
                    <h2 className="text-lg font-semibold text-white">
                      Market Analysis
                    </h2>
                  </div>
                  {evaluationData?.category && (
                    <span className="px-3 py-1 bg-aurora-purple/20 text-aurora-purple rounded-full text-sm font-medium">
                      {evaluationData.category}
                    </span>
                  )}
                  {loading && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-aurora-cyan border-t-transparent rounded-full animate-spin" />
                      <span className="text-aurora-cyan text-sm">Analyzing...</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 prose prose-invert max-w-none">
                  {renderMarkdown(streamData)}
                  {loading && (
                    <span className="inline-block w-2 h-5 bg-aurora-cyan ml-1 animate-pulse" />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </>
  );
}

export default function EvaluatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-midnight-950">
          <div className="w-12 h-12 border-4 border-aurora-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <EvaluatePageContent />
    </Suspense>
  );
}


