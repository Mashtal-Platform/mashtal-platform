import React from 'react';
import { Search, UserPlus, MessageCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Page } from '../App';
import { useAuth } from '../contexts/AuthContext';

interface HowItWorksProps {
  onNavigate: (page: Page) => void;
}

export function HowItWorks({ onNavigate }: HowItWorksProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const steps = [
    {
      icon: Search,
      title: t('howItWorks.step1Title'),
      description: t('howItWorks.step1Body'),
    },
    {
      icon: UserPlus,
      title: t('howItWorks.step2Title'),
      description: t('howItWorks.step2Body'),
    },
    {
      icon: MessageCircle,
      title: t('howItWorks.step3Title'),
      description: t('howItWorks.step3Body'),
    },
    {
      icon: CheckCircle,
      title: t('howItWorks.step4Title'),
      description: t('howItWorks.step4Body'),
    },
  ];
  
  return (
      <section id="how-it-works" className="py-10 sm:py-20 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-neutral-900 mb-4">
            {t('howItWorks.title')}
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
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
        <div className="mt-10 sm:mt-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 sm:p-8 md:p-12 text-center text-white">
          <h3 className="text-2xl sm:text-3xl mb-4">
            {t('howItWorks.ctaTitle')}
          </h3>
          <p className="text-green-50 mb-6 sm:mb-8 text-base sm:text-lg max-w-2xl mx-auto">
            {t('howItWorks.ctaBody')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Only show Register Business button if user is not already a business */}
            {user?.role !== 'business' && (
              <button
                onClick={() => onNavigate('register-business')}
                className="bg-white text-green-600 px-6 sm:px-8 py-3 rounded-lg hover:bg-green-50 transition-colors"
              >
                {t('howItWorks.ctaButton')}
              </button>
            )}
            <button
              onClick={() => onNavigate('search')}
              className="border-2 border-white text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-white/10 transition-colors"
            >
              {t('registerBusiness.browseVisitor')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
