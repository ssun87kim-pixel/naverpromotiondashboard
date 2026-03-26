import React, { useState } from 'react';
import { exportExcel, exportPdf } from '../services/ReportService';
import type { ReportData } from '../services/ReportService';

// ============================================================
// Props
// ============================================================

interface DownloadButtonsProps {
  reportData: ReportData | null;
  dashboardElementId: string;
}

// ============================================================
// 컴포넌트
// ============================================================

const DownloadButtons: React.FC<DownloadButtonsProps> = ({
  reportData,
  dashboardElementId,
}) => {
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDisabled = reportData === null;

  const handleExcelDownload = async () => {
    if (!reportData) return;
    setErrorMessage(null);
    setExcelLoading(true);
    try {
      await exportExcel(reportData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '파일 생성에 실패했습니다. 다시 시도해주세요.';
      setErrorMessage(msg);
    } finally {
      setExcelLoading(false);
    }
  };

  const handlePdfDownload = async () => {
    if (!reportData) return;
    setErrorMessage(null);
    setPdfLoading(true);
    try {
      const eventName = reportData.context.eventName;
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const filename = `${eventName}_성과분석_${dateStr}.pdf`;
      await exportPdf(dashboardElementId, filename);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '파일 생성에 실패했습니다. 다시 시도해주세요.';
      setErrorMessage(msg);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* 오류 메시지 */}
      {errorMessage && (
        <span className="text-xs text-red-600" role="alert">
          {errorMessage}
        </span>
      )}

      {/* 엑셀 다운로드 버튼 */}
      <button
        type="button"
        onClick={handleExcelDownload}
        disabled={isDisabled || excelLoading}
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200',
          'transition-colors',
          isDisabled || excelLoading
            ? 'opacity-40 cursor-not-allowed bg-white text-gray-400'
            : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer',
        ].join(' ')}
        aria-label="엑셀 다운로드"
        data-testid="download-excel"
      >
        {excelLoading ? (
          <LoadingSpinner />
        ) : (
          <ExcelIcon />
        )}
        <span>엑셀</span>
      </button>

      {/* PDF 다운로드 버튼 */}
      <button
        type="button"
        onClick={handlePdfDownload}
        disabled={isDisabled || pdfLoading}
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200',
          'transition-colors',
          isDisabled || pdfLoading
            ? 'opacity-40 cursor-not-allowed bg-white text-gray-400'
            : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer',
        ].join(' ')}
        aria-label="PDF 다운로드"
        data-testid="download-pdf"
      >
        {pdfLoading ? (
          <LoadingSpinner />
        ) : (
          <PdfIcon />
        )}
        <span>PDF</span>
      </button>
    </div>
  );
};

// ============================================================
// 아이콘 컴포넌트
// ============================================================

const ExcelIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1" y="1" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M4 4.5L6.5 7L4 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.5 9.5H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const PdfIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M3 1.5H8.5L11 4V12.5H3V1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M8.5 1.5V4H11" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M5 7H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M5 9H7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const LoadingSpinner: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="animate-spin"
    aria-hidden="true"
  >
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20 14" strokeLinecap="round" />
  </svg>
);

export default DownloadButtons;
