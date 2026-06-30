import { useState } from 'react';
import { Plus, MoreHorizontal, AlertCircle, ChevronDown, ChevronUp, Eye, Edit2, Trash2, Clock, Ruler } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { SavedRoute, MapPin } from '../types';
import { PanelHeader } from './PanelHeader';

interface Props {
  routes: SavedRoute[];
  pins: MapPin[];
  onAddRoute: () => void;
  onDeleteRoute: (id: string) => void;
  onEditRoute: (route: SavedRoute) => void;
  onViewOnMap: (route: SavedRoute) => void;
  onBack: () => void;
}

/* ── Haversine ── */
function getDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
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

/* ── Route Icon ── */
function RouteIcon() {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: '#2563EB' }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    </div>
  );
}

function RouteCard({
  route,
  pins,
  onDelete,
  onEdit,
  onViewOnMap,
}: {
  route: SavedRoute;
  pins: MapPin[];
  onDelete: () => void;
  onEdit: () => void;
  onViewOnMap: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hazardsOpen, setHazardsOpen] = useState(false);

  const nearbyPins = pins.filter((pin) =>
    (route.routePath ?? []).some((point) => getDistance(pin, point) <= 500)
  );
  const nearbyCount = nearbyPins.length;

  const MODE_LABELS: Record<string, string> = {
    DRIVING: '🚗 Car',
    MOTOR: '🛵 Motor',
    TRANSIT: '🚌 Transit',
    WALKING: '🚶 Walk',
  };
  const modeLabel = MODE_LABELS[route.travelMode ?? 'DRIVING'] ?? '🚗 Car';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="rounded-2xl px-4 py-3.5 mb-3 border border-gray-100 shadow-sm"
      style={{ background: '#FFFFFF' }}
    >
      <div className="flex items-start gap-3">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name + mode + distance + time */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-[13px] font-extrabold text-gray-900">
              {route.name || `${route.from} → ${route.to}`}
            </p>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 rounded-full px-2 py-0.5">
              {modeLabel}
            </span>
            {route.distance && (
              <span className="flex items-center gap-1 text-[10px] text-gray-500 font-medium ml-1">
                <Ruler size={9} />{route.distance}
              </span>
            )}
            {route.duration && (
              <span className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                <Clock size={9} />{route.duration}
              </span>
            )}
          </div>

          {/* From -> To with vertical connector */}
          <div className="flex gap-2 mt-2 mb-2">
            <div className="flex flex-col items-center justify-between py-1 flex-shrink-0">
              <div className="w-2 h-2 rounded-full border border-green-500 bg-white flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-green-500" />
              </div>
              <div className="w-[1px] flex-1 bg-gray-200 my-0.5" />
              <div className="w-2 h-2 rounded-full border border-blue-600 bg-white flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1 text-[12px] text-gray-600">
              <span className="truncate leading-tight">{route.from}</span>
              <span className="truncate leading-tight">{route.to}</span>
            </div>
          </div>

          {/* Hazard badge */}
          {nearbyCount > 0 ? (
            <button
              onClick={() => setHazardsOpen((v) => !v)}
              className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-colors"
              style={{ background: '#ef4444', color: 'white' }}
            >
              <AlertCircle size={9} />
              {nearbyCount} Report{nearbyCount > 1 ? 's' : ''} Nearby
              {hazardsOpen ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
            </button>
          ) : (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{ background: '#bbf7d0', color: '#166534' }}>
              ✓ Clear
            </span>
          )}
        </div>

        {/* Menu Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onViewOnMap}
            title="View on Map"
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={onEdit}
            title="Edit Route"
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            title="Delete Route"
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Hazards expanded */}
      <AnimatePresence>
        {hazardsOpen && nearbyPins.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-yellow-300 space-y-1.5 overflow-hidden"
          >
            {nearbyPins.map((pin) => (
              <div key={pin.id} className="flex items-start gap-1.5 text-[11px] text-gray-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                <div>
                  <span className="font-bold">{pin.title}</span>
                  <span className="text-gray-400 ml-1.5 text-[10px]">({pin.address || 'nearby'})</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function RoutesView({ routes, pins, onAddRoute, onDeleteRoute, onEditRoute, onViewOnMap, onBack }: Props) {
  return (
    <div
      className="absolute inset-0 z-40 flex flex-col"
      style={{ background: '#F5F0C0' }}
    >
      {/* Header */}
      <PanelHeader title="Saved Routes" onBack={onBack} />

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {routes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#FFF9C4' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <p className="text-[14px] font-bold text-gray-500">No saved routes yet</p>
            <p className="text-[12px] text-gray-400 mt-1">Tap + to add your first route</p>
          </div>
        ) : (
          <AnimatePresence>
            {routes.map((r) => (
              <RouteCard
                key={r.id}
                route={r}
                pins={pins}
                onDelete={() => onDeleteRoute(r.id)}
                onEdit={() => onEditRoute(r)}
                onViewOnMap={() => onViewOnMap(r)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      <button
        id="add-route-fab"
        onClick={onAddRoute}
        className="absolute bottom-28 right-5 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-transform cursor-pointer"
        style={{ background: '#F59E0B' }}
      >
        <Plus size={28} color="white" strokeWidth={2.5} />
      </button>
    </div>
  );
}
