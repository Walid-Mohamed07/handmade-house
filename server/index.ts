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

// Load .env.local without logging or exposing sensitive values
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config();

const app = express();
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

const DEFAULT_CATEGORIES = [
  'Ceramics & Pottery',
  'Macramé & Woven',
  'Artisan Candles',
  'Handcrafted Jewelry',
  'Olive Woodwork',
];

const DEFAULT_PRODUCTS = [
  {
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

// Format MongoDB document with `id` and strip `passwordHash`
const formatDoc = (doc: any) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.passwordHash;
  return { ...obj, id: String(obj._id) };
};

// Drop deprecated `adminusers` collection & ensure Superadmin Walid Mohamed + sample users exist in `users`
async function ensureSeedDataAndDropLegacy() {
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

    // Ensure Superadmin Walid Mohamed exists in `users` collection
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
      console.log(
        `[Seed] Superadmin "Walid Mohamed" (${superAdmin?.email}) ready in "users" collection.`
      );
    } else if (superAdmin.name !== 'Walid Mohamed') {
      superAdmin.name = 'Walid Mohamed';
      await superAdmin.save();
    }

    // Seed sample users across roles if only 1 user exists
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
        {
          name: 'Mariam Adel',
          email: 'mariam.customer@outlook.com',
          phone: '+20 155 432 9876',
          role: 'customer' as UserRole,
          status: 'Inactive' as const,
          passwordHash: sampleHash,
        },
      ];
      for (const u of sampleUsers) {
        const exists = await User.findOne({ email: u.email });
        if (!exists) {
          await User.create(u);
        }
      }
    }

    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES.map((name) => ({ name })));
    }

    const prodCount = await Product.countDocuments();
    if (prodCount === 0) {
      await Product.insertMany(DEFAULT_PRODUCTS);
    }

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
            label: 'WhatsApp inquiry on "Amber Jar Cedar & Fig Soy Candle"',
            itemName: 'Amber Jar Cedar & Fig Soy Candle',
            timestamp: new Date(Date.now() - 1000 * 60 * 18),
          },
          {
            type: 'qr_scan',
            label: 'Customer visited Main Menu (QR Scan Hub)',
            timestamp: new Date(Date.now() - 1000 * 60 * 45),
          },
        ],
      });
    }
  } catch (err: any) {
    console.error('[Seed/Migration Error]:', err.message);
  }
}

let dbConnected = false;
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'handmade_house';

  if (!uri) {
    console.warn('[MongoDB] MONGODB_URI is not defined in .env.local');
    return;
  }

  try {
    await mongoose.connect(uri, { dbName });
    dbConnected = true;
    console.log(`[MongoDB] Connected successfully to database "${dbName}"`);
    await ensureSeedDataAndDropLegacy();
  } catch (err: any) {
    console.error('[MongoDB Connection Error]:', err.message);
  }
}

connectDB();

// Middleware: Verify Staff User JWT (superadmin, admin, operator allowed into dashboard)
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
        label:
          platform === 'whatsappDirect'
            ? 'Visitor clicked Direct WhatsApp Contact from Main Menu'
            : `Visitor clicked ${platform.charAt(0).toUpperCase() + platform.slice(1)} link`,
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
          label: `Visitor viewed item details: "${updatedProduct.name}"`,
          itemName: updatedProduct.name,
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
          label: `Visitor clicked "Contact for Info" (WhatsApp) for "${updatedProduct.name}"`,
          itemName: updatedProduct.name,
          timestamp: new Date(),
        });
      }
    }

    if (analytics.recentEvents.length > 40) {
      analytics.recentEvents = analytics.recentEvents.slice(0, 40);
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
// AUTHENTICATION ENDPOINTS (UNIFIED USERS COLLECTION)
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
      return res
        .status(403)
        .json({ error: 'Access denied: Customer accounts cannot sign in to the Admin Portal.' });
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

      if (name && name.trim()) {
        user.name = name.trim();
      }
      if (email && email.trim()) {
        user.email = email.trim().toLowerCase();
      }
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

      // Prevent demoting the last superadmin
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
// PROTECTED CATALOG & SETTINGS CRUD ENDPOINTS
// ============================================================================

app.post('/api/products', requireStaffAuth, async (req: Request, res: Response) => {
  try {
    const created = await Product.create(req.body);
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
      const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
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
      const { name } = req.body;
      const created = await Category.create({ name: name.trim() });
      res.status(201).json(formatDoc(created));
    } catch {
      res.status(400).json({ error: 'Category already exists or is invalid.' });
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

app.listen(PORT, () => {
  console.log(`[Server] Handmade House TS API running on http://localhost:${PORT}`);
});
