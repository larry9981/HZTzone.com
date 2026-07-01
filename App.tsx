import React, { useState, createContext, useContext, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Category } from './pages/Category';
import { ProductDetail } from './pages/ProductDetail';
import { CartSidebar } from './components/CartSidebar';
import { Contact } from './pages/Contact';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { Checkout } from './pages/Checkout';
import { Admin } from './pages/Admin';

// New Pages imported!
import { TrackOrder } from './pages/TrackOrder';
import { ShippingInfo } from './pages/ShippingInfo';
import { ReturnsExchanges } from './pages/ReturnsExchanges';
import { SizeGuide } from './pages/SizeGuide';
import { Account } from './pages/Account';
import { Warranty } from './pages/Warranty';

// Global Contexts imported!
import { AppProvider, useApp } from './components/AppContext';
import { CartContextType, CartItem, Product } from './types';
import { AIChatBot } from './components/AIChatBot';
import { api } from './services/api';

// Cart Context Implementation
const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

// Scroll to top component
const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const CartAwareApp: React.FC = () => {
  const { products, refreshState, user, logout } = useApp();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync with localStorage so cart persists
  useEffect(() => {
    const stored = localStorage.getItem('grobrav_cart');
    if (stored) {
      try {
        setCartItems(JSON.parse(stored));
      } catch (err) {
        localStorage.removeItem('grobrav_cart');
      }
    }
  }, []);

  // Sync cart with database when user logs in or out
  useEffect(() => {
    if (user) {
      api.getCart(user.id)
        .then((res) => {
          if (res.cartItems && res.cartItems.length > 0) {
            setCartItems(res.cartItems);
            localStorage.setItem('grobrav_cart', JSON.stringify(res.cartItems));
          } else {
            // Server cart is empty, sync local client cart to server
            if (cartItems.length > 0) {
              api.syncCart(user.id, cartItems).catch((err) => {
                if (err.message && (err.message.toLowerCase().includes('user not found') || err.message.toLowerCase().includes('not found'))) {
                  logout();
                } else {
                  console.error(err);
                }
              });
            }
          }
        })
        .catch((err) => {
          if (err.message && (err.message.toLowerCase().includes('user not found') || err.message.toLowerCase().includes('not found'))) {
            logout();
          } else {
            console.error(err);
          }
        });
    } else {
      // If user logs out, don't clear the cart but clear stored user state
    }
  }, [user]);

  const saveCart = (nextItems: CartItem[]) => {
    setCartItems(nextItems);
    localStorage.setItem('grobrav_cart', JSON.stringify(nextItems));
    if (user) {
      api.syncCart(user.id, nextItems).catch((err) => {
        if (err.message && (err.message.toLowerCase().includes('user not found') || err.message.toLowerCase().includes('not found'))) {
          logout();
        } else {
          console.error(err);
        }
      });
    }
  };

  const addToCart = (product: Product, options: { size?: string; color?: string; customText?: string; customImage?: string }) => {
    const newItem: CartItem = {
      ...product,
      cartId: `${product.id}-${Date.now()}`,
      selectedSize: options.size,
      selectedColor: options.color,
      customText: options.customText,
      customImage: options.customImage,
      quantity: 1
    };
    const nextList = [...cartItems, newItem];
    saveCart(nextList);
    setIsCartOpen(true);
    
    // Simulate GA AddToCart
    api.trackGAEvent('add_to_cart', { productId: product.id, name: product.name, price: product.price });
  };

  const removeFromCart = (cartId: string) => {
    const nextList = cartItems.filter(item => item.cartId !== cartId);
    saveCart(nextList);
    
    // Simulate GA Remove
    api.trackGAEvent('remove_from_cart', { cartId });
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items: cartItems,
      addToCart,
      removeFromCart,
      clearCart,
      toggleCart: () => setIsCartOpen(!isCartOpen),
      isCartOpen,
      cartTotal
    }}>
      <Router>
        <ScrollToTop />
        <div id="grobrav-app-root" className="flex flex-col min-h-screen bg-white font-sans antialiased text-neutral-900 selection:bg-brand-100 selection:text-brand-900">
          <Navbar onCartClick={() => setIsCartOpen(true)} cartCount={cartItems.length} />
          
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/category/:type" element={<Category />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              
              {/* New Pages routed! */}
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/shipping-info" element={<ShippingInfo />} />
              <Route path="/returns-exchanges" element={<ReturnsExchanges />} />
              <Route path="/size-guide" element={<SizeGuide />} />
              <Route path="/account" element={<Account />} />
              <Route path="/warranty" element={<Warranty />} />
              
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>

          <Footer />
          
          <CartSidebar 
            isOpen={isCartOpen} 
            onClose={() => setIsCartOpen(false)} 
            items={cartItems} 
            onRemove={removeFromCart}
            total={cartTotal}
          />

          {/* Persistent AI Customer Care Support Bot! */}
          <AIChatBot />
        </div>
      </Router>
    </CartContext.Provider>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <CartAwareApp />
    </AppProvider>
  );
};

export default App;
