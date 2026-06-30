import { Plus, Pencil, Trash2, FileText, MapPin, MoreHorizontal } from 'lucide-react';
import { LandscapeThumb } from './LandscapeThumb';
import { PanelHeader } from './PanelHeader';
import type { UserReport } from '../types';

interface Props {
  reports: UserReport[];
  currentUser: UserProfile;
  onAddReport: () => void;
  onEditReport: (report: UserReport) => void;
  onDeleteReport: (report: UserReport) => void;
  onBack: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const isResolved = status === 'resolved';
  const displayStatus = isResolved ? 'Resolved' : 'Active';
  const colors = isResolved
    ? { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' }
    : { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };

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
}: {
  report: UserReport & { reportedBy?: string };
  currentUser: UserProfile;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const title = report.title || report.typeName;
  const desc = report.description || report.moreDetails;
  const imageUrl = report.photos && report.photos.length > 0 ? report.photos[0] : null;

  // The creator of the report is the owner. If no reportedBy field is present (legacy data),
  // assume ownership for non-admin users so they can still manage their old local data.
  const isOwner = !report.reportedBy || report.reportedBy === currentUser.username;
  const canEdit = isOwner && currentUser.role !== 'admin';
  const canDelete = isOwner || currentUser.role === 'admin';

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
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <p className="text-[14px] font-bold text-gray-900 truncate leading-tight">{title}</p>
            <StatusBadge status={report.status} />
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
  currentUser,
  onAddReport,
  onEditReport,
  onDeleteReport,
  onBack,
}: Props) {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col"
      style={{ background: '#F5F0C0' }}
    >
      {/* Header */}
      <PanelHeader title={isAdmin || currentUser?.role === 'lgu' || currentUser?.role === 'authority' ? "Reports" : "My Reports"} onBack={onBack} />

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: '#FFF9C4' }}
            >
              <LandscapeThumb className="w-10 h-10 rounded-lg" />
            </div>
            <p className="text-[14px] font-bold text-gray-500">No reports yet</p>
            <p className="text-[12px] text-gray-400 mt-1">
              {isAdmin ? "There are no reports submitted in the system." : "Tap + to submit your first hazard report"}
            </p>
          </div>
        ) : (
          reports.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              currentUser={currentUser}
              onEdit={() => onEditReport(r)}
              onDelete={() => onDeleteReport(r)}
            />
          ))
        )}
      </div>

      {/* FAB - Hide for admins and responders */}
      {!isAdmin && currentUser?.role !== 'lgu' && currentUser?.role !== 'authority' && (
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
