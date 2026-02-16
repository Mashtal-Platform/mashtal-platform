// Main export file for the shared module
// Provides convenient access to all shared functionality

// Types
export * from './types';

// Utilities
export * from './utils';

// API
export * from './api/mockData';

// State Management
export { useAppState, AppStateProvider } from './store/AppStateContext';

// Layouts
export { Navigation } from './layouts/Navigation';
export { Footer } from './layouts/Footer';
export { PageTransition } from './layouts/PageTransition';
export { AIAssistant } from './layouts/AIAssistant';

// UI Components (selective re-export to avoid overwhelming imports)
// Import from './shared/ui' directly when needed
