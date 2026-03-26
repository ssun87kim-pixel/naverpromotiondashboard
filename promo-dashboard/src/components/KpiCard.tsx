import React from 'react';

export interface KpiCardProps {
  label: string;
  value: number | string;
  unit?: string;
  status?: 'achieved' | 'not-achieved' | 'neutral';
  isInverted?: boolean; // 환불율: 높을수록 나쁨
}

const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  status = 'neutral',
  isInverted: _isInverted = false,
}) => {
  const borderStyle =
    status === 'achieved'
      ? { borderLeft: '4px solid #00B441' }
      : status === 'not-achieved'
      ? { borderLeft: '4px solid #F72B35' }
      : { borderLeft: '4px solid transparent' };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col gap-1 min-w-[120px]"
      style={borderStyle}
    >
      <span className="text-xs text-gray-600 whitespace-nowrap">{label}</span>
      <span className="font-bold text-gray-900 leading-tight whitespace-nowrap text-sm sm:text-base" style={{ fontSize: 'clamp(12px, 1.5vw, 18px)' }}>
        {value}
        {unit && <span className="text-xs font-normal text-gray-600 ml-1">{unit}</span>}
      </span>
      {status === 'achieved' && (
        <span className="inline-flex items-center self-start px-2 py-0.5 rounded text-xs font-medium bg-green text-white">
          목표 달성
        </span>
      )}
      {status === 'not-achieved' && (
        <span className="inline-flex items-center self-start px-2 py-0.5 rounded text-xs font-medium bg-red text-white">
          목표 미달
        </span>
      )}
    </div>
  );
};

export default KpiCard;
