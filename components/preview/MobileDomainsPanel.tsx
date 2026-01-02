"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { DomainSuggestions } from "../ui/domain-suggestions";
import { AppShowcaseSlider } from "../ui/app-showcase-slider";
import { matchDomains, MatchedDomain } from "@/lib/domain-matcher";
import { toast } from "react-hot-toast";

interface MobileDomainsPanelProps {
  ideaText?: string;
  className?: string;
}

export function MobileDomainsPanel({
  ideaText = "",
  className,
}: MobileDomainsPanelProps) {
  // Get domain suggestions based on idea text
  const suggestedDomains = useMemo(() => {
    if (!ideaText) return [];
    return matchDomains(ideaText, 4);
  }, [ideaText]);

  // Handle domain claim (UI only)
  const handleClaim = (domain: MatchedDomain) => {
    toast.success(
      `Domain claim for ${domain.fullDomain} - feature coming soon!`
    );
  };

  return (
    <div
      className={cn("h-full overflow-y-auto bg-midnight-950", className)}
    >
      <div className="p-4 space-y-6">
        {/* Domain Suggestions Section */}
        <section>
          {suggestedDomains.length > 0 ? (
            <DomainSuggestions
              domains={suggestedDomains}
              onClaim={handleClaim}
              compact={false}
            />
          ) : (
            <div className="text-center py-8 bg-midnight-900 rounded-xl border border-midnight-700">
              <p className="text-midnight-400 text-sm">
                Enter an idea to see domain suggestions
              </p>
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="border-t border-midnight-700" />

        {/* App Showcase Section */}
        <section>
          <AppShowcaseSlider compact={false} />
        </section>
      </div>
    </div>
  );
}

export default MobileDomainsPanel;

