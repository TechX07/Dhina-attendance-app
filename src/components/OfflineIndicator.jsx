import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-amber-600 text-white rounded-lg p-3 shadow-lg border border-amber-500 z-50 flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
      <span className="text-sm font-medium">You are offline. Changes will sync when connection is restored.</span>
    </div>
  );
}
