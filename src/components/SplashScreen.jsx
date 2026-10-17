import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, 1800);

    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2400);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`splash-overlay ${exiting ? 'splash-exit' : ''}`}
      onClick={() => {
        setExiting(true);
        setTimeout(() => onComplete && onComplete(), 400);
      }}
      role="status"
      aria-label="Loading Handmade House"
    >
      <div className="splash-logo-frame">
        <img
          src="/logo.jpg"
          alt="Handmade House Logo"
          className="splash-logo-img"
        />
      </div>
      <h1 className="splash-tagline">Handmade House</h1>
      <p className="splash-subtitle">Artisanal • Crafted with Love</p>
      <div className="splash-loader-track">
        <div className="splash-loader-bar" />
      </div>
    </div>
  );
}
