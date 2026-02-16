# Mashtal Platform - Clean Architecture Documentation

## 🏛️ Architecture Overview

The Mashtal platform follows a **feature-based clean architecture** pattern that promotes:
- Separation of concerns
- Modularity
- Testability
- Maintainability
- Scalability

## 📐 Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                     Presentation Layer                   │
│                         (App.tsx)                        │
│  - Routing logic                                         │
│  - Provider composition                                  │
│  - Page rendering                                        │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
┌─────────▼──────────┐    ┌────────▼─────────┐
│  Feature Modules   │    │  Shared Module   │
│   (Domain Logic)   │    │  (Cross-cutting) │
│                    │    │                  │
│ • auth             │    │ • types          │
│ • business         │    │ • utils          │
│ • posts            │    │ • store          │
│ • threads          │    │ • api            │
│ • shopping         │    │ • layouts        │
│ • profile          │    │ • ui             │
│ • chat             │    │                  │
│ • notifications    │    │                  │
│ • search           │    │                  │
│ • dashboard        │    │                  │
│ • home             │    │                  │
└────────────────────┘    └──────────────────┘
```

## 🔄 Dependency Flow

```
┌─────────────┐
│   App.tsx   │  ← Entry point
└──────┬──────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌─────────────┐  ┌──────────────┐
│  Features   │  │    Shared    │
└──────┬──────┘  └──────┬───────┘
       │                │
       └────────┬───────┘
                │
                ▼
         ┌──────────────┐
         │ Original Code│
         │ (components, │
         │  pages, etc) │
         └──────────────┘
```

### Dependency Rules

1. ✅ **App.tsx** → can import from Features and Shared
2. ✅ **Features** → can import from Shared
3. ❌ **Features** → CANNOT import from other Features
4. ❌ **Shared** → CANNOT import from Features
5. ✅ **All** → can import from original folders (backward compatibility)

## 🎯 Feature Module Structure

Each feature follows this consistent structure:

```
/features/{feature-name}/
├── index.ts              ← Public API (only this is imported)
├── /ui                   ← React components
│   ├── Page.tsx
│   ├── Component.tsx
│   └── SubComponent.tsx
├── /hooks                ← Feature-specific hooks
│   ├── useFeature.ts
│   └── useFeatureLogic.ts
├── /utils                ← Feature-specific utilities
│   └── helpers.ts
├── /types                ← Feature-specific types
│   └── index.ts
└── /api                  ← Data fetching (if needed)
    └── featureApi.ts
```

### Example: Auth Feature

```
/features/auth/
├── index.ts              ← exports: SignInPage, SignUpPage, useAuth
├── /ui
│   ├── SignInPage.tsx    (from /pages/SignInPage.tsx)
│   ├── SignUpPage.tsx    (from /pages/SignUpPage.tsx)
│   └── EmailVerificationPage.tsx
├── /hooks
│   └── useAuth.ts        (from /contexts/AuthContext.tsx)
└── /types
    └── index.ts          (User, UserRole, etc.)
```

## 🗂️ Shared Module Structure

```
/shared/
├── index.ts              ← Main export file
├── /types                ← TypeScript type definitions
│   └── index.ts          (All shared types)
├── /utils                ← Utility functions
│   ├── index.ts          (General utils)
│   ├── cart.ts           (Cart logic)
│   └── navigation.ts     (Navigation helpers)
├── /store                ← State management
│   └── AppStateContext.tsx
├── /api                  ← API abstraction
│   └── mockData.ts       (Re-exports data files)
├── /layouts              ← Layout components
│   ├── Navigation.tsx
│   ├── Footer.tsx
│   ├── PageTransition.tsx
│   └── AIAssistant.tsx
└── /ui                   ← UI component library
    └── index.ts          (Re-exports all UI components)
```

## 🔄 State Management Architecture

```
┌──────────────────────────────────────────────────┐
│              AuthProvider                         │
│  (Authentication state)                          │
└────────────────┬─────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────┐
│         PostInteractionsProvider                  │
│  (Post likes, comments, shares)                  │
└────────────────┬─────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────┐
│            AppStateProvider                       │
│  (Global application state)                      │
│                                                   │
│  State:                                          │
│  • Navigation (currentPage, etc.)                │
│  • Cart (items, operations)                      │
│  • Saved items                                   │
│  • User content (posts, threads)                 │
│  • Social (following, followers)                 │
│  • Notifications                                 │
│  • UI state (modals, etc.)                       │
│                                                   │
│  Actions:                                        │
│  • navigate(), navigateWithParams()              │
│  • addToCart(), updateCart(), etc.              │
│  • createPost(), deletePost(), etc.             │
│  • followEntity(), unfollowEntity()             │
│  • Notification operations                       │
└──────────────────────────────────────────────────┘
```

## 📊 Data Flow

```
Component
   │
   ├─ Read State ────────────► useAppState() hook
   │                              │
   │                              ▼
   │                        AppStateContext
   │                              │
   │                              ▼
   │                        Centralized State
   │
   ├─ Trigger Action ───────► navigate(), addToCart(), etc.
   │                              │
   │                              ▼
   │                        Business Logic (utils)
   │                              │
   │                              ▼
   └─ State Update ◄──────── setState with new values
```

## 🎨 Component Hierarchy

```
App
├── AuthProvider
│   ├── PostInteractionsProvider
│   │   └── AppStateProvider
│   │       └── AppContent
│   │           ├── Navigation (conditional)
│   │           ├── PageTransition
│   │           │   └── CurrentPage
│   │           ├── Footer (conditional)
│   │           └── AIAssistant (conditional)
```

## 🔧 Utility Organization

```
/shared/utils/
├── index.ts              ← General utilities
│   ├── formatDate()
│   ├── getTimeAgo()
│   ├── truncateText()
│   ├── generateId()
│   ├── isValidEmail()
│   ├── isValidPhone()
│   ├── uniqueById()
│   └── sortByDate()
│
├── cart.ts               ← Cart-specific utilities
│   ├── addItemToCart()
│   ├── updateCartQuantity()
│   ├── removeCartItem()
│   ├── calculateCartTotal()
│   └── getCartItemCount()
│
└── navigation.ts         ← Navigation utilities
    ├── scrollToTop()
    ├── shouldShowLayout()
    ├── shouldShowFooter()
    └── canReceiveMessages()
```

## 🏗️ Type System

```
/shared/types/index.ts

Core Types:
├── User & Auth
│   ├── UserRole
│   ├── User
│   └── UserProfile
│
├── Navigation
│   ├── Page
│   └── NavigationParams
│
├── Shopping
│   ├── CartItem
│   └── Product
│
├── Content
│   ├── Post
│   ├── Thread
│   ├── Comment
│   └── SavedItem
│
├── Business
│   ├── Business
│   └── FollowedEntity
│
├── Notifications
│   └── Notification
│
└── Mock Data
    ├── MockUser
    ├── MockPost
    └── MockThread
```

## 🔐 Access Control

The architecture enforces access control through TypeScript and structure:

```typescript
// ✅ ALLOWED: Feature imports from Shared
import { CartItem } from '../../shared/types';
import { addItemToCart } from '../../shared/utils/cart';

// ❌ FORBIDDEN: Feature imports from another Feature
import { SomeComponent } from '../other-feature/ui/Component';

// ✅ ALLOWED: App imports from Features
import { SignInPage } from './features/auth';

// ❌ FORBIDDEN: Shared imports from Features
// (Would create circular dependency)
```

## 🧪 Testing Strategy

```
Unit Tests
├── Utilities (shared/utils/*)
│   └── Pure functions, easy to test
├── Business Logic
│   └── Cart operations, validations
└── Type Guards
    └── Type checking functions

Integration Tests
├── Feature Modules
│   └── Feature components with mocked state
└── State Management
    └── AppStateContext with mock data

E2E Tests
└── Complete user flows
    └── Using the full app
```

## 📈 Scalability

### Adding a New Feature

```
1. Create feature folder
   /features/my-feature/

2. Add components
   /features/my-feature/ui/
   └── MyFeaturePage.tsx

3. Add hooks (if needed)
   /features/my-feature/hooks/
   └── useMyFeature.ts

4. Add types (if needed)
   /features/my-feature/types/
   └── index.ts

5. Create public API
   /features/my-feature/index.ts
   export { MyFeaturePage } from './ui/MyFeaturePage';

6. Use in App
   import { MyFeaturePage } from './features/my-feature';
```

### Adding Shared Functionality

```
1. Add type (if needed)
   /shared/types/index.ts
   export interface MyType { ... }

2. Add utility (if needed)
   /shared/utils/myUtil.ts
   export const myUtility = () => { ... }

3. Add to state (if needed)
   /shared/store/AppStateContext.tsx
   - Add to state interface
   - Add to initial state
   - Add action function

4. Use anywhere
   import { MyType } from './shared/types';
   import { myUtility } from './shared/utils/myUtil';
   import { useAppState } from './shared/store/AppStateContext';
```

## 🎯 Best Practices

### 1. Keep Features Independent
- Each feature should be self-contained
- Share code through /shared, not between features
- Export only what's needed through index.ts

### 2. Centralize Shared Logic
- Put reusable functions in /shared/utils
- Put common types in /shared/types
- Put global state in /shared/store

### 3. Use Type Safety
- Define interfaces for all data structures
- Use TypeScript strict mode
- Avoid 'any' types

### 4. Follow Naming Conventions
- Files: PascalCase for components, camelCase for utilities
- Folders: kebab-case
- Exports: Named exports preferred

### 5. Document Public APIs
- Add JSDoc comments to exported functions
- Document expected props
- Explain complex logic

## 📚 File Naming Conventions

```
Components:        ComponentName.tsx
Pages:             PageName.tsx
Hooks:             useHookName.ts
Utilities:         utilityName.ts
Types:             index.ts (in types folder)
Contexts:          NameContext.tsx
Styles:            styles.css or name.module.css
```

## 🔍 Code Organization Principles

1. **Single Responsibility**: Each file/function does one thing
2. **DRY**: Don't Repeat Yourself - share common code
3. **KISS**: Keep It Simple, Stupid - avoid over-engineering
4. **YAGNI**: You Aren't Gonna Need It - don't add unused features
5. **Separation of Concerns**: Keep UI, logic, and data separate

## 🎓 Learning Path

For new developers:

1. Start with `/QUICK_START_REFACTORED.md`
2. Read `/REFACTOR_SUMMARY.md`
3. Study `/shared/types/index.ts` for data structures
4. Examine `/shared/store/AppStateContext.tsx` for state management
5. Look at feature modules for organization patterns
6. Read `/MIGRATION_GUIDE.md` for detailed usage

## 🔄 Maintenance

### Regular Tasks
- Keep dependencies updated
- Review and refactor complex components
- Add tests for new features
- Update documentation
- Monitor bundle size

### Refactoring Checklist
- ✅ Does it follow the dependency rules?
- ✅ Is it in the right folder?
- ✅ Is it properly typed?
- ✅ Does it use shared utilities?
- ✅ Is it documented?
- ✅ Is it testable?

---

This architecture provides a solid foundation for building and scaling the Mashtal platform while maintaining code quality and developer productivity.
