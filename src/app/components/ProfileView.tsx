import { useState, useEffect } from 'react';
import { CheckCircle, Bell, Globe, Shield, LogOut, ChevronRight, Edit2, Check, Key, Clock, ShieldAlert, Eye, EyeOff, Settings, X, Trash2, Pencil, Sun, Moon } from 'lucide-react';
import type { UserProfile } from '../types';
import { PanelHeader } from './PanelHeader';

import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  currentUser: UserProfile;
  onProfileUpdate: (user: UserProfile) => void;
  onLogout: () => void;
  onStartVerification: () => void;
  onBack?: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export function ProfileView({
  currentUser,
  onProfileUpdate,
  onLogout,
  onStartVerification,
  onBack,
  theme,
  onThemeToggle,
}: Props) {
  const { t, language, setLanguage } = useLanguage();
  const tx = { ...t.profile, reports_text: t.profile.reports }; // Keep tx for easy find/replace mapping, or just use t.profile
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser.displayName);
  const [editPassword, setEditPassword] = useState('');
  const [editMunicipality, setEditMunicipality] = useState(currentUser.municipality || '');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);

  const handleSave = () => {
    setSaving(true);
    const updated: any = {
      ...currentUser,
      displayName: editName,
      municipality: editMunicipality,
    };
    if (editPassword.trim()) {
      updated.password = editPassword.trim();
    }
    
    fetch('/api/accounts/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updated),
    })
      .then((res) => res.json())
      .then((data) => {
        onProfileUpdate(data);
        setIsEditing(false);
        setEditPassword('');
      })
      .catch((err) => console.error(err))
      .finally(() => setSaving(false));
  };

  const handleToggleSetting = (key: keyof UserProfile['notifSettings']) => {
    const updatedSettings = {
      ...currentUser.notifSettings,
      [key]: !currentUser.notifSettings[key],
    };
    const updated = {
      ...currentUser,
      notifSettings: updatedSettings,
    };

    fetch('/api/accounts/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updated),
    })
      .then((res) => res.json())
      .then((data) => {
        onProfileUpdate(data);
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col" style={{ background: '#F5F0C0' }}>
      {currentUser.role === 'admin' ? (
        <>
          {/* Admin Header */}
          <PanelHeader
            title="Management"
            onBack={onBack || (() => {})}
            rightAction={
              <button
                onClick={() => setShowSettingsPopup(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all cursor-pointer shadow-sm shadow-[#47B3E8]/20"
                style={{ background: '#47B3E8' }}
              >
                <Settings size={16} />
              </button>
            }
          />

          {/* Management Dashboard content */}
          <div className="flex-1 overflow-y-auto pb-32">
            <AdminManagementPage currentUser={currentUser} />
          </div>

          {/* Settings Popup Modal */}
          {showSettingsPopup && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-sm max-h-[85%] overflow-y-auto shadow-2xl relative flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Popup Header */}
                <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                  <h3 className="text-[15px] font-extrabold text-slate-800">Admin Profile Settings</h3>
                  <button
                    onClick={() => setShowSettingsPopup(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 active:scale-95 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Standard Profile settings */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* User card / Profile Edit */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-white font-extrabold text-[18px]"
                        style={{ backgroundColor: currentUser.avatarUrl || '#2563eb' }}
                      >
                        <span>{editName.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="space-y-2 mt-1">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                              placeholder={tx.displayName}
                            />
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-2.5 pr-8 py-1.5 text-[13px] font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                                placeholder={tx.password}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                            <button
                              onClick={handleSave}
                              disabled={saving}
                              className="w-full text-white rounded-lg py-1.5 font-extrabold text-[12px] disabled:opacity-50 cursor-pointer"
                              style={{ background: '#47B3E8' }}
                            >
                              {saving ? 'Saving...' : tx.saveProfile}
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-[15px] font-bold text-gray-900 truncate">{currentUser.displayName}</h3>
                              <span className="bg-blue-50 text-blue-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                                Admin
                              </span>
                            </div>
                            <p className="text-[12px] text-gray-500">@{currentUser.username}</p>
                            <button
                              onClick={() => setIsEditing(true)}
                              className="text-[11px] font-bold text-blue-600 hover:underline mt-1 block cursor-pointer"
                            >
                              Edit Admin Profile
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notification preferences */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">{tx.notifications}</p>
                    <div className="divide-y divide-gray-100">
                      <NotificationToggleRow
                        label="Push Notifications"
                        checked={currentUser.notifSettings?.pushEnabled !== false}
                        onChange={() => handleToggleSetting('pushEnabled')}
                      />
                      <NotificationToggleRow
                        label="New Hazards Nearby"
                        checked={currentUser.notifSettings?.newPinNearby !== false}
                        onChange={() => handleToggleSetting('newPinNearby')}
                      />
                      <NotificationToggleRow
                        label="Replies to My Comments"
                        checked={currentUser.notifSettings?.replyReceived !== false}
                        onChange={() => handleToggleSetting('replyReceived')}
                      />
                      <NotificationToggleRow
                        label="Upvotes on My Posts"
                        checked={currentUser.notifSettings?.upvotesOnPost !== false}
                        onChange={() => handleToggleSetting('upvotesOnPost')}
                      />
                    </div>
                  </div>

                  {/* Theme & Language */}
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm divide-y divide-gray-100">
                    <SettingsRow
                      Icon={Globe}
                      label={tx.language}
                      value={language === 'en' ? 'English' : 'Filipino'}
                      onClick={() => setLanguage(language === 'en' ? 'fil' : 'en')}
                    />
                    <SettingsRow
                      Icon={theme === 'dark' ? Moon : Sun}
                      label={tx.darkMode}
                      value={theme === 'dark' ? tx.on : tx.off}
                      onClick={onThemeToggle}
                    />
                  </div>

                  {/* Logout */}
                  <button
                    onClick={() => {
                      setShowSettingsPopup(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 rounded-2xl py-3.5 text-[14px] font-bold hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut size={16} />
                    {tx.logout}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <PanelHeader
            title={tx.profile}
            onBack={onBack || (() => {})}
            rightAction={
              <button
                onClick={() => {
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className="text-[12px] font-bold px-3 py-1.5 rounded-xl text-white flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm shadow-[#47B3E8]/20"
                style={{ background: '#47B3E8' }}
              >
                {isEditing ? <Check size={14} /> : <Edit2 size={12} />}
                {isEditing ? (saving ? '...' : tx.saveProfile) : tx.editProfile}
              </button>
            }
          />

          <div className="flex-1 overflow-y-auto px-4 pb-32">
            {/* User card */}
            <div className="bg-white/80 backdrop-blur-md border border-[#47B3E8]/20 rounded-3xl p-5 mb-3 shadow-sm">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-white font-extrabold text-[22px]"
                  style={{ backgroundColor: currentUser.avatarUrl || '#47B3E8' }}
                >
                  <span>{editName.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-2 mt-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white/90 border border-gray-200 rounded-xl px-3 py-1.5 text-[14px] font-semibold text-slate-800 focus:outline-none focus:border-[#47B3E8]"
                        placeholder={tx.displayName}
                      />
                      <input
                        type="text"
                        value={editMunicipality}
                        onChange={(e) => setEditMunicipality(e.target.value)}
                        className="w-full bg-white/90 border border-gray-200 rounded-xl px-3 py-1.5 text-[14px] font-semibold text-slate-800 focus:outline-none focus:border-[#47B3E8]"
                        placeholder="Municipality (e.g. Quezon City)"
                      />
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          className="w-full bg-white/90 border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 text-[14px] font-semibold text-slate-800 focus:outline-none focus:border-[#47B3E8]"
                          placeholder={tx.password}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-[17px] font-extrabold text-gray-900">{currentUser.displayName}</h3>
                        {(currentUser.role === 'authority' || currentUser.role === 'lgu') && (
                          <span className="bg-[#47B3E8]/10 text-[#47B3E8] text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border border-[#47B3E8]/20 uppercase tracking-wider flex items-center gap-1">
                            <Shield size={10} className="text-[#47B3E8] fill-[#47B3E8]/20" />
                            {currentUser.governmentCategory || 'Responder'}
                          </span>
                        )}
                        {currentUser.isVerified && currentUser.role === 'citizen' && (
                          <CheckCircle size={15} className="text-[#47B3E8] flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[13px] text-gray-500">@{currentUser.username}</p>
                      {currentUser.municipality && (
                        <p className="text-[12px] font-semibold text-gray-400 mt-0.5">
                          {currentUser.municipality}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Verified prompt */}
              {!currentUser.isVerified && (
                <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12.5px] font-bold text-amber-800">
                      {currentUser.verificationStatus === 'pending' ? tx.pending : tx.unverified}
                    </p>
                    <p className="text-[11.5px] text-amber-600 mt-0.5 font-medium">
                      {currentUser.verificationStatus === 'pending'
                        ? 'Your application is currently under review.'
                        : 'Verify your account to post reports on the map.'}
                    </p>
                  </div>
                  {currentUser.verificationStatus !== 'pending' && (
                    <button
                      onClick={onStartVerification}
                      className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-3 py-1.5 text-[11px] font-bold shadow-md shadow-amber-600/10 active:scale-95 transition-transform cursor-pointer"
                    >
                      {tx.verifyNow}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className="bg-white/80 backdrop-blur-md border border-[#47B3E8]/20 rounded-3xl p-4 mb-3 shadow-sm flex items-center justify-around text-center">
              <div>
                <p className="text-[18px] font-extrabold text-[#47B3E8]">{currentUser.reportsCount}</p>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {(currentUser.role === 'authority' || currentUser.role === 'lgu') ? 'Reports Resolved' : tx.reports}
                </p>
              </div>
              <div className="w-px h-8 bg-[#47B3E8]/20" />
              <div>
                <p className="text-[18px] font-extrabold text-[#47B3E8]">{currentUser.upvotesCount}</p>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{tx.upvotes}</p>
              </div>
            </div>

            {/* Resolved Tags Breakdown for Responders */}
            {(currentUser.role === 'authority' || currentUser.role === 'lgu') && currentUser.resolvedTags && Object.keys(currentUser.resolvedTags).length > 0 && (
              <div className="bg-white/80 backdrop-blur-md border border-[#47B3E8]/20 rounded-3xl p-4 mb-3 shadow-sm">
                <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-2 text-center">Resolved Categories</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(currentUser.resolvedTags).filter(([_, count]) => count > 0).map(([tag, count]) => (
                    <div key={tag} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                      <span className="text-[12px] font-bold text-gray-600 capitalize">{tag.replace(/-/g, ' ')}</span>
                      <span className="text-[13px] font-extrabold text-[#47B3E8]">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notification settings */}
            <div className="bg-white/80 backdrop-blur-md border border-[#47B3E8]/20 rounded-3xl mb-3 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#47B3E8]/10 bg-[#47B3E8]/5">
                <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">{tx.notifications}</p>
              </div>

              <div className="px-4 divide-y divide-[#47B3E8]/10">
                <NotificationToggleRow
                  label="Push Notifications"
                  checked={currentUser.notifSettings?.pushEnabled !== false}
                  onChange={() => handleToggleSetting('pushEnabled')}
                />
                <NotificationToggleRow
                  label="New Hazards Nearby"
                  checked={currentUser.notifSettings?.newPinNearby !== false}
                  onChange={() => handleToggleSetting('newPinNearby')}
                />
                <NotificationToggleRow
                  label="Replies to My Comments"
                  checked={currentUser.notifSettings?.replyReceived !== false}
                  onChange={() => handleToggleSetting('replyReceived')}
                />
                <NotificationToggleRow
                  label="Upvotes on My Posts"
                  checked={currentUser.notifSettings?.upvotesOnPost !== false}
                  onChange={() => handleToggleSetting('upvotesOnPost')}
                />
              </div>
            </div>

            {/* Other settings */}
            <div className="bg-white/80 backdrop-blur-md border border-[#47B3E8]/20 rounded-3xl mb-4 shadow-sm overflow-hidden divide-y divide-[#47B3E8]/10">
              <SettingsRow
                Icon={Globe}
                label={tx.language}
                value={language === 'en' ? 'English' : 'Filipino'}
                onClick={() => setLanguage(language === 'en' ? 'fil' : 'en')}
              />
              <SettingsRow
                Icon={theme === 'dark' ? Moon : Sun}
                label={tx.darkMode}
                value={theme === 'dark' ? tx.on : tx.off}
                onClick={onThemeToggle}
              />
              <SettingsRow Icon={Shield} label={tx.privacy} />
              <SettingsRow Icon={CheckCircle} label={tx.about} />
            </div>

            {/* Logout */}
            <div className="pt-2">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 bg-red-50/50 hover:bg-red-50 rounded-2xl py-3.5 text-[14px] font-bold active:scale-95 transition-transform cursor-pointer"
              >
                <LogOut size={16} />
                {tx.logout}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NotificationToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <span className="text-[13.5px] font-semibold text-slate-700">{label}</span>
      <button
        type="button"
        onClick={onChange}
        className={`w-10 h-6 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
          checked ? 'bg-[#47B3E8]' : 'bg-gray-200'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function SettingsRow({
  Icon,
  label,
  value,
  onClick,
}: {
  Icon: React.ElementType;
  label: string;
  value?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
    >
      <Icon size={16} className="text-gray-500 flex-shrink-0" />
      <span className="flex-1 text-left text-[13.5px] font-semibold text-slate-700">{label}</span>
      {value && <span className="text-[12.5px] text-gray-400 font-semibold">{value}</span>}
      <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
    </button>
  );
}

function AdminManagementPage({ currentUser }: { currentUser: UserProfile }) {
  const [authorities, setAuthorities] = useState<UserProfile[]>([]);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [govCategory, setGovCategory] = useState<string>('LGU');
  const [municipality, setMunicipality] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit state
  const [editingAccount, setEditingAccount] = useState<UserProfile | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editGovCategory, setEditGovCategory] = useState('');
  const [editMunicipality, setEditMunicipality] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAuthorities = () => {
    fetch(`/api/accounts/authorities?adminUsername=${currentUser.username}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setAuthorities(data);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchAuthorities();
  }, [currentUser.username]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);

    fetch('/api/accounts/create-authority', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminUsername: currentUser.username,
        username: username.trim(),
        displayName: displayName.trim() || (username.trim().charAt(0).toUpperCase() + username.trim().slice(1)),
        password: password.trim(),
        role: govCategory === 'LGU' ? 'lgu' : 'authority',
        governmentCategory: govCategory,
        municipality: municipality.trim(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setSuccess(`Account @${data.username} created!`);
          setUsername('');
          setDisplayName('');
          setPassword('');
          setMunicipality('');
          fetchAuthorities();
        }
      })
      .catch(() => setError('Failed to create account'))
      .finally(() => setLoading(false));
  };

  const openEdit = (auth: UserProfile) => {
    setDeletingId(null); // clear any open delete confirmation
    setEditingAccount(auth);
    setEditDisplayName(auth.displayName || '');
    setEditPassword('');
    setEditGovCategory(auth.governmentCategory || 'LGU');
    setEditMunicipality(auth.municipality || '');
    setEditError(null);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    setEditLoading(true);
    setEditError(null);

    fetch(`/api/accounts/${editingAccount.id}/admin-edit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminUsername: currentUser.username,
        displayName: editDisplayName.trim(),
        password: editPassword.trim() || undefined,
        governmentCategory: editGovCategory,
        role: editGovCategory === 'LGU' ? 'lgu' : 'authority',
        municipality: editMunicipality.trim(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setEditError(data.error);
        } else {
          setEditingAccount(null);
          setSuccess(`Account @${data.username} updated!`);
          fetchAuthorities();
        }
      })
      .catch(() => setEditError('Failed to update account'))
      .finally(() => setEditLoading(false));
  };

  const handleDelete = (id: string) => {
    setDeleteLoading(true);
    fetch(`/api/accounts/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminUsername: currentUser.username }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setSuccess('Account deleted.');
          fetchAuthorities();
        }
        setDeletingId(null);
      })
      .catch(() => { setError('Failed to delete account'); setDeletingId(null); })
      .finally(() => setDeleteLoading(false));
  };

  // Find the account being deleted (for the delete modal)
  const deletingAccount = authorities.find((a) => a.id === deletingId) ?? null;

  return (
    <div className="p-4 space-y-5 min-h-full">
      {/* Delete Confirm Modal */}
      {deletingAccount && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-5 py-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <h3 className="text-[15px] font-extrabold text-slate-800">Delete Account?</h3>
              <p className="text-[12.5px] text-gray-500 mt-1">
                Are you sure you want to delete <span className="font-bold text-gray-800">@{deletingAccount.username}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={() => setDeletingId(null)}
                disabled={deleteLoading}
                className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 font-bold text-[13px] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingAccount.id)}
                disabled={deleteLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 font-bold text-[13px] shadow-md shadow-red-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingAccount && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-extrabold text-slate-800">Edit Account</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">@{editingAccount.username}</p>
              </div>
              <button
                onClick={() => setEditingAccount(null)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-3">
              {editError && (
                <p className="text-[11px] font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                  {editError}
                </p>
              )}
              <input
                type="text"
                placeholder="Display Name"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                className="w-full bg-white border border-[#47B3E8]/20 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 focus:outline-none focus:border-[#47B3E8] focus:bg-white transition-colors"
              />
              <input
                type="password"
                placeholder="New Password (leave blank to keep)"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full bg-white border border-[#47B3E8]/20 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 focus:outline-none focus:border-[#47B3E8] focus:bg-white transition-colors"
              />
              <input
                type="text"
                placeholder="Municipality (e.g. Quezon City)"
                value={editMunicipality}
                onChange={(e) => setEditMunicipality(e.target.value)}
                className="w-full bg-white border border-[#47B3E8]/20 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 focus:outline-none focus:border-[#47B3E8] focus:bg-white transition-colors"
                required
              />
              <select
                value={editGovCategory}
                onChange={(e) => setEditGovCategory(e.target.value)}
                className="w-full bg-white border border-[#47B3E8]/20 rounded-xl px-4 py-3 text-[13px] font-bold text-gray-700 focus:outline-none focus:border-[#47B3E8] focus:bg-white transition-colors cursor-pointer"
              >
                <option value="LGU">Local Government Unit (LGU)</option>
                <option value="BFP">Bureau of Fire Protection (BFP)</option>
                <option value="PNP">Philippine National Police (PNP)</option>
                <option value="DRRMO">Disaster Risk Reduction (DRRMO)</option>
                <option value="Barangay">Barangay Responder</option>
                <option value="DOH">Department of Health (DOH)</option>
              </select>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 font-bold text-[13px] hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 text-white rounded-xl py-2.5 font-extrabold text-[13px] shadow-md active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                  style={{ background: '#47B3E8' }}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Welcome Card */}
      <div className="bg-white/80 backdrop-blur-md border border-[#47B3E8]/20 rounded-3xl p-5 shadow-sm">
        <h3 className="text-[16px] font-extrabold text-slate-800 leading-snug">System Administration</h3>
        <p className="text-[12.5px] text-gray-600 mt-1 leading-relaxed font-semibold">
          Create and manage verified responder profiles. These accounts have the authority to update hazard report status (e.g. In Progress, Resolved) and reply with official agency tags.
        </p>
      </div>

      {/* Account Creation Form */}
      <div className="bg-white/80 backdrop-blur-md border border-[#47B3E8]/20 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5">
          <Shield size={16} className="text-[#47B3E8]" />
          <h3 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">AUTHORITY & LGU MANAGEMENT</h3>
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

        <form onSubmit={handleCreate} className="space-y-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">CREATE RESPONDER ACCOUNT</p>
          
          {/* Stacked Form Fields (1 column, 4 rows) */}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-white border border-[#47B3E8]/20 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 focus:outline-none focus:border-[#47B3E8] focus:bg-white transition-colors"
              required
            />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white border border-[#47B3E8]/20 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 focus:outline-none focus:border-[#47B3E8] focus:bg-white transition-colors"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-[#47B3E8]/20 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 focus:outline-none focus:border-[#47B3E8] focus:bg-white transition-colors"
              required
            />
            <input
              type="text"
              placeholder="Municipality (e.g. Quezon City)"
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              className="w-full bg-white border border-[#47B3E8]/20 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 focus:outline-none focus:border-[#47B3E8] focus:bg-white transition-colors"
              required
            />
            <select
              value={govCategory}
              onChange={(e) => setGovCategory(e.target.value)}
              className="w-full bg-white border border-[#47B3E8]/20 rounded-xl px-4 py-3 text-[13px] font-bold text-gray-700 focus:outline-none focus:border-[#47B3E8] focus:bg-white transition-colors cursor-pointer"
            >
              <option value="LGU">Local Government Unit (LGU)</option>
              <option value="BFP">Bureau of Fire Protection (BFP)</option>
              <option value="PNP">Philippine National Police (PNP)</option>
              <option value="DRRMO">Disaster Risk Reduction (DRRMO)</option>
              <option value="Barangay">Barangay Responder</option>
              <option value="DOH">Department of Health (DOH)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white rounded-xl py-3.5 font-extrabold text-[13px] shadow-md active:scale-[0.98] transition-all disabled:opacity-50 mt-2 cursor-pointer"
            style={{ background: '#47B3E8' }}
          >
            {loading ? 'Creating Account...' : 'Create Responder Account'}
          </button>
        </form>
      </div>

      {/* Active Responders List */}
      <div className="bg-white/80 backdrop-blur-md border border-[#47B3E8]/20 rounded-3xl p-5 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">ACTIVE RESPONDERS ({authorities.length})</p>
        </div>

        {authorities.length === 0 ? (
          <p className="text-[12.5px] text-gray-400 italic bg-white/40 border border-[#47B3E8]/10 p-4 rounded-2xl text-center">No responder accounts created yet.</p>
        ) : (
          <div className="space-y-2.5">
            {authorities.map((auth) => (
              <div key={auth.id} className="flex items-center justify-between p-3.5 bg-white/60 backdrop-blur-sm rounded-2xl border border-[#47B3E8]/10 hover:border-[#47B3E8]/35 transition-colors">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-[13px] font-bold text-gray-900 truncate">{auth.displayName}</p>
                  <p className="text-[11px] text-gray-500 font-medium">@{auth.username}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9.5px] font-extrabold bg-[#47B3E8]/10 text-[#47B3E8] border border-[#47B3E8]/20 rounded-full px-2 py-0.5 uppercase tracking-wider">
                    {auth.governmentCategory || 'LGU'}
                  </span>
                  {/* Edit button */}
                  <button
                    onClick={() => openEdit(auth)}
                    className="w-7 h-7 rounded-lg bg-[#47B3E8]/10 hover:bg-[#47B3E8]/20 flex items-center justify-center text-[#47B3E8] transition-colors active:scale-90 cursor-pointer"
                    title="Edit account"
                  >
                    <Pencil size={13} />
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={() => { setEditingAccount(null); setDeletingId(auth.id); }}
                    className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors active:scale-90 cursor-pointer"
                    title="Delete account"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
