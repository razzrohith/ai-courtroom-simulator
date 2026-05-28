import React, { useEffect } from 'react';

interface WebGLFallbackProps {
  setShow3D: (show: boolean) => void;
  onRetry?: () => void;
}

/**
 * Compact fallback UI displayed when WebGL fails to initialize.
 * Shows a brief banner with a warning that experimental 3D failed.
 */
export const WebGLFallback: React.FC<WebGLFallbackProps> = ({ setShow3D }) => {
  // Mark that 3D has failed for this session
  useEffect(() => {
    sessionStorage.setItem('3dFailed', 'true');
    setShow3D(false);
  }, [setShow3D]);

  return (
    <div className="w-full flex items-center justify-between p-2.5 bg-red-955/30 border border-red-500/30 rounded-lg text-xs text-red-400 shadow-md">
      <div className="flex items-center gap-2">
        <span className="text-red-500">⚠️</span>
        <span className="font-semibold animate-pulse">Experimental 3D failed — returned to stable 2D</span>
      </div>
    </div>
  );
};

export default WebGLFallback;
