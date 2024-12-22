export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ModelInfo {
  id: string;
  provider: ProviderType;
  description?: string;
  maxTokens?: number;
}

export type ProviderType = 'openai' | 'anthropic' | 'gemini' | 'together' | 'openrouter';

export interface ChatState {
  messages: Message[];
  selectedProvider: ProviderType;
  selectedModel: string;
  isTyping: boolean;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}
