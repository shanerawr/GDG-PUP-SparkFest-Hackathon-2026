import { Bell, Navigation, AlertCircle, User } from 'lucide-react';
import type { AppPanel } from '../types';

interface Props {
  activePanel: AppPanel;
  onSelect: (panel: AppPanel) => void;
  unreadCount: number;
}

const tabs: { key: AppPanel; Icon: React.ElementType; label: string }[] = [
  { key: 'notifications', Icon: Bell, label: 'Notifs' },
  { key: 'routes', Icon: Navigation, label: 'Routes' },
  { key: 'reports', Icon: AlertCircle, label: 'Reports' },
  { key: 'profile', Icon: User, label: 'Profile' },
];

export function BottomNav({ activePanel, onSelect, unreadCount }: Props) {
  return (
    <div
      className="flex items-end justify-center px-5 pb-4 pt-2"
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
    >
      <nav
        className="flex items-center justify-around w-full max-w-sm rounded-full px-2 shadow-2xl"
        style={{ background: '#47B3E8', height: 60 }}
      >
        {tabs.map(({ key, Icon, label }) => {
          const active = activePanel === key;
          return (
            <button
              key={label}
              id={`nav-${key}`}
              onClick={() => onSelect(active ? null : key)}
              className="relative flex items-center justify-center flex-1 h-full transition-all cursor-pointer"
            >
              <div
                className="flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200"
                style={active ? { background: '#FBBF24' } : { background: 'transparent' }}
              >
                <div className="relative">
                  <Icon
                    size={active ? 23 : 21}
                    color={active ? '#1a1a1a' : 'white'}
                    strokeWidth={active ? 2.6 : 1.8}
                  />
                  {key === 'notifications' && unreadCount > 0 && (
                    <span
                      className="absolute flex items-center justify-center bg-red-500 text-white font-extrabold rounded-full"
                      style={{
                        top: -6,
                        right: -8,
                        minWidth: 17,
                        height: 17,
                        fontSize: 10,
                        paddingInline: 3,
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
