export interface Business {
  id: string;
  name: string;
  location: string;
  description: string;
  rating: number;
  reviews: number;
  followers: number;
  products: number;
  yearsActive: number;
  verified: boolean;
  coverImage: string;
  logo: string;
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  hours: string[];
  specialties: string[];
  productsList: Product[];
  posts: Post[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  priceNum: number;
  image: string;
  inStock: boolean;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  timeAgo: string;
}

export const businesses: Business[] = [
  {
    id: '1',
    name: 'Green Valley Nursery',
    location: 'Riyadh, Saudi Arabia',
    description: 'Leading provider of premium organic plants and sustainable agricultural solutions. Family-owned business with over 15 years of expertise.',
    rating: 4.8,
    reviews: 124,
    followers: 1250,
    products: 450,
    yearsActive: 15,
    verified: true,
    coverImage: 'https://images.unsplash.com/photo-1688320243376-69b68a8f656f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyYWwlMjBmYXJtJTIwZmllbGR8ZW58MXx8fHwxNzY1Njk3NTkzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    logo: 'https://images.unsplash.com/photo-1619077130450-baea09efa355?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFudCUyMG51cnNlcnklMjBncmVlbmhvdXNlfGVufDF8fHx8MTc2NTc0MjUzNHww&ixlib=rb-4.1.0&q=80&w=300',
    contact: {
      phone: '+966 11 234 5678',
      email: 'info@greenvalley.sa',
      website: 'www.greenvalley.sa',
    },
    hours: [
      'Saturday - Thursday: 8:00 AM - 6:00 PM',
      'Friday: 2:00 PM - 8:00 PM',
    ],
    specialties: ['Organic Plants', 'Native Species', 'Landscaping', 'Consultation', 'Delivery'],
    productsList: [
      {
        id: '1',
        name: 'Date Palm Seedlings',
        description: 'Premium organic date palm seedlings, 6-12 months old, perfect for Saudi climate',
        price: 'SR 150',
        priceNum: 150,
        image: 'https://images.unsplash.com/photo-1697788189761-d954ed91cdb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMHBsYW50cyUyMG5hdHVyZXxlbnwxfHx8fDE3NjU2NTE5Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
      {
        id: '2',
        name: 'Organic Vegetable Seeds Pack',
        description: 'Complete collection of organic vegetable seeds for home gardens. Includes tomatoes, cucumbers, lettuce',
        price: 'SR 45',
        priceNum: 45,
        image: 'https://images.unsplash.com/photo-1631337902392-b4bb679fbfdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwdmVnZXRhYmxlcyUyMGZhcm1pbmd8ZW58MXx8fHwxNzY1NzQyNTM0fDA&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
      {
        id: '3',
        name: 'Desert Rose Plants',
        description: 'Hardy desert roses perfect for local climate. Beautiful flowers and low maintenance',
        price: 'SR 75',
        priceNum: 75,
        image: 'https://images.unsplash.com/photo-1619077130450-baea09efa355?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFudCUyMG51cnNlcnklMjBncmVlbmhvdXNlfGVufDF8fHx8MTc2NTc0MjUzNHww&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
      {
        id: '4',
        name: 'Organic Fertilizer - 5kg',
        description: 'Premium organic fertilizer made from natural compost. Perfect for all plant types',
        price: 'SR 85',
        priceNum: 85,
        image: 'https://images.unsplash.com/photo-1611504261400-bca14f7e0b9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kcyUyMGhvbGRpbmclMjBzZWVkbGluZ3xlbnwxfHx8fDE3NjU3NDkyMDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
    ],
    posts: [
      {
        id: '1',
        title: 'New Arrival: Date Palm Seedlings',
        content: 'We just received a fresh batch of organic date palm seedlings. These are grown using sustainable practices and are perfect for the Saudi climate.',
        timeAgo: '2 hours ago',
      },
      {
        id: '2',
        title: 'Winter Planting Tips',
        content: 'Winter is the perfect time to plant cool-season vegetables. Visit our store for expert advice on what grows best in your region.',
        timeAgo: '1 day ago',
      },
    ],
  },
  {
    id: '2',
    name: 'AgriTools Pro',
    location: 'Jeddah, Saudi Arabia',
    description: 'Complete range of agricultural tools and equipment for modern farming needs. Quality tools that last.',
    rating: 4.9,
    reviews: 89,
    followers: 890,
    products: 320,
    yearsActive: 10,
    verified: true,
    coverImage: 'https://images.unsplash.com/photo-1690986469727-1ed8bcdf6384?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyZSUyMHRvb2xzJTIwZXF1aXBtZW50fGVufDF8fHx8MTc2NTY1NDY4NHww&ixlib=rb-4.1.0&q=80&w=1080',
    logo: 'https://images.unsplash.com/photo-1690986469727-1ed8bcdf6384?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyZSUyMHRvb2xzJTIwZXF1aXBtZW50fGVufDF8fHx8MTc2NTY1NDY4NHww&ixlib=rb-4.1.0&q=80&w=300',
    contact: {
      phone: '+966 12 345 6789',
      email: 'contact@agritools.sa',
      website: 'www.agritools.sa',
    },
    hours: [
      'Saturday - Thursday: 7:00 AM - 7:00 PM',
      'Friday: 3:00 PM - 9:00 PM',
    ],
    specialties: ['Farm Equipment', 'Irrigation Systems', 'Hand Tools', 'Power Tools', 'Maintenance'],
    productsList: [
      {
        id: '5',
        name: 'Garden Tool Set',
        description: 'Professional 5-piece garden tool set including spade, rake, hoe, and more',
        price: 'SR 220',
        priceNum: 220,
        image: 'https://images.unsplash.com/photo-1690986469727-1ed8bcdf6384?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyZSUyMHRvb2xzJTIwZXF1aXBtZW50fGVufDF8fHx8MTc2NTY1NDY4NHww&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
      {
        id: '6',
        name: 'Drip Irrigation Kit',
        description: 'Complete drip irrigation system for efficient water management. Covers up to 50m²',
        price: 'SR 350',
        priceNum: 350,
        image: 'https://images.unsplash.com/photo-1758524057756-7dc8ce53d88c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBncmVlbmhvdXNlJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NjU2Mzk5MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
    ],
    posts: [
      {
        id: '1',
        title: 'New Power Tools Collection',
        content: 'Check out our latest range of electric pruning shears and hedge trimmers. Professional grade equipment now available.',
        timeAgo: '3 hours ago',
      },
    ],
  },
  {
    id: '3',
    name: 'Fresh Harvest Farm',
    location: 'Dammam, Saudi Arabia',
    description: 'Organic vegetables and farming supplies. Farm-to-table freshness guaranteed with sustainable practices.',
    rating: 4.7,
    reviews: 156,
    followers: 2100,
    products: 280,
    yearsActive: 8,
    verified: true,
    coverImage: 'https://images.unsplash.com/photo-1631337902392-b4bb679fbfdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwdmVnZXRhYmxlcyUyMGZhcm1pbmd8ZW58MXx8fHwxNzY1NzQyNTM0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    logo: 'https://images.unsplash.com/photo-1631337902392-b4bb679fbfdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwdmVnZXRhYmxlcyUyMGZhcm1pbmd8ZW58MXx8fHwxNzY1NzQyNTM0fDA&ixlib=rb-4.1.0&q=80&w=300',
    contact: {
      phone: '+966 13 456 7890',
      email: 'hello@freshharvest.sa',
      website: 'www.freshharvest.sa',
    },
    hours: [
      'Daily: 6:00 AM - 8:00 PM',
    ],
    specialties: ['Organic Vegetables', 'Fresh Produce', 'Seeds', 'Compost', 'Farm Consulting'],
    productsList: [
      {
        id: '7',
        name: 'Organic Tomato Seeds',
        description: 'High-yield organic tomato seeds. Perfect for Saudi climate.',
        price: 'SR 35',
        priceNum: 35,
        image: 'https://images.unsplash.com/photo-1631337902392-b4bb679fbfdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwdmVnZXRhYmxlcyUyMGZhcm1pbmd8ZW58MXx8fHwxNzY1NzQyNTM0fDA&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
    ],
    posts: [
      {
        id: '1',
        title: 'Fresh Organic Harvest This Week',
        content: 'Visit us for fresh organic tomatoes, cucumbers, and lettuce. All grown without pesticides.',
        timeAgo: '5 hours ago',
      },
    ],
  },
  {
    id: '5',
    name: 'Eco Farm Solutions',
    location: 'Mecca, Saudi Arabia',
    description: 'Sustainable farming equipment and eco-friendly agricultural products for modern farms.',
    rating: 4.9,
    reviews: 203,
    followers: 3400,
    products: 520,
    yearsActive: 12,
    verified: true,
    coverImage: 'https://images.unsplash.com/photo-1636089167961-4964523e6c3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtaW5nJTIwc3Vuc2V0JTIwbGFuZHNjYXBlfGVufDF8fHx8MTc2NTc0MjUzNnww&ixlib=rb-4.1.0&q=80&w=1080',
    logo: 'https://images.unsplash.com/photo-1636089167961-4964523e6c3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtaW5nJTIwc3Vuc2V0JTIwbGFuZHNjYXBlfGVufDF8fHx8MTc2NTc0MjUzNnww&ixlib=rb-4.1.0&q=80&w=300',
    contact: {
      phone: '+966 12 567 8901',
      email: 'support@ecofarm.sa',
      website: 'www.ecofarm.sa',
    },
    hours: [
      'Saturday - Thursday: 8:00 AM - 5:00 PM',
      'Friday: Closed',
    ],
    specialties: ['Sustainable Farming', 'Solar Solutions', 'Water Management', 'Eco Products', 'Training'],
    productsList: [
      {
        id: '8',
        name: 'Solar Water Pump',
        description: 'Energy-efficient solar-powered water pump for irrigation. Eco-friendly solution.',
        price: 'SR 1,200',
        priceNum: 1200,
        image: 'https://images.unsplash.com/photo-1636089167961-4964523e6c3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtaW5nJTIwc3Vuc2V0JTIwbGFuZHNjYXBlfGVufDF8fHx8MTc2NTc0MjUzNnww&ixlib=rb-4.1.0&q=80&w=1080',
        inStock: true,
      },
    ],
    posts: [
      {
        id: '1',
        title: 'Sustainable Farming Workshop',
        content: 'Join us for a free workshop on sustainable farming practices. Learn how to reduce water usage and increase yield.',
        timeAgo: '1 day ago',
      },
    ],
  },
];
