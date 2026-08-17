import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  uploadString 
} from 'firebase/storage';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { db, auth, storage, googleProvider, firebaseStatus } from './firebase';
import { CaseItem, NotificationItem, UserProfile } from '../types';

export interface FirebaseConnectionTestResult {
  authStatus: 'connected' | 'signed_out' | 'error';
  userEmail?: string;
  userId?: string;
  firestoreReadWrite: 'success' | 'failed' | 'pending';
  storageStatus: 'available' | 'error' | 'pending';
  lastChecked: string;
  details?: string;
}

// Collections references
const CASES_COLLECTION = 'cases';
const NOTIFICATIONS_COLLECTION = 'notifications';
const USERS_COLLECTION = 'users';

export const FirebaseDataService = {
  // Test connection & read/write capability to Firestore
  testConnection: async (): Promise<FirebaseConnectionTestResult> => {
    const result: FirebaseConnectionTestResult = {
      authStatus: auth.currentUser ? 'connected' : 'signed_out',
      userEmail: auth.currentUser?.email || undefined,
      userId: auth.currentUser?.uid || undefined,
      firestoreReadWrite: 'pending',
      storageStatus: 'available',
      lastChecked: new Date().toISOString()
    };

    try {
      // 1. Write a diagnostic health probe doc to Firestore
      const healthDocRef = doc(db, '_system', 'health');
      const pingData = {
        ping: 'NagpurSetu_Firebase_Connected',
        timestamp: new Date().toISOString(),
        clientTime: Date.now(),
        app: 'NagpurSetu',
        status: 'online'
      };
      await setDoc(healthDocRef, pingData, { merge: true });

      // 2. Read back the health probe doc
      const snapshot = await getDoc(healthDocRef);
      if (snapshot.exists() && snapshot.data()?.ping === 'NagpurSetu_Firebase_Connected') {
        result.firestoreReadWrite = 'success';
        result.details = 'Firestore read and write verified successfully on database: ' + firebaseStatus.firestoreDatabaseId;
      } else {
        result.firestoreReadWrite = 'failed';
        result.details = 'Written doc could not be verified.';
      }
    } catch (err: any) {
      console.error('Firebase test connection error:', err);
      result.firestoreReadWrite = 'failed';
      result.details = err.message || 'Unknown Firestore error';
    }

    return result;
  },

  // Auth helper methods
  signInWithGoogle: async (): Promise<User | null> => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      return userCredential.user;
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      throw err;
    }
  },

  signOutUser: async (): Promise<void> => {
    await signOut(auth);
  },

  onAuthChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },

  // Firestore Cases CRUD
  saveCase: async (caseData: CaseItem): Promise<void> => {
    try {
      const docRef = doc(db, CASES_COLLECTION, caseData.id);
      await setDoc(docRef, {
        ...caseData,
        _updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Firestore saveCase error:', error);
      throw error;
    }
  },

  deleteCase: async (caseId: string): Promise<void> => {
    try {
      const docRef = doc(db, CASES_COLLECTION, caseId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Firestore deleteCase error:', error);
      throw error;
    }
  },

  clearAllCases: async (): Promise<void> => {
    try {
      const snapshot = await getDocs(collection(db, CASES_COLLECTION));
      if (snapshot.empty) return;
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error('Firestore clearAllCases error:', error);
      throw error;
    }
  },

  seedCases: async (casesList: CaseItem[]): Promise<void> => {
    try {
      const batch = writeBatch(db);
      casesList.forEach((item) => {
        const docRef = doc(db, CASES_COLLECTION, item.id);
        batch.set(docRef, {
          ...item,
          _updatedAt: serverTimestamp()
        }, { merge: true });
      });
      await batch.commit();
    } catch (error) {
      console.error('Firestore seedCases error:', error);
      throw error;
    }
  },

  getCaseById: async (caseId: string): Promise<CaseItem | null> => {
    try {
      const docRef = doc(db, CASES_COLLECTION, caseId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return snap.data() as CaseItem;
    } catch (error) {
      console.error('Firestore getCaseById error:', error);
      return null;
    }
  },

  getAllCases: async (): Promise<CaseItem[]> => {
    try {
      const q = query(collection(db, CASES_COLLECTION), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => d.data() as CaseItem);
    } catch (error) {
      console.error('Firestore getAllCases error:', error);
      return [];
    }
  },

  subscribeToCases: (callback: (cases: CaseItem[]) => void) => {
    const q = query(collection(db, CASES_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const cases = snapshot.docs.map((d) => d.data() as CaseItem);
      callback(cases);
    }, (error) => {
      console.error('Firestore cases subscription error:', error);
    });
  },

  // Firestore Notifications CRUD
  saveNotification: async (notification: NotificationItem): Promise<void> => {
    try {
      const docRef = doc(db, NOTIFICATIONS_COLLECTION, notification.id);
      await setDoc(docRef, {
        ...notification,
        _updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Firestore saveNotification error:', error);
    }
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    try {
      const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Firestore deleteNotification error:', error);
    }
  },

  subscribeToNotifications: (callback: (notifications: NotificationItem[]) => void) => {
    const q = query(collection(db, NOTIFICATIONS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((d) => d.data() as NotificationItem);
      callback(notifs);
    }, (error) => {
      console.error('Firestore notifications subscription error:', error);
    });
  },

  // Storage file upload (for photos, resolution images, document proof)
  uploadFile: async (path: string, fileOrBase64: File | string): Promise<string> => {
    const storageRef = ref(storage, path);
    if (typeof fileOrBase64 === 'string') {
      // Base64 data URL
      const snapshot = await uploadString(storageRef, fileOrBase64, 'data_url');
      return await getDownloadURL(snapshot.ref);
    } else {
      const snapshot = await uploadBytes(storageRef, fileOrBase64);
      return await getDownloadURL(snapshot.ref);
    }
  },

  // User Profile
  saveUserProfile: async (userId: string, profile: Partial<UserProfile>): Promise<void> => {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(docRef, {
      ...profile,
      _updatedAt: serverTimestamp()
    }, { merge: true });
  },

  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  }
};
