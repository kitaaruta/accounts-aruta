'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updatePassword as fbUpdatePassword,
  updateProfile as fbUpdateProfile
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase/client';
import { SSOUser } from '@/types/sso';
import { 
  getUserProfile, 
  saveUserProfile, 
  logSSOEvent 
} from '@/lib/services/firestore-service';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: SSOUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (code: string, newPass: string) => Promise<void>;
  updateProfileData: (data: Partial<SSOUser>) => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_SESSION = 'sso_aruta_current_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<SSOUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Synchronize state
  useEffect(() => {
    if (isFirebaseConfigured()) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setUser(fbUser);
        if (fbUser) {
          const profile = await getUserProfile(fbUser.uid);
          if (profile) {
            setUserProfile(profile);
          } else {
            const defaultUsername = (fbUser.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '');
            const newProfile: SSOUser = {
              uid: fbUser.uid,
              username: defaultUsername,
              email: fbUser.email || '',
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
              role: 'Member',
              status: 'active',
              emailVerified: fbUser.emailVerified,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            };
            await saveUserProfile(newProfile);
            setUserProfile(newProfile);
          }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // Local development fallback session
      try {
        const cached = localStorage.getItem(LOCAL_USER_SESSION);
        if (cached) {
          const parsed = JSON.parse(cached) as SSOUser;
          setUserProfile(parsed);
          setUser({
            uid: parsed.uid,
            email: parsed.email,
            displayName: parsed.displayName,
            emailVerified: parsed.emailVerified,
          } as unknown as FirebaseUser);
        } else {
          setUserProfile(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Session load warning:', err);
      }
      setLoading(false);
    }
  }, []);

  const refreshProfile = async () => {
    if (userProfile?.uid) {
      const p = await getUserProfile(userProfile.uid);
      if (p) setUserProfile(p);
    }
  };

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      if (isFirebaseConfigured()) {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        const profile = await getUserProfile(cred.user.uid);
        if (profile) {
          profile.lastLoginAt = new Date().toISOString();
          await saveUserProfile(profile);
          setUserProfile(profile);
        }
        await logSSOEvent('login', email, 'User logged in via Firebase Auth', cred.user.uid);
      } else {
        // Fallback login
        let profile: SSOUser;
        if (email.toLowerCase().includes('admin')) {
          profile = {
            uid: 'usr_admin_root',
            username: 'admin',
            email,
            displayName: 'Administrator Aruta',
            role: 'Superadmin',
            status: 'active',
            emailVerified: true,
            company: 'Aruta.id',
            title: 'Pengelola Ekosistem & Riset',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };
        } else {
          const autoUser = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
          profile = {
            uid: 'usr_' + Math.random().toString(36).substring(2, 9),
            username: autoUser || 'user_' + Math.random().toString(36).substring(2, 6),
            email,
            displayName: email.split('@')[0],
            role: 'Member',
            status: 'active',
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };
        }
        await saveUserProfile(profile);
        setUserProfile(profile);
        setUser({
          uid: profile.uid,
          email: profile.email,
          displayName: profile.displayName,
          emailVerified: profile.emailVerified,
        } as unknown as FirebaseUser);
        localStorage.setItem(LOCAL_USER_SESSION, JSON.stringify(profile));
        await logSSOEvent('login', email, 'User authenticated', profile.uid);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string, name: string, username: string) => {
    setLoading(true);
    try {
      const cleanUsername = username.replace(/^@/, '').toLowerCase().trim();
      if (isFirebaseConfigured()) {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await fbUpdateProfile(cred.user, { displayName: name });
        const newProfile: SSOUser = {
          uid: cred.user.uid,
          username: cleanUsername,
          email,
          displayName: name,
          role: 'Member',
          status: 'active',
          emailVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        await saveUserProfile(newProfile);
        setUserProfile(newProfile);
        await logSSOEvent('register', email, `New user registered: @${cleanUsername}`, cred.user.uid);
      } else {
        const newProfile: SSOUser = {
          uid: 'usr_' + Math.random().toString(36).substring(2, 9),
          username: cleanUsername,
          email,
          displayName: name,
          role: 'Member',
          status: 'active',
          emailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        await saveUserProfile(newProfile);
        setUserProfile(newProfile);
        setUser({
          uid: newProfile.uid,
          email: newProfile.email,
          displayName: newProfile.displayName,
          emailVerified: true,
        } as unknown as FirebaseUser);
        localStorage.setItem(LOCAL_USER_SESSION, JSON.stringify(newProfile));
        await logSSOEvent('register', email, `New user registered: @${cleanUsername}`, newProfile.uid);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (userProfile) {
      await logSSOEvent('logout', userProfile.email, 'User signed out', userProfile.uid);
    }
    if (isFirebaseConfigured()) {
      await signOut(auth);
    }
    setUser(null);
    setUserProfile(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_USER_SESSION);
    }
  };

  const forgotPassword = async (email: string) => {
    if (isFirebaseConfigured()) {
      await sendPasswordResetEmail(auth, email);
    }
    await logSSOEvent('password_reset', email, 'Password reset requested for email');
  };

  const resetPassword = async (code: string, newPass: string) => {
    if (isFirebaseConfigured()) {
      await confirmPasswordReset(auth, code, newPass);
    }
    await logSSOEvent('password_reset', userProfile?.email || 'unknown', 'Password successfully reset');
  };

  const updateProfileData = async (data: Partial<SSOUser>) => {
    if (!userProfile) return;
    const updated: SSOUser = {
      ...userProfile,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await saveUserProfile(updated);
    setUserProfile(updated);

    if (isFirebaseConfigured() && auth.currentUser && data.displayName) {
      await fbUpdateProfile(auth.currentUser, { displayName: data.displayName });
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_USER_SESSION, JSON.stringify(updated));
    }
    await logSSOEvent('user_updated', userProfile.email, 'User updated profile details', userProfile.uid);
  };

  const changePassword = async (newPass: string) => {
    if (isFirebaseConfigured() && auth.currentUser) {
      await fbUpdatePassword(auth.currentUser, newPass);
    }
    await logSSOEvent('password_reset', userProfile?.email || 'user', 'Password changed by user in account page');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        updateProfileData,
        changePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
