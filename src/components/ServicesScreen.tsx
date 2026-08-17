import React, { useState } from 'react';
import { 
  FileText, 
  FileCheck, 
  Receipt, 
  Droplets, 
  Store, 
  Trees, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck,
  CheckCircle,
  Search,
  MessageSquareText,
  Landmark,
  Award,
  ExternalLink,
  ChevronRight,
  Send,
  Building,
  HelpCircle,
  X
} from 'lucide-react';
import { MUNICIPAL_SERVICES, GOVERNMENT_SCHEMES, CITIZEN_CERTIFICATES } from '../data/initialData';
import { MunicipalService, Department } from '../types';

interface ServicesScreenProps {
  navigate: (route: string) => void;
  onSelectService: (service: MunicipalService) => void;
}

const DEPARTMENTS = [
  'All Departments',
  'Town Planning & Birth/Death',
  'Water Works',
  'Enforcement & Hoardings',
  'Public Health & Sanitation',
  'Garden & Environment',
  'Electrical & Streetlights',
  'Roads & Traffic'
];

export const ServicesScreen: React.FC<ServicesScreenProps> = ({
  navigate,
  onSelectService,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('All Departments');
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI Interactive Solutions Query Bar
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMatchResult, setAiMatchResult] = useState<{
    matchedTitle: string;
    description: string;
    recommendedType: 'service' | 'scheme' | 'certificate' | 'complaint';
    targetRoute: string;
    details?: string;
  } | null>(null);

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileText': return <FileText className="w-5 h-5" />;
      case 'FileCheck': return <FileCheck className="w-5 h-5" />;
      case 'Receipt': return <Receipt className="w-5 h-5" />;
      case 'Droplets': return <Droplets className="w-5 h-5" />;
      case 'Store': return <Store className="w-5 h-5" />;
      case 'Trees': return <Trees className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const handleAiFindSolution = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiPrompt.trim()) return;

    const q = aiPrompt.toLowerCase();

    // Check Schemes match
    if (q.includes('scheme') || q.includes('yojana') || q.includes('pmay') || q.includes('awas') || q.includes('subsidy') || q.includes('solar') || q.includes('surya') || q.includes('loan') || q.includes('svanidhi') || q.includes('mjpjay') || q.includes('health insurance')) {
      const foundScheme = GOVERNMENT_SCHEMES.find(s => q.includes(s.name.toLowerCase().split(' ')[0]) || q.includes('awas') || q.includes('solar')) || GOVERNMENT_SCHEMES[0];
      setAiMatchResult({
        matchedTitle: `Government Scheme: ${foundScheme.name}`,
        description: foundScheme.purpose,
        recommendedType: 'scheme',
        targetRoute: '/schemes',
        details: `Financial Benefit: ${foundScheme.benefits} • Required Certificates: ${foundScheme.requiredCertificates.join(', ')}`
      });
      return;
    }

    // Check Certificate match
    if (q.includes('certificate') || q.includes('dakhla') || q.includes('pramanpatra') || q.includes('income') || q.includes('domicile') || q.includes('caste') || q.includes('birth') || q.includes('death') || q.includes('non creamy') || q.includes('ncl') || q.includes('disability') || q.includes('udid')) {
      const foundCert = CITIZEN_CERTIFICATES.find(c => q.includes(c.name.toLowerCase().split(' ')[0])) || CITIZEN_CERTIFICATES[0];
      setAiMatchResult({
        matchedTitle: `Citizen Certificate: ${foundCert.name}`,
        description: foundCert.purpose,
        recommendedType: 'certificate',
        targetRoute: '/certificates',
        details: `Issuing Authority: ${foundCert.issuingAuthority} • SLA: ${foundCert.processingTimeDays} Days • Fee: ${foundCert.governmentFee === 0 ? 'Free' : '₹' + foundCert.governmentFee}`
      });
      return;
    }

    // Check Complaint match
    if (q.includes('pothole') || q.includes('khadda') || q.includes('garbage') || q.includes('kachra') || q.includes('light') || q.includes('andhera') || q.includes('drain') || q.includes('water logging') || q.includes('leak') || q.includes('broken')) {
      setAiMatchResult({
        matchedTitle: 'Civic Grievance Report',
        description: `Your query matches a civic problem report. You can log GPS coordinates & photo evidence directly without login.`,
        recommendedType: 'complaint',
        targetRoute: '/complaints',
        details: `48-hour municipal SLA assigned with automated routing to your Nagpur ward office.`
      });
      return;
    }

    // Default Municipal Service match
    const foundSrv = MUNICIPAL_SERVICES.find(s => q.includes(s.name.toLowerCase().split(' ')[0]) || q.includes(s.department.toLowerCase().split(' ')[0])) || MUNICIPAL_SERVICES[0];
    setAiMatchResult({
      matchedTitle: `NMC Municipal Service: ${foundSrv.name}`,
      description: foundSrv.description,
      recommendedType: 'service',
      targetRoute: '/talk',
      details: `Department: ${foundSrv.department} • SLA: ${foundSrv.slaDays} Days • Required: ${foundSrv.requiredDocuments.join(', ')}`
    });
  };

  const filteredServices = MUNICIPAL_SERVICES.filter((srv) => {
    if (selectedDept !== 'All Departments' && srv.department !== selectedDept) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return srv.name.toLowerCase().includes(q) || srv.description.toLowerCase().includes(q) || srv.department.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="w-full bg-[#FAFCFF] min-h-[calc(100vh-140px)] py-8 px-4 sm:px-6 lg:px-8" id="solutions-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 mb-1">
              <span className="cursor-pointer hover:underline" onClick={() => navigate('/')}>Home</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span>Solutions & Services</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1E38] tracking-tight">
              NagpurSetu Solutions & Municipal Services
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Help citizens find the right government/municipal services through AI-guided assistance, direct online applications, and comprehensive document checklists.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/talk')}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#EA580C] hover:bg-[#D94E07] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
            >
              <MessageSquareText className="w-4 h-4" />
              <span>Voice/Chat AI Assistant</span>
            </button>
          </div>
        </div>

        {/* AI-Guided Solution Search Bar */}
        <div className="bg-gradient-to-r from-[#0B1E38] to-[#1E3A8A] text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-md">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold">
              AI Solutions Navigator — What do you need today?
            </h2>
          </div>
          <p className="text-xs text-blue-100 max-w-2xl">
            Type anything in natural language (e.g., "I need a water line for my house in Dharampeth", "How to get an income certificate for college?", "Pothole outside my shop", "Solar rooftop subsidy").
          </p>

          <form onSubmit={handleAiFindSolution} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Ask in Hindi, Marathi, or English (e.g., 'Ghar ke liye solar lagwana hai', 'Income certificate kasa ghyaycha')..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 text-white placeholder-blue-200 border border-white/20 rounded-2xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white/20"
              />
              {aiPrompt && (
                <button
                  type="button"
                  onClick={() => { setAiPrompt(''); setAiMatchResult(null); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Find Solution</span>
            </button>
          </form>

          {/* AI Result Card */}
          {aiMatchResult && (
            <div className="bg-white text-slate-900 rounded-2xl p-5 space-y-3 shadow-lg animate-fade-in border border-blue-200 mt-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-bold rounded-md uppercase">
                    AI Matched Solution
                  </span>
                  <h3 className="text-base font-bold text-[#0B1E38] mt-1">{aiMatchResult.matchedTitle}</h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{aiMatchResult.description}</p>
                </div>
                <button
                  onClick={() => setAiMatchResult(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {aiMatchResult.details && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium">
                  {aiMatchResult.details}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => navigate(aiMatchResult.targetRoute)}
                  className="px-4 py-2 bg-[#0B1E38] text-white text-xs font-bold rounded-xl hover:bg-blue-900 transition-colors flex items-center gap-1.5"
                >
                  <span>Open Full Details & Steps</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3 Quick Jump Banner Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => navigate('/schemes')}
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-800"><Landmark className="w-5 h-5" /></span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900 transition-colors" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Government Schemes</h3>
            <p className="text-xs text-slate-500">PMAY, PM Surya Ghar, MJPJAY, SVANidhi, Ramai Awas subsidies & grants.</p>
          </div>

          <div
            onClick={() => navigate('/certificates')}
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-800"><Award className="w-5 h-5" /></span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-900 transition-colors" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Required Certificates</h3>
            <p className="text-xs text-slate-500">Income, Domicile, Caste, Non-Creamy Layer, Birth & Death certificates.</p>
          </div>

          <div
            onClick={() => navigate('/complaints')}
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800"><ShieldCheck className="w-5 h-5" /></span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-900 transition-colors" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Grievance & Complaints</h3>
            <p className="text-xs text-slate-500">Report potholes, dark streetlights, garbage, and track resolution live.</p>
          </div>
        </div>

        {/* Municipal Services Catalog */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-[#0B1E38]">
              Nagpur Municipal Corporation Direct Services Catalog
            </h2>
            
            {/* Search & Department Selector */}
            <div className="flex items-center gap-2">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-800"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((srv) => (
              <div
                key={srv.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 space-y-4 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
                id={`service-card-${srv.id}`}
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
                    {getServiceIcon(srv.icon)}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900">
                      {srv.name}
                    </h3>
                    <div className="text-[11px] font-semibold text-slate-500">
                      {srv.department}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {srv.description}
                  </p>

                  {/* Requirements */}
                  <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px]">
                    <span className="font-bold text-slate-700 block">Required Documents:</span>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                      {srv.requiredDocuments.map((doc, idx) => (
                        <li key={idx} className="truncate">{doc}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>SLA: {srv.slaDays} Days</span>
                  </div>

                  <button
                    onClick={() => onSelectService(srv)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0B1E38] hover:bg-[#152e52] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                    id={`apply-service-${srv.id}`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Start with AI</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
