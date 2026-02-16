# Mashtal Platform - Clean Architecture Refactor Plan

## Overview
Refactor the existing Mashtal agricultural platform from a traditional folder structure to a feature-based clean architecture without changing any UI/UX.

## Current Issues
- Large monolithic App.tsx with 600+ lines
- Mixed concerns (state, UI, navigation logic)
- Potential circular dependencies
- No clear separation between features
- Scattered business logic

## New Structure

```
/
├── App.tsx (minimal - just providers and routing)
├── /features
│   ├── /auth
│   │   ├── /ui (components)
│   │   ├── /hooks
│   │   ├── /store (context/state)
│   │   ├── /types
│   │   └── /api
│   ├── /business
│   ├── /posts
│   ├── /threads
│   ├── /chat
│   ├── /shopping
│   ├── /profile
│   ├── /notifications
│   ├── /search
│   └── /dashboard
├── /shared
│   ├── /ui (design system components)
│   ├── /hooks (reusable hooks)
│   ├── /types (shared types)
│   ├── /utils (utilities)
│   ├── /api (mock data, API clients)
│   └── /layouts (Navigation, Footer, etc.)
└── /styles
```

## Feature Module Structure
Each feature follows this pattern:
```
/features/{feature-name}
  /ui
    - FeaturePage.tsx (main page)
    - FeatureComponent.tsx (feature components)
  /hooks
    - useFeature.ts (feature-specific hooks)
  /store
    - FeatureContext.tsx (if needed)
  /types
    - index.ts (feature types)
  /api
    - featureApi.ts (data fetching logic)
  index.ts (public exports)
```

## Dependencies Rules
1. Features can import from /shared
2. Features CANNOT import from other features
3. Shared modules CANNOT import from features
4. Each feature exports its public API through index.ts

## Refactor Steps
1. ✅ Create new folder structure
2. ✅ Move shared UI components to /shared/ui
3. ✅ Extract and centralize types to /shared/types
4. ✅ Move mock data to /shared/api
5. ✅ Create feature modules (auth, business, posts, etc.)
6. ✅ Refactor App.tsx to be minimal
7. ✅ Update all imports
8. ✅ Test that everything works

## Key Principles
- Single Responsibility: Each file has one clear purpose
- Dependency Inversion: Features depend on abstractions in /shared
- Open/Closed: Easy to add new features without modifying existing code
- Interface Segregation: Features only import what they need
- DRY: Shared logic centralized in /shared
