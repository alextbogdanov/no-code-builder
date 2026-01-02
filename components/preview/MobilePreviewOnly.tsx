"use client";

import { EnhancedChromeBar, LoadingChromeBar } from "./EnhancedChromeBar";
import { cn } from "@/lib/utils";
import { useMemo, useCallback, useState } from "react";
import { matchDomains, MatchedDomain } from "@/lib/domain-matcher";
import { toast } from "react-hot-toast";

type ContainerStatus =
  | "building"
  | "starting"
  | "running"
  | "stopped"
  | "stopping"
  | "restarting"
  | "error"
  | "exited"
  | null;

interface MobilePreviewOnlyProps {
  containerUrl: string | null;
  containerStatus: ContainerStatus;
  containerName?: string;
  ideaText?: string;
  onRefresh?: () => void;
  onOpenExternal?: () => void;
  className?: string;
  isStreaming?: boolean;
  isAppReady?: boolean;
}

/**
 * Mobile-only preview component - just shows the iframe with chrome bar
 * No domains or gallery
 */
export function MobilePreviewOnly({
  containerUrl,
  containerStatus,
  containerName,
  ideaText = "",
  onRefresh,
  onOpenExternal,
  className,
  isStreaming = false,
  isAppReady = false,
}: MobilePreviewOnlyProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const isInitialLoad = containerStatus === null;
  const isRunning = containerStatus === "running" && !!containerUrl;
  const isLoading =
    containerStatus &&
    ["building", "starting", "restarting"].includes(containerStatus);
  const isError =
    containerStatus && ["error", "exited"].includes(containerStatus);

  // Show loading state when:
  // 1. Streaming on mobile OR
  // 2. Container is running but app not ready OR
  // 3. App is ready but iframe hasn't loaded yet
  const showThinkingState =
    isStreaming || (isRunning && (!isAppReady || !iframeLoaded));

  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
  }, []);

  // Get primary domain for chrome bar
  const primaryDomain = useMemo(() => {
    if (!ideaText) return null;
    const domains = matchDomains(ideaText, 1);
    return domains[0] || null;
  }, [ideaText]);

  const handleClaim = useCallback(() => {
    const domainName = primaryDomain?.fullDomain || "this domain";
    toast.success(`Domain claim for ${domainName} - feature coming soon!`);
  }, [primaryDomain]);

  // Initial load state
  if (isInitialLoad) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        <LoadingChromeBar />
        <div className="flex-1 flex items-center justify-center bg-midnight-950">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-aurora-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-midnight-300 text-sm font-medium">
              Loading...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "h-full flex flex-col bg-midnight-900 rounded-xl border border-midnight-700 overflow-hidden",
          className
        )}
      >
        <LoadingChromeBar />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-midnight-950 to-midnight-900">
          <div className="text-center p-8">
            <div className="w-12 h-12 border-3 border-aurora-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-midnight-300 text-sm font-medium">
              Building your app...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    const errorTime = new Date().toLocaleTimeString();

    return (
      <div
        className={cn(
          "h-full flex flex-col bg-midnight-900 rounded-xl border border-midnight-700 overflow-hidden",
          className
        )}
      >
        <LoadingChromeBar />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-midnight-950 to-midnight-900 p-6">
          <div className="text-center max-w-sm">
            <div className="w-12 h-12 bg-red-500/20 rounded-full mx-auto mb-3 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-midnight-200 text-sm font-semibold mb-2">
              Container {containerStatus === "error" ? "Error" : "Exited"}
            </p>
            <p className="text-midnight-400 text-xs mb-3">
              Status:{" "}
              <span className="font-mono text-red-400">{containerStatus}</span>
            </p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="w-full px-4 py-2 bg-aurora-cyan text-midnight-950 rounded-lg text-sm font-medium hover:bg-aurora-cyan/90 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Waiting state
  if (!isRunning) {
    return (
      <div
        className={cn(
          "h-full flex flex-col bg-midnight-900 rounded-xl border border-midnight-700 overflow-hidden",
          className
        )}
      >
        <LoadingChromeBar />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-midnight-950 to-midnight-900">
          <div className="text-center p-8">
            <div className="w-12 h-12 border-3 border-aurora-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-midnight-300 text-sm font-medium">
              Setting up...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Running state - show preview or thinking state
  return (
    <div
      className={cn(
        "h-full flex flex-col bg-midnight-900 rounded-xl border border-midnight-700 overflow-hidden",
        className
      )}
    >
      <EnhancedChromeBar
        url={containerUrl || ""}
        isLive={true}
        suggestedDomain={primaryDomain}
        onClaim={handleClaim}
        onRefresh={onRefresh}
        onOpenExternal={onOpenExternal}
      />
      <div className="flex-1 relative">
        {showThinkingState && (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-midnight-950 to-midnight-900 z-10">
            <div className="text-center p-6">
              <div className="w-12 h-12 border-3 border-aurora-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-midnight-200 text-sm font-semibold mb-1">
                {isStreaming ? "Thinking..." : "Loading preview..."}
              </p>
              <p className="text-midnight-400 text-xs">
                {isStreaming
                  ? "Processing your request"
                  : "Getting your app ready"}
              </p>
            </div>
          </div>
        )}
        <iframe
          src={containerUrl || ""}
          className="w-full h-full border-0"
          title={`Preview of ${containerName || "your app"}`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          onLoad={handleIframeLoad}
        />
      </div>
    </div>
  );
}

export default MobilePreviewOnly;

