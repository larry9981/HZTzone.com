import { Product } from '../types';

const API_BASE = ''; // Works relative to host since Express proxies Vite or runs on same port

export const api = {
  // Fetch current aggregated server state
  async getState() {
    const res = await fetch(`${API_BASE}/api/state`);
    if (!res.ok) throw new Error('Failed to retrieve server inventory');
    return res.json();
  },

  // Update manageable static pages content
  async updatePagesContent(payload: { shipping: string; returns: string; size_guide: string; privacy: string; terms: string }) {
    const res = await fetch(`${API_BASE}/api/admin/pages-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to preserve pages content properties');
    return data;
  },

  // Update Facebook and Google pixel parameters
  async updatePixelSettings(payload: { facebookPixelId: string; googleTagId: string }) {
    const res = await fetch(`${API_BASE}/api/admin/pixel-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update marketing integration pixel identifiers');
    return data;
  },

  // Auth operations
  async register(payload: any) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async login(payload: any) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async changePassword(payload: any) {
    const res = await fetch(`${API_BASE}/api/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password update failed');
    return data;
  },

  async updateProfile(payload: { userId: string; address?: string; subscribed?: boolean }) {
    const res = await fetch(`${API_BASE}/api/auth/update-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Profile update failed');
    return data;
  },

  // Admin login
  async adminLogin(payload: any) {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Admin credentials incorrect');
    return data;
  },

  async adminChangePassword(payload: any) {
    const res = await fetch(`${API_BASE}/api/admin/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Change admin password failed');
    return data;
  },

  // Admin Category operations
  async addCategory(payload: any) {
    const res = await fetch(`${API_BASE}/api/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add folder category');
    return data;
  },

  async deleteCategory(type: string) {
    const res = await fetch(`${API_BASE}/api/admin/categories/${type}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove category');
    return data;
  },

  // Admin Menu items editing
  async updateNavigation(menus: any[]) {
    const res = await fetch(`${API_BASE}/api/admin/navigation`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menus })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save navigation changes');
    return data;
  },

  // Admin Product upload & deletion
  async uploadProduct(payload: any) {
    const res = await fetch(`${API_BASE}/api/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to serialize product record');
    return data;
  },

  async uploadProductsBulk(products: any[]) {
    const res = await fetch(`${API_BASE}/api/admin/products/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to batch-upload products');
    return data;
  },

  async uploadProductImage(productName: string, imageBase64: string, index: number) {
    const res = await fetch(`${API_BASE}/api/admin/products/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, imageBase64, index })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to sync local image asset to server');
    return data;
  },

  async uploadMedia(base64Data: string, namePrefix: string) {
    const res = await fetch(`${API_BASE}/api/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data, namePrefix })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload media file');
    return data;
  },

  async updateProduct(id: string, payload: any) {
    const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update product details');
    return data;
  },

  async deleteProduct(id: string) {
    const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete product');
    return data;
  },

  async aiWriteProductContent(payload: { type: 'brief' | 'rich'; userPrompt: string; productTitle?: string; productCategory?: string }) {
    const res = await fetch(`${API_BASE}/api/admin/products/ai-write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'AI text generation failed');
    return data;
  },

  // Discount voucher validators
  async addCoupon(payload: any) {
    const res = await fetch(`${API_BASE}/api/admin/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add coupon settings');
    return data;
  },

  async deleteCoupon(code: string) {
    const res = await fetch(`${API_BASE}/api/admin/coupons/${code}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete coupon');
    return data;
  },

  async validateCoupon(code: string) {
    const res = await fetch(`${API_BASE}/api/coupons/validate/${code}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Promo coupon invalid');
    }
    return res.json();
  },

  // EDM lists Subscriptions & Campaign postings
  async subscribeEDM(email: string) {
    const res = await fetch(`${API_BASE}/api/edm/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed subscribing to newsletters');
    return data;
  },

  async loadEDMStats() {
    const res = await fetch(`${API_BASE}/api/admin/edm/subscribers`);
    if (!res.ok) throw new Error('Unresolved marketing logs');
    return res.json();
  },

  async getEDMConfig() {
    const res = await fetch(`${API_BASE}/api/admin/edm/config`);
    if (!res.ok) throw new Error('Failed to fetch EDM SMTP configuration');
    return res.json();
  },

  async saveEDMConfig(payload: any) {
    const res = await fetch(`${API_BASE}/api/admin/edm/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save EDM SMTP configuration');
    return data;
  },

  async sendEDM(payload: { title: string; content: string; recipients?: any[] }) {
    const res = await fetch(`${API_BASE}/api/admin/edm/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed sending EDM newsletter');
    return data;
  },

  async aiDraftNewsletter(topic: string, lang?: string) {
    const res = await fetch(`${API_BASE}/api/admin/edm/draft-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, lang })
    });
    if (!res.ok) throw new Error('AI could not formulate draft.');
    return res.json();
  },

  // Review posting & deletion
  async postReview(productId: string, review: { userName: string; rating: number; comment: string }) {
    const res = await fetch(`${API_BASE}/api/products/${productId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed submitting custom comments feedback');
    return data;
  },

  async deleteReview(productId: string, reviewId: string) {
    const res = await fetch(`${API_BASE}/api/admin/products/${productId}/reviews/${reviewId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete client comment');
    return data;
  },

  // Orders creation and tracking
  async submitOrder(orderPayload: any) {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed submitting order to server database');
    return data;
  },

  async trackOrder(orderId: string, email: string) {
    const res = await fetch(`${API_BASE}/api/orders/track?orderId=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed tracking reference code.');
    return data;
  },

  // AI Chat Assistant
  async askAIChat(payload: { message: string, history?: any[] }) {
    const res = await fetch(`${API_BASE}/api/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed communication with Grobrav AI Studio');
    return data;
  },

  // Cart Sync
  async getCart(userId: string) {
    const res = await fetch(`${API_BASE}/api/cart?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed loading user cart');
    return data;
  },

  async syncCart(userId: string, cartItems: any[]) {
    const res = await fetch(`${API_BASE}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, cartItems })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed updating user cart on server');
    return data;
  },

  // GA track events & metric stats
  async trackGAEvent(eventType: string, details?: any) {
    fetch(`${API_BASE}/api/ga`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, details })
    }).catch(() => {});
  },

  async fetchGAStats() {
    const res = await fetch(`${API_BASE}/api/admin/ga/stats`);
    if (!res.ok) throw new Error('Failed to resolve database metrics logs');
    return res.json();
  },

  // Contact & Brand settings
  async getContactInfo() {
    const res = await fetch(`${API_BASE}/api/contact-info`);
    if (!res.ok) throw new Error('Failed to load contact settings');
    return res.json();
  },

  async updateContactInfo(payload: { email: string; phone: string; address: string; slogan: string }) {
    const res = await fetch(`${API_BASE}/api/admin/contact-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update contact settings');
    return data;
  },

  async generateImage(prompt: string) {
    const res = await fetch(`${API_BASE}/api/gemini/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate image via AI');
    return data;
  },

  async shipOrder(id: string, payload: { carrier: string; trackingNumber: string; status: string }) {
    const res = await fetch(`${API_BASE}/api/admin/orders/${id}/ship`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to confirm order shipment');
    return data;
  },

  async bulkShipOrders(shipments: Array<{ orderId: string; carrier: string; trackingNumber: string; status: string }>) {
    const res = await fetch(`${API_BASE}/api/admin/orders/bulk-ship`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipments })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to bulk import shipping updates');
    return data;
  },

  async getSecurityLogs() {
    const res = await fetch(`${API_BASE}/api/admin/security-logs`);
    if (!res.ok) throw new Error('Failed to fetch security logs');
    return res.json();
  },

  // Contact Us messaging
  async submitContactMessage(payload: { name: string; email: string; subject: string; message: string }) {
    const res = await fetch(`${API_BASE}/api/contact-us/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit message');
    return data;
  },

  async getContactMessages() {
    const res = await fetch(`${API_BASE}/api/admin/contact-us/messages`);
    if (!res.ok) throw new Error('Failed to load messages');
    return res.json();
  },

  async replyContactMessage(id: string, replyText: string) {
    const res = await fetch(`${API_BASE}/api/admin/contact-us/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, replyText })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send support reply');
    return data;
  },

  // Shipping configuration
  async getShippingConfig() {
    const res = await fetch(`${API_BASE}/api/shipping-config`);
    if (!res.ok) throw new Error('Failed to load shipping config');
    return res.json();
  },

  async saveShippingConfig(payload: {
    freeShippingThreshold: number;
    standardShippingFee: number;
    standardDeliveryTime: string;
    expressShippingFee: number;
    expressDeliveryTime: string;
  }) {
    const res = await fetch(`${API_BASE}/api/admin/shipping-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save shipping config');
    return data;
  }
};
