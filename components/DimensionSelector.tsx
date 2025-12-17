import React from 'react';
import { AspectRatioCreative } from '../types';

interface DimensionSelectorProps {
    value: AspectRatioCreative;
    onChange: (value: AspectRatioCreative) => void;
}

const DIMENSIONS = [
    { id: AspectRatioCreative.SQUARE, label: '1:1', description: 'Feed', icon: 'fa-square' },
    { id: AspectRatioCreative.PORTRAIT, label: '4:5', description: 'Instagram', icon: 'fa-tablet-alt' },
    { id: AspectRatioCreative.STORY, label: '9:16', description: 'Stories', icon: 'fa-mobile-alt' },
];

const DimensionSelector: React.FC<DimensionSelectorProps> = ({ value, onChange }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <i className="fas fa-crop-alt text-lime-500 mr-2"></i>
                Dimensao do Criativo
            </label>
            <div className="grid grid-cols-3 gap-3">
                {DIMENSIONS.map((dim) => (
                    <button
                        key={dim.id}
                        onClick={() => onChange(dim.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${value === dim.id
                                ? 'bg-lime-500/10 border-lime-500 text-lime-600 dark:text-lime-400'
                                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                    >
                        <i className={`fas ${dim.icon} text-2xl mb-2`}></i>
                        <span className="text-sm font-bold">{dim.label}</span>
                        <span className="text-xs opacity-70">{dim.description}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DimensionSelector;
