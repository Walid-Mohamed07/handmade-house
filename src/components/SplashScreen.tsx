import React, { useEffect, useState } from "react";
import { useStore } from "../context/StoreContext.tsx";

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const { settings } = useStore();
  const [exiting, setExiting] = useState<boolean>(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, 1750);

    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2350);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      onClick={() => {
        setExiting(true);
        setTimeout(() => onComplete && onComplete(), 380);
      }}
      role="status"
      aria-label="Loading Handmade House"
      style={{
        backgroundColor: "var(--brand-secondary)",
        color: "var(--brand-primary)",
      }}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center p-8 transition-all duration-650 ease-out ${
        exiting
          ? "opacity-0 scale-105 pointer-events-none invisible"
          : "opacity-100 scale-100"
      }`}
    >
      <div
        style={{
          backgroundColor: "var(--brand-secondary)",
          borderColor:
            "color-mix(in srgb, var(--brand-primary) 20%, transparent)",
        }}
        className="w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden flex items-center justify-center border shadow-2xl animate-splash-logo"
      >
        <img
          src="/logo.jpg"
          alt={settings.brandName || "Handmade House"}
          className="w-[94%] h-[94%] object-contain rounded-full"
        />
      </div>

      <h1 className="mt-7 font-heading text-2xl sm:text-3xl font-semibold tracking-[0.22em] uppercase text-center animate-fade-up">
        {settings.brandName || "Handmade House"}
      </h1>

      <p className="mt-1.5 text-xs sm:text-sm tracking-[0.12em] opacity-75 text-center animate-fade-up">
        Artisanal • Crafted with Love
      </p>

      <div
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--brand-primary) 15%, transparent)",
        }}
        className="mt-8 w-36 h-0.5 rounded-full overflow-hidden"
      >
        <div
          style={{ backgroundColor: "var(--brand-primary)" }}
          className="h-full animate-shimmer-bar"
        />
      </div>
    </div>
  );
}
