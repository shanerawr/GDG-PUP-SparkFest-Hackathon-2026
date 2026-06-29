import type { MapPin, SavedRoute, AppNotification, UserReport } from './types';

export const mockPins: MapPin[] = [
  {
    id: '1', type: 'flood', hazardLevel: 'life-threatening',
    lat: 14.6299, lng: 120.9719,
    title: 'Baha sa Tondo Market',
    address: 'Tondo, Manila',
    reportedBy: 'user123', timeAgo: '5 mins ago',
    upvotes: 24,
    description: 'Knee-deep floodwater near the public market. Road is completely impassable. Avoid this area.',
    status: 'acknowledged', threadCount: 7
  },
  {
    id: '2', type: 'road-work', hazardLevel: 'needs-attention',
    lat: 14.5794, lng: 120.9961,
    title: 'Road construction at Quirino Ave',
    address: 'Paco, Manila',
    reportedBy: 'maryreyes', timeAgo: '23 mins ago',
    upvotes: 12,
    description: 'Ongoing road works causing single-lane traffic. Expect 20–30 minute delays.',
    status: 'in-progress', threadCount: 3
  },
  {
    id: '3', type: 'fallen-pole', hazardLevel: 'urgent',
    lat: 14.5786, lng: 120.9822,
    title: 'Natumbang Poste, Ermita',
    address: 'Ermita, Manila',
    reportedBy: 'juandelacruz', timeAgo: '41 mins ago',
    upvotes: 35,
    description: "Electric pole down after last night's storm. Live wires on road. DANGER! Keep away.",
    status: 'acknowledged', threadCount: 12
  },
  {
    id: '4', type: 'car-crash', hazardLevel: 'urgent',
    lat: 14.6009, lng: 120.9752,
    title: 'Aksidente sa Rizal Avenue',
    address: 'Binondo, Manila',
    reportedBy: 'pedrobenedicto', timeAgo: '1 hr ago',
    upvotes: 18,
    description: '2-car collision causing traffic backup across 3 streets. Ambulance already on scene.',
    status: 'in-progress', threadCount: 5
  },
  {
    id: '5', type: 'flood', hazardLevel: 'minor',
    lat: 14.5684, lng: 120.9902,
    title: 'Minor flooding near market',
    address: 'Malate, Manila',
    reportedBy: 'lorenaguzman', timeAgo: '2 hrs ago',
    upvotes: 6,
    description: 'Ankle-deep flooding in the market area. Passable with care.',
    status: 'pending', threadCount: 2
  },
  {
    id: '6', type: 'fire', hazardLevel: 'life-threatening',
    lat: 14.6128, lng: 120.9942,
    title: 'Sunog sa Sampaloc',
    address: 'Sampaloc, Manila',
    reportedBy: 'andreamendoza', timeAgo: '18 mins ago',
    upvotes: 42,
    description: 'Fire in residential area. BFP already responding. Evacuate surrounding areas immediately.',
    status: 'acknowledged', threadCount: 15
  },
  {
    id: '7', type: 'fallen-tree', hazardLevel: 'needs-attention',
    lat: 14.5778, lng: 120.9840,
    title: 'Fallen tree blocking Padre Faura',
    address: 'Ermita, Manila',
    reportedBy: 'rogeliotan', timeAgo: '3 hrs ago',
    upvotes: 9,
    description: 'Large tree fell after strong winds, partially blocking the road.',
    status: 'pending', threadCount: 1
  },
];

export const mockRoutes: SavedRoute[] = [
  {
    id: '1',
    from: 'Home – Tondo, Manila',
    to: 'Work – Makati CBD',
    distance: '17.6 km',
    lastEdited: 'June 7, 2026',
    nearbyReports: 3,
  },
  {
    id: '2',
    from: 'Home – Paco, Manila',
    to: 'School – UST, Sampaloc',
    distance: '8.7 km',
    lastEdited: 'June 7, 2026',
    nearbyReports: 2,
  },
  {
    id: '3',
    from: 'Home – Malate, Manila',
    to: 'Market – Divisoria',
    distance: '5.3 km',
    lastEdited: 'June 7, 2026',
    nearbyReports: 0,
  },
  {
    id: '4',
    from: 'Office – BGC, Taguig',
    to: 'Home – Ermita, Manila',
    distance: '14.2 km',
    lastEdited: 'June 7, 2026',
    nearbyReports: 1,
  },
];

export const mockNotifications: AppNotification[] = [
  {
    id: '1', type: 'new-report', isNew: true,
    title: 'Flood reported at blahplace',
    subtitle: 'details (e.g. depth)',
    detail: 'Reported by user123',
    timeAgo: '7 mins ago',
  },
  {
    id: '2', type: 'reply', isNew: true,
    title: 'User123 replied to your comment',
    detail: 'details about post',
    timeAgo: '7 mins ago',
  },
  {
    id: '3', type: 'new-report', isNew: false,
    title: 'Accident reported at blahplace',
    subtitle: 'details (e.g. depth)',
    detail: 'Reported by user123',
    timeAgo: '7 mins ago',
  },
  {
    id: '4', type: 'upvote', isNew: false,
    title: '76 users upvoted your comment',
    detail: 'details about post',
    timeAgo: '7 mins ago',
  },
];

export const mockUserReports: UserReport[] = [
  {
    id: '1', typeName: 'Flood', typeKey: 'flood',
    moreDetails: 'Knee-deep near Tondo Market',
    date: 'June 19, 2026', time: '10:29 AM',
    location: 'Tondo, Manila',
    status: 'confirmed',
  },
  {
    id: '2', typeName: 'Fallen Tree', typeKey: 'fallen-tree',
    moreDetails: 'Blocking Padre Faura St.',
    date: 'June 19, 2026', time: '10:29 AM',
    location: 'Ermita, Manila',
    status: 'pending',
  },
  {
    id: '3', typeName: 'Road Bumps', typeKey: 'other',
    moreDetails: 'Multiple potholes on road',
    date: 'June 19, 2026', time: '10:29 AM',
    location: 'Binondo, Manila',
    status: 'rejected',
  },
];
