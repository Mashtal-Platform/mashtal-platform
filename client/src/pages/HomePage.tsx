import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { FeaturedBusinesses } from '../components/FeaturedBusinesses';
import { HowItWorks } from '../components/HowItWorks';
import { CombinedFeed } from '../components/CombinedFeed';
import { Page, SavedItem } from '../App';
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useTranslation } from 'react-i18next';

interface HomePageProps {
  onViewBusiness: (businessId: string) => void;
  onNavigate: (page: Page) => void;
  onBusinessesClick: () => void;
  onNavigateToUserProfile?: (userId: string) => void;
  followedBusinesses: any[];
  onFollowBusiness: (business: any) => void;
  onSaveItem?: (item: SavedItem) => void;
  onRemoveSavedItem?: (savedItemId: string) => void;
  savedItems?: SavedItem[];
  feedVersion?: number;
}

export function HomePage({ 
  onViewBusiness, 
  onNavigate, 
  onBusinessesClick,
  onNavigateToUserProfile,
  followedBusinesses,
  onFollowBusiness,
  onSaveItem,
  onRemoveSavedItem,
  savedItems = [],
  feedVersion = 0,
}: HomePageProps) {
  const { t } = useTranslation();
  return (
    <>
      <HeroSection onNavigate={onNavigate} />
      <FeaturedBusinesses onViewBusiness={onViewBusiness} onViewAll={onBusinessesClick} />
      
      {/* Latest Updates Section - Combined Posts & Threads */}
      <section className="py-8 sm:py-16 bg-white scroll-mt-20" id="latest-updates">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl text-neutral-900 mb-2">
                {t('home.latestUpdates')}
              </h2>
              <p className="text-neutral-600">
                {t('posts.subtitle')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => onNavigate('posts')}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                {t('home.viewAllPosts')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => onNavigate('threads')}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                {t('common.viewAll')} {t('threads.title')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
          
          <CombinedFeed
            onSaveItem={onSaveItem}
            onRemoveSavedItem={onRemoveSavedItem}
            savedItems={savedItems}
            onNavigateToBusiness={onViewBusiness}
            onNavigateToUserProfile={onNavigateToUserProfile}
            onNavigateToPosts={() => onNavigate('posts')}
            onNavigateToThreads={() => onNavigate('threads')}
            followedBusinesses={followedBusinesses}
            onFollowBusiness={onFollowBusiness}
            maxPosts={3}
            maxThreads={3}
            feedVersion={feedVersion}
          />
        </div>
      </section>
      
      {/* Shopping Section */}
      <section className="py-8 sm:py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
              <Sparkles className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">{t('home.shopProducts')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl text-neutral-900 mb-3">
              {t('shopping.title')}
            </h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              {t('shopping.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-lg group">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🌱</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">{t('shopping.seeds')} & {t('shopping.plants')}</h3>
                <p className="text-sm text-neutral-600">{t('shopping.subtitle')}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-lg group">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🔧</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">{t('shopping.tools')}</h3>
                <p className="text-sm text-neutral-600">{t('shopping.subtitle')}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-lg group">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">💧</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">{t('shopping.fertilizers')}</h3>
                <p className="text-sm text-neutral-600">{t('shopping.subtitle')}</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button
              onClick={() => onNavigate('shopping')}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              {t('home.shopProducts')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
      
      <HowItWorks onNavigate={onNavigate} />
    </>
  );
}