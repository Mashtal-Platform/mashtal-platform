# User Data Synchronization System

## Overview
The Mashtal platform now includes a comprehensive user data synchronization system that ensures all user-specific data is properly managed and persisted when switching between different user accounts.

## Features

### 1. **User-Specific Data Isolation**
Each user account maintains its own isolated data:
- Saved items (posts, threads, products, businesses)
- Posts and threads created by the user
- Followers and following lists
- Products (for business accounts)
- Interaction history (likes, saves, shares)

### 2. **Persistent Storage**
All user data is automatically saved to browser localStorage and restored when:
- The app is refreshed
- Users switch accounts
- Users log back in

### 3. **Automatic Synchronization**
When switching users, the system automatically:
- Loads the new user's profile data
- Displays their specific posts, threads, and products
- Shows their followers and following lists
- Restores their saved items
- Syncs their interaction history (likes, saves)
- Updates all stat counters

## Implementation Details

### Contexts

#### UserDataContext (`/contexts/UserDataContext.tsx`)
Manages all user-specific content data:
- **Saved Items**: User's bookmarked posts, threads, products, and businesses
- **Posts & Threads**: Content created by the user
- **Products**: Inventory for business accounts
- **Followers & Following**: Social connections
- **localStorage Key**: `mashtal_user_data`

#### PostInteractionsContext (`/contexts/PostInteractionsContext.tsx`)
Manages user interaction states:
- **Likes**: Which posts/threads the user has liked
- **Saves**: Bookmarked content
- **Counts**: Like/comment/share counters
- **localStorage Key**: `mashtal_user_interactions`

### Data Structure

#### UserDataMap (localStorage)
```typescript
{
  "userId1": {
    savedItems: SavedItem[],
    followers: User[],
    following: User[],
    posts: Post[],
    threads: Thread[],
    products: Product[]
  },
  "userId2": { ... },
  ...
}
```

#### User Interactions Map (localStorage)
```typescript
{
  "userId1": {
    likes: Set<string>,      // Post/thread IDs
    saves: Set<string>,      // Post/thread IDs
    postLikeCounts: {},
    postCommentCounts: {},
    postShareCounts: {}
  },
  "userId2": { ... },
  ...
}
```

## Role-Based Features

### User Roles
1. **User**: Regular farmers/consumers
   - Can browse and purchase products
   - Can follow engineers, agronomists, and businesses
   - Cannot receive direct messages
   - No dashboard access

2. **Engineer**: Technical professionals
   - Can receive direct messages
   - Can be followed by others
   - Have a professional profile page
   - **NO Dashboard** (no product management)
   - Can share posts and threads

3. **Agronomist**: Agricultural experts
   - Can receive direct messages
   - Can be followed by others
   - Have a professional profile page
   - No dashboard access
   - Can share posts and threads

4. **Business**: Commercial entities
   - Can receive direct messages
   - Can be followed by others
   - **HAVE Dashboard access**
   - Manage products inventory
   - Instagram-style business profile grid
   - Analytics and order management

## Usage

### Switching Users
Users can switch accounts using the "Switch User" button in the navigation menu (3-dot dropdown). When switching:

1. Current user's data is automatically saved
2. New user's data is loaded from localStorage or initialized
3. All UI components update to reflect the new user's data
4. Stats counters refresh (followers, following, posts, threads)
5. Navigation menu updates based on new user's role

### Data Initialization
When a user first switches to an account:
- Posts and threads are loaded from `centralMockData.ts` based on authorId
- Products are loaded for business accounts
- Followers and following are initialized with mock data
- Empty saved items array (except for the default user 'me')

### Data Persistence
All changes are automatically saved:
- Adding/removing saved items
- Creating new posts or threads
- Following/unfollowing users
- Liking/unliking posts
- Any profile updates

## Components Updated

### Navigation (`/components/Navigation.tsx`)
- Dashboard link only shown for business accounts
- Engineers and agronomists see Followers instead
- Regular users see Purchase History

### Profile Pages
- **ProfilePage**: Manages own profile based on role
- **EngineerProfilePage**: Viewing other engineers/agronomists
- **UserProfilePage**: Viewing other regular users
- **BusinessProfileView**: Business profiles (only for businesses)

### Saved Items (`/pages/SavedItemsPage.tsx`)
- Each user has their own saved items
- Filtering by type (product, post, thread, business)
- Persistent across sessions

## Testing

To verify synchronization:
1. Switch to different user accounts
2. Check that each user has their own:
   - Saved items
   - Posts and threads
   - Followers/following lists
   - Products (for businesses)
3. Refresh the page and verify data persists
4. Add/remove saved items and verify they're user-specific
5. Check that Engineers don't see Dashboard option

## Important Notes

### Engineer Profile Clarification
- **Engineers DO NOT have Dashboard access**
- This is intentional as engineers are professionals who provide services, not businesses that sell products
- Only **Business** role accounts have Dashboard with product management

### Data Storage Limits
- localStorage has a limit of ~5-10MB depending on browser
- For production, consider migrating to:
  - IndexedDB for larger datasets
  - Backend API with Supabase for cloud storage
  - Redis for session management

### Performance Considerations
- Data is loaded on user switch (not lazy loaded)
- For large datasets, consider pagination
- Consider debouncing localStorage writes

## Future Enhancements

1. **Cloud Sync**: Sync data to Supabase backend
2. **Real-time Updates**: Use Supabase real-time subscriptions
3. **Data Migration**: Tools to import/export user data
4. **Analytics**: Track user engagement metrics
5. **Backup/Restore**: Automated backup system
6. **Multi-device Sync**: Share data across devices

## Troubleshooting

### Data Not Persisting
- Check browser's localStorage quota
- Clear and reinitialize: `localStorage.removeItem('mashtal_user_data')`
- Check browser console for errors

### Wrong User Data Displayed
- Verify `user.id` is correctly set in AuthContext
- Check localStorage keys match current user
- Force refresh by clearing localStorage

### Stats Not Updating
- Ensure `user?.id` dependency in useEffect hooks
- Verify UserDataContext is properly wrapping App
- Check console for context errors
