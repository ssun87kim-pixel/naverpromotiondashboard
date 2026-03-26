import React from 'react';

interface EventTabsProps {
  labels: string[];
  activeIndex: number;
  onChange: (index: number) => void;
}

const EventTabs: React.FC<EventTabsProps> = ({ labels, activeIndex, onChange }) => {
  if (labels.length <= 1) return null;

  return (
    <div className="flex gap-1 border-b border-gray-200 mb-4">
      {labels.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(i)}
          className={`px-3 py-1.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            i === activeIndex
              ? 'border-blue text-blue'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default EventTabs;
