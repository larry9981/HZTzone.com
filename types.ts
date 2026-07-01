export enum ProductCategory {
  WOMEN = 'women',
  MEN = 'men',
  MUGS = 'mugs',
  NEW_ARRIVALS = 'new-arrivals'
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number; // For strikethrough sale price
  category: ProductCategory;
  image: string;
  images: string[];
  rating: number;
  reviews: number;
  isCustomizable: boolean;
  description: string;
  sku: string; // SKU编号
  supplier?: string; // 供应商名称
  hasVariants?: boolean; // 变体开关是否开启
  colors?: string[]; // Variant category: colors
  sizes?: string[]; // Variant category: sizes
  richText?: string; // 图文混排 rich text or HTML content
  faqs?: FAQItem[]; // 问答模版
  youtubeEmbedCode?: string;
  ratingReviews?: any[];
  packageSize?: string; // 包装大小
  weight?: string; // 重量
}

export interface CartItem extends Product {
  cartId: string;
  selectedSize?: string;
  selectedColor?: string;
  customText?: string; // For POD text
  customImage?: string; // For POD image (base64)
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, options: { size?: string; color?: string; customText?: string; customImage?: string }) => void;
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  isCartOpen: boolean;
  cartTotal: number;
}