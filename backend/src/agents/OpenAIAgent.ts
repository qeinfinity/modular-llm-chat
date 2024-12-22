import OpenAI from 'openai';
import { AgentConfig, ChatMessage, ModelInfo, ProviderType, StreamChunk } from '../types';
import { BaseAgent } from './BaseAgent';

export class OpenAIAgent extends BaseAgent {
  private client: OpenAI;
  private availableModels: Set<string> = new Set();
  private modelList: ModelInfo[] = [];
  private static readonly MODEL_MAPPINGS: Record<string, string> = {
    'gpt-4-turbo-preview': 'gpt-4-0125-preview',  // Latest GPT-4 Turbo
    'gpt-4': 'gpt-4-0125-preview',  // Redirect to latest
    'gpt-3.5-turbo': 'gpt-3.5-turbo-0125'  // Latest GPT-3.5
  };

  private static readonly PREFERRED_MODELS = [
    'gpt-4-0125-preview',
    'gpt-3.5-turbo-0125'
  ];

  private static readonly MODEL_PATTERNS = [
    /^gpt-4-\d{4}-preview$/,
    /^gpt-3.5-turbo-\d{4}$/
  ];

  constructor(config: AgentConfig) {
    super(config);
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.initializeModels();
  }

  private async initializeModels(): Promise<void> {
    try {
      const models = await this.client.models.list();
      const availableModels = new Set(models.data.map(m => m.id));
      
      // Filter to only include our preferred models that are actually available
      this.modelList = OpenAIAgent.PREFERRED_MODELS
        .filter(modelId => availableModels.has(modelId))
        .map(id => ({
          id,
          provider: 'openai' as ProviderType,
          description: this.getModelDescription(id),
        }));

      this.availableModels = new Set(this.modelList.map(m => m.id));
      console.log('Available OpenAI models:', Array.from(this.availableModels));
    } catch (error) {
      console.error('Error initializing OpenAI models:', error);
      // Fallback to basic models if API call fails
      this.modelList = OpenAIAgent.PREFERRED_MODELS.map(id => ({
        id,
        provider: 'openai' as ProviderType,
        description: this.getModelDescription(id),
      }));
      this.availableModels = new Set(OpenAIAgent.PREFERRED_MODELS);
    }
  }

  private getModelDescription(modelId: string): string {
    const descriptions: Record<string, string> = {
      'gpt-4-0125-preview': 'GPT-4 Turbo (Latest)',
      'gpt-3.5-turbo-0125': 'GPT-3.5 Turbo (Latest)',
    };
    return descriptions[modelId] || `OpenAI ${modelId}`;
  }

  protected getDefaultModel(): string {
    return OpenAIAgent.MODEL_MAPPINGS['gpt-3.5-turbo'];
  }

  private getLatestModelVersion(modelId: string): string {
    return OpenAIAgent.MODEL_MAPPINGS[modelId] || modelId;
  }

  async getModels(): Promise<ModelInfo[]> {
    if (this.modelList.length === 0) {
      await this.initializeModels();
    }
    return this.modelList;
  }

  setModel(modelId: string): void {
    // First check if there's a mapping to a newer version
    const latestVersion = this.getLatestModelVersion(modelId);
    
    // If the mapped/latest version is available, use it
    if (this.availableModels.has(latestVersion)) {
      console.log(`Using model ${latestVersion} for requested model ${modelId}`);
      super.setModel(latestVersion);
      return;
    }

    // If the exact requested model is available, use it
    if (this.availableModels.has(modelId)) {
      super.setModel(modelId);
      return;
    }

    // Try to find a matching base model
    const baseModel = Object.keys(OpenAIAgent.MODEL_MAPPINGS).find(base => 
      modelId.startsWith(base) || base.startsWith(modelId)
    );

    if (baseModel) {
      const mappedModel = OpenAIAgent.MODEL_MAPPINGS[baseModel];
      if (this.availableModels.has(mappedModel)) {
        console.log(`Using model ${mappedModel} for requested model ${modelId}`);
        super.setModel(mappedModel);
        return;
      }
    }

    // Fall back to default model
    const defaultModel = this.getDefaultModel();
    console.warn(`Invalid model ${modelId}, falling back to default ${defaultModel}`);
    super.setModel(defaultModel);
  }

  async *chat(messages: ChatMessage[]): AsyncGenerator<StreamChunk, void, unknown> {
    try {
      const formattedMessages = messages.map(msg => ({
        role: msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant' ? msg.role : 'user',
        content: String(msg.content || '').trim()
      })).filter(msg => msg.content.length > 0);

      if (this.config.systemPrompt) {
        formattedMessages.unshift({
          role: 'system',
          content: this.config.systemPrompt
        });
      }

      const stream = await this.client.chat.completions.create({
        model: this.currentModel,
        messages: formattedMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2000
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield {
            content,
            done: false,
          };
        }
      }

      yield {
        content: '',
        done: true,
      };
    } catch (error) {
      console.error('OpenAI Chat Error:', error);
      if (error instanceof Error) {
        yield {
          content: `Error: ${error.message}`,
          done: true
        };
      } else {
        yield* this.handleError(error);
      }
    }
  }
}
