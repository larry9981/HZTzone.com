import React, { useState } from 'react';
import { useApp } from '../components/AppContext';
import { api } from '../services/api';
import { Search, Loader2, Package, Truck, Clock, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { LogisticsTimeline } from '../components/LogisticsTimeline';

export const TrackOrder: React.FC = () => {
  const { t, trackEvent } = useApp();
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !email) return;

    setLoading(true);
    setErrorMsg('');
    setOrder(null);

    try {
      const result = await api.trackOrder(orderId, email);
      setOrder(result);
      trackEvent('track_order_success', { orderId, email });
    } catch (err: any) {
      setErrorMsg(t('track_not_found'));
      trackEvent('track_order_failure', { orderId, email, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="track-order-container" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif font-bold text-neutral-900 mb-4">{t('track_order')}</h1>
        <p className="text-lg text-neutral-500 max-w-xl mx-auto">
          {t('track_order_sub')}
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm max-w-2xl mx-auto">
        <form onSubmit={handleTrack} className="space-y-6">
          <div>
            <label htmlFor="order-id-input" className="block text-sm font-semibold text-neutral-700 mb-1.5">{t('track_ref')}</label>
            <input
              id="order-id-input"
              type="text"
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-200 bg-neutral-50 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all text-sm font-mono font-bold"
              placeholder="e.g. GRO-839210"
            />
          </div>

          <div>
            <label htmlFor="email-input" className="block text-sm font-semibold text-neutral-700 mb-1.5">{t('track_email')}</label>
            <input
              id="email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-200 bg-neutral-50 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all text-sm"
              placeholder="e.g. customer@example.com"
            />
          </div>

          <Button type="submit" fullWidth size="lg" disabled={loading} className="py-3.5 shadow-md shadow-brand-100 font-bold flex items-center justify-center gap-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            {t('track_btn')}
          </Button>
        </form>

        {errorMsg && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 text-center font-medium">
            {errorMsg}
          </div>
        )}
      </div>

      {order && (
        <div id="tracked-order-results" className="mt-12 bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm space-y-8 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-5 gap-4">
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">Order Id Reference</p>
              <h2 className="text-2xl font-mono font-bold text-neutral-900">{order.id}</h2>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">Date Submitted</p>
              <p className="text-sm text-neutral-600 font-medium">{order.date}</p>
            </div>
          </div>

          {/* Interactive Progress Bar Grid */}
          <div>
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6 font-mono">{t('track_pipeline')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              
              {/* Step 1: Sublimation */}
              <div className={`p-5 rounded-2xl border transition-all ${
                order.status === 'In Production' || order.status === 'Shipped'
                  ? 'bg-amber-50/40 border-amber-100 text-amber-900 shadow-sm'
                  : 'bg-neutral-50 border-neutral-150 text-neutral-400'
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    order.status === 'In Production' || order.status === 'Shipped' ? 'bg-amber-500 text-white' : 'bg-neutral-200 text-neutral-400'
                  }`}>
                    <Clock size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Fine Sublimation Queue</h4>
                    <p className="text-xs mt-0.5">{order.status === 'In Production' ? 'Active Production' : 'Completed'}</p>
                  </div>
                </div>
              </div>

              {/* Step 2: Shipping Dispatch */}
              <div className={`p-5 rounded-2xl border transition-all ${
                order.status === 'Shipped'
                  ? 'bg-emerald-50/40 border-emerald-100 text-emerald-900 shadow-sm'
                  : 'bg-neutral-50 border-neutral-150 text-neutral-400'
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    order.status === 'Shipped' ? 'bg-emerald-500 text-white' : 'bg-neutral-200 text-neutral-400'
                  }`}>
                    <Truck size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Dispatched for Delivery</h4>
                    <p className="text-xs mt-0.5">{order.status === 'Shipped' ? 'In transit to buyer' : 'Pending dispatch'}</p>
                  </div>
                </div>
              </div>

              {/* Step 3: Sealed */}
              <div className={`p-5 rounded-2xl border transition-all ${
                order.status === 'Shipped'
                  ? 'bg-emerald-100/30 border-emerald-200 text-emerald-900 shadow-sm'
                  : 'bg-neutral-50 border-neutral-150 text-neutral-400'
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    order.status === 'Shipped' ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-400'
                  }`}>
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Handed Over Successfully</h4>
                    <p className="text-xs mt-0.5">{order.status === 'Shipped' ? 'Delivered safely' : 'Awaiting transit'}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-5 border-t border-neutral-100 text-sm">
            {/* Items Summary list */}
            <div>
              <h3 className="font-bold text-neutral-900 mb-3.5 flex items-center gap-1.5">
                <ShoppingBag size={16} className="text-brand-600" /> Purchased Content
              </h3>
              <ul className="space-y-3 bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
                {order.items?.map((it: any, index: number) => (
                  <li key={index} className="flex justify-between font-medium">
                    <span className="text-neutral-700">{it.quantity}x {it.name} <span className="text-[10px] text-neutral-400 bg-neutral-200 px-1.5 py-0.2 rounded font-mono ml-1">{it.color}/{it.size}</span></span>
                    <span className="font-mono text-neutral-950 font-semibold">${it.price.toFixed(2)}</span>
                  </li>
                ))}
                {order.customText && (
                  <li className="pt-2.5 border-t border-neutral-200/85">
                    <span className="text-xs bg-brand-50 text-brand-700 border border-brand-100 px-2 py-1.5 rounded-lg block font-mono">
                      <strong>Text Embossing:</strong> "{order.customText}"
                    </span>
                  </li>
                )}
                <li className="flex justify-between border-t border-neutral-200 pt-3.5 font-bold">
                  <span className="text-neutral-900">Total Settled Value</span>
                  <span className="font-mono text-neutral-900">${order.total?.toFixed(2)}</span>
                </li>
              </ul>
            </div>

            {/* Destination Info */}
            <div className="space-y-4">
              <h3 className="font-bold text-neutral-900">{t('track_dest')}</h3>
              <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100 space-y-2">
                <p className="font-bold text-neutral-800">{order.customerName}</p>
                <p className="text-neutral-500 text-xs font-mono">{order.email}</p>
                <p className="text-neutral-600 leading-relaxed text-xs">{order.address}</p>
                <div className="pt-2 font-semibold text-xs text-neutral-500">
                  Carrier Source: <span className="text-neutral-900 uppercase font-mono">{order.paymentMethod?.split(' ')[0]} LOGISTICS</span>
                </div>
                {order.trackingNumber && (
                  <div className="pt-2.5 mt-2.5 border-t border-neutral-200 space-y-1">
                    <p className="font-bold text-neutral-900 text-xs text-[11px] uppercase tracking-wider text-neutral-400">POD Fulfillment Cargo Status</p>
                    <div className="flex flex-col gap-1 text-xs">
                      <div>
                        <span className="text-neutral-500">Carrier:</span> <span className="font-bold text-neutral-850">{order.carrier || 'DHL Global Express'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Tracking Code:</span>{' '}
                        <a href={order.trackingUrl || '#'} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline font-mono font-bold">
                          {order.trackingNumber} ↗
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Logistics Trajectory Timeline Section */}
          <div className="pt-4 border-t border-neutral-100">
            <LogisticsTimeline order={order} />
          </div>

          <div className="text-center text-xs text-neutral-400 pt-2 border-t border-neutral-100">
            For modifications regarding logistics address coordinates, please contact customer assistance at <strong>support@grobrav.com</strong>.
          </div>
        </div>
      )}
    </div>
  );
};
export default TrackOrder;
