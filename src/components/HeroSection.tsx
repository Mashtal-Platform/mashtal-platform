import React from 'react';
import { ArrowRight, Shield, Leaf, Users } from 'lucide-react';

interface HeroSectionProps {
  onNavigate: (page: any) => void;
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  return (
    <section className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200">
                <Leaf className="w-4 h-4" />
                <span className="text-sm">Trusted Agricultural Marketplace</span>
              </div>

              <h1 className="text-4xl lg:text-5xl text-neutral-900 leading-tight">
                Connect With Trusted Nurseries & Agricultural Experts
              </h1>

              <p className="text-lg text-neutral-600 leading-relaxed">
                Discover quality plants, farming tools, and professional agricultural services. 
                Shop online, chat with experts, and grow your farming business with Mashtal.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => onNavigate('search')}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30"
              >
                <span>Start Shopping</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => onNavigate('posts')}
                className="flex items-center justify-center gap-2 border-2 border-neutral-300 text-neutral-700 px-8 py-4 rounded-lg hover:border-green-600 hover:text-green-600 transition-colors"
              >
                Browse Updates
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-sm text-neutral-600">Verified Sellers</div>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <Leaf className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-sm text-neutral-600">Organic Products</div>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-sm text-neutral-600">Expert Support</div>
              </div>
            </div>
          </div>

          {/* Right Images Grid */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden shadow-xl h-64">
                  <img
                    src="https://images.unsplash.com/photo-1611504261400-bca14f7e0b9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kcyUyMGhvbGRpbmclMjBzZWVkbGluZ3xlbnwxfHx8fDE3NjU3NDkyMDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Hands holding seedling"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="relative rounded-2xl overflow-hidden shadow-xl h-48">
                  <img
                    src="https://images.unsplash.com/photo-1631337902392-b4bb679fbfdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwdmVnZXRhYmxlcyUyMGZhcm1pbmd8ZW58MXx8fHwxNzY1NzQyNTM0fDA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Organic vegetables"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-12">
                <div className="relative rounded-2xl overflow-hidden shadow-xl h-48">
                  <img
                    src="https://images.unsplash.com/photo-1758524057756-7dc8ce53d88c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBncmVlbmhvdXNlJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NjU2Mzk5MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Modern greenhouse"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="relative rounded-2xl overflow-hidden shadow-xl h-64">
                  <img
                    src="https://images.unsplash.com/photo-1759261158814-e5c651e30714?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtZXIlMjBoYXJ2ZXN0aW5nJTIwY3JvcHN8ZW58MXx8fHwxNzY1NzQ5MjA2fDA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Farmer harvesting"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Floating Stats Card */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl p-6 border border-neutral-200 w-11/12">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl text-green-600">250+</div>
                  <div className="text-xs text-neutral-600">Verified Nurseries</div>
                </div>
                <div className="border-l border-neutral-200">
                  <div className="text-2xl text-green-600">5K+</div>
                  <div className="text-xs text-neutral-600">Active Users</div>
                </div>
                <div className="border-l border-neutral-200">
                  <div className="text-2xl text-green-600">1K+</div>
                  <div className="text-xs text-neutral-600">Products</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
