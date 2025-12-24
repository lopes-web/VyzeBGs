import React, { useRef, useState } from 'react';
import { ReferenceItem } from '../types';

interface ReferenceManagerProps {
  items: ReferenceItem[];
  onChange: (items: ReferenceItem[]) => void;
  label?: string;
  description?: string;
}

const ReferenceManager: React.FC<ReferenceManagerProps> = ({ items, onChange, label, description }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
  };

  const processFiles = (files: File[]) => {
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    const promises = validFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(base64s => {
      const newItems = base64s.map(img => ({
        id: Date.now().toString() + Math.random().toString(),
        image: img.split(',')[1], // remove prefix
        description: ''
      }));
      onChange([...items, ...newItems]);
    });
  };

  const updateDescription = (id: string, text: string) => {
    const updated = items.map(item => item.id === id ? { ...item, description: text } : item);
    onChange(updated);
  };

  const removeItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    if (direction === 'up' && index > 0) {
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
    } else if (direction === 'down' && index < newItems.length - 1) {
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    }
    onChange(newItems);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label || 'Referências de Estilo'}
      </label>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {description || 'Envie múltiplas referências. Arraste para adicionar ou use as setas para reordenar a prioridade.'}
      </p>

      {/* Container for Drag & Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`transition-all duration-200 rounded-xl ${isDragging ? 'bg-accent/10 ring-2 ring-accent ring-dashed p-2' : ''}`}
      >
        {/* List of active references */}
        <div className="space-y-3 mb-3">
          {items.map((item, idx) => (
            <div key={item.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex gap-4 border border-gray-200 dark:border-gray-700 items-start group relative">
              <div className="flex flex-col gap-1 justify-center mt-2">
                <button
                  onClick={() => moveItem(idx, 'up')}
                  disabled={idx === 0}
                  className="text-gray-400 hover:text-accent-dark dark:text-gray-600 dark:hover:text-accent-light disabled:opacity-30 disabled:hover:text-gray-400 dark:disabled:hover:text-gray-600 transition-colors"
                >
                  <i className="fas fa-chevron-up text-xs"></i>
                </button>
                <button
                  onClick={() => moveItem(idx, 'down')}
                  disabled={idx === items.length - 1}
                  className="text-gray-400 hover:text-accent-dark dark:text-gray-600 dark:hover:text-accent-light disabled:opacity-30 disabled:hover:text-gray-400 dark:disabled:hover:text-gray-600 transition-colors"
                >
                  <i className="fas fa-chevron-down text-xs"></i>
                </button>
              </div>

              <div className="w-20 h-20 flex-shrink-0 bg-gray-200 dark:bg-gray-900 rounded overflow-hidden relative border border-gray-300 dark:border-gray-700">
                <img src={`data:image/png;base64,${item.image}`} alt="Ref" className="w-full h-full object-cover" />
                <div className="absolute top-1 left-1 bg-accent text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
                  @ref{idx + 1}
                </div>
              </div>
              <div className="flex-grow">
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">O que aproveitar desta imagem?</label>
                <textarea
                  value={item.description}
                  onChange={(e) => updateDescription(item.id, e.target.value)}
                  placeholder="Ex: Luz neon, textura de chão..."
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded p-2 text-xs text-gray-900 dark:text-white focus:border-accent outline-none resize-none h-16"
                />
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 p-1 transition-colors absolute top-2 right-2"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>

        {/* Add Button */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`
            flex items-center justify-center w-full h-12
            border border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer 
            bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all
            text-gray-500 dark:text-gray-400 text-sm gap-2
            ${isDragging ? 'bg-gray-100 dark:bg-gray-800 border-accent text-accent-dark dark:text-accent-light' : ''}
            `}
        >
          <i className="fas fa-plus"></i> Adicionar Referência (Clique ou Arraste)
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ReferenceManager;
