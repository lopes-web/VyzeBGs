import React from 'react';
import { SubjectPosition } from '../types';

interface PositionSelectorProps {
  value: SubjectPosition;
  onChange: (pos: SubjectPosition) => void;
}

const PositionSelector: React.FC<PositionSelectorProps> = ({ value, onChange }) => {
  const options = [
    { id: SubjectPosition.LEFT, label: 'Left', icon: 'fa-align-left' },
    { id: SubjectPosition.CENTER, label: 'Center', icon: 'fa-align-center' },
    { id: SubjectPosition.RIGHT, label: 'Right', icon: 'fa-align-right' },
  ];

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-300 mb-3">
        Subject Position
      </label>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`
              flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200
              ${value === option.id 
                ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/50' 
                : 'border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:border-gray-600'
              }
            `}
          >
            <div className="h-8 w-16 bg-gray-900 rounded mb-2 relative overflow-hidden border border-gray-700">
                {/* Visual Representation of Positioning */}
                <div className={`absolute top-1 bottom-1 w-4 bg-current rounded-sm opacity-80
                    ${option.id === SubjectPosition.LEFT ? 'left-2' : ''}
                    ${option.id === SubjectPosition.CENTER ? 'left-1/2 -translate-x-1/2' : ''}
                    ${option.id === SubjectPosition.RIGHT ? 'right-2' : ''}
                `}></div>
            </div>
            <span className="text-xs font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PositionSelector;