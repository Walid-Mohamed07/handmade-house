import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import SplashScreen from './components/SplashScreen';
import HomeHub from './pages/HomeHub';
import CatalogPage from './pages/CatalogPage';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <StoreProvider>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Router>
        <Routes>
          <Route path="/" element={<HomeHub />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </StoreProvider>
  );
}
