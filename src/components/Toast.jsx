import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={addToast}>
            {children}
            {/* Mobile: bottom-center. Desktop: top-right */}
            <div className="fixed bottom-4 left-4 right-4 md:bottom-auto md:top-4 md:left-auto md:right-4 md:w-80 z-50 flex flex-col gap-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all animate-slide-in ${toast.type === 'success'
                            ? 'bg-emerald-600'
                            : toast.type === 'error'
                                ? 'bg-red-600'
                                : 'bg-blue-600'
                            }`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
            <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 768px) {
          @keyframes slide-in {
            from { opacity: 0; transform: translateX(100%); }
            to { opacity: 1; transform: translateX(0); }
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
        </ToastContext.Provider>
    );
}
