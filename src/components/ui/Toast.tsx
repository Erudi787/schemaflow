import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastData {
    id: number;
    type: ToastType;
    message: string;
}

const icons: Record<ToastType, typeof CheckCircle> = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
};

const colors: Record<ToastType, string> = {
    success: 'border-success/40 bg-success/10 text-success',
    error: 'border-error/40 bg-error/10 text-error',
    info: 'border-info/40 bg-info/10 text-info',
};

let toastId = 0;
let addToastFn: ((type: ToastType, message: string) => void) | null = null;

/**
 * Show a toast notification from anywhere in the app.
 */
export function showToast(type: ToastType, message: string) {
    addToastFn?.(type, message);
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    useEffect(() => {
        addToastFn = (type, message) => {
            const id = ++toastId;
            setToasts((prev) => [...prev, { id, type, message }]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 4000);
        };
        return () => {
            addToastFn = null;
        };
    }, []);

    const dismiss = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => {
                const Icon = icons[toast.type];
                return (
                    <div
                        key={toast.id}
                        className={
                            'pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-lg border shadow-md text-sm ' +
                            colors[toast.type]
                        }
                        style={{ animation: 'fadeIn 0.25s ease-out' }}
                    >
                        <Icon size={16} />
                        <span className="flex-1">{toast.message}</span>
                        <button
                            onClick={() => dismiss(toast.id)}
                            className="p-0.5 hover:opacity-70 transition-opacity"
                        >
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
