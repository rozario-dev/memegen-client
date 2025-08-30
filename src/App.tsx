import { useState } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MemeGenerationForm } from './components/forms/MemeGenerationForm';
import { ResultsDisplay } from './components/results/ResultsDisplay';
import type { DirectImageGenerationResponse } from './types/api';

function App() {
  const [generatedResult, setGeneratedResult] = useState<DirectImageGenerationResponse | null>(null);

  const handleGenerated = (result: DirectImageGenerationResponse) => {
    setGeneratedResult(result);
  };

  const handleRegenerate = () => {
    setGeneratedResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 transition-colors duration-300">
      <Header />
      
      <main className="pt-16 pb-12">
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

        {/* Main Content */}
        <section className="px-4 sm:px-6 lg:px-8">
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

                {/* Features Section */}
                {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="text-3xl mb-3">🤖</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered</h3>
                    <p className="text-gray-600 text-sm">
                      Advanced AI generates optimized prompts for modern image generators
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="text-3xl mb-3">⚡</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast & Easy</h3>
                    <p className="text-gray-600 text-sm">
                      Generate prompts in seconds with our intuitive interface
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="text-3xl mb-3">🎯</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Solana Ready</h3>
                    <p className="text-gray-600 text-sm">
                      Designed specifically for Solana meme image launches
                    </p>
                  </div>
                </div> */}

                {/* How It Works */}
                {/* <div className="bg-white rounded-lg shadow-lg p-6 mt-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    How It Works
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mx-auto mb-3">1</div>
                      <h3 className="font-semibold text-gray-900 mb-2">Describe Your Meme</h3>
                      <p className="text-sm text-gray-600">Enter your meme image concept</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold mx-auto mb-3">2</div>
                      <h3 className="font-semibold text-gray-900 mb-2">Customize Parameters</h3>
                      <p className="text-sm text-gray-600">Choose style, shape, and quality</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold mx-auto mb-3">3</div>
                      <h3 className="font-semibold text-gray-900 mb-2">Generate Prompt</h3>
                      <p className="text-sm text-gray-600">AI creates optimized prompt</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-bold mx-auto mb-3">4</div>
                      <h3 className="font-semibold text-gray-900 mb-2">Launch Coin</h3>
                      <p className="text-sm text-gray-600">Use prompt for your meme image</p>
                    </div>
                  </div>
                </div> */}
              </div>
            )}
          </div>
        </section>
      </main>

        <Footer />
      </div>
  );
}

export default App;