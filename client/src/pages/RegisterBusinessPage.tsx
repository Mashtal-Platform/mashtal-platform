import React, { useState } from 'react';
import { Store, CheckCircle, Upload, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { Page } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { PhoneInput } from '../components/PhoneInput';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { LebanonLocationPicker } from '../components/LebanonLocationPicker';
import { BUSINESS_TYPES } from '../shared/constants/business';

interface RegisterBusinessPageProps {
  onNavigate: (page: Page) => void;
}

export function RegisterBusinessPage({ onNavigate }: RegisterBusinessPageProps) {
  const { convertToBusiness, user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<'choice' | 'form' | 'success'>('choice');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    description: '',
    address: '',
    location: '',
    phone: '',
    email: '',
    website: '',
    wishPhone: '',
    wishAccountNumber: '',
  });
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    setError('');
    if (!isAuthenticated || !user) {
      setError('Please sign in first to register a business.');
      onNavigate('signin');
      return;
    }
    if (!formData.businessName.trim()) {
      setError('Business name is required.');
      return;
    }
    if (!formData.businessType.trim()) {
      setError('Business type is required.');
      return;
    }
    if (!formData.description.trim()) {
      setError('Business description is required.');
      return;
    }
    if (!formData.location.trim()) {
      setError('City / village is required.');
      return;
    }
    const phone = formData.phone?.trim() ?? '';
    if (!phone) {
      setError('Contact phone is required.');
      return;
    }
    const parsed = parsePhoneNumberFromString(phone, 'LB');
    if (!parsed?.isValid()) {
      setError('Please enter a valid contact phone (example: +961 70 123 456).');
      return;
    }
    if (!formData.wishPhone.trim()) {
      setError('Whish Money phone is required for receiving payouts.');
      return;
    }
    const wishPhone = formData.wishPhone?.trim() ?? '';
    const parsedWish = parsePhoneNumberFromString(wishPhone, 'LB');
    if (!parsedWish?.isValid()) {
      setError('Please enter a valid Whish phone number (example: +961 70 123 456).');
      return;
    }
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Business contact email is invalid.');
      return;
    }

    setSubmitting(true);
    try {
      await convertToBusiness({
        companyName: formData.businessName.trim(),
        bio: formData.description.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        address: formData.address.trim() || undefined,
        contactEmail: formData.email.trim() || undefined,
        website: formData.website.trim() || undefined,
        specialties: formData.businessType ? [formData.businessType] : [],
        wishPhone: formData.wishPhone.trim(),
        wishAccountNumber: formData.wishAccountNumber.trim() || undefined,
      } as any);
      setStep('success');
      setTimeout(() => {
        onNavigate('payment');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || err?.response?.data?.message || 'Failed to register business. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'choice') {
    return (
      <div className="min-h-screen bg-neutral-50 py-8 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-12">
            <h1 className="text-2xl sm:text-4xl text-neutral-900 mb-4">Welcome to Mashtal</h1>
            <p className="text-xl text-neutral-600">How would you like to continue?</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
            {/* Browse as Visitor */}
            <div className="bg-white rounded-2xl p-4 sm:p-8 border-2 border-neutral-200 hover:border-green-600 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Store className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl sm:text-2xl text-neutral-900 mb-3 text-center">Browse as Visitor</h2>
              <p className="text-neutral-600 mb-6 text-center">
                Explore nurseries, discover products, and connect with agricultural businesses
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-neutral-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Browse all businesses</span>
                </li>
                <li className="flex items-center gap-3 text-neutral-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Shop products online</span>
                </li>
                <li className="flex items-center gap-3 text-neutral-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Chat with businesses</span>
                </li>
                <li className="flex items-center gap-3 text-neutral-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Get AI assistance</span>
                </li>
              </ul>
              <button
                onClick={() => onNavigate('home')}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Continue as Visitor
              </button>
            </div>

            {/* Register Business */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-4 sm:p-8 text-white shadow-xl">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Store className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl mb-3 text-center">Register Your Business</h2>
              <p className="text-green-100 mb-6 text-center">
                Join Mashtal and reach thousands of farmers and agricultural enthusiasts
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5" />
                  <span>Create your business profile</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5" />
                  <span>List products & services</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5" />
                  <span>Connect with customers</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5" />
                  <span>Grow your business</span>
                </li>
              </ul>
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    onNavigate('signin');
                    return;
                  }
                  setStep('form');
                }}
                className="w-full bg-white text-green-600 py-3 rounded-lg hover:bg-green-50 transition-colors"
              >
                Register Business
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-neutral-50 py-8 sm:py-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl p-4 sm:p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-xl sm:text-2xl text-neutral-900 mb-3">Welcome to Mashtal Business!</h2>
            <p className="text-neutral-600 mb-6">
              Your business has been successfully registered. You now have access to your business dashboard where you can manage products, track sales, and view analytics.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-neutral-700 mb-2">
                Next step: complete business payment to activate selling.
              </p>
              <p className="text-xs text-neutral-600">
                {formData.email
                  ? `Contact email on file: ${formData.email}`
                  : 'You can manage products after payment activates your subscription.'}
              </p>
            </div>
            <p className="text-sm text-neutral-500">Redirecting to your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-4 sm:py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl p-4 sm:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl text-neutral-900 mb-2">Register Your Business</h1>
            <p className="text-neutral-600">Fill in the details to create your business profile on Mashtal</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <p className="text-sm text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3">
              Fields marked with <span className="font-semibold text-neutral-900">*</span> are required.
              Optional fields help customers find and trust your business.
            </p>

            {/* Business Logo Upload — optional */}
            <div>
              <label className="block text-sm text-neutral-700 mb-2">Business Logo (optional)</label>
              <div className="border-2 border-dashed border-neutral-200 rounded-lg p-4 sm:p-8 text-center hover:border-green-600 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-sm text-neutral-600">Click to upload or drag and drop</p>
                <p className="text-xs text-neutral-500 mt-1">PNG, JPG up to 5MB — you can also set this later in Edit Profile</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm text-neutral-700 mb-2">Business Name *</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                  placeholder="Green Valley Nursery"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">Business Type *</label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                >
                  <option value="">Select type</option>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                placeholder="Describe your business, products, and services..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm text-neutral-700 mb-2">Street address (optional)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                    placeholder="Street address"
                  />
                </div>
              </div>

              <div>
                <LebanonLocationPicker
                  label="City / Village (Lebanon) *"
                  value={formData.location}
                  required
                  placeholder="Search city or village in Lebanon…"
                  onChange={(v) => setFormData({ ...formData, location: v })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <PhoneInput
                  label="Contact phone *"
                  value={formData.phone}
                  required
                  defaultCountry="LB"
                  placeholder="e.g. +961 70 123 456"
                  onChange={(v) => setFormData({ ...formData, phone: v })}
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">Business contact email (optional)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                    placeholder="info@business.com"
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">Public email shown to customers (not your login email)</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <PhoneInput
                  label="Whish Money phone * (for payouts)"
                  value={formData.wishPhone}
                  required
                  defaultCountry="LB"
                  placeholder="Whish wallet phone"
                  onChange={(v) => setFormData({ ...formData, wishPhone: v })}
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-700 mb-2">
                  Whish account / card number (optional)
                </label>
                <input
                  type="text"
                  name="wishAccountNumber"
                  value={formData.wishAccountNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                  placeholder="Optional wallet or card ref"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-2">Website (optional)</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                  placeholder="https://www.yourbusiness.com"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                onClick={() => setStep('choice')}
                className="flex-1 border-2 border-neutral-200 text-neutral-700 py-3 rounded-lg hover:border-green-600 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}