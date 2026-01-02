"use client";

import { Globe, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MatchedDomain } from "@/lib/domain-matcher";

interface DomainSuggestionsProps {
  domains: MatchedDomain[];
  onClaim?: (domain: MatchedDomain) => void;
  className?: string;
  compact?: boolean;
}

export function DomainSuggestions({
  domains,
  onClaim,
  className,
  compact = false,
}: DomainSuggestionsProps) {
  if (domains.length === 0) {
    return null;
  }

  const handleClaim = (domain: MatchedDomain) => {
    // UI-only: just trigger the callback or show a placeholder action
    onClaim?.(domain);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-aurora-cyan" />
          <h3 className="text-sm font-semibold text-midnight-200">
            .ai domains for your app
          </h3>
        </div>
        <span className="text-xs font-medium text-green-400 bg-green-500/20 px-2 py-0.5 rounded">
          {domains.length} matches
        </span>
      </div>

      <div
        className={cn("grid gap-2", compact ? "grid-cols-1" : "grid-cols-2")}
      >
        {domains.map((domain, index) => (
          <DomainCard
            key={domain.fullDomain}
            domain={domain}
            isPrimary={index === 0}
            onClaim={() => handleClaim(domain)}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

interface DomainCardProps {
  domain: MatchedDomain;
  isPrimary?: boolean;
  onClaim: () => void;
  compact?: boolean;
}

function DomainCard({
  domain,
  isPrimary = false,
  onClaim,
  compact = false,
}: DomainCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-200 ease-out",
        isPrimary
          ? "bg-gradient-to-br from-aurora-cyan/10 to-aurora-purple/10 border-aurora-cyan/30 shadow-sm"
          : "bg-midnight-900 border-midnight-700 hover:border-aurora-cyan/30 hover:shadow-sm",
        compact ? "p-2" : "p-3"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {isPrimary && (
              <Sparkles className="w-3 h-3 text-aurora-cyan flex-shrink-0" />
            )}
            <span
              className={cn(
                "font-bold text-midnight-100 truncate",
                compact ? "text-sm" : "text-base"
              )}
            >
              {domain.fullDomain}
            </span>
          </div>
          {!compact && (
            <p className="text-xs text-midnight-400 mt-0.5">
              {getMatchDescription(domain.matchType)}
            </p>
          )}
        </div>

        <button
          onClick={onClaim}
          className={cn(
            "flex-shrink-0 font-semibold rounded-lg transition-all focus:ring-2 focus:ring-aurora-cyan focus:ring-offset-2 focus:ring-offset-midnight-900 focus:outline-none",
            isPrimary
              ? "bg-aurora-cyan text-midnight-950 hover:bg-aurora-cyan/90 shadow-sm"
              : "bg-midnight-800 text-aurora-cyan border border-aurora-cyan/30 hover:bg-midnight-700",
            compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
          )}
        >
          Claim
        </button>
      </div>
    </div>
  );
}

function getMatchDescription(matchType: MatchedDomain["matchType"]): string {
  switch (matchType) {
    case "exact":
      return "Exact match • Perfect for your idea";
    case "partial":
      return "Strong match • High recall value";
    case "category":
      return "Category leader • Clear positioning";
    case "fallback":
    default:
      return "Premium • Short & brandable";
  }
}

/**
 * Compact inline version for the chrome bar
 */
interface InlineDomainClaimProps {
  domain: MatchedDomain;
  onClaim?: () => void;
  className?: string;
}

export function InlineDomainClaim({
  domain,
  onClaim,
  className,
}: InlineDomainClaimProps) {
  return (
    <button
      onClick={onClaim}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg",
        "bg-aurora-cyan text-midnight-950 text-xs font-semibold",
        "hover:bg-aurora-cyan/90 transition-colors",
        "shadow-sm",
        className
      )}
    >
      <Globe className="w-3 h-3" />
      <span>Claim {domain.fullDomain}</span>
    </button>
  );
}

