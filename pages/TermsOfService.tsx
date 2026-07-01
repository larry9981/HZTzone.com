import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../components/AppContext';

export const TermsOfService: React.FC = () => {
  const { pagesContent } = useApp();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12 border-b border-gray-200 pb-8">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-gray-500">Effective Date: June 1, 2024</p>
      </div>

      {pagesContent?.terms && (
        <div className="bg-brand-50 border border-brand-100 rounded-3xl p-8 text-neutral-800 space-y-2 mb-10 text-left">
          <h2 className="text-lg font-serif font-bold text-brand-900">Custom Terms & Conditions</h2>
          <p className="text-sm font-medium leading-relaxed">
            {pagesContent.terms}
          </p>
        </div>
      )}

      <div className="space-y-10 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. Overview</h2>
          <p className="mb-4">
            This website is operated by Memoria. Throughout the site, the terms “we”, “us” and “our” refer to Memoria. Memoria offers this website, including all information, tools and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies and notices stated here.
          </p>
          <p className="mb-4">
            By visiting our site and/ or purchasing something from us, you engage in our “Service” and agree to be bound by the following terms and conditions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. Personalized Products (POD) Policy</h2>
          <p className="mb-4">
            <strong>Customization:</strong> You are responsible for ensuring that all spelling, grammar, and design placement on personalized products are correct before submitting your order. We print exactly what is submitted.
          </p>
          <p className="mb-4">
            <strong>Content Guidelines:</strong> We reserve the right to refuse to print any content that constitutes hate speech, infringes on intellectual property rights, or is deemed offensive or inappropriate at our sole discretion.
          </p>
          <p className="mb-4">
            <strong>Color Variations:</strong> Please note that due to different monitor settings and printing techniques (DTG, sublimation), the colors of the final product may vary slightly from what you see on your screen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">3. Returns and Refunds</h2>
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-4">
            <h3 className="font-semibold text-red-800 mb-2">Important Notice for Custom Items</h3>
            <p className="text-sm text-red-700">
              Because our products are made-to-order and personalized specifically for you, <strong>we do not accept returns or exchanges for buyer's remorse, wrong size selection, or incorrect text entered by the customer.</strong>
            </p>
          </div>
          <p className="mb-4">
            <strong>Defective Items:</strong> If you receive a defective item or a print error, please contact us within 30 days of delivery. We will happily send a free replacement. Please submit photos of the issue to support@memoria.com.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">4. Shipping and Delivery</h2>
          <p className="mb-4">
            <strong>Production Time:</strong> All orders require 2-5 business days for printing and quality control before shipping.
          </p>
          <p className="mb-4">
            <strong>Shipping Time:</strong> Standard shipping typically takes 5-10 business days depending on the destination. Memoria is not responsible for delays caused by customs or carrier issues.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">5. Intellectual Property Rights</h2>
          <p className="mb-4">
            By submitting an image or design for printing, you represent and warrant that you have the lawful right to reproduce and distribute such content. You agree to indemnify and hold Memoria harmless from any legal actions related to copyright or trademark infringement arising from your custom designs.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">6. Contact Information</h2>
          <p className="mb-4">
            Questions about the Terms of Service should be sent to us at <Link to="/contact" className="text-brand-600 underline">support@memoria.com</Link>.
          </p>
        </section>
      </div>
    </div>
  );
};