import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  MessageCircle,
  ArrowUpRight,
  ChevronRight,
  QrCode,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

function InstagramIcon({ size = 20 }) {
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

function FacebookIcon({ size = 20 }) {
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

// Custom TikTok SVG Icon for crisp matching style
function TikTokIcon({ size = 20 }) {
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
  const { settings, products, trackHubVisit, trackSocialClick, buildWhatsappUrl } = useStore();
  const hasTrackedRef = useRef(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (!hasTrackedRef.current) {
      hasTrackedRef.current = true;
      trackHubVisit();
    }
  }, []);

  const handleSocialOutbound = (platform, url) => {
    trackSocialClick(platform);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDirectWhatsapp = () => {
    trackSocialClick('whatsappDirect');
    const url = buildWhatsappUrl(settings.whatsappDefaultMsg);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://handmadehouse.com';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&color=4B3629&bgcolor=EAE2DC&data=${encodeURIComponent(
    currentOrigin
  )}`;

  return (
    <div className="hub-wrapper page-transition">
      {/* Top Bar with QR Code Preview & Admin Link */}
      <div className="hub-top-bar">
        <button
          type="button"
          className="qr-badge"
          onClick={() => setShowQrModal(true)}
          title="View Customer QR Code"
        >
          <QrCode size={14} />
          <span>Customer QR Hub</span>
        </button>

        <button
          type="button"
          className="admin-Portal-btn"
          onClick={() => navigate('/admin')}
        >
          <ShieldCheck size={14} />
          <span>Admin Dashboard</span>
        </button>
      </div>

      {/* Main Brand Hub Card */}
      <main className="hub-card">
        <div className="hub-logo-container stagger-1">
          <img
            src="/logo.jpg"
            alt={settings.brandName}
            className="hub-logo-img"
          />
        </div>

        <h1 className="hub-brand-title stagger-2">{settings.brandName}</h1>
        <p className="hub-brand-bio stagger-2">{settings.tagline}</p>

        {/* Main Menu Buttons */}
        <nav className="hub-menu-list" aria-label="Main Brand Navigation">
          {/* 1. View List -> Catalog Page */}
          <button
            type="button"
            className="hub-btn hub-btn-primary stagger-3"
            onClick={() => navigate('/catalog')}
          >
            <div className="hub-btn-left">
              <div className="hub-btn-icon">
                <ShoppingBag size={20} />
              </div>
              <div className="hub-btn-text-group">
                <span className="hub-btn-title">View List</span>
                <span className="hub-btn-sub">
                  Browse our {products.length} handmade items & collections
                </span>
              </div>
            </div>
            <ChevronRight size={20} />
          </button>

          {/* 2. Instagram */}
          <button
            type="button"
            className="hub-btn stagger-4"
            onClick={() => handleSocialOutbound('instagram', settings.instagramUrl)}
          >
            <div className="hub-btn-left">
              <div className="hub-btn-icon">
                <InstagramIcon size={20} />
              </div>
              <div className="hub-btn-text-group">
                <span className="hub-btn-title">Instagram</span>
                <span className="hub-btn-sub">Behind the scenes & latest drops</span>
              </div>
            </div>
            <ArrowUpRight size={18} />
          </button>

          {/* 3. Facebook */}
          <button
            type="button"
            className="hub-btn stagger-4"
            onClick={() => handleSocialOutbound('facebook', settings.facebookUrl)}
          >
            <div className="hub-btn-left">
              <div className="hub-btn-icon">
                <FacebookIcon size={20} />
              </div>
              <div className="hub-btn-text-group">
                <span className="hub-btn-title">Facebook</span>
                <span className="hub-btn-sub">Community stories & workshop updates</span>
              </div>
            </div>
            <ArrowUpRight size={18} />
          </button>

          {/* 4. TikTok */}
          <button
            type="button"
            className="hub-btn stagger-5"
            onClick={() => handleSocialOutbound('tiktok', settings.tiktokUrl)}
          >
            <div className="hub-btn-left">
              <div className="hub-btn-icon">
                <TikTokIcon size={20} />
              </div>
              <div className="hub-btn-text-group">
                <span className="hub-btn-title">TikTok</span>
                <span className="hub-btn-sub">Watch the crafting process in motion</span>
              </div>
            </div>
            <ArrowUpRight size={18} />
          </button>

          {/* 5. WhatsApp (for contact) */}
          <button
            type="button"
            className="hub-btn hub-btn-whatsapp stagger-6"
            onClick={handleDirectWhatsapp}
          >
            <div className="hub-btn-left">
              <div className="hub-btn-icon">
                <MessageCircle size={20} />
              </div>
              <div className="hub-btn-text-group">
                <span className="hub-btn-title">WhatsApp (For Contact)</span>
                <span className="hub-btn-sub">Custom orders & direct inquiries</span>
              </div>
            </div>
            <ArrowUpRight size={18} />
          </button>
        </nav>
      </main>

      <footer className="hub-footer">
        <p style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <Sparkles size={13} /> Every piece is uniquely crafted by hand • © {new Date().getFullYear()}{' '}
          {settings.brandName}
        </p>
      </footer>

      {/* Printable QR Code Modal for Store Packaging / Cards */}
      {showQrModal && (
        <div className="modal-backdrop" onClick={() => setShowQrModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '380px', textAlign: 'center', padding: '2rem 1.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowQrModal(false)}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>Brand QR Code</h2>
            <p
              style={{
                fontSize: '0.84rem',
                color: 'var(--brand-espresso-light)',
                marginBottom: '1.25rem',
              }}
            >
              Customers scan this code on packaging or craft fair displays to open your Handmade House hub.
            </p>
            <div
              style={{
                background: 'var(--bg-primary)',
                padding: '1.25rem',
                borderRadius: '16px',
                border: 'var(--border-strong)',
                display: 'inline-block',
                marginBottom: '1rem',
              }}
            >
              <img
                src={qrImageUrl}
                alt="Handmade House QR Code"
                style={{ width: '200px', height: '200px', display: 'block' }}
              />
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--brand-espresso-light)' }}>
              Scan with any smartphone camera to visit: <br />
              <strong style={{ color: 'var(--brand-espresso-dark)' }}>{currentOrigin}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
