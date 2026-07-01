import { useState } from 'react';
import { Plus, Pencil, Trash2, FileText, MapPin, MoreHorizontal, PieChart, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { LandscapeThumb } from './LandscapeThumb';
import { PanelHeader } from './PanelHeader';
import type { UserReport, UserProfile, MapPin as MapPinType } from '../types';

interface Props {
  reports: UserReport[];
  allPins?: MapPinType[];
  currentUser: UserProfile;
  onAddReport: () => void;
  onEditReport: (report: UserReport) => void;
  onDeleteReport: (report: UserReport) => void;
  onBack: () => void;
  onStatusChange?: (pinId: string, newStatus: string) => void;
  onCategoryChange?: (pinId: string, newCategory: string) => void;
  onVerificationChange?: (pinId: string, newVerification: string) => void;
}

function StatusBadge({ status }: { status: string }) {
  const labelMap: Record<string, string> = {
    unresolved: 'Unresolved',
    'pending-resolution': 'Pending Resolution',
    resolved: 'Resolved',
    pending: 'Unresolved',
    'in-progress': 'Pending Resolution',
    acknowledged: 'Pending Resolution',
  };

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    unresolved: { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
    'pending-resolution': { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    resolved: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    pending: { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
    'in-progress': { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    acknowledged: { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  };

  const displayStatus = labelMap[status] || 'Unresolved';
  const colors = colorMap[status] || colorMap['unresolved'];

  return (
    <span
      className="flex-shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 border"
      style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
    >
      {displayStatus}
    </span>
  );
}

function ReportCard({
  report,
  currentUser,
  onEdit,
  onDelete,
  onStatusChange,
  onCategoryChange,
  onVerificationChange,
}: {
  report: UserReport & { reportedBy?: string; pinId?: string; type?: string };
  currentUser: UserProfile;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange?: (pinId: string, newStatus: string) => void;
  onCategoryChange?: (pinId: string, newCategory: string) => void;
  onVerificationChange?: (pinId: string, newVerification: string) => void;
}) {
  const title = report.title || report.typeName;
  const desc = report.description || report.moreDetails;
  const imageUrl = report.photos && report.photos.length > 0 ? report.photos[0] : null;

  // The creator of the report is the owner. If no reportedBy field is present (legacy data),
  // assume ownership for non-admin users so they can still manage their old local data.
  const isOwner = !report.reportedBy || report.reportedBy === currentUser.username;
  const canEdit = isOwner && currentUser.role !== 'admin';
  const canDelete = isOwner || currentUser.role === 'admin';
  const isResponderRole = ['admin', 'authority', 'lgu'].includes(currentUser.role || '');

  const CATEGORIES: Record<string, string> = {
    'flood': 'Flood',
    'road-damage': 'Road Damage',
    'peace-and-order': 'Peace and Order',
    'utility-outages': 'Utility Outages',
    'waste-collection': 'Waste Collection',
    'infrastructure': 'Infrastructure & Public Works',
    'fire': 'Fire',
    'other': 'Other',
  };

  const safeStatus = (report.status === 'pending' || report.status === 'pending-approval') ? 'unresolved' :
                     (report.status === 'acknowledged' || report.status === 'in-progress') ? 'pending-resolution' :
                     report.status;

  return (
    <div className="flex items-center gap-3.5 rounded-2xl px-3.5 py-3 mb-3 bg-white border border-gray-100 shadow-sm">
      {/* Thumbnail */}
      {imageUrl ? (
        <img src={imageUrl} alt="Report" className="w-[84px] h-[84px] rounded-xl flex-shrink-0 object-cover border border-gray-100" />
      ) : (
        <LandscapeThumb className="w-[84px] h-[84px] rounded-xl flex-shrink-0 object-cover opacity-60 border border-gray-100" />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5" style={{ minHeight: '84px' }}>
        {/* Title + Status + Actions */}
        <div className="flex items-start justify-between gap-1 mb-0.5">
          <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5">
            {isResponderRole && onCategoryChange ? (
              <select
                value={report.typeKey || report.type || 'other'}
                onChange={(e) => onCategoryChange(report.pinId || report.id, e.target.value)}
                className="text-[14px] font-bold text-gray-900 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 outline-none cursor-pointer p-0 pr-4"
              >
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            ) : (
              <p className="text-[14px] font-bold text-gray-900 truncate leading-tight">{title}</p>
            )}

            {isResponderRole && onStatusChange ? (
              <select
                value={safeStatus}
                onChange={(e) => onStatusChange(report.pinId || report.id, e.target.value)}
                className="flex-shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 border cursor-pointer outline-none bg-transparent"
                style={{
                   background: safeStatus === 'unresolved' ? '#fee2e2' : safeStatus === 'pending-resolution' ? '#fff7ed' : '#f0fdf4',
                   color: safeStatus === 'unresolved' ? '#b91c1c' : safeStatus === 'pending-resolution' ? '#ea580c' : '#16a34a',
                   borderColor: safeStatus === 'unresolved' ? '#fca5a5' : safeStatus === 'pending-resolution' ? '#fed7aa' : '#bbf7d0'
                }}
              >
                <option value="unresolved" className="text-red-700 font-bold bg-white">Unresolved</option>
                <option value="pending-resolution" className="text-amber-600 font-bold bg-white">Pending Resolution</option>
                <option value="resolved" className="text-green-600 font-bold bg-white">Resolved</option>
              </select>
            ) : (
              <StatusBadge status={report.status} />
            )}

            {isResponderRole && onVerificationChange ? (
              <select
                value={report.verificationStatus || 'pending'}
                onChange={(e) => onVerificationChange(report.pinId || report.id, e.target.value)}
                className="flex-shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 border cursor-pointer outline-none bg-transparent"
                style={{
                   background: (report.verificationStatus || 'pending') === 'pending' ? '#fef3c7' : (report.verificationStatus === 'verified' ? '#dcfce7' : '#fee2e2'),
                   color: (report.verificationStatus || 'pending') === 'pending' ? '#d97706' : (report.verificationStatus === 'verified' ? '#16a34a' : '#b91c1c'),
                   borderColor: (report.verificationStatus || 'pending') === 'pending' ? '#fde68a' : (report.verificationStatus === 'verified' ? '#bbf7d0' : '#fca5a5')
                }}
              >
                <option value="pending" className="text-amber-600 font-bold bg-white">Pending Verification</option>
                <option value="verified" className="text-green-600 font-bold bg-white">Verified</option>
                <option value="rejected" className="text-red-600 font-bold bg-white">Rejected</option>
              </select>
            ) : (report.verificationStatus === 'verified' || report.verificationStatus === 'rejected') ? (
                <span 
                  className="flex-shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 border"
                  style={{
                    background: report.verificationStatus === 'verified' ? '#dcfce7' : '#fee2e2',
                    color: report.verificationStatus === 'verified' ? '#16a34a' : '#b91c1c',
                    borderColor: report.verificationStatus === 'verified' ? '#bbf7d0' : '#fca5a5'
                  }}
                >
                  {report.verificationStatus === 'verified' ? 'Verified' : 'Rejected'}
                </span>
            ) : (
                <span 
                  className="flex-shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 border bg-amber-50 text-amber-600 border-amber-200"
                >
                  Unverified
                </span>
            )}
          </div>
          <div className="flex items-center flex-shrink-0 gap-1">
            {canEdit && (
              <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer" title="Edit">
                <Pencil size={16} />
              </button>
            )}
            {canDelete && (
              <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer" title="Delete">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Details */}
        {desc && (
          <p className="text-[12px] text-gray-600 truncate leading-snug">{desc}</p>
        )}

        {/* Date & Time & Reporter */}
        <p className="text-[11px] text-gray-500 font-medium leading-snug mt-auto">
          {report.date} <span className="text-gray-300 mx-1">|</span> {report.time}
          {report.reportedBy && (
            <>
              <span className="text-gray-300 mx-1">|</span>
              <span className="text-blue-600 font-bold">@{report.reportedBy}</span>
            </>
          )}
        </p>

        {/* Location */}
        <div className="flex items-center gap-1 leading-snug mt-0.5">
          <MapPin size={11} className="text-gray-400 flex-shrink-0" />
          <p className="text-[11px] text-gray-400 truncate">{report.location || report.address}</p>
        </div>
      </div>
    </div>
  );
}

export function ReportsView({
  reports,
  allPins = [],
  currentUser,
  onAddReport,
  onEditReport,
  onDeleteReport,
  onBack,
  onStatusChange,
  onCategoryChange,
  onVerificationChange,
}: Props) {
  const isAdmin = currentUser?.role === 'admin';
  const isResponder = currentUser?.role === 'lgu' || currentUser?.role === 'authority';
  const isCitizen = !isAdmin && !isResponder;
  const govCategory = (currentUser?.governmentCategory || (
    (currentUser?.username || '').toLowerCase().includes('pnp') ? 'PNP' :
    (currentUser?.username || '').toLowerCase().includes('bfp') ? 'BFP' :
    (currentUser?.username || '').toLowerCase().includes('drrmo') ? 'DRRMO' : 'LGU'
  ))?.toLowerCase();

  const [activeTab, setActiveTab] = useState<'my-reports' | 'summary'>('my-reports');

  const filteredReports = reports.filter(r => {
    if (isAdmin) return true;
    if (isResponder) {
      if (!govCategory) return false;

      const userMuni = currentUser?.municipality?.toLowerCase().trim();
      if (userMuni) {
        const reportLoc = `${r.location || ''} ${r.address || ''} ${r.description || ''} ${r.title || ''} ${r.typeName || ''}`.toLowerCase();
        const muniKey = userMuni.replace(/(city of|city|municipality of|municipality)/g, '').trim();
        if (muniKey && !reportLoc.includes(muniKey)) return false;
      }

      const rawType = (r.typeKey || (r as any).type || r.typeName || '').toLowerCase();
      let type = rawType;
      if (rawType.includes('peace') || rawType.includes('order')) type = 'peace-and-order';
      else if (rawType.includes('road')) type = 'road-damage';
      else if (rawType.includes('flood')) type = 'flood';
      else if (rawType.includes('fire')) type = 'fire';
      else if (rawType.includes('utility') || rawType.includes('outage') || rawType.includes('electric') || rawType.includes('water')) type = 'utility-outages';
      else if (rawType.includes('waste') || rawType.includes('garbage') || rawType.includes('trash')) type = 'waste-collection';
      else if (rawType.includes('infra') || rawType.includes('public') || rawType.includes('work')) type = 'infrastructure';

      switch (type) {
        case 'infrastructure':
          return govCategory === 'lgu';
        case 'peace-and-order':
          return govCategory === 'pnp' || govCategory === 'barangay';
        case 'utility-outages':
          return govCategory === 'lgu' || govCategory === 'barangay';
        case 'flood':
        case 'fire':
          return govCategory === 'drrmo' || govCategory === 'lgu' || govCategory === 'bfp' || govCategory === 'barangay';
        case 'waste-collection':
          return govCategory === 'lgu' || govCategory === 'barangay';
        case 'road-damage':
        case 'other':
          return govCategory === 'lgu';
        default:
          return govCategory === 'lgu';
      }
    }
    return true; // Citizens see their own
  });

  // Compute Summary Statistics
  const userMuni = currentUser?.municipality?.toLowerCase().trim();
  const summaryPins = isCitizen && userMuni
    ? allPins.filter(p => p.address && p.address.toLowerCase().includes(userMuni))
    : [];

  const stats = {
    total: summaryPins.length,
    resolved: summaryPins.filter(p => p.status === 'resolved').length,
    unresolved: summaryPins.filter(p => p.status === 'unresolved' || p.status === 'pending').length,
    inProgress: summaryPins.filter(p => p.status === 'in-progress' || p.status === 'acknowledged').length,
  };

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col"
      style={{ background: '#F5F0C0' }}
    >
      {/* Header */}
      <PanelHeader title={isAdmin || isResponder ? "Reports" : "Citizen Reports"} onBack={onBack} />

      {/* Tabs for Citizens */}
      {isCitizen && (
        <div className="flex bg-[#F5F0C0] px-4 py-2 gap-2">
          <button
            onClick={() => setActiveTab('my-reports')}
            className={`flex-1 py-2 rounded-xl text-[13px] font-bold transition-all ${activeTab === 'my-reports' ? 'bg-[#47B3E8] text-white shadow-md' : 'bg-white/50 text-gray-500 hover:bg-white/80'}`}
          >
            My Reports
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-2 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'summary' ? 'bg-[#47B3E8] text-white shadow-md' : 'bg-white/50 text-gray-500 hover:bg-white/80'}`}
          >
            <PieChart size={14} /> Report Summary
          </button>
        </div>
      )}

      {/* List / Dashboard */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {activeTab === 'my-reports' || isAdmin || isResponder ? (
          filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: '#FFF9C4' }}
              >
                <LandscapeThumb className="w-10 h-10 rounded-lg" />
              </div>
              <p className="text-[14px] font-bold text-gray-500">No reports yet</p>
              <p className="text-[12px] text-gray-400 mt-1">
                {isAdmin || isResponder ? "There are no reports submitted in the system for your department." : "Tap + to submit your first hazard report"}
              </p>
            </div>
          ) : (
            filteredReports.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                currentUser={currentUser}
                onEdit={() => onEditReport(r)}
                onDelete={() => onDeleteReport(r)}
                onStatusChange={onStatusChange}
                onCategoryChange={onCategoryChange}
                onVerificationChange={onVerificationChange}
              />
            ))
          )
        ) : (
          <div className="py-2 animate-in fade-in duration-300">
            {!userMuni ? (
              <div className="bg-white rounded-3xl p-6 text-center border border-gray-100 shadow-sm mt-4">
                <MapPin size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-[14px] font-bold text-gray-800">No Municipality Set</p>
                <p className="text-[12px] text-gray-500 mt-1">
                  Please update your profile to set your municipality (e.g. "Quezon City") to view local LGU performance.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h2 className="text-[18px] font-extrabold text-gray-900 leading-tight">LGU Performance Tracker</h2>
                  <p className="text-[13px] font-semibold text-[#47B3E8] uppercase tracking-wider mt-0.5">{currentUser.municipality}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                    <p className="text-[24px] font-black text-gray-800">{stats.total}</p>
                    <p className="text-[11px] font-bold text-gray-400 uppercase">Total Reports</p>
                  </div>
                  <div className="bg-[#f0fdf4] p-4 rounded-2xl border border-[#bbf7d0] shadow-sm text-center">
                    <CheckCircle size={20} className="mx-auto text-[#16a34a] mb-1 opacity-80" />
                    <p className="text-[20px] font-black text-[#16a34a] leading-none">{stats.resolved}</p>
                    <p className="text-[10px] font-extrabold text-[#15803d] uppercase mt-1">Resolved</p>
                  </div>
                  <div className="bg-[#fee2e2] p-4 rounded-2xl border border-[#fca5a5] shadow-sm text-center">
                    <Clock size={20} className="mx-auto text-[#b91c1c] mb-1 opacity-80" />
                    <p className="text-[20px] font-black text-[#b91c1c] leading-none">{stats.unresolved}</p>
                    <p className="text-[10px] font-extrabold text-[#991b1b] uppercase mt-1">Unresolved</p>
                  </div>
                  <div className="bg-[#fff7ed] p-4 rounded-2xl border border-[#fed7aa] shadow-sm text-center">
                    <RefreshCw size={20} className="mx-auto text-[#ea580c] mb-1 opacity-80" />
                    <p className="text-[20px] font-black text-[#ea580c] leading-none">{stats.inProgress}</p>
                    <p className="text-[10px] font-extrabold text-[#c2410c] uppercase mt-1">In Progress</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[14px] font-extrabold text-gray-700 ml-1">Recent Reports in {currentUser.municipality}</h3>
                  {summaryPins.length === 0 ? (
                    <p className="text-[13px] text-gray-500 bg-white p-4 rounded-xl text-center shadow-sm">No reports found.</p>
                  ) : (
                    summaryPins.slice().reverse().map(pin => (
                      <ReportCard
                        key={pin.id}
                        report={{
                          id: pin.id || '',
                          title: pin.title || '',
                          typeName: pin.type || 'Other',
                          description: pin.description || '',
                          date: new Date(pin.createdAt || Date.now()).toLocaleDateString(),
                          time: new Date(pin.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          location: pin.address || '',
                          latitude: pin.lat,
                          longitude: pin.lng,
                          status: pin.status || 'pending',
                          reportedBy: pin.reportedBy,
                          photos: pin.photos || (pin.photo ? [pin.photo] : []),
                        }}
                        currentUser={currentUser}
                        onEdit={() => {}}
                        onDelete={() => {}}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* FAB - Hide for admins, responders, and if on Summary tab */}
      {isCitizen && activeTab === 'my-reports' && (
        <button
          id="add-report-fab"
          onClick={onAddReport}
          className="absolute bottom-28 right-5 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-transform cursor-pointer"
          style={{ background: '#F59E0B' }}
        >
          <Plus size={28} color="white" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
