import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const location = useLocation();

  // Only show on login page
  const isLoginPage = location.pathname === '/login';

  // Check if device is mobile/tablet
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event for later use
      setDeferredPrompt(e);
      setCanInstall(true);
      setDismissed(false);
      console.log('Install prompt available');
    };

    const handleAppInstalled = () => {
      console.log('App was installed');
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setCanInstall(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log('Install prompt not available');
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  // Only show if:
  // 1. On login page
  // 2. On mobile device
  // 3. Install prompt is available
  // 4. Not dismissed
  // 5. App not already installed
  if (!isLoginPage || !isMobile || !canInstall || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm bg-indigo-600 text-white rounded-xl p-4 shadow-lg border border-indigo-500 z-40 animate-slide-in">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Install App</h3>
          <p className="text-xs text-indigo-100">
            Get quick access and use offline. Install Attendance Manager now!
          </p>
        </div>
        <div className="flex gap-2 ml-2 flex-shrink-0">
          <button
            onClick={() => setDismissed(true)}
            className="px-2 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded text-xs font-medium transition-colors cursor-pointer"
          >
            Later
          </button>
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
