import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, Loader2, Link2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Page } from '../App';

interface EmailVerificationPageProps {
  onNavigate: (page: Page) => void;
}

function getTokenFromHash(): string | null {
  const hash = window.location.hash || '';
  const match = hash.match(/verify-email\?token=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Extract token from pasted URL or use raw string as token */
function parseTokenFromInput(value: string): string {
  const trimmed = value.trim();
  const urlMatch = trimmed.match(/token=([^&\s]+)/);
  if (urlMatch) return decodeURIComponent(urlMatch[1]);
  return trimmed;
}

export function EmailVerificationPage({ onNavigate }: EmailVerificationPageProps) {
  const { verifyEmail } = useAuth();
  const [linkOrToken, setLinkOrToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checkedHash, setCheckedHash] = useState(false);

  useEffect(() => {
    if (checkedHash) return;
    setCheckedHash(true);
    const tokenFromUrl = getTokenFromHash();
    if (!tokenFromUrl) return;

    setLoading(true);
    setError('');
    verifyEmail(tokenFromUrl)
      .then((ok) => {
        if (ok) {
          setSuccess(true);
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          setTimeout(() => onNavigate('home'), 2000);
        } else {
          setError('Invalid or expired verification link. Please request a new one.');
        }
      })
      .catch(() => setError('Verification failed. Please try again.'))
      .finally(() => setLoading(false));
  }, [checkedHash, verifyEmail, onNavigate]);

  const handleVerifyByPaste = async () => {
    const token = parseTokenFromInput(linkOrToken);
    if (!token) {
      setError('Please paste the verification link from your email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const verified = await verifyEmail(token);
      if (verified) {
        setSuccess(true);
        setTimeout(() => onNavigate('home'), 2000);
      } else {
        setError('Invalid or expired link. Please use the latest link from your email.');
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    // TODO: Implement resend verification email API
    alert('If you did not receive the email, check your spam folder. You can sign up again with the same email to receive a new link.');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-neutral-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Email Verified!</h1>
            <p className="text-neutral-600">Your account is now verified. You can use all features.</p>
            <p className="text-sm text-neutral-500 mt-4">Redirecting to home...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Verify Your Email</h1>
            <p className="text-neutral-600">
              We sent a verification link to your email. Click the link in the message to verify your account and sign in.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Link2 className="w-4 h-4 inline-block mr-1 align-middle" />
              Or paste the verification link here
            </label>
            <Input
              type="text"
              value={linkOrToken}
              onChange={(e) => setLinkOrToken(e.target.value)}
              placeholder="Paste link from email"
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
                Verifying...
              </>
            ) : (
              'Verify email'
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-neutral-600">
              Didn&apos;t receive the email?{' '}
              <button
                type="button"
                onClick={handleResend}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Get help
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
