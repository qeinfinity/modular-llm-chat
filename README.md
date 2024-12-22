# Modular LLM Chat Interface

A modern chat interface that supports multiple LLM providers with a clean, modular architecture.

## Features

- Support for multiple LLM providers:
  - OpenAI (GPT-4, GPT-3.5)
  - Anthropic (Claude)
  - Google (Gemini)
  - Together AI
  - OpenRouter

- Clean, minimal interface inspired by ChatGPT
- Real-time streaming responses
- Mobile-responsive design
- Provider/model selection
- Configurable system prompts

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Configure API Keys:
   - Copy `.env.example` to `.env` in the backend directory:
   ```bash
   cp backend/.env.example backend/.env
   ```
   - Add your API keys to `backend/.env`:

   **OpenAI**
   - Get API key from: https://platform.openai.com/account/api-keys
   ```
   OPENAI_API_KEY=sk-...
   ```

   **Anthropic**
   - Get API key from: https://console.anthropic.com/account/keys
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

   **Google (Gemini)**
   - Get API key from: https://makersuite.google.com/app/apikey
   ```
   GEMINI_API_KEY=...
   ```

   **Together AI**
   - Get API key from: https://api.together.xyz/settings/api-keys
   ```
   TOGETHER_API_KEY=...
   ```

   **OpenRouter**
   - Get API key from: https://openrouter.ai/keys
   ```
   OPENROUTER_API_KEY=...
   ```

4. Start the development server:
```bash
npm run dev
```

5. Open http://localhost:5173 in your browser

## Usage

1. Select a provider and model from the sidebar
2. Type your message and press Enter or click Send
3. The response will stream in real-time
4. Switch between providers/models at any time

## Architecture

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Modular agent system for easy provider integration
- Streaming response support
- Environment-based configuration

## Adding New Providers

The modular architecture makes it easy to add new providers:

1. Create a new agent class in `backend/src/agents/`
2. Implement the `BaseAgent` interface
3. Add provider configuration to `.env`
4. Register the agent in `backend/src/index.ts`

## License

MIT
