import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Heart, Star, ShoppingBag, ShieldCheck, Mail, Send, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/ProductCard';
import { useApp } from '../components/AppContext';
import { api } from '../services/api';

const CategoryHomeCard: React.FC<{ category: any }> = ({ category }) => {
  const [imgUrl, setImgUrl] = useState(category.image || '');
  const [loading, setLoading] = useState(false);
  const { trackEvent } = useApp();

  useEffect(() => {
    if (!category.image) {
      handleAiGenerate();
    } else {
      setImgUrl(category.image);
    }
  }, [category.image, category.label]);

  const handleAiGenerate = async () => {
    setLoading(true);
    try {
      const response = await api.generateImage(`Premium aesthetic merchandise illustration or photography icon for ${category.label}. Elegant, isolated on neutral background.`);
      if (response && response.image) {
        setImgUrl(response.image);
        trackEvent('ai_home_image_generated', { category: category.type });
        // Save back to DB so it persists locally and loads from disk next time!
        await api.addCategory({
          type: category.type,
          label: category.label,
          sublabel: category.sublabel,
          image: response.image,
          isAiGenerated: true
        });
      }
    } catch (err) {
      console.error("Failed to generate AI cover for home page card:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div key={category.type} className="group relative h-[320px] rounded-[2rem] overflow-hidden shadow-md border border-neutral-100 bg-neutral-50 hover:shadow-xl transition-all duration-500 flex flex-col justify-end">
      {loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-900/10 backdrop-blur-sm z-10 text-center p-6 text-neutral-800">
          <Loader2 className="animate-spin text-brand-600 mb-2" size={32} />
          <p className="text-xs font-bold uppercase tracking-wider text-brand-950 animate-pulse">Designing AI Cover...</p>
          <p className="text-[10px] text-neutral-500 mt-1">Generating custom graphics for "{category.label}" category</p>
        </div>
      ) : imgUrl ? (
        <img 
          src={imgUrl} 
          alt={category.label} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-y-0 inset-x-0 flex flex-col items-center justify-center bg-neutral-100 p-6 text-center">
          <Sparkles className="text-neutral-400 mb-2 animate-bounce" size={28} />
          <p className="text-xs font-semibold text-neutral-500">No Image Uploaded</p>
          <button 
            onClick={handleAiGenerate}
            className="mt-3 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-[10px] rounded-full flex items-center gap-1.5 transition-all shadow-md"
          >
            <Sparkles size={12} /> AI Generate
          </button>
        </div>
      )}

      {/* Elegant overlay to guarantee high-contrast white text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-0"></div>

      <div className="relative z-10 p-8 text-white w-full flex flex-col items-start">
        <div className="flex justify-between items-end w-full">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-300 mb-1">
              {category.sublabel || 'Dynamic Category Collection'}
            </p>
            <h3 className="text-2xl font-serif font-black">{category.label}</h3>
          </div>
          
          {!loading && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAiGenerate();
              }}
              title="Regenerate this category image using AI"
              className="p-2 rounded-full bg-white/20 hover:bg-white/40 border border-white/20 hover:scale-110 transition-all text-white"
            >
              <Sparkles size={14} className="text-brand-200" />
            </button>
          )}
        </div>

        <Link to={`/category/${category.type}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:gap-3 transition-all mt-6 hover:text-brand-200">
          Explore Collection <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export const Home: React.FC = () => {
  const { t, products, trackEvent, contactInfo, categories } = useApp();
  
  // States of email signups
  const [edmEmail, setEdmEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signedMsg, setSignedMsg] = useState('');
  const [isError, setIsError] = useState(false);

  // Take first 4 products as bestseller slides
  const trendingProducts = products.length > 0 ? products.slice(0, 4) : [];

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edmEmail || !edmEmail.includes('@')) {
      setSignedMsg('Please specify a valid email address.');
      setIsError(true);
      return;
    }

    setSubmitting(true);
    setSignedMsg('');
    setIsError(false);

    try {
      const result = await api.subscribeEDM(edmEmail);
      setSignedMsg(result.message || 'Subscribed successfully!');
      setEdmEmail('');
      trackEvent('newsletter_subscribe_success', { email: edmEmail });
    } catch (err: any) {
      setSignedMsg(err.message || 'Newsletter subscription failed.');
      setIsError(true);
      trackEvent('newsletter_subscribe_failure', { email: edmEmail, error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="homepage-root" className="flex flex-col gap-0 animate-fade-in">
      
      {/* Premium Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-neutral-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center relative z-10 py-10">
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-605 text-xs font-bold uppercase tracking-widest">
              <Sparkles size={14} className="text-brand-500" /> {contactInfo.slogan}
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-black text-neutral-900 leading-[1.05] tracking-tight">
              {t('hero_title').split(' moments.')[0]}
              <br />
              <span className="italic font-normal text-brand-600">Grobrav</span> Studio.
            </h1>
            <p className="text-base text-neutral-500 max-w-lg leading-relaxed font-medium">
              {t('hero_sub')}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/category/women">
                <Button size="lg" className="px-10 shadow-lg shadow-brand-100 font-bold">{t('start_customizing')}</Button>
              </Link>
              <Link to="/category/mugs">
                <Button size="lg" variant="outline" className="px-10 bg-white font-bold">{t('explore_gifts')}</Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-8 pt-8 border-t border-neutral-150">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <img key={i} src={`https://i.pravatar.cc/100?u=grobrav-${i}`} className="w-10 h-10 rounded-full border-2 border-white object-cover" alt="Avatar" referrerPolicy="no-referrer" />
                ))}
              </div>
              <div className="text-xs font-medium">
                <div className="flex text-amber-400 mb-1">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <p className="text-neutral-500 font-bold">Joined by 12,000+ happy couples & families</p>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl rotate-1 hover:rotate-0 hover:scale-[1.01] transition-all duration-700">
              <img src="https://picsum.photos/id/338/800/1000" alt="Featured Product Image" className="w-full h-auto" referrerPolicy="no-referrer" />
            </div>
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-brand-100 rounded-full blur-3xl opacity-50 -z-10"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-pink-100 rounded-full blur-3xl opacity-50 -z-10"></div>
          </div>
        </div>
      </section>



      {/* Featured Categories - Callie Style Overlap */}
      <section className="py-10 md:py-14 max-w-7xl mx-auto px-4 w-full">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-serif font-black text-neutral-900 mb-4">{t('shop_collection')}</h2>
          <div className="w-24 h-1 bg-brand-600 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories && categories.length > 0 ? (
            categories.map((c) => (
              <CategoryHomeCard key={c.type} category={c} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-neutral-400 font-semibold text-sm">
              No dynamic categories registered. Use the admin workspace to add some collections.
            </div>
          )}
        </div>
      </section>

      {/* Trending Now Bestseller List */}
      <section className="py-10 md:py-14 bg-neutral-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-serif font-bold text-neutral-900 mb-2">{t('bestsellers')}</h2>
              <p className="text-neutral-500 italic text-sm">{t('bestsellers_sub')}</p>
            </div>
            <Link to="/category/mugs" className="text-brand-600 font-bold flex items-center gap-1 hover:underline text-sm">
              {t('view_all')} <ArrowRight size={18} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {trendingProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* AI Personalization Pitch Section */}
      <section className="py-10 md:py-14 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-brand-900 rounded-[3rem] overflow-hidden flex flex-col lg:flex-row shadow-xl">
            <div className="lg:w-1/2 p-12 lg:p-24 flex flex-col justify-center items-start text-white space-y-8">
              <div className="inline-block px-4 py-1 rounded-full bg-brand-800 text-brand-200 text-xs font-bold uppercase tracking-wider">Grobrav AI Studio</div>
              <h2 className="text-4xl lg:text-5xl font-serif font-bold leading-tight">{t('ai_pitch_title')}</h2>
              <p className="text-brand-100/80 text-base leading-relaxed">
                {t('ai_pitch_sub')}
              </p>
              <div className="grid grid-cols-2 gap-6 w-full py-4 border-t border-brand-800/80">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-brand-800 rounded-xl"><Sparkles size={20} className="text-brand-200" /></div>
                  <p className="text-sm font-semibold text-brand-100">AI Graphics Converter</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-brand-800 rounded-xl"><ShoppingBag size={20} className="text-brand-200" /></div>
                  <p className="text-sm font-semibold text-brand-100">Premium Dye Sublimation</p>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 h-[350px] lg:h-auto relative">
              <img src="https://picsum.photos/id/64/1000/1000" className="w-full h-full object-cover" alt="AI designer board" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-brand-900/10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* EDM Newsletters Signup Section */}
      <section className="py-12 md:py-16 bg-neutral-900 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-brand-800 rounded-full blur-3xl opacity-20 -z-0"></div>
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8 relative z-10">
          <div className="w-16 h-16 bg-neutral-800 border border-neutral-750 text-brand-400 rounded-full flex items-center justify-center mx-auto shadow"><Mail size={24} /></div>
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold">{t('newsletter_title')}</h2>
            <p className="text-neutral-400 max-w-lg mx-auto text-sm leading-relaxed">{t('newsletter_sub')}</p>
          </div>

          <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={edmEmail}
              onChange={(e) => setEdmEmail(e.target.value)}
              placeholder={t('newsletter_placeholder')}
              className="flex-grow px-5 py-3.5 bg-neutral-800 border border-neutral-700 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all outline-none font-semibold text-white placeholder-neutral-500"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-600 border border-brand-500 hover:bg-brand-550 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {t('subscribe')}
            </button>
          </form>

          {signedMsg && (
            <p className={`text-xs font-semibold ${isError ? 'text-red-400' : 'text-emerald-400'}`}>
              {signedMsg}
            </p>
          )}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 md:py-16 border-t border-neutral-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-brand-600 mb-4">
              <ShieldCheck size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-serif font-bold">Premium Quality</h3>
            <p className="text-neutral-500 text-xs leading-relaxed">We source only the finest organic cotton and materials for your creations.</p>
          </div>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-brand-600 mb-4">
              <ShoppingBag size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-serif font-bold">Fast Fulfillment</h3>
            <p className="text-neutral-500 text-xs leading-relaxed">Your custom order is crafted and shipped within 3-5 business days.</p>
          </div>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-brand-600 mb-4">
              <Heart size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-serif font-bold">Love Guarantee</h3>
            <p className="text-neutral-500 text-xs leading-relaxed">If you don't love your personalization, we'll make it right. Guaranteed.</p>
          </div>
        </div>
      </section>

    </div>
  );
};
export default Home;
