import { useState } from 'react';
import { LoginModal } from '../auth/LoginModal';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user, logout, loading, solanaWalletAddress } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <header className={`bg-white shadow-sm border-b border-gray-200 transition-colors duration-300 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img
                  src="/logo.svg"
                  alt="memeGen"
                  className="h-8 w-8"
                />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">
                  memeGen
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  AI-powered meme coin generator
                </p>
              </div>
            </div>

            {/* Navigation */}
            {/* <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#generate"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Generate
              </a>
              <a
                href="#features"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Features
              </a>
              <a
                href="#about"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                About
              </a>
            </nav> */}

            {/* Wallet Button and Auth */}
            <div className="flex items-center space-x-4">              
              {/* Login/Logout */}
              {loading ? (
                <button
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-600 cursor-not-allowed text-sm"
                  disabled
                >
                  Loading...
                </button>
              ) : user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {(() => {
                      console.log('User object:', user);
                      console.log('User email:', user.email);
                      console.log('User id:', user.id);
                      console.log('Solana wallet address:', solanaWalletAddress);
                      
                      // If we have a Solana wallet address, use it
                      if (solanaWalletAddress) {
                        return `${solanaWalletAddress.slice(0, 4)}...${solanaWalletAddress.slice(-4)}`;
                      }
                      
                      // Check if this is a Solana user based on email pattern
                      const isSolanaUser = user.email?.includes('@solana.wallet') ||
                                          !user.email || 
                                          user.email === user.id;
                      
                      console.log('Is Solana user:', isSolanaUser);
                      
                      if (isSolanaUser && user.id) {
                        return `${user.id.slice(0, 4)}...${user.id.slice(-4)}`;
                      } else {
                        return user.email || user.id;
                      }
                    })()
                    }
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a
              href="#generate"
              className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Generate
            </a>
            <a
              href="#features"
              className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              About
            </a>
          </div>
        </div>
      </header>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      

    </>
  );
};