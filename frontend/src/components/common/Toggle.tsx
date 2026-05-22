import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label }) => {
  return (
    <label
      className="flex items-center gap-3 cursor-pointer group"
      onClick={(e) => { e.preventDefault(); onChange(!checked); }}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
          tabIndex={-1}
        />
        <div
          className={`
            w-12 h-7 rounded-full transition-colors duration-300
            ${checked ? 'bg-primary' : 'bg-gray-300'}
          `}
        >
          <div
            className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </div>
      </div>
      <span className="text-sm text-gray-700 select-none">
        {label}
      </span>
    </label>
  );
};
