import React from 'react';
import { ModelInfo, ProviderType } from '../types';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

interface SidebarProps {
  models: ModelInfo[];
  selectedProvider: ProviderType;
  selectedModel: string;
  onProviderChange: (provider: ProviderType) => void;
  onModelChange: (modelId: string) => void;
  onSettingsClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  models,
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  onSettingsClick,
}) => {
  const providers = Array.from(new Set(models.map(m => m.provider)));
  const providerModels = models.filter(m => m.provider === selectedProvider);

  return (
    <div className="w-64 bg-white border-r h-screen p-4 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Models</h2>
        <button
          onClick={onSettingsClick}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Configure API Keys"
        >
          <Cog6ToothIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {models.length === 0 ? (
        <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
          No models available. Please configure your API keys in the backend .env file.
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider
            </label>
            <select
              className="provider-select"
              value={selectedProvider}
              onChange={(e) => onProviderChange(e.target.value as ProviderType)}
            >
              {providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider.charAt(0).toUpperCase() + provider.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <select
              className="provider-select"
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={providerModels.length === 0}
            >
              {providerModels.length === 0 ? (
                <option value="">No models available</option>
              ) : (
                providerModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.description || model.id}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      )}

      <div className="mt-auto pt-4 border-t">
        <div className="text-xs text-gray-500">
          {selectedModel ? (
            <>Selected: {selectedModel}</>
          ) : (
            <>No model selected</>
          )}
        </div>
      </div>
    </div>
  );
};
