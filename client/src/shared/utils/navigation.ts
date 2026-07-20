// Centralized navigation utilities

import { Page, NavigationParams } from '../types';

export interface NavigationState {
  currentPage: Page;
  selectedBusinessId: string | null;
  selectedChatProfileId: string | null;
  viewingUserId: string | null;
  highlightPostId: string | undefined;
  highlightCommentId: string | undefined;
  highlightThreadId: string | undefined;
  highlightProductId: string | null;
  highlightShoppingProductId: string | null;
  highlightOrderId: string | null;
  highlightPaymentId: string | null;
  dashboardTargetSection: 'analytics' | 'products' | 'orders' | null;
  adminTargetTab: 'overview' | 'users' | 'businesses' | 'subscriptions' | 'transactions' | 'orders' | 'reports' | null;
}

export const initialNavigationState: NavigationState = {
  currentPage: 'home',
  selectedBusinessId: null,
  selectedChatProfileId: null,
  viewingUserId: null,
  highlightPostId: undefined,
  highlightCommentId: undefined,
  highlightThreadId: undefined,
  highlightProductId: null,
  highlightShoppingProductId: null,
  highlightOrderId: null,
  highlightPaymentId: null,
  dashboardTargetSection: null,
  adminTargetTab: null,
};

export const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export const shouldShowLayout = (page: Page): boolean => {
  return !['signin', 'signup', 'verify-email', 'payment'].includes(page);
};

export const shouldShowFooter = (page: Page): boolean => {
  return shouldShowLayout(page) && !['posts', 'threads'].includes(page);
};

export const canReceiveMessages = (role: UserRole | null | undefined): boolean => {
  return role === 'business';
};

type UserRole = 'visitor' | 'business' | 'admin' | null;
