
import React, { useRef, useState } from 'react';

interface ImageUploadProps {
  label: string;
  value: string | string[] | null;
  onChange: (val: any) => void;
  description?: string;
  multiple?: boolean;
  compact?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ label, value, onChange, description, multiple = false, compact = false }) => {
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
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(base64s => {
      if (multiple) {
        const current = Array.isArray(value) ? value : [];
        onChange([...current, ...base64s]);
      } else {
        onChange(base64s[0]);
      }
    });
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

  const removeImage = (index?: number) => {
    if (multiple && Array.isArray(value) && typeof index === 'number') {
      const newList = [...value];
      newList.splice(index, 1);
      onChange(newList);
    } else {
      onChange(null);
    }
  };

  const hasContent = multiple ? (Array.isArray(value) && value.length > 0) : !!value;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3 ml-1">
        {label}
      </label>

      {/* Grid for multiple images */}
      {multiple && Array.isArray(value) && value.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {value.map((img, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <img src={`data:image/png;base64,${img}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={`Upload ${idx}`} />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <button
                onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                className="absolute top-2 right-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500/80 hover:border-red-500"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative group flex flex-col items-center justify-center w-full 
          ${compact ? 'h-16' : (!multiple && value) ? 'h-40' : 'h-40'}
          rounded-3xl cursor-pointer transition-all duration-300 ease-out
          border-2 border-dashed
          ${isDragging
            ? 'border-[#00ca8c] bg-[#00ca8c]/5 scale-[1.02] shadow-xl shadow-[#00ca8c]/10'
            : (!multiple && value)
              ? 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50'
              : 'border-neutral-300 dark:border-neutral-700 hover:border-[#00ca8c]/50 dark:hover:border-[#00ca8c]/50 bg-white/50 dark:bg-neutral-900/30 hover:bg-white/80 dark:hover:bg-neutral-900/50 hover:shadow-2xl hover:shadow-[#00ca8c]/5 hover:scale-[1.01]'
          }
        `}
      >
        {!multiple && value ? (
          <div className="relative w-full h-full overflow-hidden rounded-xl group-inner">
            <img
              src={`data:image/png;base64,${value}`}
              alt="Preview"
              className="w-full h-full object-contain p-2"
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <span className="text-white font-bold text-lg flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                  <i className="fas fa-sync-alt text-[#00ca8c]"></i> Trocar Imagem
                </span>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); removeImage(); }}
              className="absolute top-4 right-4 text-white bg-black/50 hover:bg-red-500/80 backdrop-blur-md border border-white/10 hover:border-red-500 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300 transform scale-90 group-hover:scale-100 opacity-0 group-hover:opacity-100"
            >
              <i className="fas fa-trash-alt"></i>
            </button>
          </div>
        ) : (
          <div className={`flex flex-col items-center justify-center text-center p-6 transition-transform duration-300 ${isDragging ? 'scale-110' : 'group-hover:scale-105'}`}>
            <div className={`
              w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300
              ${isDragging ? 'bg-[#00ca8c]/20 text-[#00ca8c]' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 group-hover:bg-[#00ca8c]/10 group-hover:text-[#00ca8c]'}
            `}>
              <i className={`fas fa-cloud-upload-alt text-3xl`}></i>
            </div>

            {!compact && (
              <>
                <h3 className="text-lg font-bold text-neutral-700 dark:text-neutral-200 mb-1 group-hover:text-[#00ca8c] transition-colors">
                  {isDragging ? 'Solte para enviar' : 'Upload de Imagem'}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-[200px]">
                  {multiple ? 'Arraste ou clique para adicionar mais' : 'Arraste e solte ou clique para selecionar'}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
                  <i className="fas fa-image"></i> PNG, JPG, WEBP
                </div>
              </>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default ImageUpload;
