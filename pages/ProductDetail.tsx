import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Star,
  Truck,
  RefreshCw,
  Wand2,
  Loader2,
  Info,
  Image as ImageIcon,
  Type,
  Download,
  ChevronRight,
  Share2,
  Sparkles,
  MessageSquare,
  Trash2,
  UploadCloud,
  Lock,
  Plus,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { useCart } from "../App";
import { useApp } from "../components/AppContext";
import { api } from "../services/api";
import { ProductCard } from "../components/ProductCard";
import {
  generateCustomTextIdeas,
  generateDesignImage,
} from "../services/geminiService";
import { Product } from "../types";

const FAQAccordionItem: React.FC<{ question: string; answer: string }> = ({
  question,
  answer,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 text-left font-bold text-xs text-neutral-800 flex justify-between items-center bg-neutral-50/50 hover:bg-neutral-50 select-none"
      >
        <span className="font-serif text-sm font-black text-neutral-900">
          {question}
        </span>
        <span className="text-brand-600 text-lg leading-none font-mono font-bold">
          {isOpen ? "−" : "+"}
        </span>
      </button>
      {isOpen && (
        <div className="p-5 border-t border-neutral-100 text-[11px] text-neutral-500 leading-relaxed bg-white">
          {answer}
        </div>
      )}
    </div>
  );
};

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products, user, refreshState, t, trackEvent } = useApp();

  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [selectedColor, setSelectedColor] = useState<string>("White");

  // Customization State
  const [customText, setCustomText] = useState<string>("");
  const [customImage, setCustomImage] = useState<string>("");

  // AI State
  const [aiPromptRecipient, setAiPromptRecipient] = useState("");
  const [aiPromptOccasion, setAiPromptOccasion] = useState("");
  const [aiImagePrompt, setAiImagePrompt] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Review Form state
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState("");

  // Dynamically recommend 4 to 6 bestseller products, excluding the current product
  const recommendedBestSellers = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // Filter out the current product and match Best Sellers criteria
    let filtered = products.filter(p => {
      if (product && p.id === product.id) return false;
      const catLower = p.category?.toLowerCase() || '';
      return catLower === 'best-sellers' || catLower === 'best-seller' || (p.rating && p.rating >= 4.7);
    });

    // If we have less than 4, backfill with other products so the user always sees a nice 4-6 product recommendation
    if (filtered.length < 4) {
      const others = products.filter(p => {
        if (product && p.id === product.id) return false;
        return !filtered.some(f => f.id === p.id);
      });
      filtered = [...filtered, ...others];
    }

    // Limit to 4-6 products
    return filtered.slice(0, 6);
  }, [products, product]);

  // Find product dynamically from state
  useEffect(() => {
    if (!products || products.length === 0) return;
    const found = products.find((p) => String(p.id) === String(id));
    if (found) {
      setProduct(found);
      if (found.images && found.images.length > 0 && !selectedImage) {
        setSelectedImage(found.images[0]);
      }

      const availableColors =
        found.colors && found.colors.length > 0
          ? found.colors
          : ["White", "Black", "Pink", "Navy"];
      if (!availableColors.includes(selectedColor)) {
        setSelectedColor(availableColors[0]);
      }

      const availableSizes =
        found.sizes && found.sizes.length > 0
          ? found.sizes
          : found.category === "men" || found.category === "women"
            ? ["XS", "S", "M", "L", "XL", "XXL"]
            : [];
      if (availableSizes.length > 0 && !availableSizes.includes(selectedSize)) {
        setSelectedSize(availableSizes[0]);
      }
    }
  }, [id, products, selectedImage]);

  // Inject Google GMS-compliant Structured Microdata (JSON-LD) and dynamic SEO metatags
  useEffect(() => {
    if (!product) return;

    // Remove existing script if any
    const existingScript = document.getElementById('gms-product-schema');
    if (existingScript) {
      existingScript.remove();
    }

    const price = product.price || 29.99;
    const ratingValue = product.rating || 4.8;
    const reviewCount = product.reviews || 89;

    const schemaData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": [
        product.image,
        ...(product.images || [])
      ],
      "description": product.description || "Custom handcrafted customizable product designed and printed on demand.",
      "sku": product.sku || `SKU-GROB-${product.id}`,
      "mpn": product.id,
      "brand": {
        "@type": "Brand",
        "name": "Grobrav"
      },
      "review": {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": ratingValue.toString(),
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Emily Watson"
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": ratingValue.toString(),
        "reviewCount": reviewCount.toString()
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "USD",
        "price": price.toString(),
        "priceValidUntil": "2027-12-31",
        "itemCondition": "https://schema.org/NewCondition",
        "availability": "https://schema.org/InStock",
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": "0.00",
            "currency": "USD"
          }
        }
      }
    };

    const script = document.createElement('script');
    script.id = 'gms-product-schema';
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(schemaData);
    document.head.appendChild(script);

    // Update dynamic document title / description for optimal Google search index ranking (SEO & GEO compliance)
    document.title = `${product.name} | Premium Customizable Gift - Grobrav`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', `${product.description || ''} Buy personalized custom designs online with robust international shipping and safe delivery.`);
    }

    return () => {
      const scriptToRemove = document.getElementById('gms-product-schema');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [product]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Loader2
          size={36}
          className="animate-spin mx-auto text-brand-600 mb-4"
        />
        <p className="text-neutral-500 font-bold">
          Matching product file database state...
        </p>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, {
      size: selectedSize,
      color: selectedColor,
      customText: customText,
      customImage: customImage,
    });
    trackEvent("user_add_to_cart", { id: product.id, name: product.name });
  };

  const handleCheckout = () => {
    addToCart(product, {
      size: selectedSize,
      color: selectedColor,
      customText: customText,
      customImage: customImage,
    });
    trackEvent("user_checkout_direct", { id: product.id, name: product.name });
    navigate("/checkout");
  };

  const saveImageLocally = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateIdeas = async () => {
    if (!aiPromptOccasion || !aiPromptRecipient) return;
    setIsGenerating(true);
    try {
      const ideas = await generateCustomTextIdeas(
        product.name,
        aiPromptOccasion,
        aiPromptRecipient,
      );
      setAiSuggestions(ideas);
    } catch (e) {
      setAiSuggestions([
        "Together since " + new Date().getFullYear(),
        "Grobrav Fine Love",
        "You + Me Forever",
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!aiImagePrompt) return;
    setIsGeneratingImage(true);
    try {
      const generatedBase64 = await generateDesignImage(aiImagePrompt);
      if (generatedBase64) {
        setCustomImage(generatedBase64);
        saveImageLocally(generatedBase64, `grobrav-design-${Date.now()}.png`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const applyAiSuggestion = (text: string) => {
    setCustomText(text);
    setShowAiModal(false);
  };

  // Submit dynamic review comment
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) {
      setReviewFeedback("Please fill key details.");
      return;
    }

    setSubmittingReview(true);
    setReviewFeedback("");

    try {
      await api.postReview(product.id, {
        userName: reviewName,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewName("");
      setReviewComment("");
      setReviewRating(5);
      setReviewFeedback(t("review_success") || "Review posted successfully!");
      // Refresh global states so backend reviews list gets pulled instantly
      await refreshState();
      trackEvent("user_post_review", {
        productId: product.id,
        rating: reviewRating,
      });
    } catch (err: any) {
      setReviewFeedback(err.message || "Failed submitting comment.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Admin delete comment
  const handleReviewDelete = async (reviewId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this customer review comment?",
      )
    )
      return;
    try {
      await api.deleteReview(product.id, reviewId);
      await refreshState();
      trackEvent("admin_delete_review", { productId: product.id, reviewId });
    } catch (err: any) {
      alert(err.message || "Could not delete comment.");
    }
  };

  // Helper to extract or embed YouTube video ID safely
  const renderYoutubeVideo = (code: string) => {
    if (!code) return null;
    let videoId = code.trim();

    // In case user provided a full iframe string, extract src ID or parse it
    if (code.includes("<iframe")) {
      const match = code.match(/embed\/([^"/?\s>]+)/);
      if (match && match[1]) {
        videoId = match[1];
      }
    } else if (code.includes("youtube.com/watch?v=")) {
      const parts = code.split("v=");
      if (parts[1]) {
        videoId = parts[1].split("&")[0];
      }
    } else if (code.includes("youtu.be/")) {
      const parts = code.split("youtu.be/");
      if (parts[1]) {
        videoId = parts[1].split("?")[0];
      }
    }

    return (
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm mt-12 space-y-4">
        <h3 className="text-lg font-serif font-bold text-neutral-900 flex items-center gap-2">
          <span>🎬 Collection Craft Video Showcase</span>
        </h3>
        <p className="text-xs text-neutral-500">
          Watch the precision sublimation and premium cotton print procedures
          for this apparel.
        </p>
        <div className="relative aspect-video rounded-2xl overflow-hidden shadow border border-neutral-100 bg-neutral-950">
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Product Video Showcase"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#fdfbfb] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4">
          <Link to="/" className="hover:text-brand-600 transition-colors">
            Home
          </Link>
          <ChevronRight size={14} />
          <Link
            to={`/category/${product.category}`}
            className="hover:text-brand-600 transition-colors"
          >
            {product.category}
          </Link>
          <ChevronRight size={14} />
          <span className="text-neutral-900">{product.name}</span>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-16 lg:items-start">
          {/* Left Column: Image & Personalization Preview */}
          <div className="flex flex-col gap-6">
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-white shadow-xl ring-1 ring-neutral-200">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover animate-fade-in"
              />

              <button className="absolute top-6 right-6 p-3 rounded-full bg-white shadow-lg text-neutral-600 hover:text-brand-600 transition-colors shadow-black/10">
                <Share2 size={20} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {product.images?.map((img) => (
                <button
                  key={img}
                  className={`relative aspect-square rounded-xl overflow-hidden ring-offset-2 transition-all ${selectedImage === img ? "ring-2 ring-brand-600 scale-95" : "ring-1 ring-neutral-200 opacity-70 hover:opacity-100"}`}
                  onClick={() => setSelectedImage(img)}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* EMBEDDED YOUTUBE VIDEO SECTION */}
            {product.youtubeEmbedCode &&
              renderYoutubeVideo(product.youtubeEmbedCode)}

            {/* LOCAL MP4 SHOWCASE VIDEO PLANNER */}
            {product.videoUrl && (
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm mt-8 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 flex items-center gap-2">
                  <span>🎥 Crafted Material Video Motion Showcase</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  Observe the heavy fabric structures, stretch resilience, and sublimation printing detail quality under dynamic illumination.
                </p>
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow border border-neutral-150 bg-neutral-950">
                  <video 
                    src={product.videoUrl} 
                    controls 
                    className="absolute inset-0 w-full h-full object-contain"
                    playsInline
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Config & Selection */}
          <div className="mt-12 lg:mt-0 space-y-10">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span className="px-3 py-1 bg-brand-50 text-brand-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  Dye Sublimated
                </span>
                <div className="flex items-center text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={
                        i < Math.round(product.rating || 5)
                          ? "currentColor"
                          : "none"
                      }
                      className="text-amber-400"
                    />
                  ))}
                  <span className="ml-2 text-xs font-bold text-neutral-500 underline uppercase tracking-widest">
                    ({product.ratingReviews?.length || product.reviews || 0}{" "}
                    Reviews)
                  </span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-black text-neutral-900 mb-4">
                {product.name}
              </h1>
              <div className="flex items-baseline gap-4">
                <p className="text-3xl font-black text-neutral-900">
                  ${product.price}
                </p>
                {product.originalPrice && (
                  <p className="text-lg text-neutral-400 line-through">
                    ${product.originalPrice}
                  </p>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 font-mono mt-2.5 flex items-center gap-1">
                <span>SKU NUMBER:</span>
                <strong className="text-neutral-800 bg-neutral-100 border border-neutral-150 px-2 py-0.5 rounded font-semibold tracking-wider">
                  {product.sku ||
                    `GRO-${product.category.toUpperCase()}-${product.id}`}
                </strong>
              </p>
            </div>

            <p className="text-base text-neutral-600 italic leading-relaxed">
              "{product.description}"
            </p>

            {/* Config Sections */}
            <div className="space-y-8 border-t border-neutral-100 pt-8">
              {product.hasVariants !== false && (
                <>
                  {/* Color */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4">
                      Choose Color:{" "}
                      <span className="text-neutral-950 font-black ml-1">
                        {selectedColor}
                      </span>
                    </h3>
                    <div className="flex items-center gap-4">
                      {(product.colors && product.colors.length > 0
                        ? product.colors
                        : ["White", "Black", "Pink", "Navy"]
                      ).map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-10 h-10 rounded-full border-2 p-1 transition-all ${selectedColor === color ? "border-neutral-900 scale-110" : "border-transparent"}`}
                        >
                          <span
                            className="block w-full h-full rounded-full border border-black/10"
                            style={{ backgroundColor: color.toLowerCase() }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size */}
                  {((product.sizes && product.sizes.length > 0) ||
                    product.category === "men" ||
                    product.category === "women") && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                          Choose Size / 选择款式尺码
                        </h3>
                        <Link
                          to="/size-guide"
                          className="text-[10px] font-bold uppercase tracking-widest text-brand-600 hover:underline"
                        >
                          Size Guide 📏
                        </Link>
                      </div>
                      <select
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        className="w-full h-11 border border-neutral-200 rounded-xl px-3 bg-white text-xs font-bold focus:ring-1 focus:ring-brand-600 outline-none cursor-pointer"
                      >
                        <option value="">
                          -- Click to select size / 请下滑选择尺码 --
                        </option>
                        {(product.sizes && product.sizes.length > 0
                          ? product.sizes
                          : ["XS", "S", "M", "L", "XL", "XXL"]
                        ).map((size) => (
                          <option key={size} value={size}>
                            Size {size}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>

              <div className="space-y-3">
                <Button
                  size="lg"
                  fullWidth
                  onClick={handleAddToCart}
                  className="h-16 text-md rounded-3xl shadow-xl shadow-brand-100 font-bold uppercase tracking-wide animate-fade-in"
                >
                  ADD TO CART
                </Button>

                <Button
                  size="lg"
                  fullWidth
                  onClick={handleCheckout}
                  className="h-16 text-md rounded-3xl shadow-xl bg-[#07C160] hover:bg-[#06b054] border-[#07C160] hover:border-[#06b054] text-white font-bold uppercase tracking-wide animate-fade-in"
                >
                  CHECK OUT
                </Button>
              </div>

              {/* Secure Checkout Trust Badges with PayPal & Visa/Mastercard */}
              <div className="flex flex-col items-center justify-center gap-3 pt-4 text-[11px] text-neutral-400 font-mono">
                <div className="flex items-center gap-1 text-neutral-500 font-bold uppercase tracking-wider">
                  <span>🔒 SECURE CHECKOUT SHIELD</span>
                </div>
                <div className="flex items-center gap-4 opacity-90">
                  {/* PayPal custom logo/badge (Enlarged by 100%) */}
                  <div className="h-10 px-4 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs">
                    <span className="text-[18px] font-sans font-extrabold italic text-blue-800">Pay</span>
                    <span className="text-[18px] font-sans font-extrabold italic text-sky-500 -ml-1">Pal</span>
                  </div>
                  {/* Visa/Mastercard badges (Enlarged by 100%) */}
                  <div className="h-10 px-4 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center gap-4 shadow-2xs">
                    <span className="text-[20px] font-extrabold italic text-blue-900 font-sans tracking-wide">VISA</span>
                    <div className="h-6 w-px bg-neutral-350" />
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1.5">
                        <div className="w-4 h-4 rounded-full bg-red-500" />
                        <div className="w-4 h-4 rounded-full bg-amber-500" />
                      </div>
                      <span className="text-[14px] font-bold text-neutral-600 font-sans">MC</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-6 border-t border-neutral-100">
                <div className="flex items-center gap-3 text-neutral-550">
                  <div className="p-2.5 bg-neutral-50 rounded-full">
                    <Truck size={16} />
                  </div>
                  <span className="text-xs font-bold">
                    Free Global Shipment
                  </span>
                </div>
                <div className="flex items-center gap-3 text-neutral-550">
                  <div className="p-2.5 bg-neutral-50 rounded-full">
                    <RefreshCw size={16} />
                  </div>
                  <span className="text-xs font-bold">100% Love Guarantee</span>
                </div>
              </div>
            </div>
          </div>

        {/* PREMIUM RICH GRAPHICS & FAQ SECTIONS */}
        <div className="mt-16 border-t border-neutral-200 pt-16 space-y-12">
          {/* Rich Content Block (图文混排) */}
          <div className="space-y-6">
            <h3 className="text-xl font-serif font-black text-neutral-900 flex items-center gap-2">
              <span>
                📖 Products Craft Details
              </span>
            </h3>
            {product.richText ? (
              <div
                className="prose prose-neutral max-w-none text-xs text-neutral-600 space-y-4 bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm"
                dangerouslySetInnerHTML={{ 
                  __html: product.richText
                    .replace(/<span[^>]*>[^<]*GEO[^<]*<\/span>/gi, "")
                    .replace(/GEO Fulfilled Standards/gi, "")
                    .replace(/GEO Fulfilled/gi, "")
                }}
              />
            ) : (
              <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
                <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
                  This item is crafted with state-of-the-art sublimation print
                  procedures, ensuring that your personalized memories never
                  fade, peel, or crack under extreme conditions or industrial
                  washing devices.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2">
                    <p className="font-bold text-neutral-900 text-xs uppercase font-mono">
                      Premium Fiber Quality
                    </p>
                    <p className="text-[11px] text-neutral-500 leading-tight">
                      Meticulously sourced heavyweight materials tailored to
                      maximize comfort and breathability.
                    </p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2">
                    <p className="font-bold text-neutral-900 text-xs uppercase font-mono">
                      Eco-Friendly Pigment
                    </p>
                    <p className="text-[11px] text-neutral-500 leading-tight">
                      Non-toxic, allergen-free dye inks engineered specifically
                      for vivid display precision.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-inner border aspect-[16/9] bg-neutral-100 relative">
                  <img
                    src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800"
                    alt="Production Craft Layout"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                    <p className="text-[11px] font-bold text-white uppercase tracking-wider">
                      {t('sublimation_workshop') || "Grobrav Custom Sublimation Workshop"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Best Sellers Recommendations (Bestseller 推荐产品) */}
          {recommendedBestSellers && recommendedBestSellers.length > 0 && (
            <div className="border-t border-neutral-150 pt-12 text-left">
              <div className="mb-6">
                <h3 className="text-xl font-serif font-black text-neutral-900 flex items-center gap-2">
                  <span>🔥 {t('bestsellers') || "Our Bestsellers"}</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {t('bestsellers_sub') || "Personalized with love by thousands of happy customers."}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {recommendedBestSellers.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            </div>
          )}

          {/* Interactive Q&A Template Board (问答模版) - Layout Positioned below Products Craft Details */}
          <div className="space-y-6 border-t border-neutral-150 pt-12 max-w-4xl text-left mr-auto ml-0">
            <h3 className="text-xl font-serif font-black text-neutral-900 flex items-center gap-2">
              <span>Product Q&A</span>
            </h3>
            {product.faqs && product.faqs.length > 0 ? (
              <div className="space-y-4">
                {product.faqs.map((faq, index) => (
                  <FAQAccordionItem
                    key={index}
                    question={faq.question}
                    answer={faq.answer}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <FAQAccordionItem
                  question="How do I submit my customization details properly?"
                  answer="Simply use our live AI design helper. You can enter customized text or use our real-time Stable Diffusion graphics prompt helper to submit high-fidelity print graphics instantly."
                />
                <FAQAccordionItem
                  question="How long does production and cargo delivery take?"
                  answer="Since each item is customized on-demand, printing and sewing takes 2-4 days. Shipping takes an additional 5-7 business days depending on location."
                />
                <FAQAccordionItem
                  question="What washing procedures are recommended for this apparel?"
                  answer="Machine wash cold inside out with like colors. Tumble dry low or hang dry. Do not iron directly on the sublimated print surface."
                />
              </div>
            )}
          </div>
        </div>

        {/* FEEDBACK REVIEWS & COMMENTS SECTION */}
        <section className="mt-16 border-t border-neutral-200 pt-16">
          <div className="max-w-4xl text-left mr-auto ml-0 space-y-6">
            <h3 className="text-xl font-serif font-black text-neutral-900 flex items-center gap-2">
              <MessageSquare size={20} className="text-brand-600" />
              {t("ratings_reviews")} ({product.ratingReviews?.length || 0})
            </h3>

              {product.ratingReviews && product.ratingReviews.length > 0 ? (
                <div className="space-y-4">
                  {product.ratingReviews.map((rev: any) => (
                    <div
                      key={rev.id}
                      className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs relative flex justify-between items-start gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900 text-sm">
                            {rev.userName}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {rev.date || "Pending"}
                          </span>
                        </div>
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, idx) => (
                            <Star
                              key={idx}
                              size={12}
                              fill={idx < rev.rating ? "currentColor" : "none"}
                              className="text-amber-400"
                            />
                          ))}
                        </div>
                        <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                          "{rev.comment}"
                        </p>

                        {/* Review Image attachments */}
                        {rev.images && rev.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {rev.images.map((imgUrl: string, imgIdx: number) => (
                              <a 
                                key={imgIdx} 
                                href={imgUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="w-16 h-16 rounded-xl border border-neutral-100 overflow-hidden bg-neutral-50 shadow-xs hover:scale-105 active:scale-95 transition-transform inline-block"
                              >
                                <img src={imgUrl} alt="Review attachment" className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Review Video attachment */}
                        {rev.video && (
                          <div className="mt-3 max-w-xs">
                            <video 
                              src={rev.video} 
                              controls 
                              className="w-full h-24 rounded-2xl border border-neutral-150 bg-neutral-950 object-contain" 
                              playsInline 
                            />
                          </div>
                        )}
                      </div>

                      {/* Admin delete comments trash button! */}
                      {user && user.role === "admin" && (
                        <button
                          onClick={() => handleReviewDelete(rev.id)}
                          className="p-2 text-neutral-400 hover:text-red-650 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete customer comment feedback"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <p className="text-neutral-500 font-medium text-sm">
                    No reviews yet for this product item.
                  </p>
                  <p className="text-neutral-400 text-xs mt-1">
                    Be the very first couple to upload detailed custom
                    sublimation logs!
                  </p>
                </div>
              )}
            </div>
          </section>
      </div>

      {/* AI Modal removed */}
    </div>
  );
};
export default ProductDetail;
