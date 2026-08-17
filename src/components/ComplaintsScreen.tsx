import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  MapPin, 
  Camera, 
  CheckCircle2, 
  Search, 
  Upload, 
  X, 
  RefreshCw, 
  ShieldAlert, 
  ChevronRight, 
  ArrowRight,
  ExternalLink,
  ThumbsUp,
  RotateCcw,
  Clock,
  Sparkles,
  Phone,
  FileCheck,
  UserCheck,
  Navigation,
  Layers,
  Send,
  ShieldCheck,
  Check,
  Maximize2
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { CaseItem, ComplaintCategory, Department, CitizenVerificationChecklist } from '../types';
import { NAGPUR_LOCALITIES, NagpurLocation, findClosestLocality } from './NagpurMapViewer';
import { NagpurMapViewer } from './NagpurMapViewer';
import { GPSCamera } from './GPSCamera';
import { CitizenVerificationChecklistComponent } from './CitizenVerificationChecklist';

interface ComplaintsScreenProps {
  navigate: (route: string) => void;
  initialTrackingId?: string;
}

const COMPLAINT_CATEGORIES: { name: ComplaintCategory; department: Department; icon: string; desc: string }[] = [
  { name: 'Road Problems', department: 'Roads & Traffic', icon: '🚧', desc: 'Potholes, broken tarmac, paver blocks, damaged footpaths' },
  { name: 'Streetlight Problems', department: 'Electrical & Streetlights', icon: '💡', desc: 'Non-functioning LED poles, dark streets, loose wires' },
  { name: 'Waste Management', department: 'Solid Waste Management', icon: '🗑️', desc: 'Uncollected garbage, overflowing community bins, open dumping' },
  { name: 'Drainage Problems', department: 'Drainage & Sewage', icon: '🌊', desc: 'Clogged storm drains, overflowing sewage, missing manholes' },
  { name: 'Water Problems', department: 'Water Works', icon: '🚰', desc: 'Low water pressure, pipeline leaks, dirty water supply' },
  { name: 'Property Tax Problems', department: 'Enforcement & Hoardings', icon: '📑', desc: 'Assessment errors, payment receipt issues, UPIN queries' },
  { name: 'Building Permission Problems', department: 'Town Planning & Birth/Death', icon: '🏗️', desc: 'Sanction delays, unauthorized construction encroachment' },
  { name: 'Trade License Problems', department: 'Enforcement & Hoardings', icon: '🏪', desc: 'Gumasta license renewal, shop registration issues' },
  { name: 'Birth Certificate Problems', department: 'Town Planning & Birth/Death', icon: '📜', desc: 'Delayed registration, spelling correction, duplicate copy' },
  { name: 'Death Certificate Problems', department: 'Town Planning & Birth/Death', icon: '📄', desc: 'Issuance tracking, cremation registry correction' },
  { name: 'Water Connection Problems', department: 'Water Works', icon: '🔧', desc: 'New pipeline application delay, meter replacement' },
  { name: 'Other Municipal Problems', department: 'Public Health & Sanitation', icon: '🏛️', desc: 'Garden trimming, stray animals, noise, public nuisance' },
];

export const ComplaintsScreen: React.FC<ComplaintsScreenProps> = ({
  navigate,
  initialTrackingId
}) => {
  // Tabs: 'report' or 'track'
  const [activeTab, setActiveTab] = useState<'report' | 'track'>(initialTrackingId ? 'track' : 'report');
  
  // Track Mode State
  const [searchTrackingId, setSearchTrackingId] = useState(initialTrackingId || '');
  const [trackedCase, setTrackedCase] = useState<CaseItem | null>(() => {
    if (initialTrackingId) {
      return StorageService.getCaseById(initialTrackingId) || null;
    }
    const myCases = StorageService.getMyCases();
    if (myCases.length > 0) return myCases[0];
    const all = StorageService.getCases();
    return all.length > 0 ? all[0] : null;
  });
  const [trackError, setTrackError] = useState('');
  
  // Resolution Verification State
  const [verificationFeedback, setVerificationFeedback] = useState('');
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);
  const [reopenReasonText, setReopenReasonText] = useState('');
  const [showReopenInput, setShowReopenInput] = useState(false);

  // New Report Form State
  const [step, setStep] = useState<number>(1); // 1: Category, 2: Location, 3: Evidence & Details, 4: Submitted Success
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<NagpurLocation>(NAGPUR_LOCALITIES[0]);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);
  const [spotConfirmedNotice, setSpotConfirmedNotice] = useState(false);
  const [landmarkDetail, setLandmarkDetail] = useState('');
  
  // GPS Camera and Photo Evidence State
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoMetadata, setPhotoMetadata] = useState<{ lat?: number; lng?: number; address?: string; timestamp?: string } | null>(null);
  
  const [problemDescription, setProblemDescription] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newlyCreatedCase, setNewlyCreatedCase] = useState<CaseItem | null>(null);

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
  
  // Nearby Duplicate Detection
  const [nearbyDuplicates, setNearbyDuplicates] = useState<CaseItem[]>([]);
  const [ignoreDuplicate, setIgnoreDuplicate] = useState(false);

  // Real-time GPS Location Handler
  const handleGetLiveLocation = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGpsStatusMessage('Geolocation not supported on this browser.');
      return;
    }

    setIsLocatingGPS(true);
    setGpsStatusMessage('Connecting to GPS satellites...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);
        setIsLocatingGPS(false);

        const closest = findClosestLocality(lat, lng);
        const liveLoc: NagpurLocation = {
          name: `Live Location (${closest.name.split(',')[0]})`,
          landmark: `GPS Fix (±${accuracy}m accuracy)`,
          ward: closest.ward,
          zone: closest.zone,
          lat: Math.round(lat * 10000) / 10000,
          lng: Math.round(lng * 10000) / 10000,
        };

        setSelectedLocation(liveLoc);
        setGpsStatusMessage(`GPS Locked (±${accuracy}m accuracy)`);

        // Reverse geocoding
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data.display_name) {
              const parts = data.display_name.split(',');
              const cleanAddr = parts.slice(0, 3).join(', ').trim();
              setSelectedLocation({
                ...liveLoc,
                name: cleanAddr || liveLoc.name,
              });
            }
          })
          .catch(() => {});
      },
      (err) => {
        setIsLocatingGPS(false);
        setGpsStatusMessage(`Could not get precise GPS: ${err.message}. Selected ${NAGPUR_LOCALITIES[0].name}.`);
        setSelectedLocation(NAGPUR_LOCALITIES[0]);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Filtered localities for autocomplete
  const filteredLocalities = NAGPUR_LOCALITIES.filter((loc) => 
    loc.name.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
    loc.ward.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
    loc.zone.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
    loc.landmark.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );

  // Refresh cases listener
  useEffect(() => {
    const unsub = subscribeToStorage(() => {
      if (trackedCase) {
        const refreshed = StorageService.getCaseById(trackedCase.id);
        if (refreshed) {
          setTrackedCase(refreshed);
        }
      }
    });
    return unsub;
  }, [trackedCase]);

  // Handle Search Track ID
  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTrackingId.trim()) return;
    const found = StorageService.getCaseById(searchTrackingId.trim());
    if (found) {
      setTrackedCase(found);
      setTrackError('');
      setVerificationSubmitted(false);
      setShowReopenInput(false);
    } else {
      setTrackError(`No complaint found with Reference ID "${searchTrackingId}". Please check the ID or report a new problem.`);
    }
  };

  // Check duplicates when category and location change
  useEffect(() => {
    if (selectedCategory && selectedLocation) {
      const dupes = StorageService.findNearbyDuplicates(
        selectedCategory,
        selectedLocation.lat,
        selectedLocation.lng,
        selectedLocation.ward
      );
      setNearbyDuplicates(dupes);
    }
  }, [selectedCategory, selectedLocation]);

  // Handle Resolution Feedback
  const handleResolutionFeedback = (isSolved: boolean) => {
    if (!trackedCase) return;
    if (isSolved) {
      const updated = StorageService.confirmResolution(trackedCase.id, true, verificationFeedback || 'Citizen verified satisfactory resolution on ground.');
      if (updated) {
        setTrackedCase(updated);
        setVerificationSubmitted(true);
      }
    } else {
      setShowReopenInput(true);
    }
  };

  const handleConfirmReopen = () => {
    if (!trackedCase || !reopenReasonText.trim()) return;
    const updated = StorageService.reopenCase(trackedCase.id, reopenReasonText.trim());
    if (updated) {
      setTrackedCase(updated);
      setVerificationSubmitted(true);
      setShowReopenInput(false);
    }
  };

  // Handle Submit New Complaint
  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    // Enforce Citizen Verification Checklist (all 6 items must be checked)
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

    const catObj = COMPLAINT_CATEGORIES.find((c) => c.name === selectedCategory);
    const department = catObj ? catObj.department : 'Roads & Traffic';

    const newId = `NS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullLocation = `${landmarkDetail ? landmarkDetail + ', ' : ''}${selectedLocation.name}`;

    const verifiedAtTimestamp = new Date().toISOString();
    const finalChecklist: CitizenVerificationChecklist = {
      ...verificationChecklist,
      verifiedAt: verifiedAtTimestamp,
      verifiedBy: citizenName.trim() || 'Citizen Reporter',
      authenticityScore: 100
    };

    const newCase: CaseItem = {
      id: newId,
      title: `${selectedCategory}: ${problemDescription.slice(0, 50)}${problemDescription.length > 50 ? '...' : ''}`,
      description: problemDescription || `Citizen reported ${selectedCategory} at ${fullLocation}.`,
      category: selectedCategory,
      department: department,
      location: fullLocation,
      ward: selectedLocation.ward,
      landmark: landmarkDetail || selectedLocation.landmark,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      citizenName: citizenName.trim() || 'Nagpur Resident',
      citizenPhone: citizenPhone.trim() || '+91 98230 00000',
      citizenId: StorageService.getCitizenSessionId(),
      ownerSessionId: StorageService.getCitizenSessionId(),
      status: 'Submitted',
      priority: 'Normal',
      slaStatus: 'On Track',
      slaRemaining: '48 hrs remaining',
      expectedResolutionDays: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confirmationsCount: 1,
      isCitizenVerified: true,
      citizenVerification: finalChecklist,
      attachments: photoUrl ? [
        {
          id: `att-${Date.now()}`,
          name: 'gps_evidence.jpg',
          type: 'image',
          url: photoUrl,
          size: '1.8 MB'
        }
      ] : [],
      timeline: [
        {
          id: `tl-verify`,
          title: 'Citizen Ground-Truth Verification Certified (100%)',
          timestamp: 'Just now',
          description: `Self-certified by citizen: On-site presence verified, authentic unaltered evidence, active defect, accurate NMC ward (${selectedLocation.ward}), and good-faith declaration under NMC Grievance Code.`,
          status: 'completed',
          dotColor: 'green'
        },
        {
          id: `tl-1`,
          title: 'Complaint Submitted & Reference ID Generated',
          timestamp: 'Just now',
          description: `Logged under ${department}. Assigned SLA of 48 hours for preliminary inspection. Geotag verified at ${selectedLocation.lat.toFixed(4)}°N, ${selectedLocation.lng.toFixed(4)}°E.`,
          status: 'completed',
          dotColor: 'green'
        },
        {
          id: `tl-2`,
          title: 'NMC Control Room Verification & Auto-Routing',
          timestamp: 'Pending',
          description: `Forwarding to Zonal Inspection Officer (${selectedLocation.zone}).`,
          status: 'current',
          dotColor: 'orange'
        },
        {
          id: `tl-3`,
          title: 'Field Squad Inspection & Remediation',
          timestamp: 'Scheduled',
          status: 'pending',
          dotColor: 'gray'
        },
        {
          id: `tl-4`,
          title: 'Resolution & Citizen Ground Verification',
          timestamp: 'Pending',
          status: 'pending',
          dotColor: 'gray'
        }
      ]
    };

    StorageService.addCase(newCase);
    setNewlyCreatedCase(newCase);
    setIsSubmitting(false);
    setStep(4);
  };

  return (
    <div className="w-full bg-[#FAFCFF] min-h-[calc(100vh-140px)] py-8 px-4 sm:px-6 lg:px-8" id="complaints-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1E38] tracking-tight">
              Nagpur Public Grievance Redressal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Direct citizen complaint registration with live GPS geotagging and real-time SLA tracking.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto border border-slate-200">
            <button
              onClick={() => {
                setActiveTab('report');
                setStep(1);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'report'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ➕ Report Problem
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'track'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔍 Track Status
            </button>
          </div>
        </div>

        {/* TAB 1: REPORT A PROBLEM (Multi-Step Form) */}
        {activeTab === 'report' && (
          <div className="space-y-6">
            
            {/* Step Progress Indicator */}
            {step < 4 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {[
                  { num: 1, title: 'Category', desc: 'Select Civic Problem' },
                  { num: 2, title: 'Location', desc: 'Live GPS & Map' },
                  { num: 3, title: 'GPS Evidence', desc: 'Real-Time Camera' },
                ].map((s) => (
                  <div
                    key={s.num}
                    className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                      step === s.num
                        ? 'bg-white border-blue-800 shadow-sm ring-2 ring-blue-800/10'
                        : step > s.num
                        ? 'bg-emerald-50/50 border-emerald-300 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          step === s.num
                            ? 'bg-blue-900 text-white'
                            : step > s.num
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {step > s.num ? '✓' : s.num}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate text-slate-900">{s.title}</div>
                        <div className="text-[10px] text-slate-500 hidden sm:block truncate">{s.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 1: CATEGORY SELECTION */}
            {step === 1 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                <div>
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Step 1 of 3</span>
                  <h2 className="text-xl font-bold text-[#0B1E38] mt-0.5">Select Civic Problem Category</h2>
                  <p className="text-xs text-slate-500">Choose the problem you are facing in Nagpur city for auto-routing to the responsible department.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {COMPLAINT_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.name;
                    return (
                      <div
                        key={cat.name}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-700 ring-2 ring-blue-700/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="text-2xl p-2 bg-slate-100 rounded-xl shrink-0">
                          {cat.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                          <p className="text-xs text-slate-500 mt-1 leading-snug">{cat.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    disabled={!selectedCategory}
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>Continue to Location</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: LOCATION & MAP */}
            {step === 2 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                <div>
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Step 2 of 3</span>
                  <h2 className="text-xl font-bold text-[#0B1E38] mt-0.5">Select Exact Nagpur Problem Location</h2>
                  <p className="text-xs text-slate-500">Pick from recognized Nagpur localities, select on map, or use real-time GPS location.</p>
                </div>

                {/* GPS Location & Quick Search Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={handleGetLiveLocation}
                    disabled={isLocatingGPS}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-60 cursor-pointer"
                  >
                    <Navigation className={`w-4 h-4 ${isLocatingGPS ? 'animate-spin' : ''}`} />
                    <span>{isLocatingGPS ? 'Detecting Real-Time GPS...' : 'Use Current Live GPS (Nagpur Fix)'}</span>
                  </button>

                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search Nagpur Ward, Square, Area (e.g., Dharampeth, Manish Nagar, Sitabuldi)..."
                      value={locationSearchQuery}
                      onChange={(e) => setLocationSearchQuery(e.target.value)}
                      className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                {gpsStatusMessage && (
                  <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{gpsStatusMessage}</span>
                  </div>
                )}

                {/* Quick Locality Filter Results if Searching */}
                {locationSearchQuery.trim().length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                      Matching Nagpur Wards & Localities ({filteredLocalities.length}):
                    </div>
                    {filteredLocalities.slice(0, 6).map((loc) => (
                      <button
                        key={loc.name}
                        type="button"
                        onClick={() => {
                          setSelectedLocation(loc);
                          setLocationSearchQuery('');
                        }}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all flex items-center justify-between text-xs cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{loc.name}</div>
                          <div className="text-[11px] text-slate-500">{loc.ward} • {loc.zone}</div>
                        </div>
                        <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 px-2 py-1 rounded-md">
                          Select
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Interactive Nagpur Map */}
                <div className="space-y-3">
                  <NagpurMapViewer
                    selectedLocation={selectedLocation.name}
                    selectedWard={selectedLocation.ward}
                    lat={selectedLocation.lat}
                    lng={selectedLocation.lng}
                    onSelectLocation={(loc) => {
                      setSelectedLocation(loc);
                    }}
                    onConfirmSpot={(loc) => {
                      setSelectedLocation(loc);
                      setSpotConfirmedNotice(true);
                    }}
                    height="h-72"
                    interactive={true}
                  />

                  {/* Selected Locality Details Card */}
                  <div className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all border ${
                    spotConfirmedNotice 
                      ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/30 shadow-xs' 
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                        spotConfirmedNotice 
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs' 
                          : 'bg-red-100 text-red-600 border-red-200'
                      }`}>
                        <MapPin className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                            spotConfirmedNotice ? 'text-emerald-700' : 'text-slate-500'
                          }`}>
                            {spotConfirmedNotice ? '✓ Location Confirmed & Geotagged' : 'Current Selected Location'}
                          </span>
                          {spotConfirmedNotice && (
                            <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                              LOCKED
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedLocation.name}</div>
                        <div className="text-slate-600">{selectedLocation.ward} • {selectedLocation.zone}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div className="text-[11px] font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 font-mono shadow-2xs">
                        {selectedLocation.lat.toFixed(5)}°N, {selectedLocation.lng.toFixed(5)}°E
                      </div>
                      {!spotConfirmedNotice && (
                        <button
                          type="button"
                          onClick={() => setSpotConfirmedNotice(true)}
                          className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          Confirm Spot
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Landmark Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Specific Landmark / House / Shop / Pole Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., In front of Coffee House, Opposite Metro Gate 2, Near Pole #44..."
                    value={landmarkDetail}
                    onChange={(e) => setLandmarkDetail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:ring-2 focus:ring-blue-800 focus:outline-hidden"
                  />
                </div>

                {/* Nearby Duplicate Warning Banner */}
                {nearbyDuplicates.length > 0 && !ignoreDuplicate && (
                  <div className="p-5 bg-amber-50 border border-amber-300 rounded-2xl space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-amber-950">
                          Existing Problem Already Reported Nearby ({nearbyDuplicates.length} matching)
                        </h4>
                        <p className="text-xs text-amber-800 mt-1">
                          A complaint for <strong>"{nearbyDuplicates[0].category}"</strong> is already active near {nearbyDuplicates[0].location} with <strong>{nearbyDuplicates[0].confirmationsCount || 1} citizen confirmations</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200">
                      <button
                        onClick={() => {
                          const res = StorageService.confirmProblemReport(nearbyDuplicates[0].id);
                          setTrackedCase(res.caseItem || nearbyDuplicates[0]);
                          setActiveTab('track');
                        }}
                        className="px-4 py-2 bg-amber-700 text-white text-xs font-bold rounded-xl hover:bg-amber-800 transition-colors flex items-center gap-1.5"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Confirm Existing Problem ({nearbyDuplicates[0].id})</span>
                      </button>

                      <button
                        onClick={() => {
                          setTrackedCase(nearbyDuplicates[0]);
                          setActiveTab('track');
                        }}
                        className="px-3.5 py-2 bg-white border border-amber-300 text-amber-900 text-xs font-semibold rounded-xl hover:bg-amber-100"
                      >
                        View Existing Problem
                      </button>

                      <button
                        onClick={() => setIgnoreDuplicate(true)}
                        className="px-3 py-2 text-xs font-semibold text-amber-800 hover:underline"
                      >
                        Report Separately
                      </button>
                    </div>
                  </div>
                )}

                {/* Back / Next Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    ← Back to Category
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-3 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-950 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>Continue to GPS Camera & Evidence</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PHOTO EVIDENCE & DESCRIPTION */}
            {step === 3 && (
              <form onSubmit={handleSubmitComplaint} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                <div>
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Step 3 of 3</span>
                  <h2 className="text-xl font-bold text-[#0B1E38] mt-0.5">Real-Time GPS Camera & Problem Description</h2>
                  <p className="text-xs text-slate-500">Capture live photo evidence with real-time GPS stamping (coordinates, date/time & NMC geotag).</p>
                </div>

                {/* Real-Time GPS Camera Trigger & Preview */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-blue-800" />
                      <span>GPS Geotagged Photo Evidence</span>
                    </span>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoUrl('');
                          setPhotoMetadata(null);
                        }}
                        className="text-red-600 hover:underline text-[11px] font-semibold cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    )}
                  </label>

                  {photoUrl ? (
                    <div className="bg-slate-900/5 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="relative rounded-xl overflow-hidden border border-slate-300 max-w-md shadow-xs">
                        <img
                          src={photoUrl}
                          alt="GPS Evidence"
                          className="w-full h-auto object-cover max-h-72"
                        />
                        <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>GPS Geotag Verified</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowCameraModal(true)}
                          className="px-3.5 py-1.5 bg-blue-900 text-white text-xs font-bold rounded-xl hover:bg-blue-950 flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Retake with GPS Camera</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Direct Live GPS Camera Launcher */}
                      <div className="border-2 border-dashed border-blue-300 bg-blue-50/40 rounded-2xl p-6 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-blue-900 text-white flex items-center justify-center mx-auto shadow-md">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            Capture Live Photo with Real-Time GPS Camera
                          </h4>
                          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                            Uses your device camera & GPS sensors to burn coordinates, timestamp, and Nagpur ward details directly onto the evidence image.
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowCameraModal(true)}
                            className="w-full sm:w-auto px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98 cursor-pointer"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Open Live GPS Camera</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* GPS Camera Modal / Overlay */}
                {showCameraModal && (
                  <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-xl bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
                      <GPSCamera
                        initialLocation={selectedLocation}
                        onPhotoCaptured={(dataUrl, meta) => {
                          setPhotoUrl(dataUrl);
                          setPhotoMetadata(meta);
                          setShowCameraModal(false);
                        }}
                        onCancel={() => setShowCameraModal(false)}
                      />
                    </div>
                  </div>
                )}

                {/* Problem Short Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Short Description (Type in Marathi, Hindi, or English)</span>
                    <span className="text-[10px] text-blue-900 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-700" />
                      <span>AI Multilingual Support Active</span>
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe the issue (e.g., 'Road pe bada khadda hai, do din se water logging ho rahi hai' OR 'रस्त्यावर मोठा खड्डा आहे, गाड्या घसरतात')..."
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:ring-2 focus:ring-blue-800 focus:outline-hidden"
                  />
                </div>

                {/* Optional Contact Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Citizen Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Deshmukh"
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-800 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Mobile Number for SMS Tracking (Optional)</label>
                    <input
                      type="tel"
                      placeholder="e.g. 98230 45678"
                      value={citizenPhone}
                      onChange={(e) => setCitizenPhone(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* CITIZEN SELF-VERIFICATION CHECKLIST (Mandatory to check truthfulness) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <CitizenVerificationChecklistComponent
                    checklist={verificationChecklist}
                    onChange={(updated) => {
                      setVerificationChecklist(updated);
                      if (checklistErrorPrompt) setChecklistErrorPrompt(false);
                    }}
                    category={selectedCategory || 'General'}
                    language="en"
                  />

                  {checklistErrorPrompt && (
                    <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Please complete all 6 checklist items above to confirm your complaint is genuine and proceed.</span>
                    </div>
                  )}
                </div>

                {/* Submit & Back Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    ← Back to Location
                  </button>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="submit"
                      disabled={isSubmitting || !problemDescription.trim()}
                      className={`w-full sm:w-auto px-6 py-3 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                        (verificationChecklist.authenticityScore === 100)
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20'
                          : 'bg-[#0B1E38] hover:bg-[#152e52] text-white opacity-90'
                      }`}
                      id="btn-submit-verified-complaint"
                    >
                      {verificationChecklist.authenticityScore === 100 ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-300" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>
                        {isSubmitting 
                          ? 'Submitting Verified Report...' 
                          : verificationChecklist.authenticityScore === 100
                          ? 'Submit 100% Verified Complaint & Generate ID'
                          : 'Complete Checklist to Submit Complaint'}
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 4: SUBMITTED SUCCESS & TRACKING CARD */}
            {step === 4 && newlyCreatedCase && (
              <div className="bg-white border-2 border-emerald-400 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md text-center max-w-xl mx-auto">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Complaint Successfully Registered
                  </span>
                  <h2 className="text-2xl font-black text-[#0B1E38]">
                    {newlyCreatedCase.id}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Save this Reference ID to track status updates anytime without logging in.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl text-left text-xs space-y-2 border border-slate-200">
                  <div><strong>Problem:</strong> {newlyCreatedCase.category}</div>
                  <div><strong>Department:</strong> {newlyCreatedCase.department}</div>
                  <div><strong>Location:</strong> {newlyCreatedCase.location}</div>
                  <div><strong>Ward:</strong> {newlyCreatedCase.ward}</div>
                  <div><strong>Expected Resolution:</strong> Within {newlyCreatedCase.expectedResolutionDays} days (SLA: 48 hrs)</div>
                  
                  {newlyCreatedCase.isCitizenVerified && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Citizen Ground-Truth Certified (100% Authentic)</span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                        VERIFIED
                      </span>
                    </div>
                  )}

                  {newlyCreatedCase.attachments.length > 0 && (
                    <div className="pt-2">
                      <span className="font-bold text-slate-700 block mb-1">Attached GPS Evidence:</span>
                      <img
                        src={newlyCreatedCase.attachments[0].url}
                        alt="Evidence"
                        className="w-full max-h-40 object-cover rounded-xl border border-slate-200"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setTrackedCase(newlyCreatedCase);
                      setActiveTab('track');
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-900 text-white text-xs font-bold rounded-xl hover:bg-blue-950 transition-colors shadow-xs cursor-pointer"
                  >
                    Track This Complaint Now
                  </button>

                  <button
                    onClick={() => {
                      setStep(1);
                      setSelectedCategory(null);
                      setPhotoUrl('');
                      setPhotoMetadata(null);
                      setProblemDescription('');
                      setNewlyCreatedCase(null);
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Report Another Issue
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: TRACK STATUS & COMMUNITY VERIFICATION */}
        {activeTab === 'track' && (
          <div className="space-y-6">
            
            {/* Search Bar for Reference ID */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <form onSubmit={handleTrackSearch} className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter Complaint Reference ID (e.g. NS-2026-1001)..."
                    value={searchTrackingId}
                    onChange={(e) => setSearchTrackingId(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-800 focus:outline-hidden uppercase"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-950 transition-colors shadow-xs shrink-0 cursor-pointer"
                >
                  Track Complaint
                </button>
              </form>

              {trackError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{trackError}</span>
                </div>
              )}
            </div>

            {/* Tracked Case Details */}
            {trackedCase ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xs">
                
                {/* Header Info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        {trackedCase.category}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        trackedCase.status === 'Resolved' || trackedCase.status === 'Closed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : trackedCase.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        Status: {trackedCase.status}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#0B1E38] mt-2">
                      {trackedCase.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Reference ID: <span className="font-bold text-slate-800 font-mono">{trackedCase.id}</span> • Logged on {new Date(trackedCase.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-1.5">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Department Assigned
                    </div>
                    <div className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl">
                      {trackedCase.department}
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-800">
                      SLA: {trackedCase.slaRemaining || 'Within 48 hours'}
                    </div>
                  </div>
                </div>

                {/* Citizen Ground-Truth Verification Certificate Badge */}
                {trackedCase.isCitizenVerified && (
                  <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-2xs">
                        <ShieldCheck className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-emerald-950 flex items-center gap-2">
                          <span>Citizen Ground-Truth Verified (100% Authentic Report)</span>
                          <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                            CONFIRMED
                          </span>
                        </div>
                        <p className="text-emerald-800 text-[11px] mt-0.5">
                          Verified by citizen on-site: physical presence affirmed, genuine unaltered photo, ongoing defect, accurate Nagpur ward, and good-faith declaration.
                        </p>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 self-start sm:self-auto shrink-0 shadow-2xs">
                      SELF-CERTIFIED
                    </div>
                  </div>
                )}

                {/* Location & GPS Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-red-600" />
                      <span>Nagpur Location & Ward</span>
                    </div>
                    <div className="text-slate-800 font-semibold">{trackedCase.location}</div>
                    <div className="text-slate-500">Ward: {trackedCase.ward}</div>
                    {trackedCase.lat && trackedCase.lng && (
                      <div className="text-[11px] font-mono text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 inline-block mt-1">
                        GPS: {trackedCase.lat.toFixed(4)}°N, {trackedCase.lng.toFixed(4)}°E
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-700" />
                      <span>Community Impact & Confirmations</span>
                    </div>
                    <div className="text-slate-700">
                      <strong>{trackedCase.confirmationsCount || 1} citizens</strong> have confirmed this problem in this ward.
                    </div>
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          const res = StorageService.confirmProblemReport(trackedCase.id);
                          setTrackedCase(res.caseItem || trackedCase);
                        }}
                        className="px-3.5 py-1.5 bg-white border border-slate-300 hover:border-blue-400 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-blue-700" />
                        <span>Confirm You Also Face This Issue (+1)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Attached Geotagged Photo Evidence */}
                {trackedCase.attachments && trackedCase.attachments.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Attached GPS Photo Evidence
                    </h3>
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-w-md shadow-xs">
                      <img
                        src={trackedCase.attachments[0].url}
                        alt="Evidence"
                        className="w-full h-auto object-cover max-h-72"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/75 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>NMC GPS Geotagged Evidence</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit Timeline */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Redressal Progress Timeline
                  </h3>
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {trackedCase.timeline.map((step) => (
                      <div key={step.id} className="relative group">
                        <div
                          className={`absolute -left-6 top-0.5 w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center ${
                            step.status === 'completed'
                              ? 'bg-emerald-600'
                              : step.status === 'current'
                              ? 'bg-amber-500 animate-pulse'
                              : 'bg-slate-300'
                          }`}
                        >
                          {step.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{step.title}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{step.timestamp}</span>
                          </div>
                          {step.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Citizen Resolution Verification Section */}
                {(trackedCase.status === 'Resolved' || trackedCase.status === 'Closed') && !verificationSubmitted && (
                  <div className="p-6 bg-emerald-50/80 border border-emerald-300 rounded-3xl space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-emerald-950">
                          NMC Marked This Complaint as "Resolved". Please Verify on Ground.
                        </h4>
                        <p className="text-xs text-emerald-800 mt-1">
                          As part of NagpurSetu citizen accountability, please confirm if the issue is actually resolved at the location.
                        </p>
                      </div>
                    </div>

                    {!showReopenInput ? (
                      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-emerald-200">
                        <button
                          onClick={() => handleResolutionFeedback(true)}
                          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Yes, Issue is Resolved & Cleared</span>
                        </button>

                        <button
                          onClick={() => handleResolutionFeedback(false)}
                          className="px-5 py-2.5 bg-white border border-red-300 hover:bg-red-50 text-red-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>No, Problem Still Persists (Reopen Case)</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-2 border-t border-emerald-200">
                        <label className="text-xs font-bold text-slate-800 block">
                          Reason why problem is not solved (e.g., Pothole still unfilled, garbage only half cleared):
                        </label>
                        <textarea
                          rows={2}
                          value={reopenReasonText}
                          onChange={(e) => setReopenReasonText(e.target.value)}
                          placeholder="State what is remaining on ground..."
                          className="w-full px-3.5 py-2 bg-white border border-red-300 rounded-xl text-xs focus:ring-2 focus:ring-red-600 focus:outline-hidden"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleConfirmReopen}
                            disabled={!reopenReasonText.trim()}
                            className="px-4 py-2 bg-red-700 text-white text-xs font-bold rounded-xl hover:bg-red-800 disabled:opacity-50 cursor-pointer"
                          >
                            Reopen Complaint with Escalation
                          </button>
                          <button
                            onClick={() => setShowReopenInput(false)}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {verificationSubmitted && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs font-semibold text-blue-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>Thank you! Your citizen feedback has been recorded in the NMC audit log.</span>
                  </div>
                )}

              </div>
            ) : (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No Complaint Selected</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Enter your Reference ID above or submit a new grievance to track real-time resolution status.
                </p>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
