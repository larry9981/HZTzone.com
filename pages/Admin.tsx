import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../components/AppContext';
import { api } from '../services/api';
import { 
  Settings, CreditCard, Shield, Database, Save, Trash2, Plus, Edit,
  RefreshCw, CheckCircle, AlertTriangle, Play, FileText, 
  TrendingUp, ShoppingBag, Users, Check, Lock, Mail, Sparkles, Loader2, Video, Globe, Eye, Code2, Upload,
  Image as ImageIcon, Truck, Download, UploadCloud, Search, Info, MessageSquare
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import * as XLSX from 'xlsx';

const uploadFileWithProgress = (
  url: string,
  body: any,
  onProgress: (percent: number) => void
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          resolve({ success: true, url: '' });
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.error || 'Upload failed'));
        } catch (e) {
          reject(new Error('Upload failed'));
        }
      }
    };
    
    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };
    
    xhr.send(JSON.stringify(body));
  });
};

export const Admin: React.FC = () => {
  const { products, coupons, categories, orders, refreshState, t, trackEvent, contactInfo, setContactInfo, pagesContent, setPagesContent, pixelSettings, setPixelSettings } = useApp();
  
  // Backend language toggle state (Chinese/English supporting)
  const [adminLang, setAdminLang] = useState<'zh' | 'en'>('zh');
  const al = (zh: string, en: string) => adminLang === 'zh' ? zh : en;
  
  // Login flow
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('admin@hztzone.com');
  const [adminPassword, setAdminPassword] = useState('admin');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Security logs & warnings state
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [securityLogsLoading, setSecurityLogsLoading] = useState(false);
  const [defaultPassWarning, setDefaultPassWarning] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'gateways' | 'products' | 'categories' | 'coupons' | 'edm' | 'reviews' | 'profile' | 'contact' | 'pages_content' | 'pixels' | 'support_messages' | 'warranties'>('stats');

  // Extended Warranty states
  const [warranties, setWarranties] = useState<any[]>([]);
  const [warrantiesLoading, setWarrantiesLoading] = useState(false);
  const [warrantySearchTerm, setWarrantySearchTerm] = useState('');

  // Order Management States
  const [selectedOrderForView, setSelectedOrderForView] = useState<any | null>(null);
  const [selectedOrderForShip, setSelectedOrderForShip] = useState<any | null>(null);
  const [shipCarrier, setShipCarrier] = useState('');
  const [shipTrackingNumber, setShipTrackingNumber] = useState('');
  const [shipStatus, setShipStatus] = useState('Shipped');
  const [isShippingLoading, setIsShippingLoading] = useState(false);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkImportCsv, setBulkImportCsv] = useState('');
  const [bulkImportFeedback, setBulkImportFeedback] = useState('');
  const [bulkImportError, setBulkImportError] = useState('');

  // Delete confirmation modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalTitle, setDeleteModalTitle] = useState('');
  const [deleteModalDesc, setDeleteModalDesc] = useState('');
  const [onConfirmDelete, setOnConfirmDelete] = useState<(() => void) | null>(null);

  const triggerDeleteConfirmation = (title: string, desc: string, action: () => void) => {
    setDeleteModalTitle(title);
    setDeleteModalDesc(desc);
    setOnConfirmDelete(() => action);
    setDeleteModalOpen(true);
  };

  const filteredOrders = useMemo(() => {
    return (orders || []).filter((ord: any) => {
      const searchLower = orderSearchTerm.toLowerCase();
      const idMatch = String(ord.id || '').toLowerCase().includes(searchLower);
      const nameMatch = String(ord.customerName || '').toLowerCase().includes(searchLower);
      const emailMatch = String(ord.email || '').toLowerCase().includes(searchLower);
      const matchesSearch = !orderSearchTerm || idMatch || nameMatch || emailMatch;

      const matchesStatus = orderStatusFilter === 'all' || 
        String(ord.status || '').trim().toLowerCase() === orderStatusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearchTerm, orderStatusFilter]);
  
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');

  // Pixel and SEO parameters
  const [facebookPixelField, setFacebookPixelField] = useState('');
  const [googleTagField, setGoogleTagField] = useState('');
  const [pixelLoading, setPixelLoading] = useState(false);

  // Contact & Slogan states
  const [storeEmail, setStoreEmail] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeSlogan, setStoreSlogan] = useState('');
  const [storeLoading, setStoreLoading] = useState(false);

  // Dynamic Shipping configuration states
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('75.00');
  const [standardShippingFee, setStandardShippingFee] = useState('5.99');
  const [standardDeliveryTime, setStandardDeliveryTime] = useState('5-7 business days');
  const [expressShippingFee, setExpressShippingFee] = useState('15.00');
  const [expressDeliveryTime, setExpressDeliveryTime] = useState('2-3 business days');
  const [shippingLoading, setShippingLoading] = useState(false);

  // Support / Contact Us messages states
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [supportMessagesLoading, setSupportMessagesLoading] = useState(false);
  const [replyTextMap, setReplyTextMap] = useState<{ [id: string]: string }>({});
  const [replyLoadingId, setReplyLoadingId] = useState<string | null>(null);

  // Manageable pages content states
  const [shippingContent, setShippingContent] = useState('');
  const [returnsContent, setReturnsContent] = useState('');
  const [sizeGuideContent, setSizeGuideContent] = useState('');
  const [privacyContent, setPrivacyContent] = useState('');
  const [termsContent, setTermsContent] = useState('');
  const [pagesLoading, setPagesLoading] = useState(false);

  // Change admin password inputs
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [changePassLoading, setChangePassLoading] = useState(false);

  // Payment configuration bindings
  const [paypalEnabled, setPaypalEnabled] = useState(true);
  const [paypalMode, setPaypalMode] = useState<'sandbox' | 'live'>('sandbox');
  const [paypalClientId, setPaypalClientId] = useState('');
  const [cardEnabled, setCardEnabled] = useState(true);
  const [cardMode, setCardMode] = useState<'sandbox' | 'live'>('sandbox');
  const [gatewaysLoading, setGatewaysLoading] = useState(false);

  // Product uploader inputs
  const [prodTitle, setProdTitle] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('women');
  const [prodPrice, setProdPrice] = useState('');
  const [prodOriginalPrice, setProdOriginalPrice] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodYoutube, setProdYoutube] = useState('');
  const [productLoading, setProductLoading] = useState(false);

  // Extended product states for SKU, up to 8 uploads, double-variants, rich text columns & Q&A
  const [prodSKU, setProdSKU] = useState('');
  const [prodSupplier, setProdSupplier] = useState('');
  const [prodPackageSize, setProdPackageSize] = useState('');
  const [prodWeight, setProdWeight] = useState('');
  const [prodHasVariants, setProdHasVariants] = useState(true);
  const [prodImages, setProdImages] = useState<string[]>([]); // holds up to 8 images
  const [prodColors, setProdColors] = useState('White, Black, Pink, Navy');
  const [prodSizes, setProdSizes] = useState('XS, S, M, L, XL, XXL');
  const [prodRichText, setProdRichText] = useState('');
  const [prodFaqs, setProdFaqs] = useState<Array<{ question: string; answer: string }>>([]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isBulkProdOpen, setIsBulkProdOpen] = useState(false);
  const [bulkProdCsv, setBulkProdCsv] = useState('');
  const [bulkProdFeedback, setBulkProdFeedback] = useState('');
  const [bulkProdError, setBulkProdError] = useState('');
  const [isBulkProdLoading, setIsBulkProdLoading] = useState(false);
  const [prodVideoUrl, setProdVideoUrl] = useState('');
  const [videoUploading, setVideoUploading] = useState(false);

  // Upload progress tracking states
  const [primaryImageProgress, setPrimaryImageProgress] = useState<number | null>(null);
  const [slotImageProgress, setSlotImageProgress] = useState<{ [key: number]: number }>({});
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [richUploadProgress, setRichUploadProgress] = useState<{ [key: number]: number }>({});

  // AI-Writing input states
  const [briefAiPrompt, setBriefAiPrompt] = useState('');
  const [briefAiLoading, setBriefAiLoading] = useState(false);
  const [richAiPrompt, setRichAiPrompt] = useState('');
  const [richAiLoading, setRichAiLoading] = useState(false);

  // Rich specification 4 local images and layouts
  const [richImages, setRichImages] = useState<string[]>(['', '', '', '']);
  const [selectedLayout, setSelectedLayout] = useState<'grid' | 'staggered' | 'banner' | 'features' | 'editorial'>('grid');

  // Category items inputs
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatSublabel, setNewCatSublabel] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Coupons inputs
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('15');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponScope, setCouponScope] = useState<'all' | 'specific'>('all');
  const [couponSelectedProducts, setCouponSelectedProducts] = useState<string[]>([]);

  // Navigation menu custom additions
  const [navMenus, setNavMenus] = useState<any[]>([]);
  const [navTitle, setNavTitle] = useState('');
  const [navPath, setNavPath] = useState('');
  const [navSaving, setNavSaving] = useState(false);

  // EDM Newsletter campaign form
  const [edmTopicPrompt, setEdmTopicPrompt] = useState('');
  const [edmNewsletterTitle, setEdmNewsletterTitle] = useState('');
  const [edmNewsletterContent, setEdmNewsletterContent] = useState('');
  const [draftingAI, setDraftingAI] = useState(false);
  const [dispatchingEDM, setDispatchingEDM] = useState(false);
  const [edmSubscribers, setEdmSubscribers] = useState<any[]>([]);
  const [edmCampaigns, setEdmCampaigns] = useState<any[]>([]);
  const [edmRecipientType, setEdmRecipientType] = useState<'all' | 'specific'>('all');
  const [edmSourceType, setEdmSourceType] = useState<'subscribers' | 'orderCustomers' | 'all'>('all');
  const [edmSelectedRecipients, setEdmSelectedRecipients] = useState<string[]>([]);
  const [edmEditorTab, setEdmEditorTab] = useState<'edit' | 'preview'>('edit');
  const [edmRecipientSearch, setEdmRecipientSearch] = useState('');
  const [edmDraftLanguage, setEdmDraftLanguage] = useState<string>('Simplified Chinese');
  const [edmSelectedCountry, setEdmSelectedCountry] = useState<string>('all');

  // Custom SMTP Configurations
  const [edmSmtpConfig, setEdmSmtpConfig] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpSecure: false,
    senderName: 'Grobrav Shop',
    senderEmail: 'noreply@grobrav.com'
  });
  const [edmIsSmtpConfigOpen, setEdmIsSmtpConfigOpen] = useState(false);
  const [edmSmtpSaving, setEdmSmtpSaving] = useState(false);

  // Recommendation builder
  const [edmRecipReferenceEmail, setEdmRecipReferenceEmail] = useState('all');
  const [edmRecipReferenceCategory, setEdmRecipReferenceCategory] = useState('all');

  // Find all categories purchased by the reference email
  const detectedCategories = useMemo(() => {
    if (edmRecipReferenceEmail === 'all') return [];
    const clientOrders = (orders || []).filter((o: any) => o.email?.toLowerCase().trim() === edmRecipReferenceEmail.toLowerCase().trim());
    const catSet = new Set<string>();
    clientOrders.forEach((o: any) => {
      o.items?.forEach((it: any) => {
        const prod = products.find(p => p.name?.toLowerCase().trim() === it.name?.toLowerCase().trim() || p.id === it.productId);
        if (prod && prod.category) {
          catSet.add(prod.category);
        }
      });
    });
    return Array.from(catSet);
  }, [edmRecipReferenceEmail, orders, products]);

  // Find the top bestseller products for the category
  const recommendedBestSellers = useMemo(() => {
    let categoryFilter = edmRecipReferenceCategory;
    if (edmRecipReferenceEmail !== 'all' && detectedCategories.length > 0) {
      categoryFilter = detectedCategories[0];
    }
    
    let pool = products;
    if (categoryFilter !== 'all') {
      pool = products.filter(p => p.category === categoryFilter);
    }
    
    // Sort by rating desc
    const sorted = [...pool].sort((a, b) => {
      const rA = parseFloat(a.rating as any || '0');
      const rB = parseFloat(b.rating as any || '0');
      return rB - rA;
    });
    
    return sorted.slice(0, 2);
  }, [edmRecipReferenceEmail, edmRecipReferenceCategory, detectedCategories, products]);
 
  // Compile all candidates for selected recipients
  const allCandidatesList = useMemo(() => {
    const map = new Map<string, { name: string; email: string; source: 'subscriber' | 'order'; country: string; details?: string }>();
    
    // Create mapping of email to country from orders to resolve subscriber countries
    const emailToCountry = new Map<string, string>();
    (orders || []).forEach((ord: any) => {
      if (ord.email && typeof ord.email === 'string') {
        const lower = ord.email.toLowerCase().trim();
        if (ord.country) {
          emailToCountry.set(lower, ord.country.trim());
        }
      }
    });

    // 1. From newsletter subscribers
    (edmSubscribers || []).forEach((sub: any) => {
      const email = typeof sub === 'object' && sub ? sub.email : sub;
      if (email && typeof email === 'string') {
        const lower = email.toLowerCase().trim();
        const country = emailToCountry.get(lower) || 'Unknown';
        map.set(lower, {
          name: lower.split('@')[0],
          email: lower,
          source: 'subscriber',
          country: country,
          details: 'Newsletter Subscriber'
        });
      }
    });

    // 2. From orders (customers who placed orders)
    (orders || []).forEach((ord: any) => {
      if (ord.email && typeof ord.email === 'string') {
        const lower = ord.email.toLowerCase().trim();
        const existing = map.get(lower);
        const country = ord.country?.trim() || existing?.country || 'Unknown';
        map.set(lower, {
          name: ord.customerName || (existing ? existing.name : lower.split('@')[0]),
          email: lower,
          source: 'order',
          country: country,
          details: `Placed Order #${ord.id || ''} ($${ord.total || 0})`
        });
      }
    });

    return Array.from(map.values());
  }, [edmSubscribers, orders]);

  // Compile all unique countries for filter
  const allCountries = useMemo(() => {
    const countriesSet = new Set<string>();
    allCandidatesList.forEach(c => {
      if (c.country && c.country !== 'Unknown') {
        countriesSet.add(c.country);
      }
    });
    return Array.from(countriesSet).sort();
  }, [allCandidatesList]);

  // Filter candidates based on query, source, and country
  const filteredCandidates = useMemo(() => {
    return allCandidatesList.filter(c => {
      // Filter by source type
      if (edmSourceType === 'subscribers' && c.source !== 'subscriber') return false;
      if (edmSourceType === 'orderCustomers' && c.source !== 'order') return false;
      
      // Filter by country
      if (edmSelectedCountry !== 'all') {
        if (edmSelectedCountry === 'Unknown' && c.country && c.country !== 'Unknown') return false;
        if (edmSelectedCountry !== 'Unknown' && c.country !== edmSelectedCountry) return false;
      }

      // Filter by search query
      if (edmRecipientSearch) {
        const q = edmRecipientSearch.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.details && c.details.toLowerCase().includes(q));
      }
      return true;
    });
  }, [allCandidatesList, edmSourceType, edmSelectedCountry, edmRecipientSearch]);

  const countAll = useMemo(() => {
    return allCandidatesList.filter(c => {
      if (edmSelectedCountry === 'all') return true;
      if (edmSelectedCountry === 'Unknown') return c.country === 'Unknown';
      return c.country === edmSelectedCountry;
    }).length;
  }, [allCandidatesList, edmSelectedCountry]);

  const countSubscribers = useMemo(() => {
    return allCandidatesList.filter(c => {
      if (c.source !== 'subscriber') return false;
      if (edmSelectedCountry === 'all') return true;
      if (edmSelectedCountry === 'Unknown') return c.country === 'Unknown';
      return c.country === edmSelectedCountry;
    }).length;
  }, [allCandidatesList, edmSelectedCountry]);

  const countOrderCustomers = useMemo(() => {
    return allCandidatesList.filter(c => {
      if (c.source !== 'order') return false;
      if (edmSelectedCountry === 'all') return true;
      if (edmSelectedCountry === 'Unknown') return c.country === 'Unknown';
      return c.country === edmSelectedCountry;
    }).length;
  }, [allCandidatesList, edmSelectedCountry]);

  // GA Compliance logs analytics stats
  const [gaStats, setGaStats] = useState<any | null>(null);
  const [gaLoading, setGaLoading] = useState(false);

  // Auto load configurations on init
  useEffect(() => {
    // Check if session contains valid auth
    const authed = sessionStorage.getItem('grobrav_admin_logged');
    if (authed === 'true') {
      setIsAuthenticated(true);
      const isWarning = sessionStorage.getItem('grobrav_admin_default_pass_warning');
      if (isWarning === 'true') {
        setDefaultPassWarning(true);
      }
    }

    // Load dynamic settings saved under local storage
    const stored = localStorage.getItem('grobrav_admin_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.paypalEnabled !== undefined) setPaypalEnabled(parsed.paypalEnabled);
        if (parsed.paypalMode !== undefined) setPaypalMode(parsed.paypalMode);
        if (parsed.paypalClientId !== undefined) setPaypalClientId(parsed.paypalClientId);
        if (parsed.cardEnabled !== undefined) setCardEnabled(parsed.cardEnabled);
        if (parsed.cardMode !== undefined) setCardMode(parsed.cardMode);
      } catch (e) {}
    }
  }, []);

  // Order handlers
  const handleSingleShipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForShip) return;
    setIsShippingLoading(true);
    try {
      await api.shipOrder(selectedOrderForShip.id, {
        carrier: shipCarrier,
        trackingNumber: shipTrackingNumber,
        status: shipStatus
      });
      setFeedback(al("订单发货物流录单成功！", "Order shipment details updated successfully!"));
      setFeedbackType("success");
      setSelectedOrderForShip(null);
      setShipCarrier('');
      setShipTrackingNumber('');
      setTimeout(() => setFeedback(''), 4000);
      await refreshState();
    } catch (err: any) {
      setFeedback(err.message || al("运单保存更新失败", "Failed to save shipment update"));
      setFeedbackType("error");
      setTimeout(() => setFeedback(''), 4000);
    } finally {
      setIsShippingLoading(false);
    }
  };

  const handleExportToCSV = () => {
    const headers = [
      'Order ID', 'Date', 'Customer Name', 'Email', 'Phone',
      'Address', 'City', 'State', 'Zip Code', 'Country',
      'Payment Method', 'Discount Code', 'Custom Text',
      'Total Amount', 'Status', 'Carrier', 'Tracking Number', 'Product Suppliers', 'Items Detail'
    ];
    
    const matched = (orders || []).filter((ord: any) => {
      const searchLower = orderSearchTerm.toLowerCase();
      const idMatch = String(ord.id || '').toLowerCase().includes(searchLower);
      const nameMatch = String(ord.customerName || '').toLowerCase().includes(searchLower);
      const emailMatch = String(ord.email || '').toLowerCase().includes(searchLower);
      const matchesSearch = !orderSearchTerm || idMatch || nameMatch || emailMatch;
      
      const matchesStatus = orderStatusFilter === 'all' || 
        String(ord.status || '').trim().toLowerCase() === orderStatusFilter.toLowerCase();
        
      return matchesSearch && matchesStatus;
    });

    const rows = matched.map((ord: any) => {
      const itemsDetailStr = ord.items?.map((it: any) => `${it.name} (${it.color || 'N/A'}, ${it.size || 'N/A'}) x${it.quantity}`).join(' | ') || '';
      const suppliersStr = ord.items?.map((it: any) => {
        const linkedProd = products.find((p: any) => p.name === it.name || p.sku === it.sku);
        const itemSupplier = it.supplier || linkedProd?.supplier || 'N/A';
        return `${it.name}: ${itemSupplier}`;
      }).join(' | ') || '';
      
      return [
        ord.id || '',
        ord.date || '',
        ord.customerName || '',
        ord.email || '',
        ord.phone || '',
        ord.address || '',
        ord.city || '',
        ord.state || '',
        ord.zipCode || '',
        ord.country || '',
        ord.paymentMethod || '',
        ord.discountCode || '',
        ord.customText || '',
        `$${ord.total?.toFixed(2)}`,
        ord.status || '',
        ord.carrier || '',
        ord.trackingNumber || '',
        suppliersStr,
        itemsDetailStr
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `grobrav_orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setFeedback(al("Excel格式CSV订单导出成功！", "Orders exported to Excel-compatible CSV successfully!"));
    setFeedbackType("success");
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleDownloadShippingTemplate = () => {
    const data = [
      {
        "Order ID (订单编号)*": "GRO-20260624-XXXX",
        "Carrier (快递承运商)": "FedEx",
        "Tracking Number (物流单号)*": "FDX1234567890",
        "Status (配送状态: Shipped/In Production)*": "Shipped"
      },
      {
        "Order ID (订单编号)*": "GRO-20260624-YYYY",
        "Carrier (快递承运商)": "DHL Express",
        "Tracking Number (物流单号)*": "DHL987654321",
        "Status (配送状态: Shipped/In Production)*": "In Production"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "发货导入模版");
    
    // Auto-fit column widths
    const maxLens = Object.keys(data[0]).map(key => Math.max(key.length * 1.5, 20));
    worksheet["!cols"] = maxLens.map(w => ({ wch: w }));

    XLSX.writeFile(workbook, "Bulk_Order_Shipping_Template.xlsx");
    showToast("Shipping template downloaded successfully! / 运单发货导入模版下载成功！", "success");
  };

  const handleShippingExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setBulkImportError('');
        setBulkImportFeedback('');
        
        const binaryStr = evt.target?.result;
        if (!binaryStr) throw new Error('Could not read file / 无法读取文件数据');

        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (rows.length < 2) {
          throw new Error('Excel must contain a header row and at least one record row / Excel 必须包含表头行与至少一行发货数据');
        }

        const headers = rows[0].map(h => String(h || '').toLowerCase().trim());
        
        const idIdx = headers.findIndex(h => h.includes('id') || h.includes('订单') || h.includes('order'));
        const carrierIdx = headers.findIndex(h => h.includes('carrier') || h.includes('物流') || h.includes('快递') || h.includes('承运') || h.includes('运输'));
        const trackingIdx = headers.findIndex(h => h.includes('tracking') || h.includes('单号') || h.includes('运单') || h.includes('track'));
        const statusIdx = headers.findIndex(h => h.includes('status') || h.includes('状态') || h.includes('配送'));

        if (idIdx === -1) {
          throw new Error('Excel sheet header must contain a column for Order ID / 表头必须包含订单编号列 (如 "Order ID" 或 "订单编号")');
        }
        if (trackingIdx === -1) {
          throw new Error('Excel sheet header must contain a column for Tracking Number / 表头必须包含物流单号列 (如 "Tracking Number" 或 "物流单号")');
        }

        const shipments = [];
        for (let i = 1; i < rows.length; i++) {
          const values = rows[i];
          if (!values || values.length === 0) continue;

          const orderId = String(values[idIdx] || '').trim();
          if (!orderId) continue;

          const carrier = carrierIdx !== -1 && values[carrierIdx] ? String(values[carrierIdx]).trim() : 'DHL Express';
          const trackingNumber = String(values[trackingIdx] || '').trim();
          const status = statusIdx !== -1 && values[statusIdx] ? String(values[statusIdx]).trim() : 'Shipped';

          shipments.push({
            orderId,
            carrier,
            trackingNumber,
            status
          });
        }

        if (shipments.length === 0) {
          throw new Error('No valid shipping rows parsed. Please check sheet data / 未解析到有效发货行，请检查数据值');
        }

        const res = await api.bulkShipOrders(shipments);
        setBulkImportFeedback(al(`物流同步成功！成功从 Excel 导入并更新了 ${res.updatedCount} 个订单的发货状态与运单。`, `Sync success! Successfully imported and updated ${res.updatedCount} order shipment logs via Excel.`));
        await refreshState();
        showToast(`Imported shipping updates for ${res.updatedCount} orders successfully!`, 'success');
      } catch (err: any) {
        setBulkImportError(err.message || 'Excel Import failed / 导入失败');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkImportCSV = async (csvText: string) => {
    setBulkImportError('');
    setBulkImportFeedback('');
    if (!csvText.trim()) {
      setBulkImportError(al("请输入有效的 CSV 物流文本数据！", "Please input valid CSV shipping text data!"));
      return;
    }
    
    try {
      const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setBulkImportError(al("数据行不足，请确保首行为标头列，次行为对应数据。", "Insufficient rows. Ensure the first row has header columns."));
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
      const idIndex = headers.findIndex(h => h.includes('id') || h.includes('订单') || h.includes('order'));
      const carrierIndex = headers.findIndex(h => h.includes('carrier') || h.includes('物流') || h.includes('快递') || h.includes('运输') || h.includes('承运'));
      const trackingIndex = headers.findIndex(h => h.includes('tracking') || h.includes('单号') || h.includes('运单') || h.includes('track'));
      const statusIndex = headers.findIndex(h => h.includes('status') || h.includes('状态'));
      
      if (idIndex === -1) {
        setBulkImportError(al("未能找到订单ID标头列，请确保标头包含 'Order ID' 或 'id'", "Could not match Order ID header column. Please specify 'Order ID' or 'id'"));
        return;
      }
      
      const shipments: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        let cols: string[] = [];
        let cur = '';
        let insideQuotes = false;
        const line = lines[i];
        
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
          const char = line[charIndex];
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            cols.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        cols.push(cur.trim());
        
        const cleanCols = cols.map(c => c.replace(/^["']|["']$/g, '').trim());
        if (!cleanCols[idIndex]) continue;
        
        shipments.push({
          orderId: cleanCols[idIndex],
          carrier: carrierIndex !== -1 ? (cleanCols[carrierIndex] || 'DHL Express') : 'DHL Express',
          trackingNumber: trackingIndex !== -1 ? cleanCols[trackingIndex] : '',
          status: statusIndex !== -1 ? (cleanCols[statusIndex] || 'Shipped') : 'Shipped'
        });
      }
      
      if (shipments.length === 0) {
        setBulkImportError(al("未能解析到任何有效的发货记录行数据。", "Could not parse any valid shipment records."));
        return;
      }
      
      const res = await api.bulkShipOrders(shipments);
      setBulkImportFeedback(al(`物流同步成功！系统动态适配并匹配更新了 ${res.updatedCount} 个订单的发货状态与运单。`, `Sync success! Dynamically matched and updated ${res.updatedCount} order shipment logs.`));
      setBulkImportCsv('');
      await refreshState();
    } catch (err: any) {
      setBulkImportError(err.message || al("批量导入解析同步失败，请检查CSV格式。", "Failed to parse and synchronize bulk shipments. Verify CSV structure."));
    }
  };

  // Fetch GA Analytics and Marketing subscribers upon authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminStats();
      if (activeTab === 'contact') {
        fetchShippingConfig();
      }
      if (activeTab === 'support_messages') {
        fetchSupportMessages();
      }
      if (activeTab === 'warranties') {
        fetchWarranties();
      }
    }
  }, [isAuthenticated, activeTab]);

  // Populate dynamic contact states
  useEffect(() => {
    if (contactInfo) {
      setStoreEmail(contactInfo.email || '');
      setStorePhone(contactInfo.phone || '');
      setStoreAddress(contactInfo.address || '');
      setStoreSlogan(contactInfo.slogan || '');
    }
  }, [contactInfo]);

  // Populate pages content states
  useEffect(() => {
    if (pagesContent) {
      setShippingContent(pagesContent.shipping || '');
      setReturnsContent(pagesContent.returns || '');
      setSizeGuideContent(pagesContent.size_guide || '');
      setPrivacyContent(pagesContent.privacy || '');
      setTermsContent(pagesContent.terms || '');
    }
  }, [pagesContent]);

  // Populate pixel settings fields
  useEffect(() => {
    if (pixelSettings) {
      setFacebookPixelField(pixelSettings.facebookPixelId || '');
      setGoogleTagField(pixelSettings.googleTagId || '');
    }
  }, [pixelSettings]);

  const handleUpdatePixelSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setPixelLoading(true);
    try {
      const res = await api.updatePixelSettings({
        facebookPixelId: facebookPixelField,
        googleTagId: googleTagField
      });
      setPixelSettings(res.pixelSettings);
      setFeedback('Facebook & Google Pixels updated successfully!');
      setFeedbackType('success');
      setTimeout(() => setFeedback(''), 4000);
    } catch (err: any) {
      setFeedback(err.message || 'Failed to update pixel parameters');
      setFeedbackType('error');
      setTimeout(() => setFeedback(''), 4000);
    } finally {
      setPixelLoading(false);
    }
  };

  const handleUpdatePagesContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setPagesLoading(true);
    try {
      const res = await api.updatePagesContent({
        shipping: shippingContent,
        returns: returnsContent,
        size_guide: sizeGuideContent,
        privacy: privacyContent,
        terms: termsContent
      });
      setPagesContent(res.pagesContent);
      setFeedback('Pages content updated successfully!');
      setFeedbackType('success');
      setTimeout(() => setFeedback(''), 4000);
    } catch (err: any) {
      setFeedback(err.message || 'Failed to update pages content');
      setFeedbackType('error');
      setTimeout(() => setFeedback(''), 4000);
    } finally {
      setPagesLoading(false);
    }
  };

  const handleUpdateContactInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoreLoading(true);
    try {
      const res = await api.updateContactInfo({
        email: storeEmail,
        phone: storePhone,
        address: storeAddress,
        slogan: storeSlogan
      });
      setContactInfo(res.contactInfo);
      showToast('Store contact detail specifications and brand slogan updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setStoreLoading(false);
    }
  };

  const fetchShippingConfig = async () => {
    try {
      const data = await api.getShippingConfig();
      if (data) {
        setFreeShippingThreshold(String(data.freeShippingThreshold || '75.00'));
        setStandardShippingFee(String(data.standardShippingFee || '5.99'));
        setStandardDeliveryTime(data.standardDeliveryTime || '5-7 business days');
        setExpressShippingFee(String(data.expressShippingFee || '15.00'));
        setExpressDeliveryTime(data.expressDeliveryTime || '2-3 business days');
      }
    } catch (err: any) {
      console.error('Failed to load shipping config:', err);
    }
  };

  const handleUpdateShippingConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setShippingLoading(true);
    try {
      await api.saveShippingConfig({
        freeShippingThreshold: Number(freeShippingThreshold) || 0,
        standardShippingFee: Number(standardShippingFee) || 0,
        standardDeliveryTime,
        expressShippingFee: Number(expressShippingFee) || 0,
        expressDeliveryTime
      });
      showToast('Logistics shipping configuration saved and integrated live!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save shipping configurations', 'error');
    } finally {
      setShippingLoading(false);
    }
  };

  const fetchSupportMessages = async () => {
    setSupportMessagesLoading(true);
    try {
      const res = await api.getContactMessages();
      setSupportMessages(res.messages || []);
    } catch (err: any) {
      showToast('Failed to load support message inbox: ' + err.message, 'error');
    } finally {
      setSupportMessagesLoading(false);
    }
  };

  const handleReplyMessage = async (id: string) => {
    const text = replyTextMap[id];
    if (!text || !text.trim()) {
      showToast('Please enter a response message before replying.', 'error');
      return;
    }

    setReplyLoadingId(id);
    try {
      const res = await api.replyContactMessage(id, text.trim());
      showToast(res.message || 'Support reply successfully dispatched!', 'success');
      // Update local state record
      setSupportMessages(prev => prev.map(m => m.id === id ? { ...m, replied: true, replyText: text.trim(), repliedAt: new Date().toISOString() } : m));
    } catch (err: any) {
      showToast(err.message || 'Failed to send reply email', 'error');
    } finally {
      setReplyLoadingId(null);
    }
  };

  const fetchSecurityLogs = async () => {
    try {
      setSecurityLogsLoading(true);
      const res = await api.getSecurityLogs();
      setSecurityLogs(res.securityLogs || []);
    } catch (err) {
      console.error('Failed to fetch security logs:', err);
    } finally {
      setSecurityLogsLoading(false);
    }
  };

  const fetchWarranties = async () => {
    setWarrantiesLoading(true);
    try {
      const res = await api.getWarranties();
      setWarranties(res.warranties || []);
    } catch (err: any) {
      showToast('Failed to load warranty registrations: ' + err.message, 'error');
    } finally {
      setWarrantiesLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      setGaLoading(true);
      const metrics = await api.fetchGAStats();
      setGaStats(metrics);
      const edmLogs = await api.loadEDMStats();
      setEdmSubscribers(edmLogs.subscribers || []);
      setEdmCampaigns(edmLogs.campaigns || []);
      try {
        const edmConfigData = await api.getEDMConfig();
        if (edmConfigData && edmConfigData.config) {
          setEdmSmtpConfig(edmConfigData.config);
        }
      } catch (err) {
        console.error('Failed to load EDM configuration:', err);
      }
      await fetchSecurityLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setGaLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback(message);
    setFeedbackType(type);
    setTimeout(() => setFeedback(''), 4050);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await api.adminLogin({ email: adminEmail, password: adminPassword });
      sessionStorage.setItem('grobrav_admin_logged', 'true');
      setIsAuthenticated(true);
      if (res.securityWarning === 'DEFAULT_PASSWORD_DETECTED') {
        sessionStorage.setItem('grobrav_admin_default_pass_warning', 'true');
        setDefaultPassWarning(true);
      } else {
        sessionStorage.removeItem('grobrav_admin_default_pass_warning');
        setDefaultPassWarning(false);
      }
      showToast('Welcome inside Grobrav Control Board.', 'success');
      trackEvent('admin_login_success');
    } catch (err: any) {
      setAuthError(err.message || 'Incorrect credentials.');
      trackEvent('admin_login_failure', { error: err.message });
    } finally {
      setAuthLoading(false);
    }
  };

  // Log out admin
  const handleAdminLogout = () => {
    sessionStorage.removeItem('grobrav_admin_logged');
    sessionStorage.removeItem('grobrav_admin_default_pass_warning');
    setDefaultPassWarning(false);
    setIsAuthenticated(false);
    trackEvent('admin_logout');
  };

  // Change Admin Password
  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPass || !newPass) return;
    setChangePassLoading(true);

    try {
      await api.adminChangePassword({ adminEmail: 'admin@grobrav.com', oldPassword: oldPass, newPassword: newPass });
      showToast('Admin password changed successfully. Use the new password next time.', 'success');
      setOldPass('');
      setNewPass('');
      sessionStorage.removeItem('grobrav_admin_default_pass_warning');
      setDefaultPassWarning(false);
      trackEvent('admin_password_change_success');
      await fetchSecurityLogs();
    } catch (err: any) {
      showToast(err.message || 'Failed to modify admin password.', 'error');
      trackEvent('admin_password_change_failure', { error: err.message });
    } finally {
      setChangePassLoading(false);
    }
  };

  // Save payment gateway changes
  const handleSaveGateways = async () => {
    setGatewaysLoading(true);
    const settingsObj = { paypalEnabled, paypalMode, paypalClientId, cardEnabled, cardMode };
    localStorage.setItem('grobrav_admin_settings', JSON.stringify(settingsObj));
    
    // Save backend gateway simulations mock
    try {
      showToast('Payment gateway credentials and sandbox modules saved successfully!', 'success');
      trackEvent('admin_save_gateways', settingsObj);
    } catch (err) {
      showToast('Saving locally to client buffer instead.', 'success');
    } finally {
      setGatewaysLoading(false);
    }
  };

  // Local image uploader for category cover
  const handleLocalImageUpload = async (file: File) => {
    if (!file) return;
    showToast('Uploading cover image to server catalog...', 'info');
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const result = await api.uploadMedia(base64, 'category_cover');
          if (result && result.url) {
            setNewCatImage(result.url);
            showToast('Local cover image uploaded and cataloged!', 'success');
          }
        } catch (uploadErr: any) {
          showToast(uploadErr.message || 'Media upload failed', 'error');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showToast('Error reading image file on local browser', 'error');
    }
  };

  // AI Prompt Image generator for categories
  const handleAiImageGenerate = async () => {
    const promptText = aiPrompt || `Premium aesthetic graphic design cover or photography for ${newCatLabel || 'fashion product'} collection, clean, isolated, vector minimalist style`;
    setAiImageLoading(true);
    showToast('Gemini AI is generating your graphics code...', 'info');
    try {
      const response = await api.generateImage(promptText);
      if (response && response.image) {
        if (response.image.startsWith('data:')) {
          const uploadRes = await api.uploadMedia(response.image, 'ai_category');
          if (uploadRes && uploadRes.url) {
            setNewCatImage(uploadRes.url);
            showToast('AI graphic designed and saved as local category cover!', 'success');
            return;
          }
        }
        setNewCatImage(response.image);
        showToast('AI cover created successfully!', 'success');
      } else {
        throw new Error('Image generation returned empty value');
      }
    } catch (err: any) {
      showToast(err.message || 'AI generation failed', 'error');
    } finally {
      setAiImageLoading(false);
    }
  };

  // Add category slug
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatSlug || !newCatLabel) return;
    setCategoryLoading(true);

    try {
      await api.addCategory({ 
        type: newCatSlug.toLowerCase().trim(), 
        label: newCatLabel,
        sublabel: newCatSublabel,
        image: newCatImage
      });
      showToast('Dynamic collection folder published!', 'success');
      setNewCatSlug('');
      setNewCatLabel('');
      setNewCatSublabel('');
      setNewCatImage('');
      setAiPrompt('');
      await refreshState();
      trackEvent('admin_add_category', { slug: newCatSlug });
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setCategoryLoading(false);
    }
  };

  // Delete category slug
  const handleDeleteCategory = async (slug: string) => {
    triggerDeleteConfirmation(
      al("确认删除分类目录？", "Confirm Deleting Category?"),
      al(`您正在执行敏感操作。此操作将永久删除分类目录 "${slug}"。如果您确定要执行，请点击“确认删除”。`, `You are performing a sensitive action. This will permanently delete the category "${slug}". If you are certain, click "Confirm Delete".`),
      async () => {
        try {
          await api.deleteCategory(slug);
          showToast('Category folder removed.', 'success');
          await refreshState();
          trackEvent('admin_delete_category', { slug });
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    );
  };

  // Add Coupon Settings
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;
    setCouponsLoading(true);

    try {
      await api.addCoupon({
        code: newCouponCode.toUpperCase().trim(),
        discount: Number(newCouponDiscount),
        description: newCouponDesc || `${newCouponDiscount}% Off Campaign`,
        scope: couponScope,
        applicableProductIds: couponScope === 'specific' ? couponSelectedProducts : []
      });
      showToast('Promotional voucher registered!', 'success');
      setNewCouponCode('');
      setNewCouponDesc('');
      setCouponScope('all');
      setCouponSelectedProducts([]);
      await refreshState();
      trackEvent('admin_add_coupon', { code: newCouponCode });
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setCouponsLoading(false);
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (code: string) => {
    triggerDeleteConfirmation(
      al("确认注销折扣码？", "Confirm Deactivating Coupon?"),
      al(`您确定要注销并删除折扣码 "${code}" 吗？所有未结账的顾客将无法再使用该折扣码。`, `Are you sure you want to deactivate and delete coupon code "${code}"? Any customer who hasn't completed checkout will no longer be able to use this coupon.`),
      async () => {
        try {
          await api.deleteCoupon(code);
          showToast('Coupon code deactivated.', 'success');
          await refreshState();
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    );
  };

  // Upload or Update Product with YouTube link, SKU, and dynamic dual variants support!
  const handleUploadProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle || !prodPrice || !prodImageUrl) {
      showToast('Title, Price, and primary thumbnail image are required.', 'error');
      return;
    }

    setProductLoading(true);

    // Prepare up to 8 images
    let finalImages = [...prodImages].filter(Boolean);
    if (!finalImages.includes(prodImageUrl) && finalImages.length < 8) {
      if (finalImages.length === 0) {
        finalImages = [prodImageUrl];
      } else {
        finalImages.unshift(prodImageUrl);
      }
    }
    // Cap at maximum of 8 images
    finalImages = finalImages.slice(0, 8);

    const payload = {
      name: prodTitle,
      description: prodDesc || 'Sublime personalized merchandise crafted in modern POD custom studios.',
      price: Number(prodPrice),
      originalPrice: prodOriginalPrice ? Number(prodOriginalPrice) : undefined,
      category: prodCategory.toLowerCase().trim(),
      image: prodImageUrl,
      images: finalImages,
      youtubeEmbedCode: prodYoutube || undefined,
      videoUrl: prodVideoUrl || undefined,
      sku: prodSKU || undefined,
      supplier: prodSupplier || undefined,
      packageSize: prodPackageSize || undefined,
      weight: prodWeight || undefined,
      hasVariants: prodHasVariants,
      colors: prodHasVariants ? prodColors.split(',').map(c => c.trim()).filter(Boolean) : [],
      sizes: prodHasVariants ? prodSizes.split(',').map(s => s.trim()).filter(Boolean) : [],
      richText: prodRichText,
      faqs: prodFaqs
    };

    try {
      if (editingProductId) {
        await api.updateProduct(editingProductId, payload);
        showToast('Product updated successfully and synchronized live!', 'success');
      } else {
        await api.uploadProduct(payload);
        showToast('Product uploaded successfully. Displaying in collection pages instantly!', 'success');
      }
      
      // Reset all states
      setProdTitle('');
      setProdDesc('');
      setProdPrice('');
      setProdOriginalPrice('');
      setProdImageUrl('');
      setProdYoutube('');
      setProdVideoUrl('');
      setProdSKU('');
      setProdSupplier('');
      setProdPackageSize('');
      setProdWeight('');
      setProdHasVariants(true);
      setProdImages([]);
      setProdColors('White, Black, Pink, Navy');
      setProdSizes('XS, S, M, L, XL, XXL');
      setProdRichText('');
      setProdFaqs([]);
      setEditingProductId(null);

      await refreshState();
      trackEvent(editingProductId ? 'admin_update_product' : 'admin_upload_product', { name: prodTitle });
    } catch (err: any) {
      showToast(err.message || 'Error occurred while saving product details.', 'error');
    } finally {
      setProductLoading(false);
    }
  };

  const triggerEditProduct = (p: any) => {
    setProdTitle(p.name || '');
    setProdDesc(p.description || '');
    setProdCategory(p.category || 'women');
    setProdPrice(String(p.price || ''));
    setProdOriginalPrice(p.originalPrice ? String(p.originalPrice) : '');
    setProdImageUrl(p.image || (p.images && p.images[0]) || '');
    setProdYoutube(p.youtubeEmbedCode || '');
    setProdVideoUrl(p.videoUrl || '');
    setProdSKU(p.sku || '');
    setProdSupplier(p.supplier || '');
    setProdPackageSize(p.packageSize || '');
    setProdWeight(p.weight || '');
    setProdHasVariants(p.hasVariants !== undefined ? p.hasVariants : true);
    setProdImages(p.images || [p.image]);
    setProdColors(p.colors ? p.colors.join(', ') : 'White, Black, Pink, Navy');
    setProdSizes(p.sizes ? p.sizes.join(', ') : 'XS, S, M, L, XL, XXL');
    setProdRichText(p.richText || '');
    setProdFaqs(p.faqs || []);
    setEditingProductId(p.id);
    
    // Smooth scroll down to the focus area
    window.scrollTo({ top: 300, behavior: 'smooth' });
    showToast(`Loaded details of "${p.name}" for instant changes!`, 'info');
  };

  const handleCancelEdit = () => {
    setProdTitle('');
    setProdDesc('');
    setProdCategory('women');
    setProdPrice('');
    setProdOriginalPrice('');
    setProdImageUrl('');
    setProdYoutube('');
    setProdVideoUrl('');
    setProdSKU('');
    setProdSupplier('');
    setProdPackageSize('');
    setProdWeight('');
    setProdHasVariants(true);
    setProdImages([]);
    setProdColors('White, Black, Pink, Navy');
    setProdSizes('XS, S, M, L, XL, XXL');
    setProdRichText('');
    setProdFaqs([]);
    setEditingProductId(null);
    showToast('Editing cancelled.', 'info');
  };

  const handleDownloadTemplate = () => {
    // Generate a high-quality Excel template using xlsx
    const data = [
      {
        "Name (商品名称)*": "749局特调全息辟邪黑曜石吊坠 / Bureau 749 Holographic Obsidian Talisman",
        "Category (分类: women/men/mugs/living)*": "women",
        "Price (售价)*": 49.99,
        "Compare Price (划线价)": 89.99,
        "SKU (商品编码)": "B749-OBSD-01",
        "Supplier (供应商)": "特别行动后勤处 / Special Ops Supply",
        "Image URL (图片链接)": "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80",
        "Description (简短描述)": "由第七研究所特别气场加持的黑曜石，辟邪防灾稳定气场。"
      },
      {
        "Name (商品名称)*": "五行风水招财高磁能陶瓷马克杯 / Five-elements Aura Resonance Mug",
        "Category (分类: women/men/mugs/living)*": "mugs",
        "Price (售价)*": 19.99,
        "Compare Price (划线价)": 29.99,
        "SKU (商品编码)": "B749-MUG-05",
        "Supplier (供应商)": "风水堪舆组 / Feng-shui Dept",
        "Image URL (图片链接)": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80",
        "Description (简短描述)": "高温烧制陶瓷杯，注入微米朱砂微粉涂层稳定水源磁场。"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "749局上架模版");
    
    // Auto-fit column widths
    const maxLens = Object.keys(data[0]).map(key => Math.max(key.length * 1.5, 20));
    worksheet["!cols"] = maxLens.map(w => ({ wch: w }));

    XLSX.writeFile(workbook, "Bureau_749_Product_Listing_Template.xlsx");
    showToast("Template downloaded successfully! / 模版已成功生成并下载！", "success");
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setBulkProdError('');
        setBulkProdFeedback('');
        setIsBulkProdLoading(true);

        const binaryStr = evt.target?.result;
        if (!binaryStr) throw new Error('Could not read file / 无法读取文件数据');

        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to arrays with headers included to support fuzzy column finding
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (rows.length < 2) {
          throw new Error('Excel must contain a header row and at least one product row / Excel 必须包含表头行与至少一行产品数据');
        }

        const headers = rows[0].map(h => String(h || '').toLowerCase().trim());
        
        // Find column indexes with fuzzy mapping
        const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('title') || h.includes('名称') || h.includes('商品'));
        const categoryIdx = headers.findIndex(h => h.includes('category') || h.includes('分类') || h.includes('栏目'));
        const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('售价') || h.includes('价格'));
        const comparePriceIdx = headers.findIndex(h => h.includes('compare') || h.includes('划线') || h.includes('原价'));
        const skuIdx = headers.findIndex(h => h.includes('sku') || h.includes('编码') || h.includes('编号'));
        const supplierIdx = headers.findIndex(h => h.includes('supplier') || h.includes('供应商') || h.includes('渠道'));
        const imageIdx = headers.findIndex(h => h.includes('image') || h.includes('图片') || h.includes('url') || h.includes('链接'));
        const descIdx = headers.findIndex(h => h.includes('description') || h.includes('描述') || h.includes('详情'));

        if (nameIdx === -1) {
          throw new Error('Excel sheet header must contain a column for Product Name / 表头必须包含商品名称列 (如 "Name" 或 "商品名称")');
        }
        if (categoryIdx === -1) {
          throw new Error('Excel sheet header must contain a column for Category / 表头必须包含商品分类列 (如 "Category" 或 "分类")');
        }
        if (priceIdx === -1) {
          throw new Error('Excel sheet header must contain a column for Price / 表头必须包含商品售价列 (如 "Price" 或 "售价")');
        }

        const parsedProducts = [];
        for (let i = 1; i < rows.length; i++) {
          const values = rows[i];
          if (!values || values.length === 0) continue;

          const name = String(values[nameIdx] || '').trim();
          if (!name) continue;

          const category = String(values[categoryIdx] || 'women').toLowerCase().trim();
          const price = Number(values[priceIdx]) || 0;
          const originalPrice = comparePriceIdx !== -1 && values[comparePriceIdx] ? Number(values[comparePriceIdx]) : undefined;
          const sku = skuIdx !== -1 && values[skuIdx] ? String(values[skuIdx]).trim() : '';
          const supplier = supplierIdx !== -1 && values[supplierIdx] ? String(values[supplierIdx]).trim() : '';
          const image = imageIdx !== -1 && values[imageIdx] ? String(values[imageIdx]).trim() : 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80';
          const description = descIdx !== -1 && values[descIdx] ? String(values[descIdx]).trim() : 'Premium 749 bureau artifacts.';

          parsedProducts.push({
            name,
            category,
            price,
            originalPrice,
            sku,
            supplier,
            image,
            images: [image],
            description,
            isCustomizable: false,
            hasVariants: true,
            colors: ['White', 'Black'],
            sizes: ['S', 'M', 'L', 'XL'],
            richText: '',
            faqs: []
          });
        }

        if (parsedProducts.length === 0) {
          throw new Error('No valid product rows parsed. Please check sheet data / 未解析到有效商品行，请检查数据值');
        }

        const res = await api.uploadProductsBulk(parsedProducts);
        setBulkProdFeedback(`Successfully imported ${res.count} products from Excel! / 成功从 Excel 导入并上架了 ${res.count} 个商品！`);
        await refreshState();
        showToast(`Imported ${res.count} products from Excel successfully!`, 'success');
      } catch (err: any) {
        setBulkProdError(err.message || 'Excel Import failed / 导入失败');
      } finally {
        setIsBulkProdLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkImportProducts = async (csvText: string) => {
    try {
      setBulkProdError('');
      setBulkProdFeedback('');
      setIsBulkProdLoading(true);
      
      const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        throw new Error('Please include a header row and at least one product row / 请至少包含表头行与一行产品数据');
      }

      // Helper to parse CSV line with double-quotes support
      const parseCsvLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        // strip enclosing quotes if present
        return result.map(val => val.startsWith('"') && val.endsWith('"') ? val.substring(1, val.length - 1) : val);
      };

      const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
      
      // Find column indexes
      const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('title') || h.includes('名称') || h.includes('商品'));
      const categoryIdx = headers.findIndex(h => h.includes('category') || h.includes('分类') || h.includes('栏目'));
      const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('售价') || h.includes('价格'));
      const comparePriceIdx = headers.findIndex(h => h.includes('compare') || h.includes('划线价') || h.includes('原价'));
      const skuIdx = headers.findIndex(h => h.includes('sku') || h.includes('编号'));
      const supplierIdx = headers.findIndex(h => h.includes('supplier') || h.includes('供应商') || h.includes('渠道'));
      const imageIdx = headers.findIndex(h => h.includes('image') || h.includes('图片') || h.includes('url'));
      const descIdx = headers.findIndex(h => h.includes('description') || h.includes('描述') || h.includes('详情'));

      if (nameIdx === -1) {
        throw new Error('Header must contain "Name" or "Title" / 表头必须包含商品名称');
      }
      if (categoryIdx === -1) {
        throw new Error('Header must contain "Category" / 表头必须包含分类');
      }
      if (priceIdx === -1) {
        throw new Error('Header must contain "Price" / 表头必须包含售价');
      }

      const parsedProducts = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        if (values.length < 3) continue; // skip incomplete lines

        const name = values[nameIdx];
        const category = (values[categoryIdx] || 'women').toLowerCase().trim();
        const price = Number(values[priceIdx]) || 0;
        const originalPrice = comparePriceIdx !== -1 && values[comparePriceIdx] ? Number(values[comparePriceIdx]) : undefined;
        const sku = skuIdx !== -1 && values[skuIdx] ? values[skuIdx] : '';
        const supplier = supplierIdx !== -1 && values[supplierIdx] ? values[supplierIdx] : '';
        const image = imageIdx !== -1 && values[imageIdx] ? values[imageIdx] : 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80';
        const description = descIdx !== -1 && values[descIdx] ? values[descIdx] : 'Premium personalized merchandise.';

        if (!name) continue;

        parsedProducts.push({
          name,
          category,
          price,
          originalPrice,
          sku,
          supplier,
          image,
          images: [image],
          description,
          isCustomizable: false,
          hasVariants: true,
          colors: ['White', 'Black'],
          sizes: ['S', 'M', 'L', 'XL'],
          richText: '',
          faqs: []
        });
      }

      if (parsedProducts.length === 0) {
        throw new Error('No valid product rows parsed. Please check row values / 未解析到有效行，请检查数据值');
      }

      const res = await api.uploadProductsBulk(parsedProducts);
      setBulkProdFeedback(`Successfully imported ${res.count} products! / 成功导入上架了 ${res.count} 个商品！`);
      setBulkProdCsv('');
      await refreshState();
      showToast(`Imported ${res.count} products successfully!`, 'success');
    } catch (err: any) {
      setBulkProdError(err.message || 'Import failed / 导入失败');
    } finally {
      setIsBulkProdLoading(false);
    }
  };

  const handleLocalVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.mp4') && file.type !== 'video/mp4') {
      alert('Only MP4 format videos are supported / 只能上传MP4格式视频');
      return;
    }

    if (!prodTitle) {
      showToast('Please specify Product Title first, so the video can be uploaded with that product name! / 上传视频前请先输入产品名称，以便匹配文件名', 'warning');
      return;
    }

    setVideoUploading(true);
    setVideoProgress(0);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await uploadFileWithProgress('/api/media/upload', {
            base64Data,
            namePrefix: `prod_video_${prodTitle}`
          }, (p) => {
            setVideoProgress(p);
          });
          setProdVideoUrl(res.url);
          showToast('Product video uploaded successfully!', 'success');
        } catch (uploadErr: any) {
          alert('Failed to upload video: ' + uploadErr.message);
        } finally {
          setVideoUploading(false);
          setTimeout(() => setVideoProgress(null), 1500);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert('Error reading local video: ' + err.message);
      setVideoUploading(false);
      setVideoProgress(null);
    }
  };

  const handlePrimaryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!prodTitle) {
      showToast('Please specify Product Title first, so the image can be saved with that name! / 明细上传前请先输入产品名称，以便匹配文件名 saving...', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === 'string') {
        try {
          setPrimaryImageProgress(0);
          showToast('Uploading primary image to server...', 'info');
          const res = await uploadFileWithProgress('/api/admin/products/upload-image', {
            productName: prodTitle,
            imageBase64: reader.result,
            index: 0
          }, (p) => {
            setPrimaryImageProgress(p);
          });
          setProdImageUrl(res.url);
          // preset first slot as well
          const newImgs = [...prodImages];
          newImgs[0] = res.url;
          setProdImages(newImgs);
          showToast('Primary thumbnail uploaded & saved on server under product name successfully!', 'success');
        } catch (err: any) {
          showToast(err.message || 'Image upload error', 'error');
        } finally {
          setTimeout(() => setPrimaryImageProgress(null), 1500);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSlotImageUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!prodTitle) {
      showToast('Please specify Product Title first, so the image can be saved with that name! / 明细上传前请先输入产品名称，以便匹配文件名', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === 'string') {
        try {
          setSlotImageProgress(prev => ({ ...prev, [idx]: 0 }));
          showToast(`Uploading image slot #${idx + 1} to server...`, 'info');
          const res = await uploadFileWithProgress('/api/admin/products/upload-image', {
            productName: prodTitle,
            imageBase64: reader.result,
            index: idx + 1
          }, (p) => {
            setSlotImageProgress(prev => ({ ...prev, [idx]: p }));
          });
          const newImgs = [...prodImages];
          newImgs[idx] = res.url;
          setProdImages(newImgs);
          if (idx === 0) {
            setProdImageUrl(res.url);
          }
          showToast(`Image Slot #${idx + 1} synchronized to server storage!`, 'success');
        } catch (err: any) {
          showToast(err.message || 'Slot image upload error', 'error');
        } finally {
          setTimeout(() => {
            setSlotImageProgress(prev => {
              const updated = { ...prev };
              delete updated[idx];
              return updated;
            });
          }, 1500);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    triggerDeleteConfirmation(
      al("确认永久删除该产品？", "Confirm Deleting Product?"),
      al("您正在执行高度敏感的操作。此操作将永久从数据库和前台界面中彻底移除该产品目录。此操作无法恢复，请谨慎操作并再次确认！", "You are performing a highly sensitive action. This will permanently and completely remove this product listing from both the database and the public storefront directory. This is irreversible, please confirm again!"),
      async () => {
        try {
          await api.deleteProduct(id);
          showToast('Product removed.', 'success');
          await refreshState();
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    );
  };

  const handleRichImageUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!prodTitle) {
      showToast('Please specify Product Title first, so the image can be saved with that name! / 明细上传前请先输入产品名称，以便匹配文件名', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === 'string') {
        try {
          setRichUploadProgress(prev => ({ ...prev, [idx]: 0 }));
          showToast(`Uploading rich content photo #${idx + 1}...`, 'info');
          const res = await uploadFileWithProgress('/api/admin/products/upload-image', {
            productName: prodTitle,
            imageBase64: reader.result,
            index: idx + 10 // avoid overlap with standard galleries
          }, (p) => {
            setRichUploadProgress(prev => ({ ...prev, [idx]: p }));
          });
          
          setRichImages(prev => {
            const updated = [...prev];
            updated[idx] = res.url;
            return updated;
          });
          showToast(`Rich specification image #${idx + 1} uploaded!`, 'success');
        } catch (err: any) {
          showToast(err.message || 'Rich image upload error', 'error');
        } finally {
          setTimeout(() => {
            setRichUploadProgress(prev => {
              const updated = { ...prev };
              delete updated[idx];
              return updated;
            });
          }, 1500);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const applyRichLayoutTemplate = () => {
    const placeholders = [
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600',
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600',
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600',
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600'
    ];
    const img = richImages.map((img, i) => img.trim() ? img : placeholders[i]);

    let generatedHTML = '';
    
    if (selectedLayout === 'grid') {
      generatedHTML = `<div class="space-y-6 my-6 p-6 border border-neutral-100 rounded-3xl bg-neutral-50 max-w-4xl mx-auto text-left">
  <div class="text-center pb-2 border-b border-neutral-250">
    <h4 class="font-serif font-black text-xl text-neutral-900 mb-2">${prodTitle || 'Bespoke Premium Specifications'}</h4>
    <div class="text-[9px] text-neutral-400 font-mono tracking-wider uppercase">Fulfillment: Newark Hub & Frankfurt Node Authorized</div>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
    <div class="bg-white border rounded-2xl overflow-hidden p-3 shadow-xs space-y-2">
      <img src="${img[0]}" class="w-full h-40 object-cover rounded-xl border bg-neutral-50" />
      <p class="font-bold text-xs text-neutral-800">01. Heavyweight Fabric Structure</p>
      <p class="text-[11px] text-neutral-500 leading-relaxed">Spun with premium double-combed long cotton strands. Stitched meticulously for comfort and breathability.</p>
    </div>
    <div class="bg-white border rounded-2xl overflow-hidden p-3 shadow-xs space-y-2">
      <img src="${img[1]}" class="w-full h-40 object-cover rounded-xl border bg-neutral-50" />
      <p class="font-bold text-xs text-neutral-800">02. High Contrast Vector Dynamic</p>
      <p class="text-[11px] text-neutral-500 leading-relaxed">Each graphic print preserves deep tone saturation, standing up to hundreds of washing cycles without fading.</p>
    </div>
    <div class="bg-white border rounded-2xl overflow-hidden p-3 shadow-xs space-y-2">
      <img src="${img[2]}" class="w-full h-40 object-cover rounded-xl border bg-neutral-50" />
      <p class="font-bold text-xs text-neutral-800">03. Local Regional Fulfillment</p>
      <p class="text-[11px] text-neutral-500 leading-relaxed">Dispatched from active Newark (US) and Frankfurt (EU) shipping lines, ensuring standard 3-5 days delivery.</p>
    </div>
    <div class="bg-white border rounded-2xl overflow-hidden p-3 shadow-xs space-y-2">
      <img src="${img[3]}" class="w-full h-40 object-cover rounded-xl border bg-neutral-50" />
      <p class="font-bold text-xs text-neutral-800">04. Custom Detail Craftsmanship</p>
      <p class="text-[11px] text-neutral-500 leading-relaxed">Add personalized couples dates or graphic typography. Double stitched hem holds shape for lasting years.</p>
    </div>
  </div>
  <div class="border-t pt-4 text-center">
    <p class="text-neutral-600 text-xs">${prodDesc || 'Our custom apparel holds peak ratings for breathable softness and geographical delivery precision. Order yours with 100% confidence guaranteed!'}</p>
  </div>
</div>`;
    } else if (selectedLayout === 'staggered') {
      generatedHTML = `<div class="space-y-8 my-6 p-6 border border-neutral-100 rounded-3xl bg-white max-w-4xl mx-auto text-left">
  <div class="border-b pb-4 text-center">
    <h3 class="font-serif font-black text-neutral-900 text-xl tracking-tight mb-1">✨ ${prodTitle || 'Premium Product Details'}</h3>
    <span class="text-[9px] uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded font-mono border border-emerald-200">GEO Fulfilled Standards</span>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
    <img src="${img[0]}" class="w-full h-48 object-cover rounded-2xl border bg-neutral-50 shadow-sm" />
    <div class="space-y-2">
      <h4 class="font-bold text-neutral-800 text-sm">01. Heavyweight Combed Cotton Blend</h4>
      <p class="text-neutral-500 text-xs leading-relaxed font-sans">Spun meticulously in regional eco-nodes to preserve fabric density. Engineered to maintain absolute softness and form structure over years.</p>
    </div>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
    <div class="order-2 md:order-1 space-y-2 text-right">
      <h4 class="font-bold text-neutral-800 text-sm">02. High Sizing and Elastic Comfort</h4>
      <p class="text-neutral-500 text-xs leading-relaxed font-sans">Compliant with standard US and European dimensions. Regular fit allows relaxed layering of coupled items.</p>
    </div>
    <img src="${img[1]}" class="order-1 md:order-2 w-full h-48 object-cover rounded-2xl border bg-neutral-50 shadow-sm" />
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
    <img src="${img[2]}" class="w-full h-48 object-cover rounded-2xl border bg-neutral-50 shadow-sm" />
    <div class="space-y-2">
      <h4 class="font-bold text-neutral-800 text-sm">03. High-Fidelity Vector Graphics</h4>
      <p class="text-neutral-500 text-xs leading-relaxed font-sans">No color bleeding or cracking. Each print is treated under precise thermal dynamic pressure matching international e-commerce ratings.</p>
    </div>
  </div>
</div>`;
    } else if (selectedLayout === 'banner') {
      generatedHTML = `<div class="space-y-6 my-6 p-0 overflow-hidden border border-neutral-100 rounded-3xl bg-neutral-50 max-w-4xl mx-auto text-left">
  <div class="relative h-64 bg-neutral-900 flex items-center justify-center">
    <img src="${img[0]}" class="absolute inset-0 w-full h-full object-cover opacity-60" />
    <div class="relative text-center p-6 text-white space-y-2">
      <h3 class="font-serif font-black text-2xl tracking-tight uppercase">${prodTitle || 'Premium Collection'}</h3>
      <p class="text-xs font-mono font-medium tracking-wide">Fulfillment: Dispatched from Global Logistic Nodes (Newark / Frankfurt)</p>
    </div>
  </div>
  <div class="p-6 space-y-6">
    <p class="text-center text-sm font-medium text-neutral-700 leading-relaxed font-sans">${prodDesc || 'Our bespoke customizable gifts represent unparalleled beauty and styling longevity. Highly optimized for digital storefronts and regional transport.'}</p>
    <div class="grid grid-cols-3 gap-4">
      <div class="space-y-1.5"><img src="${img[1]}" class="w-full aspect-video object-cover rounded-xl border bg-white animate-fade-in" /><p class="text-[10px] font-bold text-center text-neutral-700 font-mono">Detail Fitting</p></div>
      <div class="space-y-1.5"><img src="${img[2]}" class="w-full aspect-video object-cover rounded-xl border bg-white animate-fade-in" /><p class="text-[10px] font-bold text-center text-neutral-700 font-mono">Deep Dye</p></div>
      <div class="space-y-1.5"><img src="${img[3]}" class="w-full aspect-video object-cover rounded-xl border bg-white animate-fade-in" /><p class="text-[10px] font-bold text-center text-neutral-700 font-mono">Gift Ready</p></div>
    </div>
  </div>
</div>`;
    } else if (selectedLayout === 'editorial') {
      generatedHTML = `<div class="space-y-12 my-8 p-8 border border-neutral-100 rounded-3xl bg-neutral-50 max-w-4xl mx-auto text-left font-sans">
  <!-- Brand Header Section -->
  <div class="text-center pb-6 border-b border-neutral-200">
    <span class="text-[10px] text-brand-650 font-bold uppercase tracking-widest block mb-2">Grobrav Custom Atelier / 奢华定制工坊系列</span>
    <h3 class="font-serif font-black text-2xl text-neutral-900 mb-2">${prodTitle || 'Bespoke Premium Piece'}</h3>
    <p class="text-xs text-neutral-500 italic max-w-lg mx-auto">每一件定制，都是时光与心意的优雅交织。Every custom piece is a delicate weaving of memories and craftsmanship.</p>
  </div>

  <!-- Story & Craft Section -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
    <div class="space-y-4">
      <div class="text-xs text-brand-650 font-bold tracking-wider uppercase">01 / Exceptional Fabric Choice / 顶级甄选面料</div>
      <h4 class="text-lg font-bold text-neutral-800 leading-tight">高克重重磅纯棉，极致温润亲肤</h4>
      <p class="text-xs text-neutral-500 leading-relaxed">
        我们精选 100% 顶级双梳长绒棉（Double-Combed Cotton），拥有高达 400g 的重磅肌理感，内里经过超细微拉绒处理，呈现极致软糯、厚实且挺括的奢华质感。
        We select only the finest double-combed long-staple cotton, spun into high-density 400g fleece to deliver a structured drape and premium thermal comfort.
      </p>
    </div>
    <div class="aspect-video rounded-2xl overflow-hidden border bg-white shadow-xs">
      <img src="${img[0]}" class="w-full h-full object-cover" />
    </div>
  </div>

  <!-- Details & Printing Section -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
    <div class="order-2 md:order-1 aspect-video rounded-2xl overflow-hidden border bg-white shadow-xs">
      <img src="${img[1]}" class="w-full h-full object-cover" />
    </div>
    <div class="order-1 md:order-2 space-y-4">
      <div class="text-xs text-brand-650 font-bold tracking-wider uppercase">02 / High-Fidelity Printing / 顶级环保热升华及刺绣工艺</div>
      <h4 class="text-lg font-bold text-neutral-800 leading-tight">高清晰、防开裂，锁住灵感原色</h4>
      <p class="text-xs text-neutral-500 leading-relaxed">
        采用德国进口环保染料与分子压嵌技术，在高温高压下将手绘线条及影像深层固化于纤维内部。不仅色彩极其饱满细腻，更保证数百次机洗后，图案依然平整如新、不掉色不起泡。
        Using state-of-the-art ecological sub-dyeing and micro-embroidery techniques. Colors are deeply fused with organic fibers to ensure non-fading vividness.
      </p>
    </div>
  </div>

  <!-- Sizing & Fit Section -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
    <div class="space-y-4">
      <div class="text-xs text-brand-650 font-bold tracking-wider uppercase">03 / Universal Silhouette & Tailoring / 剪裁艺术与黄金比例</div>
      <h4 class="text-lg font-bold text-neutral-800 leading-tight">包容性极佳的极简微阔版型</h4>
      <p class="text-xs text-neutral-500 leading-relaxed">
        秉承落肩美学设计，经过数百次亚洲及欧美体型打版调整，实现极富包裹感却不臃肿的黄金比例。支持个性化字母刺绣、特定纪念日微雕雕刻，为您呈献无可替代的专属好礼。
        Designed with a contemporary dropped-shoulder fit, structurally balanced for both unisex standard styling. Allows endless layering versatility.
      </p>
    </div>
    <div class="aspect-video rounded-2xl overflow-hidden border bg-white shadow-xs">
      <img src="${img[2]}" class="w-full h-full object-cover" />
    </div>
  </div>

  <!-- Logistics & Presentation Section -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
    <div class="order-2 md:order-1 aspect-video rounded-2xl overflow-hidden border bg-white shadow-xs">
      <img src="${img[3]}" class="w-full h-full object-cover" />
    </div>
    <div class="order-1 md:order-2 space-y-4">
      <div class="text-xs text-brand-650 font-bold tracking-wider uppercase">04 / Luxury Packaging & Swift Shipping / 精美礼盒与跨国派送</div>
      <h4 class="text-lg font-bold text-neutral-800 leading-tight">尊贵丝带防尘包装，极速保驾护航</h4>
      <p class="text-xs text-neutral-500 leading-relaxed">
        每一份定制品在出厂前均需通过双重人工质检，使用防潮防尘纸覆盖，并放入带有品牌封蜡与丝带的高级礼盒中，非常适合情侣互赠及节日感恩送礼。新泽西、法兰克福仓库现货保障，极速寄递。
        Double inspected, tissue-wrapped, and nestled within signature gift-ready presentation boxes. Hand-packed with care to match absolute gifting standards.
      </p>
    </div>
  </div>

  <!-- Technical Specs Table -->
  <div class="border-t border-neutral-200 pt-8">
    <h4 class="font-serif font-black text-sm text-neutral-800 mb-4 text-center">规格与保养指南 (Specifications & Care Guidelines)</h4>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
      <div class="bg-white border rounded-xl p-4 space-y-2">
        <p class="font-bold text-neutral-800">材质详情 / Fabric details:</p>
        <ul class="list-disc pl-4 space-y-1 text-neutral-500">
          <li>100% 极奢精梳有机棉 (Premium Organic Combed Cotton)</li>
          <li>厚度：400g/m² 重磅保暖 (Heavyweight 400g/m² Fleece)</li>
          <li>亲肤、吸汗、不起毛球 (Anti-pilling & Ultra Breathable)</li>
        </ul>
      </div>
      <div class="bg-white border rounded-xl p-4 space-y-2">
        <p class="font-bold text-neutral-800">清洗保养 / Wash & Care Instruction:</p>
        <ul class="list-disc pl-4 space-y-1 text-neutral-500">
          <li>建议反面手洗或使用洗衣网冷水轻柔机洗 (Wash inside out)</li>
          <li>切勿使用强力漂白剂、不宜高温烘干 (Do not bleach / tumble dry)</li>
          <li>中温整烫、图案印花部分请避开熨烫 (Iron on medium, avoid graphics)</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Final Footer Callout -->
  <div class="border-t border-neutral-200 pt-6 text-center space-y-2">
    <p class="text-xs text-neutral-600 font-medium">✨ 100% 满意保驾护航：如果收到有任何定制尺寸或质量问题，我们提供 24 小时全天候无忧退换支持。</p>
    <p class="text-[10px] text-neutral-400 font-mono tracking-widest uppercase">Grobrav - Create memories that linger forever.</p>
  </div>
</div>`;
    } else {
      generatedHTML = `<div class="p-6 border border-neutral-100 rounded-2xl bg-white space-y-6 max-w-4xl mx-auto text-left">
  <h3 class="font-serif font-black text-neutral-900 text-lg border-b pb-2 mb-2">💎 Ultimate Styling Properties</h3>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
    <div class="border rounded-xl p-3 space-y-2 bg-neutral-50"><img src="${img[0]}" class="w-full h-24 object-cover rounded-lg" /><p class="font-bold text-[11px] text-neutral-800">Breathable Weave</p><p class="text-[9px] text-neutral-500 font-sans">Premium yarn structure guarantees soft breathability.</p></div>
    <div class="border rounded-xl p-3 space-y-2 bg-neutral-50"><img src="${img[1]}" class="w-full h-24 object-cover rounded-lg" /><p class="font-bold text-[11px] text-neutral-800">Anti-Scratch Dye</p><p class="text-[9px] text-neutral-500 font-sans">High pressure sub-dye ensures non-cracking fidelity.</p></div>
    <div class="border rounded-xl p-3 space-y-2 bg-neutral-50"><img src="${img[2]}" class="w-full h-24 object-cover rounded-lg" /><p class="font-bold text-[11px] text-neutral-800">Direct Delivery</p><p class="text-[9px] text-neutral-500 font-sans">Processed in hours, dispatched via domestic regional networks.</p></div>
    <div class="border rounded-xl p-3 space-y-2 bg-neutral-50"><img src="${img[3]}" class="w-full h-24 object-cover rounded-lg" /><p class="font-bold text-[11px] text-neutral-800">Premium Fit</p><p class="text-[9px] text-neutral-500 font-sans">Regular international fitting standard matches sizing specs.</p></div>
  </div>
</div>`;
    }

    setProdRichText(generatedHTML);
    showToast('Applied selected layout layout and synthesized details to the rich editor!', 'success');
  };

  // Custom SMTP configuration save handler
  const handleSaveSmtpConfig = async () => {
    setEdmSmtpSaving(true);
    try {
      await api.saveEDMConfig(edmSmtpConfig);
      showToast('SMTP configuration saved successfully! / SMTP 邮箱服务配置已保存并同步！', 'success');
      setEdmIsSmtpConfigOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save configuration', 'error');
    } finally {
      setEdmSmtpSaving(false);
    }
  };

  // Insert Recommended Products HTML block into Newsletter Content
  const insertRecommendationCardHTML = () => {
    if (!recommendedBestSellers || recommendedBestSellers.length === 0) {
      showToast('No best seller products found to recommend! / 没有找到可推荐的热销商品！', 'warning');
      return;
    }

    let cardsHtml = '';
    recommendedBestSellers.forEach((prod: any) => {
      const priceVal = typeof prod.price === 'number' ? prod.price.toFixed(2) : parseFloat(prod.price || '0').toFixed(2);
      const originalPriceVal = prod.originalPrice 
        ? (typeof prod.originalPrice === 'number' ? prod.originalPrice.toFixed(2) : parseFloat(prod.originalPrice || '0').toFixed(2))
        : (parseFloat(priceVal) * 1.5).toFixed(2);
      
      cardsHtml += `
    <!-- Product Card: ${prod.name} -->
    <div style="background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; padding: 12px; width: 180px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02); display: inline-block; margin: 5px; vertical-align: top;">
      <img src="${prod.imageUrl || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200'}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;" />
      <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #111827; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${prod.name}</h4>
      <div style="color: #fbbf24; font-size: 11px; margin-bottom: 8px;">★ ★ ★ ★ ★</div>
      <div style="font-size: 14px; color: #db2777; font-weight: bold;">$${priceVal} <span style="font-size: 11px; color: #9ca3af; text-decoration: line-through; font-weight: normal;">$${originalPriceVal}</span></div>
      <a href="https://www.grobrav.com/product/${prod.id}" target="_blank" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 6px 12px; font-size: 11px; font-weight: bold; text-decoration: none; border-radius: 6px; margin-top: 10px;">立即定制 →</a>
    </div>`;
    });

    const recommendationBlock = `
  <!-- Recommended Products Container -->
  <div style="margin: 30px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #fafafa; text-align: center;">
    <p style="margin: 0 0 15px 0; font-size: 13px; color: #db2777; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; text-align: center;">🔥为您特别推荐的 Bestseller 爆款 / Just For You</p>
    <div style="text-align: center;">
      ${cardsHtml}
    </div>
  </div>
`;

    // Append to existing content or insert after greeting
    if (edmNewsletterContent.includes('亲爱的')) {
      const parts = edmNewsletterContent.split('</p>');
      if (parts.length > 1) {
        parts[1] = parts[1] + recommendationBlock;
        setEdmNewsletterContent(parts.join('</p>'));
      } else {
        setEdmNewsletterContent(edmNewsletterContent + recommendationBlock);
      }
    } else {
      setEdmNewsletterContent(edmNewsletterContent + recommendationBlock);
    }
    
    showToast('Success! Inserted personalized recommendation product card to template. / 成功将选品推荐卡片插入邮件模板中！', 'success');
  };

  // AI draft writing with recommended products
  const aiDraftWithRecommendations = async () => {
    if (!recommendedBestSellers || recommendedBestSellers.length === 0) {
      showToast('No best seller products found to draft with! / 没有找到可供撰写的热销商品！', 'warning');
      return;
    }
    const productNames = recommendedBestSellers.map((p: any) => `「${p.name}」`).join(' 和 ');
    const draftPrompt = `为客户特别量身推荐他之前最喜爱的类别的畅销爆款产品 ${productNames}。写一封高质感且温暖真诚的电子邮件，向他详细介绍这两款商品的重磅材质工艺（400g重磅有机棉等）和精湛的个性化刺绣、定制服务，并随信附赠一张 15% 专属折价券卡片。`;
    
    setEdmTopicPrompt(draftPrompt);
    setDraftingAI(true);
    try {
      const data = await api.aiDraftNewsletter(draftPrompt, edmDraftLanguage);
      setEdmNewsletterTitle(data.title || '特别为您甄选：关于爱与温暖的专属心意礼物 🎁');
      setEdmNewsletterContent(data.content || '');
      showToast('AI personalized draft with recommendations generated successfully! / AI 已成功根据您的购买类别选品生成精美邮件正文！', 'success');
    } catch (err: any) {
      showToast('Failed to connect with writing assistance.', 'error');
    } finally {
      setDraftingAI(false);
    }
  };

  // EDM Newsletter Generation with AI writing capabilities using Gemini model!
  const handleDraftAIEDM = async () => {
    if (!edmTopicPrompt) {
      showToast('Please type a draft topic for the AI first.', 'error');
      return;
    }

    setDraftingAI(true);
    try {
      const data = await api.aiDraftNewsletter(edmTopicPrompt, edmDraftLanguage);
      setEdmNewsletterTitle(data.title || 'Exquisite Grobrav News updates');
      setEdmNewsletterContent(data.content || '');
      showToast('AI synthesized professional draft successfully. Edit details below.', 'success');
      trackEvent('admin_ai_draft_edm_success', { topic: edmTopicPrompt, language: edmDraftLanguage });
    } catch (err: any) {
      showToast('Failed to connect with writing assistance.', 'error');
    } finally {
      setDraftingAI(false);
    }
  };

  // Send campaign newsletter
  const handleDispatchEDM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edmNewsletterTitle || !edmNewsletterContent) return;

    let selectedList: { name: string; email: string }[] = [];

    if (edmRecipientType === 'all') {
      // Filter from allCandidatesList based on edmSourceType and edmSelectedCountry
      allCandidatesList.forEach((c) => {
        const isFromSub = c.source === 'subscriber';
        const isFromOrder = c.source === 'order';

        // Match source
        let matchesSource = false;
        if (edmSourceType === 'all') {
          matchesSource = true;
        } else if (edmSourceType === 'subscribers' && isFromSub) {
          matchesSource = true;
        } else if (edmSourceType === 'orderCustomers' && isFromOrder) {
          matchesSource = true;
        }

        // Match country
        let matchesCountry = false;
        if (edmSelectedCountry === 'all') {
          matchesCountry = true;
        } else if (edmSelectedCountry === 'Unknown' && c.country === 'Unknown') {
          matchesCountry = true;
        } else if (c.country === edmSelectedCountry) {
          matchesCountry = true;
        }

        if (matchesSource && matchesCountry) {
          selectedList.push({ name: c.name, email: c.email });
        }
      });
    } else {
      // edmRecipientType === 'specific'
      edmSelectedRecipients.forEach(email => {
        const lowerEmail = email.toLowerCase().trim();
        const cand = allCandidatesList.find(c => c.email === lowerEmail);
        const name = cand ? cand.name : lowerEmail.split('@')[0];
        selectedList.push({ name, email: lowerEmail });
      });
    }

    if (selectedList.length === 0) {
      showToast('No recipients selected. Please select at least one recipient address. / 尚未选择任何收件人邮箱。', 'error');
      return;
    }

    setDispatchingEDM(true);
    try {
      const data = await api.sendEDM({ 
        title: edmNewsletterTitle, 
        content: edmNewsletterContent,
        recipients: selectedList
      });
      
      showToast(data.message || `Campaign EDM dispatched! Delivered successfully to ${data.subscribersEmailedCount || 0} recipient(s).`, 'success');
      setEdmNewsletterTitle('');
      setEdmNewsletterContent('');
      setEdmTopicPrompt('');
      setEdmSelectedRecipients([]);
      
      // Refresh to load updated campaigns
      await fetchAdminStats();
      
      trackEvent('admin_edm_dispatched', { title: edmNewsletterTitle, count: selectedList.length });
    } catch (err: any) {
      showToast(err.message || 'SMTP or Connection Error.', 'error');
    } finally {
      setDispatchingEDM(false);
    }
  };

  // Clear comment feedback
  const handleDeleteReview = async (productId: string, reviewId: string) => {
    triggerDeleteConfirmation(
      al("确认删除顾客评价反馈？", "Confirm Deleting Review?"),
      al("您确定要永久删除这条顾客评价反馈吗？该评价将立即从该商品的前台详情页面中完全隐藏。", "Are you sure you want to permanently delete this customer review feedback? This statement will immediately and completely disappear from the product's storefront detail page."),
      async () => {
        try {
          await api.deleteReview(productId, reviewId);
          showToast('Review comment deleted successfully.', 'success');
          await refreshState();
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    );
  };

  // Login Gate Protection
  if (!isAuthenticated) {
    return (
      <div id="admin-login-vault" className="max-w-md mx-auto px-4 py-24">
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 bg-brand-50 text-brand-650 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock size={24} />
            </div>
            <h1 className="text-2xl font-serif font-black text-neutral-900">Merchant Workspace</h1>
            <p className="text-xs text-neutral-500 mt-1">Please log in to administrative panel directories.</p>
          </div>

          {authError && (
            <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs border border-red-100 flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-650 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Office Email</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white text-sm outline-none font-semibold text-neutral-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1 font-mono">Secured Password</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white text-sm outline-none font-mono"
              />
            </div>

            <Button type="submit" fullWidth size="lg" disabled={authLoading} className="font-bold flex justify-center gap-1">
              {authLoading && <Loader2 size={16} className="animate-spin" />}
              Acknowledge Credentials
            </Button>
          </form>

          <p className="text-[10px] text-neutral-450 leading-relaxed text-center font-mono">
            Default sandbox key: <strong>admin@grobrav.com</strong> and password: <strong>admin</strong>. Firewalls trace brute-force logins automatically on host logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="merchant-control-center" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      
      {/* SECURITY ATTENTION WARNING FOR DEFAULT PASSWORD */}
      {defaultPassWarning && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-amber-800 animate-pulse shadow-sm">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-100 rounded-lg text-amber-600 shrink-0">
              <AlertTriangle size={16} />
            </span>
            <div>
              <p className="font-bold text-neutral-950">
                {al("【安全警告】您当前仍在使用默认的管理员密码！", "🚨 SECURITY WARNING: Using Default Admin Credentials")}
              </p>
              <p className="text-neutral-600 mt-0.5">
                {al("这使得您的后台面临极高的被盗风险。请立刻前往「密码安全设置」选项卡，修改为一个高强度的复杂密码。", "This puts your control board at extreme risk. Please immediately head to 'Admin Security Profile' tab to update your password.")}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setActiveTab('profile')} 
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-3xs cursor-pointer text-center"
          >
            {al("立刻修改密码", "Secure Now")}
          </button>
        </div>
      )}

      {/* Toast popup */}
      {feedback && (
        <div className={`fixed top-24 right-6 z-50 rounded-xl shadow-lg p-4 flex items-center gap-2 border ${
          feedbackType === 'success' ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-red-900 border-red-800 text-white'
        }`}>
          <span className="text-xs font-bold">{feedback}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-150 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-black text-neutral-900 tracking-tight flex items-center gap-2">
            {al("Grobrav 管理商户后台", "Grobrav Control Board")} <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
          </h1>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            {al("国家认证全栈云端端点已上线 / 安全会话", "ADMIN OFFICE SECURE SESSION / SIMULATED PERSISTENCE")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Active bilingual locale switch toggle */}
          <button 
            type="button"
            onClick={() => {
              setAdminLang(prev => prev === 'en' ? 'zh' : 'en');
              showToast(adminLang === 'en' ? '已切换至中文管理面板 / Switching to Chinese' : 'Switched to English interface / 切换至英文面板', 'success');
            }}
            className="px-3.5 py-2 bg-brand-55 text-brand-750 hover:bg-brand-100 rounded-xl text-xs font-black tracking-wide transition-all border border-brand-200/60 shadow-2xs flex items-center gap-1 cursor-pointer select-none"
          >
            🌐 {adminLang === 'en' ? '切换为中文 (ZH)' : 'Switch to English (EN)'}
          </button>

          <button onClick={fetchAdminStats} className="p-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl hover:scale-105 duration-200" title="Sync backend reports">
            <RefreshCw size={16} className={gaLoading ? "animate-spin" : ""} />
          </button>
          
          <Button onClick={handleAdminLogout} variant="outline" className="text-xs font-bold text-red-650 border-red-100 hover:bg-red-50">
            {al("安全签退 Session", "Secure Session Sign-out")}
          </Button>
        </div>
      </div>

      {/* Grid Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
        
        {/* Left Column Navigation Tabs */}
        <div className="space-y-1.5">
          <button onClick={() => setActiveTab('stats')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all uppercase flex items-center gap-2.5 ${activeTab === 'stats' ? 'bg-neutral-950 text-white shadow' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            <TrendingUp size={15} /> Google GA Compliance
          </button>
          <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all uppercase flex items-center gap-2.5 ${activeTab === 'orders' ? 'bg-neutral-950 text-white shadow' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            <Truck size={15} /> {al("订单与物流管理", "Orders & Shipment")}
          </button>
          <button onClick={() => setActiveTab('gateways')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all uppercase flex items-center gap-2.5 ${activeTab === 'gateways' ? 'bg-neutral-950 text-white shadow' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            <CreditCard size={15} /> Payment Gateways
          </button>
          <button onClick={() => setActiveTab('products')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all uppercase flex items-center gap-2.5 ${activeTab === 'products' ? 'bg-neutral-950 text-white shadow' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            <ShoppingBag size={15} /> Products Upload
          </button>
          <button onClick={() => setActiveTab('categories')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all uppercase flex items-center gap-2.5 ${activeTab === 'categories' ? 'bg-neutral-950 text-white shadow' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            <Globe size={15} /> Custom Collections
          </button>
          <button onClick={() => setActiveTab('coupons')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all uppercase flex items-center gap-2.5 ${activeTab === 'coupons' ? 'bg-neutral-950 text-white shadow' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            <Plus size={15} /> Discount codes
          </button>
          <button onClick={() => setActiveTab('edm')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all uppercase flex items-center gap-2.5 ${activeTab === 'edm' ? 'bg-neutral-950 text-white shadow' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            <Mail size={15} /> EDM Email Marketing
          </button>
          <button onClick={() => setActiveTab('reviews')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all uppercase flex items-center gap-2.5 ${activeTab === 'reviews' ? 'bg-neutral-950 text-white shadow' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            <FileText size={15} /> Manage Reviews
          </button>
          <button onClick={() => setActiveTab('profile')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all uppercase flex items-center gap-2.5 ${activeTab === 'profile' ? 'bg-neutral-950 text-white shadow' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            <Lock size={15} /> Admin Security Profile
          </button>
          <button onClick={() => setActiveTab('contact')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all uppercase flex items-center gap-2.5 ${activeTab === 'contact' ? 'bg-neutral-950 text-white shadow' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            <Settings size={15} /> Store contact & slogan
          </button>
          <button onClick={() => setActiveTab('pages_content')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all uppercase flex items-center gap-2.5 ${activeTab === 'pages_content' ? 'bg-neutral-950 text-white shadow' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            <FileText size={15} /> Edit Static Pages
          </button>
          <button onClick={() => setActiveTab('pixels')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all uppercase flex items-center gap-2.5 ${activeTab === 'pixels' ? 'bg-neutral-950 text-white shadow' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            <Code2 size={15} /> Pixels & SEO Settings
          </button>
          <button onClick={() => setActiveTab('support_messages')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all uppercase flex items-center gap-2.5 ${activeTab === 'support_messages' ? 'bg-neutral-950 text-white shadow' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            <MessageSquare size={15} /> Customer support inbox
          </button>
          <button onClick={() => setActiveTab('warranties')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all uppercase flex items-center gap-2.5 ${activeTab === 'warranties' ? 'bg-neutral-950 text-white shadow' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            <Shield size={15} className="text-brand-650" /> {al("售后延保申请管理", "After-Sales Warranties")}
          </button>
        </div>

        {/* Right Columns Dynamic View panels */}
        <div className="lg:col-span-3 bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          
          {/* TAB 1: GOOGLE ANALYTICS METRICS */}
          {activeTab === 'stats' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-serif font-black text-neutral-900">{al("谷歌 GA 流量与转化分析中心", "Google GA Traffic & Conversion Analytics Portal")}</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">{al("实时统计全站流量来源、商品访问、加购和下单购买漏斗转化。", "Real-time statistics of traffic sources, product views, add-to-carts, and purchase funnel conversion.")}</p>
                </div>
                <button
                  onClick={fetchAdminStats}
                  disabled={gaLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-all border shadow-2xs"
                >
                  <RefreshCw size={13} className={gaLoading ? 'animate-spin' : ''} />
                  {al("刷新数据", "Refresh Stats")}
                </button>
              </div>

              {gaStats ? (
                <div className="space-y-6">
                  {/* Top Row: Conversion Core Indicators / 四大核心转化指标 */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-neutral-50 border p-5 rounded-2xl relative overflow-hidden group shadow-2xs">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                        <Users size={12} className="text-indigo-500" />
                        {al("总浏览量 (访问) / Sessions", "Total Traffic / Sessions")}
                      </p>
                      <h3 className="text-2xl font-black text-neutral-900 mt-1">{gaStats.metrics?.pageviews || gaStats.pageViews || 0}</h3>
                      <p className="text-[10px] text-neutral-400 mt-1">{al("实时在线用户", "Live active users")}: <span className="font-bold font-mono text-emerald-600">● {gaStats.metrics?.liveUsers || 5}</span></p>
                    </div>

                    <div className="bg-neutral-50 border p-5 rounded-2xl relative overflow-hidden group shadow-2xs">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                        <Eye size={12} className="text-amber-500" />
                        {al("商品浏览量 / Product Views", "Product Views")}
                      </p>
                      <h3 className="text-2xl font-black text-neutral-900 mt-1">{gaStats.metrics?.product_views || 0}</h3>
                      <p className="text-[10px] text-neutral-400 mt-1">{al("漏斗转化率", "Funnel view-rate")}: <span className="font-bold">{(gaStats.metrics?.pageviews ? ((gaStats.metrics.product_views / gaStats.metrics.pageviews) * 100).toFixed(1) : 65)}%</span></p>
                    </div>

                    <div className="bg-neutral-50 border p-5 rounded-2xl relative overflow-hidden group shadow-2xs">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                        <ShoppingBag size={12} className="text-pink-500" />
                        {al("加入购物车次数 / Add To Carts", "Add To Carts")}
                      </p>
                      <h3 className="text-2xl font-black text-pink-650 mt-1">{gaStats.metrics?.carts || 0}</h3>
                      <p className="text-[10px] text-neutral-400 mt-1">{al("加购转化率 / Cart Rate", "Cart Rate")}: <span className="font-bold">{(gaStats.metrics?.product_views ? ((gaStats.metrics.carts / gaStats.metrics.product_views) * 100).toFixed(1) : 27.6)}%</span></p>
                    </div>

                    <div className="bg-neutral-50 border p-5 rounded-2xl relative overflow-hidden group shadow-2xs">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                        <TrendingUp size={12} className="text-teal-500" />
                        {al("订单成交量 (购买) / Purchases", "Fulfillment Purchases")}
                      </p>
                      <h3 className="text-2xl font-black text-teal-800 mt-1">{gaStats.metrics?.purchases || gaStats.ordersCount || 0}</h3>
                      <p className="text-[10px] text-neutral-400 mt-1">{al("整体转换率 (总购买/总流量)", "Conversion Rate")}: <span className="font-bold text-teal-700">{(gaStats.metrics?.pageviews ? ((gaStats.metrics.purchases / gaStats.metrics.pageviews) * 100).toFixed(1) : 2.5)}%</span></p>
                    </div>
                  </div>

                  {/* Mid Row: Traffic Sources Breakdown vs Conversion Funnel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Traffic Source Channels / 流量的具体来源渠道 */}
                    <div className="bg-white border rounded-2xl p-5 shadow-2xs">
                      <h3 className="font-serif font-bold text-neutral-800 text-xs uppercase tracking-wider mb-4 pb-2 border-b flex items-center gap-2">
                        <Globe size={14} className="text-neutral-500" />
                        {al("流量具体来源渠道分析 / Traffic Acquisition Channels", "Traffic Acquisition Channels")}
                      </h3>
                      
                      <div className="space-y-3.5 text-xs">
                        {gaStats.channels ? (
                          Object.entries(gaStats.channels).map(([channel, val]: any) => {
                            const total = Object.values(gaStats.channels).reduce((a: any, b: any) => a + b, 0) as number;
                            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                            
                            // Visual color matching for top channels
                            let barColor = "bg-neutral-500";
                            if (channel === 'facebook') barColor = "bg-blue-600";
                            else if (channel === 'google') barColor = "bg-red-500";
                            else if (channel === 'tiktok') barColor = "bg-neutral-900";
                            else if (channel === 'instagram') barColor = "bg-gradient-to-r from-purple-500 to-pink-500";
                            else if (channel === 'twitter' || channel === 'x') barColor = "bg-neutral-800";
                            else if (channel === 'direct') barColor = "bg-emerald-600";
                            else if (channel === 'email') barColor = "bg-indigo-500";

                            return (
                              <div key={channel} className="space-y-1">
                                <div className="flex justify-between font-bold text-neutral-700">
                                  <span className="capitalize">{channel}</span>
                                  <span className="font-mono text-neutral-500">{val} pv <span className="text-neutral-300 font-normal">({pct}%)</span></span>
                                </div>
                                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                                  <div className={`${barColor} h-full rounded-full transition-all duration-550`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-neutral-400 py-6 text-center">{al("暂无渠道分析日志 / No acquisition channel log.", "No acquisition channel log.")}</p>
                        )}
                      </div>
                    </div>

                    {/* Conversion Funnel Simulation / 转化漏斗可视化 */}
                    <div className="bg-white border rounded-2xl p-5 shadow-2xs">
                      <h3 className="font-serif font-bold text-neutral-800 text-xs uppercase tracking-wider mb-4 pb-2 border-b flex items-center gap-2">
                        <TrendingUp size={14} className="text-neutral-500" />
                        {al("顾客转化漏斗 / Customer Conversion Funnel", "Customer Conversion Funnel")}
                      </h3>

                      <div className="space-y-4 text-xs font-medium">
                        {/* 1. Pageviews */}
                        <div className="space-y-1">
                          <div className="flex justify-between font-bold text-neutral-700">
                            <span>1. {al("落地页访问 / Page Views", "1. Page Views")}</span>
                            <span className="font-mono">{gaStats.metrics?.pageviews || 0}</span>
                          </div>
                          <div className="w-full bg-neutral-100 h-6.5 rounded-lg overflow-hidden relative flex items-center px-3 text-[10px] text-white">
                            <div className="absolute left-0 top-0 bottom-0 bg-indigo-600 rounded-lg transition-all" style={{ width: '100%' }} />
                            <span className="relative z-10 font-bold">100% {al("基准流量", "Baseline Session")}</span>
                          </div>
                        </div>

                        {/* 2. Product Views */}
                        <div className="space-y-1">
                          <div className="flex justify-between font-bold text-neutral-700">
                            <span>2. {al("商品详情浏览 / Product Views", "2. Product Views")}</span>
                            <span className="font-mono">{gaStats.metrics?.product_views || 0}</span>
                          </div>
                          <div className="w-full bg-neutral-100 h-6.5 rounded-lg overflow-hidden relative flex items-center px-3 text-[10px] text-white">
                            {(() => {
                              const ratio = gaStats.metrics?.pageviews ? (gaStats.metrics.product_views / gaStats.metrics.pageviews) * 100 : 65;
                              return (
                                <>
                                  <div className="absolute left-0 top-0 bottom-0 bg-amber-500 rounded-lg transition-all" style={{ width: `${ratio}%` }} />
                                  <span className="relative z-10 font-bold">{ratio.toFixed(1)}% {al("转化率", "View rate")}</span>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* 3. Add to Carts */}
                        <div className="space-y-1">
                          <div className="flex justify-between font-bold text-neutral-700">
                            <span>3. {al("加入购物车 / Add to Cart", "3. Add to Cart")}</span>
                            <span className="font-mono">{gaStats.metrics?.carts || 0}</span>
                          </div>
                          <div className="w-full bg-neutral-100 h-6.5 rounded-lg overflow-hidden relative flex items-center px-3 text-[10px] text-white">
                            {(() => {
                              const ratio = gaStats.metrics?.pageviews ? (gaStats.metrics.carts / gaStats.metrics.pageviews) * 100 : 18.1;
                              return (
                                <>
                                  <div className="absolute left-0 top-0 bottom-0 bg-pink-500 rounded-lg transition-all" style={{ width: `${ratio}%` }} />
                                  <span className="relative z-10 font-bold">{ratio.toFixed(1)}% {al("整体加购率", "Overall Cart rate")}</span>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* 4. Purchases */}
                        <div className="space-y-1">
                          <div className="flex justify-between font-bold text-neutral-700">
                            <span>4. {al("完成购买结算 / Settled Purchases", "4. Settled Purchases")}</span>
                            <span className="font-mono">{gaStats.metrics?.purchases || 0}</span>
                          </div>
                          <div className="w-full bg-neutral-100 h-6.5 rounded-lg overflow-hidden relative flex items-center px-3 text-[10px] text-white">
                            {(() => {
                              const ratio = gaStats.metrics?.pageviews ? (gaStats.metrics.purchases / gaStats.metrics.pageviews) * 100 : 2.5;
                              return (
                                <>
                                  <div className="absolute left-0 top-0 bottom-0 bg-teal-600 rounded-lg transition-all" style={{ width: `${ratio}%` }} />
                                  <span className="relative z-10 font-bold text-white">{ratio.toFixed(1)}% {al("购买转化率", "Conversion rate")}</span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Orders Lists inside Admin panel */}
                  <div className="border border-neutral-150 rounded-2xl overflow-hidden text-xs shadow-2xs">
                    <div className="bg-neutral-50 p-4 border-b font-bold text-neutral-700">{al("最近销售成交明细 (实时同步)", "Recent customer transactions settled")}</div>
                    <div className="divide-y divide-neutral-150 bg-white">
                      {orders && orders.length > 0 ? (
                        orders.slice(0, 5).map((ord: any) => (
                          <div key={ord.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <div>
                              <span className="font-mono font-bold text-neutral-900 block">{ord.id}</span>
                              <p className="text-[11px] text-neutral-500">{ord.customerName} ({ord.email}) — {ord.date}</p>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <span className="font-mono font-bold text-neutral-900">${ord.total?.toFixed(2)}</span>
                              <span className="bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded text-[10px] border border-amber-100 uppercase">{ord.status}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="p-6 text-center text-neutral-400">No transactions recorded inside database yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 flex justify-center items-center">
                  <Loader2 size={24} className="animate-spin text-brand-600" />
                </div>
              )}
            </div>
          )}

          {/* TAB: ORDERS & SHIPMENT MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-serif font-black text-neutral-900">{al("订单与物流管理中心", "Orders & Fulfillment Center")}</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">{al("查看订单状态、管理买家收件人详情、单独或批量确认发货。", "View order status, manage buyer recipient profiles, confirm single or batch fulfillment.")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExportToCSV}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <Download size={14} />
                    {al("批量导出到 Excel", "Batch Export to Excel")}
                  </button>
                  <button
                    onClick={() => {
                      setIsBulkImportOpen(!isBulkImportOpen);
                      setBulkImportError('');
                      setBulkImportFeedback('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <UploadCloud size={14} />
                    {al("批量导入发货单", "Batch Import Shipments")}
                  </button>
                </div>
              </div>

              {/* Bulk Shipment Import Box */}
              {isBulkImportOpen && (
                <div className="bg-neutral-50 border border-neutral-150 p-6 rounded-2xl space-y-6 animate-fade-in text-xs shadow-2xs">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <h3 className="font-bold text-neutral-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Truck size={15} className="text-emerald-600" />
                      {al("批量发货物流同步系统 / Batch Shipping Sync System", "Batch Shipping Sync System")}
                    </h3>
                    <button 
                      onClick={() => setIsBulkImportOpen(false)}
                      className="text-neutral-400 hover:text-neutral-600 text-xs font-bold"
                    >
                      {al("关闭", "Close")}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* LEFT COLUMN: EXCEL FILES (xlsx, xls) */}
                    <div className="bg-white border p-4 rounded-xl space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h4 className="font-bold text-neutral-800 flex items-center gap-1.5">
                          <FileText size={14} className="text-emerald-600" />
                          {al("方式一：使用电子表格 (Excel) 批量发货", "Option 1: Bulk Shipping via Excel Spreadsheet")}
                        </h4>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          {al("推荐。请下载下方准备的标准运单发货 Excel 模板，填入对应的订单编号、快递商、物流单号与状态，然后一键上传导入。", "Recommended. Download our standard Excel shipping template, fill in the order IDs, carrier names, tracking numbers and status, and upload to synchronize instantly.")}
                        </p>
                      </div>

                      <div className="pt-2 space-y-3">
                        <button
                          onClick={handleDownloadShippingTemplate}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold transition-all text-xs"
                        >
                          <Download size={14} />
                          {al("下载标准发货 Excel 模版 (.xlsx)", "Download Shipping Excel Template (.xlsx)")}
                        </button>

                        <div className="relative border-2 border-dashed border-neutral-200 hover:border-emerald-400 bg-neutral-50/50 hover:bg-emerald-50/10 rounded-xl p-4 transition-all text-center">
                          <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleShippingExcelUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="space-y-1">
                            <UploadCloud className="mx-auto text-neutral-400" size={24} />
                            <p className="font-bold text-neutral-700 text-[11px]">
                              {al("点击或拖拽 Excel 发货表到此处上传", "Click or drag Excel shipping file here to upload")}
                            </p>
                            <p className="text-[10px] text-neutral-400">
                              {al("支持 .xlsx, .xls 格式", "Supports .xlsx, .xls files")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: MANUAL CSV TEXT PASTE */}
                    <div className="bg-white border p-4 rounded-xl space-y-3">
                      <h4 className="font-bold text-neutral-800 flex items-center gap-1.5">
                        <Code2 size={14} className="text-blue-600" />
                        {al("方式二：直接粘贴 CSV 发货文本快速同步", "Option 2: Direct CSV Plaintext Quick Import")}
                      </h4>
                      <div className="space-y-1.5 text-[11px] text-neutral-400">
                        <p className="font-semibold text-neutral-600">{al("支持列名（首行为表头，顺序不限）：", "Supported Column Headers (Adaptive - Any Order, 1st Row as Header):")}</p>
                        <code className="block bg-neutral-100 p-1.5 rounded text-[10px] font-mono select-all text-neutral-700 leading-none">
                          Order ID, Carrier, Tracking Number, Status
                        </code>
                      </div>

                      <textarea
                        value={bulkImportCsv}
                        onChange={(e) => setBulkImportCsv(e.target.value)}
                        placeholder="Order ID, Carrier, Tracking Number, Status&#10;GRO-20260624-001, FedEx, FDX987654321, Shipped"
                        rows={4}
                        className="w-full text-xs font-mono p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />

                      <div className="flex gap-2 justify-end">
                        <Button
                          onClick={() => {
                            setBulkImportCsv('');
                            setBulkImportError('');
                            setBulkImportFeedback('');
                          }}
                          variant="outline"
                          className="text-xs h-8"
                        >
                          {al("清空", "Clear")}
                        </Button>
                        <Button
                          onClick={() => handleBulkImportCSV(bulkImportCsv)}
                          disabled={!bulkImportCsv.trim()}
                          className="text-xs bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-1 h-8"
                        >
                          {al("解析并同步", "Parse & Sync")}
                        </Button>
                      </div>
                    </div>

                  </div>

                  {/* Feedback Logs */}
                  {(bulkImportError || bulkImportFeedback) && (
                    <div className="border-t pt-4">
                      {bulkImportError && (
                        <div className="bg-red-50 text-red-700 border border-red-100 p-3 rounded-xl text-xs font-medium flex items-center gap-1.5">
                          <AlertTriangle size={14} />
                          {bulkImportError}
                        </div>
                      )}

                      {bulkImportFeedback && (
                        <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-xl text-xs font-medium flex items-center gap-1.5">
                          <CheckCircle size={14} />
                          {bulkImportFeedback}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Search & Filter bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-50 p-3 rounded-2xl border">
                <div className="sm:col-span-2 relative">
                  <Search size={15} className="absolute left-3 top-3.5 text-neutral-400" />
                  <input
                    type="text"
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                    placeholder={al("搜索订单号、买家姓名、邮箱...", "Search by Order ID, Buyer name, Email...")}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="w-full py-2.5 px-3 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="all">{al("全部发货状态", "All Fulfillment Status")}</option>
                    <option value="In Production">{al("生产中 / In Production", "In Production")}</option>
                    <option value="Shipped">{al("已发货 / Shipped", "Shipped")}</option>
                    <option value="Cancelled">{al("已取消 / Cancelled", "Cancelled")}</option>
                  </select>
                </div>
              </div>

              {/* Order List Table */}
              <div className="border border-neutral-150 rounded-2xl overflow-hidden text-xs bg-white shadow-xs">
                <div className="bg-neutral-50 p-4 border-b font-bold text-neutral-700 flex justify-between items-center">
                  <span>{al(`查找到 ${filteredOrders.length} 个订单记录`, `Found ${filteredOrders.length} orders`)}</span>
                </div>
                <div className="divide-y divide-neutral-100">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((ord: any) => (
                      <div key={ord.id} className="p-5 hover:bg-neutral-50 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        
                        {/* Column 1: Order Identity */}
                        <div className="space-y-1 min-w-[180px]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-neutral-900 text-sm tracking-tight">{ord.id}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                              ord.status === 'Shipped' ? 'bg-emerald-50 border-emerald-150 text-emerald-700' :
                              ord.status === 'Cancelled' ? 'bg-neutral-100 border-neutral-200 text-neutral-500' :
                              'bg-amber-50 border-amber-150 text-amber-700 animate-pulse'
                            }`}>
                              {ord.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-400 font-mono">{ord.date}</p>
                          <div className="text-[11px] font-medium text-neutral-700">
                            {ord.customerName} <span className="text-neutral-400">({ord.email})</span>
                          </div>
                        </div>

                        {/* Column 2: Order Items & Specs (产品基本描述，规格，下单数量，下单金额) */}
                        <div className="flex-1 space-y-1.5 border-l border-neutral-100 pl-4">
                          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">{al("订购商品与规格描述", "Products ordered & Specifications")}</span>
                          <div className="space-y-1">
                            {ord.items && ord.items.map((it: any, idx: number) => {
                              const linkedProd = products.find((p: any) => p.name === it.name || p.sku === it.sku);
                              const itemSku = it.sku || linkedProd?.sku || 'N/A';
                              const itemSupplier = it.supplier || linkedProd?.supplier || 'N/A';
                              return (
                                <div key={idx} className="border-b border-dashed border-neutral-100 last:border-0 pb-1.5 last:pb-0">
                                  <div className="flex items-start justify-between gap-4 text-[11px]">
                                    <div className="text-neutral-800 font-semibold flex-1">
                                      {linkedProd ? (
                                        <Link 
                                          to={`/product/${linkedProd.id}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-brand-650 hover:text-brand-800 hover:underline inline-flex items-center gap-0.5"
                                          title={al("在新标签页中查看产品详情", "View product details in new tab")}
                                        >
                                          {it.name}
                                          <span className="text-[10px] font-normal opacity-70">↗</span>
                                        </Link>
                                      ) : (
                                        it.name
                                      )}
                                      <span className="ml-1 text-[10px] text-neutral-500 font-normal">
                                        ({al("规格", "Spec")}: {it.color || 'N/A'} / {it.size || 'N/A'})
                                      </span>
                                    </div>
                                    <div className="text-neutral-500 font-mono text-right">
                                      {it.quantity} x ${it.price?.toFixed(2)}
                                    </div>
                                  </div>
                                  <div className="text-[10px] text-neutral-500 mt-0.5 flex flex-wrap gap-2">
                                    <span className="bg-neutral-100 px-1.5 py-0.5 rounded font-mono">SKU: {itemSku}</span>
                                    <span className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">{al("供应商", "Supplier")}: {itemSupplier}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {ord.customText && (
                            <div className="bg-neutral-50 p-2 rounded-lg text-[10px] text-neutral-600 border border-neutral-100">
                              <span className="font-bold text-neutral-700">{al("买家定制印刻文本:", "Custom Inscription:")}</span> {ord.customText}
                            </div>
                          )}
                        </div>

                        {/* Column 3: Totals & Carrier Details */}
                        <div className="min-w-[150px] lg:text-right space-y-1 bg-neutral-50/50 p-2.5 rounded-xl lg:bg-transparent lg:p-0">
                          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">{al("下单金额 / 支付", "Subtotal & Settle")}</span>
                          <p className="text-sm font-mono font-black text-neutral-900">${ord.total?.toFixed(2)}</p>
                          <p className="text-[10px] text-neutral-500">{ord.paymentMethod || 'Credit Card'}</p>
                          
                          {ord.carrier && ord.trackingNumber && (
                            <div className="mt-1 text-[10px] text-neutral-500">
                              <span className="font-semibold block text-neutral-700">{ord.carrier}</span>
                              <a 
                                href={ord.trackingUrl || `https://www.google.com/search?q=${ord.trackingNumber}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono underline text-brand-600 break-all"
                              >
                                {ord.trackingNumber}
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Column 4: Action buttons */}
                        <div className="flex gap-2 shrink-0 lg:flex-col lg:items-end justify-start">
                          <button
                            onClick={() => setSelectedOrderForView(ord)}
                            className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-lg tracking-wide transition-all uppercase flex items-center gap-1 cursor-pointer"
                            title={al("单独查询买家收件信息与详细参数", "View full recipient profile individually")}
                          >
                            <Info size={13} />
                            {al("收件人信息", "Recipient Info")}
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedOrderForShip(ord);
                              setShipCarrier(ord.carrier || 'DHL Express');
                              setShipTrackingNumber(ord.trackingNumber || '');
                              setShipStatus(ord.status || 'Shipped');
                            }}
                            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-lg tracking-wide transition-all uppercase flex items-center gap-1 cursor-pointer"
                            title={al("确认发货填报运单物流", "Fulfill single order with tracking")}
                          >
                            <Truck size={13} />
                            {al("发货录单", "Fulfill Order")}
                          </button>
                        </div>

                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-neutral-400 space-y-2">
                      <TrendingUp size={24} className="mx-auto text-neutral-300" />
                      <p>{al("没有找到任何匹配的订单记录。", "No matching order transactions found.")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* MODAL 1: VIEW DETAILED RECIPIENT PROFILE */}
              {selectedOrderForView && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-100">
                    <div className="bg-neutral-900 text-white p-6">
                      <h3 className="text-base font-serif font-black flex items-center justify-between">
                        <span>{al("查阅买家详细收件信息", "Buyer Delivery Profile")}</span>
                        <span className="font-mono text-xs text-neutral-400 bg-white/10 px-2 py-0.5 rounded">{selectedOrderForView.id}</span>
                      </h3>
                      <p className="text-[11px] text-neutral-400 mt-1">{al("此数据直接对接买家下单支付结算时所提供的物理寄件资料。", "Raw physical fulfillment addresses supplied directly by customer during settlement checkout.")}</p>
                    </div>
                    
                    <div className="p-6 space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-0.5">{al("买家姓名", "Customer Name")}</span>
                          <p className="font-bold text-neutral-800">{selectedOrderForView.customerName}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-0.5">{al("联系电话", "Contact Phone")}</span>
                          <p className="font-mono font-bold text-neutral-800">{selectedOrderForView.phone || selectedOrderForView.items?.[0]?.phone || al("买家未填写 / N/A", "N/A")}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-0.5">{al("邮箱地址", "Registered Email")}</span>
                          <p className="font-mono text-neutral-700">{selectedOrderForView.email}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-0.5">{al("支付方式", "Settle Method")}</span>
                          <p className="text-neutral-700 uppercase">{selectedOrderForView.paymentMethod || 'Credit Card'}</p>
                        </div>
                      </div>

                      <hr className="border-neutral-100" />

                      {/* Product details and Supplier channels list */}
                      <div className="space-y-2 bg-neutral-50 p-4 rounded-2xl border border-neutral-100 text-left">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">{al("订购商品与供应商渠道", "Products & Supplier Channels")}</span>
                        <div className="space-y-2">
                          {selectedOrderForView.items && selectedOrderForView.items.map((it: any, idx: number) => {
                            const linkedProd = products.find((p: any) => p.name === it.name || p.sku === it.sku);
                            const itemSku = it.sku || linkedProd?.sku || 'N/A';
                            const itemSupplier = it.supplier || linkedProd?.supplier || 'N/A';
                            return (
                              <div key={idx} className="flex justify-between items-start gap-2 border-b border-neutral-200/40 last:border-0 pb-1.5 last:pb-0">
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-neutral-800 truncate">
                                    {linkedProd ? (
                                      <Link 
                                        to={`/product/${linkedProd.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-650 hover:text-brand-800 hover:underline inline-flex items-center gap-0.5"
                                        title={al("在新标签页中查看产品详情", "View product details in new tab")}
                                      >
                                        {it.name}
                                        <span className="text-[10px] font-normal opacity-70">↗</span>
                                      </Link>
                                    ) : (
                                      it.name
                                    )}
                                  </p>
                                  <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                                    Qty: {it.quantity} | SKU: {itemSku}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="inline-block bg-brand-50 border border-brand-150 text-brand-700 font-bold px-1.5 py-0.5 rounded text-[9px]">
                                    {al("供应商", "Supplier")}: {itemSupplier}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <hr className="border-neutral-100" />

                      <div className="space-y-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">{al("细分收件物流地址", "Fulfillment Delivery Address Details")}</span>
                        
                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                          <div>
                            <span className="text-[9px] text-neutral-400 uppercase block">{al("国家", "Country")}</span>
                            <p className="font-bold text-neutral-800">{selectedOrderForView.country || al("美国 / US", "United States")}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-neutral-400 uppercase block">{al("州 / 省", "State / Province")}</span>
                            <p className="font-bold text-neutral-800">{selectedOrderForView.state || al("未细化 / N/A", "N/A")}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-neutral-400 uppercase block">{al("城市", "City")}</span>
                            <p className="font-bold text-neutral-800">{selectedOrderForView.city || al("未细化 / N/A", "N/A")}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-neutral-400 uppercase block">{al("邮政编码", "ZIP or Postal Code")}</span>
                            <p className="font-mono font-bold text-neutral-800">{selectedOrderForView.zipCode || al("未细化 / N/A", "N/A")}</p>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] text-neutral-400 uppercase block">{al("街道地址", "Street Address")}</span>
                          <p className="font-medium text-neutral-800">{selectedOrderForView.streetAddress || selectedOrderForView.address || al("未细化 / N/A", "N/A")}</p>
                        </div>

                        {selectedOrderForView.apartment && (
                          <div>
                            <span className="text-[9px] text-neutral-400 uppercase block">{al("公寓/套房", "Apartment / Suite")}</span>
                            <p className="font-medium text-neutral-800">{selectedOrderForView.apartment}</p>
                          </div>
                        )}

                        <div className="border-t border-neutral-200/60 pt-2 mt-2">
                          <span className="text-[9px] text-neutral-400 uppercase block">{al("完整组合物流地址", "Full Address")}</span>
                          <p className="text-neutral-600 text-[11px] leading-relaxed select-all font-mono">{selectedOrderForView.address}</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button 
                          onClick={() => setSelectedOrderForView(null)}
                          className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs px-5 rounded-xl"
                        >
                          {al("已阅关闭", "Dismiss & Close")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL 2: FULFILL SINGLE ORDER / INPUT TRACKING */}
              {selectedOrderForShip && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <form onSubmit={handleSingleShipSubmit} className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-neutral-100">
                    <div className="bg-neutral-900 text-white p-6">
                      <h3 className="text-base font-serif font-black flex items-center justify-between">
                        <span>{al("订单发货录单与物流追踪", "Order Fulfillment & Tracking")}</span>
                        <span className="font-mono text-xs text-neutral-400 bg-white/10 px-2 py-0.5 rounded">{selectedOrderForShip.id}</span>
                      </h3>
                      <p className="text-[11px] text-neutral-400 mt-1">{al("请输入承运公司及物流追踪单号，系统将同步反馈给买家进行运单追踪查询。", "Specify shipping carrier & logistics tracking credentials to update client tracking portal.")}</p>
                    </div>

                    <div className="p-6 space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{al("发货物流商 (承运商)", "Logistics Carrier")}</label>
                        <select
                          value={shipCarrier}
                          onChange={(e) => setShipCarrier(e.target.value)}
                          className="w-full bg-neutral-50 border rounded-xl p-2.5 focus:outline-none"
                        >
                          <option value="DHL Express">DHL Express</option>
                          <option value="FedEx Express">FedEx Express</option>
                          <option value="UPS Global">UPS Global</option>
                          <option value="USPS Priority">USPS Priority</option>
                          <option value="SF Express">SF Express</option>
                          <option value="Other / Self-Delivery">{al("自定义 / 其他物流", "Other Custom Carrier")}</option>
                        </select>
                        {shipCarrier.includes("Other") && (
                          <input
                            type="text"
                            placeholder={al("输入自定义物流商名称...", "Enter custom carrier name...")}
                            value={shipCarrier === 'Other / Self-Delivery' ? '' : shipCarrier}
                            onChange={(e) => setShipCarrier(e.target.value)}
                            className="w-full mt-2 bg-neutral-50 border rounded-xl p-2.5 focus:outline-none"
                            required
                          />
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{al("物流运单号 / 快递单号", "Tracking Number")}</label>
                        <input
                          type="text"
                          required
                          value={shipTrackingNumber}
                          onChange={(e) => setShipTrackingNumber(e.target.value)}
                          placeholder="e.g. TRK9876543210"
                          className="w-full bg-neutral-50 border rounded-xl p-2.5 font-mono focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{al("发货状态设置", "Fulfillment Status")}</label>
                        <select
                          value={shipStatus}
                          onChange={(e) => setShipStatus(e.target.value)}
                          className="w-full bg-neutral-50 border rounded-xl p-2.5 focus:outline-none font-bold"
                        >
                          <option value="Shipped">{al("已发货 / Shipped", "Shipped")}</option>
                          <option value="In Production">{al("生产中 / In Production", "In Production")}</option>
                          <option value="Cancelled">{al("已取消 / Cancelled", "Cancelled")}</option>
                        </select>
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setSelectedOrderForShip(null)}
                          className="text-xs"
                        >
                          {al("取消", "Cancel")}
                        </Button>
                        <Button
                          type="submit"
                          disabled={isShippingLoading}
                          className="bg-brand-600 hover:bg-brand-700 text-white text-xs flex items-center gap-1.5"
                        >
                          {isShippingLoading && <Loader2 size={13} className="animate-spin" />}
                          {al("保存录单并发货", "Fulfill & Save Shipment")}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: PAYMENT GATEWAY STATIONS */}
          {activeTab === 'gateways' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-serif font-black text-neutral-900">Configure Payment Processors</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Settle test mock purchases with Sandboxed PayPal & Stripe card modes.</p>
              </div>

              <div className="space-y-5">
                {/* Stripe configuration */}
                <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <h3 className="font-bold text-neutral-800 text-sm">Credit card (Stripe simulator module)</h3>
                    <input type="checkbox" checked={cardEnabled} onChange={(e) => setCardEnabled(e.target.checked)} className="h-4 w-4 rounded text-brand-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Stripe mode</label>
                      <select value={cardMode} onChange={(e: any) => setCardMode(e.target.value)} className="w-full bg-white border rounded p-2 focus:outline-none">
                        <option value="sandbox">Sandbox Test Mode</option>
                        <option value="live">Live Production Gateway</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 font-mono">Publishable Key</label>
                      <input type="text" placeholder="pk_live_..." className="w-full bg-white border rounded p-1.5 focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* PayPal configuration */}
                <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <h3 className="font-bold text-neutral-800 text-sm">PayPal Checkout API Sandbox</h3>
                    <input type="checkbox" checked={paypalEnabled} onChange={(e) => setPaypalEnabled(e.target.checked)} className="h-4 w-4 rounded text-brand-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">PayPal mode</label>
                      <select value={paypalMode} onChange={(e: any) => setPaypalMode(e.target.value)} className="w-full bg-white border rounded p-2 focus:outline-none">
                        <option value="sandbox">Developer Sandbox Credentials</option>
                        <option value="live">Live Business Checkout API</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 font-mono">PayPal Client ID</label>
                      <input type="text" value={paypalClientId} onChange={(e) => setPaypalClientId(e.target.value)} placeholder="AaX_..." className="w-full bg-white border rounded p-1.5 focus:outline-none" />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveGateways} disabled={gatewaysLoading} className="font-bold uppercase tracking-wider">
                  <Save size={16} className="mr-1" /> Save Gateway Settings
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCT UPLOADER & DELETER */}
          {activeTab === 'products' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-serif font-black text-neutral-900">
                    {editingProductId ? 'Edit Product Asset / 编辑已上架商品' : 'Upload Product Assets / 上架新产品'}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {editingProductId 
                      ? 'Modify dynamic variants, specifications, images or SKU details for this existing item.' 
                      : 'Input custom metadata, price rates, SKU, double variants, spec blocks and YouTube showcase embeds.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setIsBulkProdOpen(!isBulkProdOpen);
                      setBulkProdError('');
                      setBulkProdFeedback('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <UploadCloud size={14} />
                    {al("Excel/CSV 批量上架商品", "Batch Excel/CSV Listing")}
                  </button>
                </div>
              </div>

              {/* Bulk Product Importer Box */}
              {isBulkProdOpen && (
                <div className="bg-neutral-50 border border-neutral-150 p-6 rounded-2xl space-y-6 animate-fade-in text-xs shadow-2xs">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <h3 className="font-bold text-neutral-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Database size={15} className="text-amber-600" />
                      {al("749局玄学秘宝批量上架系统 / Batch Product Listing System", "Batch Product Listing System")}
                    </h3>
                    <button 
                      onClick={() => setIsBulkProdOpen(false)}
                      className="text-neutral-400 hover:text-neutral-600 text-xs font-bold"
                    >
                      {al("关闭", "Close")}
                    </button>
                  </div>

                  {/* Dual options: 1. Download & Upload Excel, 2. Raw Paste */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* LEFT COLUMN: EXCEL FILES (xlsx, xls) */}
                    <div className="bg-white border p-4 rounded-xl space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h4 className="font-bold text-neutral-800 flex items-center gap-1.5">
                          <FileText size={14} className="text-emerald-600" />
                          {al("方式一：使用电子表格 (Excel) 批量上架", "Option 1: Batch Listing via Excel Spreadsheet")}
                        </h4>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          {al("推荐。请先下载我们为您准备的标准 Excel 上架模板，在表格中填入您的商品信息（包含商品名称、分类、售价、供应商等），然后上传文件。系统将秒级解析并批量上架发布。", "Recommended. Download our standard Excel listing template, fill in your product details (name, category, price, supplier, etc.), and upload the sheet. The system will parse and publish them instantly.")}
                        </p>
                      </div>

                      <div className="pt-2 space-y-3">
                        <button
                          onClick={handleDownloadTemplate}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold transition-all text-xs"
                        >
                          <Download size={14} />
                          {al("下载标准 Excel 上架模版 (.xlsx)", "Download Excel Listing Template (.xlsx)")}
                        </button>

                        <div className="relative border-2 border-dashed border-neutral-200 hover:border-emerald-400 bg-neutral-50/50 hover:bg-emerald-50/10 rounded-xl p-4 transition-all text-center">
                          <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleExcelUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="space-y-1">
                            <UploadCloud className="mx-auto text-neutral-400 group-hover:text-emerald-500" size={24} />
                            <p className="font-bold text-neutral-700 text-[11px]">
                              {al("点击或拖拽 Excel 文件到此处上传", "Click or drag Excel file here to upload")}
                            </p>
                            <p className="text-[10px] text-neutral-400">
                              {al("支持 .xlsx, .xls 格式", "Supports .xlsx, .xls files")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: MANUAL CSV TEXT PASTE */}
                    <div className="bg-white border p-4 rounded-xl space-y-3">
                      <h4 className="font-bold text-neutral-800 flex items-center gap-1.5">
                        <Code2 size={14} className="text-blue-600" />
                        {al("方式二：直接粘贴 CSV 文本快速导入", "Option 2: Direct CSV Plaintext Quick Import")}
                      </h4>
                      <div className="space-y-1.5 text-[11px] text-neutral-400">
                        <p className="font-semibold text-neutral-600">{al("支持列名（动态适配顺序，首行为表头）：", "Supported Column Headers (Adaptive - Any Order, 1st Row as Header):")}</p>
                        <code className="block bg-neutral-100 p-1.5 rounded text-[10px] font-mono select-all text-neutral-700 leading-none">
                          Name, Category, Price, Compare Price, SKU, Supplier, Image URL, Description
                        </code>
                      </div>

                      <textarea
                        value={bulkProdCsv}
                        onChange={(e) => setBulkProdCsv(e.target.value)}
                        placeholder="Name, Category, Price, Compare Price, SKU, Supplier, Image URL, Description&#10;749雷击枣木避邪剑, living, 168.00, 299.00, SL-SWORD-01, 特道后勤组, https://..., 避邪保平安"
                        rows={4}
                        className="w-full text-xs font-mono p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />

                      <div className="flex gap-2 justify-end">
                        <Button
                          onClick={() => {
                            setBulkProdCsv('');
                            setBulkProdError('');
                            setBulkProdFeedback('');
                          }}
                          variant="outline"
                          className="text-xs h-8"
                        >
                          {al("清空", "Clear")}
                        </Button>
                        <Button
                          onClick={() => handleBulkImportProducts(bulkProdCsv)}
                          disabled={!bulkProdCsv.trim() || isBulkProdLoading}
                          className="text-xs bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-1 h-8"
                        >
                          {isBulkProdLoading && <Loader2 size={13} className="animate-spin" />}
                          {al("解析并上架", "Parse & List")}
                        </Button>
                      </div>
                    </div>

                  </div>

                  {/* Feedback Logs */}
                  {(bulkProdError || bulkProdFeedback || isBulkProdLoading) && (
                    <div className="border-t pt-4">
                      {isBulkProdLoading && (
                        <div className="bg-neutral-100 text-neutral-700 p-3 rounded-xl text-xs font-medium flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin text-amber-500" />
                          {al("正在解析上传数据并同步至 749 局秘宝数据库，请稍候...", "Parsing and syncing to Bureau 749 relics database, please wait...")}
                        </div>
                      )}

                      {bulkProdError && (
                        <div className="bg-red-50 text-red-700 border border-red-100 p-3 rounded-xl text-xs font-medium flex items-center gap-1.5">
                          <AlertTriangle size={14} />
                          {bulkProdError}
                        </div>
                      )}

                      {bulkProdFeedback && (
                        <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-xl text-xs font-medium flex items-center gap-1.5">
                          <CheckCircle size={14} />
                          {bulkProdFeedback}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleUploadProduct} className="space-y-4 bg-neutral-50 border p-6 rounded-2xl text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-500 mb-1">Product Title / 商品名称</label>
                    <input type="text" required value={prodTitle} onChange={(e) => setProdTitle(e.target.value)} placeholder="e.g. Couples Custom Letter Hoodie" className="w-full h-10 border rounded px-3 bg-white" />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-500 mb-1">Catalog Category Collections / 分类</label>
                    <select value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} className="w-full h-10 border rounded px-3 bg-white">
                      <option value="women">Women Favorites</option>
                      <option value="men">Men Outfits</option>
                      <option value="mugs">Tazas & Ceramic Mugs</option>
                      <option value="new-arrivals">New Arrivals</option>
                      {categories.map(cat => (
                        <option key={cat.type} value={cat.type}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-500 mb-1">Retail Price ($) / 售价</label>
                    <input type="number" step="0.01" required value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} placeholder="e.g. 39.00" className="w-full h-10 border rounded px-3 bg-white" />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-500 mb-1">Compare Price ($) / 划线价</label>
                    <input type="number" step="0.01" value={prodOriginalPrice} onChange={(e) => setProdOriginalPrice(e.target.value)} placeholder="e.g. 59.00" className="w-full h-10 border rounded px-3 bg-white" />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-500 mb-1">Product SKU / SKU 编号</label>
                    <input type="text" required value={prodSKU} onChange={(e) => setProdSKU(e.target.value)} placeholder="e.g. GRO-WOD-001" className="w-full h-10 border rounded px-3 bg-white" />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-500 mb-1">Supplier / 供应商</label>
                    <input type="text" value={prodSupplier} onChange={(e) => setProdSupplier(e.target.value)} placeholder="e.g. Secret Lab 749" className="w-full h-10 border rounded px-3 bg-white" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-500 mb-1">Package Size / 包装大小</label>
                    <input type="text" value={prodPackageSize} onChange={(e) => setProdPackageSize(e.target.value)} placeholder="e.g. 20 x 15 x 10 cm" className="w-full h-10 border rounded px-3 bg-white" />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-500 mb-1">Weight / 重量</label>
                    <input type="text" value={prodWeight} onChange={(e) => setProdWeight(e.target.value)} placeholder="e.g. 0.35 kg" className="w-full h-10 border rounded px-3 bg-white" />
                  </div>
                </div>

                <div>
                   <label className="block font-bold text-neutral-500 mb-1">
                     {al("主图封面 (自动支持本地电脑上传预览)", "Primary Thumbnail Image (Auto native file uploader)")}
                   </label>
                   <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 border border-neutral-200 rounded-xl shadow-2xs">
                     {prodImageUrl ? (
                       <div className="w-16 h-16 rounded-lg border overflow-hidden bg-neutral-50 relative group flex-shrink-0 shadow-sm">
                         <img src={prodImageUrl} alt="Primary Thumbnail Preview" className="w-full h-full object-cover animate-fade-in" />
                         <button 
                           type="button" 
                           onClick={() => setProdImageUrl('')}
                           className="absolute top-1 right-1 p-0.5 bg-red-50 text-red-650 rounded-full hover:bg-red-200 transition-colors shadow-xs cursor-pointer"
                           title="Remove image"
                         >
                           <Trash2 size={10} />
                         </button>
                       </div>
                     ) : (
                       <div className="w-16 h-16 rounded-lg border-2 border-dashed border-neutral-200 flex items-center justify-center bg-neutral-50 text-neutral-400 flex-shrink-0">
                         <ImageIcon size={18} />
                       </div>
                     )}
                     
                     <div className="flex-1 w-full space-y-1">
                       <label className="h-10 px-4 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg border border-brand-200/50 flex items-center justify-center font-bold text-xs cursor-pointer gap-1.5 transition-all select-none w-full sm:w-auto inline-flex shadow-2xs">
                         <Plus size={14} />
                         <span>{al("选择电脑本地图片上传", "Select local image file")}</span>
                         <input 
                           type="file" 
                           accept="image/*"
                           onChange={handlePrimaryImageUpload}
                           className="hidden" 
                         />
                       </label>
                       <p className="text-[10px] text-neutral-400 mt-1">{al("上传后的图片将自动保存，无需手动配置图片链接。", "Uploaded photos will be saved directly. No raw URL link configurations needed.")}</p>
                     </div>
                   </div>
                   <input type="hidden" required value={prodImageUrl} />
                 </div>
                   {primaryImageProgress !== null && (
                     <div className="mt-2 text-xs text-neutral-600 bg-neutral-50 rounded-xl p-2.5 border border-dashed border-neutral-200">
                       <div className="flex justify-between font-mono font-bold text-[10px] uppercase text-neutral-500 mb-1">
                         <span>Uploading Primary Image / 主图上传中...</span>
                         <span className="text-brand-600 font-black">{primaryImageProgress}%</span>
                       </div>
                       <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden shadow-inner">
                         <div 
                           className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                           style={{ width: `${primaryImageProgress}%` }}
                         />
                       </div>
                     </div>
                   )}
 
                 {/* Product Image Management (Max 8 images) */}
                 <div className="space-y-2 border-t pt-4">
                   <label className="block font-bold text-neutral-500 mb-1">Product Gallery Specs (Max 8 images / 最大支持8张图，支持上传本地图片)</label>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                     {[...Array(8)].map((_, idx) => {
                       const currentImg = prodImages[idx] || '';
                       return (
                         <div key={idx} className="border border-neutral-200 rounded-xl p-3 bg-white flex flex-col items-center gap-2 relative shadow-xs">
                           <span className="absolute top-1 left-2 font-mono text-[9px] text-neutral-400 font-bold bg-neutral-100 px-1.5 py-0.5 rounded-full">#{idx + 1}</span>
                           
                           {currentImg ? (
                             <div className="w-full aspect-square rounded-lg overflow-hidden border bg-neutral-50 relative group">
                               <img src={currentImg} alt={`Product ${idx+1}`} className="w-full h-full object-cover" />
                               <button 
                                 type="button" 
                                 onClick={() => {
                                   const newImgs = [...prodImages];
                                   newImgs.splice(idx, 1);
                                   setProdImages(newImgs);
                                 }}
                                 className="absolute top-1 right-1 p-1 bg-red-105 text-red-650 rounded-full hover:bg-red-200 transition-colors cursor-pointer"
                                 title="Remove image"
                               >
                                 <Trash2 size={12} />
                               </button>
                             </div>
                           ) : (
                             <div className="w-full aspect-square rounded-lg border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center bg-neutral-50 text-neutral-400">
                               <span className="text-[10px] font-bold">Image Slot</span>
                               <span className="text-[8px] text-neutral-400">Empty</span>
                             </div>
                           )}
 
                           {/* Slot upload progress percentage display */}
                           {slotImageProgress[idx] !== undefined && (
                             <div className="w-full bg-neutral-50 border border-neutral-150 p-1.5 rounded-lg space-y-1">
                               <div className="flex justify-between text-[8px] font-mono font-bold text-neutral-400 leading-none">
                                 <span>Uploading...</span>
                                 <span className="text-brand-600 font-black">{slotImageProgress[idx]}%</span>
                               </div>
                               <div className="w-full bg-neutral-200 rounded-full h-1 overflow-hidden shadow-inner">
                                 <div 
                                   className="bg-brand-600 h-1 rounded-full transition-all duration-200"
                                   style={{ width: `${slotImageProgress[idx]}%` }}
                                 />
                               </div>
                             </div>
                           )}
 
                           {/* Direct File Selector or URL input */}
                           <div className="w-full space-y-1 text-[9px]">
                             <input 
                               type="file" 
                               accept="image/*"
                               onChange={(e) => handleSlotImageUpload(idx, e)}
                               className="w-full text-[9px] text-neutral-400 file:mr-1 file:py-0.5 file:px-1.5 file:rounded-full file:border-0 file:text-[9px] file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
                             />
                             <input 
                               type="url"
                               placeholder="Or external URL"
                               value={currentImg.startsWith('data:') ? '' : currentImg}
                               onChange={(e) => {
                                 const newImgs = [...prodImages];
                                 newImgs[idx] = e.target.value;
                                 setProdImages(newImgs);
                                 if (idx === 0) setProdImageUrl(e.target.value);
                               }}
                               className="hidden"
                             />
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>

                {/* Double Variants manual configuration switches */}
                <div className="border-t pt-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-700">
                    <input 
                      type="checkbox" 
                      checked={prodHasVariants} 
                      onChange={(e) => setProdHasVariants(e.target.checked)} 
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-neutral-300 cursor-pointer" 
                    />
                    <span>Enable Product Variations / 启用规格变体开关 (Double Variants)</span>
                  </label>
                  <p className="text-[10px] text-neutral-400 mt-1 pl-6">Manual toggle configuration: turn on or off custom color/size choices before checkout details.</p>
                </div>

                {prodHasVariants && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 bg-white p-4 rounded-xl shadow-xs border">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Color Variant List / 颜色规格名 (User Typing Input / 用户自主输入)</label>
                      <input 
                        type="text" 
                        value={prodColors} 
                        onChange={(e) => setProdColors(e.target.value)} 
                        placeholder="e.g. White, Black, Pink, Navy, Forest Green" 
                        className="w-full h-10 border rounded px-3 bg-neutral-50 text-xs font-semibold" 
                      />
                      <span className="text-[10px] text-neutral-400 block mt-1">Freeform input, separate with commas / 支持自由输入英文或中文，逗号隔开</span>
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Size Variant List / 尺码规则类 (Dropdown list selection / 下拉选择卡)</label>
                      <div className="relative">
                        <select 
                          value=""
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const currentArray = prodSizes.split(',').map(s => s.trim()).filter(Boolean);
                              if (currentArray.includes(val)) {
                                const filtered = currentArray.filter(item => item !== val);
                                setProdSizes(filtered.join(', '));
                              } else {
                                currentArray.push(val);
                                setProdSizes(currentArray.join(', '));
                              }
                            }
                          }}
                          className="w-full h-10 border rounded px-3 bg-neutral-50 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                        >
                          <option value="">-- Click size dropdown toggle to add or remove --</option>
                          {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', 'One Size', 'Custom Size'].map((sz) => {
                            const currentArray = prodSizes.split(',').map(s => s.trim()).filter(Boolean);
                            const isSelected = currentArray.includes(sz);
                            return (
                              <option key={sz} value={sz}>
                                {isSelected ? `✓ Selected: ${sz}` : `+ Add: ${sz}`}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      
                      {/* Active sizes badges tracker */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {prodSizes.split(',').map(s => s.trim()).filter(Boolean).map(sizeBadge => (
                          <span 
                            key={sizeBadge} 
                            onClick={() => {
                              const remaining = prodSizes.split(',').map(s => s.trim()).filter(Boolean).filter(s => s !== sizeBadge);
                              setProdSizes(remaining.join(', '));
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 hover:bg-red-50 hover:text-red-750 text-brand-700 rounded-full text-[10px] font-bold cursor-pointer transition-all border border-brand-200 hover:border-red-200 select-none"
                            title="Click to remove size"
                          >
                            <span>{sizeBadge}</span>
                            <span className="text-[8px] font-black opacity-60">×</span>
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-neutral-400 block mt-1">Select dropdown to toggle state or click badges directly to remove / 点击下拉项目追加或移除，可点徽章直接删除</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-500 mb-1 flex items-center gap-1 text-xs">
                      <Video size={14} className="text-red-650" />
                      Embed YouTube Showcase (Video ID or full Iframe embed code) / YouTube嵌入式播放
                    </label>
                    <input type="text" value={prodYoutube} onChange={(e) => setProdYoutube(e.target.value)} placeholder="e.g. dQw4w9WgXcQ or <iframe ...></iframe>" className="w-full h-10 border rounded px-3 bg-white" />
                  </div>

                  <div className="border border-neutral-200 rounded-xl p-3 bg-neutral-50 space-y-2">
                    <label className="block font-bold text-neutral-600 flex items-center gap-1.5 text-xs">
                      <Video size={14} className="text-emerald-600" />
                      Or Upload Local MP4 Video / 或上传本地MP4视频
                    </label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="file" 
                        id="local-prod-video" 
                        accept="video/mp4" 
                        onChange={handleLocalVideoUpload} 
                        className="hidden" 
                      />
                      <label 
                        htmlFor="local-prod-video" 
                        className="px-3 py-1.5 bg-white hover:bg-neutral-100 border rounded-lg text-xs font-bold text-neutral-700 cursor-pointer shadow-xs inline-flex items-center gap-1"
                      >
                        {videoUploading ? 'Uploading / 上传中...' : 'Upload Video / 上传本地视频'}
                      </label>
                      {prodVideoUrl && (
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                              Local Video Loaded (Ready to Play / 视频就绪可播放)
                            </span>
                            <button 
                              type="button" 
                              onClick={() => setProdVideoUrl('')} 
                              className="text-neutral-400 hover:text-red-500 text-sm font-bold cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                          <div className="w-full max-w-md rounded-2xl overflow-hidden border border-neutral-200 shadow-md bg-neutral-950 aspect-[16/9]">
                            <video 
                              src={prodVideoUrl} 
                              controls 
                              controlsList="nodownload"
                              className="w-full h-full object-contain" 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    {videoProgress !== null && (
                      <div className="mt-2 text-xs text-neutral-600 bg-white rounded-xl p-2.5 border border-neutral-150">
                        <div className="flex justify-between font-mono font-bold text-[10px] uppercase text-neutral-500 mb-1">
                          <span>Uploading Local Video / 视频上传中...</span>
                          <span className="text-emerald-600 font-black">{videoProgress}%</span>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden shadow-inner">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${videoProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {prodVideoUrl && (
                      <video src={prodVideoUrl} controls className="w-full max-h-24 object-contain rounded bg-black" />
                    )}
                  </div>
                </div>

                {/* AI-assisted Brief Description */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <label className="block font-bold text-neutral-500 mb-1">Brief Description / 简短介绍文案</label>
                    <span className="text-[10px] bg-brand-50 text-brand-700 font-bold border border-brand-200 px-2 py-0.5 rounded font-mono">SEO & GEO Engine Armed</span>
                  </div>
                  <textarea rows={3} value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} placeholder="Describe print texture, comfort material, premium feel..." className="w-full border rounded-xl p-3 bg-white text-sm text-neutral-700 focus:ring-2 focus:ring-brand-200 focus:outline-none" />
                  
                  {/* AI helper box for brief description */}
                  <div className="bg-gradient-to-br from-brand-50/70 to-neutral-50 border border-brand-100 rounded-2xl p-4 space-y-3 shadow-xs">
                    <div className="flex items-center gap-1.5 justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={14} className="text-brand-600 animate-pulse" />
                        <span className="font-bold text-xs text-brand-900">Brief AI Copywriter / AI 撰写简短文案</span>
                      </div>
                      <span className="text-[9px] text-neutral-400 font-serif italic">Conforms to Google SEO & GEO market standards</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text"
                        placeholder="e.g., Highlight luxurious comfort, couples design elements, express 3-5 days delivery, premium breathable heavy cotton..."
                        value={briefAiPrompt}
                        onChange={(e) => setBriefAiPrompt(e.target.value)}
                        className="flex-1 bg-white border border-neutral-250 rounded-xl px-3 py-2 text-xs text-neutral-700 placeholder-neutral-400 focus:ring-2 focus:ring-brand-100 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={briefAiLoading}
                        onClick={async () => {
                          if (!briefAiPrompt.trim()) {
                            showToast('Please type some instructions/prompts first! / 请先输入提示词', 'warning');
                            return;
                          }
                          setBriefAiLoading(true);
                          try {
                            const res = await api.aiWriteProductContent({
                              type: 'brief',
                              userPrompt: briefAiPrompt,
                              productTitle: prodTitle,
                              productCategory: prodCategory
                            });
                            setProdDesc(res.result);
                            showToast('Brief description generated successfully!', 'success');
                          } catch (err: any) {
                            showToast(err.message || 'AI generate error', 'error');
                          } finally {
                            setBriefAiLoading(false);
                          }
                        }}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-neutral-300 text-white font-bold rounded-xl text-xs tracking-wide shrink-0 transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-xs active:scale-98 cursor-pointer"
                      >
                        {briefAiLoading ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Writing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            <span>AI Generate / AI 撰写</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mixed Text & Graphics (图文混排. prodRichText with AI & Layout builder) */}
                <div className="border-t pt-5 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-1">
                    <div>
                      <h3 className="font-bold text-neutral-800 text-sm">Rich Specification Content & Image Layouts / 详情页图文详情与排版设计</h3>
                      <p className="text-[10px] text-neutral-400">Design custom specification layouts inside client tabs with HTML representation.</p>
                    </div>
                  </div>

                  {/* 4 Local Images Uploads & URL links section */}
                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-bold text-xs text-neutral-700">1. Upload Layout Images / 详情页图文素材 (Up to 4 local photos / 支持本地或 URL)</span>
                      <span className="text-[9px] text-neutral-400">Max 4 images limit</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {[0, 1, 2, 3].map((idx) => {
                        const imgVal = richImages[idx] || '';
                        return (
                          <div key={idx} className="border border-neutral-250 rounded-xl p-3 bg-white flex flex-col gap-2 relative shadow-2xs">
                            <span className="absolute top-1 left-2 font-mono text-[9px] text-neutral-400 font-bold bg-neutral-100 px-1.5 py-0.5 rounded-full">Photo #{idx + 1}</span>
                            
                            {imgVal ? (
                              <div className="w-full aspect-video rounded-lg overflow-hidden border bg-neutral-50 relative group">
                                <img src={imgVal} alt={`Rich detail ${idx+1}`} className="w-full h-full object-cover" />
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const nextImgs = [...richImages];
                                    nextImgs[idx] = '';
                                    setRichImages(nextImgs);
                                  }}
                                  className="absolute top-1 right-1 p-1 bg-red-50 text-red-650 rounded-lg hover:bg-red-100 transition-colors cursor-pointer shadow"
                                  title="Clear image"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            ) : (
                              <div className="w-full aspect-video rounded-lg border-2 border-dashed border-neutral-150 flex flex-col items-center justify-center bg-neutral-50 text-neutral-400 text-[10px]">
                                <span className="font-bold text-[9px]">Empty Slot</span>
                                <span className="text-[7px]">Click Upload / URL</span>
                              </div>
                            )}

                            {/* Upload progress percentage display for rich spec images */}
                            {richUploadProgress[idx] !== undefined && (
                              <div className="w-full bg-neutral-50 border border-neutral-150 p-1.5 rounded-lg space-y-1">
                                <div className="flex justify-between text-[8px] font-mono font-bold text-neutral-400 leading-none">
                                  <span>Uploading...</span>
                                  <span className="text-brand-600 font-black">{richUploadProgress[idx]}%</span>
                                </div>
                                <div className="w-full bg-neutral-200 rounded-full h-1 overflow-hidden shadow-inner">
                                  <div 
                                    className="bg-brand-600 h-1 rounded-full transition-all duration-200"
                                    style={{ width: `${richUploadProgress[idx]}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="space-y-1 text-[9px]">
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleRichImageUpload(idx, e)}
                                className="w-full text-[9px] text-neutral-400 file:mr-1 file:py-0.5 file:px-1.5 file:rounded-full file:border-0 file:text-[9px] file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                              />
                              <input 
                                type="hidden"
                                placeholder="Paste asset image URL link"
                                value={imgVal.startsWith('data:') ? '' : imgVal}
                                onChange={(e) => {
                                  const nextImgs = [...richImages];
                                  nextImgs[idx] = e.target.value;
                                  setRichImages(nextImgs);
                                }}
                                className="hidden"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Choose typographic layouts templates and Apply */}
                    <div className="border-t border-neutral-200 pt-3 space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <span className="font-bold text-xs text-neutral-700">2. Select Typographic Layout Template / 选择图文排版模版</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          { id: 'grid', title: '2x2 Bento Product Grid', desc: 'Bespoke specifications grid' },
                          { id: 'staggered', title: 'Staggered Storyboard', desc: 'Alternate left / right layout' },
                          { id: 'banner', title: 'Hero Banner + Details', desc: 'Big top picture with detail strips' },
                          { id: 'features', title: '4 Feature Cards Row', desc: 'Horizontal alignment features' },
                          { id: 'editorial', title: '👑 奢华社论 (Luxury Editorial)', desc: '双语奢华长篇幅排版模版' }
                        ].map((layout) => (
                          <button
                            key={layout.id}
                            type="button"
                            onClick={() => setSelectedLayout(layout.id as any)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              selectedLayout === layout.id 
                                ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-100' 
                                : 'border-neutral-200 bg-white hover:bg-neutral-50'
                            }`}
                          >
                            <p className="font-bold text-xs text-neutral-800 leading-none mb-1">{layout.title}</p>
                            <p className="text-[9px] text-neutral-500 leading-tight">{layout.desc}</p>
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={applyRichLayoutTemplate}
                          className="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 hover:border-brand-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all select-none cursor-pointer"
                        >
                          <Code2 size={13} />
                          <span>Generate & Apply Layout / 合成并应用排版模版</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AI trigger block for rich specification HTML writing */}
                  <div className="bg-gradient-to-br from-indigo-50/70 to-neutral-50 border border-indigo-100 rounded-2xl p-4 space-y-3 shadow-xs">
                    <div className="flex items-center gap-1.5 justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={14} className="text-indigo-600 animate-pulse" />
                        <span className="font-bold text-xs text-indigo-900">AI Rich Specifications Draft / AI 智能一键生成精美详情 HTML</span>
                      </div>
                      <span className="text-[9px] text-neutral-400 font-serif italic">SEO High-Rank Keywords & Geographical Delivery Grounding</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text"
                        placeholder="e.g., Generate detailed material specifications, wash care, sizing recommendation grid, and highlight domestic overnight shipping..."
                        value={richAiPrompt}
                        onChange={(e) => setRichAiPrompt(e.target.value)}
                        className="flex-1 bg-white border border-neutral-250 rounded-xl px-3 py-2 text-xs text-neutral-700 placeholder-neutral-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={richAiLoading}
                        onClick={async () => {
                          if (!richAiPrompt.trim()) {
                            showToast('Please specify AI instructions prompts first! / 请输入提示词', 'warning');
                            return;
                          }
                          setRichAiLoading(true);
                          try {
                            const res = await api.aiWriteProductContent({
                              type: 'rich',
                              userPrompt: richAiPrompt,
                              productTitle: prodTitle,
                              productCategory: prodCategory
                            });
                            setProdRichText(res.result);
                            showToast('AI rich HTML content synthesised and synchronized into details below!', 'success');
                          } catch (err: any) {
                            showToast(err.message || 'AI generate error', 'error');
                          } finally {
                            setRichAiLoading(false);
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 text-white font-bold rounded-xl text-xs tracking-wide shrink-0 transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-xs active:scale-98 cursor-pointer"
                      >
                        {richAiLoading ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Synthesising HTML...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            <span>AI Draft / AI 生成 HTML</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* HTML editor field */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <label className="block font-bold text-neutral-500">HTML Source Code Editor / HTML 原代码编辑</label>
                      <span className="text-[10px] text-neutral-400 font-mono">Real-time compilation</span>
                    </div>
                    <textarea rows={6} value={prodRichText} onChange={(e) => setProdRichText(e.target.value)} placeholder="Mix HTML markup to embed details or specify premium components..." className="w-full border rounded-xl p-3 bg-neutral-900 text-neutral-100 font-mono text-xs focus:ring-2 focus:ring-brand-100 focus:outline-none" />
                  </div>

                  {/* Core layout preview (排版效果实时预览) */}
                  <div className="border border-neutral-200 rounded-3xl overflow-hidden bg-neutral-50 shadow-inner p-1">
                    <div className="bg-neutral-100 border-b border-neutral-200 px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Eye size={12} className="text-neutral-500" />
                        <span className="font-bold text-[10px] tracking-widest text-neutral-500 uppercase">Live Layout Previewer / 最终排版设计效果实时预览</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold uppercase leading-none font-sans">Active rendering</span>
                    </div>
                    <div className="bg-white p-6 max-h-96 overflow-y-auto custom-scrollbar">
                      {prodRichText.trim() ? (
                        <div dangerouslySetInnerHTML={{ __html: prodRichText }} />
                      ) : (
                        <div className="text-center py-12 text-neutral-400 space-y-1.5 text-xs">
                          <p className="font-bold text-neutral-500">No Typographic layout generated yet / 暂无排版内容</p>
                          <p className="text-[11px] text-neutral-400">Apply a layout template above or let the AI write gorgeous localized content for you.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Q&A FAQs (问答模版. prodFaqs) */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between items-center bg-neutral-100 p-2 rounded-xl">
                    <label className="block font-bold text-neutral-700">Product Q&A</label>
                    <button 
                      type="button" 
                      onClick={() => setProdFaqs([...prodFaqs, { question: '', answer: '' }])}
                      className="px-3 py-1 bg-white hover:bg-neutral-50 border shadow-xs text-brand-700 rounded-lg font-bold text-[10px] transition-all cursor-pointer"
                    >
                      + Add Q&A Item / 新增问题
                    </button>
                  </div>
                  {prodFaqs.length > 0 ? (
                    <div className="space-y-3">
                      {prodFaqs.map((faq, idx) => (
                        <div key={idx} className="p-3 bg-white border rounded-xl space-y-2 relative border-neutral-200">
                          <button 
                            type="button"
                            onClick={() => {
                              const newFaqs = [...prodFaqs];
                              newFaqs.splice(idx, 1);
                              setProdFaqs(newFaqs);
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-50 text-red-650 hover:bg-red-100 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block font-bold text-neutral-400 text-[9px] mb-1">Question {idx+1}</label>
                              <input 
                                type="text" 
                                value={faq.question} 
                                required
                                onChange={(e) => {
                                  const newFaqs = [...prodFaqs];
                                  newFaqs[idx].question = e.target.value;
                                  setProdFaqs(newFaqs);
                                }}
                                placeholder="e.g. Is this apparel machine wash friendly?" 
                                className="w-full h-8 border rounded px-2 bg-neutral-50 text-xs text-neutral-700" 
                              />
                            </div>
                            <div>
                              <label className="block font-bold text-neutral-400 text-[9px] mb-1">Answer {idx+1}</label>
                              <input 
                                type="text" 
                                value={faq.answer} 
                                required
                                onChange={(e) => {
                                  const newFaqs = [...prodFaqs];
                                  newFaqs[idx].answer = e.target.value;
                                  setProdFaqs(newFaqs);
                                }}
                                placeholder="e.g. Yes, machine wash cold, hang dry." 
                                className="w-full h-8 border rounded px-2 bg-neutral-50 text-xs text-neutral-700" 
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-neutral-400 italic">No custom FAQs defined. High-quality base Q&As will display automatically.</p>
                  )}
                </div>

                <div className="flex gap-2.5 pt-4">
                  <Button type="submit" disabled={productLoading} className="font-bold flex items-center gap-1 shrink-0">
                    {productLoading && <Loader2 size={14} className="animate-spin" />}
                    {editingProductId ? 'Save & Update Merchandise / 保存并更新商品信息' : 'Register & Publish Merchandise / 注册并上架发布商品'}
                  </Button>
                  {editingProductId && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit} className="font-bold text-neutral-500 border-neutral-300">
                      Cancel Edit / 取消编辑
                    </Button>
                  )}
                </div>
              </form>

              {/* Products Directory deletions list */}
              <div className="space-y-3">
                <h3 className="font-bold text-neutral-900 border-b pb-2 text-sm">Active inventory catalog directory ({products.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1">
                  {products.map(p => (
                    <div key={p.id} className="p-4 bg-white border border-neutral-200 rounded-2xl flex items-center justify-between gap-4 text-xs shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={p.image || p.images?.[0] || 'https://picsum.photos/id/1/100/100'} className="w-10 h-12 rounded-lg border object-cover shrink-0" alt="" />
                        <div className="min-w-0">
                          <strong className="block text-neutral-900 tracking-tight truncate font-bold text-xs">{p.name}</strong>
                          <div className="text-[10px] text-neutral-400 font-mono mt-0.5 space-y-0.5">
                            <p className="uppercase"><span className="text-neutral-300">Collection:</span> <span className="text-neutral-600">{p.category}</span></p>
                            <p><span className="text-neutral-300">SKU:</span> <span className="text-neutral-700 bg-neutral-100 px-1 py-0.2 rounded font-semibold">{p.sku || `GRO-${p.id}`}</span></p>
                            <p><span className="text-neutral-300">Price:</span> <span className="text-neutral-900 font-bold">${p.price}</span></p>
                            {(p.packageSize || p.weight) && (
                              <p className="flex flex-wrap gap-x-2 text-[10px] text-brand-600 font-semibold mt-1 bg-brand-50/50 p-1 rounded-md border border-brand-100/30 w-fit">
                                {p.packageSize && <span>📦 {p.packageSize}</span>}
                                {p.weight && <span>⚖️ {p.weight}</span>}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={() => triggerEditProduct(p)} 
                          className="px-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 rounded-lg font-bold text-[10px] border border-neutral-200 transition-all cursor-pointer flex items-center gap-1 select-none"
                          title="Edit Product"
                        >
                          <Edit size={11} className="text-neutral-500" />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(p.id)} 
                          className="p-1.5 bg-red-50 text-red-650 hover:bg-red-100 rounded-lg border border-red-100 transition-all cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: UNIQUE CATEGORY DIRECTORY */}
          {activeTab === 'categories' && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div>
                <h2 className="text-xl font-serif font-black text-neutral-900">Manage Custom Collections</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Expand your storefront with completely customized collection lists & sub-sections with local or AI-generated covers.</p>
              </div>

              <form onSubmit={handleAddCategory} className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200 space-y-4">
                <h3 className="font-bold text-neutral-900 border-b pb-2 uppercase tracking-wider text-[11px] text-neutral-600">Register / Update Collection Icon</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-500">Category Slug URL key</label>
                    <input type="text" required value={newCatSlug} onChange={(e) => setNewCatSlug(e.target.value)} placeholder="e.g. pillows, hoodies" className="w-full h-10 border rounded px-3 bg-white text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-500">Visual Label Name</label>
                    <input type="text" required value={newCatLabel} onChange={(e) => setNewCatLabel(e.target.value)} placeholder="e.g. Cozy Pillows" className="w-full h-10 border rounded px-3 bg-white text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-500">Secondary Sublabel</label>
                    <input type="text" value={newCatSublabel} onChange={(e) => setNewCatSublabel(e.target.value)} placeholder="e.g. Handmade Comfort" className="w-full h-10 border rounded px-3 bg-white text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Upload Local Cover File */}
                  <div className="p-4 bg-white border rounded-xl space-y-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Option 1: Upload Local Cover Image</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      id="category-file-upload" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLocalImageUpload(file);
                      }}
                    />
                    <label 
                      htmlFor="category-file-upload" 
                      className="border-2 border-dashed border-neutral-200 rounded-xl p-4 flex flex-col items-center justify-center bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-all gap-1.5 min-h-[90px]"
                    >
                      <Upload className="text-neutral-400" size={20} />
                      <span className="font-bold text-[11px] text-neutral-700">Click to Select Local File</span>
                      <span className="text-[9px] text-neutral-400">Supports PNG, JPG, WEBP</span>
                    </label>
                  </div>

                  {/* AI Image Generation Option */}
                  <div className="p-4 bg-white border rounded-xl space-y-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Option 2: Generate Cover with Gemini AI</span>
                    <div className="space-y-1.5">
                      <input 
                        type="text" 
                        value={aiPrompt} 
                        onChange={(e) => setAiPrompt(e.target.value)} 
                        placeholder="e.g. elegant watercolor aesthetic cute cozy mugs..." 
                        className="w-full h-9 border rounded px-2.5 bg-white text-xs"
                      />
                      <button 
                        type="button" 
                        disabled={aiImageLoading}
                        onClick={handleAiImageGenerate}
                        className="w-full h-9 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:bg-neutral-400 cursor-pointer text-xs select-none"
                      >
                        {aiImageLoading ? (
                          <>
                            <Loader2 className="animate-spin text-white" size={14} />
                            <span>AI Designing cover...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} className="text-yellow-400 animate-pulse" />
                            <span>Run AI Cover Generator</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Preview Selected Cover */}
                {newCatImage && (
                  <div className="p-4 bg-white border rounded-xl flex items-center gap-4">
                    <img src={newCatImage} alt="Cover preview" className="w-[100px] h-[75px] object-cover rounded-lg border shadow-inner" />
                    <div className="space-y-1 min-w-0 flex-1">
                      <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Image Loaded</span>
                      <p className="font-mono text-[10px] text-neutral-600 truncate max-w-sm">{newCatImage}</p>
                      <button 
                        type="button" 
                        onClick={() => setNewCatImage('')} 
                        className="text-red-650 hover:underline font-bold text-[10px]"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={categoryLoading} className="font-bold h-11 px-8 rounded-xl shadow bg-brand-600 text-white hover:bg-brand-700">
                    {categories.find(c => c.type === newCatSlug.toLowerCase().trim()) ? 'Update Dynamic Category' : 'Publish Collection Category'}
                  </Button>
                </div>
              </form>

              <div className="space-y-3 bg-white p-5 border rounded-2xl">
                <h3 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] text-neutral-600">Active Frontpage Icon Lists ({categories.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-72 overflow-y-auto pr-1">
                  {categories.length > 0 ? (
                    categories.map((c) => (
                      <div key={c.type} className="p-3 bg-neutral-50 border rounded-xl flex items-center gap-3 justify-between">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {c.image ? (
                            <img src={c.image} alt="" className="w-10 h-10 rounded-lg border object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-neutral-200 border flex items-center justify-center shrink-0">
                              <Sparkles size={16} className="text-neutral-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <strong className="block text-neutral-900 font-bold truncate text-xs">{c.label}</strong>
                            <span className="block text-[9px] text-neutral-400 font-mono truncate">{c.type}</span>
                            {c.sublabel && (
                              <span className="block text-[9px] text-brand-600 italic truncate mt-0.5">{c.sublabel}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            type="button"
                            onClick={() => {
                              setNewCatSlug(c.type);
                              setNewCatLabel(c.label || '');
                              setNewCatSublabel(c.sublabel || '');
                              setNewCatImage(c.image || '');
                            }}
                            className="text-neutral-500 hover:text-neutral-900 hover:underline font-bold text-[10px]"
                            title="Edit this category details"
                          >
                            Edit
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteCategory(c.type)} 
                            className="text-red-650 hover:underline font-bold text-[10px]" 
                            title="Delete category folder"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-400 py-4 text-center text-xs col-span-full">No custom folders registered yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: COUPONS */}
          {activeTab === 'coupons' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div>
                <h2 className="text-xl font-serif font-black text-neutral-900">Configure Promo Vouchers</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Control active percent reductions applied upon buyer checkout.</p>
              </div>

              <form onSubmit={handleAddCoupon} className="space-y-4 bg-neutral-50 p-6 rounded-2xl border text-xs text-left">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="sm:col-span-1">
                    <label className="block font-bold text-neutral-500 mb-1">Coupon Key (折扣码)</label>
                    <input type="text" required value={newCouponCode} onChange={(e) => setNewCouponCode(e.target.value)} placeholder="e.g. WELCOME20" className="w-full h-10 border rounded-xl px-3 bg-white font-mono uppercase font-bold outline-none focus:ring-1 focus:ring-brand-500" />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block font-bold text-neutral-500 mb-1">Reduction (%) (折价比率)</label>
                    <input type="number" min="1" max="100" required value={newCouponDiscount} onChange={(e) => setNewCouponDiscount(e.target.value)} placeholder="e.g. 15" className="w-full h-10 border rounded-xl px-3 bg-white font-bold outline-none focus:ring-1 focus:ring-brand-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-neutral-500 mb-1">Promo Label description (标签描述)</label>
                    <input type="text" value={newCouponDesc} onChange={(e) => setNewCouponDesc(e.target.value)} placeholder="Summer Campaign discount" className="w-full h-10 border rounded-xl px-3 bg-white outline-none focus:ring-1 focus:ring-brand-500" />
                  </div>
                </div>

                {/* Scope Selection */}
                <div className="border-t border-neutral-200/60 pt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1.5">Applicable Scope / 折扣适用商品范围</label>
                    <select
                      value={couponScope}
                      onChange={(e) => setCouponScope(e.target.value as 'all' | 'specific')}
                      className="w-full sm:w-72 h-10 border rounded-xl px-3 bg-white font-bold outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="all">全部商品 / All Products</option>
                      <option value="specific">特定指定商品 / Specific Products (Single or Multiple)</option>
                    </select>
                  </div>

                  {couponScope === 'specific' && (
                    <div className="bg-white border rounded-2xl p-4 space-y-3 max-h-60 overflow-y-auto">
                      <p className="font-bold text-neutral-500 border-b pb-1">Select applicable products (选择适用折扣的产品目录):</p>
                      {products && products.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {products.map((p: any) => {
                            const isChecked = couponSelectedProducts.includes(String(p.id));
                            return (
                              <label key={p.id} className={`flex items-center gap-3 p-2.5 hover:bg-neutral-50 rounded-xl cursor-pointer border transition-colors ${isChecked ? 'bg-brand-50/20 border-brand-200' : 'border-neutral-100'}`}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setCouponSelectedProducts(couponSelectedProducts.filter(id => id !== String(p.id)));
                                    } else {
                                      setCouponSelectedProducts([...couponSelectedProducts, String(p.id)]);
                                    }
                                  }}
                                  className="w-4 h-4 text-brand-600 border-neutral-300 rounded focus:ring-brand-500 cursor-pointer"
                                />
                                {p.imageUrl && (
                                  <img src={p.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover bg-neutral-100 shrink-0" referrerPolicy="no-referrer" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-neutral-900 truncate leading-tight">{p.title}</p>
                                  <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Price: ${p.price} | Supplier: {p.supplier || 'Generic Channel'}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-center text-neutral-400 py-3">No products registered to associate vouchers with.</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t border-neutral-100">
                  <Button type="submit" disabled={couponsLoading} className="font-bold px-6 shadow-md shadow-brand-100 h-10">
                    Register Promotional Code
                  </Button>
                </div>
              </form>

              <div className="space-y-2 border p-4 rounded-2xl border-neutral-150 max-h-64 overflow-y-auto text-xs font-semibold">
                {coupons && coupons.length > 0 ? (
                  coupons.map((c) => (
                    <div key={c.code} className="flex justify-between items-center py-3 border-b last:border-0 border-neutral-100 text-left">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="font-mono text-neutral-900 font-black tracking-widest bg-neutral-100 border rounded-lg px-2 py-0.5">{c.code}</strong>
                          <span className="text-brand-600 bg-brand-50 border border-brand-100 px-1.5 py-0.5 rounded-lg text-[10px] font-bold">
                            {c.discount}% Off
                          </span>
                        </div>
                        <p className="text-neutral-500 text-[11px] font-medium leading-relaxed">{c.description}</p>
                        <p className="text-[10px] text-neutral-400 font-medium">
                          Scope: {c.scope === 'specific' ? `Specific Products (${(c.applicableProductIds || []).length} selected)` : 'All Products (全部商品)'}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteCoupon(c.code)} className="text-red-650 hover:underline shrink-0 text-xs font-bold">Deactivate</button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-neutral-400 py-3">No active codes available.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: EDM AND MARKETING CAMPAIGNS & AI FORMULATIONS */}
          {activeTab === 'edm' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-neutral-100">
                <div>
                  <h2 className="text-xl font-serif font-black text-neutral-900">{al("EDM 邮件营销与智能模版设计", "EDM Marketing & Email Template Studio")}</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">{al("定制专属精美邮件模版，一键精准发送给下单购买客户、注册订阅群体或特定目标用户。", "Craft premium email templates and dispatch to subscribers, ordering customers, or hand-picked targeted individuals.")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEdmIsSmtpConfigOpen(true)}
                  className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
                >
                  <Settings size={14} />
                  <span>{al("配置发信邮箱 SMTP", "Configure Sender SMTP")}</span>
                </button>
              </div>

              {/* SMTP Configuration Overlay Modal Dialog */}
              {edmIsSmtpConfigOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="smtp-config-modal">
                  <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh] text-left animate-slide-up">
                    <div className="bg-neutral-950 text-white px-6 py-5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail size={18} className="text-brand-400 animate-pulse" />
                        <div>
                          <h3 className="font-bold text-sm tracking-wide">EDM SMTP Server Configuration</h3>
                          <p className="text-[10px] text-neutral-400">Specify custom credentials for high-volume email dispatches</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setEdmIsSmtpConfigOpen(false)}
                        className="text-neutral-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="p-6 overflow-y-auto space-y-4 text-xs">
                      <div className="bg-brand-50 border border-brand-100 p-3.5 rounded-2xl text-brand-900 leading-normal mb-1">
                        <p className="font-bold">🔒 Secure Mailbox Authorization Required</p>
                        <p className="text-[11px] text-neutral-600 mt-1">
                          You can enter standard SMTP configurations (e.g., Gmail App Passwords, SendGrid, Mailgun). If left blank, the system automatically uses sandbox simulation mode logging dispatches below.
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">SMTP Host Server</label>
                          <input
                            type="text"
                            placeholder="e.g. smtp.gmail.com"
                            value={edmSmtpConfig.smtpHost}
                            onChange={(e) => setEdmSmtpConfig({ ...edmSmtpConfig, smtpHost: e.target.value })}
                            className="w-full h-10 bg-neutral-50 border border-neutral-200 rounded-xl px-3 outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">SMTP Port</label>
                          <input
                            type="number"
                            placeholder="587"
                            value={edmSmtpConfig.smtpPort}
                            onChange={(e) => setEdmSmtpConfig({ ...edmSmtpConfig, smtpPort: parseInt(e.target.value) || 587 })}
                            className="w-full h-10 bg-neutral-50 border border-neutral-200 rounded-xl px-3 outline-none focus:ring-1 focus:ring-brand-500 font-bold font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">SMTP Username</label>
                          <input
                            type="text"
                            placeholder="e.g. sender@gmail.com"
                            value={edmSmtpConfig.smtpUser}
                            onChange={(e) => setEdmSmtpConfig({ ...edmSmtpConfig, smtpUser: e.target.value })}
                            className="w-full h-10 bg-neutral-50 border border-neutral-200 rounded-xl px-3 outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">SMTP Password / App Key</label>
                          <input
                            type="password"
                            placeholder="••••••••••••••••"
                            value={edmSmtpConfig.smtpPass}
                            onChange={(e) => setEdmSmtpConfig({ ...edmSmtpConfig, smtpPass: e.target.value })}
                            className="w-full h-10 bg-neutral-50 border border-neutral-200 rounded-xl px-3 outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="bg-neutral-50 border p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-neutral-700">Enable SSL/TLS Secure Handshake</p>
                          <p className="text-[10px] text-neutral-400">Forces secure handshakes (usually port 465)</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={edmSmtpConfig.smtpSecure}
                          onChange={(e) => setEdmSmtpConfig({ ...edmSmtpConfig, smtpSecure: e.target.checked })}
                          className="h-4 w-4 rounded text-brand-650 focus:ring-brand-500 cursor-pointer"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Sender Name Display</label>
                          <input
                            type="text"
                            placeholder="e.g. Grobrav Premium"
                            value={edmSmtpConfig.senderName}
                            onChange={(e) => setEdmSmtpConfig({ ...edmSmtpConfig, senderName: e.target.value })}
                            className="w-full h-10 bg-neutral-50 border border-neutral-200 rounded-xl px-3 outline-none focus:ring-1 focus:ring-brand-500 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Sender Email Address</label>
                          <input
                            type="email"
                            placeholder="noreply@grobrav.com"
                            value={edmSmtpConfig.senderEmail}
                            onChange={(e) => setEdmSmtpConfig({ ...edmSmtpConfig, senderEmail: e.target.value })}
                            className="w-full h-10 bg-neutral-50 border border-neutral-200 rounded-xl px-3 outline-none focus:ring-1 focus:ring-brand-500 font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-neutral-50 border-t p-4 flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => setEdmIsSmtpConfigOpen(false)}
                        className="px-4 py-2 border rounded-xl text-xs font-bold bg-white text-neutral-500 hover:bg-neutral-100 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveSmtpConfig}
                        disabled={edmSmtpSaving}
                        className="px-5 py-2 bg-neutral-950 hover:bg-neutral-900 disabled:bg-neutral-300 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        {edmSmtpSaving && <Loader2 size={13} className="animate-spin" />}
                        <span>Save Configuration</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Email presets / 设计模版快捷应用 */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest block">{al("选择专业设计邮件模版 / Quick Design Presets", "Quick Design Presets / 选择专业设计邮件模版")}</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'promo',
                      name: '🌟 经典折扣券促销 (Promo Offer)',
                      desc: '优雅排版，带虚线折价券卡片，适合向用户发送优惠激励。',
                      subject: '特别心意：送您一张专属 15% 折扣券！🎁 Just for you: Special 15% Off!',
                      content: `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
  <div style="text-align: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; margin-bottom: 20px;">
    <h1 style="color: #111827; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.025em;">Grobrav Custom</h1>
    <p style="color: #6b7280; font-size: 11px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">The Art of Bespoke Gifting</p>
  </div>
  
  <div style="padding: 10px 0;">
    <p style="font-size: 16px; line-height: 1.6; color: #111827;">亲爱的 <strong>{{name}}</strong>,</p>
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
      感谢您一直以来对 Grobrav 奢华定制印花工坊的关注！在这个特别的季节，我们为您准备了一份专属好礼。
    </p>
    
    <div style="background-color: #f9fafb; border: 1px dashed #d1d5db; border-radius: 12px; padding: 24px; text-align: center; margin: 25px 0;">
      <span style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 8px;">您的专属折扣码 / Your Coupon Key</span>
      <strong style="font-size: 32px; color: #111827; font-family: monospace; letter-spacing: 3px; background: #ffffff; padding: 6px 16px; border: 1px solid #e5e7eb; border-radius: 8px; display: inline-block;">SAVE15</strong>
      <p style="font-size: 14px; color: #10b981; font-weight: bold; margin: 15px 0 0 0;">结账时输入即可立享 15% 满减优惠！</p>
    </div>

    <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
      从定制情侣卫衣、个性化马克杯到专属刺绣好礼，Grobrav 致力于将您的每一份心意完美复刻。快来挑选属于您的专属礼物吧！
    </p>
    
    <div style="text-align: center; margin: 35px 0 20px 0;">
      <a href="https://grobrav.com" target="_blank" style="background-color: #111827; color: #ffffff; padding: 14px 32px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 10px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); font-family: inherit;">立即前往选购 / Customize Now 🚀</a>
    </div>
  </div>
  
  <div style="border-top: 1px solid #f3f4f6; padding-top: 20px; margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.6;">
    <p style="margin: 0;">如果您不想继续收到此类邮件，请点击退订 Newsletter。</p>
    <p style="margin: 5px 0 0 0;">&copy; 2026 Grobrav Inc. 123 Fashion Ave, NY 10016</p>
  </div>
</div>`
                    },
                    {
                      id: 'launch',
                      name: '🎨 绝美定制新品发售 (Showcase)',
                      desc: '精美陈列，高对比度按钮设计，非常适合推荐情侣卫衣等热门定制爆款。',
                      subject: 'Grobrav 情侣定制系列新品发售！用温暖与心意定格每一个瞬间 💖 New Arrivals Launch',
                      content: `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
  <div style="text-align: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; margin-bottom: 20px;">
    <h1 style="color: #111827; font-size: 24px; margin: 0; font-weight: 800;">Grobrav</h1>
    <p style="color: #6b7280; font-size: 11px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">MEMORIES CAPTURED FOREVER</p>
  </div>
  
  <div style="padding: 10px 0;">
    <p style="font-size: 16px; line-height: 1.6; color: #111827;">Hello <strong>{{name}}</strong>,</p>
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
      我们非常激动地向您介绍 Grobrav 2026 秋冬季全新<b>「双向奔赴」情侣刺绣定制系列</b>！
    </p>
    
    <div style="margin: 20px 0; border-radius: 12px; overflow: hidden; background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px;">
      <h3 style="margin-top: 0; color: #111827; font-size: 16px;">✨ 本季重磅推荐：</h3>
      <ul style="padding-left: 20px; margin: 0; font-size: 14px; color: #4b5563; line-height: 1.8;">
        <li><strong>定制情侣连帽卫衣：</strong>采用 400g 重磅纯棉，支持上传手绘图或双人线稿刺绣。</li>
        <li><strong>极简字母雕刻杯：</strong>质感陶瓷工艺，每一次捧起，都是心动的印记。</li>
        <li><strong>专属定制挂件：</strong>可刻印纪念日或专属昵称。</li>
      </ul>
    </div>

    <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
      输入您的首字母，选择您心仪的色彩与面料，剩下的交给我们。每一件单品，都由设计师和手艺人精雕细琢。
    </p>
    
    <div style="text-align: center; margin: 35px 0 20px 0;">
      <a href="https://grobrav.com" target="_blank" style="background-color: #db2777; color: #ffffff; padding: 14px 32px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 10px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); font-family: inherit;">立即定制专属礼物 / Design Now 💖</a>
    </div>
  </div>
  
  <div style="border-top: 1px solid #f3f4f6; padding-top: 20px; margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.6;">
    <p style="margin: 0;">您收到此邮件是因为您是 {{store_name}} 注册用户或订阅者。</p>
    <p style="margin: 5px 0 0 0;">&copy; 2026 Grobrav Inc. 123 Fashion Ave, NY 10016</p>
  </div>
</div>`
                    },
                    {
                      id: 'thankyou',
                      name: '❤️ 终身 VIP 7折答谢 (VIP Gratitude)',
                      desc: '红色高贵氛围，针对历史成交下单用户的专属感恩回馈信件模版。',
                      subject: '感恩相逢！给最特别的您送上一份尊享 7 折回馈礼遇 💌 A Special Thank You Gift',
                      content: `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
  <div style="text-align: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; margin-bottom: 20px;">
    <h1 style="color: #111827; font-size: 24px; margin: 0; font-weight: 800;">Grobrav</h1>
    <p style="color: #6b7280; font-size: 11px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">THE ART OF BESPOKE GIFTING</p>
  </div>
  
  <div style="padding: 10px 0;">
    <p style="font-size: 16px; line-height: 1.6; color: #111827;">亲爱的 <strong>{{name}}</strong>,</p>
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
      在 Grobrav，我们坚信最好的礼物不仅仅是简单的物品，更是其中流淌的真挚回忆与心意温度。
    </p>
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
      为了感谢您对我们定制工坊的支持，我们特地为您准备了<b>无门槛 30% 巨额忠诚回馈礼券</b>。这是仅向最核心 VIP 挚友发放的特别好礼。
    </p>
    
    <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 24px; text-align: center; margin: 25px 0;">
      <span style="font-size: 11px; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 8px;">🔥 VIP专属无门槛 7折优惠码 / 30% OFF</span>
      <strong style="font-size: 32px; color: #991b1b; font-family: monospace; letter-spacing: 3px; background: #ffffff; padding: 6px 16px; border: 1px solid #fee2e2; border-radius: 8px; display: inline-block;">SUPER30</strong>
      <p style="font-size: 13px; color: #7f1d1d; margin: 12px 0 0 0; font-weight: bold;">全场通用，任何定制产品均可直接抵扣 30%！</p>
    </div>

    <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
      愿这份小小的礼物，能在这个特殊的日子里，为您和您所爱的人增添一份纯粹的喜悦。
    </p>
  </div>
  
  <div style="border-top: 1px solid #f3f4f6; padding-top: 20px; margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.6;">
    <p style="margin: 0;">&copy; 2026 Grobrav Inc. 123 Fashion Ave, NY 10016</p>
  </div>
</div>`
                    }
                  ].map(tmpl => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        setEdmNewsletterTitle(tmpl.subject);
                        setEdmNewsletterContent(tmpl.content);
                        showToast(`已成功应用模版："${tmpl.name}"！可在下方编辑器微调或预览。`, 'success');
                      }}
                      className="border rounded-2xl p-4 bg-white hover:bg-neutral-50 text-left transition-all hover:shadow-sm flex flex-col justify-between cursor-pointer border-neutral-200"
                    >
                      <div>
                        <p className="font-black text-neutral-800 text-xs flex items-center gap-1">
                          {tmpl.name}
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                          {tmpl.desc}
                        </p>
                      </div>
                      <span className="text-[10px] text-brand-600 font-bold mt-3 block">应用模版 / Apply →</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI drafting hub */}
              <div className="bg-brand-50/40 p-5 rounded-2xl border border-brand-100/50 space-y-3 text-xs leading-relaxed text-brand-900">
                <span className="font-bold text-neutral-950 flex items-center gap-1">
                  <Sparkles size={15} className="text-brand-650" /> Gemini 灵感文案撰写 & 模版定制
                </span>
                <p className="text-neutral-600">输入推广主题（如：情人节特惠/上新活动），选择您期望生成的<b>邮件语言</b>。Gemini 将为您秒级输出契合语境、排版优雅的 HTML 格式营销邮件正文！</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center gap-1.5 bg-white border border-brand-200/60 rounded-xl px-3 py-2 sm:w-64">
                    <span className="text-neutral-500 font-bold text-[10px] uppercase tracking-wider shrink-0">模版语言:</span>
                    <select
                      value={edmDraftLanguage}
                      onChange={(e) => setEdmDraftLanguage(e.target.value)}
                      className="text-xs bg-transparent border-none outline-none font-bold text-neutral-800 cursor-pointer w-full focus:ring-0"
                    >
                      <option value="Simplified Chinese">简体中文 (Simplified Chinese)</option>
                      <option value="Traditional Chinese">繁體中文 (Traditional Chinese)</option>
                      <option value="English">English</option>
                      <option value="Japanese">日本語 (Japanese)</option>
                      <option value="German">Deutsch (German)</option>
                      <option value="French">Français (French)</option>
                      <option value="Spanish">Español (Spanish)</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-1 gap-2">
                    <input
                      type="text"
                      value={edmTopicPrompt}
                      onChange={(e) => setEdmTopicPrompt(e.target.value)}
                      placeholder="例如: 感恩节答谢活动，定制情侣卫衣 15% 优惠，语气温馨诚恳，折扣码 SAVE15"
                      className="flex-grow border border-brand-200/60 rounded-xl px-4 py-2 bg-white text-xs outline-none font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleDraftAIEDM}
                      disabled={draftingAI || !edmTopicPrompt}
                      className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                    >
                      {draftingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {al("AI 撰写", "Draft with AI")}
                    </button>
                  </div>
                </div>
              </div>

              {/* Recipient targeted selection config */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b pb-3 border-neutral-200/60 flex-wrap gap-2">
                  <div>
                    <h3 className="font-black text-xs text-neutral-800 uppercase tracking-wide">👥 确定发送目标收件人群范围</h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">支持按成交下单客户、邮箱订阅者或点选指定多用户群发邮件。</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEdmRecipientType('all');
                        setEdmSelectedRecipients([]);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${edmRecipientType === 'all' ? 'bg-neutral-900 text-white' : 'bg-white border text-neutral-500 hover:bg-neutral-50'}`}
                    >
                      全部/分群发送 (All)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEdmRecipientType('specific')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${edmRecipientType === 'specific' ? 'bg-neutral-900 text-white' : 'bg-white border text-neutral-500 hover:bg-neutral-50'}`}
                    >
                      精细点选指定收件人 (Specific Custom)
                    </button>
                  </div>
                </div>

                {/* Country and Region selector */}
                <div className="bg-white border border-neutral-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-3xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-neutral-800 flex items-center gap-1.5">
                      <span>🌍 国家/地区定向发送过滤 (Country/Region Filter)</span>
                    </p>
                    <p className="text-[10px] text-neutral-400">选择国家可以同时在分群模式和精细点选模式中，精准过滤并发送该国家/地区的邮件。</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={edmSelectedCountry}
                      onChange={(e) => {
                        setEdmSelectedCountry(e.target.value);
                      }}
                      className="border border-neutral-200 bg-neutral-50 text-neutral-800 text-xs px-3 py-1.5 rounded-xl outline-none font-bold focus:ring-1 focus:ring-brand-500 cursor-pointer min-w-[180px]"
                    >
                      <option value="all">🌐 所有国家/地区 (All Countries)</option>
                      {allCountries.map(country => (
                        <option key={country} value={country}>📍 {country}</option>
                      ))}
                      <option value="Unknown">❓ 未知国家/地区 (Unknown)</option>
                    </select>
                  </div>
                </div>

                {edmRecipientType === 'all' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'all', title: '全部用户 (All Addresses)', desc: `包含所有符合国家过滤的 Newsletter 订阅邮箱 + 历史下单买家，共 ${countAll} 人` },
                      { id: 'subscribers', title: '仅 Newsletter 订阅邮箱', desc: `仅发送给符合国家过滤的新闻资讯订阅邮箱，共 ${countSubscribers} 人` },
                      { id: 'orderCustomers', title: '仅历史下单购买买家', desc: `仅向在您商店实际下过账单并完成付款的客户，共 ${countOrderCustomers} 人` }
                    ].map(g => (
                      <label
                        key={g.id}
                        className={`border rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-colors bg-white ${edmSourceType === g.id ? 'border-brand-500 ring-1 ring-brand-500/30' : 'border-neutral-200 hover:bg-neutral-50/50'}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="edmSourceType"
                            checked={edmSourceType === g.id}
                            onChange={() => setEdmSourceType(g.id as any)}
                            className="mt-0.5 cursor-pointer text-brand-600 focus:ring-brand-500"
                          />
                          <div>
                            <p className="font-bold text-xs text-neutral-800">{g.title}</p>
                            <p className="text-[10px] text-neutral-400 mt-1 leading-normal">{g.desc}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                      <input
                        type="text"
                        placeholder="🔍 输入客户姓名、邮箱或订单号进行精确检索..."
                        value={edmRecipientSearch}
                        onChange={(e) => setEdmRecipientSearch(e.target.value)}
                        className="border border-neutral-200 rounded-xl px-3 py-2 bg-white text-xs outline-none focus:ring-1 focus:ring-brand-500 flex-1"
                      />
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const allEmails = filteredCandidates.map(c => c.email);
                            setEdmSelectedRecipients(Array.from(new Set([...edmSelectedRecipients, ...allEmails])));
                          }}
                          className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-3 py-2 rounded-xl text-[11px] cursor-pointer"
                        >
                          全选过滤结果
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const allEmails = filteredCandidates.map(c => c.email);
                            setEdmSelectedRecipients(edmSelectedRecipients.filter(email => !allEmails.includes(email)));
                          }}
                          className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-3 py-2 rounded-xl text-[11px] cursor-pointer"
                        >
                          取消选择过滤结果
                        </button>
                      </div>
                    </div>

                    <div className="border bg-white rounded-2xl max-h-60 overflow-y-auto divide-y divide-neutral-100 text-[11px]">
                      {filteredCandidates.length > 0 ? (
                        filteredCandidates.map((c) => {
                          const isSelected = edmSelectedRecipients.includes(c.email);
                          return (
                            <label
                              key={c.email}
                              className={`flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-50/50 transition-colors ${isSelected ? 'bg-brand-50/10' : ''}`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      setEdmSelectedRecipients(edmSelectedRecipients.filter(e => e !== c.email));
                                    } else {
                                      setEdmSelectedRecipients([...edmSelectedRecipients, c.email]);
                                    }
                                  }}
                                  className="w-4 h-4 text-brand-600 border-neutral-300 rounded focus:ring-brand-500 cursor-pointer"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-neutral-800">{c.name}</span>
                                    <span className="font-mono text-neutral-400">({c.email})</span>
                                    {c.country && (
                                      <span className="px-1.5 py-0.5 bg-neutral-100 border text-neutral-600 rounded text-[9px] font-bold">
                                        📍 {c.country === 'Unknown' ? '未知国家' : c.country}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-neutral-450 mt-0.5">{c.details}</p>
                                </div>
                              </div>
                              <div className="shrink-0">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${c.source === 'order' ? 'bg-green-50 text-green-700 border border-green-150' : 'bg-neutral-100 text-neutral-500 border border-neutral-200'}`}>
                                  {c.source === 'order' ? '已下单买家' : '订阅者'}
                                </span>
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        <p className="p-4 text-center text-neutral-400 italic">没有找到符合搜索条件的收件人。</p>
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono flex justify-between px-1">
                      <span>已过滤候选人数: {filteredCandidates.length}</span>
                      <span className="font-bold text-neutral-700">当前已勾选目标收件人: {edmSelectedRecipients.length} 位</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 🛍️ BEST SELLER SMART PRODUCT RECOMMENDATION HUB */}
              <div className="bg-gradient-to-br from-pink-50/40 via-purple-50/30 to-brand-50/10 border border-pink-100/60 rounded-3xl p-6 space-y-4">
                <div className="flex items-start justify-between border-b border-pink-100/40 pb-3 flex-wrap gap-3">
                  <div>
                    <h3 className="font-serif font-black text-xs text-neutral-800 flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles size={14} className="text-pink-600 animate-pulse" />
                      <span>🛍️ Bestseller 智能选品与个性化推荐推荐</span>
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">根据购买人的历史购买类别，自动匹配最佳选品（Bestseller）推荐，提供一键 HTML 卡片插入与 AI 自动生成推广邮件功能。</p>
                  </div>
                  <span className="px-2 py-0.5 bg-pink-100/50 text-pink-700 text-[9px] font-bold uppercase rounded-lg tracking-wider">
                    Bestseller Recommender
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Left Column: Customer and Category references */}
                  <div className="space-y-3">
                    <div className="bg-white border border-pink-100/60 p-3.5 rounded-2xl space-y-2">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                        第一步：选择参考下单客户 / Select Reference Buyer
                      </label>
                      <select
                        value={edmRecipReferenceEmail}
                        onChange={(e) => {
                          setEdmRecipReferenceEmail(e.target.value);
                          if (e.target.value !== 'all') {
                            setEdmRecipReferenceCategory('all');
                          }
                        }}
                        className="w-full border border-neutral-200 bg-neutral-50 text-neutral-800 text-xs px-3 py-2 rounded-xl outline-none font-bold cursor-pointer"
                      >
                        <option value="all">👥 不指定特定客户（按下方自选类别推荐）</option>
                        {Array.from(new Set((orders || []).map(o => o.email?.toLowerCase().trim()).filter(Boolean))).map(email => {
                          const order = (orders || []).find(o => o.email?.toLowerCase().trim() === email);
                          return (
                            <option key={email} value={email}>
                              👤 {order?.customerName || email.split('@')[0]} ({email})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="bg-white border border-pink-100/60 p-3.5 rounded-2xl space-y-2">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                        或者：直接自选类别推荐 / Select Category Manually
                      </label>
                      <select
                        value={edmRecipReferenceCategory}
                        onChange={(e) => {
                          setEdmRecipReferenceCategory(e.target.value);
                          setEdmRecipReferenceEmail('all');
                        }}
                        className="w-full border border-neutral-200 bg-neutral-50 text-neutral-800 text-xs px-3 py-2 rounded-xl outline-none font-bold cursor-pointer"
                        disabled={edmRecipReferenceEmail !== 'all'}
                      >
                        <option value="all">🌟 所有类别 (All Categories)</option>
                        {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(cat => (
                          <option key={cat} value={cat}>
                            🏷️ {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {edmRecipReferenceEmail !== 'all' && (
                      <div className="bg-pink-50/30 border border-pink-100/50 p-3 rounded-xl text-[10px] text-pink-900 leading-normal space-y-1">
                        <p className="font-bold">🔍 历史订单画像分析 / Buyer Profile:</p>
                        <p>该客户曾下单购买过的产品类别为：
                          <strong className="text-neutral-900 font-bold ml-1">
                            {detectedCategories.length > 0 ? detectedCategories.join(', ') : '无 (系统建议推荐全店畅销款)'}
                          </strong>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Matched products and quick actions */}
                  <div className="space-y-3">
                    <div className="bg-white border border-pink-100/60 p-4 rounded-2xl space-y-3 flex-grow flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                          🎯 匹配到的 Bestseller 商品推荐 / Matched Best Sellers
                        </p>
                        
                        <div className="space-y-2">
                          {recommendedBestSellers.length > 0 ? (
                            recommendedBestSellers.map((prod: any) => (
                              <div key={prod.id} className="flex items-center gap-3 border p-2 rounded-xl hover:bg-neutral-50/40 transition-colors">
                                <img src={prod.imageUrl || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100'} className="w-11 h-11 object-cover rounded-lg border bg-neutral-100 shrink-0" />
                                <div className="min-w-0 flex-1 text-left">
                                  <p className="font-bold text-[11px] text-neutral-800 truncate">{prod.name}</p>
                                  <p className="text-[10px] text-neutral-400 font-mono">
                                    分类: {prod.category} | 评分: <span className="text-amber-500">★ {prod.rating || '4.9'}</span>
                                  </p>
                                  <p className="text-[10px] text-brand-650 font-bold font-mono">${prod.price}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-neutral-450 italic text-[11px] py-4 text-center">暂无符合条件的商品推荐</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-neutral-100/60 mt-2">
                        <button
                          type="button"
                          onClick={insertRecommendationCardHTML}
                          disabled={recommendedBestSellers.length === 0}
                          className="flex-1 bg-white hover:bg-neutral-50 text-neutral-700 font-bold py-2 px-3 border rounded-xl text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          📥 插入选品卡片 HTML
                        </button>
                        <button
                          type="button"
                          onClick={aiDraftWithRecommendations}
                          disabled={recommendedBestSellers.length === 0 || draftingAI}
                          className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-3 rounded-xl text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          {draftingAI ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                          AI 一键生成推广
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Newsletter dispatch Form */}
              <form onSubmit={handleDispatchEDM} className="space-y-4 bg-neutral-50/50 p-6 rounded-2xl border text-xs">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">邮件标题/主题 Pitch (Newsletter Subject Line)</label>
                  <input 
                    type="text" 
                    required 
                    value={edmNewsletterTitle} 
                    onChange={(e) => setEdmNewsletterTitle(e.target.value)} 
                    placeholder="例如：感恩相遇！给最特别的您送上一份尊享折扣礼遇 🎁" 
                    className="w-full h-11 border bg-white rounded-xl px-4 outline-none focus:ring-1 focus:ring-brand-500 font-medium text-xs text-neutral-800" 
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-bold text-neutral-700">邮件 HTML 代码/文本正文 (Email HTML Body)</label>
                    <div className="flex border rounded-lg overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => setEdmEditorTab('edit')}
                        className={`px-3 py-1 font-bold text-[10px] cursor-pointer transition-all ${edmEditorTab === 'edit' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500'}`}
                      >
                        编辑内容 Code
                      </button>
                      <button
                        type="button"
                        onClick={() => setEdmEditorTab('preview')}
                        className={`px-3 py-1 font-bold text-[10px] cursor-pointer transition-all ${edmEditorTab === 'preview' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500'}`}
                      >
                        实时预览 Live Render
                      </button>
                    </div>
                  </div>

                  {edmEditorTab === 'edit' ? (
                    <div className="space-y-1">
                      <textarea 
                        rows={12} 
                        required 
                        value={edmNewsletterContent} 
                        onChange={(e) => setEdmNewsletterContent(e.target.value)} 
                        placeholder="在这里输入专业的 HTML 格式或纯文本邮件内容..." 
                        className="w-full border bg-white rounded-xl p-4 leading-relaxed font-mono text-[11px] focus:ring-1 focus:ring-brand-500 outline-none" 
                      />
                      <div className="bg-neutral-100 p-2.5 rounded-xl text-[10px] text-neutral-500 leading-normal">
                        <strong>💡 支持的动态占位符（系统发送时将自动替换）：</strong>
                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                          <li><code className="font-mono font-bold text-neutral-700">{"{{name}}"}</code>: 收件人姓名（若无则取邮箱前缀）</li>
                          <li><code className="font-mono font-bold text-neutral-700">{"{{email}}"}</code>: 收件人邮箱地址</li>
                          <li><code className="font-mono font-bold text-neutral-700">{"{{store_name}}"}</code>: 商店名称 (Grobrav)</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="border bg-white rounded-xl p-4 min-h-[250px] overflow-y-auto max-h-[450px]">
                      {edmNewsletterContent ? (
                        <div 
                          className="email-live-preview"
                          dangerouslySetInnerHTML={{ 
                            __html: edmNewsletterContent
                              .replace(/\{\{name\}\}/gi, 'Sarah Jenkins (Example / 示例姓名)')
                              .replace(/\{\{customerName\}\}/gi, 'Sarah Jenkins (Example)')
                              .replace(/\{\{email\}\}/gi, 'customer@example.com')
                              .replace(/\{\{store_name\}\}/gi, 'Grobrav')
                          }} 
                        />
                      ) : (
                        <p className="text-center text-neutral-400 py-12 italic">模版内容为空，无法渲染预览。请选择上方模版或输入 HTML 内容。</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-neutral-200 pt-4 flex-wrap gap-4">
                  <div className="text-[10px] text-neutral-450 font-mono">
                    {edmRecipientType === 'all' ? (
                      <span>发送范围: <strong className="text-neutral-700 text-xs">
                        {edmSourceType === 'all' && `全部候选用户 (${allCandidatesList.length} 人)`}
                        {edmSourceType === 'subscribers' && `仅限订阅邮箱 (${edmSubscribers.length} 人)`}
                        {edmSourceType === 'orderCustomers' && `仅限下单顾客 (${Array.from(new Set((orders || []).map(o => o.email?.toLowerCase().trim()).filter(Boolean))).length} 人)`}
                      </strong></span>
                    ) : (
                      <span>发送范围: 精准勾选了 <strong className="text-neutral-700 text-xs">{edmSelectedRecipients.length}</strong> 人</span>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] text-neutral-450 italic">
                      {process.env.SMTP_HOST ? '✅ SMTP 真实发信服务器已就绪' : 'ℹ️ SMTP 未配置，将记录至模拟日志'}
                    </span>
                    <Button 
                      type="submit" 
                      disabled={dispatchingEDM || (edmRecipientType === 'specific' && edmSelectedRecipients.length === 0)} 
                      className="font-bold flex items-center gap-1 shrink-0 uppercase tracking-wide px-5 h-10 shadow-md"
                    >
                      {dispatchingEDM && <Loader2 size={14} className="animate-spin" />}
                      发送营销邮件 🚀
                    </Button>
                  </div>
                </div>
              </form>

              {/* Dispatch logs history panel */}
              <div className="border border-neutral-200 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="font-black text-xs text-neutral-800 uppercase tracking-wide">📊 历史营销发送记录 (Campaign Logs)</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">查看以往派发的 EDM 邮件、真实送达及沙盒模拟详情。</p>
                </div>

                {edmCampaigns && edmCampaigns.length > 0 ? (
                  <div className="space-y-3">
                    {edmCampaigns.map((camp: any) => (
                      <div key={camp.id} className="border border-neutral-100 rounded-xl bg-white p-4 space-y-3 text-left">
                        <div className="flex justify-between items-start gap-4 flex-wrap">
                          <div>
                            <span className="text-[9px] bg-neutral-100 border text-neutral-500 font-mono px-1.5 py-0.5 rounded">ID: {camp.id}</span>
                            <h4 className="font-bold text-neutral-800 text-xs mt-1 leading-normal">{camp.title}</h4>
                            <p className="text-[10px] text-neutral-400 mt-1">
                              发送时间: {camp.date} | 覆盖人数: <strong className="text-neutral-700">{camp.recipientsCount || 0} 位用户</strong>
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${camp.smtpConfigured ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                              {camp.smtpConfigured ? 'SMTP 真实送达' : '沙盒模拟分发'}
                            </span>
                          </div>
                        </div>

                        {/* Recipient breakdown logs */}
                        {camp.dispatchedDetails && camp.dispatchedDetails.length > 0 && (
                          <div className="border-t pt-3 space-y-1.5">
                            <p className="font-bold text-[10px] text-neutral-500">投递明细日志 / Delivery Log Details:</p>
                            <div className="max-h-36 overflow-y-auto divide-y divide-neutral-100 text-[10px] bg-neutral-50/50 rounded-lg p-2 font-mono">
                              {camp.dispatchedDetails.map((det: any, idx: number) => (
                                <div key={idx} className="py-1 flex justify-between items-center gap-2">
                                  <span className="text-neutral-700 truncate max-w-xs">{det.name} ({det.email})</span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className={`text-[9px] font-bold ${det.status?.includes('Failed') ? 'text-red-500' : 'text-neutral-500'}`}>
                                      {det.status}
                                    </span>
                                    {det.error && <span className="text-red-400 text-[8px]" title={det.error}>({det.error})</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-400 text-center py-4 italic text-xs">当前暂无历史发送记录。</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: MANAGE REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-serif font-black text-neutral-900">Moderate Customer Review Log Statements</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Admin privilege center allowing immediate deletion of inaccurate comments feedback.</p>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {products.filter(p => p.ratingReviews && p.ratingReviews.length > 0).length > 0 ? (
                  products.map(p => 
                    p.ratingReviews?.map((rev: any) => (
                      <div key={rev.id} className="p-4 bg-neutral-50 border rounded-2xl text-xs flex justify-between items-start gap-3">
                        <div className="space-y-1">
                          <div>
                            <span className="font-semibold text-neutral-905">{rev.userName} ({rev.email || 'guest'})</span>
                            <span className="text-[10px] text-neutral-400 ml-2 font-mono">Item Log: {p.name}</span>
                          </div>
                          <p className="text-neutral-500 font-medium">"{rev.comment}"</p>
                        </div>
                        <button onClick={() => handleDeleteReview(p.id, rev.id)} className="p-2 text-red-650 bg-white border rounded-lg hover:bg-neutral-100 cursor-pointer">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )
                ) : (
                  <p className="text-xs text-center text-neutral-400 py-6">No client reviews submitted inside system databases yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: PROFILE SECURITY */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-fade-in text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="text-xl font-serif font-black text-neutral-900 flex items-center gap-2">
                    <Shield className="text-neutral-950" size={20} />
                    {al("商户后台高级安全与防盗中心", "Control Board Advanced Security & Anti-Theft")}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    {al("配置管理员凭证保护、域名防盗劫持校验及全站安全审计日志。", "Configure admin protection, domain anti-theft validation, and site security audit logs.")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchSecurityLogs}
                  disabled={securityLogsLoading}
                  className="self-start sm:self-center inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  <RefreshCw size={12} className={securityLogsLoading ? 'animate-spin' : ''} />
                  {al("刷新安全日志", "Sync Security Logs")}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Password Protection & Domain Protection */}
                <div className="space-y-6">
                  {/* Part 1: Admin Password credentials */}
                  <div className="bg-neutral-50/80 p-6 rounded-2xl border">
                    <h3 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
                      <Lock size={15} />
                      {al("修改管理员账号密码", "Update Administrative Password")}
                    </h3>
                    
                    {defaultPassWarning && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800 leading-relaxed font-semibold">
                        ⚠️ {al("警告：您当前正在使用初始默认弱密码 'admin'，这极易被破解！请尽快更新。", "Danger: You are using the default password 'admin'. Change it now to protect your store database!")}
                      </div>
                    )}

                    <form onSubmit={handleChangeAdminPassword} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 font-mono">{al("当前原密码", "Current Password")}</label>
                        <input 
                          type="password" 
                          required 
                          value={oldPass} 
                          onChange={(e) => setOldPass(e.target.value)} 
                          className="w-full h-10 border rounded-xl px-3 bg-white outline-none focus:border-neutral-400 font-mono" 
                          placeholder="admin" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 font-mono">{al("全新高强度密码", "New Secure Password")}</label>
                        <input 
                          type="password" 
                          required 
                          value={newPass} 
                          onChange={(e) => setNewPass(e.target.value)} 
                          className="w-full h-10 border rounded-xl px-3 bg-white outline-none focus:border-neutral-400 font-mono" 
                          placeholder={al("需包含大小写、数字、特殊字符 (8+位)", "At least 8 chars, mixed case, number, symbol")}
                        />
                      </div>

                      <div className="p-3 bg-neutral-100 rounded-xl space-y-1 text-[10px] text-neutral-500 font-medium">
                        <p className="font-bold text-neutral-700">{al("🔑 密码安全强制合规要求：", "🔑 Password Compliance Rules:")}</p>
                        <ul className="list-disc list-inside space-y-0.5 ml-1">
                          <li>{al("长度必须大于或等于 8 位字符", "Must be 8 or more characters long")}</li>
                          <li>{al("必须包含至少一个大写字母 (A-Z)", "Must contain at least one uppercase letter (A-Z)")}</li>
                          <li>{al("必须包含至少一个小写字母 (a-z)", "Must contain at least one lowercase letter (a-z)")}</li>
                          <li>{al("必须包含至少一个数字和特殊符号", "Must contain at least one digit and special symbol")}</li>
                        </ul>
                      </div>

                      <Button type="submit" disabled={changePassLoading} className="w-full font-bold flex items-center justify-center gap-1.5 h-10 rounded-xl">
                        {changePassLoading && <Loader2 size={12} className="animate-spin" />}
                        {al("保存高强度新密码", "Save High-Security Password")}
                      </Button>
                    </form>
                  </div>

                  {/* Part 2: Domain verification / Anti-stealing */}
                  <div className="bg-neutral-50/80 p-6 rounded-2xl border space-y-4">
                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                      <Globe size={15} />
                      {al("网站域名保护与防盗链设置", "Domain Protection & Host Lock")}
                    </h3>
                    
                    <div className="space-y-3 text-xs leading-relaxed">
                      <div className="flex items-center justify-between p-2.5 bg-white border rounded-xl">
                        <span className="font-semibold text-neutral-600">{al("当前访问域名", "Current Request Host")}:</span>
                        <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-md text-[11px]">
                          {window.location.host}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-white border rounded-xl">
                        <span className="font-semibold text-neutral-600">{al("主机防护状态", "Host Header Protection")}:</span>
                        <span className="font-bold text-emerald-600 flex items-center gap-1 font-mono text-[11px]">
                          <CheckCircle size={12} /> {al("已启用 / ACTIVE", "ACTIVE")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-white border rounded-xl">
                        <span className="font-semibold text-neutral-600">{al("防跨站嵌入劫持 (Clickjacking)", "Iframe Clickjacking Protection")}:</span>
                        <span className="font-bold text-emerald-600 flex items-center gap-1 font-mono text-[11px]">
                          <CheckCircle size={12} /> {al("已配置 CSP", "CSP CONFIGURED")}
                        </span>
                      </div>

                      <div className="text-[11px] text-neutral-450 space-y-2 mt-2 leading-relaxed">
                        <p>
                          {al("🔒 域名防盗：系统在服务端自动开启 Host 请求头双向效验。仅允许授权域名（localhost、127.0.0.1、*.run.app）和 ALLOWED_DOMAINS 中配置的自定义域名访问。非授权域名试图解析或代理本站时，系统将直接返回 403 拦截，杜绝镜像站与盗版欺诈风险。", "🔒 Domain Anti-Theft: Host header validation is actively enforced. Only local loopbacks, Cloud Run (.run.app), and ALLOWED_DOMAINS configurations are permitted. Other proxy/hijack servers will instantly face 403 errors.")}
                        </p>
                        <p>
                          {al("🛡️ 防嵌入劫持：Content-Security-Policy 中的 frame-ancestors 指令已限制页面只可在本站同源或经过认证的 Google AI Studio 控制台内部加载，彻底防御任何恶意的 iframe 点击劫持。", "🛡️ Anti-Clickjacking: Content-Security-Policy (CSP) frame-ancestors is locked to 'self' and google.com domains to secure the sandbox while preventing malicious clickjacking overlays.")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Security logs Audit Trail */}
                <div className="bg-neutral-50/80 p-6 rounded-2xl border flex flex-col h-full min-h-[500px]">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                      <Database size={15} />
                      {al("全站安全事件审计日志", "Security Event Audit Trail")}
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {al("实时记录管理员登录动作、修改密码尝试等可能涉及越权的操作。", "Real-time records of administrative log-ins, attempts, and operations.")}
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[460px] space-y-3 pr-1 text-xs">
                    {securityLogs && securityLogs.length > 0 ? (
                      [...securityLogs].reverse().map((log: any) => {
                        let badgeColor = "bg-neutral-100 text-neutral-600 border-neutral-200";
                        let badgeLabel = log.eventType;

                        if (log.eventType === 'admin_login_success') {
                          badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                          badgeLabel = al("登录成功", "LOGIN SUCCESS");
                        } else if (log.eventType === 'admin_login_failed') {
                          badgeColor = "bg-red-50 text-red-700 border-red-200";
                          badgeLabel = al("密码错误", "LOGIN FAILED");
                        } else if (log.eventType === 'admin_login_blocked') {
                          badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                          badgeLabel = al("自动拦截", "BLOCKED");
                        } else if (log.eventType === 'admin_password_changed') {
                          badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
                          badgeLabel = al("修改密码", "PASSWORD CHANGED");
                        } else if (log.eventType === 'admin_password_change_failed') {
                          badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
                          badgeLabel = al("修改密码失败", "CHANGE FAILED");
                        }

                        return (
                          <div key={log.id} className="p-3 bg-white border border-neutral-150 rounded-xl space-y-2 hover:shadow-2xs transition-shadow">
                            <div className="flex justify-between items-center gap-2">
                              <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-lg font-mono uppercase ${badgeColor}`}>
                                {badgeLabel}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-mono">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="font-semibold text-neutral-800 leading-relaxed text-[11px]">
                              {log.description}
                            </p>
                            <div className="flex justify-between items-center text-[10px] text-neutral-450 pt-1 border-t border-neutral-100 font-mono">
                              <span>{al("目标账号", "User")}: <strong className="text-neutral-600">{log.email}</strong></span>
                              <span>IP: <strong className="text-neutral-600">{log.ip}</strong></span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-neutral-400 text-center space-y-2">
                        <Shield className="text-neutral-200 animate-pulse" size={32} />
                        <p className="italic text-xs">{al("暂无安全日志审计事件。", "No security events recorded yet.")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: STORE BRAND & SHIPPING CONFIG */}
          {activeTab === 'contact' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div>
                <h2 className="text-xl font-serif font-black text-neutral-900">Store Brand & Logistics Configurations</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Configure store company details, custom brand slogans, free cargo shipping thresholds, standard logistics fees, and fast carrier options.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Brand contact form */}
                <form onSubmit={handleUpdateContactInfo} className="space-y-4 bg-neutral-50/85 p-6 rounded-3xl border text-xs h-fit">
                  <h3 className="font-bold text-neutral-800 border-b pb-2 text-xs flex items-center gap-1">
                    <Settings size={14} className="text-brand-600" /> Store Brand Slogan & Details
                  </h3>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1 font-mono">Brand Slogan</label>
                    <input type="text" required value={storeSlogan} onChange={(e) => setStoreSlogan(e.target.value)} className="w-full h-10 border rounded px-3 bg-white" placeholder="The Art of Bespoke Gifting" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1 font-mono">Customer Assistance Email Address</label>
                    <input type="email" required value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} className="w-full h-10 border rounded px-3 bg-white" placeholder="support@grobrav.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1 font-mono">Assistance Phone Number</label>
                    <input type="text" required value={storePhone} onChange={(e) => setStorePhone(e.target.value)} className="w-full h-10 border rounded px-3 bg-white" placeholder="+1 (555) 123-4567" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1 font-mono">Physical Address Location</label>
                    <input type="text" required value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} className="w-full h-10 border rounded px-3 bg-white" placeholder="123 Fashion Ave, NY 10016" />
                  </div>

                  <Button type="submit" disabled={storeLoading} className="font-bold flex items-center gap-1.5 w-full justify-center">
                    {storeLoading && <Loader2 size={12} className="animate-spin" />}
                    Save Store Brand Details
                  </Button>
                </form>

                {/* Shipping & Freight configuration form */}
                <form onSubmit={handleUpdateShippingConfig} className="space-y-4 bg-neutral-50/85 p-6 rounded-3xl border text-xs h-fit">
                  <h3 className="font-bold text-neutral-800 border-b pb-2 text-xs flex items-center gap-1">
                    <Truck size={14} className="text-brand-600" /> Dynamic Logistics & Freight Config
                  </h3>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1 font-mono">Free Shipping Threshold ($ USD)</label>
                    <input type="number" step="0.01" required value={freeShippingThreshold} onChange={(e) => setFreeShippingThreshold(e.target.value)} className="w-full h-10 border rounded px-3 bg-white font-mono" placeholder="75.00" />
                    <p className="text-[10px] text-neutral-400 mt-1">Orders with cart value equal to or greater than this will get free standard shipping.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-1 font-mono">Standard Fee ($ USD)</label>
                      <input type="number" step="0.01" required value={standardShippingFee} onChange={(e) => setStandardShippingFee(e.target.value)} className="w-full h-10 border rounded px-3 bg-white font-mono" placeholder="5.99" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-1 font-mono">Standard Speed Days</label>
                      <input type="text" required value={standardDeliveryTime} onChange={(e) => setStandardDeliveryTime(e.target.value)} className="w-full h-10 border rounded px-3 bg-white" placeholder="5-7 business days" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-1 font-mono">Express Fee ($ USD)</label>
                      <input type="number" step="0.01" required value={expressShippingFee} onChange={(e) => setExpressShippingFee(e.target.value)} className="w-full h-10 border rounded px-3 bg-white font-mono" placeholder="15.00" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-1 font-mono">Express Speed Days</label>
                      <input type="text" required value={expressDeliveryTime} onChange={(e) => setExpressDeliveryTime(e.target.value)} className="w-full h-10 border rounded px-3 bg-white" placeholder="2-3 business days" />
                    </div>
                  </div>

                  <Button type="submit" disabled={shippingLoading} className="font-bold flex items-center gap-1.5 w-full justify-center">
                    {shippingLoading && <Loader2 size={12} className="animate-spin" />}
                    Save Shipping Rates Configuration
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 11: SUPPORT MESSAGES INBOX */}
          {activeTab === 'support_messages' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-xl font-serif font-black text-neutral-900">Customer Assistance Support Inbox</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Inspect incoming Contact Us message logs from front-end users. Reply directly with email delivery powered by SMTP.</p>
                </div>
                <button onClick={fetchSupportMessages} disabled={supportMessagesLoading} className="p-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl hover:scale-105 duration-200">
                  <RefreshCw size={14} className={supportMessagesLoading ? "animate-spin" : ""} />
                </button>
              </div>

              {supportMessagesLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-neutral-450 text-xs">
                  <Loader2 className="animate-spin text-brand-600 mb-2" size={28} />
                  <span>Loading customer inquiries...</span>
                </div>
              ) : supportMessages.length > 0 ? (
                <div className="space-y-4 max-w-4xl">
                  {supportMessages.map((msg: any) => (
                    <div key={msg.id} className="bg-neutral-50/70 border border-neutral-200 p-5 rounded-3xl space-y-3 relative transition-all hover:bg-neutral-50">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div>
                          <span className={`px-2.5 py-0.5 border text-[10px] font-black rounded-lg ${
                            msg.replied 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                          }`}>
                            {msg.replied ? 'REPLIED' : 'PENDING REPLY'}
                          </span>
                          <h3 className="font-bold text-neutral-900 text-sm mt-1">{msg.subject}</h3>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {new Date(msg.submittedAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs text-neutral-650 bg-white p-3 rounded-xl border border-neutral-100 leading-relaxed">
                        <p className="text-[11px] text-neutral-450 mb-1 pb-1 border-b border-dashed">
                          From: <strong>{msg.name}</strong> (<a href={`mailto:${msg.email}`} className="text-brand-600 hover:underline">{msg.email}</a>)
                        </p>
                        <p className="whitespace-pre-wrap mt-2 text-neutral-800 font-medium">"{msg.message}"</p>
                      </div>

                      {msg.replied ? (
                        <div className="bg-pink-50/50 border border-pink-100 p-3 rounded-xl text-xs text-neutral-700 mt-2">
                          <p className="text-[10px] text-pink-700 font-black flex items-center gap-1">
                            <CheckCircle size={12} /> Response sent via SMTP ({msg.repliedAt ? new Date(msg.repliedAt).toLocaleString() : 'Just now'})
                          </p>
                          <p className="whitespace-pre-wrap mt-1 text-neutral-800 font-mono text-[11px] bg-white p-2 rounded-md border border-neutral-100">
                            {msg.replyText}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 mt-2 pt-2 border-t border-dashed">
                          <label className="block text-[10px] font-black text-neutral-450 uppercase tracking-widest">Write Email Reply</label>
                          <textarea
                            rows={3}
                            value={replyTextMap[msg.id] || ''}
                            onChange={(e) => setReplyTextMap({ ...replyTextMap, [msg.id]: e.target.value })}
                            placeholder="Type customer support reply here... (Sent as dynamic HTML email to user's address)"
                            className="w-full p-3 text-xs border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none font-sans"
                          />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleReplyMessage(msg.id)}
                              disabled={replyLoadingId === msg.id}
                              className="px-4 py-2 bg-neutral-900 text-white font-bold text-xs rounded-xl hover:bg-brand-650 cursor-pointer flex items-center gap-1.5 transition-colors"
                            >
                              {replyLoadingId === msg.id && <Loader2 size={12} className="animate-spin" />}
                              Deliver Reply Email
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-neutral-400 text-center space-y-3">
                  <MessageSquare size={44} className="text-neutral-200 animate-pulse" />
                  <div>
                    <p className="font-bold text-sm text-neutral-700">All clear! Support inbox empty.</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Any inquiries submitted through the Contact Us form will populate here immediately.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 13: EXTENDED WARRANTIES MANAGEMENT */}
          {activeTab === 'warranties' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-serif font-black text-neutral-900 flex items-center gap-2">
                    <Shield size={22} className="text-brand-650" />
                    {al("售后延保申请客户管理", "After-Sales Warranty Application Center")}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {al("查看并导出所有提交延保服务的客户完整信息（支持Excel/WPS导出）。", "View and export complete client registration details for product extended warranty (Excel/WPS supported).")}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={fetchWarranties}
                    disabled={warrantiesLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-all border shadow-2xs cursor-pointer select-none"
                  >
                    <RefreshCw size={13} className={warrantiesLoading ? 'animate-spin' : ''} />
                    {al("刷新列表", "Refresh List")}
                  </button>
                  <Button
                    onClick={() => {
                      if (warranties.length === 0) {
                        showToast(al("暂无延保申请数据可供导出", "No warranty registrations to export"), "error");
                        return;
                      }
                      
                      const headers = [
                        al('产品名称', 'Product Name'),
                        al('购买渠道', 'Purchase Channel'),
                        al('完成订单号', 'Order ID'),
                        al('客户姓名', 'Customer Name'),
                        al('客户邮箱', 'Customer Email'),
                        al('联系电话', 'Contact Phone'),
                        al('国家', 'Country'),
                        al('居住地址', 'Residential Address'),
                        al('申请时间', 'Applied Date')
                      ];
                      
                      const rows = warranties.map((w: any) => [
                        w.name || '',
                        w.channel || '',
                        w.orderNumber || w.orderId || '',
                        w.customerName || '',
                        w.email || '',
                        w.phone || '',
                        w.country || '',
                        w.address || '',
                        w.date ? new Date(w.date).toLocaleString() : ''
                      ]);

                      const csvContent = [
                        headers.join(','),
                        ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
                      ].join('\n');
                      
                      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.setAttribute('download', `HZTzone_Extended_Warranties_${new Date().toISOString().split('T')[0]}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      
                      showToast(al("WPS / Excel格式延保客户数据导出成功！", "Warranties log exported to Excel/WPS successfully!"), "success");
                    }}
                    className="text-xs font-black bg-brand-650 hover:bg-brand-700 text-white flex items-center gap-1.5 shadow"
                  >
                    <Download size={13} />
                    {al("导出WPS / EXCEL", "Export WPS / EXCEL")}
                  </Button>
                </div>
              </div>

              {/* Filter / Search section */}
              <div className="bg-neutral-50 p-4 rounded-2xl border flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative w-full sm:w-80">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={warrantySearchTerm}
                    onChange={(e) => setWarrantySearchTerm(e.target.value)}
                    placeholder={al("搜索客户姓名、邮箱、订单号...", "Search by customer name, email, order ID...")}
                    className="w-full pl-9 pr-3.5 py-2 text-xs border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-sans font-medium"
                  />
                </div>
                <div className="text-[10px] text-neutral-400 font-mono sm:ml-auto">
                  {al(`共找到 ${warranties.filter((w: any) => {
                    const term = warrantySearchTerm.toLowerCase();
                    return !warrantySearchTerm || 
                      String(w.customerName || '').toLowerCase().includes(term) ||
                      String(w.email || '').toLowerCase().includes(term) ||
                      String(w.orderNumber || w.orderId || '').toLowerCase().includes(term);
                  }).length} 个记录`, `Found ${warranties.filter((w: any) => {
                    const term = warrantySearchTerm.toLowerCase();
                    return !warrantySearchTerm || 
                      String(w.customerName || '').toLowerCase().includes(term) ||
                      String(w.email || '').toLowerCase().includes(term) ||
                      String(w.orderNumber || w.orderId || '').toLowerCase().includes(term);
                  }).length} records`)}
                </div>
              </div>

              {/* Warranties Table */}
              {warrantiesLoading ? (
                <div className="py-20 flex justify-center items-center text-neutral-400">
                  <Loader2 size={36} className="animate-spin text-brand-650" />
                </div>
              ) : warranties.length > 0 ? (
                <div className="border rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto max-w-full">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-neutral-50/75 border-b border-neutral-100 text-neutral-450 uppercase tracking-widest text-[9px] font-black font-mono">
                          <th className="py-3.5 px-4">{al("客户姓名", "Customer")}</th>
                          <th className="py-3.5 px-4">{al("产品名称", "Product")}</th>
                          <th className="py-3.5 px-4">{al("渠道", "Channel")}</th>
                          <th className="py-3.5 px-4">{al("订单号", "Order ID")}</th>
                          <th className="py-3.5 px-4">{al("国家", "Country")}</th>
                          <th className="py-3.5 px-4">{al("联系电话/邮箱", "Contact Info")}</th>
                          <th className="py-3.5 px-4">{al("居住地址", "Address")}</th>
                          <th className="py-3.5 px-4">{al("注册时间", "Registered At")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {warranties
                          .filter((w: any) => {
                            const term = warrantySearchTerm.toLowerCase();
                            return !warrantySearchTerm || 
                              String(w.customerName || '').toLowerCase().includes(term) ||
                              String(w.email || '').toLowerCase().includes(term) ||
                              String(w.orderNumber || w.orderId || '').toLowerCase().includes(term);
                          })
                          .map((w: any, idx: number) => {
                            // Badge matching
                            let channelBadge = "bg-neutral-100 text-neutral-700 border-neutral-200";
                            if (w.channel?.toLowerCase().includes('amazon')) channelBadge = "bg-orange-50 text-orange-700 border-orange-200";
                            else if (w.channel?.toLowerCase().includes('ebay')) channelBadge = "bg-blue-50 text-blue-700 border-blue-200";
                            else if (w.channel?.toLowerCase().includes('tiktok')) channelBadge = "bg-neutral-950 text-white border-neutral-950";
                            else if (w.channel?.toLowerCase().includes('ozon')) channelBadge = "bg-indigo-50 text-indigo-700 border-indigo-200";
                            else if (w.channel?.toLowerCase().includes('wb')) channelBadge = "bg-purple-50 text-purple-700 border-purple-200";

                            return (
                              <tr key={w.id || idx} className="hover:bg-neutral-50/50 transition-colors font-medium text-neutral-700 font-sans">
                                <td className="py-4 px-4">
                                  <div className="font-bold text-neutral-900">{w.customerName || al("未填写", "N/A")}</div>
                                </td>
                                <td className="py-4 px-4 font-semibold text-neutral-800 max-w-[150px] truncate" title={w.name}>
                                  {w.name || al("未填写", "N/A")}
                                </td>
                                <td className="py-4 px-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border font-mono ${channelBadge}`}>
                                    {w.channel || 'Direct'}
                                  </span>
                                </td>
                                <td className="py-4 px-4 font-mono font-bold text-neutral-900 text-[11px] select-all">
                                  {w.orderNumber || w.orderId || al("未填写", "N/A")}
                                </td>
                                <td className="py-4 px-4 text-neutral-500">
                                  <div>{w.country || 'US'}</div>
                                </td>
                                <td className="py-4 px-4 font-semibold">
                                  <div className="text-neutral-900 select-all">{w.email}</div>
                                  <div className="text-neutral-450 text-[10px] font-mono mt-0.5 select-all">{w.phone || 'N/A'}</div>
                                </td>
                                <td className="py-4 px-4 text-neutral-500 max-w-[180px] truncate" title={w.address}>
                                  {w.address || al("未填写", "N/A")}
                                </td>
                                <td className="py-4 px-4 text-neutral-400 text-[10px] font-mono">
                                  {w.date ? new Date(w.date).toLocaleString() : 'N/A'}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-24 flex flex-col items-center justify-center text-neutral-400 text-center space-y-4 border border-dashed rounded-3xl bg-neutral-50/50">
                  <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-350 shadow-2xs">
                    <Shield size={26} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-neutral-700">{al("暂无延保申请记录", "No warranty registrations found")}</p>
                    <p className="text-xs text-neutral-400 mt-0.5 max-w-sm">
                      {al("当有客户通过前台售后延保注册入口提交注册申请后，相关表单信息将立即在此实时登载展现。", "When clients submit extended warranty requests from the shop's front-end portal, the parsed form records will display here in real-time.")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 10: PAGES CONTENT EDITORS */}
          {activeTab === 'pages_content' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div>
                <h2 className="text-xl font-serif font-black text-neutral-900">Manageable Static Pages Content</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Edit custom text blocks rendered inside Shipping Info, Returns & Exchanges, Size Guide, Privacy Policy and Terms of Service pages.</p>
              </div>

              <form onSubmit={handleUpdatePagesContent} className="space-y-5 bg-neutral-50/80 p-6 rounded-2xl border text-xs max-w-2xl">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 font-mono">Shipping Info Page Highlight</label>
                  <textarea 
                    value={shippingContent} 
                    onChange={(e) => setShippingContent(e.target.value)} 
                    className="w-full p-3 border rounded-xl bg-white text-xs leading-relaxed font-semibold min-h-[80px]" 
                    placeholder="Enter Custom Shipping Info Page highlights..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 font-mono">Returns & Exchanges Policy Block</label>
                  <textarea 
                    value={returnsContent} 
                    onChange={(e) => setReturnsContent(e.target.value)} 
                    className="w-full p-3 border rounded-xl bg-white text-xs leading-relaxed font-semibold min-h-[80px]" 
                    placeholder="Enter Custom Returns & Exchanges info..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 font-mono">Size Guide Sublimation Advice</label>
                  <textarea 
                    value={sizeGuideContent} 
                    onChange={(e) => setSizeGuideContent(e.target.value)} 
                    className="w-full p-3 border rounded-xl bg-white text-xs leading-relaxed font-semibold min-h-[80px]" 
                    placeholder="Enter custom Size Guide tailoring notes..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 font-mono">Privacy Policy Announcement</label>
                  <textarea 
                    value={privacyContent} 
                    onChange={(e) => setPrivacyContent(e.target.value)} 
                    className="w-full p-3 border rounded-xl bg-white text-xs leading-relaxed font-semibold min-h-[80px]" 
                    placeholder="Enter Custom Privacy announcements..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5 font-mono">Terms of Service Regulations</label>
                  <textarea 
                    value={termsContent} 
                    onChange={(e) => setTermsContent(e.target.value)} 
                    className="w-full p-3 border rounded-xl bg-white text-xs leading-relaxed font-semibold min-h-[80px]" 
                    placeholder="Enter Custom Terms parameters..."
                  />
                </div>

                <Button type="submit" disabled={pagesLoading} className="font-bold flex items-center gap-1.5 shadow-md shadow-brand-100 animate-pulse">
                  {pagesLoading && <Loader2 size={12} className="animate-spin" />}
                  Save All Pages Content
                </Button>
              </form>
            </div>
          )}

          {/* TAB 11: PIXELS & MARKETING INTEGRATIONS */}
          {activeTab === 'pixels' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div>
                <h2 className="text-xl font-serif font-black text-neutral-900">Facebook & Google Pixels Integration</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Configure marketing tracking codes, standard conversion pixels, and Google Merchant Center (GMS) code verification references.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Pixel Settings Form */}
                <form onSubmit={handleUpdatePixelSettings} className="space-y-5 bg-neutral-50/80 p-6 rounded-2xl border text-xs h-fit">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-800 border-b pb-2 flex items-center gap-1.5">
                    <Settings size={14} className="text-brand-600" />
                    Tracking Configuration
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1 font-mono">Facebook Pixel ID</label>
                    <input 
                      type="text"
                      value={facebookPixelField} 
                      onChange={(e) => setFacebookPixelField(e.target.value)} 
                      className="w-full p-3 border rounded-xl bg-white text-xs font-semibold placeholder-neutral-400 focus:ring-1 focus:ring-brand-500 outline-none" 
                      placeholder="e.g. 123456789012345"
                    />
                    <span className="text-[10px] text-neutral-400 block mt-1 leading-relaxed">
                      Enter your Facebook/Meta Business Pixel ID to trigger standard PageView, AddToCart, InitiateCheckout, and Purchase events.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1 font-mono">Google Analytics Tag / GTM ID</label>
                    <input 
                      type="text"
                      value={googleTagField} 
                      onChange={(e) => setGoogleTagField(e.target.value)} 
                      className="w-full p-3 border rounded-xl bg-white text-xs font-semibold placeholder-neutral-400 focus:ring-1 focus:ring-brand-500 outline-none" 
                      placeholder="e.g. G-ABC123XYZ or GTM-XXXXXXX"
                    />
                    <span className="text-[10px] text-neutral-400 block mt-1 leading-relaxed">
                      Enter your Google GA4 Analytics Stream Tag ID or Google Tag Manager Container ID to enable compliant event auditing.
                    </span>
                  </div>

                  <Button type="submit" disabled={pixelLoading} className="font-bold flex items-center gap-1.5 shadow-md shadow-brand-100">
                    {pixelLoading && <Loader2 size={12} className="animate-spin" />}
                    Save Pixel & SEO parameters
                  </Button>
                </form>

                {/* Compliance & Standards Memo card */}
                <div className="space-y-4">
                  <div className="bg-brand-50/45 border border-brand-100 p-6 rounded-2xl text-xs space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-brand-900 flex items-center gap-1.5">
                      <Shield size={15} className="text-brand-600" />
                      Google Code & GMS Compliance
                    </h3>
                    <p className="text-neutral-600 leading-relaxed">
                      This application fully adheres to Google's strict merchant search standard specifications:
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-neutral-500 pl-1 font-medium">
                      <li><strong className="text-neutral-700">SEO Structure:</strong> Automatic semantic layout headers, active canonical routing references, and metadata tracking.</li>
                      <li><strong className="text-neutral-700">Schema.org Microdata:</strong> Real-time product structured schemas auto-generated in headers.</li>
                      <li><strong className="text-neutral-700">GEO Best practices:</strong> Geolocation coordinates, responsive layout alignment, and multi-currency formatting support.</li>
                      <li><strong className="text-neutral-750">Secure Sandbox:</strong> Safe client compilation bypassing script injections from third-party advertising cookie frameworks.</li>
                    </ul>
                  </div>

                  <div className="bg-neutral-50 border p-6 rounded-2xl text-xs space-y-2">
                    <h4 className="font-bold text-neutral-800 font-mono">Dynamic Events Log Tracker</h4>
                    <p className="text-neutral-400 text-[10px] leading-relaxed">
                      Once pixels are saved, standard tracking functions map client e-commerce triggers to appropriate web-analyser callbacks. You can verify network payloads using Facebook Pixel Helper or Google Tag Assistant extensions.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>

      {/* Delete Deletion Confirmation Overlay Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left animate-scale-up">
            <div className="flex items-center gap-3 text-red-600 border-b pb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-serif font-black text-sm text-neutral-900 leading-tight">
                  {deleteModalTitle}
                </h3>
                <p className="text-[10px] text-red-500 font-mono tracking-wider uppercase font-bold mt-0.5">
                  第二次安全确认 / Second confirmation required
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed font-medium">
              {deleteModalDesc}
            </p>

            <div className="flex gap-2.5 justify-end pt-2">
              <Button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setOnConfirmDelete(null);
                }}
                variant="outline"
                className="text-xs h-9"
              >
                {al("取消操作", "Cancel Operation")}
              </Button>
              <Button
                onClick={() => {
                  if (onConfirmDelete) {
                    onConfirmDelete();
                  }
                  setDeleteModalOpen(false);
                  setOnConfirmDelete(null);
                }}
                className="text-xs bg-red-650 hover:bg-red-700 text-white font-bold px-4 py-2 h-9 rounded-xl"
              >
                {al("确认删除", "Confirm Delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Admin;
