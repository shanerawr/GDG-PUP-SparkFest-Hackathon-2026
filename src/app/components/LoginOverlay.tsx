import { useState } from 'react';
import { Shield, Sparkles, User, FileText, ArrowRight, LogIn, UserPlus, Key, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import type { UserProfile } from '../types';

interface Props {
  onLoginSuccess: (user: UserProfile) => void;
}

const COLORS = ['#2563eb', '#059669', '#d97706', '#e11d48', '#4f46e5'];

const getAvatarColor = (name: string) => {
  let hash = 0;
  const username = name.toLowerCase().trim();
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
};

export function LoginOverlay({ onLoginSuccess }: Props) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    setError(null);
    setLoading(true);

    const cleanUsername = username.toLowerCase().replace(/\s+/g, '').trim();

    fetch('/api/accounts/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: cleanUsername,
        password: password,
        action: isSignUp ? 'signup' : 'login',
        language: 'en',
      }),
    })
      .then(async (res) => {
        const text = await res.text();
        let data;
        try {
          data = text ? JSON.parse(text) : {};
        } catch (e) {
          throw new Error('Server returned invalid response format');
        }
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Authentication failed');
        }
        return data;
      })
      .then((data) => {
        const avatarColor = getAvatarColor(cleanUsername);
        
        if (isSignUp) {
          const finalProfile = {
            ...data,
            displayName: displayName.trim() || data.displayName,
            avatarUrl: avatarColor,
            password: password,
          };

          fetch('/api/accounts/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(finalProfile),
          })
            .then((res) => res.json())
            .then((updatedData) => {
              onLoginSuccess(updatedData);
            })
            .catch(() => {
              onLoginSuccess(finalProfile);
            });
        } else {
          if (!data.avatarUrl) {
            const finalProfile = {
              ...data,
              avatarUrl: avatarColor,
            };
            fetch('/api/accounts/profile', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(finalProfile),
            })
              .then((res) => res.json())
              .then((updatedData) => {
                onLoginSuccess(updatedData);
              })
              .catch(() => {
                onLoginSuccess(finalProfile);
              });
          } else {
            onLoginSuccess(data);
          }
        }
      })
      .catch((err) => {
        setError(err.message || 'An error occurred during authentication');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex flex-col justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="w-full max-w-[400px] mx-auto border border-[#47B3E8]/35 rounded-[32px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] p-7 text-gray-900"
        style={{ background: '#F5F0C0' }}
      >
        <div className="flex flex-col items-center text-center mb-6">
          <svg viewBox="0 0 450 250" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[250px] h-auto mb-2 animate-in fade-in zoom-in duration-300">
            {/* Drop Shadow */}
            <ellipse cx="80" cy="220" rx="55" ry="12" fill="#CBD5E1" opacity="0.8" />
            
            {/* Pin Body */}
            <path
              d="M80 15C38.58 15 5 48.58 5 90C5 142.5 80 205 80 205C80 205 155 142.5 155 90C155 48.58 121.42 15 80 15Z"
              fill="#1A1A1A"
            />
            
            {/* Yellow Circle */}
            <circle cx="80" cy="90" r="42" fill="#FFC80A" />
            
            {/* Exclamation Mark */}
            <path
              d="M75 62C75 59.24 77.24 57 80 57C82.76 57 85 59.24 85 62V100C85 102.76 82.76 105 80 105C77.24 105 75 102.76 75 100V62Z"
              fill="white"
            />
            <circle cx="80" cy="122" r="6.5" fill="white" />
            
            {/* Text "bantay" */}
            <text
              x="175"
              y="102"
              fill="#47B3E8"
              fontSize="76"
              fontWeight="800"
              fontFamily="Nunito, Outfit, 'Lexend Deca', system-ui, sans-serif"
              letterSpacing="-2"
            >
              bantay
            </text>
            
            {/* Text "bayan" */}
            <text
              x="175"
              y="172"
              fill="#47B3E8"
              fontSize="76"
              fontWeight="800"
              fontFamily="Nunito, Outfit, 'Lexend Deca', system-ui, sans-serif"
              letterSpacing="-2"
            >
              bayan
            </text>
          </svg>
          <p className="text-[11.5px] text-gray-500 max-w-[260px] font-semibold mt-1">
            Community Safety & Infrastructure Hazard Tracker
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-[12px] font-semibold rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-1">
                Display Name
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Juan dela Cruz"
                  className="w-full bg-white border border-[#47B3E8]/20 rounded-xl pl-10 pr-4 py-3 text-[14px] font-medium text-black focus:outline-none focus:border-[#47B3E8] focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-1">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[14px]">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="juandelacruz"
                className="w-full bg-white border border-[#47B3E8]/20 rounded-xl pl-9 pr-4 py-3 text-[14px] font-medium text-black focus:outline-none focus:border-[#47B3E8] focus:bg-white transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Key size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#47B3E8]/20 rounded-xl pl-10 pr-10 py-3 text-[14px] font-medium text-black focus:outline-none focus:border-[#47B3E8] focus:bg-white transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-lg"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white rounded-xl py-3.5 font-extrabold text-[14px] flex items-center justify-center gap-2 shadow-lg shadow-[#47B3E8]/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              style={{ background: '#47B3E8' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? (
                    <>
                      <UserPlus size={16} />
                      <span>Sign Up & Register</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={16} />
                      <span>Log In</span>
                    </>
                  )}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setPassword('');
            }}
            className="text-[12px] font-bold hover:text-[#3ea5da] underline underline-offset-2 transition-colors cursor-pointer"
            style={{ color: '#47B3E8' }}
          >
            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-[#47B3E8]/10 flex items-center justify-center gap-4 text-[11px] text-gray-500 font-bold">
          <span className="flex items-center gap-1">
            <Shield size={12} className="text-[#47B3E8]" /> Secure Auth
          </span>
          <span className="w-1.5 h-1.5 bg-[#47B3E8]/25 rounded-full" />
          <span className="flex items-center gap-1">
            <FileText size={12} className="text-[#47B3E8]" /> GDG SparkFest
          </span>
        </div>
      </motion.div>
    </div>
  );
}
