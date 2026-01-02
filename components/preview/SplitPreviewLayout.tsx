"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { EnhancedChromeBar, LoadingChromeBar } from "./EnhancedChromeBar";
import { mockApps } from "../ui/app-showcase-slider";
import { Carousel } from "../ui/carousel";
import { DomainSuggestions } from "../ui/domain-suggestions";
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

interface SplitPreviewLayoutProps {
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

export function SplitPreviewLayout({
  containerUrl,
  containerStatus,
  containerName,
  ideaText = "",
  onRefresh,
  onOpenExternal,
  className,
  isStreaming = false,
  isAppReady = false,
}: SplitPreviewLayoutProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const isInitialLoad = containerStatus === null;
  const isLoading =
    containerStatus &&
    ["building", "starting", "restarting"].includes(containerStatus);
  const isRunning = containerStatus === "running" && !!containerUrl;
  const isError =
    containerStatus && ["error", "exited"].includes(containerStatus);

  // Reset iframeLoaded when app becomes not ready
  useEffect(() => {
    if (!isAppReady) {
      setIframeLoaded(false);
    }
  }, [isAppReady]);

  // Only show app when it's ready AND not streaming (AI has finished writing files)
  const actuallyReady = isAppReady && !isStreaming;

  // Show loading state in preview area when:
  // Container is running but app not fully ready yet (health check OR still streaming)
  const showLoadingInPreview = isRunning && !actuallyReady;

  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
  }, []);

  // Helper function to render carousel slides (large version for preview area)
  const renderCarouselSlides = useCallback(() => {
    return mockApps.map((app) => (
      <div
        key={app.domain}
        className="border h-full w-full relative overflow-hidden rounded-lg bg-midnight-900 text-midnight-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer border-midnight-700"
        onClick={() => {
          if (app.url) {
            window.open(app.url, "_blank", "noopener,noreferrer");
          }
        }}
      >
        <div className="w-full h-full relative">
          {app.image ? (
            <img
              src={app.image}
              alt={`${app.name} screenshot`}
              className="object-cover h-full w-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-midnight-800 to-midnight-900">
              <span className="text-midnight-400 text-sm font-medium">
                Preview
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-2xl font-bold">{app.name}</h3>
              <div className="bg-green-500 text-white px-3 py-1.5 rounded-lg font-bold text-lg flex flex-col items-end">
                <span>{app.mrr}</span>
                <span className="text-xs opacity-90 font-normal">MRR</span>
              </div>
            </div>
            <p className="text-sm text-white/90 mb-2 line-clamp-2">
              {app.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-green-400 bg-green-500/20 px-2 py-1 rounded">
                {app.domain}
              </span>
            </div>
          </div>
        </div>
      </div>
    ));
  }, []);

  // Helper function to render carousel slides (compact version for bottom right)
  const renderCompactCarouselSlides = useCallback(() => {
    return mockApps.map((app) => (
      <div
        key={app.domain}
        className="border h-full w-full relative overflow-hidden rounded-lg bg-midnight-900 text-midnight-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer border-midnight-700"
        onClick={() => {
          if (app.url) {
            window.open(app.url, "_blank", "noopener,noreferrer");
          }
        }}
      >
        <div className="w-full h-full relative">
          {app.image ? (
            <img
              src={app.image}
              alt={`${app.name} screenshot`}
              className="object-cover h-full w-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-midnight-800 to-midnight-900">
              <span className="text-midnight-400 text-sm font-medium">
                Preview
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-bold">{app.name}</h3>
              <div className="bg-green-500 text-white px-2.5 py-1 rounded-lg font-bold text-base flex flex-col items-end">
                <span>{app.mrr}</span>
                <span className="text-[10px] opacity-90 font-normal">MRR</span>
              </div>
            </div>
            <p className="text-xs text-white/90 mb-2 line-clamp-2">
              {app.description}
            </p>
            <span className="text-xs font-medium text-green-400 bg-green-500/20 px-2 py-0.5 rounded">
              {app.domain}
            </span>
          </div>
        </div>
      </div>
    ));
  }, []);

  // Get domain suggestions based on idea text
  const suggestedDomains = useMemo(() => {
    if (!ideaText) return [];
    return matchDomains(ideaText, 4);
  }, [ideaText]);

  const primaryDomain = suggestedDomains[0] || null;

  // Handle domain claim (UI only)
  const handleClaim = useCallback(
    (domain?: MatchedDomain) => {
      const domainName =
        domain?.fullDomain || primaryDomain?.fullDomain || "this domain";
      toast.success(`Domain claim for ${domainName} - feature coming soon!`);
    },
    [primaryDomain]
  );

  // Loading state: show carousel during building (includes initial load and actual building)
  if (isLoading || isInitialLoad) {
    return (
      <div
        className={cn(
          "h-full flex flex-col bg-midnight-900 rounded-xl border border-midnight-700 overflow-hidden shadow-2xl",
          className
        )}
      >
        <LoadingChromeBar />
        <div className="flex-1 bg-gradient-to-br from-midnight-950 to-midnight-900 p-8 overflow-y-auto flex flex-col items-center justify-center">
          <div className="w-full max-w-2xl flex flex-col justify-center gap-8">
            <div className="text-center">
              <div className="w-12 h-12 border-3 border-aurora-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-midnight-100 mb-3">
                We're building your app...
              </h3>
              <p className="text-base text-midnight-300 mb-2">
                This usually takes 30-60 seconds. Your app will appear here once
                it's ready.
              </p>
              <p className="text-sm text-midnight-400 mb-6">
                In the meantime, check out some of our successful launches:
              </p>
            </div>
            <div className="mx-auto w-full max-w-2xl">
              <Carousel slides={renderCarouselSlides()} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    const errorTime = new Date().toLocaleTimeString();
    const errorMessage =
      containerStatus === "error"
        ? "The container encountered an error and stopped running."
        : "The container exited unexpectedly. This may be due to a configuration issue or resource limitation.";

    return (
      <div
        className={cn(
          "h-full flex flex-col bg-midnight-900 rounded-xl border border-midnight-700 overflow-hidden shadow-2xl",
          className
        )}
      >
        <LoadingChromeBar />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-midnight-950 to-midnight-900 p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-400"
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
            <h2 className="text-xl font-bold text-midnight-100 mb-2">
              Container {containerStatus === "error" ? "Error" : "Exited"}
            </h2>
            <p className="text-midnight-300 text-sm mb-4">{errorMessage}</p>
            <div className="bg-midnight-800 rounded-lg p-3 mb-6">
              <div className="text-xs text-midnight-400 mb-1">
                Error Details
              </div>
              <div className="text-sm font-mono text-midnight-200">
                Status: <span className="text-red-400">{containerStatus}</span>
              </div>
              <div className="text-xs text-midnight-400 mt-1">
                Time: {errorTime}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="px-4 py-2 bg-aurora-cyan text-midnight-950 rounded-lg text-sm font-semibold hover:bg-aurora-cyan/90 transition-colors"
                >
                  Retry Container
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stopped/waiting state
  if (!isRunning) {
    return (
      <div
        className={cn(
          "h-full flex flex-col bg-midnight-900 rounded-xl border border-midnight-700 overflow-hidden shadow-2xl",
          className
        )}
      >
        <LoadingChromeBar />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-midnight-950 to-midnight-900">
          <div className="text-center p-8">
            <div className="w-12 h-12 border-3 border-aurora-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-midnight-100 mb-2">
              Setting up your environment...
            </h2>
            <p className="text-midnight-400 text-sm">
              Status:{" "}
              <span className="font-mono text-aurora-cyan">
                {containerStatus}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Running state: split layout (65/35)
  return (
    <div className={cn("h-full flex flex-col gap-3", className)}>
      {/* Top section: Preview (65%) */}
      <div className="flex-[65] min-h-0 bg-midnight-900 rounded-xl border-2 border-midnight-700 overflow-hidden shadow-xl">
        <div className="h-full flex flex-col">
          <EnhancedChromeBar
            url={containerUrl || ""}
            isLive={true}
            suggestedDomain={primaryDomain}
            onClaim={() => handleClaim(primaryDomain || undefined)}
            onRefresh={onRefresh}
            onOpenExternal={onOpenExternal}
          />
          <div className="flex-1 relative">
            {showLoadingInPreview && (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-midnight-950 to-midnight-900 p-8 overflow-y-auto z-10 flex flex-col items-center justify-center">
                <div className="w-full max-w-2xl flex flex-col justify-center gap-8">
                  <div className="text-center">
                    <div className="w-12 h-12 border-3 border-aurora-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-midnight-100 mb-3">
                      We're building your app...
                    </h3>
                    <p className="text-base text-midnight-300 mb-2">
                      This usually takes 30-60 seconds. Your app will appear
                      here once it's ready.
                    </p>
                    <p className="text-sm text-midnight-400 mb-6">
                      In the meantime, check out some of our successful
                      launches:
                    </p>
                  </div>
                  <div className="mx-auto w-full max-w-2xl">
                    <Carousel slides={renderCarouselSlides()} />
                  </div>
                </div>
              </div>
            )}
            {actuallyReady && containerUrl && (
              <iframe
                src={containerUrl}
                className="w-full h-full border-0"
                title={`Preview of ${containerName || "your app"}`}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                onLoad={handleIframeLoad}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom section: Domains + Success Stories (35%) */}
      <div className="flex-[35] min-h-0">
        <div
          className={cn(
            "h-full grid gap-4 auto-rows-fr overflow-y-auto custom-scrollbar",
            showLoadingInPreview ? "grid-cols-1" : "md:grid-cols-2"
          )}
        >
          {/* Domain suggestions card */}
          <div className="bg-gradient-to-br from-midnight-900 to-midnight-950/50 backdrop-blur-sm rounded-xl border-2 border-aurora-cyan/30 shadow-lg p-4 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto">
              {suggestedDomains.length > 0 ? (
                <DomainSuggestions
                  domains={suggestedDomains}
                  onClaim={handleClaim}
                  compact={false}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center py-6 max-w-[200px]">
                    <div className="w-12 h-12 bg-gradient-to-br from-aurora-cyan/20 to-aurora-purple/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-aurora-cyan"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-midnight-200 font-semibold mb-1">
                      Finding domains...
                    </p>
                    <p className="text-xs text-midnight-400">
                      Scanning premium .ai matches
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Success stories card */}
          {actuallyReady && (
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-xl border-2 border-green-500/30 shadow-lg p-4 flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-4 h-4 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                <h3 className="text-sm font-bold text-green-400">
                  Successful apps built on StartupLab
                </h3>
              </div>
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <Carousel slides={renderCompactCarouselSlides()} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SplitPreviewLayout;

