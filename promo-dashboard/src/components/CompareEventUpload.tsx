import React, { useRef, useState } from 'react';
import type { PromotionRecord } from '../types/index';
import LiveDatesInput from './LiveDatesInput';
import { formatNumber } from '../utils/format';

interface FileSet {
  sales?: File;
  products?: File;
  category?: File;
}

interface Props {
  index: number;
  onFilesChange: (files: FileSet) => void;
  onContextChange: (ctx: Partial<PromotionRecord>) => void;
}

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

function isValidExtension(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

interface MiniUploadZoneProps {
  label: string;
  hint?: string;
  required?: boolean;
  file?: File;
  error?: string;
  onFile: (file: File) => void;
  onRemove: () => void;
}

const MiniUploadZone: React.FC<MiniUploadZoneProps> = ({
  label,
  hint,
  required,
  file,
  error,
  onFile,
  onRemove,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) onFile(selected);
    e.target.value = '';
  };

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <p className="text-xs font-medium text-gray-600">
          {label}
          {required && <span className="text-red ml-1">*</span>}
        </p>
        {hint && <span className="text-xs text-gray-400">다운로드: {hint}</span>}
      </div>

      {file ? (
        <div className="flex items-center justify-between px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50">
          <span className="text-xs text-gray-700 truncate max-w-[160px]">{file.name}</span>
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 text-gray-400 hover:text-red transition-colors text-xs"
            aria-label="파일 제거"
          >
            ×
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex items-center justify-center px-3 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragging ? 'border-blue bg-blue/5' : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          <span className="text-xs text-gray-400">클릭 또는 드래그</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleChange}
        className="hidden"
      />

      {error && <p className="mt-1 text-xs text-red">{error}</p>}
    </div>
  );
};

function parseFlexDate(input: string): string {
  const trimmed = input.trim().replace(/[./]/g, '-');
  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return input;
}

const CompareEventUpload: React.FC<Props> = ({ index, onFilesChange, onContextChange }) => {
  const [files, setFiles] = useState<FileSet>({});
  const [fileErrors, setFileErrors] = useState<Partial<Record<keyof FileSet, string>>>({});
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startDateDisplay, setStartDateDisplay] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endDateDisplay, setEndDateDisplay] = useState('');
  const [targetAmount, setTargetAmount] = useState(0);
  const [targetAmountDisplay, setTargetAmountDisplay] = useState('');
  const [liveDates, setLiveDates] = useState<string[]>([]);
  const [liveStartHour, setLiveStartHour] = useState<number | undefined>(undefined);
  const [liveEndHour, setLiveEndHour] = useState<number | undefined>(undefined);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue';

  const handleContextChange = (patch: Partial<PromotionRecord>) => {
    onContextChange(patch);
  };

  const handleFile = (key: keyof FileSet) => (file: File) => {
    if (!isValidExtension(file)) {
      setFileErrors((prev) => ({
        ...prev,
        [key]: '지원하지 않는 파일 형식입니다. xlsx, xls, csv 파일을 업로드해주세요',
      }));
      return;
    }
    setFileErrors((prev) => ({ ...prev, [key]: undefined }));
    const next = { ...files, [key]: file };
    setFiles(next);
    onFilesChange(next);
  };

  const handleRemove = (key: keyof FileSet) => () => {
    const next = { ...files };
    delete next[key];
    setFiles(next);
    setFileErrors((prev) => ({ ...prev, [key]: undefined }));
    onFilesChange(next);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">비교 행사 {index + 1}</h3>

      {/* 간략 컨텍스트 폼 */}
      <div className="space-y-2">
        <input
          type="text"
          value={eventName}
          onChange={(e) => {
            setEventName(e.target.value);
            handleContextChange({ eventName: e.target.value });
          }}
          placeholder="행사명"
          className={inputClass}
        />
        <div className="grid grid-cols-2 gap-2">
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
                  handleContextChange({ startDate: parsed });
                }
              }}
              onBlur={() => {
                const parsed = parseFlexDate(startDateDisplay);
                setStartDate(parsed);
                setStartDateDisplay(parsed);
                handleContextChange({ startDate: parsed });
              }}
              placeholder="시작일"
              className={`${inputClass} pr-7`}
              aria-label="시작일"
            />
            <button
              type="button"
              onClick={() => startDateRef.current?.showPicker()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 6H14.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5 1V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M11 1V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </button>
            <input
              ref={startDateRef}
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setStartDateDisplay(e.target.value);
                handleContextChange({ startDate: e.target.value });
              }}
              className="sr-only"
              tabIndex={-1}
            />
          </div>
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
                  handleContextChange({ endDate: parsed });
                }
              }}
              onBlur={() => {
                const parsed = parseFlexDate(endDateDisplay);
                setEndDate(parsed);
                setEndDateDisplay(parsed);
                handleContextChange({ endDate: parsed });
              }}
              placeholder="종료일"
              className={`${inputClass} pr-7`}
              aria-label="종료일"
            />
            <button
              type="button"
              onClick={() => endDateRef.current?.showPicker()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 6H14.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5 1V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M11 1V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </button>
            <input
              ref={endDateRef}
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setEndDateDisplay(e.target.value);
                handleContextChange({ endDate: e.target.value });
              }}
              className="sr-only"
              tabIndex={-1}
            />
          </div>
        </div>
      </div>

      {/* 매출 목표 금액 */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1">매출 목표 금액</p>
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
              handleContextChange({ targetAmount: num });
            }
          }}
          onBlur={() => {
            if (targetAmount > 0) setTargetAmountDisplay(formatNumber(targetAmount));
          }}
          placeholder="0"
          className={inputClass}
        />
      </div>

      {/* 라이브 진행일자 */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1">라이브 진행일자</p>
        <LiveDatesInput
          value={liveDates}
          onChange={(dates) => {
            setLiveDates(dates);
            handleContextChange({ liveDates: dates });
          }}
        />
        {liveDates.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">라이브 시작시간</label>
              <select
                value={liveStartHour ?? ''}
                onChange={(e) => {
                  const v = e.target.value === '' ? undefined : Number(e.target.value);
                  setLiveStartHour(v);
                  handleContextChange({ liveStartHour: v });
                }}
                className={inputClass}
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
                onChange={(e) => {
                  const v = e.target.value === '' ? undefined : Number(e.target.value);
                  setLiveEndHour(v);
                  handleContextChange({ liveEndHour: v });
                }}
                className={inputClass}
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

      {/* 파일 업로드 존 3개 */}
      <div className="space-y-2">
        <MiniUploadZone
          label="판매성과"
          hint="네이버 어드민 > 데이터분석 > 판매분석 > 판매성과 > 엑셀 다운"
          file={files.sales}
          error={fileErrors.sales}
          onFile={handleFile('sales')}
          onRemove={handleRemove('sales')}
        />
        <MiniUploadZone
          label="상품성과"
          hint="네이버 어드민 > 데이터분석 > 판매분석 > 상품성과 > 엑셀 다운"
          file={files.products}
          error={fileErrors.products}
          onFile={handleFile('products')}
          onRemove={handleRemove('products')}
        />
        <MiniUploadZone
          label="카테고리 (선택)"
          hint="온라인 견적서 엑셀 시트"
          file={files.category}
          error={fileErrors.category}
          onFile={handleFile('category')}
          onRemove={handleRemove('category')}
        />
        <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(255,220,30,0.12)', border: '1px solid #FFDC1E', borderRadius: 8 }} className="space-y-1.5">
          <p className="text-xs font-bold" style={{ color: '#282828' }}>★ 카테고리 파일 작성 시 주의사항</p>
          <ul className="text-xs leading-relaxed list-disc pl-4 space-y-0.5" style={{ color: '#515151' }}>
            <li>첫 번째 행(헤더)에 반드시 <span className="font-bold" style={{ color: '#282828' }}>구분, 대분류, 상품코드</span> 항목명 기입</li>
            <li><span className="font-bold" style={{ color: '#282828' }}>상품코드</span> 열에는 <span className="font-bold" style={{ color: '#282828' }}>네이버 상품ID</span>를 입력 (상품성과 파일의 상품ID와 매칭)</li>
            <li>항목명이 다르면 인식되지 않아 <span className="font-semibold" style={{ color: '#F72B35' }}>전체 "미매칭" 처리</span>됩니다</li>
          </ul>
          <div className="flex items-start gap-1 pt-0.5">
            <span className="text-xs shrink-0" style={{ color: '#515151' }}>예시)</span>
            <div className="flex gap-0 text-xs rounded overflow-hidden" style={{ border: '1px solid #FFDC1E' }}>
              <span className="px-1.5 py-0.5 font-semibold" style={{ background: 'rgba(255,220,30,0.20)', color: '#282828', borderRight: '1px solid #FCD34D' }}>구분</span>
              <span className="px-1.5 py-0.5 font-semibold" style={{ background: 'rgba(255,220,30,0.20)', color: '#282828', borderRight: '1px solid #FCD34D' }}>대분류</span>
              <span className="px-1.5 py-0.5 font-semibold" style={{ background: 'rgba(255,220,30,0.20)', color: '#282828' }}>상품코드</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareEventUpload;
