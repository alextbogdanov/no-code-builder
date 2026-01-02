// ============================================================================
// ### IMPORTS ###
// ============================================================================
import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

// ============================================================================
// ### DEFINITIONS ###
// ============================================================================
import { chatTables } from "./schema/chats";

// ============================================================================
// ### SCHEMA ###
// ============================================================================
const schema = defineSchema({
  ...authTables,
  // Override the users table to add custom fields
  users: defineTable({
    // Auth fields (from authTables)
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.float64()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    // Custom fields
    displayName: v.optional(v.string()), // User's chosen display name
    onboardingComplete: v.optional(v.boolean()), // Whether user has completed onboarding
  }).index("email", ["email"]),
  ...chatTables,

  // Evaluations table for market analysis results
  evaluations: defineTable({
    // The startup idea text
    idea: v.string(),
    // SEO-friendly slug for public page
    slug: v.string(),
    // Short title extracted from analysis
    shortTitle: v.optional(v.string()),
    // SEO keyword summary (max 160 chars for meta description)
    keywordSummary: v.optional(v.string()),
    // Category of the idea (e.g., "SaaS", "E-commerce")
    category: v.optional(v.string()),
    // Full analysis text (streamed content)
    analysis: v.optional(v.string()),
    // Suggested .ai domains
    domains: v.optional(v.array(v.string())),
    // Overall score (1-10)
    score: v.optional(v.float64()),
    // Processing status
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    // Optional user who created this (null for anonymous)
    userId: v.optional(v.id("users")),
    // Timestamps
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index("by_slug", ["slug"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),
});

// ============================================================================
// ### EXPORT ###
// ============================================================================
export default schema;
