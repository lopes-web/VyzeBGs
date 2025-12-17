
import React from 'react';
import { AspectRatio } from '../types';

interface DimensionSelectorProps {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
}

const DimensionSelector: React.FC<DimensionSelectorProps> = ({ value, onChange }) => {
  const options = [
    { id: AspectRatio.SQUARE, label: 'Feed (1:1)', icon: 'fa-square' },
    { id: AspectRatio.PORTRAIT, label: 'Portrait (4:5)', icon: 'fa-tablet-alt' },
    { id: AspectRatio.STORY, label: 'Story (9:16)', icon: 'fa-mobile-alt' },
  ];

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-300 mb-3">
        Formato do Criativo
      </label>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`
              flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200
              ${value === option.id 
                ? 'border-lime-500 bg-lime-500/20 text-lime-400 ring-1 ring-lime-500/50' 
                : 'border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:border-gray-600'
              }
            `}
          >
            <i className={`fas ${option.icon} text-xl mb-2`}></i>
            <span className="text-xs font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DimensionSelector;
