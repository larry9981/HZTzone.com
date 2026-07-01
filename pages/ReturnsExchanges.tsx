import React from 'react';
import { useApp } from '../components/AppContext';
import { RotateCcw, AlertOctagon, HelpCircle, Mail } from 'lucide-react';

export const ReturnsExchanges: React.FC = () => {
  const { t, pagesContent } = useApp();

  return (
    <div id="returns-info-container" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 animate-fade-in-up">
      <div className="text-center">
        <h1 className="text-4xl font-serif font-bold text-neutral-900 mb-4">{t('returns_exchanges')}</h1>
        <p className="text-lg text-neutral-500 max-w-xl mx-auto">
          Honest manufacturing guarantees for customized family memorabilia.
        </p>
      </div>

      {pagesContent?.returns && (
        <div className="bg-brand-50 border border-brand-100 rounded-3xl p-8 text-neutral-800 space-y-2">
          <h2 className="text-lg font-serif font-bold text-brand-900">Custom Returns & Exchanges Policy</h2>
          <p className="text-sm font-medium leading-relaxed">
            {pagesContent.returns}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-6">
        
        {/* Core Return Policy */}
        <div className="bg-red-50/20 border border-red-100 rounded-3xl p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-650 flex items-center justify-center">
            <AlertOctagon size={24} />
          </div>
          <h2 className="text-xl font-serif font-bold text-red-950">{t('returns_title')}</h2>
          <div className="text-sm text-red-800 leading-relaxed font-medium">
            <p>{t('returns_p1')}</p>
          </div>
          <p className="text-xs text-red-650 leading-relaxed">
            Since each couples hoodie or mug undergoes high-temperature dye sublimation representing unique dates, names, or graphic sketches, they cannot be resold.
          </p>
        </div>

        {/* Tailored replacements */}
        <div className="bg-emerald-50/25 border border-emerald-100 rounded-3xl p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <RotateCcw size={24} />
          </div>
          <h2 className="text-xl font-serif font-bold text-emerald-950">Free Damaged Item Replacements</h2>
          <div className="text-sm text-emerald-800 leading-relaxed font-medium">
            <p>{t('returns_p2')}</p>
          </div>
          <p className="text-xs text-emerald-600 leading-relaxed">
            Your trust is our cornerstone. We verify every package before seal dispatch, but in transit shocks are immediately replaced.
          </p>
        </div>

      </div>

      {/* Guide steps */}
      <div className="bg-neutral-55 border border-neutral-200 rounded-3xl p-8 space-y-6">
        <h2 className="text-xl font-serif font-bold text-neutral-900 flex items-center gap-2">
          <HelpCircle className="text-brand-600" size={20} />
          How to initiate a sublimation claim?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div className="space-y-2">
            <h3 className="font-bold text-neutral-850">Step 1: Snap Photo</h3>
            <p className="text-xs text-neutral-500">Take a high resolution photo showcasing the flawed printing section or seam damage.</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-neutral-850">Step 2: Message Us</h3>
            <p className="text-xs text-neutral-500">Send an email request to support@grobrav.com with your GRO-XXXXXX reference number within 14 days of receipt.</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-neutral-850">Step 3: Print Dispatched</h3>
            <p className="text-xs text-neutral-500">Once approved by our designer desk, we kickstart new sublimation and dispatch tracking promptly.</p>
          </div>
        </div>
      </div>

      {/* Quick email support box */}
      <div className="bg-white border border-neutral-250 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl"><Mail size={20} /></div>
          <div>
            <h4 className="font-bold text-neutral-900">Have an active claim question?</h4>
            <p className="text-xs text-neutral-400 mt-0.5">Contact Grobrav Support Desk. Average response is under 8 working hours.</p>
          </div>
        </div>
        <a href="mailto:support@grobrav.com" className="text-sm bg-neutral-950 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-neutral-800 transition-colors shadow">
          support@grobrav.com
        </a>
      </div>

    </div>
  );
};
export default ReturnsExchanges;
