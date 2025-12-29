// ============================================================================
// ### IMPORTS ###
// ============================================================================

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Sandbox } from '@e2b/code-interpreter';

// ============================================================================
// ### TYPES ###
// ============================================================================

import type { FileMap, GenerateRequest } from '@/types/project';

// ============================================================================
// ### CONSTANTS ###
// ============================================================================

import { SYSTEM_PROMPT, ENHANCER_SYSTEM_PROMPT } from '@/lib/constants';

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
 * Enhance the user prompt to make it more specific and actionable
 */
async function enhancePrompt(userMessage: string): Promise<string> {
  const client = getAnthropicClient();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: ENHANCER_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Enhance this prompt for generating a complete web application:

<original_prompt>
${userMessage}
</original_prompt>

Remember: Only output the enhanced prompt text, nothing else.`,
        },
      ],
    });

    const enhancedPrompt = response.content[0]?.type === 'text' 
      ? response.content[0].text 
      : userMessage;

    // If enhancement failed or returned empty, use original
    if (!enhancedPrompt || enhancedPrompt.trim().length === 0) {
      return userMessage;
    }

    return enhancedPrompt.trim();
  } catch (error) {
    console.error('Prompt enhancement failed, using original:', error);
    return userMessage;
  }
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
  originalPrompt: string
): Promise<string> {
  console.log(`[Retry] Regenerating single file: ${filePath}`);
  const client = getAnthropicClient();
  
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

  // Use streaming to avoid timeout for long-running requests
  let content = '';
  
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: 16384,
    system: SINGLE_FILE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  // Collect streamed text content
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      content += event.delta.text;
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
type ProgressCallback = (stage: string, details?: { file?: string; attempt?: number; total?: number }) => void;

/**
 * Code stream callback type for live code streaming
 */
type CodeStreamCallback = (chunk: string) => void;

/**
 * Call the AI API (Claude) to generate code - with automatic retry for truncated files
 */
async function callAI(
  userMessage: string,
  existingFiles: FileMap,
  onProgress?: ProgressCallback,
  onCodeStream?: CodeStreamCallback
): Promise<{ message: string; files: FileMap }> {
  const client = getAnthropicClient();

  // Build the user prompt with existing files context
  let userPrompt: string;
  
  if (Object.keys(existingFiles).length > 0) {
    // Editing existing project
    userPrompt = `You are editing an existing project. Here are the current files:

<current_files>
${JSON.stringify(existingFiles, null, 2)}
</current_files>

User request: ${userMessage}

IMPORTANT: 
- Return ALL files in your response, including unchanged ones
- Each file value must be a STRING containing the file content (use \\n for newlines)
- Return valid JSON with "message" and "files" keys`;
  } else {
    // New project
    userPrompt = `Create a new application based on this description:

${userMessage}

IMPORTANT:
- Generate ALL required files: package.json, vite.config.js, tailwind.config.js, postcss.config.js, index.html, and all source files
- Each file value must be a STRING containing the file content (use \\n for newlines)
- Return valid JSON with "message" and "files" keys`;
  }

  // Use streaming to avoid timeout for long-running requests
  let content = '';
  
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: 32768, // Maximum tokens for Claude
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  // Collect streamed text content and forward to callback
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      const delta = event.delta.text;
      content += delta;
      // Stream the code chunk to the frontend
      if (delta) {
        onCodeStream?.(delta);
      }
    }
  }

  const parseResult = parseAIResponse(content);
  
  // If parsing was complete, return the result
  if (parseResult.isComplete) {
    return {
      message: parseResult.message,
      files: parseResult.files,
    };
  }
  
  // If we have partial results and an incomplete file, try to recover
  console.log('[Recovery] JSON was truncated, attempting file-by-file recovery...');
  
  // Notify about recovery starting
  onProgress?.('recovering', { file: parseResult.incompleteFile });
  
  const recoveredFiles = { ...parseResult.files };
  const maxRetries = 5; // Maximum number of files to retry
  let retriesUsed = 0;
  let currentIncompleteFile = parseResult.incompleteFile;
  
  // Keep track of files we've already tried to regenerate to avoid infinite loops
  const attemptedFiles = new Set<string>();
  
  while (currentIncompleteFile && retriesUsed < maxRetries) {
    if (attemptedFiles.has(currentIncompleteFile)) {
      console.log(`[Recovery] Already attempted ${currentIncompleteFile}, stopping retry loop`);
      break;
    }
    
    attemptedFiles.add(currentIncompleteFile);
    retriesUsed++;
    
    console.log(`[Recovery] Retry ${retriesUsed}/${maxRetries}: Regenerating ${currentIncompleteFile}`);
    
    // Notify about current file being recovered
    onProgress?.('recovering_file', { 
      file: currentIncompleteFile, 
      attempt: retriesUsed, 
      total: maxRetries 
    });
    
    try {
      const regeneratedContent = await regenerateSingleFile(
        currentIncompleteFile,
        recoveredFiles,
        userMessage
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
    
    // Check if there are more files that need regeneration
    // We need to detect if the original response had more files after the truncated one
    // For now, we'll stop after regenerating the incomplete file
    currentIncompleteFile = undefined;
  }
  
  console.log(`[Recovery] Final file count: ${Object.keys(recoveredFiles).length}`);
  
  return {
    message: parseResult.message,
    files: recoveredFiles,
  };
}

/**
 * E2B Sandbox timeout in milliseconds (15 minutes)
 */
const E2B_TIMEOUT_MS = 15 * 60 * 1000;

/**
 * Deploy files to an E2B sandbox
 * Creates a temporary sandbox that auto-terminates after 15 minutes
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

  let sandbox: Sandbox | null = null;

  try {
    console.log('[Deploy] Creating E2B sandbox...');
    
    // Create a sandbox with 15-minute timeout
    sandbox = await Sandbox.create({
      apiKey: e2bApiKey,
      timeoutMs: E2B_TIMEOUT_MS,
    });

    console.log('[Deploy] Sandbox created:', sandbox.sandboxId);

    // Create the project directory
    const projectDir = '/home/user/project';
    await sandbox.files.makeDir(projectDir);

    // Write all files to the sandbox
    console.log('[Deploy] Writing files to sandbox...');
    for (const [filePath, content] of Object.entries(files)) {
      // Normalize the file path (remove leading slash if present)
      const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const fullPath = `${projectDir}/${normalizedPath}`;
      
      // Create parent directories if needed
      const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
      if (dirPath !== projectDir) {
        await sandbox.files.makeDir(dirPath);
      }
      
      // Write the file
      await sandbox.files.write(fullPath, content);
    }

    console.log('[Deploy] Files written:', Object.keys(files).length);

    // Install dependencies
    console.log('[Deploy] Installing dependencies...');
    const installResult = await sandbox.commands.run('npm install', {
      cwd: projectDir,
      timeoutMs: 120000, // 2 minutes for npm install
    });

    if (installResult.exitCode !== 0) {
      console.error('[Deploy] npm install failed:', installResult.stderr);
      throw new Error(`npm install failed: ${installResult.stderr}`);
    }

    console.log('[Deploy] Dependencies installed');

    // Start the dev server in the background
    console.log('[Deploy] Starting dev server...');
    const devProcess = await sandbox.commands.run('npm run dev -- --host 0.0.0.0 --port 5173', {
      cwd: projectDir,
      background: true,
    });

    console.log('[Deploy] Dev server started, PID:', devProcess.pid);

    // Wait a moment for the server to start
    await new Promise(resolve => setTimeout(resolve, 3000));

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
    
    // Clean up sandbox on error
    if (sandbox) {
      try {
        await sandbox.kill();
      } catch (killError) {
        console.error('[Deploy] Failed to kill sandbox:', killError);
      }
    }
    
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
        const { userMessage, files = {} } = body;

        if (!userMessage) {
          controller.enqueue(
            sse.encode('error', { message: 'User message is required' })
          );
          controller.close();
          return;
        }

        // Stage 1: Analyzing (includes prompt enhancement)
        controller.enqueue(
          sse.encode('stage', { stage: 'analyzing' })
        );

        // Enhance the prompt for better results
        const isNewProject = Object.keys(files).length === 0;
        let enhancedMessage = userMessage;
        
        if (isNewProject) {
          // Only enhance prompts for new projects
          enhancedMessage = await enhancePrompt(userMessage);
        }

        // Stage 2: Designing (while AI is working)
        controller.enqueue(
          sse.encode('stage', { stage: 'designing' })
        );

        // Call AI with progress callback for recovery events and code streaming
        const { message, files: generatedFiles } = await callAI(
          enhancedMessage, 
          files,
          (stage, details) => {
            // Send recovery progress to client
            if (stage === 'recovering') {
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

        // Check if we got files
        if (Object.keys(generatedFiles).length === 0) {
          throw new Error('AI did not generate any files. Please try again with a clearer description.');
        }

        // Merge generated files with existing files
        const updatedFiles = { ...files, ...generatedFiles };

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
