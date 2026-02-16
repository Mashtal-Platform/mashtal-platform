import React from 'react';
import { Navigation } from './shared/layouts/Navigation';
import { PageTransition } from './shared/layouts/PageTransition';
import { Footer } from './shared/layouts/Footer';
import { AIAssistant } from './shared/layouts/AIAssistant';
import { HomePage } from './pages/HomePage';
import { PostsPage } from './pages/PostsPage';
import { ThreadsPage } from './pages/ThreadsPage';
import { BusinessPage } from './pages/BusinessPage';
import { BusinessesPage } from './pages/BusinessesPage';
import { FollowingPage } from './pages/FollowingPage';
import { FollowersPage } from './pages/FollowersPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ProfilePage } from './pages/ProfilePage';
import { SearchPage } from './pages/SearchPage';
import { ChatsPage } from './pages/ChatsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SavedItemsPage } from './pages/SavedItemsPage';
import { RegisterBusinessPage } from './pages/RegisterBusinessPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { EmailVerificationPage } from './pages/EmailVerificationPage';
import { PaymentPage } from './pages/PaymentPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreatePostPage } from './pages/CreatePostPage';
import { CreateThreadPage } from './pages/CreateThreadPage';
import { EngineerProfilePage } from './pages/EngineerProfilePage';
import { UserProfilePage } from './pages/UserProfilePage';
import { PurchaseHistoryPage } from './pages/PurchaseHistoryPage';
import { ShoppingPage } from './pages/ShoppingPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PostInteractionsProvider } from './contexts/PostInteractionsContext';
import { AppStateProvider, useAppState } from './shared/store/AppStateContext';
import { shouldShowLayout, shouldShowFooter } from './shared/utils/navigation';

// Re-export types for backward compatibility
export type { Page } from './shared/types';
export type { CartItem, SavedItem, UserProfile } from './shared/types';

function AppContent() {
  const { isAuthenticated, user, loading } = useAuth();
  const { state, ...actions } = useAppState();

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-neutral-600">Loading Mashtal...</p>
        </div>
      </div>
    );
  }

  const unreadNotifications = state.notifications.filter(n => !n.read).length;
  const showLayout = shouldShowLayout(state.currentPage);
  const showFooter = shouldShowFooter(state.currentPage);

  const handleBusinessesNavigation = () => {
    if (isAuthenticated) actions.navigate('businesses');
    else actions.navigate('signin');
  };

  const renderPage = () => {
    switch (state.currentPage) {
      case 'home':
        return (
          <HomePage
            onViewBusiness={actions.navigateToBusiness}
            onNavigate={actions.navigate}
            onBusinessesClick={handleBusinessesNavigation}
            onNavigateToUserProfile={actions.navigateToUserProfile}
            followedBusinesses={state.followedEntities}
            onFollowBusiness={actions.followEntity}
            onSaveItem={actions.addSavedItem}
            savedItems={state.savedItems}
          />
        );

      case 'posts':
        return (
          <PostsPage
            onSavePost={actions.addSavedItem}
            onNavigateToBusiness={actions.navigateToBusiness}
            onNavigateToUserProfile={actions.navigateToUserProfile}
            followedBusinesses={state.followedEntities}
            onFollowBusiness={actions.followEntity}
            onCreatePost={() => actions.navigate('create-post')}
            userPosts={state.userPosts}
            showPostSuccess={state.showPostSuccess}
            shouldScrollToPosts={state.shouldScrollToPosts}
            onScrollComplete={() => actions.navigate(state.currentPage)}
            savedItems={state.savedItems}
            highlightPostId={state.highlightPostId}
            onClearHighlight={() => actions.navigateWithParams('posts', {})}
          />
        );

      case 'threads':
        return (
          <ThreadsPage
            onSaveThread={actions.addSavedItem}
            onNavigateToBusiness={actions.navigateToBusiness}
            onNavigateToUserProfile={actions.navigateToUserProfile}
            followedBusinesses={state.followedEntities}
            onFollowBusiness={actions.followEntity}
            onCreateThread={() => actions.navigate('create-thread')}
            userThreads={state.userThreads}
            showThreadSuccess={state.showThreadSuccess}
            shouldScrollToThreads={state.shouldScrollToThreads}
            onScrollComplete={() => actions.navigate(state.currentPage)}
            savedItems={state.savedItems}
            highlightThreadId={state.highlightThreadId}
            onClearHighlight={() => actions.navigateWithParams('threads', {})}
          />
        );

      case 'shopping':
        return (
          <ShoppingPage
            onNavigateToBusiness={actions.navigateToBusiness}
            onAddToCart={actions.addToCart}
            isAuthenticated={isAuthenticated}
            savedItems={state.savedItems}
            onSaveProduct={actions.addSavedItem}
            onRemoveSavedItem={actions.removeSavedItem}
            highlightProductId={state.highlightShoppingProductId}
            onClearHighlight={() => actions.navigateWithParams('shopping', {})}
          />
        );

      case 'business':
        return (
          <BusinessPage
            businessId={state.selectedBusinessId}
            onAddToCart={actions.addToCart}
            onOpenChat={actions.navigateToChat}
            followedBusinesses={state.followedEntities}
            onFollowBusiness={actions.followEntity}
            onUnfollowBusiness={actions.unfollowEntity}
            onNavigateToBusiness={actions.navigateToBusiness}
            businessThreads={state.userThreads}
            savedItems={state.savedItems}
            onSaveItem={actions.addSavedItem}
            onNavigateWithParams={actions.navigateWithParams}
          />
        );

      case 'businesses':
        return <BusinessesPage onViewBusiness={actions.navigateToBusiness} />;

      case 'following':
        return (
          <FollowingPage
            onViewBusiness={actions.navigateToBusiness}
            onNavigateToUserProfile={actions.navigateToUserProfile}
            followedBusinesses={state.followedEntities}
            onUnfollowBusiness={actions.unfollowEntity}
            onOpenChat={actions.navigateToChat}
          />
        );

      case 'followers':
        return (
          <FollowersPage
            onViewBusiness={actions.navigateToBusiness}
            onNavigateToUserProfile={actions.navigateToUserProfile}
            followers={state.followers}
            onRemoveFollower={actions.removeFollower}
            onOpenChat={actions.navigateToChat}
          />
        );

      case 'cart':
        return (
          <CartPage
            cartItems={state.cartItems}
            onUpdateQuantity={actions.updateCartItemQuantity}
            onRemove={actions.removeFromCart}
            onCheckout={() => actions.navigate('checkout')}
          />
        );

      case 'checkout':
        return (
          <CheckoutPage
            cartItems={state.cartItems}
            onSuccess={() => {
              actions.clearCart();
              actions.navigate('home');
            }}
          />
        );

      case 'profile':
        return (
          <ProfilePage
            userProfile={state.userProfile}
            onUpdateProfile={actions.updateUserProfile}
            onNavigate={actions.navigate}
            onNavigateToDashboard={(section) => {
              actions.navigateWithParams('dashboard', { section });
            }}
            userPosts={state.userPosts}
            userThreads={state.userThreads}
            savedItems={state.savedItems}
            followingCount={state.followedEntities.length}
            followersCount={state.followers.length}
            followedEntities={state.followedEntities}
            onNavigateToBusiness={actions.navigateToBusiness}
            onNavigateToUserProfile={actions.navigateToUserProfile}
            onRemoveSavedItem={actions.removeSavedItem}
            onDeletePost={actions.deletePost}
            onUpdatePost={actions.updatePost}
            onDeleteThread={actions.deleteThread}
            onUpdateThread={actions.updateThread}
            onNavigateWithParams={actions.navigateWithParams}
          />
        );

      case 'search':
        return (
          <SearchPage
            onViewBusiness={actions.navigateToBusiness}
            onNavigateToUserProfile={actions.navigateToUserProfile}
            onNavigate={actions.navigate}
            onNavigateWithParams={actions.navigateWithParams}
          />
        );

      case 'chats':
        return (
          <ChatsPage
            onNavigateToProfile={actions.navigateToUserProfile}
            selectedProfileId={state.selectedChatProfileId}
          />
        );

      case 'notifications':
        return (
          <NotificationsPage
            notifications={state.notifications}
            onMarkAsRead={actions.markNotificationAsRead}
            onClearAll={actions.clearAllNotifications}
            onMarkAllAsRead={actions.markAllNotificationsAsRead}
            onDeleteRead={actions.deleteReadNotifications}
            onNavigate={actions.navigateWithParams}
            currentUserId={user?.id}
          />
        );

      case 'saved':
        return (
          <SavedItemsPage
            savedItems={state.savedItems}
            onRemove={actions.removeSavedItem}
            onViewBusiness={actions.navigateToBusiness}
          />
        );

      case 'register-business':
        return <RegisterBusinessPage onNavigate={actions.navigate} />;

      case 'signin':
        return (
          <SignInPage
            onNavigate={actions.navigate}
            onSignUpClick={() => actions.navigate('signup')}
          />
        );

      case 'signup':
        return (
          <SignUpPage
            onNavigate={actions.navigate}
            onSignInClick={() => actions.navigate('signin')}
            onVerificationNeeded={() => actions.navigate('verify-email')}
            onPaymentNeeded={(role) => {
              actions.setPaymentRole(role);
              actions.navigate('payment');
            }}
          />
        );

      case 'verify-email':
        return <EmailVerificationPage onNavigate={actions.navigate} />;

      case 'payment':
        return (
          <PaymentPage
            role={state.paymentRole}
            onNavigate={actions.navigate}
            onPaymentSuccess={() => actions.navigate('verify-email')}
          />
        );

      case 'dashboard':
        return (
          <DashboardPage
            targetSection={state.dashboardTargetSection}
            highlightProductId={state.highlightProductId}
            onClearHighlight={() => actions.navigateWithParams('dashboard', {})}
          />
        );

      case 'create-post':
        return (
          <CreatePostPage
            onCreatePost={actions.createPost}
            onBack={() => actions.navigate('posts')}
          />
        );

      case 'create-thread':
        return (
          <CreateThreadPage
            onCreateThread={actions.createThread}
            onBack={() => actions.navigate('threads')}
          />
        );

      case 'engineer-profile':
        return (
          <EngineerProfilePage
            engineerId={state.viewingUserId}
            onOpenChat={actions.navigateToChat}
            onNavigateToBusiness={actions.navigateToBusiness}
            onNavigateToUserProfile={actions.navigateToUserProfile}
            onNavigate={actions.navigate}
            userThreads={state.userThreads}
            followedEntities={state.followedEntities}
            onFollow={actions.followEntity}
            onUnfollow={actions.unfollowEntity}
            highlightPostId={state.highlightPostId}
            highlightCommentId={state.highlightCommentId}
            highlightThreadId={state.highlightThreadId}
          />
        );

      case 'user-profile':
        return (
          <UserProfilePage
            userId={state.viewingUserId}
            onOpenChat={actions.navigateToChat}
            onNavigateToBusiness={actions.navigateToBusiness}
            onNavigateToUserProfile={actions.navigateToUserProfile}
            onNavigate={actions.navigate}
            userThreads={state.userThreads}
            followedEntities={state.followedEntities}
            onFollow={actions.followEntity}
            onUnfollow={actions.unfollowEntity}
            highlightPostId={state.highlightPostId}
            highlightCommentId={state.highlightCommentId}
            highlightThreadId={state.highlightThreadId}
          />
        );

      case 'purchase-history':
        return (
          <PurchaseHistoryPage
            onNavigateToBusiness={actions.navigateToBusiness}
            onNavigate={actions.navigate}
            onAddToCart={actions.addToCart}
          />
        );

      default:
        return (
          <HomePage
            onViewBusiness={actions.navigateToBusiness}
            onNavigate={actions.navigate}
            onBusinessesClick={handleBusinessesNavigation}
            onNavigateToUserProfile={actions.navigateToUserProfile}
            followedBusinesses={state.followedEntities}
            onFollowBusiness={actions.followEntity}
            onSaveItem={actions.addSavedItem}
            savedItems={state.savedItems}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {showLayout && (
        <Navigation
          currentPage={state.currentPage}
          onNavigate={actions.navigate}
          cartItemCount={state.cartItems.length}
          notificationCount={unreadNotifications}
        />
      )}
      <PageTransition
        pageKey={`${state.currentPage}-${state.selectedBusinessId || state.viewingUserId || state.selectedChatProfileId || ''}`}
      >
        {renderPage()}
      </PageTransition>
      {showFooter && <Footer />}
      {showLayout && (
        <AIAssistant
          isOpen={state.showAIChat}
          onToggle={actions.toggleAIChat}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <PostInteractionsProvider>
        <AppStateProvider>
          <AppContent />
        </AppStateProvider>
      </PostInteractionsProvider>
    </AuthProvider>
  );
}

App.displayName = 'App';

export default App;