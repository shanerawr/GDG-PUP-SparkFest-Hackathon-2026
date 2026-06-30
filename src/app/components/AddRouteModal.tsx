import { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, Loader2, Navigation, MapPin as MapPinIcon, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import type { SavedRoute, MapPin, HazardLevel } from '../types';
import { HAZARD_COLORS, reportSvgPaths } from '../types';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyB2WFoRbVp3HPXHotn27e600KWnHJZZQ80';

interface Props {
  onClose: () => void;
  onSave: (route: SavedRoute) => void;
  pins: MapPin[];
  editRoute?: SavedRoute;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] font-extrabold text-gray-900 mb-1.5">{children}</p>;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative flex-shrink-0 transition-colors cursor-pointer"
      style={{ width: 36, height: 20, borderRadius: 10, background: value ? '#1d4ed8' : '#d1d5db' }}
    >
      <span
        className="absolute top-0.5 transition-transform bg-white rounded-full shadow"
        style={{ width: 16, height: 16, left: 2, transform: value ? 'translateX(16px)' : 'none' }}
      />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   PlacesInput
   Waits for `placesReady` before attaching Autocomplete so both
   Start and Destination inputs work without a race condition.
───────────────────────────────────────────────────────────── */
function PlacesInput({
  placeholder,
  value,
  onChange,
  onPlaceSelected,
  disabled,
  placesReady,
  className,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
  disabled?: boolean;
  placesReady: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    // Only initialise once the shared library load has finished
    if (!placesReady || !inputRef.current || autocompleteRef.current) return;

    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'ph' },
      fields: ['formatted_address', 'geometry', 'name'],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (place?.formatted_address) {
        onChange(place.formatted_address);
        onPlaceSelected(place);
      }
    });
    autocompleteRef.current = ac;
  }, [placesReady]);

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={className || "w-full border border-gray-200 rounded-xl px-3.5 py-3 text-[13px] text-black bg-gray-50 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors disabled:opacity-50"}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   MapPicker — full-screen tap-to-pin overlay
───────────────────────────────────────────────────────────── */
function MapPicker({
  label,
  initialLatLng,
  onConfirm,
  onCancel,
}: {
  label: string;
  initialLatLng?: { lat: number; lng: number };
  onConfirm: (latLng: { lat: number; lng: number }, address: string) => void;
  onCancel: () => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(initialLatLng ?? null);
  const [address, setAddress] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  const reverseGeocode = (latLng: { lat: number; lng: number }) => {
    setGeocoding(true);
    setSelected(latLng);
    geocoderRef.current?.geocode({ location: latLng }, (results, status) => {
      setGeocoding(false);
      setAddress(
        status === 'OK' && results?.[0]
          ? results[0].formatted_address
          : `${latLng.lat.toFixed(5)}, ${latLng.lng.toFixed(5)}`
      );
    });
  };

  const placeOrMoveMarker = (map: google.maps.Map, latLng: { lat: number; lng: number }) => {
    if (markerRef.current) {
      markerRef.current.setPosition(latLng);
    } else {
      const marker = new google.maps.Marker({
        map,
        position: latLng,
        draggable: true,
        animation: google.maps.Animation.DROP,
      });
      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (pos) reverseGeocode({ lat: pos.lat(), lng: pos.lng() });
      });
      markerRef.current = marker;
    }
    reverseGeocode(latLng);
  };

  useEffect(() => {
    if (!mapRef.current) return;

    setOptions({ apiKey: GOOGLE_MAPS_API_KEY, version: 'weekly' });

    Promise.all([importLibrary('maps'), importLibrary('geocoding')]).then(() => {
      if (!mapRef.current) return;

      const center = initialLatLng ?? { lat: 14.5995, lng: 120.9842 };
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: initialLatLng ? 15 : 13,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        clickableIcons: false,
        styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
      });
      mapInstanceRef.current = map;
      geocoderRef.current = new google.maps.Geocoder();

      // Pre-place marker if editing
      if (initialLatLng) placeOrMoveMarker(map, initialLatLng);

      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        placeOrMoveMarker(map, { lat: e.latLng.lat(), lng: e.latLng.lng() });
      });
    });
  }, []);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
      className="absolute inset-0 z-[60] bg-white flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 flex-shrink-0 bg-white">
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 cursor-pointer"
        >
          <X size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-gray-900">Pin {label}</p>
          <p className="text-[11px] text-gray-400">Tap the map · drag pin to adjust</p>
        </div>
      </div>

      {/* Map fills the remaining space */}
      <div ref={mapRef} className="flex-1 w-full" />

      {/* Bottom confirm bar */}
      <div className="px-4 pt-3 pb-6 bg-white border-t border-gray-100 flex-shrink-0">
        {selected ? (
          <div className="mb-3 flex items-start gap-2">
            <MapPinIcon size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-gray-600 leading-relaxed line-clamp-2">
              {geocoding ? 'Getting address…' : address || `${selected.lat.toFixed(5)}, ${selected.lng.toFixed(5)}`}
            </p>
          </div>
        ) : (
          <p className="text-[12px] text-gray-400 mb-3 text-center">
            Tap anywhere on the map to drop a pin
          </p>
        )}
        <button
          onClick={() => selected && onConfirm(selected, address)}
          disabled={!selected || geocoding}
          className="w-full py-3.5 rounded-2xl text-white text-[15px] font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-opacity active:scale-[0.98]"
          style={{ backgroundColor: '#1d4ed8' }}
        >
          {geocoding ? <><Loader2 size={16} className="animate-spin" /> Getting address…</> : 'Confirm Location'}
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Route options config
───────────────────────────────────────────────────────────── */
const TRAVEL_MODES = [
  { key: 'DRIVING', label: '🚗 Car', mode: 'DRIVING' },
  { key: 'MOTOR', label: '🛵 Motor', mode: 'DRIVING' },
  { key: 'TRANSIT', label: '🚌 Transit', mode: 'TRANSIT' },
  { key: 'WALKING', label: '🚶 Walk', mode: 'WALKING' },
  { key: 'BICYCLING', label: '🚲 Cycle', mode: 'BICYCLING' },
];

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}



function RoutePreviewMap({
  startAddress,
  destAddress,
  startPlace,
  destPlace,
  startLatLng,
  destLatLng,
  useCurrentLocation,
  currentLatLng,
  travelMode,
  placesReady,
  pins,
}: {
  startAddress: string;
  destAddress: string;
  startPlace: google.maps.places.PlaceResult | null;
  destPlace: google.maps.places.PlaceResult | null;
  startLatLng: { lat: number; lng: number } | null;
  destLatLng: { lat: number; lng: number } | null;
  useCurrentLocation: boolean;
  currentLatLng: { lat: number; lng: number } | null;
  travelMode: string;
  placesReady: boolean;
  pins: MapPin[];
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  useEffect(() => {
    if (!placesReady || !mapRef.current) return;

    Promise.all([
      importLibrary('maps'),
      importLibrary('routes'),
      importLibrary('marker')
    ]).then(() => {
      if (!mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 14.5995, lng: 120.9842 },
        zoom: 11,
        disableDefaultUI: true,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      const directionsService = new google.maps.DirectionsService();
      directionsServiceRef.current = directionsService;

      const directionsRenderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: false,
      });
      directionsRendererRef.current = directionsRenderer;
      
      setMapsLoaded(true);
    });

    return () => {
      directionsRendererRef.current?.setMap(null);
      markersRef.current.forEach(m => m.setMap(null));
      mapInstanceRef.current = null;
    };
  }, [placesReady]);

  useEffect(() => {
    if (!mapsLoaded || !mapInstanceRef.current || !placesReady) return;
    
    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Add new markers
    pins.forEach(pin => {
      try {
        const hazardLvl = pin.hazardLevel || 'needs-attention';
        const hazardColor = HAZARD_COLORS[hazardLvl as HazardLevel] || HAZARD_COLORS['needs-attention'];
        const { bg } = hazardColor;
        const path = reportSvgPaths[pin.type] ?? reportSvgPaths['other'];
        
        // Build SVG data-URL icon
        const svgStr = [
          `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">`,
          `<path d="M16 2C9.373 2 4 7.373 4 14C4 23 16 40 16 40C16 40 28 23 28 14C28 7.373 22.627 2 16 2Z"`,
          ` fill="${bg}" stroke="white" stroke-width="2"/>`,
          `<circle cx="16" cy="14" r="7" fill="white" fill-opacity="0.25"/>`,
          `<svg x="10" y="8" width="12" height="12" viewBox="0 0 24 24" fill="none"`,
          ` stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">`,
          `<path d="${path}"/></svg>`,
          `</svg>`,
        ].join('');

        const icon: google.maps.Icon = {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgStr),
          scaledSize: new google.maps.Size(32, 44),
          anchor: new google.maps.Point(16, 44),
        };

        const marker = new google.maps.Marker({
          position: { lat: Number(pin.lat), lng: Number(pin.lng) },
          map: mapInstanceRef.current,
          title: pin.title,
          icon
        });
        markersRef.current.push(marker);
      } catch (err) {
        console.error('Failed to add pin marker to preview map:', err);
      }
    });
  }, [pins, placesReady, mapsLoaded]);

  useEffect(() => {
    if (!mapsLoaded || !placesReady || !directionsServiceRef.current || !directionsRendererRef.current) return;

    // Resolve Origin
    let origin: any = null;
    if (useCurrentLocation && currentLatLng) {
      origin = new google.maps.LatLng(currentLatLng.lat, currentLatLng.lng);
    } else if (startLatLng) {
      origin = new google.maps.LatLng(startLatLng.lat, startLatLng.lng);
    } else if (startPlace?.geometry?.location) {
      origin = startPlace.geometry.location;
    } else if (startAddress.trim()) {
      origin = startAddress.trim();
    }

    // Resolve Destination
    let destination: any = null;
    if (destLatLng) {
      destination = new google.maps.LatLng(destLatLng.lat, destLatLng.lng);
    } else if (destPlace?.geometry?.location) {
      destination = destPlace.geometry.location;
    } else if (destAddress.trim()) {
      destination = destAddress.trim();
    }

    if (!origin || !destination) {
      directionsRendererRef.current.setDirections({ routes: [] } as any);
      return;
    }

    const gmTravelMode = {
      DRIVING: google.maps.TravelMode.DRIVING,
      MOTOR: google.maps.TravelMode.DRIVING,
      WALKING: google.maps.TravelMode.WALKING,
      TRANSIT: google.maps.TravelMode.TRANSIT,
      BICYCLING: google.maps.TravelMode.BICYCLING,
    }[travelMode] ?? google.maps.TravelMode.DRIVING;

    directionsServiceRef.current.route(
      {
        origin,
        destination,
        travelMode: gmTravelMode,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result && directionsRendererRef.current) {
          directionsRendererRef.current.setDirections(result);
        } else {
          directionsRendererRef.current?.setDirections({ routes: [] } as any);
        }
      }
    );
  }, [
    placesReady,
    startAddress,
    destAddress,
    startPlace,
    destPlace,
    startLatLng,
    destLatLng,
    useCurrentLocation,
    currentLatLng,
    travelMode,
    mapsLoaded,
  ]);

  return (
    <div className="relative w-full h-48 rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 mb-3 shadow-inner">
      <div ref={mapRef} className="absolute inset-0" />
      {(!useCurrentLocation && !startAddress.trim()) || !destAddress.trim() ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/90 text-gray-400 p-4 text-center z-10 pointer-events-none">
          <Map size={24} className="mb-1.5" />
          <p className="text-[12px] font-semibold">Enter start & destination points</p>
          <p className="text-[10px] text-gray-400 mt-0.5">to preview the route path</p>
        </div>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   AddRouteModal
   ───────────────────────────────────────────────────────────── */
export function AddRouteModal({ onClose, onSave, pins, editRoute }: Props) {
  const [routeName, setRouteName] = useState(editRoute?.name ?? '');
  const [startAddress, setStartAddress] = useState(editRoute?.from ?? '');
  const [destAddress, setDestAddress] = useState(editRoute?.to ?? '');
  const [startPlace, setStartPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [destPlace, setDestPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [startLatLng, setStartLatLng] = useState<{ lat: number; lng: number } | null>(() => {
    if (editRoute?.routePath && editRoute.routePath.length > 0) return editRoute.routePath[0];
    return null;
  });
  const [destLatLng, setDestLatLng] = useState<{ lat: number; lng: number } | null>(() => {
    if (editRoute?.routePath && editRoute.routePath.length > 0) return editRoute.routePath[editRoute.routePath.length - 1];
    return null;
  });
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [currentLatLng, setCurrentLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [travelMode, setTravelMode] = useState<string>(editRoute?.travelMode ?? 'DRIVING');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [placesReady, setPlacesReady] = useState(false);
  const [mapPicker, setMapPicker] = useState<'start' | 'dest' | null>(null);

  // Alternative route selection state
  const [calculatedRoutes, setCalculatedRoutes] = useState<any[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [calculatingAlternatives, setCalculatingAlternatives] = useState(false);

  /* Load Google Maps + Places library ONCE so both autocomplete inputs work */
  useEffect(() => {
    setOptions({ apiKey: GOOGLE_MAPS_API_KEY, version: 'weekly' });
    importLibrary('places').then(() => setPlacesReady(true));
  }, []);

  const isEditMode = !!editRoute;

  const hasValidStart = useCurrentLocation
    ? !!currentLatLng
    : !!(startPlace || startLatLng) || (isEditMode && startAddress.trim());

  const hasValidDest = !!(destPlace || destLatLng) || (isEditMode && destAddress.trim());

  const canSave = hasValidStart && hasValidDest;



  /* GPS current location */
  useEffect(() => {
    if (!useCurrentLocation) { 
      // Only wipe startAddress if we were previously using current location
      if (currentLatLng) setStartAddress('');
      setCurrentLatLng(null); 
      return; 
    }
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCurrentLatLng({ lat, lng });
        
        if (window.google?.maps?.Geocoder) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              setStartAddress(results[0].formatted_address);
            } else {
              setStartAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            }
          });
        } else {
          setStartAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
        
        setStartPlace(null);
        setStartLatLng(null);
        setCalculatedRoutes([]);
      },
      () => setError('Could not get current location.')
    );
  }, [useCurrentLocation]);

  const fetchRoutes = async (provideAlternatives = false) => {
    setOptions({ apiKey: GOOGLE_MAPS_API_KEY, version: 'weekly' });
    await importLibrary('routes');

    const directionsService = new google.maps.DirectionsService();

    // Resolve origin
    const origin =
      useCurrentLocation && currentLatLng
        ? new google.maps.LatLng(currentLatLng.lat, currentLatLng.lng)
        : startLatLng
          ? new google.maps.LatLng(startLatLng.lat, startLatLng.lng)
          : startPlace?.geometry?.location ?? (isEditMode ? startAddress : null);

    if (!origin) throw new Error('Please re-select the start address from the dropdown or pin it on the map.');

    // Resolve destination
    const destination =
      destLatLng
        ? new google.maps.LatLng(destLatLng.lat, destLatLng.lng)
        : destPlace?.geometry?.location ?? (isEditMode ? destAddress : null);

    if (!destination) throw new Error('Please re-select the destination from the dropdown or pin it on the map.');

    const gmTravelMode = {
      DRIVING: google.maps.TravelMode.DRIVING,
      WALKING: google.maps.TravelMode.WALKING,
      BICYCLING: google.maps.TravelMode.BICYCLING,
      TRANSIT: google.maps.TravelMode.TRANSIT,
      MOTOR: google.maps.TravelMode.DRIVING,
    }[travelMode] ?? google.maps.TravelMode.DRIVING;

    return await directionsService.route({
      origin,
      destination,
      travelMode: gmTravelMode,
      provideRouteAlternatives: provideAlternatives,
    });
  };

  const handleFindAlternatives = async () => {
    if (!canSave) return;
    setError('');
    setCalculatingAlternatives(true);
    try {
      const result = await fetchRoutes(true);
      if (!result.routes || result.routes.length === 0) {
        throw new Error('No routes found.');
      }

      const routesWithSafety = result.routes.map((route: any) => {
        let hazardCount = 0;
        const pathPoints = route.overview_path || [];
        pins.forEach(pin => {
          const isNearRoute = pathPoints.some((pt: any) => {
            const distance = getDistance(pin.lat, pin.lng, pt.lat(), pt.lng());
            return distance <= 300;
          });
          if (isNearRoute) {
            hazardCount++;
          }
        });
        return { ...route, hazardCount };
      });

      routesWithSafety.sort((a: any, b: any) => a.hazardCount - b.hazardCount);

      setCalculatedRoutes(routesWithSafety);
      setSelectedRouteIndex(0);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to calculate safest routes.';
      setError(msg);
    } finally {
      setCalculatingAlternatives(false);
    }
  };

  const handleSave = async () => {
    if (!canSave) { setError('Please fill in both a start and destination.'); return; }
    setError('');
    setSaving(true);

    try {
      let chosenRoute = calculatedRoutes[selectedRouteIndex];

      // If routes haven't been pre-calculated, fetch the default route now
      if (!chosenRoute) {
        const result = await fetchRoutes(false);
        chosenRoute = result.routes[0];

        let hazardCount = 0;
        const pathPoints = chosenRoute?.overview_path || [];
        pins.forEach(pin => {
          const isNearRoute = pathPoints.some((pt: any) => {
            const distance = getDistance(pin.lat, pin.lng, pt.lat(), pt.lng());
            return distance <= 300;
          });
          if (isNearRoute) {
            hazardCount++;
          }
        });
        chosenRoute.hazardCount = hazardCount;
      }

      const leg = chosenRoute?.legs?.[0];
      if (!leg) throw new Error('No route found between these locations.');

      // Decode the full road-following polyline
      const rawPath = chosenRoute.overview_path ?? [];
      const routePath = rawPath.map((p: google.maps.LatLng) => ({ lat: p.lat(), lng: p.lng() }));

      const now = new Date();
      const lastEdited = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      const fromLabel = useCurrentLocation
        ? 'Current Location'
        : startLatLng
          ? startAddress || 'Pinned Start'
          : (startPlace?.name ?? startPlace?.formatted_address ?? startAddress);

      const toLabel = destLatLng
        ? destAddress || 'Pinned Destination'
        : (destPlace?.name ?? destPlace?.formatted_address ?? destAddress);

      const route: SavedRoute = {
        id: editRoute?.id ?? crypto.randomUUID(),
        name: routeName.trim() || `Route ${now.toLocaleTimeString()}`,
        from: fromLabel,
        to: toLabel,
        distance: leg.distance?.text ?? '—',
        duration: leg.duration?.text ?? '—',
        lastEdited,
        nearbyReports: chosenRoute.hazardCount ?? 0,
        travelMode,
        routePath,
      };

      onSave(route);
      setSaved(true);
      setTimeout(onClose, 1800);
    } catch (e: unknown) {
      const msg = e instanceof Error
        ? e.message
        : 'Could not calculate route. Make sure the Directions API is enabled in Google Cloud Console.';
      setError(msg);
    } finally {
      setSaving(false);
    }
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
        {saved ? (
          /* ── Success ── */
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
              className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-5"
            >
              <CheckCircle size={40} className="text-blue-600" />
            </motion.div>
            <h2 className="text-[22px] font-bold text-gray-900 mb-2">Route Saved!</h2>
            <p className="text-[14px] text-gray-500">Your route has been added to your saved routes.</p>
          </motion.div>
        ) : (
          /* ── Form ── */
          <motion.div key="form" className="flex-1 flex flex-col overflow-hidden">

            {/* Header */}
            <div className="relative flex items-center justify-center px-4 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
              <h1 className="text-[20px] font-extrabold text-gray-900">{isEditMode ? 'Edit Route' : 'New Route'}</h1>
              <button
                onClick={onClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

              {/* Route Name */}
              <div>
                <SectionLabel>Route Name</SectionLabel>
                <input
                  value={routeName}
                  onChange={e => setRouteName(e.target.value)}
                  placeholder="e.g., Home → Work"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-[13px] text-black bg-gray-50 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                />
              </div>

              {/* ── Route Points (Compact Connector Layout) ── */}
              <div>
                <SectionLabel>Route Points</SectionLabel>
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 flex gap-3 relative shadow-inner">
                  {/* Visual timeline connector */}
                  <div className="flex flex-col items-center justify-between py-3 flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full border border-green-500 bg-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    </div>
                    <div className="w-[1px] flex-1 bg-gray-200 my-1" />
                    <div className="w-2.5 h-2.5 rounded-full border border-blue-600 bg-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    </div>
                  </div>

                  {/* Input stacking */}
                  <div className="flex-1 space-y-3">
                    {/* Start Input Group */}
                    <div className="relative">
                      <PlacesInput
                        placeholder="Choose starting point..."
                        value={startAddress}
                        onChange={v => { setStartAddress(v); setStartLatLng(null); }}
                        onPlaceSelected={p => { setStartPlace(p); setStartLatLng(null); setUseCurrentLocation(false); }}
                        disabled={useCurrentLocation}
                        placesReady={placesReady}
                        className="w-full border border-gray-200 rounded-xl pl-3 pr-20 py-2.5 text-[12px] text-black bg-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50"
                      />
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setUseCurrentLocation(!useCurrentLocation)}
                          title="Use current location"
                          className={`p-1.5 rounded-lg border transition-all ${useCurrentLocation ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                        >
                          <Navigation size={12} className={useCurrentLocation ? "animate-pulse" : ""} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMapPicker('start')}
                          disabled={useCurrentLocation}
                          title="Pin on Map"
                          className="p-1.5 rounded-lg border bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all disabled:opacity-40"
                        >
                          <Map size={12} />
                        </button>
                      </div>
                      {startLatLng && !useCurrentLocation && (
                        <p className="absolute left-3 -bottom-4 text-[9px] text-blue-600 font-semibold flex items-center gap-0.5 pointer-events-none">
                          <MapPinIcon size={8} /> Pinned
                        </p>
                      )}
                    </div>

                    {/* Destination Input Group */}
                    <div className="relative">
                      <PlacesInput
                        placeholder="Choose destination..."
                        value={destAddress}
                        onChange={v => { setDestAddress(v); setDestLatLng(null); }}
                        onPlaceSelected={p => { setDestPlace(p); setDestLatLng(null); }}
                        placesReady={placesReady}
                        className="w-full border border-gray-200 rounded-xl pl-3 pr-10 py-2.5 text-[12px] text-black bg-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                      />
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                        <button
                          type="button"
                          onClick={() => setMapPicker('dest')}
                          title="Pin on Map"
                          className="p-1.5 rounded-lg border bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all"
                        >
                          <Map size={12} />
                        </button>
                      </div>
                      {destLatLng && (
                        <p className="absolute left-3 -bottom-4 text-[9px] text-blue-600 font-semibold flex items-center gap-0.5 pointer-events-none">
                          <MapPinIcon size={8} /> Pinned
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Preview Map */}
              <RoutePreviewMap
                startAddress={startAddress}
                destAddress={destAddress}
                startPlace={startPlace}
                destPlace={destPlace}
                startLatLng={startLatLng}
                destLatLng={destLatLng}
                useCurrentLocation={useCurrentLocation}
                currentLatLng={currentLatLng}
                travelMode={travelMode}
                placesReady={placesReady}
                pins={pins}
              />

              {/* Route Options */}
              <div>
                <SectionLabel>Travel Mode</SectionLabel>
                <div className="grid grid-cols-5 gap-1.5 mb-4">
                  {TRAVEL_MODES.map(m => {
                    const active = travelMode === m.key;
                    return (
                      <button
                        key={m.key}
                        onClick={() => setTravelMode(m.key)}
                        className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer"
                        style={active
                          ? { background: '#eff6ff', borderColor: '#93c5fd', color: '#1d4ed8' }
                          : { background: 'white', borderColor: '#e5e7eb', color: '#6b7280' }
                        }
                      >
                        <span className="text-base leading-none">{m.label.split(' ')[0]}</span>
                        <span>{m.label.split(' ')[1]}</span>
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* Find Safest Route button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFindAlternatives}
                  disabled={calculatingAlternatives || !canSave}
                  className="w-full py-2.5 rounded-xl border border-blue-200 text-blue-600 bg-blue-50/50 hover:bg-blue-50 text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {calculatingAlternatives ? (
                    <><Loader2 size={14} className="animate-spin" /> Analyzing Safety…</>
                  ) : (
                    '🛡️ Find Safest Route'
                  )}
                </button>
              </div>

              {/* Alternatives List */}
              {calculatedRoutes.length > 0 && (
                <div className="space-y-2 border border-gray-100 bg-gray-50/50 p-3 rounded-2xl">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Select Route Path:</p>
                  <div className="space-y-1.5">
                    {calculatedRoutes.map((r, idx) => {
                      const leg = r.legs?.[0];
                      const selected = idx === selectedRouteIndex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedRouteIndex(idx)}
                          className="w-full flex items-center justify-between p-3 rounded-xl border text-[13px] text-left transition-all cursor-pointer"
                          style={selected
                            ? { background: 'white', borderColor: '#3b82f6', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.08)' }
                            : { background: 'white', borderColor: '#e5e7eb' }
                          }
                        >
                          <div className="flex flex-col">
                            <span className={`font-semibold flex items-center gap-1.5 ${selected ? 'text-blue-600' : 'text-gray-700'}`}>
                              Option {idx + 1} {r.hazardCount === 0 ? '🛡️ Safe Route' : `(⚠️ ${r.hazardCount} Hazard${r.hazardCount > 1 ? 's' : ''})`}
                            </span>
                            <span className="text-[11px] text-gray-400">Via {r.summary || 'Main road'}</span>
                          </div>
                          <div className="text-right flex flex-col">
                            <span className="font-bold text-gray-900">{leg?.duration?.text || '—'}</span>
                            <span className="text-[11px] text-gray-400">{leg?.distance?.text || '—'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}



              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[12px] text-red-600">
                  {error}
                </div>
              )}
            </div>

            {/* Save button */}
            <div className="px-4 pt-2 pb-6 bg-white border-t border-gray-100 flex-shrink-0">
              <button
                onClick={handleSave}
                disabled={saving || !canSave}
                className="w-full py-4 rounded-2xl text-white text-[16px] font-bold active:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#1d4ed8' }}
              >
                {saving
                  ? <><Loader2 size={18} className="animate-spin" /> Calculating Route…</>
                  : isEditMode ? 'Update Route' : 'Save Route'
                }
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Map Picker Overlay ── */}
      <AnimatePresence>
        {mapPicker && (
          <MapPicker
            key={mapPicker}
            label={mapPicker === 'start' ? 'Start Point' : 'Destination'}
            initialLatLng={
              mapPicker === 'start'
                ? (startLatLng ?? undefined)
                : (destLatLng ?? undefined)
            }
            onConfirm={(latLng, address) => {
              if (mapPicker === 'start') {
                setStartLatLng(latLng);
                setStartAddress(address);
                setStartPlace(null);
                setUseCurrentLocation(false);
              } else {
                setDestLatLng(latLng);
                setDestAddress(address);
                setDestPlace(null);
              }
              setMapPicker(null);
            }}
            onCancel={() => setMapPicker(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
