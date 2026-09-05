'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider, allowedDomain, isFirebaseConfigured } from '../lib/firebase';

const AuthContext = createContext({
  user: null,
  loading: true,
  authError: null,
  isConfigured: false,
  allowedDomain: 'icat.ac.in',
  loginWithGoogle: async () => {},
  logout: async () => {},
  clearAuthError: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = (firebaseUser.email || '').toLowerCase().trim();
        const requiredSuffix = '@' + allowedDomain;

        if (!email.endsWith(requiredSuffix)) {
          // Force immediate sign-out of unauthorized domain
          await signOut(auth);
          setUser(null);
          setAuthError(`Access Denied: Only official ${requiredSuffix} accounts are allowed. (${email} is not authorized)`);
        } else {
          setUser(firebaseUser);
          setAuthError(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      const err = 'Firebase is not yet configured. Please supply your Firebase credentials in .env.local.';
      setAuthError(err);
      throw new Error(err);
    }

    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = (result.user?.email || '').toLowerCase().trim();
      const requiredSuffix = '@' + allowedDomain;

      if (!email.endsWith(requiredSuffix)) {
        await signOut(auth);
        setUser(null);
        const errMsg = `Access Denied: Account ${email} is not part of ${requiredSuffix}. Please sign in with your official organization account.`;
        setAuthError(errMsg);
        throw new Error(errMsg);
      }

      setUser(result.user);
      return result.user;
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User voluntarily closed the window - don't show scary error
        return null;
      }
      if (!err.message?.includes('Access Denied')) {
        setAuthError(err.message || 'Failed to authenticate with Google.');
      }
      throw err;
    }
  };

  const logout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    setUser(null);
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        isConfigured: isFirebaseConfigured,
        allowedDomain,
        loginWithGoogle,
        logout,
        clearAuthError,
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
