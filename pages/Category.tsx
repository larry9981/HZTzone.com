import React from 'react';
import { useParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { useApp } from '../components/AppContext';

export const Category: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const { products, t } = useApp();
  
  // Custom case-insensitive mapping & listing of collections
  const categoryProducts = products.filter(
    p => {
      const catLower = p.category?.toLowerCase() || '';
      const typeLower = type?.toLowerCase() || '';
      
      // Smart bestseller fallback mapping: match any product specifically in 'best-sellers' OR having high rating (>= 4.7)
      if (typeLower === 'best-sellers' || typeLower === 'best-seller') {
        return catLower === 'best-sellers' || catLower === 'best-seller' || (p.rating && p.rating >= 4.7);
      }
      
      return catLower === typeLower;
    }
  );
  
  // Translate category titles
  const formattedTitle = type 
    ? t(type.toLowerCase()) !== type.toLowerCase() 
      ? t(type.toLowerCase()) 
      : type.charAt(0).toUpperCase() + type.slice(1)
    : 'Collection';

  return (
    <div id="category-page-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 animate-fade-in">
      <div className="flex flex-col items-center justify-center text-center mb-8 space-y-2">
        <h1 className="text-4xl font-serif font-black text-neutral-900">{formattedTitle} {t('collections') || 'Collection'}</h1>
        <p className="max-w-xl text-neutral-500 text-sm font-medium">
          Premium, customizable items crafted with meticulous dye sublimation. Discover exquisite details representing your unique bonds.
        </p>
        <div className="w-16 h-1.5 bg-brand-600 rounded-full mt-2"></div>
      </div>

      {categoryProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {categoryProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-neutral-50 rounded-3xl border border-neutral-150 max-w-2xl mx-auto">
          <p className="text-neutral-500 font-bold mb-1">No products found here.</p>
          <p className="text-neutral-450 text-xs text-center max-w-xs mx-auto">When the administrator uploads newly available merchandise inside the control board, they will showcase here instantly.</p>
        </div>
      )}
    </div>
  );
};
export default Category;
