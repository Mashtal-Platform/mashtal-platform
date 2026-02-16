import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { currentUser, otherUsers } from '../data/centralMockData';

export type UserRole = 'user' | 'agronomist' | 'engineer' | 'business' | 'admin' | null;

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  location?: string;
  bio?: string;
  // Professional (agronomist, engineer) & Business specific
  companyName?: string;
  businessType?: string;
  verified?: boolean;
  subscriptionStatus?: 'active' | 'inactive';
  businessId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  verifyEmail: (code: string) => Promise<boolean>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  switchUser: (userId: string) => void;
  availableUsers: User[];
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingVerification, setPendingVerification] = useState<string | null>(null);

  // Get available users for switching (excluding current user)
  const availableUsers = [currentUser, ...otherUsers].filter(u => u.id !== user?.id).map(u => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    avatar: u.avatar,
    phone: u.phone,
    location: u.location,
    bio: u.bio,
    companyName: u.companyName,
    businessType: u.businessType,
    verified: u.verified,
    businessId: u.businessId,
  }));

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('mashtal_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // Default to the mock current user for demonstration purposes
      setUser(currentUser as User);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // TODO: Call Supabase backend for authentication
    // For now, simulate sign in
    const mockUser: User = {
      id: '1',
      email,
      fullName: 'Ahmed Al-Mansour',
      role: 'user',
      avatar: '',
      phone: '+966 50 123 4567',
      location: 'Riyadh, Saudi Arabia',
      bio: 'Farmer & Agricultural Enthusiast',
    };
    setUser(mockUser);
    localStorage.setItem('mashtal_user', JSON.stringify(mockUser));
  };

  const signInWithGoogle = async () => {
    // TODO: Implement Google OAuth via Supabase
    const mockUser: User = {
      id: '2',
      email: 'user@gmail.com',
      fullName: 'John Doe',
      role: 'user',
    };
    setUser(mockUser);
    localStorage.setItem('mashtal_user', JSON.stringify(mockUser));
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    // TODO: Call Supabase backend for user creation
    // Set pending verification
    setPendingVerification(email);
  };

  const verifyEmail = async (code: string): Promise<boolean> => {
    // TODO: Verify code with backend
    // For now, simulate verification
    if (code.length === 6) {
      const mockUser: User = {
        id: Date.now().toString(),
        email: pendingVerification || '',
        fullName: 'New User',
        role: 'user',
      };
      setUser(mockUser);
      localStorage.setItem('mashtal_user', JSON.stringify(mockUser));
      setPendingVerification(null);
      return true;
    }
    return false;
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('mashtal_user');
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('mashtal_user', JSON.stringify(updatedUser));
    }
  };

  const switchUser = (userId: string) => {
    const selectedUser = [currentUser, ...otherUsers].find(u => u.id === userId);
    if (selectedUser) {
      const newUser: User = {
        id: selectedUser.id,
        email: selectedUser.email,
        fullName: selectedUser.fullName,
        role: selectedUser.role,
        avatar: selectedUser.avatar,
        phone: selectedUser.phone,
        location: selectedUser.location,
        bio: selectedUser.bio,
        companyName: selectedUser.companyName,
        verified: selectedUser.verified,
        businessId: selectedUser.businessId,
      };
      setUser(newUser);
      localStorage.setItem('mashtal_user', JSON.stringify(newUser));
    }
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
        updateProfile,
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