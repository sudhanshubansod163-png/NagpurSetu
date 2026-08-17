import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  RotateCcw, 
  SwitchCamera, 
  MapPin, 
  Navigation, 
  Compass, 
  Clock, 
  ShieldCheck, 
  Check, 
  X, 
  Upload, 
  AlertCircle,
  Sparkles,
  Layers,
  Crosshair,
  Maximize2
} from 'lucide-react';
import { NagpurLocation } from './NagpurMapViewer';

interface GPSCameraProps {
  onPhotoCaptured: (dataUrl: string, metadata: { lat?: number; lng?: number; address?: string; timestamp: string }) => void;
  onClose?: () => void;
  currentLocation?: NagpurLocation;
  mode?: 'inline' | 'modal';
}

export const GPSCamera: React.FC<GPSCameraProps> = ({
  onPhotoCaptured,
  onClose,
  currentLocation,
  mode = 'inline',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Live GPS telemetry state
  const [gpsData, setGpsData] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
    altitude?: number | null;
    timestamp: string;
    address: string;
    ward: string;
    zone: string;
    isLiveGps: boolean;
  }>({
    lat: currentLocation?.lat || 21.1458,
    lng: currentLocation?.lng || 79.0882,
    accuracy: 4.2,
    altitude: 310,
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    address: currentLocation?.name || 'Dharampeth, Nagpur',
    ward: currentLocation?.ward || 'Ward 4 (Dharampeth)',
    zone: currentLocation?.zone || 'Zone 2 (Dharampeth)',
    isLiveGps: false,
  });

  // Fetch real-time device GPS coordinates
  const fetchLiveGPS = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;
          const altitude = pos.coords.altitude;

          setGpsData((prev) => ({
            ...prev,
            lat,
            lng,
            accuracy: Math.round(accuracy * 10) / 10,
            altitude: altitude ? Math.round(altitude) : 310,
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            isLiveGps: true,
          }));

          // Reverse geocode via Nominatim OSM
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
            .then((res) => res.json())
            .then((data) => {
              if (data && data.display_name) {
                const parts = data.display_name.split(',');
                const shortAddr = parts.slice(0, 3).join(', ').trim();
                setGpsData((prev) => ({
                  ...prev,
                  address: shortAddr || prev.address,
                }));
              }
            })
            .catch(() => {
              // Ignore network fallback
            });
        },
        (err) => {
          console.warn('GPS Geolocation prompt or fetch note:', err.message);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }
  }, []);

  // Update clock every second for live timestamp
  useEffect(() => {
    fetchLiveGPS();
    const interval = setInterval(() => {
      setGpsData((prev) => ({
        ...prev,
        timestamp: new Date().toLocaleString('en-IN', { 
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchLiveGPS]);

  // If currentLocation prop changes, update address if not live
  useEffect(() => {
    if (currentLocation) {
      setGpsData((prev) => ({
        ...prev,
        lat: prev.isLiveGps ? prev.lat : currentLocation.lat,
        lng: prev.isLiveGps ? prev.lng : currentLocation.lng,
        address: currentLocation.name,
        ward: currentLocation.ward,
        zone: currentLocation.zone,
      }));
    }
  }, [currentLocation]);

  // Start Camera Stream
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    setCameraError(null);
    setIsProcessing(true);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported in this browser.');
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(newStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera start issue:', err);
      let msg = 'Unable to access camera. Please allow camera permissions or upload a photo directly.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please grant camera permission in your browser or use the file upload option.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera found on this device. You can upload an image file instead.';
      }
      setCameraError(msg);
      setCameraActive(false);
    } finally {
      setIsProcessing(false);
    }
  }, [stream]);

  // Switch between front and back camera
  const toggleFacingMode = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  // Stop camera stream when unmounting
  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Draw real-time GPS stamp on Canvas
  const stampImageWithGPS = (sourceElement: CanvasImageSource, width: number, height: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // 1. Draw original camera frame
    ctx.drawImage(sourceElement, 0, 0, width, height);

    // 2. Compute proportions
    const bannerHeight = Math.max(140, Math.round(height * 0.22));
    const bannerY = height - bannerHeight;

    // 3. Draw dark gradient / backdrop for GPS Stamp
    const gradient = ctx.createLinearGradient(0, bannerY - 30, 0, height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.2, 'rgba(11, 30, 56, 0.88)');
    gradient.addColorStop(1, 'rgba(11, 30, 56, 0.98)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, bannerY - 30, width, bannerHeight + 30);

    // Top accent border for GPS HUD
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(0, bannerY - 2, width, 3);

    // 4. Header: NMC Verified Geotag Badge
    const padX = Math.round(width * 0.04);
    let currY = bannerY + 28;

    // NMC Shield Pill
    ctx.fillStyle = '#0369A1';
    ctx.beginPath();
    ctx.roundRect(padX, currY - 18, 220, 24, 6);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.fillText('✓ NAGPUR MUNICIPAL GEOTAG', padX + 12, currY - 2);

    // Live GPS Accuracy Chip (Right side)
    const accText = `GPS Acc: ±${gpsData.accuracy || 4}m | Alt: ${gpsData.altitude || 310}m`;
    ctx.font = 'bold 12px monospace, system-ui';
    ctx.fillStyle = '#38BDF8';
    const accWidth = ctx.measureText(accText).width;
    ctx.fillText(accText, width - padX - accWidth, currY - 2);

    currY += 28;

    // 5. Address / Location
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
    const addressStr = `${gpsData.address}`;
    ctx.fillText(addressStr.slice(0, 60), padX, currY);

    currY += 22;

    // Ward & Zone
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${gpsData.ward} • ${gpsData.zone}`, padX, currY);

    currY += 24;

    // 6. Coordinates & Timestamp row
    const latStr = `${Math.abs(gpsData.lat).toFixed(6)}° ${gpsData.lat >= 0 ? 'N' : 'S'}`;
    const lngStr = `${Math.abs(gpsData.lng).toFixed(6)}° ${gpsData.lng >= 0 ? 'E' : 'W'}`;
    
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 14px monospace, system-ui';
    ctx.fillText(`📍 ${latStr}, ${lngStr}`, padX, currY);

    const timeStr = `🕒 ${gpsData.timestamp}`;
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '13px monospace, system-ui';
    const timeWidth = ctx.measureText(timeStr).width;
    ctx.fillText(timeStr, width - padX - timeWidth, currY);

    // 7. Watermark Crosshair in top-right corner
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(width - 50, 20, 30, 30);
    ctx.beginPath();
    ctx.moveTo(width - 35, 15);
    ctx.lineTo(width - 35, 55);
    ctx.moveTo(width - 55, 35);
    ctx.lineTo(width - 15, 35);
    ctx.stroke();

    return canvas.toDataURL('image/jpeg', 0.92);
  };

  // Capture photo from live video stream
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;

    const stampedUrl = stampImageWithGPS(video, w, h);
    setCapturedImage(stampedUrl);

    // Pause stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setCameraActive(false);
    }
  };

  // Handle manual file upload with GPS stamping
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const stampedUrl = stampImageWithGPS(img, img.naturalWidth || 1280, img.naturalHeight || 720);
        setCapturedImage(stampedUrl);
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Confirm photo selection
  const handleConfirmPhoto = () => {
    if (!capturedImage) return;
    onPhotoCaptured(capturedImage, {
      lat: gpsData.lat,
      lng: gpsData.lng,
      address: gpsData.address,
      timestamp: gpsData.timestamp,
    });
    if (onClose) onClose();
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const containerContent = (
    <div className="w-full bg-slate-950 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
      {/* Top GPS Status Bar */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-wide text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>NMC Real-Time GPS Camera</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {gpsData.isLiveGps ? '🟢 Live Device Satellite Lock' : '🟡 Municipal Coordinates'} (±{gpsData.accuracy || 4}m)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLiveGPS}
            title="Refresh GPS Coordinates"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-blue-300 flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline text-[11px] font-semibold">Refetch GPS</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Viewfinder / Image Preview Box */}
      <div className="relative w-full aspect-4/3 sm:aspect-16/10 bg-black flex items-center justify-center overflow-hidden">
        {/* If Image has been captured and stamped */}
        {capturedImage ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img
              src={capturedImage}
              alt="Captured GPS Evidence"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Geotag Stamped & Ready</span>
            </div>
          </div>
        ) : (
          /* Live Camera Viewfinder */
          <div className="relative w-full h-full flex items-center justify-center">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Grid Overlay */}
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-25">
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white flex items-center justify-center">
                      <Crosshair className="w-8 h-8 text-yellow-400 opacity-60" />
                    </div>
                    <div className="border-b border-white" />
                    <div className="border-r border-white" />
                    <div className="border-r border-white" />
                    <div />
                  </div>
                )}

                {/* Live GPS HUD Banner over the camera */}
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent pointer-events-none text-left space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-sky-400">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-sm bg-sky-900/80 text-sky-200 text-[10px] font-bold">
                        NMC GEOTAG
                      </span>
                      <span>📍 {gpsData.lat.toFixed(5)}° N, {gpsData.lng.toFixed(5)}° E</span>
                    </div>
                    <span className="text-slate-300 text-[10px]">{gpsData.timestamp}</span>
                  </div>

                  <div className="text-xs font-bold text-white truncate">
                    {gpsData.address}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">
                    {gpsData.ward} • {gpsData.zone} • Alt: {gpsData.altitude || 310}m MSL
                  </div>
                </div>
              </>
            ) : (
              /* Camera Unavailable / Loading / Error State */
              <div className="p-8 text-center space-y-4 max-w-md">
                {isProcessing ? (
                  <div className="space-y-2">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-300">Activating camera hardware & GPS fix...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Camera className="w-12 h-12 text-slate-600 mx-auto" />
                    {cameraError ? (
                      <div className="p-3 bg-red-900/50 border border-red-700/60 rounded-xl text-xs text-red-200 text-left space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <span>Camera Note</span>
                        </div>
                        <p className="text-[11px] text-red-300">{cameraError}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Live camera stream ready. You can snap a photo or upload an existing image.
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => startCamera(facingMode)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retry Camera</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5 text-sky-400" />
                        <span>Upload Photo File</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Camera Action Toolbar */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
        {capturedImage ? (
          /* Confirmation Controls */
          <div className="w-full flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleRetake}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2 border border-slate-700"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Photo</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmPhoto}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-lg"
            >
              <Check className="w-4 h-4" />
              <span>Attach Stamped Geotag Photo</span>
            </button>
          </div>
        ) : (
          /* Live Camera Controls */
          <div className="w-full flex items-center justify-between">
            {/* Left: Upload file fallback */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700 flex items-center gap-1.5 text-xs font-semibold"
              title="Upload existing photo from gallery"
            >
              <Upload className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Gallery</span>
            </button>

            {/* Center: BIG SHUTTER BUTTON */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!cameraActive}
                className="w-16 h-16 rounded-full bg-white text-slate-900 flex items-center justify-center p-1 shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed ring-4 ring-white/30 cursor-pointer"
                title="Capture GPS Stamped Photo"
              >
                <div className="w-full h-full rounded-full border-2 border-slate-900 flex items-center justify-center bg-red-600 hover:bg-red-500 text-white transition-colors">
                  <Camera className="w-7 h-7" />
                </div>
              </button>
            </div>

            {/* Right: Switch Camera & Grid */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2.5 rounded-2xl border transition-colors cursor-pointer ${
                  showGrid ? 'bg-blue-900/60 border-blue-600 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title="Toggle Grid Lines"
              >
                <Layers className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={toggleFacingMode}
                disabled={!cameraActive}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer disabled:opacity-40"
                title="Flip Camera (Front / Rear)"
              >
                <SwitchCamera className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-2xl w-full">
          {containerContent}
        </div>
      </div>
    );
  }

  return containerContent;
};
