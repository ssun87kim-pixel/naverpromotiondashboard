import React from 'react';
import { useCommentStore } from '../stores/commentStore';

const Header: React.FC = () => {
  const comments = useCommentStore((s) => s.comments);
  const togglePanel = useCommentStore((s) => s.togglePanel);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <h1 className="text-xl font-bold text-gray-900">네이버 프로모션성과 대시보드 (DB 연동 전 버전, 모든 사업부 사용 가능)</h1>

      <button
        type="button"
        onClick={togglePanel}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-50 transition-colors"
        aria-label="코멘트 패널 열기"
      >
        {/* 말풍선 아이콘 */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-700"
        >
          <path
            d="M2 4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 4V4z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>

        {/* 뱃지 */}
        {comments.length > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-blue text-white text-[10px] font-bold leading-none"
            data-testid="comment-badge"
          >
            {comments.length}
          </span>
        )}
      </button>
    </header>
  );
};

export default Header;
