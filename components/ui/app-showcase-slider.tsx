"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ShowcaseApp {
  name: string;
  domain: string;
  mrr: string;
  description: string;
  image?: string;
  url?: string;
}

/**
 * Real community websites with fake MRR data
 * Images from /public/community/
 */
export const mockApps: ShowcaseApp[] = [
  {
    name: "JustListen.gg",
    domain: "justlisten.gg",
    mrr: "$18,400",
    description: "AI music discovery and streaming platform",
    image: "/community/justlisten.gg.png",
    url: "https://justlisten.gg",
  },
  {
    name: "GoMoon.ai",
    domain: "gomoon.ai",
    mrr: "$24,800",
    description: "AI-powered growth marketing automation",
    image: "/community/gomoon.ai.png",
    url: "https://gomoon.ai",
  },
  {
    name: "Musicfy.lol",
    domain: "musicfy.lol",
    mrr: "$15,200",
    description: "AI voice cloning for music production",
    image: "/community/musicfy.lol.png",
    url: "https://musicfy.lol",
  },
  {
    name: "Crayo.ai",
    domain: "crayo.ai",
    mrr: "$32,900",
    description: "Short-form video content creation platform",
    image: "/community/crayo.ai.png",
    url: "https://crayo.ai",
  },
  {
    name: "TryRevana",
    domain: "tryrevana.com",
    mrr: "$12,700",
    description: "AI wellness and mental health assistant",
    image: "/community/tryrevana.com.png",
    url: "https://tryrevana.com",
  },
  {
    name: "Trailblazer Marketing",
    domain: "trailblazermktg.com",
    mrr: "$21,500",
    description: "AI-driven marketing strategy platform",
    image: "/community/trailblazermktg.com.png",
    url: "https://trailblazermktg.com",
  },
  {
    name: "StudyPotion.ai",
    domain: "studypotion.ai",
    mrr: "$9,600",
    description: "AI study companion and learning optimizer",
    image: "/community/studypotion.ai.png",
    url: "https://studypotion.ai",
  },
  {
    name: "Kalam.gg",
    domain: "kalam.gg",
    mrr: "$14,300",
    description: "AI language learning and practice platform",
    image: "/community/kalam.gg.png",
    url: "https://kalam.gg",
  },
  {
    name: "Search.ai",
    domain: "search.ai",
    mrr: "$38,200",
    description: "Next-generation AI search engine",
    image: "/community/search.ai.png",
    url: "https://search.ai",
  },
];

interface AppShowcaseSliderProps {
  apps?: ShowcaseApp[];
  title?: string;
  showTitle?: boolean;
  compact?: boolean;
  className?: string;
}

export function AppShowcaseSlider({
  apps = mockApps,
  title = "Apps Hitting $10K+ MRR",
  showTitle = true,
  compact = false,
  className,
}: AppShowcaseSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  const visibleCards = 1; // Show one card at a time for better visibility
  const maxIndex = Math.max(0, apps.length - visibleCards);

  // Auto-scroll effect with infinite loop
  useEffect(() => {
    if (!isAutoScrolling) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        // Infinite loop: go back to 0 when reaching the end
        if (prev >= maxIndex) return 0;
        return prev + 1;
      });
    }, 3000); // Auto-advance every 3 seconds

    return () => clearInterval(interval);
  }, [maxIndex, isAutoScrolling]);

  const handlePrev = () => {
    setIsAutoScrolling(false);
    setCurrentIndex((prev) => {
      if (prev <= 0) return maxIndex; // Loop to end
      return prev - 1;
    });
  };

  const handleNext = () => {
    setIsAutoScrolling(false);
    setCurrentIndex((prev) => {
      if (prev >= maxIndex) return 0; // Loop to start
      return prev + 1;
    });
  };

  const canGoPrev = true; // Always allow navigation with infinite loop
  const canGoNext = true;

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <div>
              <h3 className="text-base font-bold text-midnight-100">
                {title}
              </h3>
              <p className="text-xs text-midnight-400">
                Real products in the space
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className={cn(
                "p-2 rounded-lg transition-all bg-midnight-900 border border-midnight-700 shadow-sm",
                "hover:bg-midnight-800 hover:border-aurora-cyan/30 text-midnight-300 hover:text-aurora-cyan"
              )}
              aria-label="Previous apps"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className={cn(
                "p-2 rounded-lg transition-all bg-midnight-900 border border-midnight-700 shadow-sm",
                "hover:bg-midnight-800 hover:border-aurora-cyan/30 text-midnight-300 hover:text-aurora-cyan"
              )}
              aria-label="Next apps"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="relative flex-1 overflow-hidden rounded-xl">
        <div
          ref={sliderRef}
          className="flex h-full transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / visibleCards)}%)`,
          }}
        >
          {apps.map((app, index) => (
            <div
              key={`${app.domain}-${index}`}
              className={cn(
                "flex-shrink-0 h-full px-2",
                compact ? "w-full" : "w-full"
              )}
            >
              <AppCard app={app} compact={compact} />
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentIndex(idx);
              setIsAutoScrolling(false);
            }}
            className={cn(
              "h-2 rounded-full transition-all",
              idx === currentIndex
                ? "bg-aurora-cyan w-8"
                : "bg-midnight-600 w-2 hover:bg-midnight-500"
            )}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

interface AppCardProps {
  app: ShowcaseApp;
  compact?: boolean;
}

function AppCard({ app, compact = false }: AppCardProps) {
  const handleClick = () => {
    if (app.url) {
      window.open(app.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative w-full h-full rounded-2xl overflow-hidden group cursor-pointer",
        "bg-gradient-to-br from-midnight-900 to-midnight-950",
        "border-2 border-midnight-700 hover:border-aurora-cyan/30",
        "shadow-lg hover:shadow-2xl",
        "transition-all duration-300 hover:scale-[1.02]"
      )}
    >
      {/* Screenshot image */}
          <div className="relative w-full h-[60%] overflow-hidden bg-midnight-800">
        {app.image ? (
          <>
            <img
              src={app.image}
              alt={`${app.name} screenshot`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-midnight-800 to-midnight-900">
            <span className="text-midnight-400 text-sm font-medium">
              Preview
            </span>
          </div>
        )}

        {/* External link icon on hover */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
            <ExternalLink className="w-4 h-4 text-aurora-cyan" />
          </div>
        </div>
      </div>

      {/* App info */}
      <div className="p-4 h-[40%] flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-lg font-bold text-midnight-100 line-clamp-1 group-hover:text-aurora-cyan transition-colors">
              {app.name}
            </h4>
            <div className="flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2.5 py-1 rounded-lg flex flex-col items-end">
              <span className="text-sm font-bold">{app.mrr}</span>
              <span className="text-[10px] opacity-90 font-normal">MRR</span>
            </div>
          </div>

          <p className="text-sm text-midnight-300 line-clamp-2 mb-2">
            {app.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-aurora-cyan bg-aurora-cyan/10 px-2 py-1 rounded">
            {app.domain}
          </span>
          <span className="text-xs text-midnight-400 group-hover:text-aurora-cyan transition-colors">
            View site →
          </span>
        </div>
      </div>
    </div>
  );
}

