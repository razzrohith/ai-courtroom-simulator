import React, { useEffect } from 'react';

interface WebGLFallbackProps {
  setShow3D: (show: boolean) => void;
  onRetry?: () => void;
}

/**
 * Compact fallback UI displayed when WebGL fails to initialize.
 * Shows a brief banner with a warning and a retry button.
 */
export const WebGLFallback: React.FC<WebGLFallbackProps> = ({ setShow3D, onRetry }) => {
  // Mark that 3D has failed for this session
  useEffect(() => {
    // Mark failure and automatically switch to 2D view
    sessionStorage.setItem('3dFailed', 'true');
    setShow3D(false);
  }, []);

  const handleRetry = () => {
    // Clear the failure flag and attempt to show 3D again
    sessionStorage.removeItem('3dFailed');
    setShow3D(true);
    if (onRetry) onRetry();
  };

  return (
    <div className="w-full flex items-center justify-between p-2.5 bg-[#0e1217] border border-amber-500/30 rounded-lg text-xs text-amber-500 shadow-md">
      <div className="flex items-center gap-2">
        <span className="text-amber-500">⚠️</span>
        <span className="font-semibold animate-pulse">3D unavailable — using stable 2D courtroom</span>
      </div>
      <button 
        onClick={handleRetry} 
        className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-500/50 rounded text-[10px] font-bold text-amber-400 transition"
      >
        Try 3D Again
      </button>
    </div>
  );
};

export default WebGLFallback;
