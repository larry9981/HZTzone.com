import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus } from 'lucide-react';
import { CartItem } from '../types';
import { Button } from './ui/Button';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: string) => void;
  total: number;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose, items, onRemove, total }) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
      
      <div className="absolute inset-y-0 right-0 max-w-md w-full flex">
        <div className="h-full w-full flex flex-col bg-white shadow-xl transform transition-transform">
          
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-medium text-gray-900">Your Bag ({items.length})</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <p className="text-gray-500 mb-4">Your shopping bag is empty.</p>
                <Button variant="outline" onClick={onClose}>Continue Shopping</Button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((item) => (
                  <li key={item.cartId} className="py-6 flex">
                    <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden relative">
                      <img src={item.image} alt={item.name} className="w-full h-full object-center object-cover" />
                      {/* Overlay custom image thumbnail in corner if present */}
                      {item.customImage && (
                        <div className="absolute bottom-0 right-0 w-10 h-10 bg-white border border-gray-200 p-0.5">
                           <img src={item.customImage} className="w-full h-full object-contain" alt="Custom" />
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex-1 flex flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3>{item.name}</h3>
                          <p className="ml-4">${item.price}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 capitalize">{item.selectedColor} / {item.selectedSize}</p>
                        {item.customText && (
                          <p className="mt-1 text-xs text-brand-600 bg-brand-50 p-1 rounded inline-block">
                            "{item.customText}"
                          </p>
                        )}
                        {item.customImage && (
                           <p className="mt-1 text-xs text-purple-600 bg-purple-50 p-1 rounded inline-block">
                            + Custom Design
                           </p>
                        )}
                      </div>
                      <div className="flex-1 flex items-end justify-between text-sm">
                        <p className="text-gray-500">Qty {item.quantity}</p>
                        <button 
                          type="button" 
                          onClick={() => {
                            if (window.confirm("Are you sure you want to remove this item from your cart? / 您确定要从购物车中移除此商品吗？")) {
                              onRemove(item.cartId);
                            }
                          }}
                          className="font-medium text-red-500 hover:text-red-600 flex items-center gap-1"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-gray-100 px-6 py-6 bg-gray-50">
            <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
              <p>Subtotal</p>
              <p>${total.toFixed(2)}</p>
            </div>
            <p className="mt-0.5 text-sm text-gray-500 mb-6">Shipping and taxes calculated at checkout.</p>
            <Button fullWidth onClick={() => {
              onClose();
              navigate('/checkout');
            }}>Checkout</Button>
          </div>
        </div>
      </div>
    </div>
  );
};