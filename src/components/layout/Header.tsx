import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LoginModal } from '../auth/LoginModal';
import { useAuth } from '../../hooks/useAuth';
// removed: import { formatAddress } from '../../lib/format';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const { user, logout, loading, solanaWalletAddress } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <header className={`bg-white shadow-sm border-b border-gray-200 transition-colors duration-300 relative ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              {/* Mobile menu button - only show when user is logged in */}
              {user && (
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden mr-3 p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  aria-label="Toggle menu"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {isMobileMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>
              )}
              <div className="flex-shrink-0 hidden md:block">
                <img
                  src="/logo.svg"
                  alt="MemeGen"
                  className="h-8 w-8"
                />
              </div>
              <div className="ml-3 hidden md:block">
                <h1 className="text-xl font-bold text-gray-900">
                  MemeGen
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
                    🚀 Web3 Launch
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
                <div className="relative">
                  <button
                    onClick={() => setIsAccountMenuOpen((v) => !v)}
                    className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
                  >
                    <span className="truncate max-w-[180px]" title={user.email || ''}>
                      {user.email}
                    </span>
                    <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isAccountMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                     </svg>
                  </button>

                  {isAccountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
                      <Link
                        to="/account"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Account
                      </Link>
                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          setIsLogoutConfirmOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  )}
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
          <div
            className={`md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-b border-gray-200 transition-all duration-300 ease-in-out z-50 ${
              isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
            }`}
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/create"
                onClick={() => setIsMobileMenuOpen(false)}
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
                onClick={() => setIsMobileMenuOpen(false)}
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
                onClick={() => setIsMobileMenuOpen(false)}
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
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    location.pathname === '/launch'
                      ? 'text-purple-600 bg-purple-50'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  🚀 Web3 Launch
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Logout Confirm Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm to logout</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure to logout</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsLogoutConfirmOpen(false);
                  await handleLogout();
                }}
                className="px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
};