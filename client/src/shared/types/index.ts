// Shared type definitions for the Mashtal platform

// ============= User & Auth Types =============
export type UserRole = 'user' | 'agronomist' | 'engineer' | 'business' | 'admin' | null;

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  location?: string;
  bio?: string;
  companyName?: string;
  businessType?: string;
  verified?: boolean;
  subscriptionStatus?: 'active' | 'inactive';
  businessId?: string;
}

export interface UserProfile {
  id?: string;
  fullName: string;
  name?: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  avatar: string;
  role?: UserRole;
  website?: string;
  company?: string;
  jobTitle?: string;
  specialization?: string;
  skills?: string;
  yearsExperience?: string | number;
  certifications?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  languages?: string;
  interests?: string;
  farmSize?: string;
  additionalNotes?: string;
  customFields?: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  companyName?: string;
}

// ============= Navigation Types =============
export type Page =
  | 'home'
  | 'posts'
  | 'threads'
  | 'shopping'
  | 'business'
  | 'businesses'
  | 'following'
  | 'followers'
  | 'cart'
  | 'checkout'
  | 'profile'
  | 'search'
  | 'chats'
  | 'notifications'
  | 'saved'
  | 'register-business'
  | 'signin'
  | 'signup'
  | 'verify-email'
  | 'payment'
  | 'dashboard'
  | 'create-post'
  | 'create-thread'
  | 'engineer-profile'
  | 'user-profile'
  | 'purchase-history';

// ============= Shopping Types =============
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  businessName: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  businessId?: string;
  businessName?: string;
  category?: string;
  inStock?: boolean;
}

// ============= Content Types =============
export interface SavedItem {
  id: string;
  type: 'product' | 'post' | 'thread' | 'business';
  itemId: string;
  title: string;
  image: string;
  description: string;
  savedAt: Date;
}

export interface Post {
  id: string;
  authorId: string;
  title: string;
  content: string;
  image: string;
  tags: string[];
  likes: number;
  commentsCount: number;
  shares: number;
  timeAgo: string;
  isLiked: boolean;
  isSaved: boolean;
  timestamp: string;
  author?: any;
}

export interface Thread {
  id: string;
  authorId: string;
  title: string;
  content: string;
  tags: string[];
  timestamp: string;
  timeAgo: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isSaved: boolean;
  author?: any;
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

// ============= Business Types =============
export interface Business {
  id: string;
  name: string;
  logo: string;
  category: string;
  rating: number;
  reviews: number;
  location: string;
  description?: string;
  verified?: boolean;
  followers?: number;
}

export interface FollowedEntity {
  id: string;
  name: string;
  role: UserRole;
  location: string;
  image: string;
  followers: number;
  rating?: number;
  reviews?: number;
}

// ============= Notification Types =============
export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'order' | 'review';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
  actionUrl?: string;
}

// ============= Navigation Params =============
export interface NavigationParams {
  profileId?: string;
  highlightPostId?: string;
  highlightCommentId?: string;
  highlightThreadId?: string;
  productId?: string;
  userId?: string;
}

// ============= Mock Data Types =============
export interface MockUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatar: string;
  verified: boolean;
  bio: string;
  location: string;
  phone: string;
  followers: number;
  following: number;
  businessId?: string;
  companyName?: string;
  joinDate: string;
  specialization?: string;
  yearsExperience?: number;
  rating?: number;
  reviewsCount?: number;
  hours?: string[];
  specialties?: string[];
  logo?: string;
  name?: string;
  reviews?: number;
  businessType?: string;
}

export interface MockPost extends Post {
  author: MockUser;
}

export interface MockThread extends Thread {
  author: MockUser;
}
