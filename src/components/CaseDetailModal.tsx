import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  User, 
  Shield, 
  ShieldCheck,
  ThumbsUp, 
  ThumbsDown,
  MessageSquare,
  FileCheck
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { CaseItem } from '../types';

interface CaseDetailModalProps {
  caseItem: CaseItem | null;
  onClose: () => void;
  onCaseUpdated: (updatedCase: CaseItem) => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseItem,
  onClose,
  onCaseUpdated,
}) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenInput, setShowReopenInput] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  if (!caseItem) return null;

  const handleConfirmFixed = () => {
    const updated = StorageService.confirmResolution(caseItem.id, true, feedbackText || 'Citizen confirmed issue is resolved.');
    if (updated) {
      onCaseUpdated(updated);
      setFeedbackSuccess(true);
    }
  };

  const handleReopen = () => {
    if (!reopenReason.trim()) return;
    const updated = StorageService.reopenCase(caseItem.id, reopenReason);
    if (updated) {
      onCaseUpdated(updated);
      setShowReopenInput(false);
      setFeedbackSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" id="case-detail-modal-overlay">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto" id="case-detail-modal">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">
                #{caseItem.id}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                  caseItem.status === 'In Progress'
                    ? 'bg-[#FEF3C7] text-[#9A3412]'
                    : caseItem.status === 'Resolved' || caseItem.status === 'Closed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-50 text-blue-800'
                }`}
              >
                {caseItem.status}
              </span>
              {StorageService.isCaseInCurrentSession(caseItem) ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                  Your Report (This Session)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  Public City Report
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1E38]">
              {caseItem.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location & Department */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="space-y-1">
            <span className="text-slate-500 font-bold uppercase text-[10px]">Location & Ward</span>
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>{caseItem.location}</span>
            </div>
            <div className="text-slate-600 pl-5">{caseItem.ward}</div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-bold uppercase text-[10px]">Assigned Department</span>
            <div className="font-bold text-slate-900">{caseItem.department}</div>
            <div className="text-slate-600">SLA: {caseItem.slaRemaining || '2 days'}</div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1 text-xs sm:text-sm">
          <span className="font-bold text-slate-900">Complaint Details:</span>
          <p className="text-slate-700 bg-white border border-slate-200 p-3 rounded-lg leading-relaxed">
            {caseItem.description}
          </p>
        </div>

        {/* Citizen Ground-Truth Self-Verification Audit Card */}
        {caseItem.citizenVerification && (
          <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-950 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Citizen Authenticity Checklist (100% Verified Ground Truth)</span>
              </div>
              <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                GENUINE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-emerald-900">
              <div className="flex items-center gap-1.5 bg-white/80 p-2 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Physically present on-site</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/80 p-2 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Genuine unaltered photo evidence</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/80 p-2 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Defect actively ongoing / hazardous</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/80 p-2 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Accurate NMC ward & GPS geotag</span>
              </div>
            </div>
            
            {caseItem.citizenVerification.verifiedAt && (
              <div className="text-[10px] text-emerald-700 font-medium">
                Self-certified on: {new Date(caseItem.citizenVerification.verifiedAt).toLocaleString('en-IN')}
              </div>
            )}
          </div>
        )}

        {/* Attachments */}
        {caseItem.attachments && caseItem.attachments.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-900">Photo Evidence:</span>
            <div className="h-44 rounded-xl overflow-hidden border border-slate-200">
              <img
                src={caseItem.attachments[0].url}
                alt="Case Evidence"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Officer Assigned & Resolution Evidence */}
        {caseItem.assignedOfficer && (
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0B1E38] text-white flex items-center justify-center font-bold">
                <Shield className="w-4 h-4 text-blue-300" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-900 block">
                  Field Officer Assigned
                </span>
                <span className="font-bold text-slate-900">{caseItem.assignedOfficer}</span>
              </div>
            </div>

            {caseItem.assignedOfficerPhone && (
              <a
                href={`tel:${caseItem.assignedOfficerPhone}`}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-300 text-blue-900 font-bold rounded-lg hover:bg-blue-50"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Officer</span>
              </a>
            )}
          </div>
        )}

        {/* Resolution Notes & Proof */}
        {caseItem.resolutionNotes && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2 text-xs">
            <span className="font-bold text-emerald-900 block">
              Resolution Remarks by Field Team:
            </span>
            <p className="text-emerald-800 font-medium">
              "{caseItem.resolutionNotes}"
            </p>
            {caseItem.resolutionEvidenceUrl && (
              <div className="mt-2 h-36 rounded-lg overflow-hidden border border-emerald-300">
                <img
                  src={caseItem.resolutionEvidenceUrl}
                  alt="Resolution proof"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        )}

        {/* Detailed Timeline */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Case Activity History
          </h4>

          <div className="space-y-3 pl-2 border-l-2 border-slate-200">
            {caseItem.timeline.map((event) => (
              <div key={event.id} className="relative pl-4 space-y-0.5">
                <div
                  className={`absolute -left-[17px] top-1 w-3 h-3 rounded-full ${
                    event.dotColor === 'green'
                      ? 'bg-emerald-600'
                      : event.dotColor === 'orange'
                      ? 'bg-orange-500'
                      : event.dotColor === 'dark'
                      ? 'bg-[#0B1E38]'
                      : 'bg-slate-300'
                  }`}
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{event.title}</span>
                  <span className="text-slate-400 text-[11px]">{event.timestamp}</span>
                </div>
                {event.actor && (
                  <div className="text-xs text-slate-700 font-medium">{event.actor}</div>
                )}
                {event.description && (
                  <div className="text-[11px] text-slate-500">{event.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Citizen Verification Action (Is the problem actually resolved?) */}
        {caseItem.status === 'Resolved' && !caseItem.citizenFeedback && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Citizen Verification Required
            </h4>
            <p className="text-xs text-amber-800">
              The municipal team reported this issue as resolved. Please verify if the problem has been fixed at your location.
            </p>

            {!showReopenInput ? (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={handleConfirmFixed}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Yes, Fixed Satisfactorily</span>
                </button>

                <button
                  onClick={() => setShowReopenInput(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-300 text-xs font-bold rounded-lg"
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>No, Still a Problem</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <textarea
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Explain why the problem is still unresolved (e.g. garbage was only half cleared)..."
                  className="w-full h-20 p-2.5 text-xs bg-white border border-amber-300 rounded-lg"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowReopenInput(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReopen}
                    className="px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg"
                  >
                    Reopen Complaint
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#0B1E38] hover:bg-[#152e52] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
