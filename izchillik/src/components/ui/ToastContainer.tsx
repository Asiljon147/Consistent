import React from 'react';
import { AlertCircle, Award, CheckCircle2, Info, Sparkles, X } from 'lucide-react';
import { useApp } from '../../state/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 left-4 md:left-auto md:w-96 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const icon =
          toast.variant === 'levelup' ? (
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          ) : toast.variant === 'achievement' ? (
            <Award className="w-5 h-5 text-amber-400 shrink-0" />
          ) : toast.variant === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : toast.variant === 'warning' || toast.variant === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-accent shrink-0" />
          );

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-surface border border-border shadow-xl animate-slideDown"
          >
            {icon}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-text-muted mt-0.5">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Yopish"
              className="p-1 text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};