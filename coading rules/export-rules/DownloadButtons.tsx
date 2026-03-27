import React, { useRef, useState } from 'react';
import { exportExcel, exportPdf } from '../services/ReportService';
import type { ReportData } from '../services/ReportService';
import { usePromotionStore } from '../stores/promotionStore';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isDisabled = reportData === null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 6000);
  };

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

    // PDF 캡처 모드 ON (상품 테이블 접기 + 입력 패널 접기)
    const store = usePromotionStore.getState();
    const panelWasOpen = store.inputPanelOpen;
    store.setPdfCaptureMode(true);
    if (panelWasOpen) store.toggleInputPanel();
    showToast('PDF 생성: 입력 패널을 접고, 상품은 구분 단위로 표시됩니다');

    try {
      // DOM 업데이트 + 레이아웃 완전 안정화 대기
      await new Promise((r) => setTimeout(r, 500));
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise((r) => setTimeout(r, 1500));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(undefined))));

      const eventName = reportData.context.eventName;
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const filename = `${eventName}_성과분석_${dateStr}.pdf`;
      await exportPdf(dashboardElementId, filename);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '파일 생성에 실패했습니다. 다시 시도해주세요.';
      setErrorMessage(msg);
    } finally {
      // 항상 복원
      usePromotionStore.getState().setPdfCaptureMode(false);
      if (panelWasOpen) usePromotionStore.getState().toggleInputPanel();
      setPdfLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="flex items-center gap-2 relative">
      {/* 토스트 메시지 */}
      {toastMessage && (
        <div className="absolute -top-10 right-0 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap animate-fade-in">
          {toastMessage}
        </div>
      )}

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
          'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border font-medium shadow-sm',
          'transition-colors',
          isDisabled || excelLoading
            ? 'opacity-40 cursor-not-allowed bg-emerald-600 border-emerald-600 text-white'
            : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 cursor-pointer',
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
          'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border font-medium shadow-sm',
          'transition-colors',
          isDisabled || pdfLoading
            ? 'opacity-40 cursor-not-allowed bg-red border-red text-white'
            : 'bg-red border-red text-white hover:brightness-90 cursor-pointer',
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
