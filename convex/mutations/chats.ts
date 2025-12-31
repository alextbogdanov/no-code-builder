// ============================================================================
// ### IMPORTS ###
// ============================================================================
import { v } from "convex/values";
import { mutation, internalMutation, action } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ============================================================================
// ### CONVEX ###
// ============================================================================
import { chatMessageValidator } from "../schema/chats";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

// ============================================================================
// ### TYPES ###
// ============================================================================
type FileMap = Record<string, string>;

// ============================================================================
// ### MUTATIONS ###
// ============================================================================

/**
 * Get current authenticated user ID (for use by actions)
 */
export const getAuthenticatedUserId = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return userId;
  },
});

/**
 * Internal version - get current authenticated user ID (for use by internal actions)
 */
export const getAuthenticatedUserIdInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return userId;
  },
});

/**
 * Create a new chat with initial message
 */
export const createChat = mutation({
  args: {
    name: v.string(),
    initialMessage: v.string(),
    selectedModel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const messageId = `${now}-${Math.random().toString(36).substring(2, 9)}`;

    const chatId = await ctx.db.insert("chats", {
      userId,
      name: args.name,
      messages: [
        {
          id: messageId,
          role: "user",
          content: args.initialMessage,
          timestamp: now,
          status: "complete",
        },
      ],
      selectedModel: args.selectedModel,
      createdAt: now,
      updatedAt: now,
    });

    return chatId;
  },
});

/**
 * Add a message to an existing chat
 */
export const addMessage = mutation({
  args: {
    chatId: v.id("chats"),
    message: chatMessageValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    if (chat.userId !== userId) {
      throw new Error("Not authorized");
    }

    const messages = [...chat.messages, args.message];

    await ctx.db.patch(args.chatId, {
      messages,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update the r2Key for a chat (called by the R2 upload action)
 */
export const updateChatR2Key = internalMutation({
  args: {
    chatId: v.id("chats"),
    r2Key: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chatId, {
      r2Key: args.r2Key,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Update the latest code files for a chat by uploading to R2.
 * This action uploads files to R2 and updates the chat with the r2Key.
 * Auth is verified by checking the user owns the chat.
 */
export const updateChatFiles = action({
  args: {
    chatId: v.id("chats"),
    files: v.any(), // FileMap type
  },
  handler: async (ctx, args): Promise<{ r2Key: string; filesStored: number }> => {
    // Verify the user is authenticated and owns the chat
    const userId: Id<"users"> = await ctx.runMutation(
      internal.mutations.chats.getAuthenticatedUserIdInternal
    );
    
    // Check chat ownership
    const ownership: { valid: boolean; error?: string } = await ctx.runQuery(
      internal.queries.chats.verifyChatOwnership,
      { chatId: args.chatId, userId }
    );
    
    if (!ownership.valid) {
      throw new Error(ownership.error || "Not authorized");
    }
    
    const files = args.files as FileMap;
    const chatIdStr = args.chatId as string;
    
    // Upload files to R2
    const r2Key: string = await ctx.runAction(internal.r2.storeProjectFiles, {
      chatId: chatIdStr,
      files,
    });
    
    // Update the chat with the r2Key
    await ctx.runMutation(internal.mutations.chats.updateChatR2Key, {
      chatId: args.chatId,
      r2Key,
    });
    
    return { r2Key, filesStored: Object.keys(files).length };
  },
});

/**
 * Update chat deployment info
 */
export const updateDeployment = mutation({
  args: {
    chatId: v.id("chats"),
    deploymentUrl: v.optional(v.string()),
    sandboxId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    if (chat.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.chatId, {
      deploymentUrl: args.deploymentUrl,
      sandboxId: args.sandboxId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update chat selected model
 */
export const updateSelectedModel = mutation({
  args: {
    chatId: v.id("chats"),
    selectedModel: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    if (chat.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.chatId, {
      selectedModel: args.selectedModel,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a chat and its R2 files.
 * Auth is verified by checking the user owns the chat.
 */
export const deleteChat = action({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    // Verify the user is authenticated and owns the chat
    const userId = await ctx.runMutation(
      internal.mutations.chats.getAuthenticatedUserIdInternal
    );
    
    // Check chat ownership and get chat data
    const ownership = await ctx.runQuery(
      internal.queries.chats.verifyChatOwnership,
      { chatId: args.chatId, userId }
    );
    
    if (!ownership.valid || !ownership.chat) {
      throw new Error(ownership.error || "Not authorized");
    }
    
    const chat = ownership.chat;
    
    // Delete files from R2 if they exist
    if (chat.r2Key) {
      await ctx.runAction(internal.r2.deleteProjectFiles, {
        r2Key: chat.r2Key,
      });
    }
    
    // Delete the chat from the database
    await ctx.runMutation(internal.mutations.chats.deleteChatInternal, {
      chatId: args.chatId,
    });
    
    return { success: true };
  },
});

/**
 * Internal mutation to delete a chat (called by deleteChat action)
 */
export const deleteChatInternal = internalMutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.chatId);
    return { success: true };
  },
});
