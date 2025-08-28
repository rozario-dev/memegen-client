import { useState } from 'react';
import type { PromptResponse } from '../../types/api';

interface ResultsDisplayProps {
  result: PromptResponse;
  onRegenerate?: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
  result, 
  onRegenerate 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.generated_prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };



  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Generated Prompt</h2>
          <p className="text-blue-100 mt-1">Ready for AI image generation</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Token Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Token Name</h3>
              <p className="text-gray-600">{result.user_input}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Symbol</h3>
              <p className="text-gray-600 uppercase">
                {result.user_input.split(' ').map(word => word.charAt(0)).join('').substring(0, 4)}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600 text-sm">{result.generated_prompt}</p>
            </div>
          </div>

          {/* Generated Prompt */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">AI Prompt</h3>
            <div className="relative">
              <textarea
                value={result.generated_prompt}
                readOnly
                className="w-full h-32 p-4 border border-gray-300 rounded-lg bg-gray-50 resize-none"
              />
              <div className="absolute top-2 right-2">
                <button
                  onClick={handleCopy}
                  className={`px-3 py-1 text-xs rounded ${
                    copied 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Parameters</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(result.parameters).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 capitalize">
                    {key.replace('_', ' ')}
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    {String(value).replace('_', ' ')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4 border-t border-gray-200">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                🔄 Regenerate
              </button>
            )}
            
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              📋 Copy Prompt
            </button>
          </div>

          {/* Usage Info */}
          <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
            <p>Generated: {new Date(result.created_at).toLocaleString()}</p>
            <p>ID: {result.id}</p>
          </div>
        </div>
      </div>

      {/* AI Image Generation Tips */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2">💡 Next Steps</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>Copy the prompt above</li>
          <li>Use with AI image generators like Midjourney, DALL-E, or Stable Diffusion</li>
          <li>Use the generated image for your meme image launch</li>
        </ul>
      </div>
    </div>
  );
};