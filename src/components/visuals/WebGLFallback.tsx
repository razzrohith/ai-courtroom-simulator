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
    // sessionStorage.setItem('3dFailed')
    sessionStorage.setItem('3dFailed', 'true');
    setShow3D(false);
  }, []);

  const handleUse2D = () => {
    setShow3D(false);
  };

  const handleRetry = () => {
    // Clear the failure flag and attempt to show 3D again
    sessionStorage.removeItem('3dFailed');
    setShow3D(true);
    if (onRetry) onRetry();
  };

  return (
    <div className="w-full p-2 bg-yellow-900/80 border border-yellow-700 rounded-md flex flex-col items-center text-center text-sm text-yellow-200">
      <div className="mb-1 font-bold animate-pulse">3D graphics failed – switched to 2D view</div>
      <div className="flex gap-2">
        <button onClick={handleUse2D} className="px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-gray-200 transition">
          Use 2D Courtroom
        </button>
        <button onClick={handleRetry} className="px-3 py-1 bg-blue-800 hover:bg-blue-700 border border-blue-600 rounded text-gray-200 transition">
          Try 3D Again
        </button>
      </div>
    </div>
  );
};

export default WebGLFallback;
