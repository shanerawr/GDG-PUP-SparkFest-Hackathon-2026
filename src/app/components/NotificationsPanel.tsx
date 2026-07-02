import { BellOff, X, MessageSquare, Heart, Shield } from 'lucide-react';
import type { AppNotification, MapPin } from '../types';
import { LandscapeThumb } from './LandscapeThumb';
import { PanelHeader } from './PanelHeader';
import { formatTimeAgo } from '../utils/time';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  notifications: AppNotification[];
  pins?: MapPin[];
  onMarkAllRead: () => void;
  onDeleteNotif: (id: string) => void;
  onBack: () => void;
  onSelectNotif?: (pinId: string) => void;
}

function NotifItem({
  n,
  pins,
  onClick,
}: {
  n: AppNotification;
  pins?: MapPin[];
  onClick: () => void;
}) {
  // Resolve corresponding report/pin thumbnail if pinId is present
  let imageContent = null;
  const relatedPin = n.pinId && pins ? pins.find(p => p.id === n.pinId) : null;

  if (relatedPin && (relatedPin.photo || (relatedPin.photos && relatedPin.photos.length > 0))) {
    const photoUrl = relatedPin.photo || relatedPin.photos[0];
    imageContent = (
      <img
        src={photoUrl}
        alt="Report thumbnail"
        className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-slate-100 shadow-sm animate-in fade-in duration-200"
      />
    );
  } else {
    // Beautiful icon-based indicators instead of generic placeholder
    if (n.type === 'reply') {
      imageContent = (
        <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center bg-blue-50 text-blue-500 border border-blue-100 shadow-sm">
          <MessageSquare size={22} />
        </div>
      );
    } else if (n.type === 'upvote') {
      imageContent = (
        <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center bg-rose-50 text-rose-500 border border-rose-100 shadow-sm">
          <Heart size={22} fill="currentColor" />
        </div>
      );
    } else if (n.title.toLowerCase().includes('verified') || n.title.toLowerCase().includes('verification')) {
      imageContent = (
        <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center bg-emerald-50 text-emerald-500 border border-emerald-100 shadow-sm">
          <Shield size={22} />
        </div>
      );
    } else {
      imageContent = (
        <LandscapeThumb className="w-14 h-14 rounded-xl flex-shrink-0 border border-slate-100 shadow-sm" />
      );
    }
  }

  return (
    <div className="px-4 py-1.5">
      <div
        onClick={onClick}
        className="flex items-center gap-3 rounded-2xl px-3.5 py-3 cursor-pointer active:opacity-80 transition-opacity bg-white border border-gray-100 shadow-sm"
        style={{ opacity: n.isNew ? 1 : 0.65 }}
      >
        {imageContent}

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] leading-snug ${n.isNew ? 'font-bold text-gray-900' : 'font-semibold text-gray-600'}`}>
            {n.title}
          </p>
          <p className="text-[11.5px] text-gray-500 mt-0.5 truncate">{n.detail}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">{formatTimeAgo(n.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

export function NotificationsPanel({
  notifications,
  pins,
  onMarkAllRead,
  onDeleteNotif,
  onBack,
  onSelectNotif,
}: Props) {
  const { t } = useLanguage();
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
      <PanelHeader title={t.notifications.title} onBack={onBack} />

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-32">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
              style={{ background: '#FFF9C4' }}>
              <BellOff size={22} className="text-gray-400" />
            </div>
            <p className="font-bold text-[14px] text-gray-800 mb-0.5">{t.notifications.allQuiet}</p>
            <p className="text-[12px] text-gray-500 max-w-[200px]">
              {t.notifications.noAlertsDesc}
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotifItem
              key={n.id}
              n={n}
              pins={pins}
              onClick={() => {
                if (n.isNew) handleMarkRead(n.id);
                if (n.pinId && onSelectNotif) onSelectNotif(n.pinId);
              }}
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
            {t.notifications.markAllAsRead}
          </button>
        </div>
      )}
    </div>
  );
}
