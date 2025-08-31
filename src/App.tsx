import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Create } from './components/pages/Create';
import { Edit } from './components/pages/Edit';
import { History } from './components/pages/History';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 transition-colors duration-300">
        <Header />
        
        <main className="pt-16 pb-12">
          {/* Routes */}
          <Routes>
            <Route path="/" element={<Navigate to="/create" replace />} />
            <Route path="/create" element={<Create />} />
            <Route path="/edit" element={<Edit />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;