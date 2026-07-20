import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiPost } from '../shared/api/client';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface SeeTranslationProps {
  text: string;
  className?: string;
}

/**
 * Instagram-style "See translation" for user-generated content.
 * Translates into the user's current UI language via Azure Translator.
 */
export function SeeTranslation({ text, className = '' }: SeeTranslationProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [translated, setTranslated] = useState<string | null>(null);
  const [showingTranslation, setShowingTranslation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notNeeded, setNotNeeded] = useState(false);

  useEffect(() => {
    setTranslated(null);
    setShowingTranslation(false);
    setError(null);
    setNotNeeded(false);
  }, [text, language]);

  const trimmed = (text || '').trim();
  if (!trimmed || trimmed.length < 2) return null;
  if (!isAuthenticated) return null;
  if (notNeeded && !showingTranslation) return null;

  const handleClick = async () => {
    if (showingTranslation) {
      setShowingTranslation(false);
      return;
    }

    if (translated != null) {
      setShowingTranslation(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await apiPost<{
        translatedText: string;
        from?: string | null;
        to: string;
        translated?: boolean;
      }>('/translate', { text: trimmed, to: language });

      if (result.translated === false || result.translatedText === trimmed) {
        setNotNeeded(true);
        setTranslated(null);
        return;
      }

      setTranslated(result.translatedText);
      setShowingTranslation(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('common.translationFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {showingTranslation && translated && (
        <p className="text-neutral-600 text-sm mt-1 whitespace-pre-wrap border-s-2 border-green-200 ps-2">
          {translated}
        </p>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="text-xs text-neutral-500 hover:text-green-700 font-medium mt-1 transition-colors disabled:opacity-60"
      >
        {loading
          ? t('common.translating')
          : showingTranslation
            ? t('common.seeOriginal')
            : t('common.seeTranslation')}
      </button>
    </div>
  );
}
