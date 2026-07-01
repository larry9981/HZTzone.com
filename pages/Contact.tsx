import React, { useState } from 'react';
import { Mail, MapPin, Phone, MessageSquare, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useApp } from '../components/AppContext';
import { api } from '../services/api';

export const Contact: React.FC = () => {
  const { contactInfo } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.submitContactMessage(formData);
      showToast("Thank you for contacting us! Your message was sent successfully. We will get back to you within 24 hours.", "success");
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      showToast(err.message || "Failed to send message. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">Get in Touch</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Have a question about your custom order? Need help with a design? We're here to help bring your stories to life.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Info & FAQ */}
        <div className="space-y-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex flex-col items-start p-6 bg-brand-50 rounded-xl">
              <div className="p-3 bg-white rounded-full shadow-sm text-brand-600 mb-4">
                <Mail size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Email Us</h3>
              <p className="text-sm text-gray-500 mb-2">For general inquiries and support.</p>
              <a href={`mailto:${contactInfo.email}`} className="text-brand-600 font-medium hover:underline">{contactInfo.email}</a>
            </div>

            <div className="flex flex-col items-start p-6 bg-[#25D366]/10 rounded-xl">
              <div className="p-3 bg-white text-[#25D366] rounded-full shadow-sm mb-4">
                <MessageSquare size={24} />
              </div>
              <h3 className="font-semibold text-gray-950 mb-1">WhatsApp Us</h3>
              <p className="text-sm text-gray-650 mb-2">Mon-Fri from 9am to 6pm EST.</p>
              <a href={`https://wa.me/${contactInfo.phone ? contactInfo.phone.replace(/[^0-9]/g, '') : ''}`} target="_blank" rel="noopener noreferrer" className="text-[#25D366] font-extrabold hover:underline flex items-center gap-1">
                Chat on WhatsApp
              </a>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
            <h3 className="text-xl font-serif font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">How long does shipping take?</h4>
                <p className="text-sm text-gray-500">Since every item is custom-made, production takes 2-4 business days. Shipping usually takes an additional 5-7 business days depending on your location.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Can I return a custom item?</h4>
                <p className="text-sm text-gray-500">Because our products are personalized just for you, we cannot accept returns for buyer's remorse. However, if your item arrives damaged or with a printing error, we will replace it free of charge.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Where are you located?</h4>
                <p className="text-sm text-gray-500">Our design studio is located at {contactInfo.address}. We work with printing partners globally to ensure fast delivery.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6">Send us a Message</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
              >
                <option value="">Select a topic...</option>
                <option value="order">Order Status</option>
                <option value="product">Product Question</option>
                <option value="bulk">Bulk Order</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                id="message"
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none"
                placeholder="How can we help you today?"
              ></textarea>
            </div>

            <Button type="submit" disabled={submitting} fullWidth size="lg" className="flex items-center justify-center gap-2">
              {submitting ? 'Sending Message...' : 'Send Message'} <Send size={18} />
            </Button>
          </form>
        </div>
      </div>

      {/* Floating feedback notification toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-white border border-neutral-100 rounded-3xl p-4 shadow-xl flex items-start gap-3 animate-fade-in">
          {toast.type === 'success' ? (
            <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={20} />
          ) : (
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
          )}
          <div>
            <p className="font-bold text-neutral-850 text-xs uppercase tracking-wide">
              {toast.type === 'success' ? 'Message Sent' : 'Submission Failed'}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1 leading-normal">
              {toast.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};