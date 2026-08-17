import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  MapPin, 
  CheckCircle, 
  Clock, 
  User, 
  Phone, 
  ChevronRight, 
  ArrowLeft, 
  Sparkles, 
  FileText,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  Check
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { CaseItem, Department, CitizenVerificationChecklist } from '../types';
import { CitizenVerificationChecklistComponent } from './CitizenVerificationChecklist';

interface ReviewScreenProps {
  draftReport: {
    problemSummary: string;
    rawInput: string;
    category: string;
    department: Department;
    location: string;
    ward: string;
    photoUrl?: string;
  } | null;
  navigate: (route: string) => void;
  onViewCaseDetails: (caseItem: CaseItem) => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  draftReport,
  navigate,
  onViewCaseDetails,
}) => {
  const [activeTab, setActiveTab] = useState<'Active' | 'Resolved' | 'All'>('Active');
  const [casesList, setCasesList] = useState<CaseItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCaseId, setSubmittedCaseId] = useState<string | null>(null);

  // Citizen Self-Verification Checklist State
  const [verificationChecklist, setVerificationChecklist] = useState<CitizenVerificationChecklist>({
    witnessedInPerson: false,
    photoIsAuthentic: false,
    issueCurrentlyActive: false,
    locationIsAccurate: false,
    agreedCivicTerms: false,
    categorySpecificCheck: false,
    authenticityScore: 0,
  });
  const [checklistErrorPrompt, setChecklistErrorPrompt] = useState(false);

  useEffect(() => {
    setCasesList(StorageService.getMyCases());
    const unsub = subscribeToStorage(() => {
      setCasesList(StorageService.getMyCases());
    });
    return () => unsub();
  }, []);

  const handleReportProblem = () => {
    // Check whether citizen completed all 6 verification checks
    const isFullyVerified = 
      verificationChecklist.witnessedInPerson &&
      verificationChecklist.photoIsAuthentic &&
      verificationChecklist.issueCurrentlyActive &&
      verificationChecklist.locationIsAccurate &&
      verificationChecklist.agreedCivicTerms &&
      verificationChecklist.categorySpecificCheck;

    if (!isFullyVerified) {
      setChecklistErrorPrompt(true);
      return;
    }

    setIsSubmitting(true);
    setChecklistErrorPrompt(false);

    const newId = `REQ-2026-${Math.floor(100 + Math.random() * 900)}`;
    const summary = draftReport?.problemSummary || 'Uncollected Garbage';
    const loc = draftReport?.location || '42 Dharampeth Extension, Nagpur';
    const ward = draftReport?.ward || 'Dharampeth (Ward 4)';
    const dept = draftReport?.department || 'Solid Waste Management';
    const cat = draftReport?.category || 'Solid Waste Management';
    const photo = draftReport?.photoUrl || 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80';
    const sessionId = StorageService.getCitizenSessionId();

    const finalChecklist: CitizenVerificationChecklist = {
      ...verificationChecklist,
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'Citizen Reporter',
      authenticityScore: 100
    };

    const newCase: CaseItem = {
      id: newId,
      title: summary,
      description: draftReport?.rawInput || 'Garbage has not been collected near our residential building for the last two days. Container overflowing.',
      category: cat,
      department: dept,
      location: loc,
      ward: ward,
      citizenName: 'Mohit Meshram',
      citizenPhone: '+91 98230 45129',
      citizenId: sessionId,
      ownerSessionId: sessionId,
      status: 'In Progress',
      priority: 'Elevated',
      slaStatus: 'On Track',
      slaRemaining: 'Expected in 2 days',
      expectedResolutionDays: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedOfficer: 'Ramesh Kumar (Sanitation Dept)',
      assignedOfficerPhone: '+91 94221 88902',
      isCitizenVerified: true,
      citizenVerification: finalChecklist,
      attachments: [
        {
          id: `att-${Date.now()}`,
          name: 'evidence.jpg',
          url: photo,
          type: 'image',
          size: '1.4 MB'
        }
      ],
      timeline: [
        {
          id: `tl-0`,
          title: 'Citizen Ground Verification (100% Certified)',
          timestamp: 'Today, 09:40 AM',
          description: 'Citizen completed 6-point truthfulness checklist confirming on-ground defect, authentic photo, and active status.',
          status: 'completed',
          dotColor: 'green'
        },
        {
          id: `tl-1`,
          title: 'Complaint received & registered',
          timestamp: 'Today, 09:41 AM',
          description: 'Auto-registered via citizen conversation with AI routing.',
          status: 'completed',
          dotColor: 'dark'
        },
        {
          id: `tl-2`,
          title: 'Sent to field team',
          timestamp: 'Today, 09:45 AM',
          description: `Routed to ${dept} Zone 4.`,
          status: 'completed',
          dotColor: 'dark'
        },
        {
          id: `tl-3`,
          title: 'Officer assigned',
          timestamp: 'Today, 10:15 AM',
          description: 'NMC Tipper Truck #MH-31-CB-9021 scheduled on morning sweep.',
          status: 'current',
          dotColor: 'orange'
        },
        {
          id: `tl-4`,
          title: 'Resolution & Citizen Sign-off',
          timestamp: 'Pending completion',
          description: 'Citizen confirmation requested upon clearance.',
          status: 'pending',
          dotColor: 'gray'
        }
      ],
      rawUserInput: draftReport?.rawInput
    };

    StorageService.addCase(newCase);
    setCasesList(StorageService.getCases());
    setSubmittedCaseId(newId);
    setIsSubmitting(false);
  };

  const filteredCases = casesList.filter((c) => {
    if (activeTab === 'Active') return c.status !== 'Resolved' && c.status !== 'Closed';
    if (activeTab === 'Resolved') return c.status === 'Resolved' || c.status === 'Closed';
    return true;
  });

  return (
    <div className="w-full bg-[#FAFCFF] min-h-[calc(100vh-140px)] py-8 px-4 sm:px-6 lg:px-8" id="review-screen-container">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* TOP BOX: Review Your Report (Matching Screen 4) */}
        {!submittedCaseId ? (
          <div className="bg-[#EEF3F8] border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
            <h2 className="text-xl font-extrabold text-[#0B1E38]">
              Review Your Report
            </h2>

            {/* AI Summary Header with Bot Icon */}
            <div className="bg-[#D3E3FD]/50 border border-blue-200/80 rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0B1E38] text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed">
                I understood your problem as:{' '}
                <span className="font-bold text-[#0B1E38]">
                  {draftReport?.problemSummary || 'Garbage has not been collected near your house.'}
                </span>
              </div>
            </div>

            {/* 2-Column Grid: Photo Evidence & Location Identified */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Photo Evidence */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  PHOTO EVIDENCE
                </div>
                <div className="h-44 rounded-xl overflow-hidden border border-slate-200 bg-white relative">
                  <img
                    src={
                      draftReport?.photoUrl ||
                      'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80'
                    }
                    alt="Photo Evidence"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-sm">
                    Attached via citizen camera
                  </div>
                </div>
              </div>

              {/* Location Identified */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  LOCATION IDENTIFIED
                </div>
                <div className="h-44 rounded-xl overflow-hidden border border-slate-200 bg-white relative flex flex-col justify-between p-3">
                  {/* Interactive Map Visual */}
                  <div className="absolute inset-0 bg-[#0F172A]">
                    <svg className="w-full h-full object-cover opacity-80" viewBox="0 0 300 150">
                      <rect width="300" height="150" fill="#0F172A" />
                      <ellipse cx="70" cy="90" rx="30" ry="18" fill="#0369A1" opacity="0.4" />
                      <path d="M 0,60 Q 150,80 300,50" stroke="#475569" strokeWidth="8" fill="none" />
                      <path d="M 0,60 Q 150,80 300,50" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="5 3" fill="none" />
                      <path d="M 140,0 L 145,150" stroke="#F59E0B" strokeWidth="5" fill="none" />
                      <circle cx="145" cy="70" r="14" fill="#EF4444" opacity="0.3" className="animate-ping" />
                      <circle cx="145" cy="70" r="6" fill="#EF4444" stroke="#FFF" strokeWidth="2" />
                    </svg>
                  </div>

                  <div className="relative z-10 flex justify-end">
                    <span className="bg-slate-900/90 text-white border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
                      {draftReport?.ward || 'Dharampeth (Ward 4)'}
                    </span>
                  </div>

                  <div className="relative z-10 bg-slate-900/90 border border-slate-700 backdrop-blur-xs rounded-lg p-2 flex items-center gap-2 shadow-xs">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-xs font-semibold text-white truncate">
                      {draftReport?.location || '42 Dharampeth Extension, Nagpur'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CITIZEN SELF-VERIFICATION CHECKLIST (Determining True / False status) */}
            <div className="pt-2">
              <CitizenVerificationChecklistComponent
                checklist={verificationChecklist}
                onChange={(updated) => {
                  setVerificationChecklist(updated);
                  if (checklistErrorPrompt) setChecklistErrorPrompt(false);
                }}
                category={draftReport?.category || 'Solid Waste Management'}
                language="en"
              />

              {checklistErrorPrompt && (
                <div className="mt-3 p-3 bg-red-50 border border-red-300 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Please complete all 6 self-verification items above to certify this report is genuine.</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleReportProblem}
                disabled={isSubmitting}
                className={`px-6 py-3 text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2 ${
                  verificationChecklist.authenticityScore === 100
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-[#0B1E38] hover:bg-[#152e52]'
                }`}
                id="review-report-problem-button"
              >
                {isSubmitting ? (
                  'Registering with NMC...'
                ) : verificationChecklist.authenticityScore === 100 ? (
                  'Submit Certified Report to NMC'
                ) : (
                  'Complete Checklist & Report Problem'
                )}
              </button>

              <button
                onClick={() => navigate('/talk')}
                className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-md border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                id="review-change-details-button"
              >
                Change Details
              </button>
            </div>
          </div>
        ) : (
          /* Submission Confirmation Banner */
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-emerald-800">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="text-base font-bold">
                  Complaint Successfully Registered (#{submittedCaseId})
                </h3>
                <p className="text-xs text-emerald-700">
                  Your case has been dispatched to the local zonal supervisor. You can track real-time progress below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM SECTION: Case Tracking (Matching Screen 4) */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-extrabold text-[#0B1E38]">
              Case Tracking
            </h2>

            {/* Filter Tabs (Active, Resolved, All) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              {(['Active', 'Resolved', 'All'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-white text-[#0B1E38] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  id={`tracking-tab-${tab.toLowerCase()}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Cases List */}
          <div className="space-y-6">
            {filteredCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs hover:border-slate-300 transition-all"
                id={`case-card-${caseItem.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">
                      {caseItem.title}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                        caseItem.status === 'In Progress'
                          ? 'bg-[#FEF3C7] text-[#9A3412]'
                          : caseItem.status === 'Resolved' || caseItem.status === 'Closed'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-blue-50 text-blue-800'
                      }`}
                    >
                      {caseItem.status}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-500">
                    SLA: {caseItem.slaRemaining || 'Expected in 2 days'}
                  </div>
                </div>

                {/* Location Row */}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{caseItem.location}</span>
                </div>

                {/* Timeline Stepper matching Screen 4 */}
                <div className="pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                    {caseItem.timeline.slice(0, 4).map((step, idx) => {
                      const isComplete = step.status === 'completed';
                      const isCurrent = step.status === 'current';
                      const isPending = step.status === 'pending';

                      return (
                        <div key={step.id || idx} className="space-y-1 relative">
                          <div className="flex items-center gap-2">
                            {/* Dot */}
                            <div
                              className={`w-3 h-3 rounded-full shrink-0 ${
                                isComplete
                                  ? 'bg-[#0B1E38]'
                                  : isCurrent
                                  ? 'bg-[#F97316] ring-4 ring-orange-100'
                                  : 'bg-slate-300'
                              }`}
                            />
                            <span
                              className={`text-xs font-bold ${
                                isComplete || isCurrent ? 'text-slate-900' : 'text-slate-400'
                              }`}
                            >
                              {step.title}
                            </span>
                          </div>

                          <div className="pl-5 space-y-0.5">
                            {step.actor && (
                              <div className="text-xs font-semibold text-slate-800">
                                {step.actor}
                              </div>
                            )}
                            <div className="text-[11px] text-slate-500">
                              {step.timestamp}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom View Details Link */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    ID: #{caseItem.id}
                  </span>
                  <button
                    onClick={() => onViewCaseDetails(caseItem)}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#0B1E38] hover:text-blue-800 transition-colors cursor-pointer"
                    id={`view-details-${caseItem.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  >
                    <span>View Full Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {filteredCases.length === 0 && (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-300" />
                <div className="text-sm font-semibold">No cases found in this view.</div>
                <button
                  onClick={() => navigate('/talk')}
                  className="text-xs text-blue-700 font-bold hover:underline"
                >
                  Start a new conversation to report an issue
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
