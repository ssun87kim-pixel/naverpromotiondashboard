// Feature: promo-performance-dashboard, Property 21: 코멘트 저장 Round-Trip
import { describe, it, beforeEach, expect } from 'vitest';
import * as fc from 'fast-check';
import { LocalStorageCommentRepository } from '../LocalStorageCommentRepository';
import type { Comment, Reply } from '../../types/index';

const arbitraryReply = (): fc.Arbitrary<Reply> =>
  fc.record({
    id: fc.uuid(),
    authorName: fc.string({ minLength: 1, maxLength: 30 }),
    content: fc.string({ minLength: 1, maxLength: 200 }),
    createdAt: fc.constant(new Date('2024-01-01').toISOString()),
  });

const arbitraryComment = (): fc.Arbitrary<Comment> =>
  fc.record({
    id: fc.uuid(),
    promotionId: fc.uuid(),
    authorName: fc.string({ minLength: 1, maxLength: 30 }),
    content: fc.string({ minLength: 1, maxLength: 500 }),
    createdAt: fc.constant(new Date('2024-01-01').toISOString()),
    replies: fc.array(arbitraryReply(), { maxLength: 3 }),
  });

describe('LocalStorageCommentRepository — Round-Trip (Property 21)', () => {
  let repo: LocalStorageCommentRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStorageCommentRepository();
  });

  it('Validates: Requirements 8.5, 8.7 — save 후 findAll에서 동일 authorName/content/createdAt 반환', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryComment(), async (comment) => {
        localStorage.clear();
        await repo.save(comment);
        const all = await repo.findAll();
        const found = all.find((c) => c.id === comment.id);
        expect(found).toBeDefined();
        expect(found?.authorName).toBe(comment.authorName);
        expect(found?.content).toBe(comment.content);
        expect(found?.createdAt).toBe(comment.createdAt);
      }),
      { numRuns: 100 }
    );
  });

  it('Validates: Requirements 8.7 — 브라우저 재시작 시뮬레이션: 새 인스턴스에서도 동일 값 반환', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryComment(), async (comment) => {
        localStorage.clear();
        await repo.save(comment);
        // 새 인스턴스 생성 (브라우저 재시작 시뮬레이션)
        const newRepo = new LocalStorageCommentRepository();
        const all = await newRepo.findAll();
        const found = all.find((c) => c.id === comment.id);
        expect(found?.authorName).toBe(comment.authorName);
        expect(found?.content).toBe(comment.content);
        expect(found?.createdAt).toBe(comment.createdAt);
      }),
      { numRuns: 100 }
    );
  });

  it('addReply — 특정 commentId에 reply 추가 후 findAll에서 확인', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryComment(),
        arbitraryReply(),
        async (comment, reply) => {
          localStorage.clear();
          // replies 없는 상태로 저장
          const base: Comment = { ...comment, replies: [] };
          await repo.save(base);
          await repo.addReply(comment.id, reply);
          const all = await repo.findAll();
          const found = all.find((c) => c.id === comment.id);
          expect(found?.replies).toHaveLength(1);
          expect(found?.replies[0]).toEqual(reply);
        }
      ),
      { numRuns: 100 }
    );
  });
});
