import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAIAgent } from './agents/OpenAIAgent';
import { AnthropicAgent } from './agents/AnthropicAgent';
import { GeminiAgent } from './agents/GeminiAgent';
import { BaseAgent } from './agents/BaseAgent';
import { AgentConfig, ChatMessage, ProviderType } from './types';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Initialize provider agents
const agents = new Map<ProviderType, BaseAgent>();

function initializeAgents() {
  try {
    if (process.env.OPENAI_API_KEY) {
      agents.set('openai', new OpenAIAgent({ apiKey: process.env.OPENAI_API_KEY }));
    }
    if (process.env.ANTHROPIC_API_KEY) {
      agents.set('anthropic', new AnthropicAgent({ apiKey: process.env.ANTHROPIC_API_KEY }));
    }
    if (process.env.GEMINI_API_KEY) {
      agents.set('gemini', new GeminiAgent({ apiKey: process.env.GEMINI_API_KEY }));
    }
    console.log('Initialized agents for providers:', Array.from(agents.keys()));
  } catch (error) {
    console.error('Error initializing agents:', error);
  }
}

// Get available models from all providers
app.get('/api/models', async (req, res) => {
  try {
    const allModels = await Promise.all(
      Array.from(agents.values()).map(agent => agent.getModels())
    );
    res.json({ models: allModels.flat() });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// Start chat session
app.post('/api/chat', async (req, res) => {
  const { provider, model, messages } = req.body;
  const agent = agents.get(provider as ProviderType);

  if (!agent) {
    return res.status(400).json({ error: 'Invalid provider' });
  }

  if (model) {
    agent.setModel(model);
  }

  try {
    console.log(`Chat request - Provider: ${provider}, Model: ${model}`);
    console.log('Messages:', JSON.stringify(messages, null, 2));

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = agent.chat(messages);
    let hasError = false;

    for await (const chunk of stream) {
      if (res.writableEnded) break;

      if (chunk.content.startsWith('Error:')) {
        hasError = true;
        console.error('Stream error:', chunk.content);
        res.write(`data: ${JSON.stringify({
          content: chunk.content,
          done: true,
          error: true
        })}\n\n`);
        break;
      }

      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    if (!hasError) {
      res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
    }
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({
        content: `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`,
        done: true,
        error: true
      })}\n\n`);
      res.end();
    }
  }
});

// Update system prompt
app.post('/api/system-prompt', (req, res) => {
  const { provider, prompt } = req.body;
  const agent = agents.get(provider as ProviderType);

  if (!agent) {
    return res.status(400).json({ error: 'Invalid provider' });
  }

  try {
    agent.setSystemPrompt(prompt);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update system prompt' });
  }
});

// Initialize agents and start server
initializeAgents();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available providers:', Array.from(agents.keys()));
});
