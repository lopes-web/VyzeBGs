import React from 'react';
import { SubjectPosition } from '../types';

interface PositionSelectorProps {
  value: SubjectPosition;
  onChange: (pos: SubjectPosition) => void;
}

const PositionSelector: React.FC<PositionSelectorProps> = ({ value, onChange }) => {
  const options = [
    { id: SubjectPosition.LEFT, label: 'Esquerda' },
    { id: SubjectPosition.CENTER, label: 'Centro' },
    { id: SubjectPosition.RIGHT, label: 'Direita' },
  ];

  return (
    <div className="mb-6">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
        Posição do Sujeito
      </label>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`
              flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200
              ${value === option.id
                ? 'border-accent bg-accent/10 text-accent-dark dark:text-accent-light'
                : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-app-dark-lighter text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
              }
            `}
          >
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-900 rounded mb-2 relative overflow-hidden border border-gray-300 dark:border-gray-700">
              {/* Visual Representation of Positioning */}
              <div className={`absolute top-1 bottom-1 w-4 rounded-sm ${value === option.id ? 'bg-accent' : 'bg-gray-400'}
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
