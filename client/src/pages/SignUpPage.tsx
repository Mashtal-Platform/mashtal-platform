import React, { useState } from 'react';
import { ArrowLeft, User, HardHat, Building2, Mail, Lock, Phone, MapPin, CheckCircle2, Eye, EyeOff, Users, Tractor, Store, Loader2, Leaf, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Page } from '../App';

interface SignUpPageProps {
  onNavigate: (page: Page) => void;
  onSignInClick: () => void;
  onVerificationNeeded: () => void;
  onPaymentNeeded: (role: UserRole) => void;
}

export function SignUpPage({ onNavigate, onSignInClick, onVerificationNeeded, onPaymentNeeded }: SignUpPageProps) {
  const { signUp, signInWithGoogle } = useAuth();
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(formData.email, formData.password, formData.fullName, selectedRole);
      
      // If Engineer or Business, redirect to payment
      if (selectedRole === 'engineer' || selectedRole === 'business') {
        onPaymentNeeded(selectedRole);
      } else {
        // If Visitor, go to email verification
        onVerificationNeeded();
      }
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      
      // After Google sign-up, still need to select role and payment for Engineer/Business
      if (selectedRole === 'engineer' || selectedRole === 'business') {
        onPaymentNeeded(selectedRole);
      } else {
        onNavigate('home');
      }
    } catch (err) {
      setError('Failed to sign up with Google');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'role') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-neutral-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">M</span>
              </div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Join Mashtal</h1>
              <p className="text-neutral-600">Choose your account type</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Visitor */}
              <button
                onClick={() => handleRoleSelect('visitor')}
                className="p-6 border-2 border-neutral-200 rounded-xl hover:border-green-600 hover:bg-green-50 transition-all group"
              >
                <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-neutral-200 transition-colors">
                  <User className="w-6 h-6 text-neutral-600" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">Visitor</h3>
                <p className="text-sm text-neutral-600 mb-3">Browse and follow experts & businesses</p>
                <div className="text-xs text-neutral-500 bg-neutral-50 rounded-lg p-2">
                  <strong>Free</strong> - Email verification required
                </div>
              </button>

              {/* Agronomist */}
              <button
                onClick={() => handleRoleSelect('agronomist')}
                className="p-6 border-2 border-neutral-200 rounded-xl hover:border-green-600 hover:bg-green-50 transition-all group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <Leaf className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">Agronomist</h3>
                <p className="text-sm text-neutral-600 mb-3">Share expertise on crops & soil</p>
                <div className="text-xs text-green-600 bg-green-50 rounded-lg p-2 font-medium">
                  <strong>Paid Account</strong> - Verification required
                </div>
              </button>

              {/* Engineer */}
              <button
                onClick={() => handleRoleSelect('engineer')}
                className="p-6 border-2 border-neutral-200 rounded-xl hover:border-green-600 hover:bg-green-50 transition-all group"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                  <HardHat className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">Engineer</h3>
                <p className="text-sm text-neutral-600 mb-3">Irrigation & farm systems</p>
                <div className="text-xs text-green-600 bg-green-50 rounded-lg p-2 font-medium">
                  <strong>Paid Account</strong> - Verification required
                </div>
              </button>

              {/* Business */}
              <button
                onClick={() => handleRoleSelect('business')}
                className="p-6 border-2 border-neutral-200 rounded-xl hover:border-green-600 hover:bg-green-50 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">Business</h3>
                <p className="text-sm text-neutral-600 mb-3">Sell products & manage business</p>
                <div className="text-xs text-green-600 bg-green-50 rounded-lg p-2 font-medium">
                  <strong>Paid Account</strong> - Verification required
                </div>
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSignInClick}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
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
            <button
              onClick={() => setStep('role')}
              className="text-sm text-neutral-600 hover:text-green-600 mb-4 inline-block"
            >
              ← Back to account type
            </button>
            <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              {selectedRole === 'visitor' && <User className="w-8 h-8 text-white" />}
              {selectedRole === 'agronomist' && <Leaf className="w-8 h-8 text-white" />}
              {selectedRole === 'engineer' && <HardHat className="w-8 h-8 text-white" />}
              {selectedRole === 'business' && <Building2 className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Create Account</h1>
            <p className="text-neutral-600">
              {selectedRole === 'visitor' && 'Free account with email verification'}
              {selectedRole === 'engineer' && 'Professional account - Payment required'}
              {selectedRole === 'business' && 'Business account - Payment required'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Google Sign Up */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-6"
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            <Chrome className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-neutral-500">Or continue with email</span>
            </div>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Ahmed Al-Mansour"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <p className="text-xs text-neutral-500 text-center mt-4">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}