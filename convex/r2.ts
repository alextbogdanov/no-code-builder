// ============================================================================
// ### IMPORTS ###
// ============================================================================
import { v } from "convex/values";
import { R2 } from "@convex-dev/r2";
import { internalAction, internalQuery } from "./_generated/server";

// ============================================================================
// ### CONVEX ###
// ============================================================================
import { components, internal } from "./_generated/api";

// ============================================================================
// ### TYPES ###
// ============================================================================
type FileMap = Record<string, string>;

// ============================================================================
// ### R2 CLIENT ###
// ============================================================================
/**
 * R2 client instance for Cloudflare R2 storage.
 * 
 * Required environment variables (set via npx convex env set):
 * - R2_BUCKET: Cloudflare R2 bucket name
 * - R2_ENDPOINT: R2 endpoint URL (https://<account-id>.r2.cloudflarestorage.com)
 * - R2_ACCESS_KEY_ID: R2 access key ID
 * - R2_SECRET_ACCESS_KEY: R2 secret access key
 */
export const r2 = new R2(components.r2);

// ============================================================================
// ### CLIENT API ###
// ============================================================================
/**
 * Expose the client API for direct uploads from the frontend.
 */
export const { generateUploadUrl, syncMetadata } = r2.clientApi({
  checkUpload: async () => {
    // Allow all authenticated uploads for now
    // Add auth checks here if needed
  },
  onUpload: async (ctx, bucket, key) => {
    console.log(`File uploaded to R2: ${bucket}/${key}`);
  },
});

// ============================================================================
// ### INTERNAL ACTIONS ###
// ============================================================================
/**
 * Store project files to R2 as a JSON blob.
 * This is called from mutations to upload files to R2.
 * 
 * @param chatId - The chat ID to use as part of the R2 key
 * @param files - The FileMap (Record<string, string>) containing all project files
 * @returns The R2 key for the stored files
 */
export const storeProjectFiles = internalAction({
  args: {
    chatId: v.string(),
    files: v.any(), // FileMap type - Record<string, string>
  },
  handler: async (ctx, args): Promise<string> => {
    const files = args.files as FileMap;
    
    // Create a unique key for this version of the files
    const timestamp = Date.now();
    const r2Key = `projects/${args.chatId}/${timestamp}.json`;
    
    // Convert files to JSON blob
    const filesJson = JSON.stringify(files);
    const blob = new Blob([filesJson], { type: "application/json" });
    
    // Store in R2
    await r2.store(ctx, blob, {
      key: r2Key,
      type: "application/json",
    });
    
    return r2Key;
  },
});

/**
 * Get project files from R2.
 * 
 * @param r2Key - The R2 key for the stored files
 * @returns The FileMap or null if not found
 */
export const getProjectFiles = internalAction({
  args: {
    r2Key: v.string(),
  },
  handler: async (ctx, args): Promise<FileMap | null> => {
    try {
      // Get signed URL for the file
      const url = await r2.getUrl(args.r2Key);
      
      // Fetch the file content
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch files from R2: ${response.status}`);
        return null;
      }
      
      const filesJson = await response.text();
      return JSON.parse(filesJson) as FileMap;
    } catch (error) {
      console.error("Failed to get project files from R2:", error);
      return null;
    }
  },
});

/**
 * Delete project files from R2.
 * 
 * @param r2Key - The R2 key for the stored files
 */
export const deleteProjectFiles = internalAction({
  args: {
    r2Key: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    try {
      await r2.deleteObject(ctx, args.r2Key);
    } catch (error) {
      console.error("Failed to delete project files from R2:", error);
    }
  },
});

// ============================================================================
// ### INTERNAL QUERIES ###
// ============================================================================
/**
 * Get a signed URL for accessing files in R2.
 * 
 * @param r2Key - The R2 key for the stored files
 * @returns The signed URL or null if not found
 */
export const getSignedUrl = internalQuery({
  args: {
    r2Key: v.string(),
  },
  handler: async (ctx, args): Promise<string | null> => {
    try {
      return await r2.getUrl(args.r2Key, { expiresIn: 3600 }); // 1 hour expiry
    } catch (error) {
      console.error("Failed to get signed URL:", error);
      return null;
    }
  },
});
