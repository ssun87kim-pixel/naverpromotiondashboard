import { useState, useEffect, useRef } from 'react';
import { usePromotionStore } from './stores/promotionStore';
import { useCommentStore } from './stores/commentStore';
import Header from './components/Header';
import PromotionContextForm, { type PromotionContextFormRef } from './components/PromotionContextForm';
import FileUploadPanel from './components/FileUploadPanel';
import CompareEventUpload from './components/CompareEventUpload';
import KpiCardGrid from './components/KpiCardGrid';
import TimeSeriesSection from './components/TimeSeriesSection';
import ComparisonSection from './components/ComparisonSection';
import ProductSection from './components/ProductSection';
import AiAnalysisSection from './components/AiAnalysisSection';
import CommentSidePanel from './components/CommentSidePanel';
import ErrorBoundary from './components/ErrorBoundary';
import DownloadButtons from './components/DownloadButtons';
import type { PromotionRecord } from './types/index';
import type { ReportData } from './services/ReportService';

function App() {
  const {
    kpis,
    inputPanelOpen,
    context,
    compareContexts,
    timeSeries,
    productRows,
    parsedData,
    compareKpis,
    compareTimeSeries,
    setContext,
    setCompareFile,
    setCompareContext,
    removeCompare,
    analyze,
    toggleInputPanel,
  } = usePromotionStore();

  const hasSales = !!parsedData.current?.sales;
  const hasProducts = !!parsedData.current?.products;

  const { isOpen: commentOpen, togglePanel: toggleComment } = useCommentStore();

  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<{ sales?: File; products?: File; category?: File }>({});
  const [compareSlots, setCompareSlots] = useState(0); // 0: 비교 행사 없음, 1: 1개, 2: 2개

  const hasResult = !!kpis;
  const dashboardRef = useRef<HTMLElement>(null);
  const formRef = useRef<PromotionContextFormRef>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ESC 키로 분석 중단
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 분석 완료 시 자동 스크롤
  useEffect(() => {
    if (kpis && dashboardRef.current) {
      dashboardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [kpis]);

  const runAnalyze = async (files: { sales?: File; products?: File; category?: File }) => {
    setAnalyzeError(null);
    setIsAnalyzing(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await analyze(files, controller.signal);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        // ESC로 취소 — 에러 표시하지 않음
      } else {
        setAnalyzeError(e instanceof Error ? e.message : '분석 중 오류가 발생했습니다');
      }
    } finally {
      abortRef.current = null;
      setIsAnalyzing(false);
    }
  };

  const canAnalyze = !!currentFiles.sales || !!currentFiles.products;

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    // 분석 시작 시 항상 최신 폼 값을 저장
    const saved = formRef.current?.saveAndGet();
    if (!saved) return; // 필수 항목 미입력 시 분석 차단
    await runAnalyze(currentFiles);
  };


  const handleContextSubmit = (ctx: PromotionRecord) => {
    setContext(ctx);
  };

  const handleCloseCompare = (index: number) => {
    removeCompare(index);
  };

  const compareProductRowsStore = usePromotionStore((s) => s.compareProductRows);

  const reportData: ReportData | null =
    kpis && context
      ? {
          context, kpis, timeSeries, productRows,
          compareEvents: compareKpis
            .map((ck, i) => ck ? {
              context: compareContexts[i],
              kpis: ck,
              timeSeries: compareTimeSeries[i] ?? [],
              productRows: compareProductRowsStore[i] ?? [],
            } : null)
            .filter((e): e is NonNullable<typeof e> => e !== null),
        }
      : null;

  return (
    <div id="dashboard-root" className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <Header />

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-4">

        {/* 단계 안내 (분석 전) */}
        {!hasResult && (
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-4 py-3">
            <span className="font-medium text-blue">① 행사 정보 입력</span>
            <span className="text-gray-300">→</span>
            <span className="font-medium text-gray-600">② 파일 업로드</span>
            <span className="text-gray-300">→</span>
            <span className="font-medium text-gray-400">③ 분석 결과 확인</span>
          </div>
        )}

        {/* 입력 패널 (접기/펼치기) */}
        <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* 패널 헤더 */}
          <button
            type="button"
            onClick={toggleInputPanel}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            aria-expanded={inputPanelOpen}
          >
            <span>입력 정보</span>
            <span className="text-gray-400 text-xs">{inputPanelOpen ? '▲' : '▼'}</span>
          </button>

          {inputPanelOpen && (
            <div className="border-t border-gray-100 px-4 py-5 space-y-6">
              {/* ① 행사 정보 입력 */}
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">
                  <span className="text-blue mr-1">①</span>행사 정보 입력
                </h2>
                <PromotionContextForm ref={formRef} onSubmit={handleContextSubmit} />
              </div>

              {/* ② 파일 업로드 */}
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">
                  <span className="text-blue mr-1">②</span>파일 업로드
                </h2>
                <FileUploadPanel onFilesChange={setCurrentFiles} />
              </div>

              {/* 비교 행사 업로드 (선택) */}
              <div className="space-y-3">
                {compareSlots >= 1 && (
                  <CompareEventUpload
                    index={0}
                    onFilesChange={(files) => {
                      if (files.sales) setCompareFile(0, 'sales', files.sales);
                      if (files.products) setCompareFile(0, 'products', files.products);
                      if (files.category) setCompareFile(0, 'category', files.category);
                    }}
                    onContextChange={(ctx) => {
                      setCompareContext(0, ctx);
                    }}
                  />
                )}
                {compareSlots < 1 && (
                  <button
                    type="button"
                    onClick={() => setCompareSlots(1)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <span className="text-lg leading-none">+</span>
                    <span>비교 행사 추가</span>
                  </button>
                )}
              </div>

              {/* 분석 시작 버튼 */}
              {analyzeError && (
                <p className="text-sm text-red" role="alert">{analyzeError}</p>
              )}
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!canAnalyze || isAnalyzing}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity ${
                  canAnalyze && !isAnalyzing
                    ? 'bg-blue text-white hover:opacity-90'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                data-testid="analyze-btn"
              >
                {isAnalyzing ? '분석 중...' : '분석 시작'}
              </button>
              {isAnalyzing && (
                <p className="text-xs text-gray-400 text-center">
                  ESC 키를 눌러 분석을 중단할 수 있습니다
                </p>
              )}
            </div>
          )}
        </section>

        {/* ③ 분석 결과 */}
        {kpis && (
          <section id="dashboard-content" ref={dashboardRef} className="space-y-4">
            {/* 다운로드 버튼 */}
            <div className="flex justify-end">
              <DownloadButtons
                reportData={reportData}
                dashboardElementId="dashboard-content"
              />
            </div>

            <ErrorBoundary>
              <KpiCardGrid
                kpis={kpis}
                targetAmount={context?.targetAmount ?? 0}
                hasSales={hasSales}
                hasProducts={hasProducts}
                context={context}
                timeSeries={timeSeries}
              />
            </ErrorBoundary>

            <ErrorBoundary>
              <TimeSeriesSection />
            </ErrorBoundary>

            <ErrorBoundary>
              <ComparisonSection
                currentKpis={kpis}
                currentParsed={{ hasSales, hasProducts }}
                currentContext={context}
                currentTimeSeries={timeSeries}
                compareKpis={compareKpis}
                compareParsed={parsedData.compare.map((p) => ({
                  hasSales: !!p.sales,
                  hasProducts: !!p.products,
                }))}
                compareTimeSeries={compareTimeSeries}
                compareContexts={compareContexts}
                onClose={handleCloseCompare}
                onUpload={() => {
                  if (!inputPanelOpen) toggleInputPanel();
                }}
              />
            </ErrorBoundary>

            <ErrorBoundary>
              <ProductSection />
            </ErrorBoundary>

            <ErrorBoundary>
              <AiAnalysisSection />
            </ErrorBoundary>
          </section>
        )}
      </main>

      {/* 코멘트 사이드 패널 */}
      <CommentSidePanel isOpen={commentOpen} onClose={toggleComment} />

      {/* 푸터 */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-screen-xl mx-auto px-4 py-4 text-center text-xs text-gray-400">
          제작 및 수정 문의: DESKER 김선영 (현재버전명: v2.1-compare-side-by-side)
        </div>
      </footer>
    </div>
  );
}

export default App;
