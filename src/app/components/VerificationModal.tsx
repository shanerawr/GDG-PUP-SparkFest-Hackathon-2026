import { useState, useEffect } from 'react';
import { X, Shield, Phone, Mail, Upload, CheckCircle, FileText, Smartphone, Loader, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { UserProfile } from '../types';

interface Props {
  user: UserProfile;
  onClose: () => void;
  onVerificationUpdate: (user: UserProfile) => void;
}

export function VerificationModal({ user, onClose, onVerificationUpdate }: Props) {
  const [step, setStep] = useState(1);
  const [contactType, setContactType] = useState<'phone' | 'email'>('phone');
  const [contactVal, setContactVal] = useState('');
  const [idType, setIdType] = useState('National ID');
  const [fileSelected, setFileSelected] = useState(false);
  const [fileName, setFileName] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Auto scanning animation in step 2
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (scanning) {
      interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setScanning(false);
              setStep(3);
              submitPending();
            }, 800);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [scanning]);

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactVal.trim()) return;
    setStep(2);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
      setFileSelected(true);
    }
  };

  const startScanning = () => {
    setScanning(true);
    setScanProgress(0);
  };

  const submitPending = () => {
    const updated = {
      ...user,
      verificationStatus: 'pending' as const,
      isVerified: false,
    };
    
    // Save pending state on backend
    fetch('/api/accounts/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
      .then((res) => res.json())
      .then((data) => {
        onVerificationUpdate(data);
        
        // Auto approve after 5 seconds to simulate admin check, triggering a notification!
        setTimeout(() => {
          approveVerification();
        }, 5000);
      })
      .catch(() => onVerificationUpdate(updated));
  };

  const approveVerification = () => {
    const verifiedUser = {
      ...user,
      verificationStatus: 'verified' as const,
      isVerified: true,
    };

    fetch('/api/accounts/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verifiedUser),
    })
      .then((res) => res.json())
      .then((data) => {
        onVerificationUpdate(data);
        // Create verification notification
        fetch('/api/notifications', {
          method: 'POST',
          // Since notifications trigger in DB is handled by standard API or local,
          // let's insert a notification in the backend. Wait, let's create a local notification,
          // or we can just fetch notifications again! The backend will trigger it if we tell it,
          // but we can also just fetch. Wait, we can fetch notifications in App.tsx!
        });
      })
      .catch(() => onVerificationUpdate(verifiedUser));
  };

  const handleInstantVerify = () => {
    approveVerification();
    setStep(4); // Success screen
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm z-[1000] flex items-end justify-center sm:items-center sm:p-4"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="w-full bg-white rounded-t-[32px] sm:rounded-[28px] max-w-[420px] overflow-hidden flex flex-col shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)]"
      >
        {/* Header */}
        <div className="relative flex items-center justify-center px-4 pt-5 pb-3 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-1.5 text-blue-600 font-extrabold text-[15px]">
            <Shield size={16} />
            <span>Identity Verification</span>
          </div>
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto min-h-0 bg-gray-50/50">
          <AnimatePresence mode="wait">
            {step === 1 && (
              /* Step 1: Info & Details */
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-800">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <div className="text-[12px] leading-relaxed">
                    <p className="font-bold mb-0.5">Verification Required to Post</p>
                    To maintain data reliability and prevent false reports, BantayBayan requires members to perform a one-time verification check before creating new hazard reports.
                  </div>
                </div>

                <form onSubmit={handleNextStep1} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                      Verification Method
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setContactType('phone'); setContactVal(''); }}
                        className={`flex-1 py-3 px-3 rounded-xl border flex items-center justify-center gap-2 text-[13px] font-bold transition-all ${
                          contactType === 'phone'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Smartphone size={15} />
                        SMS/Phone Check
                      </button>
                      <button
                        type="button"
                        onClick={() => { setContactType('email'); setContactVal(''); }}
                        className={`flex-1 py-3 px-3 rounded-xl border flex items-center justify-center gap-2 text-[13px] font-bold transition-all ${
                          contactType === 'email'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Mail size={15} />
                        Email OTP Check
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">
                      {contactType === 'phone' ? 'Phone Number' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        {contactType === 'phone' ? <Phone size={15} /> : <Mail size={15} />}
                      </span>
                      <input
                        type={contactType === 'phone' ? 'tel' : 'email'}
                        value={contactVal}
                        onChange={(e) => setContactVal(e.target.value)}
                        placeholder={contactType === 'phone' ? '0917 123 4567' : 'you@example.com'}
                        className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-[13px] font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">
                      Select Government ID
                    </label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-[13px] font-semibold text-gray-800 focus:outline-none focus:border-blue-500"
                    >
                      <option>National ID / PhilSys</option>
                      <option>UMID</option>
                      <option>Driver's License</option>
                      <option>Passport</option>
                      <option>Postal ID</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3.5 font-bold text-[13px] transition-colors"
                  >
                    Continue to Document Upload
                  </button>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              /* Step 2: Upload ID and Scanning Animation */
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4 text-center"
              >
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[180px]">
                  {scanning ? (
                    <div className="absolute inset-0 bg-blue-900/10 flex flex-col items-center justify-center">
                      <div className="w-[120px] h-[70px] border-2 border-blue-500 rounded-lg relative flex items-center justify-center bg-blue-50/50">
                        <FileText size={28} className="text-blue-600" />
                        {/* Horizontal scanning bar */}
                        <motion.div
                          animate={{ y: [-35, 35] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                          className="absolute left-0 right-0 h-0.5 bg-blue-600 shadow-[0_0_8px_#2563eb]"
                        />
                      </div>
                      <p className="text-[12px] font-bold text-blue-700 mt-4">Scanning ID Document ({scanProgress}%)</p>
                    </div>
                  ) : fileSelected ? (
                    <>
                      <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-full flex items-center justify-center text-green-600 mb-3">
                        <FileText size={20} />
                      </div>
                      <p className="text-[13px] font-bold text-gray-800 mb-0.5 truncate max-w-[240px]">{fileName}</p>
                      <p className="text-[11px] text-gray-400 mb-4">{idType} ready</p>
                      <button
                        onClick={startScanning}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold shadow-md transition-colors"
                      >
                        Submit & Scan Document
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-3">
                        <Upload size={20} />
                      </div>
                      <p className="text-[13px] font-bold text-gray-700 mb-1">Upload Government ID Photo</p>
                      <p className="text-[11px] text-gray-400 mb-4">Formats: JPG, PNG (Max 5MB)</p>
                      <label className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[12px] font-bold cursor-pointer shadow-md transition-colors">
                        Select File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </>
                  )}
                </div>

                <div className="flex justify-between gap-3 pt-2">
                  <button
                    disabled={scanning}
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-[12px] font-bold transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleInstantVerify}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[12px] font-bold shadow-md shadow-amber-500/20 transition-colors"
                  >
                    ⚡ Fast Verify (Dev)
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              /* Step 3: Pending Approval */
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 text-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto mb-4 relative">
                  <Loader size={26} className="animate-spin" />
                </div>
                <h3 className="text-[17px] font-extrabold text-slate-900">Verification Pending</h3>
                <p className="text-[12.5px] text-gray-500 leading-relaxed max-w-[280px] mx-auto">
                  Your government ID upload is being processed by the system.
                </p>
                <div className="bg-white border border-gray-100 rounded-xl p-3.5 text-left text-[11px] text-gray-500 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="font-semibold">ID Type:</span>
                    <span className="text-gray-800 font-bold">{idType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Contact:</span>
                    <span className="text-gray-800 font-bold">{contactVal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Status:</span>
                    <span className="text-amber-600 font-extrabold">Awaiting Admin (Auto-verify in 5s)</span>
                  </div>
                </div>
                <button
                  onClick={handleInstantVerify}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-[12px] font-bold shadow-md shadow-blue-500/25 transition-colors"
                >
                  Approve Instantly
                </button>
              </motion.div>
            )}

            {step === 4 && (
              /* Step 4: Success verified! */
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 text-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 mx-auto mb-3">
                  <CheckCircle size={36} />
                </div>
                <h3 className="text-[18px] font-extrabold text-slate-900">Account Verified!</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed max-w-[280px] mx-auto">
                  Salamat! Your identity has been verified. You can now post pins and report hazards to the community map.
                </p>
                <button
                  onClick={onClose}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3.5 text-[13px] font-bold transition-colors"
                >
                  Start Reporting
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
