// ============================================================================
// ### IMPORTS ###
// ============================================================================
import { defineTable } from "convex/server";
import { v } from "convex/values";

// ============================================================================
// ### TYPES ###
// ============================================================================
/**
 * Chat message validator for storing in the messages array
 */
export const chatMessageValidator = v.object({
  id: v.string(),
  role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
  content: v.string(),
  timestamp: v.float64(),
  status: v.optional(v.union(
    v.literal("pending"),
    v.literal("streaming"),
    v.literal("complete"),
    v.literal("error")
  )),
});

// ============================================================================
// ### DEFINITIONS ###
// ============================================================================
export const chatTables = {
  /**
   * Chats table - stores the full chat history and R2 reference for code
   * 
   * Each chat represents a project/conversation with the AI.
   * Messages are stored as an array for efficient retrieval of full history.
   * Code files are stored in R2 and referenced by r2Key.
   */
  chats: defineTable({
    // User reference
    userId: v.id("users"),
    
    // Project name/title
    name: v.string(),
    
    // Full chat history - array of messages
    messages: v.array(chatMessageValidator),
    
    // R2 key for the latest code version (stored as JSON in R2)
    // This references the files stored in the R2 bucket
    r2Key: v.optional(v.string()),
    
    // Selected AI model for this chat
    selectedModel: v.optional(v.string()),
    
    // Deployment URL if deployed
    deploymentUrl: v.optional(v.string()),
    
    // Sandbox ID for E2B deployment
    sandboxId: v.optional(v.string()),
    
    // Timestamps
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index("userId", ["userId"])
    .index("userId_updatedAt", ["userId", "updatedAt"]),
};
