import React, { useState, useCallback, useRef } from 'react';
import JSZip from 'jszip';

interface WebPConverterWorkspaceProps {
    isActive: boolean;
    onBack?: () => void;
}

interface FileItem {
    id: string;
    file: File;
    status: 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR';
    originalSize: number;
    convertedSize?: number;
    convertedBlob?: Blob;
    error?: string;
}

const WebPConverterWorkspace: React.FC<WebPConverterWorkspaceProps> = ({ isActive, onBack }) => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [maxWidth, setMaxWidth] = useState<number | ''>('');
    const [maxHeight, setMaxHeight] = useState<number | ''>('');
    const [quality, setQuality] = useState<number>(80);
    const [isProcessing, setIsProcessing] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(Array.from(e.target.files));
        }
    };

    const addFiles = (newFiles: File[]) => {
        const validFiles = newFiles.filter(f => f.type.startsWith('image/'));
        const newItems: FileItem[] = validFiles.map(f => ({
            id: Math.random().toString(36).substr(2, 9),
            file: f,
            status: 'PENDING',
            originalSize: f.size
        }));
        setFiles(prev => [...prev, ...newItems]);
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const processFiles = async () => {
        setIsProcessing(true);
        const filesToProcess = files.filter(f => f.status === 'PENDING' || f.status === 'ERROR');

        for (const item of filesToProcess) {
            setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'PROCESSING' } : f));

            try {
                const blob = await convertToWebP(item.file);
                setFiles(prev => prev.map(f => f.id === item.id ? {
                    ...f,
                    status: 'DONE',
                    convertedBlob: blob,
                    convertedSize: blob.size
                } : f));
            } catch (err) {
                console.error("Conversion error", err);
                setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'ERROR', error: 'Falha na conversão' } : f));
            }
        }
        setIsProcessing(false);
    };

    const convertToWebP = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calculate aspect ratio
                const aspectRatio = width / height;

                // Resize logic
                if (maxWidth && width > Number(maxWidth)) {
                    width = Number(maxWidth);
                    height = width / aspectRatio;
                }
                if (maxHeight && height > Number(maxHeight)) {
                    height = Number(maxHeight);
                    width = height * aspectRatio;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not supported'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Blob creation failed'));
                    }
                }, 'image/webp', quality / 100);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    };

    const downloadAll = async () => {
        const zip = new JSZip();
        const processedFiles = files.filter(f => f.status === 'DONE' && f.convertedBlob);

        if (processedFiles.length === 0) return;

        processedFiles.forEach(f => {
            const name = f.file.name.replace(/\.[^/.]+$/, "") + ".webp";
            zip.file(name, f.convertedBlob!);
        });

        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = "images_webp.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadSingle = (item: FileItem) => {
        if (!item.convertedBlob) return;
        const url = URL.createObjectURL(item.convertedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.file.name.replace(/\.[^/.]+$/, "") + ".webp";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!isActive) return null;

    return (
        <div className="h-full flex flex-col animate-fadeIn overflow-hidden" style={{ backgroundColor: '#171717' }}>
            {/* Header */}
            <div className="p-6 flex items-center justify-between" style={{ backgroundColor: '#1F1F1F', borderBottom: '1px solid #2E2E2E' }}>
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            style={{ backgroundColor: '#171717', border: '1px solid #2E2E2E' }}
                            title="Voltar"
                        >
                            <i className="fas fa-arrow-left"></i>
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <i className="fas fa-images" style={{ color: '#00C087' }}></i>
                            Conversor WebP
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Otimize suas imagens para web com máxima qualidade.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setFiles([])}
                        className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-red-500 transition-colors"
                        disabled={isProcessing}
                    >
                        Limpar Lista
                    </button>
                    <button
                        onClick={processFiles}
                        disabled={isProcessing || files.filter(f => f.status === 'PENDING').length === 0}
                        className="px-6 py-2 rounded-xl font-bold text-black shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: isProcessing || files.filter(f => f.status === 'PENDING').length === 0 ? '#333' : '#00C087' }}
                    >
                        {isProcessing ? <><i className="fas fa-circle-notch fa-spin mr-2"></i> Convertendo...</> : 'Converter Tudo'}
                    </button>
                    <button
                        onClick={downloadAll}
                        disabled={files.filter(f => f.status === 'DONE').length === 0}
                        className="px-6 py-2 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            backgroundColor: files.filter(f => f.status === 'DONE').length === 0 ? '#333' : '#1F1F1F',
                            border: '1px solid #2E2E2E',
                            color: files.filter(f => f.status === 'DONE').length === 0 ? '#666' : '#fff'
                        }}
                    >
                        <i className="fas fa-download mr-2"></i> Baixar ZIP
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar: Settings */}
                <div className="w-80 p-6 overflow-y-auto" style={{ backgroundColor: '#1F1F1F', borderRight: '1px solid #2E2E2E' }}>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Configurações</h3>

                    <div className="space-y-6">
                        {/* Dimensions */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-300">Redimensionar (Opcional)</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Largura Máx (px)</label>
                                    <input
                                        type="number"
                                        value={maxWidth}
                                        onChange={(e) => setMaxWidth(e.target.value ? Number(e.target.value) : '')}
                                        placeholder="Auto"
                                        className="w-full rounded-lg px-3 py-2 text-sm text-white focus:ring-2 outline-none"
                                        style={{ backgroundColor: '#171717', border: '1px solid #2E2E2E' }}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Altura Máx (px)</label>
                                    <input
                                        type="number"
                                        value={maxHeight}
                                        onChange={(e) => setMaxHeight(e.target.value ? Number(e.target.value) : '')}
                                        placeholder="Auto"
                                        className="w-full rounded-lg px-3 py-2 text-sm text-white focus:ring-2 outline-none"
                                        style={{ backgroundColor: '#171717', border: '1px solid #2E2E2E' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quality */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-gray-300">Qualidade</label>
                                <span className="text-sm font-bold" style={{ color: '#00C087' }}>{quality}%</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={quality}
                                onChange={(e) => setQuality(Number(e.target.value))}
                                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                style={{ backgroundColor: '#2E2E2E', accentColor: '#00C087' }}
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                {quality > 80 ? 'Alta qualidade, arquivo maior' : quality < 60 ? 'Baixa qualidade, arquivo menor' : 'Equilíbrio recomendado'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Area: Dropzone & List */}
                <div className="flex-1 flex flex-col p-6 overflow-hidden" style={{ backgroundColor: '#171717' }}>

                    {/* Dropzone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed rounded-2xl p-8 mb-6 text-center cursor-pointer transition-all"
                        style={{
                            borderColor: isDragging ? '#00C087' : '#2E2E2E',
                            backgroundColor: isDragging ? 'rgba(0, 192, 135, 0.1)' : 'transparent'
                        }}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            multiple
                            accept="image/*"
                            className="hidden"
                        />
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1F1F1F' }}>
                                <i className="fas fa-cloud-upload-alt text-2xl text-gray-400"></i>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Arraste imagens ou clique para selecionar</h3>
                                <p className="text-sm text-gray-500">Suporta PNG, JPG, JPEG, BMP</p>
                            </div>
                        </div>
                    </div>

                    {/* File List */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                        {files.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                <i className="fas fa-images text-4xl mb-4"></i>
                                <p>Nenhuma imagem selecionada</p>
                            </div>
                        )}

                        {files.map(item => (
                            <div key={item.id} className="rounded-xl p-4 flex items-center gap-4 group hover:shadow-md transition-all" style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}>
                                {/* Preview */}
                                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: '#171717' }}>
                                    <img src={URL.createObjectURL(item.file)} alt="" className="w-full h-full object-cover" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-white truncate" title={item.file.name}>{item.file.name}</h4>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span>{formatSize(item.originalSize)}</span>
                                        {item.convertedSize && (
                                            <>
                                                <i className="fas fa-arrow-right text-gray-300"></i>
                                                <span style={{ color: '#00C087' }} className="font-bold">{formatSize(item.convertedSize)}</span>
                                                <span className="px-1.5 rounded text-[10px]" style={{ backgroundColor: 'rgba(0, 192, 135, 0.2)', color: '#00C087' }}>
                                                    -{Math.round((1 - item.convertedSize / item.originalSize) * 100)}%
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="flex items-center gap-3">
                                    {item.status === 'PENDING' && <span className="text-xs font-medium text-gray-400 px-2 py-1 rounded" style={{ backgroundColor: '#171717' }}>Pendente</span>}
                                    {item.status === 'PROCESSING' && <span className="text-xs font-medium text-blue-400 flex items-center gap-1"><i className="fas fa-circle-notch fa-spin"></i> Processando</span>}
                                    {item.status === 'DONE' && (
                                        <button
                                            onClick={() => downloadSingle(item)}
                                            className="text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors"
                                            style={{ backgroundColor: 'rgba(0, 192, 135, 0.2)', color: '#00C087' }}
                                        >
                                            <i className="fas fa-check"></i> Baixar
                                        </button>
                                    )}
                                    {item.status === 'ERROR' && <span className="text-xs font-medium text-red-500">{item.error}</span>}

                                    <button
                                        onClick={() => removeFile(item.id)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebPConverterWorkspace;

