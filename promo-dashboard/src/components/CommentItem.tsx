import React, { useState } from 'react';
import type { Comment } from '../types/index';

interface CommentItemProps {
  comment: Comment;
  onAddReply: (commentId: string, name: string, content: string) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onAddReply }) => {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyName, setReplyName] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyError, setReplyError] = useState('');

  const handleReplySubmit = () => {
    if (!replyName.trim() || !replyContent.trim()) {
      setReplyError('이름과 내용을 모두 입력해주세요');
      return;
    }
    setReplyError('');
    onAddReply(comment.id, replyName.trim(), replyContent.trim());
    setReplyName('');
    setReplyContent('');
    setReplyOpen(false);
  };

  return (
    <div className="flex flex-col gap-2 py-3 border-b border-gray-100 last:border-b-0">
      {/* 코멘트 헤더 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">{comment.authorName}</span>
        <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
      </div>

      {/* 코멘트 내용 */}
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>

      {/* 답글 버튼 */}
      <button
        onClick={() => setReplyOpen((v) => !v)}
        className="self-start text-xs text-blue hover:underline"
      >
        {replyOpen ? '취소' : '답글'}
      </button>

      {/* 답글 입력 폼 */}
      {replyOpen && (
        <div className="ml-4 flex flex-col gap-2 bg-gray-50 rounded-lg p-3">
          <input
            type="text"
            placeholder="이름"
            value={replyName}
            onChange={(e) => setReplyName(e.target.value)}
            className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue"
          />
          <textarea
            placeholder="답글 내용"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={2}
            className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm resize-none focus:outline-none focus:border-blue"
          />
          {replyError && (
            <p className="text-xs text-red">{replyError}</p>
          )}
          <button
            onClick={handleReplySubmit}
            className="self-end px-3 py-1 bg-gray-900 text-white text-xs rounded hover:bg-gray-700 transition-colors"
          >
            등록
          </button>
        </div>
      )}

      {/* 리플 목록 */}
      {comment.replies.length > 0 && (
        <div className="ml-4 flex flex-col gap-2">
          {comment.replies.map((reply) => (
            <div
              key={reply.id}
              className="flex flex-col gap-1 bg-gray-50 rounded-lg px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">{reply.authorName}</span>
                <span className="text-xs text-gray-400">{formatDate(reply.createdAt)}</span>
              </div>
              <p className="text-xs text-gray-600 whitespace-pre-wrap">{reply.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
