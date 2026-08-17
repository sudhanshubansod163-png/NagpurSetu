import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Sparkles, 
  MapPin, 
  Layers, 
  Navigation, 
  Flame, 
  Filter, 
  CheckCircle2, 
  Camera, 
  X, 
  Clock, 
  Truck, 
  PhoneCall, 
  ShieldAlert, 
  Eye, 
  ChevronRight,
  Maximize2,
  Minimize2,
  Lightbulb,
  Waves,
  Construction,
  Trash2,
  Droplets,
  Trees,
  Compass
} from 'lucide-react';
import { SNAP_PHOTO_INCIDENTS, SnapPhotoIncident } from '../data/problemDomains';
import { StorageService, subscribeToStorage } from '../services/storage';

interface SnapchatPhotoMapProps {
  selectedProblemType?: string; // 'all' | 'streetlight' | 'flood' | 'pothole' | 'garbage' | 'water' | 'trees'
  onSelectIncident?: (incident: SnapPhotoIncident) => void;
  onLaunchDedicatedAI?: (domainId: string, location: string, ward: string) => void;
  heightClass?: string;
  allowSpotConfirmation?: boolean;
  onSpotConfirmed?: (lat: number, lng: number, placeName: string) => void;
}

export const SnapchatPhotoMap: React.FC<SnapchatPhotoMapProps> = ({
  selectedProblemType = 'all',
  onSelectIncident,
  onLaunchDedicatedAI,
  heightClass = 'h-[520px]',
  allowSpotConfirmation = true,
  onSpotConfirmed,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeFilter, setActiveFilter] = useState<string>(selectedProblemType);
  const [mapTileStyle, setMapTileStyle] = useState<'snapDark' | 'satellite' | 'street'>('snapDark');
  const [selectedStory, setSelectedStory] = useState<SnapPhotoIncident | null>(null);
  const [showHeatPulse, setShowHeatPulse] = useState(true);
  const [confirmToast, setConfirmToast] = useState<string | null>(null);
  const [userCustomPin, setUserCustomPin] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [realCases, setRealCases] = useState<any[]>(() => StorageService.getCases());

  useEffect(() => {
    const refresh = () => setRealCases(StorageService.getCases());
    refresh();
    const unsub = subscribeToStorage(refresh);
    return () => unsub();
  }, []);

  // Sync prop changes
  useEffect(() => {
    if (selectedProblemType) {
      setActiveFilter(selectedProblemType);
    }
  }, [selectedProblemType]);

  // Convert real citizen cases to incidents
  const liveIncidents: SnapPhotoIncident[] = realCases.map((c) => {
    let probType: SnapPhotoIncident['problemType'] = 'pothole';
    const catLower = (c.category || '').toLowerCase();
    if (catLower.includes('street') || catLower.includes('light')) probType = 'streetlight';
    else if (catLower.includes('drain') || catLower.includes('flood') || catLower.includes('waterlog')) probType = 'flood';
    else if (catLower.includes('waste') || catLower.includes('garbage')) probType = 'garbage';
    else if (catLower.includes('water')) probType = 'water';
    else if (catLower.includes('tree')) probType = 'trees';

    return {
      id: `inc-${c.id}`,
      title: c.title,
      problemType: probType,
      domainId: probType === 'streetlight' ? 'street_lights' : probType === 'flood' ? 'flood_drainage' : probType === 'garbage' ? 'garbage_waste' : probType === 'water' ? 'water_supply' : 'potholes_roads',
      categoryLabel: c.category,
      locationName: c.location,
      ward: c.ward,
      lat: c.lat || 21.1458,
      lng: c.lng || 79.0882,
      photoUrl: c.photos?.[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      thumbnailUrl: c.photos?.[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=150&q=80',
      reportedAgo: c.createdAt || 'Recent',
      confirmationsCount: c.confirmationsCount || 1,
      severity: (c.severity?.toLowerCase() === 'critical' || c.severity?.toLowerCase() === 'high' ? 'high' : c.severity?.toLowerCase() === 'low' ? 'low' : 'medium') as 'high' | 'medium' | 'low',
      aiDiagnosis: c.summary || c.description,
      assignedUnit: c.assignedDepartment || 'NMC Rapid Squad',
      status: c.status === 'Resolved' ? 'Resolved' : c.status === 'In Progress' ? 'Squad Dispatched' : 'Investigating',
      storyAuthor: c.reportedBy?.name ? `Citizen ${c.reportedBy.name}` : 'Citizen Reporter',
      storyAuthorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'
    };
  });

  const allIncidents = [...SNAP_PHOTO_INCIDENTS, ...liveIncidents];

  // Filtered incidents: strictly shows ONLY the selected problem or all
  const filteredIncidents = activeFilter === 'all'
    ? allIncidents
    : allIncidents.filter(inc => inc.problemType === activeFilter);

  // Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const nagpurCoords: [number, number] = [21.1458, 79.0882];
    const map = L.map(mapContainerRef.current, {
      center: nagpurCoords,
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Default tile layer
    const getTileUrl = (style: string) => {
      if (style === 'satellite') {
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      }
      if (style === 'street') {
        return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      }
      // Snap Map Dark
      return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    };

    const tileLayer = L.tileLayer(getTileUrl(mapTileStyle), {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Handle user map clicks for spot confirmation
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setUserCustomPin({
        lat,
        lng,
        name: `Selected Spot (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tiles when style changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapInstanceRef.current?.removeLayer(layer);
      }
    });

    const getTileUrl = (style: string) => {
      if (style === 'satellite') {
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      }
      if (style === 'street') {
        return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      }
      return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    };

    L.tileLayer(getTileUrl(mapTileStyle), {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(mapInstanceRef.current);

    // Re-render markers on top
    renderMarkers();
  }, [mapTileStyle]);

  // Render Snapchat Style Photo Bubble Markers
  const renderMarkers = () => {
    if (!mapInstanceRef.current || !markersLayerGroupRef.current) return;
    markersLayerGroupRef.current.clearLayers();

    filteredIncidents.forEach((inc) => {
      const ringColor = inc.problemType === 'flood' 
        ? '#06B6D4' // Cyan
        : inc.problemType === 'streetlight'
        ? '#F59E0B' // Amber
        : inc.problemType === 'pothole'
        ? '#F97316' // Orange
        : inc.problemType === 'garbage'
        ? '#10B981' // Emerald
        : inc.problemType === 'water'
        ? '#3B82F6' // Blue
        : '#84CC16'; // Lime

      const iconHtml = `
        <div class="snap-map-bubble relative group cursor-pointer" style="transform: translate(-50%, -50%);">
          ${showHeatPulse ? `
            <div class="absolute -inset-3 rounded-full animate-ping opacity-40" style="background: ${ringColor};"></div>
            <div class="absolute -inset-2 rounded-full opacity-60 blur-xs" style="background: ${ringColor};"></div>
          ` : ''}
          
          <div class="relative w-12 h-12 rounded-full overflow-hidden shadow-2xl border-3 transition-transform duration-200 group-hover:scale-115" style="border-color: ${ringColor}; background-color: #0F172A;">
            <img src="${inc.thumbnailUrl}" alt="${inc.title}" class="w-full h-full object-cover" />
            
            <div class="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] font-black text-white text-center py-0.5 leading-none">
              ${inc.confirmationsCount}🔥
            </div>
          </div>

          <!-- Category floating pill -->
          <div class="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase text-slate-950 shadow-md flex items-center gap-0.5" style="background: ${ringColor};">
            <span>${inc.problemType}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'snap-leaflet-marker',
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      const marker = L.marker([inc.lat, inc.lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedStory(inc);
        if (onSelectIncident) onSelectIncident(inc);
      });

      marker.addTo(markersLayerGroupRef.current!);
    });

    // Custom user confirmed pin if active
    if (userCustomPin) {
      const userPinHtml = `
        <div class="relative flex flex-col items-center cursor-pointer" style="transform: translate(-50%, -100%);">
          <div class="px-2 py-0.5 rounded-md bg-white text-slate-950 text-[10px] font-bold shadow-lg border border-slate-300 whitespace-nowrap mb-1">
            Confirmed Spot
          </div>
          <div class="w-7 h-7 rounded-full bg-red-600 border-2 border-white text-white flex items-center justify-center shadow-xl animate-bounce">
            📍
          </div>
        </div>
      `;

      const userIcon = L.divIcon({
        html: userPinHtml,
        className: 'user-pin-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });

      L.marker([userCustomPin.lat, userCustomPin.lng], { icon: userIcon })
        .addTo(markersLayerGroupRef.current!);
    }
  };

  useEffect(() => {
    renderMarkers();
  }, [filteredIncidents, showHeatPulse, userCustomPin]);

  // Recenter to user / Nagpur center
  const handleRecenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          mapInstanceRef.current?.flyTo([latitude, longitude], 15, { duration: 1.2 });
        },
        () => {
          mapInstanceRef.current?.flyTo([21.1458, 79.0882], 13, { duration: 1.2 });
        }
      );
    } else {
      mapInstanceRef.current?.flyTo([21.1458, 79.0882], 13, { duration: 1.2 });
    }
  };

  const handleConfirmSpotAction = () => {
    if (selectedStory) {
      setConfirmToast(`Confirmed! Community weight incremented for "${selectedStory.title}".`);
      if (onSpotConfirmed) {
        onSpotConfirmed(selectedStory.lat, selectedStory.lng, selectedStory.locationName);
      }
    } else if (userCustomPin) {
      setConfirmToast(`Spot confirmed at [${userCustomPin.lat.toFixed(4)}, ${userCustomPin.lng.toFixed(4)}]!`);
      if (onSpotConfirmed) {
        onSpotConfirmed(userCustomPin.lat, userCustomPin.lng, userCustomPin.name);
      }
    } else {
      setConfirmToast('Spot confirmed for Nagpur Municipal dispatch!');
      if (onSpotConfirmed) {
        onSpotConfirmed(21.1458, 79.0833, 'Sitabuldi, Nagpur');
      }
    }

    setTimeout(() => setConfirmToast(null), 3500);
  };

  return (
    <div className="w-full space-y-3 select-none" id="snapchat-photo-map-container">
      
      {/* Category Filter Objective Strip */}
      <div className="bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-700/80 shadow-md flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 px-2 flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber-400" />
            Show Only:
          </span>

          {[
            { id: 'all', label: '🌐 All Problems', color: 'bg-slate-700 text-white' },
            { id: 'streetlight', label: '💡 Street Lights', color: 'bg-amber-500 text-slate-950 font-black' },
            { id: 'flood', label: '🌊 Flood & Drains', color: 'bg-cyan-500 text-slate-950 font-black' },
            { id: 'pothole', label: '🕳️ Potholes', color: 'bg-orange-500 text-white font-black' },
            { id: 'garbage', label: '🗑️ Garbage & Waste', color: 'bg-emerald-500 text-slate-950 font-black' },
            { id: 'water', label: '🚰 Water Leakage', color: 'bg-blue-500 text-white font-black' },
            { id: 'trees', label: '🌳 Tree Hazard', color: 'bg-lime-500 text-slate-950 font-black' },
          ].map((btn) => {
            const isSelected = activeFilter === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => setActiveFilter(btn.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? `${btn.color} ring-2 ring-white/50 scale-102 shadow-sm`
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Map Tile Layers */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-0.5 rounded-xl border border-slate-700 shrink-0 text-[11px] font-bold">
          <button
            onClick={() => setMapTileStyle('snapDark')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${mapTileStyle === 'snapDark' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
          >
            Dark Canvas
          </button>
          <button
            onClick={() => setMapTileStyle('satellite')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${mapTileStyle === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
          >
            Satellite Aerial
          </button>
          <button
            onClick={() => setMapTileStyle('street')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${mapTileStyle === 'street' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
          >
            Street Map
          </button>
        </div>
      </div>

      {/* Main Leaflet Map Canvas */}
      <div className={`relative w-full ${heightClass} rounded-3xl overflow-hidden shadow-xl border-2 border-slate-800 bg-[#0B132B]`}>
        
        {/* Leaflet DOM Node */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Top Stats Banner */}
        <div className="absolute top-3 left-3 z-10 bg-black/75 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl border border-white/15 shadow-lg flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
            <span className="font-bold">
              {filteredIncidents.length} {activeFilter === 'all' ? 'Civic Incidents' : `${activeFilter.toUpperCase()} Incidents`} Monitored
            </span>
          </div>
          <span className="text-slate-400 hidden sm:inline">| Tap any incident bubble to inspect & corroborate</span>
        </div>

        {/* Floating Map Controls (Right Side) */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          <button
            onClick={handleRecenter}
            className="p-2.5 bg-black/80 hover:bg-black text-white rounded-2xl shadow-lg border border-white/20 transition-all cursor-pointer"
            title="Recenter to GPS"
          >
            <Navigation className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={() => setShowHeatPulse(!showHeatPulse)}
            className={`p-2.5 rounded-2xl shadow-lg border transition-all cursor-pointer ${
              showHeatPulse
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/30'
                : 'bg-black/80 text-white border-white/20 hover:bg-black'
            }`}
            title="Toggle Heat Pulse"
          >
            <Flame className="w-4 h-4" />
          </button>
        </div>

        {/* Confirm Spot Bottom Floating Card if enabled */}
        {allowSpotConfirmation && (
          <div className="absolute bottom-4 inset-x-4 z-10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 shadow-2xl text-white">
            <div className="flex items-center gap-2.5 text-xs">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white">
                  {userCustomPin ? userCustomPin.name : selectedStory ? selectedStory.locationName : 'Click any spot on map to confirm location'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {selectedStory ? `Ward: ${selectedStory.ward} • ${selectedStory.confirmationsCount} Citizens Corroborated` : 'Spatial geotag will lock coordinates for rapid squad dispatch.'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleConfirmSpotAction}
                className="flex-1 sm:flex-none px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                id="confirm-spot-map-button"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Confirm This Spot</span>
              </button>

              {onLaunchDedicatedAI && (
                <button
                  onClick={() => {
                    const domId = selectedStory?.domainId || (activeFilter === 'flood' ? 'flood_drainage' : activeFilter === 'pothole' ? 'potholes_roads' : activeFilter === 'garbage' ? 'garbage_waste' : activeFilter === 'water' ? 'water_supply' : 'street_lights');
                    const loc = selectedStory?.locationName || (userCustomPin?.name) || 'Sitabuldi, Nagpur';
                    const wrd = selectedStory?.ward || 'Dharampeth (Ward 2)';
                    onLaunchDedicatedAI(domId, loc, wrd);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-[#0B1E38] hover:bg-blue-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-blue-400/30 shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Launch Problem AI</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Confirmation Toast */}
      {confirmToast && (
        <div className="p-3 bg-emerald-500 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-between shadow-lg animate-fade-in border border-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>{confirmToast}</span>
          </div>
          <button onClick={() => setConfirmToast(null)} className="text-slate-950 hover:text-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Snapchat Photo Story Inspector Modal */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4">
            
            {/* Story Top Header with Author */}
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStory.storyAuthorAvatar}
                  alt={selectedStory.storyAuthor}
                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-400"
                />
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{selectedStory.storyAuthor}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-blue-600 text-[9px] font-bold uppercase text-white tracking-wider">
                      Geotagged Report
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{selectedStory.reportedAgo}</span>
                    <span>• {selectedStory.locationName}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedStory(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Evidence View */}
            <div className="relative aspect-video w-full bg-black overflow-hidden group">
              <img
                src={selectedStory.photoUrl}
                alt={selectedStory.title}
                className="w-full h-full object-cover"
              />

              {/* Status Badge overlay */}
              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black border border-white/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>{selectedStory.status}</span>
              </div>

              <div className="absolute bottom-3 right-3 bg-amber-500 text-slate-950 px-2.5 py-1 rounded-xl text-xs font-black shadow-lg">
                🔥 {selectedStory.confirmationsCount} Citizens Confirmed
              </div>
            </div>

            {/* AI Diagnostics & Work Order */}
            <div className="p-4 space-y-3 text-xs">
              <div>
                <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-bold text-[10px] uppercase border border-amber-400/30">
                  {selectedStory.categoryLabel}
                </span>
                <h3 className="text-base font-bold text-white mt-1">{selectedStory.title}</h3>
                <p className="text-slate-300 mt-1 leading-relaxed">{selectedStory.aiDiagnosis}</p>
              </div>

              {/* Specific Problem Metrics */}
              {selectedStory.waterLevelInches && (
                <div className="bg-cyan-950/60 border border-cyan-500/40 p-2.5 rounded-xl text-cyan-200 font-bold flex items-center justify-between">
                  <span>Monsoon Waterlogging Depth:</span>
                  <span className="text-sm font-black text-cyan-300">{selectedStory.waterLevelInches} Inches</span>
                </div>
              )}

              {selectedStory.lightStatus && (
                <div className="bg-amber-950/60 border border-amber-500/40 p-2.5 rounded-xl text-amber-200 font-bold flex items-center justify-between">
                  <span>Streetlight Outage Assessment:</span>
                  <span className="text-xs font-black text-amber-300">{selectedStory.lightStatus}</span>
                </div>
              )}

              {selectedStory.potholeDepthInches && (
                <div className="bg-orange-950/60 border border-orange-500/40 p-2.5 rounded-xl text-orange-200 font-bold flex items-center justify-between">
                  <span>Crater Depth Index:</span>
                  <span className="text-sm font-black text-orange-300">{selectedStory.potholeDepthInches} Inches Deep</span>
                </div>
              )}

              {/* Assigned Vehicle */}
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Assigned Rapid Squad:</span>
                </span>
                <span className="font-bold text-white">{selectedStory.assignedUnit}</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    handleConfirmSpotAction();
                    setSelectedStory(null);
                  }}
                  className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm This Spot (+1)</span>
                </button>

                {onLaunchDedicatedAI && (
                  <button
                    onClick={() => {
                      const domId = selectedStory.domainId;
                      const loc = selectedStory.locationName;
                      const wrd = selectedStory.ward;
                      setSelectedStory(null);
                      onLaunchDedicatedAI(domId, loc, wrd);
                    }}
                    className="flex-1 py-2.5 bg-[#0B1E38] hover:bg-blue-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-blue-400/40 shadow-md"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Launch {selectedStory.categoryLabel} AI</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
