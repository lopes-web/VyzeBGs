import React, { useState, useEffect } from 'react';
import { removeBackground, saveReplicateKey, checkReplicateKey } from '../services/replicateService';
import ImageUpload from './ImageUpload';

interface RemoveBgWorkspaceProps {
    onBack: () => void;
}

const RemoveBgWorkspace: React.FC<RemoveBgWorkspaceProps> = ({ onBack }) => {
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
        if (!inputImage) return;

        setIsProcessing(true);
        setError(null);
        setOutputImage(null);

        try {
            const key = localStorage.getItem('replicate_api_key');
            if (!key) throw new Error("API Key not found");

            const resultUrl = await removeBackground(inputImage, key);
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

    if (!hasKey) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
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
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm"
                    >
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Removedor de Fundo</h1>
                        <p className="text-gray-500">Remova o fundo das suas imagens em segundos com IA.</p>
                    </div>
                </div>
            </div>
            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto w-full flex-grow">
                {/* Input Section */}
                <div className="flex flex-col gap-4">
                    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-white/5 h-full flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00ca8c] to-blue-500 opacity-50"></div>

                        <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3 text-lg">
                            <div className="p-2 bg-[#00ca8c]/10 rounded-lg text-[#00ca8c]">
                                <i className="fas fa-image"></i>
                            </div>
                            Imagem Original
                        </h3>

                        <div className="flex-grow flex flex-col justify-center">
                            <ImageUpload
                                label=""
                                value={inputImage}
                                onChange={(val) => {
                                    setInputImage(val as string);
                                    setOutputImage(null); // Reset output when input changes
                                }}
                                multiple={false}
                                description="Arraste ou clique para enviar"
                            />
                        </div>

                        <button
                            onClick={handleProcess}
                            disabled={!inputImage || isProcessing}
                            className={`
                                w-full mt-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300
                                ${!inputImage || isProcessing
                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                    : 'bg-[#00ca8c] hover:bg-[#00ca8c]/90 text-black shadow-lg shadow-[#00ca8c]/20 hover:scale-[1.02] hover:shadow-[#00ca8c]/30'
                                }
                            `}
                        >
                            {isProcessing ? (
                                <>
                                    <i className="fas fa-circle-notch fa-spin"></i> Processando...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-magic"></i> Remover Fundo
                                </>
                            )}
                        </button>
                        {error && (
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center flex items-center justify-center gap-2">
                                <i className="fas fa-exclamation-circle"></i> {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Output Section */}
                <div className="flex flex-col gap-4">
                    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-white/5 h-full flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-[#00ca8c] opacity-50"></div>

                        <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3 text-lg">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <i className="fas fa-check-circle"></i>
                            </div>
                            Resultado
                        </h3>

                        <div className="flex-grow bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-gray-50 dark:bg-black/40 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center relative overflow-hidden group transition-all duration-300 hover:border-[#00ca8c]/30">
                            {outputImage ? (
                                <img src={outputImage} alt="Removed Background" className="max-h-full max-w-full object-contain animate-in fade-in zoom-in-95 duration-500" />
                            ) : (
                                <div className="text-center text-gray-400 flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                        <i className="fas fa-image text-2xl opacity-20"></i>
                                    </div>
                                    <p className="text-sm font-medium opacity-50">O resultado aparecerá aqui</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleDownload}
                            disabled={!outputImage}
                            className={`
                                w-full mt-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300
                                ${!outputImage
                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                    : 'bg-white dark:bg-white text-black hover:bg-gray-100 shadow-lg shadow-white/5 hover:scale-[1.02]'
                                }
                            `}
                        >
                            <i className="fas fa-download"></i> Download PNG
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RemoveBgWorkspace;
