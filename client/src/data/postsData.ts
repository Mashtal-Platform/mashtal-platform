export interface PostAuthor {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  type: 'business' | 'agronomist' | 'engineer' | 'admin' | 'user';
  businessId?: string;
}

export interface Post {
  id: string;
  author: PostAuthor;
  timeAgo: string;
  title: string;
  content: string;
  image: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isSaved: boolean;
}

export const allPosts: Post[] = [
  {
    id: '1',
    author: {
      id: '1',
      name: 'Green Valley Nursery',
      avatar: 'https://images.unsplash.com/photo-1619077130450-baea09efa355?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFudCUyMG51cnNlcnklMjBncmVlbmhvdXNlfGVufDF8fHx8MTc2NTc0MjUzNHww&ixlib=rb-4.1.0&q=80&w=300',
      verified: true,
      type: 'business',
      businessId: '1',
    },
    timeAgo: '2 hours ago',
    title: 'New Arrival: Organic Date Palm Seedlings',
    content: 'We\'re excited to announce the arrival of premium organic date palm seedlings, grown using sustainable practices. These hardy seedlings are perfect for the local climate and come with full growing instructions. Each seedling is carefully selected and tested for quality. We offer free consultation on planting and care.',
    image: 'https://images.unsplash.com/photo-1697788189761-d954ed91cdb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMHBsYW50cyUyMG5hdHVyZXxlbnwxfHx8fDE3NjU2NTE5Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    tags: ['DatePalm', 'OrganicGrowing', 'NewArrival'],
    likes: 142,
    comments: 0,
    shares: 15,
    isLiked: false,
    isSaved: false,
  },
  {
    id: '2',
    author: {
      id: '2',
      name: 'AgriTools Pro',
      avatar: 'https://images.unsplash.com/photo-1690986469727-1ed8bcdf6384?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyZSUyMHRvb2xzJTIwZXF1aXBtZW50fGVufDF8fHx8MTc2NTY1NDY4NHww&ixlib=rb-4.1.0&q=80&w=300',
      verified: true,
      type: 'business',
      businessId: '2',
    },
    timeAgo: '5 hours ago',
    title: 'Essential Tools for Winter Planting Season',
    content: 'As we approach the winter planting season, here are the must-have tools every farmer needs. From soil preparation to irrigation systems, we have everything in stock with special seasonal discounts. Our expert team can help you choose the right equipment for your specific farming needs.',
    image: 'https://images.unsplash.com/photo-1690986469727-1ed8bcdf6384?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyZSUyMHRvb2xzJTIwZXF1aXBtZW50fGVufDF8fHx8MTY1NDY4NHww&ixlib=rb-4.1.0&q=80&w=1080',
    tags: ['WinterPlanting', 'FarmTools', 'SeasonalGuide'],
    likes: 98,
    comments: 0,
    shares: 22,
    isLiked: false,
    isSaved: false,
  },
  {
    id: '3',
    author: {
      id: '5',
      name: 'Eco Farm Solutions',
      avatar: 'https://images.unsplash.com/photo-1636089167961-4964523e6c3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtaW5nJTIwc3Vuc2V0JTIwbGFuZHNjYXBlfGVufDF8fHx8MTc2NTc0MjUzNnww&ixlib=rb-4.1.0&q=80&w=300',
      verified: true,
      type: 'business',
      businessId: '5',
    },
    timeAgo: '1 day ago',
    title: 'Sustainable Farming Workshop - Free Registration',
    content: 'Join us for a comprehensive workshop on sustainable farming practices. Learn about water conservation, organic pest control, and soil health management from industry experts. Limited seats available, register now to secure your spot!',
    image: 'https://images.unsplash.com/photo-1631337902392-b4bb679fbfdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwdmVnZXRhYmxlcyUyMGZhcm1pbmd8ZW58MXx8fHwxNzY1NzQyNTM0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    tags: ['Workshop', 'SustainableFarming', 'Education'],
    likes: 256,
    comments: 0,
    shares: 38,
    isLiked: false,
    isSaved: false,
  },
  {
    id: '4',
    author: {
      id: 'eng1',
      name: 'Engineer Hassan',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
      verified: true,
      type: 'engineer',
    },
    timeAgo: '6 hours ago',
    title: 'Advanced Irrigation System Design Tips',
    content: 'As an agricultural engineer with 10+ years of experience, I want to share some key tips for designing efficient irrigation systems. Proper water distribution can save up to 40% water usage while increasing crop yield. Contact me for free consultation! @AgriTools Pro has great equipment for these systems.',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    tags: ['Irrigation', 'Engineering', 'WaterConservation'],
    likes: 187,
    comments: 0,
    shares: 31,
    isLiked: false,
    isSaved: false,
  },
  {
    id: '5',
    author: {
      id: 'eng2',
      name: 'Engineer Sara',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300',
      verified: true,
      type: 'engineer',
    },
    timeAgo: '12 hours ago',
    title: 'Soil Testing: Why It Matters',
    content: 'Before planting any crop, soil testing is crucial! It helps you understand pH levels, nutrient content, and potential deficiencies. I offer professional soil analysis services across Saudi Arabia. Let me help you maximize your harvest potential.',
    image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    tags: ['SoilTesting', 'AgriScience', 'CropHealth'],
    likes: 156,
    comments: 0,
    shares: 28,
    isLiked: false,
    isSaved: false,
  },
  {
    id: '6',
    author: {
      id: 'user1',
      name: 'Farmer Ali',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      verified: false,
      type: 'user',
    },
    timeAgo: '8 hours ago',
    title: 'First Tomato Harvest of the Season!',
    content: 'So proud to share my first tomato harvest! Thanks to @Engineer Hassan for the irrigation advice and @Green Valley Nursery for the quality seedlings. The organic approach really paid off. Any tips for preserving the harvest?',
    image: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    tags: ['Tomatoes', 'OrganicFarming', 'HarvestSeason'],
    likes: 89,
    comments: 0,
    shares: 12,
    isLiked: false,
    isSaved: false,
  },
  {
    id: '7',
    author: {
      id: 'user2',
      name: 'Sarah Ahmed',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
      verified: false,
      type: 'user',
    },
    timeAgo: '1 day ago',
    title: 'Starting My Rooftop Garden Journey',
    content: 'Just started my first rooftop garden in Jeddah! Any advice from experienced urban farmers? Looking for drought-resistant plants that work well in our climate. Would love to connect with @Engineer Sara for some professional tips.',
    image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    tags: ['UrbanGardening', 'RooftopGarden', 'Beginner'],
    likes: 67,
    comments: 0,
    shares: 8,
    isLiked: false,
    isSaved: false,
  },
  {
    id: '8',
    author: {
      id: 'eng3',
      name: 'Engineer Mohammed',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      verified: true,
      type: 'engineer',
    },
    timeAgo: '2 days ago',
    title: 'Smart Farming Technology Solutions',
    content: 'The future of agriculture is here! I specialize in implementing IoT sensors, automated irrigation, and climate control systems. These technologies can increase efficiency by 60% while reducing water and energy costs. DM me for project consultation.',
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    tags: ['SmartFarming', 'IoT', 'AgTech'],
    likes: 234,
    comments: 0,
    shares: 45,
    isLiked: false,
    isSaved: false,
  },
  {
    id: '9',
    author: {
      id: 'eng1',
      name: 'Engineer Hassan',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
      verified: true,
      type: 'engineer',
    },
    timeAgo: '3 days ago',
    title: 'Water Conservation Techniques',
    content: 'Implementing drip irrigation systems can significantly reduce water waste. Here are my top recommendations for Saudi agricultural conditions.',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    tags: ['WaterConservation', 'Irrigation', 'Tips'],
    likes: 134,
    comments: 0,
    shares: 19,
    isLiked: false,
    isSaved: false,
  },
  {
    id: '10',
    author: {
      id: 'user1',
      name: 'Farmer Ali',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      verified: false,
      type: 'user',
    },
    timeAgo: '4 days ago',
    title: 'My Urban Garden Progress',
    content: 'Started my rooftop garden 3 months ago and the results are amazing! Growing tomatoes, herbs, and flowers.',
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800',
    tags: ['UrbanGarden', 'Rooftop', 'Progress'],
    likes: 76,
    comments: 0,
    shares: 5,
    isLiked: false,
    isSaved: false,
  },
  {
    id: '11',
    author: {
      id: 'eng2',
      name: 'Engineer Sara',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300',
      verified: true,
      type: 'engineer',
    },
    timeAgo: '5 days ago',
    title: 'Understanding Soil pH',
    content: 'Soil pH is critical for nutrient absorption. Let me explain how to test and adjust it for optimal crop growth.',
    image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    tags: ['SoilScience', 'pH', 'Education'],
    likes: 112,
    comments: 0,
    shares: 22,
    isLiked: false,
    isSaved: false,
  },
  {
    id: '12',
    author: {
      id: '1',
      name: 'Green Valley Nursery',
      avatar: 'https://images.unsplash.com/photo-1619077130450-baea09efa355?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFudCUyMG51cnNlcnklMjBncmVlbmhvdXNlfGVufDF8fHx8MTc2NTc0MjUzNHww&ixlib=rb-4.1.0&q=80&w=300',
      verified: true,
      type: 'business',
      businessId: '1',
    },
    timeAgo: '1 week ago',
    title: 'Spring Planting Guide',
    content: 'Get ready for spring! We have a complete selection of seasonal plants perfect for Saudi gardens.',
    image: 'https://images.unsplash.com/photo-1697788189761-d954ed91cdb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    tags: ['Spring', 'PlantingGuide', 'Seasonal'],
    likes: 198,
    comments: 0,
    shares: 34,
    isLiked: false,
    isSaved: false,
  },
];

// Helper function to get posts by author ID
export const getPostsByAuthorId = (authorId: string): Post[] => {
  return allPosts.filter(post => post.author.id === authorId);
};

// Helper function to get posts by business ID
export const getPostsByBusinessId = (businessId: string): Post[] => {
  return allPosts.filter(post => post.author.businessId === businessId);
};
