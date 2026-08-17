import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, 
  MapPin, 
  AlertTriangle, 
  ChevronRight, 
  Download, 
  ShieldAlert, 
  Clock, 
  Filter, 
  Search, 
  CheckCircle2, 
  ThumbsUp, 
  Layers, 
  ArrowRight, 
  TrendingUp, 
  Building, 
  Sparkles, 
  Compass, 
  X,
  Lightbulb,
  Waves,
  Construction,
  Trash2,
  Droplets,
  Trees,
  Truck,
  PhoneCall,
  Award,
  Camera
} from 'lucide-react';
import { HOTSPOT_CLUSTERS, WARD_AREA_ANALYTICS } from '../data/initialData';
import { HotspotCluster, CaseItem, ComplaintCategory, WardAreaStats } from '../types';
import { StorageService, subscribeToStorage } from '../services/storage';
import { SnapchatPhotoMap } from './SnapchatPhotoMap';
import { SpecializedProblemAIModal } from './SpecializedProblemAIModal';
import { PROBLEM_DOMAINS, SnapPhotoIncident } from '../data/problemDomains';

interface HotspotsScreenProps {
  navigate: (route: string) => void;
}

export const HotspotsScreen: React.FC<HotspotsScreenProps> = ({ navigate }) => {
  const [cases, setCases] = useState<CaseItem[]>(() => StorageService.getCases());
  const [selectedProblemType, setSelectedProblemType] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<SnapPhotoIncident | null>(null);
  
  // Dedicated Problem AI Modal State
  const [specializedModalOpen, setSpecializedModalOpen] = useState(false);
  const [modalDomainKey, setModalDomainKey] = useState<string>('street_lights');
  const [modalLocation, setModalLocation] = useState<string>('Sitabuldi, Nagpur');
  const [modalWard, setModalWard] = useState<string>('Dharampeth (Ward 2)');

  // Spot confirmed notification
  const [spotConfirmedMsg, setSpotConfirmedMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToStorage(() => {
      setCases(StorageService.getCases());
    });
    return unsub;
  }, []);

  const handleLaunchAI = (domainId: string, location: string, ward: string) => {
    setModalDomainKey(domainId);
    setModalLocation(location);
    setModalWard(ward);
    setSpecializedModalOpen(true);
  };

  const handleSpotConfirmed = (lat: number, lng: number, placeName: string) => {
    setSpotConfirmedMsg(`Spot locked at ${placeName} (${lat.toFixed(4)}, ${lng.toFixed(4)}). Ward squad notified!`);
    setTimeout(() => setSpotConfirmedMsg(null), 4000);
  };

  return (
    <div className="w-full bg-[#FAFCFF] min-h-[calc(100vh-140px)] py-8 px-4 sm:px-6 lg:px-8" id="hotspots-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 mb-1">
              <span className="cursor-pointer hover:underline" onClick={() => navigate('/')}>Home</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span>Civic Problem Hotspot Map</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1E38] tracking-tight">
                Nagpur Civic Geospatial & Hotspot Map
              </h1>
              <span className="px-2.5 py-1 bg-blue-900 text-white rounded-full text-xs font-bold shrink-0 shadow-2xs">
                Live Geotagged Intelligence
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Real-time interactive geospatial city map with verified field photo incidents, waterlogging depth indices, streetlight outage markers, and domain-specialized problem resolution AI.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLaunchAI('street_lights', 'Sitabuldi, Nagpur', 'Dharampeth (Ward 2)')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0B1E38] hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Launch Problem Solving AI</span>
            </button>
            <button
              onClick={() => navigate('/complaints')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-800 transition-colors"
            >
              <MapPin className="w-4 h-4 text-blue-200" />
              <span>Report at Location</span>
            </button>
          </div>
        </div>

        {/* Spot Confirmation Success Toast */}
        {spotConfirmedMsg && (
          <div className="p-4 bg-emerald-500 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-between shadow-lg animate-fade-in border border-emerald-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-slate-950 shrink-0" />
              <span>{spotConfirmedMsg}</span>
            </div>
            <button onClick={() => setSpotConfirmedMsg(null)} className="text-slate-950 hover:text-slate-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Specialized Problem Objective AI Fast Launch Bar */}
        <div className="bg-gradient-to-r from-[#0B1E38] to-[#172554] p-5 sm:p-6 rounded-3xl text-white space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  Specialized Problem-Solving AI (One AI Per Civic Objective)
                </h2>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Every objective has a domain-expert AI: Streetlights, Flood/Drainage, Potholes, Garbage, Water Supply, and Certificates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {PROBLEM_DOMAINS.slice(0, 6).map((dom) => (
              <button
                key={dom.id}
                onClick={() => {
                  setSelectedProblemType(dom.snapFilterKey);
                  handleLaunchAI(dom.key, 'Sitabuldi, Nagpur', 'Dharampeth (Ward 2)');
                }}
                className="bg-white/10 hover:bg-white/20 border border-white/15 p-3 rounded-2xl text-left transition-all hover:scale-102 flex flex-col justify-between group cursor-pointer"
              >
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center font-bold">
                    {dom.key === 'street_lights' && <Lightbulb className="w-4 h-4" />}
                    {dom.key === 'flood_drainage' && <Waves className="w-4 h-4 text-cyan-300" />}
                    {dom.key === 'potholes_roads' && <Construction className="w-4 h-4 text-orange-300" />}
                    {dom.key === 'garbage_waste' && <Trash2 className="w-4 h-4 text-emerald-300" />}
                    {dom.key === 'water_supply' && <Droplets className="w-4 h-4 text-blue-300" />}
                    {dom.key === 'certificates' && <Award className="w-4 h-4 text-purple-300" />}
                  </div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-200">
                    {dom.title.replace(' AI', '')}
                  </div>
                  <div className="text-[10px] text-blue-200 truncate">
                    {dom.marathiTitle}
                  </div>
                </div>

                <div className="pt-2 text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                  <span>Open AI</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Civic Hotspot Map Component */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0B1E38] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-700" />
              <span>Interactive Nagpur Civic Incident Map</span>
            </h2>
            <span className="text-xs text-slate-500">
              Filter by objective to view ONLY that problem's live incidents on the map
            </span>
          </div>

          <SnapchatPhotoMap
            selectedProblemType={selectedProblemType}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            onLaunchDedicatedAI={handleLaunchAI}
            onSpotConfirmed={handleSpotConfirmed}
            heightClass="h-[540px]"
          />
        </div>

        {/* Area Wise Problem Analytics Table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0B1E38]">Area-Wise Nagpur Problem Analytics</h3>
              <p className="text-xs text-slate-500">Zonal complaint aggregation & community confirmation metrics across 10 NMC Wards</p>
            </div>
            <span className="text-xs font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
              10 Municipal Wards
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Ward / Zone</th>
                  <th className="py-2.5 px-3">Total Issues</th>
                  <th className="py-2.5 px-3">Active</th>
                  <th className="py-2.5 px-3">Resolved</th>
                  <th className="py-2.5 px-3">Community Weight</th>
                  <th className="py-2.5 px-3">Top Problem Domain</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {WARD_AREA_ANALYTICS.map((ws) => (
                  <tr key={ws.ward} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{ws.ward}</td>
                    <td className="py-2.5 px-3">{ws.totalProblems}</td>
                    <td className="py-2.5 px-3 text-red-600 font-bold">{ws.activeProblems}</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-bold">{ws.resolvedProblems}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-900 font-bold rounded-md">
                        {ws.confirmations} conf.
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{ws.topCategory}</td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => {
                          const domKey = ws.topCategory.toLowerCase().includes('light') 
                            ? 'street_lights' 
                            : ws.topCategory.toLowerCase().includes('drain') || ws.topCategory.toLowerCase().includes('water')
                            ? 'flood_drainage'
                            : ws.topCategory.toLowerCase().includes('road')
                            ? 'potholes_roads'
                            : 'garbage_waste';
                          handleLaunchAI(domKey, ws.area || 'Nagpur', ws.ward);
                        }}
                        className="px-2.5 py-1 bg-[#0B1E38] text-white text-[11px] font-bold rounded-lg hover:bg-blue-900 flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Solve AI</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Specialized Problem Solving AI Modal */}
      {specializedModalOpen && (
        <SpecializedProblemAIModal
          initialDomainKey={modalDomainKey}
          initialLocation={modalLocation}
          initialWard={modalWard}
          onClose={() => setSpecializedModalOpen(false)}
          navigate={navigate}
        />
      )}
    </div>
  );
};
