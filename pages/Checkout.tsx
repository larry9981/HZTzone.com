import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../App';
import { useApp } from '../components/AppContext';
import { api } from '../services/api';
import { 
  ArrowLeft, CreditCard, Lock, Shield, Check, 
  ChevronRight, AlertCircle, ShoppingBag, Truck, 
  Percent, FileText, Info, AlertTriangle, Sparkles, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items: cartItems, cartTotal, clearCart } = useCart();
  const { t, refreshState, trackEvent, user, setUser, logout } = useApp();

  // Trigger Initiate Checkout Standard Event
  useEffect(() => {
    trackEvent('checkout_initiate', { value: cartTotal });
  }, []);

  // Steps: 'information' -> 'payment' -> 'processing' -> 'success'
  const [step, setStep] = useState<'information' | 'payment' | 'processing' | 'success'>('information');

  // Contact & Shipping states
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('United States');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'free' | 'standard' | 'express'>('express');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [shippingConfig, setShippingConfig] = useState<{
    freeShippingThreshold: number;
    standardShippingFee: number;
    standardDeliveryTime: string;
    expressShippingFee: number;
    expressDeliveryTime: string;
  }>({
    freeShippingThreshold: 75.00,
    standardShippingFee: 5.99,
    standardDeliveryTime: "5-7 business days",
    expressShippingFee: 9.99,
    expressDeliveryTime: "2-3 business days"
  });

  useEffect(() => {
    api.getShippingConfig().then(data => {
      if (data) setShippingConfig(data);
    }).catch(err => {
      console.error('Failed to load shipping config on checkout:', err);
    });
  }, []);

  // Saved shipping address option state: 'saved' or 'manual'
  const [addressSource, setAddressSource] = useState<'saved' | 'manual'>('manual');

  const parseSavedAddress = (addressStr: string) => {
    try {
      const parsed = JSON.parse(addressStr);
      if (parsed && typeof parsed === 'object') {
        return {
          country: parsed.country || 'United States',
          city: parsed.city || '',
          state: parsed.state || '',
          zipCode: parsed.zipCode || '',
          streetAddress: parsed.streetAddress || '',
          buildingName: parsed.buildingName || '',
          roomNumber: parsed.roomNumber || '',
          isJson: true
        };
      }
    } catch (e) {}
    
    return {
      country: 'United States',
      city: '',
      state: '',
      zipCode: '',
      streetAddress: addressStr || '',
      buildingName: '',
      roomNumber: '',
      isJson: false
    };
  };

  // Initialize address source
  useEffect(() => {
    if (user && user.address) {
      setAddressSource('saved');
    } else {
      setAddressSource('manual');
    }
  }, [user]);

  // Auto-populate logged-in user profile address when source or user changes
  useEffect(() => {
    if (user) {
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);

      if (addressSource === 'saved' && user.address) {
        const parsed = parseSavedAddress(user.address);
        if (parsed.isJson) {
          setAddress(parsed.streetAddress);
          const aptParts = [parsed.roomNumber, parsed.buildingName].filter(Boolean).join(', ');
          setApartment(aptParts);
          setCity(parsed.city);
          setState(parsed.state);
          setZipCode(parsed.zipCode);
          setCountry(parsed.country || 'United States');
        } else {
          const parts = user.address.split(',').map((p: string) => p.trim());
          if (parts.length >= 4) {
            if (parts.length === 4) {
              setAddress(parts[0]);
              setCity(parts[1]);
              const stateZip = parts[2].split(' ');
              if (stateZip.length >= 2) {
                setState(stateZip[0]);
                setZipCode(stateZip.slice(1).join(' '));
              } else {
                setState(parts[2]);
              }
              setCountry(parts[3]);
            } else if (parts.length >= 5) {
              setAddress(parts[0]);
              setApartment(parts[1]);
              setCity(parts[2]);
              const stateZip = parts[3].split(' ');
              if (stateZip.length >= 2) {
                setState(stateZip[0]);
                setZipCode(stateZip.slice(1).join(' '));
              } else {
                setState(parts[3]);
              }
              setCountry(parts[4]);
            }
          } else {
            setAddress(user.address);
          }
        }
      }
    }
  }, [user, addressSource]);

  const handleAddressSourceChange = (source: 'saved' | 'manual') => {
    setAddressSource(source);
    if (source === 'manual') {
      setAddress('');
      setApartment('');
      setCity('');
      setState('');
      setZipCode('');
      setCountry('United States');
    }
  };

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('paypal');
  const [billingSame, setBillingSame] = useState(true);

  // Merchant configurations saved in settings
  const [paypalEnabled, setPaypalEnabled] = useState(true);
  const [cardEnabled, setCardEnabled] = useState(true);
  const [paypalMode, setPaypalMode] = useState<'sandbox' | 'live'>('sandbox');
  const [paypalClientId, setPaypalClientId] = useState('');
  const [cardMode, setCardMode] = useState<'sandbox' | 'live'>('sandbox');

  // Load gateway properties
  useEffect(() => {
    const stored = localStorage.getItem('grobrav_admin_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.paypalEnabled !== undefined) setPaypalEnabled(parsed.paypalEnabled);
        if (parsed.cardEnabled !== undefined) setCardEnabled(parsed.cardEnabled);
        if (parsed.paypalMode !== undefined) setPaypalMode(parsed.paypalMode);
        if (parsed.paypalClientId !== undefined) setPaypalClientId(parsed.paypalClientId);
        if (parsed.cardMode !== undefined) setCardMode(parsed.cardMode);

        if (parsed.paypalEnabled !== false) {
          setPaymentMethod('paypal');
        } else {
          setPaymentMethod('card');
        }
      } catch (err) {
        console.error("Failed to load gateway settings", err);
      }
    }
  }, []);

  // Redirect to home if cart is empty and we are not in success step
  useEffect(() => {
    if (cartItems.length === 0 && step !== 'success' && step !== 'processing') {
      navigate('/');
    }
  }, [cartItems, navigate, step]);

  // Credit Card Form States
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardErrors, setCardErrors] = useState<{ [key: string]: string }>({});

  // PayPal States
  const [isPayPalModalOpen, setIsPayPalModalOpen] = useState(false);
  const [payPalEmail, setPayPalEmail] = useState('');
  const [payPalPassword, setPayPalPassword] = useState('');
  const [payPalLoader, setPayPalLoader] = useState(false);
  const [payPalState, setPayPalState] = useState<'login' | 'review' | 'completed'>('login');
  const [payPalError, setPayPalError] = useState('');

  // Coupon Discount state - DYNAMIC VALIDATION FROM EXPRESS DB!
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ 
    code: string; 
    percent: number; 
    scope?: string; 
    applicableProductIds?: string[];
  } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Processing Animation state
  const [processingState, setProcessingState] = useState(0);
  const processingMessages = [
    "Establishing secure payment tunnel with high-grade HTTPS SSL encryption...",
    "Transmitting payment payload token to gateway...",
    "Verifying card security and bank authorization criteria...",
    "Synchronizing customized Print-on-Demand order parameters in backend database...",
    "Order verified. Finalizing receipt and shipment timeline..."
  ];

  // Completed transaction details
  const [receiptDetails, setReceiptDetails] = useState<any | null>(null);

  // Auto detect Card Brand
  const getCardType = (num: string) => {
    const cleanNum = num.replace(/\s+/g, '');
    if (cleanNum.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(cleanNum)) return 'MasterCard';
    if (/^3[47]/.test(cleanNum)) return 'American Express';
    return 'Generic';
  };

  // Card text formatting handlers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < value.length && i < 16; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += value[i];
    }
    setCardNumber(formatted);
    if (cardErrors.cardNumber) {
      setCardErrors(prev => ({ ...prev, cardNumber: '' }));
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    let formatted = '';
    if (value.length > 0) {
      formatted += value.slice(0, 2);
      if (value.length > 2) formatted += '/' + value.slice(2, 4);
    }
    setCardExpiry(formatted);
    if (cardErrors.cardExpiry) {
      setCardErrors(prev => ({ ...prev, cardExpiry: '' }));
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvv(value);
    if (cardErrors.cardCvv) {
      setCardErrors(prev => ({ ...prev, cardCvv: '' }));
    }
  };

  // Coupon applying dynamic validation from server database API!
  const handleApplyCoupon = async () => {
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setValidatingCoupon(true);
    try {
      const data = await api.validateCoupon(code);
      setAppliedCoupon({ 
        code: data.code, 
        percent: data.discount,
        scope: data.scope,
        applicableProductIds: data.applicableProductIds
      });
      alert(`Voucher approved! ${data.discount}% discount applied to your checkout cart.`);
      trackEvent('apply_coupon_success', { code, percent: data.discount });
    } catch (err: any) {
      setCouponError(err.message || 'Invalid promotion code.');
      trackEvent('apply_coupon_failure', { code, error: err.message });
    } finally {
      setValidatingCoupon(false);
      setCouponCode('');
    }
  };

  // Shipping calculations
  const subtotal = cartTotal;
  let discountAmount = 0;
  if (appliedCoupon) {
    const percent = appliedCoupon.percent;
    const scope = appliedCoupon.scope || 'all';
    const applicableProductIds = appliedCoupon.applicableProductIds || [];

    if (scope === 'specific' && applicableProductIds.length > 0) {
      cartItems.forEach((item: any) => {
        const isApplicable = applicableProductIds.includes(String(item.id));
        if (isApplicable) {
          discountAmount += (item.price * item.quantity) * (percent / 100);
        }
      });
    } else {
      discountAmount = subtotal * (percent / 100);
    }
  }
  const totalQuantity = cartItems.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
  const baseShippingCost = shippingMethod === 'free'
    ? 0.00
    : shippingMethod === 'standard'
      ? (shippingConfig.standardShippingFee || 5.99)
      : (shippingConfig.expressShippingFee || 9.99);
  const shippingCost = baseShippingCost * totalQuantity;
  const taxes = (subtotal - discountAmount) * 0.08; 
  const grandTotal = subtotal - discountAmount + shippingCost + taxes;

  // Shipping details form validator
  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!email || !/\S+@\S+\.\S+/.test(email)) errors.email = 'Valid email address is required.';
    if (!firstName) errors.firstName = 'First name is required.';
    if (!lastName) errors.lastName = 'Last name is required.';
    if (!address) errors.address = 'Street address is required.';
    if (!city) errors.city = 'City is required.';
    if (!state) errors.state = 'State or Province is required.';
    if (!zipCode) errors.zipCode = 'ZIP or Postal code is required.';
    if (!phone) errors.phone = 'Contact phone number is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setFormErrors({});
      setStep('payment');
    }
  };

  // Secure checkout processor logic submitting to database
  const runPaymentProcessing = async (payMethodName: string) => {
    setStep('processing');
    setProcessingState(0);
    
    // Simulate pipeline visually
    const timer = setInterval(() => {
      setProcessingState(prev => {
        if (prev >= processingMessages.length - 1) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    const orderPayload = {
      customerName: `${firstName} ${lastName}`,
      email: email,
      address: `${address}${apartment ? ', ' : ''}${apartment}, ${city}, ${state} ${zipCode}, ${country}`,
      paymentMethod: payMethodName,
      items: cartItems.map(it => ({
        name: it.name,
        quantity: it.quantity,
        price: it.price,
        color: it.selectedColor,
        size: it.selectedSize
      })),
      customText: cartItems.find(it => it.customText)?.customText || undefined,
      total: grandTotal,
      phone: phone,
      city: city,
      state: state,
      zipCode: zipCode,
      country: country,
      streetAddress: address,
      apartment: apartment
    };

    try {
      // Create real order state inside backend!
      const data = await api.submitOrder(orderPayload);
      
      // If user is logged in, synchronize their shipping address in their user profile schema
      if (user && user.id) {
        try {
          const updateRes = await api.updateProfile({
            userId: user.id,
            address: orderPayload.address
          });
          if (updateRes.user) {
            setUser(updateRes.user);
            localStorage.setItem('grobrav_user_session', JSON.stringify(updateRes.user));
          }
        } catch (profileErr: any) {
          console.error("Auto-sync profile address failed", profileErr);
          if (profileErr.message && (profileErr.message.toLowerCase().includes('user not found') || profileErr.message.toLowerCase().includes('not found'))) {
            logout();
          }
        }
      }

      setReceiptDetails({
        orderId: data.orderId,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
        shippingName: `${firstName} ${lastName}`,
        shippingAddress: `${address}${apartment ? ', ' : ''}${apartment}, ${city}, ${state} ${zipCode}, ${country}`,
        paymentSummary: payMethodName,
        subtotal,
        discountValue: discountAmount,
        shippingValue: shippingCost,
        taxesValue: taxes,
        totalValue: grandTotal,
        itemsSnap: [...cartItems]
      });

      trackEvent('purchase_success', { orderId: data.orderId, value: grandTotal });
      
      setTimeout(() => {
        setStep('success');
        clearCart();
        refreshState(); // Refresh states across workspace
      }, 1500);

    } catch (err: any) {
      alert("Encryption pipeline completed but data validation failed: " + err.message);
      setStep('payment');
    }
  };

  // Credit Card submit handler
  const handleCardPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    const cleanNum = cardNumber.replace(/\s+/g, '');

    if (cleanNum.length < 15) errors.cardNumber = 'Please enter a valid card number.';
    if (!cardName) errors.cardName = 'Cardholder name is required.';
    if (cardExpiry.length < 5) errors.cardExpiry = 'Format MM/YY is required.';
    if (cardCvv.length < 3) errors.cardCvv = 'CVV code is required.';

    if (Object.keys(errors).length > 0) {
      setCardErrors(errors);
    } else {
      setCardErrors({});
      const cardBrand = getCardType(cardNumber);
      runPaymentProcessing(`${cardBrand} ending in •• ${cleanNum.slice(-4)} (${cardMode.toUpperCase()})`);
    }
  };

  // PayPal Simulator opening
  const handleOpenPayPal = () => {
    setPayPalError('');
    setPayPalEmail(email || '');
    setPayPalPassword('');
    setPayPalState('login');
    setIsPayPalModalOpen(true);
  };

  const handlePayPalLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payPalEmail || !payPalEmail.includes('@')) {
      setPayPalError('Please enter a valid PayPal account email address.');
      return;
    }
    if (payPalPassword.length < 5) {
      setPayPalError('Password must be at least 5 characters.');
      return;
    }

    setPayPalLoader(true);
    setPayPalError('');
    setTimeout(() => {
      setPayPalLoader(false);
      setPayPalState('review');
    }, 1205);
  };

  const handlePayPalPaymentAuthorize = () => {
    setPayPalLoader(true);
    setTimeout(() => {
      setPayPalLoader(false);
      setIsPayPalModalOpen(false);
      runPaymentProcessing(`PayPal (${payPalEmail}) (${paypalMode.toUpperCase()})`);
    }, 1000);
  };

  return (
    <div id="checkout-view-page" className="min-h-screen bg-neutral-50/50 py-12 px-4 sm:px-6 lg:px-8">
      
      {/* PayPal Simulator Popup Box */}
      {isPayPalModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-100 flex flex-col animate-fade-in-up">
            <div className="bg-[#003087] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-extrabold italic text-2xl tracking-tight">Pay<span className="text-[#0079C1]">Pal</span></span>
                <span className="text-[10px] text-white font-bold bg-[#0079C1] px-1.5 py-0.5 rounded font-mono uppercase tracking-widest">
                  Developer Sandbox Mode
                </span>
              </div>
              <button onClick={() => setIsPayPalModalOpen(false)} className="text-white hover:text-white/80 text-xs font-bold cursor-pointer">
                Cancel
              </button>
            </div>

            <div className="p-6 flex-1 min-h-[300px] flex flex-col justify-between">
              {payPalState === 'login' ? (
                <form onSubmit={handlePayPalLoginSubmit} className="space-y-4">
                  <div className="text-center pb-2 border-b border-neutral-100">
                    <h3 className="text-base font-bold text-neutral-800">Secure Developer Sandbox Login</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">Mock payment credentials to test merchant collection processes.</p>
                  </div>

                  {payPalError && (
                    <div className="flex items-start gap-2 bg-red-50 text-red-650 p-3 rounded-xl text-xs font-medium border border-red-100">
                      <AlertCircle size={15} />
                      <span>{payPalError}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Sandbox Business Email</label>
                      <input 
                        type="email" 
                        value={payPalEmail}
                        onChange={(e) => setPayPalEmail(e.target.value)}
                        placeholder="buyer-paypal-account@example.com"
                        className="w-full h-11 border border-neutral-200 rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-[#0079C1] text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 font-mono">Mock Security Code</label>
                      <input 
                        type="password" 
                        value={payPalPassword}
                        onChange={(e) => setPayPalPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 border border-neutral-200 rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-[#0079C1] text-sm"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" fullWidth className="bg-[#0079C1] hover:bg-[#003087] text-white font-bold h-11" disabled={payPalLoader}>
                    {payPalLoader ? <Loader2 className="animate-spin text-white" size={18} /> : "Log In & Continue"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="pb-3 border-b border-neutral-100 flex justify-between items-center text-xs">
                    <div>
                      <h3 className="font-bold text-neutral-800">Review Sandbox Order</h3>
                      <p className="text-neutral-400 mt-0.5">{payPalEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-neutral-800 uppercase text-[10px]">Merchant Workspace</p>
                      <p className="font-bold text-brand-700">Grobrav POS</p>
                    </div>
                  </div>

                  <div className="bg-neutral-50 rounded-xl p-4 space-y-2 border border-neutral-150 text-xs">
                    <div className="flex justify-between text-neutral-600">
                      <span>Fund Source</span>
                      <strong className="text-neutral-900">PayPal Simulated Sandbox Balance</strong>
                    </div>
                    <div className="flex justify-between border-t border-neutral-200 pt-2 text-sm text-neutral-900 font-bold">
                      <span>Grand Total Summary</span>
                      <span className="text-[#003087] font-mono">${grandTotal.toFixed(2)} USD</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-neutral-400">Sandbox simulation verifies payment pipelines live without actual bank charges. Real API credentials hook up instantly inside merchant workspace panel configs.</p>

                  <Button type="button" fullWidth className="bg-[#FFC439] hover:bg-[#F2BA36] text-neutral-950 font-bold h-11 border-none" onClick={handlePayPalPaymentAuthorize} disabled={payPalLoader}>
                    {payPalLoader ? <Loader2 size={18} className="animate-spin text-neutral-950" /> : "Authorize Sandbox Settlement"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Wrapper */}
      <div className="max-w-7xl mx-auto">
        
        {/* Simple checkout header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-neutral-200">
          <div className="flex items-center gap-1.5">
            <Link to="/" className="text-2xl font-serif font-black tracking-tight text-neutral-900">Grobrav</Link>
            <span className="text-[10px] font-mono font-bold bg-neutral-200 text-neutral-700 px-1.5 py-0.2 rounded-md">SECURITY VAULT</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            <span className={step === 'information' ? 'text-brand-600 font-black' : 'text-neutral-400'}>Fulfillment</span>
            <ChevronRight size={10} />
            <span className={step === 'payment' ? 'text-brand-600 font-black' : 'text-neutral-400'}>Settlement</span>
            <ChevronRight size={10} />
            <span className={step === 'success' ? 'text-brand-600 font-black' : 'text-neutral-400'}>Receipt</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            <Shield size={14} />
            <span>256-Bit SSL Secured</span>
          </div>
        </div>

        {/* --- STEP 1: PROCESSING WINDOW --- */}
        {step === 'processing' && (
          <div className="max-w-2xl mx-auto bg-white border border-neutral-200 shadow-xl rounded-2xl p-8 sm:p-12 text-center my-12 animate-fade-in-up">
            <div className="flex justify-center mb-6">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin"></div>
                <Lock size={22} className="absolute text-brand-600 animate-pulse" />
              </div>
            </div>

            <h2 className="text-2xl font-serif font-bold text-neutral-900 mb-2">Processing Secure Settlement</h2>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-8">
              Verifying financial parameters. High-fidelity vectorized mock data records are uploading to the Express JSON central file database.
            </p>

            <div className="max-w-lg mx-auto bg-neutral-50 rounded-xl p-5 border border-neutral-200 text-left font-mono text-[10px] text-neutral-600 space-y-2.5">
              <div className="flex items-center gap-2 text-brand-700 font-bold">
                <Check size={12} />
                <span>[SSL Secure Vault Handshake Established]</span>
              </div>
              
              {processingMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-2 transition-opacity duration-300 ${
                    processingState >= idx ? 'opacity-100 text-neutral-800' : 'opacity-30 text-neutral-400'
                  }`}
                >
                  {processingState > idx ? (
                    <span className="text-emerald-600 font-bold">✔</span>
                  ) : processingState === idx ? (
                    <span className="inline-block w-2 h-2 rounded-full border-2 border-brand-500 border-t-transparent animate-spin flex-shrink-0 mt-0.5"></span>
                  ) : (
                    <span className="text-neutral-300">•</span>
                  )}
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- STEP 2: SUCCESS RECEIPT --- */}
        {step === 'success' && receiptDetails && (
          <div className="max-w-3xl mx-auto bg-white border border-neutral-200 shadow-xl rounded-2xl overflow-hidden my-12 animate-fade-in-up">
            <div className="bg-brand-900 text-white p-8 sm:p-10 text-center relative overflow-hidden border-b border-brand-800">
              <div className="relative flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-brand-800 border border-brand-700 flex items-center justify-center text-white shadow-inner">
                  <Check size={28} />
                </div>
              </div>
              <h2 className="text-3xl font-serif font-black tracking-tight mb-2">Order Structured & Placed!</h2>
              <p className="text-brand-200 text-xs max-w-md mx-auto">
                Thank you for choosing Grobrav POD Studio! Your simulated checkout transaction completed successfully, saving information directly to the server.
              </p>
            </div>

            <div className="p-6 sm:p-10 space-y-8">
              
              {/* Order Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-neutral-100 pb-6 text-xs">
                <div>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Order Reference</p>
                  <p className="font-mono font-bold text-neutral-900 text-base mt-1">{receiptDetails.orderId}</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Fulfillment Date</p>
                  <p className="font-semibold text-neutral-700 mt-1">{receiptDetails.date}</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Gateway Channel</p>
                  <p className="text-teal-700 font-semibold bg-teal-50 border border-teal-105 px-2 py-0.5 rounded inline-block mt-0.5 font-mono text-[10px]">
                    {receiptDetails.paymentSummary}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Production Line</p>
                  <p className="text-brand-800 font-semibold bg-brand-50 border border-brand-100 px-2 py-0.5 rounded inline-block mt-0.5 font-mono text-[10px]">
                    In Sublimation Queue
                  </p>
                </div>
              </div>

              {/* Delivery info & shipping */}
              <div className="grid md:grid-cols-2 gap-8 border-b border-neutral-100 pb-8 text-xs">
                <div className="space-y-2">
                  <h4 className="font-bold text-neutral-900 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <Truck size={15} className="text-brand-600" /> shipping address
                  </h4>
                  <p className="font-bold text-neutral-800">{receiptDetails.shippingName}</p>
                  <p className="text-neutral-500 leading-relaxed">{receiptDetails.shippingAddress}</p>
                  <p className="text-[10px] text-neutral-400">
                    Method:{' '}
                    {shippingMethod === 'express' 
                      ? 'Fast Tracked Shipping (2-3 business days)' 
                      : shippingMethod === 'standard' 
                        ? 'Standard Tracked Shipping (5-7 business days)' 
                        : 'Free Tracked Shipping (10-15 business days)'}
                  </p>
                </div>
                
                <div className="bg-brand-50/30 border border-brand-100/50 rounded-2xl p-5 space-y-2 text-xs leading-relaxed text-brand-850">
                  <h4 className="font-bold text-brand-900 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles size={14} className="text-brand-600" /> Fine Sublimation Integrity
                  </h4>
                  <p>Our workshop team is formulating high-resolution vector matrices. Custom items undergo triple pixel-checks before transfer dispatch to guarantee exquisite memories styling.</p>
                </div>
              </div>

              {/* Products list detail */}
              <div>
                <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">ITEMIZED PURCHASE RECEIPT</h4>
                <ul className="divide-y divide-neutral-100 uppercase text-xs">
                  {receiptDetails.itemsSnap.map((item: any) => (
                    <li key={item.cartId} className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded border border-neutral-150 overflow-hidden relative flex-shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          {item.customImage && <img src={item.customImage} className="absolute bottom-0 right-0 w-5 h-5 border bg-white p-0.5 object-contain" alt="" />}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900">{item.name}</p>
                          <p className="text-[10px] text-neutral-500 font-mono capitalize">selected: {item.selectedColor} — {item.selectedSize} / qty {item.quantity}</p>
                          {item.customText && (
                            <p className="text-[10px] text-brand-700 font-mono mt-0.5">embossed: "{item.customText}"</p>
                          )}
                        </div>
                      </div>
                      <span className="font-mono font-semibold text-neutral-900">${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Financial Calculations Summary */}
              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-150 max-w-sm ml-auto space-y-3 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Cart Subtotal</span>
                  <span className="font-mono font-bold text-neutral-800">${receiptDetails.subtotal.toFixed(2)}</span>
                </div>
                {receiptDetails.discountValue > 0 && (
                  <div className="flex justify-between text-emerald-650 font-bold">
                    <span className="flex items-center gap-1">
                      <Percent size={13} /> Active Discount Promo
                    </span>
                    <span className="font-mono">- ${receiptDetails.discountValue.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-600">
                  <span>Fulfillment Logistics</span>
                  <span className="font-mono font-bold text-neutral-800">
                    {receiptDetails.shippingValue === 0 ? "FREE Standard Cargo" : `$${receiptDetails.shippingValue.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Estimated State Taxes (8%)</span>
                  <span className="font-mono font-bold text-neutral-800">${receiptDetails.taxesValue.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between border-t border-neutral-200 pt-3 text-sm text-neutral-950">
                  <span className="font-bold">Total Settled</span>
                  <span className="font-mono font-extrabold text-teal-800 bg-teal-50 border border-teal-150 px-2.5 py-0.5 rounded">
                    ${receiptDetails.totalValue.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Home redirect */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-neutral-150 text-xs">
                <span className="text-[10px] text-neutral-400 font-mono">Simulated tracking coordinate updates registered live on Grobrav Server.</span>
                <Button onClick={() => navigate('/')} className="px-8 font-bold text-center w-full sm:w-auto">
                  Continue Shopping
                </Button>
              </div>

            </div>
          </div>
        )}

        {/* --- DUAL CHANNELS: INFORMATION & PAYMENT PANELS --- */}
        {(step === 'information' || step === 'payment') && (
          <div className="grid lg:grid-cols-12 gap-8 items-start animate-fade-in">
            
            {/* Left Column: Form entry */}
            <div className="lg:col-span-7 bg-white border border-neutral-200 shadow-sm rounded-2xl p-6 sm:p-8">
              {step === 'information' ? (
                <form onSubmit={handleDetailsSubmit} className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-neutral-150">
                    <h3 className="text-lg font-serif font-bold text-neutral-900">Custom Cargo Logistics Details</h3>
                    <span className="text-[10px] bg-neutral-100 text-neutral-500 font-bold px-2.5 py-1 rounded">1 / 2</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Email updates destination</label>
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="customer@example.com"
                        className="w-full h-11 border border-neutral-200 rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                      />
                    </div>

                    {user && user.address && (
                      <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
                        <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                          Fulfillment Address Options
                        </span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => handleAddressSourceChange('saved')}
                            className={`flex flex-col items-start text-left p-3 rounded-xl border transition-all ${
                              addressSource === 'saved'
                                ? 'bg-brand-50/40 border-brand-500 ring-1 ring-brand-500 text-neutral-900'
                                : 'bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-500'
                            }`}
                          >
                            <span className="text-xs font-bold flex items-center gap-1.5">
                              <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${addressSource === 'saved' ? 'border-brand-600 bg-brand-600' : 'border-neutral-300'}`}>
                                {addressSource === 'saved' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                              </span>
                              Use Registered Address
                            </span>
                            <span className="text-[10px] text-neutral-400 mt-1 line-clamp-2">
                              {(() => {
                                const parsed = parseSavedAddress(user.address);
                                if (parsed.isJson) {
                                  return `${parsed.streetAddress}, ${parsed.city}, ${parsed.state} ${parsed.zipCode}`;
                                }
                                return user.address;
                              })()}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddressSourceChange('manual')}
                            className={`flex flex-col items-start text-left p-3 rounded-xl border transition-all ${
                              addressSource === 'manual'
                                ? 'bg-brand-50/40 border-brand-500 ring-1 ring-brand-500 text-neutral-900'
                                : 'bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-500'
                            }`}
                          >
                            <span className="text-xs font-bold flex items-center gap-1.5">
                              <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${addressSource === 'manual' ? 'border-brand-600 bg-brand-600' : 'border-neutral-300'}`}>
                                {addressSource === 'manual' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                              </span>
                              Enter Manually
                            </span>
                            <span className="text-[10px] text-neutral-400 mt-1">
                              Input new shipment destination parameters below
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">First Name</label>
                        <input 
                          type="text" 
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Jane"
                          className="w-full h-11 border border-neutral-200 rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Last Name</label>
                        <input 
                          type="text" 
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Doe"
                          className="w-full h-11 border border-neutral-200 rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Country or Territory</label>
                      <select 
                        value={country} 
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full h-11 border border-neutral-200 rounded-lg px-3 bg-white focus:outline-none text-sm"
                      >
                        <option value="United States">United States (Domestic)</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Germany">Germany</option>
                        <option value="Spain">Spain</option>
                        <option value="France">France</option>
                        <option value="Italy">Italy</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Logistics Address</label>
                      <input 
                        type="text" 
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street address of residence"
                        className="w-full h-11 border border-neutral-200 rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Apartment, unit, suite (optional)</label>
                      <input 
                        type="text" 
                        value={apartment}
                        onChange={(e) => setApartment(e.target.value)}
                        placeholder="Apt, Suite, Room"
                        className="w-full h-11 border border-neutral-200 rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">City</label>
                        <input 
                          type="text" 
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Munich / NY"
                          className="w-full h-11 border border-neutral-200 rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">State</label>
                        <input 
                          type="text" 
                          required
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="Bavaria / NY"
                          className="w-full h-11 border border-neutral-200 rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Postal/ZIP</label>
                        <input 
                          type="text" 
                          required
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          placeholder="ZIP code"
                          className="w-full h-11 border border-neutral-200 rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Active Contact Phone (Delivery carrier notifications)</label>
                      <input 
                        type="tel" 
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+49 (176) 283-9201"
                        className="w-full h-11 border border-neutral-200 rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Shipment selections */}
                  <div className="space-y-3 pt-4 border-t border-neutral-100">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Available logistics options</h4>
                    <label className={`flex justify-between items-center p-4 rounded-xl border cursor-pointer transition-all ${shippingMethod === 'free' ? 'bg-neutral-50 border-neutral-900 text-neutral-950 font-bold' : 'bg-white border-neutral-200 text-neutral-500'}`}>
                      <div className="flex flex-col text-left">
                        <span className="text-xs">Free Tracked Shipping (10-15 business days)</span>
                        {totalQuantity > 1 && (
                          <span className="text-[10px] text-neutral-400 font-normal mt-0.5">
                            Free for all {totalQuantity} items
                          </span>
                        )}
                      </div>
                      <strong className="text-xs font-mono text-emerald-600">FREE</strong>
                      <input type="radio" name="shipping" checked={shippingMethod === 'free'} onChange={() => setShippingMethod('free')} className="hidden" />
                    </label>
                    <label className={`flex justify-between items-center p-4 rounded-xl border cursor-pointer transition-all ${shippingMethod === 'standard' ? 'bg-neutral-50 border-neutral-900 text-neutral-950 font-bold' : 'bg-white border-neutral-200 text-neutral-500'}`}>
                      <div className="flex flex-col text-left">
                        <span className="text-xs">Standard Tracked Shipping (5-7 business days)</span>
                        {totalQuantity > 1 && (
                          <span className="text-[10px] text-neutral-400 font-normal mt-0.5">
                            ${(shippingConfig.standardShippingFee || 5.99).toFixed(2)} × {totalQuantity} items
                          </span>
                        )}
                      </div>
                      <strong className="text-xs font-mono">${((shippingConfig.standardShippingFee || 5.99) * totalQuantity).toFixed(2)}</strong>
                      <input type="radio" name="shipping" checked={shippingMethod === 'standard'} onChange={() => setShippingMethod('standard')} className="hidden" />
                    </label>
                    <label className={`flex justify-between items-center p-4 rounded-xl border cursor-pointer transition-all ${shippingMethod === 'express' ? 'bg-neutral-50 border-neutral-900 text-neutral-950 font-bold' : 'bg-white border-neutral-200 text-neutral-500'}`}>
                      <div className="flex flex-col text-left">
                        <span className="text-xs">Fast Tracked Shipping (2-3 business days)</span>
                        {totalQuantity > 1 && (
                          <span className="text-[10px] text-neutral-400 font-normal mt-0.5">
                            ${(shippingConfig.expressShippingFee || 9.99).toFixed(2)} × {totalQuantity} items
                          </span>
                        )}
                      </div>
                      <strong className="text-xs font-mono">${((shippingConfig.expressShippingFee || 9.99) * totalQuantity).toFixed(2)}</strong>
                      <input type="radio" name="shipping" checked={shippingMethod === 'express'} onChange={() => setShippingMethod('express')} className="hidden" />
                    </label>
                  </div>

                  <Button type="submit" fullWidth size="lg" className="font-bold uppercase tracking-wide">
                    Proceed to Settlement Selection
                  </Button>
                </form>
              ) : (
                /* STEP 2: PAYMENT METHOD PANEL Selection */
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-neutral-150">
                    <h3 className="text-base font-serif font-bold text-neutral-900">Secure Settlement Gateways</h3>
                    <button onClick={() => setStep('information')} className="text-xs text-neutral-400 hover:text-neutral-900 flex items-center gap-1">
                      <ArrowLeft size={12} /> edit cargo details
                    </button>
                  </div>

                  {/* Payment Methods toggle */}
                  <div className="space-y-3">
                    {cardEnabled && (
                      <label className={`flex justify-between items-center p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'card' ? 'bg-neutral-50 border-neutral-900 text-neutral-950 font-bold ring-1 ring-neutral-900' : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-350'}`}>
                        <span className="flex items-center gap-2.5 text-xs">
                          <CreditCard size={16} className={paymentMethod === 'card' ? 'text-neutral-950' : 'text-neutral-400'} /> Credit Card Online Processing ({cardMode.toUpperCase()})
                        </span>
                        <input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="hidden" />
                      </label>
                    )}

                    {paypalEnabled && (
                      <label className={`flex justify-between items-center p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'paypal' ? 'bg-blue-50/50 border-blue-600 text-blue-900 font-bold ring-1 ring-blue-600' : 'bg-white border-neutral-200 text-neutral-500 hover:border-blue-300'}`}>
                        <span className="flex items-center gap-2.5 text-xs">
                          <span className={`text-base ${paymentMethod === 'paypal' ? 'scale-110' : 'opacity-80'}`}>🏦</span> 
                          {paypalMode === 'live' ? 'PayPal Secure Payment (LIVE)' : `PayPal Sandbox Gateway (${paypalMode.toUpperCase()})`}
                        </span>
                        <input type="radio" checked={paymentMethod === 'paypal'} onChange={() => setPaymentMethod('paypal')} className="hidden" />
                      </label>
                    )}
                  </div>

                  {paymentMethod === 'card' ? (
                    <form onSubmit={handleCardPaymentSubmit} className="space-y-4 pt-4 border-t border-neutral-150">
                      <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Cardholder Name</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Jane Doe"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            className="w-full h-11 border border-neutral-250 bg-white rounded-lg px-3 focus:outline-none text-sm font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">16-Digit Card Number</label>
                          <input 
                            type="text" 
                            required
                            placeholder="4000 1234 5678 9010"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            className="w-full h-11 border border-neutral-250 bg-white rounded-lg px-3 focus:outline-none text-sm font-mono font-bold"
                          />
                          {cardErrors.cardNumber && <p className="text-[10px] text-red-500 mt-1">{cardErrors.cardNumber}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">Expiry Code (MM/YY)</label>
                            <input 
                              type="text" 
                              required
                              placeholder="12/28"
                              value={cardExpiry}
                              onChange={handleExpiryChange}
                              className="w-full h-11 border border-neutral-250 bg-white rounded-lg px-3 focus:outline-none text-sm font-mono font-bold text-center"
                            />
                            {cardErrors.cardExpiry && <p className="text-[10px] text-red-500 mt-1">{cardErrors.cardExpiry}</p>}
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">CVV Guard</label>
                            <input 
                              type="text" 
                              required
                              maxLength={4}
                              placeholder="321"
                              value={cardCvv}
                              onChange={handleCvvChange}
                              className="w-full h-11 border border-neutral-250 bg-white rounded-lg px-3 focus:outline-none text-sm font-mono font-bold text-center"
                            />
                            {cardErrors.cardCvv && <p className="text-[10px] text-red-500 mt-1">{cardErrors.cardCvv}</p>}
                          </div>
                        </div>
                      </div>

                      <Button type="submit" fullWidth className="h-14 font-extrabold uppercase tracking-widest shadow-lg shadow-brand-100 mt-4 leading-none">
                        Settle Card Transaction (${grandTotal.toFixed(2)})
                      </Button>
                    </form>
                  ) : (
                    /* PAYPAL SETTLEMENT INSTRUCTION ACTION */
                    <div className="pt-4 border-t border-neutral-150 space-y-4">
                      <div className="p-5 bg-neutral-50/70 border border-neutral-200 rounded-2xl text-xs leading-relaxed text-neutral-600">
                        <span className="font-bold text-neutral-900 block mb-1">
                          {paypalMode === 'live' ? 'Live PayPal Gateway Integration' : 'PayPal Sandbox SDK Integration'}
                        </span>
                        {paypalClientId || import.meta.env.VITE_PAYPAL_CLIENT_ID ? (
                          <span>
                            Loaded with custom client ID: <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono font-bold text-[10px] text-brand-700">{(paypalClientId || import.meta.env.VITE_PAYPAL_CLIENT_ID || "").slice(0, 10)}...</code>
                          </span>
                        ) : (
                          <span>
                            Using demo PayPal environment. You can bind your own API Client ID in the <strong className="text-neutral-900">Admin Settings</strong> panel.
                          </span>
                        )}
                      </div>

                      {/* Real PayPal Buttons Integration */}
                      <div className="relative z-10 min-h-[150px] p-2 bg-white border border-neutral-150 rounded-2xl shadow-sm">
                        <PayPalScriptProvider 
                          key={paypalClientId || import.meta.env.VITE_PAYPAL_CLIENT_ID || "test"}
                          options={{ 
                            clientId: paypalClientId || import.meta.env.VITE_PAYPAL_CLIENT_ID || "test",
                            currency: "USD",
                            intent: "capture"
                          }}
                        >
                          <PayPalButtons
                            style={{ layout: "vertical", height: 48, label: "checkout" }}
                            createOrder={(data, actions) => {
                              return actions.order.create({
                                intent: "CAPTURE",
                                purchase_units: [
                                  {
                                    amount: {
                                      currency_code: "USD",
                                      value: grandTotal.toFixed(2),
                                    },
                                    description: `Order with ${totalQuantity} items from Grobrav Store`,
                                  },
                                ],
                              });
                            }}
                            onApprove={(data, actions) => {
                              if (actions.order) {
                                return actions.order.capture().then((details) => {
                                  const payerEmail = details.payer?.email_address || "PayPal Customer";
                                  const payerName = details.payer?.name?.given_name || "Customer";
                                  runPaymentProcessing(`PayPal (${payerName} - ${payerEmail})`);
                                });
                              }
                              return Promise.resolve();
                            }}
                            onError={(err) => {
                              console.error("PayPal Smart Button Error", err);
                              setPayPalError("PayPal Gateway failed to initialize or complete the payment. Please double check your client ID or use simulated mode.");
                            }}
                            onCancel={() => {
                              setPayPalError("Payment was cancelled by the user.");
                            }}
                          />
                        </PayPalScriptProvider>
                      </div>

                      {payPalError && (
                        <div className="flex items-start gap-2 bg-red-50 text-red-650 p-3 rounded-xl text-xs font-medium border border-red-100">
                          <AlertCircle size={15} />
                          <span>{payPalError}</span>
                        </div>
                      )}

                      <div className="text-center pt-2">
                        <span className="text-[10px] text-neutral-400">
                          Trouble loading PayPal buttons?{" "}
                          <button 
                            type="button" 
                            onClick={handleOpenPayPal} 
                            className="text-brand-600 hover:underline font-bold"
                          >
                            Use Simulated Sandbox Mode Instead
                          </button>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Order Preview Sidebar summary */}
            <div className="lg:col-span-5 bg-white border border-neutral-200 shadow-xs rounded-2xl p-6 space-y-6">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-150 pb-3">Shopping Content</h3>
              
              <ul className="divide-y divide-neutral-100 text-xs">
                {cartItems.map((item) => (
                  <li key={item.cartId} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 rounded border border-neutral-150 overflow-hidden relative">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        {item.customImage && <img src={item.customImage} className="absolute bottom-0 right-0 w-4.5 h-4.5 bg-white p-0.5" alt="" />}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900">{item.name}</p>
                        <p className="text-[10px] text-neutral-500 capitalize">{item.selectedColor} / Size {item.selectedSize} (qty {item.quantity})</p>
                        {item.customText && (
                          <p className="text-[10px] text-brand-700 font-mono mt-0.5">"{item.customText}"</p>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-neutral-900 font-bold">${item.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              {/* Promo Coupon Inputs */}
              <div className="pt-4 border-t border-neutral-100 space-y-2">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Promotion Voucher</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="e.g. WELCOME15, SAVINGS20"
                    disabled={validatingCoupon}
                    className="flex-1 h-10 border border-neutral-205 rounded-xl px-3 bg-neutral-50 focus:bg-white focus:outline-none text-xs text-neutral-800 font-bold font-mono"
                  />
                  <Button 
                    onClick={handleApplyCoupon} 
                    disabled={validatingCoupon || !couponCode}
                    className="h-10 px-4 text-xs font-bold shrink-0 rounded-xl"
                  >
                    {validatingCoupon ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
                  </Button>
                </div>
                {couponError && <p className="text-[10px] text-red-500 font-semibold">{couponError}</p>}
                {appliedCoupon && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-[10px] font-bold flex justify-between items-center">
                    <span>Applied: {appliedCoupon.code} (-{appliedCoupon.percent}%)</span>
                    <button onClick={() => setAppliedCoupon(null)} className="text-emerald-950 hover:underline">Remove</button>
                  </div>
                )}
              </div>

              {/* Calculations Block */}
              <div className="pt-4 border-t border-neutral-150 space-y-3.5 text-xs">
                <div className="flex justify-between text-neutral-500 font-medium">
                  <span>Items Subtotal</span>
                  <span className="font-mono font-bold">${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-650 font-bold">
                    <span>Reduction Discount</span>
                    <span className="font-mono">- ${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-500 font-medium">
                  <span>Logistics Transport</span>
                  <span className="font-mono font-bold">
                    {shippingCost === 0 ? "FREE Standard Tracked" : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-500 font-medium">
                  <span>Expected State Taxes</span>
                  <span className="font-mono font-bold">${taxes.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-155 pt-3.5 text-sm text-neutral-900 font-bold">
                  <span>Grand Estimation</span>
                  <span className="font-mono text-neutral-900">${grandTotal.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Bulletproof checkout policy disclaimer */}
              <div className="p-4 bg-neutral-50 rounded-xl text-[10px] text-neutral-450 leading-relaxed space-y-1">
                <span className="font-bold text-neutral-600 block">Durable Data Protection Guarantee</span>
                Once validated by our card processing server, tracking IDs automatically populate in the administrator control room panel for immediate logistics coordination.
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
export default Checkout;
