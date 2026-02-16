import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './ui/button';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type?: 'post' | 'thread' | 'item' | 'order';
  message?: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  type = 'item',
  message,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const title = `Delete ${type.charAt(0).toUpperCase() + type.slice(1)}?`;
  const defaultMessage = `Are you sure you want to delete this ${type}? This action cannot be undone.`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-neutral-700 leading-relaxed mb-6">
            {message || defaultMessage}
          </p>

          {/* Warning Notice */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">
                  This action cannot be undone
                </p>
                <p className="text-sm text-red-700">
                  Once deleted, this {type} will be permanently removed from your profile and cannot be recovered.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Delete {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-2 border-neutral-200 hover:bg-neutral-50"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}