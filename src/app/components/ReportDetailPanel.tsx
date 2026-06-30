import { useState, useEffect } from 'react';
import { X, ThumbsUp, ThumbsDown, Flag, MessageCircle, Share2, CheckCircle, Clock, RefreshCw, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { LandscapeThumb } from './LandscapeThumb';
import type { MapPin as MapPinType, Comment, UserProfile, ReportStatus } from '../types';
import { HAZARD_COLORS } from '../types';

// Helper to build comment tree
function buildCommentTree(flatComments: Comment[]) {
  const map = new Map<string, Comment & { children: any[] }>();
  flatComments.forEach(c => map.set(c.id, { ...c, children: [] }));
  
  const roots: any[] = [];
  flatComments.forEach(c => {
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(map.get(c.id));
    } else {
      roots.push(map.get(c.id));
    }
  });
  return roots;
}

function CommentNode({ comment, currentUser, onReply, onAction, onReport }: { comment: any, currentUser: any, onReply: (id: string, author: string) => void, onAction: (id: string, action: string) => void, onReport: (id: string) => void }) {
  const isOfficial = comment.role && comment.role !== 'citizen';
  const hasFlagged = comment.flaggedBy?.includes(currentUser?.username);
  return (
    <div className="mt-3 first:mt-0">
      <div
        className={`flex items-start gap-2 rounded-2xl p-3 border ${
          isOfficial
            ? 'bg-blue-50/60 border-blue-100 shadow-sm shadow-blue-500/5'
            : 'bg-gray-50 border-gray-100'
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[11px] ${
            isOfficial ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
          }`}
        >
          {comment.author.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[12px] font-bold text-gray-900">@{comment.author}</p>
              {isOfficial && (
                <span className="text-[8px] font-extrabold bg-blue-100 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 uppercase tracking-wider">
                  {comment.governmentCategory || (comment.role === 'admin' ? 'Admin' : 'Responder')}
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400">{comment.timeAgo}</p>
          </div>
          <p className="text-[13px] text-gray-700 leading-snug mt-1">{comment.content}</p>
          
          <div className="flex items-center gap-4 mt-2">
            <button 
              onClick={() => onReply(comment.id, comment.author)}
              className="text-[11px] font-bold text-blue-600 hover:underline active:opacity-70 flex items-center gap-1"
            >
              <MessageCircle size={12} /> Reply
            </button>
            <button 
              onClick={() => onAction(comment.id, 'upvote')} 
              className={`text-[11px] flex items-center gap-1 ${comment.upvotedBy?.includes(currentUser?.username) ? 'text-green-600 font-bold' : 'text-gray-500 hover:text-green-600'}`}
            >
              <ThumbsUp size={12} /> {comment.upvotes || 0}
            </button>
            <button 
              onClick={() => onAction(comment.id, 'downvote')} 
              className={`text-[11px] flex items-center gap-1 ${comment.downvotedBy?.includes(currentUser?.username) ? 'text-red-600 font-bold' : 'text-gray-500 hover:text-red-600'}`}
            >
              <ThumbsDown size={12} /> {comment.downvotes || 0}
            </button>
            <button 
              onClick={() => hasFlagged ? onAction(comment.id, 'flag') : onReport(comment.id)} 
              className={`text-[11px] ml-auto flex items-center gap-1 ${hasFlagged ? 'text-orange-500' : 'text-gray-500 hover:text-orange-500'}`} 
              title={hasFlagged ? "Remove Flag" : "Flag as inappropriate"}
            >
              <Flag size={12} />
            </button>
          </div>
        </div>
      </div>
      
      {comment.children && comment.children.length > 0 && (
        <div className="ml-4 pl-2 border-l-2 border-gray-100 mt-2">
          {comment.children.map((child: any) => (
            <CommentNode key={child.id} comment={child} currentUser={currentUser} onReply={onReply} onAction={onAction} onReport={onReport} />
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  pin: MapPinType;
  onClose: () => void;
  currentUser: UserProfile | null;
  onCommentAdded?: () => void;
  onStatusUpdated?: () => void;
}

const statusConfig = {
  pending: { label: 'Pending', Icon: Clock, color: '#6b7280' },
  acknowledged: { label: 'Acknowledged', Icon: CheckCircle, color: '#2563eb' },
  'in-progress': { label: 'In Progress', Icon: RefreshCw, color: '#d97706' },
  resolved: { label: 'Resolved', Icon: CheckCircle, color: '#16a34a' },
};

export function ReportDetailPanel({ pin, onClose, currentUser, onCommentAdded, onStatusUpdated }: Props) {
  const [upvoted, setUpvoted] = useState(false);
  const [upvotes, setUpvotes] = useState(pin.upvotes);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{id: string, author: string} | null>(null);
  const [flaggingCommentId, setFlaggingCommentId] = useState<string | null>(null);
  const [loadingComments, setLoadingComments] = useState(true);
  const [pinStatus, setPinStatus] = useState<ReportStatus>(pin.status);

  const hazardLvl = pin.hazardLevel || 'needs-attention';
  const hazardColor = HAZARD_COLORS[hazardLvl as HazardLevel] || HAZARD_COLORS['needs-attention'];
  const { bg, label: hazardLabel } = hazardColor;
  const { label: statusLabel, Icon: StatusIcon, color: statusColor } = statusConfig[pinStatus];

  const CATEGORIES: Record<string, string> = {
    'flood': 'Flood',
    'traffic': 'Traffic',
    'fallen-pole': 'Fallen Pole',
    'car-crash': 'Car Crash',
    'road-work': 'Road Work',
    'fire': 'Fire',
    'hazard': 'Road Hazard',
    'other': 'Other'
  };
  const categoryName = CATEGORIES[pin.type] || pin.title;
  
  const allPhotos = pin.photos?.length ? pin.photos : (pin.photo ? [pin.photo] : []);
  const heroPhoto = allPhotos[0] || null;

  const handleStatusChange = (newStatus: ReportStatus) => {
    if (!currentUser) return;
    setPinStatus(newStatus);
    fetch(`/api/pins/${pin.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        username: currentUser.username,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
        } else {
          if (onStatusUpdated) onStatusUpdated();
        }
      })
      .catch((err) => console.error(err));
  };

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

  const handleCommentAction = (commentId: string, action: string, reason?: string, details?: string) => {
    if (!currentUser) return;
    const username = currentUser.username;

    // Optimistic UI update
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        let upvotedBy = [...(c.upvotedBy || [])];
        let downvotedBy = [...(c.downvotedBy || [])];
        let flaggedBy = [...(c.flaggedBy || [])];
        let upvotes = c.upvotes || 0;
        let downvotes = c.downvotes || 0;
        let flags = c.flags || 0;

        if (action === 'upvote') {
          if (upvotedBy.includes(username)) {
            upvotedBy = upvotedBy.filter(u => u !== username);
            upvotes--;
          } else {
            upvotedBy.push(username);
            upvotes++;
            if (downvotedBy.includes(username)) {
              downvotedBy = downvotedBy.filter(u => u !== username);
              downvotes--;
            }
          }
        } else if (action === 'downvote') {
          if (downvotedBy.includes(username)) {
            downvotedBy = downvotedBy.filter(u => u !== username);
            downvotes--;
          } else {
            downvotedBy.push(username);
            downvotes++;
            if (upvotedBy.includes(username)) {
              upvotedBy = upvotedBy.filter(u => u !== username);
              upvotes--;
            }
          }
        } else if (action === 'flag') {
          if (flaggedBy.includes(username)) {
            flaggedBy = flaggedBy.filter(u => u !== username);
            flags--;
          } else {
            flaggedBy.push(username);
            flags++;
          }
        }
        return { ...c, upvotedBy, downvotedBy, flaggedBy, upvotes, downvotes, flags };
      }
      return c;
    }));

    const payload: any = { action, username };
    if (reason) payload.reason = reason;
    if (details) payload.details = details;

    fetch(`/api/comments/${commentId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(err => console.error(err));
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
        role: currentUser.role,
        governmentCategory: currentUser.governmentCategory,
        parentId: replyingTo?.id
      }),
    })
      .then((res) => res.json())
      .then(() => {
        setReplyText('');
        setReplyingTo(null);
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
        {heroPhoto ? (
          <img src={heroPhoto} alt={pin.title} className="w-full h-full object-cover" />
        ) : (
          <LandscapeThumb className="w-full h-full" />
        )}
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
          <h2 className="text-[18px] font-extrabold text-gray-900 leading-snug mb-1">{categoryName}</h2>
          <p className="text-[14px] text-gray-700 leading-relaxed mb-4">{pin.description}</p>

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
            {currentUser && ['admin', 'authority', 'lgu'].includes(currentUser.role || '') ? (
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1">
                <StatusIcon size={11} style={{ color: statusColor }} />
                <select
                  value={pinStatus}
                  onChange={(e) => handleStatusChange(e.target.value as ReportStatus)}
                  className="text-[11.5px] font-bold bg-transparent border-0 outline-none p-0 cursor-pointer focus:ring-0"
                  style={{ color: statusColor }}
                >
                  <option value="pending" className="text-gray-700 font-medium">Pending</option>
                  <option value="acknowledged" className="text-blue-600 font-medium">Acknowledged</option>
                  <option value="in-progress" className="text-amber-600 font-medium">In Progress</option>
                  <option value="resolved" className="text-green-600 font-medium">Resolved</option>
                </select>
              </div>
            ) : (
              <span
                className="flex items-center gap-1 text-[11px] font-semibold"
                style={{ color: statusColor }}
              >
                <StatusIcon size={11} />
                {statusLabel}
              </span>
            )}
          </div>

          {/* Location row */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2.5 mb-4">
            <MapPin size={14} className="text-gray-500 flex-shrink-0" />
            <p className="text-[13px] text-gray-700">{pin.address}</p>
          </div>



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
                {buildCommentTree(comments).map(c => (
                  <CommentNode 
                    key={c.id} 
                    comment={c} 
                    currentUser={currentUser}
                    onReply={(id, author) => setReplyingTo({ id, author })}
                    onAction={handleCommentAction}
                    onReport={(id) => setFlaggingCommentId(id)}
                  />
                ))}
              </div>
            )}

            {/* Reply Input Form */}
            {currentUser && (
              <div className="mt-4 flex flex-col gap-2">
                {replyingTo && (
                  <div className="flex items-center justify-between bg-blue-50 text-blue-700 text-[11px] font-bold px-3 py-1.5 rounded-lg w-max">
                    <span>Replying to @{replyingTo.author}</span>
                    <button 
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="ml-2 hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={replyingTo ? `Reply to ${replyingTo.author}...` : "Type a reply or update..."}
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
              </div>
            )}
          </div>

          {/* Photo thumbnails */}
          {allPhotos.length > 0 ? (
            <>
              <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">Photos</p>
              <div className="flex gap-2 mb-5 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {allPhotos.map((p, idx) => (
                  <img key={idx} src={p} alt={`Thumbnail ${idx + 1}`} className="w-[120px] h-20 object-cover rounded-xl border border-gray-200 flex-shrink-0" />
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">Photos</p>
              <div className="flex gap-2 mb-5">
                <LandscapeThumb className="flex-1 rounded-xl" style={{ height: 80 } as React.CSSProperties} />
                <LandscapeThumb className="flex-1 rounded-xl" style={{ height: 80 } as React.CSSProperties} />
              </div>
            </>
          )}

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

      {flaggingCommentId && (
        <ReportCommentModal 
          onClose={() => setFlaggingCommentId(null)} 
          onSubmit={(reason, details) => {
            handleCommentAction(flaggingCommentId, 'flag', reason, details);
            setFlaggingCommentId(null);
          }} 
        />
      )}
    </motion.div>
  );
}

function ReportCommentModal({ onClose, onSubmit }: { onClose: () => void, onSubmit: (reason: string, details: string) => void }) {
  const [reason, setReason] = useState('Disrespectful / Harassment');
  const [details, setDetails] = useState('');

  const REASONS = [
    'Disrespectful / Harassment',
    'False Information',
    'Spam / Promotion',
    'Other'
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Report Comment</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(reason, details); }} className="p-4 flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-2">Reason for reporting</label>
            <div className="space-y-2">
              {REASONS.map(r => (
                <label key={r} className="flex items-center gap-2 text-[14px] text-gray-700 cursor-pointer">
                  <input 
                    type="radio" 
                    name="reportReason" 
                    value={r} 
                    checked={reason === r} 
                    onChange={() => setReason(r)}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-2">Additional details (optional)</label>
            <textarea
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-[14px] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 min-h-[80px]"
              placeholder="Why are you reporting this comment?"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-[14px] font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-3 text-[14px] font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors">
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
