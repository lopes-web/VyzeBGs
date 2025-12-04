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
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-neutral-50 dark:bg-neutral-950">
                <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-2xl p-8 shadow-xl border border-neutral-200 dark:border-neutral-800">
                    <div className="w-16 h-16 bg-[#00ca8c]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-magic text-2xl text-[#00ca8c]"></i>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-white">Configurar Replicate</h2>
                    <p className="text-neutral-500 mb-6">
                        Para remover fundos, precisamos da sua chave de API da Replicate.
                    </p>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="r8_..."
                        className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 mb-4 focus:outline-none focus:ring-2 focus:ring-[#00ca8c]"
                    />
                    <button
                        onClick={handleSaveKey}
                        disabled={!apiKey}
                        className="w-full py-3 bg-[#00ca8c] hover:bg-[#00ca8c]/90 text-black font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Salvar e Continuar
                    </button>
                    <button onClick={onBack} className="mt-4 text-sm text-neutral-400 hover:text-neutral-600">
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden">
            {/* Top Bar */}
            <div className="flex-none p-4 flex items-center justify-between z-20 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm border-b border-neutral-200/50 dark:border-neutral-800/50">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors shadow-sm border border-neutral-200 dark:border-neutral-700"
                >
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="text-neutral-900 dark:text-white font-bold text-lg">Removedor de Fundo</h1>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Main Canvas Area */}
            <div className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">

                {/* Content Container */}
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                    {!inputImage ? (
                        <div className="max-w-lg w-full">
                            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                                <div className="p-8 text-center border-b border-neutral-100 dark:border-neutral-800">
                                    <div className="w-16 h-16 bg-[#00ca8c]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <i className="fas fa-magic text-3xl text-[#00ca8c]"></i>
                                    </div>
                                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Upload de Imagem</h2>
                                    <p className="text-neutral-500">Remova o fundo automaticamente com IA</p>
                                </div>
                                <div className="p-8 bg-neutral-50 dark:bg-neutral-950/50">
                                    <ImageUpload
                                        label=""
                                        value={null}
                                        onChange={(val) => {
                                            setInputImage(val as string);
                                            setOutputImage(null);
                                        }}
                                        multiple={false}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative w-full h-full flex items-center justify-center p-4">
                            {/* Image Display */}
                            <div className="relative w-auto h-auto max-w-4xl max-h-[60vh] aspect-video shadow-2xl rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-checkerboard flex items-center justify-center p-4">
                                {/* If output exists, show it. Otherwise show input. */}
                                <img
                                    src={outputImage || `data:image/png;base64,${inputImage}`}
                                    alt="Workspace"
                                    className="max-w-full max-h-full object-contain shadow-lg"
                                />

                                {/* Loading Overlay */}
                                {isProcessing && (
                                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
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
                <div className="flex-none p-6 bg-neutral-50 dark:bg-neutral-950 z-20 flex items-center justify-center gap-4">
                    <button
                        onClick={handleReset}
                        className="px-6 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2"
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
                            className="px-8 py-3 rounded-xl bg-white text-black border border-neutral-200 font-bold hover:bg-neutral-50 transition-all shadow-lg flex items-center gap-2 transform hover:scale-105"
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
