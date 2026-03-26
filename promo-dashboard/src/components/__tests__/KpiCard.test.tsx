import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import KpiCard from '../KpiCard';

describe('KpiCard', () => {
  it('achieved 상태: 초록 테두리 스타일 적용', () => {
    const { container } = render(
      <KpiCard label="달성률" value="105.0%" status="achieved" />
    );
    const card = container.firstChild as HTMLElement;
    // jsdom normalizes hex to rgb
    expect(card.style.borderLeft).toMatch(/4px solid (rgb\(0,\s*180,\s*65\)|#00B441)/i);
  });

  it('not-achieved 상태: 빨간 테두리 스타일 적용', () => {
    const { container } = render(
      <KpiCard label="달성률" value="87.3%" status="not-achieved" />
    );
    const card = container.firstChild as HTMLElement;
    // jsdom normalizes hex to rgb
    expect(card.style.borderLeft).toMatch(/4px solid (rgb\(247,\s*43,\s*53\)|#F72B35)/i);
  });

  it('achieved 상태: "목표 달성" 배지 표시', () => {
    render(<KpiCard label="달성률" value="105.0%" status="achieved" />);
    expect(screen.getByText('목표 달성')).toBeTruthy();
  });

  it('not-achieved 상태: "목표 미달" 배지 표시', () => {
    render(<KpiCard label="달성률" value="87.3%" status="not-achieved" />);
    expect(screen.getByText('목표 미달')).toBeTruthy();
  });

  it('neutral 상태: 배지 미표시', () => {
    render(<KpiCard label="순매출" value="₩1,000,000" status="neutral" />);
    expect(screen.queryByText('목표 달성')).toBeNull();
    expect(screen.queryByText('목표 미달')).toBeNull();
  });

  it('label과 value가 렌더링됨', () => {
    render(<KpiCard label="결제수" value="1,234" unit="건" />);
    expect(screen.getByText('결제수')).toBeTruthy();
    expect(screen.getByText('1,234')).toBeTruthy();
    expect(screen.getByText('건')).toBeTruthy();
  });
});
