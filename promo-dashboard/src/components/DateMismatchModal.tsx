import React from 'react';
import type { ParseWarning } from '../types/index';

interface Props {
  warning: ParseWarning | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const DateMismatchModal: React.FC<Props> = ({ warning, onConfirm, onCancel }) => {
  if (!warning) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="date-mismatch-title"
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm mx-4 p-6 space-y-4">
        <h2 id="date-mismatch-title" className="text-base font-bold text-gray-900">
          날짜 범위 불일치
        </h2>

        <p className="text-sm text-gray-700">{warning.message}</p>

        <div className="text-xs text-gray-500 space-y-1 bg-gray-50 rounded-lg p-3">
          <p>
            <span className="font-medium">입력한 기간:</span> {warning.detail.expected}
          </p>
          <p>
            <span className="font-medium">파일 기간:</span> {warning.detail.actual}
          </p>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 bg-blue text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            계속 진행
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateMismatchModal;
