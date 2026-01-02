"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Eye, Lock, ExternalLink } from "lucide-react";
import Link from "next/link";

// =============================================================================
// FOMO Hooks - Ported from december
// =============================================================================

/**
 * Hook for delayed view count - shows after streaming completes
 * Creates illusion of other people viewing the idea
 */
export function useDelayedViewCount(streamingComplete: boolean) {
  const [viewCount, setViewCount] = useState<number | null>(null);

  useEffect(() => {
    if (!streamingComplete) return;

    // Show first view 10-14 seconds after streaming completes
    const initialDelay = 10000 + Math.random() * 4000;

    const initTimer = setTimeout(() => {
      setViewCount(1);

      // Then increment regularly while user is likely still around
      const incrementInterval = setInterval(() => {
        setViewCount((prev) => {
          if (prev === null) return 1;
          // 40% chance to add a view, cap at 7
          if (Math.random() < 0.4 && prev < 7) return prev + 1;
          return prev;
        });
      }, 10000 + Math.random() * 5000); // Every 10-15 seconds

      return () => clearInterval(incrementInterval);
    }, initialDelay);

    return () => clearTimeout(initTimer);
  }, [streamingComplete]);

  return viewCount;
}

/**
 * Hook to get similar idea count (simulated)
 * In production, this would fetch from database
 */
export function useSimilarIdeaCount(streamingComplete: boolean) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!streamingComplete) return;

    // Delay to feel more natural
    const timer = setTimeout(() => {
      // Random count between 2-5 for FOMO
      setCount(Math.floor(Math.random() * 4) + 2);
    }, 4000);

    return () => clearTimeout(timer);
  }, [streamingComplete]);

  return count;
}

// =============================================================================
// FOMO Toast Component
// =============================================================================

interface FomoToastProps {
  isVisible: boolean;
  onAction: () => void;
  onDismiss: () => void;
  isAuthenticated: boolean;
}

export function FomoToast({
  isVisible,
  onAction,
  onDismiss,
  isAuthenticated,
}: FomoToastProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className="max-w-sm w-full bg-amber-50 shadow-2xl rounded-xl border-2 border-amber-400">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-lg font-bold text-amber-900 mb-2">
                Your idea is now public
              </p>
              <p className="text-sm text-amber-800 mb-4">
                If you don&apos;t claim it, someone else will.
              </p>
              <button
                onClick={onAction}
                className="w-full px-4 py-3 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 transition-colors text-base"
              >
                {isAuthenticated ? "Upgrade to Make Private" : "Claim This Idea"}
              </button>
            </div>
            <button
              onClick={onDismiss}
              className="text-amber-600 hover:text-amber-800 text-2xl font-bold leading-none"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Public Warning Banner Component
// =============================================================================

interface PublicWarningBannerProps {
  viewCount: number | null;
  similarIdeaCount: number | null;
  seoSlug: string | null;
  isAuthenticated: boolean;
  onClaimClick: () => void;
}

export function PublicWarningBanner({
  viewCount,
  similarIdeaCount,
  seoSlug,
  isAuthenticated,
  onClaimClick,
}: PublicWarningBannerProps) {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 mb-6 border-2 border-amber-400 shadow-lg">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative">
              <AlertCircle className="w-6 h-6 text-amber-600" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
            </div>
            <h4 className="font-bold text-amber-900 text-lg">
              Your idea is now PUBLIC
            </h4>
          </div>

          <p className="text-base text-amber-800 font-medium mb-4">
            Anyone can view, copy, and build this idea before you do.
            {!isAuthenticated && " Sign up now to claim ownership."}
          </p>

          {/* Dynamic FOMO indicators */}
          <div className="flex flex-wrap items-center gap-4">
            {viewCount !== null && viewCount > 0 && (
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-amber-300 shadow-sm">
                <Eye className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    {viewCount} {viewCount === 1 ? "person" : "people"}
                  </p>
                  <p className="text-xs text-amber-700">viewing now</p>
                </div>
              </div>
            )}

            {similarIdeaCount !== null && similarIdeaCount > 0 && (
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-amber-300 shadow-sm">
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    {similarIdeaCount} similar{" "}
                    {similarIdeaCount === 1 ? "idea" : "ideas"}
                  </p>
                  <p className="text-xs text-amber-700">
                    already submitted - move fast if you want to win
                  </p>
                </div>
              </div>
            )}

            {seoSlug && (
              <Link
                href={`/startup-idea/${seoSlug}`}
                className="text-amber-900 hover:text-amber-950 font-semibold flex items-center gap-1.5 text-sm underline decoration-2"
              >
                See your public page
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={onClaimClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Lock className="w-5 h-5" />
            {isAuthenticated ? "Upgrade to Make Private" : "Claim This Idea"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Sticky CTA Bar Component
// =============================================================================

interface StickyCTABarProps {
  onStartBuilding: () => void;
  isCreating: boolean;
}

export function StickyCTABar({ onStartBuilding, isCreating }: StickyCTABarProps) {
  return (
    <div className="sticky top-16 z-40 mb-6">
      <div className="bg-gradient-to-r from-aurora-cyan to-aurora-purple rounded-xl shadow-2xl p-5 border-2 border-aurora-cyan/30">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-xl mb-1">
                Build This Before Someone Else Does
              </h3>
              <p className="text-white/95 text-sm font-medium">
                Launch your app in minutes, not months
              </p>
            </div>
          </div>
          <button
            onClick={onStartBuilding}
            disabled={isCreating}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-midnight-900 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 text-base transform hover:scale-105"
          >
            {isCreating ? (
              <>
                <div className="w-5 h-5 border-2 border-midnight-500 border-t-transparent rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <span>Start Building Now</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

