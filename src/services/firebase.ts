import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth setup
export const auth = getAuth(app);
try {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Firebase persistence warning:', err);
  });
} catch (e) {
  console.warn('Auth persistence init:', e);
}

export const googleProvider = new GoogleAuthProvider();

// Firebase Firestore setup with designated database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Firebase Cloud Storage setup for photos, evidence & documents
export const storage = getStorage(app);

export const firebaseStatus = {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || '(default)',
  storageBucket: firebaseConfig.storageBucket,
  appId: firebaseConfig.appId,
  isInitialized: true,
};
