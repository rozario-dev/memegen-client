import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Create } from './components/pages/Create';
import { Edit } from './components/pages/Edit';
import { History } from './components/pages/History';
import { Launch } from './components/pages/Launch';
import { Welcome } from './components/pages/Welcome';
import { useAuth } from './hooks/useAuth';
import { useEffect, useState } from 'react';

function App() {
  const { user, loading } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Detect if running as standalone (installed) on iOS/Android
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    function onBeforeInstallPrompt(e: any) {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone && window.innerWidth < 640) {
        setShowInstallBanner(true);
      }
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as any);

    // If already installed, hide banner
    if (isStandalone) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as any);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return setShowInstallBanner(false);
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {/* Mobile-only install banner */}
      {showInstallBanner && (
        <div className="sm:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm shadow-lg rounded-xl bg-white border border-gray-200 p-3 flex items-center gap-3">
          <img src="/logo.svg" alt="App" className="w-8 h-8" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">安装 memeGen 到主屏幕</p>
            <p className="text-xs text-gray-500">离线使用、更快加载、全屏体验</p>
          </div>
          <button onClick={() => setShowInstallBanner(false)} className="text-xs text-gray-500 px-2 py-1">稍后</button>
          <button onClick={handleInstallClick} className="text-xs px-3 py-1 bg-purple-600 text-white rounded-md">安装</button>
        </div>
      )}

      {!user ? (
        // Show Welcome component when user is not logged in
        <Welcome />
      ) : (
        // Show normal app layout when user is logged in
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 transition-colors duration-300">
          <Header />
          
          <main className="md:pt-16 pt-0 pb-12">
            {/* Routes */}
            <Routes>
              <Route path="/" element={<Navigate to="/create" replace />} />
              <Route path="/create" element={<Create />} />
              <Route path="/edit" element={<Edit />} />
              <Route path="/history" element={<History />} />
              <Route path="/launch" element={<Launch />} />
              {/* Redirect any unknown routes to create when logged in */}
              <Route path="*" element={<Navigate to="/create" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      )}
    </Router>
  );
}

export default App;