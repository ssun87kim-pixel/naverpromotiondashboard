import React, { useRef, useState } from 'react';

interface FileSet {
  sales?: File;
  products?: File;
  category?: File;
}

interface Props {
  onFilesChange: (files: { sales?: File; products?: File; category?: File }) => void;
}

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

function isValidExtension(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

interface UploadZoneProps {
  label: string;
  hint?: string;
  required?: boolean;
  file?: File;
  error?: string;
  onFile: (file: File) => void;
  onRemove: () => void;
  testId?: string;
}

const UploadZone: React.FC<UploadZoneProps> = ({
  label,
  hint,
  required,
  file,
  error,
  onFile,
  onRemove,
  testId,
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
    <div data-testid={testId}>
      <div className="flex items-baseline gap-2 mb-1">
        <p className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red ml-1">*</span>}
        </p>
        {hint && <span className="text-xs text-gray-400">다운로드: {hint}</span>}
      </div>

      {file ? (
        <div className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
          <span className="text-sm text-gray-700 truncate max-w-[200px]">{file.name}</span>
          <button
            type="button"
            onClick={onRemove}
            className="ml-2 text-gray-400 hover:text-red transition-colors text-sm"
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
          className={`flex flex-col items-center justify-center px-4 py-5 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragging ? 'border-blue bg-blue/5' : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          <span className="text-xs text-gray-400">
            파일을 드래그하거나 클릭하여 업로드
          </span>
          <span className="text-xs text-gray-300 mt-1">xlsx, xls, csv</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <p className="mt-1 text-xs text-red" data-testid={`${testId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

const FileUploadPanel: React.FC<Props> = ({ onFilesChange }) => {
  const [files, setFiles] = useState<FileSet>({});
  const [errors, setErrors] = useState<Partial<Record<keyof FileSet, string>>>({});

  const handleFile = (key: keyof FileSet) => (file: File) => {
    if (!isValidExtension(file)) {
      setErrors((prev) => ({
        ...prev,
        [key]: '지원하지 않는 파일 형식입니다. xlsx, xls, csv 파일을 업로드해주세요',
      }));
      return;
    }
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    const next = { ...files, [key]: file };
    setFiles(next);
    onFilesChange(next);
  };

  const handleRemove = (key: keyof FileSet) => () => {
    const next = { ...files };
    delete next[key];
    setFiles(next);
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    onFilesChange(next);
  };

  return (
    <div className="space-y-4">
      <UploadZone
        label="판매성과"
        hint="네이버 어드민 > 데이터분석 > 판매분석 > 판매성과 > 엑셀 다운"
        required
        file={files.sales}
        error={errors.sales}
        onFile={handleFile('sales')}
        onRemove={handleRemove('sales')}
        testId="upload-sales"
      />

      <UploadZone
        label="상품성과"
        hint="네이버 어드민 > 데이터분석 > 판매분석 > 상품성과 > 엑셀 다운"
        required
        file={files.products}
        error={errors.products}
        onFile={handleFile('products')}
        onRemove={handleRemove('products')}
        testId="upload-products"
      />

      <UploadZone
        label="카테고리 (선택)"
        hint="온라인 견적서 엑셀 시트"
        file={files.category}
        error={errors.category}
        onFile={handleFile('category')}
        onRemove={handleRemove('category')}
        testId="upload-category"
      />
      <div style={{ marginTop: 8, padding: '10px 12px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8 }} className="space-y-1.5">
        <p className="text-xs font-bold" style={{ color: '#92400E' }}>★ 카테고리 파일 작성 시 주의사항</p>
        <ul className="text-xs leading-relaxed list-disc pl-4 space-y-0.5" style={{ color: '#B45309' }}>
          <li>첫 번째 행(헤더)에 반드시 <span className="font-bold" style={{ color: '#78350F' }}>구분, 대분류, 상품코드</span> 항목명 기입</li>
          <li><span className="font-bold" style={{ color: '#78350F' }}>상품코드</span> 열에는 <span className="font-bold" style={{ color: '#78350F' }}>네이버 상품ID</span>를 입력 (상품성과 파일의 상품ID와 매칭)</li>
          <li>항목명이 다르면 인식되지 않아 <span className="font-semibold" style={{ color: '#F72B35' }}>전체 "미매칭" 처리</span>됩니다</li>
        </ul>
        <div className="flex items-start gap-1 pt-0.5">
          <span className="text-xs shrink-0" style={{ color: '#D97706' }}>예시)</span>
          <div className="flex gap-0 text-xs rounded overflow-hidden" style={{ border: '1px solid #FCD34D' }}>
            <span className="px-1.5 py-0.5 font-semibold" style={{ background: '#FEF3C7', color: '#92400E', borderRight: '1px solid #FCD34D' }}>구분</span>
            <span className="px-1.5 py-0.5 font-semibold" style={{ background: '#FEF3C7', color: '#92400E', borderRight: '1px solid #FCD34D' }}>대분류</span>
            <span className="px-1.5 py-0.5 font-semibold" style={{ background: '#FEF3C7', color: '#92400E' }}>상품코드</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadPanel;
