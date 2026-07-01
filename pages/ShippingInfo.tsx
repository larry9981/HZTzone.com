import React from 'react';
import { useApp } from '../components/AppContext';
import { Clock, ShieldAlert, Award, Plane } from 'lucide-react';

export const ShippingInfo: React.FC = () => {
  const { t, pagesContent } = useApp();

  return (
    <div id="shipping-detail-container" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-serif font-bold text-neutral-900 mb-4">{t('shipping_title')}</h1>
        <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
          {t('shipping_intro')}
        </p>
      </div>

      {pagesContent?.shipping && (
        <div className="bg-brand-50 border border-brand-100 rounded-3xl p-8 text-neutral-800 space-y-2">
          <h2 className="text-lg font-serif font-bold text-brand-900">Custom Shipping Info</h2>
          <p className="text-sm font-medium leading-relaxed">
            {pagesContent.shipping}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
        
        {/* Step 1 */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <h2 className="text-xl font-serif font-bold text-neutral-900">{t('shipping_p1_title')}</h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              {t('shipping_p1_desc')}
            </p>
          </div>
          <div className="text-xs text-brand-700 font-semibold bg-brand-50 px-3 py-1.5 rounded-xl border border-brand-100/50 mt-6 inline-block w-fit">
            Processing Phase: 2 - 4 business days
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Plane size={24} />
            </div>
            <h2 className="text-xl font-serif font-bold text-neutral-900">{t('shipping_p2_title')}</h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              {t('shipping_p2_desc')}
            </p>
          </div>
          <div className="text-xs text-teal-700 font-semibold bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-100/50 mt-6 inline-block w-fit">
            Transit Phase: 5 - 7 business days
          </div>
        </div>

      </div>

      {/* Logistics Matrices */}
      <div className="bg-neutral-50 rounded-3xl p-8 border border-neutral-150 space-y-4">
        <h2 className="text-xl font-serif font-bold text-neutral-900 flex items-center gap-2">
          <Award className="text-brand-600" size={20} />
          {t('shipping_rates')}
        </h2>
        <p className="text-sm text-neutral-600 leading-relaxed">
          Grobrav operates logistics routes serving major international economies. Free delivery is automatically offered at checkout when applying custom corporate promotion vouchers or purchasing cart values exceeding $75.00 USD.
        </p>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 text-center font-mono font-bold text-xs text-neutral-700">
          {t('shipping_rates_table')}
        </div>
      </div>

      {/* Advisory warnings */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex gap-4 text-xs text-yellow-900">
        <ShieldAlert className="text-yellow-700 flex-shrink-0" size={20} />
        <div>
          <p className="font-bold text-yellow-950 mb-1">Sublimation Integrity Advisory</p>
          <p className="leading-relaxed">
            Personalized items containing high-density custom uploaded imagery require slightly tighter processing schedules in case our designers flag pixelation concerns. We prioritize sublime clarity of prints over rushed speed. Thank you for your patience of crafting!
          </p>
        </div>
      </div>

    </div>
  );
};
export default ShippingInfo;
