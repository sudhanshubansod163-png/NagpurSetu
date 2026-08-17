import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  ChevronRight, 
  Plus, 
  FileText, 
  Clock, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Globe,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { StorageService, subscribeToStorage } from '../services/storage';
import { CaseItem } from '../types';
import { CaseDetailModal } from './CaseDetailModal';

interface MyCasesScreenProps {
  navigate: (route: string) => void;
  selectedCaseId?: string | null;
}

export const MyCasesScreen: React.FC<MyCasesScreenProps> = ({
  navigate,
  selectedCaseId,
}) => {
  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'In Progress' | 'Resolved'>('All');
  const [sessionScope, setSessionScope] = useState<'session' | 'all'>('session');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalCase, setActiveModalCase] = useState<CaseItem | null>(null);
  const [sessionId, setSessionId] = useState<string>(StorageService.getCitizenSessionId());

  useEffect(() => {
    const refresh = () => {
      const loaded = StorageService.getCases();
      setAllCases(loaded);
      setSessionId(StorageService.getCitizenSessionId());

      if (selectedCaseId) {
        const target = loaded.find((c) => c.id.toLowerCase() === selectedCaseId.toLowerCase());
        if (target) setActiveModalCase(target);
      }
    };

    refresh();
    const unsub = subscribeToStorage(refresh);
    return () => unsub();
  }, [selectedCaseId]);

  const currentSessionCases = allCases.filter((c) => StorageService.isCaseInCurrentSession(c));
  const displayedCasesSource = sessionScope === 'session' ? currentSessionCases : allCases;

  const filtered = displayedCasesSource.filter((c) => {
    if (activeTab === 'In Progress' && (c.status === 'Resolved' || c.status === 'Closed')) return false;
    if (activeTab === 'Resolved' && c.status !== 'Resolved' && c.status !== 'Closed') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.ward.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="w-full bg-[#FAFCFF] min-h-[calc(100vh-140px)] py-8 px-4 sm:px-6 lg:px-8" id="my-cases-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1E38] tracking-tight">
                My Civic Reports
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-900 border border-blue-200">
                Session-Isolated
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Track real-time status, field evidence, and live officer actions for your reported issues.
            </p>
          </div>

          <button
            onClick={() => navigate('/talk')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0B1E38] hover:bg-[#152e52] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto active:scale-95"
            id="mycases-new-complaint-btn"
          >
            <Plus className="w-4 h-4" />
            <span>New Complaint</span>
          </button>
        </div>

        {/* Session Isolation Banner & Filter Selector */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          
          {/* Isolation Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0B1E38] text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-amber-300" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-extrabold text-[#0B1E38] flex items-center gap-2">
                  <span>Data Isolation Filter</span>
                  <span className="font-mono text-[10px] text-slate-500 font-normal truncate max-w-[140px] sm:max-w-[200px]" title={sessionId}>
                    Session #{sessionId.slice(0, 18)}...
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {sessionScope === 'session'
                    ? 'Showing only complaints registered on this citizen session/device.'
                    : 'Showing all public civic complaints logged across the city.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setSessionScope('session')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  sessionScope === 'session'
                    ? 'bg-[#0B1E38] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                id="filter-session-isolated"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>My Session ({currentSessionCases.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSessionScope('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  sessionScope === 'all'
                    ? 'bg-[#0B1E38] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                id="filter-all-city"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>All City ({allCases.length})</span>
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, case ID (e.g. #REQ-2024, garbage, Dharampeth)..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white transition-colors"
              id="mycases-search-input"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
              {(['All', 'In Progress', 'Resolved'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-[#0B1E38] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                  id={`tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <span className="text-xs font-semibold text-slate-500">
              Showing {filtered.length} {filtered.length === 1 ? 'case' : 'cases'}
            </span>
          </div>
        </div>

        {/* Cases List */}
        <div className="space-y-4">
          {filtered.map((item) => {
            const isMySession = StorageService.isCaseInCurrentSession(item);

            return (
              <div
                key={item.id}
                onClick={() => setActiveModalCase(item)}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 space-y-4 shadow-xs hover:shadow-sm transition-all cursor-pointer group"
                id={`case-item-${item.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-slate-500 group-hover:text-blue-900">
                      #{item.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                        item.status === 'In Progress'
                          ? 'bg-[#FEF3C7] text-[#9A3412]'
                          : item.status === 'Resolved' || item.status === 'Closed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-50 text-blue-800'
                      }`}
                    >
                      {item.status}
                    </span>

                    {isMySession ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        Your Session
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Public Report
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-semibold text-slate-500">
                    {item.slaRemaining ? `SLA: ${item.slaRemaining}` : 'Logged recently'}
                  </div>
                </div>

                {/* Title & Location */}
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0B1E38] transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{item.location}</span>
                    <span className="text-slate-300">•</span>
                    <span>{item.ward}</span>
                  </div>
                </div>

                {/* Stepper Timeline Summary */}
                <div className="pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {item.timeline.slice(0, 4).map((step, idx) => {
                      const isComplete = step.status === 'completed';
                      const isCurrent = step.status === 'current';
                      return (
                        <div key={step.id || idx} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                isComplete
                                  ? 'bg-[#0B1E38]'
                                  : isCurrent
                                  ? 'bg-[#F97316] ring-2 ring-orange-200'
                                  : 'bg-slate-300'
                              }`}
                            />
                            <span
                              className={`text-xs font-bold truncate ${
                                isComplete || isCurrent ? 'text-slate-900' : 'text-slate-400'
                              }`}
                            >
                              {step.title}
                            </span>
                          </div>
                          <div className="pl-4 text-[11px] text-slate-500 truncate">
                            {step.actor || step.timestamp}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Department: <strong className="text-slate-700">{item.department}</strong>
                  </span>
                  <span className="font-bold text-[#0B1E38] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    View Full Case History <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-xs">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <div className="space-y-1">
                <div className="text-base font-bold text-slate-800">
                  {sessionScope === 'session' ? 'No Complaints In This Session' : 'No matching cases found'}
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {sessionScope === 'session'
                    ? 'You have not registered any civic complaints in this active browser session. When you submit an issue, it will be automatically isolated and tracked here.'
                    : 'Try adjusting your search criteria or filter status.'}
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => navigate('/complaints')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B1E38] text-white text-xs font-bold rounded-xl hover:bg-[#152e52] transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Report an Issue</span>
                </button>

                {sessionScope === 'session' && allCases.length > 0 && (
                  <button
                    onClick={() => setSessionScope('all')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <Globe className="w-4 h-4" />
                    <span>View All City Reports ({allCases.length})</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Case Details Modal */}
      {activeModalCase && (
        <CaseDetailModal
          caseItem={activeModalCase}
          onClose={() => setActiveModalCase(null)}
          onCaseUpdated={(updated) => {
            setActiveModalCase(updated);
            setAllCases(StorageService.getCases());
          }}
        />
      )}
    </div>
  );
};
