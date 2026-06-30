import { useState, useEffect, useRef } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import {
  X, Camera, Droplets, Car, Zap, Flame, HardHat, AlertCircle, ImageIcon, CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PanelHeader } from './PanelHeader';

const GOOGLE_MAPS_API_KEY = 'AIzaSyB2WFoRbVp3HPXHotn27e600KWnHJZZQ80';

interface Props {
  onClose: () => void;
  onSubmit: (reportData: { type: string; address: string; description: string; lat: number; lng: number; photos?: string[]; radius?: number }) => void;
  initialData?: UserReport;
}

const CATEGORIES = [
  { key: 'flood', label: 'Flood', Icon: Droplets },
  { key: 'traffic', label: 'Traffic', Icon: Car },
  { key: 'fallen-pole', label: 'Fallen Pole', Icon: Zap },
  { key: 'car-crash', label: 'Car Crash', Icon: Car },
  { key: 'road-work', label: 'Road Work', Icon: HardHat },
  { key: 'fire', label: 'Fire', Icon: Flame },
  { key: 'other', label: 'Other', Icon: AlertCircle },
];

/* ── Fixed-center-pin location map ── */
function PinLocationMap({
  onLocationChange,
}: {
  onLocationChange: (lat: number, lng: number, address: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const [loaded, setLoaded] = useState(false);

  const reverseGeocode = (lat: number, lng: number) => {
    if (!geocoderRef.current) return;
    geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        onLocationChange(lat, lng, results[0].formatted_address);
      } else {
        onLocationChange(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    });
  };

  const handleLocate = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        map.panTo({ lat, lng });
        map.setZoom(16);
        reverseGeocode(lat, lng);
      },
      () => {
        // fallback: keep current center
        const center = map.getCenter();
        if (center) reverseGeocode(center.lat(), center.lng());
      }
    );
  };

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    setOptions({ apiKey: GOOGLE_MAPS_API_KEY, version: 'weekly' });
    Promise.all([importLibrary('maps'), importLibrary('geocoding')])
      .then(() => {
        if (cancelled || !mapRef.current) return;

        const DEFAULT = { lat: 14.5995, lng: 120.9842 };

        const map = new google.maps.Map(mapRef.current, {
          center: DEFAULT,
          zoom: 14,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          clickableIcons: false,
        });

        geocoderRef.current = new google.maps.Geocoder();
        mapInstanceRef.current = map;

        // Fire initial geocode
        reverseGeocode(DEFAULT.lat, DEFAULT.lng);

        // Every time the map stops moving, read its center
        map.addListener('idle', () => {
          const center = map.getCenter();
          if (center) reverseGeocode(center.lat(), center.lng());
        });

        if (!cancelled) setLoaded(true);
      })
      .catch(console.error);

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: 180 }}>
      {/* Map */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading state */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ background: '#C5D8E0' }}>
          <div className="w-7 h-7 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Fixed center pin — tip anchored exactly at map center */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -100%)',
          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))',
        }}
      >
        <svg width="36" height="50" viewBox="0 0 36 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 2C10.27 2 4 8.27 4 16C4 26.5 18 48 18 48C18 48 32 26.5 32 16C32 8.27 25.73 2 18 2Z" fill="#FBBF24" stroke="white" strokeWidth="2.5"/>
          <circle cx="18" cy="16" r="6" fill="white"/>
        </svg>
      </div>

      {/* Locate button — bottom right */}
      <button
        onClick={handleLocate}
        className="absolute bottom-2.5 right-2.5 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-transform cursor-pointer pointer-events-auto"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" strokeOpacity="0.3"/>
        </svg>
      </button>

      {/* Drag hint label */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 shadow pointer-events-none whitespace-nowrap">
        <span className="text-[11px] text-gray-500 font-medium">Drag map to pick location</span>
      </div>
    </div>
  );
}

/* ── Affected Area map — interactive drag/zoom + resizable radius circle ── */
function AffectedAreaMap({ lat, lng }: { lat: number; lng: number }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [radius, setRadius] = useState(200); // metres

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    setOptions({ apiKey: GOOGLE_MAPS_API_KEY, version: 'weekly' });
    importLibrary('maps').then(() => {
      if (cancelled || !mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom: 15,
        disableDefaultUI: true,
        gestureHandling: 'greedy',   // ← drag + pinch-zoom enabled
        clickableIcons: false,
      });

      const circle = new google.maps.Circle({
        map,
        center: { lat, lng },
        radius: 200,
        fillColor: '#2563EB',
        fillOpacity: 0.18,
        strokeColor: '#2563EB',
        strokeOpacity: 0.7,
        strokeWeight: 2.5,
      });

      mapInstanceRef.current = map;
      circleRef.current = circle;
      if (!cancelled) setLoaded(true);
    }).catch(console.error);

    return () => { cancelled = true; };
  }, []);

  // Sync center when pin location changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat, lng });
      circleRef.current?.setCenter({ lat, lng });
    }
  }, [lat, lng]);

  // Sync circle radius when slider changes
  useEffect(() => {
    circleRef.current?.setRadius(radius);
  }, [radius]);

  const zoomIn  = () => mapInstanceRef.current?.setZoom((mapInstanceRef.current.getZoom() ?? 15) + 1);
  const zoomOut = () => mapInstanceRef.current?.setZoom((mapInstanceRef.current.getZoom() ?? 15) - 1);

  const radiusLabel = radius >= 1000 ? `${(radius / 1000).toFixed(1)} km` : `${radius} m`;

  return (
    <div className="w-full rounded-xl overflow-hidden" style={{ height: 180 }}>
      {/* Map */}
      <div className="relative w-full" style={{ height: 140 }}>
        <div ref={mapRef} className="w-full h-full rounded-t-xl" />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center rounded-t-xl" style={{ background: '#C5D8E0' }}>
            <div className="w-6 h-6 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Zoom buttons — bottom right */}
        <div className="absolute bottom-2.5 right-2.5 flex flex-col gap-1">
          <button
            onClick={zoomIn}
            className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-700 font-bold text-lg active:scale-95 transition-transform cursor-pointer"
          >+</button>
          <button
            onClick={zoomOut}
            className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-700 font-bold text-lg active:scale-95 transition-transform cursor-pointer"
          >−</button>
        </div>

        {/* Radius badge */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow pointer-events-none">
          ⬤ {radiusLabel} radius
        </div>
      </div>

      {/* Radius slider */}
      <div
        className="flex items-center gap-2.5 px-3 rounded-b-xl"
        style={{ height: 40, background: '#C8DDE6' }}
      >
        <span className="text-[10px] font-bold text-gray-600 flex-shrink-0">Radius</span>
        <input
          type="range"
          min={50}
          max={2000}
          step={50}
          value={radius}
          onChange={e => setRadius(Number(e.target.value))}
          className="flex-1 accent-blue-600 cursor-pointer"
        />
        <span className="text-[10px] font-bold text-blue-700 w-14 text-right flex-shrink-0">{radiusLabel}</span>
      </div>
    </div>
  );
}

/* ── Main modal ── */
export function AddReportModal({ onClose, onSubmit }: Props) {
  const [category, setCategory] = useState('fallen-pole');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [pinLat, setPinLat] = useState(14.5995);
  const [pinLng, setPinLng] = useState(120.9842);

  const handleLocationChange = (lat: number, lng: number, addr: string) => {
    setPinLat(lat);
    setPinLng(lng);
    setAddress(addr);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      onSubmit({ type: category, address: address || 'Manila', description, lat: pinLat, lng: pinLng });
    }, 1800);
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
      className="absolute inset-0 z-50 flex flex-col"
      style={{ background: '#B8DCE8' }}
    >
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 14 }}
              className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5"
            >
              <CheckCircle size={40} className="text-green-600" />
            </motion.div>
            <h2 className="text-[22px] font-bold text-gray-900 mb-2">Report Submitted!</h2>
            <p className="text-[14px] text-gray-600">
              Salamat! Your report has been sent to the relevant authorities.
            </p>
          </motion.div>
        ) : (
          <motion.div key="form" className="flex-1 flex flex-col overflow-hidden">

            {/* Back header */}
            <PanelHeader title="" onBack={onClose} bg="#B8DCE8" />

            {/* Title row + close */}
            <div className="relative flex items-center justify-center px-4 pb-3 flex-shrink-0">
              <h1 className="text-[22px] font-extrabold text-gray-900">New Report</h1>
              <button
                onClick={onClose}
                className="absolute right-4 w-8 h-8 rounded-full bg-white/60 flex items-center justify-center text-gray-600 active:scale-95 transition-transform cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-4 pb-36 space-y-5">

              {/* Title */}
              <div>
                <p className="text-[14px] font-extrabold text-gray-900 mb-1.5">Title</p>
                <input
                  placeholder=""
                  className="w-full bg-white rounded-xl px-3.5 py-3 text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* Pin Location — real Google Map */}
              <div>
                <p className="text-[14px] font-extrabold text-gray-900 mb-1.5">Pin Location</p>
                <PinLocationMap onLocationChange={handleLocationChange} />
                {/* Show resolved address */}
                {address ? (
                  <p className="mt-1.5 text-[11px] text-gray-600 font-medium px-1 truncate">
                    📍 {address}
                  </p>
                ) : null}
              </div>

              {/* Category */}
              <div>
                <p className="text-[14px] font-extrabold text-gray-900 mb-1.5">Incident Category</p>
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {CATEGORIES.map(({ key, label, Icon }) => {
                    const active = category === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setCategory(key)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-colors cursor-pointer"
                        style={
                          active
                            ? { background: '#2563EB', borderColor: '#2563EB', color: 'white' }
                            : { background: 'white', borderColor: '#d1d5db', color: '#374151' }
                        }
                      >
                        <Icon size={12} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upload Photo/s */}
              <div>
                <p className="text-[14px] font-extrabold text-gray-900 mb-1.5">Upload Photo/s</p>
                <div className="flex gap-2 items-stretch">
                  <div
                    className="w-[88px] h-[80px] rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer active:opacity-80"
                    style={{ background: '#C5D8E0' }}
                  >
                    <Camera size={26} className="text-gray-500" />
                  </div>
                  <div
                    className="flex-1 h-[80px] rounded-xl flex items-center justify-center cursor-pointer active:opacity-80"
                    style={{
                      background: 'rgba(255,255,255,0.4)',
                      border: '2px dashed rgba(100,140,160,0.5)',
                    }}
                  >
                    <ImageIcon size={28} className="text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-[14px] font-extrabold text-gray-900 mb-1.5">Description</p>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-white rounded-xl px-3.5 py-3 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />
              </div>

              {/* Affected Area — real Google Map (follows pin) */}
              <div>
                <p className="text-[14px] font-extrabold text-gray-900 mb-1.5">Affected Area</p>
                <AffectedAreaMap lat={pinLat} lng={pinLng} />
              </div>
            </div>

            {/* Submit */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-3">
              <button
                onClick={handleSubmit}
                className="w-full py-4 rounded-2xl text-white text-[16px] font-bold active:opacity-90 transition-opacity cursor-pointer shadow-lg"
                style={{ backgroundColor: '#2563EB' }}
              >
                {initialData ? 'Save Changes' : 'Submit Report'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCameraOpen && (
          <CameraView 
            onCapture={(dataUrl) => {
              setPhotos(prev => [...prev, dataUrl]);
              setIsCameraOpen(false);
            }} 
            onClose={() => setIsCameraOpen(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMapPickerOpen && (
          <LocationPickerModal
            initialLocation={userLocation}
            initialRadius={radius}
            onClose={() => setIsMapPickerOpen(false)}
            onConfirm={(loc, addr, rad) => {
              setUserLocation(loc);
              setAddress(addr);
              if (rad !== undefined) setRadius(rad);
              setIsMapPickerOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
