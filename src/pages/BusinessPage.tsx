import React, { useState } from 'react';
import { MapPin, Star, Users, MessageCircle, Phone, Mail, Globe, Clock, CheckCircle, Heart, ShoppingCart } from 'lucide-react';
import { CartItem } from '../App';
import { businesses } from '../data/businessData';

interface BusinessPageProps {
  businessId: string | null;
  onAddToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  onOpenChat: (businessId: string) => void;
}

export function BusinessPage({ businessId, onAddToCart, onOpenChat }: BusinessPageProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'posts' | 'about'>('products');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);

  // Find the business by ID or default to first one
  const business = businesses.find(b => b.id === businessId) || businesses[0];

  const handleAddToCart = (product: any) => {
    onAddToCart({
      productId: product.id,
      productName: product.name,
      price: product.priceNum,
      image: product.image,
      businessName: business.name,
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Banner */}
      <div className="relative h-80 bg-gradient-to-r from-green-600 to-green-700">
        <img
          src={business.coverImage}
          alt={business.name}
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      {/* Profile Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20">
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Image */}
              <div className="relative">
                <img
                  src={business.logo}
                  alt={business.name}
                  className="w-32 h-32 rounded-xl object-cover border-4 border-white shadow-lg"
                />
                {business.verified && (
                  <div className="absolute -bottom-2 -right-2 bg-green-600 text-white p-2 rounded-full">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Business Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl text-neutral-900 mb-2">{business.name}</h1>
                    <div className="flex items-center gap-4 text-neutral-600 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{business.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-current" />
                        <span>{business.rating}</span>
                        <span className="text-neutral-500">({business.reviews} reviews)</span>
                      </div>
                    </div>
                    <p className="text-neutral-700 mb-4">{business.description}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <button
                      onClick={() => setIsFollowing(!isFollowing)}
                      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                        isFollowing
                          ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isFollowing ? 'fill-current' : ''}`} />
                      <span>{isFollowing ? 'Following' : 'Follow'}</span>
                    </button>
                    <button 
                      onClick={() => onOpenChat(business.id)}
                      className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Message</span>
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-neutral-200">
                  <div>
                    <div className="text-2xl text-neutral-900">{business.followers}</div>
                    <div className="text-sm text-neutral-600">Followers</div>
                  </div>
                  <div>
                    <div className="text-2xl text-neutral-900">{business.products}</div>
                    <div className="text-sm text-neutral-600">Products</div>
                  </div>
                  <div>
                    <div className="text-2xl text-neutral-900">{business.yearsActive}+</div>
                    <div className="text-sm text-neutral-600">Years Active</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="mt-8 mb-12">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-neutral-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex-1 px-6 py-4 transition-colors ${
                    activeTab === 'products'
                      ? 'bg-green-50 text-green-600 border-b-2 border-green-600'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  Products & Services
                </button>
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex-1 px-6 py-4 transition-colors ${
                    activeTab === 'posts'
                      ? 'bg-green-50 text-green-600 border-b-2 border-green-600'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  Posts & Updates
                </button>
                <button
                  onClick={() => setActiveTab('about')}
                  className={`flex-1 px-6 py-4 transition-colors ${
                    activeTab === 'about'
                      ? 'bg-green-50 text-green-600 border-b-2 border-green-600'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  About
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'products' && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {business.productsList.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
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
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg text-neutral-900 mb-2">{product.name}</h3>
                        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xl text-green-600">{product.price}</span>
                          <button 
                            onClick={() => handleAddToCart(product)}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span className="text-sm">Add to Cart</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {business.posts.map((post) => (
                    <div key={post.id} className="border-b border-neutral-200 pb-4 last:border-0">
                      <div className="flex items-start gap-4">
                        <img
                          src={business.logo}
                          alt={business.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-neutral-900">{business.name}</span>
                            <span className="text-neutral-500 text-sm">{post.timeAgo}</span>
                          </div>
                          <h4 className="text-lg text-neutral-900 mb-2">{post.title}</h4>
                          <p className="text-neutral-600">{post.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-6">
                  {/* Contact Info */}
                  <div>
                    <h3 className="text-xl text-neutral-900 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-neutral-700">
                        <Phone className="w-5 h-5 text-green-600" />
                        <span>{business.contact.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 text-neutral-700">
                        <Mail className="w-5 h-5 text-green-600" />
                        <span>{business.contact.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-neutral-700">
                        <Globe className="w-5 h-5 text-green-600" />
                        <a href="#" className="text-green-600 hover:underline">{business.contact.website}</a>
                      </div>
                    </div>
                  </div>

                  {/* Business Hours */}
                  <div>
                    <h3 className="text-xl text-neutral-900 mb-4">Business Hours</h3>
                    <div className="flex items-start gap-3 text-neutral-700">
                      <Clock className="w-5 h-5 text-green-600 mt-1" />
                      <div className="space-y-1">
                        {business.hours.map((hour, index) => (
                          <div key={index}>{hour}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div>
                    <h3 className="text-xl text-neutral-900 mb-4">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {business.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="bg-green-100 text-green-700 px-4 py-2 rounded-lg"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Window */}
      {showChatWindow && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-40 border border-neutral-200">
          <div className="bg-green-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={business.logo} alt={business.name} className="w-10 h-10 rounded-lg object-cover" />
              <div>
                <div>{business.name}</div>
                <div className="text-xs text-green-100">Online</div>
              </div>
            </div>
            <button onClick={() => setShowChatWindow(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
              ✕
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto bg-neutral-50">
            <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
              <p className="text-sm text-neutral-700">Hello! How can we help you today?</p>
            </div>
          </div>
          <div className="p-4 border-t border-neutral-200">
            <input
              type="text"
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
            />
          </div>
        </div>
      )}
    </div>
  );
}