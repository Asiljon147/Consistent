import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { BottomSheetModal } from './BottomSheetModal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Tasdiqlash',
  danger = false,
}) => {
  return (
    <BottomSheetModal open={open} onClose={onClose} title={title} maxWidthClass="md:max-w-md">
      <div className="flex items-start gap-3">
        <div
          className={`p-2.5 rounded-xl shrink-0 ${
            danger ? 'bg-red-500/15 text-red-400' : 'bg-accent/15 text-accent'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] px-4 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors"
        >
          Bekor qilish
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`min-h-[44px] px-4 rounded-xl text-sm font-semibold text-white transition-colors ${
            danger ? 'bg-red-600 hover:bg-red-500' : 'bg-accent hover:bg-accent-hover'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </BottomSheetModal>
  );
};