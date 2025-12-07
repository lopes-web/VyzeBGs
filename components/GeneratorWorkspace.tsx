import React, { useState, useEffect, useRef } from 'react';
import ImageUpload from './ImageUpload';
import PositionSelector from './PositionSelector';
import ReferenceManager from './ReferenceManager';
import { SubjectPosition, HistoryItem, ReferenceItem, GenerationAttributes, GeneratorMode, AppSection, ColorPalette } from '../types';
import { generateBackground, refineImage, reframeImageForTextLayout, inpaintImage } from '../services/geminiService';
import MagicEraserCanvas from './MagicEraserCanvas';
import { uploadImageToStorage } from '../services/storageService';
import { saveGeneration, getProjectHistory } from '../services/databaseService';
import { useAuth } from './AuthContext';

interface GeneratorWorkspaceProps {
    mode: GeneratorMode;
    section: AppSection;
    initialPrompt?: string;
    initialReference?: File;
    initialStyleReference?: File;
    initialGeneratorMode?: GeneratorMode;
    initialSecondaryElements?: File[];
    isActive: boolean;
    setHasKey: (hasKey: boolean) => void;
    onAddToGlobalHistory: (item: HistoryItem) => void;
    checkConcurrencyLimit: () => boolean;
    onGenerationStart: () => void;
    onGenerationEnd: () => void;
    projectId?: string;
    shouldAutoGenerate?: boolean;
    isOptimistic?: boolean;
}

const GeneratorWorkspace: React.FC<GeneratorWorkspaceProps> = ({
    mode: defaultMode,
    section,
    initialPrompt,
    initialReference,
    initialStyleReference,
    initialGeneratorMode,
    initialSecondaryElements,
    isActive,
    setHasKey,
    onAddToGlobalHistory,
    checkConcurrencyLimit,
    onGenerationStart,
    onGenerationEnd,
    projectId,
    shouldAutoGenerate,
    isOptimistic
}) => {
    const { user } = useAuth();

    // Initialize mode from prop if available, otherwise default
    const [currentMode, setCurrentMode] = useState<GeneratorMode>(initialGeneratorMode || defaultMode);

    const [userPrompt, setUserPrompt] = useState(initialPrompt || '');

    // Update prompt if initialPrompt changes
    useEffect(() => {
        if (initialPrompt) {
            setUserPrompt(initialPrompt);
        }
    }, [initialPrompt]);

    // Handle initial reference (Principal Image - Subject)
    useEffect(() => {
        if (initialReference) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const base64 = result.includes(',') ? result.split(',')[1] : result;

                setUserImages(prev => {
                    if (!prev.includes(base64)) {
                        return [...prev, base64];
                    }
                    return prev;
                });
            };
            reader.readAsDataURL(initialReference);
        }
    }, [initialReference]);

    // Handle initial style reference (Style/Example)
    useEffect(() => {
        if (initialStyleReference) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const base64 = result.includes(',') ? result.split(',')[1] : result;
                const newItem: ReferenceItem = {
                    id: Date.now().toString(),
                    image: base64,
                    description: 'Referência de Estilo (Home Hub)'
                };
                setReferenceItems(prev => {
                    if (!prev.some(item => item.image === base64)) {
                        return [...prev, newItem];
                    }
                    return prev;
                });
            };
            reader.readAsDataURL(initialStyleReference);
        }
    }, [initialStyleReference]);

    // Handle initial secondary elements
    useEffect(() => {
        if (initialSecondaryElements && initialSecondaryElements.length > 0) {
            initialSecondaryElements.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    const base64 = result.includes(',') ? result.split(',')[1] : result;
                    setAssetImages(prev => {
                        if (!prev.includes(base64)) {
                            return [...prev, base64];
                        }
                        return prev;
                    });
                };
                reader.readAsDataURL(file);
            });
        }
    }, [initialSecondaryElements]);

    // Load Project History
    useEffect(() => {
        if (projectId) {
            const loadHistory = async () => {
                const history = await getProjectHistory(projectId);
                setLocalHistory(history);
            };
            loadHistory();
        } else {
            setLocalHistory([]);
        }
    }, [projectId]);

    // Inputs
    const [userImages, setUserImages] = useState<string[]>([]);
    const [referenceItems, setReferenceItems] = useState<ReferenceItem[]>([]);
    const [assetImages, setAssetImages] = useState<string[]>([]);


    const [position, setPosition] = useState<SubjectPosition>(SubjectPosition.RIGHT);
    const [attributes, setAttributes] = useState<GenerationAttributes>({ useGradient: true, useBlur: false });
    const [batchSize, setBatchSize] = useState<number>(1);

    // Project Context (New)
    const [projectContext, setProjectContext] = useState({
        floatingElements3D: false,
        floatingElementsDescription: ''
    });

    // InfoProduct Palette
    const [colorPalette, setColorPalette] = useState<ColorPalette>({
        primary: '',
        secondary: '',
        accent: ''
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
            }, 200);
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

    // Magic Eraser State
    const [isEraserActive, setIsEraserActive] = useState(false);
    const [isEraserDrawing, setIsEraserDrawing] = useState(false);
    const [eraserMask, setEraserMask] = useState<string | null>(null);
    const [eraserPrompt, setEraserPrompt] = useState('');

    // Local History & Merge
    const [localHistory, setLocalHistory] = useState<HistoryItem[]>([]);
    const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);

    // Auto-generate effect
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
        setLocalHistory(prev => [newItem, ...prev]);
        onAddToGlobalHistory(newItem);
    };

    const restoreFromHistory = (item: HistoryItem) => {
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
        setUserPrompt("Mesclar estas imagens em uma nova composição harmoniosa. [Adicione detalhes...]");
        setReferenceItems([]);
        setSelectedHistoryIds([]);
    };

    const getModeLabel = () => {
        switch (currentMode) {
            case 'HUMAN': return 'Pessoas (Sujeito)';
            case 'OBJECT': return 'Objeto/Produto';
            case 'ENHANCE': return 'Imagem Original';
            case 'INFOPRODUCT': return 'Expert (Infoproduto)';
            default: return 'Sujeito';
        }
    };

    const getUploadLabel = () => {
        switch (currentMode) {
            case 'HUMAN': return 'Fotos da Pessoa';
            case 'OBJECT': return 'Fotos do Objeto';
            case 'ENHANCE': return 'Imagem Base para Melhorar';
            case 'INFOPRODUCT': return 'Foto do Expert';
            default: return 'Imagens';
        }
    };

    const getUploadDesc = () => {
        switch (currentMode) {
            case 'HUMAN': return "Envie fotos para fidelidade facial.";
            case 'OBJECT': return "Envie fotos do produto em alta resolução.";
            case 'ENHANCE': return "A imagem original será mantida, mas enriquecida.";
            case 'INFOPRODUCT': return "O sistema melhorará pose/roupa se necessário, mantendo o rosto.";
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
                const variationNoise = batchSize > 1 ? ` (Variation ${i + 1}: slightly vary lighting details)` : "";
                const effectivePrompt = userPrompt + variationNoise;

                requests.push(
                    generateBackground(
                        section,
                        currentMode,
                        userImages,
                        referenceItems,
                        assetImages,
                        effectivePrompt,
                        position,
                        attributes,
                        customHeight,
                        currentMode === 'INFOPRODUCT' ? colorPalette : undefined,
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
        if (!generatedImage || !eraserMask) return;

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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn h-full overflow-hidden" style={{ display: isActive ? 'grid' : 'none' }}>

            {/* LEFT PANEL: CONTROLS (FIXED FOOTER LAYOUT) */}
            <div className="lg:col-span-4 h-full flex flex-col relative bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl border-r border-gray-200 dark:border-white/5 rounded-l-2xl overflow-hidden transition-colors duration-300">

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto pr-2 pb-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 p-6 space-y-6">

                    {/* Image Inputs */}
                    <div className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white/90">
                            <i className={`fas ${currentMode === 'HUMAN' ? 'fa-user' : currentMode === 'OBJECT' ? 'fa-cube' : currentMode === 'INFOPRODUCT' ? 'fa-chalkboard-teacher' : 'fa-wand-magic'} text-lime-600 dark:text-lime-400`}></i>
                            {getModeLabel()}
                        </h2>
                        <ImageUpload
                            label={getUploadLabel()}
                            value={userImages}
                            onChange={setUserImages}
                            multiple={true}
                            description={getUploadDesc()}
                        />

                        <ReferenceManager
                            items={referenceItems}
                            onChange={setReferenceItems}
                        />

                        <ImageUpload
                            label="Elementos Secundários (Opcional)"
                            value={assetImages}
                            onChange={setAssetImages}
                            multiple={true}
                            description="Objetos extras para compor o cenário"
                        />
                    </div>

                    {/* Configuration Panel */}
                    <div className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Configurações</h3>

                        {/* Project Context - 3D Elements */}
                        <div className="mb-6 p-4 bg-gray-100 dark:bg-black/30 rounded-xl border border-gray-200 dark:border-white/5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <i className="fas fa-cube text-lime-500"></i>
                                    Elementos Flutuantes 3D
                                </label>
                                <button
                                    onClick={() => setProjectContext(prev => ({ ...prev, floatingElements3D: !prev.floatingElements3D }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${projectContext.floatingElements3D ? 'bg-lime-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${projectContext.floatingElements3D ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
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
                                        placeholder="Ex: Ícones de vidro, partículas douradas, moedas..."
                                        value={projectContext.floatingElementsDescription}
                                        onChange={(e) => setProjectContext(prev => ({ ...prev, floatingElementsDescription: e.target.value }))}
                                        className="w-full bg-white dark:bg-black/40 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Posição do Sujeito</label>
                            <PositionSelector value={position} onChange={setPosition} />
                        </div>

                        {currentMode === 'INFOPRODUCT' && (
                            <div className="mb-6 space-y-3">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Paleta de Cores (Marca)</label>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Fundo (Predominante)</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Preto Luxo, Azul Marinho..."
                                        value={colorPalette.primary}
                                        onChange={(e) => setColorPalette(prev => ({ ...prev, primary: e.target.value }))}
                                        className="w-full bg-white dark:bg-black/40 border border-gray-300 dark:border-gray-700 rounded px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:border-lime-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Luz de Recorte (Profundidade)</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Dourado, Ciano, Branco Frio..."
                                        value={colorPalette.secondary}
                                        onChange={(e) => setColorPalette(prev => ({ ...prev, secondary: e.target.value }))}
                                        className="w-full bg-white dark:bg-black/40 border border-gray-300 dark:border-gray-700 rounded px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:border-lime-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Detalhes (Overlays/Partículas)</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Verde Neon, Laranja..."
                                        value={colorPalette.accent}
                                        onChange={(e) => setColorPalette(prev => ({ ...prev, accent: e.target.value }))}
                                        className="w-full bg-white dark:bg-black/40 border border-gray-300 dark:border-gray-700 rounded px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:border-lime-500 outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Attributes Toggles */}
                        <div className="mb-6 grid grid-cols-2 gap-3">
                            <button
                                onClick={() => toggleAttribute('useGradient')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${attributes.useGradient
                                    ? 'bg-lime-500/10 border-lime-500 text-lime-600 dark:text-lime-400'
                                    : 'bg-white dark:bg-black/40 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                                    } `}
                            >
                                <i className={`fas ${attributes.useGradient ? 'fa-check-square' : 'fa-square'} `}></i>
                                Degradê (Fade)
                            </button>
                            <button
                                onClick={() => toggleAttribute('useBlur')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${attributes.useBlur
                                    ? 'bg-lime-500/10 border-lime-500 text-lime-600 dark:text-lime-400'
                                    : 'bg-white dark:bg-black/40 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'
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
                                    className="w-full bg-gray-100 dark:bg-black/40 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-500 text-sm cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Altura (px)</label>
                                <input
                                    type="number"
                                    value={customHeight}
                                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                                    className="w-full bg-white dark:bg-black/40 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-lime-500 outline-none"
                                    min={500}
                                    max={2160}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {currentMode === 'ENHANCE' ? 'Instruções de Melhoria' : 'Prompt do Cenário'}
                            </label>
                            <textarea
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                                placeholder={
                                    currentMode === 'ENHANCE'
                                        ? "Descreva o que melhorar..."
                                        : currentMode === 'INFOPRODUCT'
                                            ? "Descreva o nicho (ex: Mentor financeiro, Curso de inglês) e a atmosfera desejada..."
                                            : "Descreva o cenário..."
                                }
                                className="w-full bg-white dark:bg-black/40 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition-all min-h-[100px]"
                            />
                        </div>
                    </div>

                    {/* Spacer to prevent content being hidden behind footer */}
                    <div className="h-48"></div>
                </div>

                {/* Sticky Footer */}
                <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 p-4 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                    {/* BATCH SELECTOR */}
                    <div className="flex items-center justify-between mb-4 px-1">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantidade:</span>
                        <div className="flex gap-3 bg-gray-100 dark:bg-black/40 p-1.5 rounded-xl border border-gray-300 dark:border-gray-700">
                            {[1, 2, 3, 4].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setBatchSize(num)}
                                    className={`w-10 h-10 rounded-lg text-base font-bold transition-all ${batchSize === num ? 'bg-lime-500 text-black shadow-lg scale-105' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'
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
                        className={`
w-full py-4 px-6 rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-2
transition-all duration-300 transform hover:scale-[1.01] active:scale-95
                        ${isGenerating || userImages.length === 0
                                ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-700'
                                : 'bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-white dark:text-gray-900 border border-lime-400'
                            }
`}
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

            {/* RIGHT PANEL: PREVIEW & HISTORY */}
            <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">

                {/* Main Preview */}
                <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-2xl p-1 shadow-2xl flex-grow relative overflow-hidden group mb-4 min-h-[400px]">
                    {generatedImage ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-gray-100 dark:bg-black/20 rounded-xl overflow-hidden p-4">
                            {/* Image Container with Aspect Ratio Enforcement */}
                            <div className="relative max-w-full max-h-full aspect-video shadow-2xl">
                                <img
                                    src={generatedImage}
                                    alt="Generated Background"
                                    className="w-full h-full object-cover rounded-lg"
                                />

                                {/* Magic Eraser Overlay - Inside the same container to match dimensions */}
                                {isEraserActive && (
                                    <div className="absolute inset-0 z-10 rounded-lg overflow-hidden">
                                        <MagicEraserCanvas
                                            imageUrl={generatedImage}
                                            width={1920}
                                            height={1080}
                                            onMaskChange={setEraserMask}
                                            isDrawingEnabled={true}
                                            brushSize={40}
                                            onDrawingStateChange={setIsEraserDrawing}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                <button
                                    onClick={() => setIsEraserActive(!isEraserActive)}
                                    className={`p-3 rounded-lg backdrop-blur-md border transition-colors ${isEraserActive
                                        ? 'bg-lime-500 text-black border-lime-500'
                                        : 'bg-white/80 dark:bg-black/60 text-gray-900 dark:text-white border-gray-200 dark:border-white/10 hover:bg-lime-500 hover:text-black'
                                        }`}
                                    title="Magic Eraser (Borracha Mágica)"
                                >
                                    <i className="fas fa-eraser"></i>
                                </button>
                                <button
                                    onClick={() => handleDownload(generatedImage)}
                                    className="bg-white/80 dark:bg-black/60 hover:bg-lime-500 hover:text-black text-gray-900 dark:text-white p-3 rounded-lg backdrop-blur-md border border-gray-200 dark:border-white/10 transition-colors"
                                    title="Baixar Imagem"
                                >
                                    <i className="fas fa-download"></i>
                                </button>
                            </div>

                            {/* Eraser Controls - Floating Bottom Bar */}
                            {isEraserActive && eraserMask && !isEraserDrawing && (
                                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md p-3 rounded-full flex items-center gap-4 border border-white/10 shadow-2xl z-30 animate-fadeIn">
                                    <div className="flex items-center gap-2 px-2 border-r border-white/10">
                                        <i className="fas fa-magic text-lime-500"></i>
                                        <span className="text-white text-xs font-bold uppercase hidden sm:inline">Magic Eraser</span>
                                    </div>

                                    <input
                                        type="text"
                                        value={eraserPrompt}
                                        onChange={(e) => setEraserPrompt(e.target.value)}
                                        placeholder="O que alterar? (Opcional)"
                                        className="bg-transparent border-none text-white text-sm placeholder-gray-400 focus:ring-0 w-48 outline-none"
                                    />

                                    <button
                                        onClick={handleInpaint}
                                        disabled={!eraserMask}
                                        className="bg-lime-500 hover:bg-lime-400 text-black font-bold py-2 px-4 rounded-full text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    >
                                        {eraserPrompt ? 'Substituir' : 'Apagar'}
                                    </button>

                                    <button
                                        onClick={() => setIsEraserActive(false)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            )}

                            {/* Batch Thumbnails Overlay */}
                            {generatedImages.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 p-2 bg-black/50 backdrop-blur-md rounded-xl z-10">
                                    {generatedImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setGeneratedImage(img);
                                                setSelectedImageIndex(idx);
                                            }}
                                            className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === idx ? 'border-lime-500 scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                                                }`}
                                        >
                                            <img src={img} alt={`Variation ${idx + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Validation Actions Overlay */}
                            {!isGenerating && !isEraserActive && (
                                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-4 shadow-2xl">
                                        <div className="flex-1 w-full">
                                            <input
                                                type="text"
                                                value={verticalPrompt}
                                                onChange={(e) => setVerticalPrompt(e.target.value)}
                                                placeholder="Prompt Vertical (Opcional)"
                                                className="w-full bg-transparent border-b border-gray-400 dark:border-gray-600 px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-lime-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 pl-4">
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-gray-500">H:</span>
                                                <input
                                                    type="number"
                                                    value={verticalHeight}
                                                    onChange={(e) => setVerticalHeight(Number(e.target.value))}
                                                    className="w-14 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs px-1 py-1 text-gray-900 dark:text-white text-center"
                                                />
                                            </div>
                                            <button
                                                onClick={handleValidateAndFormat}
                                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
                                            >
                                                <i className="fas fa-mobile-alt"></i> Formatar 9:16
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 bg-gray-50 dark:bg-black/20 rounded-xl">
                            {isGenerating ? (
                                <div className="text-center w-full max-w-md px-8">
                                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        <span>Renderizando com Gemini...</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-lime-500 to-emerald-500 transition-all duration-200 ease-out"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-4 animate-pulse">
                                        Criando detalhes e iluminação...
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center p-8">
                                    <i className={`fas ${currentMode === 'HUMAN' ? 'fa-user-circle' : currentMode === 'OBJECT' ? 'fa-cube' : currentMode === 'INFOPRODUCT' ? 'fa-chalkboard-teacher' : 'fa-wand-magic'} text-6xl mb-4 text-gray-300 dark:text-gray-800`}></i>
                                    <p className="text-xl font-medium text-gray-400 dark:text-gray-500">
                                        {currentMode === 'ENHANCE' ? 'Melhorar Imagem' : currentMode === 'INFOPRODUCT' ? 'Criar Infoproduto' : `Criar ${currentMode === 'HUMAN' ? 'Pessoa' : 'Objeto'} `}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Refinement Section */}
                {generatedImage && !isGenerating && (
                    <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-2xl p-4 shadow-lg animate-fadeIn mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex justify-between">
                            <span><i className="fas fa-sliders-h mr-2 text-lime-600 dark:text-lime-400"></i>Ajustes Finos</span>
                        </label>
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-2 items-start">
                                <div className="w-24">
                                    <ImageUpload
                                        label=""
                                        value={refineAssets}
                                        onChange={setRefineAssets}
                                        multiple={true}
                                        description=""
                                        compact={true}
                                    />
                                </div>
                                <div className="flex-1 flex gap-2">
                                    <input
                                        type="text"
                                        value={refinePrompt}
                                        onChange={(e) => setRefinePrompt(e.target.value)}
                                        placeholder="Ex: 'Deixe a luz mais quente'..."
                                        className="flex-1 bg-white dark:bg-black/40 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-lime-500 outline-none h-12 text-gray-900 dark:text-white"
                                        onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                                    />
                                    <button
                                        onClick={handleRefine}
                                        disabled={!refinePrompt}
                                        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 h-12 border border-gray-300 dark:border-gray-700"
                                    >
                                        Refinar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Local History Strip */}
                {localHistory.length > 0 && (
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-t-2xl p-4 flex flex-col mt-auto shadow-[0_-5px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <i className="fas fa-history"></i> Histórico da Aba
                            </h3>
                            {selectedHistoryIds.length > 0 && (
                                <button
                                    onClick={handleMerge}
                                    className="text-xs bg-lime-500 hover:bg-lime-400 text-black px-3 py-1 rounded font-bold transition-colors"
                                >
                                    <i className="fas fa-object-group mr-1"></i> Mesclar Selecionados ({selectedHistoryIds.length})
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 h-28 items-center">
                            {localHistory.map(item => {
                                const isSelected = selectedHistoryIds.includes(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        className={`relative flex-shrink-0 h-24 aspect-[16/9] rounded-lg overflow-hidden border-2 cursor-pointer transition-all group ${isSelected ? 'border-lime-500 ring-2 ring-lime-500/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'} `}
                                        onClick={() => restoreFromHistory(item)}
                                    >
                                        <img src={item.url} alt="Histórico" className="w-full h-full object-cover" />

                                        {/* Hover Info */}
                                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center p-2 text-center">
                                            <p className="text-[10px] text-gray-300 line-clamp-2 mb-1">{item.prompt || 'Sem prompt'}</p>
                                            <span className="text-[10px] text-lime-400 font-bold">Clique para Restaurar</span>
                                        </div>

                                        {/* Select Checkbox */}
                                        <div
                                            className="absolute top-1 left-1 z-10"
                                            onClick={(e) => { e.stopPropagation(); toggleHistorySelection(item.id); }}
                                        >
                                            <div className={`w-4 h-4 rounded border ${isSelected ? 'bg-lime-500 border-lime-500' : 'bg-white/50 dark:bg-black/50 border-gray-400'} flex items-center justify-center`}>
                                                {isSelected && <i className="fas fa-check text-[10px] text-black"></i>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setShowExportModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        >
                            <i className="fas fa-times"></i>
                        </button>

                        <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Exportar Imagem</h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Formato</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['png', 'jpeg', 'webp'].map((fmt) => (
                                        <button
                                            key={fmt}
                                            onClick={() => setExportFormat(fmt as any)}
                                            className={`py-2 px-4 rounded-lg border text-sm font-bold uppercase transition-all ${exportFormat === fmt
                                                ? 'bg-lime-500 text-black border-lime-500'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            {fmt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Qualidade: {Math.round(exportQuality * 100)}%</label>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1"
                                    step="0.1"
                                    value={exportQuality}
                                    onChange={(e) => setExportQuality(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-lime-500"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Baixa</span>
                                    <span>Alta</span>
                                </div>
                            </div>

                            <button
                                onClick={handleExport}
                                className="w-full bg-lime-500 hover:bg-lime-400 text-black font-bold py-3 rounded-xl transition-colors"
                            >
                                Baixar Agora
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeneratorWorkspace;