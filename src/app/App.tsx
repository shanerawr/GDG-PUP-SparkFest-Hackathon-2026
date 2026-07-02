import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapView } from './components/MapView';
import { BottomNav } from './components/BottomNav';
import { NotificationsPanel } from './components/NotificationsPanel';
import { RoutesView } from './components/RoutesView';
import { ReportsView } from './components/ReportsView';
import { ProfileView } from './components/ProfileView';
import { VerificationView } from './components/VerificationView';
import { AiTrendAnalysisPanel } from './components/AiTrendAnalysisPanel';
import { PanelHeader } from './components/PanelHeader';
import { AddReportModal } from './components/AddReportModal';
import { ReportDetailPanel } from './components/ReportDetailPanel';
import { AddRouteModal } from './components/AddRouteModal';
import { LoginOverlay } from './components/LoginOverlay';
import { VerificationModal } from './components/VerificationModal';
import { useRoutes } from './hooks/useRoutes';
import { useLanguage } from './contexts/LanguageContext';
import { matchMunicipality, inferMunicipalityFromAddress } from './utils/municipalityMatcher';
import type { AppPanel, MapPin, UserReport, SavedRoute, UserProfile } from './types';

const CATEGORIES = [
  { key: 'flood', label: 'Flood' },
  { key: 'road-damage', label: 'Road Damage' },
  { key: 'peace-and-order', label: 'Peace & Order' },
  { key: 'utility-outages', label: 'Utility Outages' },
  { key: 'waste-collection', label: 'Waste Collection' },
  { key: 'infrastructure', label: 'Infrastructure & Public Works' },
  { key: 'fire', label: 'Fire' },
  { key: 'other', label: 'Other' }
];

export default function App() {
  const { t } = useLanguage();
  const [activePanel, setActivePanel] = useState<AppPanel>(null);
  const [reportsInitialTab, setReportsInitialTab] = useState<'my-reports' | 'summary'>('my-reports');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [showAddReport, setShowAddReport] = useState(false);
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [editingReport, setEditingReport] = useState<UserReport | null>(null);
  const [editingRoute, setEditingRoute] = useState<SavedRoute | null>(null);
  const [detailPin, setDetailPin] = useState<MapPin | null>(null);
  const [activeRoute, setActiveRoute] = useState<SavedRoute | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { routes, addRoute, updateRoute, deleteRoute } = useRoutes();

  const [pins, setPins] = useState<MapPin[]>([]);
  const [userReports, setUserReports] = useState<UserReport[]>([]);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('bb_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

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

  // Synchronize and apply theme preference
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('bb_theme', theme);
  }, [theme]);

  const fetchPins = () => {
    fetch('/api/pins')
      .then(res => res.json())
      .then(data => setPins(data))
      .catch(err => console.error('Error fetching pins:', err));
  };

  const fetchReports = (username?: string) => {
    const isPrivileged = currentUser?.role === 'admin' || currentUser?.role === 'lgu' || currentUser?.role === 'authority';
    const targetUser = isPrivileged ? undefined : (username || currentUser?.username);
    const url = targetUser ? `/api/reports?username=${targetUser}` : '/api/reports';
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
  }, []);

  // Support deep linking to a specific pin via ?pinId=...
  useEffect(() => {
    if (pins.length > 0 && !detailPin) {
      const params = new URLSearchParams(window.location.search);
      const pinId = params.get('pinId');
      if (pinId) {
        const found = pins.find(p => p.id === pinId);
        if (found) {
          setDetailPin(found);
        }
      }
    }
  }, [pins]);

  const filteredPins = useMemo(() => {
    const activePins = pins.filter(p => p.status !== 'resolved');

    if (!currentUser) return activePins;
    const isResponder = currentUser.role === 'authority' || currentUser.role === 'lgu';
    if (!isResponder) return activePins;

    const govCat = (currentUser?.governmentCategory || (
      (currentUser?.username || '').toLowerCase().includes('pnp') ? 'PNP' :
      (currentUser?.username || '').toLowerCase().includes('bfp') ? 'BFP' :
      (currentUser?.username || '').toLowerCase().includes('drrmo') ? 'DRRMO' : 'LGU'
    ))?.toLowerCase();
    const userMuni = currentUser.municipality?.toLowerCase().trim();

    return activePins.filter(p => {
      if (!govCat) return false;
      let catMatch = false;
      const rawType = (p.type || (p as any).typeKey || '').toLowerCase();
      let type = rawType;
      if (rawType.includes('peace') || rawType.includes('order')) type = 'peace-and-order';
      else if (rawType.includes('road')) type = 'road-damage';
      else if (rawType.includes('flood')) type = 'flood';
      else if (rawType.includes('fire')) type = 'fire';
      else if (rawType.includes('utility') || rawType.includes('outage') || rawType.includes('electric') || rawType.includes('water')) type = 'utility-outages';
      else if (rawType.includes('waste') || rawType.includes('garbage') || rawType.includes('trash')) type = 'waste-collection';
      else if (rawType.includes('infra') || rawType.includes('public') || rawType.includes('work')) type = 'infrastructure';

      switch (type) {
        case 'infrastructure': catMatch = govCat === 'lgu' || govCat === 'barangay'; break;
        case 'peace-and-order': catMatch = govCat === 'pnp' || govCat === 'barangay'; break;
        case 'utility-outages': catMatch = govCat === 'lgu' || govCat === 'barangay'; break;
        case 'flood':
        case 'fire': catMatch = govCat === 'drrmo' || govCat === 'lgu' || govCat === 'bfp' || govCat === 'barangay'; break;
        case 'waste-collection': catMatch = govCat === 'lgu' || govCat === 'barangay'; break;
        case 'road-damage':
        case 'other': catMatch = govCat === 'lgu' || govCat === 'barangay'; break;
        default: catMatch = govCat === 'lgu' || govCat === 'barangay';
      }
      if (!catMatch) return false;

      if (userMuni) {
        const isBrgyRole = govCat === 'barangay' || currentUser?.role === 'barangay' || currentUser?.governmentCategory?.toLowerCase() === 'barangay';
        const loc = `${p.municipality || ''} ${p.address || ''} ${p.location || ''} ${p.description || ''} ${p.title || ''}`;
        if (!matchMunicipality(userMuni, loc, isBrgyRole)) return false;
      }
      return true;
    });
  }, [pins, currentUser]);

  const filteredReports = useMemo(() => {
    if (!currentUser) return userReports;
    const isPrivileged = currentUser.role === 'admin' || currentUser.role === 'lgu' || currentUser.role === 'authority';
    if (!isPrivileged || currentUser.role === 'admin') return userReports;

    const userMuni = currentUser.municipality?.toLowerCase().trim();
    if (!userMuni) return userReports;

    const isBrgyRole = currentUser.role === 'barangay' || currentUser.governmentCategory?.toLowerCase() === 'barangay';
    return userReports.filter(r => {
      const loc = `${r.municipality || ''} ${r.location || ''} ${r.address || ''} ${r.description || ''} ${r.title || ''}`;
      return matchMunicipality(userMuni, loc, isBrgyRole);
    });
  }, [userReports, currentUser]);

  // Fetch reports when current user changes/logs in
  useEffect(() => {
    if (currentUser) {
      fetchReports();
    }
  }, [currentUser]);

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
    if (panel === 'reports') setReportsInitialTab('my-reports');
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

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'report' | 'route'; id: string; name?: string } | null>(null);

  const handleDeleteReport = (report: UserReport) => {
    if (!currentUser) return;
    setDeleteTarget({ type: 'report', id: report.id, name: report.typeName });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    if (type === 'report') {
      fetch(`/api/reports/${id}`, { method: 'DELETE' })
        .then(() => {
          setUserReports(prev => prev.filter(r => r.id !== id));
          fetchPins();
          setDeleteTarget(null);
        })
        .catch(console.error);
    } else {
      deleteRoute(id);
      setDeleteTarget(null);
    }
  };

  const handleEditReportClick = (report: UserReport) => {
    const pin = pins.find(p => p.id === report.pinId?.toString() || p.id === report.pinId);
    setEditingReport({
      ...report,
      title: report.typeName,
      type: report.typeKey,
      address: report.location,
      description: report.moreDetails,
      lat: pin ? pin.lat : 14.5995,
      lng: pin ? pin.lng : 120.9842,
      hazardLevel: pin ? pin.hazardLevel : 'minor',
    } as any);
    setShowAddReport(true);
  };

  const handleAddReportSubmit = (reportData: { type: string; title: string; address: string; description: string; lat: number; lng: number; photo?: string; photos?: string[]; hazardLevel?: string; municipality?: string }) => {
    if (!currentUser) return;

    const muniTag = reportData.municipality || inferMunicipalityFromAddress(reportData.address);

    if (editingReport) {
      // Edit existing report
      fetch(`/api/pins/${editingReport.pinId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reportData,
          title: reportData.title,
          municipality: muniTag,
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
          title: reportData.title,
          reportedBy: currentUser.username,
          municipality: muniTag,
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
    <div
      className="relative overflow-hidden w-full h-dvh"
      style={theme === 'dark' ? { background: '#918a66' } : { background: '#F5F0C0' }}
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
              pins={filteredPins}
              activeRoute={activeRoute}
              onOpenDetail={pin => {
                setActivePanel(null);
                setDetailPin(pin);
              }}
              onClearActiveRoute={() => setActiveRoute(null)}
              theme={theme}
              currentUser={currentUser}
            />
          </div>

          {/* Pages — shown instantly when a nav tab is selected */}
          {activePanel === 'notifications' && (
            <NotificationsPanel
              notifications={notifications}
              pins={pins}
              onMarkAllRead={handleMarkAllRead}
              onDeleteNotif={handleDeleteNotif}
              onBack={() => setActivePanel(null)}
              onSelectNotif={(pinId) => {
                const pin = pins.find(p => p.id === pinId);
                if (pin) {
                  setActivePanel(null);
                  setDetailPin(pin);
                }
              }}
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
              onDeleteRoute={id => {
                const route = routes.find(r => r.id === id);
                setDeleteTarget({ type: 'route', id, name: route?.name });
              }}
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
          {activePanel === 'reports' && currentUser && (
            <ReportsView
              reports={filteredReports}
              allPins={pins}
              currentUser={currentUser}
              initialTab={reportsInitialTab}
              onAddReport={handleAddReportClick}
              onEditReport={handleEditReportClick}
              onDeleteReport={handleDeleteReport}
              onBack={() => handlePanelSelect(null)}
              onStatusChange={(pinId, newStatus) => {
                fetch(`/api/pins/${pinId}/status`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: newStatus, username: currentUser!.username }),
                }).then(() => {
                  fetchReports(currentUser!.username);
                  fetchPins();
                }).catch(console.error);
              }}
              onCategoryChange={(pinId, newCategory) => {
                fetch(`/api/pins/${pinId}/category`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ category: newCategory, username: currentUser!.username }),
                }).then(() => {
                  fetchReports(currentUser!.username);
                  fetchPins();
                }).catch(console.error);
              }}
              onVerificationChange={(pinId, newVerification) => {
                fetch(`/api/pins/${pinId}/verification`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ verificationStatus: newVerification, username: currentUser!.username }),
                }).then(() => {
                  fetchReports(currentUser!.username);
                  fetchPins();
                }).catch(console.error);
              }}
              onViewReport={(pinId) => {
                const pin = pins.find(p => p.id === pinId);
                if (pin) {
                  setActivePanel(null);
                  setDetailPin(pin);
                }
              }}
            />
          )}
          {activePanel === 'ai-trends' && currentUser && (
            <div className="relative flex-1 flex flex-col bg-gradient-to-br from-[#0A1128] via-[#0F1D3E] to-[#0A1128] overflow-y-auto px-4 pb-28 animate-in fade-in duration-300">
              {/* Animated Ambient Glowing Orbs */}
              <div className="absolute top-12 left-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
              <div className="absolute top-1/2 right-6 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
              <div className="absolute bottom-10 left-6 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '7s' }} />

              <div className="relative z-10">
                <PanelHeader 
                  title={(t as any).aiTrends?.tabLabel || 'AI Trend Analysis'} 
                  onBack={() => handlePanelSelect(null)} 
                  bg="transparent" 
                  titleColor="text-white"
                />
              </div>
              <div className="relative z-10 mt-2">
                <AiTrendAnalysisPanel currentUser={currentUser} />
              </div>
            </div>
          )}
          {activePanel === 'profile' && currentUser && (
            <ProfileView
              currentUser={{
                ...currentUser,
                reportsCount: pins.filter(p => p.reportedBy === currentUser.username).length,
                upvotesCount: pins.filter(p => p.reportedBy === currentUser.username).reduce((acc, p) => acc + (p.upvotes || 0), 0)
              }}
              onProfileUpdate={handleProfileUpdate}
              onLogout={handleLogout}
              onStartVerification={() => setShowVerification(true)}
              onBack={() => setActivePanel(null)}
              theme={theme}
              onThemeToggle={toggleTheme}
            />
          )}
          {activePanel === 'verification' && currentUser && (
            <VerificationView
              currentUser={currentUser}
              onBack={() => setActivePanel(null)}
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
              userRole={currentUser?.role}
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
              theme={theme}
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
              theme={theme}
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
        <AnimatePresence>
          {deleteTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/45 backdrop-blur-[2px] z-[70] flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="bg-white rounded-3xl p-6 shadow-2xl max-w-[320px] w-full text-center border border-gray-100"
              >
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 text-red-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/>
                  </svg>
                </div>
                <h3 className="text-[16px] font-extrabold text-gray-900 mb-2">
                  Delete {deleteTarget.type === 'report' ? 'Report?' : 'Route?'}
                </h3>
                <p className="text-[12px] text-gray-500 leading-relaxed mb-6">
                  Are you sure you want to delete {deleteTarget.name ? `"${deleteTarget.name}"` : `this ${deleteTarget.type}`}? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-[13px] font-bold hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white text-[13px] font-bold hover:bg-red-600 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}
