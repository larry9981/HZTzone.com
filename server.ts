import express from 'express';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(cors());

// Domain Protection & Host Header Validation Middleware
app.use((req, res, next) => {
  const host = req.headers.host || '';
  const xForwardedHost = (req.headers['x-forwarded-host'] as string) || '';
  
  // By default allow localhost, 127.0.0.1, standard Cloud Run/Render domains, and the brand custom domains
  const allowedDomainsEnv = process.env.ALLOWED_DOMAINS;
  let allowedHosts: string[] = ['localhost', '127.0.0.1', '::1', 'hztzone.com', 'www.hztzone.com'];
  
  if (allowedDomainsEnv) {
    const customDomains = allowedDomainsEnv.split(',').map(d => d.trim().toLowerCase());
    allowedHosts = [...allowedHosts, ...customDomains];
  }

  const isHostAllowed = (hostname: string) => {
    const lowerHost = hostname.toLowerCase().split(':')[0]; // Strip port number if any
    // Allow localhost or standard local addresses / verified domains
    if (allowedHosts.some(allowed => lowerHost === allowed)) {
      return true;
    }
    // Allow any Google Cloud Run .run.app subdomain dynamically
    if (lowerHost.endsWith('.run.app')) {
      return true;
    }
    // Allow Render subdomains if deployed on Render (render.com)
    if (lowerHost.endsWith('.onrender.com')) {
      return true;
    }
    return false;
  };

  const targetHost = xForwardedHost || host;
  if (targetHost && !isHostAllowed(targetHost)) {
    console.warn(`[SECURITY ALERT] Blocked request from unauthorized domain: "${targetHost}" requesting path "${req.path}"`);
    return res.status(403).send(
      `<h1>403 Forbidden - Domain Protected</h1>` +
      `<p>The requested domain/host is not authorized to access this store system.</p>` +
      `<p>If this is your domain, please register it under the <b>ALLOWED_DOMAINS</b> environment variable.</p>`
    );
  }

  next();
});

// Advanced Clickjacking Frame & MIME Sniffing Protection Middleware
app.use((req, res, next) => {
  // Prevent mime sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Frame ancestors CSP: allows local execution + Google AI Studio frames safely
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://*.google.com https://*.google.cn https://*.run.app https://ai.studio https://*.aistudio.google"
  );
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Database setup
const DB_PATH = path.join(process.cwd(), 'data', 'hztzone_db.json');

// Ensure database parent directory exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Initial default data structure to populate empty databases
const INITIAL_DATABASE_STATE = {
  users: [
    {
      id: 'usr_admin',
      email: 'admin@hztzone.com',
      password: 'admin', // Simple password for demo
      role: 'admin',
      failedAttempts: 0,
      lockoutUntil: 0,
    },
    {
      id: 'usr_demo',
      email: 'tester@hztzone.com',
      password: 'password123',
      role: 'customer',
      failedAttempts: 0,
      lockoutUntil: 0,
    }
  ],
  products: [
    {
      id: '1',
      name: 'HZTzone Smart Pet Feeder',
      price: 59.99,
      originalPrice: 89.99,
      category: 'pets',
      image: '/src/assets/images/hztzone_smart_pet_feeder_1782876443727.jpg',
      images: ['/src/assets/images/hztzone_smart_pet_feeder_1782876443727.jpg'],
      rating: 4.9,
      reviews: 148,
      isCustomizable: false,
      description: 'Smart timed pet feeder with automatic portion control, voice recorder, and app companion. Keep your beloved pets fed and healthy on any schedule.',
      youtubeEmbedCode: '',
      ratingReviews: [
        { id: 'rev-1', userName: 'Emily Watson', rating: 5, date: '2026-06-15', comment: 'Super convenient! My cat gets her meals exactly on time now, and the app is very easy to configure.' },
        { id: 'rev-2', userName: 'Michael S.', rating: 4, date: '2026-06-12', comment: 'Excellent quality and ultra-reliable feeding mechanisms. Highly recommend to all pet owners!' }
      ]
    },
    {
      id: '2',
      name: 'HZTzone High-Speed Ionic Hair Dryer',
      price: 79.99,
      originalPrice: 129.99,
      category: 'beauty',
      image: '/src/assets/images/hztzone_hair_dryer_1782876454614.jpg',
      images: ['/src/assets/images/hztzone_hair_dryer_1782876454614.jpg'],
      rating: 4.8,
      reviews: 95,
      isCustomizable: false,
      description: 'Powerful 110,000 RPM high-speed digital brushless motor paired with advanced 200 million negative ion technology to dry hair in minutes while preserving moisture and luster.',
      youtubeEmbedCode: '',
      ratingReviews: [
        { id: 'rev-3', userName: 'Sophia Reed', rating: 5, date: '2026-06-14', comment: 'Absolutely amazing! Dries my thick hair in under 3 minutes, and it feels incredibly soft and shiny.' }
      ]
    },
    {
      id: '3',
      name: 'HZTzone Sonic Facial Cleansing Brush',
      price: 29.99,
      originalPrice: 49.99,
      category: 'beauty',
      image: '/src/assets/images/hztzone_facial_brush_1782876466584.jpg',
      images: ['/src/assets/images/hztzone_facial_brush_1782876466584.jpg'],
      rating: 4.7,
      reviews: 64,
      isCustomizable: false,
      description: 'Medical-grade ultra-soft food-grade silicone brush utilizes 8,000 high-frequency sonic vibrations per minute to deeply flush away grease, blackheads, and cosmetic residues.',
      youtubeEmbedCode: '',
      ratingReviews: [
        { id: 'rev-4', userName: 'Lucas Grabe', rating: 5, date: '2026-06-10', comment: 'Extremely gentle on my sensitive skin. Feels like a premium spa treatment at home!' }
      ]
    },
    {
      id: '4',
      name: 'HZTzone Smart Cat Water Fountain',
      price: 24.99,
      originalPrice: 39.99,
      category: 'pets',
      image: '/src/assets/images/hztzone_water_fountain_1782876478491.jpg',
      images: ['/src/assets/images/hztzone_water_fountain_1782876478491.jpg'],
      rating: 4.9,
      reviews: 215,
      isCustomizable: false,
      description: 'Quadruple-stage active water filtration fountain featuring a running stream layout. Encourages your cats and small dogs to drink more fresh, mineral-rich, dust-free oxygen water.',
      youtubeEmbedCode: '',
      ratingReviews: []
    },
    {
      id: '5',
      name: 'HZTzone Smart Pet GPS & Activity Tracker',
      price: 34.99,
      originalPrice: 59.99,
      category: 'pets',
      image: '/src/assets/images/hztzone_pet_gps_tracker_1782876406090.jpg',
      images: ['/src/assets/images/hztzone_pet_gps_tracker_1782876406090.jpg'],
      rating: 4.6,
      reviews: 110,
      isCustomizable: false,
      description: 'Ultra-lightweight, waterproof collar GPS tag linking 24/7 real-time LTE positioning and daily physical step counters. Track paths and keep your pets safe.',
      youtubeEmbedCode: '',
      ratingReviews: []
    },
    {
      id: '6',
      name: 'HZTzone Ultrasonic Skin Scrubber',
      price: 19.99,
      originalPrice: 29.99,
      category: 'beauty',
      image: '/src/assets/images/hztzone_skin_scrubber_1782876491667.jpg',
      images: ['/src/assets/images/hztzone_skin_scrubber_1782876491667.jpg'],
      rating: 4.7,
      reviews: 78,
      isCustomizable: false,
      description: 'Advanced skincare spatula leveraging 24KHz ultrasonic peeling vibes to effectively painlessly lift blackheads, dead skin, clogged follicles, and grease.',
      youtubeEmbedCode: '',
      ratingReviews: []
    },
    {
      id: '7',
      name: 'HZTzone Smart Pet Remote Training Collar',
      price: 49.99,
      originalPrice: 79.99,
      category: 'pets',
      image: '/src/assets/images/hztzone_pet_training_collar_1782876416892.jpg',
      images: ['/src/assets/images/hztzone_pet_training_collar_1782876416892.jpg'],
      rating: 5.0,
      reviews: 58,
      isCustomizable: false,
      description: 'Professional high-capacity smart training receiver collar with vibration, sound warning modes, and an 800-meter premium wireless signal remote.',
      youtubeEmbedCode: '',
      ratingReviews: []
    },
    {
      id: '8',
      name: 'HZTzone Smart Pet Health & Vitality Monitor',
      price: 69.99,
      originalPrice: 109.99,
      category: 'pets',
      image: '/src/assets/images/hztzone_pet_health_monitor_1782876427719.jpg',
      images: ['/src/assets/images/hztzone_pet_health_monitor_1782876427719.jpg'],
      rating: 4.8,
      reviews: 42,
      isCustomizable: false,
      description: 'A continuous tracking bowl scale and health diagnostic module checking water hydration speed, daily eating habits, and instant weight metrics.',
      youtubeEmbedCode: '',
      ratingReviews: []
    }
  ],
  categories: [
    { type: 'pets', label: 'Pet Supplies', sublabel: 'Smart pet caring and training', image: '', isAiGenerated: true },
    { type: 'beauty', label: 'Beauty & Care', sublabel: 'Premium electric beauty tools', image: '', isAiGenerated: true },
    { type: 'best-sellers', label: 'Best Sellers', sublabel: 'Most popular choices', image: '', isAiGenerated: true }
  ],
  navigation: [
    { title: 'Home', path: '/' },
    { title: 'Pet Supplies', path: '/category/pets' },
    { title: 'Beauty & Care', path: '/category/beauty' },
    { title: 'Best Sellers', path: '/category/best-sellers' },
    { title: 'Extended Warranty', path: '/warranty' }
  ],
  coupons: [
    { code: 'HZTZONE10', discount: 10, description: '10% off site-wide coupon code' },
    { code: 'SAVE15', discount: 15, description: '15% off coupon' },
    { code: 'SUPER30', discount: 30, description: '30% massive loyalty discount' }
  ],
  edm_subscribers: [
    { email: 'sarah.j@example.com', date: '2026-06-18' },
    { email: 'marcus@hztzone.com', date: '2026-06-17' }
  ],
  edm_campaigns: [
    { id: '1', title: 'HZTzone Grand Rebranding Launch!', content: 'Welcome to HZTzone. Explore our latest smart appliances, beauty routines, and premium pet supplies!', date: '2026-06-19', recipientsCount: 2 }
  ],
  orders: [
    {
      id: 'HZT-839210',
      date: '2026-06-18 14:32',
      customerName: 'Sarah Jenkins',
      email: 'sarah.j@example.com',
      address: '452 Broad St, Newark, NJ 07102, United States',
      paymentMethod: 'PayPal (sarah.j@example.com)',
      itemsCount: 1,
      total: 53.99,
      discountCode: 'HZTZONE10',
      status: 'In Production',
      items: [
        { name: 'HZTzone Smart Pet Feeder', quantity: 1, price: 59.99, color: 'White', size: 'Standard' }
      ]
    },
    {
      id: 'HZT-294021',
      date: '2026-06-17 09:15',
      customerName: 'Marcus Aurelius',
      email: 'marcus@hztzone.com',
      address: '9 Villa Adriana, Rome, 00010, Italy',
      paymentMethod: 'MasterCard ending in •••• 1042',
      itemsCount: 1,
      total: 79.99,
      status: 'Shipped',
      items: [
        { name: 'HZTzone High-Speed Ionic Hair Dryer', quantity: 1, price: 79.99, color: 'Pink' }
      ]
    }
  ],
  ga_logs: [
    { id: '1', type: 'page_view', path: '/', date: '2026-06-19', ip: '127.0.0.1' },
    { id: '2', type: 'add_to_cart', productId: '1', date: '2026-06-19', ip: '127.0.0.1' }
  ],
  warranties: [
    {
      id: 'W-001',
      customerName: 'Alice Smith',
      country: 'United States',
      channel: 'Amazon',
      email: 'alice.smith@example.com',
      address: '742 Evergreen Terrace, Springfield, OR',
      orderNumber: 'AMZ-839210',
      phone: '+1 (555) 019-9231',
      productName: 'HZTzone Smart Pet Feeder',
      date: '2026-06-20'
    },
    {
      id: 'W-002',
      customerName: '张伟',
      country: 'China',
      channel: 'Tiktok',
      email: 'zhangwei@hztzone.com',
      address: '北京市朝阳区建国路88号',
      orderNumber: 'TT-987211',
      phone: '+86 13911112222',
      productName: 'HZTzone High-Speed Ionic Hair Dryer',
      date: '2026-06-19'
    }
  ]
};

// Lazy Database accessors
function readDB() {
  try {
    let db: any;
    if (!fs.existsSync(DB_PATH)) {
      db = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE));
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
      return db;
    }
    const content = fs.readFileSync(DB_PATH, 'utf-8');
    db = JSON.parse(content);

    // Dynamic database migration self-heals any missing categories, navigation, or seed products
    let modified = false;
    if (!db.categories) {
      db.categories = [];
      modified = true;
    }
    if (!db.navigation) {
      db.navigation = [];
      modified = true;
    }
    if (!db.products) {
      db.products = [];
      modified = true;
    }
    if (!db.securityLogs) {
      db.securityLogs = [];
      modified = true;
    }
    if (!db.contact_messages) {
      db.contact_messages = [];
      modified = true;
    }
    if (!db.shipping_config) {
      db.shipping_config = {
        freeShippingThreshold: 75.00,
        standardShippingFee: 5.99,
        standardDeliveryTime: "5-7 business days",
        expressShippingFee: 9.99,
        expressDeliveryTime: "2-3 business days"
      };
      modified = true;
    } else {
      if (db.shipping_config.expressShippingFee === 15.00) {
        db.shipping_config.expressShippingFee = 9.99;
        modified = true;
      }
    }

    // Load default rich specifications if available to upgrade default products
    let richSpecs: any = {};
    const richSpecsPath = path.join(process.cwd(), 'data', 'rich_specs.json');
    if (fs.existsSync(richSpecsPath)) {
      try {
        richSpecs = JSON.parse(fs.readFileSync(richSpecsPath, 'utf-8'));
      } catch (e) {
        console.error("Failed to parse rich_specs.json", e);
      }
    }

    // Self-healing migration for ALL products to ensure existing products in sale are never broken/affected
    db.products.forEach((p: any) => {
      let prodModified = false;
      const spec = richSpecs[String(p.id)];
      if (spec) {
        if (p.name !== spec.name) { p.name = spec.name; prodModified = true; }
        if (!p.richText || p.richText !== spec.richText) { p.richText = spec.richText; prodModified = true; }
        if (!p.sku || p.sku !== spec.sku) { p.sku = spec.sku; prodModified = true; }
        if (!p.packageSize || p.packageSize !== spec.packageSize) { p.packageSize = spec.packageSize; prodModified = true; }
        if (!p.weight || p.weight !== spec.weight) { p.weight = spec.weight; prodModified = true; }
        if (!p.images || p.images.length < 5) { p.images = spec.images; prodModified = true; }
      }
      if (!p.images) { p.images = p.image ? [p.image] : []; prodModified = true; }
      if (!p.faqs) { p.faqs = []; prodModified = true; }
      if (!p.ratingReviews) { p.ratingReviews = []; prodModified = true; }
      if (p.isCustomizable === undefined) { p.isCustomizable = true; prodModified = true; }
      if (p.hasVariants === undefined) { p.hasVariants = true; prodModified = true; }
      if (p.colors === undefined) { p.colors = ["White", "Black", "Pink", "Navy"]; prodModified = true; }
      if (p.sizes === undefined) { p.sizes = ["XS", "S", "M", "L", "XL", "XXL"]; prodModified = true; }
      if (p.price === undefined) { p.price = 29.99; prodModified = true; }
      if (p.originalPrice === undefined) { p.originalPrice = p.price * 1.5; prodModified = true; }
      if (p.rating === undefined) { p.rating = 4.8; prodModified = true; }
      if (p.reviews === undefined) { p.reviews = 0; prodModified = true; }
      if (prodModified) modified = true;
    });

    if (!db.warranties) {
      db.warranties = [];
      modified = true;
    }

    const hasWarrantyNav = db.navigation && db.navigation.some((n: any) => n.path === '/warranty');
    if (!db.navigation || db.navigation.length === 0 || !hasWarrantyNav) {
      db.navigation = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE.navigation));
      modified = true;
    }

    const hasPetsCat = db.categories && db.categories.some((c: any) => c.type === 'pets');
    if (!db.categories || db.categories.length === 0 || !hasPetsCat) {
      db.categories = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE.categories));
      modified = true;
    }

    const hasHztProducts = db.products && db.products.some((p: any) => p.name.includes('HZTzone'));
    if (!db.products || db.products.length === 0 || !hasHztProducts) {
      db.products = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE.products));
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    }

    return db;
  } catch (err) {
    console.error('Error reading DB, returning default:', err);
    return INITIAL_DATABASE_STATE;
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// Check with brute force rate limiting map
// Hold active IP / Email lockout state in-memory
const bruteForceRegistry: Record<string, { attempts: number; lockoutUntil: number }> = {};

function checkBruteForce(identifier: string) {
  const record = bruteForceRegistry[identifier];
  if (!record) return { isLocked: false };
  
  const now = Date.now();
  if (record.lockoutUntil > now) {
    const secondsRemaining = Math.ceil((record.lockoutUntil - now) / 1000);
    return { isLocked: true, secondsRemaining };
  }
  
  // Lock expired, reset attempts if lockout elapsed
  if (record.lockoutUntil > 0 && record.lockoutUntil <= now) {
    record.attempts = 0;
    record.lockoutUntil = 0;
  }
  
  return { isLocked: false };
}

function registerFailedAttempt(identifier: string) {
  if (!bruteForceRegistry[identifier]) {
    bruteForceRegistry[identifier] = { attempts: 0, lockoutUntil: 0 };
  }
  
  const record = bruteForceRegistry[identifier];
  record.attempts += 1;
  
  if (record.attempts >= 5) {
    // Lock for 3 minutes (180000 ms) after 5 failed attempts
    record.lockoutUntil = Date.now() + 180000;
  }
  
  return record;
}

function clearFailedAttempts(identifier: string) {
  if (bruteForceRegistry[identifier]) {
    delete bruteForceRegistry[identifier];
  }
}

// Write a log entry to security logs list
function logSecurityEvent(email: string, eventType: string, description: string, ip: string) {
  try {
    const db = readDB();
    if (!db.securityLogs) {
      db.securityLogs = [];
    }
    
    const newLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      email: email || 'unknown@hztzone.com',
      eventType, // e.g. 'admin_login_success', 'admin_login_failed', 'admin_login_blocked', 'admin_password_changed', 'security_policy_updated'
      description,
      ip: String(ip || 'unknown')
    };
    
    db.securityLogs.push(newLog);
    
    // Retain only the last 150 entries to avoid bloating the DB JSON
    if (db.securityLogs.length > 150) {
      db.securityLogs = db.securityLogs.slice(-150);
    }
    
    writeDB(db);
  } catch (err) {
    console.error('Error logging security event:', err);
  }
}

// -------------------------------------------------------------
// GEMINI API CUSTOM CUSTOMER SERVICE INTELLIGENCE
// -------------------------------------------------------------
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      geminiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return geminiClient;
}

// REST API Endpoints

// 1. STATE API - Fetch all app configs, categories, navigation items, and products
app.get('/api/state', (req, res) => {
  const db = readDB();
  res.json({
    products: db.products,
    categories: db.categories,
    navigation: db.navigation,
    coupons: db.coupons,
    orders: db.orders,
    contactInfo: db.contact_info || {
      email: 'support@hztzone.com',
      phone: '+1 (555) 789-3210',
      address: 'HZTzone Global Logistics Parkway, Suite 100',
      slogan: 'Premium Pet, Smart Tech & Skincare Beauty Essentials'
    },
    pagesContent: db.pages_content || {
      shipping: "HZTzone operates global logistics centers. Free standard shipping is automatically applied at checkout for any order total exceeding $75.00 USD.",
      returns: "At HZTzone, your satisfaction is our priority. We offer a 14-day hassle-free return or replacement period for defective or unused products in their original packaging.",
      size_guide: "Please refer to the detailed size guides on our product page before purchasing pet apparel or smart device accessories to ensure a perfect fit.",
      privacy: "Your private data is safe with us. HZTzone strictly processes customer emails, phone numbers, and addresses for fulfillment and warranty authentication only.",
      terms: "By utilizing the HZTzone e-commerce storefront, you agree to comply with our global terms of service and standard warranty guidelines."
    },
    pixelSettings: db.pixel_settings || {
      facebookPixelId: '',
      googleTagId: ''
    }
  });
});

// 1.5. PRODUCT EXTENDED WARRANTY REGISTRATION API
app.post('/api/warranty', (req, res) => {
  const { productName, country, channel, customerName, email, address, orderNumber, phone } = req.body;
  
  if (!productName || !country || !channel || !customerName || !email || !address || !orderNumber || !phone) {
    return res.status(400).json({ error: 'Please fill in all required warranty fields' });
  }

  const db = readDB();
  if (!db.warranties) {
    db.warranties = [];
  }

  const warrantyId = `W-${Math.floor(100000 + Math.random() * 900000)}`;
  const newWarranty = {
    id: warrantyId,
    productName,
    country,
    channel,
    customerName,
    email,
    address,
    orderNumber,
    phone,
    date: new Date().toISOString().split('T')[0]
  };

  db.warranties.unshift(newWarranty);
  writeDB(db);

  // Map channels to review/comment URLs for direct review redirection
  let reviewUrl = 'https://www.google.com';
  const chLower = channel.toLowerCase();
  if (chLower.includes('amazon') || chLower.includes('亚马逊')) {
    reviewUrl = 'https://www.amazon.com/gp/css/order-history';
  } else if (chLower.includes('ebay')) {
    reviewUrl = 'https://www.ebay.com/myb/PurchaseHistory';
  } else if (chLower.includes('ozon')) {
    reviewUrl = 'https://www.ozon.ru/my/comments';
  } else if (chLower.includes('wb') || chLower.includes('wildberries')) {
    reviewUrl = 'https://www.wildberries.ru/lk/myreviews';
  } else if (chLower.includes('tiktok')) {
    reviewUrl = 'https://www.tiktok.com';
  }

  res.json({
    success: true,
    warrantyId,
    reviewUrl,
    message: 'Extended warranty successfully registered!'
  });
});

app.get('/api/admin/warranties', (req, res) => {
  const db = readDB();
  res.json({
    success: true,
    warranties: db.warranties || []
  });
});

// Update manageable static pages content from Admin Panel
app.post('/api/admin/pages-content', (req, res) => {
  const { shipping, returns, size_guide, privacy, terms } = req.body;
  const db = readDB();
  db.pages_content = {
    shipping: shipping || '',
    returns: returns || '',
    size_guide: size_guide || '',
    privacy: privacy || '',
    terms: terms || ''
  };
  writeDB(db);
  res.json({ success: true, pagesContent: db.pages_content });
});

// Update Facebook / Google pixels and general tags from Admin panel
app.post('/api/admin/pixel-settings', (req, res) => {
  const { facebookPixelId, googleTagId } = req.body;
  const db = readDB();
  db.pixel_settings = {
    facebookPixelId: facebookPixelId || '',
    googleTagId: googleTagId || ''
  };
  writeDB(db);
  res.json({ success: true, pixelSettings: db.pixel_settings });
});

// 1b. CART SYNC API
app.get('/api/cart', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  const db = readDB();
  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ cartItems: user.cart || [] });
});

app.post('/api/cart', (req, res) => {
  const { userId, cartItems } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  const db = readDB();
  const userIndex = db.users.findIndex((u: any) => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  db.users[userIndex].cart = cartItems || [];
  writeDB(db);
  res.json({ success: true, message: 'Cart updated successfully' });
});

// 1c. CONTACT INFO MANAGEMENT
app.get('/api/contact-info', (req, res) => {
  const db = readDB();
  res.json(db.contact_info || {
    email: 'support@hztzone.com',
    phone: '+1 (555) 123-4567',
    address: '123 Fashion Ave, NY 10016',
    slogan: 'The Art of Bespoke Gifting'
  });
});

app.post('/api/admin/contact-info', (req, res) => {
  const { email, phone, address, slogan } = req.body;
  const db = readDB();
  db.contact_info = {
    email: email || 'support@hztzone.com',
    phone: phone || '+1 (555) 123-4567',
    address: address || '123 Fashion Ave, NY 10016',
    slogan: slogan || 'The Art of Bespoke Gifting'
  };
  writeDB(db);
  res.json({ success: true, message: 'Contact settings updated successfully!', contactInfo: db.contact_info });
});

// 1d. SHIPPING CONFIGURATION
app.get('/api/shipping-config', (req, res) => {
  const db = readDB();
  res.json(db.shipping_config || {
    freeShippingThreshold: 75.00,
    standardShippingFee: 5.99,
    standardDeliveryTime: "5-7 business days",
    expressShippingFee: 15.00,
    expressDeliveryTime: "2-3 business days"
  });
});

app.post('/api/admin/shipping-config', (req, res) => {
  const { freeShippingThreshold, standardShippingFee, standardDeliveryTime, expressShippingFee, expressDeliveryTime } = req.body;
  const db = readDB();
  db.shipping_config = {
    freeShippingThreshold: Number(freeShippingThreshold) || 0,
    standardShippingFee: Number(standardShippingFee) || 0,
    standardDeliveryTime: standardDeliveryTime || "5-7 business days",
    expressShippingFee: Number(expressShippingFee) || 0,
    expressDeliveryTime: expressDeliveryTime || "2-3 business days"
  };
  writeDB(db);
  res.json({ success: true, message: 'Shipping configuration saved successfully!', config: db.shipping_config });
});

// 2. USER AUTH: REGISTER
app.post('/api/auth/register', (req, res) => {
  const { email, password, confirmPassword, address } = req.body;
  
  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Please enter all registration inputs' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const db = readDB();
  const existingUser = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: 'This email is already registered.' });
  }

  const newUser = {
    id: 'usr_' + Date.now(),
    email: email.toLowerCase(),
    password: password, // In production we would hash, keeping readable/plain-text for robust demo queries
    role: 'customer',
    failedAttempts: 0,
    lockoutUntil: 0,
    address: address || '',
    subscribed: false
  };

  db.users.push(newUser);
  writeDB(db);

  res.json({ message: 'User registered successfully!', user: { id: newUser.id, email: newUser.email, role: newUser.role, address: address || '', subscribed: false } });
});

// 3. USER AUTH: LOGIN WITH STRONG BRUTE FORCE DEFENSE
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password inputs are required.' });
  }

  const normalizedEmail = email.toLowerCase();
  
  // Brute force audit
  const lockoutCheck = checkBruteForce(normalizedEmail);
  if (lockoutCheck.isLocked) {
    return res.status(429).json({ 
      error: `Too many failed login attempts. Account temporarily locked. Please try again in ${lockoutCheck.secondsRemaining} seconds.` 
    });
  }

  const db = readDB();
  const user = db.users.find((u: any) => u.email.toLowerCase() === normalizedEmail);

  if (!user || user.password !== password) {
    const record = registerFailedAttempt(normalizedEmail);
    const attemptsLeft = 5 - record.attempts;
    
    if (record.lockoutUntil > 0) {
      return res.status(429).json({ 
        error: `Invalid credentials. 5 failed attempts reached. This account is now locked for 3 minutes.` 
      });
    } else {
      return res.status(401).json({ 
        error: `Invalid email or password. You have ${attemptsLeft} attempts remaining before account lock.` 
      });
    }
  }

  // Clear tracking upon success
  clearFailedAttempts(normalizedEmail);

  res.json({
    message: 'Logged in successfully',
    user: { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      address: user.address || '',
      subscribed: !!user.subscribed
    }
  });
});

// 4. USER AUTH: CHANGE PASSWORD
app.post('/api/auth/change-password', (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  if (!userId || !oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Missing password change fields.' });
  }

  const db = readDB();
  const userIndex = db.users.findIndex((u: any) => u.id === userId);
  if (userIndex === -1) {
    return res.status(401).json({ error: 'User session not found.' });
  }

  const user = db.users[userIndex];
  if (user.password !== oldPassword) {
    return res.status(400).json({ error: 'The old password you entered is incorrect.' });
  }

  user.password = newPassword;
  db.users[userIndex] = user;
  writeDB(db);

  res.json({ message: 'Password updated successfully!' });
});

// 4b. USER AUTH: UPDATE PROFILE (ADDRESS & SUBSCRIPTION)
app.post('/api/auth/update-profile', (req, res) => {
  const { userId, address, subscribed } = req.body;
  if (!userId) {
    return res.status(450).json({ error: 'User session is missing or invalid' });
  }

  const db = readDB();
  const userIndex = db.users.findIndex((u: any) => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found in our store.' });
  }

  const user = db.users[userIndex];
  if (address !== undefined) {
    user.address = address;
  }

  if (subscribed !== undefined) {
    user.subscribed = !!subscribed;
    const emailNorm = user.email.toLowerCase();
    
    if (user.subscribed) {
      const alreadySubbed = db.edm_subscribers.find((s: any) => s.email.toLowerCase() === emailNorm);
      if (!alreadySubbed) {
        db.edm_subscribers.push({
          email: emailNorm,
          date: new Date().toISOString().split('T')[0]
        });
      }
    } else {
      db.edm_subscribers = db.edm_subscribers.filter((s: any) => s.email.toLowerCase() !== emailNorm);
    }
  }

  db.users[userIndex] = user;
  writeDB(db);

  res.json({
    success: true,
    message: 'Profile settings updated successfully!',
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      address: user.address || '',
      subscribed: !!user.subscribed
    }
  });
});

// 5. MERCHANT ADMIN BINDINGS
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  // 1. Check brute force lockout for this admin email
  const emailLockout = checkBruteForce(normalizedEmail);
  if (emailLockout.isLocked) {
    logSecurityEvent(normalizedEmail, 'admin_login_blocked', 'Account locked due to brute force protection.', clientIp);
    return res.status(429).json({
      error: `Admin login temporarily locked. Too many failed attempts on this account. Please wait ${emailLockout.secondsRemaining} seconds.`
    });
  }

  // 2. Check brute force lockout for IP to protect against password spraying
  const ipIdentifier = `ip_${clientIp}`;
  const ipLockout = checkBruteForce(ipIdentifier);
  if (ipLockout.isLocked) {
    logSecurityEvent(normalizedEmail, 'admin_login_blocked', 'IP temporarily locked due to password spraying.', clientIp);
    return res.status(429).json({
      error: `Your IP has been temporarily locked due to too many failed attempts. Please wait ${ipLockout.secondsRemaining} seconds.`
    });
  }

  const db = readDB();
  const adminAccount = db.users.find((u: any) => u.role === 'admin' && u.email.toLowerCase() === normalizedEmail);

  if (!adminAccount || adminAccount.password !== password) {
    // Record failed attempt for both email and IP address
    const emailRecord = registerFailedAttempt(normalizedEmail);
    const ipRecord = registerFailedAttempt(ipIdentifier);
    const attemptsLeft = Math.max(0, 5 - emailRecord.attempts);

    logSecurityEvent(normalizedEmail, 'admin_login_failed', 'Attempted administrative login with incorrect credentials.', clientIp);

    if (emailRecord.lockoutUntil > 0 || ipRecord.lockoutUntil > 0) {
      return res.status(429).json({
        error: `Incorrect admin credentials. 5 failed attempts reached. Administrative portal access is now locked for 3 minutes.`
      });
    }

    return res.status(401).json({
      error: `Incorrect administrative credentials. You have ${attemptsLeft} attempts remaining.`
    });
  }

  // Success! Clear failed attempts
  clearFailedAttempts(normalizedEmail);
  clearFailedAttempts(ipIdentifier);

  // Record successful login security log
  logSecurityEvent(normalizedEmail, 'admin_login_success', 'Successful administrative login.', clientIp);

  // If the admin is using the default "admin" password, flag a security warning
  const isDefaultPassword = password === 'admin';

  res.json({ 
    success: true, 
    user: adminAccount,
    securityWarning: isDefaultPassword ? 'DEFAULT_PASSWORD_DETECTED' : null
  });
});

app.post('/api/admin/change-password', (req, res) => {
  const { adminEmail, oldPassword, newPassword } = req.body;
  if (!adminEmail || !oldPassword || !newPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const normalizedEmail = adminEmail.toLowerCase().trim();
  const db = readDB();
  const adminIndex = db.users.findIndex((u: any) => u.role === 'admin' && u.email.toLowerCase() === normalizedEmail);

  if (adminIndex === -1) {
    return res.status(401).json({ error: 'Admin account not found.' });
  }

  const admin = db.users[adminIndex];
  if (admin.password !== oldPassword) {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    logSecurityEvent(normalizedEmail, 'admin_password_change_failed', 'Attempted to change password with incorrect old password.', clientIp);
    return res.status(400).json({ error: 'The current admin password you entered is incorrect.' });
  }

  // Enforce strong password complexity rules:
  // - Minimum 8 characters
  // - At least one uppercase, one lowercase, one digit, and one special character
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecial) {
    return res.status(400).json({ 
      error: 'Password does not meet complexity requirements. It must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' 
    });
  }

  if (newPassword.toLowerCase() === 'admin' || newPassword === '12345678') {
    return res.status(400).json({ error: 'This password is too common and insecure. Please select a stronger, unique password.' });
  }

  admin.password = newPassword;
  db.users[adminIndex] = admin;
  writeDB(db);

  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  logSecurityEvent(normalizedEmail, 'admin_password_changed', 'Successfully updated administrative login password.', clientIp);

  res.json({ success: true, message: 'Admin password updated securely and registered successfully.' });
});

app.get('/api/admin/security-logs', (req, res) => {
  const db = readDB();
  res.json({ securityLogs: db.securityLogs || [] });
});

// 5a. CUSTOM CATEGORIES MANAGEMENT
app.post('/api/admin/categories', (req, res) => {
  const { type, label, sublabel, image, isAiGenerated } = req.body;
  if (!type || !label) {
    return res.status(400).json({ error: 'Missing type or label' });
  }

  const db = readDB();
  const existingIndex = db.categories.findIndex((c: any) => c.type === type);
  const categoryItem = {
    type,
    label,
    sublabel: sublabel || '',
    image: image || '',
    isAiGenerated: !!isAiGenerated
  };

  if (existingIndex > -1) {
    db.categories[existingIndex] = categoryItem;
  } else {
    db.categories.push(categoryItem);
  }

  writeDB(db);
  res.json({ success: true, categories: db.categories });
});

app.delete('/api/admin/categories/:type', (req, res) => {
  const { type } = req.params;
  const db = readDB();
  db.categories = db.categories.filter((c: any) => c.type !== type);
  writeDB(db);
  res.json({ success: true, categories: db.categories });
});

// 5b. CUSTOM NAVIGATION MENU MANAGEMENT
app.post('/api/admin/navigation', (req, res) => {
  const { title, path: navPath } = req.body;
  if (!title || !navPath) {
    return res.status(400).json({ error: 'Missing title or route path' });
  }

  const db = readDB();
  db.navigation.push({ title, path: navPath });
  writeDB(db);
  res.json({ success: true, navigation: db.navigation });
});

app.put('/api/admin/navigation', (req, res) => {
  const { menus } = req.body; // complete replacement
  if (!Array.isArray(menus)) {
    return res.status(400).json({ error: 'Navigation menu items must be an array' });
  }
  const db = readDB();
  db.navigation = menus;
  writeDB(db);
  res.json({ success: true, navigation: db.navigation });
});

// 5c. PRODUCT IMAGE UPLOAD PERSIST TO SERVER ACCORDING TO PRODUCT NAME
app.post('/api/admin/products/upload-image', (req, res) => {
  const { productName, imageBase64, index } = req.body;
  if (!productName || !imageBase64) {
    return res.status(400).json({ error: 'productName and imageBase64 are required' });
  }

  try {
    const cleanName = productName
      .replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_')
      .replace(/_+/g, '_')
      .trim() || 'product';

    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = 'png';

    if (matches && matches.length === 3) {
      const type = matches[1];
      ext = type.split('/')[1] || 'png';
      if (ext === 'jpeg') ext = 'jpg';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(imageBase64, 'base64');
    }

    const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const filename = `${cleanName}_img_${index}_${Math.floor(Math.random() * 100000)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (err: any) {
    console.error('Upload product image error:', err);
    res.status(500).json({ error: 'Failed to write custom image file to disk' });
  }
});

// 5d. GENERIC MEDIA FILE UPLOAD (FOR VIDEOS & IMAGES VIA BASE64)
app.post('/api/media/upload', (req, res) => {
  const { namePrefix, base64Data } = req.body;
  if (!base64Data) {
    return res.status(400).json({ error: 'base64Data is required' });
  }

  try {
    const matches = base64Data.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = 'png';

    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      ext = mimeType.split('/')[1] || 'png';
      if (ext === 'jpeg') ext = 'jpg';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64Data, 'base64');
    }

    const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const prefix = (namePrefix || 'upload')
      .replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_')
      .replace(/_+/g, '_')
      .trim();

    const filename = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (err: any) {
    console.error('Media upload error:', err);
    res.status(500).json({ error: 'Failed to write media file to disk' });
  }
});

// Online AI product writer customized of SEO and GEO guidelines
app.post('/api/admin/products/ai-write', async (req, res) => {
  const { type, userPrompt, productTitle, productCategory } = req.body;
  
  const ai = getGemini();

  if (!ai) {
    // Elegant fallback simulation complying with SEO & GEO parameters
    const mockBrief = `Discover the ultimate custom apparel with our ${productTitle || 'Premium Customizable Gift'}. Meticulously handcrafted from luxury long-staple cotton, this high-performance piece is customized on-demand in our regional hubs (offering rapid standard 3-5 day delivery in North America & Europe, and free shipping for orders over $75 USD). High-contrast typography and keyword-optimized schemas guarantee peak search visibility across global marketplaces.`;
    
    const mockRich = `<div class="space-y-6 my-6 p-6 border border-neutral-100 rounded-3xl bg-white shadow-xs max-w-4xl mx-auto text-left">
  <!-- SEO Heading Header -->
  <div class="border-b pb-4 border-neutral-100">
    <h3 class="font-serif font-black text-neutral-900 text-xl tracking-tight leading-tight mb-2">✨ Premium Handcrafted ${productTitle || 'Personalized Custom Style'}</h3>
    <p class="text-neutral-500 text-xs font-mono tracking-wider uppercase text-neutral-400">SEO Verified | Global Fulfillment Corridor Nodes</p>
  </div>

  <!-- Content Pitch -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
    <div>
      <p class="text-neutral-600 text-xs leading-relaxed mb-4">
        Our custom apparel is engineered for premium comfort and stylistic durability. Designed using high-density vector mapping, every print preserves deep color depth and active tension. Specially optimized for international standards and geographical distribution markets (fully compliant with direct US, EU, and UK specifications).
      </p>
      <ul class="space-y-2.5 text-neutral-500 text-[11px] font-medium">
        <li class="flex items-start gap-2">
          <span class="text-emerald-500 font-bold font-mono">✓</span>
          <span><strong>Premium Combed Cotton Blend:</strong> Breathable, anti-flickering, pre-shrunk weave.</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-emerald-500 font-bold font-mono">✓</span>
          <span><strong>Global GEO Node Handling:</strong> Dispatched from Newark, NJ and Frankfurt, DE for zero delay.</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-emerald-500 font-bold font-mono">✓</span>
          <span><strong>Microdata Optimization:</strong> Standardized Schema.org Product markup indexer.</span>
        </li>
      </ul>
    </div>
    
    <div class="rounded-2xl overflow-hidden border bg-neutral-50 p-4 font-mono text-[10px] text-neutral-400 space-y-2">
      <div class="flex justify-between items-center text-xs font-bold text-neutral-700 pb-1.5 border-b border-neutral-200">
        <span>📍 Fulfillment Diagnostics</span>
        <span class="text-emerald-600">● LIVE</span>
      </div>
      <div class="flex justify-between"><span>Origin Center:</span><span class="text-neutral-600">Regional Port Warehouse</span></div>
      <div class="flex justify-between"><span>Logistics Code:</span><span class="text-neutral-600">GEO-POD-GLOBAL</span></div>
      <div class="flex justify-between"><span>Active Currency:</span><span class="text-neutral-600">USD, EUR, GBP (Auto-Adjust)</span></div>
      <div class="flex justify-between"><span>Shipping:</span><span class="text-neutral-600">FREE on Orders > $75.00</span></div>
    </div>
  </div>
</div>`;

    return res.json({
      success: true,
      result: type === 'brief' ? mockBrief : mockRich
    });
  }

  try {
    let systemInstruction = "You are a professional copywriter specializing in high-converting print-on-demand e-commerce. You write persuasive product copy optimized for international search engines (SEO) and regional localization preferences (GEO).";
    let prompt = "";

    if (type === 'brief') {
      prompt = `Write a persuasive, high-converting product brief description (around 2-3 sentences, 50-80 words).
Brand Name: HZTzone (luxurious premium smart appliances and pet caring boutique)
Product Category: ${productCategory || 'Custom Gifts'}
Product Title: "${productTitle || 'Custom Handmade Product'}"
Specific user guidelines or prompt directives: "${userPrompt || 'Highlight luxurious custom print'}"

Strict Standards to incorporate:
1. SEO: Naturally weave primary and secondary search terms. Focus on high-intent terms like "customized hand-printed", "premium bespoke gift", "personalized streetwear". Provide strong keyword index density.
2. GEO: Emphasize localized rapid regional shipping capabilities (manufactured & shipped on-demand from major domestic fulfillment centers for rapid US and European delivery. Express shipping available, with FREE delivery offered on over $75 USD). Include multi-currency compatibility points.

Return ONLY the plain text of the description. Do not wrap in markdown quotes or extra headers.`;
    } else {
      prompt = `Generate a magnificent, comprehensive product detail layout section written in clean, robust HTML.
Brand Name: HZTzone (luxurious premium smart appliances and pet caring boutique)
Product Category: ${productCategory || 'Custom Gifts'}
Product Title: "${productTitle || 'Custom Handmade Product'}"
Specific user guidelines or prompt directives: "${userPrompt || 'Highlight premium design components and handcrafted longevity'}"

Guidelines for layout & style:
1. Format strictly using responsive clean HTML tags (such as div, h3, p, ul, li, strong, etc.) with elegant TailwindCSS classes (spacing, borders, grid layouts, text sizes). Do not write raw complete pages or <html> tags — only generate a nested wrapper <div> component.
2. SEO optimization: Introduce clear, hierarchical <h3> header overlays, target high-volume description keywords, product detail parameters, and structural lists.
3. GEO localization details: Add standard geographical optimization information. Highlight dispatch nodes (e.g., printed and packed near regional shipping lanes in Newark, US and Frankfurt, EU to reduce container carbon miles and delivery times), multi-currency compliance, localized shipping speed (3-5 days delivery), and clear local currency thresholds (Free Delivery for orders over $75 USD).
4. Feel free to structure a side-by-side bento card grid or detail blocks representation. Do not insert placeholdered images unless using premium generic Unsplash URLs.

Return ONLY the raw HTML string, starting directly with <div> and ending with </div>. Do not write markdown wrapping blocks like \`\`\`html.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.85,
      }
    });

    let resultText = response.text || '';
    
    // Clean markdown code blocks if any
    if (resultText.startsWith('```html')) {
      resultText = resultText.substring(7);
      if (resultText.endsWith('```')) {
        resultText = resultText.substring(0, resultText.length - 3);
      }
    } else if (resultText.startsWith('```')) {
      resultText = resultText.substring(3);
      if (resultText.endsWith('```')) {
        resultText = resultText.substring(0, resultText.length - 3);
      }
    }
    
    res.json({ success: true, result: resultText.trim() });
  } catch (err: any) {
    console.info('Gemini product writer currently offline. Utilizing local high-converting text generator instead.');
    
    // Graceful fallback when the quota is exhausted
    const fallbackBrief = `Discover the ultimate custom apparel with our ${productTitle || 'Premium Customizable Gift'}. Meticulously handcrafted from luxury long-staple cotton, this high-performance piece is customized on-demand in our regional hubs (offering rapid standard 3-5 day delivery in North America & Europe, and free shipping for orders over $75 USD). High-contrast typography and keyword-optimized schemas guarantee peak search visibility across global marketplaces.`;
    
    const fallbackRich = `<div class="space-y-6 my-6 p-6 border border-neutral-100 rounded-3xl bg-white shadow-xs max-w-4xl mx-auto text-left">
  <!-- SEO Heading Header -->
  <div class="border-b pb-4 border-neutral-100">
    <h3 class="font-serif font-black text-neutral-900 text-xl tracking-tight leading-tight mb-2">✨ Premium Handcrafted ${productTitle || 'Personalized Custom Style'}</h3>
    <p class="text-neutral-500 text-xs font-mono tracking-wider uppercase text-neutral-400">SEO Verified | Global Fulfillment Corridor Nodes</p>
  </div>

  <!-- Content Pitch -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
    <div>
      <p class="text-neutral-600 text-xs leading-relaxed mb-4">
        Our custom apparel is engineered for premium comfort and stylistic durability. Designed using high-density vector mapping, every print preserves deep color depth and active tension. Specially optimized for international standards and geographical distribution markets (fully compliant with direct US, EU, and UK specifications).
      </p>
      <ul class="space-y-2.5 text-neutral-500 text-[11px] font-medium">
        <li class="flex items-start gap-2">
          <span class="text-emerald-500 font-bold font-mono">✓</span>
          <span><strong>Premium Combed Cotton Blend:</strong> Breathable, anti-flickering, pre-shrunk weave.</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-emerald-500 font-bold font-mono">✓</span>
          <span><strong>Global GEO Node Handling:</strong> Dispatched from Newark, NJ and Frankfurt, DE for zero delay.</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-emerald-500 font-bold font-mono">✓</span>
          <span><strong>Microdata Optimization:</strong> Standardized Schema.org Product markup indexer.</span>
        </li>
      </ul>
    </div>
    
    <div class="rounded-2xl overflow-hidden border bg-neutral-50 p-4 font-mono text-[10px] text-neutral-400 space-y-2">
      <div class="flex justify-between items-center text-xs font-bold text-neutral-700 pb-1.5 border-b border-neutral-200">
        <span>📍 Fulfillment Diagnostics</span>
        <span class="text-emerald-600">● LIVE</span>
      </div>
      <div class="flex justify-between"><span>Origin Center:</span><span class="text-neutral-600">Regional Port Warehouse</span></div>
      <div class="flex justify-between"><span>Logistics Code:</span><span class="text-neutral-600">GEO-POD-GLOBAL</span></div>
      <div class="flex justify-between"><span>Active Currency:</span><span class="text-neutral-600">USD, EUR, GBP (Auto-Adjust)</span></div>
      <div class="flex justify-between"><span>Shipping:</span><span class="text-neutral-600">FREE on Orders > $75.00</span></div>
    </div>
  </div>
</div>`;
    
    res.json({ success: true, result: type === 'brief' ? fallbackBrief : fallbackRich });
  }
});

// 6. BACKEND PRODUCT PERSISTENT UPLOAD
app.post('/api/admin/products', (req, res) => {
  const { name, price, originalPrice, category, image, images, description, isCustomizable, youtubeEmbedCode, sku, colors, sizes, richText, faqs, hasVariants, videoUrl, supplier, packageSize, weight } = req.body;
  if (!name || isNaN(price) || !category || !image || !description) {
    return res.status(400).json({ error: 'Please submit all required product details' });
  }

  const db = readDB();
  const nextId = String(db.products.length > 0 ? Math.max(...db.products.map((p: any) => Number(p.id) || 0)) + 1 : 1);

  const newProduct = {
    id: nextId,
    name,
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : undefined,
    category,
    image,
    images: Array.isArray(images) && images.length > 0 ? images : [image],
    rating: 5.0,
    reviews: 0,
    isCustomizable: Boolean(isCustomizable),
    description,
    youtubeEmbedCode: youtubeEmbedCode || '',
    videoUrl: videoUrl || '',
    sku: sku || `GRO-${category.toUpperCase()}-${nextId}`,
    supplier: supplier || '',
    hasVariants: hasVariants !== undefined ? Boolean(hasVariants) : true,
    colors: Array.isArray(colors) ? colors : [],
    sizes: Array.isArray(sizes) ? sizes : [],
    richText: richText || '',
    faqs: Array.isArray(faqs) ? faqs : [],
    packageSize: packageSize || '',
    weight: weight || '',
    ratingReviews: []
  };

  db.products.unshift(newProduct);
  writeDB(db);

  res.json({ success: true, product: newProduct, products: db.products });
});

// 6b. BACKEND PRODUCTS BATCH IMPORT
app.post('/api/admin/products/bulk', (req, res) => {
  const { products } = req.body;
  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'Please provide an array of products to import' });
  }

  const db = readDB();
  const importedList = [];

  for (const prod of products) {
    const { name, price, originalPrice, category, image, images, description, isCustomizable, sku, colors, sizes, supplier } = prod;
    const nextId = String(db.products.length > 0 ? Math.max(...db.products.map((p: any) => Number(p.id) || 0)) + 1 : 1);
    
    const newProduct = {
      id: nextId,
      name: name || 'Imported Product',
      price: Number(price) || 0,
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category: category || 'women',
      image: image || 'https://images.unsplash.com/photo-1576502200916-3808e07386a5?auto=format&fit=crop&w=400&q=80',
      images: Array.isArray(images) && images.length > 0 ? images : [image || 'https://images.unsplash.com/photo-1576502200916-3808e07386a5?auto=format&fit=crop&w=400&q=80'],
      rating: 5.0,
      reviews: 0,
      isCustomizable: Boolean(isCustomizable),
      description: description || 'Premium product.',
      sku: sku || `GRO-${(category || 'WOMEN').toUpperCase()}-${nextId}`,
      supplier: supplier || '',
      hasVariants: true,
      colors: Array.isArray(colors) ? colors : ['White', 'Black'],
      sizes: Array.isArray(sizes) ? sizes : ['S', 'M', 'L', 'XL'],
      richText: '',
      faqs: [],
      ratingReviews: []
    };

    db.products.unshift(newProduct);
    importedList.push(newProduct);
  }

  writeDB(db);
  res.json({ success: true, count: importedList.length, products: db.products });
});

app.put('/api/admin/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, originalPrice, category, image, images, description, isCustomizable, youtubeEmbedCode, sku, colors, sizes, richText, faqs, hasVariants, videoUrl, supplier, packageSize, weight } = req.body;
  if (!name || isNaN(price) || !category || !image || !description) {
    return res.status(400).json({ error: 'Please submit all required product details' });
  }

  const db = readDB();
  const index = db.products.findIndex((p: any) => String(p.id) === String(id));
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found in database logs' });
  }

  const existing = db.products[index];

  db.products[index] = {
    ...existing,
    name,
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : undefined,
    category,
    image,
    images: Array.isArray(images) && images.length > 0 ? images : [image],
    isCustomizable: Boolean(isCustomizable),
    description,
    youtubeEmbedCode: youtubeEmbedCode || '',
    videoUrl: videoUrl || '',
    sku: sku || existing.sku || `GRO-${category.toUpperCase()}-${id}`,
    supplier: supplier !== undefined ? supplier : (existing.supplier || ''),
    hasVariants: hasVariants !== undefined ? Boolean(hasVariants) : true,
    colors: Array.isArray(colors) ? colors : [],
    sizes: Array.isArray(sizes) ? sizes : [],
    richText: richText || '',
    faqs: Array.isArray(faqs) ? faqs : [],
    packageSize: packageSize || '',
    weight: weight || ''
  };

  writeDB(db);
  res.json({ success: true, product: db.products[index], products: db.products });
});

app.delete('/api/admin/products/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.products = db.products.filter((p: any) => p.id !== id);
  writeDB(db);
  res.json({ success: true, id, products: db.products });
});

// 7. DISCOUNT VOUCHER MANAGEMENT
app.post('/api/admin/coupons', (req, res) => {
  const { code, discount, description, scope, applicableProductIds } = req.body;
  if (!code || isNaN(discount)) {
    return res.status(400).json({ error: 'Code name and discount magnitude are required.' });
  }

  const db = readDB();
  const normalizedCode = code.toUpperCase().trim();
  
  // Remove existing if any
  db.coupons = db.coupons.filter((c: any) => c.code !== normalizedCode);
  db.coupons.push({
    code: normalizedCode,
    discount: Number(discount),
    description: description || `${discount}% Discount Code`,
    scope: scope || 'all',
    applicableProductIds: Array.isArray(applicableProductIds) ? applicableProductIds : []
  });
  
  writeDB(db);
  res.json({ success: true, coupons: db.coupons });
});

app.delete('/api/admin/coupons/:code', (req, res) => {
  const { code } = req.params;
  const db = readDB();
  db.coupons = db.coupons.filter((c: any) => c.code !== code.toUpperCase());
  writeDB(db);
  res.json({ success: true, coupons: db.coupons });
});

// Validate discount code on basket-side
app.get('/api/coupons/validate/:code', (req, res) => {
  const { code } = req.params;
  const db = readDB();
  const found = db.coupons.find((c: any) => c.code === code.toUpperCase().trim());
  if (!found) {
    return res.status(404).json({ error: 'Promo coupon code invalid or has expired.' });
  }
  res.json({ 
    success: true, 
    discount: found.discount, 
    code: found.code,
    scope: found.scope || 'all',
    applicableProductIds: found.applicableProductIds || []
  });
});

// 7. CONTACT US SUBMISSIONS & ADMIN RESPONSE
app.post('/api/contact-us/submit', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Please enter Name, Email, and Message' });
  }

  const db = readDB();
  db.contact_messages = db.contact_messages || [];
  
  const newMessage = {
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    name,
    email,
    subject: subject || 'General Support',
    message,
    submittedAt: new Date().toISOString(),
    replied: false
  };

  db.contact_messages.unshift(newMessage);
  writeDB(db);

  res.json({ success: true, message: 'Message sent successfully!' });
});

app.get('/api/admin/contact-us/messages', (req, res) => {
  const db = readDB();
  db.contact_messages = db.contact_messages || [];
  res.json({ messages: db.contact_messages });
});

app.post('/api/admin/contact-us/reply', async (req, res) => {
  const { id, replyText } = req.body;
  if (!id || !replyText) {
    return res.status(400).json({ error: 'Message ID and Reply Text are required' });
  }

  const db = readDB();
  db.contact_messages = db.contact_messages || [];
  
  const foundMsgIndex = db.contact_messages.findIndex((m: any) => m.id === id);
  if (foundMsgIndex === -1) {
    return res.status(404).json({ error: 'Message not found' });
  }

  const msg = db.contact_messages[foundMsgIndex];
  
  // Try sending actual email via SMTP dynamic configuration if present
  const mailConfig = db.email_config || {};
  const host = mailConfig.smtpHost || process.env.SMTP_HOST;
  const port = mailConfig.smtpPort ? Number(mailConfig.smtpPort) : (process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587);
  const user = mailConfig.smtpUser || process.env.SMTP_USER;
  const pass = mailConfig.smtpPass || process.env.SMTP_PASS;
  const smtpSecure = mailConfig.smtpSecure !== undefined ? mailConfig.smtpSecure : (process.env.SMTP_SECURE === 'true');
  
  let from = 'Grobrav Shop <noreply@grobrav.com>';
  if (mailConfig.senderEmail) {
    const sName = mailConfig.senderName || 'Grobrav Shop';
    from = `"${sName}" <${mailConfig.senderEmail}>`;
  } else if (process.env.SMTP_FROM) {
    from = process.env.SMTP_FROM;
  }

  let emailSent = false;
  let statusMessage = '';

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465 || smtpSecure,
        auth: { user, pass },
      });

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #eaeaea; border-radius: 16px; background-color: #fafafa;">
          <h2 style="color: #111827; border-bottom: 2px solid #eab308; padding-bottom: 10px; font-weight: 800;">HZTzone Support / 客服回复</h2>
          <p>Hi <strong>${msg.name || 'Valued Customer'}</strong>,</p>
          <p>Thank you for reaching out to us. We have received your message regarding: <strong>"${msg.subject}"</strong></p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 12px; font-style: italic; margin: 15px 0; font-size: 13px; color: #4b5563;">
            "${msg.message}"
          </div>
          <p style="font-weight: bold; margin-top: 20px; color: #eab308;">Our Reply / 客服解答:</p>
          <div style="white-space: pre-wrap; font-size: 14px; color: #111827; background-color: #fefbeb; border-left: 4px solid #eab308; padding: 15px; border-radius: 8px; line-height: 1.6;">${replyText}</div>
          <p style="margin-top: 30px; font-size: 12px; color: #9ca3af; border-top: 1px solid #eaeaea; padding-top: 15px;">
            Best regards,<br/>
            <strong>HZTzone Customer Support</strong><br/>
            <a href="https://www.hztzone.com" style="color: #eab308; text-decoration: none; font-weight: bold;">www.hztzone.com</a>
          </p>
        </div>
      `;

      await transporter.sendMail({
        from,
        to: msg.email,
        subject: `Re: [HZTzone Support] ${msg.subject}`,
        html: emailHtml
      });
      emailSent = true;
      statusMessage = 'Reply sent and delivered successfully via SMTP! / 回复已成功通过 SMTP 邮箱发送至用户邮箱！';
    } catch (err: any) {
      console.error('SMTP Reply error:', err);
      statusMessage = 'Logged locally. SMTP send failed: ' + err.message;
    }
  } else {
    statusMessage = 'Sandbox simulation reply saved. To deliver real emails, please complete your SMTP Mailbox setup. / 仿真回复已保存（配置发信邮箱后，用户将能收到真实邮件）';
  }

  // Update record
  msg.replied = true;
  msg.replyText = replyText;
  msg.repliedAt = new Date().toISOString();

  writeDB(db);

  res.json({ success: true, message: statusMessage, msg });
});

// 8. EDM MAIL SERVICES: Newsletters subscribe & Sending
app.post('/api/edm/subscribe', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const db = readDB();
  const alreadySubbed = db.edm_subscribers.find((s: any) => s.email.toLowerCase() === email.toLowerCase());
  
  if (!alreadySubbed) {
    db.edm_subscribers.push({
      email: email.toLowerCase(),
      date: new Date().toISOString().split('T')[0]
    });
    writeDB(db);
  }

  res.json({ success: true, message: 'Thank you for subscribing to HZTzone Newsletters! 10% Coupon HZT10 shared to inbox!' });
});

// List Subscribers for dashboard
app.get('/api/admin/edm/subscribers', (req, res) => {
  const db = readDB();
  res.json({ subscribers: db.edm_subscribers, campaigns: db.edm_campaigns });
});

// Get EDM SMTP Config
app.get('/api/admin/edm/config', (req, res) => {
  const db = readDB();
  res.json({
    config: db.email_config || {
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      smtpUser: process.env.SMTP_USER || '',
      smtpPass: process.env.SMTP_PASS || '',
      smtpSecure: process.env.SMTP_SECURE === 'true',
      senderName: 'HZTzone Shop',
      senderEmail: process.env.SMTP_FROM || 'noreply@hztzone.com'
    }
  });
});

// Update EDM SMTP Config
app.post('/api/admin/edm/config', (req, res) => {
  const { smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, senderName, senderEmail } = req.body;
  const db = readDB();
  db.email_config = {
    smtpHost: smtpHost || '',
    smtpPort: smtpPort ? Number(smtpPort) : 587,
    smtpUser: smtpUser || '',
    smtpPass: smtpPass || '',
    smtpSecure: !!smtpSecure,
    senderName: senderName || 'HZTzone Shop',
    senderEmail: senderEmail || 'noreply@hztzone.com'
  };
  writeDB(db);
  res.json({ success: true, config: db.email_config });
});

// Create news EDM campaign (simulates sending EDM and gives AI text option)
app.post('/api/admin/edm/send', async (req, res) => {
  const { title, content, recipients } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const db = readDB();
  
  // Decide target recipients
  let targetRecipients: any[] = [];
  if (Array.isArray(recipients) && recipients.length > 0) {
    targetRecipients = recipients;
  } else {
    // Default to all newsletter subscribers
    targetRecipients = db.edm_subscribers.map((s: any) => ({
      name: s.email.split('@')[0],
      email: s.email
    }));
  }

  const recipientsCount = targetRecipients.length;

  // Let's set up SMTP transporter if configured (from saved DB config, falling back to process.env)
  const mailConfig = db.email_config || {};
  const host = mailConfig.smtpHost || process.env.SMTP_HOST;
  const port = mailConfig.smtpPort ? Number(mailConfig.smtpPort) : (process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587);
  const user = mailConfig.smtpUser || process.env.SMTP_USER;
  const pass = mailConfig.smtpPass || process.env.SMTP_PASS;
  const smtpSecure = mailConfig.smtpSecure !== undefined ? mailConfig.smtpSecure : (process.env.SMTP_SECURE === 'true');
  
  let from = 'Grobrav Shop <noreply@grobrav.com>';
  if (mailConfig.senderEmail) {
    const sName = mailConfig.senderName || 'Grobrav Shop';
    from = `"${sName}" <${mailConfig.senderEmail}>`;
  } else if (process.env.SMTP_FROM) {
    from = process.env.SMTP_FROM;
  }

  let smtpConfigured = false;
  let transporter: any = null;

  if (host && user && pass) {
    smtpConfigured = true;
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465 || smtpSecure,
      auth: {
        user,
        pass,
      },
    });
  }

  const dispatchedDetails: any[] = [];

  for (const recipient of targetRecipients) {
    const rName = recipient.name || recipient.email.split('@')[0];
    const rEmail = recipient.email;

    // Replace dynamic placeholders in subject and content
    // {{name}} or {{customerName}} -> rName
    // {{email}} -> rEmail
    // {{store_name}} -> HZTzone
    let personalizedSubject = title
      .replace(/\{\{name\}\}/gi, rName)
      .replace(/\{\{customerName\}\}/gi, rName)
      .replace(/\{\{email\}\}/gi, rEmail)
      .replace(/\{\{store_name\}\}/gi, 'HZTzone');

    let personalizedContent = content
      .replace(/\{\{name\}\}/gi, rName)
      .replace(/\{\{customerName\}\}/gi, rName)
      .replace(/\{\{email\}\}/gi, rEmail)
      .replace(/\{\{store_name\}\}/gi, 'HZTzone');

    let status = 'Simulated / Logged';
    let errorMessage = '';

    if (smtpConfigured && transporter) {
      try {
        await transporter.sendMail({
          from,
          to: rEmail,
          subject: personalizedSubject,
          html: personalizedContent,
        });
        status = 'Delivered (SMTP)';
      } catch (err: any) {
        console.error(`Error sending email to ${rEmail}:`, err);
        status = 'Failed (SMTP)';
        errorMessage = err.message || 'SMTP Error';
      }
    }

    dispatchedDetails.push({
      email: rEmail,
      name: rName,
      subject: personalizedSubject,
      status,
      error: errorMessage || undefined,
      dispatchedAt: new Date().toISOString()
    });
  }

  const newCampaign = {
    id: String(Date.now()),
    title,
    content,
    date: new Date().toISOString().split('T')[0],
    recipientsCount,
    recipientsList: targetRecipients,
    dispatchedDetails,
    smtpConfigured
  };

  db.edm_campaigns = db.edm_campaigns || [];
  db.edm_campaigns.unshift(newCampaign);
  writeDB(db);

  let message = `Campaign registered successfully.`;
  if (smtpConfigured) {
    message = `EDM Campaign successfully delivered via SMTP to ${recipientsCount} recipient(s)!`;
  } else {
    message = `EDM Campaign completed via Sandbox Simulation. (To send real emails, please define SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in Settings/Environment Variables).`;
  }

  res.json({ 
    success: true, 
    campaign: newCampaign, 
    message,
    smtpConfigured,
    subscribersEmailedCount: recipientsCount
  });
});

// Draft Newsletter with Gemini AI!
app.post('/api/admin/edm/draft-ai', async (req, res) => {
  const { topic, lang } = req.body;
  const ai = getGemini();
  const selectedLang = lang || 'English';

  if (!ai) {
    if (selectedLang.toLowerCase().includes('chinese') || selectedLang.includes('中文')) {
      const isTraditional = selectedLang.includes('traditional') || selectedLang.includes('繁体') || selectedLang.includes('繁體');
      return res.json({
        title: isTraditional ? `特別心意：Grobrav 專屬新一季高端定制系列發布！` : `特别心意：Grobrav 专属新一季高端定制系列发布！`,
        content: isTraditional 
          ? `親爱的訂閱用戶，\n\n我們非常激動地向您介紹有關 ${topic || '我們的高品質定制印花產品'} 的最新動態。本週結賬使用優惠代碼 GROBRAV10 即可立享 10% 的專屬折扣！\n\n祝好，\nGrobrav 奢華定制工坊團隊`
          : `亲爱的订阅用户，\n\n我们非常激动地向您介绍有关 ${topic || '我们的高质量定制印花产品'} 的最新动态。本周结账使用优惠代码 GROBRAV10 即可立享 10% 的专属折扣！\n\n祝好，\nGrobrav 奢华定制工坊团队`
      });
    }
    return res.json({ 
      title: `Special New Season Promotion on Grobrav!`,
      content: `Hello valued subscriber,\n\nWe are excited to share some amazing news about: ${topic || 'our high quality Custom Apparels'}. Use promo voucher GROBRAV10 to secure 10% off your purchase this week!\n\nWarm regards,\nThe Grobrav Customer Care Team`
    });
  }

  try {
    const prompt = `Write a premium, elegant marketing newsletter email about: "${topic || 'General Season Sale'}". The brand name is "Grobrav", a luxurious print-on-demand custom print shop selling couples hoodies, custom tees, mugs, etc. 
CRITICAL REQUIREMENT: The newsletter title (Subject Line) and content body MUST be written entirely and fluently in the requested language: "${selectedLang}".
Return a raw JSON structure with format: { "title": "Subject Line Text", "content": "Body Paragraphs Content" }. Use HTML tags inside the "content" to make it look beautifully structured (e.g. bolding, paragraphs, line breaks). Do not output anything but the JSON parsed object, starting with { and ending with }.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });
    
    const textOutput = response.text || '';
    // Parse JSON safely
    const jsonMatch = textOutput.substring(textOutput.indexOf('{'), textOutput.lastIndexOf('}') + 1);
    const parsed = JSON.parse(jsonMatch);
    res.json(parsed);
  } catch (err) {
    console.info('Gemini EDM drafter currently offline. Utilizing premium pre-composed subscriber copy instead.');
    if (selectedLang.toLowerCase().includes('chinese') || selectedLang.includes('中文')) {
      const isTraditional = selectedLang.includes('traditional') || selectedLang.includes('繁体') || selectedLang.includes('繁體');
      return res.json({
        title: isTraditional ? `探索 Grobrav 的精美手工定制禮物 🎁` : `探索 Grobrav 的精美手工定制礼物 🎁`,
        content: isTraditional
          ? `你好！\n\n快來看看 Grobrav 爲您精心挑選的各類高品質手工印花定制品。包括情侶高克重連帽衛衣、簡約字母刺繡陶瓷杯、極簡美式街頭T恤。\n\n今天下單使用折扣碼：GROBRAV10 可立即享 10% 滿減！\n\n祝您生活愉快，\nGrobrav 團隊`
          : `你好！\n\n快来看看 Grobrav 为您精心挑选的各类高质量手工印花定制品。包括情侣高克重连帽卫衣、简约字母刺绣陶瓷杯、极简美式街头T恤。\n\n今天下单使用折扣码：GROBRAV10 可立即享 10% 满减！\n\n祝您生活愉快，\nGrobrav 团队`
      });
    }
    res.json({ 
      title: `Discover customized comfort products on Grobrav`,
      content: `Hello!\n\nCheck out the premium selection of custom print items of Grobrav. Discover personalized couples hoodies, line art ceramic mugs, and heavyweight urban streetwear.\n\nEnjoy 10% coupon code off today: GROBRAV10.\n\nWarmest regards,\nGrobrav Team`
    });
  }
});

// 9. REVIEWS POSTING & ADMIN DELETING
app.post('/api/products/:id/reviews', (req, res) => {
  const { id } = req.params;
  const { userName, rating, comment } = req.body;

  if (!userName || !rating || !comment) {
    return res.status(400).json({ error: 'Missing name, rating, or message comments' });
  }

  const db = readDB();
  const productIndex = db.products.findIndex((p: any) => p.id === id);
  if (productIndex === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const product = db.products[productIndex];
  if (!product.ratingReviews) {
    product.ratingReviews = [];
  }

  const newReview = {
    id: 'rev-' + Date.now(),
    userName,
    rating: Number(rating),
    date: new Date().toISOString().split('T')[0],
    comment,
    images: req.body.images || [],
    video: req.body.video || null
  };

  product.ratingReviews.push(newReview);
  product.reviews = product.ratingReviews.length;
  // Re-calculate rating
  const totalRating = product.ratingReviews.reduce((sum: number, r: any) => sum + r.rating, 0);
  product.rating = Number((totalRating / product.reviews).toFixed(1));

  db.products[productIndex] = product;
  writeDB(db);

  res.json({ success: true, reviews: product.ratingReviews, rating: product.rating, count: product.reviews });
});

app.delete('/api/admin/products/:id/reviews/:reviewId', (req, res) => {
  const { id, reviewId } = req.params;
  const db = readDB();
  const productIndex = db.products.findIndex((p: any) => p.id === id);
  if (productIndex === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const product = db.products[productIndex];
  product.ratingReviews = product.ratingReviews.filter((r: any) => r.id !== reviewId);
  product.reviews = product.ratingReviews.length;

  if (product.reviews > 0) {
    const totalRating = product.ratingReviews.reduce((sum: number, r: any) => sum + r.rating, 0);
    product.rating = Number((totalRating / product.reviews).toFixed(1));
  } else {
    product.rating = 5.0;
  }

  db.products[productIndex] = product;
  writeDB(db);

  res.json({ success: true, reviews: product.ratingReviews, rating: product.rating, count: product.reviews, products: db.products });
});

// 10. CUSTOM CHECKOUT ORDER STORAGE & SUBMISSIONS
app.post('/api/orders', (req, res) => {
  const { 
    items, 
    customerName, 
    email, 
    address, 
    total, 
    paymentMethod, 
    discountCode, 
    customText,
    phone,
    city,
    state,
    zipCode,
    country,
    streetAddress,
    apartment
  } = req.body;
  if (!items || !customerName || !email || !address) {
    return res.status(400).json({ error: 'Incomplete Checkout Form. Please specify shipping address.' });
  }

  const db = readDB();
  const orderId = 'GRO-' + Math.floor(100000 + Math.random() * 900000);

  const newOrder = {
    id: orderId,
    date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    customerName,
    email: email.toLowerCase(),
    address,
    paymentMethod,
    itemsCount: items.length,
    total: Number(total),
    discountCode: discountCode || '',
    status: 'In Production',
    customText: customText || '',
    phone: phone || '',
    city: city || '',
    state: state || '',
    zipCode: zipCode || '',
    country: country || '',
    streetAddress: streetAddress || '',
    apartment: apartment || '',
    items: items.map((i: any) => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      color: i.selectedColor || i.color || '',
      size: i.selectedSize || i.size || ''
    }))
  };

  db.orders.unshift(newOrder);
  writeDB(db);

  res.json({ success: true, orderId, order: newOrder });
});

// Admin update shipping status of an order
app.post('/api/admin/orders/:id/ship', (req, res) => {
  const { id } = req.params;
  const { carrier, trackingNumber, status } = req.body;

  const db = readDB();
  const index = db.orders.findIndex((o: any) => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  db.orders[index].status = status || 'Shipped';
  db.orders[index].carrier = carrier || 'DHL Express';
  db.orders[index].trackingNumber = trackingNumber || '';
  db.orders[index].trackingUrl = trackingNumber ? `https://www.google.com/search?q=${encodeURIComponent((carrier || 'DHL Express') + " " + trackingNumber)}` : '';
  db.orders[index].updatedAt = new Date().toISOString();

  writeDB(db);
  res.json({ success: true, order: db.orders[index] });
});

// Admin bulk-update shipping status of orders
app.post('/api/admin/orders/bulk-ship', (req, res) => {
  const { shipments } = req.body; // array of { orderId, carrier, trackingNumber, status }
  if (!Array.isArray(shipments)) {
    return res.status(400).json({ error: 'Shipments list must be provided as a JSON array' });
  }

  const db = readDB();
  let updatedCount = 0;

  shipments.forEach((s: any) => {
    if (!s.orderId) return;
    const cleanId = String(s.orderId).trim().toUpperCase();
    const index = db.orders.findIndex((o: any) => String(o.id).trim().toUpperCase() === cleanId);
    if (index !== -1) {
      db.orders[index].status = s.status || 'Shipped';
      db.orders[index].carrier = s.carrier || 'DHL Express';
      db.orders[index].trackingNumber = s.trackingNumber || '';
      db.orders[index].trackingUrl = s.trackingNumber ? `https://www.google.com/search?q=${encodeURIComponent((s.carrier || 'DHL Express') + " " + s.trackingNumber)}` : '';
      db.orders[index].updatedAt = new Date().toISOString();
      updatedCount++;
    }
  });

  writeDB(db);
  res.json({ success: true, updatedCount });
});

// Get single order status for Track Order feature
app.get('/api/orders/track', (req, res) => {
  const { orderId, email } = req.query;
  if (!orderId || !email) {
    return res.status(400).json({ error: 'Missing Order Reference Code or Registered Email address.' });
  }

  const db = readDB();
  const found = db.orders.find(
    (o: any) => o.id.toUpperCase().trim() === (orderId as string).toUpperCase().trim() && 
    o.email.toLowerCase().trim() === (email as string).toLowerCase().trim()
  );

  if (!found) {
    return res.status(404).json({ error: 'No matching order checkout log found in our database.' });
  }

  res.json(found);
});

// 10b. POD MERCHANT INTEGRATION HOOK - SYNC SHIPMENT & TRACKING DETAILS
app.post('/api/integrations/pod/shipping', (req, res) => {
  const { orderId, trackingNumber, carrier, trackingUrl, status } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'orderId reference code is required for POD syncing' });
  }

  const db = readDB();
  const index = db.orders.findIndex(
    (o: any) => o.id.toUpperCase().trim() === (orderId as string).toUpperCase().trim()
  );

  if (index === -1) {
    return res.status(404).json({ error: 'Order reference not found in store logs' });
  }

  // Update order shipment tracking fields
  db.orders[index].status = status || 'Shipped';
  db.orders[index].trackingNumber = trackingNumber || 'TRK' + Math.floor(Math.random() * 90000000 + 10000000);
  db.orders[index].carrier = carrier || 'DHL Global Express';
  db.orders[index].trackingUrl = trackingUrl || `https://www.dhl.com/en/express/tracking.html?AWB=${db.orders[index].trackingNumber}`;
  db.orders[index].updatedAt = new Date().toISOString();

  writeDB(db);

  res.json({
    success: true,
    message: 'POD shipping details successfully synchronized!',
    order: db.orders[index]
  });
});

// 11. AI CUSTOMER SERVICE CHAT ENDPOINT WITH CONTEXT GROUNDING
app.post('/api/ai-chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Empty message text' });
  }

  const db = readDB();
  const productsListSummary = db.products.map((p: any) => 
    `- Product ID: ${p.id}, Name: ${p.name}, Price: $${p.price}, Category: ${p.category}, Highlights: ${p.description}. Customization supported: ${p.isCustomizable ? 'Yes' : 'No'}`
  ).join('\n');

  const systemInstruction = `You are the highly professional customer care AI assistant for "HZTzone" - a premium smart home appliances, high-quality pet supplies, and professional beauty & personal care products e-commerce brand.
Our current top-tier collections are: Timed smart feeders, premium filtered pet water fountains, pet locator collars with LTE tracking, professional ionic hair dryers, and ultrasonic facial spatulas.

Here is the official products catalog in database:
${productsListSummary}

HZTzone Support Policies & FAQs to guide users:
- Brand Name: HZTzone (Ensure you only address the store as HZTzone)
- Shipping Time: Product verification and packaging takes 1-2 business days. Ground tracked shipping takes an additional 5-7 business days.
- Return & Warranty Policy: High-quality appliances and electronic items are protected by a 1 to 2-year warranty against failures. If any product is damaged or defective at delivery, free replacements are sent out immediately.
- Payment Methods: We support secure integrated checkouts via PayPal holding sandboxes and standard encrypted card payments (Visa/Mastercard/Amex).
- Order Tracking: Customers can query their current orders on the "Track Order" page using references like "HZT-839210".
- Tone: Extremely polite, luxury tech brand manager tone. Helpful, prompt, elegant, and concise. Make responses visually gorgeous with proper formatting and bullets!`;

  const ai = getGemini();
  if (!ai) {
    // Elegant fallback simulation
    return res.json({ 
      reply: `Hello! Welcome to **HZTzone Smart Living Assistant**. I am happy to assist you today.\n\nSince our active AI API key setup is pending, here is some quick general guidance:\n\n1. **Smart Pet Products:** Outstanding timed smart dispensers, water fountains, and LTE trackers.\n2. **Ionic Hair Dryers:** 110,000 RPM high-speed motor for fast drying and elite hair care.\n3. **Promo Coupon:** Try checkout discount code **HZT10** for 10% off!\n\nPlease let me know if you would like me to detail product specifications or track your active order!` 
    });
  }

  try {
    const formattedHistory = Array.isArray(history) ? history.map((h: any) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    })) : [];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemInstruction}\n\nClient conversation history is passed, address current question: "${message}"` }] },
        ...formattedHistory
      ],
    });

    res.json({ reply: response.text || "Hello! Let me know how I can guide your shopping experience today!" });
  } catch (err: any) {
    console.info('Gemini support bot currently offline. Utilizing premium support policy knowledge-base fallback.');
    res.json({ 
      reply: `Thank you for reaching out to **HZTzone Support**. Let me help you with our premium collection specs:\n\n- We offer timing automatic pet feeders ($89.99), ionic high-speed hair dryers ($129.99), and sonic facial spatulas ($45.99).\n- Use promo voucher **HZT10** for a 10% discount on your purchase!\n- If you need to check order status, please head over to the **Track Order** tab and enter your HZT-XXXXXX code!` 
    });
  }
});

// 11.5. SECURE GEMINI PROXY FOR WORD SUGGESTIONS AND DESIGN GENERATION
app.post('/api/gemini/generate-text', async (req, res) => {
  const { productName, occasion, recipient } = req.body;
  const ai = getGemini();

  if (!ai) {
    return res.json({
      ideas: [
        "Together since " + new Date().getFullYear(),
        "HZTzone Smart Care",
        "Love and Wellness"
      ]
    });
  }

  try {
    const prompt = `
      I am buying a high-end custom print-on-demand product: "${productName || 'Premium item'}".
      It is for: "${recipient || 'Loved one'}".
      The occasion/vibe is: "${occasion || 'Special event'}".
      
      Generate 3 elegant, short, and highly emotional or stylish phrases (max 10 words each) suitable for luxury merchandise.
      Return ONLY a JSON array of strings. Do not include markdown blocks.
      Example: ["Forever Yours", "Est. 2024", "Soulmate Connection"]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty text returned from Gemini");
    }

    const jsonMatch = text.substring(text.indexOf('['), text.lastIndexOf(']') + 1);
    const ideas = JSON.parse(jsonMatch || text);
    res.json({ ideas: Array.isArray(ideas) ? ideas : [] });
  } catch (error) {
    console.info("Gemini design tag ideas currently offline. Deploying classic high-quality typographic signatures.");
    res.json({
      ideas: [
        "Together since " + new Date().getFullYear(),
        "HZTzone Smart Care",
        "Love and Wellness"
      ]
    });
  }
});

app.post('/api/gemini/generate-image', async (req, res) => {
  const { prompt } = req.body;
  const ai = getGemini();

  // Helper utility to download and preserve fallbacks/external illustrations locally
  const saveFallbackLocally = async (url: string) => {
    try {
      const fetchResponse = await fetch(url);
      const arrayBuffer = await fetchResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      const filename = `ai_gen_${Date.now()}_fallback_${Math.floor(Math.random() * 10000)}.jpg`;
      fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
      return `/uploads/${filename}`;
    } catch (err) {
      console.error('Error downloading and localizing fallback image:', err);
      return url; // fallback to external url directly if write fails
    }
  };

  // Enhance prompt with highly relevant POD design restrictions and copyright-safe clauses (Requirement 3)
  let enhancedPrompt = prompt || 'beautiful clean minimalist product icon, premium vector art illustration, isolated plain background';
  if (!enhancedPrompt.includes('sublimation')) {
    enhancedPrompt += `, perfect for high-end custom dye sublimation printing on sweatshirts, apparel, mugs, home decor, 100% original copyright-free vector design, no trademarked characters, no logo text overlays`;
  }

  if (!ai) {
    const fallbackSeed = Math.floor(Math.random() * 1000);
    const resolvedLocalUrl = await saveFallbackLocally(`https://picsum.photos/seed/${fallbackSeed}/600/600`);
    return res.json({ image: resolvedLocalUrl });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: enhancedPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: '1:1'
        }
      }
    });

    let base64Image = null;
    let mimeType = 'image/png';
    let rawData = null;
    if (response && response.candidates && response.candidates[0].content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          rawData = part.inlineData.data;
          mimeType = part.inlineData.mimeType || 'image/png';
          base64Image = `data:${mimeType};base64,${rawData}`;
          break;
        }
      }
    }

    if (rawData) {
      // Save newly captured AI base64 image on the local server storage (Requirement 1)
      const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      let ext = mimeType.split('/')[1] || 'png';
      if (ext === 'jpeg') ext = 'jpg';
      const filename = `ai_gen_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
      const buffer = Buffer.from(rawData, 'base64');
      fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);

      const localFileUrl = `/uploads/${filename}`;
      return res.json({ image: localFileUrl });
    }
    
    throw new Error('Image generation did not return inlineData image bytes');
  } catch (error) {
    console.info("AI Image generation currently throttled or offline. Localizing high-quality vector illustration presets.");
    const fallbackSeed = Math.floor(Math.random() * 1000);
    const resolvedLocalUrl = await saveFallbackLocally(`https://picsum.photos/seed/${fallbackSeed}/600/600`);
    res.json({ image: resolvedLocalUrl });
  }
});

// 12. TELEMETRY GOOGLE ANALYTICS SIMULATION EVENTS
app.post('/api/ga', (req, res) => {
  const { eventType, details } = req.body;
  if (!eventType) return res.status(400).json({ error: 'Missing eventType' });
  
  const db = readDB();
  const nextId = String(db.ga_logs.length + 1);
  const logEntry = {
    id: nextId,
    type: eventType,
    details: details || {},
    date: new Date().toISOString().split('T')[0],
    ip: req.ip || '127.0.0.1'
  };
  
  db.ga_logs.push(logEntry);
  writeDB(db);
  res.json({ success: true });
});

app.get('/api/admin/ga/stats', (req, res) => {
  const db = readDB();
  const logs = db.ga_logs || [];
  
  // Calculate analytics metric ratios
  const pageviews = logs.filter((l: any) => l.type === 'page_view').length;
  const product_views = logs.filter((l: any) => l.type === 'product_view').length;
  const carts = logs.filter((l: any) => l.type === 'add_to_cart').length;
  const checkouts = logs.filter((l: any) => l.type === 'begin_checkout').length;
  const purchases = db.orders.length; // Real settled orders are converted purchases

  // Dynamic traffic channels aggregation
  const channels: { [key: string]: number } = {
    direct: 0,
    google: 0,
    facebook: 0,
    tiktok: 0,
    instagram: 0,
    twitter: 0,
    pinterest: 0,
    email: 0,
    referral: 0
  };

  // Count from actual logs
  logs.forEach((log: any) => {
    const ch = log.details?.channel || 'direct';
    if (channels[ch] !== undefined) {
      channels[ch] += 1;
    } else {
      channels[ch] = 1;
    }
  });

  // Remove keys with 0 count to only show real channels that have actual traffic, but keep at least 'direct' if all are 0
  Object.keys(channels).forEach(key => {
    if (channels[key] === 0 && key !== 'direct') {
      delete channels[key];
    }
  });

  const totalSalesFromDb = db.orders.reduce((acc: number, item: any) => acc + (Number(item.total) || 0), 0);

  res.json({
    logs: logs.slice(-50), // last 50
    pageViews: pageviews,
    totalSales: totalSalesFromDb,
    ordersCount: db.orders.length,
    metrics: {
      pageviews: pageviews, 
      product_views: product_views,
      carts: carts,
      checkouts: checkouts,
      purchases: purchases,
      liveUsers: logs.filter((l: any) => {
        // Simple active in last 10 minutes filter
        const tenMinsAgo = Date.now() - 10 * 60 * 1000;
        return l.timestamp && new Date(l.timestamp).getTime() > tenMinsAgo;
      }).length || 1
    },
    channels
  });
});

// Dev/Prod Server integrations

const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HZTzone Full-Stack Server listening on http://0.0.0.0:${PORT}`);
});
