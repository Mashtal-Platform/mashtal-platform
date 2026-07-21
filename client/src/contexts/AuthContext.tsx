import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiGet, apiPost, apiPut } from '../shared/api/client';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

function normalizeUser(apiUser: any): User {
  if (!apiUser) return apiUser;
  const businessProfile = apiUser.businessProfile || {};
  const professionalProfile = apiUser.professionalProfile || {};
  const isVisitor = apiUser.role === 'visitor';

  return {
    id: apiUser.id || apiUser._id,
    email: apiUser.email,
    fullName: apiUser.fullName,
    role: apiUser.role,
    avatar: apiUser.avatar,
    coverImage: apiUser.coverImage,
    verified: apiUser.verified,
    phone: isVisitor
      ? apiUser.phone || businessProfile.phone || professionalProfile.phone
      : businessProfile.phone || professionalProfile.phone || apiUser.phone,
    location: isVisitor
      ? apiUser.location || businessProfile.location || professionalProfile.location
      : businessProfile.location || professionalProfile.location || apiUser.location,
    // Visitors should not have bio in the UI.
    bio: isVisitor ? undefined : businessProfile.bio || professionalProfile.bio || apiUser.bio,
    companyName: businessProfile.companyName || apiUser.companyName,
    businessType: apiUser.businessType,
    subscriptionStatus: apiUser.subscriptionStatus,
    subscriptionExpiresAt: apiUser.subscriptionExpiresAt || null,
    businessId: apiUser.businessId,
    hours: businessProfile.hours,
    about: businessProfile.about && typeof businessProfile.about === 'object' && !Array.isArray(businessProfile.about)
      ? businessProfile.about
      : undefined,
    businessProfile: apiUser.businessProfile,
    preferredLanguage:
      apiUser.preferredLanguage === 'ar' || apiUser.preferredLanguage === 'en'
        ? apiUser.preferredLanguage
        : 'en',
    operatorId: apiUser.operatorId || undefined,
    operatorEmail: apiUser.operatorEmail || undefined,
    operatorName: apiUser.operatorName || undefined,
  };
}

export type UserRole =
  | 'visitor'
  | 'business'
  | 'admin'
  | null;

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  coverImage?: string;
  phone?: string;
  location?: string;
  bio?: string;
  // Business-specific
  companyName?: string;
  businessType?: string;
  verified?: boolean;
  subscriptionStatus?: 'active' | 'inactive';
  subscriptionExpiresAt?: string | null;
  businessId?: string;
  hours?: Array<{ day?: string; closed?: boolean; open?: Array<{ from?: string; to?: string }> }>;
  about?: Record<string, string>;
  businessProfile?: Record<string, unknown>;
  preferredLanguage?: 'en' | 'ar';
  /** Real admin who signed in (for support-lock); session id is the shared account. */
  operatorId?: string;
  operatorEmail?: string;
  operatorName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (
    credential: string,
    registration?: {
      role?: 'visitor' | 'business';
      businessProfile?: Record<string, unknown>;
    }
  ) => Promise<User>;
  signUp: (input: {
    email: string;
    password: string;
    fullName: string;
    role: Exclude<UserRole, null>;
    avatar?: string;
    businessProfile?: {
      bio?: string;
      location?: string;
      phone?: string;
      companyName?: string;
      specialties?: string[];
      address?: string;
      contactEmail?: string;
      website?: string;
      wishPhone?: string;
      wishAccountNumber?: string;
    };
    professionalProfile?: {
      bio?: string;
      location?: string;
      phone?: string;
      specialization?: string;
      yearsExperience?: number;
      specialties?: string[];
    };
  }) => Promise<{ requiresVerification?: boolean; user?: any }>;
  signOut: () => Promise<void>;
  /** Verify email via link token (from email). Returns true if verified and logged in.
   *  When the account has a pending business upgrade, needsPayment is true. */
  verifyEmail: (token: string) => Promise<{ ok: boolean; needsPayment?: boolean }>;
  /** Email awaiting verification after signup (if any). */
  pendingVerificationEmail: string | null;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  /** Convert current visitor account to a business account. */
  convertToBusiness: (businessProfile: {
    companyName: string;
    bio?: string;
    phone?: string;
    location?: string;
    address?: string;
    contactEmail?: string;
    website?: string;
    specialties?: string[];
    wishPhone?: string;
    wishAccountNumber?: string;
  }) => Promise<User>;
  refreshUser: () => Promise<User | null>;
  switchUser: (userId: string) => void;
  availableUsers: User[];
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingVerification, setPendingVerification] = useState<string | null>(null);

  const availableUsers: User[] = [];

  useEffect(() => {
    const boot = async () => {
      try {
        const token = localStorage.getItem('mashtal_token');
        const storedUser = localStorage.getItem('mashtal_user');
        if (storedUser) setUser(normalizeUser(JSON.parse(storedUser)));
        if (!token) return;
        const me = await apiGet<any>('/auth/me');
        const normalized = normalizeUser(me);
        setUser(normalized);
        localStorage.setItem('mashtal_user', JSON.stringify(normalized));
      } catch {
        localStorage.removeItem('mashtal_token');
        localStorage.removeItem('mashtal_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  const signIn = async (email: string, password: string) => {
    const data = await apiPost<{ token: string; user: any }>('/auth/login', { email, password });
    localStorage.setItem('mashtal_token', data.token);
    const nextUser = normalizeUser(data.user);
    localStorage.setItem('mashtal_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const signInWithGoogle = async (
    credential: string,
    registration?: {
      role?: 'visitor' | 'business';
      businessProfile?: Record<string, unknown>;
    }
  ) => {
    if (!credential) throw new Error('Google did not return a sign-in credential');
    const data = await apiPost<{ token: string; user: any }>('/auth/google', {
      credential,
      ...registration,
    });
    localStorage.setItem('mashtal_token', data.token);
    const nextUser = normalizeUser(data.user);
    localStorage.setItem('mashtal_user', JSON.stringify(nextUser));
    setPendingVerification(null);
    setUser(nextUser);
    return {
      ...nextUser,
      needsPayment: !!(data.user as any)?.needsPayment,
      pendingBusinessUpgrade: !!(data.user as any)?.pendingBusinessUpgrade,
    };
  };

  const signUp = async (input: {
    email: string;
    password: string;
    fullName: string;
    role: Exclude<UserRole, null>;
    avatar?: string;
    businessProfile?: {
      bio?: string;
      location?: string;
      phone?: string;
      companyName?: string;
      specialties?: string[];
      address?: string;
      contactEmail?: string;
      website?: string;
      wishPhone?: string;
      wishAccountNumber?: string;
    };
    professionalProfile?: {
      bio?: string;
      location?: string;
      phone?: string;
      specialization?: string;
      yearsExperience?: number;
      specialties?: string[];
    };
  }): Promise<{ requiresVerification?: boolean; user?: any }> => {
    const data = await apiPost<{ token?: string; user: any; requiresVerification?: boolean }>('/auth/register', input);
    if (data.requiresVerification) {
      setPendingVerification(input.email);
      return { requiresVerification: true, user: data.user };
    }
    if (data.token) {
      localStorage.setItem('mashtal_token', data.token);
      const nextUser = normalizeUser(data.user);
      localStorage.setItem('mashtal_user', JSON.stringify(nextUser));
      setUser(nextUser);
    }
    return { requiresVerification: false, user: data.user };
  };

  const verifyEmail = async (
    token: string
  ): Promise<{ ok: boolean; needsPayment?: boolean }> => {
    if (!token || !token.trim()) return { ok: false };
    try {
      const data = await apiGet<{ token: string; user: any }>(
        `/auth/verify-email?token=${encodeURIComponent(token.trim())}`
      );
      if (data.token && data.user) {
        localStorage.setItem('mashtal_token', data.token);
        const nextUser = normalizeUser(data.user);
        localStorage.setItem('mashtal_user', JSON.stringify(nextUser));
        setUser(nextUser);
        setPendingVerification(null);
        const needsPayment = !!(
          data.user.needsPayment ||
          data.user.pendingBusinessUpgrade ||
          data.user.pendingBusinessProfile
        );
        return { ok: true, needsPayment };
      }
      return { ok: false };
    } catch {
      return { ok: false };
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('mashtal_user');
    localStorage.removeItem('mashtal_token');
  };

  const updateProfile = async (updates: Partial<User>) => {
    const normalizePhoneForServer = (value: unknown) => {
      if (!value || typeof value !== 'string') return value;
      const cleaned = value
        .replace(/[()]/g, '')
        .replace(/[–—]/g, '-')
        .replace(/[^\d+\-\s]/g, '')
        .trim();
      if (!cleaned) return cleaned;
      try {
        const parsed = parsePhoneNumberFromString(cleaned, 'LB');
        if (parsed?.number) return parsed.number; // E.164: +{country}{national}
      } catch {
        // ignore; fall back to cleaned string
      }
      return cleaned;
    };

    // Do not depend on `user` state being loaded:
    // the server update is authenticated via token (req.user), so even if `user` is null
    // we should still attempt the request and let backend auth/validation handle it.
    const nextUpdates: Partial<User> = {
      ...updates,
      phone: normalizePhoneForServer((updates as any).phone),
      businessProfile: updates.businessProfile
        ? {
            ...(updates.businessProfile as any),
            phone: normalizePhoneForServer((updates.businessProfile as any).phone),
          }
        : updates.businessProfile,
      professionalProfile: updates.professionalProfile
        ? {
            ...(updates.professionalProfile as any),
            phone: normalizePhoneForServer((updates.professionalProfile as any).phone),
          }
        : updates.professionalProfile,
    };

    console.log('[AuthContext] updateProfile payload -> PUT /users/me', {
      ...nextUpdates,
      // Avoid noisy logs; keep readable and safe.
      professionalProfile: nextUpdates.professionalProfile
        ? { ...nextUpdates.professionalProfile, about: '[Map/obj]' }
        : undefined,
      businessProfile: nextUpdates.businessProfile
        ? { ...nextUpdates.businessProfile, about: '[Map/obj]' }
        : undefined,
    });

    const updatedUser = await apiPut<any>('/users/me', nextUpdates);
    // Normalize the response from PUT, then re-fetch /auth/me to ensure we reflect the DB
    // (important if the PUT response is missing nested fields).
    const normalizedFromPut = normalizeUser(updatedUser);
    try {
      const me = await apiGet<any>('/auth/me');
      const normalizedFromMe = normalizeUser(me);
      setUser(normalizedFromMe);
      localStorage.setItem('mashtal_user', JSON.stringify(normalizedFromMe));
      return normalizedFromMe;
    } catch {
      setUser(normalizedFromPut);
      localStorage.setItem('mashtal_user', JSON.stringify(normalizedFromPut));
      return normalizedFromPut;
    }
  };

  const refreshUser = async (): Promise<User | null> => {
    try {
      const me = await apiGet<any>('/auth/me');
      const normalized = normalizeUser(me);
      setUser(normalized);
      localStorage.setItem('mashtal_user', JSON.stringify(normalized));
      return normalized;
    } catch {
      return null;
    }
  };

  const convertToBusiness = async (businessProfile: {
    companyName: string;
    bio?: string;
    phone?: string;
    location?: string;
    address?: string;
    contactEmail?: string;
    website?: string;
    specialties?: string[];
    wishPhone?: string;
    wishAccountNumber?: string;
  }): Promise<User> => {
    const updated = await apiPost<any>('/users/me/convert-to-business', { businessProfile });
    const normalized = normalizeUser(updated);
    try {
      const me = await apiGet<any>('/auth/me');
      const fromMe = normalizeUser(me);
      setUser(fromMe);
      localStorage.setItem('mashtal_user', JSON.stringify(fromMe));
      return fromMe;
    } catch {
      setUser(normalized);
      localStorage.setItem('mashtal_user', JSON.stringify(normalized));
      return normalized;
    }
  };

  const switchUser = (userId: string) => {
    void userId;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        verifyEmail,
        pendingVerificationEmail: pendingVerification,
        updateProfile,
        convertToBusiness,
        refreshUser,
        switchUser,
        availableUsers,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}