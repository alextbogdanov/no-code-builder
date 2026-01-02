/**
 * Domain matching utility
 * Simple keyword-based matching against the domain portfolio
 */

import { domains, domainCategories } from "./domain-list";

export interface MatchedDomain {
  domain: string;
  fullDomain: string;
  score: number;
  matchType: "exact" | "partial" | "category" | "fallback";
}

/**
 * Common words to exclude from matching
 */
const stopWords = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "need",
  "that",
  "this",
  "these",
  "those",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "what",
  "which",
  "who",
  "whom",
  "where",
  "when",
  "why",
  "how",
  "app",
  "application",
  "platform",
  "service",
  "tool",
  "software",
  "website",
  "site",
  "web",
  "online",
  "digital",
  "smart",
  "new",
  "best",
  "top",
  "great",
  "good",
  "better",
  "like",
  "using",
  "use",
  "make",
  "create",
  "build",
]);

/**
 * Extract meaningful keywords from text
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

/**
 * Calculate similarity between two strings
 */
function similarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Exact match
  if (s1 === s2) return 1;

  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }

  // Check for common prefix
  let commonPrefix = 0;
  const minLen = Math.min(s1.length, s2.length);
  for (let i = 0; i < minLen; i++) {
    if (s1[i] === s2[i]) commonPrefix++;
    else break;
  }

  if (commonPrefix >= 3) {
    return 0.5 + (commonPrefix / Math.max(s1.length, s2.length)) * 0.3;
  }

  return 0;
}

/**
 * Find category for a domain
 */
function findDomainCategory(domain: string): string | null {
  for (const [category, domainList] of Object.entries(domainCategories)) {
    if (domainList.includes(domain)) {
      return category;
    }
  }
  return null;
}

/**
 * Infer categories from keywords
 */
function inferCategories(keywords: string[]): string[] {
  const categoryKeywords: Record<string, string[]> = {
    finance: [
      "money",
      "finance",
      "financial",
      "bank",
      "banking",
      "invest",
      "investment",
      "trade",
      "trading",
      "crypto",
      "stock",
      "stocks",
      "payment",
      "pay",
      "credit",
      "loan",
      "mortgage",
    ],
    health: [
      "health",
      "healthy",
      "fitness",
      "fit",
      "diet",
      "nutrition",
      "calorie",
      "weight",
      "medical",
      "doctor",
      "therapy",
      "wellness",
      "yoga",
      "exercise",
    ],
    social: [
      "social",
      "dating",
      "date",
      "chat",
      "message",
      "connect",
      "friend",
      "community",
      "network",
      "meet",
      "relationship",
    ],
    media: [
      "video",
      "audio",
      "music",
      "sound",
      "voice",
      "photo",
      "image",
      "camera",
      "film",
      "movie",
      "stream",
      "podcast",
      "record",
    ],
    developer: [
      "code",
      "coding",
      "developer",
      "dev",
      "programming",
      "api",
      "sdk",
      "framework",
      "library",
      "frontend",
      "backend",
      "fullstack",
    ],
    business: [
      "job",
      "jobs",
      "hire",
      "hiring",
      "recruit",
      "talent",
      "career",
      "employee",
      "employer",
      "work",
      "resume",
      "interview",
    ],
    logistics: [
      "delivery",
      "deliver",
      "ship",
      "shipping",
      "transport",
      "logistics",
      "fleet",
      "driver",
      "route",
      "tracking",
      "package",
    ],
    retail: [
      "shop",
      "shopping",
      "store",
      "retail",
      "ecommerce",
      "product",
      "fashion",
      "clothes",
      "food",
      "grocery",
      "market",
    ],
    ai: [
      "ai",
      "artificial",
      "intelligence",
      "machine",
      "learning",
      "ml",
      "neural",
      "model",
      "automation",
      "automate",
    ],
  };

  const matched: string[] = [];
  for (const [category, catKeywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (
        catKeywords.some((ck) => keyword.includes(ck) || ck.includes(keyword))
      ) {
        if (!matched.includes(category)) {
          matched.push(category);
        }
      }
    }
  }

  return matched;
}

/**
 * Match domains based on idea text
 * @param ideaText - The startup idea or project description
 * @param limit - Maximum number of domains to return (default: 4)
 * @returns Array of matched domains sorted by relevance
 */
export function matchDomains(
  ideaText: string,
  limit: number = 4
): MatchedDomain[] {
  const keywords = extractKeywords(ideaText);
  const inferredCategories = inferCategories(keywords);
  const matches: MatchedDomain[] = [];

  // Score each domain
  for (const domain of domains) {
    let score = 0;
    let matchType: MatchedDomain["matchType"] = "fallback";

    // Check for exact keyword match
    for (const keyword of keywords) {
      const sim = similarity(keyword, domain);
      if (sim === 1) {
        score = Math.max(score, 100);
        matchType = "exact";
      } else if (sim >= 0.8) {
        score = Math.max(score, 80);
        if (matchType !== "exact") matchType = "partial";
      } else if (sim >= 0.5) {
        score = Math.max(score, 50 + sim * 20);
        if (matchType === "fallback") matchType = "partial";
      }
    }

    // Check category match
    const domainCategory = findDomainCategory(domain);
    if (domainCategory && inferredCategories.includes(domainCategory)) {
      score = Math.max(score, 40);
      if (matchType === "fallback") matchType = "category";
    }

    // Check if any keyword is contained in domain or vice versa
    for (const keyword of keywords) {
      if (domain.includes(keyword) || keyword.includes(domain)) {
        score = Math.max(score, 60);
        if (matchType === "fallback") matchType = "partial";
      }
    }

    if (score > 0) {
      matches.push({
        domain,
        fullDomain: `${domain}.ai`,
        score,
        matchType,
      });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  // If we don't have enough matches, add some fallback domains
  if (matches.length < limit) {
    const fallbackDomains = ["engine", "rocket", "algorithm", "autopilot"];
    for (const domain of fallbackDomains) {
      if (matches.length >= limit) break;
      if (!matches.find((m) => m.domain === domain)) {
        matches.push({
          domain,
          fullDomain: `${domain}.ai`,
          score: 10,
          matchType: "fallback",
        });
      }
    }
  }

  return matches.slice(0, limit);
}

/**
 * Get the best matching domain for a given idea
 */
export function getBestDomain(ideaText: string): MatchedDomain | null {
  const matches = matchDomains(ideaText, 1);
  return matches.length > 0 ? matches[0] : null;
}

