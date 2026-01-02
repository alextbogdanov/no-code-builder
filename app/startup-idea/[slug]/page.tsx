"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  ArrowRight,
  Rocket,
  Copy,
  ArrowLeft,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// =============================================================================
// Markdown Rendering (adapted for dark theme)
// =============================================================================

function renderInlineFormatting(text: string): React.ReactNode {
  const parts = text.split(/(_[^_]+_)/g);
  return parts.map((part, i) => {
    if (part.startsWith("_") && part.endsWith("_")) {
      return (
        <em key={i} className="text-aurora-cyan font-medium">
          {part.slice(1, -1)}
        </em>
      );
    }
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
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={index} className="text-2xl font-bold text-white mt-4 mb-2">
          {line.substring(2)}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={index} className="text-xl font-semibold text-white/90 mt-3 mb-2">
          {line.substring(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={index} className="text-lg font-medium text-white/80 mt-3 mb-1.5">
          {line.substring(4)}
        </h3>
      );
    } else if (line.startsWith("- ")) {
      elements.push(
        <li key={index} className="ml-4 text-midnight-200 my-0.5 list-disc">
          {renderInlineFormatting(line.substring(2))}
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^\d+\.\s(.*)$/);
      if (match) {
        elements.push(
          <li key={index} className="ml-4 text-midnight-200 my-0.5 list-decimal">
            {renderInlineFormatting(match[1])}
          </li>
        );
      }
    } else if (line.trim()) {
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
// Sharing Buttons
// =============================================================================

function SharingButtons({ title, slug }: { title: string | null; slug: string }) {
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/startup-idea/${slug}`
      : "";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // Could add toast notification here
    } catch {
      // Handle error silently
    }
  };

  const shareOnTwitter = () => {
    const text = `Check out this startup idea analysis: ${title || "Startup Idea"}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={copyToClipboard}
        className="p-2 text-midnight-400 hover:text-white hover:bg-midnight-800 rounded-lg transition-colors"
        title="Copy link"
      >
        <Copy className="w-5 h-5" />
      </button>
      <button
        onClick={shareOnTwitter}
        className="p-2 text-midnight-400 hover:text-aurora-cyan hover:bg-midnight-800 rounded-lg transition-colors"
        title="Share on Twitter"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function StartupIdeaPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Fetch evaluation from Convex
  const evaluation = useQuery(api.queries.evaluations.getBySlug, { slug });
  const isLoading = evaluation === undefined;

  // Generate JSON-LD structured data for SEO
  const jsonLd = evaluation
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: evaluation.shortTitle || "Startup Idea Analysis",
        datePublished: new Date(evaluation.createdAt).toISOString(),
        author: {
          "@type": "Organization",
          name: "startupAI",
        },
        publisher: {
          "@type": "Organization",
          name: "startupAI",
        },
        description:
          evaluation.keywordSummary || evaluation.idea.substring(0, 160),
        articleBody: evaluation.analysis,
        category: evaluation.category,
      }
    : null;

  // Error state - evaluation not found
  if (!isLoading && !evaluation) {
    return (
      <div className="min-h-screen bg-midnight-950">
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-aurora-purple/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-aurora-cyan/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-midnight-900 border border-midnight-700 rounded-2xl p-10"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">
              Startup Idea Not Found
            </h1>
            <p className="text-midnight-400 mb-8">
              This startup idea could not be found or has been removed.
            </p>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-aurora-cyan to-aurora-purple text-white font-semibold rounded-xl hover:scale-105 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Generate New Idea
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-midnight-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-aurora-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-midnight-400">Loading startup idea...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* JSON-LD for SEO */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

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
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aurora-cyan to-aurora-purple flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-white">
                startup<span className="text-aurora-cyan">AI</span>
              </span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-2 text-midnight-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
          </div>
        </header>

        <main className="relative z-10 max-w-5xl w-full mx-auto px-4 py-8">
          {/* Title and Meta */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-3">
              {evaluation.category && (
                <span className="px-3 py-1 bg-aurora-purple/20 text-aurora-purple rounded-full text-sm font-medium">
                  {evaluation.category}
                </span>
              )}
              <span className="text-midnight-500 text-sm">
                {new Date(evaluation.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-4">
              {evaluation.shortTitle || "Startup Idea Analysis"}
            </h1>
            <div className="flex items-center justify-between">
              <p className="text-midnight-300 max-w-2xl">{evaluation.idea}</p>
              <SharingButtons title={evaluation.shortTitle || null} slug={slug} />
            </div>
          </motion.div>

          {/* Original Idea Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-midnight-900 rounded-xl border border-midnight-700 p-6 mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-aurora-cyan/20 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-aurora-cyan" />
              </div>
              <h2 className="text-sm font-semibold text-midnight-400 uppercase tracking-wide">
                Original Submission
              </h2>
            </div>
            <p className="text-lg font-medium text-white leading-relaxed">
              {evaluation.idea}
            </p>
          </motion.div>

          {/* AI Evaluation Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-midnight-900 rounded-xl border border-midnight-700 overflow-hidden mb-8"
          >
            <div className="border-b border-midnight-700 p-4 flex items-center gap-2 bg-midnight-800/50">
              <TrendingUp className="h-5 w-5 text-aurora-cyan" />
              <h2 className="text-lg font-semibold text-white">
                AI Market Analysis
              </h2>
              {evaluation.score && (
                <span className="ml-auto px-3 py-1 bg-aurora-cyan/20 text-aurora-cyan rounded-full text-sm font-medium">
                  Score: {evaluation.score}/10
                </span>
              )}
            </div>
            <div className="p-6 prose prose-invert max-w-none">
              {evaluation.analysis ? (
                renderMarkdown(evaluation.analysis)
              ) : (
                <p className="text-midnight-400">Analysis not available.</p>
              )}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-aurora-cyan/10 to-aurora-purple/10 rounded-xl p-8 border border-aurora-cyan/20 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Rocket className="w-6 h-6 text-aurora-cyan" />
              <h3 className="text-xl font-display font-bold text-white">
                Ready to Build This Idea?
              </h3>
            </div>
            <p className="text-midnight-300 mb-6 max-w-xl mx-auto">
              Turn this concept into reality with our AI-powered builder. Generate
              production-ready code in minutes.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-aurora-cyan to-aurora-purple text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg"
            >
              Start Building Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-midnight-800 mt-12 py-8">
          <div className="max-w-5xl mx-auto px-4 text-center text-midnight-500 text-sm">
            <p>Built with startupAI - Turn Ideas Into Reality</p>
          </div>
        </footer>
      </div>
    </>
  );
}

