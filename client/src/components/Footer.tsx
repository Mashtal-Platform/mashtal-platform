import React, { useState } from 'react';
import {
  Sprout,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppState } from '../shared/store/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import type { Page } from '../shared/types';

const SUPPORT_EMAIL = 'support@mashtal.com';
const SUPPORT_PHONE = '+961 71 000 000';
const SUPPORT_PHONE_TEL = '+96171000000';

/** Official social profiles — update when real accounts exist. */
const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/',
  twitter: 'https://twitter.com/',
  instagram: 'https://www.instagram.com/',
  linkedin: 'https://www.linkedin.com/',
} as const;

function FooterLinkButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:text-green-400 transition-colors text-left"
    >
      {children}
    </button>
  );
}

export function Footer() {
  const { state, navigate } = useAppState();
  const { isAuthenticated, user } = useAuth();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const go = (page: Page) => {
    navigate(page);
  };

  const goHomeSection = (sectionId: string) => {
    const scroll = () => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    if (state.currentPage !== 'home') {
      navigate('home');
      window.setTimeout(scroll, 350);
    } else {
      scroll();
    }
  };

  const handleRegisterBusiness = () => {
    if (!isAuthenticated) {
      navigate('signup');
      return;
    }
    if (user?.role === 'business') {
      navigate('dashboard');
      return;
    }
    navigate('register-business');
  };

  const handleSupport = () => {
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Mashtal support')}`;
  };

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSubscribing(true);
    try {
      const key = 'mashtal_newsletter_emails';
      const prev = JSON.parse(localStorage.getItem(key) || '[]');
      const list = Array.isArray(prev) ? prev : [];
      if (!list.includes(email)) {
        list.push(email);
        localStorage.setItem(key, JSON.stringify(list));
      }
      toast.success('You are subscribed to Mashtal updates');
      setNewsletterEmail('');
    } catch {
      toast.error('Could not save your subscription. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div>
            <button
              type="button"
              onClick={() => go('home')}
              className="flex items-center gap-2 mb-4 hover:opacity-90 transition-opacity"
            >
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xl">MASHTAL</span>
            </button>
            <p className="text-neutral-400 mb-4">
              Connecting agricultural communities and empowering sustainable farming across the
              region.
            </p>
            <div className="flex items-center gap-3">
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={SOCIAL_LINKS.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="w-9 h-9 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <FooterLinkButton onClick={() => go('about')}>About Us</FooterLinkButton>
              </li>
              <li>
                <FooterLinkButton onClick={() => goHomeSection('how-it-works')}>
                  How It Works
                </FooterLinkButton>
              </li>
              <li>
                <FooterLinkButton onClick={() => goHomeSection('featured-businesses')}>
                  Featured Businesses
                </FooterLinkButton>
              </li>
              <li>
                <FooterLinkButton onClick={() => goHomeSection('latest-updates')}>
                  Community Updates
                </FooterLinkButton>
              </li>
              <li>
                <FooterLinkButton onClick={() => go('posts')}>Posts & Resources</FooterLinkButton>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white mb-4">For Businesses</h3>
            <ul className="space-y-2">
              <li>
                <FooterLinkButton onClick={handleRegisterBusiness}>
                  Register Your Business
                </FooterLinkButton>
              </li>
              <li>
                <FooterLinkButton onClick={() => go('shopping')}>Marketplace</FooterLinkButton>
              </li>
              <li>
                <FooterLinkButton
                  onClick={() => {
                    if (user?.role === 'business') go('dashboard');
                    else handleRegisterBusiness();
                  }}
                >
                  Business Dashboard
                </FooterLinkButton>
              </li>
              <li>
                <FooterLinkButton onClick={handleSupport}>Support Center</FooterLinkButton>
              </li>
              <li>
                <FooterLinkButton onClick={() => go('businesses')}>
                  Browse Businesses
                </FooterLinkButton>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Lebanon</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <a
                  href={`tel:${SUPPORT_PHONE_TEL}`}
                  className="text-sm hover:text-green-400 transition-colors"
                >
                  {SUPPORT_PHONE}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-sm hover:text-green-400 transition-colors"
                >
                  {SUPPORT_EMAIL}
                </a>
              </li>
            </ul>
            <form className="mt-4" onSubmit={handleNewsletter}>
              <h4 className="text-white text-sm mb-2">Subscribe to Newsletter</h4>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm outline-none focus:border-green-600 transition-colors"
                  autoComplete="email"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-60"
                >
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="pt-6 sm:pt-8 border-t border-neutral-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-neutral-400">
            <div>© {new Date().getFullYear()} Mashtal. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <FooterLinkButton onClick={() => go('privacy')}>Privacy Policy</FooterLinkButton>
              <FooterLinkButton onClick={() => go('terms')}>Terms of Service</FooterLinkButton>
              <FooterLinkButton onClick={() => go('cookies')}>Cookie Policy</FooterLinkButton>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
