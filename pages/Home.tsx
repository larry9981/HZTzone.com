import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  Heart, 
  Star, 
  ShoppingBag, 
  ShieldCheck, 
  Mail, 
  Send, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  Zap,
  Navigation
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/ProductCard';
import { useApp } from '../components/AppContext';
import { api } from '../services/api';

import petBanner from '../src/assets/images/hztzone_pet_tech_banner_1782876358932.jpg';
import beautyBanner from '../src/assets/images/hztzone_beauty_tech_banner_1782876370250.jpg';
import appliancesBanner from '../src/assets/images/hztzone_pet_monitor_banner_1782876382030.jpg';

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
      const response = await api.generateImage(`Premium aesthetic studio photo of ${category.label} with HZTzone branding. Sleek, minimal and high-tech product, isolated clean background.`);
      if (response && response.image) {
        setImgUrl(response.image);
        trackEvent('ai_home_image_generated', { category: category.type });
        await api.addCategory({
          type: category.type,
          label: category.label,
          sublabel: category.sublabel,
          image: response.image,
          isAiGenerated: true
        });
      }
    } catch (err) {
      console.error("Failed to generate AI cover for category card:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div key={category.type} className="group relative h-[340px] rounded-[2rem] overflow-hidden shadow-lg border border-neutral-800 bg-neutral-900 hover:shadow-2xl transition-all duration-500 flex flex-col justify-end">
      {loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 text-center p-6 text-white">
          <Loader2 className="animate-spin text-brand-400 mb-2" size={32} />
          <p className="text-xs font-mono uppercase tracking-widest text-brand-300 animate-pulse">Designing AI Visual...</p>
          <p className="text-[10px] text-neutral-400 mt-1">Generating brand cover for "{category.label}"</p>
        </div>
      ) : imgUrl ? (
        <img 
          src={imgUrl} 
          alt={category.label} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-y-0 inset-x-0 flex flex-col items-center justify-center bg-neutral-900 p-6 text-center">
          <Sparkles className="text-neutral-500 mb-2 animate-bounce" size={28} />
          <p className="text-xs font-mono text-neutral-400">No Custom Cover</p>
          <button 
            onClick={handleAiGenerate}
            className="mt-3 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-[10px] rounded-full flex items-center gap-1.5 transition-all shadow-md"
          >
            <Sparkles size={12} /> AI Generate
          </button>
        </div>
      )}

      {/* Modern gradient overlay: bottom heavy to protect white lettering */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-0"></div>

      <div className="relative z-10 p-8 text-white w-full flex flex-col items-start">
        <div className="flex justify-between items-end w-full">
          <div>
            <p className="text-[10px] font-mono tracking-widest text-brand-400 mb-1 uppercase">
              {category.sublabel || 'HZTzone Premium Series'}
            </p>
            <h3 className="text-xl font-serif font-extrabold tracking-tight">{category.label}</h3>
          </div>
          
          {!loading && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAiGenerate();
              }}
              title="Regenerate this category image using AI"
              className="p-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 hover:scale-110 transition-all text-white cursor-pointer"
            >
              <Sparkles size={13} className="text-brand-300" />
            </button>
          )}
        </div>

        <Link to={`/category/${category.type}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:gap-2.5 transition-all mt-6 hover:text-brand-300">
          Explore Collection <ArrowRight size={14} className="text-brand-400" />
        </Link>
      </div>
    </div>
  );
};

export const Home: React.FC = () => {
  const { t, products, trackEvent, categories } = useApp();
  
  const [edmEmail, setEdmEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signedMsg, setSignedMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      tag: "HZTzone Smart Pet Care",
      title: "Smart Feeding, Watering & GPS Tracking",
      subtitle: "Automate your pet's feeding and hydration schedules while maintaining absolute peace of mind with real-time LTE GPS location tracking.",
      image: petBanner,
      primaryLink: "/category/pets",
      primaryLabel: "Explore Pet Care",
      secondaryLink: "/warranty",
      secondaryLabel: "Register Warranty"
    },
    {
      tag: "HZTzone Electric Beauty",
      title: "Luxurious Electrified Personal Care",
      subtitle: "Indulge in our advanced 110,000 RPM high-speed ionic dryers, high-frequency sonic cleansing brushes, and ultrasonic pore scrubbing spatulas.",
      image: beautyBanner,
      primaryLink: "/category/beauty",
      primaryLabel: "Explore Beauty Tech",
      secondaryLink: "/category/best-sellers",
      secondaryLabel: "Bestsellers"
    },
    {
      tag: "HZTzone Smart Pet Training & Health",
      title: "Advanced Training & Health Monitoring",
      subtitle: "Empower positive behavior with humane remote training collars and track water intake, hydration speeds, and active weight analytics automatically.",
      image: appliancesBanner,
      primaryLink: "/category/pets",
      primaryLabel: "Explore Pet Monitors",
      secondaryLink: "/warranty",
      secondaryLabel: "Register Warranty"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    trackEvent('hero_carousel_next', { index: (currentSlide + 1) % slides.length });
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    trackEvent('hero_carousel_prev', { index: (currentSlide - 1 + slides.length) % slides.length });
  };

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
    <div id="homepage-root" className="flex flex-col gap-0 animate-fade-in bg-white text-neutral-950">
      
      {/* Premium Hero Section with Sliding Banners */}
      <section className="relative min-h-[550px] sm:min-h-[600px] lg:min-h-[660px] flex items-center overflow-hidden bg-neutral-950 w-full border-b border-neutral-900">
        
        {/* Carousel Outer Wrapper */}
        <div className="w-full h-full absolute inset-0">
          
          {/* Active slide view */}
          {slides.map((slide, idx) => {
            const isActive = idx === currentSlide;
            return (
              <div
                key={idx}
                className={`transition-all duration-1000 ease-in-out absolute inset-0 w-full h-full ${
                  isActive ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none'
                }`}
              >
                {/* Background Image spanning the entire section width and height */}
                <div className="absolute inset-0 w-full h-full">
                  <img 
                    src={slide.image} 
                    alt={slide.tag} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer" 
                  />
                  {/* Subtle, beautiful side vignette gradient to guarantee left-hand text contrast */}
                  <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-neutral-950/80 via-neutral-950/30 to-transparent z-0 hidden md:block"></div>
                  <div className="absolute inset-0 bg-neutral-950/50 z-0 md:hidden"></div>
                </div>

                {/* Overlaid Content container: Left-aligned floating card with light glassmorphism */}
                <div className="relative z-10 flex flex-col justify-center h-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 text-white">
                  <div className={`max-w-md lg:max-w-lg p-6 sm:p-8 rounded-3xl bg-neutral-950/45 border border-white/10 backdrop-blur-md shadow-2xl flex flex-col items-center md:items-start md:text-left text-center space-y-4 transform transition-all duration-1000 delay-150 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[10px] font-mono uppercase tracking-wider shadow-sm">
                      <Sparkles size={12} className="text-brand-400 animate-pulse" /> {slide.tag}
                    </div>

                    <h1 className="text-2xl sm:text-3xl lg:text-3xl font-serif font-extrabold text-white leading-snug tracking-tight">
                      {slide.title}
                    </h1>

                    <p className="text-xs sm:text-xs text-neutral-300 max-w-md leading-relaxed font-normal">
                      {slide.subtitle}
                    </p>
                    
                    {/* Action buttons with elegant tech styling */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-1 w-full">
                      <Link to={slide.primaryLink}>
                        <Button size="md" className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-900/10 font-bold text-xs flex items-center gap-1.5 hover:scale-[1.01] transition-all">
                          <ShoppingBag size={13} />
                          {slide.primaryLabel}
                        </Button>
                      </Link>
                      
                      <Link to={slide.secondaryLink}>
                        <Button size="md" variant="outline" className="px-5 py-2 border-white/20 text-white bg-white/5 backdrop-blur-xs font-bold text-xs hover:bg-white/10 hover:scale-[1.01] transition-all">
                          {slide.secondaryLabel}
                        </Button>
                      </Link>
                    </div>
                    
                    {/* High-tech minimal trust badge */}
                    <div className="flex items-center gap-2 pt-1 text-[9px] font-mono tracking-wider text-neutral-400 uppercase">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Loved by 15,000+ smart households</span>
                    </div>

                  </div>
                </div>

              </div>
            );
          })}

          {/* Previous/Next Manual control buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 border border-white/15 hover:border-white/25 backdrop-blur-md text-white shadow-lg hover:scale-110 transition-all select-none cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft size={16} />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 border border-white/15 hover:border-white/25 backdrop-blur-md text-white shadow-lg hover:scale-110 transition-all select-none cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight size={16} />
          </button>

          {/* Dots Navigator Indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentSlide(idx);
                  trackEvent('hero_carousel_dot_click', { index: idx });
                }}
                className={`h-1.5 transition-all duration-500 rounded-full ${
                  idx === currentSlide ? 'w-6 bg-brand-500' : 'w-1.5 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

        </div>

      </section>

      {/* Brand Identity Bento Grid Section: High User Recognition & Premium Tech Aesthetics */}
      <section className="py-16 bg-neutral-50 border-b border-neutral-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] font-mono tracking-widest text-brand-600 uppercase font-bold px-3 py-1 rounded-full bg-brand-50 border border-brand-100">
              The HZTzone Ecosystem
            </span>
            <h2 className="text-3xl font-serif font-extrabold tracking-tight text-neutral-900 mt-3 mb-4">
              Premium Intelligent Hardware
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-lg mx-auto">
              Engineering sleek, functional everyday devices that combine aesthetic modern design with uncompromising electronic smart utility.
            </p>
          </div>

          {/* Bento Grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Smart Pet Care Tech (5 core functions) */}
            <div className="lg:col-span-7 rounded-[2rem] bg-white border border-neutral-200/60 p-8 sm:p-10 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-brand-50 rounded-2xl text-brand-600">
                    <Activity size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-extrabold text-neutral-900 leading-snug">Smart Pet Care Hardware</h3>
                    <p className="text-[10px] font-mono text-brand-600 uppercase tracking-wider">IoT Enabled Care Series</p>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  We address five critical modern pet care scenarios with specialized smart IoT-connected hardware, crafted with gentle food-grade materials and ultra-reliable electronic systems:
                </p>

                {/* Grid of the 5 Core Pet Tech Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-150 flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 animate-pulse"></div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-800">01. Smart Feeding</h4>
                      <p className="text-[10px] text-neutral-500 mt-0.5 leading-normal">Timed automatic dispenser portioning down to the gram.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-150 flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 animate-pulse"></div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-800">02. Smart Watering</h4>
                      <p className="text-[10px] text-neutral-500 mt-0.5 leading-normal">Active quadrupled filtered streams for fresh hydration.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-150 flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 animate-pulse"></div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-800">03. GPS Tracking</h4>
                      <p className="text-[10px] text-neutral-500 mt-0.5 leading-normal">LTE geofence locator keeping paths secure.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-150 flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 animate-pulse"></div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-800">04. Health Monitoring</h4>
                      <p className="text-[10px] text-neutral-500 mt-0.5 leading-normal">Continuous weight and drinking speed analytics.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-150 flex items-start gap-3 sm:col-span-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 animate-pulse"></div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-800">05. Remote Training</h4>
                      <p className="text-[10px] text-neutral-500 mt-0.5 leading-normal">Humane warning chime and gentle pulse collars promoting positive behavior.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-400">HZTzone IoT Smart App Integration</span>
                <Link to="/category/pets" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:gap-2.5 transition-all">
                  Browse Pet Gear <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Right Column: Electrified Beauty & Care (3 core items) */}
            <div className="lg:col-span-5 rounded-[2rem] bg-neutral-900 border border-neutral-800 text-white p-8 sm:p-10 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-brand-500/30 transition-all">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl group-hover:bg-brand-500/15 transition-all"></div>
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-neutral-800 rounded-2xl text-brand-400">
                    <Zap size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-extrabold text-white leading-snug">Electrified Beauty Care</h3>
                    <p className="text-[10px] font-mono text-brand-400 uppercase tracking-wider">Aesthetic Tech Series</p>
                  </div>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  Engineered with premium brushed-metal casing and smart safety sensors, our electric-powered personal care series dry, cleanse, and scrape away dead cells with clinical efficiency:
                </p>

                <div className="space-y-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-neutral-800/60 border border-neutral-750 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-200">High-Speed Ionic Hair Drying</span>
                    <span className="px-2 py-0.5 text-[9px] font-mono bg-brand-500/20 text-brand-300 rounded-full border border-brand-500/30">110K RPM</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-neutral-800/60 border border-neutral-750 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-200">Sonic Facial Cleansing</span>
                    <span className="px-2 py-0.5 text-[9px] font-mono bg-brand-500/20 text-brand-300 rounded-full border border-brand-500/30">8,000 VPM</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-neutral-800/60 border border-neutral-750 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-200">Ultrasonic Skincare Spatulas</span>
                    <span className="px-2 py-0.5 text-[9px] font-mono bg-brand-500/20 text-brand-300 rounded-full border border-brand-500/30">24KHz Wave</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-800 flex items-center justify-between relative z-10 mt-6 lg:mt-0">
                <span className="text-[10px] font-mono text-neutral-500">HZTzone Lab Certified Hardware</span>
                <Link to="/category/beauty" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-300 hover:gap-2.5 transition-all">
                  Browse Beauty Tech <ArrowRight size={14} className="text-brand-400" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Shop Collection Category Section */}
      <section className="py-16 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 w-full">
        <div className="text-center max-w-md mx-auto mb-10">
          <h2 className="text-2xl font-serif font-black text-neutral-900 tracking-tight">{t('shop_collection')}</h2>
          <p className="text-xs text-neutral-500 mt-1 leading-normal">Select a curated collection to explore high-performance product listings.</p>
          <div className="w-12 h-1 bg-brand-500 mx-auto rounded-full mt-3"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories && categories.length > 0 ? (
            categories.map((c) => (
              <CategoryHomeCard key={c.type} category={c} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-neutral-400 font-semibold text-sm">
              No categories registered. Add some collections via the admin panel.
            </div>
          )}
        </div>
      </section>

      {/* Trending Now Bestseller List */}
      <section className="py-16 bg-neutral-50/50 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-10">
            <div>
              <h2 className="text-2xl font-serif font-extrabold text-neutral-900 tracking-tight">{t('bestsellers')}</h2>
              <p className="text-neutral-500 text-xs mt-1 leading-normal">{t('bestsellers_sub')}</p>
            </div>
            <Link to="/category/best-sellers" className="text-brand-600 font-bold flex items-center gap-1.5 hover:gap-2.5 transition-all text-xs">
              {t('view_all')} <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {trendingProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* AI Personalization Pitch Section - Styled like an elegant titanium panel */}
      <section className="py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
          <div className="bg-neutral-900 rounded-[2.5rem] overflow-hidden flex flex-col lg:flex-row border border-neutral-800 shadow-2xl relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl"></div>
            
            <div className="lg:w-1/2 p-8 sm:p-12 lg:p-20 flex flex-col justify-center items-start text-white space-y-6">
              <div className="inline-block px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/25 text-brand-300 text-[10px] font-mono uppercase tracking-wider">
                HZTzone R&D Lab
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-extrabold leading-tight tracking-tight">
                {t('ai_pitch_title')}
              </h2>
              <p className="text-neutral-400 text-xs leading-relaxed">
                {t('ai_pitch_sub')}
              </p>
              <div className="grid grid-cols-2 gap-4 w-full py-4 border-t border-neutral-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-neutral-800 rounded-xl text-brand-400"><Sparkles size={16} /></div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-200">AI Graphics Engraving</h4>
                    <p className="text-[10px] text-neutral-500 mt-0.5 leading-normal">Custom names engraved dynamically on casing.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-neutral-800 rounded-xl text-brand-400"><ShoppingBag size={16} /></div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-200">Premium Hard Coating</h4>
                    <p className="text-[10px] text-neutral-500 mt-0.5 leading-normal">Military-grade protection safeguarding the product.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 h-[260px] lg:h-auto relative">
              <img src="/src/assets/images/hztzone_beauty_tech_banner_1782876370250.jpg" className="w-full h-full object-cover" alt="HZTzone R&D board" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-neutral-950/20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* EDM Newsletters Signup Section */}
      <section className="py-16 bg-neutral-950 text-white relative overflow-hidden border-t border-neutral-900">
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl opacity-30"></div>
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10">
          <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 text-brand-400 rounded-2xl flex items-center justify-center mx-auto shadow-md"><Mail size={22} /></div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-extrabold tracking-tight">{t('newsletter_title')}</h2>
            <p className="text-neutral-400 max-w-md mx-auto text-xs leading-relaxed">{t('newsletter_sub')}</p>
          </div>

          <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 pt-2">
            <input
              type="email"
              required
              value={edmEmail}
              onChange={(e) => setEdmEmail(e.target.value)}
              placeholder={t('newsletter_placeholder')}
              className="flex-grow px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 focus:border-brand-500 focus:outline-none transition-all outline-none font-medium text-white placeholder-neutral-500 shadow-inner"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-600 border border-brand-500 hover:bg-brand-550 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {t('subscribe')}
            </button>
          </form>

          {signedMsg && (
            <p className={`text-[10px] font-mono ${isError ? 'text-red-400' : 'text-emerald-400'}`}>
              {signedMsg}
            </p>
          )}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 border-t border-neutral-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="space-y-3">
            <div className="w-14 h-14 bg-neutral-50 border border-neutral-100 rounded-2xl flex items-center justify-center mx-auto text-brand-600 mb-2 shadow-sm">
              <ShieldCheck size={26} strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-serif font-extrabold text-neutral-900">Lab-Certified Quality</h3>
            <p className="text-neutral-500 text-xs leading-relaxed max-w-xs mx-auto">We engineer and inspect every smart circuit and thermal control module for safety.</p>
          </div>
          <div className="space-y-3">
            <div className="w-14 h-14 bg-neutral-50 border border-neutral-100 rounded-2xl flex items-center justify-center mx-auto text-brand-600 mb-2 shadow-sm">
              <ShoppingBag size={26} strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-serif font-extrabold text-neutral-900">Express Delivery</h3>
            <p className="text-neutral-500 text-xs leading-relaxed max-w-xs mx-auto">All hardware is securely boxed and dispatched from local warehouses within 24 hours.</p>
          </div>
          <div className="space-y-3">
            <div className="w-14 h-14 bg-neutral-50 border border-neutral-100 rounded-2xl flex items-center justify-center mx-auto text-brand-600 mb-2 shadow-sm">
              <Heart size={26} strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-serif font-extrabold text-neutral-900">2-Year Solid Warranty</h3>
            <p className="text-neutral-500 text-xs leading-relaxed max-w-xs mx-auto">All electrified devices carry a rock-solid 2-year warranty and localized customer care.</p>
          </div>
        </div>
      </section>

    </div>
  );
};
export default Home;
