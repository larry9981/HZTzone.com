import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, Menu, User, X, Globe, LogIn, Lock, Settings } from 'lucide-react';
import { useApp } from './AppContext';
import { Language } from '../translations';

interface NavbarProps {
  onCartClick: () => void;
  cartCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onCartClick, cartCount }) => {
  const { t, language, setLanguage, user, navigation } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const location = useLocation();

  const handleLangChange = (lang: Language) => {
    setLanguage(lang);
    setIsLangDropdownOpen(false);
  };

  const menuItems = languagesList();

  function languagesList(): Array<{ code: Language; name: string }> {
    return [
      { code: 'en', name: 'English' },
      { code: 'de', name: 'Deutsch' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'it', name: 'Italiano' }
    ];
  }

  const activeLangName = menuItems.find(m => m.code === language)?.name || 'English';

  const isActive = (path: string) => {
    // If route path ends in type women/men/mugs
    const normalizedPath = path.toLowerCase().trim();
    const currentPath = location.pathname.toLowerCase().trim();
    return currentPath === normalizedPath ? "text-brand-600 font-bold" : "text-neutral-600 hover:text-brand-600";
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-neutral-500 hover:text-neutral-900 p-2">
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Elegant HZTzone Logo */}
          <div className="flex-shrink-0 flex items-center justify-center flex-1 md:flex-none md:justify-start">
            <Link to="/" className="text-2xl font-serif font-black tracking-tight text-neutral-900 flex items-center gap-1">
              HZTzone <span className="h-2 w-2 rounded-full bg-brand-600 block"></span>
            </Link>
          </div>

          {/* Dynamic Navigation menus (editable by merchant backend!) */}
          <div className="hidden md:flex space-x-8 text-sm font-semibold tracking-wide">
            {navigation.map((nav, index) => (
              <Link key={index} to={nav.path} className={isActive(nav.path)}>
                {t(nav.title.toLowerCase()) !== nav.title.toLowerCase() ? t(nav.title.toLowerCase()) : nav.title}
              </Link>
            ))}
          </div>

          {/* Headers icons panel */}
          <div className="flex items-center space-x-2.5 sm:space-x-4">
            
            {/* Multi Language selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 font-bold py-1 px-2.5 rounded-lg hover:bg-neutral-50 border border-neutral-150 transition-colors"
              >
                <Globe size={14} className="text-neutral-400" />
                <span className="hidden sm:inline">{activeLangName}</span>
                <span className="sm:hidden uppercase">{language}</span>
              </button>
              
              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white border border-neutral-200 rounded-xl shadow-xl py-1 z-55">
                  {menuItems.map((item) => (
                    <button
                      key={item.code}
                      onClick={() => handleLangChange(item.code)}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 flex items-center justify-between"
                    >
                      {item.name}
                      {language === item.code && <span className="h-1.5 w-1.5 rounded-full bg-brand-600 inline-block"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Account jump routing tab */}
            <Link to="/account" className="text-neutral-500 hover:text-brand-600 p-1.5 rounded-lg hover:bg-neutral-50 transition-all" title={t('myAccount')}>
              <User size={19} className={location.pathname === '/account' ? 'text-brand-600' : ''} />
            </Link>

            {/* Shopping Cart Trigger */}
            <button onClick={onCartClick} className="relative text-neutral-500 hover:text-brand-600 p-1.5 rounded-lg hover:bg-neutral-50 transition-all">
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 min-w-4 px-1 text-[9px] font-bold leading-none text-white transform translate-x-1/10 -translate-y-1/10 bg-brand-600 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-neutral-100 absolute w-full left-0 z-50">
          <div className="px-3 pt-2 pb-4 space-y-1 sm:px-4 shadow-lg">
            {navigation.map((nav, index) => (
              <Link 
                key={index}
                to={nav.path} 
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-bold text-neutral-700 hover:text-brand-600 hover:bg-neutral-50"
              >
                {t(nav.title.toLowerCase()) !== nav.title.toLowerCase() ? t(nav.title.toLowerCase()) : nav.title}
              </Link>
            ))}
            <Link 
              to="/account" 
              onClick={() => setIsMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-bold text-neutral-700 hover:text-brand-600 hover:bg-neutral-50 border-t border-neutral-100"
            >
              {user ? user.email : t('login')}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
export default Navbar;
