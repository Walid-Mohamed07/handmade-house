import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  MessageCircle,
  ArrowUpRight,
  ChevronRight,
  QrCode,
  Sparkles,
  X,
} from "lucide-react";
import { useStore } from "../context/StoreContext.tsx";

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

export default function HomeHub() {
  const navigate = useNavigate();
  const {
    settings,
    products,
    trackHubVisit,
    trackSocialClick,
    buildWhatsappUrl,
  } = useStore();
  const hasTrackedRef = useRef<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  useEffect(() => {
    if (!hasTrackedRef.current) {
      hasTrackedRef.current = true;
      trackHubVisit();
    }
  }, []);

  const handleSocialOutbound = (platform: string, url: string) => {
    trackSocialClick(platform);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDirectWhatsapp = () => {
    trackSocialClick("whatsappDirect");
    const url = buildWhatsappUrl(settings.whatsappDefaultMsg);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const currentOrigin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://handmadehouse.com";
  const primaryHex = (settings.theme?.primaryColor || "#4B3629").replace(
    "#",
    "",
  );
  const secondaryHex = (settings.theme?.secondaryColor || "#EAE2DC").replace(
    "#",
    "",
  );
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&color=${primaryHex}&bgcolor=${secondaryHex}&data=${encodeURIComponent(
    currentOrigin,
  )}`;

  return (
    <div
      style={{
        backgroundColor: "var(--brand-secondary)",
        color: "var(--brand-primary)",
      }}
      className="min-h-screen flex flex-col items-center justify-between px-4 sm:px-6 py-6 sm:py-8 animate-fade-up"
    >
      {/* Top Bar: Customer Share QR button only */}
      <div className="w-full max-w-md flex justify-end items-center mb-2">
        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          title="Share QR Code"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--brand-surface) 85%, transparent)",
            borderColor:
              "color-mix(in srgb, var(--brand-primary) 16%, transparent)",
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-medium backdrop-blur-md shadow-xs hover:scale-105 transition-transform cursor-pointer"
        >
          <QrCode size={14} />
          <span>Share QR</span>
        </button>
      </div>

      {/* Main Brand Hub Card */}
      <main
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--brand-surface) 88%, transparent)",
          borderColor:
            "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
        }}
        className="responsive-hub-card w-full max-w-md rounded-3xl border p-6 sm:p-9 shadow-xl backdrop-blur-lg text-center my-auto"
      >
        <div
          style={{
            // backgroundColor: 'var(--brand-secondary)',
            borderColor:
              "color-mix(in srgb, var(--brand-primary) 26%, transparent)",
          }}
          className="responsive-hub-logo w-38 h-38 sm:w-42 sm:h-42 mx-auto mb-4 rounded-full border p-2 flex items-center justify-center shadow-md animate-float-slow stagger-1"
        >
          <img
            src="/logo.jpg"
            alt={settings.brandName}
            className="w-full h-full object-contain rounded-full"
          />
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-wider uppercase mb-1.5 stagger-2">
          {settings.brandName}
        </h1>
        <p className="text-sm opacity-80 max-w-xs mx-auto mb-7 stagger-2">
          {settings.tagline}
        </p>

        {/* Main Menu Buttons */}
        <nav
          className="flex flex-col gap-3.5"
          aria-label="Main Brand Navigation"
        >
          <button
            type="button"
            onClick={() => navigate("/catalog")}
            style={{
              backgroundColor: "var(--brand-primary)",
              color: "var(--brand-surface)",
            }}
            className="stagger-3 w-full flex items-center justify-between px-5 py-4 rounded-2xl font-semibold shadow-md hover:-translate-y-1 hover:shadow-lg active:translate-y-0 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <ShoppingBag size={20} />
              </div>
              <div className="text-left">
                <span className="block text-base leading-tight">View List</span>
                <span className="block text-xs font-normal opacity-80 mt-0.5">
                  Browse our {products.length} handmade items & collections
                </span>
              </div>
            </div>
            <ChevronRight size={20} className="shrink-0" />
          </button>

          <button
            type="button"
            onClick={() =>
              handleSocialOutbound("instagram", settings.instagramUrl)
            }
            style={{
              backgroundColor: "var(--brand-surface)",
              borderColor:
                "color-mix(in srgb, var(--brand-primary) 15%, transparent)",
            }}
            className="stagger-4 w-full flex items-center justify-between px-4.5 py-3.5 rounded-2xl border font-semibold shadow-xs hover:-translate-y-1 hover:shadow-md active:translate-y-0 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
                }}
                className="w-9.5 h-9.5 rounded-xl flex items-center justify-center shrink-0"
              >
                <InstagramIcon size={20} />
              </div>
              <div className="text-left">
                <span className="block text-[15px] leading-tight">
                  Instagram
                </span>
                <span className="block text-xs font-normal opacity-75 mt-0.5">
                  Behind the scenes & latest drops
                </span>
              </div>
            </div>
            <ArrowUpRight size={18} className="opacity-75 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() =>
              handleSocialOutbound("facebook", settings.facebookUrl)
            }
            style={{
              backgroundColor: "var(--brand-surface)",
              borderColor:
                "color-mix(in srgb, var(--brand-primary) 15%, transparent)",
            }}
            className="stagger-4 w-full flex items-center justify-between px-4.5 py-3.5 rounded-2xl border font-semibold shadow-xs hover:-translate-y-1 hover:shadow-md active:translate-y-0 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
                }}
                className="w-9.5 h-9.5 rounded-xl flex items-center justify-center shrink-0"
              >
                <FacebookIcon size={20} />
              </div>
              <div className="text-left">
                <span className="block text-[15px] leading-tight">
                  Facebook
                </span>
                <span className="block text-xs font-normal opacity-75 mt-0.5">
                  Community stories & workshop updates
                </span>
              </div>
            </div>
            <ArrowUpRight size={18} className="opacity-75 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => handleSocialOutbound("tiktok", settings.tiktokUrl)}
            style={{
              backgroundColor: "var(--brand-surface)",
              borderColor:
                "color-mix(in srgb, var(--brand-primary) 15%, transparent)",
            }}
            className="stagger-5 w-full flex items-center justify-between px-4.5 py-3.5 rounded-2xl border font-semibold shadow-xs hover:-translate-y-1 hover:shadow-md active:translate-y-0 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
                }}
                className="w-9.5 h-9.5 rounded-xl flex items-center justify-center shrink-0"
              >
                <TikTokIcon size={20} />
              </div>
              <div className="text-left">
                <span className="block text-[15px] leading-tight">TikTok</span>
                <span className="block text-xs font-normal opacity-75 mt-0.5">
                  Watch the crafting process in motion
                </span>
              </div>
            </div>
            <ArrowUpRight size={18} className="opacity-75 shrink-0" />
          </button>

          <button
            type="button"
            onClick={handleDirectWhatsapp}
            style={{
              backgroundColor: "var(--brand-accent)",
              color: "#FFFFFF",
            }}
            className="stagger-6 w-full flex items-center justify-between px-4.5 py-3.5 rounded-2xl font-semibold shadow-md hover:-translate-y-1 hover:shadow-lg active:translate-y-0 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9.5 h-9.5 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <MessageCircle size={20} />
              </div>
              <div className="text-left">
                <span className="block text-[15px] leading-tight">
                  WhatsApp (For Contact)
                </span>
                <span className="block text-xs font-normal opacity-85 mt-0.5">
                  Custom orders & direct inquiries
                </span>
              </div>
            </div>
            <ArrowUpRight size={18} className="shrink-0" />
          </button>
        </nav>
      </main>

      <footer className="mt-6 text-center text-xs opacity-75">
        <p className="inline-flex items-center gap-1.5">
          <Sparkles size={13} /> Every piece is uniquely crafted by hand • ©{" "}
          {new Date().getFullYear()} {settings.brandName}
        </p>
      </footer>

      {showQrModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            style={{
              backgroundColor: "var(--brand-surface)",
              color: "var(--brand-primary)",
            }}
            className="w-full max-w-sm rounded-3xl p-7 shadow-2xl relative text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center border border-current/15 hover:bg-black/5 cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <h2 className="font-heading text-2xl font-bold mb-1">
              Brand QR Code
            </h2>
            <p className="text-xs opacity-75 mb-5">
              Scan this code to open the {settings.brandName} page directly on
              any smartphone.
            </p>

            <div
              style={{
                backgroundColor: "var(--brand-secondary)",
                borderColor:
                  "color-mix(in srgb, var(--brand-primary) 25%, transparent)",
              }}
              className="inline-block p-4 rounded-2xl border mb-4"
            >
              <img
                src={qrImageUrl}
                alt="Handmade House QR Code"
                className="w-48 h-48 block"
              />
            </div>

            <p className="text-xs opacity-80 break-all font-medium">
              {currentOrigin}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
