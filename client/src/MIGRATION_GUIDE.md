# Migration Guide: Feature-Based Architecture

## Overview
The Mashtal platform has been refactored from a traditional folder structure to a clean, feature-based architecture. This guide explains the changes and how to work with the new structure.

## What Changed

### Before (Old Structure)
```
/
├── App.tsx (600+ lines, all state management)
├── /components (all components mixed together)
├── /pages (all pages)
├── /contexts (auth, interactions, user data)
├── /data (mock data files)
└── /utils
```

### After (New Structure)
```
/
├── App.tsx (minimal, just routing and providers)
├── /features (organized by domain)
│   ├── /auth
│   ├── /business
│   ├── /posts
│   ├── /threads
│   ├── /shopping
│   ├── /profile
│   ├── /chat
│   ├── /notifications
│   ├── /search
│   ├── /dashboard
│   └── /home
├── /shared
│   ├── /types (centralized types)
│   ├── /utils (utilities)
│   ├── /api (mock data API layer)
│   ├── /store (global state management)
│   ├── /layouts (Navigation, Footer, etc.)
│   └── /ui (design system components)
├── /components (original components, for backward compatibility)
├── /pages (original pages, for backward compatibility)
└── /contexts (original contexts, wrapped by new architecture)
```

## Key Improvements

### 1. Centralized State Management
**Old Way:**
```typescript
// In App.tsx - 600+ lines
const [cartItems, setCartItems] = useState([]);
const [savedItems, setSavedItems] = useState([]);
const [currentPage, setCurrentPage] = useState('home');
// ... 50+ more useState calls
```

**New Way:**
```typescript
// Use centralized state hook
import { useAppState } from './shared/store/AppStateContext';

function MyComponent() {
  const { state, addToCart, navigate } = useAppState();
  // Access any state or action needed
}
```

### 2. Shared Types
**Old Way:**
```typescript
// Types scattered across files
export interface CartItem { ... }
// in App.tsx
export type Page = 'home' | 'posts' | ...;
```

**New Way:**
```typescript
// Import from centralized location
import { CartItem, Page, UserProfile } from './shared/types';
```

### 3. Business Logic Utilities
**Old Way:**
```typescript
// Logic embedded in components
const addToCart = (item) => {
  const existing = cartItems.find(i => i.productId === item.productId);
  if (existing) {
    setCartItems(cartItems.map(i => 
      i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i
    ));
  } else {
    setCartItems([...cartItems, { ...item, id: Date.now().toString(), quantity: 1 }]);
  }
};
```

**New Way:**
```typescript
// Reusable utility function
import { addItemToCart } from './shared/utils/cart';
const newCart = addItemToCart(currentCart, item);
```

### 4. Feature Isolation
Each feature is self-contained and exports only what's needed:

```typescript
// Import entire feature
import { SignInPage, SignUpPage, useAuth } from './features/auth';

// Or import specific components
import { BusinessPage } from './features/business';
```

## How to Use the New Structure

### Working with State
```typescript
import { useAppState } from './shared/store/AppStateContext';

function MyComponent() {
  const { 
    state,           // Access all state
    navigate,        // Navigation actions
    addToCart,       // Cart actions
    createPost,      // Content actions
    followEntity,    // Social actions
    // ... all other actions
  } = useAppState();

  return (
    <div>
      <p>Cart items: {state.cartItems.length}</p>
      <button onClick={() => navigate('cart')}>View Cart</button>
    </div>
  );
}
```

### Adding New Features
1. Create feature folder: `/features/my-feature`
2. Add `index.ts` to export public API
3. Organize internal structure:
   - `/ui` - React components
   - `/hooks` - Custom hooks
   - `/utils` - Feature-specific utilities
   - `/types` - Feature-specific types

### Importing
```typescript
// ✅ Good - Import from shared
import { CartItem } from './shared/types';
import { useAppState } from './shared/store/AppStateContext';
import { addItemToCart } from './shared/utils/cart';

// ✅ Good - Import from feature's public API
import { SignInPage } from './features/auth';
import { BusinessPage } from './features/business';

// ❌ Avoid - Direct imports from other features
import { SomeComponent } from './features/other-feature/ui/SomeComponent';

// ❌ Avoid - Deep imports into shared modules
import { someHelper } from './shared/utils/internal/someHelper';
```

## Dependency Rules

1. ✅ **Features → Shared**: Features can import from `/shared`
2. ❌ **Features → Features**: Features CANNOT import from other features
3. ❌ **Shared → Features**: Shared modules CANNOT import from features
4. ✅ **App → Features**: App.tsx imports feature entry points

## Benefits

### Before Refactor
- ❌ 600+ line App.tsx file
- ❌ Difficult to find code
- ❌ High risk of circular dependencies
- ❌ Hard to test individual features
- ❌ Unclear dependencies
- ❌ Duplicated logic across components

### After Refactor
- ✅ Clean, focused App.tsx (~400 lines)
- ✅ Clear feature boundaries
- ✅ No circular dependencies (enforced by structure)
- ✅ Easy to test features in isolation
- ✅ Explicit dependencies
- ✅ Shared logic centralized in utilities
- ✅ Type-safe throughout
- ✅ Easy to add new features

## Backward Compatibility

All existing imports continue to work. The refactor maintains:
- Original `/components` folder
- Original `/pages` folder
- Original `/contexts` folder
- Original `/data` folder

New code should import from `/features` and `/shared`, but old imports won't break.

## Next Steps

1. **Immediate**: Use `App.refactored.tsx` as the new entry point
2. **Short-term**: Update imports to use new structure
3. **Long-term**: Migrate components into feature folders

## Example: Adding a New Feature

```typescript
// 1. Create feature structure
/features/notifications
  /ui
    NotificationBell.tsx
    NotificationList.tsx
  /hooks
    useNotifications.ts
  /types
    index.ts
  index.ts  // Public API

// 2. Define public exports (index.ts)
export { NotificationBell } from './ui/NotificationBell';
export { NotificationList } from './ui/NotificationList';
export { useNotifications } from './hooks/useNotifications';
export type { Notification } from './types';

// 3. Use in app
import { NotificationBell } from './features/notifications';
```

## Testing

The new structure makes testing easier:

```typescript
// Test utilities in isolation
import { addItemToCart } from './shared/utils/cart';

test('adds item to cart', () => {
  const cart = [];
  const item = { productId: '1', name: 'Test', price: 100 };
  const result = addItemToCart(cart, item);
  expect(result).toHaveLength(1);
});

// Test features with mocked dependencies
import { SignInPage } from './features/auth';
// ... test with mocked auth context
```

## Questions?

Refer to:
- `/REFACTOR_PLAN.md` - Overall refactoring strategy
- `/shared/types/index.ts` - All shared types
- `/shared/store/AppStateContext.tsx` - Global state management
- `/shared/utils/index.ts` - Utility functions
