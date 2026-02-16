// Centralized purchase/order data for all user roles
export interface Purchase {
  id: number;
  orderId: string;
  name: string;
  price: number;
  quantity: number;
  date: string;
  status: 'delivered' | 'processing' | 'shipped' | 'cancelled';
  image: string;
  businessId: string;
  businessName: string;
  businessLogo: string;
  category: string;
  rating?: number;
  userId?: string; // Which user made the purchase
}

// Mock data for purchase history - shared across all roles
export const mockPurchases: Purchase[] = [
  {
    id: 1,
    orderId: 'ORD-2026-0207-001',
    name: 'Organic Fertilizer 5kg',
    price: 29.99,
    quantity: 2,
    date: '2026-02-07T10:30:00',
    status: 'delivered',
    image: 'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=400',
    businessId: '1',
    businessName: 'GreenLeaf Nursery',
    businessLogo: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=200',
    category: 'Fertilizers',
    rating: 5,
    userId: 'current-user' // Can be filtered by user
  },
  {
    id: 2,
    orderId: 'ORD-2026-0205-002',
    name: 'Garden Pruning Shears',
    price: 19.99,
    quantity: 1,
    date: '2026-02-05T14:20:00',
    status: 'delivered',
    image: 'https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?w=400',
    businessId: '3',
    businessName: 'AgriTools Pro',
    businessLogo: 'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=200',
    category: 'Tools',
    rating: 4,
    userId: 'current-user'
  },
  {
    id: 3,
    orderId: 'ORD-2026-0203-003',
    name: 'Seedling Tray Set (50 pcs)',
    price: 15.99,
    quantity: 3,
    date: '2026-02-03T09:15:00',
    status: 'shipped',
    image: 'https://images.unsplash.com/photo-1585411241865-5133f70e69de?w=400',
    businessId: '5',
    businessName: 'PlantMaster Supplies',
    businessLogo: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=200',
    category: 'Containers',
    userId: 'current-user'
  },
  {
    id: 4,
    orderId: 'ORD-2026-0131-004',
    name: 'Premium Watering Can 10L',
    price: 24.99,
    quantity: 1,
    date: '2026-01-31T16:45:00',
    status: 'delivered',
    image: 'https://images.unsplash.com/photo-1558583082-f3c70175eca3?w=400',
    businessId: '1',
    businessName: 'GreenLeaf Nursery',
    businessLogo: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=200',
    category: 'Tools',
    rating: 5,
    userId: 'current-user'
  },
  {
    id: 5,
    orderId: 'ORD-2026-0129-005',
    name: 'Plant Growth LED Light',
    price: 89.99,
    quantity: 1,
    date: '2026-01-29T11:30:00',
    status: 'delivered',
    image: 'https://images.unsplash.com/photo-1623944889236-5c99ea1ea326?w=400',
    businessId: '3',
    businessName: 'AgriTools Pro',
    businessLogo: 'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=200',
    category: 'Equipment',
    rating: 5,
    userId: 'current-user'
  },
  {
    id: 6,
    orderId: 'ORD-2026-0125-006',
    name: 'Organic Pest Control Spray 1L',
    price: 34.99,
    quantity: 2,
    date: '2026-01-25T13:20:00',
    status: 'processing',
    image: 'https://images.unsplash.com/photo-1591696331111-ef9586a5b17a?w=400',
    businessId: '1',
    businessName: 'GreenLeaf Nursery',
    businessLogo: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=200',
    category: 'Pesticides',
    userId: 'current-user'
  },
  {
    id: 7,
    orderId: 'ORD-2026-0120-007',
    name: 'Soil pH Testing Kit',
    price: 12.99,
    quantity: 1,
    date: '2026-01-20T10:00:00',
    status: 'delivered',
    image: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=400',
    businessId: '5',
    businessName: 'PlantMaster Supplies',
    businessLogo: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=200',
    category: 'Testing',
    rating: 4,
    userId: 'current-user'
  },
  {
    id: 8,
    orderId: 'ORD-2026-0115-008',
    name: 'Heavy Duty Garden Gloves',
    price: 16.99,
    quantity: 2,
    date: '2026-01-15T15:30:00',
    status: 'cancelled',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
    businessId: '3',
    businessName: 'AgriTools Pro',
    businessLogo: 'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=200',
    category: 'Safety',
    userId: 'current-user'
  },
];

// Helper function to get purchases for a specific user
export function getPurchasesByUserId(userId: string): Purchase[] {
  return mockPurchases.filter(purchase => purchase.userId === userId);
}

// Helper function to get purchase statistics
export function getPurchaseStats(purchases: Purchase[]) {
  const totalOrders = purchases.length;
  const totalSpent = purchases.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const deliveredCount = purchases.filter(p => p.status === 'delivered').length;
  const processingCount = purchases.filter(p => p.status === 'processing').length;
  const shippedCount = purchases.filter(p => p.status === 'shipped').length;

  return {
    totalOrders,
    totalSpent,
    deliveredCount,
    processingCount,
    shippedCount
  };
}
