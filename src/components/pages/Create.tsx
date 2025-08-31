import { useState } from 'react';
import { MemeGenerationForm } from '../forms/MemeGenerationForm';
import { ResultsDisplay } from '../results/ResultsDisplay';
import type { DirectImageGenerationResponse } from '../../types/api';

export const Create: React.FC = () => {
  const [generatedResult, setGeneratedResult] = useState<DirectImageGenerationResponse | null>(null);

  const handleGenerated = (result: DirectImageGenerationResponse) => {
    setGeneratedResult(result);
  };

  const handleRegenerate = () => {
    setGeneratedResult(null);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            🚀 Create Your
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {' '}Viral Meme Image
            </span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Generate professional AI prompts for meme image logos with just a few clicks.
            Powered by advanced AI and optimized for Solana blockchain.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="text-green-500">✓</span>
              <span>AI-optimized prompts</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="text-green-500">✓</span>
              <span>Solana-ready</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="text-green-500">✓</span>
              <span>Instant generation</span>
            </div>
          </div>
        </div>
      </section>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
        {generatedResult ? (
          <ResultsDisplay
            result={generatedResult}
            onRegenerate={handleRegenerate}
          />
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                🎨 Generate Your Meme Image Prompt
              </h2>
              <MemeGenerationForm onGenerated={handleGenerated} />
            </div>
          </div>
        )}</div>
      </div>
    </>
  );
};