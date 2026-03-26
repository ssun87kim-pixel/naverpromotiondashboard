import React, { useRef } from 'react';

interface Props {
  onUpload: (file: File) => void;
  onSkip: () => void;
}

const CategoryFilePrompt: React.FC<Props> = ({ onUpload, onSkip }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
      <p className="text-sm text-gray-700">
        카테고리 파일이 없습니다. 카테고리 파일을 업로드하면 정확한 분류 기준으로 분석할 수
        있습니다. 업로드하지 않으면 상품성과 파일의 상품카테고리(소)/상품명을 기준으로
        표시됩니다.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex-1 bg-blue text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          카테고리 파일 업로드
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          카테고리 없이 계속
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
};

export default CategoryFilePrompt;
