import React, { useState, useMemo } from 'react';
import { 
  Landmark, 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  FileText, 
  Award, 
  Users, 
  ChevronRight, 
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Info,
  Building,
  DollarSign,
  HeartPulse,
  Sun,
  X
} from 'lucide-react';
import { GOVERNMENT_SCHEMES, CITIZEN_CERTIFICATES } from '../data/initialData';
import { GovernmentScheme, SchemeCategory, BeneficiaryGroup } from '../types';

interface SchemesScreenProps {
  navigate: (route: string) => void;
  onSelectScheme?: (scheme: GovernmentScheme) => void;
}

const CATEGORY_TABS: { label: string; value: SchemeCategory | 'All'; icon: any; color: string }[] = [
  { label: 'All Schemes', value: 'All', icon: Landmark, color: 'text-blue-700 bg-blue-50' },
  { label: 'Housing & Urban Living', value: 'Housing & Urban Living', icon: Building, color: 'text-amber-700 bg-amber-50' },
  { label: 'Financial & Livelihood', value: 'Financial Assistance & Livelihood', icon: DollarSign, color: 'text-emerald-700 bg-emerald-50' },
  { label: 'Health & Nutrition', value: 'Health, Nutrition & Sanitation', icon: HeartPulse, color: 'text-rose-700 bg-rose-50' },
  { label: 'Energy & Utilities', value: 'Energy & Utilities', icon: Sun, color: 'text-indigo-700 bg-indigo-50' },
];

const BENEFICIARY_FILTERS: BeneficiaryGroup[] = [
  'General Citizens',
  'Farmers',
  'Students',
  'Women',
  'Senior Citizens',
  'Job Seekers',
  'Entrepreneurs',
  'Persons with Disabilities'
];

export const SchemesScreen: React.FC<SchemesScreenProps> = ({ navigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<SchemeCategory | 'All'>('All');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSchemeModal, setActiveSchemeModal] = useState<GovernmentScheme | null>(null);
  const [eligibilityCheckScheme, setEligibilityCheckScheme] = useState<GovernmentScheme | null>(null);
  const [eligibilityAnswers, setEligibilityAnswers] = useState<{ [key: number]: boolean }>({});

  const filteredSchemes = useMemo(() => {
    return GOVERNMENT_SCHEMES.filter((scheme) => {
      // Category match
      if (selectedCategory !== 'All' && scheme.category !== selectedCategory) {
        return false;
      }
      // Beneficiary match
      if (selectedBeneficiary !== 'All' && !scheme.beneficiaries.includes(selectedBeneficiary as BeneficiaryGroup)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inName = scheme.name.toLowerCase().includes(q) || (scheme.marathiName && scheme.marathiName.toLowerCase().includes(q)) || (scheme.hindiName && scheme.hindiName.toLowerCase().includes(q));
        const inPurpose = scheme.purpose.toLowerCase().includes(q);
        const inBenefits = scheme.benefits.toLowerCase().includes(q);
        return inName || inPurpose || inBenefits;
      }
      return true;
    });
  }, [selectedCategory, selectedBeneficiary, searchQuery]);

  return (
    <div className="w-full bg-[#FAFCFF] min-h-[calc(100vh-140px)] py-8 px-4 sm:px-6 lg:px-8" id="schemes-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 mb-1">
              <span className="cursor-pointer hover:underline" onClick={() => navigate('/')}>Home</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span>Government Schemes</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1E38] tracking-tight">
              Nagpur & Maharashtra Government Schemes
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Verified financial subsidies, housing grants, health insurance, and welfare initiatives with required certificates, eligibility criteria, and official government application links.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/certificates')}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-blue-200 text-blue-950 text-xs font-bold rounded-xl shadow-2xs hover:bg-blue-50 transition-colors"
            >
              <FileText className="w-4 h-4 text-blue-700" />
              <span>Required Certificates Directory</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter Tabs */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search schemes by name, purpose, keyword (e.g., PMAY, Solar, Loan, Awas, MJPJAY)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Beneficiary Target Selector */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>For:</span>
              </span>
              <select
                value={selectedBeneficiary}
                onChange={(e) => setSelectedBeneficiary(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-800 cursor-pointer w-full md:w-48"
              >
                <option value="All">All Beneficiaries</option>
                {BENEFICIARY_FILTERS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 4 Main Categories Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = selectedCategory === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setSelectedCategory(tab.value)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                    isSelected 
                      ? 'bg-[#0B1E38] text-white border-[#0B1E38] shadow-xs' 
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/10 text-white' : tab.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{tab.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Schemes Results Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Showing {filteredSchemes.length} Verified Government Schemes
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official RTS & Direct Benefit Transfer Verified</span>
            </span>
          </div>

          {filteredSchemes.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <Landmark className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No schemes found matching your criteria</h3>
              <p className="text-xs text-slate-500">Try clearing your search terms or selecting 'All Schemes'.</p>
              <button
                onClick={() => { setSelectedCategory('All'); setSelectedBeneficiary('All'); setSearchQuery(''); }}
                className="px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-lg"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSchemes.map((scheme) => (
                <div
                  key={scheme.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all group relative"
                  id={`scheme-card-${scheme.id}`}
                >
                  <div className="space-y-4">
                    {/* Top Category Tag & Subsidy */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-bold rounded-md">
                        {scheme.category}
                      </span>
                      {scheme.subsidyAmount && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-extrabold rounded-md">
                          {scheme.subsidyAmount}
                        </span>
                      )}
                    </div>

                    {/* Scheme Name & Marathi Name */}
                    <div>
                      <h3 className="text-base font-bold text-[#0B1E38] group-hover:text-blue-900 transition-colors leading-snug">
                        {scheme.name}
                      </h3>
                      {scheme.marathiName && (
                        <div className="text-xs font-semibold text-slate-500 mt-0.5">
                          {scheme.marathiName}
                        </div>
                      )}
                    </div>

                    {/* Purpose */}
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {scheme.purpose}
                    </p>

                    {/* Key Benefits Highlight */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-1">
                      <span className="font-bold text-slate-700 block text-[11px]">Primary Benefit:</span>
                      <p className="text-slate-600 line-clamp-2">{scheme.benefits}</p>
                    </div>

                    {/* Required Certificates Quick Pills */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Required Certificates:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {scheme.requiredCertificates.slice(0, 2).map((cert, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md truncate max-w-[200px]"
                          >
                            {cert}
                          </span>
                        ))}
                        {scheme.requiredCertificates.length > 2 && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-semibold rounded-md">
                            +{scheme.requiredCertificates.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setActiveSchemeModal(scheme)}
                      className="px-3.5 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl hover:bg-blue-950 transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>View Full Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setEligibilityCheckScheme(scheme);
                        setEligibilityAnswers({});
                      }}
                      className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      Check Eligibility
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheme Full Details Modal */}
        {activeSchemeModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 text-xs font-bold rounded-md">
                      {activeSchemeModal.category}
                    </span>
                    {activeSchemeModal.subsidyAmount && (
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-md">
                        {activeSchemeModal.subsidyAmount}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-[#0B1E38]">{activeSchemeModal.name}</h2>
                  {activeSchemeModal.marathiName && (
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{activeSchemeModal.marathiName}</p>
                  )}
                </div>
                <button
                  onClick={() => setActiveSchemeModal(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Purpose & Benefits */}
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Purpose</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{activeSchemeModal.purpose}</p>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pt-2">Financial Benefits & Grants</h4>
                  <p className="text-xs text-emerald-800 font-semibold">{activeSchemeModal.benefits}</p>
                </div>
              </div>

              {/* Eligibility Checklist */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Eligibility Criteria</h4>
                <div className="space-y-1.5">
                  {activeSchemeModal.eligibility.map((el, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{el}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Documents & Certificates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-700" />
                    <span>Required Documents</span>
                  </h4>
                  <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                    {activeSchemeModal.requiredDocuments.map((doc, idx) => (
                      <li key={idx} className="leading-snug">{doc}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-700" />
                    <span>Required Certificates</span>
                  </h4>
                  <ul className="text-xs text-slate-700 space-y-1.5">
                    {activeSchemeModal.requiredCertificates.map((cert, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-1">
                        <span>• {cert}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      setActiveSchemeModal(null);
                      navigate('/certificates');
                    }}
                    className="text-[11px] font-bold text-blue-900 hover:underline pt-2 inline-block"
                  >
                    View how to get these certificates →
                  </button>
                </div>
              </div>

              {/* Application Procedure */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Application Procedure</h4>
                <p className="text-xs text-slate-700 leading-relaxed">{activeSchemeModal.applicationProcedure}</p>
                <div className="text-[11px] text-slate-500 pt-1">
                  <strong>Official Authority:</strong> {activeSchemeModal.officialAuthority}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Last verified: {activeSchemeModal.lastVerifiedDate}</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={activeSchemeModal.officialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#0B1E38] text-white text-xs font-bold rounded-xl hover:bg-blue-900 transition-colors shadow-sm"
                  >
                    <span>Apply on Official Govt Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Eligibility Checker Modal */}
        {eligibilityCheckScheme && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Eligibility Check</span>
                  <h3 className="text-base font-bold text-[#0B1E38]">{eligibilityCheckScheme.name}</h3>
                </div>
                <button onClick={() => setEligibilityCheckScheme(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Please answer the following criteria to check if you qualify for this scheme:
              </p>

              <div className="space-y-3">
                {eligibilityCheckScheme.eligibility.map((crit, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <p className="text-xs font-semibold text-slate-800">{crit}</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEligibilityAnswers({ ...eligibilityAnswers, [idx]: true })}
                        className={`px-3 py-1 text-xs font-bold rounded-md border ${
                          eligibilityAnswers[idx] === true 
                            ? 'bg-emerald-600 text-white border-emerald-600' 
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Yes, I Meet This
                      </button>
                      <button
                        onClick={() => setEligibilityAnswers({ ...eligibilityAnswers, [idx]: false })}
                        className={`px-3 py-1 text-xs font-bold rounded-md border ${
                          eligibilityAnswers[idx] === false 
                            ? 'bg-rose-600 text-white border-rose-600' 
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        No / Not Sure
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {Object.keys(eligibilityAnswers).length === eligibilityCheckScheme.eligibility.length && (
                <div className={`p-4 rounded-2xl border ${
                  Object.values(eligibilityAnswers).every(v => v === true)
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="font-bold text-xs">
                    {Object.values(eligibilityAnswers).every(v => v === true)
                      ? '✓ You Appear Fully Eligible!'
                      : 'ℹ Partial Eligibility / Special Consideration Required'}
                  </div>
                  <p className="text-[11px] mt-1">
                    {Object.values(eligibilityAnswers).every(v => v === true)
                      ? 'You satisfy the basic preliminary checklist. You may proceed to prepare your certificates and submit your application.'
                      : 'Please verify the specific income limit or category exemption at your local Nagpur Tehsil / Ward office.'}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setEligibilityCheckScheme(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200"
                >
                  Close
                </button>
                {Object.values(eligibilityAnswers).every(v => v === true) && (
                  <a
                    href={eligibilityCheckScheme.officialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl hover:bg-blue-950 flex items-center gap-1"
                  >
                    <span>Proceed to Apply</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
