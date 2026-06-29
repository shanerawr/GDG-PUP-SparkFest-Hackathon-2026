import { useState, useEffect } from 'react';
import { CheckCircle, Bell, Globe, Shield, LogOut, ChevronRight, Edit2, Check, Key, Clock, ShieldAlert, Eye, EyeOff, Moon, Settings, X } from 'lucide-react';
import type { UserProfile } from '../types';

interface Props {
  language: 'en' | 'fil';
  onLanguageToggle: () => void;
  currentUser: UserProfile;
  onProfileUpdate: (user: UserProfile) => void;
  onLogout: () => void;
  onStartVerification: () => void;
}

const t = {
  en: {
    profile: 'Profile',
    verified: 'Verified Account',
    pending: 'Verification Pending',
    unverified: 'Unverified Account',
    verifyNow: 'Verify Identity',
    settings: 'Settings',
    notifications: 'Notification Settings',
    language: 'Language',
    langValue: 'English',
    privacy: 'Privacy & Safety',
    about: 'About BantayBayan',
    logout: 'Log Out',
    reports: 'reports submitted',
    upvotes: 'upvotes received',
    since: 'Member since',
    editProfile: 'Edit Profile',
    saveProfile: 'Save Changes',
    displayName: 'Display Name',
    password: 'New Password',
    darkMode: 'Dark Mode',
    on: 'On',
    off: 'Off',
  },
  fil: {
    profile: 'Profile',
    verified: 'Verified na Account',
    pending: 'Nakabinbing Pagpapatunay',
    unverified: 'Hindi Verified',
    verifyNow: 'Mag-verify ng Wika',
    settings: 'Mga Setting',
    notifications: 'Mga Setting ng Notipikasyon',
    language: 'Wika',
    langValue: 'Filipino',
    privacy: 'Privacy at Kaligtasan',
    about: 'Tungkol sa BantayBayan',
    logout: 'Mag-logout',
    reports: 'mga ulat na isinumite',
    upvotes: 'upvotes na natanggap',
    since: 'Miyembro mula',
    editProfile: 'I-edit ang Profile',
    saveProfile: 'I-save ang mga Pagbabago',
    displayName: 'Ipakitang Pangalan',
    password: 'Bagong Password',
    darkMode: 'Dark Mode',
    on: 'Bukas',
    off: 'Sarado',
  },
};

export function ProfileView({
  language,
  onLanguageToggle,
  currentUser,
  onProfileUpdate,
  onLogout,
  onStartVerification,
}: Props) {
  const tx = t[language];
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser.displayName);
  const [editPassword, setEditPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);

  const handleThemeToggle = () => {
    const newDark = !isDarkMode;
    setIsDarkMode(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('bb_theme', newDark ? 'dark' : 'light');
  };

  const handleSave = () => {
    setSaving(true);
    const updated: any = {
      ...currentUser,
      displayName: editName,
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
    <div className="absolute inset-0 bg-gray-50 z-40 flex flex-col">
      {currentUser.role === 'admin' ? (
        <>
          {/* Admin Header */}
          <div className="px-4 pt-5 pb-3 bg-white border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-blue-600 flex-shrink-0" />
              <h2 className="text-[14px] font-extrabold text-slate-800 uppercase tracking-wider">
                Authority & LGU Management
              </h2>
            </div>
            <button
              onClick={() => setShowSettingsPopup(true)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-600 transition-all cursor-pointer"
            >
              <Settings size={16} />
            </button>
          </div>

          {/* Management Dashboard content */}
          <div className="flex-1 overflow-y-auto">
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
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-1.5 font-bold text-[12px] disabled:opacity-50 cursor-pointer"
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
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <SettingsRow
                      Icon={Moon}
                      label={tx.darkMode}
                      value={isDarkMode ? tx.on : tx.off}
                      onClick={handleThemeToggle}
                    />
                    <SettingsRow
                      Icon={Globe}
                      label={tx.language}
                      value={tx.langValue}
                      onClick={onLanguageToggle}
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
          <div className="px-4 pt-5 pb-3 bg-white border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <h2 className="text-[20px] font-extrabold text-gray-900">{tx.profile}</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-[12px] font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700 cursor-pointer"
            >
              {isEditing ? <Check size={14} /> : <Edit2 size={12} />}
              {isEditing ? tx.saveProfile : tx.editProfile}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* User card */}
            <div className="bg-white px-4 py-5 mb-3 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-white font-extrabold text-[22px]"
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
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[14px] font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                        placeholder={tx.displayName}
                      />
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-2.5 pr-8 py-1.5 text-[14px] font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
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
                      <div className="flex items-center gap-1">
                        <h3 className="text-[17px] font-bold text-gray-900">{currentUser.displayName}</h3>
                        {currentUser.isVerified && (
                          <CheckCircle size={15} className="text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[13px] text-gray-500">@{currentUser.username}</p>
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
            <div className="bg-white px-4 py-3.5 mb-3 border-b border-gray-100 flex items-center justify-around text-center">
              <div>
                <p className="text-[18px] font-extrabold text-slate-800">{currentUser.reportsCount}</p>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{tx.reports}</p>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div>
                <p className="text-[18px] font-extrabold text-slate-800">{currentUser.upvotesCount}</p>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{tx.upvotes}</p>
              </div>
            </div>

            {/* Notification settings */}
            <div className="bg-white mb-3 border-b border-gray-100">
              <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/50">
                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">{tx.notifications}</p>
              </div>

              <div className="px-4 divide-y divide-gray-100">
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
            <div className="bg-white mb-3 border-b border-gray-100">
              <SettingsRow
                Icon={Moon}
                label={tx.darkMode}
                value={isDarkMode ? tx.on : tx.off}
                onClick={handleThemeToggle}
              />
              <SettingsRow
                Icon={Globe}
                label={tx.language}
                value={tx.langValue}
                onClick={onLanguageToggle}
              />
              <SettingsRow Icon={Shield} label={tx.privacy} />
              <SettingsRow Icon={CheckCircle} label={tx.about} />
            </div>

            {/* Logout */}
            <div className="px-4 pb-12 pt-2">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 rounded-2xl py-3.5 text-[14px] font-bold hover:bg-red-50 transition-colors cursor-pointer"
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
          checked ? 'bg-blue-600' : 'bg-gray-200'
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
          fetchAuthorities();
        }
      })
      .catch(() => setError('Failed to create account'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="p-4 space-y-5 bg-gray-50 min-h-full">
      {/* Top Welcome Card */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-[16px] font-extrabold text-slate-800 leading-snug">System Administration</h3>
        <p className="text-[12.5px] text-gray-500 mt-1 leading-relaxed">
          Create and manage verified responder profiles. These accounts have the authority to update hazard report status (e.g. In Progress, Resolved) and reply with official agency tags.
        </p>
      </div>

      {/* Account Creation Form */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5">
          <Shield size={16} className="text-blue-600" />
          <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">AUTHORITY & LGU MANAGEMENT</h3>
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
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CREATE RESPONDER ACCOUNT</p>
          
          {/* Stacked Form Fields (1 column, 4 rows) */}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              required
            />
            <select
              value={govCategory}
              onChange={(e) => setGovCategory(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-bold text-gray-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 font-bold text-[13px] shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? 'Creating Account...' : 'Create Responder Account'}
          </button>
        </form>
      </div>

      {/* Active Responders List */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">ACTIVE RESPONDERS ({authorities.length})</p>
        </div>

        {authorities.length === 0 ? (
          <p className="text-[12.5px] text-gray-400 italic bg-slate-50 p-4 rounded-2xl text-center">No responder accounts created yet.</p>
        ) : (
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {authorities.map((auth) => (
              <div
                key={auth.id}
                className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-[13px] font-bold text-gray-900 truncate">{auth.displayName}</p>
                  <p className="text-[11px] text-gray-500 font-medium">@{auth.username}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9.5px] font-extrabold bg-blue-50 text-blue-600 border border-blue-100 rounded px-2 py-0.5 uppercase tracking-wider">
                    {auth.governmentCategory || 'LGU'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
