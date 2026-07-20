import React, { useState } from 'react';
import { Sprout, Search, ShoppingBag, Bell, User, Menu, X, MessageCircle, MoreVertical, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Page } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  cartItemCount: number;
  notificationCount: number;
}

export function Navigation({ currentPage, onNavigate, cartItemCount, notificationCount }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, signOut } = useAuth();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  const handleLogout = async () => {
    await signOut();
    onNavigate('home');
  };

  const LanguageToggle = ({ className = '' }: { className?: string }) => (
    <div
      className={`inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-50 p-0.5 text-xs font-semibold ${className}`}
      role="group"
      aria-label={t('nav.language')}
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded-md transition-colors ${
          language === 'en' ? 'bg-white text-green-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
        }`}
        aria-pressed={language === 'en'}
      >
        {t('nav.english')}
      </button>
      <button
        type="button"
        onClick={() => setLanguage('ar')}
        className={`px-2 py-1 rounded-md transition-colors ${
          language === 'ar' ? 'bg-white text-green-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
        }`}
        aria-pressed={language === 'ar'}
      >
        {t('nav.arabic')}
      </button>
    </div>
  );

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
                {t('nav.discover')}
              </button>
              <button 
                onClick={() => onNavigate('posts')}
                className={`transition-colors ${
                  currentPage === 'posts' ? 'text-green-600' : 'text-neutral-700 hover:text-green-600'
                }`}
              >
                {t('nav.posts')}
              </button>
              <button 
                onClick={() => onNavigate('threads')}
                className={`transition-colors ${
                  currentPage === 'threads' ? 'text-green-600' : 'text-neutral-700 hover:text-green-600'
                }`}
              >
                {t('nav.threads')}
              </button>
              <button 
                onClick={() => onNavigate('shopping')}
                className={`transition-colors ${
                  currentPage === 'shopping' ? 'text-green-600' : 'text-neutral-700 hover:text-green-600'
                }`}
              >
                {t('nav.shop')}
              </button>
              
              {(user?.role === 'business') && (
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className={`transition-colors ${
                    currentPage === 'dashboard' ? 'text-green-600' : 'text-neutral-700 hover:text-green-600'
                  }`}
                >
                  {t('nav.dashboard')}
                </button>
              )}
              {(user?.role === 'admin') && (
                <button 
                  onClick={() => onNavigate('admin')}
                  className={`transition-colors ${
                    currentPage === 'admin' ? 'text-green-600' : 'text-neutral-700 hover:text-green-600'
                  }`}
                >
                  {t('nav.admin')}
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-3">
              <LanguageToggle className="hidden sm:inline-flex" />

              <button 
                onClick={() => onNavigate('search')}
                className="hidden sm:block p-2 hover:bg-neutral-100 rounded-lg transition-colors" 
                aria-label={t('nav.search')}
              >
                <Search className="w-5 h-5 text-neutral-700" />
              </button>
              
              {isAuthenticated && (
                <button 
                  onClick={() => onNavigate('chats')}
                  className="hidden sm:block p-2 hover:bg-neutral-100 rounded-lg transition-colors relative" 
                  aria-label={t('nav.messages')}
                >
                  <MessageCircle className="w-5 h-5 text-neutral-700" />
                </button>
              )}
              
              {isAuthenticated && (
                <button 
                  onClick={() => onNavigate('cart')}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors relative" 
                  aria-label={t('nav.cart')}
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
                  aria-label={t('nav.notifications')}
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
                  className="hidden sm:block p-2 hover:bg-neutral-100 rounded-lg transition-colors" 
                  aria-label={t('nav.profile')}
                >
                  <User className="w-5 h-5 text-neutral-700" />
                </button>
              )}
              
              {/* 3-Dots Dropdown Menu - Only for authenticated users */}
              {isAuthenticated && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className="hidden sm:block p-2 hover:bg-neutral-100 rounded-lg transition-colors" 
                      aria-label={t('nav.menu')}
                    >
                      <MoreVertical className="w-5 h-5 text-neutral-700" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('nav.logout')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {!isAuthenticated ? (
                <button 
                  onClick={() => onNavigate('signin')}
                  className="hidden sm:block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t('nav.signIn')}
                </button>
              ) : (
                user?.role !== 'business' &&
                user?.role !== 'admin' && (
                  <button 
                    onClick={() => onNavigate('register-business')}
                    className="hidden sm:block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {t('nav.registerBusiness')}
                  </button>
                )
              )}

              {/* Mobile menu button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label={t('nav.menu')}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-neutral-200">
              <div className="flex flex-col gap-2">
                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="text-sm text-neutral-600">{t('nav.language')}</span>
                  <LanguageToggle />
                </div>
                <button 
                  onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
                  className={`text-left px-4 py-2 rounded-lg transition-colors ${
                    currentPage === 'home' ? 'bg-green-50 text-green-600' : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {t('nav.discover')}
                </button>
                <button 
                  onClick={() => { onNavigate('posts'); setMobileMenuOpen(false); }}
                  className={`text-left px-4 py-2 rounded-lg transition-colors ${
                    currentPage === 'posts' ? 'bg-green-50 text-green-600' : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {t('nav.posts')}
                </button>
                <button 
                  onClick={() => { onNavigate('threads'); setMobileMenuOpen(false); }}
                  className={`text-left px-4 py-2 rounded-lg transition-colors ${
                    currentPage === 'threads' ? 'bg-green-50 text-green-600' : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {t('nav.threads')}
                </button>
                <button 
                  onClick={() => { onNavigate('shopping'); setMobileMenuOpen(false); }}
                  className={`text-left px-4 py-2 rounded-lg transition-colors ${
                    currentPage === 'shopping' ? 'bg-green-50 text-green-600' : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {t('nav.shop')}
                </button>
                
                {(user?.role === 'business') && (
                  <button 
                    onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }}
                    className={`text-left px-4 py-2 rounded-lg transition-colors ${
                      currentPage === 'dashboard' ? 'bg-green-50 text-green-600' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    {t('nav.dashboard')}
                  </button>
                )}
                {(user?.role === 'admin') && (
                  <button 
                    onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
                    className={`text-left px-4 py-2 rounded-lg transition-colors ${
                      currentPage === 'admin' ? 'bg-green-50 text-green-600' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    {t('nav.admin')}
                  </button>
                )}

                <button 
                  onClick={() => { onNavigate('search'); setMobileMenuOpen(false); }}
                  className={`text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-2 sm:hidden ${
                    currentPage === 'search' ? 'bg-green-50 text-green-600' : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>{t('nav.search')}</span>
                </button>
                {isAuthenticated && (
                  <button 
                    onClick={() => { onNavigate('chats'); setMobileMenuOpen(false); }}
                    className={`text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-2 sm:hidden ${
                      currentPage === 'chats' ? 'bg-green-50 text-green-600' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{t('nav.messages')}</span>
                  </button>
                )}
                {isAuthenticated && (
                  <button 
                    onClick={() => { onNavigate('profile'); setMobileMenuOpen(false); }}
                    className={`text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-2 sm:hidden ${
                      currentPage === 'profile' ? 'bg-green-50 text-green-600' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>{t('nav.profile')}</span>
                  </button>
                )}
                
                {isAuthenticated && (
                  <button 
                    onClick={() => { 
                      handleLogout(); 
                      setMobileMenuOpen(false); 
                    }}
                    className="text-left px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('nav.logout')}</span>
                  </button>
                )}
                
                {!isAuthenticated ? (
                  <button 
                    onClick={() => { onNavigate('signin'); setMobileMenuOpen(false); }}
                    className="text-left px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors sm:hidden"
                  >
                    {t('nav.signIn')}
                  </button>
                ) : (
                  user?.role !== 'business' &&
                  user?.role !== 'admin' && (
                    <button 
                      onClick={() => { onNavigate('register-business'); setMobileMenuOpen(false); }}
                      className="text-left px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors sm:hidden"
                    >
                      {t('nav.registerBusiness')}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
