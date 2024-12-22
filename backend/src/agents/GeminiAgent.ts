import { GoogleGenerativeAI } from '@google/generative-ai';
import { AgentConfig, ChatMessage, ModelInfo, ProviderType, StreamChunk } from '../types';
import { BaseAgent } from './BaseAgent';

export class GeminiAgent extends BaseAgent {
  private client: GoogleGenerativeAI;
  private static readonly AVAILABLE_MODELS = [
    'gemini-pro',
    'gemini-pro-vision'
  ];

  constructor(config: AgentConfig) {
    super(config);
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  protected getDefaultModel(): string {
    return 'gemini-pro';
  }

  async getModels(): Promise<ModelInfo[]> {
    return GeminiAgent.AVAILABLE_MODELS.map(id => ({
      id,
      provider: 'gemini' as ProviderType,
      description: `Google ${id}`,
    }));
  }

  async *chat(messages: ChatMessage[]): AsyncGenerator<StreamChunk, void, unknown> {
    try {
      const model = this.client.getGenerativeModel({ model: this.currentModel });
      const chat = model.startChat({
        history: messages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          maxOutputTokens: 2048,
        },
      });

      const result = await chat.sendMessageStream(this.getSystemMessage().content);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield {
            content: text,
            done: false,
          };
        }
      }

      yield {
        content: '',
        done: true,
      };
    } catch (error) {
      yield* this.handleError(error);
    }
  }
}
