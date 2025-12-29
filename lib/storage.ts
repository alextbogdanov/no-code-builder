// ============================================================================
// ### TYPES ###
// ============================================================================

import type { ProjectState, FileMap, ChatMessage, HistoryEntry } from '@/types/project';

// ============================================================================
// ### CONSTANTS ###
// ============================================================================

const STORAGE_KEY = 'nocode-builder-project';
const HISTORY_KEY = 'nocode-builder-history';
const MAX_HISTORY_ENTRIES = 20;

// ============================================================================
// ### UTILITIES ###
// ============================================================================

/**
 * Generate a unique ID for messages and projects
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if we're running in the browser
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// ============================================================================
// ### PROJECT STATE MANAGEMENT ###
// ============================================================================

/**
 * Get the current project state from localStorage
 */
export function getProjectState(): ProjectState | null {
  if (!isBrowser()) return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as ProjectState;
  } catch (error) {
    console.error('Failed to parse project state:', error);
    return null;
  }
}

/**
 * Save the current project state to localStorage
 */
export function saveProjectState(state: ProjectState): void {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save project state:', error);
  }
}

/**
 * Create a new project state
 */
export function createProjectState(
  name: string,
  initialPrompt?: string
): ProjectState {
  const now = Date.now();
  const messages: ChatMessage[] = [];

  if (initialPrompt) {
    messages.push({
      id: generateId(),
      role: 'user',
      content: initialPrompt,
      timestamp: now,
      status: 'complete',
    });
  }

  return {
    id: generateId(),
    name,
    files: {},
    messages,
    deploymentUrl: null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update project files
 */
export function updateProjectFiles(files: FileMap): void {
  const state = getProjectState();
  if (!state) return;

  state.files = files;
  state.updatedAt = Date.now();
  saveProjectState(state);
}

/**
 * Add a message to the project
 */
export function addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
  const state = getProjectState();
  if (!state) {
    throw new Error('No project state found');
  }

  const newMessage: ChatMessage = {
    ...message,
    id: generateId(),
    timestamp: Date.now(),
  };

  state.messages.push(newMessage);
  state.updatedAt = Date.now();
  saveProjectState(state);

  return newMessage;
}

/**
 * Update an existing message
 */
export function updateMessage(
  messageId: string,
  updates: Partial<ChatMessage>
): void {
  const state = getProjectState();
  if (!state) return;

  const messageIndex = state.messages.findIndex((m) => m.id === messageId);
  if (messageIndex === -1) return;

  state.messages[messageIndex] = {
    ...state.messages[messageIndex],
    ...updates,
  };
  state.updatedAt = Date.now();
  saveProjectState(state);
}

/**
 * Update deployment URL
 */
export function updateDeploymentUrl(url: string | null): void {
  const state = getProjectState();
  if (!state) return;

  state.deploymentUrl = url;
  state.updatedAt = Date.now();
  saveProjectState(state);
}

/**
 * Clear the current project
 */
export function clearProject(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(HISTORY_KEY);
}

// ============================================================================
// ### HISTORY MANAGEMENT ###
// ============================================================================

/**
 * Get the history entries from localStorage
 */
export function getHistory(): HistoryEntry[] {
  if (!isBrowser()) return [];

  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as HistoryEntry[];
  } catch (error) {
    console.error('Failed to parse history:', error);
    return [];
  }
}

/**
 * Add a history entry
 */
export function addHistoryEntry(entry: Omit<HistoryEntry, 'timestamp'>): void {
  if (!isBrowser()) return;

  try {
    const history = getHistory();
    history.push({
      ...entry,
      timestamp: Date.now(),
    });

    // Keep only the last N entries
    while (history.length > MAX_HISTORY_ENTRIES) {
      history.shift();
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save history entry:', error);
  }
}

/**
 * Restore from a history entry
 */
export function restoreFromHistory(index: number): void {
  const history = getHistory();
  if (index < 0 || index >= history.length) return;

  const entry = history[index];
  const state = getProjectState();
  if (!state) return;

  state.files = entry.files;
  state.deploymentUrl = entry.deploymentUrl;
  state.updatedAt = Date.now();
  saveProjectState(state);
}

