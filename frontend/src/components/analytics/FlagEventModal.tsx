import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlagEventModalProps {
  isOpen: boolean;
  eventId: string;
  onClose: () => void;
  onConfirm: (eventId: string, reason: string) => Promise<void>;
}

export const FlagEventModal: React.FC<FlagEventModalProps> = ({
  isOpen,
  eventId,
  onClose,
  onConfirm
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear state on close
  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    // Validation: minimum 10 characters
    if (reason.trim().length < 10) {
      setError('Lý do phải có ít nhất 10 ký tự');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await onConfirm(eventId, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi đánh dấu sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReason(e.target.value);
    if (error) {
      setError('');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="fixed inset-0 z-40 bg-black/50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Đánh dấu sự kiện bất thường
                </h2>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="mb-4">
                  <label htmlFor="reason" className="mb-2 block text-sm font-medium text-gray-700">
                    Lý do đánh dấu <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={handleReasonChange}
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                    rows={4}
                    placeholder="Nhập lý do đánh dấu sự kiện này (tối thiểu 10 ký tự)..."
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {reason.trim().length}/10 ký tự tối thiểu
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading || reason.trim().length < 10}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {loading ? 'Đang xử lý...' : 'Xác nhận'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
