import React, { useState, useEffect } from 'react';
import { useApp } from '../components/AppContext';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Lock, ShieldAlert, Key, Loader2, CheckCircle, 
  MapPin, Bell, ShoppingBag, Star, MessageSquare, 
  Calendar, Truck, CreditCard, ChevronRight, Edit2, CheckCircle2, Trash2 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { LogisticsTimeline } from '../components/LogisticsTimeline';
import { useCart } from '../App';

export const Account: React.FC = () => {
  const { t, user, setUser, logout, trackEvent, orders, products, refreshState } = useApp();
  const navigate = useNavigate();
  
  // Auth navigation tabs
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Auth Form bindings
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Change Password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Shipping Address form state
  const [shippingAddress, setShippingAddress] = useState(user?.address || '');
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);

  // Shipping Address structured fields
  const [addressFirstName, setAddressFirstName] = useState('');
  const [addressLastName, setAddressLastName] = useState('');
  const [addressCountry, setAddressCountry] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressZip, setAddressZip] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressBuilding, setAddressBuilding] = useState('');
  const [addressRoom, setAddressRoom] = useState('');

  const parseAddressJSON = (addressStr: string) => {
    try {
      const parsed = JSON.parse(addressStr);
      if (parsed && typeof parsed === 'object') {
        setAddressFirstName(parsed.firstName || '');
        setAddressLastName(parsed.lastName || '');
        setAddressCountry(parsed.country || '');
        setAddressCity(parsed.city || '');
        setAddressState(parsed.state || '');
        setAddressZip(parsed.zipCode || '');
        setAddressStreet(parsed.streetAddress || '');
        setAddressBuilding(parsed.buildingName || '');
        setAddressRoom(parsed.roomNumber || '');
        return;
      }
    } catch (e) {}
    // Fallback if not JSON or empty
    setAddressFirstName('');
    setAddressLastName('');
    setAddressCountry('');
    setAddressCity('');
    setAddressState('');
    setAddressZip('');
    setAddressStreet(addressStr || '');
    setAddressBuilding('');
    setAddressRoom('');
  };

  const serializeAddressJSON = (
    firstNameVal = addressFirstName,
    lastNameVal = addressLastName,
    countryVal = addressCountry,
    cityVal = addressCity,
    stateVal = addressState,
    zipVal = addressZip,
    streetVal = addressStreet,
    buildingVal = addressBuilding,
    roomVal = addressRoom
  ) => {
    return JSON.stringify({
      firstName: firstNameVal,
      lastName: lastNameVal,
      country: countryVal,
      city: cityVal,
      state: stateVal,
      zipCode: zipVal,
      streetAddress: streetVal,
      buildingName: buildingVal,
      roomNumber: roomVal,
    });
  };

  // Active shopping cart elements synchronized via global Cart Context
  const { items: cartItems, removeFromCart } = useCart();

  // Review modal state
  const [selectedProductForReview, setSelectedProductForReview] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [reviewVideo, setReviewVideo] = useState<string>('');
  const [reviewMediaUploading, setReviewMediaUploading] = useState(false);

  const displayToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // On page mount / user session transition
  useEffect(() => {
    if (user) {
      setShippingAddress(user.address || '');
      parseAddressJSON(user.address || '');
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const data = await api.login({ email, password });
      setUser(data.user);
      displayToast(t('welcome') + `, ${data.user.email}!`, 'success');
      setPassword('');
      refreshState();
    } catch (err: any) {
      displayToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      displayToast('Passwords do not match each other.', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.register({ email, password, confirmPassword });
      displayToast(t('account_created'), 'success');
      setActiveTab('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      displayToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !oldPassword || !newPassword) return;

    if (newPassword.length < 6) {
      displayToast('New password must be 6+ characters.', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({ userId: user.id, oldPassword, newPassword });
      displayToast(t('password_modified') || 'Password modified successfully!', 'success');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      displayToast(err.message, 'error');
      if (err.message && (err.message.toLowerCase().includes('user not found') || err.message.toLowerCase().includes('not found'))) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdatingAddress(true);
    try {
      const formattedAddress = serializeAddressJSON();
      const res = await api.updateProfile({ userId: user.id, address: formattedAddress });
      setUser(res.user);
      setShippingAddress(formattedAddress);
      displayToast(t('address_saved_msg') || 'Shipping address saved!', 'success');
    } catch (err: any) {
      displayToast(err.message, 'error');
      if (err.message && (err.message.toLowerCase().includes('user not found') || err.message.toLowerCase().includes('not found'))) {
        logout();
      }
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  const toggleNewsletterSubscription = async () => {
    if (!user) return;
    const nextSub = !user.subscribed;

    setLoading(true);
    try {
      const res = await api.updateProfile({ userId: user.id, subscribed: nextSub });
      setUser(res.user);
      displayToast(t('newsletter_sub_updated_msg') || 'Subscription properties updated!', 'success');
    } catch (err: any) {
      displayToast(err.message, 'error');
      if (err.message && (err.message.toLowerCase().includes('user not found') || err.message.toLowerCase().includes('not found'))) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReviewModal = (item: any) => {
    const matched = products.find(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase());
    if (!matched) {
      displayToast('Only catalog products can be reviewed.', 'error');
      return;
    }
    setSelectedProductForReview({ ...item, matchedId: matched.id });
    setReviewRating(5);
    setReviewComment('');
    setReviewImages([]);
    setReviewVideo('');
  };

  const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (reviewImages.length + files.length > 4) {
      alert('You can upload up to 4 images max for a review');
      return;
    }

    setReviewMediaUploading(true);
    try {
      const uploadedUrls = [...reviewImages];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        const uploadResult = await new Promise<string>((resolve, reject) => {
          reader.onload = async () => {
            try {
              const res = await api.uploadMedia(reader.result as string, 'rev_img');
              resolve(res.url);
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
        uploadedUrls.push(uploadResult);
      }
      setReviewImages(uploadedUrls);
      displayToast('Images uploaded successfully!', 'success');
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setReviewMediaUploading(false);
    }
  };

  const handleReviewVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.mp4') && file.type !== 'video/mp4') {
      alert('Only MP4 format videos are supported for reviews');
      return;
    }

    setReviewMediaUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await api.uploadMedia(reader.result as string, 'rev_video');
          setReviewVideo(res.url);
          displayToast('Review video uploaded successfully!', 'success');
        } catch (err: any) {
          alert('Upload failed: ' + err.message);
        } finally {
          setReviewMediaUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert('Failed to read video file');
      setReviewMediaUploading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProductForReview || !reviewComment) return;

    setIsSubmittingReview(true);
    try {
      await api.postReview(selectedProductForReview.matchedId, {
        userName: user.email.split('@')[0],
        rating: reviewRating,
        comment: reviewComment,
        images: reviewImages,
        video: reviewVideo || null
      });
      displayToast('Review posted successfully to the catalog catalog!', 'success');
      setSelectedProductForReview(null);
      refreshState();
    } catch (err: any) {
      displayToast(err.message, 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Filter orders registered under current user's email
  const userOrders = user ? orders.filter(o => o.email.toLowerCase().trim() === user.email.toLowerCase().trim()) : [];

  // Logged-in Customer Dashboard Layout
  if (user) {
    return (
      <div id="account-profile-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in text-neutral-800">
        
        {toastMsg && (
          <div className={`fixed top-24 right-6 z-50 rounded-xl shadow-lg p-4 flex items-center gap-3 border ${
            toastType === 'success' ? 'bg-emerald-900 border-emerald-800 text-white animate-bounce' : 'bg-red-950 border-red-900 text-white'
          }`}>
            <span className="text-sm font-semibold">{toastMsg}</span>
          </div>
        )}

        {/* Dashboard Title Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-8 mb-12 gap-4">
          <div>
            <h1 className="text-3xl font-serif font-black tracking-tight text-neutral-900">
              Welcome Back,
            </h1>
            <p className="text-sm text-neutral-500 font-mono mt-1">
              Registered Account: {user.email} (ID: {user.id})
            </p>
          </div>
          <div className="flex gap-4">
            <Button onClick={logout} variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 border-neutral-200">
              {t('logout')}
            </Button>
          </div>
        </div>

        {/* Grid Dashboard Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Account Info, Shippings and Subscriptions */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* 1. SHIPPING ADDRESS UNIT */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 flex items-center gap-2">
                <MapPin className="text-brand-600" size={18} />
                Shipping Information
              </h3>
              
              <form onSubmit={handleUpdateAddress} className="space-y-3 text-left">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">First Name</label>
                      <input
                        type="text"
                        required
                        value={addressFirstName}
                        onChange={(e) => setAddressFirstName(e.target.value)}
                        className="w-full text-xs font-semibold p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 placeholder-neutral-400 focus:bg-white focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                        placeholder="e.g. John"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Last Name</label>
                      <input
                        type="text"
                        required
                        value={addressLastName}
                        onChange={(e) => setAddressLastName(e.target.value)}
                        className="w-full text-xs font-semibold p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 placeholder-neutral-400 focus:bg-white focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                        placeholder="e.g. Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Country</label>
                    <input
                      type="text"
                      required
                      value={addressCountry}
                      onChange={(e) => setAddressCountry(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 placeholder-neutral-400 focus:bg-white focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                      placeholder="e.g. United States"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">City</label>
                      <input
                        type="text"
                        required
                        value={addressCity}
                        onChange={(e) => setAddressCity(e.target.value)}
                        className="w-full text-xs font-semibold p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 placeholder-neutral-400 focus:bg-white focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                        placeholder="e.g. New York"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">State</label>
                      <input
                        type="text"
                        required
                        value={addressState}
                        onChange={(e) => setAddressState(e.target.value)}
                        className="w-full text-xs font-semibold p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 placeholder-neutral-400 focus:bg-white focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                        placeholder="e.g. NY"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Zip Code</label>
                      <input
                        type="text"
                        required
                        value={addressZip}
                        onChange={(e) => setAddressZip(e.target.value)}
                        className="w-full text-xs font-semibold p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 placeholder-neutral-400 focus:bg-white focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                        placeholder="e.g. 10016"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Room / Apt</label>
                      <input
                        type="text"
                        required
                        value={addressRoom}
                        onChange={(e) => setAddressRoom(e.target.value)}
                        className="w-full text-xs font-semibold p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 placeholder-neutral-400 focus:bg-white focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                        placeholder="e.g. Apt 4B"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Street Address</label>
                    <input
                      type="text"
                      required
                      value={addressStreet}
                      onChange={(e) => setAddressStreet(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 placeholder-neutral-400 focus:bg-white focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                      placeholder="e.g. 123 Fashion Ave"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Specific Building Name</label>
                    <input
                      type="text"
                      required
                      value={addressBuilding}
                      onChange={(e) => setAddressBuilding(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 placeholder-neutral-400 focus:bg-white focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                      placeholder="e.g. Empire State"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isUpdatingAddress} fullWidth size="sm" className="font-bold">
                  {isUpdatingAddress && <Loader2 size={12} className="animate-spin mr-1.5" />}
                  {t('save_address_btn')}
                </Button>
              </form>
            </div>

            {/* 2. NEWSLETTER SUBSCRIPTION UNIT */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 flex items-center gap-2">
                <Bell className="text-brand-600" size={18} />
                {t('newsletter_sub_title')}
              </h3>
              
              <div className="p-3.5 bg-neutral-50 border border-neutral-100 rounded-xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className={`text-base flex-shrink-0 ${user.subscribed ? 'text-emerald-500' : 'text-neutral-400'}`}>
                    {user.subscribed ? '●' : '○'}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-neutral-800">
                      {user.subscribed ? t('newsletter_sub_active') : t('newsletter_sub_inactive')}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Receive weekly deals, sublimation tips and high-quality couples clothing drops!
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={toggleNewsletterSubscription} 
                variant={user.subscribed ? 'outline' : 'default'}
                disabled={loading}
                fullWidth
                className="font-bold text-xs"
              >
                {loading && <Loader2 size={12} className="animate-spin mr-1.5" />}
                {user.subscribed ? t('newsletter_sub_btn_disable') : t('newsletter_sub_btn_enable')}
              </Button>
            </div>

            {/* 3. SECURITY & AMENDMENT */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 flex items-center gap-2">
                <Key className="text-brand-600" size={18} />
                {t('change_password')}
              </h3>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{t('old_password')}</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 border border-neutral-150 bg-neutral-50 rounded-xl focus:ring-1 focus:ring-brand-500 outline-none text-neutral-800"
                    placeholder="Old password"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{t('new_password')}</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 border border-neutral-150 bg-neutral-50 rounded-xl focus:ring-1 focus:ring-brand-500 outline-none text-neutral-800"
                    placeholder="New password"
                  />
                </div>
                <Button type="submit" disabled={loading} fullWidth className="font-bold text-xs">
                  {t('update_password')}
                </Button>
              </form>
            </div>

          </div>

          {/* Right Column: Active Cart Overview & Order Purchase History */}
          <div className="space-y-8 lg:col-span-2">
            
            {/* 1. ACTIVE SHOPPING CART SECTION */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-serif font-black text-neutral-900 flex items-center gap-2">
                  <ShoppingBag className="text-brand-600" size={20} />
                  {t('cart_items_title')}
                </h2>
                <span className="text-xs bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-full text-brand-600 font-bold">
                  {cartItems.length} {t('cart_items_count')}
                </span>
              </div>

              {cartItems.length > 0 ? (
                <div className="space-y-4">
                  <div className="divide-y divide-neutral-100 max-h-60 overflow-y-auto pr-2">
                    {cartItems.map((item) => (
                      <div key={item.cartId} className="py-3 flex justify-between items-center text-xs gap-4 group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-neutral-50 border rounded-lg flex-shrink-0 flex items-center justify-center p-1">
                            <img src={item.imageUrl} alt={item.name} className="object-contain max-h-8" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900">{item.name}</p>
                            <p className="text-[10px] text-neutral-400">
                              Qty: {item.quantity} | Size: {item.selectedSize || 'Standard'} | Color: {item.selectedColor || 'N/A'}
                            </p>
                            {item.customText && (
                              <p className="text-[9px] text-brand-600 font-mono">Txt: "{item.customText}"</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="text-right text-neutral-900 font-bold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              removeFromCart(item.cartId);
                            }}
                            className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-neutral-50 transition-colors"
                            title={t('remove_item') || 'Remove Item'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <Button onClick={() => navigate('/checkout')} size="sm" className="font-bold text-xs flex items-center gap-1.5 px-6 shadow shadow-brand-100">
                      {t('cart_view_and_checkout')}
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed rounded-2xl flex flex-col items-center justify-center bg-neutral-50 text-neutral-400">
                  <ShoppingBag size={24} className="mb-2 text-neutral-300" />
                  <p className="text-xs font-bold text-neutral-500">Your shopping cart is currently empty</p>
                  <Button onClick={() => navigate('/')} variant="link" size="sm" className="text-brand-500 hover:text-brand-700 font-bold text-[10px] mt-1">
                    Discover our customized collections
                  </Button>
                </div>
              )}
            </div>

            {/* 2. ORDER HISTORY SECTION */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-xs space-y-6">
              <h2 className="text-lg font-serif font-black text-neutral-900 flex items-center gap-2">
                <Truck className="text-brand-600" size={20} />
                {t('purchase_history_title')}
              </h2>

              {userOrders.length > 0 ? (
                <div className="space-y-6 max-h-[32rem] overflow-y-auto pr-2">
                  {userOrders.map((order) => (
                    <div key={order.id} className="border border-neutral-150 rounded-2xl p-5 bg-neutral-50 text-xs text-neutral-800 space-y-4 shadow-2xs">
                      
                      {/* Header Line */}
                      <div className="flex flex-wrap justify-between items-center bg-white border border-neutral-100 p-3 rounded-xl gap-3">
                        <div>
                          <p className="font-mono text-[10px] uppercase font-bold text-neutral-450">
                            {t('order_id_lbl')}: <span className="text-neutral-900 text-xs font-black">{order.id}</span>
                          </p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            {t('order_date_lbl')}: {order.date}
                          </p>
                        </div>
                        <div className="text-right font-bold">
                          <p className="text-neutral-900 font-black text-xs">
                            {t('order_total_lbl')}: ${order.total?.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-brand-600 mt-0.5 flex items-center justify-end gap-1 font-semibold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full inline-block"></span>
                            {order.status}
                          </p>
                        </div>
                      </div>

                      {/* Items loop with Write Review action next to each! */}
                      <div className="space-y-3.5">
                        <p className="font-bold text-[10px] text-neutral-450 uppercase tracking-wider">{t('order_items_lbl')}:</p>
                        
                        <div className="divide-y divide-neutral-200 divide-dashed">
                          {order.items && order.items.map((item: any, idx: number) => {
                            const matchedPr = products.find(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase());
                            
                            return (
                              <div key={idx} className="py-2.5 flex justify-between items-center flex-wrap gap-3">
                                <div className="space-y-0.5">
                                  <p className="font-bold text-neutral-900">{item.name}</p>
                                  <p className="text-[10px] text-neutral-400">
                                    Size: {item.size || 'N/A'} | Color: {item.color || 'N/A'} | Qty: {item.quantity}
                                  </p>
                                </div>
                                
                                {matchedPr && (
                                  <Button 
                                    onClick={() => handleOpenReviewModal(item)}
                                    variant="outline" 
                                    size="sm" 
                                    className="text-[10px] font-bold border-brand-100 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 py-1 h-8 rounded-lg"
                                  >
                                    <Star size={10} className="mr-1 inline text-amber-500" fill="currentColor" />
                                    {t('btn_review_item')}
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Shipment Tracking details */}
                      {order.trackingNumber && (
                        <div className="bg-brand-50/50 border border-brand-100 p-3.5 rounded-xl space-y-1 mt-2">
                          <p className="font-bold text-[10px] text-brand-800 uppercase tracking-widest flex items-center gap-1">
                            <Truck size={12} />
                            Track Live Shipment
                          </p>
                          <p className="text-[11px] text-brand-700">
                            Carrier: <span className="font-bold">{order.carrier || 'DHL Express'}</span> | Code: <span className="font-mono font-bold select-all">{order.trackingNumber}</span>
                          </p>
                          <a 
                            href={order.trackingUrl || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-brand-605 font-bold underline uppercase block hover:text-brand-800"
                          >
                            Click to trace real-time logistics package
                          </a>
                        </div>
                      )}

                      {/* Interactive Logistics Timeline trajectory */}
                      {(order.status === 'In Production' || order.status === 'Shipped') && (
                        <div className="mt-3">
                          <LogisticsTimeline order={order} />
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed rounded-2xl bg-neutral-50 text-neutral-400">
                  <CreditCard size={28} className="mb-2 text-neutral-300" />
                  <p className="text-xs font-bold text-neutral-500">
                    {t('no_orders_yet')}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-1 max-w-xs mx-auto">
                    Once you checkout and submit dynamic print apparel listings, your historic package logs appear here.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* VERIFIED PURCHASE WRITE PRODUCT REVIEW MODAL */}
        {selectedProductForReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs animate-fade-in"
              onClick={() => setSelectedProductForReview(null)}
            ></div>
            
            <form 
              onSubmit={handleSubmitReview}
              className="bg-white rounded-[2rem] border shadow-2xl p-8 w-full max-w-md relative z-10 animate-fade-in-up space-y-5"
            >
              <div>
                <span className="text-[9px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full uppercase">
                  Verified Purchase Review
                </span>
                <h3 className="text-lg font-serif font-black text-neutral-900 mt-2 block">
                  Review: {selectedProductForReview.name}
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Share fits, dye satisfaction & print details for future buyers!
                </p>
              </div>

              {/* Rating Star selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                  {t('rating_score_lbl')}
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setReviewRating(stars)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star 
                        size={24} 
                        fill={stars <= reviewRating ? '#f59e0b' : 'none'} 
                        className={stars <= reviewRating ? 'text-amber-500' : 'text-neutral-300'} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Message field */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">
                  Comment Review Text
                </label>
                <textarea
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  className="w-full p-3.5 text-xs font-semibold bg-neutral-50 border border-neutral-150 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 text-neutral-800"
                  placeholder={t('comment_placeholder_lbl') || 'Enter your review here...'}
                />
              </div>

              {/* Media Upload Fields */}
              <div className="space-y-4 pt-1 border-t border-neutral-100">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                    Upload Pictures (Optional, Max 4)
                  </label>
                  <div className="flex flex-wrap gap-2 items-center">
                    <input 
                      type="file" 
                      id="review-image-file" 
                      accept="image/*" 
                      multiple 
                      disabled={reviewMediaUploading}
                      onChange={handleReviewImageUpload} 
                      className="hidden" 
                    />
                    <label 
                      htmlFor="review-image-file" 
                      className="px-3 py-2 border rounded-xl text-neutral-700 hover:bg-neutral-50 text-[10px] font-bold cursor-pointer transition-colors inline-block"
                    >
                      {reviewMediaUploading ? 'Uploading...' : 'Choose Pictures'}
                    </label>
                    <span className="text-[10px] text-neutral-450">({reviewImages.length}/4 selected)</span>
                  </div>
                  {reviewImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {reviewImages.map((img, idx) => (
                        <div key={idx} className="relative w-12 h-12 border rounded-lg overflow-hidden bg-neutral-100">
                           <img src={img} alt="" className="w-full h-full object-cover" />
                           <button 
                             type="button" 
                             onClick={() => setReviewImages(prev => prev.filter((_, i) => i !== idx))}
                             className="absolute inset-0 bg-black/60 text-white font-bold text-xs flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                           >
                             ×
                           </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                    Upload Video (Optional, Single MP4)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="file" 
                      id="review-video-file" 
                      accept="video/mp4" 
                      disabled={reviewMediaUploading}
                      onChange={handleReviewVideoUpload} 
                      className="hidden" 
                    />
                    <label 
                      htmlFor="review-video-file" 
                      className="px-3 py-2 border rounded-xl text-neutral-700 hover:bg-neutral-50 text-[10px] font-bold cursor-pointer transition-colors inline-block"
                    >
                      {reviewMediaUploading ? 'Uploading...' : 'Choose Video'}
                    </label>
                    {reviewVideo && (
                      <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1 animate-fade-in">
                        ● Video Loaded
                        <button 
                          type="button" 
                          onClick={() => setReviewVideo('')} 
                          className="text-neutral-450 hover:text-red-500 font-black text-xs ml-1"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                  {reviewVideo && (
                    <video src={reviewVideo} controls className="w-full max-h-24 object-contain rounded-xl mt-2 bg-black" />
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button 
                  type="button" 
                  onClick={() => setSelectedProductForReview(null)} 
                  variant="outline"
                  size="sm"
                  className="font-bold text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmittingReview}
                  size="sm"
                  className="font-bold text-xs"
                >
                  {isSubmittingReview && <Loader2 size={12} className="animate-spin mr-1.5" />}
                  Submit Review
                </Button>
              </div>

            </form>
          </div>
        )}

      </div>
    );
  }

  // Not Logged-in: Authenticate Forms block (Strictly holds custom locked firewall notices)
  return (
    <div id="account-auth-container" className="max-w-md mx-auto px-4 py-20 text-neutral-800">
      
      {toastMsg && (
        <div className={`fixed top-24 right-6 z-50 rounded-xl shadow-lg p-4 flex items-center gap-3 border ${
          toastType === 'success' ? 'bg-emerald-950 border-emerald-900 text-white' : 'bg-red-950 border-red-900 text-white'
        }`}>
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-[2.25rem] p-8 shadow-sm space-y-6">
        
        {/* Toggle selectors tab */}
        <div className="flex border-b pb-2">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 pb-3 text-sm font-bold tracking-wide border-b-2 transition-all ${
              activeTab === 'login' ? 'border-brand-600 text-brand-600' : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {t('login')}
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 pb-3 text-sm font-bold tracking-wide border-b-2 transition-all ${
              activeTab === 'register' ? 'border-brand-600 text-brand-600 text-brand-600 font-bold' : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {t('register')}
          </button>
        </div>

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-5 animate-fade-in-up">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{t('enter_email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-200 bg-neutral-50 rounded-xl focus:ring-1 focus:ring-brand-500 focus:bg-white outline-none transition-all text-sm font-semibold text-neutral-800"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{t('enter_password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-200 bg-neutral-50 rounded-xl focus:ring-1 focus:ring-brand-500 focus:bg-white outline-none transition-all text-sm font-semibold text-neutral-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" fullWidth size="lg" disabled={loading} className="font-bold flex items-center justify-center gap-1.5 shadow-md shadow-brand-100">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {t('login')}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5 animate-fade-in-up">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{t('enter_email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-200 bg-neutral-50 rounded-xl focus:ring-1 focus:ring-brand-500 focus:bg-white outline-none transition-all text-sm font-semibold text-neutral-800"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{t('enter_password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-200 bg-neutral-50 rounded-xl focus:ring-1 focus:ring-brand-500 focus:bg-white outline-none transition-all text-sm font-semibold text-neutral-800"
                  placeholder="•••••••• (6+ characters)"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{t('confirm_password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-200 bg-neutral-50 rounded-xl focus:ring-1 focus:ring-brand-500 focus:bg-white outline-none transition-all text-sm font-semibold text-neutral-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" fullWidth size="lg" disabled={loading} className="font-bold flex items-center justify-center gap-1.5 shadow-md shadow-brand-100">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {t('register')}
            </Button>
          </form>
        )}

        {/* Protection alert firewall panel */}
        <div className="pt-2 flex gap-2.5 bg-neutral-50 border border-neutral-100 rounded-2xl p-4 text-[10px] text-neutral-400 leading-relaxed font-mono">
          <ShieldAlert className="text-brand-500 flex-shrink-0 animate-pulse" size={14} />
          <div>
            <span className="font-bold text-neutral-600 block mb-0.5">High Security Firewall Active</span>
            {t('auth_lock_msg')}
          </div>
        </div>

      </div>
    </div>
  );
};
export default Account;
