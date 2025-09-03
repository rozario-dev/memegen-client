import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LoginModal } from '../auth/LoginModal';
import { useAuth } from '../../hooks/useAuth';
import { formatAddress } from '../../utils/format';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user, logout, loading, solanaWalletAddress } = useAuth();
  const location = useLocation();

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
                  AI-powered meme generator
                </p>
              </div>
            </div>

            {/* Navigation - Only show when user is logged in */}
            {user && (
              <nav className="hidden md:flex items-center space-x-8">
                <Link
                  to="/create"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/create'
                      ? 'text-purple-600 bg-purple-50'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  🎨 Create
                </Link>
                <Link
                  to="/edit"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/edit'
                      ? 'text-purple-600 bg-purple-50'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  ✏️ Edit
                </Link>
                <Link
                  to="/history"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/history'
                      ? 'text-purple-600 bg-purple-50'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  📚 History
                </Link>
                {/* Launch link - only show for Solana users */}
                {solanaWalletAddress && (
                  <Link
                    to="/launch"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/launch'
                        ? 'text-purple-600 bg-purple-50'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    🚀 Launch
                  </Link>
                )}
              </nav>
            )}

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
                      return formatAddress(solanaWalletAddress, 4, 4);
                      }
                      
                      // Check if this is a Solana user based on email pattern
                      const isSolanaUser = user.email?.includes('@solana.wallet') ||
                                          !user.email || 
                                          user.email === user.id;
                      
                      if (isSolanaUser) {
                        // For Solana users, show truncated user ID
                        return formatAddress(user.id, 4, 4);
                      } else {
                        // For regular users, show email
                        return user.email;
                      }
                    })()} 
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation - Only show when user is logged in */}
        {user && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              <Link
                to="/create"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  location.pathname === '/create'
                    ? 'text-purple-600 bg-purple-50'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                🎨 Create
              </Link>
              <Link
                to="/edit"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  location.pathname === '/edit'
                    ? 'text-purple-600 bg-purple-50'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                ✏️ Edit
              </Link>
              <Link
                to="/history"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  location.pathname === '/history'
                    ? 'text-purple-600 bg-purple-50'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                📚 History
              </Link>
              {/* Launch link - only show for Solana users */}
              {solanaWalletAddress && (
                <Link
                  to="/launch"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    location.pathname === '/launch'
                      ? 'text-purple-600 bg-purple-50'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  🚀 Launch
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
};