import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Create } from './components/pages/Create';
import { Edit } from './components/pages/Edit';
import { History } from './components/pages/History';
import { Launch } from './components/pages/Launch';
import { Welcome } from './components/pages/Welcome';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, loading } = useAuth();

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