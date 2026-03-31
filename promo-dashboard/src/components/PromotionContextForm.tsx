import React, { useState, useImperativeHandle, forwardRef, useRef } from 'react';
import type { PromotionRecord } from '../types/index';
import LiveDatesInput from './LiveDatesInput';
import { formatNumber } from '../utils/format';

/** 다양한 날짜 형식을 YYYY-MM-DD로 변환 */
function parseFlexDate(input: string): string {
  const trimmed = input.trim().replace(/[./]/g, '-');
  // YYYYMMDD
  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`;
  }
  // YYYY-MM-DD (이미 정상 형식)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return input;
}

interface Props {
  onSubmit: (ctx: PromotionRecord) => void;
  initialValues?: Partial<PromotionRecord>;
}

export interface PromotionContextFormRef {
  saveAndGet: () => PromotionRecord | null;
}

interface FormErrors {
  eventName?: string;
  startDate?: string;
  endDate?: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const PromotionContextForm = forwardRef<PromotionContextFormRef, Props>(({ onSubmit, initialValues = {} }, ref) => {
  const [eventName, setEventName] = useState(initialValues.eventName ?? '');
  const [startDate, setStartDate] = useState(initialValues.startDate ?? '');
  const [endDate, setEndDate] = useState(initialValues.endDate ?? '');
  const [targetAmount, setTargetAmount] = useState(initialValues.targetAmount ?? 0);
  const [targetAmountDisplay, setTargetAmountDisplay] = useState(
    initialValues.targetAmount ? formatNumber(initialValues.targetAmount) : ''
  );
  const [planningIntent, setPlanningIntent] = useState(initialValues.planningIntent ?? '');
  const [liveDates, setLiveDates] = useState<string[]>(initialValues.liveDates ?? []);
  const [liveStartHour, setLiveStartHour] = useState<number | undefined>(initialValues.liveStartHour);
  const [liveEndHour, setLiveEndHour] = useState<number | undefined>(initialValues.liveEndHour);
  const [errors, setErrors] = useState<FormErrors>({});
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const [startDateDisplay, setStartDateDisplay] = useState(initialValues.startDate ?? '');
  const [endDateDisplay, setEndDateDisplay] = useState(initialValues.endDate ?? '');

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!eventName.trim()) errs.eventName = '행사명을 입력해주세요';
    if (!startDate) errs.startDate = '시작일을 입력해주세요';
    if (!endDate) errs.endDate = '종료일을 입력해주세요';
    if (startDate && endDate && endDate < startDate) {
      errs.endDate = '종료일은 시작일 이후여야 합니다';
    }
    return errs;
  };

  // 외부에서 현재 폼 값을 저장하고 가져올 수 있도록 ref 노출
  useImperativeHandle(ref, () => ({
    saveAndGet: () => {
      const errs = validate();
      setErrors(errs);
      if (Object.keys(errs).length > 0) return null;
      const now = new Date().toISOString();
      const record: PromotionRecord = {
        id: initialValues.id ?? generateId(),
        eventName: eventName.trim(),
        channel: 'naver',
        startDate,
        endDate,
        liveDates,
        liveStartHour,
        liveEndHour,
        targetAmount: Number(targetAmount),
        promotionType: '',
        planningIntent,
        createdAt: initialValues.createdAt ?? now,
        updatedAt: now,
      };
      onSubmit(record);
      return record;
    },
  }));

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue';

  return (
    <div className="space-y-4">
      {/* 행사명 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          행사명 <span className="text-red">*</span>
        </label>
        <input
          type="text"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="행사명을 입력하세요"
          className={inputClass}
          data-testid="field-eventName"
        />
        {errors.eventName && (
          <p className="mt-1 text-xs text-red" data-testid="error-eventName">
            {errors.eventName}
          </p>
        )}
      </div>

      {/* 기간 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            시작일 <span className="text-red">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={startDateDisplay}
              onChange={(e) => {
                const val = e.target.value;
                setStartDateDisplay(val);
                const parsed = parseFlexDate(val);
                if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
                  setStartDate(parsed);
                  setStartDateDisplay(parsed);
                }
              }}
              onBlur={() => {
                const parsed = parseFlexDate(startDateDisplay);
                setStartDate(parsed);
                setStartDateDisplay(parsed);
              }}
              placeholder="YYYY-MM-DD"
              className={`${inputClass} pr-9`}
              data-testid="field-startDate"
            />
            <button
              type="button"
              onClick={() => startDateRef.current?.showPicker()}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
              aria-label="캘린더 열기"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1.5 6H14.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M5 1V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M11 1V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
            <input
              ref={startDateRef}
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setStartDateDisplay(e.target.value);
              }}
              className="sr-only"
              tabIndex={-1}
            />
          </div>
          {errors.startDate && (
            <p className="mt-1 text-xs text-red" data-testid="error-startDate">
              {errors.startDate}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            종료일 <span className="text-red">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={endDateDisplay}
              onChange={(e) => {
                const val = e.target.value;
                setEndDateDisplay(val);
                const parsed = parseFlexDate(val);
                if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
                  setEndDate(parsed);
                  setEndDateDisplay(parsed);
                }
              }}
              onBlur={() => {
                const parsed = parseFlexDate(endDateDisplay);
                setEndDate(parsed);
                setEndDateDisplay(parsed);
              }}
              placeholder="YYYY-MM-DD"
              className={`${inputClass} pr-9`}
              data-testid="field-endDate"
            />
            <button
              type="button"
              onClick={() => endDateRef.current?.showPicker()}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
              aria-label="캘린더 열기"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1.5 6H14.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M5 1V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M11 1V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
            <input
              ref={endDateRef}
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setEndDateDisplay(e.target.value);
              }}
              className="sr-only"
              tabIndex={-1}
            />
          </div>
          {errors.endDate && (
            <p className="mt-1 text-xs text-red" data-testid="error-endDate">
              {errors.endDate}
            </p>
          )}
        </div>
      </div>

      {/* 라이브 일자 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">라이브 진행일자</label>
        <LiveDatesInput value={liveDates} onChange={setLiveDates} />
        {liveDates.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">라이브 시작시간</label>
              <select
                value={liveStartHour ?? ''}
                onChange={(e) => setLiveStartHour(e.target.value === '' ? undefined : Number(e.target.value))}
                className={inputClass}
                data-testid="field-liveStartHour"
              >
                <option value="">선택</option>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i}시</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">라이브 종료시간</label>
              <select
                value={liveEndHour ?? ''}
                onChange={(e) => setLiveEndHour(e.target.value === '' ? undefined : Number(e.target.value))}
                className={inputClass}
                data-testid="field-liveEndHour"
              >
                <option value="">선택</option>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i}시</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 매출목표금액 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">매출 목표 금액</label>
        <input
          type="text"
          inputMode="numeric"
          value={targetAmountDisplay}
          onChange={(e) => {
            const raw = e.target.value.replace(/,/g, '');
            if (raw === '' || /^\d+$/.test(raw)) {
              const num = raw === '' ? 0 : parseInt(raw, 10);
              setTargetAmount(num);
              setTargetAmountDisplay(raw === '' ? '' : formatNumber(num));
            }
          }}
          onBlur={() => {
            if (targetAmount > 0) setTargetAmountDisplay(formatNumber(targetAmount));
          }}
          placeholder="0"
          className={inputClass}
          data-testid="field-targetAmount"
        />
      </div>

      {/* 기획의도 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">기획의도/주요혜택</label>
        <textarea
          value={planningIntent}
          onChange={(e) => setPlanningIntent(e.target.value)}
          placeholder="이번 행사의 기획의도/주요혜택을 입력하세요"
          rows={3}
          className={inputClass}
          data-testid="field-planningIntent"
        />
      </div>

    </div>
  );
});

export default PromotionContextForm;
