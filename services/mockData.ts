import { Product, ProductCategory } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Custom Soulmate Hoodie',
    price: 49.99,
    originalPrice: 65.00,
    category: ProductCategory.WOMEN,
    image: 'https://picsum.photos/id/338/800/1000',
    images: ['https://picsum.photos/id/338/800/1000', 'https://picsum.photos/id/342/800/1000'],
    rating: 4.8,
    reviews: 124,
    isCustomizable: true,
    description: 'A cozy, premium cotton blend hoodie perfect for couples. Personalize it with your anniversary date or initials.'
  },
  {
    id: '2',
    name: 'Minimalist Line Art Tee',
    price: 29.99,
    category: ProductCategory.WOMEN,
    image: 'https://picsum.photos/id/325/800/1000',
    images: ['https://picsum.photos/id/325/800/1000', 'https://picsum.photos/id/331/800/1000'],
    rating: 4.9,
    reviews: 89,
    isCustomizable: true,
    description: 'Wear your art. Upload your favorite photo to be converted into a stylish line art sketch printed on soft organic cotton.'
  },
  {
    id: '3',
    name: 'Classic Dad Cap',
    price: 24.99,
    category: ProductCategory.MEN,
    image: 'https://picsum.photos/id/177/800/1000',
    images: ['https://picsum.photos/id/177/800/1000'],
    rating: 4.5,
    reviews: 45,
    isCustomizable: true,
    description: 'The everyday essential. Embroider your name or a short phrase on this vintage-wash cotton cap.'
  },
  {
    id: '4',
    name: 'Vintage Photo Mug',
    price: 19.99,
    originalPrice: 25.00,
    category: ProductCategory.MUGS,
    image: 'https://picsum.photos/id/30/800/1000',
    images: ['https://picsum.photos/id/30/800/1000', 'https://picsum.photos/id/42/800/1000'],
    rating: 5.0,
    reviews: 210,
    isCustomizable: true,
    description: 'Start your morning with a memory. High-quality ceramic mug that is microwave and dishwasher safe.'
  },
  {
    id: '5',
    name: 'Urban Streetwear Oversized Tee',
    price: 34.99,
    category: ProductCategory.MEN,
    image: 'https://picsum.photos/id/91/800/1000',
    images: ['https://picsum.photos/id/91/800/1000'],
    rating: 4.7,
    reviews: 112,
    isCustomizable: true,
    description: 'Boxy fit, heavyweight cotton. The perfect canvas for bold statements and graphic prints.'
  },
  {
    id: '6',
    name: 'Magic Color Changing Mug',
    price: 22.99,
    category: ProductCategory.MUGS,
    image: 'https://picsum.photos/id/225/800/1000',
    images: ['https://picsum.photos/id/225/800/1000'],
    rating: 4.6,
    reviews: 76,
    isCustomizable: true,
    description: 'Watch your hidden message appear as you pour hot liquid into this magical heat-sensitive mug.'
  },
];