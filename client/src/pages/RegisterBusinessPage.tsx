import React, { useState } from 'react';
import { Store, CheckCircle, Upload, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { Page } from '../App';
import { useAuth } from '../contexts/AuthContext';

interface RegisterBusinessPageProps {
  onNavigate: (page: Page) => void;
}

export function RegisterBusinessPage({ onNavigate }: RegisterBusinessPageProps) {
  const { updateProfile, user } = useAuth();
  const [step, setStep] = useState<'choice' | 'form' | 'success'>('choice');
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    description: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    website: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    // Update user to business role and save business data
    if (user) {
      await updateProfile({
        ...user,
        role: 'business',
        companyName: formData.businessName,
        businessType: formData.businessType,
        bio: formData.description,
        phone: formData.phone,
        email: formData.email,
        location: `${formData.address}, ${formData.city}`,
        verified: true,
        subscriptionStatus: 'active',
      });
    }
    
    setStep('success');
    setTimeout(() => {
      onNavigate('profile');
    }, 3000);
  };

  if (step === 'choice') {
    return (
      <div className="min-h-screen bg-neutral-50 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl text-neutral-900 mb-4">Welcome to Mashtal</h1>
            <p className="text-xl text-neutral-600">How would you like to continue?</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Browse as Visitor */}
            <div className="bg-white rounded-2xl p-8 border-2 border-neutral-200 hover:border-green-600 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Store className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl text-neutral-900 mb-3 text-center">Browse as Visitor</h2>
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
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 text-white shadow-xl">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Store className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl mb-3 text-center">Register Your Business</h2>
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
                onClick={() => setStep('form')}
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
      <div className="min-h-screen bg-neutral-50 py-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl text-neutral-900 mb-3">Welcome to Mashtal Business!</h2>
            <p className="text-neutral-600 mb-6">
              Your business has been successfully registered. You now have access to your business dashboard where you can manage products, track sales, and view analytics.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-neutral-700 mb-2">
                Confirmation sent to <span className="text-green-600 font-medium">{formData.email}</span>
              </p>
              <p className="text-xs text-neutral-600">
                You can now start adding products and growing your business!
              </p>
            </div>
            <p className="text-sm text-neutral-500">Redirecting to your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl text-neutral-900 mb-2">Register Your Business</h1>
            <p className="text-neutral-600">Fill in the details to create your business profile on Mashtal</p>
          </div>

          <div className="space-y-6">
            {/* Business Logo Upload */}
            <div>
              <label className="block text-sm text-neutral-700 mb-2">Business Logo</label>
              <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center hover:border-green-600 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-sm text-neutral-600">Click to upload or drag and drop</p>
                <p className="text-xs text-neutral-500 mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
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
                  <option value="nursery">Nursery</option>
                  <option value="farm">Farm</option>
                  <option value="tools">Agricultural Tools Shop</option>
                  <option value="services">Agricultural Services</option>
                  <option value="other">Other</option>
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

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-neutral-700 mb-2">Address *</label>
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
                <label className="block text-sm text-neutral-700 mb-2">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                  placeholder="Riyadh"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-neutral-700 mb-2">Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                    placeholder="+966 XX XXX XXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">Email *</label>
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
              </div>
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-2">Website (Optional)</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                  placeholder="www.yourbusiness.com"
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
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Submit Application
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}