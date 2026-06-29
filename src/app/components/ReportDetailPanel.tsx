import { useState, useEffect } from 'react';
import { X, ThumbsUp, MessageCircle, Share2, CheckCircle, Clock, RefreshCw, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { LandscapeThumb } from './LandscapeThumb';
import type { MapPin as MapPinType, Comment, UserProfile } from '../types';
import { HAZARD_COLORS } from '../types';

interface Props {
  pin: MapPinType;
  onClose: () => void;
  currentUser: UserProfile | null;
  onCommentAdded?: () => void;
}

const statusConfig = {
  pending: { label: 'Pending', Icon: Clock, color: '#6b7280' },
  acknowledged: { label: 'Acknowledged', Icon: CheckCircle, color: '#2563eb' },
  'in-progress': { label: 'In Progress', Icon: RefreshCw, color: '#d97706' },
  resolved: { label: 'Resolved', Icon: CheckCircle, color: '#16a34a' },
};

export function ReportDetailPanel({ pin, onClose, currentUser, onCommentAdded }: Props) {
  const [upvoted, setUpvoted] = useState(false);
  const [upvotes, setUpvotes] = useState(pin.upvotes);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);

  const { bg, label: hazardLabel } = HAZARD_COLORS[pin.hazardLevel];
  const { label: statusLabel, Icon: StatusIcon, color: statusColor } = statusConfig[pin.status];

  const fetchComments = () => {
    fetch(`/api/pins/${pin.id}/comments`)
      .then((res) => res.json())
      .then((data) => {
        setComments(data);
        setLoadingComments(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingComments(false);
      });
  };

  useEffect(() => {
    fetchComments();
  }, [pin.id]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUser) return;

    fetch(`/api/pins/${pin.id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        author: currentUser.username,
        content: replyText,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        setReplyText('');
        fetchComments();
        if (onCommentAdded) onCommentAdded();

        // Simulate a response from "bayan_patrol" dispatch after 3 seconds
        setTimeout(() => {
          fetch(`/api/pins/${pin.id}/comments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              author: 'bayan_patrol',
              content: `Salamat @${currentUser.username}! We have noted this update and alerted the response unit.`,
            }),
          })
            .then(() => {
              fetchComments();
              if (onCommentAdded) onCommentAdded();
            })
            .catch((err) => console.error(err));
        }, 3000);
      })
      .catch((err) => console.error(err));
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
      className="absolute inset-0 bg-white z-50 flex flex-col overflow-hidden"
    >
      {/* Hero image */}
      <div className="relative flex-shrink-0" style={{ height: 220 }}>
        <LandscapeThumb className="w-full h-full" />
        {/* Close button over image */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
        >
          <X size={18} />
        </button>
        {/* Hazard badge over image */}
        <div className="absolute bottom-3 left-4">
          <span
            className="text-[11px] font-bold text-white px-3 py-1 rounded-full"
            style={{ backgroundColor: bg }}
          >
            {hazardLabel}
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-8">
          {/* Title */}
          <h2 className="text-[18px] font-extrabold text-gray-900 leading-snug mb-1">{pin.title}</h2>
          <p className="text-[13px] text-gray-500 mb-3">{pin.description.slice(0, 80)}…</p>

          {/* Reporter row */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <span className="text-[12px] font-bold text-gray-600">
                {pin.reportedBy.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-gray-900">@{pin.reportedBy}</p>
              <p className="text-[11px] text-gray-400">{pin.timeAgo}</p>
            </div>
            {/* Status */}
            <span
              className="flex items-center gap-1 text-[11px] font-semibold"
              style={{ color: statusColor }}
            >
              <StatusIcon size={11} />
              {statusLabel}
            </span>
          </div>

          {/* Location row */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2.5 mb-4">
            <MapPin size={14} className="text-gray-500 flex-shrink-0" />
            <p className="text-[13px] text-gray-700">{pin.address}</p>
          </div>

          {/* Details section */}
          <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Details</p>
          <p className="text-[14px] text-gray-700 leading-relaxed mb-4">{pin.description}</p>

          {/* Combined reports note */}
          {pin.threadCount > 1 && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-3 py-2.5 mb-4">
              <p className="text-[13px] text-blue-700 font-medium">
                {pin.threadCount} reports combined — multiple users reported this incident.
              </p>
            </div>
          )}

          {/* Dynamic Replies/Updates Feed */}
          <div className="mt-4 mb-4 pt-3 border-t border-gray-100">
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Replies & Updates</p>

            {loadingComments ? (
              <p className="text-[12.5px] text-gray-400">Loading replies...</p>
            ) : comments.length === 0 ? (
              <p className="text-[12.5px] text-gray-400 italic bg-gray-50 rounded-xl p-3">No replies yet. Be the first to reply!</p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 font-bold text-[11px] text-blue-700">
                      {comment.author.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[12px] font-bold text-gray-900">@{comment.author}</p>
                        <p className="text-[10px] text-gray-400">{comment.timeAgo}</p>
                      </div>
                      <p className="text-[13px] text-gray-700 leading-snug mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Input Form */}
            {currentUser && (
              <form onSubmit={handleSendReply} className="flex gap-2 mt-4">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a reply or update..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[12.5px] focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 text-[12px] font-bold active:scale-95 transition-transform"
                >
                  Send
                </button>
              </form>
            )}
          </div>

          {/* Photo thumbnails */}
          <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">Photos</p>
          <div className="flex gap-2 mb-5">
            <LandscapeThumb className="flex-1 rounded-xl" style={{ height: 80 } as React.CSSProperties} />
            <LandscapeThumb className="flex-1 rounded-xl" style={{ height: 80 } as React.CSSProperties} />
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 mb-4" />

          {/* Interaction row */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => {
                if (!upvoted) {
                  setUpvoted(true);
                  setUpvotes((v) => v + 1);
                  fetch(`/api/pins/${pin.id}/upvote`, { method: 'POST' }).catch((err) => console.error(err));
                }
              }}
              className="flex items-center gap-2 text-[14px] font-semibold"
              style={{ color: upvoted ? '#16a34a' : '#6b7280' }}
            >
              <ThumbsUp size={18} />
              {upvotes}
            </button>
            <button className="flex items-center gap-2 text-[14px] font-semibold text-gray-500">
              <MessageCircle size={18} />
              Reply
            </button>
            <div className="flex-1" />
            <button className="flex items-center gap-2 text-[14px] font-semibold text-gray-500">
              <Share2 size={18} />
              Share
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
