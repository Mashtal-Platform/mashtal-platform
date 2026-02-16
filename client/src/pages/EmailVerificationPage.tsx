import React, { useState } from 'react';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Page } from '../App';

interface EmailVerificationPageProps {
  onNavigate: (page: Page) => void;
}

export function EmailVerificationPage({ onNavigate }: EmailVerificationPageProps) {
  const { verifyEmail } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const verified = await verifyEmail(verificationCode);
      if (verified) {
        setSuccess(true);
        setTimeout(() => {
          onNavigate('home');
        }, 2000);
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    // TODO: Implement resend verification email
    alert('Verification code resent!');
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
            <p className="text-neutral-600">Your account has been successfully verified.</p>
            <p className="text-sm text-neutral-500 mt-4">Redirecting to home page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Verify Your Email</h1>
            <p className="text-neutral-600">
              We've sent a 6-digit verification code to your email address. Please enter it below.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Code Input */}
          <div className="flex gap-2 justify-center mb-6">
            {code.map((digit, index) => (
              <Input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                className="w-12 h-14 text-center text-xl font-semibold"
              />
            ))}
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            className="w-full mb-4"
            disabled={loading || code.some((d) => !d)}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </Button>

          {/* Resend Link */}
          <div className="text-center">
            <p className="text-sm text-neutral-600">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Resend
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
