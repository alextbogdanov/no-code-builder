"use client";

import { Lock, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { MatchedDomain } from "@/lib/domain-matcher";

interface EnhancedChromeBarProps {
  url: string;
  isLive?: boolean;
  suggestedDomain?: MatchedDomain | null;
  onClaim?: () => void;
  onRefresh?: () => void;
  onOpenExternal?: () => void;
  className?: string;
}

export function EnhancedChromeBar({
  url,
  isLive = false,
  suggestedDomain,
  onClaim,
  onRefresh,
  onOpenExternal,
  className,
}: EnhancedChromeBarProps) {
  return (
    <div
      className={cn(
        "bg-midnight-900/80 backdrop-blur-sm border-b border-midnight-700 px-2 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between relative z-10 gap-1 sm:gap-3",
        className
      )}
    >
      {/* Left: Traffic lights */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full shadow-sm" />
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full shadow-sm" />
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full shadow-sm" />
        </div>
      </div>

      {/* Three-segment layout: Current URL | Upgrade Button | Suggested Domain */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {/* Left segment: Current URL */}
        <div className="flex-1 min-w-0 text-xs sm:text-sm text-midnight-400 font-mono bg-midnight-950/50 backdrop-blur-sm px-2 sm:px-3 py-1 rounded border border-midnight-700 shadow-sm flex items-center gap-1 sm:gap-2">
          <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-midnight-500 flex-shrink-0" />
          <span className="truncate">{url}</span>
        </div>

        {/* Center segment: Upgrade CTA button - only show when domain available */}
        {suggestedDomain && (
          <>
            <button
              onClick={onClaim}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-aurora-cyan to-aurora-purple text-midnight-950 text-xs font-bold hover:from-aurora-cyan/90 hover:to-aurora-purple/90 transition-all shadow-md hover:shadow-lg whitespace-nowrap flex-shrink-0 focus:ring-2 focus:ring-aurora-cyan focus:ring-offset-2 focus:ring-offset-midnight-900 focus:outline-none"
            >
              Upgrade Now
            </button>

            {/* Right segment: Suggested domain preview */}
            <div className="hidden lg:flex flex-1 min-w-0 text-xs sm:text-sm text-aurora-cyan font-mono bg-aurora-cyan/10 backdrop-blur-sm px-2 sm:px-3 py-1 rounded border border-aurora-cyan/30 shadow-sm items-center gap-1 sm:gap-2">
              <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-aurora-cyan flex-shrink-0" />
              <span className="truncate font-semibold">
                {suggestedDomain.fullDomain}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Right: Status and actions */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Live indicator */}
        {isLive && (
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse shadow-sm" />
            <span className="hidden sm:inline text-xs text-midnight-300 font-medium">
              Live
            </span>
          </div>
        )}

        {/* Action buttons - hide on mobile */}
        <div className="hidden sm:flex items-center gap-1 border-l border-midnight-700 pl-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 text-midnight-400 hover:text-midnight-200 hover:bg-midnight-800 rounded transition-colors focus:ring-2 focus:ring-aurora-cyan focus:ring-offset-2 focus:ring-offset-midnight-900 focus:outline-none"
              title="Refresh preview"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          {onOpenExternal && (
            <button
              onClick={onOpenExternal}
              className="p-1 text-midnight-400 hover:text-midnight-200 hover:bg-midnight-800 rounded transition-colors focus:ring-2 focus:ring-aurora-cyan focus:ring-offset-2 focus:ring-offset-midnight-900 focus:outline-none"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Simplified chrome bar for loading state
 */
interface LoadingChromeBarProps {
  className?: string;
}

export function LoadingChromeBar({ className }: LoadingChromeBarProps) {
  return (
    <div
      className={cn(
        "bg-midnight-900/80 backdrop-blur-sm border-b border-midnight-700 px-4 py-2.5 flex items-center justify-between relative z-10",
        className
      )}
    >
      {/* Left: Traffic lights */}
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 bg-red-400 rounded-full shadow-sm" />
        <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-sm" />
        <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm" />
      </div>

      {/* Center: Loading indicator */}
      <div className="flex-1 max-w-md mx-4">
        <div className="text-sm text-midnight-400 bg-midnight-950/50 backdrop-blur-sm px-3 py-1 rounded border border-midnight-700 shadow-sm flex items-center gap-2 justify-center">
          <div className="w-3 h-3 border-2 border-aurora-cyan border-t-transparent rounded-full animate-spin" />
          <span>Building...</span>
        </div>
      </div>

      {/* Right: Building status */}
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-sm" />
        <span className="text-xs text-midnight-300 font-medium">Building</span>
      </div>
    </div>
  );
}

