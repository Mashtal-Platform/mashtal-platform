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
  image: string;
  likes: number;
  comments: any[];
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
        image: 'https://images.unsplash.com/photo-1697788189761-d954ed91cdb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMHBsYW50cyUyMG5hdHVyZXxlbnwxfHx8fDE3NjU2NTE5Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
        likes: 45,
        comments: [
          {
            id: 'c1',
            userId: 'user1',
            userName: 'Ahmed Al-Saud',
            content: 'These look amazing! Do you offer delivery to Jeddah?',
            timeAgo: '1 hour ago',
            likes: 5,
            isLiked: false,
            isVerified: false,
            userType: 'user',
            replies: [
              {
                id: 'r1',
                userId: 'biz1',
                userName: 'Green Valley Nursery',
                content: 'Yes! We deliver to Jeddah. Please message us for delivery rates.',
                timeAgo: '50 minutes ago',
                likes: 3,
                isLiked: false,
                isVerified: true,
                userType: 'business',
                businessId: '1',
              }
            ]
          },
          {
            id: 'c2',
            userId: 'eng1',
            userName: 'Engineer Hassan',
            content: 'Great quality seedlings! I recommend proper soil preparation before planting.',
            timeAgo: '45 minutes ago',
            likes: 12,
            isLiked: false,
            isVerified: true,
            userType: 'engineer',
            replies: []
          },
          {
            id: 'c3',
            userId: 'eng2',
            userName: 'Engineer Sara',
            content: 'These date palms are perfect for the local climate. Make sure to plant them in well-draining soil and water regularly during the first year.',
            timeAgo: '30 minutes ago',
            likes: 8,
            isLiked: false,
            isVerified: true,
            userType: 'engineer',
            replies: []
          }
        ],
      },
      {
        id: '2',
        title: 'Winter Planting Tips',
        content: 'Winter is the perfect time to plant cool-season vegetables. Visit our store for expert advice on what grows best in your region.',
        timeAgo: '1 day ago',
        image: 'https://images.unsplash.com/photo-1631337902392-b4bb679fbfdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwdmVnZXRhYmxlcyUyMGZhcm1pbmd8ZW58MXx8fHwxNzY1NzQyNTM0fDA&ixlib=rb-4.1.0&q=80&w=1080',
        likes: 32,
        comments: [
          {
            id: 'c4',
            userId: 'eng1',
            userName: 'Engineer Hassan',
            content: 'Excellent advice! Winter vegetables like lettuce, broccoli, and cauliflower thrive in our climate. @Green Valley Nursery do you have seedlings ready?',
            timeAgo: '18 hours ago',
            likes: 15,
            isLiked: false,
            isVerified: true,
            userType: 'engineer',
            replies: []
          },
          {
            id: 'c5',
            userId: 'biz2',
            userName: 'AgriTools Pro',
            content: 'Great timing! Pair these with our new irrigation systems for best results.',
            timeAgo: '16 hours ago',
            likes: 7,
            isLiked: false,
            isVerified: true,
            userType: 'business',
            businessId: '2',
            replies: []
          }
        ],
      },
      {
        id: '3',
        title: 'Organic Gardening Workshop',
        content: 'Join us this weekend for a free workshop on organic gardening techniques. Learn how to grow your own vegetables at home!',
        timeAgo: '3 days ago',
        image: 'https://images.unsplash.com/photo-1611504261400-bca14f7e0b9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kcyUyMGhvbGRpbmclMjBzZWVkbGluZ3xlbnwxfHx8fDE3NjU3NDkyMDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
        likes: 28,
        comments: [
          {
            id: 'c6',
            userId: 'user2',
            userName: 'Fatima Mohammed',
            content: 'I would love to attend! Is there a registration fee?',
            timeAgo: '2 days ago',
            likes: 4,
            isLiked: false,
            isVerified: false,
            userType: 'user',
            replies: [
              {
                id: 'r2',
                userId: 'biz1',
                userName: 'Green Valley Nursery',
                content: "It's completely free! Just come by this Saturday at 10 AM. We'll provide all materials.",
                timeAgo: '2 days ago',
                likes: 6,
                isLiked: false,
                isVerified: true,
                userType: 'business',
                businessId: '1',
              }
            ]
          },
          {
            id: 'c7',
            userId: 'eng2',
            userName: 'Engineer Sara',
            content: 'These workshops are incredibly valuable! I learned so much from the last one. Highly recommend for beginners.',
            timeAgo: '2 days ago',
            likes: 11,
            isLiked: false,
            isVerified: true,
            userType: 'engineer',
            replies: []
          }
        ],
      },
      {
        id: '4',
        title: 'Spring Collection Preview',
        content: 'Get ready for spring! Our new collection of flowering plants will be available next week. Pre-order now!',
        timeAgo: '5 days ago',
        image: 'https://images.unsplash.com/photo-1619077130450-baea09efa355?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFudCUyMG51cnNlcnklMjBncmVlbmhvdXNlfGVufDF8fHx8MTc2NTc0MjUzNHww&ixlib=rb-4.1.0&q=80&w=1080',
        likes: 52,
        comments: [
          {
            id: 'c8',
            userId: 'eng1',
            userName: 'Engineer Hassan',
            content: 'Beautiful collection! Spring flowers add so much life to any garden. Make sure to prepare the soil with organic compost for best results.',
            timeAgo: '4 days ago',
            likes: 9,
            isLiked: false,
            isVerified: true,
            userType: 'engineer',
            replies: []
          },
          {
            id: 'c9',
            userId: 'user3',
            userName: 'Omar Abdullah',
            content: 'Can I pre-order the rose collection?',
            timeAgo: '4 days ago',
            likes: 2,
            isLiked: false,
            isVerified: false,
            userType: 'user',
            replies: [
              {
                id: 'r3',
                userId: 'biz1',
                userName: 'Green Valley Nursery',
                content: 'Absolutely! Call us or send a message to reserve your favorites.',
                timeAgo: '4 days ago',
                likes: 1,
                isLiked: false,
                isVerified: true,
                userType: 'business',
                businessId: '1',
              }
            ]
          },
          {
            id: 'c10',
            userId: 'biz3',
            userName: 'Fresh Harvest Farm',
            content: 'Looking forward to seeing the collection! @Green Valley Nursery do you have butterfly-attracting varieties?',
            timeAgo: '3 days ago',
            likes: 5,
            isLiked: false,
            isVerified: true,
            userType: 'business',
            businessId: '3',
            replies: []
          }
        ],
      },
      {
        id: '5',
        title: 'Sustainable Farming Practices',
        content: 'Learn about our commitment to sustainable farming and how we reduce water usage while maximizing plant health.',
        timeAgo: '1 week ago',
        image: 'https://images.unsplash.com/photo-1688320243376-69b68a8f656f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyYWwlMjBmYXJtJTIwZmllbGR8ZW58MXx8fHwxNzY1Njk3NTkzfDA&ixlib=rb-4.1.0&q=80&w=1080',
        likes: 67,
        comments: [
          {
            id: 'c11',
            userId: 'eng2',
            userName: 'Engineer Sara',
            content: 'Sustainable farming is the future! Your drip irrigation setup is particularly impressive. Would love to see a detailed post about your water conservation techniques.',
            timeAgo: '6 days ago',
            likes: 18,
            isLiked: false,
            isVerified: true,
            userType: 'engineer',
            replies: [
              {
                id: 'r4',
                userId: 'biz1',
                userName: 'Green Valley Nursery',
                content: '@Engineer Sara Great idea! We\'ll create a detailed guide next week. Stay tuned!',
                timeAgo: '5 days ago',
                likes: 8,
                isLiked: false,
                isVerified: true,
                userType: 'business',
                businessId: '1',
              }
            ]
          },
          {
            id: 'c12',
            userId: 'eng1',
            userName: 'Engineer Hassan',
            content: 'This is exactly what the industry needs. Reducing water usage while maintaining plant health is crucial in our climate.',
            timeAgo: '5 days ago',
            likes: 14,
            isLiked: false,
            isVerified: true,
            userType: 'engineer',
            replies: []
          }
        ],
      },
      {
        id: '6',
        title: 'Customer Success Story',
        content: 'Amazing transformation! Check out how our customer created a beautiful garden using our plants and expert guidance.',
        timeAgo: '1 week ago',
        image: 'https://images.unsplash.com/photo-1697788189761-d954ed91cdb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMHBsYW50cyUyMG5hdHVyZXxlbnwxfHx8fDE3NjU2NTE5Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
        likes: 89,
        comments: [
          {
            id: 'c13',
            userId: 'user4',
            userName: 'Sarah Ahmed',
            content: 'This is so inspiring! Can you share what plants were used?',
            timeAgo: '6 days ago',
            likes: 7,
            isLiked: false,
            isVerified: false,
            userType: 'user',
            replies: [
              {
                id: 'r5',
                userId: 'biz1',
                userName: 'Green Valley Nursery',
                content: 'It was a mix of native desert roses, jasmine, and bougainvillea! All available in our store.',
                timeAgo: '6 days ago',
                likes: 9,
                isLiked: false,
                isVerified: true,
                userType: 'business',
                businessId: '1',
              }
            ]
          },
          {
            id: 'c14',
            userId: 'eng2',
            userName: 'Engineer Sara',
            content: 'Beautiful transformation! The combination of colors and textures is perfect. Great choice of drought-resistant plants.',
            timeAgo: '5 days ago',
            likes: 12,
            isLiked: false,
            isVerified: true,
            userType: 'engineer',
            replies: []
          },
          {
            id: 'c15',
            userId: 'biz5',
            userName: 'Eco Farm Solutions',
            content: 'Stunning work! This shows how proper plant selection can create a thriving garden even in challenging conditions.',
            timeAgo: '5 days ago',
            likes: 6,
            isLiked: false,
            isVerified: true,
            userType: 'business',
            businessId: '5',
            replies: []
          }
        ],
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
        image: 'https://images.unsplash.com/photo-1690986469727-1ed8bcdf6384?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyZSUyMHRvb2xzJTIwZXF1aXBtZW50fGVufDF8fHx8MTc2NTY1NDY4NHww&ixlib=rb-4.1.0&q=80&w=1080',
        likes: 42,
        comments: [
          {
            id: 'c16',
            userId: 'eng1',
            userName: 'Engineer Hassan',
            content: 'Finally! Professional-grade tools make such a difference. @AgriTools Pro do these come with warranty?',
            timeAgo: '2 hours ago',
            likes: 8,
            isLiked: false,
            isVerified: true,
            userType: 'engineer',
            replies: [
              {
                id: 'r6',
                userId: 'biz2',
                userName: 'AgriTools Pro',
                content: '@Engineer Hassan Yes! All our power tools come with 2-year warranty and free maintenance for the first year.',
                timeAgo: '1 hour ago',
                likes: 5,
                isLiked: false,
                isVerified: true,
                userType: 'business',
                businessId: '2',
              }
            ]
          },
          {
            id: 'c17',
            userId: 'biz1',
            userName: 'Green Valley Nursery',
            content: 'We use your tools daily! The quality is outstanding and they hold up perfectly even with heavy use.',
            timeAgo: '1 hour ago',
            likes: 6,
            isLiked: false,
            isVerified: true,
            userType: 'business',
            businessId: '1',
            replies: []
          },
          {
            id: 'c18',
            userId: 'eng2',
            userName: 'Engineer Sara',
            content: 'The battery life on these is impressive. Highly recommend for large-scale operations.',
            timeAgo: '30 minutes ago',
            likes: 4,
            isLiked: false,
            isVerified: true,
            userType: 'engineer',
            replies: []
          }
        ],
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
        image: 'https://images.unsplash.com/photo-1631337902392-b4bb679fbfdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwdmVnZXRhYmxlcyUyMGZhcm1pbmd8ZW58MXx8fHwxNzY1NzQyNTM0fDA&ixlib=rb-4.1.0&q=80&w=1080',
        likes: 56,
        comments: [
          {
            id: 'c19',
            userId: 'user5',
            userName: 'Mohammed Hassan',
            content: 'Your vegetables are always so fresh! Do you deliver to residential areas?',
            timeAgo: '4 hours ago',
            likes: 3,
            isLiked: false,
            isVerified: false,
            userType: 'user',
            replies: [
              {
                id: 'r7',
                userId: 'biz3',
                userName: 'Fresh Harvest Farm',
                content: 'Yes! We deliver daily to all residential areas in Dammam. Order before 2 PM for same-day delivery!',
                timeAgo: '3 hours ago',
                likes: 4,
                isLiked: false,
                isVerified: true,
                userType: 'business',
                businessId: '3',
              }
            ]
          },
          {
            id: 'c20',
            userId: 'eng2',
            userName: 'Engineer Sara',
            content: 'The no-pesticide approach is commendable! @Fresh Harvest Farm what pest control methods do you use instead?',
            timeAgo: '3 hours ago',
            likes: 9,
            isLiked: false,
            isVerified: true,
            userType: 'engineer',
            replies: [
              {
                id: 'r8',
                userId: 'biz3',
                userName: 'Fresh Harvest Farm',
                content: '@Engineer Sara We use companion planting, beneficial insects, and organic neem oil spray. Happy to share more details!',
                timeAgo: '2 hours ago',
                likes: 7,
                isLiked: false,
                isVerified: true,
                userType: 'business',
                businessId: '3',
              }
            ]
          },
          {
            id: 'c21',
            userId: 'eng1',
            userName: 'Engineer Hassan',
            content: 'Your organic farming techniques are exemplary. The produce quality speaks for itself!',
            timeAgo: '1 hour ago',
            likes: 5,
            isLiked: false,
            isVerified: true,
            userType: 'engineer',
            replies: []
          }
        ],
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
        image: 'https://images.unsplash.com/photo-1636089167961-4964523e6c3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtaW5nJTIwc3Vuc2V0JTIwbGFuZHNjYXBlfGVufDF8fHx8MTc2NTc0MjUzNnww&ixlib=rb-4.1.0&q=80&w=1080',
        likes: 73,
        comments: [
          {
            id: 'c22',
            userId: 'eng2',
            userName: 'Engineer Sara',
            content: 'Your workshops are always so informative! Will you cover drip irrigation systems this time?',
            timeAgo: '20 hours ago',
            likes: 11,
            isLiked: false,
            isVerified: true,
            userType: 'engineer',
            replies: [
              {
                id: 'r9',
                userId: 'biz5',
                userName: 'Eco Farm Solutions',
                content: '@Engineer Sara Absolutely! We\'ll have a full session on modern drip irrigation and smart water management.',
                timeAgo: '18 hours ago',
                likes: 8,
                isLiked: false,
                isVerified: true,
                userType: 'business',
                businessId: '5',
              }
            ]
          },
          {
            id: 'c23',
            userId: 'eng1',
            userName: 'Engineer Hassan',
            content: 'Sustainable farming is the key to our agricultural future. Looking forward to learning about the latest innovations!',
            timeAgo: '15 hours ago',
            likes: 13,
            isLiked: false,
            isVerified: true,
            userType: 'engineer',
            replies: []
          },
          {
            id: 'c24',
            userId: 'biz1',
            userName: 'Green Valley Nursery',
            content: 'We implemented your water management techniques last year and saw a 40% reduction in water usage! Highly recommend this workshop.',
            timeAgo: '12 hours ago',
            likes: 16,
            isLiked: false,
            isVerified: true,
            userType: 'business',
            businessId: '1',
            replies: []
          },
          {
            id: 'c25',
            userId: 'user6',
            userName: 'Abdullah Ali',
            content: 'Is this suitable for small home gardens or more for commercial farms?',
            timeAgo: '8 hours ago',
            likes: 2,
            isLiked: false,
            isVerified: false,
            userType: 'user',
            replies: [
              {
                id: 'r10',
                userId: 'biz5',
                userName: 'Eco Farm Solutions',
                content: '@Abdullah Ali Perfect for both! We cover scalable solutions that work for any size operation.',
                timeAgo: '6 hours ago',
                likes: 3,
                isLiked: false,
                isVerified: true,
                userType: 'business',
                businessId: '5',
              }
            ]
          }
        ],
      },
    ],
  },
];