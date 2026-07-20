import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { apiPut } from '../shared/api/client';
import { useAuth } from './AuthContext';
import {
  AppLanguage,
  LANG_STORAGE_KEY,
  applyDocumentLanguage,
} from '../i18n';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  toggleLanguage: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const syncedUserId = useRef<string | null>(null);

  const language: AppLanguage = i18n.language?.startsWith('ar') ? 'ar' : 'en';

  // Sync from logged-in user's preference once per user session
  useEffect(() => {
    if (!user?.id) {
      syncedUserId.current = null;
      return;
    }
    if (syncedUserId.current === user.id) return;
    const preferred = user.preferredLanguage;
    if (preferred === 'ar' || preferred === 'en') {
      syncedUserId.current = user.id;
      if (preferred !== language) {
        void i18n.changeLanguage(preferred);
        applyDocumentLanguage(preferred);
        try {
          localStorage.setItem(LANG_STORAGE_KEY, preferred);
        } catch {
          /* ignore */
        }
      }
    }
  }, [user?.id, user?.preferredLanguage, language, i18n]);

  const setLanguage = useCallback(
    async (lang: AppLanguage) => {
      await i18n.changeLanguage(lang);
      applyDocumentLanguage(lang);
      try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
      } catch {
        /* ignore */
      }
      if (isAuthenticated) {
        try {
          await apiPut('/users/me', { preferredLanguage: lang });
          syncedUserId.current = user?.id ?? syncedUserId.current;
          await refreshUser();
        } catch (err) {
          console.error('[Language] Failed to persist preferredLanguage', err);
        }
      }
      try {
        window.dispatchEvent(new CustomEvent('mashtal:language-changed', { detail: { lang } }));
      } catch {
        /* ignore */
      }
    },
    [i18n, isAuthenticated, refreshUser, user?.id]
  );

  const toggleLanguage = useCallback(async () => {
    await setLanguage(language === 'ar' ? 'en' : 'ar');
  }, [language, setLanguage]);

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage }),
    [language, setLanguage, toggleLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
