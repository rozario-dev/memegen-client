import { useState } from 'react';
import { apiService } from '../../services/api';
import type { PromptResponse, ImageGenerationRequest, MultipleImageGenerationRequest, GeneratedImage } from '../../types/api';
import { CREDIT_COSTS, USER_TIER_LABELS, USER_TIER_DESCRIPTIONS, type UserTierType } from '../../config/config';

interface ResultsDisplayProps {
  result: PromptResponse;
  onRegenerate?: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
  result, 
  onRegenerate 
}) => {
  const [copied, setCopied] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<UserTierType>('free');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.generated_prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleGenerateImage = async () => {
    try {
      setGeneratingImage(true);
      setImageError(null);
      
      const imageRequest: ImageGenerationRequest = {
        prompt: result.generated_prompt,
        user_tier: selectedTier,
        shape: (result.parameters.shape as any) || 'square',
        aspect_ratio: (result.parameters as any).aspect_ratio || '1:1',
        image_format: (result.parameters as any).image_format || 'png',
        steps: 20,
        cfg_scale: 7
      };
      
      console.log('Sending image generation request:', imageRequest);
      const response = await apiService.generateImage(imageRequest);
      console.log('Received image generation response:', response);
      
      if (response.image_url) {
        const generatedImage: GeneratedImage = {
          id: response.image_uuid,
          url: response.image_url,
          width: response.width,
          height: response.height,
          format: response.image_format,
          seed: response.seed
        };
        console.log('Setting generated images:', [generatedImage]);
        setGeneratedImages([generatedImage]);
      } else {
        console.log('No image_url in response, response:', response);
        setImageError('No image URL returned from API');
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      setImageError(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleGenerateMultipleImages = async () => {
    try {
      setGeneratingImage(true);
      setImageError(null);
      
      const imageRequest: MultipleImageGenerationRequest = {
        prompt: result.generated_prompt,
        user_tier: selectedTier,
        shape: (result.parameters.shape as any) || 'square',
        aspect_ratio: (result.parameters as any).aspect_ratio || '1:1',
        image_format: (result.parameters as any).image_format || 'png',
        steps: 20,
        cfg_scale: 7,
        count: 4
      };
      
      console.log('Sending multiple image generation request:', imageRequest);
      const response = await apiService.generateMultipleImages(imageRequest);
      console.log('Received multiple image generation response:', response);
      
      if (response.images && response.images.length > 0) {
        const generatedImages: GeneratedImage[] = response.images.map(img => ({
          id: img.image_uuid,
          url: img.image_url,
          width: img.width,
          height: img.height,
          format: img.image_format,
          seed: img.seed
        }));
        console.log('Setting generated images:', generatedImages);
        setGeneratedImages(generatedImages);
      } else {
        console.log('No images in response, response:', response);
        setImageError('No images returned from API');
      }
    } catch (error) {
      console.error('Multiple image generation failed:', error);
      setImageError(error instanceof Error ? error.message : 'Failed to generate images');
    } finally {
      setGeneratingImage(false);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            
            {/* <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600 text-sm">{result.generated_prompt}</p>
            </div> */}
          </div>

          {/* Generated Prompt */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">AI Prompt for logo</h3>
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

          {/* User Tier Selection */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Select Tier</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CREDIT_COSTS) as UserTierType[]).map((tier) => (
                  <label key={tier} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="userTier"
                      value={tier}
                      checked={selectedTier === tier}
                      onChange={(e) => setSelectedTier(e.target.value as UserTierType)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {USER_TIER_LABELS[tier]}
                    </span>
                  </label>
                ))}
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Current Tier: {USER_TIER_LABELS[selectedTier]}
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {CREDIT_COSTS[selectedTier]} credit/image
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {USER_TIER_DESCRIPTIONS[selectedTier]}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Regenerate
              </button>
            )}
            
            {/* <button
              onClick={handleCopy}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Copy Prompt
            </button> */}
            
            <button
              onClick={handleGenerateImage}
              disabled={generatingImage}
              className={`px-4 py-2 rounded-lg transition-colors ${
                generatingImage
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {generatingImage ? 'Generating...' : `Generate Image (${CREDIT_COSTS[selectedTier]} credit)`}
            </button>
            
            <button
              onClick={handleGenerateMultipleImages}
              disabled={generatingImage}
              className={`px-4 py-2 rounded-lg transition-colors ${
                generatingImage
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {generatingImage ? 'Generating...' : `Generate 4 Images (${CREDIT_COSTS[selectedTier] * 4} credits)`}
            </button>
          </div>

          {/* Image Error Display */}
          {imageError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{imageError}</p>
            </div>
          )}

          {/* Generated Images */}
          {generatedImages.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Generated Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedImages.map((image, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg overflow-hidden">
                    <img
                      src={image.url}
                      alt={`Generated meme ${index + 1}`}
                      className="w-full h-auto"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
                      }}
                    />
                    <div className="p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Image {index + 1}</span>
                        <a
                          href={image.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 text-sm"
                        >
                          Open Full Size
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Usage Info */}
          <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
            <p>Generated: {new Date(result.created_at).toLocaleString()}</p>
            <p>ID: {result.id}</p>
          </div>
        </div>
      </div>

      {/* AI Image Generation Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">🎨 Image Generation</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>Click "Generate Image" to create a single meme image</li>
          <li>Click "Generate 4 Images" to create multiple variations</li>
          <li>Or copy the prompt and use with external AI image generators</li>
          <li>Use the generated images for your meme token launch</li>
        </ul>
      </div>
    </div>
  );
};