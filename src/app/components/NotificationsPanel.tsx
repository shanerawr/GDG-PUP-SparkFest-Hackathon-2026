import { BellOff, MoreHorizontal } from 'lucide-react';
import type { AppNotification } from '../types';
import { LandscapeThumb } from './LandscapeThumb';
import { PanelHeader } from './PanelHeader';

interface Props {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onDeleteNotif: (id: string) => void;
  onBack: () => void;
}

function NotifItem({
  n,
  onDelete,
  onMarkRead,
}: {
  n: AppNotification;
  onDelete: () => void;
  onMarkRead: () => void;
}) {
  return (
    <div
      onClick={n.isNew ? onMarkRead : undefined}
      className="flex items-center gap-3 px-4 py-3 cursor-pointer active:opacity-80 transition-opacity"
    >
      {/* Yellow card */}
      <div
        className="flex-1 flex items-center gap-3 rounded-2xl px-3 py-3"
        style={{ background: '#FFF9C4', opacity: n.isNew ? 1 : 0.65 }}
      >
        {/* Thumbnail */}
        <LandscapeThumb className="w-14 h-14 rounded-xl flex-shrink-0" />

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] leading-snug ${n.isNew ? 'font-bold text-gray-900' : 'font-semibold text-gray-600'}`}>
            {n.title}
          </p>
          <p className="text-[11.5px] text-gray-500 mt-0.5 truncate">{n.detail}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">{n.timeAgo}</p>
        </div>
      </div>

      {/* Menu */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors cursor-pointer flex-shrink-0"
      >
        <MoreHorizontal size={16} />
      </button>
    </div>
  );
}

export function NotificationsPanel({
  notifications,
  onMarkAllRead,
  onDeleteNotif,
  onBack,
}: Props) {
  const handleMarkRead = (id: string) => {
    fetch(`/api/notifications/${id}/read`, { method: 'PUT' }).catch((err) =>
      console.error(err)
    );
  };

  const hasUnread = notifications.some((n) => n.isNew);

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col"
      style={{ background: '#F5F0C0' }}
    >
      {/* Header */}
      <PanelHeader title="Notifications" onBack={onBack} />

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-32">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
              style={{ background: '#FFF9C4' }}>
              <BellOff size={22} className="text-gray-400" />
            </div>
            <p className="font-bold text-[14px] text-gray-800 mb-0.5">All quiet for now</p>
            <p className="text-[12px] text-gray-500 max-w-[200px]">
              You'll receive alerts here when hazards are reported nearby.
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

      {/* Mark all as read — bottom */}
      {hasUnread && (
        <div className="flex-shrink-0 flex items-center justify-center pb-4">
          <button
            onClick={onMarkAllRead}
            className="text-[12px] font-semibold text-gray-500 underline underline-offset-2 hover:text-gray-700 transition-colors cursor-pointer"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
}
