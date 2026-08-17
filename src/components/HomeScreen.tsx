import React, { useState } from 'react';
import { 
  Mic, 
  User, 
  Archive, 
  Sparkles, 
  ClipboardCheck, 
  TrendingUp, 
  MessageSquareText, 
  FileText,
  Volume2,
  Camera,
  MapPin,
  Lightbulb,
  Waves,
  Construction,
  Trash2,
  Droplets,
  Award,
  ChevronRight,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { PROBLEM_DOMAINS } from '../data/problemDomains';
import { SpecializedProblemAIModal } from './SpecializedProblemAIModal';

interface HomeScreenProps {
  navigate: (route: string) => void;
  onExploreServices?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  navigate,
  onExploreServices,
}) => {
  const [specializedModalOpen, setSpecializedModalOpen] = useState(false);
  const [modalDomainKey, setModalDomainKey] = useState<string>('street_lights');

  const handleLaunchDomainAI = (domainKey: string) => {
    setModalDomainKey(domainKey);
    setSpecializedModalOpen(true);
  };

  return (
    <div className="w-full bg-[#FAFCFF] min-h-[calc(100vh-140px)] flex flex-col justify-between" id="home-screen-container">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column Text & CTAs */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-900 text-xs font-bold border border-blue-200 shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-blue-700" />
                <span>NMC Spatial Intelligence • Live City Hotspot Map</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-[#0B1E38] tracking-tight leading-[1.15]">
                Your City. Your Problem. <br />
                <span className="text-[#0B1E38]">One Dedicated AI Per Objective.</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Real-time problem-solving AI specialized for Street Lights, Floods & Drainage, Potholes, Waste Management, Water Supply, and Certificates.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => navigate('/hotspots')}
                className="flex items-center gap-2 px-5 py-3.5 bg-[#0B1E38] hover:bg-[#152e52] text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                id="hero-hotspots-map-button"
              >
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Explore Hotspot Map</span>
              </button>

              <button
                onClick={() => navigate('/talk')}
                className="flex items-center gap-2 px-5 py-3.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                id="hero-talk-to-nagpursetu-button"
              >
                <Mic className="w-4 h-4 text-white" />
                <span>Voice Assistance AI</span>
              </button>

              <button
                onClick={() => navigate('/complaints')}
                className="px-5 py-3.5 border-2 border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                id="hero-report-complaint-button"
              >
                Report Grievance
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Quick Objective Solver Launcher */}
          <div className="lg:col-span-6">
            <div className="bg-gradient-to-br from-[#0B1E38] to-[#1E3A8A] border border-slate-700 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                  <h3 className="text-base sm:text-lg font-extrabold text-white">
                    Specialized Problem-Solving AI Solvers
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-amber-300 text-[10px] font-mono font-bold">
                  8 Real-Time Models
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Select your specific civic problem to open a dedicated AI tuned strictly for that objective with live diagnostics:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {[
                  { key: 'street_lights', label: 'Street Lights', icon: Lightbulb, color: 'text-amber-300' },
                  { key: 'flood_drainage', label: 'Flood & Drains', icon: Waves, color: 'text-cyan-300' },
                  { key: 'potholes_roads', label: 'Potholes & Roads', icon: Construction, color: 'text-orange-300' },
                  { key: 'garbage_waste', label: 'Garbage & Waste', icon: Trash2, color: 'text-emerald-300' },
                  { key: 'water_supply', label: 'Water Leakages', icon: Droplets, color: 'text-blue-300' },
                  { key: 'certificates', label: 'Certificates', icon: Award, color: 'text-purple-300' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleLaunchDomainAI(item.key)}
                      className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-left transition-all hover:scale-102 flex flex-col justify-between group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-5 h-5 ${item.color}`} />
                        <ChevronRight className="w-3.5 h-3.5 text-white/50 group-hover:text-white" />
                      </div>
                      <div className="mt-2 text-xs font-bold text-white group-hover:text-amber-200">
                        {item.label} AI
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-blue-200 border-t border-white/10">
                <span>⚡ Real-time work order generation</span>
                <span className="font-bold text-amber-300">Marathi, Hindi & English</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Citizen Portal Sections */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full border-t border-slate-200/80">
        <div className="text-center space-y-1.5 mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-block">
            NMC Citizen Assistance Hub
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1E38]">
            Four Core Pillars of NagpurSetu
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto">
            Directly connect with municipal services, welfare schemes, official certificates, and neighborhood grievance resolution.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1: Solutions */}
          <div
            onClick={() => navigate('/services')}
            className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            id="portal-card-solutions"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0B1E38] group-hover:text-blue-900 transition-colors">
                  1. Solutions Finder
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Find the exact government or municipal service using assisted conversational AI.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-900">
              <span>Explore Solutions</span>
              <span>→</span>
            </div>
          </div>

          {/* Pillar 2: Schemes */}
          <div
            onClick={() => navigate('/schemes')}
            className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            id="portal-card-schemes"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0B1E38] group-hover:text-amber-900 transition-colors">
                  2. Government Schemes
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  PMAY housing, PM Surya Ghar solar, MJPJAY health insurance, and SVANidhi subsidies.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-900">
              <span>View Verified Schemes</span>
              <span>→</span>
            </div>
          </div>

          {/* Pillar 3: Certificates */}
          <div
            onClick={() => navigate('/certificates')}
            className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            id="portal-card-certificates"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0B1E38] group-hover:text-emerald-900 transition-colors">
                  3. Certificates Guide
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Income, Domicile, Caste, Non-Creamy Layer, Birth & Death certificates and proofs.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-900">
              <span>Check Required Documents</span>
              <span>→</span>
            </div>
          </div>

          {/* Pillar 4: Complaints & Hotspot Map */}
          <div
            onClick={() => navigate('/hotspots')}
            className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            id="portal-card-hotspots"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0B1E38] group-hover:text-blue-900 transition-colors">
                  4. Civic Hotspot Map
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Interactive city geospatial aerial map with verified field photo incidents and single-objective filters.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-900">
              <span>Explore Hotspot Map</span>
              <span>→</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1E38]">
            How It Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            From an objective-focused AI diagnostic to real-time ground squad action.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 hover:border-slate-300 transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900">Pick Your Objective</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Select Streetlight, Flood, Pothole, Water, or Waste to launch that specific domain AI.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 hover:border-slate-300 transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900">Live AI Diagnostics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dedicated model analyzes severity, required equipment, safety alerts, and SLA in real time.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 hover:border-slate-300 transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900">Geospatial Corroboration</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Confirm spot location and review photo evidence on the city map to elevate NMC control room priority.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 hover:border-slate-300 transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              4
            </div>
            <h3 className="text-base font-bold text-slate-900">Rapid Squad Dispatch</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hydraulic ladders, Jetpatchers, or dewatering pumps dispatched to your exact coordinates.
            </p>
          </div>
        </div>
      </section>

      {/* Specialized Problem Solving AI Modal */}
      {specializedModalOpen && (
        <SpecializedProblemAIModal
          initialDomainKey={modalDomainKey}
          initialLocation="Sitabuldi, Nagpur"
          initialWard="Dharampeth (Ward 2)"
          onClose={() => setSpecializedModalOpen(false)}
          navigate={navigate}
        />
      )}
    </div>
  );
};
