export type UserRole = 'superadmin' | 'admin' | 'operator' | 'customer';
export type UserStatus = 'Active' | 'Inactive';
export type StockStatus = 'In Stock' | 'Made to Order' | 'Sold Out';

export interface UserItem {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductItem {
  id: string;
  _id?: string;
  code: string; // e.g. "CERM-1042" (CategoryCode-ItemCode)
  itemCode?: string; // e.g. "1042"
  name: string;
  category: string;
  categoryCode?: string; // e.g. "CERM"
  price: number;
  stockStatus: StockStatus;
  description: string;
  images: string[];
  views: number;
  whatsappClicks: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryItem {
  id: string;
  _id?: string;
  name: string;
  code: string; // 3-4 uppercase characters, e.g. "CERM"
  createdAt?: string;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  surfaceColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
}

export interface StoreSettings {
  id?: string;
  key?: string;
  brandName: string;
  tagline: string;
  whatsappNumber: string;
  whatsappDefaultMsg: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  currencySymbol: string;
  itemsPerPage: number;
  theme: ThemeConfig;
}

export interface SocialClicks {
  instagram: number;
  facebook: number;
  tiktok: number;
  whatsappDirect: number;
}

export interface AnalyticsEvent {
  _id?: string;
  id?: string;
  type:
    | 'qr_scan'
    | 'catalog_view'
    | 'social_click'
    | 'item_view'
    | 'item_contact'
    | string;
  label: string;
  itemName?: string;
  itemCode?: string;
  category?: string;
  platform?: string;
  timestamp: string;
}

export interface AnalyticsData {
  totalQrLandingVisits: number;
  totalCatalogVisits: number;
  socialClicks: SocialClicks;
  recentEvents: AnalyticsEvent[];
}
