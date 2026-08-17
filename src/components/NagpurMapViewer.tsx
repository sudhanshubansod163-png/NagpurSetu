import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Search, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  LocateFixed,
  RotateCcw,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export interface NagpurLocation {
  name: string;
  landmark: string;
  ward: string;
  zone: string;
  lat: number;
  lng: number;
}

export const NAGPUR_LOCALITIES: NagpurLocation[] = [
  { name: 'Dharampeth, West High Court Road', landmark: 'Near Coffee House / Traffic Park', ward: 'Dharampeth (Ward 2)', zone: 'Zone 2 (Dharampeth)', lat: 21.1438, lng: 79.0645 },
  { name: 'Sitabuldi & Variety Square', landmark: 'Maharajbagh Rd / Central Interchange Metro', ward: 'Dharampeth (Ward 2)', zone: 'Zone 2 (Dharampeth)', lat: 21.1466, lng: 79.0806 },
  { name: 'Laxmi Nagar, 8-Rasta Chowk', landmark: 'Near VNIT Gate / Abhyankar Nagar', ward: 'Laxmi Nagar (Ward 1)', zone: 'Zone 1 (Laxmi Nagar)', lat: 21.1219, lng: 79.0669 },
  { name: 'Civil Lines & High Court Bench', landmark: 'Palm Road / Judicial Enclave / Collectorate', ward: 'Civil Lines (Ward 2)', zone: 'Zone 2 (Dharampeth)', lat: 21.1578, lng: 79.0734 },
  { name: 'Ramdaspeth & Central Bazaar Road', landmark: 'Near Hotel Centre Point / Lendra Park', ward: 'Dhantoli (Ward 4)', zone: 'Zone 4 (Dhantoli)', lat: 21.1352, lng: 79.0722 },
  { name: 'Dhantoli & Congress Nagar', landmark: 'Near Rahate Colony Metro / Yashwant Stadium', ward: 'Dhantoli (Ward 4)', zone: 'Zone 4 (Dhantoli)', lat: 21.1287, lng: 79.0851 },
  { name: 'Sadar Main Market & Residency Road', landmark: 'Near Liberty Cinema / Mount Road', ward: 'Mangalwari (Ward 10)', zone: 'Zone 10 (Mangalwari)', lat: 21.1645, lng: 79.0818 },
  { name: 'Mangalwari & Clark Town', landmark: 'Sadar Bazar connecting link / Zonal Office', ward: 'Mangalwari (Ward 10)', zone: 'Zone 10 (Mangalwari)', lat: 21.1712, lng: 79.0834 },
  { name: 'Mahal & Gandhi Gate Heritage', landmark: 'Old City Center / Tilak Statue / Town Hall', ward: 'Gandhibagh (Ward 6)', zone: 'Zone 6 (Gandhibagh)', lat: 21.1441, lng: 79.1098 },
  { name: 'Gandhibagh & Central Avenue', landmark: 'Near Agrasen Chowk / Dosar Bhavan', ward: 'Gandhibagh (Ward 6)', zone: 'Zone 6 (Gandhibagh)', lat: 21.1502, lng: 79.1012 },
  { name: 'Itwari Wholesale Market', landmark: 'Near Shahid Chowk / Kirana Oli / Sarafa', ward: 'Sataranjipura (Ward 7)', zone: 'Zone 7 (Sataranjipura)', lat: 21.1542, lng: 79.1165 },
  { name: 'Manish Nagar Main T-Point', landmark: 'Near Railway Crossing / Somalwada Link', ward: 'Laxmi Nagar (Ward 1)', zone: 'Zone 1 (Laxmi Nagar)', lat: 21.0963, lng: 79.0772 },
  { name: 'Pratap Nagar & Khamla Road', landmark: 'Near Orange City Hospital / Ring Road', ward: 'Laxmi Nagar (Ward 1)', zone: 'Zone 1 (Laxmi Nagar)', lat: 21.1182, lng: 79.0545 },
  { name: 'Trimurti Nagar & Ring Road', landmark: 'Near NIT Garden / Subhash Nagar Link', ward: 'Laxmi Nagar (Ward 1)', zone: 'Zone 1 (Laxmi Nagar)', lat: 21.1124, lng: 79.0498 },
  { name: 'Medical Square & GMC Hospital', landmark: 'Government Medical College Gate / Ajni Link', ward: 'Hanuman Nagar (Ward 3)', zone: 'Zone 3 (Hanuman Nagar)', lat: 21.1345, lng: 79.0961 },
  { name: 'Hanuman Nagar & Reshimbagh', landmark: 'Near Suresh Bhat Hall / KDK Road', ward: 'Hanuman Nagar (Ward 3)', zone: 'Zone 3 (Hanuman Nagar)', lat: 21.1278, lng: 79.1042 },
  { name: 'Nandanvan Main Chowk & Water Tank', landmark: 'Near KDK College / Hasanbagh Link', ward: 'Nehru Nagar (Ward 5)', zone: 'Zone 5 (Nehru Nagar)', lat: 21.1365, lng: 79.1302 },
  { name: 'Sakkardara Square & Lake', landmark: 'Near Sakkardara Flyover / Ayurvedic College', ward: 'Nehru Nagar (Ward 5)', zone: 'Zone 5 (Nehru Nagar)', lat: 21.1215, lng: 79.1189 },
  { name: 'Kalamna Market Yard, Lakadganj', landmark: 'Central Agriculture Produce Hub / Ring Road', ward: 'Lakadganj (Ward 8)', zone: 'Zone 8 (Lakadganj)', lat: 21.1685, lng: 79.1458 },
  { name: 'Pardi Square & Bhandara Road', landmark: 'Near Kapsi Flyover / East Entrance', ward: 'Lakadganj (Ward 8)', zone: 'Zone 8 (Lakadganj)', lat: 21.1512, lng: 79.1582 },
  { name: 'Jaripatka Main Market Road', landmark: 'Near Dayanand Park / Sindhi Colony, North Nagpur', ward: 'Mangalwari (Ward 10)', zone: 'Zone 10 (Mangalwari)', lat: 21.1895, lng: 79.0912 },
  { name: 'Ashi Nagar & Indora Chowk', landmark: 'Near Dr. Ambedkar College / Kamptee Road', ward: 'Ashi Nagar (Ward 9)', zone: 'Zone 9 (Ashi Nagar)', lat: 21.1764, lng: 79.1045 },
  { name: 'Panchpaoli & Kamal Talkies Chowk', landmark: 'Overbridge / Golibar Chowk', ward: 'Sataranjipura (Ward 7)', zone: 'Zone 7 (Sataranjipura)', lat: 21.1632, lng: 79.1095 },
  { name: 'Besa & Pipla Road, South Nagpur', landmark: 'Near Manewada Chowk / Besa Square', ward: 'Hanuman Nagar (Ward 3)', zone: 'Zone 3 (Hanuman Nagar)', lat: 21.0825, lng: 79.0945 }
];

// Helper to find closest locality to any lat/lng
export const findClosestLocality = (lat: number, lng: number): NagpurLocation => {
  let closest = NAGPUR_LOCALITIES[0];
  let minDistance = Infinity;

  NAGPUR_LOCALITIES.forEach((loc) => {
    const d = Math.sqrt(Math.pow(loc.lat - lat, 2) + Math.pow(loc.lng - lng, 2));
    if (d < minDistance) {
      minDistance = d;
      closest = loc;
    }
  });

  return closest;
};

// Create custom crisp SVG marker for Leaflet
const createPinIcon = (isGps: boolean = false, isConfirmed: boolean = false) => {
  const color = isConfirmed ? '#10B981' : isGps ? '#059669' : '#EF4444';
  const svg = `
    <div style="position: relative; width: 38px; height: 44px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 16px; height: 7px; background: rgba(0,0,0,0.35); border-radius: 50%; filter: blur(2px);"></div>
      <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 34px; height: 40px; display: flex; flex-direction: column; align-items: center;">
        <svg viewBox="0 0 24 24" width="34" height="40" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.45));">
          <path fill="${color}" stroke="#FFFFFF" stroke-width="1.75" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="3.5" fill="#FFFFFF"/>
        </svg>
      </div>
    </div>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-nagpur-pin',
    iconSize: [38, 44],
    iconAnchor: [19, 40],
    popupAnchor: [0, -40],
  });
};

interface NagpurMapViewerProps {
  selectedLocation: string;
  selectedWard?: string;
  lat?: number;
  lng?: number;
  onSelectLocation?: (loc: NagpurLocation) => void;
  onConfirmSpot?: (loc: NagpurLocation) => void;
  height?: string;
  interactive?: boolean;
}

export const NagpurMapViewer: React.FC<NagpurMapViewerProps> = ({
  selectedLocation,
  selectedWard,
  lat,
  lng,
  onSelectLocation,
  onConfirmSpot,
  height = 'h-72',
  interactive = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const lastInternalCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const [activeItem, setActiveItem] = useState<NagpurLocation>(() => {
    if (lat && lng) {
      const closest = findClosestLocality(lat, lng);
      return {
        name: selectedLocation || closest.name,
        landmark: closest.landmark,
        ward: selectedWard || closest.ward,
        zone: closest.zone,
        lat,
        lng,
      };
    }
    const found = NAGPUR_LOCALITIES.find(
      (l) => l.name.toLowerCase().includes(selectedLocation.toLowerCase()) || selectedLocation.toLowerCase().includes(l.name.toLowerCase())
    );
    return found || NAGPUR_LOCALITIES[0];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [matchingSuggestions, setMatchingSuggestions] = useState<NagpurLocation[]>([]);
  const [mapTileStyle, setMapTileStyle] = useState<'streets' | 'satellite'>('streets');
  const [confirmedSpotState, setConfirmedSpotState] = useState(false);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = activeItem.lat || 21.1458;
      const initialLng = activeItem.lng || 79.0882;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      // Default OpenStreetMap high-speed tile layer
      const streetsLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      tileLayerRef.current = streetsLayer;

      // Create Draggable Pin
      const pin = L.marker([initialLat, initialLng], {
        icon: createPinIcon(false, false),
        draggable: interactive,
        autoPan: true,
      }).addTo(map);

      // Handle Pin Dragging in Real-Time
      if (interactive) {
        pin.on('dragend', (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setConfirmedSpotState(false);
          handleUpdateCoordinates(pos.lat, pos.lng, false);
        });

        // Click anywhere on real map to move pin accurately
        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          pin.setLatLng([clickLat, clickLng]);
          setConfirmedSpotState(false);
          handleUpdateCoordinates(clickLat, clickLng, false);
        });
      }

      markerRef.current = pin;
      mapInstanceRef.current = map;

      // Trigger resize after mount
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update tile layer style (Street vs Satellite)
  const handleToggleTileStyle = () => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    if (mapTileStyle === 'streets') {
      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(mapInstanceRef.current);
      tileLayerRef.current = satLayer;
      setMapTileStyle('satellite');
    } else {
      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = streetLayer;
      setMapTileStyle('streets');
    }
  };

  // Sync external selectedLocation/lat/lng changes safely without snapping back user's custom pins
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;

    // Check if the change came from internal click/drag
    if (
      lastInternalCoordsRef.current &&
      lat &&
      lng &&
      Math.abs(lastInternalCoordsRef.current.lat - lat) < 0.0001 &&
      Math.abs(lastInternalCoordsRef.current.lng - lng) < 0.0001
    ) {
      return;
    }

    if (lat && lng) {
      const closest = findClosestLocality(lat, lng);
      const newLoc: NagpurLocation = {
        name: selectedLocation || closest.name,
        landmark: closest.landmark,
        ward: selectedWard || closest.ward,
        zone: closest.zone,
        lat,
        lng,
      };
      setActiveItem(newLoc);
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.panTo([lat, lng]);
      return;
    }

    if (selectedLocation) {
      // Don't snap back if active item already reflects this name or is a custom pinned spot
      if (
        activeItem.name === selectedLocation ||
        selectedLocation.includes('(Pinned Spot)') ||
        selectedLocation.includes('GPS')
      ) {
        return;
      }

      const found = NAGPUR_LOCALITIES.find(
        (l) => l.name.toLowerCase().includes(selectedLocation.toLowerCase()) || selectedLocation.toLowerCase().includes(l.name.toLowerCase())
      );
      if (found && (Math.abs(found.lat - activeItem.lat) > 0.0001 || Math.abs(found.lng - activeItem.lng) > 0.0001)) {
        setActiveItem(found);
        markerRef.current.setLatLng([found.lat, found.lng]);
        mapInstanceRef.current.panTo([found.lat, found.lng]);
      }
    }
  }, [selectedLocation, lat, lng]);

  // Coordinate updater with reverse geocoding & closest ward matching
  const handleUpdateCoordinates = async (newLat: number, newLng: number, isGps: boolean = false) => {
    const roundedLat = Math.round(newLat * 100000) / 100000;
    const roundedLng = Math.round(newLng * 100000) / 100000;
    lastInternalCoordsRef.current = { lat: roundedLat, lng: roundedLng };

    const closest = findClosestLocality(roundedLat, roundedLng);
    setIsReverseGeocoding(true);

    const preliminaryLoc: NagpurLocation = {
      name: `${closest.name.split(',')[0]} (Pinned Spot)`,
      landmark: isGps ? `Live Device GPS Pin` : `Selected Point near ${closest.landmark}`,
      ward: closest.ward,
      zone: closest.zone,
      lat: roundedLat,
      lng: roundedLng,
    };

    setActiveItem(preliminaryLoc);
    if (onSelectLocation) {
      onSelectLocation(preliminaryLoc);
    }

    // Call OpenStreetMap Nominatim for exact street-level address in Nagpur
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLng}&zoom=18&addressdetails=1`
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          const addr = data.address || {};
          const road = addr.road || addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || '';
          const area = addr.suburb || addr.city_district || closest.name.split(',')[0];
          const cleanName = [road, area, 'Nagpur'].filter(Boolean).join(', ') || data.display_name.split(',').slice(0, 3).join(', ');

          const resolvedLoc: NagpurLocation = {
            ...preliminaryLoc,
            name: cleanName || preliminaryLoc.name,
            landmark: addr.amenity || addr.shop || addr.building || preliminaryLoc.landmark,
          };

          setActiveItem(resolvedLoc);
          if (onSelectLocation) {
            onSelectLocation(resolvedLoc);
          }
        }
      }
    } catch (e) {
      // Ignore network errors, fallback to closest locality
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Real-time device GPS Geolocation
  const handleLocateMe = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGpsStatusMsg('Geolocation is not supported by this browser.');
      return;
    }

    setIsLocating(true);
    setGpsStatusMsg('Acquiring high-accuracy GPS fix...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const currentLat = pos.coords.latitude;
        const currentLng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);

        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([currentLat, currentLng]);
          markerRef.current.setIcon(createPinIcon(true, false));
          mapInstanceRef.current.setView([currentLat, currentLng], 16, { animate: true });

          // Accuracy radius circle
          if (accuracyCircleRef.current) {
            accuracyCircleRef.current.remove();
          }
          accuracyCircleRef.current = L.circle([currentLat, currentLng], {
            radius: Math.max(accuracy, 20),
            color: '#10B981',
            fillColor: '#10B981',
            fillOpacity: 0.15,
            weight: 1.5,
          }).addTo(mapInstanceRef.current);
        }

        setGpsStatusMsg(`GPS Fixed (Accuracy ±${accuracy}m)`);
        handleUpdateCoordinates(currentLat, currentLng, true);
      },
      (err) => {
        setIsLocating(false);
        setGpsStatusMsg(`GPS signal unavailable (${err.message}). Showing center.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Search locality
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setMatchingSuggestions([]);
      return;
    }
    const filtered = NAGPUR_LOCALITIES.filter(
      (l) =>
        l.name.toLowerCase().includes(q.toLowerCase()) ||
        l.ward.toLowerCase().includes(q.toLowerCase()) ||
        l.landmark.toLowerCase().includes(q.toLowerCase())
    );
    setMatchingSuggestions(filtered.slice(0, 5));
  };

  const handleSelectSuggestion = (loc: NagpurLocation) => {
    setSearchQuery('');
    setMatchingSuggestions([]);
    setConfirmedSpotState(false);
    setActiveItem(loc);
    lastInternalCoordsRef.current = { lat: loc.lat, lng: loc.lng };

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([loc.lat, loc.lng]);
      markerRef.current.setIcon(createPinIcon(false, false));
      mapInstanceRef.current.setView([loc.lat, loc.lng], 16, { animate: true });
    }

    if (onSelectLocation) {
      onSelectLocation(loc);
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleResetNagpurCenter = () => {
    if (mapInstanceRef.current && markerRef.current) {
      const def = NAGPUR_LOCALITIES[0];
      setActiveItem(def);
      setConfirmedSpotState(false);
      lastInternalCoordsRef.current = { lat: def.lat, lng: def.lng };
      markerRef.current.setLatLng([def.lat, def.lng]);
      markerRef.current.setIcon(createPinIcon(false, false));
      mapInstanceRef.current.setView([21.1458, 79.0882], 14, { animate: true });
      if (onSelectLocation) onSelectLocation(def);
    }
  };

  // Explicit Confirm Spot Action
  const handleConfirmSpotClick = () => {
    setConfirmedSpotState(true);
    if (markerRef.current) {
      markerRef.current.setIcon(createPinIcon(false, true));
    }
    if (onSelectLocation) {
      onSelectLocation(activeItem);
    }
    if (onConfirmSpot) {
      onConfirmSpot(activeItem);
    }
  };

  return (
    <div className={`w-full ${height} bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-700 select-none flex flex-col justify-between shadow-lg group`}>
      {/* Map Container for Leaflet */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full absolute inset-0 z-0 bg-slate-950" 
        style={{ cursor: interactive ? 'crosshair' : 'default' }}
      />

      {/* Top Controls Overlay */}
      <div className="relative z-10 p-2.5 sm:p-3 flex flex-col gap-2 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center justify-between gap-2 pointer-events-auto">
          {/* Search Box */}
          <div className="relative flex-1 max-w-xs sm:max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search Nagpur spot (Sitabuldi, Sadar, Mahal...)"
              className="w-full pl-8.5 pr-3 py-1.5 bg-black/75 hover:bg-black/90 focus:bg-black text-white placeholder:text-slate-400 rounded-xl text-xs border border-white/20 focus:border-blue-400 focus:outline-hidden backdrop-blur-md transition-all shadow-md"
            />

            {/* Suggestions Dropdown */}
            {matchingSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900/95 border border-slate-700 rounded-xl overflow-hidden shadow-2xl z-50 divide-y divide-slate-800 backdrop-blur-lg">
                {matchingSuggestions.map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => handleSelectSuggestion(loc)}
                    className="w-full p-2.5 text-left text-xs hover:bg-blue-600/30 text-slate-200 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-white truncate">{loc.name.split(',')[0]}</div>
                      <div className="text-[10px] text-slate-400 truncate">{loc.ward} • {loc.landmark}</div>
                    </div>
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Controls: GPS + Layer Toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleToggleTileStyle}
              title={mapTileStyle === 'streets' ? 'Switch to Satellite' : 'Switch to Streets'}
              className="p-1.5 bg-black/75 hover:bg-black text-slate-200 hover:text-white rounded-xl border border-white/20 backdrop-blur-md transition-colors cursor-pointer shadow-md"
            >
              <Layers className="w-4 h-4 text-amber-400" />
            </button>

            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              className="flex items-center gap-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLocating ? 'Fixing GPS...' : 'My Live GPS'}</span>
              <span className="sm:hidden">{isLocating ? 'GPS...' : 'GPS'}</span>
            </button>
          </div>
        </div>

        {/* Status notice if any */}
        {gpsStatusMsg && (
          <div className="self-start text-[10px] font-bold text-emerald-300 bg-black/80 px-2.5 py-0.5 rounded-lg border border-emerald-500/30 backdrop-blur-sm">
            {gpsStatusMsg}
          </div>
        )}
      </div>

      {/* Floating Zoom & Center Controls on Right */}
      <div className="absolute right-3 top-16 z-10 flex flex-col gap-1 pointer-events-auto">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-lg bg-black/80 hover:bg-black text-white flex items-center justify-center border border-white/20 shadow-md transition-colors cursor-pointer backdrop-blur-sm"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-lg bg-black/80 hover:bg-black text-white flex items-center justify-center border border-white/20 shadow-md transition-colors cursor-pointer backdrop-blur-sm"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetNagpurCenter}
          className="w-8 h-8 rounded-lg bg-black/80 hover:bg-black text-slate-300 hover:text-white flex items-center justify-center border border-white/20 shadow-md transition-colors cursor-pointer backdrop-blur-sm"
          title="Reset Nagpur View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Pinned Location Banner */}
      <div className="relative z-10 p-2.5 sm:p-3 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
            confirmedSpotState 
              ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40' 
              : 'bg-red-600/20 text-red-400 border-red-500/40'
          }`}>
            {confirmedSpotState ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <MapPin className="w-4 h-4 text-red-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate">
                {activeItem.name}
              </span>
              {isReverseGeocoding && (
                <span className="text-[10px] text-blue-400 animate-pulse font-mono shrink-0">
                  (resolving...)
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-300 truncate">
              {activeItem.ward} • {activeItem.lat.toFixed(5)}°N, {activeItem.lng.toFixed(5)}°E
            </div>
          </div>
        </div>

        {interactive && (
          <button
            type="button"
            onClick={handleConfirmSpotClick}
            className={`shrink-0 px-4 py-2 text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
              confirmedSpotState
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-900'
                : 'bg-blue-600 hover:bg-blue-500 text-white animate-pulse hover:animate-none'
            }`}
            id="btn-confirm-map-spot"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{confirmedSpotState ? 'Spot Confirmed! ✓' : 'Confirm Spot'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
