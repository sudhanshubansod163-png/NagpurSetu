export type Language = 'en' | 'hi' | 'mr' | 'hinglish';

export type UserRole = 'citizen' | 'officer' | 'admin';

export type CaseStatus = 
  | 'Submitted' 
  | 'Received'
  | 'Assigned' 
  | 'Under Review'
  | 'In Progress' 
  | 'Waiting for Citizen' 
  | 'Resolved' 
  | 'Reopened' 
  | 'Escalated' 
  | 'Closed';

export type PriorityLevel = 'Low' | 'Normal' | 'Elevated' | 'High' | 'Critical';

export type SlaStatus = 'On Track' | 'Warning' | 'Overdue' | 'Escalated' | 'Pending Review';

export type Department = 
  | 'Solid Waste Management' 
  | 'Roads & Traffic' 
  | 'Water Works' 
  | 'Electrical & Streetlights' 
  | 'Drainage & Sewage' 
  | 'Public Health & Sanitation' 
  | 'Enforcement & Hoardings' 
  | 'Town Planning & Birth/Death';

export type ComplaintCategory =
  | 'Road Problems'
  | 'Streetlight Problems'
  | 'Waste Management'
  | 'Drainage Problems'
  | 'Water Problems'
  | 'Property Tax Problems'
  | 'Building Permission Problems'
  | 'Trade License Problems'
  | 'Birth Certificate Problems'
  | 'Death Certificate Problems'
  | 'Water Connection Problems'
  | 'Other Municipal Problems';

export interface TimelineEvent {
  id: string;
  title: string;
  timestamp: string;
  description?: string;
  actor?: string;
  status: 'completed' | 'current' | 'pending';
  dotColor?: 'dark' | 'orange' | 'green' | 'gray';
  evidenceUrl?: string;
}

export interface CaseAttachment {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'document';
  size?: string;
}

export interface CaseItem {
  id: string; // e.g. "NS-2024-8842" or "REQ-2024-892"
  title: string;
  description: string;
  category: string;
  department: Department;
  location: string;
  ward: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  citizenName: string;
  citizenPhone: string;
  citizenId: string;
  ownerSessionId?: string;
  status: CaseStatus;
  priority: PriorityLevel;
  slaStatus: SlaStatus;
  slaRemaining?: string;
  expectedResolutionDays?: number;
  createdAt: string;
  updatedAt: string;
  assignedOfficer?: string;
  assignedOfficerPhone?: string;
  attachments: CaseAttachment[];
  timeline: TimelineEvent[];
  communityIssueId?: string;
  duplicateCount?: number;
  confirmationsCount?: number;
  confirmedBySessions?: string[];
  resolutionNotes?: string;
  resolutionEvidenceUrl?: string;
  citizenFeedback?: {
    isResolved: boolean;
    feedbackText?: string;
    submittedAt?: string;
    reopenReason?: string;
  };
  language?: Language;
  rawUserInput?: string;
  isCitizenVerified?: boolean;
  citizenVerification?: CitizenVerificationChecklist;
}

export interface CitizenVerificationChecklist {
  witnessedInPerson: boolean;
  photoIsAuthentic: boolean;
  issueCurrentlyActive: boolean;
  locationIsAccurate: boolean;
  agreedCivicTerms: boolean;
  categorySpecificCheck?: boolean;
  categoryCheckDescription?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  authenticityScore?: number; // 0 to 100
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  language?: Language;
  widgetType?: 'location_picker' | 'photo_upload' | 'case_summary' | 'duplicate_warning' | 'categories' | 'scheme_card' | 'certificate_card';
  meta?: {
    caseId?: string;
    extractedCategory?: string;
    extractedLocation?: string;
    photoUrl?: string;
    possibleDuplicateId?: string;
    schemeId?: string;
    certificateId?: string;
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'case_update' | 'sla_warning' | 'officer_assigned' | 'resolved' | 'community_alert' | 'system';
  caseId?: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface HotspotCluster {
  id: string;
  name: string;
  ward: string;
  category: string;
  count: number;
  confirmations: number;
  activeCount: number;
  resolvedCount: number;
  lat: number;
  lng: number;
  severity: 'low' | 'moderate' | 'high';
  description: string;
  recentCases: string[];
}

export interface CommunityInsight {
  id: string;
  title: string;
  description: string;
  type: 'road' | 'water' | 'waste' | 'electricity';
  reportCount: number;
  ward: string;
  status: string;
  actionLabel?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  preferredLanguage: Language;
  homeAddress: string;
  officeAddress?: string;
  ward: string;
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    voiceAssistance: boolean;
    screenReaderOptimized: boolean;
  };
  notificationsEnabled: boolean;
}

export interface MunicipalService {
  id: string;
  name: string;
  department: Department;
  description: string;
  fee: number;
  slaDays: number;
  requiredDocuments: string[];
  icon: string;
  category: 'tax' | 'water' | 'certificate' | 'license' | 'waste' | 'planning' | 'roads' | 'general';
  onlinePortalUrl?: string;
  authorityName?: string;
}

export type SchemeCategory = 
  | 'Housing & Urban Living'
  | 'Financial Assistance & Livelihood'
  | 'Health, Nutrition & Sanitation'
  | 'Energy & Utilities';

export type BeneficiaryGroup = 
  | 'Farmers'
  | 'Students'
  | 'Women'
  | 'Senior Citizens'
  | 'Job Seekers'
  | 'Entrepreneurs'
  | 'Persons with Disabilities'
  | 'General Citizens';

export interface GovernmentScheme {
  id: string;
  name: string;
  marathiName?: string;
  hindiName?: string;
  category: SchemeCategory;
  beneficiaries: BeneficiaryGroup[];
  purpose: string;
  benefits: string;
  eligibility: string[];
  requiredDocuments: string[];
  requiredCertificates: string[];
  applicationProcedure: string;
  officialAuthority: string;
  officialLink: string;
  lastVerifiedDate: string;
  isNagpurSpecific?: boolean;
  subsidyAmount?: string;
}

export interface CitizenCertificate {
  id: string;
  name: string;
  marathiName?: string;
  hindiName?: string;
  purpose: string;
  issuingAuthority: string;
  department: string;
  eligibility: string[];
  requiredDocuments: string[];
  processType: 'Online via Aaple Sarkar' | 'Online & Offline (Setu Seva Kendra)' | 'NMC Ward Office';
  applicationSteps: string[];
  officialSource: string;
  officialLink: string;
  processingTimeDays: number;
  governmentFee: number;
  lastVerifiedDate: string;
  connectedSchemes: string[]; // scheme IDs or names that require this
}

export interface WardAreaStats {
  ward: string;
  zone: string;
  area: string;
  totalProblems: number;
  activeProblems: number;
  resolvedProblems: number;
  confirmations: number;
  topCategory: string;
  categoryBreakdown: { [category: string]: number };
}

