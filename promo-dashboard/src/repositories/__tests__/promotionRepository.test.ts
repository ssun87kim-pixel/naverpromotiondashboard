// Feature: promo-performance-dashboard, Property 4: 컨텍스트 저장 Round-Trip
import { describe, it, beforeEach, expect } from 'vitest';
import * as fc from 'fast-check';
import { LocalStoragePromotionRepository } from '../LocalStoragePromotionRepository';
import type { PromotionRecord } from '../../types/index';

const arbitraryPromotion = (): fc.Arbitrary<PromotionRecord> =>
  fc.record({
    id: fc.uuid(),
    eventName: fc.string({ minLength: 1, maxLength: 50 }),
    channel: fc.string({ minLength: 1, maxLength: 30 }),
    startDate: fc.constant('2024-01-01'),
    endDate: fc.constant('2024-01-31'),
    liveDates: fc.array(fc.constant('2024-01-15'), { maxLength: 5 }),
    targetAmount: fc.integer({ min: 0, max: 100_000_000 }),
    promotionType: fc.constantFrom('타임특가', '쿠폰', '번들', '기타'),
    planningIntent: fc.string({ maxLength: 200 }),
    createdAt: fc.constant(new Date('2024-01-01').toISOString()),
    updatedAt: fc.constant(new Date('2024-01-01').toISOString()),
  });

describe('LocalStoragePromotionRepository — Round-Trip (Property 4)', () => {
  let repo: LocalStoragePromotionRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStoragePromotionRepository();
  });

  it('Validates: Requirements 1.7 — save 후 findById로 동일 값 반환', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryPromotion(), async (promotion) => {
        localStorage.clear();
        await repo.save(promotion);
        const found = await repo.findById(promotion.id);
        expect(found).not.toBeNull();
        expect(found).toEqual(promotion);
      }),
      { numRuns: 100 }
    );
  });

  it('Validates: Requirements 1.7 — save 후 findAll에 포함됨', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryPromotion(), async (promotion) => {
        localStorage.clear();
        await repo.save(promotion);
        const all = await repo.findAll();
        expect(all.some((r) => r.id === promotion.id)).toBe(true);
        const found = all.find((r) => r.id === promotion.id);
        expect(found).toEqual(promotion);
      }),
      { numRuns: 100 }
    );
  });

  it('동일 id로 save 시 업데이트(upsert) 동작', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryPromotion(),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (promotion, newName) => {
          localStorage.clear();
          await repo.save(promotion);
          const updated: PromotionRecord = { ...promotion, eventName: newName };
          await repo.save(updated);
          const all = await repo.findAll();
          expect(all.filter((r) => r.id === promotion.id)).toHaveLength(1);
          const found = await repo.findById(promotion.id);
          expect(found?.eventName).toBe(newName);
        }
      ),
      { numRuns: 100 }
    );
  });
});
