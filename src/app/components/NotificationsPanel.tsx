import { Trash2, BellOff, CheckCircle } from 'lucide-react';
import type { AppNotification } from '../types';

interface Props {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onDeleteNotif: (id: string) => void;
}

function NotifItem({ n, onDelete, onMarkRead }: { n: AppNotification; onDelete: () => void; onMarkRead: () => void }) {
  return (
    <div
      onClick={n.isNew ? onMarkRead : undefined}
      className={`flex items-start gap-3.5 p-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer ${
        n.isNew ? 'bg-blue-50/40' : 'bg-white opacity-70'
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
        {n.type === 'upvote' ? (
          <span className="font-extrabold text-[15px]">👍</span>
        ) : n.type === 'reply' ? (
          <span className="font-extrabold text-[15px]">💬</span>
        ) : n.type === 'new-report' ? (
          <span className="font-extrabold text-[15px]">⚠️</span>
        ) : (
          <span className="font-extrabold text-[15px]">🔔</span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          {n.isNew && (
            <span className="text-[8px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded tracking-wider uppercase">
              NEW
            </span>
          )}
          <span className="text-[10px] text-gray-400 font-semibold">{n.timeAgo}</span>
        </div>
        <p className={`text-[13px] text-gray-900 leading-snug ${n.isNew ? 'font-bold' : 'font-medium'}`}>
          {n.title}
        </p>
        {n.subtitle && <p className="text-[11.5px] text-gray-500 font-bold mt-0.5">{n.subtitle}</p>}
        <p className="text-[12px] text-gray-500 mt-0.5">{n.detail}</p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation(); // prevent mark read when deleting
          onDelete();
        }}
        className="text-gray-300 hover:text-red-500 mt-1 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function NotificationsPanel({ notifications, onMarkAllRead, onDeleteNotif }: Props) {
  const handleMarkRead = (id: string) => {
    fetch(`/api/notifications/${id}/read`, { method: 'PUT' })
      .then((res) => {
        if (res.ok) {
          // Trigger a silent reload or let the parent poll handle it
        }
      })
      .catch((err) => console.error(err));
  };

  const hasUnread = notifications.some((n) => n.isNew);

  return (
    <div className="absolute inset-0 bg-white z-40 flex flex-col">
      <div className="px-4 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-[20px] font-extrabold text-gray-900">Notifications</h2>
        {hasUnread && (
          <button
            onClick={onMarkAllRead}
            className="text-[12px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <CheckCircle size={14} />
            Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-3 border border-gray-100">
              <BellOff size={22} />
            </div>
            <p className="font-bold text-[14px] text-gray-900 mb-0.5">All quiet for now</p>
            <p className="text-[12px] text-gray-400 max-w-[200px]">
              You will receive alerts here when hazards are reported nearby.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotifItem
              key={n.id}
              n={n}
              onDelete={() => onDeleteNotif(n.id)}
              onMarkRead={() => handleMarkRead(n.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

