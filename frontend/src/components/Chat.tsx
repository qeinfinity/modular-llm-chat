import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Sidebar } from './Sidebar';
import { Message, ModelInfo, ProviderType, StreamChunk } from '../types';

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('openai');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/models');
      const data = await response.json();
      setModels(data.models);
      if (data.models.length > 0) {
        const defaultModel = data.models.find((m: ModelInfo) => m.provider === selectedProvider);
        if (defaultModel) {
          setSelectedModel(defaultModel.id);
          setSelectedProvider(defaultModel.provider);
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setMessages([{
        role: 'assistant',
        content: 'No API keys configured. Please add your API keys in the backend .env file to start chatting.'
      }]);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  // Only scroll on new user message
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user') {
      scrollToBottom();
    }
  }, [messages.length]);

  const handleSendMessage = async (content: string) => {
    if (!selectedProvider || !selectedModel) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Please configure API keys in the backend .env file and select a model to start chatting.' }
      ]);
      return;
    }

    const userMessage: Message = { role: 'user', content: content.trim() };
    if (!userMessage.content) return;
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    const messageHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content.trim()
    })).filter(msg => msg.content.length > 0);

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: selectedProvider,
          model: selectedModel,
          messages: messageHistory.concat(userMessage).map(msg => ({
            role: msg.role,
            content: msg.content.trim()
          })).filter(msg => msg.content.length > 0),
        }, null, 2),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Chat request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const assistantMessage: Message = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      let accumulatedContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          try {
            const chunk: StreamChunk = JSON.parse(line.slice(6));
            if (chunk.content) {
              accumulatedContent += chunk.content;
              setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'assistant', content: accumulatedContent }
              ]);
            }

            if (chunk.done) {
              return;
            }
          } catch (e) {
            console.error('Error parsing chunk:', e, line);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, there was an error processing your request.' },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleProviderChange = (provider: ProviderType) => {
    setSelectedProvider(provider);
    const defaultModel = models.find(m => m.provider === provider);
    if (defaultModel) {
      setSelectedModel(defaultModel.id);
    }
  };

  return (
    <div className="flex h-[100vh] bg-gray-50">
      <Sidebar
        models={models}
        selectedProvider={selectedProvider}
        selectedModel={selectedModel}
        onProviderChange={handleProviderChange}
        onModelChange={setSelectedModel}
        onSettingsClick={() => {}}
      />
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="flex-1 overflow-y-auto p-4 pb-40">
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>
    </div>
  );
};
