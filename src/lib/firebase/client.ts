import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'accounts-aruta-id.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'accounts-aruta-id',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'accounts-aruta-id.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:demo',
};

// Check if Firebase config is configured with actual credentials
export const isFirebaseConfigured = (): boolean => {
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  return Boolean(key && !key.includes('DemoKey') && key !== 'demo-api-key');
};

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _db: Firestore | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    try {
      _app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    } catch {
      _app = !getApps().length ? initializeApp(firebaseConfig, 'SSO_FALLBACK') : getApp('SSO_FALLBACK');
    }
  }
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
}

export function setFirebaseDb(dbInstance: Firestore | undefined) {
  _db = dbInstance;
}

export function getFirebaseDb(): Firestore | null {
  return _db || null;
}

// Proxies to allow existing code importing { app, auth, db } to work transparently without eager SSR initialization
export const app = new Proxy({} as FirebaseApp, {
  get(_target, prop) {
    const instance = getFirebaseApp();
    const val = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

export const auth = new Proxy({} as Auth, {
  get(_target, prop) {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const instance = getFirebaseAuth();
    const val = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

export const db = new Proxy({} as Firestore, {
  get(_target, prop) {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const instance = getFirebaseDb();
    const val = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});
