import { create } from 'zustand';
import { LocalStorageCommentRepository } from '../repositories/LocalStorageCommentRepository';
import type { Comment, Reply } from '../types/index';

// ============================================================
// 타입 정의
// ============================================================

interface CommentStore {
  comments: Comment[];
  isOpen: boolean;

  // Actions
  loadComments: () => Promise<void>;
  addComment: (authorName: string, content: string) => Promise<void>;
  addReply: (
    commentId: string,
    authorName: string,
    content: string
  ) => Promise<void>;
  togglePanel: () => void;
}

// ============================================================
// Repository 인스턴스 (싱글턴)
// ============================================================

const repo = new LocalStorageCommentRepository();

// ============================================================
// ID 생성 헬퍼
// ============================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================
// Zustand 스토어
// ============================================================

export const useCommentStore = create<CommentStore>((set) => ({
  comments: [],
  isOpen: false,

  loadComments: async () => {
    const comments = await repo.findAll();
    set({ comments });
  },

  addComment: async (authorName, content) => {
    const trimmedName = authorName.trim();
    const trimmedContent = content.trim();

    if (!trimmedName || !trimmedContent) {
      throw new Error('이름과 내용을 모두 입력해주세요');
    }

    const comment: Comment = {
      id: generateId(),
      promotionId: '',
      authorName: trimmedName,
      content: trimmedContent,
      createdAt: new Date().toISOString(),
      replies: [],
    };

    await repo.save(comment);
    const comments = await repo.findAll();
    set({ comments });
  },

  addReply: async (commentId, authorName, content) => {
    const trimmedName = authorName.trim();
    const trimmedContent = content.trim();

    if (!trimmedName || !trimmedContent) {
      throw new Error('이름과 내용을 모두 입력해주세요');
    }

    const reply: Reply = {
      id: generateId(),
      authorName: trimmedName,
      content: trimmedContent,
      createdAt: new Date().toISOString(),
    };

    await repo.addReply(commentId, reply);
    const comments = await repo.findAll();
    set({ comments });
  },

  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
}));
