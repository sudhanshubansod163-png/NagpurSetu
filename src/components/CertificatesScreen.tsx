import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  ExternalLink, 
  Clock, 
  IndianRupee, 
  CheckCircle2, 
  Building2, 
  Landmark, 
  ArrowRight,
  ChevronRight,
  Sparkles,
  Award,
  Layers,
  HelpCircle,
  X
} from 'lucide-react';
import { CITIZEN_CERTIFICATES, GOVERNMENT_SCHEMES } from '../data/initialData';
import { CitizenCertificate } from '../types';

interface CertificatesScreenProps {
  navigate: (route: string) => void;
}

export const CertificatesScreen: React.FC<CertificatesScreenProps> = ({ navigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProcessFilter, setSelectedProcessFilter] = useState<string>('All');
  const [activeCertModal, setActiveCertModal] = useState<CitizenCertificate | null>(null);

  const filteredCerts = CITIZEN_CERTIFICATES.filter((cert) => {
    if (selectedProcessFilter !== 'All' && cert.processType !== selectedProcessFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const inName = cert.name.toLowerCase().includes(q) || (cert.marathiName && cert.marathiName.toLowerCase().includes(q)) || (cert.hindiName && cert.hindiName.toLowerCase().includes(q));
      const inPurpose = cert.purpose.toLowerCase().includes(q);
      const inAuth = cert.issuingAuthority.toLowerCase().includes(q);
      return inName || inPurpose || inAuth;
    }
    return true;
  });

  return (
    <div className="w-full bg-[#FAFCFF] min-h-[calc(100vh-140px)] py-8 px-4 sm:px-6 lg:px-8" id="certificates-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 mb-1">
              <span className="cursor-pointer hover:underline" onClick={() => navigate('/')}>Home</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span>Certificates & Document Guide</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1E38] tracking-tight">
              Nagpur & Maharashtra Citizen Certificates
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              "Which certificate do I need and what documents are required?" — Step-by-step guidance on issuing authorities, eligibility, required proofs, official Aaple Sarkar online processes, and connected government schemes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/schemes')}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl shadow-2xs hover:bg-blue-950 transition-colors"
            >
              <Landmark className="w-4 h-4 text-blue-200" />
              <span>Explore Government Schemes</span>
            </button>
          </div>
        </div>

        {/* Search & Process Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search certificates by name (e.g. Income, Domicile, Caste, Birth, Non-Creamy Layer, Disability, NOC)..."
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

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {['All', 'Online via Aaple Sarkar', 'Online & Offline (Setu Seva Kendra)', 'NMC Ward Office'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedProcessFilter(filter)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border whitespace-nowrap transition-all ${
                  selectedProcessFilter === filter
                    ? 'bg-[#0B1E38] text-white border-[#0B1E38]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {filter === 'All' ? 'All Channels' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Certificate Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCerts.map((cert) => {
            // Find schemes that connect to this certificate
            const connectedSchemeObjects = GOVERNMENT_SCHEMES.filter(
              s => cert.connectedSchemes.includes(s.id) || s.requiredCertificates.some(rc => rc.toLowerCase().includes(cert.name.split(' ')[0].toLowerCase()))
            );

            return (
              <div
                key={cert.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all space-y-4 group"
                id={`cert-card-${cert.id}`}
              >
                <div className="space-y-3">
                  {/* Process Type Badge & Fee */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-bold rounded-md">
                      {cert.processType}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                      <span className="flex items-center gap-0.5 text-slate-700">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {cert.governmentFee === 0 ? 'Free' : `₹${cert.governmentFee}`}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        {cert.processingTimeDays} Days SLA
                      </span>
                    </div>
                  </div>

                  {/* Title & Marathi Title */}
                  <div>
                    <h3 className="text-base font-bold text-[#0B1E38] group-hover:text-blue-900 transition-colors leading-snug">
                      {cert.name}
                    </h3>
                    {cert.marathiName && (
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">{cert.marathiName}</p>
                    )}
                  </div>

                  {/* Issuing Authority */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <Building2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span className="truncate">{cert.issuingAuthority}</span>
                  </div>

                  {/* Purpose */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {cert.purpose}
                  </p>

                  {/* Required Documents List */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Required Documents ({cert.requiredDocuments.length}):
                    </span>
                    <ul className="text-xs text-slate-700 space-y-1">
                      {cert.requiredDocuments.slice(0, 3).map((doc, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{doc}</span>
                        </li>
                      ))}
                    </ul>
                    {cert.requiredDocuments.length > 3 && (
                      <span className="text-[10px] text-blue-900 font-semibold pl-5">
                        +{cert.requiredDocuments.length - 3} additional documents
                      </span>
                    )}
                  </div>

                  {/* Connected Schemes Link */}
                  {connectedSchemeObjects.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        <Landmark className="w-3 h-3 text-amber-700" />
                        <span>Required for {connectedSchemeObjects.length} Scheme{connectedSchemeObjects.length > 1 ? 's' : ''} (e.g. {connectedSchemeObjects[0].name.split('-')[0]})</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions Bottom Bar */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveCertModal(cert)}
                    className="px-3 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl hover:bg-blue-950 transition-colors flex items-center gap-1"
                  >
                    <span>View Step-by-Step Guide</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={cert.officialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1"
                  >
                    <span>Apply Online</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Certificate Detail Modal */}
        {activeCertModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 text-xs font-bold rounded-md">
                      {activeCertModal.processType}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      SLA: {activeCertModal.processingTimeDays} Days | Govt Fee: {activeCertModal.governmentFee === 0 ? 'Free' : `₹${activeCertModal.governmentFee}`}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[#0B1E38]">{activeCertModal.name}</h2>
                  {activeCertModal.marathiName && (
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{activeCertModal.marathiName}</p>
                  )}
                </div>
                <button
                  onClick={() => setActiveCertModal(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Purpose & Authority */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block">Legal Purpose</span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">{activeCertModal.purpose}</p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200">
                  <div>
                    <strong>Issuing Authority:</strong> {activeCertModal.issuingAuthority}
                  </div>
                  <div>
                    <strong>Department:</strong> {activeCertModal.department}
                  </div>
                </div>
              </div>

              {/* Required Documents Checklist */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-700" />
                  <span>Mandatory Documents Required to Apply</span>
                </h4>
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-2">
                  {activeCertModal.requiredDocuments.map((doc, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Application Steps */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Official Application Process ({activeCertModal.processType})
                </h4>
                <div className="space-y-2">
                  {activeCertModal.applicationSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-blue-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected Schemes */}
              {activeCertModal.connectedSchemes.length > 0 && (
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2 text-xs">
                  <div className="font-bold text-amber-950 flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-amber-700" />
                    <span>Government Schemes That Require This Certificate</span>
                  </div>
                  <p className="text-amber-900 text-[11px]">
                    Having this certificate is mandatory when applying for:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {GOVERNMENT_SCHEMES.filter(s => activeCertModal.connectedSchemes.includes(s.id)).map(sch => (
                      <span
                        key={sch.id}
                        onClick={() => {
                          setActiveCertModal(null);
                          navigate('/schemes');
                        }}
                        className="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 font-semibold rounded-lg cursor-pointer hover:bg-amber-100"
                      >
                        {sch.name} →
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="text-[11px] text-slate-400">
                  Verified with {activeCertModal.officialSource}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveCertModal(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200"
                  >
                    Close
                  </button>
                  <a
                    href={activeCertModal.officialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#0B1E38] text-white text-xs font-bold rounded-xl hover:bg-blue-900 transition-colors shadow-sm"
                  >
                    <span>Apply Online on Aaple Sarkar / Official Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
