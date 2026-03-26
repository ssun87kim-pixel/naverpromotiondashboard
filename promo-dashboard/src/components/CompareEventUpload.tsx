import React, { useRef, useState } from 'react';
import type { PromotionRecord } from '../types/index';
import LiveDatesInput from './LiveDatesInput';

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
  required?: boolean;
  file?: File;
  error?: string;
  onFile: (file: File) => void;
  onRemove: () => void;
}

const MiniUploadZone: React.FC<MiniUploadZoneProps> = ({
  label,
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
      <p className="text-xs font-medium text-gray-600 mb-1">
        {label}
        {required && <span className="text-red ml-1">*</span>}
      </p>

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

const CompareEventUpload: React.FC<Props> = ({ index, onFilesChange, onContextChange }) => {
  const [files, setFiles] = useState<FileSet>({});
  const [fileErrors, setFileErrors] = useState<Partial<Record<keyof FileSet, string>>>({});
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [liveDates, setLiveDates] = useState<string[]>([]);

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
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              handleContextChange({ startDate: e.target.value });
            }}
            className={inputClass}
            aria-label="시작일"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              handleContextChange({ endDate: e.target.value });
            }}
            className={inputClass}
            aria-label="종료일"
          />
        </div>
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
      </div>

      {/* 파일 업로드 존 3개 */}
      <div className="space-y-2">
        <MiniUploadZone
          label="판매성과"
          file={files.sales}
          error={fileErrors.sales}
          onFile={handleFile('sales')}
          onRemove={handleRemove('sales')}
        />
        <MiniUploadZone
          label="상품성과"
          file={files.products}
          error={fileErrors.products}
          onFile={handleFile('products')}
          onRemove={handleRemove('products')}
        />
        <MiniUploadZone
          label="카테고리 (선택)"
          file={files.category}
          error={fileErrors.category}
          onFile={handleFile('category')}
          onRemove={handleRemove('category')}
        />
      </div>
    </div>
  );
};

export default CompareEventUpload;
