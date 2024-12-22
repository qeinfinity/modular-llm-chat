export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  done: boolean;
}

export interface AgentConfig {
  apiKey: string;
  systemPrompt?: string;
  model?: string;
}

export type ProviderType = 'openai' | 'anthropic' | 'gemini' | 'together' | 'openrouter';

export interface StreamChunk {
  content: string;
  done: boolean;
}

export interface ModelInfo {
  id: string;
  provider: ProviderType;
  maxTokens?: number;
  description?: string;
}
