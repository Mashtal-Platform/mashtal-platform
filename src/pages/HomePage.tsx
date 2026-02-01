import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { SearchDiscovery } from '../components/SearchDiscovery';
import { FeaturedBusinesses } from '../components/FeaturedBusinesses';
import { HowItWorks } from '../components/HowItWorks';
import { Page } from '../App';

interface HomePageProps {
  onViewBusiness: (businessId: string) => void;
  onNavigate: (page: Page) => void;
}

export function HomePage({ onViewBusiness, onNavigate }: HomePageProps) {
  return (
    <>
      <HeroSection onNavigate={onNavigate} />
      <SearchDiscovery onViewBusiness={onViewBusiness} />
      <FeaturedBusinesses onViewBusiness={onViewBusiness} />
      <HowItWorks onNavigate={onNavigate} />
    </>
  );
}