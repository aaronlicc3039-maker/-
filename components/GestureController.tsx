import React, { useEffect, useRef, useState } from 'react';
import { analyzeHandGesture } from '../services/geminiService';
import { AppState } from '../types';

interface GestureControllerProps {
  onStateChange: (state: AppState) => void;
}

const GestureController: React.FC<GestureControllerProps> = ({ onStateChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        console.error("Camera permission denied", err);
      }
    };
    startCamera();

    return () => {
      // Cleanup tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!hasPermission) return;

    const intervalId = setInterval(async () => {
      if (isProcessing || !videoRef.current || !canvasRef.current) return;

      setIsProcessing(true);
      
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx && video.readyState === 4) {
          // Draw video frame to canvas
          canvas.width = 320; // Lower res for speed
          canvas.height = 240;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const base64 = canvas.toDataURL('image/jpeg', 0.6);
          
          const result = await analyzeHandGesture(base64);
          
          if (result.gesture === 'OPEN_PALM') {
            onStateChange(AppState.CHAOS);
          } else if (result.gesture === 'CLOSED_FIST') {
            onStateChange(AppState.FORMED);
          }
        }
      } catch (e) {
        console.error("Gesture check failed", e);
      } finally {
        setIsProcessing(false);
      }

    }, 1500); // Check every 1.5 seconds to balance API usage and responsiveness

    return () => clearInterval(intervalId);
  }, [hasPermission, isProcessing, onStateChange]);

  return (
    <>
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Visual Indicator for Camera Status */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 pointer-events-none">
        <div className={`w-3 h-3 rounded-full ${hasPermission ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-gold-300 text-xs uppercase tracking-widest font-bold">
           {hasPermission ? (isProcessing ? 'AI Analyzing...' : 'Camera Active') : 'Camera Inactive'}
        </span>
      </div>
    </>
  );
};

export default GestureController;
