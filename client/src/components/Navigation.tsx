import React, { useState } from 'react';
import { Sprout, Search, ShoppingBag, Bell, User, Menu, X, MessageCircle, MoreVertical, LogOut, RefreshCw } from 'lucide-react';
import { Page } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { SwitchUserModal } from './SwitchUserModal';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  cartItemCount: number;
  notificationCount: number;
}

export function Navigation({ currentPage, onNavigate, cartItemCount, notificationCount }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSwitchUserModal, setShowSwitchUserModal] = useState(false);
  const { isAuthenticated, user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    onNavigate('home');
  };

  return (
    <>
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
                onClick={() => onNavigate('threads')}
                className={`transition-colors ${
                  currentPage === 'threads' ? 'text-green-600' : 'text-neutral-700 hover:text-green-600'
                }`}
              >
                Threads
              </button>
              <button 
                onClick={() => onNavigate('shopping')}
                className={`transition-colors ${
                  currentPage === 'shopping' ? 'text-green-600' : 'text-neutral-700 hover:text-green-600'
                }`}
              >
                Shop
              </button>
              
              {(user?.role === 'engineer' || user?.role === 'business') && (
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className={`transition-colors ${
                    currentPage === 'dashboard' ? 'text-green-600' : 'text-neutral-700 hover:text-green-600'
                  }`}
                >
                  Dashboard
                </button>
              )}
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
              
              {isAuthenticated && (
                <button 
                  onClick={() => onNavigate('chats')}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors relative" 
                  aria-label="Messages"
                >
                  <MessageCircle className="w-5 h-5 text-neutral-700" />
                </button>
              )}
              
              {isAuthenticated && (
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
              )}
              
              {isAuthenticated && (
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
              )}
              
              {isAuthenticated && (
                <button 
                  onClick={() => onNavigate('profile')}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors" 
                  aria-label="Profile"
                >
                  <User className="w-5 h-5 text-neutral-700" />
                </button>
              )}
              
              {/* 3-Dots Dropdown Menu - Only for authenticated users */}
              {isAuthenticated && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors" 
                      aria-label="More options"
                    >
                      <MoreVertical className="w-5 h-5 text-neutral-700" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => setShowSwitchUserModal(true)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Switch User</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {!isAuthenticated ? (
                <button 
                  onClick={() => onNavigate('signin')}
                  className="hidden sm:block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Sign In
                </button>
              ) : (
                // Only show Register Business button if user is not already a business
                user?.role !== 'business' && (
                  <button 
                    onClick={() => onNavigate('register-business')}
                    className="hidden sm:block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Register Business
                  </button>
                )
              )}

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
                  onClick={() => { onNavigate('threads'); setMobileMenuOpen(false); }}
                  className={`text-left px-4 py-2 rounded-lg transition-colors ${
                    currentPage === 'threads' ? 'bg-green-50 text-green-600' : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Threads
                </button>
                <button 
                  onClick={() => { onNavigate('shopping'); setMobileMenuOpen(false); }}
                  className={`text-left px-4 py-2 rounded-lg transition-colors ${
                    currentPage === 'shopping' ? 'bg-green-50 text-green-600' : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Shop
                </button>
                
                {(user?.role === 'engineer' || user?.role === 'business') && (
                  <button 
                    onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }}
                    className={`text-left px-4 py-2 rounded-lg transition-colors ${
                      currentPage === 'dashboard' ? 'bg-green-50 text-green-600' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    Dashboard
                  </button>
                )}
                
                {/* Separator */}
                {isAuthenticated && (
                  <div className="border-t border-neutral-200 my-2" />
                )}
                
                {/* Mobile - Switch User & Logout */}
                {isAuthenticated && (
                  <>
                    <button 
                      onClick={() => { 
                        setShowSwitchUserModal(true); 
                        setMobileMenuOpen(false); 
                      }}
                      className="text-left px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Switch User</span>
                    </button>
                    <button 
                      onClick={() => { 
                        handleLogout(); 
                        setMobileMenuOpen(false); 
                      }}
                      className="text-left px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </>
                )}
                
                {!isAuthenticated ? (
                  <button 
                    onClick={() => { onNavigate('signin'); setMobileMenuOpen(false); }}
                    className="text-left px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors sm:hidden"
                  >
                    Sign In
                  </button>
                ) : (
                  // Only show Register Business button if user is not already a business
                  user?.role !== 'business' && (
                    <button 
                      onClick={() => { onNavigate('register-business'); setMobileMenuOpen(false); }}
                      className="text-left px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors sm:hidden"
                    >
                      Register Business
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Switch User Modal */}
      {showSwitchUserModal && (
        <SwitchUserModal
          onClose={() => setShowSwitchUserModal(false)}
        />
      )}
    </>
  );
}