import Anthropic from '@anthropic-ai/sdk';
import { AgentConfig, ChatMessage, ModelInfo, ProviderType, StreamChunk } from '../types';
import { BaseAgent } from './BaseAgent';

export class AnthropicAgent extends BaseAgent {
  private client: Anthropic;
  private static readonly AVAILABLE_MODELS = [
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-2.1',
    'claude-2'
  ];

  constructor(config: AgentConfig) {
    super(config);
    this.client = new Anthropic({ apiKey: config.apiKey });
  }

  protected getDefaultModel(): string {
    return 'claude-2';
  }

  async getModels(): Promise<ModelInfo[]> {
    return AnthropicAgent.AVAILABLE_MODELS.map(id => ({
      id,
      provider: 'anthropic' as ProviderType,
      description: `Anthropic ${id}`,
    }));
  }

  async *chat(messages: ChatMessage[]): AsyncGenerator<StreamChunk, void, unknown> {
    try {
      const response = await this.client.messages.create({
        model: this.currentModel,
        messages: messages.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        })),
        system: this.config.systemPrompt || '',
        max_tokens: 1024,
        stream: true,
      });

      let currentContent = '';
      for await (const chunk of response) {
        switch (chunk.type) {
          case 'content_block_start':
            break;
          case 'content_block_delta':
            if ('text' in chunk.delta) {
              currentContent += chunk.delta.text;
              yield {
                content: chunk.delta.text,
                done: false,
              };
            }
            break;
          case 'content_block_stop':
            break;
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
