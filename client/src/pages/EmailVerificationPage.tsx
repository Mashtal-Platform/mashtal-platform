import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, Loader2, Link2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Page } from '../App';

interface EmailVerificationPageProps {
  onNavigate: (page: Page) => void;
  onPaymentNeeded?: (role: 'business') => void;
}

function getTokenFromHash(): string | null {
  const hash = window.location.hash || '';
  const match = hash.match(/verify-email\?token=([^&]+)/);
  if (!match) return null;
  const token = decodeURIComponent(match[1]).trim();
  return isValidVerificationToken(token) ? token : null;
}

function isValidVerificationToken(token: string): boolean {
  // Server tokens are 64-char hex from crypto.randomBytes(32)
  return /^[a-fA-F0-9]{32,128}$/.test(token.trim());
}

/** Extract token from pasted URL or use raw string as token */
function parseTokenFromInput(value: string): string {
  const trimmed = value.trim();
  const urlMatch = trimmed.match(/token=([^&\s#]+)/);
  if (urlMatch) {
    const fromUrl = decodeURIComponent(urlMatch[1]).trim();
    return isValidVerificationToken(fromUrl) ? fromUrl : '';
  }
  return isValidVerificationToken(trimmed) ? trimmed : '';
}

function shouldGoToPayment(needsPayment?: boolean): boolean {
  if (needsPayment) return true;
  try {
    return sessionStorage.getItem('mashtal_after_verify') === 'payment';
  } catch {
    return false;
  }
}

function clearAfterVerifyFlag() {
  try {
    sessionStorage.removeItem('mashtal_after_verify');
  } catch {
    /* ignore */
  }
}

export function EmailVerificationPage({
  onNavigate,
  onPaymentNeeded,
}: EmailVerificationPageProps) {
  const { t } = useTranslation();
  const { verifyEmail, pendingVerificationEmail } = useAuth();
  const [linkOrToken, setLinkOrToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [goToPayment, setGoToPayment] = useState(false);
  const [checkedHash, setCheckedHash] = useState(false);

  const finishAfterVerify = (needsPayment?: boolean) => {
    const paymentNext = shouldGoToPayment(needsPayment);
    clearAfterVerifyFlag();
    setGoToPayment(paymentNext);
    setSuccess(true);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setTimeout(() => {
      if (paymentNext && onPaymentNeeded) {
        onPaymentNeeded('business');
      } else if (paymentNext) {
        onNavigate('payment');
      } else {
        onNavigate('home');
      }
    }, 2000);
  };

  useEffect(() => {
    if (checkedHash) return;
    setCheckedHash(true);
    const tokenFromUrl = getTokenFromHash();
    if (!tokenFromUrl) return;

    setLoading(true);
    setError('');
    verifyEmail(tokenFromUrl)
      .then((result) => {
        if (result.ok) {
          finishAfterVerify(result.needsPayment);
        } else {
          setError(t('auth.invalidLink'));
        }
      })
      .catch(() => setError(t('auth.verificationFailed')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedHash, verifyEmail, onNavigate, onPaymentNeeded, t]);

  const handleVerifyByPaste = async () => {
    const token = parseTokenFromInput(linkOrToken);
    if (!token) {
      setError(t('auth.pasteFullLink'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await verifyEmail(token);
      if (result.ok) {
        finishAfterVerify(result.needsPayment);
      } else {
        setError(t('auth.invalidOrExpiredLink'));
      }
    } catch {
      setError(t('auth.verificationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    alert(t('auth.resendHelp'));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-neutral-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">{t('auth.emailVerified')}</h1>
            <p className="text-neutral-600">
              {goToPayment ? t('auth.emailVerifiedPaymentBody') : t('auth.emailVerifiedBody')}
            </p>
            <p className="text-sm text-neutral-500 mt-4">
              {goToPayment ? t('auth.redirectingPayment') : t('auth.redirectingHome')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">{t('auth.verifyEmailTitle')}</h1>
            <p className="text-neutral-600">
              {pendingVerificationEmail
                ? t('auth.verifyEmailSentTo', { email: pendingVerificationEmail })
                : t('auth.verifyEmailBodyLong')}
            </p>
            <p className="text-sm text-neutral-500 mt-3">{t('auth.verifyEmailPleaseCheck')}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Link2 className="w-4 h-4 inline-block mr-1 align-middle" />
              {t('auth.pasteLink')}
            </label>
            <Input
              type="text"
              value={linkOrToken}
              onChange={(e) => setLinkOrToken(e.target.value)}
              placeholder={t('auth.pasteLinkPlaceholder')}
              className="w-full"
              disabled={loading}
            />
          </div>

          <Button
            onClick={handleVerifyByPaste}
            className="w-full mb-4"
            disabled={loading || !linkOrToken.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('auth.verifying')}
              </>
            ) : (
              t('auth.verifyEmailButton')
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-neutral-600">
              {t('auth.didntReceive')}{' '}
              <button
                type="button"
                onClick={handleResend}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                {t('auth.getHelp')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
