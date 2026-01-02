// ============================================================================
// ### IMPORTS ###
// ============================================================================
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ============================================================================
// ### MUTATIONS ###
// ============================================================================

/**
 * Create a new evaluation (initial pending state)
 */
export const createEvaluation = mutation({
  args: {
    idea: v.string(),
    slug: v.string(),
    shortTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // User is optional - evaluations are open to all
    const userId = await getAuthUserId(ctx);

    const now = Date.now();
    const evaluationId = await ctx.db.insert("evaluations", {
      idea: args.idea,
      slug: args.slug,
      shortTitle: args.shortTitle,
      status: "pending",
      userId: userId || undefined,
      createdAt: now,
      updatedAt: now,
    });

    return evaluationId;
  },
});

/**
 * Update evaluation with analysis results
 */
export const updateEvaluation = mutation({
  args: {
    id: v.id("evaluations"),
    analysis: v.optional(v.string()),
    category: v.optional(v.string()),
    domains: v.optional(v.array(v.string())),
    score: v.optional(v.float64()),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Mark evaluation as completed with full results
 */
export const completeEvaluation = mutation({
  args: {
    id: v.id("evaluations"),
    analysis: v.string(),
    category: v.optional(v.string()),
    domains: v.optional(v.array(v.string())),
    score: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;

    await ctx.db.patch(id, {
      ...data,
      status: "completed",
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Update evaluation with SEO metadata (called async after analysis completes)
 */
export const updateSeoMetadata = mutation({
  args: {
    id: v.id("evaluations"),
    shortTitle: v.optional(v.string()),
    keywordSummary: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});


