import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DownloadButtons from '../DownloadButtons';
import type { ReportData } from '../../services/ReportService';

// ============================================================
// ReportService 모킹
// ============================================================

vi.mock('../../services/ReportService', () => ({
  exportExcel: vi.fn(),
  exportPdf: vi.fn(),
}));

import { exportExcel, exportPdf } from '../../services/ReportService';

// ============================================================
// 테스트 픽스처
// ============================================================

const mockReportData: ReportData = {
  context: {
    id: 'test-1',
    eventName: '테스트 행사',
    channel: '네이버',
    startDate: '2026-03-10',
    endDate: '2026-03-23',
    liveDates: ['2026-03-11'],
    targetAmount: 10000000,
    promotionType: '타임특가',
    planningIntent: '신규 유입 증대',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  kpis: {
    netSales: 8500000,
    achievementRate: 85,
    paymentAmount: 9000000,
    paymentCount: 300,
    couponTotal: 500000,
    refundAmount: 500000,
    refundRate: 5.0,
  },
  timeSeries: [
    {
      date: '2026-03-10',
      dayOfWeek: '화',
      paymentAmount: 3000000,
      refundAmount: 100000,
      netSales: 2900000,
      couponTotal: 150000,
      isLiveDate: false,
      isPeak: false,
    },
  ],
  productRows: [
    {
      division: '가구',
      largeCat: '의자',
      productName: '테스트 의자',
      productId: 'P001',
      qty: 50,
      qtyShare: 100,
      netAmount: 2900000,
      amountShare: 100,
      refundCount: 2,
      refundRate: 4.0,
      isHighRefund: false,
      isUnmatched: false,
    },
  ],
};

// ============================================================
// 테스트
// ============================================================

describe('DownloadButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reportData가 null이면 두 버튼 모두 비활성화', () => {
    render(<DownloadButtons reportData={null} dashboardElementId="dashboard" />);

    const excelBtn = screen.getByRole('button', { name: /엑셀/i });
    const pdfBtn = screen.getByRole('button', { name: /PDF/i });

    expect(excelBtn).toBeDisabled();
    expect(pdfBtn).toBeDisabled();
  });

  it('reportData가 있으면 두 버튼 모두 활성화', () => {
    render(<DownloadButtons reportData={mockReportData} dashboardElementId="dashboard" />);

    const excelBtn = screen.getByRole('button', { name: /엑셀/i });
    const pdfBtn = screen.getByRole('button', { name: /PDF/i });

    expect(excelBtn).not.toBeDisabled();
    expect(pdfBtn).not.toBeDisabled();
  });

  it('엑셀 버튼 클릭 시 exportExcel 호출', async () => {
    vi.mocked(exportExcel).mockResolvedValue(undefined);

    render(<DownloadButtons reportData={mockReportData} dashboardElementId="dashboard" />);

    const excelBtn = screen.getByRole('button', { name: /엑셀/i });
    fireEvent.click(excelBtn);

    await waitFor(() => {
      expect(exportExcel).toHaveBeenCalledWith(mockReportData);
    });
  });

  it('PDF 버튼 클릭 시 exportPdf 호출', async () => {
    vi.mocked(exportPdf).mockResolvedValue(undefined);

    render(<DownloadButtons reportData={mockReportData} dashboardElementId="dashboard" />);

    const pdfBtn = screen.getByRole('button', { name: /PDF/i });
    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(exportPdf).toHaveBeenCalledWith('dashboard', expect.stringContaining('테스트 행사'));
    });
  });

  it('exportExcel 실패 시 오류 메시지 표시', async () => {
    vi.mocked(exportExcel).mockRejectedValue(new Error('파일 생성에 실패했습니다. 다시 시도해주세요.'));

    render(<DownloadButtons reportData={mockReportData} dashboardElementId="dashboard" />);

    const excelBtn = screen.getByRole('button', { name: /엑셀/i });
    fireEvent.click(excelBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('파일 생성에 실패했습니다. 다시 시도해주세요.');
    });
  });

  it('exportPdf 실패 시 오류 메시지 표시', async () => {
    vi.mocked(exportPdf).mockRejectedValue(new Error('파일 생성에 실패했습니다. 다시 시도해주세요.'));

    render(<DownloadButtons reportData={mockReportData} dashboardElementId="dashboard" />);

    const pdfBtn = screen.getByRole('button', { name: /PDF/i });
    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('파일 생성에 실패했습니다. 다시 시도해주세요.');
    });
  });
});
