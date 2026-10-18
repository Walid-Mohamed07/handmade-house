import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  Product,
  Category,
  Settings,
  Analytics,
  User,
  UserRole,
} from './models.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config();

export const app = express();
const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET =
  process.env.JWT_SECRET || 'handmade-house-artisan-secret-key-2026';

app.use(cors());
app.use(express.json({ limit: '15mb' }));

export interface JwtUserPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: JwtUserPayload;
}

// Helper: Generate a 3-4 character uppercase Category Code from Category Name
export function deriveCategoryCode(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleaned.length >= 4) {
    // Take first 4 letters or consonants
    return cleaned.slice(0, 4);
  }
  if (cleaned.length === 3) return cleaned;
  return (cleaned + 'HMX').slice(0, 3);
}

// Helper: Generate a short 4-5 character Item Code (e.g. "1042" or "482A")
export function generateShortItemSuffix(): string {
  const num = Math.floor(1000 + Math.random() * 9000); // 4 digits: 1000-9999
  return String(num);
}

const DEFAULT_CATEGORIES = [
  { name: 'Ceramics & Pottery', code: 'CERM' },
  { name: 'Macramé & Woven', code: 'MACR' },
  { name: 'Artisan Candles', code: 'CNDL' },
  { name: 'Handcrafted Jewelry', code: 'JWLR' },
  { name: 'Olive Woodwork', code: 'WOOD' },
];

const DEFAULT_PRODUCTS = [
  {
    code: 'CERM-1014',
    itemCode: '1014',
    categoryCode: 'CERM',
    name: 'Speckled Stoneware Pour-Over Vase',
    category: 'Ceramics & Pottery',
    price: 48,
    stockStatus: 'In Stock' as const,
    description:
      'Wheel-thrown from raw speckled clay with a warm oatmeal satin glaze. Watertight and uniquely textured by hand.',
    images: [
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=900&q=80',
    ],
    views: 64,
    whatsappClicks: 19,
  },
  {
    code: 'MACR-2048',
    itemCode: '2048',
    categoryCode: 'MACR',
    name: 'Bohemian Knotted Cotton Wall Hanging',
    category: 'Macramé & Woven',
    price: 65,
    stockStatus: 'Made to Order' as const,
    description:
      'Intricately hand-knotted using 100% unbleached organic cotton cord suspended on a naturally aged driftwood branch.',
    images: [
      'https://images.unsplash.com/photo-1522758971460-1d21eed7dc1d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80',
    ],
    views: 52,
    whatsappClicks: 16,
  },
  {
    code: 'CNDL-3091',
    itemCode: '3091',
    categoryCode: 'CNDL',
    name: 'Amber Jar Cedar & Fig Soy Candle',
    category: 'Artisan Candles',
    price: 28,
    stockStatus: 'In Stock' as const,
    description:
      'Hand-poured small-batch natural soy wax candle infused with essential oils of wild Mediterranean fig, warm amber, and cedarwood.',
    images: [
      'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=900&q=80',
    ],
    views: 81,
    whatsappClicks: 27,
  },
  {
    code: 'JWLR-4025',
    itemCode: '4025',
    categoryCode: 'JWLR',
    name: 'Hammered Brass Crescent Earrings',
    category: 'Handcrafted Jewelry',
    price: 36,
    stockStatus: 'In Stock' as const,
    description:
      'Hand-forged raw brass crescent moons with hypoallergenic sterling silver ear wires. Lightweight with a gentle artisan hammered sheen.',
    images: [
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=900&q=80',
    ],
    views: 43,
    whatsappClicks: 11,
  },
  {
    code: 'WOOD-5072',
    itemCode: '5072',
    categoryCode: 'WOOD',
    name: 'Carved Olive Wood Charcuterie Board',
    category: 'Olive Woodwork',
    price: 58,
    stockStatus: 'In Stock' as const,
    description:
      'Sustainably harvested Mediterranean olive wood serving board finished with organic beeswax and mineral oil.',
    images: [
      'https://images.unsplash.com/photo-1615915468538-0fbd857888ca?auto=format&fit=crop&w=900&q=80',
    ],
    views: 39,
    whatsappClicks: 14,
  },
  {
    code: 'CERM-1089',
    itemCode: '1089',
    categoryCode: 'CERM',
    name: 'Earth-Toned Ceramic Matcha Bowl Set',
    category: 'Ceramics & Pottery',
    price: 42,
    stockStatus: 'Sold Out' as const,
    description:
      'Hand-pinched ceremonial matcha bowl with a pouring spout and matching whisk rest in warm espresso and sand tones.',
    images: [
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=900&q=80',
    ],
    views: 70,
    whatsappClicks: 22,
  },
];

const formatDoc = (doc: any) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.passwordHash;
  return { ...obj, id: String(obj._id) };
};

// Backfill codes on any existing categories/products and seed initial data
async function ensureSeedDataAndBackfillCodes() {
  try {
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db
        .listCollections({ name: 'adminusers' })
        .toArray();
      if (collections.length > 0) {
        await mongoose.connection.db.dropCollection('adminusers');
        console.log('[Migration] Dropped deprecated "adminusers" collection.');
      }
    }

    // 1. Ensure Superadmin Walid Mohamed exists
    const defaultPassword = process.env.ADMIN_PASSWORD || 'HandmadeHouse#2026';
    const superAdminPasswordHash = await bcrypt.hash(defaultPassword, 10);

    let superAdmin = await User.findOne({ role: 'superadmin' });
    if (!superAdmin) {
      const targetEmail = (
        process.env.ADMIN_EMAIL || 'walid@handmadehouse.com'
      ).toLowerCase();
      superAdmin = await User.findOneAndUpdate(
        { email: targetEmail },
        {
          $set: {
            name: 'Walid Mohamed',
            email: targetEmail,
            phone: '+20 100 000 0000',
            role: 'superadmin',
            status: 'Active',
            passwordHash: superAdminPasswordHash,
          },
        },
        { new: true, upsert: true }
      );
    } else if (superAdmin.name !== 'Walid Mohamed') {
      superAdmin.name = 'Walid Mohamed';
      await superAdmin.save();
    }

    // 2. Seed sample users if only 1 user exists
    const totalUsers = await User.countDocuments();
    if (totalUsers <= 1) {
      const sampleHash = await bcrypt.hash('HandmadeHouse#2026', 10);
      const sampleUsers = [
        {
          name: 'Sara Al-Mansoor',
          email: 'sara.admin@handmadehouse.com',
          phone: '+971 50 234 5678',
          role: 'admin' as UserRole,
          status: 'Active' as const,
          passwordHash: sampleHash,
        },
        {
          name: 'Karim Hassan',
          email: 'karim.operator@handmadehouse.com',
          phone: '+20 111 222 3344',
          role: 'operator' as UserRole,
          status: 'Active' as const,
          passwordHash: sampleHash,
        },
        {
          name: 'Nour El-Din',
          email: 'nour.operator@handmadehouse.com',
          phone: '+20 122 876 5432',
          role: 'operator' as UserRole,
          status: 'Active' as const,
          passwordHash: sampleHash,
        },
        {
          name: 'Laila Ibrahim',
          email: 'laila.customer@gmail.com',
          phone: '+966 55 112 2334',
          role: 'customer' as UserRole,
          status: 'Active' as const,
          passwordHash: sampleHash,
        },
        {
          name: 'Omar Farouk',
          email: 'omar.customer@gmail.com',
          phone: '+20 109 876 1234',
          role: 'customer' as UserRole,
          status: 'Active' as const,
          passwordHash: sampleHash,
        },
      ];
      for (const u of sampleUsers) {
        const exists = await User.findOne({ email: u.email });
        if (!exists) await User.create(u);
      }
    }

    // 3. Seed or backfill Categories with 3-4 char codes
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
    } else {
      const existingCats = await Category.find();
      for (const cat of existingCats) {
        if (!cat.code) {
          const preset = DEFAULT_CATEGORIES.find(
            (d) => d.name.toLowerCase() === cat.name.toLowerCase()
          );
          let candidate = preset ? preset.code : deriveCategoryCode(cat.name);
          const duplicate = await Category.findOne({
            code: candidate,
            _id: { $ne: cat._id },
          });
          if (duplicate) {
            candidate = (
              candidate.slice(0, 3) + Math.floor(1 + Math.random() * 9)
            ).toUpperCase();
          }
          cat.code = candidate;
          await cat.save();
        }
      }
    }

    // Build category name -> code map
    const allCats = await Category.find();
    const catCodeMap: Record<string, string> = {};
    for (const c of allCats) {
      catCodeMap[c.name] = c.code || deriveCategoryCode(c.name);
    }

    // 4. Seed or backfill Products with unique CategoryCode-ItemCode
    const prodCount = await Product.countDocuments();
    if (prodCount === 0) {
      await Product.insertMany(DEFAULT_PRODUCTS);
    } else {
      const existingProds = await Product.find();
      for (let i = 0; i < existingProds.length; i++) {
        const prod = existingProds[i];
        if (!prod.code || !prod.code.includes('-')) {
          const prefix = (
            catCodeMap[prod.category] || deriveCategoryCode(prod.category)
          )
            .toUpperCase()
            .slice(0, 4);
          let suffix = String(1010 + i * 17).slice(0, 4);
          let fullCode = `${prefix}-${suffix}`;
          // Ensure uniqueness
          while (
            await Product.findOne({ code: fullCode, _id: { $ne: prod._id } })
          ) {
            suffix = generateShortItemSuffix();
            fullCode = `${prefix}-${suffix}`;
          }
          prod.categoryCode = prefix;
          prod.itemCode = suffix;
          prod.code = fullCode;
          await prod.save();
        }
      }
    }

    // 5. Settings & Analytics
    const settingsDoc = await Settings.findOne({ key: 'global' });
    if (!settingsDoc) {
      await Settings.create({ key: 'global' });
    }

    const analyticsDoc = await Analytics.findOne({ key: 'global' });
    if (!analyticsDoc) {
      await Analytics.create({
        key: 'global',
        totalQrLandingVisits: 248,
        totalCatalogVisits: 186,
        socialClicks: {
          instagram: 64,
          facebook: 31,
          tiktok: 49,
          whatsappDirect: 42,
        },
        recentEvents: [
          {
            type: 'item_contact',
            label:
              'Visitor clicked "Contact for Info" (WhatsApp) for [CNDL-3091] "Amber Jar Cedar & Fig Soy Candle"',
            itemName: 'Amber Jar Cedar & Fig Soy Candle',
            itemCode: 'CNDL-3091',
            category: 'Artisan Candles',
            timestamp: new Date(Date.now() - 1000 * 60 * 18),
          },
          {
            type: 'item_view',
            label:
              'Visitor viewed item details: [CERM-1014] "Speckled Stoneware Pour-Over Vase"',
            itemName: 'Speckled Stoneware Pour-Over Vase',
            itemCode: 'CERM-1014',
            category: 'Ceramics & Pottery',
            timestamp: new Date(Date.now() - 1000 * 60 * 32),
          },
          {
            type: 'social_click',
            label: 'Visitor clicked Instagram link from Main Menu',
            platform: 'instagram',
            timestamp: new Date(Date.now() - 1000 * 60 * 48),
          },
          {
            type: 'qr_scan',
            label: 'Visitor opened Main Menu (QR Scan Hub)',
            timestamp: new Date(Date.now() - 1000 * 60 * 65),
          },
        ],
      });
    }
  } catch (err: any) {
    console.error('[Seed/Migration Error]:', err.message);
  }
}

let dbConnected = false;
let connectionPromise: Promise<void> | null = null;

export async function connectDB() {
  if (dbConnected && mongoose.connection.readyState === 1) return;
  if (connectionPromise) return connectionPromise;

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'handmade_house';

  if (!uri) {
    console.warn('[MongoDB] MONGODB_URI is not defined');
    return;
  }

  connectionPromise = (async () => {
    try {
      await mongoose.connect(uri, { dbName });
      dbConnected = true;
      console.log(`[MongoDB] Connected successfully to database "${dbName}"`);
      await ensureSeedDataAndBackfillCodes();
    } catch (err: any) {
      console.error('[MongoDB Connection Error]:', err.message);
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

// Ensure DB connection before handling API requests (crucial for Vercel serverless)
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  await connectDB();
  next();
});

function requireStaffAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtUserPayload;
    if (decoded.role === 'customer') {
      return res
        .status(403)
        .json({ error: 'Forbidden: Customer role cannot access Admin Portal.' });
    }
    req.user = decoded;
    next();
  } catch {
    return res
      .status(401)
      .json({ error: 'Unauthorized: Invalid or expired session' });
  }
}

// ============================================================================
// PUBLIC VISITOR ENDPOINTS
// ============================================================================

app.get('/api/bootstrap', async (_req: Request, res: Response) => {
  try {
    const [products, categories, settings, analytics] = await Promise.all([
      Product.find().sort({ createdAt: -1 }),
      Category.find().sort({ createdAt: 1 }),
      Settings.findOne({ key: 'global' }),
      Analytics.findOne({ key: 'global' }),
    ]);

    res.json({
      dbConnected,
      products: products.map(formatDoc),
      categories: categories.map(formatDoc),
      settings: settings ? formatDoc(settings) : null,
      analytics: analytics ? formatDoc(analytics) : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/analytics/track', async (req: Request, res: Response) => {
  try {
    const { eventType, platform, productId, isAdmin } = req.body;
    if (isAdmin) {
      return res.json({ skipped: true });
    }

    let analytics = await Analytics.findOne({ key: 'global' });
    if (!analytics) {
      analytics = await Analytics.create({ key: 'global' });
    }

    let updatedProduct = null;

    if (eventType === 'qr_scan') {
      analytics.totalQrLandingVisits += 1;
      analytics.recentEvents.unshift({
        type: 'qr_scan',
        label: 'Visitor opened Main Menu (QR Scan Hub)',
        timestamp: new Date(),
      });
    } else if (eventType === 'catalog_view') {
      analytics.totalCatalogVisits += 1;
      analytics.recentEvents.unshift({
        type: 'catalog_view',
        label: 'Visitor opened View List (Catalog Page)',
        timestamp: new Date(),
      });
    } else if (eventType === 'social_click' && platform) {
      const sc = analytics.socialClicks as Record<string, number>;
      if (sc && typeof sc[platform] === 'number') {
        sc[platform] += 1;
      }
      analytics.recentEvents.unshift({
        type: 'social_click',
        platform,
        label:
          platform === 'whatsappDirect'
            ? 'Visitor clicked Direct WhatsApp Contact from Main Menu'
            : `Visitor clicked ${platform.charAt(0).toUpperCase() + platform.slice(1)} link from Main Menu`,
        timestamp: new Date(),
      });
    } else if (
      eventType === 'item_view' &&
      productId &&
      mongoose.isValidObjectId(productId)
    ) {
      updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $inc: { views: 1 } },
        { new: true }
      );
      if (updatedProduct) {
        analytics.recentEvents.unshift({
          type: 'item_view',
          label: `Visitor viewed item details: [${updatedProduct.code}] "${updatedProduct.name}"`,
          itemName: updatedProduct.name,
          itemCode: updatedProduct.code,
          category: updatedProduct.category,
          timestamp: new Date(),
        });
      }
    } else if (
      eventType === 'item_contact' &&
      productId &&
      mongoose.isValidObjectId(productId)
    ) {
      updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $inc: { views: 1, whatsappClicks: 1 } },
        { new: true }
      );
      if (updatedProduct) {
        analytics.recentEvents.unshift({
          type: 'item_contact',
          label: `Visitor clicked "Contact for Info" (WhatsApp) for [${updatedProduct.code}] "${updatedProduct.name}"`,
          itemName: updatedProduct.name,
          itemCode: updatedProduct.code,
          category: updatedProduct.category,
          timestamp: new Date(),
        });
      }
    }

    // Retain up to 500 events for full Activity Log exploration, filtering & pagination
    if (analytics.recentEvents.length > 500) {
      analytics.recentEvents = analytics.recentEvents.slice(0, 500);
    }

    await analytics.save();
    res.json({
      analytics: formatDoc(analytics),
      product: updatedProduct ? formatDoc(updatedProduct) : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

app.post('/api/admin/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'Inactive') {
      return res
        .status(403)
        .json({ error: 'Your user account is currently inactive.' });
    }

    if (user.role === 'customer') {
      return res.status(403).json({
        error:
          'Access denied: Customer accounts cannot sign in to the Admin Portal.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const payload: JwtUserPayload = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      admin: formatDoc(user),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/me', requireStaffAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ admin: formatDoc(user) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put(
  '/api/admin/credentials',
  requireStaffAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, email, currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user?.id);
      if (!user) {
        return res.status(404).json({ error: 'User account not found.' });
      }

      const validCurrent = await bcrypt.compare(
        currentPassword || '',
        user.passwordHash
      );
      if (!validCurrent) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }

      if (name && name.trim()) user.name = name.trim();
      if (email && email.trim()) user.email = email.trim().toLowerCase();
      if (newPassword && newPassword.length >= 6) {
        user.passwordHash = await bcrypt.hash(newPassword, 10);
      }

      await user.save();
      const payload: JwtUserPayload = {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

      res.json({ token, admin: formatDoc(user) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ============================================================================
// UNIFIED USERS MANAGEMENT CRUD ENDPOINTS (/api/users)
// ============================================================================

app.get('/api/users', requireStaffAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map(formatDoc));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', requireStaffAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, role, status, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: 'Name, email, and password are required.' });
    }

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res
        .status(400)
        .json({ error: 'A user with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || '').trim(),
      role: role || 'customer',
      status: status || 'Active',
      passwordHash,
    });

    res.status(201).json(formatDoc(created));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put(
  '/api/users/:id',
  requireStaffAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, email, phone, role, status, password } = req.body;
      const targetUser = await User.findById(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found.' });
      }

      if (targetUser.role === 'superadmin' && role && role !== 'superadmin') {
        const superAdminCount = await User.countDocuments({ role: 'superadmin' });
        if (superAdminCount <= 1) {
          return res.status(400).json({
            error: 'Cannot change role of the only Superadmin ("Walid Mohamed").',
          });
        }
      }

      if (name !== undefined) targetUser.name = name.trim();
      if (email !== undefined) targetUser.email = email.trim().toLowerCase();
      if (phone !== undefined) targetUser.phone = phone.trim();
      if (role !== undefined) targetUser.role = role;
      if (status !== undefined) targetUser.status = status;
      if (password && password.trim().length >= 6) {
        targetUser.passwordHash = await bcrypt.hash(password.trim(), 10);
      }

      await targetUser.save();
      res.json(formatDoc(targetUser));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

app.delete(
  '/api/users/:id',
  requireStaffAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const targetUser = await User.findById(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found.' });
      }

      if (targetUser.role === 'superadmin') {
        const superAdminCount = await User.countDocuments({ role: 'superadmin' });
        if (superAdminCount <= 1) {
          return res.status(400).json({
            error: 'Cannot delete the primary Superadmin account.',
          });
        }
      }

      await User.findByIdAndDelete(req.params.id);
      res.json({ deleted: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// ============================================================================
// PROTECTED PRODUCTS & CATEGORIES CRUD ENDPOINTS (WITH UNIQUE TWO-PART CODES)
// ============================================================================

app.post('/api/products', requireStaffAuth, async (req: Request, res: Response) => {
  try {
    const { category, itemCode: rawItemCode, categoryCode: rawCatCode } = req.body;
    const catDoc = await Category.findOne({ name: category });
    const prefix = (
      rawCatCode ||
      catDoc?.code ||
      deriveCategoryCode(category || 'ITEM')
    )
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4);

    let suffix = (rawItemCode || generateShortItemSuffix())
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 5);

    if (suffix.length < 4) {
      suffix = (suffix + generateShortItemSuffix()).slice(0, 4);
    }

    let fullCode = `${prefix}-${suffix}`;
    const existing = await Product.findOne({ code: fullCode });
    if (existing) {
      // If user supplied a duplicate or collision occurred, auto-generate unique suffix
      if (rawItemCode) {
        return res.status(400).json({
          error: `Product code "${fullCode}" already exists. Please use a different item code.`,
        });
      }
      while (await Product.findOne({ code: fullCode })) {
        suffix = generateShortItemSuffix();
        fullCode = `${prefix}-${suffix}`;
      }
    }

    const created = await Product.create({
      ...req.body,
      categoryCode: prefix,
      itemCode: suffix,
      code: fullCode,
    });
    res.status(201).json(formatDoc(created));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put(
  '/api/products/:id',
  requireStaffAuth,
  async (req: Request, res: Response) => {
    try {
      const { category, itemCode: rawItemCode, categoryCode: rawCatCode } = req.body;
      const current = await Product.findById(req.params.id);
      if (!current) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const targetCategory = category || current.category;
      const catDoc = await Category.findOne({ name: targetCategory });
      const prefix = (
        rawCatCode ||
        catDoc?.code ||
        current.categoryCode ||
        deriveCategoryCode(targetCategory)
      )
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 4);

      const suffix = (
        rawItemCode ||
        current.itemCode ||
        generateShortItemSuffix()
      )
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 5);

      const fullCode = `${prefix}-${suffix}`;
      const conflict = await Product.findOne({
        code: fullCode,
        _id: { $ne: current._id },
      });
      if (conflict) {
        return res.status(400).json({
          error: `Product code "${fullCode}" is already used by "${conflict.name}".`,
        });
      }

      const updated = await Product.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          categoryCode: prefix,
          itemCode: suffix,
          code: fullCode,
        },
        { new: true }
      );
      res.json(formatDoc(updated));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

app.delete(
  '/api/products/:id',
  requireStaffAuth,
  async (req: Request, res: Response) => {
    try {
      await Product.findByIdAndDelete(req.params.id);
      res.json({ deleted: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

app.post(
  '/api/categories',
  requireStaffAuth,
  async (req: Request, res: Response) => {
    try {
      const { name, code: rawCode } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Category name is required.' });
      }

      let code = (rawCode ? String(rawCode) : deriveCategoryCode(name))
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 4);

      if (code.length < 3) {
        code = (code + 'HMX').slice(0, 3);
      }

      const codeConflict = await Category.findOne({ code });
      if (codeConflict) {
        return res.status(400).json({
          error: `Category code "${code}" is already used by "${codeConflict.name}".`,
        });
      }

      const created = await Category.create({
        name: name.trim(),
        code,
      });
      res.status(201).json(formatDoc(created));
    } catch {
      res.status(400).json({ error: 'Category name or code already exists.' });
    }
  }
);

app.delete(
  '/api/categories/:id',
  requireStaffAuth,
  async (req: Request, res: Response) => {
    try {
      await Category.findByIdAndDelete(req.params.id);
      res.json({ deleted: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

app.put('/api/settings', requireStaffAuth, async (req: Request, res: Response) => {
  try {
    const updated = await Settings.findOneAndUpdate(
      { key: 'global' },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(formatDoc(updated));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post(
  '/api/analytics/reset',
  requireStaffAuth,
  async (_req: Request, res: Response) => {
    try {
      await Product.updateMany({}, { $set: { views: 0, whatsappClicks: 0 } });
      const analytics = await Analytics.findOneAndUpdate(
        { key: 'global' },
        {
          $set: {
            totalQrLandingVisits: 0,
            totalCatalogVisits: 0,
            socialClicks: {
              instagram: 0,
              facebook: 0,
              tiktok: 0,
              whatsappDirect: 0,
            },
            recentEvents: [],
          },
        },
        { new: true, upsert: true }
      );
      const products = await Product.find().sort({ createdAt: -1 });
      res.json({
        analytics: formatDoc(analytics),
        products: products.map(formatDoc),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Only start HTTP listener when running locally (not inside Vercel serverless environment)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(
      `[Server] Handmade House TS API running on http://localhost:${PORT}`
    );
  });
}

export default app;
