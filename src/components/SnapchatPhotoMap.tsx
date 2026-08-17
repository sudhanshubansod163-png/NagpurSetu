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
  Compass,
  AlertTriangle,
  User,
  ShieldCheck,
  Sliders,
  Activity,
  Zap,
  Rotate3d,
  Box
} from 'lucide-react';
import { SNAP_PHOTO_INCIDENTS, SnapPhotoIncident } from '../data/problemDomains';
import { StorageService, subscribeToStorage } from '../services/storage';
import { NAGPUR_LOCALITIES } from './NagpurMapViewer';
import { CaseItem } from '../types';

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
  heightClass = 'h-[620px]',
  allowSpotConfirmation = true,
  onSpotConfirmed,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const heatLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeFilter, setActiveFilter] = useState<string>(selectedProblemType);
  const [mapTileStyle, setMapTileStyle] = useState<'3dDark' | 'satellite' | 'street'>('3dDark');
  const [selectedStory, setSelectedStory] = useState<SnapPhotoIncident | null>(null);
  const [showThermalHeatmap, setShowThermalHeatmap] = useState<boolean>(true);
  const [heatIntensity, setHeatIntensity] = useState<number>(0.85);
  const [view3DMode, setView3DMode] = useState<'flat' | 'isometric' | 'perspective'>('isometric');
  const [tiltAngle, setTiltAngle] = useState<number>(38);
  const [confirmToast, setConfirmToast] = useState<string | null>(null);
  const [userCustomPin, setUserCustomPin] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [realCases, setRealCases] = useState<CaseItem[]>(() => StorageService.getCases());

  // Real-time synchronization with Firestore and LocalStorage
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

  // Adjust tilt angle based on 3D mode
  useEffect(() => {
    if (view3DMode === 'flat') setTiltAngle(0);
    else if (view3DMode === 'isometric') setTiltAngle(38);
    else if (view3DMode === 'perspective') setTiltAngle(52);
  }, [view3DMode]);

  // Coordinate resolver for any complaint from any device
  const resolveCoordsForCase = (c: CaseItem, index: number): { lat: number; lng: number } => {
    if (typeof c.lat === 'number' && !isNaN(c.lat) && c.lat > 20.8 && c.lat < 21.4 &&
        typeof c.lng === 'number' && !isNaN(c.lng) && c.lng > 78.8 && c.lng < 79.4) {
      return { lat: c.lat, lng: c.lng };
    }

    const locStr = ((c.location || '') + ' ' + (c.ward || '')).toLowerCase();
    const matched = NAGPUR_LOCALITIES.find(nl => 
      locStr.includes(nl.name.toLowerCase().split(',')[0].toLowerCase()) ||
      (nl.landmark && locStr.includes(nl.landmark.toLowerCase().split('/')[0].trim())) ||
      locStr.includes(nl.ward.toLowerCase().split('(')[0].trim())
    );

    const baseLat = matched ? matched.lat : 21.1458;
    const baseLng = matched ? matched.lng : 79.0882;

    const seed = (c.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + (index * 17);
    const offsetLat = ((seed % 19) - 9) * 0.0006;
    const offsetLng = (((seed * 7) % 19) - 9) * 0.0006;

    return { lat: baseLat + offsetLat, lng: baseLng + offsetLng };
  };

  // Convert real cases into live problem incidents
  const liveIncidents: SnapPhotoIncident[] = realCases.map((c, idx) => {
    let probType: SnapPhotoIncident['problemType'] = 'pothole';
    const catLower = (c.category || '').toLowerCase() + ' ' + (c.department || '').toLowerCase() + ' ' + (c.title || '').toLowerCase();
    
    if (catLower.includes('street') || catLower.includes('light') || catLower.includes('electric') || catLower.includes('pole')) {
      probType = 'streetlight';
    } else if (catLower.includes('drain') || catLower.includes('flood') || catLower.includes('waterlog') || catLower.includes('sewage') || catLower.includes('manhole')) {
      probType = 'flood';
    } else if (catLower.includes('waste') || catLower.includes('garbage') || catLower.includes('kachra') || catLower.includes('safai') || catLower.includes('dump')) {
      probType = 'garbage';
    } else if (catLower.includes('water') || catLower.includes('pipe') || catLower.includes('leak') || catLower.includes('tanker')) {
      probType = 'water';
    } else if (catLower.includes('tree') || catLower.includes('branch') || catLower.includes('garden')) {
      probType = 'trees';
    } else {
      probType = 'pothole';
    }

    const { lat, lng } = resolveCoordsForCase(c, idx);
    const photo = (c.attachments && c.attachments.length > 0 && c.attachments[0].url) 
      ? c.attachments[0].url 
      : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';

    return {
      id: c.id,
      title: c.title || `Complaint #${c.id}`,
      problemType: probType,
      domainId: probType === 'streetlight' ? 'street_lights' : probType === 'flood' ? 'flood_drainage' : probType === 'garbage' ? 'garbage_waste' : probType === 'water' ? 'water_supply' : 'potholes_roads',
      categoryLabel: c.category || 'Civic Problem',
      locationName: c.location || 'Nagpur Central',
      ward: c.ward || 'Dharampeth (Ward 2)',
      lat,
      lng,
      photoUrl: photo,
      thumbnailUrl: photo,
      reportedAgo: c.createdAt ? new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today',
      confirmationsCount: c.confirmationsCount || Math.floor(Math.random() * 5) + 3,
      severity: (c.priority?.toLowerCase() === 'critical' || c.priority?.toLowerCase() === 'high' ? 'high' : c.priority?.toLowerCase() === 'low' ? 'low' : 'medium') as 'high' | 'medium' | 'low',
      aiDiagnosis: c.description || c.title,
      assignedUnit: c.assignedOfficer ? `${c.assignedOfficer} (${c.department || 'NMC'})` : (c.department || 'NMC Rapid Squad'),
      status: c.status === 'Resolved' ? 'Resolved' : c.status === 'In Progress' ? 'Squad Dispatched' : 'Investigating',
      storyAuthor: c.citizenName ? `Citizen ${c.citizenName}` : 'Nagpur Citizen',
      storyAuthorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
      potholeDepthInches: probType === 'pothole' ? 3.5 : undefined,
      waterLevelInches: probType === 'flood' ? 5.0 : undefined,
      lightStatus: probType === 'streetlight' ? 'Non-Functional Dark Spot' : undefined
    };
  });

  // Combine real complaints with verified baseline hotspots
  const existingIds = new Set(liveIncidents.map(i => i.id));
  const allIncidents = [
    ...liveIncidents,
    ...SNAP_PHOTO_INCIDENTS.filter(b => !existingIds.has(b.id))
  ];

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
    }).addTo(map);

    // Heat layer group below markers
    const heatGroup = L.layerGroup().addTo(map);
    heatLayerGroupRef.current = heatGroup;

    // Markers layer group on top
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Handle map click for spot selection
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

    renderLayers();
  }, [mapTileStyle]);

  // Render 3D Problem Signs & Geospatial Thermal Heatmap
  const renderLayers = () => {
    if (!mapInstanceRef.current || !markersLayerGroupRef.current || !heatLayerGroupRef.current) return;
    markersLayerGroupRef.current.clearLayers();
    heatLayerGroupRef.current.clearLayers();

    // 1. Render Multi-Stop Thermal Heatmap (Like the photo)
    if (showThermalHeatmap) {
      filteredIncidents.forEach((inc) => {
        const weight = Math.min(inc.confirmationsCount, 30);
        const baseRadius = 180 + (weight * 14);

        // Core color mapping based on problem type
        let coreColor = '#EF4444'; // Red hot center default
        let midColor = '#F97316';  // Orange
        let outerColor = '#FACC15'; // Yellow
        let edgeColor = '#06B6D4'; // Cyan aura

        if (inc.problemType === 'flood') {
          coreColor = '#0284C7';
          midColor = '#06B6D4';
          outerColor = '#38BDF8';
          edgeColor = '#7DD3FC';
        } else if (inc.problemType === 'streetlight') {
          coreColor = '#F59E0B';
          midColor = '#FBBF24';
          outerColor = '#FDE047';
          edgeColor = '#FEF08A';
        } else if (inc.problemType === 'pothole') {
          coreColor = '#EA580C';
          midColor = '#F97316';
          outerColor = '#FB923C';
          edgeColor = '#FDBA74';
        } else if (inc.problemType === 'garbage') {
          coreColor = '#059669';
          midColor = '#10B981';
          outerColor = '#34D399';
          edgeColor = '#6EE7B7';
        }

        // 3 concentric thermal dispersion rings
        const outerCircle = L.circle([inc.lat, inc.lng], {
          radius: baseRadius * 1.8,
          color: edgeColor,
          fillColor: edgeColor,
          fillOpacity: 0.12 * heatIntensity,
          weight: 0,
          interactive: false
        });

        const midCircle = L.circle([inc.lat, inc.lng], {
          radius: baseRadius * 1.1,
          color: outerColor,
          fillColor: midColor,
          fillOpacity: 0.25 * heatIntensity,
          weight: 0,
          interactive: false
        });

        const coreCircle = L.circle([inc.lat, inc.lng], {
          radius: baseRadius * 0.45,
          color: coreColor,
          fillColor: coreColor,
          fillOpacity: 0.48 * heatIntensity,
          weight: 1,
          interactive: false
        });

        outerCircle.addTo(heatLayerGroupRef.current!);
        midCircle.addTo(heatLayerGroupRef.current!);
        coreCircle.addTo(heatLayerGroupRef.current!);
      });
    }

    // 2. Render Problem-Wise 3D Illuminated Signs
    filteredIncidents.forEach((inc) => {
      // Configuration per problem sign
      let signIcon = '🕳️';
      let signLabel = 'Pothole Crater';
      let themeColor = '#F97316'; // Orange
      let badgeMetric = inc.potholeDepthInches ? `${inc.potholeDepthInches}" Depth` : 'Crater Alert';

      if (inc.problemType === 'streetlight') {
        signIcon = '💡';
        signLabel = 'Outage Dark Spot';
        themeColor = '#F59E0B'; // Amber
        badgeMetric = 'Zero Lumens';
      } else if (inc.problemType === 'flood') {
        signIcon = '🌊';
        signLabel = 'Flood Inundation';
        themeColor = '#06B6D4'; // Cyan
        badgeMetric = inc.waterLevelInches ? `${inc.waterLevelInches}" Surge` : 'Waterlogged';
      } else if (inc.problemType === 'garbage') {
        signIcon = '🗑️';
        signLabel = 'Solid Waste Dump';
        themeColor = '#10B981'; // Emerald
        badgeMetric = inc.wasteTonsEst ? `${inc.wasteTonsEst}T Waste` : 'Overflow';
      } else if (inc.problemType === 'water') {
        signIcon = '🚰';
        signLabel = 'Pipeline Fracture';
        themeColor = '#3B82F6'; // Blue
        badgeMetric = 'Hydro Burst';
      } else if (inc.problemType === 'trees') {
        signIcon = '🌳';
        signLabel = 'Tree Obstruction';
        themeColor = '#84CC16'; // Lime
        badgeMetric = '11kV Hazard';
      }

      const isLiveCase = inc.id.startsWith('NS-') || inc.id.startsWith('case-') || inc.id.includes('202');

      const markerHtml = `
        <div class="municipal-3d-sign-wrapper relative group cursor-pointer transition-transform duration-300 hover:scale-115" style="transform: translate(-50%, -100%);">
          
          <!-- 3D Ground Shadow & Thermal Halo -->
          <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-black/60 rounded-full blur-xs pointer-events-none"></div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full animate-ping opacity-40 pointer-events-none" style="background-color: ${themeColor};"></div>

          <!-- Elevated 3D Sign Board Card -->
          <div class="relative bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-1.5 shadow-2xl border-2 flex items-center gap-2 max-w-[190px] select-none" style="border-color: ${themeColor}; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.6), 0 0 15px ${themeColor}40;">
            
            <!-- Left: Problem Sign Emblem with Status Ring -->
            <div class="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-inner text-base font-bold" style="background: radial-gradient(circle, ${themeColor}30 0%, #0F172A 100%); border: 1.5px solid ${themeColor};">
              <span class="z-10">${signIcon}</span>
              ${isLiveCase ? `
                <div class="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
              ` : ''}
            </div>

            <!-- Middle: Problem Details & Locality -->
            <div class="flex-1 min-w-0 pr-1">
              <div class="flex items-center justify-between gap-1 leading-none mb-1">
                <span class="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md" style="background-color: ${themeColor}25; color: ${themeColor}; border: 1px solid ${themeColor}50;">
                  ${badgeMetric}
                </span>
                <span class="text-[8px] font-bold text-amber-400 flex items-center gap-0.5">
                  🔥 ${inc.confirmationsCount}
                </span>
              </div>
              <div class="text-[11px] font-bold text-white truncate leading-tight">
                ${inc.locationName.split(',')[0]}
              </div>
              <div class="text-[9px] text-slate-400 truncate">
                ${inc.ward.split('(')[0]}
              </div>
            </div>

            <!-- Right: Photo Evidence Thumbnail Circle -->
            <div class="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-slate-600 bg-black">
              <img src="${inc.thumbnailUrl}" alt="${inc.title}" class="w-full h-full object-cover" />
            </div>

          </div>

          <!-- 3D Sign Stem & Anchor Pin -->
          <div class="w-0.5 h-3 bg-gradient-to-b from-slate-400 to-transparent mx-auto"></div>
          <div class="w-2.5 h-2.5 rounded-full mx-auto shadow-md" style="background-color: ${themeColor}; box-shadow: 0 0 8px ${themeColor};"></div>

        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'municipal-3d-marker',
        iconSize: [190, 68],
        iconAnchor: [95, 68]
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
          <div class="px-2.5 py-1 rounded-xl bg-blue-600 text-white text-[10px] font-black shadow-2xl border border-blue-400 whitespace-nowrap mb-1 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Target Spot Locked</span>
          </div>
          <div class="w-8 h-8 rounded-full bg-red-600 border-2 border-white text-white flex items-center justify-center shadow-2xl animate-bounce text-sm">
            📍
          </div>
        </div>
      `;

      const userIcon = L.divIcon({
        html: userPinHtml,
        className: 'user-pin-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      L.marker([userCustomPin.lat, userCustomPin.lng], { icon: userIcon })
        .addTo(markersLayerGroupRef.current!);
    }
  };

  useEffect(() => {
    renderLayers();
  }, [filteredIncidents, showThermalHeatmap, heatIntensity, userCustomPin]);

  // Recenter to user or Nagpur center
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
    <div className="w-full space-y-3 select-none" id="municipal-3d-hotspot-map">
      
      {/* Top Filter Strip: Objective Selection */}
      <div className="bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl border border-slate-700/80 shadow-md flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 px-2 flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber-400" />
            Domain Filter:
          </span>

          {[
            { id: 'all', label: '🌐 All Civic Hotspots', color: 'bg-slate-700 text-white' },
            { id: 'pothole', label: '🕳️ Potholes & Roads', color: 'bg-orange-500 text-white font-black' },
            { id: 'streetlight', label: '💡 Street Lights', color: 'bg-amber-500 text-slate-950 font-black' },
            { id: 'flood', label: '🌊 Flood & Drains', color: 'bg-cyan-500 text-slate-950 font-black' },
            { id: 'garbage', label: '🗑️ Garbage & Waste', color: 'bg-emerald-500 text-slate-950 font-black' },
            { id: 'water', label: '🚰 Water Leakage', color: 'bg-blue-500 text-white font-black' },
            { id: 'trees', label: '🌳 Tree Hazards', color: 'bg-lime-500 text-slate-950 font-black' },
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

        {/* 3D Perspective & Map Layer Controls */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          
          {/* 3D Perspective Toggle Button */}
          <div className="flex items-center gap-0.5 bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-[11px] font-bold">
            <button
              onClick={() => setView3DMode('flat')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${view3DMode === 'flat' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
              title="2D Top-Down View"
            >
              2D Plan
            </button>
            <button
              onClick={() => setView3DMode('isometric')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${view3DMode === 'isometric' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
              title="3D Isometric Tactical View"
            >
              <Rotate3d className="w-3.5 h-3.5" />
              <span>3D Iso</span>
            </button>
            <button
              onClick={() => setView3DMode('perspective')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${view3DMode === 'perspective' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
              title="3D Deep Perspective View"
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Deep</span>
            </button>
          </div>

          {/* Map Base Tile Layers */}
          <div className="flex items-center gap-0.5 bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-[11px] font-bold">
            <button
              onClick={() => setMapTileStyle('3dDark')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${mapTileStyle === '3dDark' ? 'bg-slate-700 text-amber-300' : 'text-slate-300 hover:text-white'}`}
            >
              Command Dark
            </button>
            <button
              onClick={() => setMapTileStyle('satellite')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${mapTileStyle === 'satellite' ? 'bg-slate-700 text-amber-300' : 'text-slate-300 hover:text-white'}`}
            >
              Satellite
            </button>
          </div>

        </div>
      </div>

      {/* 3D Map Viewport Container */}
      <div 
        className={`relative w-full ${heightClass} rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-[#090D16]`}
        style={{ perspective: '1200px' }}
      >
        
        {/* 3D Tilted Map Stage Canvas */}
        <div 
          className="w-full h-full transition-transform duration-700 ease-out origin-bottom"
          style={{
            transform: tiltAngle > 0 ? `rotateX(${tiltAngle}deg) scale(1.06)` : 'none',
            transformStyle: 'preserve-3d'
          }}
        >
          <div ref={mapContainerRef} className="w-full h-full z-0" />
        </div>

        {/* Floating Top HUD Banner */}
        <div className="absolute top-3 left-3 z-10 bg-slate-950/85 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl border border-white/15 shadow-xl flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-extrabold text-white">
              {filteredIncidents.length} {activeFilter === 'all' ? 'Active Civic Hotspots' : `${activeFilter.toUpperCase()} Signs`}
            </span>
          </div>
          <span className="text-slate-400 hidden sm:inline">| Live 3D Spatial Sync Enabled</span>
        </div>

        {/* Floating Map Controls (Right Side) */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          
          <button
            onClick={handleRecenter}
            className="p-2.5 bg-slate-950/85 hover:bg-slate-900 text-white rounded-2xl shadow-xl border border-white/20 transition-all cursor-pointer"
            title="Recenter to GPS Location"
          >
            <Navigation className="w-4 h-4 text-amber-400" />
          </button>

          {/* Thermal Heatmap Toggle */}
          <button
            onClick={() => setShowThermalHeatmap(!showThermalHeatmap)}
            className={`p-2.5 rounded-2xl shadow-xl border transition-all cursor-pointer ${
              showThermalHeatmap
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/30 font-bold'
                : 'bg-slate-950/85 text-slate-300 border-white/20 hover:bg-slate-900'
            }`}
            title="Toggle Thermal Heatmap Dispersion"
          >
            <Flame className="w-4 h-4" />
          </button>

          {/* 3D Tilt Angle Cycler */}
          <button
            onClick={() => {
              if (view3DMode === 'flat') setView3DMode('isometric');
              else if (view3DMode === 'isometric') setView3DMode('perspective');
              else setView3DMode('flat');
            }}
            className="p-2.5 bg-slate-950/85 hover:bg-slate-900 text-white rounded-2xl shadow-xl border border-white/20 transition-all cursor-pointer flex items-center justify-center"
            title="Cycle 3D Perspective Tilt"
          >
            <Rotate3d className="w-4 h-4 text-cyan-400" />
          </button>
        </div>

        {/* Heatmap Legend Bar (Bottom Left) */}
        {showThermalHeatmap && (
          <div className="absolute bottom-20 sm:bottom-4 left-4 z-10 bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700 text-[10px] text-white shadow-xl flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-bold">Density:</span>
            <div className="flex items-center gap-1">
              <span className="text-cyan-400">Low</span>
              <div className="w-16 h-2 rounded-full bg-gradient-to-r from-cyan-500 via-yellow-400 to-red-500 border border-slate-700"></div>
              <span className="text-red-400 font-bold">Critical Hotspot</span>
            </div>
          </div>
        )}

        {/* Bottom Floating Command & Spot Confirmation Bar */}
        {allowSpotConfirmation && (
          <div className="absolute bottom-4 inset-x-4 z-10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/92 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 shadow-2xl text-white">
            <div className="flex items-center gap-2.5 text-xs">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white">
                  {userCustomPin ? userCustomPin.name : selectedStory ? selectedStory.locationName : 'Tap any 3D problem sign or click anywhere to lock coordinates'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {selectedStory ? `Ward: ${selectedStory.ward} • ${selectedStory.confirmationsCount} Citizen Corroborations` : 'All real citizen submitted issues are displayed on this 3D map in real time.'}
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
                <span>Confirm Location</span>
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
          <button onClick={() => setConfirmToast(null)} className="text-slate-950 hover:text-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3D Incident Inspector & Dispatcher Modal */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4">
            
            {/* Top Header with Citizen & Status */}
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-900 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{selectedStory.storyAuthor}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-blue-600 text-[9px] font-bold uppercase text-white tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-300" />
                      Geotagged Incident
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
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
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
                <span className={`w-2 h-2 rounded-full ${selectedStory.status === 'Resolved' ? 'bg-emerald-400' : 'bg-amber-400'} animate-ping`} />
                <span>{selectedStory.status}</span>
              </div>

              <div className="absolute bottom-3 right-3 bg-amber-500 text-slate-950 px-2.5 py-1 rounded-xl text-xs font-black shadow-lg">
                🔥 {selectedStory.confirmationsCount} Citizen Corroborations
              </div>
            </div>

            {/* AI Diagnostics & Work Order */}
            <div className="p-4 space-y-3 text-xs">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-bold text-[10px] uppercase border border-amber-400/30">
                    {selectedStory.categoryLabel}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: #{selectedStory.id}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{selectedStory.title}</h3>
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

              {/* Assigned Squad / Department */}
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Assigned Unit:</span>
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
                  className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Corroborate (+1)</span>
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
                    className="flex-1 py-2.5 bg-[#0B1E38] hover:bg-blue-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-blue-400/40 shadow-md cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Launch AI Resolver</span>
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
