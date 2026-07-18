import React from 'react';

export default function ModelSelector({ selectedModel, onModelChange }) {
  const models = ['llama2', 'mistral', 'neural-chat', 'orca-mini'];

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700">Select Model</label>
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {models.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>
    </div>
  );
}
