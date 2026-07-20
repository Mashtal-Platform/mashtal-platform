import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Page } from '../App';

interface SignInPageProps {
  onNavigate: (page: Page) => void;
  onSignUpClick: () => void;
}

export function SignInPage({ onNavigate, onSignUpClick }: SignInPageProps) {
  const { t } = useTranslation();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      onNavigate('home');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      const code = err?.response?.data?.code;
      setError(
        code === 'EMAIL_NOT_VERIFIED' && msg
          ? msg
          : msg || t('auth.invalidCredentials')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (credential?: string) => {
    setError('');
    setLoading(true);

    try {
      if (!credential) throw new Error('Google did not return a credential');
      await signInWithGoogle(credential);
      onNavigate('home');
    } catch (err: any) {
      setError(err?.message || t('auth.googleFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">M</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">{t('auth.welcomeBack')}</h1>
            <p className="text-neutral-600">{t('auth.signInSubtitle')}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Google Sign In */}
          <div className={`mb-6 flex justify-center ${loading ? 'pointer-events-none opacity-60' : ''}`}>
            <GoogleLogin
              onSuccess={(response) => handleGoogleSignIn(response.credential)}
              onError={() => setError(t('auth.googleCancelled'))}
              text="continue_with"
              shape="rectangular"
              size="large"
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-neutral-500">{t('auth.orEmail')}</span>
            </div>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{t('auth.email')}</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-neutral-300" />
                <span className="text-neutral-600">{t('auth.rememberMe')}</span>
              </label>
              <button type="button" className="text-green-600 hover:text-green-700">
                {t('auth.forgotPassword')}
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('auth.signingIn')}
                </>
              ) : (
                t('auth.signIn')
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              {t('auth.noAccount')}{' '}
              <button
                type="button"
                onClick={onSignUpClick}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                {t('auth.signUp')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
