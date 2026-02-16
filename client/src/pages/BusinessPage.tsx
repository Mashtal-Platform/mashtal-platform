import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Star, Users, MessageCircle, Phone, Mail, Globe, Clock, CheckCircle, CheckCircle2, Heart, 
  ShoppingCart, Bookmark, X, Send, ThumbsUp, Reply as ReplyIcon, Edit, 
  FileText, Package, MoreHorizontal, Edit2, Trash2, User, Briefcase, Award
} from 'lucide-react';
import { CartItem } from '../App';
import { PostModal } from '../components/PostModal';
import { PostsFeed } from '../components/PostsFeed';
import { ShareModal } from '../components/ShareModal';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { 
  otherUsers, 
  mockPosts as centralPosts, 
  mockThreads as centralThreads, 
  mockProducts as centralProducts,
  currentUser,
  getTotalCommentCount
} from '../data/centralMockData';
import { InteractiveRating } from '../components/InteractiveRating';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';

interface BusinessPageProps {
  businessId: string | null;
  onAddToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  onOpenChat: (businessId: string) => void;
  followedBusinesses: any[];
  onFollowBusiness: (business: any) => void;
  onUnfollowBusiness: (businessId: string) => void;
  onNavigateToBusiness?: (businessId: string) => void;
  businessThreads?: any[];
  savedItems?: any[];
  onSaveItem?: (item: any) => void;
  onNavigateWithParams?: (page: string, params?: any) => void;
}

interface MentionUser {
  id: string;
  name: string;
  avatar: string;
  type: 'engineer' | 'business' | 'user';
  verified?: boolean;
}

// Mock users/businesses for mentions - pull from central
const mentionableUsers: MentionUser[] = [...otherUsers, currentUser].map(u => ({
  id: u.id,
  name: u.fullName,
  avatar: u.avatar,
  type: u.role as any,
  verified: u.verified
}));

export function BusinessPage({ businessId, onAddToCart, onOpenChat, followedBusinesses, onFollowBusiness, onUnfollowBusiness, onNavigateToBusiness, businessThreads = [], savedItems = [], onSaveItem, onNavigateWithParams }: BusinessPageProps) {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'posts' | 'threads' | 'about'>('products');
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set());

  // Find the business by ID or default to first one
  const business = otherUsers.find(u => u.businessId === businessId || u.id === businessId) || otherUsers.find(u => u.role === 'business') || otherUsers[0];
  
  // Check if viewing own profile
  const isOwnProfile = user?.id === business?.id || user?.businessId === business?.businessId || user?.id === business?.businessId;

  // Get posts for this business from centralized data
  const businessPosts = (centralPosts || []).filter(p => p?.authorId === business?.id).map(post => ({
    ...post,
    comments: [] // Managed by PostModal
  }));
  
  // Get threads for this business (filter from businessThreads prop)
  const filteredBusinessThreads = (centralThreads || []).filter(thread => 
    thread?.authorId === business?.id
  );
  
  // Check if business is followed
  const isFollowing = (followedBusinesses || []).some(b => b?.id === business?.id);

  // Map products
  const productsList = (centralProducts || []).filter(p => p?.businessId === business?.businessId || p?.businessId === business?.id).map(p => ({
    ...p,
    price: `SR ${p.price}`,
    priceNum: p.price,
    inStock: p.stock > 0
  }));

  // Mock reviews data for the business
  const businessReviews = [
    {
      id: 'rev1',
      author: 'Ahmed Al-Saud',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      rating: 5,
      comment: 'Excellent quality plants! My garden has never looked better. Fast delivery and great customer service.',
      date: '2 weeks ago',
      helpful: 15
    },
    {
      id: 'rev2',
      author: 'Fatima Mohammed',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      rating: 5,
      comment: 'Best agricultural supplier in the region. Always have what I need in stock.',
      date: '1 month ago',
      helpful: 12
    },
    {
      id: 'rev3',
      author: 'Omar Abdullah',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      rating: 4,
      comment: 'Good products and reasonable prices. Would recommend!',
      date: '2 months ago',
      helpful: 8
    }
  ];

  const handleSubmitReview = (rating: number, comment: string) => {
    console.log('Review submitted:', { rating, comment });
    // In a real app, this would send to backend
  };

  const handleAddToCart = (product: any) => {
    onAddToCart({
      productId: product.id,
      productName: product.name,
      price: product.priceNum,
      image: product.image,
      businessName: business.name,
    });
  };

  const handleLikePost = (postId: string) => {
    if (!isAuthenticated) return;
    
    setLikedPosts((prev) => {
      const newLiked = new Set(prev);
      if (newLiked.has(postId)) {
        newLiked.delete(postId);
      } else {
        newLiked.add(postId);
      }
      return newLiked;
    });
  };

  const handleSavePost = (postId: string) => {
    if (!isAuthenticated) return;
    
    setSavedPosts((prev) => {
      const newSaved = new Set(prev);
      if (newSaved.has(postId)) {
        newSaved.delete(postId);
      } else {
        newSaved.add(postId);
      }
      return newSaved;
    });
  };

  const handleSaveProduct = (product: any) => {
    if (!isAuthenticated || !onSaveItem) return;
    
    const isAlreadySaved = savedProducts.has(product.id);
    
    setSavedProducts((prev) => {
      const newSaved = new Set(prev);
      if (newSaved.has(product.id)) {
        newSaved.delete(product.id);
      } else {
        newSaved.add(product.id);
      }
      return newSaved;
    });

    // If not already saved, add to saved items
    if (!isAlreadySaved) {
      onSaveItem({
        id: `saved-product-${product.id}-${Date.now()}`,
        type: 'product',
        itemId: product.id,
        businessId: business.id,
        title: product.name,
        image: product.image,
        description: product.description,
        price: product.price,
        savedAt: new Date(),
      });
    }
  };

  const handlePostClick = (post: any) => {
    setSelectedPost({
      ...post,
      authorName: business.name,
      authorAvatar: business.logo,
      authorVerified: business.verified,
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Banner */}
      <div className="relative h-80 bg-gradient-to-r from-green-600 to-green-700">
        <img
          src={business.avatar}
          alt={business.fullName}
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      {/* Profile Header Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20">
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Image */}
              <div className="relative">
                <img
                  src={business.avatar}
                  alt={business.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg bg-neutral-100"
                />
                {business.verified && (
                  <div className="absolute bottom-1 right-1 bg-green-600 text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Business Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold text-neutral-900">{business.fullName}</h1>
                      <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-green-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified Business
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-neutral-600 mb-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-neutral-400" />
                        <span>{business.location}</span>
                      </div>
                      {business.rating && (
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-500 fill-current" />
                          <span>{business.rating}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-neutral-700 max-w-2xl leading-relaxed">{business.bio}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    {isAuthenticated && (
                      <>
                        <Button
                          onClick={() => {
                            if (isFollowing) {
                              onUnfollowBusiness(business.id);
                            } else {
                              onFollowBusiness({
                                id: business.id,
                                name: business.fullName,
                                role: 'business',
                                location: business.location,
                                image: business.avatar,
                                rating: business.rating,
                                reviews: business.reviewsCount,
                                followers: business.followers,
                              });
                            }
                          }}
                          variant={isFollowing ? "outline" : "default"}
                          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg transition-all ${
                            isFollowing ? 'border-neutral-200 text-neutral-700' : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${isFollowing ? 'fill-current' : ''}`} />
                          <span>{isFollowing ? 'Following' : 'Follow'}</span>
                        </Button>
                        <Button 
                          onClick={() => onOpenChat(business.id)}
                          variant="outline"
                          className="flex items-center justify-center gap-2 px-6 py-2.5 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-all"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span>Message</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 mt-8 pt-6 border-t border-neutral-100">
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-neutral-900">{business.followers}</div>
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Followers</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-neutral-900">{businessPosts.length}</div>
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Posts</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-neutral-900">{filteredBusinessThreads.length}</div>
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Threads</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs Section */}
        <div className="mt-8 mb-16">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-neutral-200 px-2">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('products')}
                  data-tab="products"
                  className={`relative px-8 py-5 text-sm font-semibold transition-all ${
                    activeTab === 'products' ? 'text-green-600' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Products</span>
                  </div>
                  {activeTab === 'products' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />}
                </button>
                <button
                  onClick={() => setActiveTab('posts')}
                  data-tab="posts"
                  className={`relative px-8 py-5 text-sm font-semibold transition-all ${
                    activeTab === 'posts' ? 'text-green-600' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Posts</span>
                  </div>
                  {activeTab === 'posts' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />}
                </button>
                <button
                  onClick={() => setActiveTab('threads')}
                  data-tab="threads"
                  className={`relative px-8 py-5 text-sm font-semibold transition-all ${
                    activeTab === 'threads' ? 'text-green-600' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>Threads</span>
                  </div>
                  {activeTab === 'threads' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />}
                </button>
                <button
                  onClick={() => setActiveTab('about')}
                  data-tab="about"
                  className={`relative px-8 py-5 text-sm font-semibold transition-all ${
                    activeTab === 'about' ? 'text-green-600' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>About</span>
                  </div>
                  {activeTab === 'about' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {/* Products Tab */}
              {activeTab === 'products' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {productsList.map((product) => (
                    <div
                      key={product.id}
                      id={`product-${product.id}`}
                      onClick={() => {
                        if (isOwnProfile && onNavigateWithParams) {
                          onNavigateWithParams('dashboard', { productId: product.id });
                        }
                      }}
                      className={`group bg-white border border-neutral-200 rounded-lg overflow-hidden transition-all ${
                        isOwnProfile ? 'cursor-pointer hover:shadow-xl hover:border-green-500 hover:-translate-y-1' : 'hover:shadow-lg'
                      }`}
                    >
                      <div className="relative h-48">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {product.inStock && (
                          <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded text-xs">
                            In Stock
                          </div>
                        )}
                        {isOwnProfile && (
                          <div className="absolute bottom-3 left-3 right-3 bg-green-600/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs font-medium text-center opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to manage
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg text-neutral-900 mb-2">{product.name}</h3>
                        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xl font-bold text-green-600">{product.price}</span>
                          {!isOwnProfile && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveProduct(product);
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                savedProducts.has(product.id)
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                              }`}
                            >
                              <Bookmark className={`w-5 h-5 ${savedProducts.has(product.id) ? 'fill-current' : ''}`} />
                            </button>
                          )}
                        </div>
                        {isAuthenticated && !isOwnProfile && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span className="text-sm font-medium">Add to Cart</span>
                          </button>
                        )}
                        {isOwnProfile && (
                          <div className="text-center py-2.5 px-4 bg-green-50 rounded-lg border border-green-200">
                            <span className="text-sm font-medium text-green-700">📊 Manage Product</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Posts Tab */}
              {activeTab === 'posts' && (
                <div>
                  {businessPosts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {businessPosts.map((post) => (
                        <div
                          key={post.id}
                          className="group relative aspect-square rounded-lg overflow-hidden bg-neutral-200 cursor-pointer shadow-sm hover:shadow-md transition-all"
                          onClick={() => handlePostClick(post)}
                        >
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold">
                            <div className="flex items-center gap-2">
                              <Heart className="w-5 h-5 fill-current" />
                              <span>{post.likes}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageCircle className="w-5 h-5 fill-current" />
                              <span>{getTotalCommentCount(post.id)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200">
                      <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 font-medium">No posts yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Threads Tab */}
              {activeTab === 'threads' && (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {filteredBusinessThreads.length > 0 ? (
                    filteredBusinessThreads.map((thread) => (
                      <div
                        key={thread.id}
                        className="group border border-neutral-200 rounded-xl p-6 hover:border-green-200 hover:shadow-md transition-all bg-white relative"
                      >
                        <div className="flex items-start gap-4">
                          <img
                            src={business.logo}
                            alt={business.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-neutral-900 text-sm">{business.name}</h3>
                              <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-tight">{thread.timeAgo}</span>
                            </div>
                            <p className="text-neutral-700 mb-4 line-clamp-3 leading-relaxed text-sm">
                              {thread.content}
                            </p>
                            <div className="flex items-center gap-6 text-sm text-neutral-400">
                              <div className="flex items-center gap-1.5 group/btn cursor-pointer hover:text-red-500 transition-colors">
                                <Heart className="w-4 h-4 group-hover/btn:fill-current" />
                                <span className="font-medium">{thread.likes || 0}</span>
                              </div>
                              <div className="flex items-center gap-1.5 group/btn cursor-pointer hover:text-green-600 transition-colors">
                                <MessageCircle className="w-4 h-4" />
                                <span className="font-medium">{thread.comments || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200">
                      <MessageCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 font-medium">No threads yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <div className="space-y-10">
                  <section>
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                      About {business.fullName}
                    </h3>
                    <p className="text-neutral-700 leading-relaxed bg-neutral-50 p-6 rounded-xl border border-neutral-100 text-sm">
                      {business.bio}
                    </p>
                  </section>
                  
                  <section>
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                          <Phone className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Phone</div>
                          <div className="text-neutral-900 font-semibold">{business.phone}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                          <Mail className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Email</div>
                          <div className="text-neutral-900 font-semibold">{business.email}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                          <Globe className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Website</div>
                          <a href="#" className="text-green-600 font-semibold hover:underline">www.{business.fullName.toLowerCase().replace(/\s/g, '')}.sa</a>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                          <MapPin className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Location</div>
                          <div className="text-neutral-900 font-semibold">{business.location}</div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Business Hours */}
                  <section>
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                      Business Hours
                    </h3>
                    <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100">
                      <div className="flex items-start gap-3 text-neutral-700">
                        <Clock className="w-5 h-5 text-green-600 mt-1" />
                        <div className="space-y-1">
                          {business.hours.map((hour, index) => (
                            <div key={index} className="text-sm">{hour}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Specialties */}
                  <section>
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                      Specialties
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {business.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </section>

                  {/* Reviews - Interactive Rating */}
                  <section>
                    <InteractiveRating
                      rating={business.rating}
                      totalReviews={business.reviews}
                      reviews={businessReviews}
                      type="business"
                      entityName={business.name}
                      onSubmitReview={handleSubmitReview}
                    />
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          onLike={() => handleLikePost(selectedPost.id)}
          onComment={(text) => console.log('comment', text)}
          onShare={() => console.log('share')}
          onSave={() => handleSavePost(selectedPost.id)}
          isLiked={likedPosts.has(selectedPost.id)}
          isSaved={savedPosts.has(selectedPost.id)}
        />
      )}
    </div>
  );
}