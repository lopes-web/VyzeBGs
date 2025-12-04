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
                    <div className="w-16 h-16 bg-lime-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-magic text-2xl text-lime-500"></i>
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
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-4 focus:outline-none focus:ring-2 focus:ring-lime-500"
                    />
                    <button
                        onClick={handleSaveKey}
                        disabled={!apiKey}
                        className="w-full py-3 bg-lime-500 hover:bg-lime-600 text-black font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 h-full flex flex-col">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <i className="fas fa-image text-lime-500"></i> Imagem Original
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
                                w-full mt-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
                                ${!inputImage || isProcessing
                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                    : 'bg-lime-500 hover:bg-lime-400 text-black shadow-lg shadow-lime-500/20 hover:scale-[1.02]'
                                }
                            `}
                        >
                            {isProcessing ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Processando...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-magic"></i> Remover Fundo
                                </>
                            )}
                        </button>
                        {error && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Output Section */}
                <div className="flex flex-col gap-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 h-full flex flex-col">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <i className="fas fa-check-circle text-lime-500"></i> Resultado
                        </h3>

                        <div className="flex-grow bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center relative overflow-hidden group">
                            {outputImage ? (
                                <img src={outputImage} alt="Removed Background" className="max-h-full max-w-full object-contain" />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <i className="fas fa-image text-4xl mb-2 opacity-20"></i>
                                    <p>O resultado aparecerá aqui</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleDownload}
                            disabled={!outputImage}
                            className={`
                                w-full mt-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
                                ${!outputImage
                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
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
