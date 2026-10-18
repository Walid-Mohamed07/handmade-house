import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'superadmin' | 'admin' | 'operator' | 'customer';
export type UserStatus = 'Active' | 'Inactive';
export type StockStatus = 'In Stock' | 'Made to Order' | 'Sold Out';

export interface IProduct extends Document {
  code: string; // e.g., "CERM-1042" (unique combination)
  itemCode: string; // e.g., "1042" (4-5 chars after '-')
  categoryCode: string; // e.g., "CERM" (3-4 chars before '-')
  name: string;
  category: string;
  price: number;
  stockStatus: StockStatus;
  description: string;
  images: string[];
  views: number;
  whatsappClicks: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory extends Document {
  name: string;
  code: string; // 3-4 uppercase letters/digits, e.g., "CERM"
  createdAt: Date;
  updatedAt: Date;
}

export interface ISettings extends Document {
  key: string;
  brandName: string;
  tagline: string;
  whatsappNumber: string;
  whatsappDefaultMsg: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  currencySymbol: string;
  itemsPerPage: number;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    surfaceColor: string;
    accentColor: string;
    headingFont: string;
    bodyFont: string;
  };
}

export interface IAnalytics extends Document {
  key: string;
  totalQrLandingVisits: number;
  totalCatalogVisits: number;
  socialClicks: {
    instagram: number;
    facebook: number;
    tiktok: number;
    whatsappDirect: number;
  };
  recentEvents: Array<{
    type: string;
    label: string;
    itemName?: string;
    itemCode?: string;
    category?: string;
    platform?: string;
    timestamp: Date;
  }>;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    itemCode: { type: String, required: true, uppercase: true, trim: true },
    categoryCode: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, default: 0 },
    stockStatus: {
      type: String,
      enum: ['In Stock', 'Made to Order', 'Sold Out'],
      default: 'In Stock',
    },
    description: { type: String, required: true },
    images: { type: [String], default: ['/logo.jpg'] },
    views: { type: Number, default: 0 },
    whatsappClicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  },
  { timestamps: true }
);

const settingsSchema = new Schema<ISettings>(
  {
    key: { type: String, default: 'global', unique: true },
    brandName: { type: String, default: 'Handmade House' },
    tagline: {
      type: String,
      default: 'Thoughtfully crafted pieces made by hand with warmth & soul.',
    },
    whatsappNumber: { type: String, default: '15551234567' },
    whatsappDefaultMsg: {
      type: String,
      default:
        'Hello Handmade House! I scanned your QR code and would love to get in touch.',
    },
    instagramUrl: { type: String, default: 'https://instagram.com' },
    facebookUrl: { type: String, default: 'https://facebook.com' },
    tiktokUrl: { type: String, default: 'https://tiktok.com' },
    currencySymbol: { type: String, default: '$' },
    itemsPerPage: { type: Number, default: 6 },
    theme: {
      primaryColor: { type: String, default: '#4B3629' },
      secondaryColor: { type: String, default: '#EAE2DC' },
      surfaceColor: { type: String, default: '#FAF8F6' },
      accentColor: { type: String, default: '#246A46' },
      headingFont: { type: String, default: 'Cormorant Garamond' },
      bodyFont: { type: String, default: 'Plus Jakarta Sans' },
    },
  },
  { timestamps: true }
);

const analyticsSchema = new Schema<IAnalytics>(
  {
    key: { type: String, default: 'global', unique: true },
    totalQrLandingVisits: { type: Number, default: 0 },
    totalCatalogVisits: { type: Number, default: 0 },
    socialClicks: {
      instagram: { type: Number, default: 0 },
      facebook: { type: Number, default: 0 },
      tiktok: { type: Number, default: 0 },
      whatsappDirect: { type: Number, default: 0 },
    },
    recentEvents: [
      {
        type: { type: String },
        label: { type: String },
        itemName: { type: String },
        itemCode: { type: String },
        category: { type: String },
        platform: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, default: '', trim: true },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'operator', 'customer'],
      default: 'customer',
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true, collection: 'users' }
);

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
export const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema);
export const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', settingsSchema);
export const Analytics: Model<IAnalytics> =
  mongoose.models.Analytics || mongoose.model<IAnalytics>('Analytics', analyticsSchema);
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);
