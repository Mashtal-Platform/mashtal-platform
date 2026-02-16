import React from 'react';
import { Search, UserPlus, MessageCircle, CheckCircle } from 'lucide-react';
import { Page } from '../App';
import { useAuth } from '../contexts/AuthContext';

interface HowItWorksProps {
  onNavigate: (page: Page) => void;
}

export function HowItWorks({ onNavigate }: HowItWorksProps) {
  const { user } = useAuth();
  
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-neutral-900 mb-4">
            How Mashtal Works
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Connect with trusted agricultural businesses in four simple steps
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-green-200"></div>
                )}

                <div className="text-center">
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-2xl mb-6 relative">
                    <Icon className="w-12 h-12 text-green-600" />
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl text-neutral-900 mb-3">{step.title}</h3>
                  <p className="text-neutral-600">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 md:p-12 text-center text-white">
          <h3 className="text-3xl mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-green-50 mb-8 text-lg max-w-2xl mx-auto">
            Join thousands of farmers and agricultural businesses already using Mashtal
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Only show Register Business button if user is not already a business */}
            {user?.role !== 'business' && (
              <button
                onClick={() => onNavigate('register-business')}
                className="bg-white text-green-600 px-8 py-3 rounded-lg hover:bg-green-50 transition-colors"
              >
                Create Business Account
              </button>
            )}
            <button
              onClick={() => onNavigate('search')}
              className="border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white/10 transition-colors"
            >
              Browse as Visitor
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    icon: Search,
    title: 'Discover',
    description: 'Search and explore verified nurseries, agricultural shops, and service providers in your area.',
  },
  {
    icon: UserPlus,
    title: 'Follow',
    description: 'Follow businesses you trust to receive updates on new products, offers, and agricultural tips.',
  },
  {
    icon: MessageCircle,
    title: 'Connect',
    description: 'Chat directly with businesses to ask questions, request quotes, and get expert advice.',
  },
  {
    icon: CheckCircle,
    title: 'Grow Together',
    description: 'Build lasting relationships with trusted providers and grow your agricultural business.',
  },
];