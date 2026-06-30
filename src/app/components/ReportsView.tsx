import { Plus, Pencil, Trash2, FileText, MapPin } from 'lucide-react';
import { LandscapeThumb } from './LandscapeThumb';
import { PanelHeader } from './PanelHeader';
import type { UserReport } from '../types';

interface Props {
  reports: UserReport[];
  onAddReport: () => void;
  onBack: () => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: '#bbf7d0', text: '#166534', label: 'Confirmed' },
  pending:   { bg: '#fde68a', text: '#92400e', label: 'Pending' },
  rejected:  { bg: '#fecaca', text: '#991b1b', label: 'Rejected' },
  'in-progress': { bg: '#bfdbfe', text: '#1e40af', label: 'In Progress' },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { bg: '#e5e7eb', text: '#374151', label: status };
  return (
    <span
      className="flex-shrink-0 text-[10px] font-bold rounded-full px-2.5 py-0.5"
      style={{ background: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}

function ReportCard({ report }: { report: UserReport }) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl px-3.5 py-3 mb-3"
      style={{ background: '#FFF9C4' }}
    >
      {/* Thumbnail */}
      <LandscapeThumb className="w-[72px] h-[72px] rounded-xl flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title + status */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-[14px] font-extrabold text-gray-900 leading-tight">{report.typeName}</p>
          <StatusBadge status={report.status} />
        </div>

        <p className="text-[12px] text-gray-600">{report.moreDetails}</p>
        <p className="text-[11px] text-gray-400 mt-1">{report.date}</p>
        <p className="text-[11px] text-gray-400">{report.time}</p>

        {/* Location + menu */}
        <div className="flex items-center justify-between mt-1">
          <p className="text-[11px] text-gray-400 italic truncate flex-1">{report.location}</p>
          <button className="text-gray-400 hover:text-gray-600 pl-2 transition-colors cursor-pointer">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReportsView({ reports, onAddReport, onBack }: Props) {
  return (
    <div
      className="absolute inset-0 z-40 flex flex-col"
      style={{ background: '#F5F0C0' }}
    >
      {/* Header */}
      <PanelHeader title="My Reports" onBack={onBack} />

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
            <p className="text-[12px] text-gray-400 mt-1">Tap + to submit your first hazard report</p>
          </div>
        ) : (
          reports.map((r) => <ReportCard key={r.id} report={r} />)
        )}
      </div>

      {/* FAB */}
      <button
        id="add-report-fab"
        onClick={onAddReport}
        className="absolute bottom-28 right-5 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-transform cursor-pointer"
        style={{ background: '#F59E0B' }}
      >
        <Plus size={28} color="white" strokeWidth={2.5} />
      </button>
    </div>
  );
}
