import React, { useState, useEffect } from 'react';
import { useCommentStore } from '../stores/commentStore';
import CommentItem from './CommentItem';

interface CommentSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const CommentSidePanel: React.FC<CommentSidePanelProps> = ({ isOpen, onClose }) => {
  const comments = useCommentStore((s) => s.comments);
  const loadComments = useCommentStore((s) => s.loadComments);
  const addComment = useCommentStore((s) => s.addComment);
  const addReply = useCommentStore((s) => s.addReply);

  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async () => {
    if (!name.trim() || !content.trim()) {
      setError('이름과 내용을 모두 입력해주세요');
      return;
    }
    setError('');
    try {
      await addComment(name.trim(), content.trim());
      setName('');
      setContent('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '등록에 실패했습니다');
    }
  };

  const handleAddReply = async (
    commentId: string,
    replyName: string,
    replyContent: string
  ) => {
    await addReply(commentId, replyName, replyContent);
  };

  return (
    <>
      {/* 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* 사이드 패널 */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">
            코멘트 ({comments.length})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="닫기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 입력 폼 */}
        <div className="flex flex-col gap-2 px-4 py-3 border-b border-gray-100">
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue"
          />
          <textarea
            placeholder="코멘트를 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue"
          />
          {error && (
            <p className="text-xs text-red" role="alert">
              {error}
            </p>
          )}
          <button
            onClick={handleSubmit}
            className="w-full py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors"
          >
            등록
          </button>
        </div>

        {/* 코멘트 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              아직 코멘트가 없습니다
            </p>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onAddReply={handleAddReply}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default CommentSidePanel;
