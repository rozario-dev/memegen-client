import { AuthCallback } from '../components/auth/AuthCallback';
import App from '../App';

export const Router: React.FC = () => {
  const path = window.location.pathname;

  if (path === '/auth/callback') {
    return <AuthCallback />;
  }

  return <App />;
};