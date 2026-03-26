import type { Comment, Reply } from '../types/index';

export interface ICommentRepository {
  save(comment: Comment): Promise<void>;
  findAll(): Promise<Comment[]>;
  addReply(commentId: string, reply: Reply): Promise<void>;
}
