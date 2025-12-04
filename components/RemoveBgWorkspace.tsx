import React, { useState, useEffect } from 'react';
import { removeBackground, saveReplicateKey, checkReplicateKey } from '../services/replicateService';
import ImageUpload from './ImageUpload';
import { useAuth } from './AuthContext';
import { uploadImageToStorage } from '../services/storageService';

interface RemoveBgWorkspaceProps {
    onBack: () => void;
}

const RemoveBgWorkspace: React.FC<RemoveBgWorkspaceProps> = ({ onBack }) => {
    const { user } = useAuth();
    const [apiKey, setApiKey] = useState('');
    const [hasKey, setHasKey] = useState(false);
    const [inputImage, setInputImage] = useState<string | null>(null);
    const [outputImage, setOutputImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setHasKey(checkReplicateKey());
    }, []);

    const handleSaveKey = () => {
        if (apiKey.trim()) {
            saveReplicateKey(apiKey.trim());
            setHasKey(true);
        }
    };

    const handleProcess = async () => {
        if (!inputImage || !user) return;

        setIsProcessing(true);
        setError(null);
        setOutputImage(null);

        try {
            const key = localStorage.getItem('replicate_api_key');
            if (!key) throw new Error("API Key not found");

            const base64WithPrefix = `data:image/png;base64,${inputImage}`;
            const publicUrl = await uploadImageToStorage(base64WithPrefix, user.id);

            if (!publicUrl) {
                throw new Error("Failed to upload image. Please try again.");
            }

            const resultUrl = await removeBackground(publicUrl, key);
            setOutputImage(resultUrl);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to remove background");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = async () => {
        if (!outputImage) return;
        try {
            const response = await fetch(outputImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `removed-bg-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error("Download failed", e);
        }
    };

    const handleReset = () => {
        setInputImage(null);
        setOutputImage(null);
        setError(null);
    };

    if (!hasKey) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50 dark:bg-gray-950">
                <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-800">
                    <div className="w-16 h-16 bg-[#00ca8c]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-magic text-2xl text-[#00ca8c]"></i>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Configurar Replicate</h2>
                    <p className="text-gray-500 mb-6">
                        Para remover fundos, precisamos da sua chave de API da Replicate.
                    </p>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="r8_..."
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-4 focus:outline-none focus:ring-2 focus:ring-[#00ca8c]"
                    />
                    <button
                        onClick={handleSaveKey}
                        disabled={!apiKey}
                        className="w-full py-3 bg-[#00ca8c] hover:bg-[#00ca8c]/90 text-black font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Salvar e Continuar
                    </button>
                    <button onClick={onBack} className="mt-4 text-sm text-gray-400 hover:text-gray-600">
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 relative overflow-hidden">
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                <button
                    onClick={onBack}
                    className="pointer-events-auto w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="text-white font-bold text-lg drop-shadow-md">Removedor de Fundo</h1>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Main Canvas Area */}
            <div className="flex-grow flex items-center justify-center p-8 relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-checkerboard opacity-100 z-0"></div>

                {/* Content Container */}
                <div className="relative z-10 max-w-5xl w-full h-full flex items-center justify-center">
                    {!inputImage ? (
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 shadow-2xl border border-gray-200 dark:border-gray-800 text-center max-w-lg w-full">
                            <div className="w-20 h-20 bg-[#00ca8c]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <i className="fas fa-cloud-upload-alt text-4xl text-[#00ca8c]"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Upload de Imagem</h2>
                            <p className="text-gray-500 mb-8">Arraste uma imagem ou clique para selecionar.</p>

                            <div className="w-full">
                                <ImageUpload
                                    label=""
                                    value={null}
                                    onChange={(val) => {
                                        setInputImage(val as string);
                                        setOutputImage(null);
                                    }}
                                    multiple={false}
                                    description="PNG, JPG até 10MB"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                            {/* Image Display */}
                            <div className="relative max-w-full max-h-[70vh] shadow-2xl rounded-lg overflow-hidden border-2 border-white/20">
                                {/* If output exists, show it. Otherwise show input. */}
                                <img
                                    src={outputImage || `data:image/png;base64,${inputImage}`}
                                    alt="Workspace"
                                    className="max-w-full max-h-[70vh] object-contain block"
                                />

                                {/* Loading Overlay */}
                                {isProcessing && (
                                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                                        <i className="fas fa-circle-notch fa-spin text-4xl mb-4 text-[#00ca8c]"></i>
                                        <p className="font-medium">Removendo fundo...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Toolbar */}
            {inputImage && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-20 flex items-center justify-center gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                    <button
                        onClick={handleReset}
                        className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                        <i className="fas fa-trash-alt"></i>
                        <span className="hidden sm:inline">Limpar</span>
                    </button>

                    {!outputImage ? (
                        <button
                            onClick={handleProcess}
                            disabled={isProcessing}
                            className="px-8 py-3 rounded-xl bg-[#00ca8c] text-black font-bold hover:bg-[#00ca8c]/90 transition-all shadow-lg shadow-[#00ca8c]/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                        >
                            <i className="fas fa-magic"></i>
                            Remover Fundo
                        </button>
                    ) : (
                        <button
                            onClick={handleDownload}
                            className="px-8 py-3 rounded-xl bg-white text-black border border-gray-200 font-bold hover:bg-gray-50 transition-all shadow-lg flex items-center gap-2 transform hover:scale-105"
                        >
                            <i className="fas fa-download"></i>
                            Download PNG
                        </button>
                    )}
                </div>
            )}

            {/* Error Toast */}
            {error && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-fadeInDown z-50">
                    <i className="fas fa-exclamation-circle"></i>
                    {error}
                    <button onClick={() => setError(null)} className="ml-2 hover:text-white/80">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            )}
        </div>
    );
};

export default RemoveBgWorkspace;
