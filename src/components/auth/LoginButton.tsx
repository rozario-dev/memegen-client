import { useAuth } from '../../hooks/useAuth';

interface LoginButtonProps {
  className?: string;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ className = '' }) => {
  const { login, logout, user, loading } = useAuth();

  const handleLogin = async () => {
    // For now, we'll use a simple token input
    // In production, this would integrate with Supabase auth
    const token = prompt('Enter your JWT token (for testing):');
    if (token) {
      try {
        await login(token);
        // Removed: localStorage writes are managed by apiService.setToken
        // localStorage.setItem('auth_token', token);
      } catch {
        alert('Invalid token');
      }
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <button
        className={`px-4 py-2 rounded-lg bg-gray-200 text-gray-600 cursor-not-allowed ${className}`}
        disabled
      >
        Loading...
      </button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700">
          {user.email}
        </span>
        <button
          onClick={handleLogout}
          className={`px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer ${className}`}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className={`px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors ${className}`}
    >
      Login
    </button>
  );
};