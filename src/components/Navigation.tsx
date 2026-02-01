import React, { useState } from 'react';
import { Sprout, Search, ShoppingBag, Bell, User, Menu, X, MessageCircle } from 'lucide-react';
import { Page } from '../App';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  cartItemCount: number;
  notificationCount: number;
}

export function Navigation({ currentPage, onNavigate, cartItemCount, notificationCount }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <span className="text-neutral-900">MASHTAL</span>
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => onNavigate('home')}
              className={`transition-colors ${
                currentPage === 'home' ? 'text-green-600' : 'text-neutral-700 hover:text-green-600'
              }`}
            >
              Discover
            </button>
            <button 
              onClick={() => onNavigate('posts')}
              className={`transition-colors ${
                currentPage === 'posts' ? 'text-green-600' : 'text-neutral-700 hover:text-green-600'
              }`}
            >
              Posts
            </button>
            <button 
              onClick={() => onNavigate('following')}
              className={`transition-colors ${
                currentPage === 'following' ? 'text-green-600' : 'text-neutral-700 hover:text-green-600'
              }`}
            >
              Following
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('search')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors" 
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-neutral-700" />
            </button>
            
            <button 
              onClick={() => onNavigate('chats')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors relative" 
              aria-label="Messages"
            >
              <MessageCircle className="w-5 h-5 text-neutral-700" />
            </button>
            
            <button 
              onClick={() => onNavigate('cart')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors relative" 
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5 text-neutral-700" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
            
            <button 
              onClick={() => onNavigate('notifications')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors relative" 
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-neutral-700" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>
            
            <button 
              onClick={() => onNavigate('profile')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors" 
              aria-label="Profile"
            >
              <User className="w-5 h-5 text-neutral-700" />
            </button>
            
            <button 
              onClick={() => onNavigate('register-business')}
              className="hidden sm:block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Register Business
            </button>

            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200">
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
                className={`text-left px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'home' ? 'bg-green-50 text-green-600' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Discover
              </button>
              <button 
                onClick={() => { onNavigate('posts'); setMobileMenuOpen(false); }}
                className={`text-left px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'posts' ? 'bg-green-50 text-green-600' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Posts
              </button>
              <button 
                onClick={() => { onNavigate('following'); setMobileMenuOpen(false); }}
                className={`text-left px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'following' ? 'bg-green-50 text-green-600' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Following
              </button>
              <button 
                onClick={() => { onNavigate('register-business'); setMobileMenuOpen(false); }}
                className="text-left px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors sm:hidden"
              >
                Register Business
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}