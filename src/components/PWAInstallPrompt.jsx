import { usePWAInstall } from '../utils/pwa';

export default function PWAInstallPrompt() {
  const { canInstall, isInstalled, install } = usePWAInstall();

  if (isInstalled || !canInstall) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm bg-indigo-600 text-white rounded-xl p-4 shadow-lg border border-indigo-500 z-40 animate-slide-in">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Install App</h3>
          <p className="text-xs text-indigo-100">
            Install Attendance Manager on your device for quick access and offline support.
          </p>
        </div>
        <button
          onClick={install}
          className="ml-2 px-3 py-1.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
        >
          Install
        </button>
      </div>
    </div>
  );
}
