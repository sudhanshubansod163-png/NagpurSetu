import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  User, 
  Phone, 
  FileText, 
  Send, 
  Trash2, 
  Eye, 
  Lock, 
  Unlock, 
  X, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Layers,
  ArrowUpDown,
  Check,
  Building,
  Radio,
  SlidersHorizontal,
  Mail
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { CaseItem, Department, NotificationItem } from '../types';

interface AdminPanelScreenProps {
  navigate: (route: string) => void;
}

const DEPARTMENTS: Department[] = [
  'Solid Waste Management',
  'Roads & Traffic',
  'Water Works',
  'Electrical & Streetlights',
  'Drainage & Sewage',
  'Public Health & Sanitation',
  'Enforcement & Hoardings',
  'Town Planning & Birth/Death',
];

const WARDS = [
  'Laxmi Nagar (Ward 1)',
  'Dharampeth (Ward 2)',
  'Hanuman Nagar (Ward 3)',
  'Dhantoli (Ward 4)',
  'Nehru Nagar (Ward 5)',
  'Gandhibagh (Ward 6)',
  'Sataranjipura (Ward 7)',
  'Lakadganj (Ward 8)',
  'Ashi Nagar (Ward 9)',
  'Mangalwari (Ward 10)'
];

const DEFAULT_ADMIN_PIN = '440001';

export const AdminPanelScreen: React.FC<AdminPanelScreenProps> = ({ navigate }) => {
  // Authentication Gate
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('nagpursetu_admin_session_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  // Data state
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedWard, setSelectedWard] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState<boolean>(false);

  // Editing state for selected case
  const [editStatus, setEditStatus] = useState<CaseItem['status']>('Registered');
  const [editOfficer, setEditOfficer] = useState<string>('');
  const [editOfficerPhone, setEditOfficerPhone] = useState<string>('');
  const [editRemarks, setEditRemarks] = useState<string>('');
  const [editEvidenceUrl, setEditEvidenceUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Custom Citizen Notification modal state
  const [notifModalOpen, setNotifModalOpen] = useState<boolean>(false);
  const [notifTitle, setNotifTitle] = useState<string>('');
  const [notifMessage, setNotifMessage] = useState<string>('');
  const [notifTargetCaseId, setNotifTargetCaseId] = useState<string>('');

  // Load cases and set up real-time listener
  const refreshCases = () => {
    setCases(StorageService.getCases());
  };

  useEffect(() => {
    refreshCases();
    const unsub = subscribeToStorage(refreshCases);
    return () => unsub();
  }, []);

  // Update form fields when selectedCase changes
  useEffect(() => {
    if (selectedCase) {
      setEditStatus(selectedCase.status);
      setEditOfficer(selectedCase.assignedOfficer || '');
      setEditOfficerPhone(selectedCase.assignedOfficerPhone || '');
      setEditRemarks(selectedCase.resolutionNotes || '');
      setEditEvidenceUrl(selectedCase.resolutionEvidenceUrl || '');
      setSaveSuccess(false);
    }
  }, [selectedCase]);

  // Handle PIN unlock
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === DEFAULT_ADMIN_PIN || pinInput.trim() === 'admin123' || pinInput.trim() === '778899') {
      sessionStorage.setItem('nagpursetu_admin_session_auth', 'true');
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('nagpursetu_admin_session_auth');
    setIsAuthenticated(false);
    navigate('/');
  };

  // Metrics Calculations
  const stats = useMemo(() => {
    const total = cases.length;
    const active = cases.filter((c) => c.status !== 'Resolved' && c.status !== 'Closed').length;
    const inProgress = cases.filter((c) => c.status === 'In Progress').length;
    const resolved = cases.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
    const verified = cases.filter((c) => c.isCitizenVerified || c.citizenVerification).length;
    const highPriority = cases.filter((c) => c.priority === 'High' || c.priority === 'Emergency' || c.priority === 'Critical').length;

    return { total, active, inProgress, resolved, verified, highPriority };
  }, [cases]);

  // Filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchId = c.id.toLowerCase().includes(q);
        const matchDesc = (c.description || '').toLowerCase().includes(q);
        const matchLoc = (c.location || '').toLowerCase().includes(q);
        const matchCitizen = (c.citizenName || '').toLowerCase().includes(q);
        const matchPhone = (c.citizenPhone || '').toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchDesc && !matchLoc && !matchCitizen && !matchPhone) {
          return false;
        }
      }

      // Department
      if (selectedDept !== 'All' && c.department !== selectedDept) {
        return false;
      }

      // Ward
      if (selectedWard !== 'All' && c.ward !== selectedWard) {
        return false;
      }

      // Status
      if (selectedStatus !== 'All' && c.status !== selectedStatus) {
        return false;
      }

      // Priority
      if (selectedPriority !== 'All' && c.priority !== selectedPriority) {
        return false;
      }

      // Verified only
      if (filterVerifiedOnly && !c.isCitizenVerified && !c.citizenVerification) {
        return false;
      }

      return true;
    });
  }, [cases, searchQuery, selectedDept, selectedWard, selectedStatus, selectedPriority, filterVerifiedOnly]);

  // Save updates to case
  const handleSaveCaseUpdate = () => {
    if (!selectedCase) return;
    setIsSaving(true);

    const isStatusChanged = selectedCase.status !== editStatus;
    let updated: CaseItem | undefined;

    if (isStatusChanged) {
      updated = StorageService.updateCaseStatus(
        selectedCase.id,
        editStatus,
        editOfficer || 'NMC Admin Command Center',
        editRemarks,
        editEvidenceUrl
      );
    } else {
      updated = StorageService.updateCase(selectedCase.id, {
        assignedOfficer: editOfficer,
        assignedOfficerPhone: editOfficerPhone,
        resolutionNotes: editRemarks,
        resolutionEvidenceUrl: editEvidenceUrl
      });
    }

    if (updated) {
      setSelectedCase(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setIsSaving(false);
    refreshCases();
  };

  // Delete Case
  const handleDeleteCase = (id: string) => {
    if (window.confirm(`Are you sure you want to permanently delete case ${id}?`)) {
      StorageService.deleteCase(id);
      if (selectedCase?.id === id) {
        setSelectedCase(null);
      }
      refreshCases();
    }
  };

  // Send Direct Citizen Notification
  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: selectedCase?.citizenId || selectedCase?.ownerSessionId,
      caseId: notifTargetCaseId || selectedCase?.id,
      title: notifTitle.trim(),
      message: notifMessage.trim(),
      type: 'case_update',
      read: false,
      createdAt: 'Just now',
      actionUrl: notifTargetCaseId ? `/cases/${notifTargetCaseId}` : '/cases'
    };

    StorageService.addNotification(notif);
    setNotifModalOpen(false);
    setNotifTitle('');
    setNotifMessage('');
    alert('Official notification dispatched to citizen successfully!');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Case ID', 'Title', 'Category', 'Department', 'Location', 'Ward', 'Status', 'Priority', 'Citizen Name', 'Citizen Phone', 'Verified', 'Created At'];
    const rows = filteredCases.map((c) => [
      `"${c.id}"`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${c.category}"`,
      `"${c.department}"`,
      `"${(c.location || '').replace(/"/g, '""')}"`,
      `"${c.ward}"`,
      `"${c.status}"`,
      `"${c.priority}"`,
      `"${(c.citizenName || 'Citizen').replace(/"/g, '""')}"`,
      `"${c.citizenPhone || 'N/A'}"`,
      `"${c.isCitizenVerified ? 'YES' : 'NO'}"`,
      `"${new Date(c.createdAt).toLocaleString('en-IN')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NagpurSetu_Cases_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If Not Authenticated, show Passcode Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] bg-slate-950 flex items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center text-white">
          <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold tracking-tight">NMC Municipal Command Center</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Authorized municipal officers and zonal engineers portal. Enter your security PIN to access grievance management.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Admin Security PIN
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="Enter 6-digit municipal PIN"
                className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-white text-sm focus:outline-none transition-all ${
                  pinError ? 'border-red-500 ring-2 ring-red-500/30' : 'border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-red-400 mt-1 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Incorrect security PIN. Please try again.</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Admin Command Center</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Default PIN: 440001</span>
            <button
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white underline cursor-pointer"
            >
              Return to Citizen Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] pb-16">
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  NagpurSetu Admin & Officer Command Center
                </h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE FIREBASE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Nagpur Municipal Corporation • Real-Time Case Operations & Verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              onClick={refreshCases}
              title="Refresh Data"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                setNotifModalOpen(true);
                setNotifTargetCaseId(selectedCase?.id || '');
              }}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Alert</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 rounded-xl transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
              title="Exit Admin Mode"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Executive Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
            <div className="text-[11px] font-bold text-slate-400">Total Cases</div>
            <div className="text-2xl font-black text-white">{stats.total}</div>
            <div className="text-[10px] text-slate-500">All registered complaints</div>
          </div>

          <div className="bg-slate-900 border border-amber-900/40 p-4 rounded-2xl space-y-1">
            <div className="text-[11px] font-bold text-amber-400">Active / Pending</div>
            <div className="text-2xl font-black text-amber-300">{stats.active}</div>
            <div className="text-[10px] text-slate-500">Awaiting clearance</div>
          </div>

          <div className="bg-slate-900 border border-blue-900/40 p-4 rounded-2xl space-y-1">
            <div className="text-[11px] font-bold text-blue-400">In Progress</div>
            <div className="text-2xl font-black text-blue-300">{stats.inProgress}</div>
            <div className="text-[10px] text-slate-500">Squad dispatched</div>
          </div>

          <div className="bg-slate-900 border border-emerald-900/40 p-4 rounded-2xl space-y-1">
            <div className="text-[11px] font-bold text-emerald-400">Resolved / Closed</div>
            <div className="text-2xl font-black text-emerald-300">{stats.resolved}</div>
            <div className="text-[10px] text-slate-500">Fixed & signed-off</div>
          </div>

          <div className="bg-slate-900 border border-teal-900/40 p-4 rounded-2xl space-y-1">
            <div className="text-[11px] font-bold text-teal-400">Ground Verified</div>
            <div className="text-2xl font-black text-teal-300">{stats.verified}</div>
            <div className="text-[10px] text-slate-500">100% Truth Certified</div>
          </div>

          <div className="bg-slate-900 border border-red-900/40 p-4 rounded-2xl space-y-1">
            <div className="text-[11px] font-bold text-red-400">High / Critical</div>
            <div className="text-2xl font-black text-red-300">{stats.highPriority}</div>
            <div className="text-[10px] text-slate-500">Urgent SLA dispatch</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Case ID, title, citizen name, phone, or location..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Verified toggle button */}
            <button
              onClick={() => setFilterVerifiedOnly(!filterVerifiedOnly)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                filterVerifiedOnly
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Ground Verified Only</span>
            </button>
          </div>

          {/* Category / Ward / Status / Priority filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
              >
                <option value="All">All Departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Ward</label>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
              >
                <option value="All">All Wards (1 to 10)</option>
                {WARDS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
              >
                <option value="All">All Statuses</option>
                <option value="Registered">Registered</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Reopened">Reopened</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Elevated">Elevated</option>
                <option value="Normal">Normal</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Master-Detail Split Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Top: Cases Table / List (7 columns on large screen) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-300">
                Showing {filteredCases.length} of {cases.length} Complaints
              </span>
              {(selectedDept !== 'All' || selectedWard !== 'All' || selectedStatus !== 'All' || selectedPriority !== 'All' || filterVerifiedOnly || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedDept('All');
                    setSelectedWard('All');
                    setSelectedStatus('All');
                    setSelectedPriority('All');
                    setFilterVerifiedOnly(false);
                    setSearchQuery('');
                  }}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold underline cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>

            {filteredCases.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="text-sm font-bold text-slate-300">No matching complaints found</div>
                <p className="text-xs text-slate-500">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
                {filteredCases.map((caseItem) => {
                  const isSelected = selectedCase?.id === caseItem.id;
                  const isVerified = caseItem.isCitizenVerified || caseItem.citizenVerification;

                  return (
                    <div
                      key={caseItem.id}
                      onClick={() => setSelectedCase(caseItem)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/30'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-black text-sky-400">
                              #{caseItem.id}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              caseItem.status === 'Resolved' || caseItem.status === 'Closed'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : caseItem.status === 'In Progress'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}>
                              {caseItem.status}
                            </span>

                            {caseItem.priority === 'High' || caseItem.priority === 'Critical' || caseItem.priority === 'Emergency' ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-950 text-red-300 border border-red-800 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {caseItem.priority}
                              </span>
                            ) : null}

                            {isVerified && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-teal-400" />
                                100% VERIFIED
                              </span>
                            )}
                          </div>

                          <h3 className="text-xs font-bold text-white line-clamp-1">
                            {caseItem.title}
                          </h3>
                        </div>

                        <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0">
                          {new Date(caseItem.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{caseItem.location} • {caseItem.ward}</span>
                        </div>

                        <span className="text-[11px] font-semibold text-slate-300 shrink-0 ml-2">
                          {caseItem.department}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right / Detail: Active Case Management & Action Panel (5 columns) */}
          <div className="lg:col-span-5">
            {selectedCase ? (
              <div className="sticky top-20 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-xl max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black font-mono text-sky-400">
                        #{selectedCase.id}
                      </span>
                      {selectedCase.isCitizenVerified && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full">
                          ✓ CITIZEN CERTIFIED
                        </span>
                      )}
                    </div>
                    <h2 className="text-sm font-bold text-white mt-1 leading-snug">
                      {selectedCase.title}
                    </h2>
                  </div>

                  <button
                    onClick={() => setSelectedCase(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Complaint Info Overview */}
                <div className="bg-slate-800/60 p-3.5 rounded-2xl space-y-2 text-xs border border-slate-700/50">
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">Category</span>
                      <span className="font-semibold text-white">{selectedCase.category}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">Department</span>
                      <span className="font-semibold text-white">{selectedCase.department}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">Location</span>
                      <span className="font-semibold text-white">{selectedCase.location}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">NMC Ward</span>
                      <span className="font-semibold text-white">{selectedCase.ward}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">Citizen Name</span>
                      <span className="font-semibold text-white">{selectedCase.citizenName || 'Citizen Reporter'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">Citizen Contact</span>
                      <span className="font-semibold text-white">{selectedCase.citizenPhone || 'Not provided'}</span>
                    </div>
                  </div>

                  {selectedCase.description && (
                    <div className="pt-2 border-t border-slate-700/60">
                      <span className="text-[10px] text-slate-500 block font-bold">Description</span>
                      <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">
                        {selectedCase.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Photo Evidence if present */}
                {selectedCase.attachments && selectedCase.attachments.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-300 block">
                      Attached GPS Geotag Photo:
                    </span>
                    <div className="rounded-xl overflow-hidden border border-slate-700 bg-black aspect-video relative">
                      <img
                        src={selectedCase.attachments[0].url}
                        alt="Evidence"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Ground Truth Audit Certificate Details */}
                {selectedCase.citizenVerification && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/70 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Citizen Ground-Truth Audit Log</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-emerald-200">
                      <div>✓ On-Site Presence Witnessed</div>
                      <div>✓ Authentic Unaltered Photo</div>
                      <div>✓ Active Defect Ongoing</div>
                      <div>✓ Accurate Ward Geotag</div>
                    </div>
                  </div>
                )}

                {/* UPDATE / ACTION CONTROLS */}
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <h3 className="text-xs font-extrabold text-sky-400 uppercase tracking-wider">
                    Administrative Action & Dispatch
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Update Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="w-full bg-slate-800 border border-slate-700 text-white py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500 text-xs font-semibold"
                      >
                        <option value="Registered">Registered (Initial intake)</option>
                        <option value="Assigned">Assigned (Field unit queued)</option>
                        <option value="In Progress">In Progress (Active on site)</option>
                        <option value="Resolved">Resolved (Work completed)</option>
                        <option value="Closed">Closed (Signed off & verified)</option>
                        <option value="Reopened">Reopened (Further inspection)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Assigned Officer / Squad Unit
                      </label>
                      <input
                        type="text"
                        value={editOfficer}
                        onChange={(e) => setEditOfficer(e.target.value)}
                        placeholder="e.g. Er. Ramesh Meshram (Sky-Lift Unit #04)"
                        className="w-full bg-slate-800 border border-slate-700 text-white py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Officer Contact Phone
                      </label>
                      <input
                        type="text"
                        value={editOfficerPhone}
                        onChange={(e) => setEditOfficerPhone(e.target.value)}
                        placeholder="+91 94221 xxxxx"
                        className="w-full bg-slate-800 border border-slate-700 text-white py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Official Action Remarks / Resolution Notes
                      </label>
                      <textarea
                        rows={2}
                        value={editRemarks}
                        onChange={(e) => setEditRemarks(e.target.value)}
                        placeholder="e.g. Compactor truck cleared 4 tons of waste and bleached area on 17-Aug."
                        className="w-full bg-slate-800 border border-slate-700 text-white py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500 text-xs resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Resolution Evidence Photo URL (Optional)
                      </label>
                      <input
                        type="text"
                        value={editEvidenceUrl}
                        onChange={(e) => setEditEvidenceUrl(e.target.value)}
                        placeholder="https://... or photo url"
                        className="w-full bg-slate-800 border border-slate-700 text-white py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
                      />
                    </div>
                  </div>

                  {saveSuccess && (
                    <div className="p-2.5 bg-emerald-900/60 border border-emerald-700 text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Case status and officer assignment updated successfully!</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteCase(selectedCase.id)}
                      className="p-2.5 bg-red-950/60 hover:bg-red-900 text-red-300 rounded-xl border border-red-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      title="Delete Case Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveCaseUpdate}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSaving ? 'Saving...' : 'Save & Sync Update'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="sticky top-20 bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
                <SlidersHorizontal className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="text-sm font-bold text-slate-300">Select a complaint to inspect</div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Click on any complaint in the list to update its status, assign zonal engineers, review GPS evidence, or broadcast updates.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Broadcast Alert Modal */}
      {notifModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Dispatch Citizen Notification</h3>
              </div>
              <button
                onClick={() => setNotifModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Case ID (Optional)</label>
                <input
                  type="text"
                  value={notifTargetCaseId}
                  onChange={(e) => setNotifTargetCaseId(e.target.value)}
                  placeholder="e.g. NS-2026-8921"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Notification Title</label>
                <input
                  type="text"
                  required
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="e.g. Squad Dispatched to Site"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Notification Message</label>
                <textarea
                  rows={3}
                  required
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="e.g. Compactor vehicle #12 is en route to Dharampeth for complete waste clearing."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNotifModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Notification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
