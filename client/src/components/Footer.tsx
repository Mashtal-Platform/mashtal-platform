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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      toast.error(t('footer.invalidEmail'));
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
      toast.success(t('footer.subscribed'));
      setNewsletterEmail('');
    } catch {
      toast.error(t('footer.subscribeFailed'));
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
              {t('footer.tagline')}
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
            <h3 className="text-white mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <FooterLinkButton onClick={() => go('about')}>{t('footer.aboutUs')}</FooterLinkButton>
              </li>
              <li>
                <FooterLinkButton onClick={() => goHomeSection('how-it-works')}>
                  {t('footer.howItWorks')}
                </FooterLinkButton>
              </li>
              <li>
                <FooterLinkButton onClick={() => goHomeSection('featured-businesses')}>
                  {t('home.featuredBusinesses')}
                </FooterLinkButton>
              </li>
              <li>
                <FooterLinkButton onClick={() => goHomeSection('latest-updates')}>
                  {t('home.latestUpdates')}
                </FooterLinkButton>
              </li>
              <li>
                <FooterLinkButton onClick={() => go('posts')}>{t('nav.posts')}</FooterLinkButton>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white mb-4">{t('common.business')}</h3>
            <ul className="space-y-2">
              <li>
                <FooterLinkButton onClick={handleRegisterBusiness}>
                  {t('footer.registerBusiness')}
                </FooterLinkButton>
              </li>
              <li>
                <FooterLinkButton onClick={() => go('shopping')}>{t('nav.shop')}</FooterLinkButton>
              </li>
              <li>
                <FooterLinkButton
                  onClick={() => {
                    if (user?.role === 'business') go('dashboard');
                    else handleRegisterBusiness();
                  }}
                >
                  {t('nav.dashboard')}
                </FooterLinkButton>
              </li>
              <li>
                <FooterLinkButton onClick={handleSupport}>{t('footer.support')}</FooterLinkButton>
              </li>
              <li>
                <FooterLinkButton onClick={() => go('businesses')}>
                  {t('home.viewAllBusinesses')}
                </FooterLinkButton>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white mb-4">{t('footer.contactUs')}</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{t('footer.address')}</span>
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
              <h4 className="text-white text-sm mb-2">{t('footer.newsletter')}</h4>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={t('footer.newsletterPlaceholder')}
                  className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm outline-none focus:border-green-600 transition-colors"
                  autoComplete="email"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-60"
                >
                  {t('footer.subscribe')}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="pt-6 sm:pt-8 border-t border-neutral-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-neutral-400">
            <div>© {new Date().getFullYear()} MASHTAL. {t('footer.rights')}</div>
            <div className="flex items-center gap-6">
              <FooterLinkButton onClick={() => go('privacy')}>{t('footer.privacy')}</FooterLinkButton>
              <FooterLinkButton onClick={() => go('terms')}>{t('footer.terms')}</FooterLinkButton>
              <FooterLinkButton onClick={() => go('cookies')}>Cookie Policy</FooterLinkButton>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
