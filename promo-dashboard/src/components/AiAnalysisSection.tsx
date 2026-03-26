import React from 'react';

interface AiAnalysisSectionProps {
  planningIntent?: string;
}

const AiAnalysisSection: React.FC<AiAnalysisSectionProps> = ({ planningIntent }) => {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-gray-900">
        AI 분석 — 기획의도/주요혜택 vs 결과
      </h2>

      {planningIntent && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <p className="text-xs font-medium text-gray-500 mb-1">기획의도/주요혜택</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{planningIntent}</p>
        </div>
      )}

      {/* Placeholder */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-10 flex flex-col items-center gap-3 text-center">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-500">
          AI 분석 준비 중입니다. DB 연동 및 AI API 설정 후 활성화됩니다.
        </p>
        <p className="text-xs text-gray-400">
          기획의도/주요혜택 대비 성과 평가, 주요 지표 브리핑, Next Action 제언이 여기에 표시됩니다.
        </p>
      </div>
    </section>
  );
};

export default AiAnalysisSection;
