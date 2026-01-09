
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import ImageUpload from './ImageUpload';
import ReferenceManager from './ReferenceManager';
import MagicEraserCanvas from './MagicEraserCanvas';
import PositionSelector from './PositionSelector';
import TagAutocompleteTextarea from './TagAutocompleteTextarea';
import {
    generateBackground,
    refineImage,
    reframeImageForTextLayout,
    inpaintImage,
    saveApiKey,
    checkApiKey,
    promptApiKeySelection
} from '../services/geminiService';
import { uploadImageToStorage } from '../services/storageService';
import { saveGeneration, getProjectHistory } from '../services/databaseService';
import { useAuth } from './AuthContext';
import {
    SubjectPosition,
    ReferenceItem,
    GenerationAttributes,
    GeneratorMode,
    HistoryItem,
    AppSection,
    ColorPalette,
    ProjectContext,
    FramingType,
    LightingColors,
    ActiveColors
} from '../types';
import { FRAMING_OPTIONS } from '../constants';

interface GeneratorWorkspaceProps {
    section: AppSection;
    initialMode?: GeneratorMode;
    initialImage?: string;
    initialPrompt?: string;
    initialReference?: string;
    initialStyleReference?: string;
    initialSecondaryElements?: string[];
    shouldAutoGenerate?: boolean;
    projectId?: string;
    onAddToGlobalHistory: (item: HistoryItem) => void;
    isOptimistic?: boolean;
}

const GeneratorWorkspace: React.FC<GeneratorWorkspaceProps> = ({
    section,
    initialMode = 'HUMAN',
    initialImage,
    initialPrompt = '',
    initialReference,
    initialStyleReference,
    initialSecondaryElements,
    shouldAutoGenerate = false,
    projectId,
    onAddToGlobalHistory,
    isOptimistic = false
}) => {
    const { user } = useAuth();
    const [hasKey, setHasKey] = useState(false);
    const [currentMode, setCurrentMode] = useState<GeneratorMode>(initialMode);

    // Check API Key on mount
    useEffect(() => {
        checkApiKey().then(setHasKey);
    }, []);

    // Inputs
    const [userImages, setUserImages] = useState<string[]>(initialImage ? [initialImage] : []);
    const [userPrompt, setUserPrompt] = useState(initialPrompt);
    const [referenceItems, setReferenceItems] = useState<ReferenceItem[]>([]);
    const [assetImages, setAssetImages] = useState<string[]>([]);


    const [posicaon, secaosition] = useState<SubjectPosition>(SubjectPosition.RIGHT);
    const [attributes, setAttributes] = useState<GenerationAttributes>({ useGradient: true, useBlur: false });
    const [batchSize, setBatchSize] = useState<number>(1);

    // Project Context (New)
    const [projectContext, setProjectContext] = useState<ProjectContext>({
        floatingElements3D: false,
        floatingElementsDescription: '',
        backgroundEffects: false,
        backgroundEffectsDescription: '',
        niche: '',
        environment: '',
        subjectDescription: '',
        colors: {
            ambient: '#0f172a',
            rim: '#a3e635',
            complementary: '#6366f1'
        },
        activeColors: {
            ambient: false,
            rim: false,
            complementary: false
        },
        ambientOpacity: 50,
        framing: 'MEDIUM',
        useEnvironmentImages: false,
        environmentImages: []
    });

    const [customHeight, setCustomHeight] = useState<number>(1080);
    const [verticalHeight, setVerticalHeight] = useState<number>(1920);
    const [verticalPrompt, setVerticalPrompt] = useState<string>("");

    // UI State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Export State
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
    const [exportQuality, setExportQuality] = useState(1);

    // Progress State
    const [progress, setProgress] = useState(0);

    // Simulate Progress
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isGenerating) {
            setProgress(0);
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) return 95; // Stall at 95%
                    const increment = prev < 50 ? 5 : prev < 80 ? 2 : 0.5;
                    return Math.min(prev + increment, 95);
                });
            });
        } else {
            setProgress(100);
            setTimeout(() => setProgress(0), 500); // Reset after completion
        }
        return () => clearInterval(interval);
    }, [isGenerating]);

    // Safety cleanup for processing count
    const isGeneratingRef = React.useRef(false);
    useEffect(() => {
        isGeneratingRef.current = isGenerating;
    }, [isGenerating]);

    useEffect(() => {
        return () => {
            if (isGeneratingRef.current) {
                onGenerationEnd();
            }
        };
    }, []);

    // Edit
    const [refinePrompt, setRefinePrompt] = useState('');
    const [refineAssets, setRefineAssets] = useState<string[]>([]);

    // Quick Edit (sem desenhar)
    const [quickEditPrompt, setQuickEditPrompt] = useState('');
    const [isQuickEditing, setIsQuickEditing] = useState(false);

    // Conversão 9:16
    const [isConverting916, setIsConverting916] = useState(false);

    // Magic Eraser State
    const [isEraserActive, setIsEraserActive] = useState(false);
    const [isEraserDrawing, setIsEraserDrawing] = useState(false);
    const [eraserMask, setEraserMask] = useState<string | null>(null);
    const [eraserPrompt, setEraserPrompt] = useState('');

    // Local History & Merge
    const [localHistory, secaocalHistory] = useState<HistoryItem[]>([]);
    const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
    const [historyPreview, setHistoryPreview] = useState<string | null>(null);

    // Auto-generate effect
    // Load history from Supabase on mount
    useEffect(() => {
        if (projectId) {
            getProjectHistory(projectId).then(history => {
                if (history && history.length > 0) {
                    secaocalHistory(history);
                }
            });
        }
    }, [projectId]);

    // Auto-generate trigger
    const [hasAutoGenerated, setHasAutoGenerated] = useState(false);

    useEffect(() => {
        if (shouldAutoGenerate && !hasAutoGenerated && userPrompt && !isOptimistic) {
            const waitingForReference = initialReference && userImages.length === 0;
            const waitingForStyle = initialStyleReference && referenceItems.length === 0;
            const waitingForAssets = initialSecondaryElements && initialSecondaryElements.length > 0 && assetImages.length < initialSecondaryElements.length;

            if (!waitingForReference && !waitingForStyle && !waitingForAssets) {
                handleGenerate();
                setHasAutoGenerated(true);
            }
        }
    }, [shouldAutoGenerate, hasAutoGenerated, userPrompt, userImages, referenceItems, assetImages, initialReference, initialStyleReference, initialSecondaryElements, isOptimistic]);

    const addToHistory = (url: string, promptUsed: string) => {
        const newItem: HistoryItem = {
            id: Date.now().toString() + Math.random().toString(),
            url,
            prompt: promptUsed,
            timestamp: Date.now(),
            mode: currentMode,
            section: section
        };
        secaocalHistory(prev => [newItem, ...prev]);
        onAddToGlobalHistory(newItem);
    };

    const restoreFromHistory = (item: HistoryItem) => {
        // Se está gerando, apenas abre preview em overlay
        if (isGenerating) {
            setHistoryPreview(item.url);
            return;
        }
        setGeneratedImage(item.url);
        setGeneratedImages([item.url]);
        setSelectedImageIndex(0);
        if (item.prompt && !item.prompt.includes("Auto-generated")) {
            setUserPrompt(item.prompt);
        }
    };

    const toggleHistorySelection = (id: string) => {
        setSelectedHistoryIds(prev =>
            prev.includes(id) ? prev.filter(hid => hid !== id) : [...prev, id]
        );
    };

    const handleMerge = () => {
        const selectedItems = localHistory.filter(item => selectedHistoryIds.includes(item.id));
        const imagesToMerge = selectedItems.map(item => item.url.split(',')[1]);

        setUserImages(imagesToMerge);
        setUserPrompt("Mesclar estas imagens em uma nova composicao harmoniosa. [Adicione detalhes...]");
        setReferenceItems([]);
        setSelectedHistoryIds([]);
    };

    const getModeLabel = () => {
        switch (currentMode) {
            case 'HUMAN': return 'Pessoas (Sujeito)';
            case 'OBJECT': return 'Objeto/Produto';
            case 'ENHANCE': return 'Imagem Original';
            case 'INFOPRODUCT': return 'Expert (Infoproduto)';
            case 'ULTRA': return 'Ultra Mode (Experimental)';
            default: return 'Sujeito';
        }
    };

    const getUploadLabel = () => {
        switch (currentMode) {
            case 'HUMAN': return 'Fotos da Pessoa';
            case 'OBJECT': return 'Fotos do Objeto';
            case 'ENHANCE': return 'Imagem Base para Melhorar';
            case 'INFOPRODUCT': return 'Foto do Expert';
            case 'ULTRA': return 'Foto do Sujeito (Alta Fidelidade)';
            default: return 'Imagens';
        }
    };

    const getUploadDesc = () => {
        switch (currentMode) {
            case 'HUMAN': return "Envie fotos para fidelidade facial.";
            case 'OBJECT': return "Envie fotos do produto em alta resolução.";
            case 'ENHANCE': return "A imagem original será mantida, mas enriquecida.";
            case 'INFOPRODUCT': return "O sistema melhorará posecaoupa se necessário, mantendo o rosto.";
            case 'ULTRA': return "Análise fenotípica avançada para máxima fidelidade.";
            default: return "";
        }
    };

    const urlToBase64 = async (url: string): Promise<string> => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Error converting URL to base64:", error);
            throw error;
        }
    };

    const handleGenerate = async () => {
        if (userImages.length === 0) {
            setError(currentMode === 'ENHANCE' ? "Envie a imagem que deseja melhorar." : "Por favor, envie pelo menos uma foto do sujeito.");
            return;
        }

        if (!checkConcurrencyLimit()) {
            setError("Limite de gerações simultâneas atingido (Max 2). Aguarde uma terminar.");
            return;
        }

        setIsGenerating(true);
        setError(null);
        setGeneratedImage(null);
        setGeneratedImages([]);
        setSelectedImageIndex(0);
        onGenerationStart();

        try {
            const requests = [];
            for (let i = 0; i < batchSize; i++) {
                const variationNoise = batchSize > 1 ? ` [VARIATION ${i + 1}/${batchSize}: Slightly vary ONLY the background lighting and environment details. CRITICAL: The subject face, identity, and physical features must remain EXACTLY the same across all variations.]` : "";
                const effectivePrompt = userPrompt + variationNoise;

                requests.push(
                    generateBackground(
                        section,
                        currentMode,
                        userImages,
                        referenceItems,
                        assetImages,
                        effectivePrompt,
                        posicaon,
                        attributes,
                        customHeight,
                        undefined,
                        projectContext
                    )
                );
            }

            const results = await Promise.allSettled(requests);

            const successResults = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<{ image: string, finalPrompt: string }>[];
            const failResults = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];

            if (successResults.length > 0) {
                const newImages: string[] = [];

                if (user) {
                    for (const res of successResults) {
                        const publicUrl = await uploadImageToStorage(res.value.image, user.id);
                        if (publicUrl) {
                            newImages.push(publicUrl);
                            const savedItem = await saveGeneration(
                                user.id,
                                publicUrl,
                                res.value.finalPrompt,
                                currentMode,
                                section,
                                projectId
                            );
                            if (savedItem) {
                                addToHistory(publicUrl, res.value.finalPrompt);
                            }
                        } else {
                            newImages.push(res.value.image);
                            addToHistory(res.value.image, res.value.finalPrompt);
                        }
                    }
                } else {
                    successResults.forEach(res => {
                        newImages.push(res.value.image);
                        addToHistory(res.value.image, res.value.finalPrompt);
                    });
                }

                setGeneratedImages(newImages);
                setGeneratedImage(newImages[0]);
                setSelectedImageIndex(0);
            }

            if (failResults.length > 0) {
                const errMsg = failResults[0].reason?.message || "Erro desconhecido";
                if (errMsg.includes("Requested entity was not found")) {
                    setError("Chave de API inválida ou expirada.");
                    setHasKey(false);
                } else {
                    setError(`Algumas gerações falharam: ${errMsg} `);
                }
            }

        } catch (err: any) {
            setError(err.message || "Ocorreu um erro inesperado.");
        } finally {
            setIsGenerating(false);
            onGenerationEnd();
        }
    };

    const handleRefine = async () => {
        if (!generatedImage || !refinePrompt) return;

        if (!checkConcurrencyLimit()) {
            setError("Limite de gerações simultâneas atingido (Max 2).");
            return;
        }

        setIsGenerating(true);
        setError(null);
        onGenerationStart();

        try {
            // Convert generatedImage to base64 if it's a URL
            let imageBase64 = generatedImage;
            if (generatedImage.startsWith('http')) {
                imageBase64 = await urlToBase64(generatedImage);
            }

            const result = await refineImage(imageBase64, refinePrompt, refineAssets);
            setGeneratedImage(result);
            addToHistory(result, `Ajuste: ${refinePrompt} `);
            setRefinePrompt('');
            setRefineAssets([]);
        } catch (err: any) {
            setError(err.message || "Falha ao refinar imagem.");
        } finally {
            setIsGenerating(false);
            onGenerationEnd();
        }
    };

    const handleInpaint = async () => {
        if (!generatedImage) return;

        if (!eraserMask) {
            setError("Por favor, pinte a área que deseja alterar antes de aplicar.");
            return;
        }

        if (!checkConcurrencyLimit()) {
            setError("Limite de gerações simultâneas atingido (Max 2).");
            return;
        }

        setIsGenerating(true);
        setError(null);
        onGenerationStart();

        try {
            // Convert generatedImage to base64 if it's a URL
            let imageBase64 = generatedImage;
            if (generatedImage.startsWith('http')) {
                imageBase64 = await urlToBase64(generatedImage);
            }

            const result = await inpaintImage(imageBase64, eraserMask, eraserPrompt);
            setGeneratedImage(result);
            addToHistory(result, `Magic Eraser: ${eraserPrompt || 'Remoção'} `);
            setIsEraserActive(false);
            setEraserMask(null);
            setEraserPrompt('');
        } catch (err: any) {
            setError(err.message || "Falha ao aplicar Magic Eraser.");
        } finally {
            setIsGenerating(false);
            onGenerationEnd();
        }
    };

    const handleValidateAndFormat = async () => {
        if (!generatedImage) return;

        if (!checkConcurrencyLimit()) {
            setError("Limite de gerações simultâneas atingido (Max 2).");
            return;
        }

        setIsGenerating(true);
        setError(null);
        onGenerationStart();

        try {
            const result = await reframeImageForTextLayout(generatedImage, verticalHeight, verticalPrompt);
            setGeneratedImage(result);
            addToHistory(result, `Formato Vertical(${verticalHeight}px) - ${verticalPrompt || 'Padrão'} `);
        } catch (err: any) {
            setError(err.message || "Falha ao formatar imagem.");
        } finally {
            setIsGenerating(false);
            onGenerationEnd();
        }
    };

    const toggleAttribute = (key: keyof GenerationAttributes) => {
        setAttributes(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleExport = async () => {
        if (!generatedImage) return;

        try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = generatedImage;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0);

            const dataUrl = canvas.toDataURL(`image/${exportFormat}`, exportQuality);

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `vyze-export-${Date.now()}.${exportFormat}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setShowExportModal(false);
        } catch (err) {
            console.error("Export failed", err);
            setError("Falha ao exportar imagem. Tente novamente.");
        }
    };

    const handleDownload = async (url: string) => {
        setShowExportModal(true);
    };

    // Quick Edit - Edição por prompt sem desenhar máscara
    const handleQuickEdit = async () => {
        if (!generatedImage || !quickEditPrompt.trim()) return;

        setIsQuickEditing(true);
        setError(null);

        try {
            const result = await refineImage(generatedImage, quickEditPrompt);
            setGeneratedImage(result);
            addToHistory(result, `Quick Edit: ${quickEditPrompt}`);
            setQuickEditPrompt('');
        } catch (err: any) {
            console.error("Quick Edit Error:", err);
            setError(err.message || "Falha ao editar imagem");
        } finally {
            setIsQuickEditing(false);
        }
    };

    // Conversão 9:16 - Outpaint vertical
    const handleConvert916 = async () => {
        if (!generatedImage) return;

        setIsConverting916(true);
        setError(null);

        try {
            const result = await reframeImageForTextLayout(generatedImage, 1920, '');
            setGeneratedImage(result);
            addToHistory(result, 'Convertido para 9:16');
        } catch (err: any) {
            console.error("Convert 9:16 Error:", err);
            setError(err.message || "Falha ao converter para 9:16");
        } finally {
            setIsConverting916(false);
        }
    };

    // Helper to check concurrency (mocked for now, should be from context or prop)
    const checkConcurrencyLimit = () => true;
    const onGenerationStart = () => { }; // Placeholder
    const onGenerationEnd = () => { }; // Placeholder
    const isActive = true; // Placeholder

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn h-full overflow-hidden" style={{ display: isActive ? 'grid' : 'none' }}>

            {/* LEFT PANEL: CONTROLS (FIXED FOOTER LAYOUT) */}
            <div className="lg:col-span-4 h-full flex flex-col relative bg-white/60 dark:bg-app-dark-lighter backdrop-blur-xl border-r border-gray-200 dark:border-white/5 rounded-l-2xl overflow-hidden transition-colors duration-300">

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto pr-2 pb-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 p-6 space-y-6">

                    {/* Image Inputs */}
                    <div className="bg-white dark:bg-app-dark border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white/90">
                            <i className={`fas ${currentMode === 'HUMAN' ? 'fa-user' : currentMode === 'OBJECT' ? 'fa-cube' : currentMode === 'INFOPRODUCT' ? 'fa-chalkboard-teacher' : 'fa-wand-magic'} text-accent-dark dark:text-accent-light`}></i>
                            {getModeLabel()}
                        </h2>
                        <ImageUpload
                            label={getUploadLabel()}
                            value={userImages}
                            onChange={setUserImages}
                            multiple={true}
                            description={getUploadDesc()}
                        />

                        {currentMode !== 'INFOPRODUCT' && (
                            <ReferenceManager
                                items={referenceItems}
                                onChange={setReferenceItems}
                            />
                        )}

                        <ImageUpload
                            label="Elementos Secundários (Opcional)"
                            value={assetImages}
                            onChange={setAssetImages}
                            multiple={true}
                            description="Objetos extras para compor o cenário"
                            tagPrefix="asset"
                        />
                    </div>

                    {/* Configuration Panel */}
                    <div className="rounded-2xl p-6" style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}>
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Configuracoes</h3>

                        {/* Nicho Input (New) */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nicho / Projeto
                            </label>
                            <input
                                type="text"
                                placeholder="Ex: Trader de Elite, Dentista Premium..."
                                value={projectContext.niche || ''}
                                onChange={(e) => setProjectContext(prev => ({ ...prev, niche: e.target.value }))}
                                className="w-full rounded-lg px-4 py-3 text-sm text-white focus:ring-2 focus:ring-[#00C087] outline-none" style={{ backgroundColor: '#171717', border: '1px solid #2E2E2E' }}
                            />
                        </div>

                        {/* Project Context - 3D Elements */}
                        <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#171717', border: '1px solid #2E2E2E' }}>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <i className="fas fa-cube text-accent"></i>
                                    Elementos Flutuantes 3D
                                </label>
                                <button
                                    onClick={() => setProjectContext(prev => ({ ...prev, floatingElements3D: !prev.floatingElements3D }))}
                                    className={`relative h-5 w-9 rounded-full transition-colors focus:outline-none ${projectContext.floatingElements3D ? 'bg-accent' : 'bg-gray-600'}`}
                                >
                                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${projectContext.floatingElements3D ? 'left-[18px]' : 'left-0.5'}`} />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Adiciona formas 3D abstratas e profundidade ao fundo.
                            </p>

                            {/* Description Input (Conditional) */}
                            {projectContext.floatingElements3D && (
                                <div className="mt-3 animate-fadeIn">
                                    <input
                                        type="text"
                                        placeholder="Ex: Icones de vidro, partículas douradas, moedas..."
                                        value={projectContext.floatingElementsDescription}
                                        onChange={(e) => setProjectContext(prev => ({ ...prev, floatingElementsDescription: e.target.value }))}
                                        className="w-full bg-white dark:bg-app-dark/40 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-accent outline-none transition-all"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Background Effects Toggle */}
                        <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#171717', border: '1px solid #2E2E2E' }}>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <i className="fas fa-bolt text-accent"></i>
                                    Efeitos de Fundo
                                </label>
                                <button
                                    onClick={() => setProjectContext(prev => ({ ...prev, backgroundEffects: !prev.backgroundEffects }))}
                                    className={`relative h-5 w-9 rounded-full transition-colors focus:outline-none ${projectContext.backgroundEffects ? 'bg-accent' : 'bg-gray-600'}`}
                                >
                                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${projectContext.backgroundEffects ? 'left-[18px]' : 'left-0.5'}`} />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Adiciona efeitos visuais din�micos (raios, part�culas, brilho).
                            </p>

                            {projectContext.backgroundEffects && (
                                <div className="mt-3 animate-fadeIn">
                                    <input
                                        type="text"
                                        placeholder="Opcional: descreva o efeito (ex: raios dourados, part�culas de luz...)"
                                        value={projectContext.backgroundEffectsDescription}
                                        onChange={(e) => setProjectContext(prev => ({ ...prev, backgroundEffectsDescription: e.target.value }))}
                                        className="w-full bg-white dark:bg-app-dark/40 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-accent outline-none transition-all"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Enquadramento */}
                        <div className="mb-6">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Enquadramento</label>
                            <div className="grid grid-cols-3 gap-2">
                                {FRAMING_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setProjectContext(prev => ({ ...prev, framing: opt.id }))}
                                        className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${projectContext.framing === opt.id
                                            ? 'bg-accent/10 border-accent text-accent-dark dark:text-accent-light'
                                            : 'bg-white dark:bg-app-dark-lighter border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        <i className={`fas ${opt.icon} mb-1 text-lg`}></i>
                                        <span className="text-[10px] font-medium">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Posição do Sujeito */}
                        <PositionSelector value={posicaon} onChange={secaosition} />

                        {/* Iluminação & Atmosfera (Redesigned) */}
                        <div className="mb-8 space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <i className="fas fa-lightbulb text-accent"></i>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Iluminação & Atmosfera</label>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {/* Ambient Color Card */}
                                <div className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${projectContext.activeColors?.ambient
                                    ? 'bg-white dark:bg-app-dark border-accent shadow-[0_0_20px_rgba(132,204,22,0.15)]'
                                    : 'bg-app-dark-lighter border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10'
                                    }`}>
                                    <div className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${projectContext.activeColors?.ambient ? 'bg-lime-100 text-accent-dark dark:bg-lime-900/30 dark:text-accent-light' : 'bg-gray-200 text-gray-400 dark:bg-white/5 dark:text-gray-500'}`}>
                                                    <i className="fas fa-sun text-lg"></i>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Ambiente (Fundo)</h3>
                                                    <p className="text-[10px] text-gray-500">Cor base da atmosfera</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {projectContext.activeColors?.ambient && (
                                                    <div className="relative group/picker">
                                                        <div
                                                            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                                                            style={{ backgroundColor: projectContext.colors?.ambient || '#0f172a' }}
                                                        >
                                                            <input
                                                                type="color"
                                                                value={projectContext.colors?.ambient || '#0f172a'}
                                                                onChange={(e) => setProjectContext(prev => ({
                                                                    ...prev,
                                                                    colors: { ...prev.colors!, ambient: e.target.value }
                                                                }))}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setProjectContext(prev => ({
                                                        ...prev,
                                                        activeColors: { ...prev.activeColors!, ambient: !prev.activeColors?.ambient }
                                                    }))}
                                                    className={`relative h-5 w-9 rounded-full transition-colors duration-300 ${projectContext.activeColors?.ambient ? 'bg-accent' : 'bg-gray-600'}`}
                                                >
                                                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${projectContext.activeColors?.ambient ? 'left-[18px]' : 'left-0.5'}`} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Opacity Slider (Expandable) */}
                                        <div className={`grid transition-all duration-300 ease-in-out ${projectContext.activeColors?.ambient ? 'grid-rows-[1fr] opacity-100 mt-4 pt-4 border-t border-gray-100 dark:border-white/5' : 'grid-rows-[0fr] opacity-0'}`}>
                                            <div className="overflow-hidden">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-medium text-gray-500">Intensidade</span>
                                                    <span className="text-xs font-bold text-accent-dark dark:text-accent-light">{projectContext.ambientOpacity}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={projectContext.ambientOpacity}
                                                    onChange={(e) => setProjectContext(prev => ({ ...prev, ambientOpacity: Number(e.target.value) }))}
                                                    className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent hover:accent-accent-light"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Rim Light Card */}
                                <div className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${projectContext.activeColors?.rim
                                    ? 'bg-white dark:bg-app-dark border-accent shadow-[0_0_20px_rgba(132,204,22,0.15)]'
                                    : 'bg-app-dark-lighter border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10'
                                    }`}>
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${projectContext.activeColors?.rim ? 'bg-lime-100 text-accent-dark dark:bg-lime-900/30 dark:text-accent-light' : 'bg-gray-200 text-gray-400 dark:bg-white/5 dark:text-gray-500'}`}>
                                                <i className="fas fa-bolt text-lg"></i>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Luz de Recorte</h3>
                                                <p className="text-[10px] text-gray-500">Rim Light para separação</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {projectContext.activeColors?.rim && (
                                                <div className="relative group/picker">
                                                    <div
                                                        className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                                                        style={{ backgroundColor: projectContext.colors?.rim || '#a3e635' }}
                                                    >
                                                        <input
                                                            type="color"
                                                            value={projectContext.colors?.rim || '#a3e635'}
                                                            onChange={(e) => setProjectContext(prev => ({
                                                                ...prev,
                                                                colors: { ...prev.colors!, rim: e.target.value }
                                                            }))}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => setProjectContext(prev => ({
                                                    ...prev,
                                                    activeColors: { ...prev.activeColors!, rim: !prev.activeColors?.rim }
                                                }))}
                                                className={`relative h-5 w-9 rounded-full transition-colors duration-300 ${projectContext.activeColors?.rim ? 'bg-accent' : 'bg-gray-600'}`}
                                            >
                                                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${projectContext.activeColors?.rim ? 'left-[18px]' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Complementary Light Card */}
                                <div className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${projectContext.activeColors?.complementary
                                    ? 'bg-white dark:bg-app-dark border-accent shadow-[0_0_20px_rgba(132,204,22,0.15)]'
                                    : 'bg-app-dark-lighter border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10'
                                    }`}>
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${projectContext.activeColors?.complementary ? 'bg-lime-100 text-accent-dark dark:bg-lime-900/30 dark:text-accent-light' : 'bg-gray-200 text-gray-400 dark:bg-white/5 dark:text-gray-500'}`}>
                                                <i className="fas fa-palette text-lg"></i>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Luz Complementar</h3>
                                                <p className="text-[10px] text-gray-500">Fill light secundária</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {projectContext.activeColors?.complementary && (
                                                <div className="relative group/picker">
                                                    <div
                                                        className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                                                        style={{ backgroundColor: projectContext.colors?.complementary || '#6366f1' }}
                                                    >
                                                        <input
                                                            type="color"
                                                            value={projectContext.colors?.complementary || '#6366f1'}
                                                            onChange={(e) => setProjectContext(prev => ({
                                                                ...prev,
                                                                colors: { ...prev.colors!, complementary: e.target.value }
                                                            }))}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => setProjectContext(prev => ({
                                                    ...prev,
                                                    activeColors: { ...prev.activeColors!, complementary: !prev.activeColors?.complementary }
                                                }))}
                                                className={`relative h-5 w-9 rounded-full transition-colors duration-300 ${projectContext.activeColors?.complementary ? 'bg-accent' : 'bg-gray-600'}`}
                                            >
                                                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${projectContext.activeColors?.complementary ? 'left-[18px]' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Attributes Toggles */}
                        <div className="mb-6 grid grid-cols-2 gap-3">
                            <button
                                onClick={() => toggleAttribute('useGradient')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${attributes.useGradient
                                    ? 'bg-accent/10 border-accent text-accent-dark dark:text-accent-light'
                                    : 'bg-white dark:bg-app-dark-lighter border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                                    } `}
                            >
                                <i className={`fas ${attributes.useGradient ? 'fa-check-square' : 'fa-check-square'} `}></i>
                                Degradê (Fade)
                            </button>
                            <button
                                onClick={() => toggleAttribute('useBlur')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${attributes.useBlur
                                    ? 'bg-accent/10 border-accent text-accent-dark dark:text-accent-light'
                                    : 'bg-white dark:bg-app-dark-lighter border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                                    } `}
                            >
                                <i className={`fas ${attributes.useBlur ? 'fa-check-square' : 'fa-square'} `}></i>
                                Blur (Rack Focus)
                            </button>
                        </div>

                        {/* Dimensions Input */}
                        <div className="mb-4 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Largura (px)</label>
                                <input
                                    type="number"
                                    value={1920}
                                    disabled
                                    className="w-full bg-gray-100 dark:bg-app-dark-lighter border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-500 text-sm cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Altura (px)</label>
                                <input
                                    type="number"
                                    value={customHeight}
                                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                                    className="w-full bg-white dark:bg-app-dark-lighter border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-accent outline-none"
                                    min={500}
                                    max={2160}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {currentMode === 'ENHANCE' ? 'Instruções de Melhoria' : 'Prompt do Cenário'}
                                <span className="text-xs text-gray-400 font-normal ml-2">
                                    (use @img, @ref, @asset para referenciar imagens)
                                </span>
                            </label>
                            <TagAutocompleteTextarea
                                value={userPrompt}
                                onChange={setUserPrompt}
                                placeholder={
                                    currentMode === 'ENHANCE'
                                        ? "Descreva o que melhorar... (ex: melhore a iluminação de @img1)"
                                        : currentMode === 'INFOPRODUCT'
                                            ? "Descreva o nicho e atmosfera... (ex: use @img1 como expert, aplique estilo de @ref1)"
                                            : "Descreva o cenário... (ex: coloque @img1 em um ambiente de escritório)"
                                }
                                className="w-full bg-white dark:bg-app-dark-lighter border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all min-h-[100px]"
                                availableTags={[
                                    { tag: 'img', label: 'Imagem do Sujeito', count: userImages.length },
                                    { tag: 'ref', label: 'Referência de Estilo', count: referenceItems.length },
                                    { tag: 'asset', label: 'Elemento Secundário', count: assetImages.length }
                                ]}
                            />
                        </div>

                        {/* Spacer to prevent content being hidden behind footer */}
                        <div className="h-48"></div>
                    </div>

                    {/* Sticky Footer */}
                    <div className="absolute bottom-0 left-0 right-0 backdrop-blur-xl p-4 z-20" style={{ backgroundColor: '#1F1F1F', borderTop: '1px solid #2E2E2E' }}>
                        {/* BATCH SELECTOR */}
                        <div className="flex items-center justify-between mb-4 px-1">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantidade:</span>
                            <div className="flex gap-3 p-1.5 rounded-xl" style={{ backgroundColor: '#171717', border: '1px solid #2E2E2E' }}>
                                {[1, 2, 3, 4].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setBatchSize(num)}
                                        className={`w-10 h-10 rounded-lg text-basecaont-bold transition-all ${batchSize === num ? 'bg-accent text-black shadow-lg scale-105' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'
                                            } `}
                                    >
                                        {num}x
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || userImages.length === 0}
                            className="w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.01] active:scale-95"
                            style={isGenerating || userImages.length === 0
                                ? { backgroundColor: '#2E2E2E', color: '#666', cursor: 'not-allowed' }
                                : { backgroundColor: '#00C087', color: '#000' }}
                        >
                            {isGenerating ? (
                                <>
                                    <i className="fas fa-circle-notch fa-spin"></i> Processando...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-wand-magic-sparkles"></i> {currentMode === 'ENHANCE' ? 'Melhorar' : 'Gerar'}
                                </>
                            )}
                        </button>
                        {error && (
                            <div className="mt-2 p-2 text-center text-xs text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-500/10 rounded">
                                <i className="fas fa-exclamation-triangle mr-1"></i> {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: PREVIEW & HISTORY */}
            < div className="lg:col-span-8 flex flex-col h-full overflow-hidden" >

                {/* Main Preview */}
                < div className="bg-white/60 dark:bg-app-dark backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-2xl p-1 shadow-2xl flex-grow relative overflow-hidden group mb-4 min-h-[400px]" >
                    {
                        isGenerating ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                                <div className="relative w-24 h-24 mb-6">
                                    <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-accent rounded-full border-t-transparent animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <i className="fas fa-wand-magic-sparkles text-2xl text-accent animate-pulse"></i>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 animate-pulse">Criando sua imagem...</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Isso pode levar alguns segundos</p>
                            </div>
                        ) : generatedImage ? (
                            <div className="relative w-full h-full flex items-center justify-center bg-gray-100 dark:bg-black/20 rounded-xl overflow-hidden p-4" >
                                <img
                                    src={generatedImage}
                                    alt="Generated"
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg animate-fadeIn"
                                />
                                {/* Overlay Actions */}
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" >
                                    <button
                                        onClick={() => handleDownload(generatedImage)}
                                        className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-all"
                                        title="Baixar"
                                    >
                                        <i className="fas fa-download"></i>
                                    </button>
                                    <button
                                        onClick={() => setIsEraserActive(true)}
                                        className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-all"
                                        title="Magic Eraser"
                                    >
                                        <i className="fas fa-eraser"></i>
                                    </button>
                                    <button
                                        onClick={handleConvert916}
                                        disabled={isConverting916}
                                        className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-all disabled:opacity-50"
                                        title="Converter para 9:16 (Vertical)"
                                    >
                                        {isConverting916 ? (
                                            <i className="fas fa-circle-notch fa-spin"></i>
                                        ) : (
                                            <i className="fas fa-mobile-alt"></i>
                                        )}
                                    </button>
                                </div>

                                {/* Magic Eraser Overlay */}
                                {
                                    isEraserActive && (
                                        <div className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center">
                                            <div className="relative w-full h-full flex flex-col">
                                                <div className="absolute top-4 left-4 z-40 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
                                                    <i className="fas fa-paint-brush mr-2"></i>
                                                    Pinte a área para remover/alterar
                                                </div>
                                                <div className="flex-grow relative overflow-hidden flex items-center justify-center">
                                                    <MagicEraserCanvas
                                                        imageUrl={generatedImage}
                                                        width={1024}
                                                        height={1024}
                                                        onMaskChange={setEraserMask}
                                                        isDrawingEnabled={true}
                                                        onDrawingStateChange={setIsEraserDrawing}
                                                    />
                                                </div>
                                                <div className="p-4 bg-app-dark border-t border-gray-800 flex gap-4 items-center">
                                                    <input
                                                        type="text"
                                                        value={eraserPrompt}
                                                        onChange={(e) => setEraserPrompt(e.target.value)}
                                                        placeholder="O que fazer nesta área? (Ex: Remover, Trocar por flor...)"
                                                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:ring-2 focus:ring-accent outline-none"
                                                    />
                                                    <button
                                                        onClick={handleInpaint}
                                                        className="px-6 py-2 bg-accent hover:bg-accent-light text-black font-bold rounded-lg transition-colors"
                                                    >
                                                        Aplicar
                                                    </button>
                                                    <button
                                                        onClick={() => setIsEraserActive(false)}
                                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                            </div >
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4 animate-pulse">
                                    <i className="fas fa-image text-4xl opacity-50"></i>
                                </div>
                                <p className="text-sm font-medium">Sua criacao aparecerá aqui</p>
                            </div>
                        )}
                </div >

                {/* Quick Edit Bar - Edição por Prompt (sem desenhar) */}
                {generatedImage && !isEraserActive && (
                    <div className="mb-4 p-3 rounded-xl flex gap-3 items-center" style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}>
                        <div className="flex items-center gap-2 text-accent">
                            <i className="fas fa-magic text-sm"></i>
                        </div>
                        <input
                            type="text"
                            value={quickEditPrompt}
                            onChange={(e) => setQuickEditPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleQuickEdit()}
                            placeholder="Altere a imagem: 'remova o fundo', 'mude para azul', 'adicione mais luz'..."
                            className="flex-1 bg-transparent border-none text-white text-sm placeholder-gray-500 focus:outline-none"
                            disabled={isQuickEditing}
                        />
                        <button
                            onClick={handleQuickEdit}
                            disabled={isQuickEditing || !quickEditPrompt.trim()}
                            className="px-4 py-2 rounded-lg font-bold text-sm transition-all"
                            style={isQuickEditing || !quickEditPrompt.trim()
                                ? { backgroundColor: '#2E2E2E', color: '#666', cursor: 'not-allowed' }
                                : { backgroundColor: '#00C087', color: '#000' }}
                        >
                            {isQuickEditing ? (
                                <><i className="fas fa-circle-notch fa-spin mr-1"></i> Editando...</>
                            ) : (
                                <><i className="fas fa-check mr-1"></i> Aplicar</>
                            )}
                        </button>
                    </div>
                )}

                {/* History Strip */}
                < div className="h-32 bg-white/60 dark:bg-app-dark backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-2xl p-4 overflow-x-auto flex gap-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700" >
                    {
                        localHistory.length === 0 ? (
                            <div className="w-full flex items-center justify-center text-xs text-gray-400">
                                Historico vazio
                            </div>
                        ) : (
                            localHistory.map((item) => (
                                <div
                                    key={item.id}
                                    className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all group ${generatedImage === item.url ? 'border-accent ring-2 ring-accent/30' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                    onClick={() => restoreFromHistory(item)}
                                >
                                    <img src={item.url} alt="History" className="w-full h-full object-cover" />
                                    {/* Selection Checkbox for Merge */}
                                    <div
                                        className={`absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 border border-white flex items-center justify-center transition-opacity ${selectedHistoryIds.includes(item.id) ? 'opacity-100 bg-accent border-accent' : 'opacity-0 group-hover:opacity-100'
                                            }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleHistorySelection(item.id);
                                        }}
                                    >
                                        {selectedHistoryIds.includes(item.id) && <i className="fas fa-check text-white text-xs"></i>}
                                    </div>
                                </div>
                            ))
                        )
                    }
                </div >

                {/* Merge Action Bar */}
                {
                    selectedHistoryIds.length > 1 && (
                        <div className="absolute bottom-36 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 animate-slideUp z-50 backdrop-blur-md border border-white/10">
                            <span className="text-sm font-medium">{selectedHistoryIds.length} selecionados</span>
                            <button
                                onClick={handleMerge}
                                className="bg-accent hover:bg-accent-light text-black px-4 py-1.5 rounded-full text-sm font-bold transition-colors"
                            >
                                Mesclar
                            </button>
                            <button
                                onClick={() => setSelectedHistoryIds([])}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    )
                }

            </div >

            {/* Export Modal */}
            {
                showExportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                        <div className="bg-white dark:bg-app-dark rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-white/10 relative">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                            >
                                <i className="fas fa-times text-xl"></i>
                            </button>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <i className="fas fa-download text-accent"></i>
                                Exportar Imagem
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Formato</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['png', 'jpeg', 'webp'].map((fmt) => (
                                            <button
                                                key={fmt}
                                                onClick={() => setExportFormat(fmt as any)}
                                                className={`py-2 px-4 rounded-lg border text-sm font-medium uppercase transition-all ${exportFormat === fmt
                                                    ? 'bg-accent text-black border-accent'
                                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                {fmt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Qualidade: {Math.round(exportQuality * 100)}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="1"
                                        step="0.1"
                                        value={exportQuality}
                                        onChange={(e) => setExportQuality(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent"
                                    />
                                </div>

                                <button
                                    onClick={handleExport}
                                    className="w-full py-3 bg-accent hover:bg-accent-light text-black font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02]"
                                >
                                    Baixar Agora
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* History Preview Modal - Visible during generation */}
            {historyPreview && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
                    onClick={() => setHistoryPreview(null)}
                >
                    <button
                        onClick={() => setHistoryPreview(null)}
                        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                    <img
                        src={historyPreview}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

        </div >
    );
};

export default GeneratorWorkspace;
