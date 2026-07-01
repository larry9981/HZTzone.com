import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { TRANSLATIONS, Language } from '../translations';
import { Product } from '../types';

interface User {
  id: string;
  email: string;
  role: 'customer' | 'admin';
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  slogan: string;
}

// Managed pages contents
export interface PagesContent {
  shipping: string;
  returns: string;
  size_guide: string;
  privacy: string;
  terms: string;
}

export interface PixelSettings {
  facebookPixelId: string;
  googleTagId: string;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  
  products: Product[];
  categories: Array<{ type: string; label: string; sublabel?: string; image?: string; isAiGenerated?: boolean }>;
  navigation: Array<{ title: string; path: string }>;
  coupons: Array<{ code: string; discount: number; description: string }>;
  orders: any[];
  
  contactInfo: ContactInfo;
  setContactInfo: (info: ContactInfo) => void;

  pagesContent: PagesContent;
  setPagesContent: (content: PagesContent) => void;

  pixelSettings: PixelSettings;
  setPixelSettings: (settings: PixelSettings) => void;
  
  refreshState: () => Promise<void>;
  trackEvent: (eventType: string, details?: any) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [user, setUserState] = useState<User | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ type: string; label: string; sublabel?: string; image?: string; isAiGenerated?: boolean }>>([]);
  const [navigation, setNavigation] = useState<Array<{ title: string; path: string }>>([]);
  const [coupons, setCoupons] = useState<Array<{ code: string; discount: number; description: string }>>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: 'support@grobrav.com',
    phone: '+1 (555) 123-4567',
    address: '123 Fashion Ave, NY 10016',
    slogan: 'The Art of Bespoke Gifting'
  });
  const [pagesContent, setPagesContent] = useState<PagesContent>({
    shipping: '',
    returns: '',
    size_guide: '',
    privacy: '',
    terms: ''
  });
  const [pixelSettings, setPixelSettings] = useState<PixelSettings>({
    facebookPixelId: '',
    googleTagId: ''
  });
  const [loading, setLoading] = useState(true);

  // Load language and auth session on initial load
  useEffect(() => {
    const storedLang = localStorage.getItem('grobrav_language') as Language;
    if (storedLang && ['en', 'de', 'es', 'fr', 'it'].includes(storedLang)) {
      setLanguageState(storedLang);
    }

    const storedUser = localStorage.getItem('grobrav_user');
    if (storedUser) {
      try {
        setUserState(JSON.parse(storedUser));
      } catch (err) {
        localStorage.removeItem('grobrav_user');
      }
    }

    // Load dynamic server state
    refreshState();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('grobrav_language', lang);
    trackEvent('change_language', { lang });
  };

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('grobrav_user', JSON.stringify(newUser));
      trackEvent('user_login', { email: newUser.email, role: newUser.role });
    } else {
      localStorage.removeItem('grobrav_user');
    }
  };

  const logout = () => {
    trackEvent('user_logout', { email: user?.email });
    setUser(null);
  };

  const refreshState = async () => {
    try {
      const state = await api.getState();
      setProducts(state.products);
      setCategories(state.categories);
      setNavigation(state.navigation);
      setCoupons(state.coupons);
      setOrders(state.orders);
      if (state.contactInfo) {
        setContactInfo(state.contactInfo);
      }
      if (state.pagesContent) {
        setPagesContent(state.pagesContent);
      }
      if (state.pixelSettings) {
        setPixelSettings(state.pixelSettings);
      }
    } catch (err) {
      console.error('Failed to load server state:', err);
    } finally {
      setLoading(false);
    }
  };

  const t = (key: string): string => {
    const table = TRANSLATIONS[language];
    return table?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  const getTrafficChannel = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const utmSource = params.get('utm_source') || params.get('source') || params.get('ref');
      if (utmSource) return utmSource.toLowerCase().trim();
    } catch (e) {}

    if (typeof document !== 'undefined' && document.referrer) {
      const ref = document.referrer.toLowerCase();
      if (ref.includes('facebook.com')) return 'facebook';
      if (ref.includes('instagram.com')) return 'instagram';
      if (ref.includes('tiktok.com')) return 'tiktok';
      if (ref.includes('t.co') || ref.includes('twitter.com') || ref.includes('x.com')) return 'twitter';
      if (ref.includes('pinterest.com')) return 'pinterest';
      if (ref.includes('youtube.com')) return 'youtube';
      if (ref.includes('google.com')) return 'google';
      if (ref.includes('bing.com')) return 'bing';
      if (ref.includes('yahoo.com')) return 'yahoo';
      return 'referral';
    }
    return 'direct';
  };

  const trackEvent = (eventType: string, details?: any) => {
    const channel = getTrafficChannel();
    const augmentedDetails = {
      ...(details || {}),
      channel,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      url: typeof window !== 'undefined' ? window.location.href : ''
    };
    api.trackGAEvent(eventType, augmentedDetails);
    
    // Facebook pixel events mapping
    if (typeof window !== 'undefined' && (window as any).fbq) {
      try {
        if (eventType === 'page_view') {
          (window as any).fbq('track', 'PageView');
        } else if (eventType === 'add_to_cart') {
          (window as any).fbq('track', 'AddToCart', {
            content_ids: [details?.productId],
            content_name: details?.name,
            value: details?.price,
            currency: 'USD'
          });
        } else if (eventType === 'checkout_initiate') {
          (window as any).fbq('track', 'InitiateCheckout', {
            value: details?.value,
            currency: 'USD'
          });
        } else if (eventType === 'purchase' || eventType === 'purchase_success') {
          (window as any).fbq('track', 'Purchase', {
            value: details?.total || details?.value,
            currency: 'USD'
          });
        }
      } catch (err) {
        console.error('FBQ event track issue:', err);
      }
    }

    // Google gtag analytics mapping
    if (typeof window !== 'undefined' && (window as any).gtag) {
      try {
        (window as any).gtag('event', eventType, details);
      } catch (err) {
        console.error('GA event track issue:', err);
      }
    }
  };

  // Dynamic integration of official Google & Facebook tracking pixels
  useEffect(() => {
    // 1. Google Analytics/Tag Integration
    if (pixelSettings.googleTagId) {
      const gTagId = pixelSettings.googleTagId.trim();
      if (gTagId) {
        // Prevent duplicate scripts
        const existingScript = document.getElementById('google-tag-manager-script');
        if (!existingScript) {
          const script = document.createElement('script');
          script.id = 'google-tag-manager-script';
          script.async = true;
          script.src = `https://www.googletagmanager.com/gtag/js?id=${gTagId}`;
          document.head.appendChild(script);

          // Configure gtag
          const inlineScript = document.createElement('script');
          inlineScript.id = 'google-tag-inline';
          inlineScript.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gTagId}');
          `;
          document.head.appendChild(inlineScript);
          console.log(`[SEO/Compliance] Google Analytics (${gTagId}) successfully initialized.`);
        }
      }
    }

    // 2. Facebook Pixel Integration
    if (pixelSettings.facebookPixelId) {
      const fbId = pixelSettings.facebookPixelId.trim();
      if (fbId) {
        const existingScript = document.getElementById('facebook-pixel-script');
        if (!existingScript) {
          const inlineScript = document.createElement('script');
          inlineScript.id = 'facebook-pixel-script';
          inlineScript.innerHTML = `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${fbId}');
            fbq('track', 'PageView');
          `;
          document.head.appendChild(inlineScript);
          console.log(`[SEO/Compliance] Facebook Pixel (${fbId}) successfully initialized.`);
        }
      }
    }
  }, [pixelSettings]);

  // Track initial page load pageview
  useEffect(() => {
    trackEvent('page_view', { path: window.location.hash || '/' });
  }, [window.location.hash]);

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      t,
      user,
      setUser,
      logout,
      products,
      categories,
      navigation,
      coupons,
      orders,
      contactInfo,
      setContactInfo,
      pagesContent,
      setPagesContent,
      pixelSettings,
      setPixelSettings,
      refreshState,
      trackEvent,
      loading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
