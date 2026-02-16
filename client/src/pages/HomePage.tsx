import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { SearchDiscovery } from '../components/SearchDiscovery';
import { FeaturedBusinesses } from '../components/FeaturedBusinesses';
import { HowItWorks } from '../components/HowItWorks';
import { CombinedFeed } from '../components/CombinedFeed';
import { Page, SavedItem } from '../App';
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

interface HomePageProps {
  onViewBusiness: (businessId: string) => void;
  onNavigate: (page: Page) => void;
  onBusinessesClick: () => void;
  onNavigateToUserProfile?: (userId: string) => void;
  followedBusinesses: any[];
  onFollowBusiness: (business: any) => void;
  onSaveItem?: (item: SavedItem) => void;
  savedItems?: SavedItem[];
}

export function HomePage({ 
  onViewBusiness, 
  onNavigate, 
  onBusinessesClick,
  onNavigateToUserProfile,
  followedBusinesses,
  onFollowBusiness,
  onSaveItem,
  savedItems = []
}: HomePageProps) {
  return (
    <>
      <HeroSection onNavigate={onNavigate} />
      <SearchDiscovery onViewBusiness={onViewBusiness} />
      <FeaturedBusinesses onViewBusiness={onViewBusiness} onViewAll={onBusinessesClick} />
      
      {/* Latest Updates Section - Combined Posts & Threads */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl text-neutral-900 mb-2">
                Latest Updates
              </h2>
              <p className="text-neutral-600">
                Recent posts and discussions from the agricultural community
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => onNavigate('posts')}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                View All Posts
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => onNavigate('threads')}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                View All Threads
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
          
          <CombinedFeed
            onSaveItem={onSaveItem}
            savedItems={savedItems}
            onNavigateToBusiness={onViewBusiness}
            onNavigateToUserProfile={onNavigateToUserProfile}
            onNavigateToPosts={() => onNavigate('posts')}
            onNavigateToThreads={() => onNavigate('threads')}
            followedBusinesses={followedBusinesses}
            onFollowBusiness={onFollowBusiness}
            maxItems={6}
          />
          
          <div className="text-center mt-8">
            <Button
              onClick={() => onNavigate('posts')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Explore More Updates
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
      
      {/* Shopping Section */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
              <Sparkles className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Shop Agricultural Products</span>
            </div>
            <h2 className="text-3xl text-neutral-900 mb-3">
              Browse Quality Products
            </h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              Discover a wide range of agricultural products from verified businesses - seeds, tools, fertilizers, and more
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-lg group">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🌱</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Premium Seeds & Plants</h3>
                <p className="text-sm text-neutral-600">High-quality seeds and healthy plants for your farm</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-lg group">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🔧</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Farming Tools</h3>
                <p className="text-sm text-neutral-600">Professional equipment and tools for agriculture</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-lg group">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">💧</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Irrigation & Fertilizers</h3>
                <p className="text-sm text-neutral-600">Complete solutions for crop nutrition and watering</p>
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
              Explore All Products
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
      
      <HowItWorks onNavigate={onNavigate} />
    </>
  );
}