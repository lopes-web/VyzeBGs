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
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      {description && <p className="text-xs text-gray-400 mb-2">{description}</p>}
      
      {/* Grid for multiple images */}
      {multiple && Array.isArray(value) && value.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-2">
              {value.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group border border-gray-700">
                      <img src={`data:image/png;base64,${img}`} className="w-full h-full object-cover" alt={`Upload ${idx}`} />
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                          <i className="fas fa-times"></i>
                      </button>
                  </div>
              ))}
          </div>
      )}

      {/* Upload Box - Always render, content changes based on state */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center w-full 
          ${(!multiple && value) ? 'h-48' : (compact ? 'h-24' : 'h-32')}
          border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
          ${isDragging 
            ? 'border-lime-500 bg-lime-500/10' 
            : (!multiple && value)
              ? 'border-gray-600 bg-gray-800' 
              : 'border-gray-700 bg-gray-900 hover:bg-gray-800'
          }
        `}
      >
        {!multiple && value ? (
          <div className="relative w-full h-full overflow-hidden rounded-xl group">
            <img 
              src={`data:image/png;base64,${value}`} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white font-medium"><i className="fas fa-sync mr-2"></i>Trocar Imagem</span>
            </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removeImage(); }}
                className="absolute top-2 right-2 text-red-400 hover:text-red-300 bg-black/50 rounded-full p-2"
            >
                <i className="fas fa-trash"></i>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4">
            <i className={`fas fa-cloud-upload-alt ${compact ? 'text-xl' : 'text-3xl'} mb-2 ${isDragging ? 'text-lime-400' : 'text-gray-500'}`}></i>
            <p className={`mb-1 ${compact ? 'text-xs' : 'text-sm'} text-gray-400 text-center`}>
              {multiple ? 'Adicionar mais imagens' : 'Clique ou arraste'}
            </p>
            {!compact && <p className="text-xs text-gray-500">PNG, JPG</p>}
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