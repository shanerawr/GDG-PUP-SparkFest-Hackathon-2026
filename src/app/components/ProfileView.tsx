import { useState } from 'react';
import { CheckCircle, Bell, Globe, Shield, LogOut, ChevronRight, Edit2, Check, Key, Clock, ShieldAlert, Eye, EyeOff, Moon } from 'lucide-react';
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
      <div className="px-4 pt-5 pb-3 bg-white border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-[20px] font-extrabold text-gray-900">{tx.profile}</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-[12px] font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700"
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[14px] font-semibold text-gray-900 focus:outline-none focus:border-blue-500"
                    placeholder={tx.displayName}
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-2.5 pr-8 py-1.5 text-[14px] font-semibold text-gray-900 focus:outline-none focus:border-blue-500"
                      placeholder={tx.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-lg"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <p className="text-[17px] font-bold text-gray-900 truncate">{currentUser.displayName}</p>
                    {currentUser.verificationStatus === 'verified' && (
                      <CheckCircle size={16} className="text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[13px] text-gray-500 font-medium">@{currentUser.username}</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">
                    {tx.since} {currentUser.joinedDate || 'June 2026'}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Verification Badge & CTA */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            {currentUser.verificationStatus === 'verified' ? (
              <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full text-[12px] font-bold">
                <CheckCircle size={14} />
                <span>{tx.verified}</span>
              </div>
            ) : currentUser.verificationStatus === 'pending' ? (
              <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full text-[12px] font-bold">
                <Clock size={14} className="animate-spin" />
                <span>{tx.pending}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full text-[12px] font-bold">
                  <ShieldAlert size={14} />
                  <span>{tx.unverified}</span>
                </div>
                <button
                  onClick={onStartVerification}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[12px] px-4 py-2 rounded-xl shadow-md shadow-blue-500/10 active:scale-95 transition-all"
                >
                  {tx.verifyNow}
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-[20px] font-extrabold text-gray-900">{currentUser.reportsCount || 0}</p>
              <p className="text-[11px] font-medium text-gray-500">{tx.reports}</p>
            </div>
            <div className="w-px bg-gray-100" />
            <div>
              <p className="text-[20px] font-extrabold text-gray-900">{currentUser.upvotesCount || 0}</p>
              <p className="text-[11px] font-medium text-gray-500">{tx.upvotes}</p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
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
            className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 rounded-2xl py-3.5 text-[14px] font-bold hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            {tx.logout}
          </button>
        </div>
      </div>
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
      <span className="text-[13.5px] font-semibold text-gray-800">{label}</span>
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
      className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      <Icon size={16} className="text-gray-500 flex-shrink-0" />
      <span className="flex-1 text-left text-[13.5px] font-semibold text-gray-700">{label}</span>
      {value && <span className="text-[12.5px] text-gray-400 font-semibold">{value}</span>}
      <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
    </button>
  );
}

