import { useState, useEffect, useRef, useCallback, Component } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { ChevronDown, Check, Locate, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { MapPin, HazardLevel, HazardFilter, SavedRoute } from '../types';
import { HAZARD_COLORS, reportSvgPaths } from '../types';
import { formatTimeAgo } from '../utils/time';
import { useLanguage } from '../contexts/LanguageContext';

const GOOGLE_MAPS_API_KEY = "AIzaSyB2WFoRbVp3HPXHotn27e600KWnHJZZQ80";




// FILTERS moved inside component

interface Props {
  pins: MapPin[];
  activeRoute?: SavedRoute | null;
  onOpenDetail: (pin: MapPin) => void;
  onClearActiveRoute?: () => void;
  theme?: 'light' | 'dark';
  currentUser?: any;
  onOpenAiTrends?: () => void;
}

/* ── Haversine helper for marker highlighting ── */
function distMetres(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(sin2));
}

function isNearRoute(pin: { lat: number; lng: number }, path: { lat: number; lng: number }[]): boolean {
  if (!path || path.length === 0) return false;
  return path.some(pt => distMetres(pin, pt) <= 500);
}

/* ── Error Boundary ── */
interface EBState { error: Error | null }
class MapErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  state: EBState = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, background: '#fef2f2', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>Map Error</div>
          <div style={{ fontSize: 12, color: '#b91c1c', maxWidth: 320 }}>{this.state.error.message}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Filter Dropdown ── */
function FilterDropdown({ filter, onChange, theme = 'light' }: { filter: HazardFilter; onChange: (f: HazardFilter) => void; theme?: 'light' | 'dark' }) {
  const { t } = useLanguage();
  
  const FILTERS: { key: HazardFilter; label: string }[] = [
    { key: 'all', label: t.map.filters.all },
    { key: 'minor', label: t.map.filters.minor },
    { key: 'needs-attention', label: t.map.filters.needsAttention },
    { key: 'urgent', label: t.map.filters.urgent },
    { key: 'life-threatening', label: t.map.filters.critical },
  ];

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = FILTERS.find(f => f.key === filter)!;
  const activeColor = filter !== 'all' ? HAZARD_COLORS[filter as HazardLevel] : null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative text-gray-800">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold shadow-lg border cursor-pointer"
        style={
          activeColor
            ? { background: activeColor.bg, borderColor: activeColor.bg, color: 'white' }
            : { 
                background: theme === 'dark' ? 'var(--card)' : 'white', 
                borderColor: theme === 'dark' ? 'var(--border)' : '#e5e7eb', 
                color: theme === 'dark' ? 'var(--foreground)' : '#111' 
              }
        }
      >
        <span>{t.map.filter}: {active.label}</span>
        <ChevronDown size={14} strokeWidth={2.5}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-1/2 bg-white dark:bg-[#161821] rounded-2xl shadow-xl border border-gray-100 dark:border-[#1e2533] overflow-hidden z-[1001]"
            style={{ transform: 'translateX(-50%)', minWidth: 200 }}
          >
            {FILTERS.map(f => {
              const color = f.key !== 'all' ? HAZARD_COLORS[f.key as HazardLevel] : null;
              const isActive = filter === f.key;
              return (
                <button key={f.key} onClick={() => { onChange(f.key); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-left hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors border-b border-gray-50 dark:border-slate-800 last:border-0 cursor-pointer text-gray-700 dark:text-gray-200"
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color ? color.bg : '#9ca3af' }} />
                  <span className={isActive ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}>{f.label}</span>
                  {isActive && <Check size={14} className="ml-auto text-gray-900 dark:text-white" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
];

/* ── Inner map component (rendered inside error boundary) ── */
function MapInner({ pins, activeRoute, onOpenDetail, onClearActiveRoute, theme = 'light', currentUser, onOpenAiTrends }: Props) {
  const { t } = useLanguage();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const activePinIdRef = useRef<string | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const [filter, setFilter] = useState<HazardFilter>('all');
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* Load Google Maps once on mount */
  useEffect(() => {
    let cancelled = false;

    setOptions({ apiKey: GOOGLE_MAPS_API_KEY, version: 'weekly' });

    importLibrary('maps')
      .then(() => {
        if (cancelled || !mapRef.current) return;
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 14.5995, lng: 120.9842 },
          zoom: 13,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          clickableIcons: false,
          styles: theme === 'dark' ? darkMapStyles : undefined,
        });
        
        map.addListener('click', () => {
          if (infoWindowRef.current) infoWindowRef.current.close();
          activePinIdRef.current = null;
        });

        mapInstanceRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow({ maxWidth: 240, headerDisabled: true });
        if (!cancelled) setLoaded(true);
      })
      .catch((e: Error) => {
        if (!cancelled) setLoadError(e.message);
      });

    return () => { cancelled = true; };
  }, []);

  /* Dynamically toggle map styles based on theme */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setOptions({
      styles: theme === 'dark' ? darkMapStyles : undefined
    });
  }, [theme, loaded]);

  /* Locate handler */
  const handleLocate = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    navigator.geolocation?.getCurrentPosition(
      pos => { map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude }); map.setZoom(16); },
      () => { map.panTo({ lat: 14.5995, lng: 120.9842 }); map.setZoom(13); }
    );
  }, []);

  /* Place / refresh markers */
  useEffect(() => {
    const map = mapInstanceRef.current;
    const iw = infoWindowRef.current;
    if (!loaded || !map || !iw) return;

    markersRef.current.forEach(m => m.setMap(null));
    circlesRef.current.forEach(c => c.setMap(null));
    markersRef.current = [];
    circlesRef.current = [];

    const visible = filter === 'all' ? pins : pins.filter(p => p.hazardLevel === filter);

    visible.forEach((pin, idx) => {
      const hazardColor = HAZARD_COLORS[pin.hazardLevel as HazardLevel] || HAZARD_COLORS['needs-attention'];
      const { bg } = hazardColor;

      // Determine if pin is near the active route path
      const near = activeRoute ? isNearRoute(pin, activeRoute.routePath) : false;

      // Unique clip-path ID per pin
      const clipId = `lc${idx}${(pin.id || '').replace(/[^a-z0-9]/gi, '').slice(-6)}`;

      // Circular landscape pin SVG
      const imageUrl = pin.photos && pin.photos.length > 0 ? pin.photos[0] : (pin.photo || null);
      
      const contentSvg = imageUrl 
        ? `<image href="${imageUrl}" x="7" y="7" width="40" height="40" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>`
        : [
            // Sky background (clipped)
            `<rect x="7" y="7" width="40" height="22" fill="#87CEEB" clip-path="url(#${clipId})"/>`,
            // Back hill
            `<ellipse cx="15" cy="40" rx="19" ry="13" fill="#7aab52" clip-path="url(#${clipId})"/>`,
            // Middle hill
            `<ellipse cx="40" cy="42" rx="17" ry="12" fill="#6a9e44" clip-path="url(#${clipId})"/>`,
            // Ground
            `<rect x="7" y="35" width="40" height="15" fill="#5c9130" clip-path="url(#${clipId})"/>`,
            // Front bump
            `<ellipse cx="24" cy="36" rx="13" ry="8" fill="#5c9130" clip-path="url(#${clipId})"/>`,
          ].join('');

      const svgStr = [
        `<svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 54 54">`,
        `<defs><clipPath id="${clipId}"><circle cx="27" cy="27" r="20"/></clipPath></defs>`,
        // Outer ring
        `<circle cx="27" cy="27" r="26" fill="${bg}" stroke="white" stroke-width="3"/>`,
        contentSvg,
        // Near-route dashed highlight ring
        near ? `<circle cx="27" cy="27" r="26" fill="none" stroke="#ef4444" stroke-width="3.5" stroke-dasharray="5,3"/>` : '',
        `</svg>`,
      ].join('');

      const icon: google.maps.Icon = {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgStr),
        scaledSize: new google.maps.Size(54, 54),
        anchor: new google.maps.Point(27, 27),  // Center anchor for circles
      };

      const marker = new google.maps.Marker({
        map,
        position: { lat: pin.lat, lng: pin.lng },
        icon,
        title: pin.title,
        zIndex: near ? 1000 : 100
      });

      if (pin.radius) {
        const circle = new google.maps.Circle({
          map,
          center: { lat: pin.lat, lng: pin.lng },
          radius: pin.radius,
          fillColor: bg,
          fillOpacity: 0.15,
          strokeColor: bg,
          strokeOpacity: 0.4,
          strokeWeight: 2,
          clickable: false,
          zIndex: 50
        });
        circlesRef.current.push(circle);
      }

      const CATEGORIES: Record<string, string> = {
        'flood': 'Flood',
        'road-damage': 'Road Damage',
        'peace-and-order': 'Peace and Order',
        'utility-outages': 'Utility Outages',
        'waste-collection': 'Waste Collection',
        'infrastructure': 'Infrastructure & Public Works',
        'fire': 'Fire',
        'other': 'Other'
      };
      
      marker.addListener('click', () => {
        // Mini landscape SVG for the thumbnail inside the popup
        const thumbSvg = [
          `<svg xmlns='http://www.w3.org/2000/svg' width='76' height='86' viewBox='0 0 76 86'>`,
          `<rect width='76' height='86' fill='#87CEEB'/>`,
          `<ellipse cx='18' cy='74' rx='30' ry='20' fill='#7aab52'/>`,
          `<ellipse cx='60' cy='78' rx='26' ry='18' fill='#6a9e44'/>`,
          `<rect x='0' y='58' width='76' height='28' fill='#5c9130'/>`,
          `<ellipse cx='32' cy='60' rx='20' ry='13' fill='#5c9130'/>`,
          `</svg>`,
        ].join('');

        const descText = (pin.description || '').slice(0, 60) + ((pin.description || '').length > 60 ? '…' : '');

        const div = document.createElement('div');
        div.style.cssText = `
          width:252px;
          background:white;
          border-radius:14px;
          border:2.5px solid ${bg};
          overflow:hidden;
          font-family:system-ui,-apple-system,sans-serif;
          box-shadow:0 6px 24px rgba(0,0,0,0.18);
        `;
        const thumbHtml = imageUrl
          ? `<img src="${imageUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;display:block;" />`
          : `<div style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;">${thumbSvg}</div>`;

        div.innerHTML = `
          <div style="display:flex;align-items:stretch;min-height:86px;">
            <div style="width:76px;flex-shrink:0;position:relative;overflow:hidden;">
              ${thumbHtml}
            </div>
            <div style="flex:1;padding:10px 12px;display:flex;flex-direction:column;gap:1px;">
              <div style="font-size:13px;font-weight:800;color:#111;line-height:1.3;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;" title="${pin.title}">${pin.title}</div>
              <div style="font-size:10.5px;color:#6b7280;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;" title="${pin.address || ''}">${pin.address || ''}</div>
              <div style="font-size:10px;color:#9ca3af;line-height:1.4;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;" title="${pin.description || ''}">${descText}</div>
              <div style="font-size:10px;color:#9ca3af;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;">${formatTimeAgo(pin.createdAt)}${pin.reportedBy ? ' · by ' + pin.reportedBy : ''}</div>
              <button id="vm-${pin.id}" style="margin-top:5px;align-self:flex-end;font-size:11px;font-weight:700;color:#2563eb;border:none;background:none;cursor:pointer;padding:0;">
                view more →
              </button>
            </div>
          </div>`;

        iw.setContent(div);
        iw.open(map, marker);

        setTimeout(() => {
          document.getElementById(`vm-${pin.id}`)?.addEventListener('click', () => {
            iw.close();
            onOpenDetail(pin);
          });
        }, 100);
      });

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(m => m.setMap(null));
      circlesRef.current.forEach(c => c.setMap(null));
      markersRef.current = [];
      circlesRef.current = [];
    };
  }, [loaded, pins, filter, onOpenDetail, activeRoute]);

  /* Draw / clear the active route polyline */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!loaded || !map) return;

    // Remove any existing polyline
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }

    if (!activeRoute || !activeRoute.routePath || activeRoute.routePath.length < 2) return;

    const polyline = new google.maps.Polyline({
      path: activeRoute.routePath,
      geodesic: true,
      strokeColor: '#2563eb',
      strokeOpacity: 1,
      strokeWeight: 5,
    });
    polyline.setMap(map);
    routePolylineRef.current = polyline;

    // Fit map to show the whole route
    const bounds = new google.maps.LatLngBounds();
    activeRoute.routePath.forEach(pt => bounds.extend(pt));
    map.fitBounds(bounds, { top: 60, right: 20, bottom: 60, left: 20 });
  }, [loaded, activeRoute]);

  if (loadError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <AlertTriangle className="text-yellow-500 mb-3" size={32} />
        <p className="font-bold text-sm text-gray-900 mb-1">Google Maps failed to load</p>
        <p className="text-xs text-gray-500 max-w-xs">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full z-0">
      <div ref={mapRef} className="w-full h-full" />

      {!loaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="absolute top-3 left-0 right-0 z-[1000] flex flex-col items-center gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Map label pill */}
          <div
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-white shadow-lg"
            style={{ background: '#47B3E8' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
              <line x1="8" y1="2" x2="8" y2="18"/>
              <line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
            {t.map.mapLabel}
          </div>
           <FilterDropdown filter={filter} onChange={setFilter} theme={theme} />
        </div>
        {activeRoute && onClearActiveRoute && (
          <button
            onClick={onClearActiveRoute}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-full text-[11px] font-bold shadow-lg transition-all cursor-pointer"
          >
            <X size={12} />
            {t.map.clearRoute}: {activeRoute.name}
          </button>
        )}
      </div>

      {currentUser && (currentUser.role === 'admin' || currentUser.role === 'lgu' || currentUser.role === 'authority') && onOpenAiTrends && (
        <div className="absolute top-16 left-0 right-0 z-[1000] flex justify-center pointer-events-none px-3">
          <button
            onClick={onOpenAiTrends}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shadow-xl hover:shadow-indigo-500/25 border border-indigo-400/40 hover:scale-105 active:scale-95 transition-all cursor-pointer group animate-bounce"
            style={{ animationDuration: '3s' }}
          >
            <span className="w-6 h-6 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:rotate-12 transition-transform">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
            </span>
            <span className="text-[12px] font-black tracking-wide bg-gradient-to-r from-white via-indigo-100 to-blue-200 bg-clip-text text-transparent">
              ✨ Live AI Trend Insights (Gemini & Groq)
            </span>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
              Live
            </span>
          </button>
        </div>
      )}

      <button onClick={handleLocate}
        className="absolute right-3 bottom-3 z-[1000] w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-transform cursor-pointer"
      >
        <Locate size={18} />
      </button>
    </div>
  );
}

/* ── Public export wrapped in error boundary ── */
export function MapView(props: Props) {
  return (
    <MapErrorBoundary>
      <MapInner {...props} />
    </MapErrorBoundary>
  );
}
