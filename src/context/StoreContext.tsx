import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  ProductItem,
  CategoryItem,
  StoreSettings,
  AnalyticsData,
  UserItem,
  ThemeConfig,
} from '../types.ts';

export const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#4B3629',
  secondaryColor: '#EAE2DC',
  surfaceColor: '#FAF8F6',
  accentColor: '#246A46',
  headingFont: 'Cormorant Garamond',
  bodyFont: 'Plus Jakarta Sans',
};

export interface FontFamilyOption {
  name: string;
  type: string;
  css: string;
  isDefaultHeading?: boolean;
  isDefaultBody?: boolean;
}

export const FONT_FAMILY_OPTIONS: FontFamilyOption[] = [
  {
    name: 'Cormorant Garamond',
    type: 'Serif (Default Brand Heading)',
    css: "'Cormorant Garamond', Georgia, serif",
    isDefaultHeading: true,
  },
  {
    name: 'Playfair Display',
    type: 'Editorial Luxury Serif',
    css: "'Playfair Display', Georgia, serif",
  },
  {
    name: 'Cinzel',
    type: 'Classic Engraved Serif',
    css: "'Cinzel', Georgia, serif",
  },
  {
    name: 'Lora',
    type: 'Warm Calligraphy Serif',
    css: "'Lora', Georgia, serif",
  },
  {
    name: 'Dancing Script',
    type: 'Handcrafted Script',
    css: "'Dancing Script', cursive, serif",
  },
  {
    name: 'Plus Jakarta Sans',
    type: 'Modern Sans (Default Body)',
    css: "'Plus Jakarta Sans', -apple-system, sans-serif",
    isDefaultBody: true,
  },
  {
    name: 'Montserrat',
    type: 'Geometric Boutique Sans',
    css: "'Montserrat', sans-serif",
  },
  {
    name: 'Outfit',
    type: 'Minimal Contemporary Sans',
    css: "'Outfit', sans-serif",
  },
];

const INITIAL_SETTINGS: StoreSettings = {
  brandName: 'Handmade House',
  tagline: 'Thoughtfully crafted pieces made by hand with warmth & soul.',
  whatsappNumber: '15551234567',
  whatsappDefaultMsg:
    'Hello Handmade House! I scanned your QR code and would love to get in touch.',
  instagramUrl: 'https://instagram.com',
  facebookUrl: 'https://facebook.com',
  tiktokUrl: 'https://tiktok.com',
  currencySymbol: '$',
  itemsPerPage: 6,
  theme: DEFAULT_THEME,
};

const INITIAL_ANALYTICS: AnalyticsData = {
  totalQrLandingVisits: 0,
  totalCatalogVisits: 0,
  socialClicks: {
    instagram: 0,
    facebook: 0,
    tiktok: 0,
    whatsappDirect: 0,
  },
  recentEvents: [],
};

const TOKEN_STORAGE_KEY = 'hh_admin_jwt_token';

interface StoreContextValue {
  products: ProductItem[];
  categories: CategoryItem[];
  users: UserItem[];
  settings: StoreSettings;
  analytics: AnalyticsData;
  dbConnected: boolean;
  loading: boolean;
  adminUser: UserItem | null;
  trackHubVisit: () => Promise<void>;
  trackCatalogVisit: () => Promise<void>;
  trackSocialClick: (platform: string) => Promise<void>;
  trackProductView: (productId: string) => Promise<void>;
  trackProductWhatsappContact: (productId: string) => Promise<void>;
  addProduct: (productData: Partial<ProductItem>) => Promise<ProductItem>;
  updateProduct: (id: string, updatedFields: Partial<ProductItem>) => Promise<ProductItem>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<CategoryItem>;
  deleteCategory: (id: string) => Promise<void>;
  fetchUsers: () => Promise<void>;
  addUser: (userData: Partial<UserItem> & { password?: string }) => Promise<UserItem>;
  updateUser: (
    id: string,
    updatedFields: Partial<UserItem> & { password?: string }
  ) => Promise<UserItem>;
  deleteUser: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<StoreSettings>;
  loginAdmin: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => void;
  updateAdminCredentials: (payload: {
    name?: string;
    email: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<any>;
  resetAnalyticsData: () => Promise<void>;
  buildWhatsappUrl: (customText?: string) => string;
  refreshData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [analytics, setAnalytics] = useState<AnalyticsData>(INITIAL_ANALYTICS);
  const [dbConnected, setDbConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [adminToken, setAdminToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY)
  );
  const [adminUser, setAdminUser] = useState<UserItem | null>(null);

  // Dynamically apply theme colors & font families to document root CSS variables
  useEffect(() => {
    const activeTheme: ThemeConfig = {
      ...DEFAULT_THEME,
      ...(settings?.theme || {}),
    };
    const root = document.documentElement;

    root.style.setProperty('--brand-primary', activeTheme.primaryColor);
    root.style.setProperty('--brand-secondary', activeTheme.secondaryColor);
    root.style.setProperty('--brand-surface', activeTheme.surfaceColor);
    root.style.setProperty('--brand-accent', activeTheme.accentColor);

    const headingOption = FONT_FAMILY_OPTIONS.find(
      (f) => f.name === activeTheme.headingFont
    );
    const bodyOption = FONT_FAMILY_OPTIONS.find(
      (f) => f.name === activeTheme.bodyFont
    );

    root.style.setProperty(
      '--font-heading',
      headingOption ? headingOption.css : `'${activeTheme.headingFont}', serif`
    );
    root.style.setProperty(
      '--font-body',
      bodyOption ? bodyOption.css : `'${activeTheme.bodyFont}', sans-serif`
    );
  }, [settings?.theme]);

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  };

  const fetchBootstrapData = async () => {
    try {
      const res = await fetch('/api/bootstrap');
      if (!res.ok) throw new Error('Failed to load store data');
      const data = await res.json();
      setDbConnected(Boolean(data.dbConnected));
      if (data.products) setProducts(data.products);
      if (data.categories) setCategories(data.categories);
      if (data.settings) {
        setSettings({
          ...INITIAL_SETTINGS,
          ...data.settings,
          theme: { ...DEFAULT_THEME, ...(data.settings.theme || {}) },
        });
      }
      if (data.analytics) setAnalytics(data.analytics);
    } catch (err) {
      console.error('Bootstrap fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!adminToken) return;
    try {
      const list = await authFetch('/api/users');
      if (Array.isArray(list)) {
        setUsers(list);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  useEffect(() => {
    fetchBootstrapData();
  }, []);

  useEffect(() => {
    async function verifySession() {
      if (!adminToken) {
        setAdminUser(null);
        setUsers([]);
        return;
      }
      try {
        const res = await fetch('/api/admin/me', {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAdminUser(data.admin);
          fetchUsers();
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setAdminToken(null);
          setAdminUser(null);
        }
      } catch {
        // Keep silent if server is starting
      }
    }
    verifySession();
  }, [adminToken]);

  const postAnalyticsEvent = async (payload: Record<string, any>) => {
    if (adminUser) return;
    try {
      const res = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, isAdmin: Boolean(adminUser) }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.analytics) setAnalytics(data.analytics);
        if (data.product) {
          setProducts((prev) =>
            prev.map((p) => (p.id === data.product.id ? data.product : p))
          );
        }
      }
    } catch (err) {
      console.error('Analytics track error:', err);
    }
  };

  const trackHubVisit = () => postAnalyticsEvent({ eventType: 'qr_scan' });
  const trackCatalogVisit = () => postAnalyticsEvent({ eventType: 'catalog_view' });
  const trackSocialClick = (platform: string) =>
    postAnalyticsEvent({ eventType: 'social_click', platform });
  const trackProductView = (productId: string) =>
    postAnalyticsEvent({ eventType: 'item_view', productId });
  const trackProductWhatsappContact = (productId: string) =>
    postAnalyticsEvent({ eventType: 'item_contact', productId });

  // Product CRUD
  const addProduct = async (productData: Partial<ProductItem>) => {
    const created = await authFetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    setProducts((prev) => [created, ...prev]);
    return created;
  };

  const updateProduct = async (id: string, updatedFields: Partial<ProductItem>) => {
    const updated = await authFetch(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedFields),
    });
    setProducts((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  };

  const deleteProduct = async (id: string) => {
    await authFetch(`/api/products/${id}`, { method: 'DELETE' });
    setProducts((prev) => prev.filter((item) => item.id !== id));
  };

  // Category CRUD
  const addCategory = async (name: string) => {
    const created = await authFetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    setCategories((prev) => [...prev, created]);
    return created;
  };

  const deleteCategory = async (id: string) => {
    await authFetch(`/api/categories/${id}`, { method: 'DELETE' });
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Users CRUD (Unified `users` collection)
  const addUser = async (userData: Partial<UserItem> & { password?: string }) => {
    const created = await authFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    setUsers((prev) => [created, ...prev]);
    return created;
  };

  const updateUser = async (
    id: string,
    updatedFields: Partial<UserItem> & { password?: string }
  ) => {
    const updated = await authFetch(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedFields),
    });
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    if (adminUser && adminUser.id === id) {
      setAdminUser(updated);
    }
    return updated;
  };

  const deleteUser = async (id: string) => {
    await authFetch(`/api/users/${id}`, { method: 'DELETE' });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // Settings & Theme
  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    const updated = await authFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(newSettings),
    });
    const merged: StoreSettings = {
      ...INITIAL_SETTINGS,
      ...updated,
      theme: { ...DEFAULT_THEME, ...(updated.theme || {}) },
    };
    setSettings(merged);
    return merged;
  };

  // Auth
  const loginAdmin = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid credentials' };
      }
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setAdminToken(data.token);
      setAdminUser(data.admin);
      return { success: true };
    } catch {
      return {
        success: false,
        error: 'Unable to reach backend server. Ensure server is running.',
      };
    }
  };

  const logoutAdmin = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAdminToken(null);
    setAdminUser(null);
    setUsers([]);
  };

  const updateAdminCredentials = async (payload: {
    name?: string;
    email: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    const data = await authFetch('/api/admin/credentials', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    setAdminToken(data.token);
    setAdminUser(data.admin);
    fetchUsers();
    return data;
  };

  const resetAnalyticsData = async () => {
    const data = await authFetch('/api/analytics/reset', { method: 'POST' });
    if (data.analytics) setAnalytics(data.analytics);
    if (data.products) setProducts(data.products);
  };

  const buildWhatsappUrl = (customText?: string) => {
    const cleanPhone = (settings.whatsappNumber || '').replace(/[^\d]/g, '');
    const encoded = encodeURIComponent(customText || settings.whatsappDefaultMsg);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        users,
        settings,
        analytics,
        dbConnected,
        loading,
        adminUser,
        trackHubVisit,
        trackCatalogVisit,
        trackSocialClick,
        trackProductView,
        trackProductWhatsappContact,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        deleteCategory,
        fetchUsers,
        addUser,
        updateUser,
        deleteUser,
        updateSettings,
        loginAdmin,
        logoutAdmin,
        updateAdminCredentials,
        resetAnalyticsData,
        buildWhatsappUrl,
        refreshData: fetchBootstrapData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = (): StoreContextValue => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
