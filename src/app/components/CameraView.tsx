import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, Camera as CameraIcon } from 'lucide-react';

interface CameraViewProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

export function CameraView({ onCapture, onClose }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error("Error accessing camera:", err);
        setError("Unable to access camera. Please check permissions.");
      }
    }
    startCamera();

    return () => {
      // Cleanup: stop all video tracks when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Run once on mount

  // We need a second effect to handle stream cleanup accurately because state updates are async
  useEffect(() => {
    return () => {
      setStream(s => {
        if (s) {
          s.getTracks().forEach(t => t.stop());
        }
        return null;
      });
    };
  }, []);

  const handleSnap = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // 80% quality JPEG
        
        // Stop tracks immediately before closing
        stream.getTracks().forEach(track => track.stop());
        onCapture(dataUrl);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full h-full max-w-sm sm:max-w-md max-h-[800px] bg-black rounded-[32px] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col relative"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="w-9 h-9" /> {/* Spacer */}
          <p className="text-white font-bold text-[15px] tracking-wide">Photo</p>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Feed */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="px-6 text-center text-white">
              <p className="text-red-400 mb-2">{error}</p>
              <p className="text-sm opacity-80">You can still upload a photo from your gallery instead.</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* subtle viewfinder grid overlay */}
          {!error && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-20">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div className="border-r border-white" />
              <div className="" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="h-[140px] bg-black flex items-center justify-center pb-6 relative z-10">
          {!error && (
            <button
              onClick={handleSnap}
              className="w-[72px] h-[72px] rounded-full border-[4px] border-white flex items-center justify-center p-1 active:scale-90 transition-transform"
            >
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                 {/* Inner circle is solid white */}
              </div>
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
