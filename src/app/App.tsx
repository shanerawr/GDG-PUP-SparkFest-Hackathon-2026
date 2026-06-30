import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { MapView } from './components/MapView';
import { BottomNav } from './components/BottomNav';
import { NotificationsPanel } from './components/NotificationsPanel';
import { RoutesView } from './components/RoutesView';
import { ReportsView } from './components/ReportsView';
import { ProfileView } from './components/ProfileView';
import { AddReportModal } from './components/AddReportModal';
import { ReportDetailPanel } from './components/ReportDetailPanel';
import { AddRouteModal } from './components/AddRouteModal';
import { LoginOverlay } from './components/LoginOverlay';
import { VerificationModal } from './components/VerificationModal';
import { useRoutes } from './hooks/useRoutes';
import type { AppPanel, MapPin, UserReport, SavedRoute, UserProfile } from './types';

const CATEGORIES = [
  { key: 'hazard', label: 'Road Hazard' },
  { key: 'flood', label: 'Flood' },
  { key: 'accident', label: 'Accident' },
  { key: 'traffic', label: 'Traffic' }
];

export default function App() {
  const [activePanel, setActivePanel] = useState<AppPanel>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [showAddReport, setShowAddReport] = useState(false);
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [editingReport, setEditingReport] = useState<UserReport | null>(null);
  const [editingRoute, setEditingRoute] = useState<SavedRoute | null>(null);
  const [detailPin, setDetailPin] = useState<MapPin | null>(null);
  const [activeRoute, setActiveRoute] = useState<SavedRoute | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [language, setLanguage] = useState<'en' | 'fil'>('en');
  const { routes, addRoute, updateRoute, deleteRoute } = useRoutes();
  
  const [pins, setPins] = useState<MapPin[]>([]);
  const [userReports, setUserReports] = useState<UserReport[]>([]);

  // Load user session on mount
  useEffect(() => {
    const saved = localStorage.getItem('bb_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentUser(parsed);
        fetch('/api/accounts/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: parsed.username }),
        })
          .then(async (res) => {
            const text = await res.text();
            const data = text ? JSON.parse(text) : {};
            if (!res.ok || data.error) {
              throw new Error(data.error || 'Session invalid');
            }
            return data;
          })
          .then(data => {
            const updated = { ...parsed, ...data };
            setCurrentUser(updated);
            localStorage.setItem('bb_user', JSON.stringify(updated));
          })
          .catch(err => {
            console.error(err);
            setCurrentUser(null);
            localStorage.removeItem('bb_user');
          });
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Load and apply user theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('bb_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const fetchPins = () => {
    fetch('/api/pins')
      .then(res => res.json())
      .then(data => setPins(data))
      .catch(err => console.error('Error fetching pins:', err));
  };

  const fetchReports = (username?: string) => {
    const url = username ? `/api/reports?username=${username}` : '/api/reports';
    fetch(url)
      .then(res => res.json())
      .then(data => setUserReports(data))
      .catch(err => console.error('Error fetching reports:', err));
  };

  const fetchNotifications = () => {
    const user = currentUser?.username;
    if (!user) return;
    fetch(`/api/notifications?username=${user}`)
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(err => console.error('Error fetching notifications:', err));
  };

  useEffect(() => {
    fetchPins();
    fetchReports();
  }, []);

  // Poll notifications
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(() => {
        fetchNotifications();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const unreadCount = notifications.filter(n => n.isNew).length;

  const handlePanelSelect = (panel: AppPanel) => {
    setActivePanel(panel);
  };

  const handleAddReportClick = () => {
    if (!currentUser) return;
    if (!currentUser.isVerified) {
      setShowVerification(true);
    } else {
      setShowAddReport(true);
    }
  };

  const handleAddReportSubmit = (reportData: { type: string; address: string; description: string; lat: number; lng: number; photo?: string; photos?: string[] }) => {
    if (!currentUser) return;
    
    if (editingReport) {
      // Edit existing report
      fetch(`/api/pins/${editingReport.pinId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reportData,
          title: CATEGORIES.find(c => c.key === reportData.type)?.label || 'Reported Hazard',
        }),
      }).then(() => {
        fetchReports(currentUser.username);
        fetchPins();
      }).catch(console.error);
    } else {
      // Create new report
      fetch('/api/pins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reportData,
          title: CATEGORIES.find(c => c.key === reportData.type)?.label || 'Reported Hazard',
          reportedBy: currentUser.username,
        }),
      }).then(res => res.json())
        .then(() => {
          fetchReports(currentUser.username);
          fetchPins(); // Refresh pins on map
        })
        .catch(console.error);
    }
    
    setShowAddReport(false);
    setEditingReport(null);
  };

  const handleMarkAllRead = () => {
    if (!currentUser) return;
    fetch('/api/notifications/mark-read', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser.username }),
    })
      .then(() => fetchNotifications())
      .catch(err => console.error(err));
  };

  const handleDeleteNotif = (id: string) => {
    fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      .then(() => fetchNotifications())
      .catch(err => console.error(err));
  };

  const handleProfileUpdate = (updated: UserProfile) => {
    setCurrentUser(updated);
    localStorage.setItem('bb_user', JSON.stringify(updated));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('bb_user');
    setNotifications([]);
    setActivePanel(null);
  };

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#D4C97A' }}>
      <div
        className="relative overflow-hidden w-full h-dvh sm:max-w-[768px] sm:h-[min(880px,calc(100vh-120px))] sm:rounded-[32px] sm:border-[6px] sm:border-slate-800 sm:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] lg:max-w-full lg:h-screen lg:rounded-none lg:border-0 lg:shadow-none"
        style={{ background: '#F5F0C0' }}
      >
        {/* ── Login Overlay ── */}
        {!currentUser && (
          <LoginOverlay
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              localStorage.setItem('bb_user', JSON.stringify(user));
            }}
          />
        )}

        {/* ── Content area (map + panels) — fills full height ── */}
        <div className="absolute inset-0">
          {/* Map — always the base layer */}
          <div className="absolute inset-0">
            <MapView
              pins={pins}
              activeRoute={activeRoute}
              onOpenDetail={pin => {
                setActivePanel(null);
                setDetailPin(pin);
              }}
              onClearActiveRoute={() => setActiveRoute(null)}
            />
          </div>

          {/* Pages — shown instantly when a nav tab is selected */}
          {activePanel === 'notifications' && (
            <NotificationsPanel
              notifications={notifications}
              onMarkAllRead={handleMarkAllRead}
              onDeleteNotif={handleDeleteNotif}
              onBack={() => setActivePanel(null)}
            />
          )}
          {activePanel === 'routes' && (
            <RoutesView
              routes={routes}
              pins={pins}
              onAddRoute={() => {
                setActivePanel(null);
                setShowAddRoute(true);
              }}
              onDeleteRoute={deleteRoute}
              onEditRoute={route => {
                setEditingRoute(route);
                setActivePanel(null);
              }}
              onViewOnMap={route => {
                setActiveRoute(route);
                setActivePanel(null);
              }}
              onBack={() => setActivePanel(null)}
            />
          )}
          {activePanel === 'reports' && (
            <ReportsView
              reports={userReports}
              onAddReport={handleAddReportClick}
              onBack={() => setActivePanel(null)}
            />
          )}
          {activePanel === 'profile' && currentUser && (
            <ProfileView
              language={language}
              onLanguageToggle={() => setLanguage(l => (l === 'en' ? 'fil' : 'en'))}
              currentUser={currentUser}
              onProfileUpdate={handleProfileUpdate}
              onLogout={handleLogout}
              onStartVerification={() => setShowVerification(true)}
            />
          )}
        </div>

        {/* ── Bottom nav — floats over the map ── */}
        <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <BottomNav
              activePanel={activePanel}
              onSelect={handlePanelSelect}
              unreadCount={unreadCount}
            />
          </div>
        </div>

        {/*
          Full-screen modals are rendered INSIDE the phone shell's relative container
          and positioned absolute so they can cover everything including the nav,
          while staying strictly bounded by the container size.
        */}
        <AnimatePresence>
          {detailPin && (
            <ReportDetailPanel
              key="detail"
              pin={detailPin}
              onClose={() => setDetailPin(null)}
              currentUser={currentUser}
              onCommentAdded={fetchNotifications}
              onStatusUpdated={fetchPins}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {(showAddRoute || editingRoute) && (
            <AddRouteModal
              key="add-route"
              pins={pins}
              editRoute={editingRoute ?? undefined}
              onClose={() => { setShowAddRoute(false); setEditingRoute(null); }}
              onSave={route => {
                if (editingRoute) {
                  updateRoute(editingRoute.id, route);
                } else {
                  addRoute(route);
                }
                setShowAddRoute(false);
                setEditingRoute(null);
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showAddReport && (
            <AddReportModal
              key="add-report"
              initialData={editingReport ?? undefined}
              onClose={() => { setShowAddReport(false); setEditingReport(null); }}
              onSubmit={handleAddReportSubmit}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showVerification && currentUser && (
            <VerificationModal
              key="verification"
              user={currentUser}
              onClose={() => setShowVerification(false)}
              onVerificationUpdate={handleProfileUpdate}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
