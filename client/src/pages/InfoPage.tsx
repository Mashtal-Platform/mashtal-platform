import React from 'react';
import { ArrowLeft, Sprout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Page } from '../App';

export type InfoPageKind = 'about' | 'privacy' | 'terms' | 'cookies';

interface InfoPageProps {
  kind: InfoPageKind;
  onNavigate: (page: Page) => void;
}

export function InfoPage({ kind, onNavigate }: InfoPageProps) {
  const { t, i18n } = useTranslation();

  const titles: Record<InfoPageKind, string> = {
    about: t('info.aboutTitle'),
    privacy: t('info.privacyTitle'),
    terms: t('info.termsTitle'),
    cookies: t('info.cookiesTitle'),
  };

  return (
    <div className="min-h-[70vh] bg-neutral-50 py-10 sm:py-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('info.backToHome')}
        </button>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-green-600 rounded-lg flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl text-neutral-900 font-semibold">{titles[kind]}</h1>
          </div>

          <div className="prose prose-neutral max-w-none text-neutral-700 space-y-4 text-base leading-relaxed">
            {kind === 'about' && <AboutContent onNavigate={onNavigate} />}
            {kind === 'privacy' && <PrivacyContent />}
            {kind === 'terms' && <TermsContent />}
            {kind === 'cookies' && <CookiesContent />}
          </div>

          <p className="mt-8 text-sm text-neutral-500">
            {t('info.lastUpdated')}{' '}
            {new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar' : 'en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

function AboutContent({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const { t } = useTranslation();
  return (
    <>
      <p>{t('info.aboutP1')}</p>
      <p>{t('info.aboutP2')}</p>
      <ul className="list-disc pl-5 space-y-2">
        <li>{t('info.aboutLi1')}</li>
        <li>{t('info.aboutLi2')}</li>
        <li>{t('info.aboutLi3')}</li>
      </ul>
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={() => onNavigate('businesses')}
          className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
        >
          {t('info.exploreBusinesses')}
        </button>
        <button
          type="button"
          onClick={() => onNavigate('register-business')}
          className="px-4 py-2 rounded-lg border border-green-600 text-green-700 hover:bg-green-50"
        >
          {t('info.registerBusiness')}
        </button>
      </div>
      <p className="pt-2">
        {t('info.contact')}{' '}
        <a className="text-green-700 underline" href="mailto:support@mashtal.com">
          support@mashtal.com
        </a>
      </p>
    </>
  );
}

function PrivacyContent() {
  const { t } = useTranslation();
  return (
    <>
      <p>{t('info.privacyP1')}</p>
      <h2 className="text-lg font-semibold text-neutral-900 pt-2">{t('info.privacyH1')}</h2>
      <p>{t('info.privacyP2')}</p>
      <h2 className="text-lg font-semibold text-neutral-900 pt-2">{t('info.privacyH2')}</h2>
      <p>{t('info.privacyP3')}</p>
      <h2 className="text-lg font-semibold text-neutral-900 pt-2">{t('info.privacyH3')}</h2>
      <p>
        {t('info.privacyP4')}{' '}
        <a className="text-green-700 underline" href="mailto:support@mashtal.com">
          support@mashtal.com
        </a>
      </p>
    </>
  );
}

function TermsContent() {
  const { t } = useTranslation();
  return (
    <>
      <p>{t('info.termsP1')}</p>
      <h2 className="text-lg font-semibold text-neutral-900 pt-2">{t('info.termsH1')}</h2>
      <p>{t('info.termsP2')}</p>
      <h2 className="text-lg font-semibold text-neutral-900 pt-2">{t('info.termsH2')}</h2>
      <p>{t('info.termsP3')}</p>
      <h2 className="text-lg font-semibold text-neutral-900 pt-2">{t('info.termsH3')}</h2>
      <p>
        {t('info.termsP4')}{' '}
        <a className="text-green-700 underline" href="mailto:support@mashtal.com">
          support@mashtal.com
        </a>
      </p>
    </>
  );
}

function CookiesContent() {
  const { t } = useTranslation();
  return (
    <>
      <p>{t('info.cookiesP1')}</p>
      <h2 className="text-lg font-semibold text-neutral-900 pt-2">{t('info.cookiesH1')}</h2>
      <p>{t('info.cookiesP2')}</p>
      <h2 className="text-lg font-semibold text-neutral-900 pt-2">{t('info.cookiesH2')}</h2>
      <p>{t('info.cookiesP3')}</p>
    </>
  );
}
