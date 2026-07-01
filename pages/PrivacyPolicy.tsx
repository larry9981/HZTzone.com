import React from 'react';
import { useApp } from '../components/AppContext';

export const PrivacyPolicy: React.FC = () => {
  const { pagesContent } = useApp();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12 border-b border-gray-200 pb-8">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-500">Last updated: June 1, 2024</p>
      </div>

      {pagesContent?.privacy && (
        <div className="bg-brand-50 border border-brand-100 rounded-3xl p-8 text-neutral-800 space-y-2 mb-10">
          <h2 className="text-lg font-serif font-bold text-brand-900">Custom Privacy Directive</h2>
          <p className="text-sm font-medium leading-relaxed">
            {pagesContent.privacy}
          </p>
        </div>
      )}

      <div className="space-y-10 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. Introduction</h2>
          <p className="mb-4">
            Welcome to Memoria ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. The Data We Collect About You</h2>
          <p className="mb-4">
            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
            <li><strong>Contact Data:</strong> includes billing address, delivery address, email address and telephone numbers.</li>
            <li><strong>Financial Data:</strong> includes payment card details (note: we do not store full credit card numbers; these are processed by our secure payment providers).</li>
            <li><strong>Transaction Data:</strong> includes details about payments to and from you and other details of products you have purchased from us.</li>
            <li><strong>Customization Data:</strong> includes photos, text, and other content you upload to personalize products.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">3. How We Use Your Personal Data</h2>
          <p className="mb-4">
            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>To perform the contract we are about to enter into or have entered into with you (e.g., fulfilling your custom order).</li>
            <li>To process and deliver your order including managing payments, fees and charges.</li>
            <li>To manage our relationship with you which will include notifying you about changes to our terms or privacy policy.</li>
            <li>To use data analytics to improve our website, products/services, marketing, customer relationships and experiences.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">4. Custom Content & Intellectual Property</h2>
          <p className="mb-4">
            When you upload photos or text for product customization, you grant Memoria a non-exclusive license to use this content solely for the purpose of fulfilling your order. We do not use your personal photos for marketing materials without your explicit written consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">5. Cookies and Tracking Technologies</h2>
          <p className="mb-4">
            We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service (e.g., the shopping cart functionality).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">6. Third-Party Links</h2>
          <p className="mb-4">
            This website may include links to third-party websites, plug-ins and applications. Clicking on those links or enabling those connections may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">7. Contact Details</h2>
          <p className="mb-4">
            If you have any questions about this privacy policy or our privacy practices, please contact us at:
          </p>
          <p className="font-semibold">
            Memoria Privacy Team<br/>
            Email: privacy@memoria.com<br/>
            Address: 123 Fashion Ave, NY
          </p>
        </section>
      </div>
    </div>
  );
};