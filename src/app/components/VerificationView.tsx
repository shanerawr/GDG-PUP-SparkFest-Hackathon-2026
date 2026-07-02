import { useState, useEffect } from 'react';
import { Shield, X, Check, Loader } from 'lucide-react';
import { PanelHeader } from './PanelHeader';
import type { UserProfile } from '../types';

interface Props {
  currentUser: UserProfile;
  onBack: () => void;
}

export function VerificationView({ currentUser, onBack }: Props) {
  const [requests, setRequests] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const fetchRequests = () => {
    setLoading(true);
    fetch(`/api/accounts/pending-verifications?username=${currentUser.username}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          // Sort requests: prioritize users from the same municipality as the LGU/Admin
          const sorted = [...data].sort((a, b) => {
            const aMatch = a.municipality?.toLowerCase() === currentUser.municipality?.toLowerCase();
            const bMatch = b.municipality?.toLowerCase() === currentUser.municipality?.toLowerCase();
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
          });
          setRequests(sorted);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load verification requests.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, [currentUser.username]);

  const handleVerify = (citizenId: string, approve: boolean) => {
    setError(null);
    setSuccess(null);
    const status = approve ? 'verified' : 'unverified';
    
    fetch(`/api/accounts/${citizenId}/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser.username,
        status: status
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setSuccess(`Successfully ${approve ? 'approved' : 'rejected'} verification request.`);
          setRequests((prev) => prev.filter((r) => r.id !== citizenId));
          if (selectedUser?.id === citizenId) {
            setSelectedUser(null);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to update verification status.");
      });
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col" style={{ background: '#F5F0C0' }}>
      {/* Header */}
      <PanelHeader title="Verification Portal" onBack={onBack} />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-3 space-y-4">
        <div className="bg-white/80 backdrop-blur-md border border-[#47B3E8]/20 rounded-3xl p-5 shadow-sm space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Shield size={16} className="text-[#47B3E8]" />
              <h3 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider text-slate-800">LGU Citizen Verification Portal</h3>
            </div>
            <button
              onClick={fetchRequests}
              className="text-[11px] font-bold text-[#47B3E8] hover:underline cursor-pointer"
            >
              Refresh
            </button>
          </div>

          {error && (
            <p className="text-[11px] font-semibold text-red-600 bg-red-50 p-3 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2 duration-200">
              {error}
            </p>
          )}
          {success && (
            <p className="text-[11px] font-semibold text-green-600 bg-green-50 p-3 rounded-2xl border border-green-100 animate-in fade-in slide-in-from-top-2 duration-200">
              {success}
            </p>
          )}

          {loading ? (
            <div className="py-8 text-center text-gray-400 text-[12px] font-semibold flex flex-col items-center justify-center gap-2">
              <Loader size={20} className="animate-spin text-[#47B3E8]" />
              <span>Fetching verification requests...</span>
            </div>
          ) : requests.length === 0 ? (
            <p className="text-[12.5px] text-gray-400 italic bg-white/40 border border-[#47B3E8]/10 p-4 rounded-2xl text-center">
              No pending citizen verification requests.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                PENDING REQUESTS ({requests.length})
              </p>
              <div className="space-y-2.5">
                {requests.map((req) => {
                  const isLocalResident = req.municipality?.toLowerCase() === currentUser.municipality?.toLowerCase();
                  return (
                    <div 
                      key={req.id} 
                      className={`p-3.5 bg-white/60 backdrop-blur-sm rounded-2xl border transition-colors flex flex-col gap-3 ${
                        isLocalResident ? 'border-[#47B3E8]/40 bg-[#47B3E8]/5' : 'border-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[13px] font-bold text-gray-900 truncate">{req.displayName}</p>
                            {isLocalResident && (
                              <span className="bg-[#47B3E8]/10 text-[#47B3E8] text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-full border border-[#47B3E8]/20 uppercase tracking-wider">
                                Local Resident
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium">@{req.username}</p>
                          {req.municipality && (
                            <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
                              Location: {req.municipality}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedUser(req)}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-2 font-bold text-[11px] transition-colors cursor-pointer text-center"
                        >
                          Review ID Info
                        </button>
                        <button
                          onClick={() => handleVerify(req.id, false)}
                          className="w-10 h-9 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                          title="Reject"
                        >
                          <X size={15} />
                        </button>
                        <button
                          onClick={() => handleVerify(req.id, true)}
                          className="w-10 h-9 rounded-xl bg-green-600 hover:bg-green-700 text-white flex items-center justify-center shadow-sm transition-colors active:scale-95 cursor-pointer"
                          title="Approve"
                        >
                          <Check size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal popup - FIX WINDOW ISSUE */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-left">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-white">
              <div className="flex items-center gap-1.5 text-blue-600 font-extrabold text-[14px]">
                <Shield size={16} />
                <span>Review Government ID</span>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body - Fixes window height overflow */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30">
              <div className="space-y-3 text-[12px]">
                <div className="flex justify-between bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                  <span className="font-semibold text-gray-500">Applicant:</span>
                  <span className="text-gray-800 font-bold">{selectedUser.displayName} (@{selectedUser.username})</span>
                </div>
                <div className="flex justify-between bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                  <span className="font-semibold text-gray-500">Declared Location:</span>
                  <span className="text-gray-800 font-bold">{selectedUser.municipality || 'None'}</span>
                </div>
                <div className="flex justify-between bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                  <span className="font-semibold text-gray-500">Verification Type:</span>
                  <span className="text-gray-800 font-bold">National ID / PhilSys</span>
                </div>
                <div className="flex justify-between bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                  <span className="font-semibold text-gray-500">Document Status:</span>
                  <span className="text-green-600 font-bold">Scanned & Validated</span>
                </div>
              </div>

              {/* Simulated ID visualization card */}
              <div className="relative border border-slate-200 rounded-2xl p-4 bg-slate-900 overflow-hidden text-white flex flex-col justify-between min-h-[140px] shadow-sm select-none">
                <Shield className="absolute right-[-20px] bottom-[-20px] w-36 h-36 opacity-[0.04] text-white rotate-12" />
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#47B3E8] font-black">REPUBLIC OF THE PHILIPPINES</p>
                    <p className="text-[7.5px] uppercase tracking-wider text-gray-400 font-semibold mt-0.5">BANTAYBAYAN CIVILIAN VERIFIED IDENTITY</p>
                  </div>
                  <Shield size={18} className="text-[#47B3E8]" />
                </div>

                <div className="mt-4 flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">
                    {selectedUser.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold truncate leading-tight uppercase">{selectedUser.displayName}</p>
                    <p className="text-[8.5px] text-gray-400 font-medium">@{selectedUser.username}</p>
                    <p className="text-[8.5px] text-[#47B3E8] font-bold mt-0.5">{selectedUser.municipality || 'PH RESIDENT'}</p>
                  </div>
                </div>

                <div className="flex justify-between items-end mt-4 pt-1.5 border-t border-slate-800 text-[7px] text-gray-500 font-mono font-semibold uppercase">
                  <span>ID NO: BB-VERIFY-{selectedUser.username.slice(0, 6).toUpperCase()}</span>
                  <span>STATUS: PENDING</span>
                </div>
              </div>
            </div>

            {/* Footer - Fixes button actions sticking to view */}
            <div className="flex gap-3 px-5 pb-5 pt-3 flex-shrink-0 border-t border-gray-100 bg-white">
              <button
                onClick={() => handleVerify(selectedUser.id, false)}
                className="flex-1 border border-red-200 hover:bg-red-50 text-red-500 rounded-xl py-2.5 font-bold text-[12px] transition-colors cursor-pointer"
              >
                Reject Request
              </button>
              <button
                onClick={() => handleVerify(selectedUser.id, true)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl py-2.5 font-bold text-[12px] shadow-md shadow-green-500/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                Approve Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
