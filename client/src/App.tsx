import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { PostsPage } from './pages/PostsPage';
import { BusinessPage } from './pages/BusinessPage';
import { FollowingPage } from './pages/FollowingPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ProfilePage } from './pages/ProfilePage';
import { SearchPage } from './pages/SearchPage';
import { ChatsPage } from './pages/ChatsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SavedItemsPage } from './pages/SavedItemsPage';
import { RegisterBusinessPage } from './pages/RegisterBusinessPage';
import { AIAssistant } from './components/AIAssistant';
import { Footer } from './components/Footer';
import { businesses } from './data/businessData';

export type Page = 'home' | 'posts' | 'business' | 'following' | 'cart' | 'checkout' | 'profile' | 'search' | 'chats' | 'notifications' | 'saved' | 'register-business';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  businessName: string;
}

export interface SavedItem {
  id: string;
  type: 'product' | 'post' | 'business';
  itemId: string;
  title: string;
  image: string;
  description: string;
  savedAt: Date;
}

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  avatar: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [selectedChatBusinessId, setSelectedChatBusinessId] = useState<string | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [notifications, setNotifications] = useState<any[]>([
    { id: '1', type: 'order', message: 'Your order has been shipped', read: false, time: '2 hours ago' },
    { id: '2', type: 'message', message: 'New message from Green Valley Nursery', read: false, time: '5 hours ago' },
    { id: '3', type: 'follow', message: 'Eco Farm Solutions started following you', read: true, time: '1 day ago' },
  ]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    fullName: 'Ahmed Al-Mansour',
    email: 'ahmed.mansour@example.com',
    phone: '+966 50 123 4567',
    location: 'Riyadh, Saudi Arabia',
    bio: 'Farmer & Agricultural Enthusiast',
    avatar: '',
  });

  const handleViewBusiness = (businessId: string) => {
    setSelectedBusinessId(businessId);
    setCurrentPage('business');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenChat = (businessId: string) => {
    setSelectedChatBusinessId(businessId);
    setCurrentPage('chats');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    if (page !== 'chats') {
      setSelectedChatBusinessId(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (item: Omit<CartItem, 'id' | 'quantity'>) => {
    const existingItem = cartItems.find(i => i.productId === item.productId);
    if (existingItem) {
      setCartItems(cartItems.map(i => 
        i.productId === item.productId 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setCartItems([...cartItems, { ...item, id: Date.now().toString(), quantity: 1 }]);
    }
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      setCartItems(cartItems.filter(item => item.id !== itemId));
    } else {
      setCartItems(cartItems.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const addSavedItem = (item: SavedItem) => {
    setSavedItems([...savedItems, item]);
  };

  const removeSavedItem = (itemId: string) => {
    setSavedItems(savedItems.filter(item => item.id !== itemId));
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const updateUserProfile = (profile: UserProfile) => {
    setUserProfile(profile);
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onViewBusiness={handleViewBusiness} onNavigate={handleNavigate} />;
      case 'posts':
        return <PostsPage onSavePost={addSavedItem} />;
      case 'business':
        return <BusinessPage businessId={selectedBusinessId} onAddToCart={addToCart} onOpenChat={handleOpenChat} />;
      case 'following':
        return <FollowingPage onViewBusiness={handleViewBusiness} />;
      case 'cart':
        return (
          <CartPage 
            cartItems={cartItems} 
            onUpdateQuantity={updateCartQuantity}
            onRemove={removeFromCart}
            onCheckout={() => handleNavigate('checkout')}
          />
        );
      case 'checkout':
        return <CheckoutPage cartItems={cartItems} onSuccess={clearCart} />;
      case 'profile':
        return <ProfilePage userProfile={userProfile} onUpdateProfile={updateUserProfile} onNavigate={handleNavigate} />;
      case 'search':
        return <SearchPage onViewBusiness={handleViewBusiness} />;
      case 'chats':
        return <ChatsPage onViewBusiness={handleViewBusiness} selectedBusinessId={selectedChatBusinessId} />;
      case 'notifications':
        return <NotificationsPage notifications={notifications} onMarkAsRead={markNotificationAsRead} onClearAll={clearAllNotifications} />;
      case 'saved':
        return <SavedItemsPage savedItems={savedItems} onRemove={removeSavedItem} onViewBusiness={handleViewBusiness} />;
      case 'register-business':
        return <RegisterBusinessPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onViewBusiness={handleViewBusiness} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation 
        currentPage={currentPage}
        onNavigate={handleNavigate}
        cartItemCount={cartItems.length}
        notificationCount={unreadNotifications}
      />
      
      {renderPage()}

      <Footer />
      
      <AIAssistant isOpen={showAIChat} onToggle={() => setShowAIChat(!showAIChat)} />
    </div>
  );
}

export default App;