export type HazardLevel = 'minor' | 'needs-attention' | 'urgent' | 'life-threatening' | 'critical';
export type ReportStatus = 'pending' | 'acknowledged' | 'in-progress' | 'resolved';
export type ReportType = 'flood' | 'fallen-tree' | 'road-work' | 'car-crash' | 'fallen-pole' | 'fire' | 'landslide' | 'other';
export type AppPanel = 'notifications' | 'routes' | 'reports' | 'profile' | null;

export interface MapPin {
  id: string;
  type: ReportType;
  hazardLevel: HazardLevel;
  lat: number;
  lng: number;
  title: string;
  address: string;
  reportedBy: string;
  timeAgo: string;
  upvotes: number;
  description: string;
  status: ReportStatus;
  threadCount: number;
  photo?: string; // Kept for backwards compatibility
  photos?: string[];
  radius?: number; // Affected area radius in meters
}

export interface SavedRoute {
  id: string;
  name: string;
  from: string;
  to: string;
  distance: string;
  duration: string;
  lastEdited: string;
  nearbyReports: number;
  travelMode?: string; // 'DRIVING' | 'MOTOR' | 'TRANSIT' | 'WALKING'
  routePath: { lat: number; lng: number }[];
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isVerified: boolean;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  reportsCount: number;
  upvotesCount: number;
  joinedDate: string;
  role?: 'citizen' | 'authority' | 'lgu' | 'admin';
  governmentCategory?: string;
  notifSettings: {
    pushEnabled: boolean;
    newPinNearby: boolean;
    replyReceived: boolean;
    upvotesOnPost: boolean;
  };
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timeAgo: string;
  role?: 'citizen' | 'authority' | 'lgu' | 'admin';
  governmentCategory?: string;
  parentId?: string;
  upvotes?: number;
  downvotes?: number;
  flags?: number;
  upvotedBy?: string[];
  downvotedBy?: string[];
  flaggedBy?: string[];
}

export interface AppNotification {
  id: string;
  type: 'new-report' | 'reply' | 'upvote' | 'route-alert';
  isNew: boolean;
  title: string;
  subtitle?: string;
  detail: string;
  timeAgo: string;
  pinId?: string;
}


export interface UserReport {
  id: string;
  typeName: string;
  typeKey: ReportType;
  moreDetails: string;
  date: string;
  time: string;
  location: string;
  status: ReportStatus;
  radius?: number; // Affected area radius in meters
}

export type HazardFilter = 'all' | HazardLevel;

export const HAZARD_COLORS: Record<HazardLevel, { bg: string; ring: string; label: string; chip: string }> = {
  minor: { bg: '#16a34a', ring: '#bbf7d0', label: 'Minor', chip: 'bg-green-100 text-green-800 border-green-300' },
  'needs-attention': { bg: '#ca8a04', ring: '#fef08a', label: 'Needs Attention', chip: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  urgent: { bg: '#ea580c', ring: '#fed7aa', label: 'Urgent', chip: 'bg-orange-100 text-orange-800 border-orange-300' },
  'life-threatening': { bg: '#dc2626', ring: '#fecaca', label: 'Life-Threatening', chip: 'bg-red-100 text-red-800 border-red-300' },
  critical: { bg: '#dc2626', ring: '#fecaca', label: 'Critical', chip: 'bg-red-100 text-red-800 border-red-300' },
};

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  flood: 'Flood / Baha',
  'fallen-tree': 'Fallen Tree / Natumbang Puno',
  'road-work': 'Road Works / Ginagawang Kalsada',
  'car-crash': 'Vehicular Accident / Car Crash',
  'fallen-pole': 'Fallen Pole / Natumbang Poste',
  fire: 'Fire / Sunog',
  landslide: 'Landslide / Pagguho ng Lupa',
  other: 'Other / Iba pa',
};

export const reportSvgPaths: Record<string, string> = {
  flood: 'M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z',
  'fallen-tree': 'M17 22H7M12 22v-5M9 13l3-3 3 3M8 17l4-4 4 4',
  'road-work': 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  'car-crash': 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 .6.4 1 1 1h2M7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  'fallen-pole': 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  fire: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  landslide: 'M8 3v10M3 13h10M16 18l4-4 4 4M20 14v8',
  other: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
};
