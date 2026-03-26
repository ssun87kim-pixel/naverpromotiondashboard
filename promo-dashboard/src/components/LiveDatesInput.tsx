import React, { useRef, useState } from 'react';

interface Props {
  value: string[];
  onChange: (dates: string[]) => void;
}

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

const LiveDateRow: React.FC<{
  date: string;
  index: number;
  onUpdate: (index: number, date: string) => void;
  onRemove: (index: number) => void;
}> = ({ date, index, onUpdate, onRemove }) => {
  const pickerRef = useRef<HTMLInputElement>(null);
  const [display, setDisplay] = useState(date);

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          value={display}
          onChange={(e) => {
            const val = e.target.value;
            setDisplay(val);
            const parsed = parseFlexDate(val);
            if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
              setDisplay(parsed);
              onUpdate(index, parsed);
            }
          }}
          onBlur={() => {
            const parsed = parseFlexDate(display);
            setDisplay(parsed);
            onUpdate(index, parsed);
          }}
          placeholder="YYYY-MM-DD"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-9 text-sm text-gray-900 focus:outline-none focus:border-blue"
          data-testid={`live-date-${index}`}
        />
        <button
          type="button"
          onClick={() => pickerRef.current?.showPicker()}
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
          ref={pickerRef}
          type="date"
          value={date}
          onChange={(e) => {
            setDisplay(e.target.value);
            onUpdate(index, e.target.value);
          }}
          className="sr-only"
          tabIndex={-1}
        />
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-red transition-colors"
        aria-label="날짜 삭제"
        data-testid={`remove-date-${index}`}
      >
        ×
      </button>
    </div>
  );
};

const LiveDatesInput: React.FC<Props> = ({ value, onChange }) => {
  const addDate = () => {
    onChange([...value, '']);
  };

  const updateDate = (index: number, date: string) => {
    const updated = [...value];
    updated[index] = date;
    onChange(updated);
  };

  const removeDate = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2" data-testid="live-dates-input">
      {value.map((date, index) => (
        <LiveDateRow
          key={index}
          date={date}
          index={index}
          onUpdate={updateDate}
          onRemove={removeDate}
        />
      ))}

      <button
        type="button"
        onClick={addDate}
        className="flex items-center gap-1 text-sm text-blue hover:opacity-80 transition-opacity"
        data-testid="add-date-btn"
      >
        <span className="text-lg leading-none">+</span>
        <span>날짜 추가</span>
      </button>
    </div>
  );
};

export default LiveDatesInput;
