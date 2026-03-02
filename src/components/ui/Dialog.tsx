import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
            dialog.showModal();
        } else {
            dialog.close();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <dialog
            ref={dialogRef}
            className="fixed inset-0 z-50 m-auto w-[480px] max-h-[80vh] rounded-xl bg-bg-secondary border border-border shadow-lg backdrop:bg-black/50 p-0 text-text-primary"
            onClose={onClose}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <h2 className="text-sm font-semibold">{title}</h2>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-bg-hover rounded transition-colors text-text-muted hover:text-text-primary"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="px-5 py-4 overflow-y-auto">
                {children}
            </div>
        </dialog>
    );
}
