import React, { useState } from 'react';
import { useApp } from '../components/AppContext';
import { ShieldCheck, CheckCircle2, Share2, HelpCircle, ExternalLink, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export const Warranty: React.FC = () => {
  const { t, products } = useApp();
  
  // Form State
  const [formData, setFormData] = useState({
    productName: '',
    country: '',
    channel: 'Amazon',
    customerName: '',
    email: '',
    address: '',
    orderNumber: '',
    phone: ''
  });

  const [customProduct, setCustomProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [registeredData, setRegisteredData] = useState<{ id: string; reviewUrl: string } | null>(null);

  const channels = ['Amazon', 'Ebay', 'OZON', 'WB', 'Tiktok', 'Other'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Determine final product name
    const finalProductName = formData.productName === 'Other' ? customProduct : formData.productName;

    if (!finalProductName) {
      setError('Please select or specify your HZTzone product name.');
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      productName: finalProductName
    };

    try {
      const response = await api.submitWarranty(payload);
      if (response.success) {
        setSuccess(true);
        setRegisteredData({
          id: response.warrantyId,
          reviewUrl: response.reviewUrl
        });
      } else {
        setError(response.error || 'Failed to submit extended warranty registration.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareClick = () => {
    if (registeredData?.reviewUrl) {
      window.open(registeredData.reviewUrl, '_blank');
    }
  };

  return (
    <div id="warranty-registration-container" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-fade-in-up">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-brand-50 text-brand-600 rounded-3xl mb-2">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-4xl font-serif font-black tracking-tight text-neutral-900">
          After-Sales Support & Extended Warranty
        </h1>
        <p className="text-base text-neutral-500 max-w-xl mx-auto font-medium">
          HZTzone Official Warranty Portal: Register your purchase details to activate an additional 1 to 2 years of quality assurance free of charge.
        </p>
      </div>

      {!success ? (
        <div className="bg-white border border-neutral-150 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
          <div>
            <h2 className="text-lg font-bold font-serif text-neutral-950 border-b border-neutral-100 pb-3">
              Warranty Certificate Registration
            </h2>
            <p className="text-xs text-neutral-400 mt-1.5">
              *Please provide complete and accurate order details so we can create your secure electronic warranty profile.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-750 text-xs font-semibold rounded-2xl border border-red-100">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Product Select Dropdown */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">
                  Product Name *
                </label>
                <select
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-brand-500 focus:bg-white text-sm font-medium rounded-xl p-3 outline-none transition-all"
                >
                  <option value="">-- Select Your Product * --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                  <option value="Other">Other Product (Specify below)</option>
                </select>
              </div>

              {/* Purchase Channel Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">
                  Purchase Channel *
                </label>
                <select
                  name="channel"
                  value={formData.channel}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-brand-500 focus:bg-white text-sm font-medium rounded-xl p-3 outline-none transition-all"
                >
                  {channels.map(ch => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Custom product input if Other is selected */}
            {formData.productName === 'Other' && (
              <div className="flex flex-col gap-2 animate-fade-in">
                <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">
                  Please Specify Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. HZTzone Hair Dryer, Smart Scale, Pet Grooming Kit"
                  value={customProduct}
                  onChange={(e) => setCustomProduct(e.target.value)}
                  required
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-brand-500 focus:bg-white text-sm font-medium rounded-xl p-3 outline-none transition-all"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Country */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">
                  Purchase Country *
                </label>
                <input
                  type="text"
                  name="country"
                  placeholder="e.g. United States, Germany, Russia"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-brand-500 focus:bg-white text-sm font-medium rounded-xl p-3 outline-none transition-all"
                />
              </div>

              {/* Order Number */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">
                  Order Number *
                </label>
                <input
                  type="text"
                  name="orderNumber"
                  placeholder="e.g. AMZ-9831-291, EB-92183"
                  value={formData.orderNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-brand-500 focus:bg-white text-sm font-medium rounded-xl p-3 outline-none transition-all"
                />
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Customer Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  placeholder="e.g. Alice Smith"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-brand-500 focus:bg-white text-sm font-medium rounded-xl p-3 outline-none transition-all"
                />
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. customer@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-brand-500 focus:bg-white text-sm font-medium rounded-xl p-3 outline-none transition-all"
                />
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Phone number */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="e.g. +1 (555) 019-9231"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-brand-500 focus:bg-white text-sm font-medium rounded-xl p-3 outline-none transition-all"
                />
              </div>

              {/* Residential Address */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">
                  Residential Address *
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="e.g. 742 Evergreen Terrace, Springfield, OR"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-brand-500 focus:bg-white text-sm font-medium rounded-xl p-3 outline-none transition-all"
                />
              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold p-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Register Extended Warranty</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-emerald-50/30 border border-emerald-150 rounded-3xl p-8 sm:p-12 text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center justify-center p-4 bg-emerald-50 text-emerald-600 rounded-full mb-2">
            <CheckCircle2 size={48} />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-serif font-black text-emerald-950">Registration Successful! Warranty Activated</h2>
            <p className="text-sm font-semibold text-emerald-850">
              Your warranty certificate has been successfully recorded in the HZTzone database. Electronic warranty ID:
              <span className="font-mono bg-emerald-100 text-emerald-950 px-2 py-1 rounded ml-1 select-all font-bold">
                {registeredData?.id}
              </span>
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-100 p-6 max-w-lg mx-auto space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 text-brand-650 justify-center">
              <Sparkles size={18} className="animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">Share Your Experience to Win</span>
            </div>
            
            <p className="text-xs text-neutral-500 leading-relaxed font-medium">
              To help us continuously enhance the quality of HZTzone products, we sincerely invite you to take 1 minute to share your shopping experience on your purchase channel. Click the button below to go directly!
            </p>

            <button
              onClick={handleShareClick}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-5 rounded-xl shadow transition-colors flex items-center justify-center gap-2.5 group cursor-pointer"
            >
              <Share2 size={16} />
              <span>Write a Review on {formData.channel}</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <button
            onClick={() => {
              setSuccess(false);
              setFormData({
                productName: '',
                country: '',
                channel: 'Amazon',
                customerName: '',
                email: '',
                address: '',
                orderNumber: '',
                phone: ''
              });
              setRegisteredData(null);
            }}
            className="text-xs font-bold text-neutral-400 hover:text-neutral-600 transition-colors underline"
          >
            Register Another Product
          </button>
        </div>
      )}

      {/* Info FAQs */}
      <div className="bg-neutral-50 border border-neutral-150 rounded-3xl p-6 sm:p-8 space-y-6">
        <h3 className="text-lg font-serif font-bold text-neutral-900 flex items-center gap-2">
          <HelpCircle className="text-brand-600 animate-bounce" size={18} />
          Extended Warranty FAQs
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-neutral-600">
          <div className="space-y-1.5">
            <h4 className="font-bold text-neutral-800">1. How long does the extended warranty last?</h4>
            <p className="leading-relaxed">Once registered, our smart home appliances and beauty devices are automatically extended to a 2-year warranty from the date of purchase. Pet supplies and consumables include 1-year of coverage.</p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-neutral-800">2. Is there any fee for registration?</h4>
            <p className="leading-relaxed">Completely free. Any order purchased through authorized HZTzone retail channels (Amazon, eBay, OZON, WB, TikTok, etc.) is eligible.</p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-neutral-800">3. How do I contact the after-sales team?</h4>
            <p className="leading-relaxed">For any technical assistance or warranty claims, feel free to contact us at support@hztzone.com. Our support team will reply within 8 hours.</p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-neutral-800">4. Is writing a review mandatory?</h4>
            <p className="leading-relaxed">No, it is optional. However, your feedback is highly valuable, and sharing your experience enters you into our VIP list for free trials of new releases!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Warranty;
