import React from 'react';
import { ArrowLeft, Sprout } from 'lucide-react';
import { Page } from '../App';

export type InfoPageKind = 'about' | 'privacy' | 'terms' | 'cookies';

interface InfoPageProps {
  kind: InfoPageKind;
  onNavigate: (page: Page) => void;
}

const TITLES: Record<InfoPageKind, string> = {
  about: 'About Mashtal',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  cookies: 'Cookie Policy',
};

export function InfoPage({ kind, onNavigate }: InfoPageProps) {
  return (
    <div className="min-h-[70vh] bg-neutral-50 py-10 sm:py-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-green-600 rounded-lg flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl text-neutral-900 font-semibold">{TITLES[kind]}</h1>
          </div>

          <div className="prose prose-neutral max-w-none text-neutral-700 space-y-4 text-base leading-relaxed">
            {kind === 'about' && <AboutContent onNavigate={onNavigate} />}
            {kind === 'privacy' && <PrivacyContent />}
            {kind === 'terms' && <TermsContent />}
            {kind === 'cookies' && <CookiesContent />}
          </div>

          <p className="mt-8 text-sm text-neutral-500">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}

function AboutContent({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <>
      <p>
        Mashtal is an agricultural community platform that connects farmers, nurseries, and
        agribusinesses. Discover trusted providers, share posts and threads, shop products, and get
        plant-care guidance from our AI assistant.
      </p>
      <p>
        Our mission is to make sustainable farming knowledge and marketplace access simpler across
        Lebanon and the region.
      </p>
      <ul className="list-disc pl-5 space-y-2">
        <li>Browse verified businesses and products</li>
        <li>Follow providers and join community discussions</li>
        <li>Register your business and reach more customers</li>
      </ul>
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={() => onNavigate('businesses')}
          className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
        >
          Explore businesses
        </button>
        <button
          type="button"
          onClick={() => onNavigate('register-business')}
          className="px-4 py-2 rounded-lg border border-green-600 text-green-700 hover:bg-green-50"
        >
          Register your business
        </button>
      </div>
      <p className="pt-2">
        Contact:{' '}
        <a className="text-green-700 underline" href="mailto:support@mashtal.com">
          support@mashtal.com
        </a>
      </p>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <p>
        Mashtal respects your privacy. This policy explains what information we collect and how we
        use it when you use the Mashtal platform.
      </p>
      <h2 className="text-lg font-semibold text-neutral-900 pt-2">Information we collect</h2>
      <p>
        Account details (name, email, phone), profile content you publish, orders and payment-related
        records handled by our payment providers, and basic usage data needed to operate the service.
      </p>
      <h2 className="text-lg font-semibold text-neutral-900 pt-2">How we use information</h2>
      <p>
        To provide accounts, messaging, marketplace features, content moderation, customer support,
        and to improve Mashtal. We do not sell your personal information.
      </p>
      <h2 className="text-lg font-semibold text-neutral-900 pt-2">Your choices</h2>
      <p>
        You may update profile information in your account settings and contact us at{' '}
        <a className="text-green-700 underline" href="mailto:support@mashtal.com">
          support@mashtal.com
        </a>{' '}
        for privacy requests.
      </p>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <p>
        By using Mashtal you agree to use the platform lawfully, respect other users, and follow our
        community guidelines. Businesses are responsible for the accuracy of their listings and
        fulfillment of orders.
      </p>
      <h2 className="text-lg font-semibold text-neutral-900 pt-2">Accounts</h2>
      <p>
        You must provide accurate registration information and keep your credentials secure. We may
        suspend accounts that violate these terms or harm the community.
      </p>
      <h2 className="text-lg font-semibold text-neutral-900 pt-2">Content</h2>
      <p>
        You retain rights to content you post. You grant Mashtal a license to display that content on
        the platform. Illegal, abusive, or unsafe content may be removed by moderation.
      </p>
      <h2 className="text-lg font-semibold text-neutral-900 pt-2">Contact</h2>
      <p>
        Questions about these terms:{' '}
        <a className="text-green-700 underline" href="mailto:support@mashtal.com">
          support@mashtal.com
        </a>
      </p>
    </>
  );
}

function CookiesContent() {
  return (
    <>
      <p>
        Mashtal uses cookies and similar storage (such as local browser storage) to keep you signed
        in, remember preferences like your cart, and keep the site working securely.
      </p>
      <h2 className="text-lg font-semibold text-neutral-900 pt-2">Essential storage</h2>
      <p>
        Authentication tokens and cart data are stored locally so core features work. These are
        required for the service and are not used for third-party advertising.
      </p>
      <h2 className="text-lg font-semibold text-neutral-900 pt-2">Managing cookies</h2>
      <p>
        You can clear site data in your browser settings. Doing so may sign you out or clear your
        cart. For questions, email{' '}
        <a className="text-green-700 underline" href="mailto:support@mashtal.com">
          support@mashtal.com
        </a>
        .
      </p>
    </>
  );
}
