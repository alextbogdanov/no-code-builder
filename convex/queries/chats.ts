// ============================================================================
// ### IMPORTS ###
// ============================================================================
import { v } from "convex/values";
import { query, internalQuery, action } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ============================================================================
// ### CONVEX ###
// ============================================================================
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

// ============================================================================
// ### QUERIES ###
// ============================================================================

/**
 * Verify user owns the chat (for use in actions)
 */
export const verifyChatOwnership = internalQuery({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      return { valid: false, error: "Chat not found" };
    }
    if (chat.userId !== args.userId) {
      return { valid: false, error: "Not authorized" };
    }
    return { valid: true, chat };
  },
});

/**
 * Get a single chat by ID
 */
export const getChat = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      return null;
    }

    return chat;
  },
});

/**
 * Internal query to get chat without auth check (for internal use)
 */
export const getChatInternal = internalQuery({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chatId);
  },
});

// ============================================================================
// ### TYPES ###
// ============================================================================
type FileMap = Record<string, string>;

/**
 * Get chat files from R2.
 * This is an action because it needs to make HTTP calls to R2.
 * Auth is verified by checking the user owns the chat.
 */
export const getChatFiles = action({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args): Promise<FileMap> => {
    // Verify the user is authenticated and owns the chat
    const userId: Id<"users"> = await ctx.runMutation(
      internal.mutations.chats.getAuthenticatedUserIdInternal
    );
    
    // Check chat ownership and get chat data
    const ownership: { valid: boolean; error?: string; chat?: { r2Key?: string } } = await ctx.runQuery(
      internal.queries.chats.verifyChatOwnership,
      { chatId: args.chatId, userId }
    );
    
    if (!ownership.valid || !ownership.chat) {
      throw new Error(ownership.error || "Not authorized");
    }
    
    const chat = ownership.chat;
    
    if (!chat.r2Key) {
      return {};
    }
    
    // Fetch files from R2
    const files: FileMap | null = await ctx.runAction(internal.r2.getProjectFiles, {
      r2Key: chat.r2Key,
    });
    
    return files || {};
  },
});

/**
 * List all chats for the current user
 */
export const listChats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const chats = await ctx.db
      .query("chats")
      .withIndex("userId_updatedAt", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Return chats without the full messages array for listing
    return chats.map((chat) => ({
      _id: chat._id,
      _creationTime: chat._creationTime,
      name: chat.name,
      selectedModel: chat.selectedModel,
      deploymentUrl: chat.deploymentUrl,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messageCount: chat.messages.length,
      hasFiles: !!chat.r2Key,
      // Include last message preview
      lastMessage: chat.messages.length > 0 
        ? chat.messages[chat.messages.length - 1].content.substring(0, 100)
        : null,
    }));
  },
});

/**
 * Get the current user's chat count
 */
export const getChatCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }

    const chats = await ctx.db
      .query("chats")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    return chats.length;
  },
});
