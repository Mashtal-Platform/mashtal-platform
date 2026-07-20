import React, { useState } from 'react';
import { Leaf, Sprout, Shovel, TreePine, Filter, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Page } from '../App';

interface SearchDiscoveryProps {
  onViewBusiness: (businessId: string) => void;
  onNavigate?: (page: Page) => void;
}

export function SearchDiscovery({ onNavigate }: SearchDiscoveryProps) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [location, setLocation] = useState('all');

  const categories = [
    { id: 'all', name: t('common.all'), icon: Leaf },
    { id: 'nurseries', name: t('search.nurseries'), icon: Sprout },
    { id: 'tools', name: t('search.toolsEquipment'), icon: Shovel },
    { id: 'plants', name: t('search.treesPlants'), icon: TreePine },
  ];

  const resetFilters = () => {
    setMinRating(0);
    setVerifiedOnly(false);
    setLocation('all');
    setSelectedCategory('all');
  };

  const goToBusinesses = () => {
    onNavigate?.('businesses');
  };

  return (
    <section id="discover" className="py-8 sm:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-neutral-900 mb-4">{t('search.discover')}</h2>
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto">
            {t('search.discoverBody')}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8 flex-wrap">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  goToBusinesses();
                }}
                className={`flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-lg transition-all ${
                  selectedCategory === category.id
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{category.name}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span>{t('search.moreFilters')}</span>
          </button>
        </div>

        {showMoreFilters && (
          <div className="mb-6 sm:mb-8 bg-neutral-50 rounded-xl p-4 sm:p-6 border border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-neutral-900">{t('search.advancedFilters')}</h3>
              <button onClick={() => setShowMoreFilters(false)} className="p-2 hover:bg-neutral-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm text-neutral-700 mb-2">{t('search.minimumRating')}</label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                >
                  <option value={0}>{t('search.allRatings')}</option>
                  <option value={3}>{t('search.stars3')}</option>
                  <option value={4}>{t('search.stars4')}</option>
                  <option value={4.5}>{t('search.stars45')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">{t('common.location')}</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                >
                  <option value="all">{t('search.allLocations')}</option>
                  <option value="Riyadh">Riyadh</option>
                  <option value="Jeddah">Jeddah</option>
                  <option value="Dammam">Dammam</option>
                  <option value="Mecca">Mecca</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">{t('search.verification')}</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="w-5 h-5 text-green-600 border-neutral-300 rounded focus:ring-green-600"
                  />
                  <span className="text-neutral-700">{t('search.verifiedOnly')}</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetFilters}
                className="px-6 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                {t('search.resetFilters')}
              </button>
              <button
                onClick={() => {
                  setShowMoreFilters(false);
                  goToBusinesses();
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {t('search.browseBusinesses')}
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={goToBusinesses}
            className="px-8 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors"
          >
            {t('search.viewAllBusinesses')}
          </button>
        </div>
      </div>
    </section>
  );
}
