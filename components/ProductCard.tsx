import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { Product } from '../types';
import { useApp } from './AppContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { t } = useApp();

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-gray-100 mb-4">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {product.originalPrice && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            SALE
          </div>
        )}
        <button className="absolute top-2 right-2 p-2 rounded-full bg-white/80 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-red-500">
          <Heart size={18} />
        </button>
        {product.isCustomizable && (
          <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-center text-xs font-semibold uppercase tracking-wide text-gray-900 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            {t('personalize_it') || "Personalize It"}
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-base font-medium text-gray-900 group-hover:text-brand-600 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center space-x-2">
          <div className="flex text-yellow-400">
            <Star size={14} fill="currentColor" />
          </div>
          <span className="text-xs text-gray-500">({product.reviews})</span>
        </div>
        <div className="flex items-center gap-2">
           <p className="text-sm font-semibold text-gray-900">${product.price}</p>
           {product.originalPrice && (
             <p className="text-sm text-gray-400 line-through">${product.originalPrice}</p>
           )}
        </div>
      </div>
    </Link>
  );
};