import { useState } from 'react';
import { LoginModal } from '../auth/LoginModal';

export const Welcome: React.FC = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo and Title */}
          <div className="mb-8">
            <div className="flex justify-center items-center mb-6">
              <img
                src="/logo.svg"
                alt="memeGen"
                className="h-16 w-16 mr-4"
              />
              <h1 className="text-5xl font-bold text-gray-900">
                memeGen
              </h1>
            </div>
            <p className="text-xl text-gray-600 mb-8">
              AI-powered meme generator
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Memes</h3>
              <p className="text-gray-600">
                Generate hilarious memes with AI-powered creativity. Just describe your idea and watch it come to life.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="text-4xl mb-4">✏️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Edit & Customize</h3>
              <p className="text-gray-600">
                Fine-tune your memes with our advanced editing tools. Adjust text, style, and effects to perfection.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Save History</h3>
              <p className="text-gray-600">
                Keep track of all your creations. Access your meme history anytime and share your favorites.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Create Amazing Memes?
            </h2>
            <p className="text-gray-600 mb-6">
              Join thousands of users who are already creating viral content with our AI-powered platform.
            </p>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-medium"
            >
              Get Started
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">
              Free to start • No credit card required • Instant access
            </p>
          </div>
        </div>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
};