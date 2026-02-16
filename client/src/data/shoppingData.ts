// Shopping products with business information
import { mockProducts, otherUsers, MockProduct, MockUser } from './centralMockData';

export interface ShoppingProduct extends MockProduct {
  businessName: string;
  businessAvatar: string;
  businessRole: 'business';
  businessId: string;
  businessVerified: boolean;
  businessRating?: number;
  businessLocation: string;
  inStock: boolean;
}

// Transform products with business information
export const shoppingProducts: ShoppingProduct[] = mockProducts.map(product => {
  const business = otherUsers.find(u => u.id === product.businessId || u.businessId === product.businessId);
  
  return {
    ...product,
    businessName: business?.fullName || business?.name || 'Unknown Business',
    businessAvatar: business?.avatar || business?.logo || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=300',
    businessRole: 'business' as const,
    businessId: product.businessId,
    businessVerified: business?.verified || false,
    businessRating: business?.rating,
    businessLocation: business?.location || 'Saudi Arabia',
    inStock: product.stock > 0,
  };
});

// Get unique categories
export const productCategories = [
  'all',
  'seeds',
  'tools',
  'fertilizers',
  'plants',
  'irrigation',
] as const;

export type ProductCategory = typeof productCategories[number];

// Get unique businesses
export const getUniqueBusinesses = (): { id: string; name: string; avatar: string }[] => {
  const businessMap = new Map<string, { id: string; name: string; avatar: string }>();
  
  shoppingProducts.forEach(product => {
    if (!businessMap.has(product.businessId)) {
      businessMap.set(product.businessId, {
        id: product.businessId,
        name: product.businessName,
        avatar: product.businessAvatar,
      });
    }
  });
  
  return Array.from(businessMap.values());
};

// Price ranges
export const priceRanges = [
  { id: 'all', label: 'All Prices', min: 0, max: Infinity },
  { id: '0-100', label: 'Under SR 100', min: 0, max: 100 },
  { id: '100-300', label: 'SR 100 - SR 300', min: 100, max: 300 },
  { id: '300-500', label: 'SR 300 - SR 500', min: 300, max: 500 },
  { id: '500+', label: 'SR 500+', min: 500, max: Infinity },
] as const;

export type PriceRangeId = typeof priceRanges[number]['id'];
