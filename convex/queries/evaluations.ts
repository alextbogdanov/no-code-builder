// ============================================================================
// ### IMPORTS ###
// ============================================================================
import { query } from "../_generated/server";
import { v } from "convex/values";

// ============================================================================
// ### QUERIES ###
// ============================================================================

/**
 * Get evaluation by slug (for SEO pages)
 */
export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const evaluation = await ctx.db
      .query("evaluations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    return evaluation;
  },
});

/**
 * Get evaluation by ID
 */
export const getById = query({
  args: {
    id: v.id("evaluations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get recent evaluations (for browse/discovery)
 */
export const getRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const evaluations = await ctx.db
      .query("evaluations")
      .withIndex("by_created")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .order("desc")
      .take(limit);

    return evaluations;
  },
});

/**
 * Get count of similar ideas (for FOMO)
 */
export const getSimilarCount = query({
  args: {
    excludeId: v.optional(v.id("evaluations")),
  },
  handler: async (ctx, args) => {
    const evaluations = await ctx.db
      .query("evaluations")
      .withIndex("by_status")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    const count = args.excludeId
      ? evaluations.filter((e) => e._id !== args.excludeId).length
      : evaluations.length;

    return count;
  },
});


