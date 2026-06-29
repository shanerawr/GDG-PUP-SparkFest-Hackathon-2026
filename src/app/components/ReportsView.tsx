import { Plus, MoreHorizontal } from 'lucide-react';
import { LandscapeThumb } from './LandscapeThumb';
import type { UserReport } from '../types';

interface Props {
  reports: UserReport[];
  onAddReport: () => void;
}

const statusStyle = {
  confirmed: 'border-black text-black',
  pending: 'border-gray-400 text-gray-500',
  rejected: 'border-red-400 text-red-500',
};

function ReportCard({ report }: { report: UserReport }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-3.5 py-3 mb-3 shadow-sm">
      <div className="flex items-start gap-3">
        <LandscapeThumb className="w-[72px] h-[72px] rounded-xl" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-gray-900">{report.typeName}</p>
              <p className="text-[12px] text-gray-500">{report.moreDetails}</p>
            </div>
            <span className={`flex-shrink-0 text-[11px] font-semibold border rounded-full px-2.5 py-0.5 ${statusStyle[report.status]}`}>
              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">{report.date}</p>
          <p className="text-[11px] text-gray-500">{report.time}</p>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-[11px] text-gray-400 truncate flex-1">{report.location}</p>
            <button className="text-gray-400 pl-2">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReportsView({ reports, onAddReport }: Props) {
  return (
    <div className="absolute inset-0 bg-gray-50 z-40 flex flex-col">
      <div className="px-4 pt-5 pb-3 bg-white border-b border-gray-100">
        <h2 className="text-[20px] font-extrabold text-gray-900">My Reports</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {reports.map(r => <ReportCard key={r.id} report={r} />)}
      </div>

      <button
        onClick={onAddReport}
        className="absolute bottom-6 right-5 h-14 px-6 bg-black text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ease-in-out active:scale-95 cursor-pointer gap-2"
      >
        <span className="font-extrabold text-[14px] tracking-wide whitespace-nowrap">
          Add Report
        </span>
        <Plus size={20} className="flex-shrink-0" />
      </button>
    </div>
  );
}
