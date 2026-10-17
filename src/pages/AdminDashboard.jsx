import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Package,
  Tags,
  Settings,
  LogOut,
  ExternalLink,
  Plus,
  Edit3,
  Trash2,
  Eye,
  MessageCircle,
  TrendingUp,
  Award,
  Sparkles,
  Lock,
  Mail,
  KeyRound,
  RotateCcw,
  Upload,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    products,
    categories,
    settings,
    analytics,
    adminUser,
    adminCreds,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    deleteCategory,
    updateSettings,
    loginAdmin,
    logoutAdmin,
    updateAdminCredentials,
    resetDemoData,
  } = useStore();

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard Active Tab
  const [activeTab, setActiveTab] = useState('analytics');
  const [toastMsg, setToastMsg] = useState('');

  // Product Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: categories[0]?.name || 'Ceramics & Pottery',
    price: '',
    stockStatus: 'In Stock',
    description: '',
    images: [''],
  });

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');

  // Settings & Security Form States
  const [settingsForm, setSettingsForm] = useState(settings);
  const [securityForm, setSecurityForm] = useState({
    email: adminCreds.email,
    password: adminCreds.password,
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3200);
  };

  // Computed Analytics Metrics
  const stats = useMemo(() => {
    const totalProductViews = products.reduce((acc, p) => acc + (p.views || 0), 0);
    const totalItemWhatsappContacts = products.reduce(
      (acc, p) => acc + (p.whatsappClicks || 0),
      0
    );
    const totalVisits =
      (analytics.totalQrLandingVisits || 0) + (analytics.totalCatalogVisits || 0);

    const conversionRate =
      totalProductViews > 0
        ? ((totalItemWhatsappContacts / totalProductViews) * 100).toFixed(1)
        : '0.0';

    const byContacted = [...products].sort(
      (a, b) => (b.whatsappClicks || 0) - (a.whatsappClicks || 0)
    );
    const byVisited = [...products].sort((a, b) => (b.views || 0) - (a.views || 0));

    // Category Breakdown
    const categoryStats = categories.map((cat) => {
      const catItems = products.filter((p) => p.category === cat.name);
      const views = catItems.reduce((sum, p) => sum + (p.views || 0), 0);
      const contacts = catItems.reduce((sum, p) => sum + (p.whatsappClicks || 0), 0);
      return {
        name: cat.name,
        itemCount: catItems.length,
        views,
        contacts,
      };
    });

    return {
      totalVisits,
      totalProductViews,
      totalItemWhatsappContacts,
      conversionRate,
      mostContactedItem: byContacted[0] || null,
      mostVisitedItem: byVisited[0] || null,
      byContacted,
      byVisited,
      categoryStats,
    };
  }, [products, categories, analytics]);

  // Handle Login Submission
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    const res = loginAdmin(loginEmail, loginPassword);
    if (!res.success) {
      setLoginError(res.error);
    }
  };

  const fillDemoCreds = () => {
    setLoginEmail(adminCreds.email);
    setLoginPassword(adminCreds.password);
    setLoginError('');
  };

  // Product Form Handlers
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: categories[0]?.name || 'Ceramics & Pottery',
      price: '',
      stockStatus: 'In Stock',
      description: '',
      images: [''],
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      price: product.price,
      stockStatus: product.stockStatus || 'In Stock',
      description: product.description,
      images: product.images && product.images.length > 0 ? product.images : [''],
    });
    setIsProductModalOpen(true);
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setProductForm((prev) => {
        const cleaned = prev.images.filter((img) => img.trim() !== '');
        return { ...prev, images: [...cleaned, dataUrl] };
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    const validImages = productForm.images.map((u) => u.trim()).filter(Boolean);
    const payload = {
      name: productForm.name.trim(),
      category: productForm.category,
      price: Number(productForm.price) || 0,
      stockStatus: productForm.stockStatus,
      description: productForm.description.trim(),
      images: validImages.length > 0 ? validImages : ['/logo.jpg'],
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
      showToast(`Updated "${payload.name}"`);
    } else {
      addProduct(payload);
      showToast(`Added "${payload.name}" to catalog`);
    }
    setIsProductModalOpen(false);
  };

  // IF NOT AUTHENTICATED: Render Full Email & Password Login Screen
  if (!adminUser) {
    return (
      <div className="auth-wrapper page-transition">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <img
              src="/logo.jpg"
              alt="Handmade House"
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: 'var(--border-strong)',
                marginBottom: '0.75rem',
              }}
            />
            <h1 style={{ fontSize: '1.8rem' }}>Admin Sign In</h1>
            <p style={{ fontSize: '0.84rem', color: 'var(--brand-espresso-light)' }}>
              Sign in with your email and password to manage Handmade House
            </p>
          </div>

          {loginError && (
            <div
              style={{
                background: 'var(--status-sold-bg)',
                color: 'var(--status-sold-text)',
                padding: '0.75rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Admin Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--brand-espresso-light)',
                  }}
                />
                <input
                  type="email"
                  required
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="admin@handmadehouse.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <KeyRound
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--brand-espresso-light)',
                  }}
                />
                <input
                  type="password"
                  required
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary-admin"
              style={{ width: '100%', padding: '0.85rem', marginTop: '0.4rem' }}
            >
              <Lock size={16} />
              <span>Sign In to Dashboard</span>
            </button>
          </form>

          {/* Helpful Demo Credential Box */}
          <div
            style={{
              marginTop: '1.35rem',
              padding: '0.85rem',
              borderRadius: '10px',
              background: 'var(--bg-primary)',
              border: 'var(--border-subtle)',
              fontSize: '0.78rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.35rem',
              }}
            >
              <strong>Default Admin Credentials:</strong>
              <button
                type="button"
                onClick={fillDemoCreds}
                style={{
                  textDecoration: 'underline',
                  fontWeight: 600,
                  color: 'var(--brand-espresso-dark)',
                }}
              >
                Auto-fill
              </button>
            </div>
            <div>Email: {adminCreds.email}</div>
            <div>Password: {adminCreds.password}</div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn-outline-admin"
              onClick={() => navigate('/')}
            >
              ← Back to Customer QR Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="admin-layout page-transition">
      {/* Top Bar */}
      <header className="admin-topbar">
        <div className="admin-brand">
          <img src="/logo.jpg" alt="Logo" />
          <div>
            <h1 style={{ color: '#FAF8F6', fontSize: '1.25rem', lineHeight: 1.1 }}>
              {settings.brandName} — Admin
            </h1>
            <span style={{ fontSize: '0.74rem', opacity: 0.75 }}>
              Signed in as {adminUser.email}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-outline-admin"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#FFF', border: 'none' }}
            onClick={() => navigate('/')}
          >
            <ExternalLink size={14} />
            <span>QR Menu</span>
          </button>
          <button
            type="button"
            className="btn-outline-admin"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#FFF', border: 'none' }}
            onClick={() => navigate('/catalog')}
          >
            <ExternalLink size={14} />
            <span>View List</span>
          </button>
          <button
            type="button"
            className="btn-outline-admin"
            style={{ background: '#9E3B3B', color: '#FFF', border: 'none' }}
            onClick={logoutAdmin}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="admin-tabs-nav" aria-label="Admin Sections">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={16} />
          <span>Overview & Item Analytics</span>
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={16} />
          <span>Products ({products.length})</span>
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Tags size={16} />
          <span>Categories ({categories.length})</span>
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => {
            setSettingsForm(settings);
            setActiveTab('settings');
          }}
        >
          <Settings size={16} />
          <span>Social Links & Security</span>
        </button>
      </nav>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 3000,
            background: 'var(--brand-espresso-dark)',
            color: '#FFF',
            padding: '0.8rem 1.2rem',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.86rem',
          }}
        >
          <CheckCircle2 size={16} color="#4ADE80" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="admin-main">
        {/* =================================================================
            TAB 1: ANALYTICS & INSIGHTS
            ================================================================= */}
        {activeTab === 'analytics' && (
          <div>
            {/* Top 4 KPI Cards */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div>
                  <span className="kpi-label">Total Page Visits</span>
                  <div className="kpi-value">{stats.totalVisits}</div>
                  <span className="kpi-sub">
                    {analytics.totalQrLandingVisits} QR Menu • {analytics.totalCatalogVisits} Catalog
                  </span>
                </div>
                <div className="kpi-icon-box">
                  <Eye size={20} />
                </div>
              </div>

              <div className="kpi-card">
                <div>
                  <span className="kpi-label">Item "Contact for Info" Hits</span>
                  <div className="kpi-value" style={{ color: '#246A46' }}>
                    {stats.totalItemWhatsappContacts}
                  </div>
                  <span className="kpi-sub">
                    +{analytics.socialClicks?.whatsappDirect || 0} direct main menu WhatsApp hits
                  </span>
                </div>
                <div className="kpi-icon-box" style={{ background: '#E3EFE8', color: '#246A46' }}>
                  <MessageCircle size={20} />
                </div>
              </div>

              <div className="kpi-card">
                <div>
                  <span className="kpi-label">Inquiry Conversion Rate</span>
                  <div className="kpi-value">{stats.conversionRate}%</div>
                  <span className="kpi-sub">
                    From {stats.totalProductViews} total item detail views
                  </span>
                </div>
                <div className="kpi-icon-box">
                  <TrendingUp size={20} />
                </div>
              </div>

              <div className="kpi-card">
                <div>
                  <span className="kpi-label">#1 Most Contacted Item</span>
                  <div
                    className="kpi-value"
                    style={{ fontSize: '1.25rem', marginTop: '0.45rem', lineHeight: 1.25 }}
                  >
                    {stats.mostContactedItem ? stats.mostContactedItem.name : 'N/A'}
                  </div>
                  <span className="kpi-sub">
                    {stats.mostContactedItem
                      ? `${stats.mostContactedItem.whatsappClicks} WhatsApp clicks • ${stats.mostContactedItem.views} views`
                      : 'No data yet'}
                  </span>
                </div>
                <div className="kpi-icon-box" style={{ background: '#F5EBE0', color: '#94622A' }}>
                  <Award size={20} />
                </div>
              </div>
            </div>

            {/* Spotlight Row: Most Contacted vs Most Visited */}
            <div className="admin-grid-2col">
              {/* Bar Leaderboard: Most Contacted & Visited Items */}
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <div>
                    <h2 className="admin-panel-title">
                      Most Contacted & Visited Items
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--brand-espresso-light)' }}>
                      Comparison of item views vs. "Contact for Info" WhatsApp clicks
                    </p>
                  </div>
                </div>

                {stats.byContacted.slice(0, 6).map((item, idx) => {
                  const maxViews = Math.max(
                    1,
                    ...products.map((p) => Math.max(p.views || 0, p.whatsappClicks || 0))
                  );
                  const viewPct = Math.min(100, Math.round(((item.views || 0) / maxViews) * 100));
                  const contactPct = Math.min(
                    100,
                    Math.round(((item.whatsappClicks || 0) / maxViews) * 100)
                  );
                  const conv =
                    item.views > 0
                      ? Math.round(((item.whatsappClicks || 0) / item.views) * 100)
                      : 0;

                  return (
                    <div key={item.id} className="bar-row">
                      <div className="bar-label-line">
                        <span>
                          #{idx + 1} {item.name}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--brand-espresso-light)' }}>
                          <strong>{item.whatsappClicks || 0}</strong> WhatsApp hits •{' '}
                          <strong>{item.views || 0}</strong> views ({conv}% conv.)
                        </span>
                      </div>
                      <div className="bar-track" style={{ marginBottom: '4px' }}>
                        <div
                          className="bar-fill"
                          style={{ width: `${viewPct}%` }}
                          title={`${item.views} Views`}
                        />
                      </div>
                      <div className="bar-track" style={{ height: '7px' }}>
                        <div
                          className="bar-fill whatsapp"
                          style={{ width: `${contactPct}%` }}
                          title={`${item.whatsappClicks} WhatsApp Inquiries`}
                        />
                      </div>
                    </div>
                  );
                })}
                <div
                  style={{
                    display: 'flex',
                    gap: '1.25rem',
                    fontSize: '0.76rem',
                    marginTop: '0.75rem',
                    color: 'var(--brand-espresso-light)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: 'var(--brand-espresso)',
                      }}
                    />
                    Item Views
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: '#246A46',
                      }}
                    />
                    "Contact for Info" WhatsApp Clicks
                  </span>
                </div>
              </div>

              {/* Right Column: Social Button Clicks + Category Demand */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <h2 className="admin-panel-title">Main Menu Social Button Clicks</h2>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        padding: '0.85rem',
                        borderRadius: '10px',
                        background: 'var(--bg-primary)',
                      }}
                    >
                      <div style={{ fontSize: '0.76rem', color: 'var(--brand-espresso-light)' }}>
                        Instagram Clicks
                      </div>
                      <div style={{ fontSize: '1.55rem', fontWeight: 700 }}>
                        {analytics.socialClicks?.instagram || 0}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '0.85rem',
                        borderRadius: '10px',
                        background: 'var(--bg-primary)',
                      }}
                    >
                      <div style={{ fontSize: '0.76rem', color: 'var(--brand-espresso-light)' }}>
                        TikTok Clicks
                      </div>
                      <div style={{ fontSize: '1.55rem', fontWeight: 700 }}>
                        {analytics.socialClicks?.tiktok || 0}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '0.85rem',
                        borderRadius: '10px',
                        background: 'var(--bg-primary)',
                      }}
                    >
                      <div style={{ fontSize: '0.76rem', color: 'var(--brand-espresso-light)' }}>
                        Facebook Clicks
                      </div>
                      <div style={{ fontSize: '1.55rem', fontWeight: 700 }}>
                        {analytics.socialClicks?.facebook || 0}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '0.85rem',
                        borderRadius: '10px',
                        background: '#E3EFE8',
                        color: '#246A46',
                      }}
                    >
                      <div style={{ fontSize: '0.76rem' }}>Direct WhatsApp Button</div>
                      <div style={{ fontSize: '1.55rem', fontWeight: 700 }}>
                        {analytics.socialClicks?.whatsappDirect || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Performance */}
                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <h2 className="admin-panel-title">Demand by Category</h2>
                  </div>
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Items</th>
                          <th>Views</th>
                          <th>WhatsApp Hits</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.categoryStats.map((c) => (
                          <tr key={c.name}>
                            <td style={{ fontWeight: 600 }}>{c.name}</td>
                            <td>{c.itemCount}</td>
                            <td>{c.views}</td>
                            <td style={{ fontWeight: 700, color: '#246A46' }}>{c.contacts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Item Performance Table + Actionable Insights */}
            <div className="admin-grid-2col">
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h2 className="admin-panel-title">
                    Detailed Item Analytics Breakdown
                  </h2>
                </div>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Views</th>
                        <th>Contact Hits</th>
                        <th>Conv. Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.byContacted.map((item) => {
                        const conv =
                          item.views > 0
                            ? ((item.whatsappClicks / item.views) * 100).toFixed(1)
                            : '0.0';
                        return (
                          <tr key={item.id}>
                            <td style={{ fontWeight: 600 }}>{item.name}</td>
                            <td>{item.category}</td>
                            <td>
                              <span
                                className={
                                  item.stockStatus === 'In Stock'
                                    ? 'stock-badge stock-in-stock'
                                    : item.stockStatus === 'Made to Order'
                                    ? 'stock-badge stock-made-to-order'
                                    : 'stock-badge stock-sold-out'
                                }
                              >
                                {item.stockStatus}
                              </span>
                            </td>
                            <td>{item.views || 0}</td>
                            <td style={{ fontWeight: 700, color: '#246A46' }}>
                              {item.whatsappClicks || 0}
                            </td>
                            <td>{conv}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Live Activity Log */}
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h2 className="admin-panel-title">Recent Customer Activity</h2>
                  <button
                    type="button"
                    className="btn-outline-admin"
                    onClick={() => {
                      resetDemoData();
                      showToast('Reset demo data & analytics');
                    }}
                    title="Reset demo statistics"
                  >
                    <RotateCcw size={13} />
                    <span>Reset Demo</span>
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.7rem',
                    maxHeight: '360px',
                    overflowY: 'auto',
                  }}
                >
                  {(analytics.recentEvents || []).slice(0, 12).map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        padding: '0.7rem 0.85rem',
                        borderRadius: '10px',
                        background:
                          ev.type === 'item_contact' ? '#E3EFE8' : 'var(--bg-primary)',
                        border: 'var(--border-subtle)',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{ev.label}</div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--brand-espresso-light)',
                          marginTop: '2px',
                        }}
                      >
                        {new Date(ev.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 2: PRODUCTS MANAGEMENT (CRUD)
            ================================================================= */}
        {activeTab === 'products' && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h2 className="admin-panel-title">Manage Catalog Items</h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--brand-espresso-light)' }}>
                  Add, edit, or remove handmade products shown in the "View List" page
                </p>
              </div>
              <button
                type="button"
                className="btn-primary-admin"
                onClick={openAddProductModal}
              >
                <Plus size={16} />
                <span>Add Handmade Item</span>
              </button>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock Badge</th>
                    <th>Views / Contacts</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <img
                          src={item.images?.[0] || '/logo.jpg'}
                          alt={item.name}
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 8,
                            objectFit: 'cover',
                            border: 'var(--border-subtle)',
                          }}
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--brand-espresso-light)',
                            maxWidth: '280px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.description}
                        </div>
                      </td>
                      <td>{item.category}</td>
                      <td style={{ fontWeight: 700 }}>
                        {settings.currencySymbol}
                        {item.price}
                      </td>
                      <td>
                        <span
                          className={
                            item.stockStatus === 'In Stock'
                              ? 'stock-badge stock-in-stock'
                              : item.stockStatus === 'Made to Order'
                              ? 'stock-badge stock-made-to-order'
                              : 'stock-badge stock-sold-out'
                          }
                        >
                          {item.stockStatus}
                        </span>
                      </td>
                      <td>
                        {item.views || 0} views •{' '}
                        <strong style={{ color: '#246A46' }}>
                          {item.whatsappClicks || 0} WhatsApp
                        </strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.45rem' }}>
                          <button
                            type="button"
                            className="btn-outline-admin"
                            onClick={() => openEditProductModal(item)}
                          >
                            <Edit3 size={14} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="btn-outline-admin"
                            style={{ color: '#9E3B3B' }}
                            onClick={() => {
                              deleteProduct(item.id);
                              showToast(`Deleted "${item.name}"`);
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 3: CATEGORIES MANAGEMENT
            ================================================================= */}
        {activeTab === 'categories' && (
          <div className="admin-grid-2col">
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2 className="admin-panel-title">Product Categories</h2>
              </div>
              <p
                style={{
                  fontSize: '0.84rem',
                  color: 'var(--brand-espresso-light)',
                  marginBottom: '1rem',
                }}
              >
                Categories appear automatically as filter buttons on the customer "View List" page.
              </p>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Category Name</th>
                      <th>Products Assigned</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => {
                      const count = products.filter((p) => p.category === cat.name).length;
                      return (
                        <tr key={cat.id}>
                          <td style={{ fontWeight: 600 }}>{cat.name}</td>
                          <td>{count} items</td>
                          <td>
                            <button
                              type="button"
                              className="btn-outline-admin"
                              style={{ color: '#9E3B3B' }}
                              onClick={() => {
                                deleteCategory(cat.id);
                                showToast(`Removed category "${cat.name}"`);
                              }}
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2 className="admin-panel-title">Add New Category</h2>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const ok = addCategory(newCategoryName);
                  if (ok) {
                    showToast(`Added category "${newCategoryName}"`);
                    setNewCategoryName('');
                  } else {
                    showToast('Category already exists or is empty');
                  }
                }}
              >
                <div className="form-group">
                  <label className="form-label">Category Title</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g., Handwoven Baskets, Leather Goods..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary-admin">
                  <Plus size={16} />
                  <span>Create Category</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 4: SOCIAL LINKS, WHATSAPP & ADMIN SECURITY
            ================================================================= */}
        {activeTab === 'settings' && (
          <div className="admin-grid-2col">
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2 className="admin-panel-title">Brand, WhatsApp & Social Links</h2>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateSettings(settingsForm);
                  showToast('Saved brand & social links!');
                }}
              >
                <div className="form-group">
                  <label className="form-label">Brand Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={settingsForm.brandName}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, brandName: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Brand Tagline (Main Menu Bio)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settingsForm.tagline}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, tagline: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    WhatsApp Phone Number (with country code, digits only)
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. 15551234567 or 966500000000"
                    value={settingsForm.whatsappNumber}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Instagram Profile URL</label>
                  <input
                    type="url"
                    className="form-input"
                    value={settingsForm.instagramUrl}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Facebook Page URL</label>
                  <input
                    type="url"
                    className="form-input"
                    value={settingsForm.facebookUrl}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">TikTok Profile URL</label>
                  <input
                    type="url"
                    className="form-input"
                    value={settingsForm.tiktokUrl}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, tiktokUrl: e.target.value })
                    }
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Currency Symbol</label>
                    <input
                      type="text"
                      className="form-input"
                      value={settingsForm.currencySymbol}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, currencySymbol: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Items Per Page (Pagination)</label>
                    <input
                      type="number"
                      min="2"
                      max="24"
                      className="form-input"
                      value={settingsForm.itemsPerPage}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          itemsPerPage: Number(e.target.value) || 6,
                        })
                      }
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary-admin">
                  Save Brand & Social Settings
                </button>
              </form>
            </div>

            {/* Admin Login Credentials Manager */}
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2 className="admin-panel-title">Admin Login Credentials</h2>
              </div>
              <p
                style={{
                  fontSize: '0.84rem',
                  color: 'var(--brand-espresso-light)',
                  marginBottom: '1rem',
                }}
              >
                Update the email address and password required to access this Admin Dashboard.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateAdminCredentials(securityForm.email, securityForm.password);
                  showToast('Updated Admin Email & Password');
                }}
              >
                <div className="form-group">
                  <label className="form-label">Admin Email</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    value={securityForm.email}
                    onChange={(e) =>
                      setSecurityForm({ ...securityForm, email: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Admin Password</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={securityForm.password}
                    onChange={(e) =>
                      setSecurityForm({ ...securityForm, password: e.target.value })
                    }
                  />
                </div>
                <button type="submit" className="btn-primary-admin">
                  <Lock size={15} />
                  <span>Update Login Credentials</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsProductModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setIsProductModalOpen(false)}
            >
              <X size={18} />
            </button>

            <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>
              {editingProduct ? 'Edit Handmade Item' : 'Add New Handmade Item'}
            </h2>

            <form onSubmit={handleSaveProduct}>
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g., Speckled Ceramic Mug"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                }}
              >
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({ ...productForm, category: e.target.value })
                    }
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Price ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="form-input"
                    placeholder="45"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Status</label>
                  <select
                    className="form-select"
                    value={productForm.stockStatus}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stockStatus: e.target.value })
                    }
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Made to Order">Made to Order</option>
                    <option value="Sold Out">Sold Out</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows={3}
                  required
                  className="form-textarea"
                  placeholder="Describe the materials, dimensions, and handmade story..."
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({ ...productForm, description: e.target.value })
                  }
                />
              </div>

              {/* Multiple Image URLs or Local Upload */}
              <div className="form-group">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.4rem',
                  }}
                >
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Product Images (URLs or Upload Photo)
                  </label>
                  <label
                    className="btn-outline-admin"
                    style={{ padding: '0.35rem 0.7rem', cursor: 'pointer', fontSize: '0.76rem' }}
                  >
                    <Upload size={13} />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageFileUpload}
                    />
                  </label>
                </div>

                {productForm.images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}
                  >
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://images.unsplash.com/..."
                      value={imgUrl}
                      onChange={(e) => {
                        const updated = [...productForm.images];
                        updated[idx] = e.target.value;
                        setProductForm({ ...productForm, images: updated });
                      }}
                    />
                    {productForm.images.length > 1 && (
                      <button
                        type="button"
                        className="btn-outline-admin"
                        onClick={() => {
                          setProductForm({
                            ...productForm,
                            images: productForm.images.filter((_, i) => i !== idx),
                          });
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="btn-outline-admin"
                  style={{ fontSize: '0.76rem', padding: '0.4rem 0.75rem' }}
                  onClick={() =>
                    setProductForm({ ...productForm, images: [...productForm.images, ''] })
                  }
                >
                  + Add Another Image URL
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '1.5rem',
                }}
              >
                <button
                  type="button"
                  className="btn-outline-admin"
                  onClick={() => setIsProductModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary-admin">
                  {editingProduct ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
