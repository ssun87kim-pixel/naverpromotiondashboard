import type { Comment, Reply } from '../types/index';
import type { ICommentRepository } from './ICommentRepository';

const STORAGE_KEY = 'promo-dashboard:comments';

export class LocalStorageCommentRepository implements ICommentRepository {
  private load(): Comment[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Comment[]) : [];
    } catch {
      return [];
    }
  }

  private persist(comments: Comment[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  }

  async save(comment: Comment): Promise<void> {
    const comments = this.load();
    const idx = comments.findIndex((c) => c.id === comment.id);
    if (idx >= 0) {
      comments[idx] = comment;
    } else {
      comments.push(comment);
    }
    this.persist(comments);
  }

  async findAll(): Promise<Comment[]> {
    return this.load();
  }

  async addReply(commentId: string, reply: Reply): Promise<void> {
    const comments = this.load();
    const comment = comments.find((c) => c.id === commentId);
    if (comment) {
      comment.replies.push(reply);
      this.persist(comments);
    }
  }
}
