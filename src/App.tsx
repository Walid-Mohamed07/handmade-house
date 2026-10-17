import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext.tsx';
import SplashScreen from './components/SplashScreen.tsx';
import HomeHub from './pages/HomeHub.tsx';
import CatalogPage from './pages/CatalogPage.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);

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
