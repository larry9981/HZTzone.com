import React from 'react';
import { useApp } from '../components/AppContext';
import { Ruler, Sparkles, Check } from 'lucide-react';

export const SizeGuide: React.FC = () => {
  const { t, pagesContent } = useApp();

  return (
    <div id="size-guide-container" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 animate-fade-in-up">
      <div className="text-center">
        <h1 className="text-4xl font-serif font-bold text-neutral-900 mb-4">{t('size_guide_title')}</h1>
        <p className="text-lg text-neutral-500 max-w-xl mx-auto">
          {t('size_desc')}
        </p>
      </div>

      {pagesContent?.size_guide && (
        <div className="bg-brand-50 border border-brand-100 rounded-3xl p-8 text-neutral-800 space-y-2">
          <h2 className="text-lg font-serif font-bold text-brand-900">Custom Size Guide Sizing Directive</h2>
          <p className="text-sm font-medium leading-relaxed">
            {pagesContent.size_guide}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
        
        {/* Hoodies */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 space-y-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl"><Ruler size={20} /></div>
            <h2 className="text-xl font-serif font-bold text-neutral-900">{t('size_hoodies')}</h2>
          </div>
          <p className="text-xs text-neutral-505 leading-relaxed">
            Standard deluxe unisex cut designed for relaxed daily fits. Crafted of 80% heavy ring-spun combed cotton / 20% recycled polyester fleece.
          </p>
          
          <div className="border border-neutral-100 rounded-xl overflow-hidden mt-4">
            <div className="bg-neutral-50 px-4 py-2 text-xs font-bold text-neutral-400 font-mono border-b border-neutral-100">
              {t('size_table_header')}
            </div>
            <div className="divide-y divide-neutral-100 text-sm font-medium font-mono text-neutral-700">
              <div className="px-4 py-3 flex justify-between"><span>S (Small)</span> <span>Chest: 38-40" | Length: 27"</span></div>
              <div className="px-4 py-3 flex justify-between"><span>M (Medium)</span> <span>Chest: 41-43" | Length: 28"</span></div>
              <div className="px-4 py-3 flex justify-between"><span>L (Large)</span> <span>Chest: 44-46" | Length: 29"</span></div>
              <div className="px-4 py-3 flex justify-between"><span>XL (Extra Large)</span> <span>Chest: 47-50" | Length: 30"</span></div>
            </div>
          </div>
        </div>

        {/* T-shirts */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 space-y-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl"><Ruler size={20} /></div>
            <h2 className="text-xl font-serif font-bold text-neutral-900">{t('size_tshirts')}</h2>
          </div>
          <p className="text-xs text-neutral-505 leading-relaxed">
            Boxy drop-shoulder heavyweight cotton t-shirts representing standard premium streetwear silhouettes. Perfect canvas for line-art photo sublimation.
          </p>
          
          <div className="border border-neutral-100 rounded-xl overflow-hidden mt-4">
            <div className="bg-neutral-50 px-4 py-2 text-xs font-bold text-neutral-400 font-mono border-b border-neutral-100">
              {t('size_table_header')}
            </div>
            <div className="divide-y divide-neutral-100 text-sm font-medium font-mono text-neutral-700">
              <div className="px-4 py-3 flex justify-between"><span>S (Small)</span> <span>Chest: 34-36" | Length: 26"</span></div>
              <div className="px-4 py-3 flex justify-between"><span>M (Medium)</span> <span>Chest: 38-40" | Length: 27"</span></div>
              <div className="px-4 py-3 flex justify-between"><span>L (Large)</span> <span>Chest: 42-44" | Length: 28"</span></div>
              <div className="px-4 py-3 flex justify-between"><span>XL (Extra Large)</span> <span>Chest: 46-48" | Length: 29"</span></div>
            </div>
          </div>
        </div>

      </div>

      {/* Sizing Advices and details */}
      <div className="bg-brand-50/40 rounded-3xl p-8 border border-brand-100/50 space-y-4">
        <h2 className="text-lg font-serif font-bold text-neutral-900 flex items-center gap-2">
          <Sparkles className="text-brand-600" size={18} />
          Tailoring Fit Recommendations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-600">
          <div className="flex gap-2.5">
            <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold"><Check size={12} /></div>
            <p className="leading-relaxed"><strong>True-to-Size:</strong> If you enjoy standard retail cuts where the hoodies rest right below your waist belt, buy your corresponding standard size.</p>
          </div>
          <div className="flex gap-2.5">
            <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold"><Check size={12} /></div>
            <p className="leading-relaxed"><strong>Sizing Up:</strong> For oversized streetwear statements (such as heavy drop shoulders, looser waist ribs), select one individual size larger.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
export default SizeGuide;
