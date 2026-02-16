# Post & Thread Highlight Feature

## Overview
This feature ensures that posts and threads can be directly accessed and highlighted from anywhere in the application (notifications, profile pages, direct links), even if they haven't been loaded yet in the infinite scroll feed.

## How It Works

### 1. Navigation with Highlight
When navigating to posts or threads page with a `highlightPostId` or `highlightThreadId` parameter:
```typescript
// Example from NotificationsPage
onNavigate('posts', { 
  highlightPostId: notification.postId,
  highlightCommentId: notification.commentId 
});

onNavigate('threads', { 
  highlightThreadId: notification.threadId 
});
```

### 2. Automatic Loading & Positioning
The feed components (PostsFeed, ThreadsFeed) check if the highlighted item exists in the data:

- **Scenario A - Post not yet loaded**: 
  - User has scrolled through first 20 posts
  - Clicks notification for post #35
  - Post #35 is fetched and inserted at the top
  - User sees post #35 highlighted immediately

- **Scenario B - Post already visible**:
  - User has scrolled through first 30 posts  
  - Clicks notification for post #15
  - Post #15 is moved from its current position to the top
  - User sees post #15 highlighted at top

- **Scenario C - Post doesn't exist**:
  - Shows feed normally without error
  - User continues browsing

### 3. Visual Highlighting
Highlighted items feature:
- Green border (`border-green-500`)
- Elevated shadow (`shadow-xl`)
- Green ring effect (`ring-2 ring-green-200`)
- Subtle pulse animation (`animate-pulse-subtle`)
- Auto-removes after 3 seconds

### 4. Auto-scroll
The page automatically scrolls to the highlighted item with:
- Smooth scroll behavior
- 100px offset from top (for posts)
- Center alignment (for threads)
- 300ms delay to ensure DOM is ready for newly inserted items

### 5. Auto-dismiss
After 3 seconds:
- Highlight effect fades out
- Item remains at the top but without special styling
- User can continue browsing normally

## Implementation Details

### PostsFeed Component
```typescript
// Simplified logic - always moves highlighted post to top
const displayedPosts = React.useMemo(() => {
  const slicedPosts = posts.slice(0, visiblePosts);
  
  if (highlightPostId) {
    const highlightedPost = posts.find(p => p.id === highlightPostId);
    if (highlightedPost) {
      // Remove from current position, add to top
      const filteredPosts = slicedPosts.filter(p => p.id !== highlightPostId);
      return [highlightedPost, ...filteredPosts];
    }
  }
  
  return slicedPosts;
}, [posts, visiblePosts, highlightPostId]);
```

### ThreadsFeed Component
Same logic as PostsFeed, adapted for threads.

## Use Cases

### 1. From Notifications
User clicks a notification about:
- Someone mentioning them in a post/thread → sees highlighted post/thread
- Someone commenting on their content → sees highlighted content with comment
- Someone liking their content → sees highlighted content

### 2. From Profile Pages
User views someone's profile and clicks on a post/thread
→ Navigates to posts/threads page with that specific item highlighted at top

### 3. From Direct Links / Shares
User receives a shared link to a specific post/thread
→ Opens the page with that item highlighted at the top

## Benefits

1. **Improved UX**: Users immediately see the content they're looking for
2. **Context Preservation**: Item appears in the feed context, not in isolation
3. **Seamless Navigation**: Works across the entire application
4. **Performance**: Only loads the specific item on demand if needed
5. **Non-intrusive**: Auto-dismisses after 3 seconds
6. **Consistent Behavior**: Always moves item to top regardless of current position

## Technical Considerations

- Uses React.useMemo for efficient recalculation
- Maintains scroll position for non-highlighted browsing
- Prevents duplicate items in the feed
- Works with both authenticated and unauthenticated states
- Compatible with infinite scroll functionality
- Handles non-existent IDs gracefully
- Properly manages DOM rendering and scrolling timing

## Edge Cases Handled

1. **Post/Thread doesn't exist**: Shows normal feed
2. **Multiple rapid navigations**: Previous highlight is cleared
3. **User scrolls during highlight**: Highlight continues normally
4. **Post at beginning of feed**: Still moves to absolute top
5. **Post beyond current scroll position**: Loaded and highlighted at top

