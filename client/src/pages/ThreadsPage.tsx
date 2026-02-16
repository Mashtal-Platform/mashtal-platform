import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, CheckCircle, RefreshCw } from 'lucide-react';
import { ThreadsFeed } from '../components/ThreadsFeed';
import { SavedItem } from '../App';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

interface ThreadsPageProps {
  onSaveThread: (item: SavedItem) => void;
  onNavigateToBusiness: (businessId: string) => void;
  onNavigateToUserProfile: (userId: string) => void;
  followedBusinesses: any[];
  onFollowBusiness: (business: any) => void;
  onCreateThread: () => void;
  userThreads?: any[];
  showThreadSuccess?: boolean;
  shouldScrollToThreads?: boolean;
  onScrollComplete?: () => void;
  savedItems?: SavedItem[];
  highlightThreadId?: string;
  onClearHighlight?: () => void;
}

export function ThreadsPage({ 
  onSaveThread, 
  onNavigateToBusiness, 
  onNavigateToUserProfile, 
  followedBusinesses, 
  onFollowBusiness, 
  onCreateThread, 
  userThreads, 
  showThreadSuccess,
  shouldScrollToThreads = false,
  onScrollComplete,
  savedItems = [],
  highlightThreadId,
  onClearHighlight
}: ThreadsPageProps) {
  const { isAuthenticated, user } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  const [refreshButtonScale, setRefreshButtonScale] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [hasMoreThreads, setHasMoreThreads] = useState(true);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullVelocity, setPullVelocity] = useState(0);
  
  const successMessageRef = useRef<HTMLDivElement>(null);
  const firstThreadRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const scrollVelocity = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const touchStartY = useRef(0);
  const lastTouchY = useRef(0);
  const pullStartTime = useRef(0);
  const lastPullDistance = useRef(0);

  // Show success message when showThreadSuccess prop changes to true
  useEffect(() => {
    if (showThreadSuccess) {
      setShowSuccess(true);
      
      // Scroll to threads area
      if (firstThreadRef.current) {
        const threadTop = firstThreadRef.current.offsetTop;
        window.scrollTo({ top: Math.max(0, threadTop - 100), behavior: 'smooth' });
      }
      
      // Hide success message after 2 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [showThreadSuccess]);

  // Auto-scroll to threads when clicking Threads in navigation
  useEffect(() => {
    if (shouldScrollToThreads && firstThreadRef.current) {
      setIsAutoScrolling(true);
      
      // Prevent manual scrolling
      const preventScroll = (e: WheelEvent | TouchEvent) => {
        e.preventDefault();
      };
      
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventScroll, { passive: false });
      
      const threadTop = firstThreadRef.current.offsetTop;
      window.scrollTo({ 
        top: Math.max(0, threadTop - 80), 
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
  }, [shouldScrollToThreads, onScrollComplete]);

  // Handle scroll to make create button sticky and detect bottom scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isAutoScrolling) return;

      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollingDown = currentScrollTop > lastScrollTop.current;
      const scrollDiff = Math.abs(currentScrollTop - lastScrollTop.current);
      
      // Calculate scroll velocity
      scrollVelocity.current = scrollDiff;
      
      // Update sticky state based on scroll position
      const threshold = window.innerHeight * 0.3;
      setIsSticky(currentScrollTop > threshold);
      
      // Show refresh button with scaled entrance based on velocity
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
        if (entry.isIntersecting && !isLoadingMore && hasMoreThreads) {
          setIsLoadingMore(true);
          // Simulate loading more threads
          setTimeout(() => {
            setIsLoadingMore(false);
            // After loading 2-3 times, set hasMoreThreads to false
            const randomStop = Math.random() > 0.7;
            if (randomStop) {
              setHasMoreThreads(false);
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
  }, [isLoadingMore, hasMoreThreads]);

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
            console.log('Threads refreshed!');
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

  const handleRefresh = () => {
    // Simulate refreshing to get new threads
    setShowRefreshButton(false);
    // In a real app, this would fetch new data from the server
    console.log('Refreshing threads...');
    // Optionally scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-neutral-50 min-h-screen">
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

      {/* Success Message */}
      {showSuccess && (
        <div 
          ref={successMessageRef}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top duration-300"
        >
          <CheckCircle className="w-5 h-5" />
          <span>Thread posted successfully!</span>
        </div>
      )}

      {/* Refresh Button */}
      {showRefreshButton && (
        <button
          onClick={handleRefresh}
          style={{
            transform: `scale(${refreshButtonScale})`,
            opacity: refreshButtonScale,
          }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white text-green-600 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-green-50 transition-all duration-200 ease-out"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm font-medium">New threads available</span>
        </button>
      )}

      <div 
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        style={{
          transform: isPulling || isRefreshing ? `translateY(${pullDistance * 0.3}px)` : 'none',
          transition: isRefreshing || !isPulling ? 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
        }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-neutral-900 mb-2">Threads</h1>
          <p className="text-neutral-600">Share your thoughts and connect with the agricultural community</p>
        </div>

        {/* Create Thread Button */}
        <div 
          className={`mb-6 transition-all duration-300 ${
            isSticky 
              ? 'fixed top-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-200 shadow-sm' 
              : ''
          }`}
        >
          <div className={`${isSticky ? 'max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4' : ''}`}>
            {isAuthenticated ? (
              <Button
                onClick={onCreateThread}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Thread
              </Button>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-800">
                  Please sign in to create threads and join the conversation
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Threads Feed */}
        <div ref={firstThreadRef}>
          <ThreadsFeed
            onSaveThread={onSaveThread}
            onNavigateToBusiness={onNavigateToBusiness}
            onNavigateToUserProfile={onNavigateToUserProfile}
            followedBusinesses={followedBusinesses}
            onFollowBusiness={onFollowBusiness}
            userThreads={userThreads}
            highlightThreadId={highlightThreadId}
            onClearHighlight={onClearHighlight}
          />
        </div>

        {/* Loading Indicator */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}

        {/* End of Threads Message */}
        {!hasMoreThreads && (
          <div className="text-center py-8 text-neutral-500">
            <p>You've reached the end of threads</p>
          </div>
        )}

        {/* Bottom Sentinel for Infinite Scroll */}
        <div ref={bottomSentinelRef} className="h-4" />
      </div>
    </div>
  );
}