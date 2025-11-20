import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';

// Firebase is disabled for local-only mode
// Uncomment and configure Firebase when ready for cloud features
/*
import {
  initializeAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let firebaseApp;
let auth;

try {
  firebaseApp = initializeApp(firebaseConfig);
  auth = initializeAuth(firebaseApp);
} catch (error) {
  console.warn('Firebase initialization error:', error.message);
}
*/

// Local-only mode - no Firebase
let auth = null;

const AuthContext = createContext(null);


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    console.log('AuthProvider: mounting');
  }, []);

  // Check auth state on mount and restore session
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Local-only mode: just restore from storage
        const savedUser = await storage.getUser();
        console.log('AuthProvider: loaded user', savedUser);
        if (savedUser) {
          setUser(savedUser);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('AuthProvider: error checking auth state:', err);
        setIsLoading(false);
      }
    };
    checkAuthState();
  }, []);

  console.log('AuthProvider: user, isLoading', { user, isLoading });
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // Min 6 chars, at least one letter and one number
    return password.length >= 6 && /[a-zA-Z]/.test(password) && /\d/.test(password);
  };

  const handleSignup = async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!validateEmail(email)) {
        throw new Error('Invalid email format');
      }
      if (!validatePassword(password)) {
        throw new Error('Password must be at least 6 characters with letters and numbers');
      }

      // Always use local fallback for now (Firebase not configured)
      const userData = { id: `local-${Date.now()}`, email, displayName: email.split('@')[0] };
      setUser(userData);
      await storage.setUser(userData);
      console.log('User signed up locally:', userData);
    } catch (err) {
      const errorMsg = err.message || 'Signup failed';
      setError(errorMsg);
      console.error('Signup error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!validateEmail(email)) {
        throw new Error('Invalid email format');
      }
      if (!password) {
        throw new Error('Password is required');
      }

      // Always use local fallback for now (Firebase not configured)
      const userData = { id: `local-${Date.now()}`, email, displayName: email.split('@')[0] };
      setUser(userData);
      await storage.setUser(userData);
      console.log('User logged in locally:', userData);
    } catch (err) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      console.error('Login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Local-only mode: just clear storage
      setUser(null);
      await storage.setUser(null);
    } catch (err) {
      const errorMsg = err.message || 'Logout failed';
      setError(errorMsg);
      console.error('Logout error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    error,
    handleLogin,
    handleLogout,
    handleSignup,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};