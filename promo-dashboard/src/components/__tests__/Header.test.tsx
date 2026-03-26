import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import Header from '../Header';
import { useCommentStore } from '../../stores/commentStore';

// commentStore를 모킹하여 임의 코멘트 수를 주입
vi.mock('../../stores/commentStore');

const mockUseCommentStore = vi.mocked(useCommentStore);

function setupStore(commentCount: number) {
  const comments = Array.from({ length: commentCount }, (_, i) => ({
    id: `${i}`,
    promotionId: '',
    authorName: `user${i}`,
    content: `comment ${i}`,
    createdAt: new Date().toISOString(),
    replies: [],
  }));

  mockUseCommentStore.mockImplementation((selector: (s: unknown) => unknown) => {
    const state = { comments, togglePanel: vi.fn() };
    return selector(state);
  });
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('코멘트가 없을 때 뱃지를 표시하지 않는다', () => {
    setupStore(0);
    render(<Header />);
    expect(screen.queryByTestId('comment-badge')).toBeNull();
  });

  it('코멘트가 있을 때 뱃지를 표시한다', () => {
    setupStore(3);
    render(<Header />);
    expect(screen.getByTestId('comment-badge')).toBeInTheDocument();
    expect(screen.getByTestId('comment-badge').textContent).toBe('3');
  });

  // Feature: promo-performance-dashboard, Property 20: 코멘트 뱃지 수 일치
  // 임의 코멘트 수 → 뱃지 숫자 일치 검증
  it('Property 20: 뱃지 숫자는 전체 코멘트 수(리플 제외)와 일치해야 한다', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (commentCount) => {
          setupStore(commentCount);
          const { unmount } = render(<Header />);

          if (commentCount === 0) {
            expect(screen.queryByTestId('comment-badge')).toBeNull();
          } else {
            const badge = screen.getByTestId('comment-badge');
            expect(badge).toBeInTheDocument();
            expect(Number(badge.textContent)).toBe(commentCount);
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
