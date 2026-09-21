import React, { useEffect, useState } from 'react';
import { RotateCcw, X, Check } from 'lucide-react';

export interface UndoToastProps {
  isOpen: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  durationMs?: number;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  isOpen,
  message,
  onUndo,
  onDismiss,
  durationMs = 6000,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isOpen) {
      setProgress(100);
      return;
    }

    const intervalStep = 50;
    const totalSteps = durationMs / intervalStep;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const remaining = Math.max(0, 100 - (currentStep / totalSteps) * 100);
      setProgress(remaining);

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        onDismiss();
      }
    }, intervalStep);

    return () => clearInterval(timer);
  }, [isOpen, durationMs, onDismiss]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="relative overflow-hidden rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-2xl border border-neutral-800 dark:border-neutral-200 min-w-[320px] max-w-md p-3.5 flex items-center justify-between gap-3">
        {/* Message */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
          <span className="text-xs font-medium truncate select-none">
            {message}
          </span>
        </div>

        {/* Undo & Close buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onUndo}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-xs font-bold hover:opacity-90 active:scale-95 transition flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Hoàn tác</span>
          </button>
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-neutral-400 hover:text-white dark:hover:text-neutral-900 transition"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Animated Countdown Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800 dark:bg-neutral-200">
          <div
            className="h-full bg-white dark:bg-neutral-900 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
