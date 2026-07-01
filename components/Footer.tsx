import React from 'react';
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from './AppContext';

export const Footer: React.FC = () => {
  const { t, contactInfo } = useApp();

  return (
    <footer className="bg-neutral-900 border-t border-neutral-850 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <h3 className="text-2xl font-serif font-black tracking-tight">Grobrav</h3>
            <p className="text-neutral-400 text-xs leading-relaxed">
              {t('brand_desc')}
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="https://instagram.com/grobrav" target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white transition-colors">
                <Instagram size={18} />
              </a>
              <a href="https://facebook.com/grobrav" target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white transition-colors">
                <Facebook size={18} />
              </a>
              <a href="https://twitter.com/grobrav" target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white transition-colors">
                <Twitter size={18} />
              </a>
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-6">Explore Collections</h4>
            <ul className="space-y-3 text-xs text-neutral-300 font-semibold">
              <li><Link to="/category/women" className="hover:text-brand-400 transition-colors">{t('women')}</Link></li>
              <li><Link to="/category/men" className="hover:text-brand-400 transition-colors">{t('men')}</Link></li>
              <li><Link to="/category/mugs" className="hover:text-brand-400 transition-colors">{t('gifts')}</Link></li>
              <li><Link to="/admin" className="hover:text-brand-400 transition-colors text-brand-400 font-bold">{t('admin')} 🔒</Link></li>
            </ul>
          </div>

          {/* Support Column - PLUGGED WITH RELEVANT ROUTING CODES */}
          <div>
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-6">Assistance Desk</h4>
            <ul className="space-y-3 text-xs text-neutral-300 font-semibold">
              <li><Link to="/track-order" className="hover:text-white transition-colors">{t('track_order')}</Link></li>
              <li><Link to="/shipping-info" className="hover:text-white transition-colors">{t('shipping_info')}</Link></li>
              <li><Link to="/returns-exchanges" className="hover:text-white transition-colors">{t('returns_exchanges')}</Link></li>
              <li><Link to="/size-guide" className="hover:text-white transition-colors">{t('size_guide')}</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">{t('contactUs')}</Link></li>
            </ul>
          </div>

          {/* Legal & Contact Column */}
          <div>
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-6">Touch & Regulations</h4>
            <ul className="space-y-3 text-xs text-neutral-300 font-semibold">
              <li className="flex items-center gap-2 text-[11px]"><Mail size={14} className="text-neutral-400" /> {contactInfo.email}</li>
              <li className="flex items-center gap-2 text-[11px]"><Phone size={14} className="text-neutral-400" /> {contactInfo.phone}</li>
              <li className="flex items-center gap-2 text-[11px]"><MapPin size={14} className="text-neutral-400" /> {contactInfo.address}</li>
              <li className="pt-4"><Link to="/privacy-policy" className="hover:text-white transition-colors">{t('privacy_policy')}</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-white transition-colors">{t('terms_of_service')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-500 font-medium">
          <p>&copy; {new Date().getFullYear()} Grobrav POD Studio. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0 font-bold tracking-wider text-[10px] uppercase text-neutral-400">
             <span>VISA</span>
             <span>MASTERCARD</span>
             <span>AMERICAN EXPRESS</span>
             <span>PAYPAL SECURED</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
