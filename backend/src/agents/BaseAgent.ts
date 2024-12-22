import { AgentConfig, ChatMessage, ModelInfo, StreamChunk } from '../types';

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected currentModel: string;

  constructor(config: AgentConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
    this.config = config;
    this.currentModel = config.model || this.getDefaultModel();
  }

  protected abstract getDefaultModel(): string;

  abstract getModels(): Promise<ModelInfo[]>;

  abstract chat(messages: ChatMessage[]): AsyncGenerator<StreamChunk, void, unknown>;

  setModel(modelId: string): void {
    console.log(`Setting model for ${this.constructor.name} to:`, modelId);
    if (!modelId) {
      console.warn(`No model ID provided for ${this.constructor.name}, using default`);
      this.currentModel = this.getDefaultModel();
    } else {
      this.currentModel = modelId;
    }
    console.log(`Current model for ${this.constructor.name}:`, this.currentModel);
  }

  setSystemPrompt(prompt: string): void {
    this.config.systemPrompt = prompt;
  }

  protected getSystemMessage(): ChatMessage {
    return {
      role: 'system',
      content: this.config.systemPrompt || 'You are a helpful AI assistant.'
    };
  }

  protected async *handleError(error: unknown): AsyncGenerator<StreamChunk, void, unknown> {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    yield {
      content: `Error: ${errorMessage}`,
      done: true
    };
  }
}
