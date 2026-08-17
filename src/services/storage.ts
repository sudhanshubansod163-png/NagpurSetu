import { CaseItem, NotificationItem, UserProfile, UserRole } from '../types';
import { INITIAL_CASES, INITIAL_NOTIFICATIONS, INITIAL_USER } from '../data/initialData';
import { FirebaseDataService } from './firebaseDataService';

const STORAGE_KEYS = {
  CASES: 'nagpursetu_cases_v5_live',
  NOTIFICATIONS: 'nagpursetu_notifications_v5_live',
  USER: 'nagpursetu_user_v5_live',
  ACTIVE_ROLE: 'nagpursetu_active_role_v5_live',
  CURRENT_LANGUAGE: 'nagpursetu_lang_v5_live',
  DRAFT_CHAT: 'nagpursetu_draft_chat_v5_live',
};

// Cleanup old legacy version keys
if (typeof window !== 'undefined') {
  try {
    const legacyKeys = [
      'nagpursetu_cases',
      'nagpursetu_cases_v2',
      'nagpursetu_cases_v3_clean',
      'nagpursetu_cases_v4_clean',
      'nagpursetu_notifications',
      'nagpursetu_notifications_v2',
      'nagpursetu_notifications_v3_clean',
      'nagpursetu_notifications_v4_clean'
    ];
    legacyKeys.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    // ignore
  }
}

// Event listener mechanism for cross-component reactivity
const listeners: Set<() => void> = new Set();

// Cross-tab / cross-window real-time synchronization via BroadcastChannel
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('nagpursetu_realtime_sync');
    broadcastChannel.onmessage = () => {
      notifyLocalListeners();
    };
  } catch (e) {
    console.warn('BroadcastChannel not available:', e);
  }
}

// Listen to storage events from other tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('nagpursetu_')) {
      notifyLocalListeners();
    }
  });
}

// Track whether initial cloud sync has been received
let isCloudSynced = false;

// Background listener for Cloud Firestore real-time updates
if (typeof window !== 'undefined') {
  try {
    // 1. Real-time cases subscription
    FirebaseDataService.subscribeToCases((firestoreCases) => {
      isCloudSynced = true;
      if (Array.isArray(firestoreCases)) {
        try {
          localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(firestoreCases));
          notifyLocalListeners();
        } catch (e) {
          console.warn('Storage sync error:', e);
        }
      }
    });

    // 2. Real-time notifications subscription
    FirebaseDataService.subscribeToNotifications((firestoreNotifs) => {
      if (Array.isArray(firestoreNotifs)) {
        try {
          localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(firestoreNotifs));
          notifyLocalListeners();
        } catch (e) {
          console.warn('Notification sync error:', e);
        }
      }
    });
  } catch (e) {
    console.warn('Firestore real-time subscription init:', e);
  }
}

export const subscribeToStorage = (callback: () => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

const notifyLocalListeners = () => {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('Storage listener error:', e);
    }
  });
};

const notifyListeners = () => {
  // 1. Notify local React components immediately (0ms delay)
  notifyLocalListeners();
  
  // 2. Broadcast to other tabs / windows immediately (0ms delay)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'SYNC_UPDATE', timestamp: Date.now() });
    } catch (e) {
      // ignore
    }
  }

  // 3. Dispatch window custom event for any non-React listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nagpursetu_data_change', { detail: { timestamp: Date.now() } }));
  }
};

export const StorageService = {
  getCitizenSessionId: (): string => {
    try {
      let sessionId = localStorage.getItem('nagpursetu_citizen_session_id');
      if (!sessionId) {
        sessionId = 'citizen_session_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Date.now().toString(36));
        localStorage.setItem('nagpursetu_citizen_session_id', sessionId);
      }
      return sessionId;
    } catch {
      return 'citizen_default_session';
    }
  },

  // Returns all cases (used by municipal admin/officers and anonymous spatial aggregations)
  getCases: (): CaseItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CASES);
      if (data !== null) {
        return JSON.parse(data);
      }
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify([]));
      return [];
    } catch (e) {
      console.error('Error loading cases:', e);
      return [];
    }
  },

  // Returns ONLY the cases submitted in the current citizen session (guarantees device/user isolation)
  getMyCases: (): CaseItem[] => {
    const all = StorageService.getCases();
    const sessionId = StorageService.getCitizenSessionId();
    return all.filter((c) => {
      // If ownerSessionId matches current session
      if (c.ownerSessionId && c.ownerSessionId === sessionId) return true;
      // If citizenId matches current session
      if (c.citizenId && c.citizenId === sessionId) return true;
      // Fallback for cases created before migration if no other session tag exists
      if (!c.ownerSessionId && (!c.citizenId || c.citizenId === 'usr_citizen_01')) return true;
      return false;
    });
  },

  // Checks if a specific case belongs to the current isolated citizen session
  isCaseInCurrentSession: (caseItem?: CaseItem | null): boolean => {
    if (!caseItem) return false;
    const sessionId = StorageService.getCitizenSessionId();
    if (caseItem.ownerSessionId && caseItem.ownerSessionId === sessionId) return true;
    if (caseItem.citizenId && caseItem.citizenId === sessionId) return true;
    return false;
  },

  // Resets the citizen session ID to a clean fresh ID
  resetCitizenSession: (): string => {
    const newSessionId = 'citizen_session_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Date.now().toString(36));
    try {
      localStorage.setItem('nagpursetu_citizen_session_id', newSessionId);
      notifyListeners();
    } catch (e) {
      console.warn('Could not reset session ID:', e);
    }
    return newSessionId;
  },

  // Returns session-specific metric counts vs city totals
  getSessionStats: () => {
    const allCases = StorageService.getCases();
    const myCases = StorageService.getMyCases();
    const activeMyCases = myCases.filter((c) => c.status !== 'Resolved' && c.status !== 'Closed').length;
    const resolvedMyCases = myCases.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
    return {
      totalMyCases: myCases.length,
      activeMyCases,
      resolvedMyCases,
      totalCityCases: allCases.length
    };
  },

  getCaseById: (id: string): CaseItem | undefined => {
    const cases = StorageService.getCases();
    return cases.find((c) => c.id.toLowerCase() === id.toLowerCase() || c.id.replace('#', '').toLowerCase() === id.replace('#', '').toLowerCase());
  },

  saveCases: (cases: CaseItem[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
      notifyListeners();
    } catch (e) {
      console.error('Error saving cases:', e);
    }
  },

  deleteCase: (id: string): void => {
    const cases = StorageService.getCases();
    const updated = cases.filter((c) => c.id.toLowerCase() !== id.toLowerCase());
    StorageService.saveCases(updated);

    // Delete in Cloud Firestore immediately
    FirebaseDataService.deleteCase(id).catch((err) => {
      console.warn('Firestore delete warning:', err);
    });
  },

  clearAllCases: async (): Promise<void> => {
    StorageService.saveCases([]);
    try {
      await FirebaseDataService.clearAllCases();
    } catch (err) {
      console.warn('Firestore clear error:', err);
    }
  },

  seedDemoCases: async (): Promise<void> => {
    StorageService.saveCases([]);
  },

  addCase: (newCase: CaseItem): CaseItem => {
    const sessionId = StorageService.getCitizenSessionId();
    const caseWithSession: CaseItem = {
      ...newCase,
      ownerSessionId: newCase.ownerSessionId || sessionId,
      citizenId: newCase.citizenId || sessionId,
    };
    const cases = StorageService.getCases();
    const updated = [caseWithSession, ...cases];
    StorageService.saveCases(updated);

    // Persist to Cloud Firestore in background
    FirebaseDataService.saveCase(caseWithSession).catch((err) => {
      console.warn('Firestore case persist warning:', err);
    });

    // Auto-create notification for citizen
    StorageService.addNotification({
      id: `notif-${Date.now()}`,
      userId: caseWithSession.citizenId,
      title: `Case Registered: #${caseWithSession.id}`,
      message: `Your complaint regarding "${caseWithSession.title}" has been registered and assigned to ${caseWithSession.department}.`,
      type: 'case_update',
      caseId: caseWithSession.id,
      read: false,
      createdAt: 'Just now',
      actionUrl: `/cases/${caseWithSession.id}`
    });

    return caseWithSession;
  },

  updateCase: (id: string, updates: Partial<CaseItem>): CaseItem | undefined => {
    const cases = StorageService.getCases();
    const index = cases.findIndex((c) => c.id.toLowerCase() === id.toLowerCase());
    if (index === -1) return undefined;

    const existing = cases[index];
    const updatedCase: CaseItem = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    cases[index] = updatedCase;
    StorageService.saveCases(cases);

    // Sync updated case to Cloud Firestore
    FirebaseDataService.saveCase(updatedCase).catch((err) => {
      console.warn('Firestore update sync warning:', err);
    });

    return updatedCase;
  },

  updateCaseStatus: (
    id: string,
    newStatus: CaseItem['status'],
    actorName: string,
    remarks?: string,
    evidenceUrl?: string
  ): CaseItem | undefined => {
    const cases = StorageService.getCases();
    const currentCase = cases.find((c) => c.id.toLowerCase() === id.toLowerCase());
    if (!currentCase) return undefined;

    const newTimelineEvent = {
      id: `tl-${Date.now()}`,
      title: `Status: ${newStatus}`,
      timestamp: 'Just now',
      actor: actorName,
      description: remarks || `Case status updated to ${newStatus} by ${actorName}`,
      status: (newStatus === 'Resolved' || newStatus === 'Closed' ? 'completed' : 'current') as 'completed' | 'current' | 'pending',
      dotColor: (newStatus === 'Resolved' ? 'green' : newStatus === 'In Progress' ? 'orange' : 'dark') as 'dark' | 'orange' | 'green' | 'gray',
      evidenceUrl,
    };

    const updatedTimeline = [...currentCase.timeline, newTimelineEvent];

    return StorageService.updateCase(id, {
      status: newStatus,
      resolutionNotes: remarks || currentCase.resolutionNotes,
      resolutionEvidenceUrl: evidenceUrl || currentCase.resolutionEvidenceUrl,
      timeline: updatedTimeline,
    });
  },

  reopenCase: (id: string, citizenReason: string): CaseItem | undefined => {
    const cases = StorageService.getCases();
    const current = cases.find((c) => c.id.toLowerCase() === id.toLowerCase());
    if (!current) return undefined;

    const reopenEvent = {
      id: `tl-${Date.now()}`,
      title: 'Citizen Reopened Complaint',
      timestamp: 'Just now',
      actor: current.citizenName,
      description: `Citizen noted: "${citizenReason}". Sent back to ${current.department} for re-investigation.`,
      status: 'current' as const,
      dotColor: 'orange' as const,
    };

    return StorageService.updateCase(id, {
      status: 'Reopened',
      priority: 'High',
      slaStatus: 'Warning',
      slaRemaining: '24h left',
      timeline: [...current.timeline, reopenEvent],
    });
  },

  confirmResolution: (id: string, isResolved: boolean, feedback?: string): CaseItem | undefined => {
    const current = StorageService.getCaseById(id);
    if (!current) return undefined;

    if (isResolved) {
      const closeEvent = {
        id: `tl-${Date.now()}`,
        title: 'Citizen Confirmed Resolution (Yes)',
        timestamp: 'Just now',
        actor: current.citizenName || 'Citizen',
        description: feedback || 'Citizen verified problem has been solved on ground. Complaint marked verified & closed.',
        status: 'completed' as const,
        dotColor: 'green' as const,
      };

      return StorageService.updateCase(id, {
        status: 'Closed',
        citizenFeedback: {
          isResolved: true,
          feedbackText: feedback,
          submittedAt: new Date().toISOString(),
        },
        timeline: [...current.timeline, closeEvent],
      });
    } else {
      return StorageService.reopenCase(id, feedback || 'Citizen indicated problem is still unresolved on ground.');
    }
  },

  confirmProblemReport: (id: string, sessionId?: string): { success: boolean; caseItem?: CaseItem; alreadyConfirmed?: boolean } => {
    const current = StorageService.getCaseById(id);
    if (!current) return { success: false };

    const actualSession = sessionId || 'civic_session_' + (typeof window !== 'undefined' ? (localStorage.getItem('nagpursetu_session_id') || (() => {
      const newId = 'session_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('nagpursetu_session_id', newId);
      return newId;
    })()) : 'anon');

    const confirmedList = current.confirmedBySessions || [];
    if (confirmedList.includes(actualSession)) {
      return { success: true, caseItem: current, alreadyConfirmed: true };
    }

    const newCount = (current.confirmationsCount || 0) + 1;
    const shouldEscalate = newCount >= 20 && current.priority === 'Normal';

    const updatedTimeline = [...current.timeline];
    if (shouldEscalate) {
      updatedTimeline.push({
        id: `tl-conf-${Date.now()}`,
        title: 'High Community Confirmation Escalation',
        timestamp: 'Just now',
        description: `${newCount} local citizens confirmed this civic issue. Priority elevated to High.`,
        status: 'completed',
        dotColor: 'orange'
      });
    }

    const updated = StorageService.updateCase(id, {
      confirmationsCount: newCount,
      confirmedBySessions: [...confirmedList, actualSession],
      priority: shouldEscalate ? 'High' : current.priority,
      timeline: updatedTimeline
    });

    return { success: true, caseItem: updated, alreadyConfirmed: false };
  },

  findNearbyDuplicates: (category: string, lat?: number, lng?: number, areaKeyword?: string): CaseItem[] => {
    const cases = StorageService.getCases();
    return cases.filter((c) => {
      if (c.status === 'Resolved' || c.status === 'Closed') return false;
      const sameCat = c.category.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(c.category.toLowerCase());
      if (!sameCat) return false;

      if (lat && lng && c.lat && c.lng) {
        // Approximate distance calculation within ~1.5km
        const dLat = Math.abs(c.lat - lat);
        const dLng = Math.abs(c.lng - lng);
        if (dLat < 0.015 && dLng < 0.015) {
          return true;
        }
      }

      if (areaKeyword && areaKeyword.trim().length > 3) {
        const needle = areaKeyword.toLowerCase().trim();
        if (c.location.toLowerCase().includes(needle) || (c.ward && c.ward.toLowerCase().includes(needle))) {
          return true;
        }
      }

      return false;
    });
  },


  // Notifications
  getNotifications: (): NotificationItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
        return [];
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error getting notifications:', e);
      return [];
    }
  },

  // Returns ONLY notifications relevant to current citizen session
  getMyNotifications: (): NotificationItem[] => {
    const all = StorageService.getNotifications();
    const sessionId = StorageService.getCitizenSessionId();
    const myCases = StorageService.getMyCases();
    const myCaseIdSet = new Set(myCases.map((c) => c.id.toLowerCase()));

    return all.filter((n) => {
      // Direct session match
      if (n.userId && n.userId === sessionId) return true;
      // Case ownership match
      if (n.caseId && myCaseIdSet.has(n.caseId.toLowerCase())) return true;
      // General city broadcast with no specific user restriction
      if (!n.userId && !n.caseId) return true;
      return false;
    });
  },

  addNotification: (notification: NotificationItem): void => {
    const list = StorageService.getNotifications();
    const updated = [notification, ...list];
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      notifyListeners();
    } catch (e) {
      console.error('Error adding notification:', e);
    }

    FirebaseDataService.saveNotification(notification).catch((err) => {
      console.warn('Firestore notification save notice:', err);
    });
  },

  markNotificationAsRead: (id: string): void => {
    const list = StorageService.getNotifications();
    const target = list.find((n) => n.id === id);
    const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    notifyListeners();

    if (target) {
      FirebaseDataService.saveNotification({ ...target, read: true }).catch((err) => {
        console.warn('Firestore notification update notice:', err);
      });
    }
  },

  markAllNotificationsAsRead: (): void => {
    const list = StorageService.getNotifications();
    const updated = list.map((n) => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    notifyListeners();

    updated.forEach((n) => {
      FirebaseDataService.saveNotification(n).catch(console.warn);
    });
  },

  // User & Active Role
  getUser: (): UserProfile => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(INITIAL_USER));
        return INITIAL_USER;
      }
      return JSON.parse(data);
    } catch (e) {
      return INITIAL_USER;
    }
  },

  saveUser: (user: UserProfile): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      notifyListeners();
    } catch (e) {
      console.error('Error saving user profile:', e);
    }
  },

  getActiveRole: (): UserRole => {
    return 'citizen';
  },

  setActiveRole: (role: UserRole): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
      notifyListeners();
    } catch (e) {
      console.error('Error setting role:', e);
    }
  },

  getLanguage: (): string => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_LANGUAGE) || 'en';
  },

  setLanguage: (lang: string): void => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_LANGUAGE, lang);
    notifyListeners();
  },

  resetDemoData: (): void => {
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(INITIAL_USER));
    notifyListeners();
    FirebaseDataService.clearAllCases().catch((e) => console.warn('Reset clear warning:', e));
  }
};
