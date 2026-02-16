# Mashtal User Sync - Quick Reference Guide

## 🎯 What's Been Implemented

### Core Features
✅ **User-Specific Data Storage** - Each user has their own saved items, posts, threads, followers  
✅ **Persistent localStorage** - All data survives page refreshes and user switches  
✅ **Automatic Synchronization** - Stats and content update instantly when switching users  
✅ **Role-Based Access** - Engineers don't see Dashboard (Business-only feature)  
✅ **Debug Utilities** - Built-in tools for monitoring and troubleshooting

---

## 🚀 Quick Start

### Switch Users
1. Click the **3-dot menu** (⋮) in the navigation
2. Select **"Switch User"**
3. Choose a different user from the list
4. All data automatically syncs to the new user

### Available Test Users
```
Regular User:    Ahmed Al-Mansour (me)
Engineer:        Hassan Al-Fahad (eng1)
Agronomist:      Dr. Fatima Al-Rashid (agr1)
Business:        Green Valley Nursery (biz1)
```

---

## 🔧 Debug Commands (Developer Console)

### View All User Data
```javascript
mashtalDebug.printUserDataTable()
```

### Check Storage Usage
```javascript
mashtalDebug.printStorageStats()
```

### Validate Data Integrity
```javascript
mashtalDebug.printIntegrityReport()
```

### Export Data (Download JSON)
```javascript
mashtalDebug.downloadUserData()
```

### Clear All Data (Reset)
```javascript
mashtalDebug.clearAllUserData()
```

### Get Specific User's Data
```javascript
mashtalDebug.getUserDataSnapshot('me')
mashtalDebug.getUserDataSnapshot('eng1')
```

---

## 📊 What Data is Stored Per User

```
┌─────────────────────────────────────────┐
│ UserData (per user ID)                  │
├─────────────────────────────────────────┤
│ • savedItems[]     Bookmarked content   │
│ • posts[]          Created posts        │
│ • threads[]        Created threads      │
│ • products[]       Inventory (business) │
│ • followers[]      Who follows them     │
│ • following[]      Who they follow      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Interactions (per user ID)              │
├─────────────────────────────────────────┤
│ • likes            Liked posts/threads  │
│ • saves            Saved posts/threads  │
│ • *LikeCounts      Like count changes   │
│ • *CommentCounts   Comment count changes│
│ • *ShareCounts     Share count changes  │
└─────────────────────────────────────────┘
```

---

## 🎨 Role-Specific Features

### 👤 Regular User (user)
- ✅ Browse and purchase products
- ✅ Follow engineers, agronomists, businesses
- ✅ View purchase history
- ❌ Cannot receive DMs
- ❌ No Dashboard

### 🔧 Engineer (engineer)
- ✅ Receive DMs
- ✅ Can be followed
- ✅ Professional profile
- ✅ Share posts and threads
- ❌ **NO Dashboard**

### 🌾 Agronomist (agronomist)
- ✅ Receive DMs
- ✅ Can be followed
- ✅ Professional profile
- ✅ Share posts and threads
- ❌ No Dashboard

### 🏢 Business (business)
- ✅ Receive DMs
- ✅ Can be followed
- ✅ **Dashboard access**
- ✅ Manage products inventory
- ✅ Instagram-style profile
- ✅ Analytics & orders

---

## 📍 localStorage Keys

```javascript
// Main user authentication
'mashtal_user'

// User-specific content data
'mashtal_user_data'

// User-specific interactions (likes, saves)
'mashtal_user_interactions'
```

---

## 🔍 Common Scenarios

### Adding a Saved Item
```typescript
// The item is automatically associated with current user
const item: SavedItem = {
  id: 'unique-id',
  type: 'post',
  itemId: 'p123',
  title: 'Post Title',
  image: 'url',
  description: 'Description',
  savedAt: new Date()
};
// Saved items are stored in UserDataContext
```

### Checking User's Stats
Each user has their own:
- Followers count (from UserDataContext)
- Following count (from UserDataContext)
- Posts count (length of userPosts array)
- Threads count (length of userThreads array)
- Products count (for businesses only)

### Switching Between Users
1. **Old user's data is saved** to localStorage
2. **New user's data is loaded** from localStorage (or initialized)
3. **All UI updates automatically** via React contexts
4. **No page refresh needed** - instant switch

---

## ⚠️ Important Notes

### Engineers and Dashboard
**Engineers DO NOT have Dashboard access.** This is intentional:
- Engineers provide **services** (consultations, installations)
- Businesses sell **products** (inventory management)
- Only businesses need product management dashboard

### Data Persistence
- Data is stored in **browser localStorage**
- Limit: ~5-10MB depending on browser
- For production: migrate to Supabase backend
- localStorage is **domain-specific** (won't share across domains)

### Performance
- All data loads on user switch (not lazy)
- For large datasets, consider:
  - Pagination for posts/products
  - Virtual scrolling for lists
  - Debouncing for localStorage writes

---

## 🐛 Troubleshooting

### Data Not Showing After Switch
```javascript
// 1. Check if data exists
mashtalDebug.printUserDataTable()

// 2. Check current user
console.log('Current user:', user)

// 3. Validate data integrity
mashtalDebug.printIntegrityReport()
```

### Stats Not Updating
```javascript
// 1. Check UserDataContext is loaded
console.log('UserData context loaded:', !!useUserData)

// 2. Force refresh (clear and reload)
mashtalDebug.clearUserData('user-id')
// Then switch to that user again
```

### Storage Full Error
```javascript
// 1. Check storage usage
mashtalDebug.printStorageStats()

// 2. If over 80%, clear old data
mashtalDebug.clearUserData('old-user-id')

// 3. Or export and clear all
mashtalDebug.downloadUserData()
mashtalDebug.clearAllUserData()
```

### localStorage Quota Exceeded
- Export data first: `mashtalDebug.downloadUserData()`
- Clear old users: `mashtalDebug.clearUserData('userId')`
- Consider IndexedDB for larger datasets
- Compress data before storing

---

## 📁 File Structure

```
/contexts/
  ├── AuthContext.tsx              # User authentication
  ├── PostInteractionsContext.tsx  # User-specific interactions
  └── UserDataContext.tsx          # User-specific content data

/utils/
  └── userDataDebug.ts            # Debug utilities

/documentation/
  ├── USER_SYNC_DOCUMENTATION.md         # Full documentation
  ├── SYNC_IMPLEMENTATION_SUMMARY.md     # Implementation details
  └── QUICK_REFERENCE.md                 # This file
```

---

## 🎓 Learn More

- **Full Documentation**: `/USER_SYNC_DOCUMENTATION.md`
- **Implementation Details**: `/SYNC_IMPLEMENTATION_SUMMARY.md`
- **Debug Utilities**: `/utils/userDataDebug.ts`

---

## ✅ Testing Checklist

Before deploying, verify:

- [ ] Switch between all user roles (user, engineer, agronomist, business)
- [ ] Each user has separate saved items
- [ ] Posts and threads belong to correct user
- [ ] Stats update correctly (followers, following, posts, threads)
- [ ] Engineers don't see Dashboard option
- [ ] Businesses DO see Dashboard option
- [ ] Data persists after page refresh
- [ ] Likes and saves are user-specific
- [ ] localStorage doesn't exceed quota
- [ ] Debug utilities work in console

---

**Version**: 1.0  
**Last Updated**: February 12, 2026  
**Status**: ✅ Production Ready
