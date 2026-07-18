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
import { UserProfilePage } from './pages/UserProfilePage';
import { PurchaseHistoryPage } from './pages/PurchaseHistoryPage';
import { ShoppingPage } from './pages/ShoppingPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { InfoPage } from './pages/InfoPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PostInteractionsProvider } from './contexts/PostInteractionsContext';
import { AppStateProvider, useAppState } from './shared/store/AppStateContext';
import { shouldShowLayout, shouldShowFooter } from './shared/utils/navigation';
import { Toaster } from './components/ui/sonner';

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

  const unreadNotifications = state.notifications
    .filter((n) => !n.read)
    .reduce((acc, n) => acc + (n.messageCount ?? 1), 0);
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
            onRemoveSavedItem={actions.removeSavedItem}
            savedItems={state.savedItems}
            feedVersion={state.feedVersion}
          />
        );

      case 'posts':
        return (
          <PostsPage
            onSavePost={actions.addSavedItem}
            onRemoveSavedItem={actions.removeSavedItem}
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
            feedVersion={state.feedVersion}
            lastCreatedPost={state.lastCreatedPost}
          />
        );

      case 'threads':
        return (
          <ThreadsPage
            onSaveThread={actions.addSavedItem}
            onRemoveSavedItem={actions.removeSavedItem}
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
            feedVersion={state.feedVersion}
            lastCreatedThread={state.lastCreatedThread}
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
            key={`business-${state.selectedBusinessId || 'none'}`}
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
            onRemoveSavedItem={actions.removeSavedItem}
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
            onNavigateWithParams={actions.navigateWithParams}
          />
        );

      case 'notifications':
        return (
          <NotificationsPage
            notifications={state.notifications}
            onMarkAsRead={actions.markNotificationAsRead}
            onNavigateToUserProfile={actions.navigateToUserProfile}
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
        return (
          <RegisterBusinessPage
            onNavigate={(page) => {
              if (page === 'payment') actions.setPaymentRole('business');
              actions.navigate(page);
            }}
          />
        );

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
            onPaymentSuccess={() => actions.navigate('dashboard')}
          />
        );

      case 'admin':
        if (user?.role !== 'admin') {
          return (
            <HomePage
              onViewBusiness={actions.navigateToBusiness}
              onNavigate={actions.navigate}
              onBusinessesClick={handleBusinessesNavigation}
              onNavigateToUserProfile={actions.navigateToUserProfile}
              followedBusinesses={state.followedEntities}
              onFollowBusiness={actions.followEntity}
              onSaveItem={actions.addSavedItem}
              onRemoveSavedItem={actions.removeSavedItem}
              savedItems={state.savedItems}
              feedVersion={state.feedVersion}
            />
          );
        }
        return (
          <AdminDashboardPage
            initialTab={state.adminTargetTab}
            highlightPaymentId={state.highlightPaymentId}
            onClearHighlight={() => actions.navigateWithParams('admin', {})}
          />
        );

      case 'dashboard':
        return (
          <DashboardPage
            targetSection={state.dashboardTargetSection}
            highlightProductId={state.highlightProductId}
            highlightOrderId={state.highlightOrderId}
            onClearHighlight={() => actions.navigateWithParams('dashboard', {})}
          />
        );

      case 'create-post':
        if (!isAuthenticated || user?.role !== 'business') {
          return (
            <PostsPage
              onSavePost={actions.addSavedItem}
              onRemoveSavedItem={actions.removeSavedItem}
              onNavigateToBusiness={actions.navigateToBusiness}
              onNavigateToUserProfile={actions.navigateToUserProfile}
              followedBusinesses={state.followedEntities}
              onFollowBusiness={actions.followEntity}
              onCreatePost={() => actions.navigate('create-post')}
              userPosts={state.userPosts}
              savedItems={state.savedItems}
              highlightPostId={state.highlightPostId}
              onClearHighlight={() => actions.navigateWithParams('posts', {})}
              feedVersion={state.feedVersion}
              lastCreatedPost={state.lastCreatedPost}
            />
          );
        }
        return (
          <CreatePostPage
            onCreatePost={actions.createPost}
            onBack={() => actions.navigate('posts')}
          />
        );

      case 'create-thread':
        if (!isAuthenticated || user?.role !== 'business') {
          return (
            <ThreadsPage
              onSaveThread={actions.addSavedItem}
              onRemoveSavedItem={actions.removeSavedItem}
              onNavigateToBusiness={actions.navigateToBusiness}
              onNavigateToUserProfile={actions.navigateToUserProfile}
              followedBusinesses={state.followedEntities}
              onFollowBusiness={actions.followEntity}
              onCreateThread={() => actions.navigate('create-thread')}
              userThreads={state.userThreads}
              savedItems={state.savedItems}
              highlightThreadId={state.highlightThreadId}
              onClearHighlight={() => actions.navigateWithParams('threads', {})}
              feedVersion={state.feedVersion}
              lastCreatedThread={state.lastCreatedThread}
            />
          );
        }
        return (
          <CreateThreadPage
            onCreateThread={actions.createThread}
            onBack={() => actions.navigate('threads')}
          />
        );

      case 'user-profile':
        return (
          <UserProfilePage
            key={`user-profile-${state.viewingUserId || 'none'}`}
            userId={state.viewingUserId}
            onOpenChat={actions.navigateToChat}
            onNavigateToBusiness={actions.navigateToBusiness}
            onNavigateToUserProfile={actions.navigateToUserProfile}
            onNavigate={actions.navigate}
            onNavigateWithParams={actions.navigateWithParams}
            userThreads={state.userThreads}
            allPosts={state.allPosts}
            allThreads={state.allThreads}
            followedEntities={state.followedEntities}
            onFollow={actions.followEntity}
            onUnfollow={actions.unfollowEntity}
            highlightPostId={state.highlightPostId}
            highlightCommentId={state.highlightCommentId}
            highlightThreadId={state.highlightThreadId}
            savedItems={state.savedItems}
            onSavePost={actions.addSavedItem}
            onSaveThread={actions.addSavedItem}
            onRemoveSavedItem={actions.removeSavedItem}
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

      case 'about':
      case 'privacy':
      case 'terms':
      case 'cookies':
        return <InfoPage kind={state.currentPage} onNavigate={actions.navigate} />;

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
            onRemoveSavedItem={actions.removeSavedItem}
            savedItems={state.savedItems}
            feedVersion={state.feedVersion}
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
          <Toaster />
        </AppStateProvider>
      </PostInteractionsProvider>
    </AuthProvider>
  );
}

App.displayName = 'App';

export default App;