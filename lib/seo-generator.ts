// =============================================================================
// SEO METADATA GENERATOR - Ported from december/startupai
// =============================================================================

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Tech categories for SEO classification
const TECH_CATEGORIES = [
  "AI & Machine Learning",
  "SaaS & Cloud",
  "E-commerce & Retail",
  "FinTech & Banking",
  "HealthTech & Medical",
  "EdTech & Learning",
  "MarketingTech & AdTech",
  "Social & Community",
  "Productivity & Tools",
  "Gaming & Entertainment",
  "Real Estate & PropTech",
  "FoodTech & AgriTech",
  "Transportation & Logistics",
  "HR & Recruiting",
  "Legal & Compliance",
  "Security & Privacy",
  "IoT & Hardware",
  "Media & Content",
  "Travel & Hospitality",
  "Other",
];

export interface SeoMetadata {
  short_title: string;
  keyword_summary: string;
  category: string;
  suggested_domains: string[];
}

/**
 * Generate SEO metadata from startup idea evaluation content
 * Uses OpenAI to extract and generate SEO-friendly metadata
 */
export async function generateSeoMetadata(
  userInput: string,
  aiResponse: string
): Promise<SeoMetadata> {
  const categoriesList = TECH_CATEGORIES.map(
    (cat, index) => `${index + 1}. ${cat}`
  ).join("\n");

  const prompt = `
You are an SEO specialist tasked with extracting and generating SEO-friendly metadata from a startup idea evaluation.

The evaluation consists of a user input (the idea) and an AI response (the evaluation).

User Input:
${userInput}

AI Response:
${aiResponse.substring(0, 3000)}

Based on this content, generate the following metadata in JSON format:

1. short_title: A concise, SEO-friendly title (max 60 characters)
2. keyword_summary: A keyword-rich summary (max 160 characters)
3. category: The main business category - you MUST choose ONE category from the following list:
${categoriesList}
4. suggested_domains: Extract the exact domain suggestions from the AI response (array of strings ending in .ai)

Return ONLY the JSON object with these fields, nothing else. No markdown formatting, just raw JSON.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || "{}";

    // Try to parse JSON, handling potential markdown code blocks
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.slice(7);
    }
    if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.slice(3);
    }
    if (cleanedResponse.endsWith("```")) {
      cleanedResponse = cleanedResponse.slice(0, -3);
    }
    cleanedResponse = cleanedResponse.trim();

    const metadata = JSON.parse(cleanedResponse);

    // Validate category
    if (metadata.category && !TECH_CATEGORIES.includes(metadata.category)) {
      // Find closest match or default to "Other"
      metadata.category = "Other";
    }

    // Extract domains from response if not provided
    if (
      !metadata.suggested_domains ||
      !Array.isArray(metadata.suggested_domains) ||
      metadata.suggested_domains.length === 0
    ) {
      const domainRegex = /([a-zA-Z0-9-]+\.ai)/g;
      const domains = aiResponse.match(domainRegex) || [];
      metadata.suggested_domains = Array.from(new Set(domains));
    }

    return {
      short_title: metadata.short_title || "Startup Idea Analysis",
      keyword_summary: metadata.keyword_summary || userInput.substring(0, 160),
      category: metadata.category || "Other",
      suggested_domains: metadata.suggested_domains || [],
    };
  } catch (error) {
    console.error("Error generating SEO metadata:", error);
    // Return fallback metadata
    return {
      short_title: "Startup Idea Analysis",
      keyword_summary: userInput.substring(0, 160),
      category: "Other",
      suggested_domains: [],
    };
  }
}

