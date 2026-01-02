// ============================================================================
// ### IMPORTS ###
// ============================================================================

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import OpenAI from 'openai';
import { Sandbox } from '@e2b/code-interpreter';

// ============================================================================
// ### TYPES ###
// ============================================================================

import type { FileMap, GenerateRequest, ModelId, LLMProvider, ModelConfig } from '@/types/project';

// ============================================================================
// ### CONSTANTS ###
// ============================================================================

import { SYSTEM_PROMPT, ENHANCER_SYSTEM_PROMPT } from '@/lib/constants';

/**
 * Available models configuration
 * Order determines fallback priority
 */
const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'claude-sonnet-4-5',
    provider: 'anthropic',
    name: 'Claude Sonnet 4.5',
    description: 'Anthropic\'s most capable model for coding',
    maxTokens: 32768,
  },
  {
    id: 'gemini-3-pro',
    provider: 'google',
    name: 'Gemini 3 Pro',
    description: 'Google\'s latest reasoning model',
    maxTokens: 65536,
  },
  {
    id: 'gpt-5',
    provider: 'openai',
    name: 'GPT-5',
    description: 'OpenAI\'s most advanced model',
    maxTokens: 32768,
  },
];

/**
 * Default model to use
 */
const DEFAULT_MODEL_ID: ModelId = 'claude-sonnet-4-5';

/**
 * Fallback order for providers
 */
const FALLBACK_ORDER: ModelId[] = ['claude-sonnet-4-5', 'gemini-3-pro', 'gpt-5'];

// ============================================================================
// ### CONFIGURATIONS ###
// ============================================================================

// Use Node.js runtime for crypto module and longer execution time
export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for AI generation + deployment

// ============================================================================
// ### HELPERS ###
// ============================================================================

/**
 * Create a Server-Sent Events encoder
 */
function createSSEEncoder() {
  const encoder = new TextEncoder();

  return {
    encode: (event: string, data: unknown) => {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      return encoder.encode(payload);
    },
  };
}

/**
 * Result of parsing AI response - includes partial results and incomplete file info
 */
interface ParseResult {
  message: string;
  files: FileMap;
  isComplete: boolean;
  incompleteFile?: string; // The file path that was truncated
}

/**
 * Clean content by removing markdown code blocks
 */
function cleanAIContent(content: string): string {
  let cleanContent = content.trim();
  
  // Remove markdown code block wrapper if present (handle various formats)
  const codeBlockPatterns = [
    /^```json\s*/i,
    /^```javascript\s*/i,
    /^```js\s*/i,
    /^```\s*/,
  ];
  
  for (const pattern of codeBlockPatterns) {
    if (pattern.test(cleanContent)) {
      cleanContent = cleanContent.replace(pattern, '');
      break;
    }
  }
  
  // Remove trailing code block marker
  if (cleanContent.endsWith('```')) {
    cleanContent = cleanContent.slice(0, -3);
  }
  
  return cleanContent.trim();
}

/**
 * Try to extract complete files from a truncated JSON response
 * Returns the files that were successfully parsed and identifies the incomplete file
 */
function extractPartialFiles(content: string): ParseResult {
  console.log('[Parse] Attempting partial file extraction from truncated JSON...');
  
  const files: FileMap = {};
  let message = 'Changes applied successfully';
  let incompleteFile: string | undefined;
  
  // Try to extract the message field first
  const messageMatch = content.match(/"message"\s*:\s*"([^"]+)"/);
  if (messageMatch) {
    message = messageMatch[1];
  }
  
  // Find the start of the files object
  const filesStartMatch = content.match(/"files"\s*:\s*\{/);
  if (!filesStartMatch || filesStartMatch.index === undefined) {
    console.log('[Parse] Could not find files object');
    return { message, files: {}, isComplete: false };
  }
  
  const filesStart = filesStartMatch.index + filesStartMatch[0].length;
  const filesContent = content.substring(filesStart);
  
  // Regex to match individual file entries: "filename": "content"
  // This captures the file path and starts looking for the content
  const fileEntryRegex = /"([^"]+\.(?:json|js|jsx|ts|tsx|css|html|md|txt))"\s*:\s*"/g;
  
  let match;
  let lastSuccessfulEnd = 0;
  const fileEntries: Array<{ path: string; startIndex: number }> = [];
  
  // First, find all file entry positions
  while ((match = fileEntryRegex.exec(filesContent)) !== null) {
    fileEntries.push({
      path: match[1],
      startIndex: match.index + match[0].length,
    });
  }
  
  console.log(`[Parse] Found ${fileEntries.length} file entries to extract`);
  
  // Now try to extract content for each file
  for (let i = 0; i < fileEntries.length; i++) {
    const entry = fileEntries[i];
    const startIdx = entry.startIndex;
    
    // Find the end of this file's content (the closing quote followed by comma or closing brace)
    // We need to handle escaped quotes within the content
    let endIdx = startIdx;
    let depth = 0;
    let inString = true;
    let escaped = false;
    
    for (let j = startIdx; j < filesContent.length; j++) {
      const char = filesContent[j];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if (char === '"' && inString) {
        // Check if this is the end of the string value
        // Look ahead to see if followed by comma, }, or whitespace then comma/}
        const remaining = filesContent.substring(j + 1).trimStart();
        if (remaining.startsWith(',') || remaining.startsWith('}')) {
          // This is the end of the file content
          endIdx = j;
          break;
        }
      }
    }
    
    if (endIdx > startIdx) {
      // Successfully found the complete file content
      const fileContent = filesContent.substring(startIdx, endIdx);
      
      // Unescape the JSON string content
      try {
        // Parse as a JSON string to properly unescape
        const unescapedContent = JSON.parse(`"${fileContent}"`);
        files[entry.path] = unescapedContent;
        lastSuccessfulEnd = endIdx;
        console.log(`[Parse] ✓ Extracted: ${entry.path} (${unescapedContent.length} chars)`);
      } catch (e) {
        // If this fails, this might be the truncated file
        console.log(`[Parse] ✗ Failed to unescape: ${entry.path} - likely truncated`);
        incompleteFile = entry.path;
        break;
      }
    } else {
      // Could not find end - this file is truncated
      console.log(`[Parse] ✗ Truncated file detected: ${entry.path}`);
      incompleteFile = entry.path;
      break;
    }
  }
  
  const extractedCount = Object.keys(files).length;
  console.log(`[Parse] Extracted ${extractedCount}/${fileEntries.length} files successfully`);
  
  if (incompleteFile) {
    console.log(`[Parse] Incomplete file: ${incompleteFile}`);
  }
  
  return {
    message,
    files,
    isComplete: extractedCount === fileEntries.length && !incompleteFile,
    incompleteFile,
  };
}

/**
 * Parse the AI response to extract files and message
 * Now returns partial results when JSON is truncated
 */
function parseAIResponse(content: string): ParseResult {
  console.log('=== AI RAW RESPONSE START ===');
  console.log(content.substring(0, 2000)); // Log first 2000 chars for debugging
  console.log('=== AI RAW RESPONSE END (truncated) ===');
  
  try {
    const cleanContent = cleanAIContent(content);
    console.log('Cleaned content (first 500 chars):', cleanContent.substring(0, 500));

    // Try to parse as JSON directly
    const parsed = JSON.parse(cleanContent);
    console.log('Successfully parsed JSON. Keys:', Object.keys(parsed));
    console.log('Files count:', Object.keys(parsed.files || {}).length);
    
    return {
      message: parsed.message || 'Changes applied successfully',
      files: parsed.files || {},
      isComplete: true,
    };
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    
    // If parsing fails, try to extract JSON from the content
    const jsonMatch = content.match(/\{[\s\S]*"files"[\s\S]*\}/);
    if (jsonMatch) {
      console.log('Found JSON match with regex, attempting parse...');
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Regex extraction successful. Files count:', Object.keys(parsed.files || {}).length);
        return {
          message: parsed.message || 'Changes applied successfully',
          files: parsed.files || {},
          isComplete: true,
        };
      } catch (regexParseError) {
        console.error('Regex JSON parse failed:', regexParseError);
      }
    }

    // JSON is truncated - try to extract partial files
    console.log('[Parse] Attempting partial extraction from truncated response...');
    return extractPartialFiles(content);
  }
}

/**
 * Get model config by ID
 */
function getModelConfig(modelId: ModelId): ModelConfig {
  const config = AVAILABLE_MODELS.find(m => m.id === modelId);
  if (!config) {
    throw new Error(`Unknown model: ${modelId}`);
  }
  return config;
}

/**
 * Check if a provider has a configured API key
 */
function isProviderConfigured(provider: LLMProvider): boolean {
  switch (provider) {
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY;
    case 'google':
      return !!process.env.GOOGLE_AI_API_KEY;
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    default:
      return false;
  }
}

/**
 * Create Anthropic client instance
 */
function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  return new Anthropic({
    apiKey,
  });
}

/**
 * Create Google GenAI client instance
 */
function getGoogleClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not configured');
  }

  return new GoogleGenAI({ apiKey });
}

/**
 * Create OpenAI client instance
 */
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  return new OpenAI({ apiKey });
}

/**
 * Enhance the user prompt to make it more specific and actionable
 * Uses the specified model's provider, with fallback to any available provider
 */
async function enhancePrompt(userMessage: string, modelId: ModelId = DEFAULT_MODEL_ID): Promise<string> {
  const enhancerPrompt = `Enhance this prompt for generating a complete web application:

<original_prompt>
${userMessage}
</original_prompt>

Remember: Only output the enhanced prompt text, nothing else.`;

  // Try providers in order until one succeeds
  const config = getModelConfig(modelId);
  const providersToTry: LLMProvider[] = [config.provider, 'anthropic', 'google', 'openai']
    .filter((v, i, a) => a.indexOf(v) === i) as LLMProvider[]; // Remove duplicates

  for (const provider of providersToTry) {
    if (!isProviderConfigured(provider)) {
      continue;
    }

    try {
      let enhancedPrompt = '';

      switch (provider) {
        case 'anthropic': {
          const client = getAnthropicClient();
          const response = await client.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: 1024,
            system: ENHANCER_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: enhancerPrompt }],
          });
          enhancedPrompt = response.content[0]?.type === 'text' 
            ? response.content[0].text 
            : '';
          break;
        }
        case 'google': {
          const client = getGoogleClient();
          const response = await client.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `${ENHANCER_SYSTEM_PROMPT}\n\n${enhancerPrompt}`,
            config: {
              maxOutputTokens: 1024,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });
          enhancedPrompt = response.text || '';
          break;
        }
        case 'openai': {
          const client = getOpenAIClient();
          const response = await client.chat.completions.create({
            model: 'gpt-5',
            max_completion_tokens: 1024,
            messages: [
              { role: 'system', content: ENHANCER_SYSTEM_PROMPT },
              { role: 'user', content: enhancerPrompt },
            ],
          });
          enhancedPrompt = response.choices[0]?.message?.content || '';
          break;
        }
      }

      if (enhancedPrompt && enhancedPrompt.trim().length > 0) {
        return enhancedPrompt.trim();
      }
    } catch (error) {
      console.error(`Prompt enhancement with ${provider} failed:`, error);
      // Continue to next provider
    }
  }

  // All providers failed, return original
  console.log('All prompt enhancement providers failed, using original');
  return userMessage;
}

/**
 * System prompt for regenerating a single file
 */
const SINGLE_FILE_SYSTEM_PROMPT = `You are an expert software developer. Your task is to generate the content for a SINGLE file that was truncated or failed to generate.

CRITICAL RULES:
1. Return ONLY the raw file content - no JSON wrapper, no explanations
2. Do NOT include any markdown code blocks (\`\`\`) 
3. The output should be EXACTLY what goes in the file - nothing more, nothing less
4. Make sure the code is complete and functional
5. Match the style and conventions of the existing codebase

Return the complete, untruncated file content.`;

/**
 * Regenerate a single file that was truncated (using streaming to avoid timeout)
 */
async function regenerateSingleFile(
  filePath: string,
  existingFiles: FileMap,
  originalPrompt: string,
  modelId: ModelId = DEFAULT_MODEL_ID
): Promise<string> {
  console.log(`[Retry] Regenerating single file: ${filePath} using ${modelId}`);
  
  // Build context from existing files
  const filesContext = Object.entries(existingFiles)
    .map(([path, content]) => `=== ${path} ===\n${content}`)
    .join('\n\n');
  
  const userPrompt = `I need you to generate the content for this file: ${filePath}

This file was truncated during a previous generation. Here is the context of the project:

<original_request>
${originalPrompt}
</original_request>

<existing_files>
${filesContext}
</existing_files>

Now generate the COMPLETE content for: ${filePath}

Remember: Output ONLY the file content - no JSON, no markdown code blocks, no explanations.`;

  const config = getModelConfig(modelId);
  let content = '';
  
  // Use provider-specific streaming
  switch (config.provider) {
    case 'anthropic': {
      const client = getAnthropicClient();
      const stream = client.messages.stream({
        model: 'claude-sonnet-4-5',
        max_tokens: 16384,
        system: SINGLE_FILE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          content += event.delta.text;
        }
      }
      break;
    }
    case 'google': {
      const client = getGoogleClient();
      const response = await client.models.generateContentStream({
        model: 'gemini-3-pro-preview',
        contents: `${SINGLE_FILE_SYSTEM_PROMPT}\n\n${userPrompt}`,
        config: {
          maxOutputTokens: 16384,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }, // Use low thinking for simple regeneration
        },
      });
      for await (const chunk of response) {
        const text = chunk.text;
        if (text) {
          content += text;
        }
      }
      break;
    }
    case 'openai': {
      const client = getOpenAIClient();
      const stream = await client.chat.completions.create({
        model: 'gpt-5',
        max_completion_tokens: 16384,
        stream: true,
        messages: [
          { role: 'system', content: SINGLE_FILE_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      });
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          content += delta;
        }
      }
      break;
    }
  }
  
  // Clean up any accidental markdown wrapper
  content = content.trim();
  if (content.startsWith('```')) {
    const lines = content.split('\n');
    lines.shift(); // Remove first line (```lang)
    if (lines[lines.length - 1] === '```') {
      lines.pop(); // Remove last line (```)
    }
    content = lines.join('\n');
  }
  
  console.log(`[Retry] Successfully regenerated ${filePath} (${content.length} chars)`);
  return content;
}

/**
 * Progress callback type for recovery events
 */
type ProgressCallback = (stage: string, details?: { file?: string; attempt?: number; total?: number; provider?: string }) => void;

/**
 * Code stream callback type for live code streaming
 */
type CodeStreamCallback = (chunk: string) => void;

/**
 * Markers for efficient file regeneration
 */
const FILE_MARKERS = {
  UNCHANGED: '@@UNCHANGED@@',
  DELETE: '@@DELETE@@',
} as const;

/**
 * Merge files with marker-based changes
 * Handles @@UNCHANGED@@ and @@DELETE@@ markers from LLM response
 */
function mergeFilesWithMarkers(existingFiles: FileMap, generatedFiles: FileMap): FileMap {
  const result: FileMap = { ...existingFiles };
  
  for (const [path, content] of Object.entries(generatedFiles)) {
    if (content === FILE_MARKERS.UNCHANGED) {
      // Keep existing file as-is (already in result from spread)
      continue;
    } else if (content === FILE_MARKERS.DELETE) {
      // Remove the file
      delete result[path];
    } else {
      // New or modified file - use the new content
      result[path] = content;
    }
  }
  
  return result;
}

/**
 * Build the user prompt for code generation
 * Uses marker-based approach for efficient partial updates
 */
function buildUserPrompt(userMessage: string, existingFiles: FileMap): string {
  if (Object.keys(existingFiles).length > 0) {
    // Editing existing project - use marker-based approach for efficiency
    return `You are editing an existing project. Here are the current files:

<current_files>
${JSON.stringify(existingFiles, null, 2)}
</current_files>

User request: ${userMessage}

IMPORTANT OUTPUT FORMAT:
- Return a JSON object with "message" and "files" keys
- For files you CHANGED: include the full new content as a string
- For files you did NOT change: use the marker "${FILE_MARKERS.UNCHANGED}"
- For files to DELETE: use the marker "${FILE_MARKERS.DELETE}"
- For NEW files: include the full content

Example response format:
{
  "message": "Updated the header component",
  "files": {
    "src/App.jsx": "${FILE_MARKERS.UNCHANGED}",
    "src/Header.jsx": "import React from 'react';\\n...(full new content)",
    "src/Footer.jsx": "${FILE_MARKERS.UNCHANGED}",
    "src/NewComponent.jsx": "import React from 'react';\\n...(new file)",
    "src/OldUnused.jsx": "${FILE_MARKERS.DELETE}"
  }
}

This saves tokens - only include full content for files you actually modified or created.`;
  } else {
    // New project
    return `Create a new application based on this description:

${userMessage}

IMPORTANT:
- Generate ALL required files: package.json, vite.config.js, tailwind.config.js, postcss.config.js, index.html, and all source files
- Each file value must be a STRING containing the file content (use \\n for newlines)
- Return valid JSON with "message" and "files" keys`;
  }
}

/**
 * Call Anthropic Claude API
 */
async function callAnthropicAI(
  userPrompt: string,
  maxTokens: number,
  onCodeStream?: CodeStreamCallback
): Promise<string> {
  const client = getAnthropicClient();
  let content = '';
  
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: maxTokens,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      const delta = event.delta.text;
      content += delta;
      if (delta) {
        onCodeStream?.(delta);
      }
    }
  }

  return content;
}

/**
 * Call Google Gemini 3 Pro API
 */
async function callGoogleAI(
  userPrompt: string,
  maxTokens: number,
  onCodeStream?: CodeStreamCallback
): Promise<string> {
  const client = getGoogleClient();
  let content = '';

  // Use streaming for Gemini 3 Pro
  const response = await client.models.generateContentStream({
    model: 'gemini-3-pro-preview',
    contents: `${SYSTEM_PROMPT}\n\n${userPrompt}`,
    config: {
      maxOutputTokens: maxTokens,
      // Gemini 3 uses thinking levels - set to high for complex code generation
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH,
      },
    },
  });

  for await (const chunk of response) {
    const text = chunk.text;
    if (text) {
      content += text;
      onCodeStream?.(text);
    }
  }

  return content;
}

/**
 * Call OpenAI GPT-5 API
 */
async function callOpenAI(
  userPrompt: string,
  maxTokens: number,
  onCodeStream?: CodeStreamCallback
): Promise<string> {
  const client = getOpenAIClient();
  let content = '';

  const stream = await client.chat.completions.create({
    model: 'gpt-5',
    max_completion_tokens: maxTokens,
    stream: true,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      content += delta;
      onCodeStream?.(delta);
    }
  }

  return content;
}

/**
 * Call AI with specified provider
 */
async function callProviderAI(
  modelId: ModelId,
  userPrompt: string,
  onCodeStream?: CodeStreamCallback
): Promise<string> {
  const config = getModelConfig(modelId);
  
  switch (config.provider) {
    case 'anthropic':
      return callAnthropicAI(userPrompt, config.maxTokens, onCodeStream);
    case 'google':
      return callGoogleAI(userPrompt, config.maxTokens, onCodeStream);
    case 'openai':
      return callOpenAI(userPrompt, config.maxTokens, onCodeStream);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

/**
 * Call AI with fallback mechanism
 * Tries the specified model first, then falls back to other providers in order
 */
async function callAIWithFallback(
  userMessage: string,
  existingFiles: FileMap,
  modelId: ModelId = DEFAULT_MODEL_ID,
  onProgress?: ProgressCallback,
  onCodeStream?: CodeStreamCallback
): Promise<{ message: string; files: FileMap; usedModel: ModelId }> {
  const userPrompt = buildUserPrompt(userMessage, existingFiles);
  
  // Build fallback sequence: start with requested model, then follow fallback order
  const modelsToTry: ModelId[] = [modelId];
  for (const fallbackModel of FALLBACK_ORDER) {
    if (!modelsToTry.includes(fallbackModel)) {
      modelsToTry.push(fallbackModel);
    }
  }
  
  let lastError: Error | null = null;
  
  for (const currentModelId of modelsToTry) {
    const config = getModelConfig(currentModelId);
    
    // Skip if provider is not configured
    if (!isProviderConfigured(config.provider)) {
      console.log(`[AI] Skipping ${currentModelId}: ${config.provider} API key not configured`);
      continue;
    }
    
    console.log(`[AI] Attempting generation with ${currentModelId} (${config.provider})`);
    onProgress?.('provider_switch', { provider: config.name });
    
    try {
      const content = await callProviderAI(currentModelId, userPrompt, onCodeStream);
      const parseResult = parseAIResponse(content);
      
      // If parsing was complete, return the result
      if (parseResult.isComplete) {
        return {
          message: parseResult.message,
          files: parseResult.files,
          usedModel: currentModelId,
        };
      }
      
      // Handle truncated response with recovery
      console.log('[Recovery] JSON was truncated, attempting file-by-file recovery...');
      onProgress?.('recovering', { file: parseResult.incompleteFile });
      
      const recoveredFiles = { ...parseResult.files };
      const maxRetries = 5;
      let retriesUsed = 0;
      let currentIncompleteFile = parseResult.incompleteFile;
      const attemptedFiles = new Set<string>();
      
      while (currentIncompleteFile && retriesUsed < maxRetries) {
        if (attemptedFiles.has(currentIncompleteFile)) {
          console.log(`[Recovery] Already attempted ${currentIncompleteFile}, stopping retry loop`);
          break;
        }
        
        attemptedFiles.add(currentIncompleteFile);
        retriesUsed++;
        
        console.log(`[Recovery] Retry ${retriesUsed}/${maxRetries}: Regenerating ${currentIncompleteFile}`);
        
        onProgress?.('recovering_file', { 
          file: currentIncompleteFile, 
          attempt: retriesUsed, 
          total: maxRetries 
        });
        
        try {
          const regeneratedContent = await regenerateSingleFile(
            currentIncompleteFile,
            recoveredFiles,
            userMessage,
            currentModelId
          );
          
          if (regeneratedContent && regeneratedContent.length > 0) {
            recoveredFiles[currentIncompleteFile] = regeneratedContent;
            console.log(`[Recovery] ✓ Successfully recovered: ${currentIncompleteFile}`);
          } else {
            console.log(`[Recovery] ✗ Empty content returned for: ${currentIncompleteFile}`);
          }
        } catch (error) {
          console.error(`[Recovery] ✗ Failed to regenerate ${currentIncompleteFile}:`, error);
        }
        
        currentIncompleteFile = undefined;
      }
      
      console.log(`[Recovery] Final file count: ${Object.keys(recoveredFiles).length}`);
      
      return {
        message: parseResult.message,
        files: recoveredFiles,
        usedModel: currentModelId,
      };
      
    } catch (error) {
      console.error(`[AI] ${currentModelId} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Notify about fallback
      const nextModelIndex = modelsToTry.indexOf(currentModelId) + 1;
      if (nextModelIndex < modelsToTry.length) {
        const nextModel = modelsToTry[nextModelIndex];
        const nextConfig = getModelConfig(nextModel);
        if (isProviderConfigured(nextConfig.provider)) {
          console.log(`[AI] Falling back to ${nextModel}...`);
          onProgress?.('fallback', { provider: nextConfig.name });
        }
      }
    }
  }
  
  // All providers failed
  throw lastError || new Error('All AI providers failed');
}

/**
 * Legacy wrapper for backwards compatibility
 */
async function callAI(
  userMessage: string,
  existingFiles: FileMap,
  onProgress?: ProgressCallback,
  onCodeStream?: CodeStreamCallback,
  modelId?: ModelId
): Promise<{ message: string; files: FileMap }> {
  const result = await callAIWithFallback(
    userMessage,
    existingFiles,
    modelId || DEFAULT_MODEL_ID,
    onProgress,
    onCodeStream
  );
  return {
    message: result.message,
    files: result.files,
  };
}

/**
 * E2B Sandbox timeout in milliseconds (30 minutes)
 */
const E2B_TIMEOUT_MS = 30 * 60 * 1000;

// ============================================================================
// ### E2B SANDBOX REUSE (PERSISTENT DEV ENV) ###
// ============================================================================

// We keep a single long-lived E2B sandbox per server instance and reuse it
// across generations to avoid reinstalling dependencies on every request.
declare global {
  // eslint-disable-next-line no-var
  var e2bSandbox: Sandbox | null | undefined;
  // eslint-disable-next-line no-var
  var e2bProjectInitialized: boolean | undefined;
  // eslint-disable-next-line no-var
  var e2bDevServerStarted: boolean | undefined;
}

const E2B_PROJECT_DIR = '/home/user/project';

/**
 * Deploy files to an E2B sandbox
 * Reuses a long-lived sandbox when possible to avoid repeated setup costs
 * 
 * @see https://e2b.dev/docs
 */
async function deployToE2B(
  files: FileMap
): Promise<{ url: string; sandboxId: string } | null> {
  const e2bApiKey = process.env.E2B_API_KEY;

  if (!e2bApiKey) {
    console.log('[Deploy] E2B_API_KEY not configured. Skipping deployment.');
    return null;
  }

  // Initialize globals on first use
  if (typeof global.e2bSandbox === 'undefined') {
    global.e2bSandbox = null;
    global.e2bProjectInitialized = false;
    global.e2bDevServerStarted = false;
  }

  let sandbox: Sandbox | null = global.e2bSandbox ?? null;

  try {
    if (!sandbox) {
      console.log('[Deploy] Creating E2B sandbox...');
      
      // Create a sandbox with 30-minute timeout
      sandbox = await Sandbox.create({
        apiKey: e2bApiKey,
        timeoutMs: E2B_TIMEOUT_MS,
      });

      global.e2bSandbox = sandbox;
      global.e2bProjectInitialized = false;
      global.e2bDevServerStarted = false;

      console.log('[Deploy] Sandbox created:', sandbox.sandboxId);
    } else {
      console.log('[Deploy] Reusing existing E2B sandbox:', sandbox.sandboxId);
    }

    // Create the project directory (idempotent)
    await sandbox.files.makeDir(E2B_PROJECT_DIR);

    // Write all files to the sandbox
    console.log('[Deploy] Writing files to sandbox...');
    for (const [filePath, content] of Object.entries(files)) {
      // Normalize the file path (remove leading slash if present)
      const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const fullPath = `${E2B_PROJECT_DIR}/${normalizedPath}`;
      
      // Create parent directories if needed
      const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
      if (dirPath !== E2B_PROJECT_DIR) {
        await sandbox.files.makeDir(dirPath);
      }
      
      // Write the file
      await sandbox.files.write(fullPath, content);
    }

    console.log('[Deploy] Files written:', Object.keys(files).length);

    // Install dependencies only once per sandbox
    if (!global.e2bProjectInitialized) {
      console.log('[Deploy] Installing dependencies (first time for this sandbox)...');
      const installResult = await sandbox.commands.run('npm install', {
        cwd: E2B_PROJECT_DIR,
        timeoutMs: 120000, // 2 minutes for npm install
      });

      if (installResult.exitCode !== 0) {
        console.error('[Deploy] npm install failed:', installResult.stderr);
        // Reset sandbox state so the next attempt can start clean
        try {
          await sandbox.kill();
        } catch (killError) {
          console.error('[Deploy] Failed to kill sandbox after npm install error:', killError);
        }
        global.e2bSandbox = null;
        global.e2bProjectInitialized = false;
        global.e2bDevServerStarted = false;
        throw new Error(`npm install failed: ${installResult.stderr}`);
      }

      console.log('[Deploy] Dependencies installed');
      global.e2bProjectInitialized = true;
    } else {
      console.log('[Deploy] Skipping npm install - project already initialized in sandbox');
    }

    // Always ensure a fresh dev server for each deployment:
    // 1) try to kill any existing Vite/dev processes
    // 2) start a new dev server in the background
    try {
      console.log('[Deploy] Killing existing dev server (if any)...');
      await sandbox.commands.run('pkill -f "npm run dev" || pkill -f vite || true', {
        cwd: E2B_PROJECT_DIR,
        timeoutMs: 10000,
      });
    } catch (killErr) {
      console.warn('[Deploy] Failed to kill existing dev server (safe to ignore):', killErr);
    }

    console.log('[Deploy] Starting dev server...');
    const devProcess = await sandbox.commands.run(
      'npm run dev -- --host 0.0.0.0 --port 5173',
      {
        cwd: E2B_PROJECT_DIR,
        background: true,
      }
    );

    console.log('[Deploy] Dev server started (or starting), PID:', devProcess.pid);

    // Wait a moment for the server to start before returning URL
    await new Promise(resolve => setTimeout(resolve, 3000));
    global.e2bDevServerStarted = true;

    // Get the sandbox URL
    // E2B sandboxes expose ports via their host URL
    const sandboxHost = sandbox.getHost(5173);
    const previewUrl = `https://${sandboxHost}`;

    console.log('[Deploy] Preview URL:', previewUrl);

    return {
      url: previewUrl,
      sandboxId: sandbox.sandboxId,
    };
  } catch (error) {
    console.error('[Deploy] Deployment failed:', error);
    
    // Clean up sandbox on error and reset globals so the next attempt can start fresh
    if (sandbox) {
      try {
        await sandbox.kill();
      } catch (killError) {
        console.error('[Deploy] Failed to kill sandbox:', killError);
      }
    }
    global.e2bSandbox = null;
    global.e2bProjectInitialized = false;
    global.e2bDevServerStarted = false;

    throw error;
  }
}

// ============================================================================
// ### CUSTOM ###
// ============================================================================

/**
 * POST /api/generate
 * 
 * Handles code generation requests with stage-based progress updates
 */
export async function POST(request: NextRequest) {
  const sse = createSSEEncoder();

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Parse the request body
        const body: GenerateRequest = await request.json();
        const { userMessage, files = {}, modelId = DEFAULT_MODEL_ID } = body;

        if (!userMessage) {
          controller.enqueue(
            sse.encode('error', { message: 'User message is required' })
          );
          controller.close();
          return;
        }

        // Send the selected model info
        const modelConfig = getModelConfig(modelId);
        controller.enqueue(
          sse.encode('model', { 
            id: modelId, 
            name: modelConfig.name,
            provider: modelConfig.provider 
          })
        );

        // Stage 1: Analyzing (includes prompt enhancement)
        controller.enqueue(
          sse.encode('stage', { stage: 'analyzing' })
        );

        // Enhance the prompt for better results
        const isNewProject = Object.keys(files).length === 0;
        let enhancedMessage = userMessage;
        
        if (isNewProject) {
          // Only enhance prompts for new projects
          enhancedMessage = await enhancePrompt(userMessage, modelId);
        }

        // Stage 2: Designing (while AI is working)
        controller.enqueue(
          sse.encode('stage', { stage: 'designing' })
        );

        // Call AI with progress callback for recovery events and code streaming
        const { message, files: generatedFiles, usedModel } = await callAIWithFallback(
          enhancedMessage, 
          files,
          modelId,
          (stage, details) => {
            // Send provider switch/fallback info
            if (stage === 'provider_switch') {
              controller.enqueue(
                sse.encode('stage', { 
                  stage: 'designing',
                  provider: details?.provider,
                  message: `Using ${details?.provider}...`
                })
              );
            } else if (stage === 'fallback') {
              controller.enqueue(
                sse.encode('stage', { 
                  stage: 'fallback',
                  provider: details?.provider,
                  message: `Falling back to ${details?.provider}...`
                })
              );
            } else if (stage === 'recovering') {
              controller.enqueue(
                sse.encode('stage', { 
                  stage: 'recovering',
                  file: details?.file,
                  message: `Recovering truncated file: ${details?.file || 'unknown'}`
                })
              );
            } else if (stage === 'recovering_file') {
              controller.enqueue(
                sse.encode('stage', { 
                  stage: 'recovering',
                  file: details?.file,
                  attempt: details?.attempt,
                  total: details?.total,
                  message: `Regenerating ${details?.file} (${details?.attempt}/${details?.total})`
                })
              );
            }
          },
          // Stream code chunks to the client in real-time
          (chunk) => {
            controller.enqueue(
              sse.encode('code_stream', { chunk })
            );
          }
        );
        
        // Notify if a fallback model was used
        if (usedModel !== modelId) {
          const usedConfig = getModelConfig(usedModel);
          controller.enqueue(
            sse.encode('model_used', { 
              id: usedModel, 
              name: usedConfig.name,
              message: `Generated with ${usedConfig.name} (fallback)`
            })
          );
        }

        // Check if we got files
        if (Object.keys(generatedFiles).length === 0) {
          throw new Error('AI did not generate any files. Please try again with a clearer description.');
        }

        // Merge generated files with existing files using marker-based approach
        // This handles @@UNCHANGED@@ and @@DELETE@@ markers efficiently
        const updatedFiles = mergeFilesWithMarkers(files, generatedFiles);

        // Send updated files
        controller.enqueue(sse.encode('files', updatedFiles));

        // Stage 3: Deploying
        controller.enqueue(
          sse.encode('stage', { stage: 'deploying' })
        );

        // Deploy to E2B sandbox
        try {
          const deployment = await deployToE2B(updatedFiles);

          if (deployment) {
            controller.enqueue(
              sse.encode('deployment', { 
                url: deployment.url,
                sandboxId: deployment.sandboxId,
                expiresIn: '15 minutes'
              })
            );
          } else {
            // No deployment available (likely missing E2B_API_KEY)
            controller.enqueue(
              sse.encode('deployment', { 
                url: null,
                sandboxId: null,
                localMode: true,
                message: 'Preview not available. Add E2B_API_KEY to enable sandbox deployments.'
              })
            );
          }
        } catch (deployError) {
          const errorMessage = deployError instanceof Error ? deployError.message : 'Deployment failed';
          console.error('[Deploy] Error:', deployError);
          controller.enqueue(
            sse.encode('deployment', { 
              url: null,
              sandboxId: null,
              localMode: true,
              message: errorMessage
            })
          );
        }

        // Send completion with message
        controller.enqueue(
          sse.encode('done', { message })
        );

      } catch (error) {
        console.error('Generation error:', error);
        controller.enqueue(
          sse.encode('error', {
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
          })
        );
      } finally {
        controller.close();
      }
    },
  });

  // Return the streaming response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
