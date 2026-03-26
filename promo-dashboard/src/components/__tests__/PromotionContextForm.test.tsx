import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import * as fc from 'fast-check';
import PromotionContextForm from '../PromotionContextForm';
import LiveDatesInput from '../LiveDatesInput';

// ============================================================
// 헬퍼
// ============================================================

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function renderForm(onSubmit = vi.fn()) {
  render(<PromotionContextForm onSubmit={onSubmit} />);
}

function submitForm() {
  fireEvent.click(screen.getByRole('button', { name: '저장' }));
}

function fillRequired(eventName = '테스트행사', channel = '네이버', startDate = '2026-01-01', endDate = '2026-01-10') {
  fireEvent.change(screen.getByTestId('field-eventName'), { target: { value: eventName } });
  fireEvent.change(screen.getByTestId('field-channel'), { target: { value: channel } });
  fireEvent.change(screen.getByTestId('field-startDate'), { target: { value: startDate } });
  fireEvent.change(screen.getByTestId('field-endDate'), { target: { value: endDate } });
}

// ============================================================
// 단위 테스트
// ============================================================

describe('PromotionContextForm - 단위 테스트', () => {
  it('모든 필수 항목 입력 시 onSubmit이 호출된다', () => {
    const onSubmit = vi.fn();
    renderForm(onSubmit);
    fillRequired();
    submitForm();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('행사명 미입력 시 오류 메시지가 표시된다', () => {
    renderForm();
    fillRequired('', '네이버');
    submitForm();
    expect(screen.getByTestId('error-eventName')).toBeInTheDocument();
  });

  it('종료일 < 시작일 시 "종료일은 시작일 이후여야 합니다" 오류가 표시된다', () => {
    renderForm();
    fillRequired('행사', '네이버', '2026-01-10', '2026-01-01');
    submitForm();
    expect(screen.getByTestId('error-endDate').textContent).toBe('종료일은 시작일 이후여야 합니다');
  });
});

// ============================================================
// Property 1: 필수 항목 누락 시 오류 발생
// Feature: promo-performance-dashboard, Property 1: 필수 항목 누락 시 오류 발생
// Validates: Requirements 1.3
// ============================================================

describe('Property 1: 필수 항목 누락 시 오류 발생', () => {
  const REQUIRED_FIELDS = ['eventName', 'channel', 'startDate', 'endDate'] as const;

  it('필수 항목 중 하나 이상 누락 시 오류가 반드시 발생해야 한다', () => {
    fc.assert(
      fc.property(
        // 필수 필드 중 1개 이상을 비워두는 조합 선택
        fc.subarray(REQUIRED_FIELDS, { minLength: 1 }),
        (missingFields) => {
          const onSubmit = vi.fn();
          const { unmount } = render(<PromotionContextForm onSubmit={onSubmit} />);

          // 기본값으로 모두 채운 뒤 누락 필드만 비움
          const values: Record<string, string> = {
            eventName: '행사명',
            channel: '네이버',
            startDate: '2026-01-01',
            endDate: '2026-01-10',
          };
          missingFields.forEach((f) => { values[f] = ''; });

          fireEvent.change(screen.getByTestId('field-eventName'), { target: { value: values.eventName } });
          fireEvent.change(screen.getByTestId('field-channel'), { target: { value: values.channel } });
          fireEvent.change(screen.getByTestId('field-startDate'), { target: { value: values.startDate } });
          fireEvent.change(screen.getByTestId('field-endDate'), { target: { value: values.endDate } });

          fireEvent.click(screen.getByRole('button', { name: '저장' }));

          // onSubmit이 호출되지 않아야 함
          expect(onSubmit).not.toHaveBeenCalled();

          // 누락된 필드 중 하나 이상에 오류 메시지가 있어야 함
          const hasError = missingFields.some((f) => {
            const el = screen.queryByTestId(`error-${f}`);
            return el !== null;
          });
          expect(hasError).toBe(true);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 2: 날짜 역전 시 오류 발생
// Feature: promo-performance-dashboard, Property 2: 날짜 역전 시 오류 발생
// Validates: Requirements 1.4
// ============================================================

describe('Property 2: 날짜 역전 시 오류 발생', () => {
  it('endDate < startDate 이면 "종료일은 시작일 이후여야 합니다" 오류가 반드시 발생해야 한다', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        ).filter(([a, b]) => toDateStr(b) < toDateStr(a)), // endDate < startDate
        ([startDate, endDate]) => {
          const onSubmit = vi.fn();
          const { unmount } = render(<PromotionContextForm onSubmit={onSubmit} />);

          fireEvent.change(screen.getByTestId('field-eventName'), { target: { value: '행사' } });
          fireEvent.change(screen.getByTestId('field-channel'), { target: { value: '네이버' } });
          fireEvent.change(screen.getByTestId('field-startDate'), { target: { value: toDateStr(startDate) } });
          fireEvent.change(screen.getByTestId('field-endDate'), { target: { value: toDateStr(endDate) } });

          fireEvent.click(screen.getByRole('button', { name: '저장' }));

          expect(onSubmit).not.toHaveBeenCalled();
          const errorEl = screen.queryByTestId('error-endDate');
          expect(errorEl).not.toBeNull();
          expect(errorEl?.textContent).toBe('종료일은 시작일 이후여야 합니다');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 3: 라이브 일자 추가/삭제 불변식
// Feature: promo-performance-dashboard, Property 3: 라이브 일자 추가/삭제 불변식
// Validates: Requirements 1.5
// ============================================================

describe('Property 3: 라이브 일자 추가/삭제 불변식', () => {
  it('날짜를 추가하면 목록 길이가 1 증가하고 삭제하면 1 감소해야 한다', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          { minLength: 0, maxLength: 10 }
        ),
        (dates) => {
          const initialDates = dates.map(toDateStr);
          const onChange = vi.fn();
          const { unmount } = render(
            <LiveDatesInput value={initialDates} onChange={onChange} />
          );

          // 추가 버튼 클릭 → onChange 호출 시 길이 +1
          fireEvent.click(screen.getByTestId('add-date-btn'));
          expect(onChange).toHaveBeenCalledTimes(1);
          const afterAdd: string[] = onChange.mock.calls[0][0];
          expect(afterAdd.length).toBe(initialDates.length + 1);

          onChange.mockClear();

          // 삭제 버튼이 있으면 첫 번째 항목 삭제 → 길이 -1
          if (initialDates.length > 0) {
            fireEvent.click(screen.getByTestId('remove-date-0'));
            expect(onChange).toHaveBeenCalledTimes(1);
            const afterRemove: string[] = onChange.mock.calls[0][0];
            expect(afterRemove.length).toBe(initialDates.length - 1);
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
