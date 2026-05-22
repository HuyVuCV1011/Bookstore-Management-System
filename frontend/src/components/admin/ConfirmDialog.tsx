import React from 'react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary' | 'success';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen = true,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  loading = false,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
}) => {
  const handleClose = onClose ?? onCancel ?? (() => {});
  const confirmClass =
    confirmVariant === 'success'
      ? 'bg-green-700 hover:bg-green-800'
      : confirmVariant === 'primary'
        ? 'bg-primary hover:bg-primary-hover'
        : 'bg-red-600 hover:bg-red-700';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <p className="mb-6 text-sm leading-6 text-gray-700">{message}</p>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          onClick={handleClose}
          className="rounded-button border border-border bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
          disabled={loading}
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={`rounded-button px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${confirmClass}`}
          disabled={loading}
        >
          {loading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};
