import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  buildEvaluationPrompt,
  generateSlug,
  extractShortTitle,
  extractDomainsFromAnalysis,
  extractCategory,
  extractScore,
} from "@/lib/evaluation-prompt";
import { generateSeoMetadata } from "@/lib/seo-generator";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/evaluate-idea - Streaming Market Analysis
 *
 * No authentication required for evaluation (open access).
 * Uses OpenAI for streaming text generation.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idea } = body;

    if (!idea || typeof idea !== "string") {
      return NextResponse.json({ error: "Idea is required" }, { status: 400 });
    }

    const trimmedIdea = idea.trim();
    if (trimmedIdea.length < 10) {
      return NextResponse.json(
        { error: "Idea must be at least 10 characters" },
        { status: 400 }
      );
    }

    if (trimmedIdea.length > 500) {
      return NextResponse.json(
        { error: "Idea must be at most 500 characters" },
        { status: 400 }
      );
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Generate slug and metadata
    const slug = generateSlug(trimmedIdea);
    const shortTitle = extractShortTitle(trimmedIdea);

    // Create evaluation record in Convex (pending state)
    const evaluationId = await convex.mutation(
      api.mutations.evaluations.createEvaluation,
      {
        idea: trimmedIdea,
        slug,
        shortTitle,
      }
    );

    // Build the evaluation prompt
    const prompt = buildEvaluationPrompt(trimmedIdea);

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = "";

        try {
          // Update status to processing
          await convex.mutation(api.mutations.evaluations.updateEvaluation, {
            id: evaluationId,
            status: "processing",
          });

          // Send initial metadata
          const initData = JSON.stringify({
            type: "init",
            slug,
            shortTitle,
          });
          controller.enqueue(encoder.encode(`data: ${initData}\n\n`));

          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are a startup evaluation expert. Provide comprehensive, actionable market analysis.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: 2000,
            temperature: 0.7,
            stream: true,
          });

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              fullContent += content;

              // Send as SSE format (matching december format)
              const data = JSON.stringify({
                type: "chunk",
                content,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Extract metadata from completed analysis
          const domains = extractDomainsFromAnalysis(fullContent);
          const category = extractCategory(fullContent);
          const score = extractScore(fullContent);

          // Save completed evaluation to Convex
          await convex.mutation(api.mutations.evaluations.completeEvaluation, {
            id: evaluationId,
            analysis: fullContent,
            category,
            domains,
            score,
          });

          // Generate SEO metadata asynchronously (non-blocking)
          // This runs in the background and doesn't delay the response
          generateSeoMetadata(trimmedIdea, fullContent)
            .then(async (seoMetadata) => {
              // Update evaluation with AI-generated SEO metadata
              await convex.mutation(
                api.mutations.evaluations.updateSeoMetadata,
                {
                  id: evaluationId,
                  shortTitle: seoMetadata.short_title,
                  keywordSummary: seoMetadata.keyword_summary,
                  category: seoMetadata.category || category || undefined,
                }
              );
            })
            .catch((error) => {
              // Log error but don't fail the request
              console.error("Error generating SEO metadata:", error);
            });

          // Send completion message with evaluation data
          const doneData = JSON.stringify({
            type: "done",
            evaluation: {
              slug,
              shortTitle,
              category,
              domains,
              score,
            },
          });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
        } catch (error) {
          console.error("Streaming error:", error);

          // Mark evaluation as failed
          await convex.mutation(api.mutations.evaluations.updateEvaluation, {
            id: evaluationId,
            status: "failed",
          });

          const errorData = JSON.stringify({
            type: "error",
            error: "Failed to generate evaluation",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Evaluation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

