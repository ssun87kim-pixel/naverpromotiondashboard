import type { PromotionRecord } from '../types/index';

export interface IPromotionRepository {
  save(promotion: PromotionRecord): Promise<void>;
  findById(id: string): Promise<PromotionRecord | null>;
  findAll(): Promise<PromotionRecord[]>;
}
