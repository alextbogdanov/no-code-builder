// ============================================================================
// ### TYPES ###
// ============================================================================

/**
 * Represents a single file in the project
 */
export interface ProjectFile {
  file: string;
  data: string;
}

/**
 * Map of file paths to their content
 */
export type FileMap = Record<string, string>;

/**
 * Supported LLM providers
 */
export type LLMProvider = 'anthropic' | 'google' | 'openai';

/**
 * Available model identifiers
 */
export type ModelId = 
  | 'claude-sonnet-4-5'
  | 'gemini-3-pro'
  | 'gpt-5';

/**
 * Model configuration
 */
export interface ModelConfig {
  id: ModelId;
  provider: LLMProvider;
  name: string;
  description: string;
  maxTokens: number;
}

/**
 * Request payload sent to the /api/generate endpoint
 */
export interface GenerateRequest {
  userMessage: string;
  files?: FileMap;
  projectName?: string;
  modelId?: ModelId;
}

/**
 * Response structure from the /api/generate endpoint
 */
export interface GenerateResponse {
  deploymentUrl: string | null;
  updatedFiles: FileMap;
  message: string;
  error?: string;
}

/**
 * SSE event types for streaming responses
 */
export type SSEEventType = 
  | 'stage'        // Current stage (analyzing, designing, deploying)
  | 'code_stream'  // Streaming code chunks as they're generated
  | 'files'        // Updated file map
  | 'deployment'   // Deployment URL ready
  | 'error'        // Error occurred
  | 'done';        // Stream complete

/**
 * Loading stages during generation
 */
export type LoadingStage = 'analyzing' | 'designing' | 'deploying';

/**
 * SSE event payload structure
 */
export interface SSEEvent {
  type: SSEEventType;
  data: string | FileMap | { url: string } | { message: string };
}

/**
 * Chat message in the conversation
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  status?: 'pending' | 'streaming' | 'complete' | 'error';
}

/**
 * Project state stored in localStorage
 */
export interface ProjectState {
  id: string;
  name: string;
  files: FileMap;
  messages: ChatMessage[];
  deploymentUrl: string | null;
  createdAt: number;
  updatedAt: number;
  selectedModel?: ModelId;
}

/**
 * History entry for undo/redo functionality
 */
export interface HistoryEntry {
  files: FileMap;
  deploymentUrl: string | null;
  timestamp: number;
}

/**
 * Animation step shown during building process
 */
export interface BuildingStep {
  id: string;
  label: string;
  description: string;
  icon: string;
  duration: number;
}

/**
 * E2B Sandbox deployment response
 */
export interface SandboxDeploymentResponse {
  url: string;
  sandboxId: string;
  expiresIn?: string;
}

/**
 * Project state stored in localStorage - with sandbox info
 */
export interface ProjectStateWithSandbox extends ProjectState {
  sandboxId?: string;
}

