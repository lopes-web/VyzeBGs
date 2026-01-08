import React, { useState, useEffect } from 'react';
import { DesignCategory, CreativeText, TextAlignment, TypographyStyle, AspectRatioCreative, SubjectPosition, ReferenceItem } from '../types';
import { generateDesignAsset, generateCreative, refineCreative, checkApiKey } from '../services/geminiService';
import { useAuth } from './AuthContext';
import { uploadImageToStorage } from '../services/storageService';
import { saveGeneration, getProjectHistory } from '../services/databaseService';
import TextManager from './TextManager';
import DimensionSelector from './DimensionSelector';
import ReferenceManager from './ReferenceManager';
import ImageUpload from './ImageUpload';

interface DesignsWorkspaceProps {
    onAddToGlobalHistory: (item: any) => void;
    projectId?: string;
    initialCategory?: string;
}

const CATEGORIES: { id: DesignCategory; label: string; icon: string; description: string }[] = [
    { id: 'MOCKUPS', label: 'Mockups', icon: 'fa-mobile-alt', description: 'Dispositivos' },
    { id: 'ICONS', label: 'Icones 3D', icon: 'fa-gem', description: 'Icones 3D' },
    { id: 'PRODUCTS', label: 'Produtos', icon: 'fa-box', description: 'Embalagens' },
    { id: 'LOGOS', label: 'Logos', icon: 'fa-palette', description: 'Logos' },
    { id: 'CRIATIVOS', label: 'Criativos', icon: 'fa-paint-brush', description: 'Anuncios' },
    { id: 'PROFILE', label: 'Foto de Perfil', icon: 'fa-user-circle', description: 'Perfil 1:1' },
];

const DEVICE_OPTIONS = ['iPhone', 'MacBook', 'iPad', 'Android', 'Monitor'];
const ANGLE_OPTIONS = ['Frontal', 'Isometrico', 'Flutuante'];
const ICON_STYLES = ['Glassmorphism', 'Neon', 'Clay 3D', 'Gradiente'];
const PRODUCT_TYPES = ['Caixa', 'Frasco', 'Sacola', 'Embalagem', 'Bolsa'];
const LOGO_STYLES = ['Minimalista', 'Moderno', 'Vintage', 'Tech', 'Elegante'];
const BG_OPTIONS = [
    { label: 'Preto', value: '#000000' },
    { label: 'Branco', value: '#ffffff' },
    { label: 'Cinza Escuro', value: '#1a1a2e' },
    { label: 'Custom', value: 'custom' },
];

// Profile Options
const PROFILE_STYLES = ['Corporativo', 'Criativo', 'Minimalista', 'Elegante'];
const PROFILE_FRAMINGS = ['Close-up', 'Meio-busto', 'Ombros'];
const PROFILE_LIGHTINGS = ['Natural', 'Estúdio', 'Dramática'];

const DesignsWorkspace: React.FC<DesignsWorkspaceProps> = ({ onAddToGlobalHistory, projectId, initialCategory }) => {
    const { user } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState<DesignCategory>((initialCategory as DesignCategory) || 'MOCKUPS');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Local History
    const [localHistory, setLocalHistory] = useState<{ id: string; url: string; prompt?: string; timestamp: number }[]>([]);

    // Load history from Supabase on mount
    useEffect(() => {
        if (projectId) {
            getProjectHistory(projectId).then(history => {
                if (history && history.length > 0) {
                    setLocalHistory(history);
                }
            });
        }
    }, [projectId]);

    // Mockup inputs
    const [deviceType, setDeviceType] = useState('iPhone');
    const [screenImage, setScreenImage] = useState<string | null>(null);
    const [angle, setAngle] = useState('Frontal');
    const [mockupBgColor, setMockupBgColor] = useState('#1a1a2e');

    // Icon inputs
    const [iconDescription, setIconDescription] = useState('');
    const [iconStyle, setIconStyle] = useState<string | null>(null);
    const [iconColor, setIconColor] = useState('#6366f1');
    const [useIconColor, setUseIconColor] = useState(false);
    const [iconBgType, setIconBgType] = useState('#000000');
    const [iconBgCustom, setIconBgCustom] = useState('#1a1a2e');
    const [iconReferenceImage, setIconReferenceImage] = useState<string | null>(null);
    const [iconStyleReferences, setIconStyleReferences] = useState<string[]>([]);
    const [iconQuantity, setIconQuantity] = useState(1);

    // Product inputs
    const [productType, setProductType] = useState('Caixa');
    const [brandName, setBrandName] = useState('');
    const [niche, setNiche] = useState('');
    const [logoImage, setLogoImage] = useState<string | null>(null);
    const [productColors, setProductColors] = useState(['#000000', '#6366f1']);

    // Logo inputs
    const [logoName, setLogoName] = useState('');
    const [logoNiche, setLogoNiche] = useState('');
    const [logoStyle, setLogoStyle] = useState('Minimalista');
    const [logoColors, setLogoColors] = useState(['#000000', '#6366f1']);
    const [includeIcon, setIncludeIcon] = useState(true);

    // CRIATIVOS inputs
    const [creativeImages, setCreativeImages] = useState<string[]>([]);
    const [creativeText, setCreativeText] = useState<CreativeText>({
        includeText: true,
        headline: '',
        headlineColor: '#ffffff',
        subheadline: '',
        subheadlineColor: '#e5e7eb',
        cta: '',
        ctaColor: '#bef264',
        alignment: TextAlignment.CENTER,
        style: TypographyStyle.MODERN
    });
    const [aspectRatio, setAspectRatio] = useState<AspectRatioCreative>(AspectRatioCreative.PORTRAIT);
    const [creativePosition, setCreativePosition] = useState<SubjectPosition>(SubjectPosition.RIGHT);
    const [visualReferences, setVisualReferences] = useState<ReferenceItem[]>([]);
    const [textReferences, setTextReferences] = useState<ReferenceItem[]>([]);
    const [assetImages, setAssetImages] = useState<string[]>([]);
    const [creativePrompt, setCreativePrompt] = useState('');
    const [useMainColor, setUseMainColor] = useState(false);
    const [mainColor, setMainColor] = useState('#000000');
    const [useGradient, setUseGradient] = useState(true);
    const [creativeQuantity, setCreativeQuantity] = useState(1);

    // PROFILE inputs
    const [profileImages, setProfileImages] = useState<string[]>([]);
    const [profileReference, setProfileReference] = useState<string | null>(null);
    const [profileStyle, setProfileStyle] = useState('Corporativo');
    const [profileBgType, setProfileBgType] = useState<'auto' | 'solid' | 'gradient'>('auto');
    const [profileBgColor, setProfileBgColor] = useState('#1a1a2e');
    const [profileBgPrompt, setProfileBgPrompt] = useState('');
    const [profileFraming, setProfileFraming] = useState('Close-up');
    const [profileLighting, setProfileLighting] = useState('Estúdio');
    const [profileFixPosture, setProfileFixPosture] = useState(false);
    const [profileUltraMode, setProfileUltraMode] = useState(false);
    const [profilePrompt, setProfilePrompt] = useState('');
    const [profileQuantity, setProfileQuantity] = useState(1);

    // Refinement
    const [refinePrompt, setRefinePrompt] = useState('');
    const [isRefining, setIsRefining] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setter(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleMultiFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach((file: File) => {
                const reader = new FileReader();
                reader.onloadend = () => setter(prev => [...prev, reader.result as string]);
                reader.readAsDataURL(file);
            });
        }
    };

    const handleDownload = async () => {
        if (!generatedImage) return;
        try {
            const response = await fetch(generatedImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${selectedCategory.toLowerCase()}_${Date.now()}.webp`;
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
        } catch (e) {
            console.error('Download failed', e);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const hasKey = await checkApiKey();
            if (!hasKey) {
                setError('API Key nao configurada.');
                setIsGenerating(false);
                return;
            }

            let result: { image: string; finalPrompt: string };

            if (selectedCategory === 'CRIATIVOS') {
                if (creativeImages.length === 0) {
                    setError('Envie pelo menos uma imagem principal.');
                    setIsGenerating(false);
                    return;
                }

                // Generate multiple creatives in parallel
                if (creativeQuantity > 1) {
                    setGeneratedImages([]);
                    const promises = Array(creativeQuantity).fill(null).map(() =>
                        generateCreative(
                            creativeImages,
                            visualReferences,
                            textReferences,
                            assetImages,
                            creativeText,
                            creativePrompt,
                            creativePosition,
                            { useGradient, useBlur: false, useMainColor, mainColor },
                            aspectRatio
                        )
                    );
                    const results = await Promise.all(promises);
                    const images = results.map(r => r.image);
                    setGeneratedImages(images);
                    setGeneratedImage(images[0]);

                    // Save all to Supabase
                    if (user) {
                        for (const img of images) {
                            const publicUrl = await uploadImageToStorage(img, user.id);
                            if (publicUrl) {
                                await saveGeneration(user.id, publicUrl, results[0].finalPrompt, 'HUMAN', 'DESIGNS', projectId);
                                const historyItem = {
                                    id: Date.now().toString() + Math.random(),
                                    url: publicUrl,
                                    prompt: results[0].finalPrompt,
                                    timestamp: Date.now(),
                                    mode: 'HUMAN' as const,
                                    section: 'DESIGNS' as const,
                                    projectId: projectId
                                };
                                setLocalHistory(prev => [historyItem, ...prev]);
                                onAddToGlobalHistory(historyItem);
                            }
                        }
                    }
                    setIsGenerating(false);
                    return;
                }

                result = await generateCreative(
                    creativeImages,
                    visualReferences,
                    textReferences,
                    assetImages,
                    creativeText,
                    creativePrompt,
                    creativePosition,
                    { useGradient, useBlur: false, useMainColor, mainColor },
                    aspectRatio
                );
            } else {
                let inputs: any = {};
                switch (selectedCategory) {
                    case 'MOCKUPS':
                        inputs = { deviceType, screenImage, angle, bgColor: mockupBgColor };
                        break;
                    case 'ICONS':
                        inputs = { iconDescription, iconStyle, iconColor: useIconColor ? iconColor : null, bgColor: iconBgType === 'custom' ? iconBgCustom : iconBgType, iconReferenceImage, iconStyleReferences };

                        // Generate multiple icons in parallel
                        if (iconQuantity > 1) {
                            setGeneratedImages([]);
                            const promises = Array(iconQuantity).fill(null).map(() =>
                                generateDesignAsset('ICONS', inputs)
                            );
                            const results = await Promise.all(promises);
                            const images = results.map(r => r.image);
                            setGeneratedImages(images);
                            setGeneratedImage(images[0]);

                            // Save all to Supabase
                            if (user) {
                                for (const img of images) {
                                    const publicUrl = await uploadImageToStorage(img, user.id);
                                    if (publicUrl) {
                                        await saveGeneration(user.id, publicUrl, results[0].finalPrompt, 'OBJECT', 'DESIGNS', projectId);
                                        const historyItem = {
                                            id: Date.now().toString() + Math.random(),
                                            url: publicUrl,
                                            prompt: results[0].finalPrompt,
                                            timestamp: Date.now(),
                                            mode: 'OBJECT' as const,
                                            section: 'DESIGNS' as const,
                                            projectId: projectId
                                        };
                                        setLocalHistory(prev => [historyItem, ...prev]);
                                        onAddToGlobalHistory(historyItem);
                                    }
                                }
                            }
                            setIsGenerating(false);
                            return;
                        }
                        break;
                    case 'PRODUCTS':
                        inputs = { productType, brandName, niche, logoImage, productColors };
                        break;
                    case 'LOGOS':
                        inputs = { logoName, logoNiche, logoStyle, logoColors, includeIcon };
                        break;
                    case 'PROFILE':
                        if (profileImages.length === 0) {
                            setError('Envie pelo menos uma foto para gerar o perfil.');
                            setIsGenerating(false);
                            return;
                        }
                        inputs = {
                            profileImages,
                            profileReference,
                            style: profileStyle,
                            bgType: profileBgType,
                            bgColor: profileBgColor,
                            bgPrompt: profileBgPrompt,
                            framing: profileFraming,
                            lighting: profileLighting,
                            fixPosture: profileFixPosture,
                            ultraMode: profileUltraMode,
                            additionalPrompt: profilePrompt
                        };

                        // Generate multiple images in parallel
                        if (profileQuantity > 1) {
                            setGeneratedImages([]);
                            const promises = Array(profileQuantity).fill(null).map(() =>
                                generateDesignAsset('PROFILE', inputs)
                            );
                            const results = await Promise.all(promises);
                            const images = results.map(r => r.image);
                            setGeneratedImages(images);
                            setGeneratedImage(images[0]);

                            // Save all to Supabase
                            if (user) {
                                for (const img of images) {
                                    const publicUrl = await uploadImageToStorage(img, user.id);
                                    if (publicUrl) {
                                        await saveGeneration(user.id, publicUrl, results[0].finalPrompt, 'OBJECT', 'DESIGNS', projectId);
                                        const historyItem = {
                                            id: Date.now().toString() + Math.random(),
                                            url: publicUrl,
                                            prompt: results[0].finalPrompt,
                                            timestamp: Date.now(),
                                            mode: 'OBJECT' as const,
                                            section: 'DESIGNS' as const,
                                            projectId: projectId
                                        };
                                        setLocalHistory(prev => [historyItem, ...prev]);
                                        onAddToGlobalHistory(historyItem);
                                    }
                                }
                            }
                            setIsGenerating(false);
                            return;
                        }
                        break;
                }
                result = await generateDesignAsset(selectedCategory, inputs);
            }

            setGeneratedImage(result.image);

            // Save to Supabase
            let savedUrl = result.image;
            if (user) {
                const publicUrl = await uploadImageToStorage(result.image, user.id);
                if (publicUrl) {
                    savedUrl = publicUrl;
                    await saveGeneration(user.id, publicUrl, result.finalPrompt, 'OBJECT', 'DESIGNS', projectId);
                }
            }

            const historyItem = {
                id: Date.now().toString(),
                url: savedUrl,
                prompt: result.finalPrompt,
                timestamp: Date.now(),
                mode: 'OBJECT' as const,
                section: 'DESIGNS' as const
            };
            setLocalHistory(prev => [historyItem, ...prev]);
            onAddToGlobalHistory(historyItem);
        } catch (err: any) {
            setError(err.message || 'Erro ao gerar asset.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRefine = async () => {
        if (!generatedImage || !refinePrompt) return;
        setIsRefining(true);
        setError(null);
        try {
            const refined = await refineCreative(generatedImage, refinePrompt);
            setGeneratedImage(refined);
            setRefinePrompt('');

            // Save to Supabase
            let savedUrl = refined;
            if (user) {
                const publicUrl = await uploadImageToStorage(refined, user.id);
                if (publicUrl) {
                    savedUrl = publicUrl;
                    await saveGeneration(user.id, publicUrl, `Ajuste: ${refinePrompt}`, 'OBJECT', 'DESIGNS', projectId);
                }
            }

            const historyItem = {
                id: Date.now().toString(),
                url: savedUrl,
                prompt: `Ajuste: ${refinePrompt}`,
                timestamp: Date.now(),
                mode: 'OBJECT' as const,
                section: 'DESIGNS' as const
            };
            setLocalHistory(prev => [historyItem, ...prev]);
            onAddToGlobalHistory(historyItem);
        } catch (err: any) {
            setError(err.message || 'Erro ao refinar.');
        } finally {
            setIsRefining(false);
        }
    };

    const renderCategoryInputs = () => {
        switch (selectedCategory) {
            case 'MOCKUPS':
                return (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dispositivo</label>
                            <div className="grid grid-cols-5 gap-2">
                                {DEVICE_OPTIONS.map(device => (
                                    <button key={device} onClick={() => setDeviceType(device)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${deviceType === device ? 'bg-accent text-black' : 'bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                        {device}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagem da Tela (Opcional)</label>
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setScreenImage)}
                                className="w-full bg-gray-100 dark:bg-[#171717] border border-gray-200 dark:border-[#2E2E2E] rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Angulo</label>
                            <div className="flex gap-2">
                                {ANGLE_OPTIONS.map(a => (
                                    <button key={a} onClick={() => setAngle(a)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${angle === a ? 'bg-accent text-black' : 'bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                        {a}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cor de Fundo</label>
                            <div className="flex gap-2 items-center">
                                <input type="color" value={mockupBgColor} onChange={(e) => setMockupBgColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                                <input type="text" value={mockupBgColor} onChange={(e) => setMockupBgColor(e.target.value)} className="flex-1 bg-gray-100 dark:bg-[#171717] border border-gray-200 dark:border-[#2E2E2E] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white" />
                            </div>
                        </div>
                    </div>
                );

            case 'ICONS':
                return (
                    <div className="space-y-5">
                        {/* Upload de Ícone/Logo de Referência */}
                        <ImageUpload
                            label="Upload de Ícone/Logo (Opcional)"
                            value={iconReferenceImage}
                            onChange={setIconReferenceImage}
                            description="Envie um ícone ou logo para transformar"
                        />

                        {/* Divisor OU */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-600"></div>
                            <span className="text-xs text-gray-500 uppercase">ou descreva</span>
                            <div className="flex-1 h-px bg-gray-600"></div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descricao do Icone {!iconReferenceImage && '*'}</label>
                            <input type="text" value={iconDescription} onChange={(e) => setIconDescription(e.target.value)}
                                placeholder="Ex: foguete, dinheiro, coracao..."
                                className="w-full bg-gray-100 dark:bg-[#171717] border border-gray-200 dark:border-[#2E2E2E] rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500" />
                        </div>

                        {/* Estilo Predefinido (Opcional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estilo (Opcional)</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setIconStyle(null)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${iconStyle === null ? 'bg-gray-500 text-white' : 'bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                    Nenhum
                                </button>
                                {ICON_STYLES.map(style => (
                                    <button key={style} onClick={() => setIconStyle(style)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${iconStyle === style ? 'bg-accent text-black' : 'bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Upload de Referência de Estilo - usando ReferenceManager */}
                        <ReferenceManager
                            items={iconStyleReferences.map((ref, idx) => ({ id: `ref-${idx}`, image: ref, description: '' }))}
                            onChange={(newItems) => setIconStyleReferences(newItems.map(item => item.image))}
                            label="Referências de Estilo"
                            description="Envie múltiplas referências. Arraste para adicionar ou use as setas para reordenar a prioridade."
                        />

                        {/* Cor do Ícone (Opcional) */}
                        <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#171717', border: '1px solid #2E2E2E' }}>
                            <div className="flex items-center gap-2">
                                <i className="fas fa-tint text-accent"></i>
                                <span className="text-sm text-gray-700 dark:text-gray-300">Cor do Ícone</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {useIconColor && <input type="color" value={iconColor} onChange={(e) => setIconColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />}
                                <button onClick={() => setUseIconColor(!useIconColor)}
                                    className={`relative h-5 w-9 rounded-full transition-colors ${useIconColor ? 'bg-accent' : 'bg-gray-600'}`}>
                                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${useIconColor ? 'left-[18px]' : 'left-0.5'}`} />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cor de Fundo</label>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                {BG_OPTIONS.map(opt => (
                                    <button key={opt.value} onClick={() => setIconBgType(opt.value)}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${iconBgType === opt.value ? 'bg-accent text-black' : 'bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            {iconBgType === 'custom' && (
                                <input type="color" value={iconBgCustom} onChange={(e) => setIconBgCustom(e.target.value)} className="w-10 h-10 rounded cursor-pointer mt-2" />
                            )}
                        </div>
                    </div>
                );

            case 'PRODUCTS':
                return (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Produto</label>
                            <div className="grid grid-cols-3 gap-2">
                                {PRODUCT_TYPES.map(type => (
                                    <button key={type} onClick={() => setProductType(type)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${productType === type ? 'bg-accent text-black' : 'bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome/Marca</label>
                            <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)}
                                placeholder="Ex: VyzeSupplements" className="w-full bg-gray-100 dark:bg-[#171717] border border-gray-200 dark:border-[#2E2E2E] rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nicho</label>
                            <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)}
                                placeholder="Ex: cosmeticos, suplementos..." className="w-full bg-gray-100 dark:bg-[#171717] border border-gray-200 dark:border-[#2E2E2E] rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo (Opcional)</label>
                            {logoImage ? (
                                <div className="relative group">
                                    <img src={logoImage} alt="Logo" className="w-full h-24 object-contain bg-gray-100 dark:bg-[#171717] rounded-lg border border-gray-200 dark:border-[#2E2E2E]" />
                                    <button onClick={() => setLogoImage(null)} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <div className="flex flex-col items-center justify-center">
                                        <i className="fas fa-cloud-upload-alt text-gray-400 text-xl mb-1"></i>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Clique para upload</span>
                                    </div>
                                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setLogoImage)} className="hidden" />
                                </label>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cores</label>
                            <div className="flex gap-2">
                                {productColors.map((color, i) => (
                                    <input key={i} type="color" value={color} onChange={(e) => {
                                        const newColors = [...productColors]; newColors[i] = e.target.value; setProductColors(newColors);
                                    }} className="w-10 h-10 rounded cursor-pointer" />
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'LOGOS':
                return (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome da Marca *</label>
                            <input type="text" value={logoName} onChange={(e) => setLogoName(e.target.value)}
                                placeholder="Ex: VyzeBG" className="w-full bg-gray-100 dark:bg-[#171717] border border-gray-200 dark:border-[#2E2E2E] rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nicho *</label>
                            <input type="text" value={logoNiche} onChange={(e) => setLogoNiche(e.target.value)}
                                placeholder="Ex: tecnologia, fitness..." className="w-full bg-gray-100 dark:bg-[#171717] border border-gray-200 dark:border-[#2E2E2E] rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estilo</label>
                            <div className="grid grid-cols-3 gap-2">
                                {LOGO_STYLES.map(style => (
                                    <button key={style} onClick={() => setLogoStyle(style)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${logoStyle === style ? 'bg-accent text-black' : 'bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cores</label>
                            <div className="flex gap-2">
                                {logoColors.map((color, i) => (
                                    <input key={i} type="color" value={color} onChange={(e) => {
                                        const newColors = [...logoColors]; newColors[i] = e.target.value; setLogoColors(newColors);
                                    }} className="w-10 h-10 rounded cursor-pointer" />
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIncludeIcon(!includeIcon)}
                                className={`relative h-5 w-9 rounded-full transition-colors ${includeIcon ? 'bg-accent' : 'bg-gray-600'}`}>
                                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${includeIcon ? 'left-[18px]' : 'left-0.5'}`} />
                            </button>
                            <span className="text-sm text-gray-700 dark:text-gray-300">Incluir Icone</span>
                        </div>
                    </div>
                );

            case 'CRIATIVOS':
                return (
                    <div className="space-y-6">
                        {/* Dimension Selector */}
                        <DimensionSelector value={aspectRatio} onChange={setAspectRatio} />

                        {/* Subject Images */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <i className="fas fa-user text-accent mr-2"></i>Imagem Principal *
                            </label>
                            {creativeImages.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {creativeImages.map((img, i) => (
                                        <div key={i} className="relative group">
                                            <img src={img} alt="Subject" className="w-full h-20 object-cover rounded-lg" />
                                            <button onClick={() => setCreativeImages(prev => prev.filter((_, idx) => idx !== i))}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ))}
                                    <label className="flex items-center justify-center h-20 border-2 border-dashed rounded-lg cursor-pointer hover:border-[#3E3E3E]" style={{ borderColor: '#2E2E2E' }}>
                                        <i className="fas fa-plus text-gray-400"></i>
                                        <input type="file" accept="image/*" multiple onChange={(e) => handleMultiFileUpload(e, setCreativeImages)} className="hidden" />
                                    </label>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:border-[#3E3E3E]" style={{ backgroundColor: '#171717', borderColor: '#2E2E2E' }}>
                                    <i className="fas fa-cloud-upload-alt text-gray-400 text-2xl mb-2"></i>
                                    <span className="text-sm text-gray-500">Foto da pessoa ou produto</span>
                                    <input type="file" accept="image/*" multiple onChange={(e) => handleMultiFileUpload(e, setCreativeImages)} className="hidden" />
                                </label>
                            )}
                        </div>

                        {/* Visual References */}
                        <ReferenceManager
                            items={visualReferences}
                            onChange={setVisualReferences}
                            label="Referencias de Estilo Visual"
                            description="Imagens para inspirar cor, luz e ambiente"
                        />

                        {/* Position */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Posicao do Sujeito</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: SubjectPosition.LEFT, label: 'Esquerda', icon: 'fa-arrow-left' },
                                    { id: SubjectPosition.CENTER, label: 'Centro', icon: 'fa-arrows-alt-h' },
                                    { id: SubjectPosition.RIGHT, label: 'Direita', icon: 'fa-arrow-right' },
                                ].map(pos => (
                                    <button key={pos.id} onClick={() => setCreativePosition(pos.id)}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${creativePosition === pos.id ? 'bg-accent text-black' : 'bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                        <i className={`fas ${pos.icon}`}></i>{pos.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Text Manager */}
                        <div className="rounded-2xl p-4" style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}>
                            <TextManager text={creativeText} onChange={setCreativeText} />
                        </div>

                        {/* Color Control */}
                        <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#171717', border: '1px solid #2E2E2E' }}>
                            <div className="flex items-center gap-2">
                                <i className="fas fa-palette text-accent"></i>
                                <span className="text-sm text-gray-700 dark:text-gray-300">Cor Dominante</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {useMainColor && <input type="color" value={mainColor} onChange={(e) => setMainColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />}
                                <button onClick={() => setUseMainColor(!useMainColor)}
                                    className={`relative h-5 w-9 rounded-full transition-colors ${useMainColor ? 'bg-accent' : 'bg-gray-600'}`}>
                                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${useMainColor ? 'left-[18px]' : 'left-0.5'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Additional Prompt */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descricao Adicional</label>
                            <textarea value={creativePrompt} onChange={(e) => setCreativePrompt(e.target.value)}
                                placeholder="Descreva o cenario ou contexto adicional..."
                                className="w-full bg-gray-100 dark:bg-[#171717] border border-gray-200 dark:border-[#2E2E2E] rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 h-20" />
                        </div>
                    </div>
                );

            case 'PROFILE':
                return (
                    <div className="space-y-5">
                        {/* Upload de Fotos */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <i className="fas fa-camera text-accent mr-2"></i>Suas Fotos *
                            </label>
                            {profileImages.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                    {profileImages.map((img, idx) => (
                                        <div key={idx} className="relative group aspect-square">
                                            <img src={img} alt={`Profile ${idx}`} className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-[#2E2E2E]" />
                                            <button onClick={() => setProfileImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ))}
                                    <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-[#171717] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <i className="fas fa-plus text-gray-400 text-lg"></i>
                                        <input type="file" accept="image/*" multiple onChange={(e) => handleMultiFileUpload(e, setProfileImages)} className="hidden" />
                                    </label>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer bg-gray-50 dark:bg-[#171717] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <i className="fas fa-cloud-upload-alt text-gray-400 text-2xl mb-2"></i>
                                    <span className="text-sm text-gray-500">Clique para upload (múltiplas)</span>
                                    <input type="file" accept="image/*" multiple onChange={(e) => handleMultiFileUpload(e, setProfileImages)} className="hidden" />
                                </label>
                            )}
                        </div>

                        {/* Referência de Estilo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <i className="fas fa-palette text-accent mr-2"></i>Referência de Estilo (Opcional)
                            </label>
                            {profileReference ? (
                                <div className="relative group">
                                    <img src={profileReference} alt="Reference" className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-[#2E2E2E]" />
                                    <button onClick={() => setProfileReference(null)} className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-[#171717] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <i className="fas fa-image text-gray-400 text-lg mb-1"></i>
                                    <span className="text-xs text-gray-500">Estilo de referência</span>
                                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setProfileReference)} className="hidden" />
                                </label>
                            )}
                        </div>

                        {/* Estilo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estilo</label>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <button onClick={() => setProfileStyle(null)}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${!profileStyle ? 'bg-accent text-black' : 'bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                    Nenhum
                                </button>
                                {PROFILE_STYLES.map(style => (
                                    <button key={style} onClick={() => setProfileStyle(profileStyle === style ? null : style)}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${profileStyle === style ? 'bg-accent text-black' : 'bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                        {style}
                                    </button>
                                ))}
                            </div>

                            {/* Corrigir Postura */}
                            {/* Corrigir Postura */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-[#171717] border border-gray-200 dark:border-[#2E2E2E]">
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-child text-accent"></i>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">Corrigir Postura</span>
                                        <span className="text-xs text-gray-500">Ajustar postura para profissional</span>
                                    </div>
                                </div>
                                <button onClick={() => setProfileFixPosture(!profileFixPosture)}
                                    className={`relative h-5 w-9 rounded-full transition-colors ${profileFixPosture ? 'bg-accent' : 'bg-gray-600'}`}>
                                    <span className={`block h-3 w-3 rounded-full bg-white transform transition-transform ${profileFixPosture ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* Ultra Mode */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-[#171717] border border-gray-200 dark:border-[#2E2E2E] mt-2">
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-bolt text-accent"></i>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">Ultra Mode</span>
                                        <span className="text-xs text-gray-500">Análise fenotípica avançada</span>
                                    </div>
                                </div>
                                <button onClick={() => setProfileUltraMode(!profileUltraMode)}
                                    className={`relative h-5 w-9 rounded-full transition-colors ${profileUltraMode ? 'bg-accent' : 'bg-gray-600'}`}>
                                    <span className={`block h-3 w-3 rounded-full bg-white transform transition-transform ${profileUltraMode ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Fundo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fundo</label>
                            <div className="flex gap-2 mb-3">
                                <button onClick={() => setProfileBgType('auto')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${profileBgType === 'auto' ? 'bg-accent text-black' : 'bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300'}`}>
                                    IA Decide
                                </button>
                                <button onClick={() => setProfileBgType('solid')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${profileBgType === 'solid' ? 'bg-accent text-black' : 'bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300'}`}>
                                    Sólido
                                </button>
                                <button onClick={() => setProfileBgType('gradient')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${profileBgType === 'gradient' ? 'bg-accent text-black' : 'bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300'}`}>
                                    Gradiente
                                </button>
                            </div>
                            {profileBgType !== 'auto' && (
                                <div className="flex gap-2 items-center mb-3">
                                    <input type="color" value={profileBgColor} onChange={(e) => setProfileBgColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                                    <input type="text" value={profileBgColor} onChange={(e) => setProfileBgColor(e.target.value)} className="flex-1 bg-gray-100 dark:bg-[#171717] border border-gray-200 dark:border-[#2E2E2E] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white" />
                                </div>
                            )}
                            <input
                                type="text"
                                value={profileBgPrompt}
                                onChange={(e) => setProfileBgPrompt(e.target.value)}
                                placeholder="Descreva o fundo (ex: escritório moderno, estúdio, natureza...)"
                                className="w-full bg-gray-100 dark:bg-[#171717] border border-gray-200 dark:border-[#2E2E2E] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500"
                            />
                        </div>

                        {/* Enquadramento */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enquadramento</label>
                            <div className="flex gap-2">
                                {PROFILE_FRAMINGS.map(f => (
                                    <button key={f} onClick={() => setProfileFraming(f)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${profileFraming === f ? 'bg-accent text-black' : 'bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300'}`}>
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Iluminação */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Iluminação</label>
                            <div className="flex gap-2">
                                {PROFILE_LIGHTINGS.map(l => (
                                    <button key={l} onClick={() => setProfileLighting(l)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${profileLighting === l ? 'bg-accent text-black' : 'bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300'}`}>
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Corrigir Postura */}
                        <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-[#171717] rounded-lg">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Corrigir Postura</span>
                            <button onClick={() => setProfileFixPosture(!profileFixPosture)}
                                className={`relative h-5 w-9 rounded-full transition-colors ${profileFixPosture ? 'bg-accent' : 'bg-gray-600'}`}>
                                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${profileFixPosture ? 'left-[18px]' : 'left-0.5'}`} />
                            </button>
                        </div>

                        {/* Prompt Adicional */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instruções Adicionais (Opcional)</label>
                            <textarea value={profilePrompt} onChange={(e) => setProfilePrompt(e.target.value)}
                                placeholder="Ex: sorrindo, olhando para a câmera..."
                                className="w-full bg-gray-100 dark:bg-[#171717] border border-gray-200 dark:border-[#2E2E2E] rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 h-20" />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn h-full overflow-hidden">

            {/* LEFT PANEL: CONTROLS */}
            <div className="lg:col-span-4 h-full flex flex-col relative rounded-l-2xl overflow-hidden transition-colors duration-300" style={{ backgroundColor: '#1F1F1F', borderRight: '1px solid #2E2E2E' }}>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto pr-2 pb-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 p-6 space-y-6">

                    {/* Category Selector */}
                    <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}>
                        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white/90">
                            <i className="fas fa-layer-group text-accent-dark dark:text-accent-light"></i>
                            Tipo de Asset
                        </h2>
                        <div className="grid grid-cols-6 gap-2">
                            {CATEGORIES.map(cat => (
                                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                                    className={`flex flex-col items-center p-3 rounded-xl border transition-all ${selectedCategory === cat.id
                                        ? 'text-white'
                                        : 'text-gray-400 hover:text-white'}`}
                                    style={{
                                        backgroundColor: selectedCategory === cat.id ? 'rgba(0, 192, 135, 0.1)' : '#171717',
                                        borderColor: selectedCategory === cat.id ? '#00C087' : '#2E2E2E'
                                    }}>
                                    <i className={`fas ${cat.icon} text-lg mb-1`}></i>
                                    <span className="text-xs font-medium">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Inputs */}
                    <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}>
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Configuracoes</h3>
                        {renderCategoryInputs()}
                    </div>
                </div>

                {/* Fixed Footer: Generate Button */}
                <div className="p-4 space-y-3" style={{ borderTop: '1px solid #2E2E2E', backgroundColor: '#1F1F1F' }}>
                    {(selectedCategory === 'PROFILE' || selectedCategory === 'ICONS' || selectedCategory === 'CRIATIVOS') && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Quantidade:</span>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4].map(n => (
                                    <button key={n} onClick={() => {
                                        if (selectedCategory === 'PROFILE') setProfileQuantity(n);
                                        else if (selectedCategory === 'ICONS') setIconQuantity(n);
                                        else setCreativeQuantity(n);
                                    }}
                                        className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${(selectedCategory === 'PROFILE' ? profileQuantity : selectedCategory === 'ICONS' ? iconQuantity : creativeQuantity) === n
                                            ? 'bg-accent text-black'
                                            : 'bg-[#171717] text-gray-400 border border-[#2E2E2E] hover:border-accent/50'}`}>
                                        {n}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <button onClick={handleGenerate} disabled={isGenerating}
                        className="w-full text-black font-bold py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                        style={{ backgroundColor: '#00C087' }}>
                        {isGenerating ? <><i className="fas fa-spinner fa-spin"></i> Gerando...</> : <><i className="fas fa-magic"></i> Gerar</>}
                    </button>
                </div>
            </div>

            {/* RIGHT PANEL: PREVIEW & HISTORY */}
            <div className="lg:col-span-8 h-full flex flex-col relative overflow-hidden">

                {/* Main Preview Area */}
                <div className="flex-1 flex items-center justify-center p-8 relative rounded-r-2xl" style={{ backgroundColor: '#171717' }}>
                    {error && (
                        <div className="text-red-500 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl p-4">
                            <i className="fas fa-exclamation-circle mr-2"></i>{error}
                        </div>
                    )}
                    {!generatedImage && !error && !isGenerating && (
                        <div className="text-center text-gray-400">
                            <i className="fas fa-image text-6xl mb-4 opacity-20"></i>
                            <p>Sua criacao aparecera aqui</p>
                        </div>
                    )}
                    {isGenerating && (
                        <div className="text-center text-gray-400">
                            <i className="fas fa-spinner fa-spin text-4xl mb-4 text-accent"></i>
                            <p>Gerando...</p>
                        </div>
                    )}
                    {generatedImages.length > 1 ? (
                        <div className="grid grid-cols-2 gap-4 max-w-2xl">
                            {generatedImages.map((img, idx) => (
                                <div key={idx} className="relative group">
                                    <img src={img} alt={`Generated ${idx + 1}`} className="w-full rounded-xl shadow-2xl" />
                                    <a href={img} download={`profile-${idx + 1}.png`}
                                        className="absolute top-2 right-2 bg-accent hover:bg-accent-light text-black font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        <i className="fas fa-download"></i>
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : generatedImage && (
                        <div className="relative group">
                            <img src={generatedImage} alt="Generated" className="max-h-[55vh] max-w-full rounded-xl shadow-2xl" />
                            <button onClick={handleDownload}
                                className="absolute top-4 right-4 bg-accent hover:bg-accent-light text-black font-bold px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <i className="fas fa-download"></i> Download
                            </button>
                        </div>
                    )}
                </div>

                {/* Refine Section (for CRIATIVOS) */}
                {generatedImage && selectedCategory === 'CRIATIVOS' && (
                    <div className="p-4 bg-white/60 dark:bg-app-dark-lighter border-t border-gray-200 dark:border-white/5">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={refinePrompt}
                                onChange={(e) => setRefinePrompt(e.target.value)}
                                placeholder="Ajuste: 'Mude a cor do texto', 'Adicione mais brilho'..."
                                className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white"
                                onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                            />
                            <button onClick={handleRefine} disabled={isRefining || !refinePrompt}
                                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg text-sm font-medium disabled:opacity-50">
                                {isRefining ? <i className="fas fa-spinner fa-spin"></i> : 'Refinar'}
                            </button>
                        </div>
                    </div>
                )}

                {/* History Strip */}
                <div className="h-28 p-3 overflow-x-auto flex gap-3 scrollbar-thin" style={{ backgroundColor: '#1F1F1F', borderTop: '1px solid #2E2E2E' }}>
                    {localHistory.length === 0 ? (
                        <div className="w-full flex items-center justify-center text-xs text-gray-400">
                            Historico vazio
                        </div>
                    ) : (
                        localHistory.map((item) => (
                            <div
                                key={item.id}
                                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all group ${generatedImage === item.url ? 'border-accent ring-2 ring-accent/30' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
                                onClick={() => setGeneratedImage(item.url)}
                            >
                                <img src={item.url} alt="History" className="w-full h-full object-cover" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default DesignsWorkspace;

