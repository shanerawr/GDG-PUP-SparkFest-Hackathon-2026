export type HazardLevel = 'minor' | 'needs-attention' | 'urgent' | 'life-threatening';
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
}

export interface AppNotification {
  id: string;
  type: 'new-report' | 'reply' | 'upvote' | 'route-alert';
  isNew: boolean;
  title: string;
  subtitle?: string;
  detail: string;
  timeAgo: string;
}


export interface UserReport {
  id: string;
  typeName: string;
  typeKey: ReportType;
  moreDetails: string;
  date: string;
  time: string;
  location: string;
  status: 'confirmed' | 'pending' | 'rejected';
}

export type HazardFilter = 'all' | HazardLevel;

export const HAZARD_COLORS: Record<HazardLevel, { bg: string; ring: string; label: string; chip: string }> = {
  minor: { bg: '#16a34a', ring: '#bbf7d0', label: 'Minor', chip: 'bg-green-100 text-green-800 border-green-300' },
  'needs-attention': { bg: '#ca8a04', ring: '#fef08a', label: 'Needs Attention', chip: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  urgent: { bg: '#ea580c', ring: '#fed7aa', label: 'Urgent', chip: 'bg-orange-100 text-orange-800 border-orange-300' },
  'life-threatening': { bg: '#dc2626', ring: '#fecaca', label: 'Life-Threatening', chip: 'bg-red-100 text-red-800 border-red-300' },
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
