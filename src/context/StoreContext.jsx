import React, { createContext, useContext, useState, useEffect } from "react";

const StoreContext = createContext(null);

const STORAGE_KEYS = {
  PRODUCTS: "hh_products_v1",
  CATEGORIES: "hh_categories_v1",
  SETTINGS: "hh_settings_v1",
  ANALYTICS: "hh_analytics_v1",
  ADMIN_AUTH: "hh_admin_session_v1",
  ADMIN_CREDENTIALS: "hh_admin_creds_v1",
};

const INITIAL_CATEGORIES = [
  { id: "cat-ceramics", name: "Ceramics & Pottery" },
  { id: "cat-macrame", name: "Macramé & Woven" },
  { id: "cat-candles", name: "Artisan Candles" },
  { id: "cat-jewelry", name: "Handcrafted Jewelry" },
  { id: "cat-woodwork", name: "Olive Woodwork" },
];

const INITIAL_SETTINGS = {
  brandName: "Handmade House",
  tagline: "Thoughtfully crafted pieces made by hand with warmth & soul.",
  whatsappNumber: "15551234567",
  whatsappDefaultMsg:
    "Hello Handmade House! I scanned your QR code and would love to get in touch.",
  instagramUrl: "https://www.instagram.com/handmadehouse11/",
  facebookUrl: "https://www.facebook.com/handmadehouse11/",
  tiktokUrl: "https://www.tiktok.com/@handmadehouse11",
  currencySymbol: "$",
  itemsPerPage: 6,
};

const INITIAL_PRODUCTS = [
  {
    id: "item-101",
    name: "Speckled Stoneware Pour-Over Vase",
    category: "Ceramics & Pottery",
    price: 48,
    stockStatus: "In Stock",
    description:
      "Wheel-thrown from raw speckled clay with a warm oatmeal satin glaze. Watertight and uniquely textured by hand.",
    images: [
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=900&q=80",
    ],
    views: 64,
    whatsappClicks: 19,
    createdAt: "2026-10-01T10:00:00Z",
  },
  {
    id: "item-102",
    name: "Bohemian Knotted Cotton Wall Hanging",
    category: "Macramé & Woven",
    price: 65,
    stockStatus: "Made to Order",
    description:
      "Intricately hand-knotted using 100% unbleached organic cotton cord suspended on a naturally aged driftwood branch.",
    images: [
      "https://images.unsplash.com/photo-1522758971460-1d21eed7dc1d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80",
    ],
    views: 52,
    whatsappClicks: 16,
    createdAt: "2026-10-03T12:30:00Z",
  },
  {
    id: "item-103",
    name: "Amber Jar Cedar & Fig Soy Candle",
    category: "Artisan Candles",
    price: 28,
    stockStatus: "In Stock",
    description:
      "Hand-poured small-batch natural soy wax candle infused with essential oils of wild Mediterranean fig, warm amber, and cedarwood.",
    images: [
      "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=900&q=80",
    ],
    views: 81,
    whatsappClicks: 27,
    createdAt: "2026-10-05T15:00:00Z",
  },
  {
    id: "item-104",
    name: "Hammered Brass Crescent Earrings",
    category: "Handcrafted Jewelry",
    price: 36,
    stockStatus: "In Stock",
    description:
      "Hand-forged raw brass crescent moons with hypoallergenic sterling silver ear wires. Lightweight with a gentle artisan hammered sheen.",
    images: [
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=900&q=80",
    ],
    views: 43,
    whatsappClicks: 11,
    createdAt: "2026-10-07T09:15:00Z",
  },
  {
    id: "item-105",
    name: "Carved Olive Wood Charcuterie Board",
    category: "Olive Woodwork",
    price: 58,
    stockStatus: "In Stock",
    description:
      "Sustainably harvested Mediterranean olive wood serving board finished with organic beeswax and mineral oil.",
    images: [
      "https://images.unsplash.com/photo-1615915468538-0fbd857888ca?auto=format&fit=crop&w=900&q=80",
    ],
    views: 39,
    whatsappClicks: 14,
    createdAt: "2026-10-09T14:20:00Z",
  },
  {
    id: "item-106",
    name: "Earth-Toned Ceramic Matcha Bowl Set",
    category: "Ceramics & Pottery",
    price: 42,
    stockStatus: "Sold Out",
    description:
      "Hand-pinched ceremonial matcha bowl with a pouring spout and matching whisk rest in warm espresso and sand tones.",
    images: [
      "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=900&q=80",
    ],
    views: 70,
    whatsappClicks: 22,
    createdAt: "2026-10-11T11:45:00Z",
  },
  {
    id: "item-107",
    name: "Woven Jute & Linen Table Runner",
    category: "Macramé & Woven",
    price: 45,
    stockStatus: "Made to Order",
    description:
      "Handloom-woven rustic table runner with fringed edges, blending natural jute texture with soft oatmeal linen.",
    images: [
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80",
    ],
    views: 29,
    whatsappClicks: 8,
    createdAt: "2026-10-12T16:10:00Z",
  },
  {
    id: "item-108",
    name: "Sculpted Ribbed Pillar Beeswax Pair",
    category: "Artisan Candles",
    price: 34,
    stockStatus: "In Stock",
    description:
      "Set of two architectural ribbed pillar candles crafted from 100% pure local beeswax with cotton wicks.",
    images: [
      "https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?auto=format&fit=crop&w=900&q=80",
    ],
    views: 34,
    whatsappClicks: 9,
    createdAt: "2026-10-14T18:00:00Z",
  },
];

const getInitialAnalytics = () => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    totalQrLandingVisits: 248,
    totalCatalogVisits: 186,
    socialClicks: {
      instagram: 64,
      facebook: 31,
      tiktok: 49,
      whatsappDirect: 42,
    },
    dailyStats: {
      "2026-10-12": { visits: 28, contacts: 9 },
      "2026-10-13": { visits: 35, contacts: 14 },
      "2026-10-14": { visits: 41, contacts: 18 },
      "2026-10-15": { visits: 38, contacts: 15 },
      "2026-10-16": { visits: 52, contacts: 23 },
      [today]: { visits: 54, contacts: 25 },
    },
    recentEvents: [
      {
        id: "ev-1",
        type: "item_contact",
        label: 'WhatsApp inquiry on "Amber Jar Cedar & Fig Soy Candle"',
        itemName: "Amber Jar Cedar & Fig Soy Candle",
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      },
      {
        id: "ev-2",
        type: "qr_scan",
        label: "Customer visited Main Menu (QR Scan Hub)",
        timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
      },
      {
        id: "ev-3",
        type: "item_contact",
        label: 'WhatsApp inquiry on "Speckled Stoneware Pour-Over Vase"',
        itemName: "Speckled Stoneware Pour-Over Vase",
        timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      },
      {
        id: "ev-4",
        type: "social_click",
        label: "Clicked Instagram link from Main Menu",
        timestamp: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
      },
    ],
  };
};

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [analytics, setAnalytics] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
      return saved ? JSON.parse(saved) : getInitialAnalytics();
    } catch {
      return getInitialAnalytics();
    }
  });

  const [adminCreds, setAdminCreds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_CREDENTIALS);
      return saved
        ? JSON.parse(saved)
        : { email: "admin@handmadehouse.com", password: "Handmade2026!" };
    } catch {
      return { email: "admin@handmadehouse.com", password: "Handmade2026!" };
    }
  });

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
  }, [analytics]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.ADMIN_CREDENTIALS,
      JSON.stringify(adminCreds),
    );
  }, [adminCreds]);

  // Helper to append to recentEvents and update dailyStats
  const recordEvent = (updater) => {
    const today = new Date().toISOString().slice(0, 10);
    setAnalytics((prev) => {
      const currentDay = prev.dailyStats?.[today] || { visits: 0, contacts: 0 };
      return updater(prev, today, currentDay);
    });
  };

  // Track QR / Main Menu Visit
  const trackHubVisit = () => {
    recordEvent((prev, today, currentDay) => ({
      ...prev,
      totalQrLandingVisits: prev.totalQrLandingVisits + 1,
      dailyStats: {
        ...prev.dailyStats,
        [today]: { ...currentDay, visits: currentDay.visits + 1 },
      },
      recentEvents: [
        {
          id: `ev-${Date.now()}`,
          type: "qr_scan",
          label: "Customer visited Main Menu (QR Scan Hub)",
          timestamp: new Date().toISOString(),
        },
        ...prev.recentEvents.slice(0, 39),
      ],
    }));
  };

  // Track Catalog Page Visit
  const trackCatalogVisit = () => {
    recordEvent((prev, today, currentDay) => ({
      ...prev,
      totalCatalogVisits: prev.totalCatalogVisits + 1,
      dailyStats: {
        ...prev.dailyStats,
        [today]: { ...currentDay, visits: currentDay.visits + 1 },
      },
      recentEvents: [
        {
          id: `ev-${Date.now()}`,
          type: "catalog_view",
          label: "Customer opened View List (Catalog Page)",
          timestamp: new Date().toISOString(),
        },
        ...prev.recentEvents.slice(0, 39),
      ],
    }));
  };

  // Track Social Link or Direct WhatsApp Click
  const trackSocialClick = (platform) => {
    recordEvent((prev, today, currentDay) => ({
      ...prev,
      socialClicks: {
        ...prev.socialClicks,
        [platform]: (prev.socialClicks[platform] || 0) + 1,
      },
      dailyStats: {
        ...prev.dailyStats,
        [today]: {
          ...currentDay,
          contacts:
            platform === "whatsappDirect"
              ? currentDay.contacts + 1
              : currentDay.contacts,
        },
      },
      recentEvents: [
        {
          id: `ev-${Date.now()}`,
          type: "social_click",
          label:
            platform === "whatsappDirect"
              ? "Customer clicked Direct WhatsApp Contact from Main Menu"
              : `Customer clicked ${platform.charAt(0).toUpperCase() + platform.slice(1)} link`,
          timestamp: new Date().toISOString(),
        },
        ...prev.recentEvents.slice(0, 39),
      ],
    }));
  };

  // Track Product Modal / Detail View
  const trackProductView = (productId) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, views: (item.views || 0) + 1 }
          : item,
      ),
    );
    if (target) {
      recordEvent((prev, today, currentDay) => ({
        ...prev,
        dailyStats: {
          ...prev.dailyStats,
          [today]: { ...currentDay, visits: currentDay.visits + 1 },
        },
        recentEvents: [
          {
            id: `ev-${Date.now()}`,
            type: "item_view",
            label: `Viewed item details: "${target.name}"`,
            itemName: target.name,
            timestamp: new Date().toISOString(),
          },
          ...prev.recentEvents.slice(0, 39),
        ],
      }));
    }
  };

  // Track "Contact for Info" WhatsApp click on a specific product
  const trackProductWhatsappContact = (productId) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) =>
      prev.map((item) =>
        item.id === productId
          ? {
              ...item,
              views: (item.views || 0) + 1,
              whatsappClicks: (item.whatsappClicks || 0) + 1,
            }
          : item,
      ),
    );
    if (target) {
      recordEvent((prev, today, currentDay) => ({
        ...prev,
        dailyStats: {
          ...prev.dailyStats,
          [today]: { ...currentDay, contacts: currentDay.contacts + 1 },
        },
        recentEvents: [
          {
            id: `ev-${Date.now()}`,
            type: "item_contact",
            label: `Clicked "Contact for Info" (WhatsApp) for "${target.name}"`,
            itemName: target.name,
            timestamp: new Date().toISOString(),
          },
          ...prev.recentEvents.slice(0, 39),
        ],
      }));
    }
  };

  // CRUD for Products
  const addProduct = (productData) => {
    const newProduct = {
      ...productData,
      id: `item-${Date.now()}`,
      views: 0,
      whatsappClicks: 0,
      createdAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  const updateProduct = (id, updatedFields) => {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updatedFields } : item,
      ),
    );
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  };

  // CRUD for Categories
  const addCategory = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (
      categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      return false;
    }
    setCategories((prev) => [
      ...prev,
      { id: `cat-${Date.now()}`, name: trimmed },
    ]);
    return true;
  };

  const deleteCategory = (id) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Update Settings
  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Auth Actions
  const loginAdmin = (email, password) => {
    if (
      email.trim().toLowerCase() === adminCreds.email.trim().toLowerCase() &&
      password === adminCreds.password
    ) {
      const session = {
        email: adminCreds.email,
        loggedInAt: new Date().toISOString(),
      };
      setAdminUser(session);
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, JSON.stringify(session));
      return { success: true };
    }
    return {
      success: false,
      error: "Invalid email or password. Please check your credentials.",
    };
  };

  const logoutAdmin = () => {
    setAdminUser(null);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
  };

  const updateAdminCredentials = (email, password) => {
    setAdminCreds({ email: email.trim(), password });
    const session = {
      email: email.trim(),
      loggedInAt: new Date().toISOString(),
    };
    setAdminUser(session);
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, JSON.stringify(session));
  };

  const resetDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setSettings(INITIAL_SETTINGS);
    setAnalytics(getInitialAnalytics());
  };

  // Helper to build WhatsApp link
  const buildWhatsappUrl = (customText) => {
    const cleanPhone = (settings.whatsappNumber || "").replace(/[^\d]/g, "");
    const encoded = encodeURIComponent(
      customText || settings.whatsappDefaultMsg,
    );
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        settings,
        analytics,
        adminUser,
        adminCreds,
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
        updateSettings,
        loginAdmin,
        logoutAdmin,
        updateAdminCredentials,
        resetDemoData,
        buildWhatsappUrl,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
