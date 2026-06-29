import { useState, useEffect } from 'react';
import {
  X, Camera, Droplets, Car, Zap, Flame, HardHat, AlertCircle,
  MapPin, Pencil, RotateCcw, CheckCircle, ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CameraView } from './CameraView';
import { LocationPickerModal } from './LocationPickerModal';

interface Props {
  onClose: () => void;
  onSubmit: (reportData: { type: string; address: string; description: string; lat: number; lng: number }) => void;
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[14px] font-extrabold text-gray-900 mb-2">{children}</p>
  );
}

function SmallMapPreview({ showBluePin = false }: { showBluePin?: boolean }) {
  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: '#f0ebe0' }}>
      <svg width="100%" height="100%" viewBox="0 0 120 96" preserveAspectRatio="xMidYMid slice">
        <rect width="120" height="96" fill="#f0ebe0" />
        {/* Bay */}
        <rect x="0" y="0" width="16" height="96" fill="#b3d9f5" opacity="0.8" />
        {/* Horizontal roads */}
        <rect x="0" y="36" width="120" height="4" fill="white" opacity="0.85" />
        <rect x="0" y="66" width="120" height="3" fill="white" opacity="0.75" />
        {/* Vertical roads */}
        <rect x="36" y="0" width="3" height="96" fill="white" opacity="0.85" />
        <rect x="72" y="0" width="3" height="96" fill="white" opacity="0.75" />
        {/* Blocks */}
        <rect x="18" y="4" width="15" height="29" fill="#e3dcd2" />
        <rect x="39" y="4" width="30" height="29" fill="#e3dcd2" />
        <rect x="75" y="4" width="22" height="29" fill="#e3dcd2" />
        <rect x="18" y="42" width="15" height="21" fill="#e3dcd2" />
        <rect x="39" y="42" width="30" height="21" fill="#e3dcd2" />
        <rect x="75" y="42" width="22" height="21" fill="#e3dcd2" />
        <rect x="18" y="70" width="15" height="24" fill="#e3dcd2" />
        <rect x="39" y="70" width="30" height="24" fill="#e3dcd2" />
        <rect x="75" y="70" width="22" height="24" fill="#e3dcd2" />
        {/* Pin */}
        {showBluePin ? (
          <>
            <path d="M76 30 C72 30 69 33 69 37 C69 43 76 51 76 51 C76 51 83 43 83 37 C83 33 80 30 76 30Z" fill="#1d4ed8" />
            <circle cx="76" cy="37" r="3.5" fill="white" />
          </>
        ) : (
          <>
            <path d="M58 18 C54 18 51 21 51 25 C51 31 58 39 58 39 C58 39 65 31 65 25 C65 21 62 18 58 18Z" fill="#dc2626" />
            <circle cx="58" cy="25" r="3.5" fill="white" />
          </>
        )}
      </svg>
    </div>
  );
}



export function AddReportModal({ onClose, onSubmit }: Props) {
  const [category, setCategory] = useState('fallen-pole');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(true);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setAddress('Current Location');
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
    }
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    // Use actual user location if available, otherwise simulate coordinates
    const lat = userLocation ? userLocation.lat : 14.5995 + (Math.random() - 0.5) * 0.05;
    const lng = userLocation ? userLocation.lng : 120.9842 + (Math.random() - 0.5) * 0.05;
    
    setTimeout(() => {
      onSubmit({
        type: category,
        address: address || 'Manila',
        description,
        lat,
        lng,
        photos
      } as any); // using any to bypass strict type check here, will update App.tsx
    }, 1800);
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
      className="absolute inset-0 bg-white z-50 flex flex-col"
    >
      <AnimatePresence mode="wait">
        {submitted ? (
          /* ── Success screen ── */
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
            <p className="text-[14px] text-gray-500">
              Salamat! Your report has been sent to the relevant authorities.
            </p>
          </motion.div>
        ) : (
          /* ── Form ── */
          <motion.div key="form" className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="relative flex items-center justify-center px-4 pt-5 pb-3 border-b border-gray-100">
              <h1 className="text-[20px] font-extrabold text-gray-900">New Report</h1>
              <button
                onClick={onClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

              {/* ── Pin Location ── */}
              <div>
                <SectionLabel>Pin Location</SectionLabel>
                <div className="flex gap-3">
                  <div 
                    onClick={() => setIsMapPickerOpen(true)}
                    className="w-[90px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 relative group cursor-pointer transition-opacity hover:opacity-80"
                  >
                    <SmallMapPreview />
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-1 rounded">Edit Pin</span>
                    </div>
                  </div>
                  {/* Controls */}
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                      <MapPin size={12} className={isLocating ? "text-blue-500 animate-pulse" : "text-gray-400"} />
                      <span>
                        {isLocating ? "Detecting location..." : userLocation ? "Using current location" : "Could not detect location"}
                      </span>
                    </div>
                    <input
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Manual Address (e.g., pole ID, corner...)"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[12px] bg-gray-50 placeholder-gray-400 focus:outline-none focus:border-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* ── Incident Category ── */}
              <div>
                <SectionLabel>Incident Category</SectionLabel>
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {CATEGORIES.map(({ key, label, Icon }) => {
                    const active = category === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setCategory(key)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition-colors"
                        style={
                          active
                            ? { background: '#eff6ff', borderColor: '#93c5fd', color: '#1d4ed8' }
                            : { background: 'white', borderColor: '#e5e7eb', color: '#374151' }
                        }
                      >
                        <Icon size={13} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Photo Upload ── */}
              <div>
                <SectionLabel>Photo Upload</SectionLabel>
                <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                  {photos.map((p, idx) => (
                    <div key={idx} className="relative inline-block border border-gray-200 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img src={p} alt="Uploaded" className="h-[120px] w-auto max-w-full object-contain" />
                      <button 
                        onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/50 shadow-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  
                  {/* Upload Buttons */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button 
                      type="button" 
                      onClick={() => setIsCameraOpen(true)}
                      className="flex flex-col items-center justify-center gap-1.5 px-3 py-2 h-[120px] rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm border border-gray-100">
                        <Camera size={18} />
                      </div>
                      <span className="text-[12px] font-bold text-gray-900">Take Photo</span>
                    </button>
                    <label className="flex flex-col items-center justify-center gap-1.5 px-3 py-2 h-[120px] rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm border border-gray-100">
                        <ImageIcon size={18} />
                      </div>
                      <span className="text-[12px] font-bold text-gray-900">Gallery</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* ── Description ── */}
              <div>
                <SectionLabel>Description</SectionLabel>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Details... (e.g., pole ID, depth, impact)"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-[13px] bg-white placeholder-gray-400 focus:outline-none focus:border-gray-400"
                />
              </div>

              {/* ── Affected Area ── */}
              <div>
                <SectionLabel>Affected Area</SectionLabel>
                <div className="flex gap-3 items-stretch">
                  {/* Tool buttons */}
                  <div className="flex flex-col gap-2">
                    <button className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <Pencil size={16} className="text-gray-600" />
                    </button>
                    <button className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <RotateCcw size={16} className="text-gray-600" />
                    </button>
                  </div>
                  {/* Map preview */}
                  <div className="flex-1 rounded-xl overflow-hidden border border-gray-200" style={{ height: 96 }}>
                    <SmallMapPreview showBluePin />
                  </div>
                </div>
              </div>

              {/* Spacer so submit button doesn't cover last field */}
              <div className="h-2" />
            </div>

            {/* ── Submit button ── */}
            <div className="px-4 pt-2 pb-6 bg-white border-t border-gray-100">
              <button
                onClick={handleSubmit}
                className="w-full py-4 rounded-2xl text-white text-[16px] font-bold active:opacity-90 transition-opacity"
                style={{ backgroundColor: '#1d4ed8' }}
              >
                Submit Report
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
            onClose={() => setIsMapPickerOpen(false)}
            onConfirm={(loc, addr) => {
              setUserLocation(loc);
              setAddress(addr);
              setIsMapPickerOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
