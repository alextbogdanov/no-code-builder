// ============================================================================
// ### IMPORTS ###
// ============================================================================
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ============================================================================
// ### MUTATIONS ###
// ============================================================================
export const updateUserName = mutation({
	args: {
		displayName: v.string(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		await ctx.db.patch(userId, {
			displayName: args.displayName,
			onboardingComplete: true,
		});

		return { success: true };
	},
});

export const completeOnboarding = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		await ctx.db.patch(userId, {
			onboardingComplete: true,
		});

		return { success: true };
	},
});

