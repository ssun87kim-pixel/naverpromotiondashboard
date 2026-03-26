import type { PromotionRecord } from '../types/index';
import type { IPromotionRepository } from './IPromotionRepository';

const STORAGE_KEY = 'promo-dashboard:promotions';

export class LocalStoragePromotionRepository implements IPromotionRepository {
  private load(): PromotionRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PromotionRecord[]) : [];
    } catch {
      return [];
    }
  }

  private persist(records: PromotionRecord[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  async save(promotion: PromotionRecord): Promise<void> {
    const records = this.load();
    const idx = records.findIndex((r) => r.id === promotion.id);
    if (idx >= 0) {
      records[idx] = promotion;
    } else {
      records.push(promotion);
    }
    this.persist(records);
  }

  async findById(id: string): Promise<PromotionRecord | null> {
    const records = this.load();
    return records.find((r) => r.id === id) ?? null;
  }

  async findAll(): Promise<PromotionRecord[]> {
    return this.load();
  }
}
