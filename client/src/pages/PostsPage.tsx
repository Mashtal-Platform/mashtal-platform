import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, CheckCircle, RefreshCw } from 'lucide-react';
import { PostsFeed } from '../components/PostsFeed';
import { SavedItem } from '../App';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

interface PostsPageProps {
  onSavePost: (item: SavedItem) => void;
  onNavigateToBusiness: (businessId: string) => void;
  onNavigateToUserProfile: (userId: string) => void;
  followedBusinesses: any[];
  onFollowBusiness: (business: any) => void;
  onCreatePost: () => void;
  userPosts?: any[];
  showPostSuccess?: boolean;
  shouldScrollToPosts?: boolean;
  onScrollComplete?: () => void;
  savedItems?: SavedItem[];
  highlightPostId?: string;
  onClearHighlight?: () => void;
}

export function PostsPage({ 
  onSavePost, 
  onNavigateToBusiness, 
  onNavigateToUserProfile, 
  followedBusinesses, 
  onFollowBusiness, 
  onCreatePost, 
  userPosts, 
  showPostSuccess,
  shouldScrollToPosts = false,
  onScrollComplete,
  savedItems = [],
  highlightPostId,
  onClearHighlight
}: PostsPageProps) {
  const { isAuthenticated, user } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  const [refreshButtonScale, setRefreshButtonScale] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullVelocity, setPullVelocity] = useState(0);
  
  const successMessageRef = useRef<HTMLDivElement>(null);
  const firstPostRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const scrollVelocity = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const touchStartY = useRef(0);
  const lastTouchY = useRef(0);
  const pullStartTime = useRef(0);
  const lastPullDistance = useRef(0);

  // Show success message when showPostSuccess prop changes to true
  useEffect(() => {
    if (showPostSuccess) {
      setShowSuccess(true);
      
      // Scroll to posts area
      if (firstPostRef.current) {
        const postTop = firstPostRef.current.offsetTop;
        window.scrollTo({ top: Math.max(0, postTop - 100), behavior: 'smooth' });
      }
      
      // Hide success message after 2 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [showPostSuccess]);

  // Auto-scroll to posts when clicking Posts in navigation
  useEffect(() => {
    if (shouldScrollToPosts && firstPostRef.current) {
      setIsAutoScrolling(true);
      
      // Prevent manual scrolling
      const preventScroll = (e: WheelEvent | TouchEvent) => {
        e.preventDefault();
      };
      
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventScroll, { passive: false });
      
      const postTop = firstPostRef.current.offsetTop;
      window.scrollTo({ 
        top: Math.max(0, postTop - 80), 
        behavior: 'smooth' 
      });
      
      // Re-enable scrolling after animation completes
      setTimeout(() => {
        setIsAutoScrolling(false);
        document.removeEventListener('wheel', preventScroll);
        document.removeEventListener('touchmove', preventScroll);
        onScrollComplete?.();
      }, 800);
    }
  }, [shouldScrollToPosts, onScrollComplete]);

  // Handle scroll to make create button sticky and detect bottom scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isAutoScrolling) return;

      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollingDown = currentScrollTop > lastScrollTop.current;
      const scrollDiff = Math.abs(currentScrollTop - lastScrollTop.current);
      
      // Calculate scroll velocity
      scrollVelocity.current = scrollDiff;
      
      // Make button sticky based on scroll position
      const threshold = window.innerHeight * 0.3;
      const shouldBeSticky = currentScrollTop > threshold;
      setIsSticky(shouldBeSticky);
      
      // Show refresh button with scaled entrance based on velocity when reaching top
      if (currentScrollTop === 0 && lastScrollTop.current > 0) {
        const scale = Math.min(scrollVelocity.current / 50, 1);
        setRefreshButtonScale(scale);
        setShowRefreshButton(true);
        
        // Hide refresh button after 3 seconds
        setTimeout(() => {
          setShowRefreshButton(false);
        }, 3000);
      }
      
      lastScrollTop.current = currentScrollTop;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAutoScrolling]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoadingMore && hasMorePosts) {
          setIsLoadingMore(true);
          // Simulate loading more posts
          setTimeout(() => {
            setIsLoadingMore(false);
            // After loading 2-3 times, set hasMorePosts to false
            const randomStop = Math.random() > 0.7;
            if (randomStop) {
              setHasMorePosts(false);
            }
          }, 1000);
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    if (bottomSentinelRef.current) {
      observer.observe(bottomSentinelRef.current);
    }

    return () => {
      if (bottomSentinelRef.current) {
        observer.unobserve(bottomSentinelRef.current);
      }
    };
  }, [isLoadingMore, hasMorePosts]);

  // Pull-to-refresh functionality
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at top of page
      if (window.scrollY === 0 && !isRefreshing) {
        touchStartY.current = e.touches[0].clientY;
        lastTouchY.current = e.touches[0].clientY;
        pullStartTime.current = Date.now();
        lastPullDistance.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && touchStartY.current > 0 && !isRefreshing) {
        const currentY = e.touches[0].clientY;
        const diff = currentY - touchStartY.current;
        
        // Only allow pulling down
        if (diff > 0) {
          // Calculate velocity based on distance change
          const distanceDelta = diff - lastPullDistance.current;
          const timeDelta = Date.now() - pullStartTime.current;
          const velocity = Math.abs(distanceDelta) / Math.max(timeDelta, 1) * 100;
          
          setPullVelocity(velocity);
          lastPullDistance.current = diff;
          
          // Apply resistance curve for natural feel
          const maxPull = 120;
          const resistance = 0.5;
          const adjustedDiff = diff * resistance;
          const finalPull = Math.min(adjustedDiff, maxPull);
          
          setPullDistance(finalPull);
          setIsPulling(true);
          
          // Prevent default scroll behavior when pulling
          if (diff > 10) {
            e.preventDefault();
          }
        }
      }
    };

    const handleTouchEnd = () => {
      if (isPulling && !isRefreshing) {
        const threshold = 80;
        
        if (pullDistance >= threshold) {
          // Trigger refresh
          setIsRefreshing(true);
          setPullDistance(60); // Lock at refresh height
          
          // Simulate refresh
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
            setIsPulling(false);
            console.log('Posts refreshed!');
          }, 1500);
        } else {
          // Reset without refresh
          setPullDistance(0);
          setIsPulling(false);
        }
      }
      
      touchStartY.current = 0;
      lastTouchY.current = 0;
      pullStartTime.current = 0;
      lastPullDistance.current = 0;
      setPullVelocity(0);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, isRefreshing]);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setShowRefreshButton(false);
    
    // Simulate loading more posts
    setTimeout(() => {
      setIsLoadingMore(false);
      // After loading 2-3 times, indicate no more posts
      // This is just for demo - in real app, check actual data
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      {/* Pull-to-Refresh Indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 flex justify-center items-center pointer-events-none z-40"
          style={{
            height: `${pullDistance}px`,
            transition: isRefreshing || !isPulling ? 'height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          }}
        >
          <div
            className="bg-white rounded-full shadow-lg flex items-center justify-center"
            style={{
              width: `${Math.min(40 + pullDistance * 0.5, 60)}px`,
              height: `${Math.min(40 + pullDistance * 0.5, 60)}px`,
              transform: `scale(${Math.min(pullDistance / 80, 1.2)})`,
              transition: isRefreshing || !isPulling 
                ? 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' 
                : 'all 0.1s ease-out',
              opacity: Math.min(pullDistance / 60, 1),
            }}
          >
            <RefreshCw
              className={`text-green-600 ${isRefreshing ? 'animate-spin' : ''}`}
              style={{
                width: `${Math.min(20 + pullDistance * 0.2, 28)}px`,
                height: `${Math.min(20 + pullDistance * 0.2, 28)}px`,
                transform: `rotate(${pullDistance * 3 + pullVelocity * 2}deg)`,
                transition: isRefreshing ? 'none' : 'transform 0.05s linear',
              }}
            />
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{
          transform: isPulling || isRefreshing ? `translateY(${pullDistance * 0.3}px)` : 'none',
          transition: isRefreshing || !isPulling ? 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
        }}
      >
        <div className="mb-12 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl text-neutral-900 mb-2">
              Agricultural Updates & Posts
            </h1>
            <p className="text-neutral-600">
              Stay updated with the latest news, tips, and announcements from agricultural businesses
            </p>
          </div>
          
          {/* Create Post Button - Original position with sticky behavior */}
          {isAuthenticated && (
            <div className="relative">
              <Button
                onClick={onCreatePost}
                className={`bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 flex-shrink-0 transition-all ${
                  isSticky ? 'fixed top-20 right-8 z-50 shadow-xl' : ''
                }`}
              >
                <Plus className="w-5 h-5" />
                Create Post
              </Button>
            </div>
          )}
        </div>

        {/* Success Message - Fixed position at top with smooth animation */}
        {showSuccess && (
          <div 
            ref={successMessageRef}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md mx-auto px-4"
            style={{
              animation: 'slideDown 0.3s ease-out',
            }}
          >
            <div className="bg-white border-2 border-green-500 rounded-xl p-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-neutral-900">Post Published!</p>
                  <p className="text-sm text-neutral-600">Your post is now live.</p>
                </div>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="flex-shrink-0 p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-600" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Refresh Button - appears at top when scrolling to top */}
        {showRefreshButton && (
          <button
            onClick={handleLoadMore}
            style={{
              transform: `scale(${refreshButtonScale})`,
              opacity: refreshButtonScale,
            }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white text-green-600 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-green-50 transition-all duration-200 ease-out"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">New posts available</span>
          </button>
        )}
        
        {/* Posts Feed with ref to first post */}
        <div ref={firstPostRef}>
          <PostsFeed 
            onSavePost={onSavePost} 
            onNavigateToBusiness={onNavigateToBusiness} 
            onNavigateToUserProfile={onNavigateToUserProfile}
            followedBusinesses={followedBusinesses} 
            onFollowBusiness={onFollowBusiness}
            userPosts={userPosts}
            highlightPostId={highlightPostId}
            onClearHighlight={onClearHighlight}
          />
        </div>

        {/* Bottom sentinel for scroll detection */}
        <div ref={bottomSentinelRef} className="h-1" />

        {/* Loading indicator */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}

        {/* End of Posts Message */}
        {!hasMorePosts && (
          <div className="text-center py-8 text-neutral-500">
            <p>You've reached the end of posts</p>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}