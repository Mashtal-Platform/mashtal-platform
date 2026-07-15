import React, { useState } from 'react';
import { ArrowLeft, User, Building2, Mail, Lock, CheckCircle2, Store, Loader2, Shield, Chrome } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Page } from '../App';
import { PhoneInput } from '../components/PhoneInput';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { LebanonLocationPicker } from '../components/LebanonLocationPicker';
import { BUSINESS_TYPES } from '../shared/constants/business';

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
    phone: '',
    location: '',
    address: '',
    bio: '',
    companyName: '',
    businessType: '',
    contactEmail: '',
    website: '',
    wishPhone: '',
    wishAccountNumber: '',
    specialization: '',
    yearsExperience: '',
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

    const phone = formData.phone?.trim() ?? '';
    if (selectedRole === 'business') {
      if (!formData.companyName.trim()) {
        setError('Business name is required');
        return;
      }
      if (!formData.businessType.trim()) {
        setError('Business type is required');
        return;
      }
      if (!formData.bio.trim()) {
        setError('Business description is required');
        return;
      }
      if (!formData.location.trim()) {
        setError('City / village is required');
        return;
      }
      if (!phone) {
        setError('Contact phone is required');
        return;
      }
      if (!formData.wishPhone.trim()) {
        setError('Whish Money phone is required for receiving payouts');
        return;
      }
    }
    if (phone) {
      const parsed = parsePhoneNumberFromString(phone, 'LB');
      if (!parsed?.isValid()) {
        setError('Please enter a valid phone number (example: +961 70 123 456).');
        return;
      }
    }
    if (formData.wishPhone.trim()) {
      const parsedWish = parsePhoneNumberFromString(formData.wishPhone.trim(), 'LB');
      if (!parsedWish?.isValid()) {
        setError('Please enter a valid Whish phone (example: +961 70 123 456).');
        return;
      }
    }
    if (formData.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail.trim())) {
      setError('Business contact email is invalid');
      return;
    }

    setLoading(true);

    try {
      if (!selectedRole) throw new Error('Role is required');

      const base = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: selectedRole,
      } as const;

      const input =
        selectedRole === 'business'
          ? {
              ...base,
              businessProfile: {
                phone: formData.phone.trim(),
                location: formData.location.trim(),
                address: formData.address.trim() || undefined,
                bio: formData.bio.trim(),
                companyName: formData.companyName.trim(),
                specialties: formData.businessType ? [formData.businessType] : [],
                contactEmail: formData.contactEmail.trim() || undefined,
                website: formData.website.trim() || undefined,
                wishPhone: formData.wishPhone.trim(),
                wishAccountNumber: formData.wishAccountNumber.trim() || undefined,
              },
            }
          : base;

      await signUp(input as any);

      if (selectedRole === 'business') {
        onPaymentNeeded('business');
      } else {
        onVerificationNeeded();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create account. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      
      // After Google sign-up, continue to verification / home (payment later)
      if (selectedRole === 'business') {
        onVerificationNeeded();
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

            <div className="grid md:grid-cols-2 gap-4 max-w-lg mx-auto">
              {/* Visitor */}
              <button
                onClick={() => handleRoleSelect('visitor')}
                className="p-6 border-2 border-neutral-200 rounded-xl hover:border-green-600 hover:bg-green-50 transition-all group"
              >
                <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-neutral-200 transition-colors">
                  <User className="w-6 h-6 text-neutral-600" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">Visitor</h3>
                <p className="text-sm text-neutral-600 mb-3">Browse, follow businesses, and engage with the community</p>
                <div className="text-xs text-neutral-500 bg-neutral-50 rounded-lg p-2">
                  <strong>Free</strong> - Email verification required
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
                  <strong>Business</strong> - Email verification required
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
      <div className={`w-full ${selectedRole === 'business' ? 'max-w-2xl' : 'max-w-md'}`}>
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
              {selectedRole === 'business' && <Building2 className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Create Account</h1>
            <p className="text-neutral-600">
              {selectedRole === 'visitor' && 'Free account with email verification'}
              {selectedRole === 'business' && 'Business account — verify your email to continue'}
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

            {/* Role-specific profile fields */}
            {selectedRole === 'business' && (
              <>
                <p className="text-sm text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
                  Fields marked * are required to sell on Mashtal.
                </p>

                <div>
                  <Label htmlFor="companyName">Business Name *</Label>
                  <div className="relative mt-1">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Green Valley Nursery"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="businessType">Business Type *</Label>
                  <select
                    id="businessType"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none focus:border-green-600 bg-white"
                    required
                  >
                    <option value="">Select type</option>
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="bio">Description *</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell customers about your business..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address">Street address (optional)</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="Street address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <LebanonLocationPicker
                    label="City / Village (Lebanon) *"
                    value={formData.location}
                    required
                    placeholder="Search city or village…"
                    onChange={(v) => setFormData({ ...formData, location: v })}
                  />
                </div>

                <PhoneInput
                  label="Contact phone *"
                  value={formData.phone}
                  required
                  defaultCountry="LB"
                  placeholder="e.g. +961 70 123 456"
                  onChange={(v) => setFormData({ ...formData, phone: v })}
                />

                <div>
                  <Label htmlFor="contactEmail">Business contact email (optional)</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="info@business.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Public email for customers (login email is above)</p>
                </div>

                <PhoneInput
                  label="Whish Money phone * (payouts)"
                  value={formData.wishPhone}
                  required
                  defaultCountry="LB"
                  placeholder="Whish wallet phone"
                  onChange={(v) => setFormData({ ...formData, wishPhone: v })}
                />

                <div>
                  <Label htmlFor="wishAccountNumber">Whish account / card number (optional)</Label>
                  <Input
                    id="wishAccountNumber"
                    type="text"
                    placeholder="Optional wallet or card ref"
                    value={formData.wishAccountNumber}
                    onChange={(e) => setFormData({ ...formData, wishAccountNumber: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website (optional)</Label>
                  <div className="relative mt-1">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://www.yourbusiness.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </>
            )}

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