import * as XLSX from 'xlsx';
import type { PromotionRecord, KpiSummary, DailyTimeSeries, ProductRow } from '../types/index';
import { countDays } from '../utils/format';

// ============================================================
// 타입 정의
// ============================================================

export interface EventData {
  context: PromotionRecord;
  kpis: KpiSummary;
  timeSeries: DailyTimeSeries[];
  productRows: ProductRow[];
}

export interface ReportData {
  context: PromotionRecord;
  kpis: KpiSummary;
  timeSeries: DailyTimeSeries[];
  productRows: ProductRow[];
  compareEvents?: EventData[];
}

// ============================================================
// 헬퍼 함수
// ============================================================

function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/** 지정 컬럼·행 범위에 엑셀 셀 서식(z 속성)을 일괄 적용 */
function applyNumberFormat(
  ws: XLSX.WorkSheet,
  col: number,
  startRow: number,
  endRow: number,
  fmt: string,
): void {
  for (let r = startRow; r <= endRow; r++) {
    const addr = XLSX.utils.encode_cell({ r, c: col });
    if (ws[addr] && ws[addr].t === 'n') {
      ws[addr].z = fmt;
    }
  }
}

// ============================================================
// 엑셀 다운로드
// ============================================================

/** 시트 이름을 31자 이내로 자르고 금지 문자 제거 */
function safeSheetName(name: string): string {
  return name.replace(/[\\/*?[\]:]/g, '').slice(0, 31);
}

/** 한 행사분의 시트 4개를 workbook에 추가 */
function addEventSheets(
  wb: XLSX.WorkBook,
  prefix: string,
  event: EventData,
): void {
  const ctx = event.context;
  const kpis = event.kpis;

  // ── 컨텍스트 시트 ──
  const sheet1Data = [
    ['항목', '내용'],
    ['행사명', ctx.eventName],
    ['기간', `${ctx.startDate} ~ ${ctx.endDate}`],
    ['기획의도', ctx.planningIntent],
    ['매출목표', ctx.targetAmount],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  applyNumberFormat(ws1, 1, 4, 4, '#,##0');
  ws1['!cols'] = [{ wch: 16 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws1, safeSheetName(`${prefix}_컨텍스트`));

  // ── KPI 시트 ──
  const eventDays = countDays(ctx.startDate, ctx.endDate);
  const dailyAvgNetSales = Math.round(kpis.netSales / eventDays);

  const liveDays = event.timeSeries.filter((d) => d.isLiveDate);
  const liveDayRows: (string | number)[][] = [];
  if (liveDays.length === 1) {
    liveDayRows.push(['라이브 순매출', liveDays[0].netSales]);
  } else if (liveDays.length >= 2) {
    const liveTotal = liveDays.reduce((sum, d) => sum + d.netSales, 0);
    liveDayRows.push(['라이브 합계', liveTotal]);
    liveDays.forEach((d, i) => {
      liveDayRows.push([`라이브 ${i + 1}일차 (${d.date.slice(5)})`, d.netSales]);
    });
  }

  const sheet2Data: (string | number | null)[][] = [
    ['레이블', '값'],
    ['최종결제액(Net Sales)', kpis.netSales],
    ['달성률', kpis.achievementRate !== null ? kpis.achievementRate / 100 : null],
    ['결제금액', kpis.paymentAmount],
    ['결제수', kpis.paymentCount],
    ['객단가', kpis.avgOrderValue],
    ['쿠폰합계', kpis.couponTotal],
    ['환불액', kpis.refundAmount],
    ['환불율', kpis.refundRate / 100],
    ['일평균 순매출', dailyAvgNetSales],
    ...liveDayRows,
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  const sheet2LastRow = sheet2Data.length - 1;
  for (const r of [1, 3, 4, 5, 6, 7]) {
    applyNumberFormat(ws2, 1, r, r, '#,##0');
  }
  for (let r = 9; r <= sheet2LastRow; r++) {
    applyNumberFormat(ws2, 1, r, r, '#,##0');
  }
  for (const r of [2, 8]) {
    applyNumberFormat(ws2, 1, r, r, '0.0%');
  }
  ws2['!cols'] = [{ wch: 24 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws2, safeSheetName(`${prefix}_KPI`));

  // ── 일별 판매성과 시트 ──
  if (event.timeSeries.length > 0) {
    const sheet3Header = ['날짜', '요일', '결제금액', '환불금액', '최종결제액', '쿠폰합계'];
    const sheet3Rows = event.timeSeries.map((row) => [
      row.date, row.dayOfWeek,
      row.paymentAmount, row.refundAmount, row.netSales, row.couponTotal,
    ]);
    const ws3 = XLSX.utils.aoa_to_sheet([sheet3Header, ...sheet3Rows]);
    const sheet3LastRow = event.timeSeries.length;
    for (const c of [2, 3, 4, 5]) {
      applyNumberFormat(ws3, c, 1, sheet3LastRow, '#,##0');
    }
    ws3['!cols'] = [
      { wch: 14 }, { wch: 6 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, ws3, safeSheetName(`${prefix}_일별`));
  }

  // ── 상품별 성과 시트 ──
  if (event.productRows.length > 0) {
    const sheet4Header = [
      '구분', '대분류', '상품명',
      '판매수량', '수량비중',
      '결제금액', '금액비중',
      '환불율',
    ];
    const sheet4Rows = event.productRows.map((row) => [
      row.division, row.largeCat, row.productName,
      row.qty, row.qtyShare / 100,
      row.netAmount, row.amountShare / 100,
      row.refundRate / 100,
    ]);
    const ws4 = XLSX.utils.aoa_to_sheet([sheet4Header, ...sheet4Rows]);
    const sheet4LastRow = event.productRows.length;
    for (const c of [3, 5]) {
      applyNumberFormat(ws4, c, 1, sheet4LastRow, '#,##0');
    }
    for (const c of [4, 6, 7]) {
      applyNumberFormat(ws4, c, 1, sheet4LastRow, '0.0%');
    }
    ws4['!cols'] = [
      { wch: 12 }, { wch: 14 }, { wch: 30 },
      { wch: 10 }, { wch: 12 },
      { wch: 16 }, { wch: 12 },
      { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, ws4, safeSheetName(`${prefix}_상품`));
  }
}

export async function exportExcel(data: ReportData): Promise<void> {
  try {
    const wb = XLSX.utils.book_new();

    // 이번 행사 시트
    addEventSheets(wb, data.context.eventName, {
      context: data.context,
      kpis: data.kpis,
      timeSeries: data.timeSeries,
      productRows: data.productRows,
    });

    // 비교 행사 시트
    if (data.compareEvents) {
      for (const compareEvent of data.compareEvents) {
        addEventSheets(wb, compareEvent.context.eventName, compareEvent);
      }
    }

    // ── 파일 저장 ──────────────────────────────────────────
    const filename = `${data.context.eventName}_성과분석_${getTodayStr()}.xlsx`;
    XLSX.writeFile(wb, filename);
  } catch {
    throw new Error('파일 생성에 실패했습니다. 다시 시도해주세요.');
  }
}

// ============================================================
// PDF 다운로드
// ============================================================

export async function exportPdf(elementId: string, filename: string): Promise<void> {
  try {
    // 동적 import (번들 크기 최적화)
    const [html2canvasModule, jsPDFModule] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);
    const html2canvas = html2canvasModule.default;
    const { jsPDF } = jsPDFModule;

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`요소를 찾을 수 없습니다: #${elementId}`);
    }

    // A4 기준 (mm)
    const A4_WIDTH_MM = 210;
    const A4_HEIGHT_MM = 297;
    const MARGIN_MM = 10;
    const CONTENT_WIDTH_MM = A4_WIDTH_MM - MARGIN_MM * 2;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // 섹션별로 페이지 경계 처리
    const sections = element.querySelectorAll<HTMLElement>('[data-pdf-section]');
    const targets: HTMLElement[] = sections.length > 0
      ? Array.from(sections)
      : [element];

    let currentY = MARGIN_MM;

    for (const section of targets) {
      const canvas = await html2canvas(section, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;

      // 비율 유지하며 mm 변환
      const imgHeightMM = (imgHeightPx / imgWidthPx) * CONTENT_WIDTH_MM;

      // 섹션이 현재 페이지에 들어가지 않으면 새 페이지
      if (currentY + imgHeightMM > A4_HEIGHT_MM - MARGIN_MM && currentY > MARGIN_MM) {
        pdf.addPage();
        currentY = MARGIN_MM;
      }

      // 섹션 자체가 한 페이지보다 크면 여러 페이지에 걸쳐 출력
      if (imgHeightMM <= A4_HEIGHT_MM - MARGIN_MM * 2) {
        pdf.addImage(imgData, 'PNG', MARGIN_MM, currentY, CONTENT_WIDTH_MM, imgHeightMM);
        currentY += imgHeightMM + 4; // 섹션 간 여백 4mm
      } else {
        // 긴 섹션: 페이지 단위로 잘라서 출력
        const pageContentHeightMM = A4_HEIGHT_MM - MARGIN_MM * 2;
        const pageContentHeightPx = (pageContentHeightMM / CONTENT_WIDTH_MM) * imgWidthPx;
        let sliceY = 0;

        while (sliceY < imgHeightPx) {
          const sliceHeightPx = Math.min(pageContentHeightPx, imgHeightPx - sliceY);
          const sliceHeightMM = (sliceHeightPx / imgWidthPx) * CONTENT_WIDTH_MM;

          // 슬라이스 캔버스 생성
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = imgWidthPx;
          sliceCanvas.height = sliceHeightPx;
          const ctx = sliceCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(canvas, 0, sliceY, imgWidthPx, sliceHeightPx, 0, 0, imgWidthPx, sliceHeightPx);
          }
          const sliceData = sliceCanvas.toDataURL('image/png');

          if (sliceY > 0) {
            pdf.addPage();
            currentY = MARGIN_MM;
          }

          pdf.addImage(sliceData, 'PNG', MARGIN_MM, currentY, CONTENT_WIDTH_MM, sliceHeightMM);
          currentY += sliceHeightMM;
          sliceY += sliceHeightPx;
        }
        currentY += 4;
      }
    }

    pdf.save(filename);
  } catch (err) {
    if (err instanceof Error && err.message.includes('파일 생성에 실패')) {
      throw err;
    }
    throw new Error('파일 생성에 실패했습니다. 다시 시도해주세요.');
  }
}
