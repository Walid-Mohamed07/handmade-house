import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Package,
  Tags,
  Users,
  Settings,
  Palette,
  LogOut,
  ExternalLink,
  Plus,
  Edit3,
  Trash2,
  Eye,
  MessageCircle,
  TrendingUp,
  Award,
  Lock,
  Mail,
  KeyRound,
  RotateCcw,
  Upload,
  CheckCircle2,
  X,
  AlertCircle,
  Database,
  Type,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCheck,
  Maximize2,
  Calendar,
  Hash,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  useStore,
  DEFAULT_THEME,
  FONT_FAMILY_OPTIONS,
} from "../context/StoreContext.tsx";
import {
  ProductItem,
  UserItem,
  UserRole,
  UserStatus,
  StockStatus,
  ThemeConfig,
  StoreSettings,
} from "../types.ts";

const COLOR_PRESETS = [
  {
    name: "Brand Default (Alabaster & Espresso)",
    isDefault: true,
    primaryColor: "#4B3629",
    secondaryColor: "#EAE2DC",
    surfaceColor: "#FAF8F6",
    accentColor: "#246A46",
  },
  {
    name: "Terracotta Clay & Linen",
    isDefault: false,
    primaryColor: "#5C2C1E",
    secondaryColor: "#F3E5DC",
    surfaceColor: "#FCF8F5",
    accentColor: "#2B6E48",
  },
  {
    name: "Olive Grove & Parchment",
    isDefault: false,
    primaryColor: "#2F3B28",
    secondaryColor: "#E8ECE3",
    surfaceColor: "#F8FAF6",
    accentColor: "#3B6E52",
  },
  {
    name: "Midnight Charcoal & Warm Sand",
    isDefault: false,
    primaryColor: "#23201E",
    secondaryColor: "#E5DFD7",
    surfaceColor: "#F7F5F2",
    accentColor: "#1E6B47",
  },
];

const getRoleBadgeClasses = (role: UserRole): string => {
  switch (role) {
    case "superadmin":
      return "bg-amber-500/20 text-amber-900 border border-amber-600/30";
    case "admin":
      return "bg-purple-500/15 text-purple-900 border border-purple-600/25";
    case "operator":
      return "bg-blue-500/15 text-blue-900 border border-blue-600/25";
    case "customer":
    default:
      return "bg-emerald-500/15 text-emerald-900 border border-emerald-600/25";
  }
};

function deriveCategoryCodePreview(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (cleaned.length >= 4) return cleaned.slice(0, 4);
  if (cleaned.length === 3) return cleaned;
  return (cleaned + "HMX").slice(0, 3);
}

function generateShortItemSuffixPreview(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    products,
    categories,
    users,
    settings,
    analytics,
    dbConnected,
    adminUser,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    deleteCategory,
    addUser,
    updateUser,
    deleteUser,
    updateSettings,
    loginAdmin,
    logoutAdmin,
    updateAdminCredentials,
    resetAnalyticsData,
  } = useStore();

  // Login Form States
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Dashboard Active Tab
  const [activeTab, setActiveTab] = useState<string>("analytics");
  const [toastMsg, setToastMsg] = useState<string>("");

  // "Show More" Deep-Dive Analytics Modal State
  // Values: null | 'activity_log' | 'contacted_visited' | 'social_clicks' | 'category_demand' | 'item_analytics'
  const [detailModalType, setDetailModalType] = useState<string | null>(null);

  // Activity Log Modal Filters & Pagination
  const [logSearch, setLogSearch] = useState<string>("");
  const [logTypeFilter, setLogTypeFilter] = useState<string>("All");
  const [logDateFrom, setLogDateFrom] = useState<string>("");
  const [logDateTo, setLogDateTo] = useState<string>("");
  const [logPage, setLogPage] = useState<number>(1);
  const [logPerPage, setLogPerPage] = useState<number>(8);

  // Item Analytics / Contacted & Visited Modal Filters & Pagination
  const [itemAnalyticsSearch, setItemAnalyticsSearch] = useState<string>("");
  const [itemAnalyticsCat, setItemAnalyticsCat] = useState<string>("All");
  const [itemAnalyticsStock, setItemAnalyticsStock] = useState<string>("All");
  const [itemAnalyticsSort, setItemAnalyticsSort] =
    useState<string>("contacts-desc");
  const [itemAnalyticsPage, setItemAnalyticsPage] = useState<number>(1);

  // Product Modal States (with two-part Code: CategoryCode-ItemCode)
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(
    null,
  );
  const [productFormError, setProductFormError] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [productForm, setProductForm] = useState<{
    name: string;
    category: string;
    categoryCode: string;
    itemCode: string;
    price: string | number;
    stockStatus: StockStatus;
    description: string;
    images: string[];
  }>({
    name: "",
    category: categories[0]?.name || "Ceramics & Pottery",
    categoryCode: categories[0]?.code || "CERM",
    itemCode: generateShortItemSuffixPreview(),
    price: "",
    stockStatus: "In Stock",
    description: "",
    images: [""],
  });

  // Category Form State (Name + 3-4 char Code)
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newCategoryCode, setNewCategoryCode] = useState<string>("");

  // Users Management Filter, Search, Sort & Pagination States
  const [userSearch, setUserSearch] = useState<string>("");
  const [userRoleFilter, setUserRoleFilter] = useState<"All" | UserRole>("All");
  const [userStatusFilter, setUserStatusFilter] = useState<"All" | UserStatus>(
    "All",
  );
  const [userSortBy, setUserSortBy] = useState<string>("newest");
  const [userCurrentPage, setUserCurrentPage] = useState<number>(1);
  const [usersPerPage, setUsersPerPage] = useState<number>(5);

  // User Add/Edit Modal States
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [userFormError, setUserFormError] = useState<string>("");
  const [userForm, setUserForm] = useState<{
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    status: UserStatus;
    password: string;
  }>({
    name: "",
    email: "",
    phone: "",
    role: "customer",
    status: "Active",
    password: "",
  });

  // Settings & Theme Form States
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(settings);
  const [themeForm, setThemeForm] = useState<ThemeConfig>({
    ...DEFAULT_THEME,
    ...(settings?.theme || {}),
  });

  // Security Form State
  const [securityForm, setSecurityForm] = useState<{
    name: string;
    email: string;
    currentPassword: string;
    newPassword: string;
  }>({
    name: adminUser?.name || "",
    email: adminUser?.email || "",
    currentPassword: "",
    newPassword: "",
  });
  const [securityError, setSecurityError] = useState<string>("");

  useEffect(() => {
    setSettingsForm(settings);
    setThemeForm({ ...DEFAULT_THEME, ...(settings?.theme || {}) });
  }, [settings]);

  useEffect(() => {
    if (adminUser) {
      setSecurityForm((prev) => ({
        ...prev,
        name: adminUser.name || "",
        email: adminUser.email || "",
      }));
    }
  }, [adminUser]);

  useEffect(() => {
    setUserCurrentPage(1);
  }, [userSearch, userRoleFilter, userStatusFilter, userSortBy, usersPerPage]);

  useEffect(() => {
    setLogPage(1);
  }, [logSearch, logTypeFilter, logDateFrom, logDateTo, logPerPage]);

  useEffect(() => {
    setItemAnalyticsPage(1);
  }, [
    itemAnalyticsSearch,
    itemAnalyticsCat,
    itemAnalyticsStock,
    itemAnalyticsSort,
  ]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3400);
  };

  // Helper to get category code from category name
  const getCategoryCodeByName = (catName: string): string => {
    const found = categories.find((c) => c.name === catName);
    return found?.code || deriveCategoryCodePreview(catName);
  };

  // Generate a guaranteed unique 4-digit itemCode for the given categoryCode
  const getUniqueItemSuffix = (catCode: string): string => {
    let suffix = generateShortItemSuffixPreview();
    const existingCodes = new Set(
      products.map((p) => (p.code || "").toUpperCase()),
    );
    let attempts = 0;
    while (existingCodes.has(`${catCode}-${suffix}`) && attempts < 50) {
      suffix = generateShortItemSuffixPreview();
      attempts++;
    }
    return suffix;
  };

  // Computed Analytics Metrics
  const stats = useMemo(() => {
    const totalProductViews = products.reduce(
      (acc, p) => acc + (p.views || 0),
      0,
    );
    const totalItemWhatsappContacts = products.reduce(
      (acc, p) => acc + (p.whatsappClicks || 0),
      0,
    );
    const totalVisits =
      (analytics.totalQrLandingVisits || 0) +
      (analytics.totalCatalogVisits || 0);

    const conversionRate =
      totalProductViews > 0
        ? ((totalItemWhatsappContacts / totalProductViews) * 100).toFixed(1)
        : "0.0";

    const byContacted = [...products].sort(
      (a, b) => (b.whatsappClicks || 0) - (a.whatsappClicks || 0),
    );
    const byVisited = [...products].sort(
      (a, b) => (b.views || 0) - (a.views || 0),
    );

    const categoryStats = categories.map((cat) => {
      const catItems = products.filter((p) => p.category === cat.name);
      const views = catItems.reduce((sum, p) => sum + (p.views || 0), 0);
      const contacts = catItems.reduce(
        (sum, p) => sum + (p.whatsappClicks || 0),
        0,
      );
      const conv = views > 0 ? ((contacts / views) * 100).toFixed(1) : "0.0";
      return {
        name: cat.name,
        code: cat.code || deriveCategoryCodePreview(cat.name),
        itemCount: catItems.length,
        views,
        contacts,
        conv,
      };
    });

    const totalSocialClicks =
      (analytics.socialClicks?.instagram || 0) +
      (analytics.socialClicks?.tiktok || 0) +
      (analytics.socialClicks?.facebook || 0) +
      (analytics.socialClicks?.whatsappDirect || 0);

    return {
      totalVisits,
      totalProductViews,
      totalItemWhatsappContacts,
      totalSocialClicks,
      conversionRate,
      mostContactedItem: byContacted[0] || null,
      mostVisitedItem: byVisited[0] || null,
      byContacted,
      byVisited,
      categoryStats,
    };
  }, [products, categories, analytics]);

  // Filtered & Paginated Visitor Activity Log (for Show More Modal)
  const filteredActivityLogs = useMemo(() => {
    const events = analytics.recentEvents || [];
    return events.filter((ev) => {
      const matchesType = logTypeFilter === "All" || ev.type === logTypeFilter;
      const q = logSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (ev.label || "").toLowerCase().includes(q) ||
        (ev.itemName || "").toLowerCase().includes(q) ||
        (ev.itemCode || "").toLowerCase().includes(q) ||
        (ev.category || "").toLowerCase().includes(q) ||
        (ev.type || "").toLowerCase().includes(q);

      let matchesDate = true;
      if (logDateFrom || logDateTo) {
        const evTime = new Date(ev.timestamp).getTime();
        if (logDateFrom) {
          const fromTime = new Date(`${logDateFrom}T00:00:00`).getTime();
          if (evTime < fromTime) matchesDate = false;
        }
        if (logDateTo) {
          const toTime = new Date(`${logDateTo}T23:59:59.999`).getTime();
          if (evTime > toTime) matchesDate = false;
        }
      }
      return matchesType && matchesSearch && matchesDate;
    });
  }, [
    analytics.recentEvents,
    logTypeFilter,
    logSearch,
    logDateFrom,
    logDateTo,
  ]);

  const logTotalPages = Math.max(
    1,
    Math.ceil(filteredActivityLogs.length / logPerPage),
  );
  const paginatedActivityLogs = useMemo(() => {
    const start = (logPage - 1) * logPerPage;
    return filteredActivityLogs.slice(start, start + logPerPage);
  }, [filteredActivityLogs, logPage, logPerPage]);

  // Filtered & Paginated Deep-Dive Item Analytics (for Show More Modal)
  const filteredAnalyticsItems = useMemo(() => {
    return products
      .filter((item) => {
        const matchesCat =
          itemAnalyticsCat === "All" || item.category === itemAnalyticsCat;
        const matchesStock =
          itemAnalyticsStock === "All" ||
          item.stockStatus === itemAnalyticsStock;
        const q = itemAnalyticsSearch.trim().toLowerCase();
        const matchesSearch =
          !q ||
          item.name.toLowerCase().includes(q) ||
          (item.code || "").toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
        return matchesCat && matchesStock && matchesSearch;
      })
      .sort((a, b) => {
        const convA = a.views > 0 ? (a.whatsappClicks || 0) / a.views : 0;
        const convB = b.views > 0 ? (b.whatsappClicks || 0) / b.views : 0;
        if (itemAnalyticsSort === "views-desc")
          return (b.views || 0) - (a.views || 0);
        if (itemAnalyticsSort === "conv-desc") return convB - convA;
        if (itemAnalyticsSort === "price-desc")
          return Number(b.price) - Number(a.price);
        return (b.whatsappClicks || 0) - (a.whatsappClicks || 0);
      });
  }, [
    products,
    itemAnalyticsCat,
    itemAnalyticsStock,
    itemAnalyticsSearch,
    itemAnalyticsSort,
  ]);

  const itemAnalyticsPerPage = 6;
  const itemAnalyticsTotalPages = Math.max(
    1,
    Math.ceil(filteredAnalyticsItems.length / itemAnalyticsPerPage),
  );
  const paginatedAnalyticsItems = useMemo(() => {
    const start = (itemAnalyticsPage - 1) * itemAnalyticsPerPage;
    return filteredAnalyticsItems.slice(start, start + itemAnalyticsPerPage);
  }, [filteredAnalyticsItems, itemAnalyticsPage]);

  // Filtered, Sorted, and Paginated Users
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        const matchesRole =
          userRoleFilter === "All" || u.role === userRoleFilter;
        const matchesStatus =
          userStatusFilter === "All" || u.status === userStatusFilter;
        const q = userSearch.trim().toLowerCase();
        const matchesSearch =
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone || "").toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q);
        return matchesRole && matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (userSortBy === "name-asc") return a.name.localeCompare(b.name);
        if (userSortBy === "name-desc") return b.name.localeCompare(a.name);
        if (userSortBy === "role") return a.role.localeCompare(b.role);
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      });
  }, [users, userSearch, userRoleFilter, userStatusFilter, userSortBy]);

  const userTotalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / usersPerPage),
  );
  const paginatedUsers = useMemo(() => {
    const start = (userCurrentPage - 1) * usersPerPage;
    return filteredUsers.slice(start, start + usersPerPage);
  }, [filteredUsers, userCurrentPage, usersPerPage]);

  const roleCounts = useMemo(() => {
    return {
      All: users.length,
      superadmin: users.filter((u) => u.role === "superadmin").length,
      admin: users.filter((u) => u.role === "admin").length,
      operator: users.filter((u) => u.role === "operator").length,
      customer: users.filter((u) => u.role === "customer").length,
    };
  }, [users]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    const res = await loginAdmin(loginEmail, loginPassword);
    setIsLoggingIn(false);
    if (!res.success) {
      setLoginError(res.error || "Login failed");
    }
  };

  // Product Form Handlers (with automatic two-part code generation)
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductFormError("");
    const defaultCat = categories[0]?.name || "Ceramics & Pottery";
    const catCode = getCategoryCodeByName(defaultCat);
    const uniqueSuffix = getUniqueItemSuffix(catCode);
    setProductForm({
      name: "",
      category: defaultCat,
      categoryCode: catCode,
      itemCode: uniqueSuffix,
      price: "",
      stockStatus: "In Stock",
      description: "",
      images: [""],
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: ProductItem) => {
    setEditingProduct(product);
    setProductFormError("");
    const parts = (product.code || "").split("-");
    const catCode =
      product.categoryCode ||
      parts[0] ||
      getCategoryCodeByName(product.category);
    const itmCode =
      product.itemCode || parts[1] || getUniqueItemSuffix(catCode);

    setProductForm({
      name: product.name,
      category: product.category,
      categoryCode: catCode,
      itemCode: itmCode,
      price: product.price,
      stockStatus: product.stockStatus || "In Stock",
      description: product.description,
      images:
        product.images && product.images.length > 0 ? product.images : [""],
    });
    setIsProductModalOpen(true);
  };

  const handleProductCategoryChange = (newCategoryName: string) => {
    const newCatCode = getCategoryCodeByName(newCategoryName);
    setProductForm((prev) => ({
      ...prev,
      category: newCategoryName,
      categoryCode: newCatCode,
    }));
  };

  // Helper: Compress an image file using HTML5 Canvas to prevent 413 Payload Too Large on Vercel
  const compressImageFile = (
    file: File,
    maxDimension = 1200,
    initialQuality = 0.78
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        return reject(new Error("Selected file must be an image (JPEG, PNG, WebP)."));
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read image file."));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error("Could not parse image data."));
        img.onload = () => {
          try {
            let { width, height } = img;

            // Preserve aspect ratio while constraining to maxDimension
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, width);
            canvas.height = Math.max(1, height);

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              return reject(
                new Error("Unable to create canvas context for image processing.")
              );
            }

            // Fill with white background to handle transparency safely when saving as JPEG
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            let quality = initialQuality;
            let dataUrl = canvas.toDataURL("image/jpeg", quality);

            // If still unusually large (> 1.2MB), adaptively reduce quality
            let attempts = 0;
            while (
              dataUrl.length > 1.2 * 1024 * 1024 &&
              attempts < 3 &&
              quality > 0.45
            ) {
              quality -= 0.15;
              dataUrl = canvas.toDataURL("image/jpeg", quality);
              attempts++;
            }

            resolve(dataUrl);
          } catch (err: any) {
            reject(err);
          }
        };
        img.src = String(e.target?.result || "");
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    setProductFormError("");

    try {
      const compressedList: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImageFile(file);
        compressedList.push(compressed);
      }

      setProductForm((prev) => {
        const cleaned = prev.images.filter((img) => img.trim() !== "");
        return { ...prev, images: [...cleaned, ...compressedList] };
      });

      showToast(
        `Added & compressed ${files.length} image${files.length > 1 ? "s" : ""}`
      );
    } catch (err: any) {
      setProductFormError(err.message || "Failed to process image file");
      showToast(err.message || "Image upload failed");
    } finally {
      setIsUploadingImage(false);
      // Reset input value so selecting the same file again triggers onChange
      e.target.value = "";
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError("");
    const cleanPrefix = productForm.categoryCode
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 4);
    const cleanSuffix = productForm.itemCode
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 5);

    if (cleanSuffix.length < 4 || cleanSuffix.length > 5) {
      setProductFormError('Item code after "-" must be 4 to 5 characters.');
      return;
    }

    const fullCode = `${cleanPrefix}-${cleanSuffix}`;
    const validImages = productForm.images.map((u) => u.trim()).filter(Boolean);
    const payload = {
      name: productForm.name.trim(),
      category: productForm.category,
      categoryCode: cleanPrefix,
      itemCode: cleanSuffix,
      code: fullCode,
      price: Number(productForm.price) || 0,
      stockStatus: productForm.stockStatus,
      description: productForm.description.trim(),
      images: validImages.length > 0 ? validImages : ["/logo.jpg"],
    };

    // Protect against payloads that might exceed Vercel's 4.5MB serverless body limit
    const approximateSize = JSON.stringify(payload).length;
    if (approximateSize > 3.8 * 1024 * 1024) {
      setProductFormError(
        "Total images payload exceeds 3.8MB (Vercel server limit). Please remove extra images or upload smaller files."
      );
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        showToast(`Updated [${fullCode}] "${payload.name}"`);
      } else {
        await addProduct(payload);
        showToast(`Added [${fullCode}] "${payload.name}" to catalog`);
      }
      setIsProductModalOpen(false);
    } catch (err: any) {
      setProductFormError(err.message || "Error saving product");
    }
  };

  // User Form Handlers
  const openAddUserModal = () => {
    setEditingUser(null);
    setUserFormError("");
    setUserForm({
      name: "",
      email: "",
      phone: "",
      role: "customer",
      status: "Active",
      password: "",
    });
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: UserItem) => {
    setEditingUser(user);
    setUserFormError("");
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      status: user.status || "Active",
      password: "",
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError("");
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          role: userForm.role,
          status: userForm.status,
          ...(userForm.password.trim()
            ? { password: userForm.password.trim() }
            : {}),
        });
        showToast(`Updated user "${userForm.name}"`);
      } else {
        await addUser({
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          role: userForm.role,
          status: userForm.status,
          password: userForm.password,
        });
        showToast(`Added user "${userForm.name}" (${userForm.role})`);
      }
      setIsUserModalOpen(false);
    } catch (err: any) {
      setUserFormError(err.message || "Failed to save user");
    }
  };

  const handleSaveTheme = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      await updateSettings({ ...settings, theme: themeForm });
      showToast("Theme colors & typography saved to MongoDB!");
    } catch (err: any) {
      showToast(err.message || "Failed to save theme");
    }
  };

  const handleResetDefaultTheme = async () => {
    setThemeForm(DEFAULT_THEME);
    try {
      await updateSettings({ ...settings, theme: DEFAULT_THEME });
      showToast("Restored default brand colors & fonts!");
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // =========================================================================
  // IF NOT AUTHENTICATED: Render Clean Production Admin Login
  // =========================================================================
  if (!adminUser) {
    return (
      <div
        style={{
          backgroundColor: "var(--brand-secondary)",
          color: "var(--brand-primary)",
        }}
        className="min-h-screen flex items-center justify-center p-4 sm:p-6 animate-fade-up"
      >
        <div
          style={{
            backgroundColor: "var(--brand-surface)",
            borderColor:
              "color-mix(in srgb, var(--brand-primary) 16%, transparent)",
          }}
          className="w-full max-w-md rounded-3xl border p-7 sm:p-9 shadow-2xl"
        >
          <div className="text-center mb-6">
            <img
              src="/logo.jpg"
              alt="Handmade House"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--brand-primary) 25%, transparent)",
              }}
              className="w-20 h-20 rounded-full object-cover border mx-auto mb-3 shadow-sm"
            />
            <h1 className="font-heading text-3xl font-bold">Admin Portal</h1>
            <p className="text-xs sm:text-sm opacity-75 mt-1">
              Restricted access. Sign in with your administrator credentials.
            </p>
          </div>

          {loginError && (
            <div className="bg-[#F2E4E4] text-[#9E3B3B] px-4 py-3 rounded-xl text-xs font-medium mb-4 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-85">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-60"
                />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="Enter staff email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{
                    backgroundColor: "var(--brand-secondary)",
                    borderColor:
                      "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-current/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-85">
                Password
              </label>
              <div className="relative">
                <KeyRound
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-60"
                />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{
                    backgroundColor: "var(--brand-secondary)",
                    borderColor:
                      "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-current/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                backgroundColor: "var(--brand-primary)",
                color: "var(--brand-surface)",
              }}
              className="w-full py-3.5 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-50"
            >
              <Lock size={16} />
              <span>{isLoggingIn ? "Signing In..." : "Sign In"}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED ADMIN DASHBOARD
  // =========================================================================
  return (
    <div
      style={{
        backgroundColor: "var(--brand-secondary)",
        color: "var(--brand-primary)",
      }}
      className="min-h-screen flex flex-col animate-fade-up"
    >
      {/* Top Bar */}
      <header
        style={{
          backgroundColor: "var(--brand-primary)",
          color: "var(--brand-surface)",
        }}
        className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 flex-wrap shadow-md"
      >
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpg"
            alt="Logo"
            className="w-10 h-10 rounded-full object-cover border border-white/20"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-xl font-bold leading-none">
                {settings.brandName} — Admin
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  dbConnected
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "bg-amber-500/20 text-amber-200"
                }`}
              >
                <Database size={11} />
                {dbConnected ? "MongoDB Connected" : "Connecting DB"}
              </span>
            </div>
            <div className="text-xs opacity-80 flex items-center gap-2 mt-0.5">
              <span>
                Signed in as <strong>{adminUser.name}</strong> (
                {adminUser.email})
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] uppercase font-bold tracking-wider">
                {adminUser.role}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ExternalLink size={14} />
            <span>QR Menu</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/catalog")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ExternalLink size={14} />
            <span>View List</span>
          </button>
          <button
            type="button"
            onClick={logoutAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9E3B3B] hover:bg-[#842f2f] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav
        style={{
          backgroundColor: "var(--brand-surface)",
          borderColor:
            "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
        }}
        className="px-4 sm:px-6 border-b flex gap-1 overflow-x-auto"
        aria-label="Admin Sections"
      >
        {[
          {
            id: "analytics",
            label: "Overview & Item Analytics",
            icon: BarChart3,
          },
          {
            id: "products",
            label: `Products (${products.length})`,
            icon: Package,
          },
          {
            id: "categories",
            label: `Categories (${categories.length})`,
            icon: Tags,
          },
          { id: "users", label: `Users (${users.length})`, icon: Users },
          { id: "theme", label: "Theme & Typography", icon: Palette },
          { id: "settings", label: "Social Links & Security", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={
                isActive
                  ? { borderBottomColor: "var(--brand-primary)" }
                  : { borderBottomColor: "transparent" }
              }
              className={`px-4 py-3.5 text-xs sm:text-sm font-semibold border-b-2 inline-flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive ? "opacity-100" : "opacity-65 hover:opacity-95"
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            backgroundColor: "var(--brand-primary)",
            color: "var(--brand-surface)",
          }}
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-medium"
        >
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-16">
        {/* =================================================================
            TAB 1: ANALYTICS & INSIGHTS (WITH "SHOW MORE" ON EVERY SECTION)
            ================================================================= */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Top 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                style={{
                  backgroundColor: "var(--brand-surface)",
                  borderColor:
                    "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
                }}
                className="rounded-2xl border p-5 shadow-xs flex items-start justify-between"
              >
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                    Total Visitor Visits
                  </span>
                  <div className="font-heading text-4xl font-bold my-1">
                    {stats.totalVisits}
                  </div>
                  <span className="text-xs opacity-75">
                    {analytics.totalQrLandingVisits} QR Menu •{" "}
                    {analytics.totalCatalogVisits} Catalog
                  </span>
                </div>
                <div
                  style={{ backgroundColor: "var(--brand-secondary)" }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                >
                  <Eye size={20} />
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "var(--brand-surface)",
                  borderColor:
                    "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
                }}
                className="rounded-2xl border p-5 shadow-xs flex items-start justify-between"
              >
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                    Item "Contact for Info" Hits
                  </span>
                  <div
                    style={{ color: "var(--brand-accent)" }}
                    className="font-heading text-4xl font-bold my-1"
                  >
                    {stats.totalItemWhatsappContacts}
                  </div>
                  <span className="text-xs opacity-75">
                    +{analytics.socialClicks?.whatsappDirect || 0} direct main
                    menu hits
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-[#E3EFE8] text-[#246A46] flex items-center justify-center shrink-0">
                  <MessageCircle size={20} />
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "var(--brand-surface)",
                  borderColor:
                    "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
                }}
                className="rounded-2xl border p-5 shadow-xs flex items-start justify-between"
              >
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                    Inquiry Conversion Rate
                  </span>
                  <div className="font-heading text-4xl font-bold my-1">
                    {stats.conversionRate}%
                  </div>
                  <span className="text-xs opacity-75">
                    From {stats.totalProductViews} total item detail views
                  </span>
                </div>
                <div
                  style={{ backgroundColor: "var(--brand-secondary)" }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                >
                  <TrendingUp size={20} />
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "var(--brand-surface)",
                  borderColor:
                    "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
                }}
                className="rounded-2xl border p-5 shadow-xs flex items-start justify-between"
              >
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                    #1 Most Contacted Item
                  </span>
                  <div className="font-heading text-lg font-bold my-1 leading-snug">
                    {stats.mostContactedItem ? (
                      <>
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-black/10 mr-1.5">
                          {stats.mostContactedItem.code}
                        </span>
                        {stats.mostContactedItem.name}
                      </>
                    ) : (
                      "N/A"
                    )}
                  </div>
                  <span className="text-xs opacity-75">
                    {stats.mostContactedItem
                      ? `${stats.mostContactedItem.whatsappClicks} WhatsApp clicks • ${stats.mostContactedItem.views} views`
                      : "No data yet"}
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-[#F5EBE0] text-[#94622A] flex items-center justify-center shrink-0">
                  <Award size={20} />
                </div>
              </div>
            </div>

            {/* Spotlight Row: Most Contacted vs Most Visited + Social Clicks & Category Demand */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Most Contacted & Visited Items */}
              <div
                style={{
                  backgroundColor: "var(--brand-surface)",
                  borderColor:
                    "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
                }}
                className="lg:col-span-7 rounded-2xl border p-5 sm:p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-current/10 flex-wrap">
                    <div>
                      <h2 className="font-heading text-2xl font-bold">
                        Most Contacted & Visited Items
                      </h2>
                      <p className="text-xs opacity-75">
                        Visitor item views vs. "Contact for Info" WhatsApp
                        clicks
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetailModalType("contacted_visited")}
                      style={{ backgroundColor: "var(--brand-secondary)" }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-85 cursor-pointer"
                    >
                      <Maximize2 size={13} />
                      <span>Show more</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {stats.byContacted.slice(0, 5).map((item, idx) => {
                      const maxViews = Math.max(
                        1,
                        ...products.map((p) =>
                          Math.max(p.views || 0, p.whatsappClicks || 0),
                        ),
                      );
                      const viewPct = Math.min(
                        100,
                        Math.round(((item.views || 0) / maxViews) * 100),
                      );
                      const contactPct = Math.min(
                        100,
                        Math.round(
                          ((item.whatsappClicks || 0) / maxViews) * 100,
                        ),
                      );
                      const conv =
                        item.views > 0
                          ? Math.round(
                              ((item.whatsappClicks || 0) / item.views) * 100,
                            )
                          : 0;

                      return (
                        <div key={item.id}>
                          <div className="flex justify-between text-xs sm:text-sm font-semibold mb-1 gap-2">
                            <span className="truncate">
                              #{idx + 1}{" "}
                              <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-black/5 mr-1">
                                {item.code}
                              </span>
                              {item.name}
                            </span>
                            <span className="text-xs opacity-75 whitespace-nowrap">
                              <strong>{item.whatsappClicks || 0}</strong>{" "}
                              WhatsApp • <strong>{item.views || 0}</strong>{" "}
                              views ({conv}%)
                            </span>
                          </div>
                          <div
                            style={{
                              backgroundColor: "var(--brand-secondary)",
                            }}
                            className="w-full h-2 rounded-full overflow-hidden mb-1"
                          >
                            <div
                              style={{
                                width: `${viewPct}%`,
                                backgroundColor: "var(--brand-primary)",
                              }}
                              className="h-full rounded-full transition-all duration-500"
                            />
                          </div>
                          <div
                            style={{
                              backgroundColor: "var(--brand-secondary)",
                            }}
                            className="w-full h-2 rounded-full overflow-hidden"
                          >
                            <div
                              style={{
                                width: `${contactPct}%`,
                                backgroundColor: "var(--brand-accent)",
                              }}
                              className="h-full rounded-full transition-all duration-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-current/10 text-xs">
                  <div className="flex gap-4 opacity-75">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        style={{ backgroundColor: "var(--brand-primary)" }}
                        className="w-2.5 h-2.5 rounded-full"
                      />
                      Item Views
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        style={{ backgroundColor: "var(--brand-accent)" }}
                        className="w-2.5 h-2.5 rounded-full"
                      />
                      WhatsApp Contact Hits
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailModalType("contacted_visited")}
                    className="font-semibold underline cursor-pointer"
                  >
                    Full Ranking & Analysis →
                  </button>
                </div>
              </div>

              {/* Right Column: Main Menu Social Clicks & Demand by Category */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div
                  style={{
                    backgroundColor: "var(--brand-surface)",
                    borderColor:
                      "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
                  }}
                  className="rounded-2xl border p-5 sm:p-6 shadow-xs"
                >
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-current/10">
                    <div>
                      <h2 className="font-heading text-2xl font-bold">
                        Main Menu Social Clicks
                      </h2>
                      <p className="text-xs opacity-70">
                        Total outbound clicks: {stats.totalSocialClicks}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetailModalType("social_clicks")}
                      style={{ backgroundColor: "var(--brand-secondary)" }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-85 cursor-pointer"
                    >
                      <Maximize2 size={13} />
                      <span>Show more</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div
                      style={{ backgroundColor: "var(--brand-secondary)" }}
                      className="p-3.5 rounded-xl"
                    >
                      <div className="text-xs opacity-75">Instagram</div>
                      <div className="text-2xl font-bold mt-0.5">
                        {analytics.socialClicks?.instagram || 0}
                      </div>
                    </div>
                    <div
                      style={{ backgroundColor: "var(--brand-secondary)" }}
                      className="p-3.5 rounded-xl"
                    >
                      <div className="text-xs opacity-75">TikTok</div>
                      <div className="text-2xl font-bold mt-0.5">
                        {analytics.socialClicks?.tiktok || 0}
                      </div>
                    </div>
                    <div
                      style={{ backgroundColor: "var(--brand-secondary)" }}
                      className="p-3.5 rounded-xl"
                    >
                      <div className="text-xs opacity-75">Facebook</div>
                      <div className="text-2xl font-bold mt-0.5">
                        {analytics.socialClicks?.facebook || 0}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#E3EFE8] text-[#246A46]">
                      <div className="text-xs">Direct WhatsApp</div>
                      <div className="text-2xl font-bold mt-0.5">
                        {analytics.socialClicks?.whatsappDirect || 0}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "var(--brand-surface)",
                    borderColor:
                      "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
                  }}
                  className="rounded-2xl border p-5 sm:p-6 shadow-xs"
                >
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-current/10">
                    <h2 className="font-heading text-2xl font-bold">
                      Demand by Category
                    </h2>
                    <button
                      type="button"
                      onClick={() => setDetailModalType("category_demand")}
                      style={{ backgroundColor: "var(--brand-secondary)" }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-85 cursor-pointer"
                    >
                      <Maximize2 size={13} />
                      <span>Show more</span>
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-current/10 uppercase text-[11px] opacity-70">
                          <th className="py-2">Code</th>
                          <th className="py-2">Category</th>
                          <th className="py-2">Views</th>
                          <th className="py-2">WhatsApp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.categoryStats.map((c) => (
                          <tr
                            key={c.name}
                            className="border-b border-current/10"
                          >
                            <td className="py-2.5 font-mono text-xs font-bold">
                              {c.code}
                            </td>
                            <td className="py-2.5 font-semibold">{c.name}</td>
                            <td className="py-2.5">{c.views}</td>
                            <td
                              style={{ color: "var(--brand-accent)" }}
                              className="py-2.5 font-bold"
                            >
                              {c.contacts}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Item Table + Visitor Activity Log (Both with Show More) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div
                style={{
                  backgroundColor: "var(--brand-surface)",
                  borderColor:
                    "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
                }}
                className="lg:col-span-7 rounded-2xl border p-5 sm:p-6 shadow-xs"
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-current/10 flex-wrap gap-2">
                  <div>
                    <h2 className="font-heading text-2xl font-bold">
                      Detailed Item Analytics Breakdown
                    </h2>
                    <p className="text-xs opacity-70">
                      Performance per item code, views, WhatsApp clicks, and
                      conversion rate
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailModalType("item_analytics")}
                    style={{ backgroundColor: "var(--brand-secondary)" }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-85 cursor-pointer"
                  >
                    <Maximize2 size={13} />
                    <span>Show more</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-current/10 uppercase text-[11px] opacity-70">
                        <th className="py-2.5">Code</th>
                        <th className="py-2.5">Item</th>
                        <th className="py-2.5">Views</th>
                        <th className="py-2.5">Contact Hits</th>
                        <th className="py-2.5">Conv. Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.byContacted.slice(0, 6).map((item) => {
                        const conv =
                          item.views > 0
                            ? (
                                (item.whatsappClicks / item.views) *
                                100
                              ).toFixed(1)
                            : "0.0";
                        return (
                          <tr
                            key={item.id}
                            className="border-b border-current/10"
                          >
                            <td className="py-3 font-mono text-xs font-bold">
                              {item.code}
                            </td>
                            <td className="py-3 font-semibold">{item.name}</td>
                            <td className="py-3">{item.views || 0}</td>
                            <td
                              style={{ color: "var(--brand-accent)" }}
                              className="py-3 font-bold"
                            >
                              {item.whatsappClicks || 0}
                            </td>
                            <td className="py-3">{conv}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "var(--brand-surface)",
                  borderColor:
                    "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
                }}
                className="lg:col-span-5 rounded-2xl border p-5 sm:p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-current/10 flex-wrap gap-2">
                    <div>
                      <h2 className="font-heading text-2xl font-bold">
                        Visitor Activity Log
                      </h2>
                      <p className="text-xs opacity-70">
                        {(analytics.recentEvents || []).length} recorded visitor
                        events
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDetailModalType("activity_log")}
                        style={{
                          backgroundColor: "var(--brand-primary)",
                          color: "var(--brand-surface)",
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        <Maximize2 size={12} />
                        <span>Show more</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await resetAnalyticsData();
                          showToast("Reset visitor analytics counters");
                        }}
                        style={{ backgroundColor: "var(--brand-secondary)" }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                        title="Reset Analytics"
                      >
                        <RotateCcw size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {(analytics.recentEvents || []).length === 0 ? (
                      <p className="text-xs opacity-65 py-6 text-center">
                        No recent visitor events recorded yet.
                      </p>
                    ) : (
                      (analytics.recentEvents || [])
                        .slice(0, 6)
                        .map((ev, i) => (
                          <div
                            key={ev._id || i}
                            style={{
                              backgroundColor:
                                ev.type === "item_contact"
                                  ? "#E3EFE8"
                                  : "var(--brand-secondary)",
                            }}
                            className="p-3 rounded-xl text-xs"
                          >
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-black/10">
                                {ev.type}
                              </span>
                              {ev.itemCode && (
                                <span className="font-mono text-[11px] font-bold">
                                  #{ev.itemCode}
                                </span>
                              )}
                            </div>
                            <div className="font-semibold mt-1">{ev.label}</div>
                            <div className="opacity-65 text-[11px] mt-0.5">
                              {new Date(ev.timestamp).toLocaleString()}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailModalType("activity_log")}
                  style={{ backgroundColor: "var(--brand-secondary)" }}
                  className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold text-center hover:opacity-85 cursor-pointer"
                >
                  Open Full Visitor Activity Log (Search, Date Filter &
                  Pagination) →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 2: PRODUCTS MANAGEMENT (WITH TWO-PART PRODUCT CODE)
            ================================================================= */}
        {activeTab === "products" && (
          <div
            style={{
              backgroundColor: "var(--brand-surface)",
              borderColor:
                "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
            }}
            className="rounded-2xl border p-5 sm:p-6 shadow-xs"
          >
            <div className="flex items-center justify-between gap-4 pb-4 mb-5 border-b border-current/10 flex-wrap">
              <div>
                <h2 className="font-heading text-2xl font-bold">
                  Manage Catalog Items
                </h2>
                <p className="text-xs opacity-75">
                  Every item has a unique two-part code (`CAT-ITEM`)
                  automatically linked to its Category code
                </p>
              </div>
              <button
                type="button"
                onClick={openAddProductModal}
                style={{
                  backgroundColor: "var(--brand-primary)",
                  color: "var(--brand-surface)",
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-xs cursor-pointer"
              >
                <Plus size={16} />
                <span>Add Handmade Item</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-current/10 uppercase text-[11px] opacity-70">
                    <th className="py-3">Photo</th>
                    <th className="py-3">Item Code</th>
                    <th className="py-3">Item Name</th>
                    <th className="py-3">Category</th>
                    <th className="py-3">Price</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Views / WhatsApp</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((item) => (
                    <tr key={item.id} className="border-b border-current/10">
                      <td className="py-3">
                        <img
                          src={item.images?.[0] || "/logo.jpg"}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover border border-current/15"
                        />
                      </td>
                      <td className="py-3">
                        <span
                          style={{
                            backgroundColor: "var(--brand-secondary)",
                            borderColor:
                              "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold tracking-wider"
                        >
                          <Hash size={12} />
                          {item.code}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-xs opacity-70 max-w-xs truncate">
                          {item.description}
                        </div>
                      </td>
                      <td className="py-3">{item.category}</td>
                      <td className="py-3 font-bold">
                        {item.price}
                        {settings.currencySymbol}
                      </td>
                      <td className="py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/5">
                          {item.stockStatus}
                        </span>
                      </td>
                      <td className="py-3">
                        {item.views || 0} views •{" "}
                        <strong style={{ color: "var(--brand-accent)" }}>
                          {item.whatsappClicks || 0} WhatsApp
                        </strong>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEditProductModal(item)}
                            style={{
                              backgroundColor: "var(--brand-secondary)",
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteProduct(item.id);
                              showToast(`Deleted "${item.name}"`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F2E4E4] text-[#9E3B3B] text-xs font-semibold cursor-pointer"
                          >
                            <Trash2 size={13} />
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
            TAB 3: CATEGORIES MANAGEMENT (WITH 3-4 CHAR CATEGORY CODE)
            ================================================================= */}
        {activeTab === "categories" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div
              style={{
                backgroundColor: "var(--brand-surface)",
                borderColor:
                  "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
              }}
              className="lg:col-span-7 rounded-2xl border p-5 sm:p-6 shadow-xs"
            >
              <h2 className="font-heading text-2xl font-bold pb-3 mb-4 border-b border-current/10">
                Product Categories
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-current/10 uppercase text-[11px] opacity-70">
                      <th className="py-2.5">Category Code</th>
                      <th className="py-2.5">Category Name</th>
                      <th className="py-2.5">Products Assigned</th>
                      <th className="py-2.5">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => {
                      const count = products.filter(
                        (p) => p.category === cat.name,
                      ).length;
                      return (
                        <tr key={cat.id} className="border-b border-current/10">
                          <td className="py-3">
                            <span
                              style={{
                                backgroundColor: "var(--brand-secondary)",
                                borderColor:
                                  "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                              }}
                              className="px-2.5 py-1 rounded-lg border font-mono text-xs font-bold tracking-wider"
                            >
                              {cat.code || deriveCategoryCodePreview(cat.name)}
                            </span>
                          </td>
                          <td className="py-3 font-semibold">{cat.name}</td>
                          <td className="py-3">{count} items</td>
                          <td className="py-3">
                            <button
                              type="button"
                              onClick={async () => {
                                await deleteCategory(cat.id);
                                showToast(`Removed category "${cat.name}"`);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F2E4E4] text-[#9E3B3B] text-xs font-semibold cursor-pointer"
                            >
                              <Trash2 size={13} />
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

            <div
              style={{
                backgroundColor: "var(--brand-surface)",
                borderColor:
                  "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
              }}
              className="lg:col-span-5 rounded-2xl border p-5 sm:p-6 shadow-xs h-fit"
            >
              <h2 className="font-heading text-2xl font-bold pb-3 mb-4 border-b border-current/10">
                Add New Category
              </h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const finalCode =
                      newCategoryCode.trim() ||
                      deriveCategoryCodePreview(newCategoryName);
                    await addCategory(newCategoryName, finalCode);
                    showToast(
                      `Added category "${newCategoryName}" [${finalCode.toUpperCase()}]`,
                    );
                    setNewCategoryName("");
                    setNewCategoryCode("");
                  } catch (err: any) {
                    showToast(err.message);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Category Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Handwoven Baskets, Leather Goods..."
                    value={newCategoryName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewCategoryName(val);
                      setNewCategoryCode(deriveCategoryCodePreview(val));
                    }}
                    style={{
                      backgroundColor: "var(--brand-secondary)",
                      borderColor:
                        "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider">
                      Category Code (3 to 4 chars before "-")
                    </label>
                    <span className="text-[11px] opacity-70">
                      Auto-generated
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={4}
                    placeholder="e.g., BASK"
                    value={newCategoryCode}
                    onChange={(e) =>
                      setNewCategoryCode(
                        e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                          .slice(0, 4),
                      )
                    }
                    style={{
                      backgroundColor: "var(--brand-secondary)",
                      borderColor:
                        "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold uppercase tracking-wider outline-none"
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    backgroundColor: "var(--brand-primary)",
                    color: "var(--brand-surface)",
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Create Category</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 4: USERS COLLECTION MANAGEMENT
            ================================================================= */}
        {activeTab === "users" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {(
                [
                  {
                    role: "superadmin",
                    title: "Superadmin",
                    desc: "Full System Owner",
                  },
                  { role: "admin", title: "Admins", desc: "Store Managers" },
                  {
                    role: "operator",
                    title: "Operators",
                    desc: "Catalog & Orders",
                  },
                  {
                    role: "customer",
                    title: "Customers",
                    desc: "Registered Buyers",
                  },
                ] as const
              ).map((r) => (
                <div
                  key={r.role}
                  style={{
                    backgroundColor: "var(--brand-surface)",
                    borderColor:
                      "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
                  }}
                  className="rounded-2xl border p-4 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                      {r.title}
                    </span>
                    <div className="font-heading text-3xl font-bold my-0.5">
                      {roleCounts[r.role]}
                    </div>
                    <span className="text-[11px] opacity-70">{r.desc}</span>
                  </div>
                  <div
                    style={{ backgroundColor: "var(--brand-secondary)" }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                  >
                    <Shield size={18} />
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                backgroundColor: "var(--brand-surface)",
                borderColor:
                  "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
              }}
              className="rounded-2xl border p-5 sm:p-6 shadow-xs"
            >
              <div className="flex items-center justify-between gap-4 pb-4 mb-5 border-b border-current/10 flex-wrap">
                <div>
                  <h2 className="font-heading text-2xl font-bold">
                    Unified Users Directory (`users` Collection)
                  </h2>
                  <p className="text-xs opacity-75">
                    Manage all accounts across Superadmin, Admin, Operator, and
                    Customer roles
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddUserModal}
                  style={{
                    backgroundColor: "var(--brand-primary)",
                    color: "var(--brand-surface)",
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-xs cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Add New User</span>
                </button>
              </div>

              <div className="space-y-4 mb-5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="relative md:col-span-5 flex items-center">
                    <Search
                      size={16}
                      className="absolute left-3.5 opacity-60 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="Search by name, email, phone, or role..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      style={{
                        backgroundColor: "var(--brand-secondary)",
                        borderColor:
                          "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                      }}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl border text-xs sm:text-sm outline-none"
                    />
                    {userSearch && (
                      <button
                        type="button"
                        onClick={() => setUserSearch("")}
                        className="absolute right-2.5 opacity-60 hover:opacity-100 cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <select
                      value={userStatusFilter}
                      onChange={(e) =>
                        setUserStatusFilter(
                          e.target.value as "All" | UserStatus,
                        )
                      }
                      style={{
                        backgroundColor: "var(--brand-secondary)",
                        borderColor:
                          "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer"
                    >
                      <option value="All">Status: All</option>
                      <option value="Active">Active Only</option>
                      <option value="Inactive">Inactive Only</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <select
                      value={userSortBy}
                      onChange={(e) => setUserSortBy(e.target.value)}
                      style={{
                        backgroundColor: "var(--brand-secondary)",
                        borderColor:
                          "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer"
                    >
                      <option value="newest">Sort: Newest</option>
                      <option value="name-asc">Name: A → Z</option>
                      <option value="name-desc">Name: Z → A</option>
                      <option value="role">Sort by Role</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <select
                      value={usersPerPage}
                      onChange={(e) =>
                        setUsersPerPage(Number(e.target.value) || 5)
                      }
                      style={{
                        backgroundColor: "var(--brand-secondary)",
                        borderColor:
                          "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer"
                    >
                      <option value={5}>5 / page</option>
                      <option value={10}>10 / page</option>
                      <option value={20}>20 / page</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pt-1">
                  {(
                    [
                      "All",
                      "superadmin",
                      "admin",
                      "operator",
                      "customer",
                    ] as const
                  ).map((roleOption) => {
                    const active = userRoleFilter === roleOption;
                    return (
                      <button
                        key={roleOption}
                        type="button"
                        onClick={() => setUserRoleFilter(roleOption)}
                        style={
                          active
                            ? {
                                backgroundColor: "var(--brand-primary)",
                                color: "var(--brand-surface)",
                              }
                            : {
                                backgroundColor: "var(--brand-secondary)",
                                color: "var(--brand-primary)",
                              }
                        }
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer"
                      >
                        {roleOption === "All" ? "All Roles" : roleOption} (
                        {roleCounts[roleOption]})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-current/10 uppercase text-[11px] opacity-70">
                      <th className="py-3">Name</th>
                      <th className="py-3">Email</th>
                      <th className="py-3">Phone</th>
                      <th className="py-3">Role</th>
                      <th className="py-3">Status</th>
                      <th className="py-3">Created</th>
                      <th className="py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center opacity-70">
                          No users match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((u) => (
                        <tr key={u.id} className="border-b border-current/10">
                          <td className="py-3.5 font-semibold flex items-center gap-2">
                            <div
                              style={{
                                backgroundColor: "var(--brand-primary)",
                                color: "var(--brand-surface)",
                              }}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div>{u.name}</div>
                              {u.role === "superadmin" && (
                                <span className="text-[10px] font-bold text-amber-800">
                                  ★ Primary Superadmin
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5">{u.email}</td>
                          <td className="py-3.5 opacity-80">
                            {u.phone || "—"}
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getRoleBadgeClasses(
                                u.role,
                              )}`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                u.status === "Active"
                                  ? "bg-[#E3EFE8] text-[#286646]"
                                  : "bg-[#F2E4E4] text-[#9E3B3B]"
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3.5 opacity-75 text-xs">
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="py-3.5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => openEditUserModal(u)}
                                style={{
                                  backgroundColor: "var(--brand-secondary)",
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                <Edit3 size={13} />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                disabled={
                                  u.role === "superadmin" &&
                                  roleCounts.superadmin <= 1
                                }
                                onClick={async () => {
                                  try {
                                    await deleteUser(u.id);
                                    showToast(`Deleted user "${u.name}"`);
                                  } catch (err: any) {
                                    showToast(err.message);
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F2E4E4] text-[#9E3B3B] text-xs font-semibold cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 pt-4 border-t border-current/10 flex items-center justify-between gap-4 flex-wrap text-xs">
                <span className="opacity-75">
                  Showing <strong>{paginatedUsers.length}</strong> of{" "}
                  <strong>{filteredUsers.length}</strong> filtered users (Total:{" "}
                  {users.length})
                </span>

                {userTotalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={userCurrentPage === 1}
                      onClick={() =>
                        setUserCurrentPage((p) => Math.max(1, p - 1))
                      }
                      style={{ backgroundColor: "var(--brand-secondary)" }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft size={15} />
                    </button>

                    {Array.from(
                      { length: userTotalPages },
                      (_, i) => i + 1,
                    ).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setUserCurrentPage(pageNum)}
                        style={
                          userCurrentPage === pageNum
                            ? {
                                backgroundColor: "var(--brand-primary)",
                                color: "var(--brand-surface)",
                              }
                            : { backgroundColor: "var(--brand-secondary)" }
                        }
                        className="w-8 h-8 rounded-lg font-semibold flex items-center justify-center cursor-pointer"
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={userCurrentPage === userTotalPages}
                      onClick={() =>
                        setUserCurrentPage((p) =>
                          Math.min(userTotalPages, p + 1),
                        )
                      }
                      style={{ backgroundColor: "var(--brand-secondary)" }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 5: THEME & TYPOGRAPHY CUSTOMIZER
            ================================================================= */}
        {activeTab === "theme" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div
              style={{
                backgroundColor: "var(--brand-surface)",
                borderColor:
                  "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
              }}
              className="lg:col-span-7 rounded-2xl border p-5 sm:p-6 shadow-xs space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-current/10 flex-wrap gap-2">
                <div>
                  <h2 className="font-heading text-2xl font-bold">
                    Web App Theme & Typography
                  </h2>
                  <p className="text-xs opacity-75">
                    Customize primary/secondary colors and select from preloaded
                    Google Fonts. Default brand values are highlighted.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefaultTheme}
                  style={{ backgroundColor: "var(--brand-secondary)" }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer hover:opacity-85"
                >
                  <RotateCcw size={14} />
                  <span>Restore Brand Defaults</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5">
                  Color Palette Presets
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {COLOR_PRESETS.map((preset) => {
                    const isSelected =
                      themeForm.primaryColor.toLowerCase() ===
                        preset.primaryColor.toLowerCase() &&
                      themeForm.secondaryColor.toLowerCase() ===
                        preset.secondaryColor.toLowerCase();
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() =>
                          setThemeForm({
                            ...themeForm,
                            primaryColor: preset.primaryColor,
                            secondaryColor: preset.secondaryColor,
                            surfaceColor: preset.surfaceColor,
                            accentColor: preset.accentColor,
                          })
                        }
                        style={{
                          backgroundColor: "var(--brand-secondary)",
                          borderColor: isSelected
                            ? "var(--brand-primary)"
                            : "transparent",
                        }}
                        className="p-3.5 rounded-xl border-2 text-left flex items-center justify-between gap-2 cursor-pointer transition-all"
                      >
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>{preset.name}</span>
                            {preset.isDefault && (
                              <span
                                style={{
                                  backgroundColor: "var(--brand-primary)",
                                  color: "var(--brand-surface)",
                                }}
                                className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              >
                                DEFAULT
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center -space-x-1.5 shrink-0">
                          <span
                            style={{ backgroundColor: preset.primaryColor }}
                            className="w-6 h-6 rounded-full border border-white shadow-2xs"
                          />
                          <span
                            style={{ backgroundColor: preset.secondaryColor }}
                            className="w-6 h-6 rounded-full border border-black/15 shadow-2xs"
                          />
                          <span
                            style={{ backgroundColor: preset.accentColor }}
                            className="w-6 h-6 rounded-full border border-white shadow-2xs"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  style={{ backgroundColor: "var(--brand-secondary)" }}
                  className="p-4 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold">
                      Primary Color (Text & Buttons)
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-black/10 font-semibold">
                      Default: {DEFAULT_THEME.primaryColor}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={themeForm.primaryColor}
                      onChange={(e) =>
                        setThemeForm({
                          ...themeForm,
                          primaryColor: e.target.value,
                        })
                      }
                      className="w-11 h-11 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={themeForm.primaryColor}
                      onChange={(e) =>
                        setThemeForm({
                          ...themeForm,
                          primaryColor: e.target.value,
                        })
                      }
                      style={{ backgroundColor: "var(--brand-surface)" }}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-mono uppercase"
                    />
                  </div>
                </div>

                <div
                  style={{ backgroundColor: "var(--brand-secondary)" }}
                  className="p-4 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold">
                      Secondary Color (Page Background)
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-black/10 font-semibold">
                      Default: {DEFAULT_THEME.secondaryColor}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={themeForm.secondaryColor}
                      onChange={(e) =>
                        setThemeForm({
                          ...themeForm,
                          secondaryColor: e.target.value,
                        })
                      }
                      className="w-11 h-11 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={themeForm.secondaryColor}
                      onChange={(e) =>
                        setThemeForm({
                          ...themeForm,
                          secondaryColor: e.target.value,
                        })
                      }
                      style={{ backgroundColor: "var(--brand-surface)" }}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-mono uppercase"
                    />
                  </div>
                </div>

                <div
                  style={{ backgroundColor: "var(--brand-secondary)" }}
                  className="p-4 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold">
                      Card Surface Color
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-black/10 font-semibold">
                      Default: {DEFAULT_THEME.surfaceColor}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={themeForm.surfaceColor}
                      onChange={(e) =>
                        setThemeForm({
                          ...themeForm,
                          surfaceColor: e.target.value,
                        })
                      }
                      className="w-11 h-11 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={themeForm.surfaceColor}
                      onChange={(e) =>
                        setThemeForm({
                          ...themeForm,
                          surfaceColor: e.target.value,
                        })
                      }
                      style={{ backgroundColor: "var(--brand-surface)" }}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-mono uppercase"
                    />
                  </div>
                </div>

                <div
                  style={{ backgroundColor: "var(--brand-secondary)" }}
                  className="p-4 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold">
                      Accent / WhatsApp CTA Color
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-black/10 font-semibold">
                      Default: {DEFAULT_THEME.accentColor}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={themeForm.accentColor}
                      onChange={(e) =>
                        setThemeForm({
                          ...themeForm,
                          accentColor: e.target.value,
                        })
                      }
                      className="w-11 h-11 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={themeForm.accentColor}
                      onChange={(e) =>
                        setThemeForm({
                          ...themeForm,
                          accentColor: e.target.value,
                        })
                      }
                      style={{ backgroundColor: "var(--brand-surface)" }}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                    <Type size={14} className="inline mr-1" />
                    Heading Font Family
                  </label>
                  <select
                    value={themeForm.headingFont}
                    onChange={(e) =>
                      setThemeForm({
                        ...themeForm,
                        headingFont: e.target.value,
                      })
                    }
                    style={{
                      backgroundColor: "var(--brand-secondary)",
                      borderColor:
                        "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                    }}
                    className="w-full px-3.5 py-3 rounded-xl border text-sm font-medium cursor-pointer"
                  >
                    {FONT_FAMILY_OPTIONS.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name}{" "}
                        {f.isDefaultHeading
                          ? "★ (Default Heading)"
                          : `— ${f.type}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                    <Type size={14} className="inline mr-1" />
                    Body & UI Font Family
                  </label>
                  <select
                    value={themeForm.bodyFont}
                    onChange={(e) =>
                      setThemeForm({ ...themeForm, bodyFont: e.target.value })
                    }
                    style={{
                      backgroundColor: "var(--brand-secondary)",
                      borderColor:
                        "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                    }}
                    className="w-full px-3.5 py-3 rounded-xl border text-sm font-medium cursor-pointer"
                  >
                    {FONT_FAMILY_OPTIONS.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name}{" "}
                        {f.isDefaultBody ? "★ (Default Body)" : `— ${f.type}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSaveTheme()}
                style={{
                  backgroundColor: "var(--brand-primary)",
                  color: "var(--brand-surface)",
                }}
                className="w-full py-3.5 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-md hover:opacity-95 cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Apply & Save Theme to Database</span>
              </button>
            </div>

            <div className="lg:col-span-5">
              <div
                style={{
                  backgroundColor: themeForm.secondaryColor,
                  color: themeForm.primaryColor,
                  fontFamily: `'${themeForm.bodyFont}', sans-serif`,
                  borderColor:
                    "color-mix(in srgb, currentColor 20%, transparent)",
                }}
                className="rounded-3xl border p-6 shadow-xl transition-all"
              >
                <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-4">
                  Live Customer Theme Preview
                </div>

                <div
                  style={{
                    backgroundColor: themeForm.surfaceColor,
                    borderColor:
                      "color-mix(in srgb, currentColor 15%, transparent)",
                  }}
                  className="rounded-2xl border p-6 text-center shadow-md"
                >
                  <img
                    src="/logo.jpg"
                    alt="Preview"
                    className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border border-current/20"
                  />
                  <h3
                    style={{ fontFamily: `'${themeForm.headingFont}', serif` }}
                    className="text-2xl font-bold uppercase tracking-wider mb-1"
                  >
                    {settings.brandName}
                  </h3>
                  <p className="text-xs opacity-80 mb-5">{settings.tagline}</p>

                  <div
                    style={{
                      backgroundColor: themeForm.primaryColor,
                      color: themeForm.surfaceColor,
                    }}
                    className="w-full py-3 px-4 rounded-xl text-sm font-semibold mb-2.5 shadow-xs"
                  >
                    View List (Primary Button)
                  </div>

                  <div
                    style={{
                      backgroundColor: themeForm.accentColor,
                      color: "#FFFFFF",
                    }}
                    className="w-full py-3 px-4 rounded-xl text-sm font-semibold shadow-xs"
                  >
                    Contact for Info (WhatsApp Accent)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 6: SOCIAL LINKS, WHATSAPP & ADMIN SECURITY
            ================================================================= */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div
              style={{
                backgroundColor: "var(--brand-surface)",
                borderColor:
                  "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
              }}
              className="lg:col-span-7 rounded-2xl border p-5 sm:p-6 shadow-xs"
            >
              <h2 className="font-heading text-2xl font-bold pb-3 mb-4 border-b border-current/10">
                Brand, WhatsApp & Social Links
              </h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await updateSettings(settingsForm);
                    showToast("Saved brand & social links to MongoDB!");
                  } catch (err: any) {
                    showToast(err.message);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.brandName}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        brandName: e.target.value,
                      })
                    }
                    style={{ backgroundColor: "var(--brand-secondary)" }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-current/20 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                    Brand Tagline (Main Menu Bio)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.tagline}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        tagline: e.target.value,
                      })
                    }
                    style={{ backgroundColor: "var(--brand-secondary)" }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-current/20 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                    WhatsApp Phone Number (with country code, digits only)
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.whatsappNumber}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        whatsappNumber: e.target.value,
                      })
                    }
                    style={{ backgroundColor: "var(--brand-secondary)" }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-current/20 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      value={settingsForm.instagramUrl}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          instagramUrl: e.target.value,
                        })
                      }
                      style={{ backgroundColor: "var(--brand-secondary)" }}
                      className="w-full px-3 py-2.5 rounded-xl border border-current/20 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                      Facebook URL
                    </label>
                    <input
                      type="url"
                      value={settingsForm.facebookUrl}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          facebookUrl: e.target.value,
                        })
                      }
                      style={{ backgroundColor: "var(--brand-secondary)" }}
                      className="w-full px-3 py-2.5 rounded-xl border border-current/20 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                      TikTok URL
                    </label>
                    <input
                      type="url"
                      value={settingsForm.tiktokUrl}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          tiktokUrl: e.target.value,
                        })
                      }
                      style={{ backgroundColor: "var(--brand-secondary)" }}
                      className="w-full px-3 py-2.5 rounded-xl border border-current/20 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                      Currency Symbol
                    </label>
                    <input
                      type="text"
                      value={settingsForm.currencySymbol}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          currencySymbol: e.target.value,
                        })
                      }
                      style={{ backgroundColor: "var(--brand-secondary)" }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-current/20 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                      Items Per Page
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="24"
                      value={settingsForm.itemsPerPage}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          itemsPerPage: Number(e.target.value) || 6,
                        })
                      }
                      style={{ backgroundColor: "var(--brand-secondary)" }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-current/20 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    backgroundColor: "var(--brand-primary)",
                    color: "var(--brand-surface)",
                  }}
                  className="px-5 py-3 rounded-xl text-sm font-semibold shadow-xs cursor-pointer"
                >
                  Save Brand & Social Settings
                </button>
              </form>
            </div>

            <div
              style={{
                backgroundColor: "var(--brand-surface)",
                borderColor:
                  "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
              }}
              className="lg:col-span-5 rounded-2xl border p-5 sm:p-6 shadow-xs h-fit"
            >
              <h2 className="font-heading text-2xl font-bold pb-3 mb-4 border-b border-current/10">
                My Account Security
              </h2>
              <p className="text-xs opacity-75 mb-4">
                Update your signed-in account ({adminUser.role}) inside the
                `users` collection.
              </p>

              {securityError && (
                <div className="bg-[#F2E4E4] text-[#9E3B3B] px-3.5 py-2.5 rounded-xl text-xs font-medium mb-4">
                  {securityError}
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSecurityError("");
                  try {
                    await updateAdminCredentials(securityForm);
                    setSecurityForm((prev) => ({
                      ...prev,
                      currentPassword: "",
                      newPassword: "",
                    }));
                    showToast("Updated your account credentials!");
                  } catch (err: any) {
                    setSecurityError(err.message);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={securityForm.name}
                    onChange={(e) =>
                      setSecurityForm({ ...securityForm, name: e.target.value })
                    }
                    style={{ backgroundColor: "var(--brand-secondary)" }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-current/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={securityForm.email}
                    onChange={(e) =>
                      setSecurityForm({
                        ...securityForm,
                        email: e.target.value,
                      })
                    }
                    style={{ backgroundColor: "var(--brand-secondary)" }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-current/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                    Current Password (Required)
                  </label>
                  <input
                    type="password"
                    required
                    value={securityForm.currentPassword}
                    onChange={(e) =>
                      setSecurityForm({
                        ...securityForm,
                        currentPassword: e.target.value,
                      })
                    }
                    style={{ backgroundColor: "var(--brand-secondary)" }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-current/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                    New Password (min 6 chars)
                  </label>
                  <input
                    type="password"
                    minLength={6}
                    placeholder="Leave blank to keep current password"
                    value={securityForm.newPassword}
                    onChange={(e) =>
                      setSecurityForm({
                        ...securityForm,
                        newPassword: e.target.value,
                      })
                    }
                    style={{ backgroundColor: "var(--brand-secondary)" }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-current/20 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "var(--brand-primary)",
                    color: "var(--brand-surface)",
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  <Lock size={15} />
                  <span>Update My Credentials</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* =====================================================================
          "SHOW MORE" DEEP-DIVE ANALYTICS & MONITORING MODALS
          ===================================================================== */}
      {detailModalType && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDetailModalType(null)}
        >
          <div
            style={{
              backgroundColor: "var(--brand-surface)",
              color: "var(--brand-primary)",
            }}
            className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-7 shadow-2xl relative animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setDetailModalType(null)}
              style={{ backgroundColor: "var(--brand-secondary)" }}
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* 1. FULL VISITOR ACTIVITY LOG MODAL (SEARCH, EVENT FILTER, DATE RANGE, PAGINATION) */}
            {detailModalType === "activity_log" && (
              <div>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-1">
                  Full Visitor Activity Log & Monitoring
                </h2>
                <p className="text-xs sm:text-sm opacity-75 mb-5">
                  Search events, filter by interaction type or date range, and
                  browse paginated visitor history.
                </p>

                {/* Filter Controls */}
                <div
                  style={{ backgroundColor: "var(--brand-secondary)" }}
                  className="p-4 rounded-2xl mb-5 space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Search */}
                    <div className="relative md:col-span-4 flex items-center">
                      <Search
                        size={15}
                        className="absolute left-3 opacity-60 pointer-events-none"
                      />
                      <input
                        type="text"
                        placeholder="Search item name, code, or action..."
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        style={{ backgroundColor: "var(--brand-surface)" }}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-current/15 text-xs sm:text-sm outline-none"
                      />
                    </div>

                    {/* Event Type Filter */}
                    <div className="md:col-span-3">
                      <select
                        value={logTypeFilter}
                        onChange={(e) => setLogTypeFilter(e.target.value)}
                        style={{ backgroundColor: "var(--brand-surface)" }}
                        className="w-full px-3 py-2 rounded-xl border border-current/15 text-xs sm:text-sm font-medium"
                      >
                        <option value="All">All Event Types</option>
                        <option value="item_contact">
                          WhatsApp Item Contact
                        </option>
                        <option value="item_view">Item Detail Views</option>
                        <option value="qr_scan">QR Main Menu Visits</option>
                        <option value="catalog_view">
                          Catalog View List Visits
                        </option>
                        <option value="social_click">
                          Social Button Clicks
                        </option>
                      </select>
                    </div>

                    {/* Date From */}
                    <div className="md:col-span-2 flex items-center gap-1.5">
                      <Calendar size={14} className="opacity-65 shrink-0" />
                      <input
                        type="date"
                        value={logDateFrom}
                        onChange={(e) => setLogDateFrom(e.target.value)}
                        style={{ backgroundColor: "var(--brand-surface)" }}
                        className="w-full px-2.5 py-2 rounded-xl border border-current/15 text-xs"
                        title="From Date"
                      />
                    </div>

                    {/* Date To */}
                    <div className="md:col-span-2 flex items-center gap-1.5">
                      <input
                        type="date"
                        value={logDateTo}
                        onChange={(e) => setLogDateTo(e.target.value)}
                        style={{ backgroundColor: "var(--brand-surface)" }}
                        className="w-full px-2.5 py-2 rounded-xl border border-current/15 text-xs"
                        title="To Date"
                      />
                    </div>

                    {/* Per Page */}
                    <div className="md:col-span-1">
                      <select
                        value={logPerPage}
                        onChange={(e) =>
                          setLogPerPage(Number(e.target.value) || 8)
                        }
                        style={{ backgroundColor: "var(--brand-surface)" }}
                        className="w-full px-2 py-2 rounded-xl border border-current/15 text-xs font-semibold"
                      >
                        <option value={8}>8</option>
                        <option value={15}>15</option>
                        <option value={30}>30</option>
                      </select>
                    </div>
                  </div>

                  {(logSearch ||
                    logTypeFilter !== "All" ||
                    logDateFrom ||
                    logDateTo) && (
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span>
                        Matching events:{" "}
                        <strong>{filteredActivityLogs.length}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setLogSearch("");
                          setLogTypeFilter("All");
                          setLogDateFrom("");
                          setLogDateTo("");
                        }}
                        className="underline font-semibold cursor-pointer"
                      >
                        Clear all log filters
                      </button>
                    </div>
                  )}
                </div>

                {/* Activity Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-current/15 uppercase text-[11px] opacity-70">
                        <th className="py-2.5">Type</th>
                        <th className="py-2.5">Item Code</th>
                        <th className="py-2.5">Activity Description</th>
                        <th className="py-2.5">Category</th>
                        <th className="py-2.5">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedActivityLogs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-8 text-center opacity-70"
                          >
                            No visitor activity logs match your filters.
                          </td>
                        </tr>
                      ) : (
                        paginatedActivityLogs.map((ev, idx) => (
                          <tr
                            key={ev._id || idx}
                            className="border-b border-current/10"
                          >
                            <td className="py-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                                  ev.type === "item_contact"
                                    ? "bg-[#E3EFE8] text-[#286646]"
                                    : ev.type === "item_view"
                                      ? "bg-amber-500/15 text-amber-900"
                                      : "bg-black/10"
                                }`}
                              >
                                {ev.type}
                              </span>
                            </td>
                            <td className="py-3 font-mono text-xs font-bold">
                              {ev.itemCode || "—"}
                            </td>
                            <td className="py-3 font-semibold">{ev.label}</td>
                            <td className="py-3 opacity-80">
                              {ev.category || "—"}
                            </td>
                            <td className="py-3 text-xs opacity-75 whitespace-nowrap">
                              {new Date(ev.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-5 pt-4 border-t border-current/10 flex items-center justify-between flex-wrap gap-3 text-xs">
                  <span>
                    Showing <strong>{paginatedActivityLogs.length}</strong> of{" "}
                    <strong>{filteredActivityLogs.length}</strong> events
                  </span>
                  {logTotalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={logPage === 1}
                        onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                        style={{ backgroundColor: "var(--brand-secondary)" }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft size={15} />
                      </button>
                      {Array.from(
                        { length: logTotalPages },
                        (_, i) => i + 1,
                      ).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setLogPage(pageNum)}
                          style={
                            logPage === pageNum
                              ? {
                                  backgroundColor: "var(--brand-primary)",
                                  color: "var(--brand-surface)",
                                }
                              : { backgroundColor: "var(--brand-secondary)" }
                          }
                          className="w-8 h-8 rounded-lg font-semibold flex items-center justify-center cursor-pointer"
                        >
                          {pageNum}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={logPage === logTotalPages}
                        onClick={() =>
                          setLogPage((p) => Math.min(logTotalPages, p + 1))
                        }
                        style={{ backgroundColor: "var(--brand-secondary)" }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. MOST CONTACTED & VISITED ITEMS / DETAILED ITEM ANALYTICS MODAL */}
            {(detailModalType === "contacted_visited" ||
              detailModalType === "item_analytics") && (
              <div>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-1">
                  {detailModalType === "contacted_visited"
                    ? "Most Contacted & Visited Items — Full Analysis"
                    : "Detailed Item Analytics & Conversion Explorer"}
                </h2>
                <p className="text-xs sm:text-sm opacity-75 mb-5">
                  Filter by category or stock status, search by item code
                  (`CAT-ITEM`), and compare views vs. WhatsApp inquiries.
                </p>

                <div
                  style={{ backgroundColor: "var(--brand-secondary)" }}
                  className="p-4 rounded-2xl mb-5 grid grid-cols-1 sm:grid-cols-4 gap-3"
                >
                  <div className="relative flex items-center">
                    <Search
                      size={15}
                      className="absolute left-3 opacity-60 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="Search name or code..."
                      value={itemAnalyticsSearch}
                      onChange={(e) => setItemAnalyticsSearch(e.target.value)}
                      style={{ backgroundColor: "var(--brand-surface)" }}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-current/15 text-xs sm:text-sm outline-none"
                    />
                  </div>

                  <select
                    value={itemAnalyticsCat}
                    onChange={(e) => setItemAnalyticsCat(e.target.value)}
                    style={{ backgroundColor: "var(--brand-surface)" }}
                    className="px-3 py-2 rounded-xl border border-current/15 text-xs sm:text-sm font-medium"
                  >
                    <option value="All">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>

                  <select
                    value={itemAnalyticsStock}
                    onChange={(e) => setItemAnalyticsStock(e.target.value)}
                    style={{ backgroundColor: "var(--brand-surface)" }}
                    className="px-3 py-2 rounded-xl border border-current/15 text-xs sm:text-sm font-medium"
                  >
                    <option value="All">All Stock Statuses</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Made to Order">Made to Order</option>
                    <option value="Sold Out">Sold Out</option>
                  </select>

                  <select
                    value={itemAnalyticsSort}
                    onChange={(e) => setItemAnalyticsSort(e.target.value)}
                    style={{ backgroundColor: "var(--brand-surface)" }}
                    className="px-3 py-2 rounded-xl border border-current/15 text-xs sm:text-sm font-medium"
                  >
                    <option value="contacts-desc">Sort: Most Contacted</option>
                    <option value="views-desc">
                      Sort: Most Visited (Views)
                    </option>
                    <option value="conv-desc">
                      Sort: Highest Conversion %
                    </option>
                    <option value="price-desc">Sort: Highest Price</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-current/15 uppercase text-[11px] opacity-70">
                        <th className="py-2.5">Rank</th>
                        <th className="py-2.5">Item Code</th>
                        <th className="py-2.5">Item Name</th>
                        <th className="py-2.5">Category</th>
                        <th className="py-2.5">Price</th>
                        <th className="py-2.5">Views</th>
                        <th className="py-2.5">WhatsApp Hits</th>
                        <th className="py-2.5">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAnalyticsItems.map((item, idx) => {
                        const rank =
                          (itemAnalyticsPage - 1) * itemAnalyticsPerPage +
                          idx +
                          1;
                        const conv =
                          item.views > 0
                            ? (
                                (item.whatsappClicks / item.views) *
                                100
                              ).toFixed(1)
                            : "0.0";
                        return (
                          <tr
                            key={item.id}
                            className="border-b border-current/10"
                          >
                            <td className="py-3 font-bold">#{rank}</td>
                            <td className="py-3">
                              <span
                                style={{
                                  backgroundColor: "var(--brand-secondary)",
                                }}
                                className="px-2 py-1 rounded font-mono text-xs font-bold"
                              >
                                {item.code}
                              </span>
                            </td>
                            <td className="py-3 font-semibold">{item.name}</td>
                            <td className="py-3">{item.category}</td>
                            <td className="py-3 font-bold">
                              {item.price}
                              {settings.currencySymbol}
                            </td>
                            <td className="py-3">{item.views || 0}</td>
                            <td
                              style={{ color: "var(--brand-accent)" }}
                              className="py-3 font-bold"
                            >
                              {item.whatsappClicks || 0}
                            </td>
                            <td className="py-3 font-semibold">{conv}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 pt-4 border-t border-current/10 flex items-center justify-between text-xs">
                  <span>
                    Showing <strong>{paginatedAnalyticsItems.length}</strong> of{" "}
                    <strong>{filteredAnalyticsItems.length}</strong> items
                  </span>
                  {itemAnalyticsTotalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={itemAnalyticsPage === 1}
                        onClick={() =>
                          setItemAnalyticsPage((p) => Math.max(1, p - 1))
                        }
                        style={{ backgroundColor: "var(--brand-secondary)" }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft size={15} />
                      </button>
                      {Array.from(
                        { length: itemAnalyticsTotalPages },
                        (_, i) => i + 1,
                      ).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setItemAnalyticsPage(pageNum)}
                          style={
                            itemAnalyticsPage === pageNum
                              ? {
                                  backgroundColor: "var(--brand-primary)",
                                  color: "var(--brand-surface)",
                                }
                              : { backgroundColor: "var(--brand-secondary)" }
                          }
                          className="w-8 h-8 rounded-lg font-semibold flex items-center justify-center cursor-pointer"
                        >
                          {pageNum}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={itemAnalyticsPage === itemAnalyticsTotalPages}
                        onClick={() =>
                          setItemAnalyticsPage((p) =>
                            Math.min(itemAnalyticsTotalPages, p + 1),
                          )
                        }
                        style={{ backgroundColor: "var(--brand-secondary)" }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. MAIN MENU SOCIAL CLICKS DEEP-DIVE MODAL */}
            {detailModalType === "social_clicks" && (
              <div>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-1">
                  Main Menu Social & Contact Clicks Analysis
                </h2>
                <p className="text-xs sm:text-sm opacity-75 mb-5">
                  Share of outbound traffic from your QR Main Menu across
                  Instagram, TikTok, Facebook, and Direct WhatsApp.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {[
                    {
                      key: "instagram",
                      label: "Instagram Profile",
                      count: analytics.socialClicks?.instagram || 0,
                      url: settings.instagramUrl,
                    },
                    {
                      key: "tiktok",
                      label: "TikTok Channel",
                      count: analytics.socialClicks?.tiktok || 0,
                      url: settings.tiktokUrl,
                    },
                    {
                      key: "facebook",
                      label: "Facebook Page",
                      count: analytics.socialClicks?.facebook || 0,
                      url: settings.facebookUrl,
                    },
                    {
                      key: "whatsappDirect",
                      label: "Direct WhatsApp Button",
                      count: analytics.socialClicks?.whatsappDirect || 0,
                      url: `WhatsApp (${settings.whatsappNumber})`,
                    },
                  ].map((plat) => {
                    const sharePct =
                      stats.totalSocialClicks > 0
                        ? (
                            (plat.count / stats.totalSocialClicks) *
                            100
                          ).toFixed(1)
                        : "0.0";
                    const qrClickThrough =
                      analytics.totalQrLandingVisits > 0
                        ? (
                            (plat.count / analytics.totalQrLandingVisits) *
                            100
                          ).toFixed(1)
                        : "0.0";

                    return (
                      <div
                        key={plat.key}
                        style={{ backgroundColor: "var(--brand-secondary)" }}
                        className="p-4 rounded-2xl"
                      >
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-bold text-sm">
                            {plat.label}
                          </span>
                          <span className="font-heading text-3xl font-bold">
                            {plat.count}
                          </span>
                        </div>
                        <div className="text-xs opacity-70 truncate mb-3">
                          Target: {plat.url}
                        </div>
                        <div className="w-full h-2 rounded-full bg-black/10 overflow-hidden mb-2">
                          <div
                            style={{
                              width: `${sharePct}%`,
                              backgroundColor: "var(--brand-primary)",
                            }}
                            className="h-full rounded-full"
                          />
                        </div>
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{sharePct}% of social clicks</span>
                          <span>{qrClickThrough}% of QR visits</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. CATEGORY DEMAND DEEP-DIVE MODAL */}
            {detailModalType === "category_demand" && (
              <div>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-1">
                  Category Demand & Conversion Analysis
                </h2>
                <p className="text-xs sm:text-sm opacity-75 mb-5">
                  Compare category codes, total assigned products, visitor
                  views, WhatsApp inquiries, and conversion rates.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-current/15 uppercase text-[11px] opacity-70">
                        <th className="py-3">Category Code</th>
                        <th className="py-3">Category Name</th>
                        <th className="py-3">Items Count</th>
                        <th className="py-3">Total Views</th>
                        <th className="py-3">WhatsApp Hits</th>
                        <th className="py-3">Conversion Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.categoryStats.map((cat) => (
                        <tr
                          key={cat.name}
                          className="border-b border-current/10"
                        >
                          <td className="py-3 font-mono font-bold">
                            {cat.code}
                          </td>
                          <td className="py-3 font-semibold">{cat.name}</td>
                          <td className="py-3">{cat.itemCount} items</td>
                          <td className="py-3">{cat.views}</td>
                          <td
                            style={{ color: "var(--brand-accent)" }}
                            className="py-3 font-bold"
                          >
                            {cat.contacts}
                          </td>
                          <td className="py-3 font-semibold">{cat.conv}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {isUserModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsUserModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "var(--brand-surface)",
              color: "var(--brand-primary)",
            }}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              style={{ backgroundColor: "var(--brand-secondary)" }}
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>

            <h2 className="font-heading text-2xl font-bold mb-1">
              {editingUser ? `Edit User: ${editingUser.name}` : "Add New User"}
            </h2>
            <p className="text-xs opacity-75 mb-4">
              All accounts are stored in the unified MongoDB `users` collection.
            </p>

            {userFormError && (
              <div className="bg-[#F2E4E4] text-[#9E3B3B] px-3.5 py-2.5 rounded-xl text-xs font-medium mb-4">
                {userFormError}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Walid Mohamed"
                  value={userForm.name}
                  onChange={(e) =>
                    setUserForm({ ...userForm, name: e.target.value })
                  }
                  style={{ backgroundColor: "var(--brand-secondary)" }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-current/20 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@handmadehouse.com"
                    value={userForm.email}
                    onChange={(e) =>
                      setUserForm({ ...userForm, email: e.target.value })
                    }
                    style={{ backgroundColor: "var(--brand-secondary)" }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-current/20 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="+20 100 000 0000"
                    value={userForm.phone}
                    onChange={(e) =>
                      setUserForm({ ...userForm, phone: e.target.value })
                    }
                    style={{ backgroundColor: "var(--brand-secondary)" }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-current/20 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                    Role
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        role: e.target.value as UserRole,
                      })
                    }
                    style={{ backgroundColor: "var(--brand-secondary)" }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-current/20 text-sm font-semibold"
                  >
                    <option value="superadmin">superadmin</option>
                    <option value="admin">admin</option>
                    <option value="operator">operator</option>
                    <option value="customer">customer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                    Account Status
                  </label>
                  <select
                    value={userForm.status}
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        status: e.target.value as UserStatus,
                      })
                    }
                    style={{ backgroundColor: "var(--brand-secondary)" }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-current/20 text-sm font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  {editingUser
                    ? "New Password (leave blank to keep current)"
                    : "Password (min 6 characters)"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  minLength={6}
                  placeholder="••••••••••••"
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm({ ...userForm, password: e.target.value })
                  }
                  style={{ backgroundColor: "var(--brand-secondary)" }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-current/20 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  style={{ backgroundColor: "var(--brand-secondary)" }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "var(--brand-primary)",
                    color: "var(--brand-surface)",
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <UserCheck size={15} />
                  <span>
                    {editingUser ? "Save User Changes" : "Create User"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal (with Two-Part Product Code Generator) */}
      {isProductModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsProductModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "var(--brand-surface)",
              color: "var(--brand-primary)",
            }}
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              style={{ backgroundColor: "var(--brand-secondary)" }}
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>

            <h2 className="font-heading text-2xl font-bold mb-1">
              {editingProduct ? "Edit Handmade Item" : "Add New Handmade Item"}
            </h2>
            <p className="text-xs opacity-75 mb-4">
              Each product receives a unique code: Category Code (before `-`) +
              Item Code (after `-`).
            </p>

            {productFormError && (
              <div className="bg-[#F2E4E4] text-[#9E3B3B] px-3.5 py-2.5 rounded-xl text-xs font-medium mb-4">
                {productFormError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Two-Part Product Code Generator Box */}
              <div
                style={{
                  backgroundColor: "var(--brand-secondary)",
                  borderColor:
                    "color-mix(in srgb, var(--brand-primary) 20%, transparent)",
                }}
                className="p-3.5 rounded-2xl border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Two-Part Product Code (Auto-Generated & Unique)
                  </span>
                  <span
                    style={{
                      backgroundColor: "var(--brand-primary)",
                      color: "var(--brand-surface)",
                    }}
                    className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold tracking-wider"
                  >
                    {productForm.categoryCode}-{productForm.itemCode}
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <label className="block text-[10px] font-semibold uppercase opacity-70 mb-1">
                      Category Prefix (3-4 chars)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={productForm.categoryCode}
                      style={{ backgroundColor: "var(--brand-surface)" }}
                      className="w-full px-3 py-2 rounded-xl border border-current/15 font-mono text-xs font-bold uppercase opacity-80"
                    />
                  </div>

                  <div className="col-span-1 text-center font-bold text-lg pt-4">
                    -
                  </div>

                  <div className="col-span-6">
                    <label className="block text-[10px] font-semibold uppercase opacity-70 mb-1">
                      Item Code (4-5 chars)
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        required
                        minLength={4}
                        maxLength={5}
                        value={productForm.itemCode}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            itemCode: e.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9]/g, "")
                              .slice(0, 5),
                          })
                        }
                        style={{ backgroundColor: "var(--brand-surface)" }}
                        className="w-full px-3 py-2 rounded-xl border border-current/20 font-mono text-xs font-bold uppercase"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setProductForm({
                            ...productForm,
                            itemCode: getUniqueItemSuffix(
                              productForm.categoryCode,
                            ),
                          })
                        }
                        title="Generate new 4-digit item code"
                        style={{ backgroundColor: "var(--brand-surface)" }}
                        className="px-2.5 rounded-xl border border-current/20 cursor-pointer hover:opacity-80"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Speckled Ceramic Mug"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  style={{ backgroundColor: "var(--brand-secondary)" }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-current/20 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) =>
                      handleProductCategoryChange(e.target.value)
                    }
                    style={{ backgroundColor: "var(--brand-secondary)" }}
                    className="w-full px-3 py-2.5 rounded-xl border border-current/20 text-sm"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name} ({cat.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                    Price ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: e.target.value })
                    }
                    style={{ backgroundColor: "var(--brand-secondary)" }}
                    className="w-full px-3 py-2.5 rounded-xl border border-current/20 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                    Stock Status
                  </label>
                  <select
                    value={productForm.stockStatus}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        stockStatus: e.target.value as StockStatus,
                      })
                    }
                    style={{ backgroundColor: "var(--brand-secondary)" }}
                    className="w-full px-3 py-2.5 rounded-xl border border-current/20 text-sm"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Made to Order">Made to Order</option>
                    <option value="Sold Out">Sold Out</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      description: e.target.value,
                    })
                  }
                  style={{ backgroundColor: "var(--brand-secondary)" }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-current/20 text-sm"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider">
                    Product Images (URLs or Upload)
                  </label>
                  <label
                    style={{ backgroundColor: "var(--brand-secondary)" }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-opacity ${
                      isUploadingImage
                        ? "opacity-60 pointer-events-none"
                        : "hover:opacity-90"
                    }`}
                  >
                    {isUploadingImage ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Upload size={13} />
                    )}
                    <span>
                      {isUploadingImage
                        ? "Compressing & Uploading..."
                        : "Upload Image File"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={isUploadingImage}
                      onChange={handleImageFileUpload}
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  {productForm.images.map((imgUrl, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        value={imgUrl}
                        onChange={(e) => {
                          const updated = [...productForm.images];
                          updated[idx] = e.target.value;
                          setProductForm({ ...productForm, images: updated });
                        }}
                        style={{ backgroundColor: "var(--brand-secondary)" }}
                        className="flex-1 px-3 py-2 rounded-xl border border-current/20 text-sm"
                      />
                      {productForm.images.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setProductForm({
                              ...productForm,
                              images: productForm.images.filter(
                                (_, i) => i !== idx,
                              ),
                            })
                          }
                          style={{ backgroundColor: "var(--brand-secondary)" }}
                          className="px-3 rounded-xl cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setProductForm({
                      ...productForm,
                      images: [...productForm.images, ""],
                    })
                  }
                  style={{ backgroundColor: "var(--brand-secondary)" }}
                  className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  + Add Another Image URL
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  style={{ backgroundColor: "var(--brand-secondary)" }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "var(--brand-primary)",
                    color: "var(--brand-surface)",
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {editingProduct ? "Save Changes" : "Add to Catalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
