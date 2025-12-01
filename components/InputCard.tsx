import React from 'react';

interface InputCardProps {
  label: string;
  value: number | string;
  onChange: (value: string) => void;
  type?: 'number' | 'text';
  placeholder?: string;
  suffix?: string;
  min?: number;
  step?: number;
}

export const InputCard: React.FC<InputCardProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  suffix,
  min = 0,
  step = 0.01
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-text-muted text-sm font-medium mr-1">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          step={step}
          className="w-full bg-background border border-card-border text-text-main rounded-lg p-3 pl-10 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-mono text-lg"
        />
        {suffix && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted text-sm font-bold">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};