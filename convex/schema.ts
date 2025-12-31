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
});

// ============================================================================
// ### EXPORT ###
// ============================================================================
export default schema;
