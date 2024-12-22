import { Chat } from './components/Chat';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Modular LLM Chat
              </h1>
              <span className="hidden sm:inline-block px-2 py-1 text-xs font-medium bg-primary-50 text-primary-700 rounded-full">
                Beta
              </span>
            </div>
            <div className="text-sm text-gray-500 hidden sm:block">
              Multiple AI Models • One Interface
            </div>
          </div>
        </div>
        <div className="bg-primary-50 border-t border-primary-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="text-sm text-primary-700">
              💡 Tip: Configure your API keys in the backend .env file to start chatting with different models
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 relative">
        <Chat />
      </main>
    </div>
  );
}

export default App;
