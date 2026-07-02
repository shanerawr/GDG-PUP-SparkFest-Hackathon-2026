import { useState, useEffect, useRef } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import {
  X, Camera, Droplets, Zap, AlertCircle, ImageIcon, CheckCircle, AlertTriangle, Shield, Trash2, HardHat, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PanelHeader } from './PanelHeader';
import { CameraView } from './CameraView';
import { LocationPickerModal } from './LocationPickerModal';
import { inferMunicipalityFromAddress } from '../utils/municipalityMatcher';
import type { UserReport } from '../types';

const GOOGLE_MAPS_API_KEY = 'AIzaSyB2WFoRbVp3HPXHotn27e600KWnHJZZQ80';

interface Props {
  onClose: () => void;
  onSubmit: (reportData: { type: string; title: string; address: string; description: string; lat: number; lng: number; photos?: string[]; radius?: number; hazardLevel?: string; municipality?: string }) => void;
  initialData?: UserReport;
}

const CATEGORIES = [
  { key: 'flood', label: 'Flood', Icon: Droplets },
  { key: 'road-damage', label: 'Road Damage', Icon: AlertTriangle },
  { key: 'peace-and-order', label: 'Peace & Order', Icon: Shield },
  { key: 'utility-outages', label: 'Utility Outages', Icon: Zap },
  { key: 'waste-collection', label: 'Waste', Icon: Trash2 },
  { key: 'infrastructure', label: 'Infra & Public Works', Icon: HardHat },
  { key: 'fire', label: 'Fire', Icon: Flame },
  { key: 'other', label: 'Other', Icon: AlertCircle },
];

/* ── Combined Location & Radius Map ── */
function CombinedLocationMap({
  lat,
  lng,
  radius,
  onLocationChange,
  onRadiusChange,
  searchInputRef,
}: {
  lat: number;
  lng: number;
  radius: number;
  onLocationChange: (lat: number, lng: number, address: string) => void;
  onRadiusChange: (radius: number) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
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
        const { latitude: l, longitude: g } = pos.coords;
        map.panTo({ lat: l, lng: g });
        map.setZoom(16);
        reverseGeocode(l, g);
      },
      () => {
        const center = map.getCenter();
        if (center) reverseGeocode(center.lat(), center.lng());
      }
    );
  };

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    setOptions({ apiKey: GOOGLE_MAPS_API_KEY, version: 'weekly' });
    Promise.all([importLibrary('maps'), importLibrary('geocoding'), importLibrary('places')])
      .then(() => {
        if (cancelled || !mapRef.current) return;

        const DEFAULT = { lat, lng };

        const map = new google.maps.Map(mapRef.current, {
          center: DEFAULT,
          zoom: 15,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          clickableIcons: false,
        });

        const circle = new google.maps.Circle({
          map,
          center: DEFAULT,
          radius,
          fillColor: '#2563EB',
          fillOpacity: 0.18,
          strokeColor: '#2563EB',
          strokeOpacity: 0.7,
          strokeWeight: 2.5,
        });

        geocoderRef.current = new google.maps.Geocoder();
        mapInstanceRef.current = map;
        circleRef.current = circle;

        if (searchInputRef.current) {
          const ac = new google.maps.places.Autocomplete(searchInputRef.current, {
            componentRestrictions: { country: 'ph' },
            fields: ['formatted_address', 'geometry', 'name'],
          });
          ac.addListener('place_changed', () => {
            const place = ac.getPlace();
            if (place?.geometry?.location) {
              map.panTo(place.geometry.location);
              map.setZoom(16);
              if (place.formatted_address) {
                onLocationChange(place.geometry.location.lat(), place.geometry.location.lng(), place.formatted_address);
              }
            }
          });
        }

        // Sync circle to center while dragging
        map.addListener('center_changed', () => {
          const center = map.getCenter();
          if (center) {
            circle.setCenter(center);
          }
        });

        // Fire geocode when map stops moving
        map.addListener('idle', () => {
          const center = map.getCenter();
          if (center) reverseGeocode(center.lat(), center.lng());
        });

        if (!cancelled) setLoaded(true);
      })
      .catch(console.error);

    return () => { cancelled = true; };
  }, []);

  // Sync circle radius
  useEffect(() => {
    circleRef.current?.setRadius(radius);
  }, [radius]);

  const zoomIn = () => mapInstanceRef.current?.setZoom((mapInstanceRef.current.getZoom() ?? 15) + 1);
  const zoomOut = () => mapInstanceRef.current?.setZoom((mapInstanceRef.current.getZoom() ?? 15) - 1);

  const radiusLabel = radius >= 1000 ? `${(radius / 1000).toFixed(1)} km` : `${radius} m`;

  return (
    <div className="w-full rounded-xl overflow-hidden" style={{ height: 220 }}>
      <div className="relative w-full" style={{ height: 180 }}>
        {/* Map */}
        <div ref={mapRef} className="w-full h-full rounded-t-xl" />

        {/* Loading state */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center rounded-t-xl" style={{ background: '#C5D8E0' }}>
            <div className="w-7 h-7 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Fixed center pin */}
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
            <path d="M18 2C10.27 2 4 8.27 4 16C4 26.5 18 48 18 48C18 48 32 26.5 32 16C32 8.27 25.73 2 18 2Z" fill="#FBBF24" stroke="white" strokeWidth="2.5" />
            <circle cx="18" cy="16" r="6" fill="white" />
          </svg>
        </div>

        {/* Zoom buttons */}
        <div className="absolute bottom-2.5 right-2.5 flex flex-col gap-1">
          <button onClick={zoomIn} className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-700 font-bold text-lg active:scale-95 transition-transform cursor-pointer pointer-events-auto">+</button>
          <button onClick={zoomOut} className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-700 font-bold text-lg active:scale-95 transition-transform cursor-pointer pointer-events-auto">−</button>
        </div>
      </div>

      {/* Radius slider */}
      <div className="flex items-center gap-2.5 px-3 rounded-b-xl" style={{ height: 40, background: '#C8DDE6' }}>
        <span className="text-[10px] font-bold text-gray-600 flex-shrink-0">Radius</span>
        <input
          type="range"
          min={50} max={2000} step={50}
          value={radius}
          onChange={e => onRadiusChange(Number(e.target.value))}
          className="flex-1 accent-blue-600 cursor-pointer"
        />
        <span className="text-[10px] font-bold text-blue-700 w-14 text-right flex-shrink-0">{radiusLabel}</span>
      </div>
    </div>
  );
}

/* ── Main modal ── */
export function AddReportModal({ onClose, onSubmit, initialData }: Props) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.type || 'flood');
  const [address, setAddress] = useState(initialData?.address || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [submitted, setSubmitted] = useState(false);
  const [pinLat, setPinLat] = useState(initialData?.lat || 14.5995);
  const [pinLng, setPinLng] = useState(initialData?.lng || 120.9842);
  const [radius, setRadius] = useState(initialData?.radius || 200);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [hazardLevel, setHazardLevel] = useState<'minor' | 'needs-attention' | 'urgent' | 'life-threatening'>((initialData as any)?.hazardLevel || 'minor');
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleLocationChange = (lat: number, lng: number, addr: string) => {
    setPinLat(lat);
    setPinLng(lng);
    setAddress(addr);
  };

  const handleSubmit = () => {
    if (submitted) return;
    if (!title.trim()) {
      alert('Please enter an incident name.');
      return;
    }
    if (!address.trim()) {
      alert('Please pin a location on the map.');
      return;
    }
    if (photos.length === 0) {
      alert('Please upload at least one photo.');
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      const finalAddr = address || 'Manila';
      onSubmit({ 
        type: category, 
        title: title.trim(), 
        address: finalAddr, 
        description, 
        lat: pinLat, 
        lng: pinLng, 
        radius, 
        photos, 
        hazardLevel,
        municipality: inferMunicipalityFromAddress(finalAddr)
      });
    }, 1800);
  };

  const isFormValid = title.trim().length > 0 && address.trim().length > 0 && photos.length > 0;

  const handleLocateCurrentPosition = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            setPinLat(lat);
            setPinLng(lng);
            setAddress(results[0].formatted_address);
          }
        });
      },
      () => alert('Could not get current location.')
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
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
            <h2 className="text-[22px] font-bold text-gray-900 mb-2">
              {initialData ? 'Report Updated!' : 'Report Submitted!'}
            </h2>
            <p className="text-[14px] text-gray-600">
              {initialData ? 'Salamat! Your report has been updated successfully.' : 'Salamat! Your report has been sent to the relevant authorities.'}
            </p>
          </motion.div>
        ) : (
          <motion.div key="form" className="flex-1 flex flex-col overflow-hidden">

            {/* Combined Header */}
            <PanelHeader
              title={initialData ? "Edit Report" : "New Report"}
              onBack={onClose}
              bg="#B8DCE8"
              rightAction={
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center text-gray-600 active:scale-95 transition-transform cursor-pointer"
                >
                  <X size={16} />
                </button>
              }
            />

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-4 pb-36 space-y-5">

              {/* Incident Title & Type */}
              <div className="relative z-20">
                <p className="text-[14px] font-extrabold text-gray-900 mb-1.5">
                  Incident <span className="text-red-500">*</span>
                </p>
                <div className="flex items-center bg-white rounded-xl px-3.5 py-3 border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all relative">
                  {/* Selected Category Icon Button */}
                  <button
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 mr-2.5 active:scale-95 transition-transform cursor-pointer shadow-sm hover:opacity-90"
                    style={{ background: '#2563EB', color: 'white' }}
                  >
                    {(() => {
                      const SelectedIcon = CATEGORIES.find(c => c.key === category)?.Icon || AlertCircle;
                      return <SelectedIcon size={16} strokeWidth={2.5} />;
                    })()}
                  </button>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Flooded street near Market"
                    className="flex-1 text-[13px] text-gray-900 font-medium focus:outline-none bg-transparent"
                  />

                  {/* Icon Picker Popover */}
                  <AnimatePresence>
                    {showIconPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute top-full left-0 mt-2 p-2.5 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-gray-100 z-30 flex flex-wrap gap-1.5 w-full"
                      >
                        <div className="w-full text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Choose Icon</div>
                        {CATEGORIES.map(({ key, label, Icon }) => {
                          const active = category === key;
                          return (
                            <button
                              key={key}
                              onClick={() => {
                                setCategory(key);
                                setShowIconPicker(false);
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold border transition-colors cursor-pointer"
                              style={
                                active
                                  ? { background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }
                                  : { background: '#F8FAFC', borderColor: 'transparent', color: '#64748B' }
                              }
                            >
                              <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                              <span className="whitespace-nowrap">{label}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Hazard Level */}
              <div>
                <p className="text-[14px] font-extrabold text-gray-900 mb-1.5">Hazard Level</p>
                <div className="flex gap-2 flex-wrap">
                  {([
                    { key: 'minor', label: 'Minor', color: '#ca8a04', bg: '#fefce8', border: '#fef08a' },
                    { key: 'needs-attention', label: 'Needs Attention', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
                    { key: 'urgent', label: 'Urgent', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                    { key: 'life-threatening', label: 'Life-Threatening', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
                  ] as const).map(({ key, label, color, bg, border }) => {
                    const active = hazardLevel === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setHazardLevel(key)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all cursor-pointer"
                        style={{
                          background: active ? bg : 'white',
                          borderColor: active ? border : '#e5e7eb',
                          color: active ? color : '#6b7280',
                          boxShadow: active ? `0 0 0 2px ${border}` : 'none',
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: color }}
                        />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="text-[14px] font-extrabold text-gray-900 mb-1.5">
                  Location <span className="text-red-500">*</span>
                </p>
                {/* Search bar & Current Location — outside the map */}
                <div className="flex gap-2 mb-2 items-center">
                  <input
                    ref={searchInputRef}
                    placeholder="Search location..."
                    className="flex-1 bg-white rounded-xl px-3.5 py-2.5 text-[13px] text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleLocateCurrentPosition}
                    title="Use current location"
                    className="w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-blue-600 hover:bg-blue-50 active:scale-95 transition-transform cursor-pointer flex-shrink-0"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                    </svg>
                  </button>
                </div>
                <CombinedLocationMap
                  lat={pinLat}
                  lng={pinLng}
                  radius={radius}
                  onLocationChange={handleLocationChange}
                  onRadiusChange={setRadius}
                  searchInputRef={searchInputRef}
                />
                {/* Show resolved address */}
                {address ? (
                  <p className="mt-1.5 text-[11px] text-gray-600 font-medium px-1 truncate">
                    📍 {address}
                  </p>
                ) : null}
              </div>



              {/* Upload Photo/s */}
              <div>
                <p className="text-[14px] font-extrabold text-gray-900 mb-1.5">
                  Upload Photo/s <span className="text-red-500">*</span>
                </p>
                <div className="flex gap-2 items-stretch mb-2">
                  <div
                    onClick={() => setIsCameraOpen(true)}
                    className="w-[88px] h-[80px] rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer active:opacity-80"
                    style={{ background: '#C5D8E0' }}
                  >
                    <Camera size={26} className="text-gray-500" />
                  </div>
                  <label
                    className="flex-1 h-[80px] rounded-xl flex items-center justify-center cursor-pointer active:opacity-80 relative"
                    style={{
                      background: 'rgba(255,255,255,0.4)',
                      border: '2px dashed rgba(100,140,160,0.5)',
                    }}
                  >
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <ImageIcon size={28} className="text-gray-400" />
                  </label>
                </div>
                {/* Photo Previews */}
                {photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photos.map((p, i) => (
                      <div key={i} className="relative w-16 h-16 flex-shrink-0">
                        <img src={p} className="w-full h-full object-cover rounded-lg border border-gray-200" alt="Preview" />
                        <button
                          onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 bg-white text-red-500 rounded-full p-0.5 shadow cursor-pointer hover:bg-red-50"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <p className="text-[14px] font-extrabold text-gray-900 mb-1.5">
                  Description
                  <span className="ml-1.5 text-[11px] font-medium text-gray-400">(optional)</span>
                </p>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Add any extra details..."
                  className="w-full bg-white rounded-xl px-3.5 py-3 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />
              </div>


            </div>

            {/* Submit */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-3">
              <button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className="w-full py-4 rounded-2xl text-white text-[16px] font-bold transition-all shadow-lg"
                style={{
                  backgroundColor: isFormValid ? '#2563EB' : '#A0AEC0',
                  cursor: isFormValid ? 'pointer' : 'not-allowed',
                  opacity: isFormValid ? 1 : 0.7,
                }}
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
