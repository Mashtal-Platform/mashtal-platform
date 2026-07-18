import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import {
  REPORT_REASON_OPTIONS,
  submitBusinessReport,
  type ReportReasonId,
} from '../shared/api/reports';

interface ReportBusinessModalProps {
  open: boolean;
  businessId: string;
  businessName: string;
  onClose: () => void;
  onReported: () => void;
}

export function ReportBusinessModal({
  open,
  businessId,
  businessName,
  onClose,
  onReported,
}: ReportBusinessModalProps) {
  const [reason, setReason] = useState<ReportReasonId | ''>('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      toast.error('Please choose a reason for the report');
      return;
    }
    setSubmitting(true);
    try {
      await submitBusinessReport(businessId, {
        reason,
        details: details.trim() || undefined,
      });
      toast.success('Report submitted. Our team will review it.');
      onReported();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Report business</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-neutral-600">
            Report <span className="font-medium text-neutral-900">{businessName}</span>. You can
            only submit one report for this business.
          </p>

          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-2">
              Why are you reporting?
            </label>
            <div className="space-y-2">
              {REPORT_REASON_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    reason === opt.id
                      ? 'border-red-400 bg-red-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={opt.id}
                    checked={reason === opt.id}
                    onChange={() => setReason(opt.id)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-neutral-800">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-2">
              Extra details (optional)
            </label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Add any details that help us review this report…"
              rows={3}
              maxLength={1000}
              className="resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !reason}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {submitting ? 'Submitting…' : 'Submit report'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
