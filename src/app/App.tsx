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

export default function App() {
  const [activePanel, setActivePanel] = useState<AppPanel>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [showAddReport, setShowAddReport] = useState(false);
  const [showAddRoute, setShowAddRoute] = useState(false);
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

  const fetchReports = () => {
    fetch('/api/reports')
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

  const handleAddReportSubmit = (reportData: { type: string; address: string; description: string; lat: number; lng: number; photo?: string }) => {
    fetch('/api/pins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...reportData,
        reportedBy: currentUser?.username || 'anonymous',
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to create report');
        return res.json();
      })
      .then(() => {
        fetchPins();
        fetchReports();
        fetchNotifications();
        setShowAddReport(false);
        
        // Also update local reports count
        if (currentUser) {
          const updated = {
            ...currentUser,
            reportsCount: (currentUser.reportsCount || 0) + 1
          };
          setCurrentUser(updated);
          localStorage.setItem('bb_user', JSON.stringify(updated));
          fetch('/api/accounts/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          }).catch(err => console.error(err));
        }
      })
      .catch(err => console.error(err));
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
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div
        className="relative flex flex-col bg-white overflow-hidden w-full h-dvh sm:max-w-[768px] sm:h-[min(880px,calc(100vh-120px))] sm:rounded-[32px] sm:border-[6px] sm:border-slate-800 sm:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] lg:max-w-full lg:h-screen lg:rounded-none lg:border-0 lg:shadow-none"
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

        {/* ── Content area (map + panels) ── */}
        <div className="flex-1 relative overflow-hidden min-h-0">
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
            />
          )}
          {activePanel === 'reports' && (
            <ReportsView
              reports={userReports}
              onAddReport={handleAddReportClick}
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

        {/* ── Bottom nav — always rendered in document flow, never overlapped ── */}
        <BottomNav
          activePanel={activePanel}
          onSelect={handlePanelSelect}
          unreadCount={unreadCount}
        />

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
              onClose={() => setShowAddReport(false)}
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
