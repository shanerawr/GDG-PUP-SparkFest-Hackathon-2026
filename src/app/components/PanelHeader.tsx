import { ArrowLeft, Map } from 'lucide-react';
import React from 'react';

interface Props {
  title: string;
  onBack: () => void;
  bg?: string;
  rightAction?: React.ReactNode;
}

/**
 * Shared back-navigation header used by sub-panels (Notifications, Routes, Reports).
 * Single combined button with ← arrow + map icon, plus a bold page title.
 */
export function PanelHeader({ title, onBack, bg = '#F5F0C0', rightAction }: Props) {
  return (
    <div
      className="flex items-center justify-between px-4 pt-5 pb-4 flex-shrink-0"
      style={{ background: bg }}
    >
      <div className="flex items-center gap-3">
        {/* Single combined back + map button */}
        <button
          id="panel-back-btn"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 h-10 rounded-xl active:scale-95 transition-transform cursor-pointer flex-shrink-0"
          style={{ background: '#47B3E8' }}
        >
          <ArrowLeft size={16} color="white" strokeWidth={2.5} />
          <Map size={16} color="white" strokeWidth={2} />
        </button>

        <h2 className="text-[22px] font-extrabold text-gray-900 ml-0.5 leading-tight">
          {title}
        </h2>
      </div>

      {rightAction && (
        <div className="flex-shrink-0 flex items-center justify-end">
          {rightAction}
        </div>
      )}
    </div>
  );
}
