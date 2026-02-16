import { UserProfile } from '../App';

export interface ExtendedUserProfile extends UserProfile {
  id: string;
  username?: string;
  verified?: boolean;
  followers?: number;
  following?: number;
  postsCount?: number;
  threadsCount?: number;
}

// Centralized user profiles - single source of truth
export const userProfiles: Record<string, ExtendedUserProfile> = {
  // Current logged-in user (example)
  'current-user': {
    id: 'current-user',
    fullName: 'Ahmed Al-Rashid',
    name: 'Ahmed Al-Rashid',
    email: 'ahmed@mashtal.com',
    phone: '+966 50 123 4567',
    location: 'Riyadh, Saudi Arabia',
    bio: 'Passionate about sustainable agriculture and modern farming techniques. Always learning and sharing knowledge with the community.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    role: 'visitor',
    verified: false,
    followers: 1243,
    following: 89,
    postsCount: 0,
    threadsCount: 0,
  },
  
  // Engineers
  'engineer-1': {
    id: 'engineer-1',
    fullName: 'Dr. Sarah Johnson',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@agritech.com',
    phone: '+966 55 234 5678',
    location: 'Jeddah, Saudi Arabia',
    bio: 'Agricultural engineer specializing in irrigation systems and water management.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    role: 'engineer',
    specialization: 'Irrigation Systems Engineer',
    yearsExperience: 12,
    verified: true,
    followers: 3420,
    following: 156,
    postsCount: 45,
    threadsCount: 23,
  },
  
  'engineer-2': {
    id: 'engineer-2',
    fullName: 'Eng. Mohammed Al-Qasim',
    name: 'Eng. Mohammed Al-Qasim',
    email: 'mohammed.alqasim@farmtech.sa',
    phone: '+966 50 345 6789',
    location: 'Dammam, Saudi Arabia',
    bio: 'Expert in greenhouse automation and climate control systems.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    role: 'engineer',
    specialization: 'Greenhouse Systems',
    yearsExperience: 8,
    verified: true,
    followers: 2150,
    following: 98,
    postsCount: 32,
    threadsCount: 18,
  },
  
  // Businesses
  'business-1': {
    id: 'business-1',
    fullName: 'Green Valley Nursery',
    name: 'Green Valley Nursery',
    email: 'contact@greenvalley.sa',
    phone: '+966 11 234 5678',
    location: 'Riyadh, Saudi Arabia',
    bio: 'Premium plant nursery offering a wide selection of ornamental and fruit plants.',
    avatar: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
    role: 'business',
    company: 'Green Valley Nursery',
    verified: true,
    followers: 5680,
    following: 234,
    postsCount: 128,
    threadsCount: 42,
  },
  
  'business-2': {
    id: 'business-2',
    fullName: 'Desert Bloom Agricultural Supplies',
    name: 'Desert Bloom Agricultural Supplies',
    email: 'info@desertbloom.sa',
    phone: '+966 12 345 6789',
    location: 'Jeddah, Saudi Arabia',
    bio: 'Your one-stop shop for all agricultural supplies, tools, and equipment.',
    avatar: 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?w=400',
    role: 'business',
    company: 'Desert Bloom Agricultural Supplies',
    verified: true,
    followers: 4320,
    following: 187,
    postsCount: 96,
    threadsCount: 31,
  },
  
  // Regular users
  'user-1': {
    id: 'user-1',
    fullName: 'Fatima Al-Salem',
    name: 'Fatima Al-Salem',
    email: 'fatima.salem@email.com',
    phone: '+966 50 456 7890',
    location: 'Medina, Saudi Arabia',
    bio: 'Home gardener passionate about organic vegetables and herbs.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    role: 'visitor',
    verified: false,
    followers: 345,
    following: 123,
    postsCount: 18,
    threadsCount: 9,
  },
  
  'user-2': {
    id: 'user-2',
    fullName: 'Omar Abdullah',
    name: 'Omar Abdullah',
    email: 'omar.abdullah@email.com',
    phone: '+966 55 567 8901',
    location: 'Abha, Saudi Arabia',
    bio: 'Small-scale farmer focusing on sustainable practices.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    role: 'visitor',
    verified: false,
    followers: 521,
    following: 87,
    postsCount: 24,
    threadsCount: 12,
  },
  
  'user-3': {
    id: 'user-3',
    fullName: 'Layla Hassan',
    name: 'Layla Hassan',
    email: 'layla.hassan@email.com',
    phone: '+966 50 678 9012',
    location: 'Taif, Saudi Arabia',
    bio: 'Rose enthusiast and landscape designer.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    role: 'visitor',
    verified: false,
    followers: 892,
    following: 201,
    postsCount: 42,
    threadsCount: 15,
  },
};

// Helper function to get user profile by ID
export function getUserProfileById(userId: string): ExtendedUserProfile | undefined {
  return userProfiles[userId];
}

// Helper function to get current user (this would come from auth in production)
export function getCurrentUser(): ExtendedUserProfile {
  return userProfiles['current-user'];
}

// Helper function to update user profile (simulates database update)
export function updateUserProfile(userId: string, updates: Partial<ExtendedUserProfile>): void {
  if (userProfiles[userId]) {
    userProfiles[userId] = {
      ...userProfiles[userId],
      ...updates,
    };
  }
}

// Helper to check if user owns content
export function isOwnContent(contentAuthorId: string, currentUserId: string): boolean {
  return contentAuthorId === currentUserId;
}
