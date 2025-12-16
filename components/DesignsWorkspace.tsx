import React, { useState, useEffect } from 'react';
import { DesignCategory } from '../types';
import { generateDesignAsset } from '../services/geminiService';
import { checkApiKey } from '../services/geminiService';
import { useAuth } from './AuthContext';
import { uploadImageToStorage } from '../services/storageService';
import { saveGeneration, getProjectHistory } from '../services/databaseService';

interface DesignsWorkspaceProps {
    onAddToGlobalHistory: (item: any) => void;
    projectId?: string;
    initialCategory?: string;
}

const CATEGORIES: { id: DesignCategory; label: string; icon: string; description: string }[] = [
    { id: 'MOCKUPS', label: 'Mockups', icon: 'fa-mobile-alt', description: 'Dispositivos com tela personalizavel' },
    { id: 'ICONS', label: 'Icones 3D', icon: 'fa-gem', description: 'Icones estilizados em 3D' },
    { id: 'PRODUCTS', label: 'Produtos', icon: 'fa-box', description: 'Embalagens e produtos' },
    { id: 'LOGOS', label: 'Logos', icon: 'fa-palette', description: 'Sugestoes de logos' },
];

const DEVICE_OPTIONS = ['iPhone', 'MacBook', 'iPad', 'Android', 'Monitor'];
const ANGLE_OPTIONS = ['Frontal', 'Isometrico', 'Flutuante'];
const ICON_STYLES = ['Glassmorphism', 'Neon', 'Clay 3D', 'Gradiente'];
const PRODUCT_TYPES = ['Caixa', 'Frasco', 'Sacola', 'Embalagem', 'Bolsa'];
const LOGO_STYLES = ['Minimalista', 'Moderno', 'Vintage', 'Tech', 'Elegante'];
const BG_OPTIONS = [
    { label: 'Transparente', value: 'transparent' },
    { label: 'Preto', value: '#000000' },
    { label: 'Branco', value: '#ffffff' },
    { label: 'Cinza Escuro', value: '#1a1a2e' },
    { label: 'Custom', value: 'custom' },
];

const DesignsWorkspace: React.FC<DesignsWorkspaceProps> = ({ onAddToGlobalHistory, projectId, initialCategory }) => {
    const { user } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState<DesignCategory>((initialCategory as DesignCategory) || 'MOCKUPS');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
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
    const [iconStyle, setIconStyle] = useState('Glassmorphism');
    const [iconColor, setIconColor] = useState('#6366f1');
    const [iconBgType, setIconBgType] = useState('transparent');
    const [iconBgCustom, setIconBgCustom] = useState('#1a1a2e');

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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setter(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `${selectedCategory.toLowerCase()}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

            let inputs: any = {};
            switch (selectedCategory) {
                case 'MOCKUPS':
                    inputs = { deviceType, screenImage, angle, bgColor: mockupBgColor };
                    break;
                case 'ICONS':
                    inputs = { iconDescription, iconStyle, iconColor, bgColor: iconBgType === 'custom' ? iconBgCustom : iconBgType };
                    break;
                case 'PRODUCTS':
                    inputs = { productType, brandName, niche, logoImage, productColors };
                    break;
                case 'LOGOS':
                    inputs = { logoName, logoNiche, logoStyle, logoColors, includeIcon };
                    break;
            }

            const result = await generateDesignAsset(selectedCategory, inputs);
            setGeneratedImage(result.image);

            // Save to Supabase if user is logged in
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
                timestamp: Date.now()
            };
            setLocalHistory(prev => [historyItem, ...prev]);
            onAddToGlobalHistory(historyItem);
        } catch (err: any) {
            setError(err.message || 'Erro ao gerar asset.');
        } finally {
            setIsGenerating(false);
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
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${deviceType === device ? 'bg-lime-500 text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                        {device}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagem da Tela (Opcional)</label>
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setScreenImage)}
                                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Angulo</label>
                            <div className="flex gap-2">
                                {ANGLE_OPTIONS.map(a => (
                                    <button key={a} onClick={() => setAngle(a)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${angle === a ? 'bg-lime-500 text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                        {a}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cor de Fundo</label>
                            <div className="flex gap-2 items-center">
                                <input type="color" value={mockupBgColor} onChange={(e) => setMockupBgColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                                <input type="text" value={mockupBgColor} onChange={(e) => setMockupBgColor(e.target.value)} className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white" />
                            </div>
                        </div>
                    </div>
                );

            case 'ICONS':
                return (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descricao do Icone *</label>
                            <input type="text" value={iconDescription} onChange={(e) => setIconDescription(e.target.value)}
                                placeholder="Ex: foguete, dinheiro, coracao..."
                                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estilo</label>
                            <div className="grid grid-cols-2 gap-2">
                                {ICON_STYLES.map(style => (
                                    <button key={style} onClick={() => setIconStyle(style)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${iconStyle === style ? 'bg-lime-500 text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cor do Icone</label>
                            <input type="color" value={iconColor} onChange={(e) => setIconColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cor de Fundo</label>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                {BG_OPTIONS.map(opt => (
                                    <button key={opt.value} onClick={() => setIconBgType(opt.value)}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${iconBgType === opt.value ? 'bg-lime-500 text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
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
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${productType === type ? 'bg-lime-500 text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome/Marca</label>
                            <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)}
                                placeholder="Ex: VyzeSupplements" className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nicho</label>
                            <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)}
                                placeholder="Ex: cosmeticos, suplementos..." className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500" />
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
                                placeholder="Ex: VyzeBG" className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nicho *</label>
                            <input type="text" value={logoNiche} onChange={(e) => setLogoNiche(e.target.value)}
                                placeholder="Ex: tecnologia, fitness..." className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estilo</label>
                            <div className="grid grid-cols-3 gap-2">
                                {LOGO_STYLES.map(style => (
                                    <button key={style} onClick={() => setLogoStyle(style)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${logoStyle === style ? 'bg-lime-500 text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
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
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includeIcon ? 'bg-lime-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includeIcon ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <span className="text-sm text-gray-700 dark:text-gray-300">Incluir Icone</span>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn h-full overflow-hidden">

            {/* LEFT PANEL: CONTROLS */}
            <div className="lg:col-span-4 h-full flex flex-col relative bg-white/60 dark:bg-app-dark-lighter backdrop-blur-xl border-r border-gray-200 dark:border-white/5 rounded-l-2xl overflow-hidden transition-colors duration-300">

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto pr-2 pb-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 p-6 space-y-6">

                    {/* Category Selector */}
                    <div className="bg-white dark:bg-app-dark border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white/90">
                            <i className="fas fa-layer-group text-lime-600 dark:text-lime-400"></i>
                            Tipo de Asset
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {CATEGORIES.map(cat => (
                                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                                    className={`flex flex-col items-center p-4 rounded-xl border transition-all ${selectedCategory === cat.id
                                        ? 'bg-lime-500/10 border-lime-500 text-lime-600 dark:text-lime-400'
                                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                    <i className={`fas ${cat.icon} text-2xl mb-2`}></i>
                                    <span className="text-sm font-medium">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Inputs */}
                    <div className="bg-white dark:bg-app-dark border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Configuracoes</h3>
                        {renderCategoryInputs()}
                    </div>
                </div>

                {/* Fixed Footer: Generate Button */}
                <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-white/80 dark:bg-app-dark-lighter/80 backdrop-blur-sm">
                    <button onClick={handleGenerate} disabled={isGenerating}
                        className="w-full bg-gradient-to-r from-lime-500 to-emerald-500 text-black font-bold py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-lime-500/25">
                        {isGenerating ? <><i className="fas fa-spinner fa-spin"></i> Gerando...</> : <><i className="fas fa-magic"></i> Gerar</>}
                    </button>
                </div>
            </div>

            {/* RIGHT PANEL: PREVIEW & HISTORY */}
            <div className="lg:col-span-8 h-full flex flex-col relative overflow-hidden">

                {/* Main Preview Area */}
                <div className="flex-1 flex items-center justify-center p-8 relative bg-gray-50/50 dark:bg-black/20 rounded-r-2xl">
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
                            <i className="fas fa-spinner fa-spin text-4xl mb-4 text-lime-500"></i>
                            <p>Gerando...</p>
                        </div>
                    )}
                    {generatedImage && (
                        <div className="relative group">
                            <img src={generatedImage} alt="Generated" className="max-h-[65vh] max-w-full rounded-xl shadow-2xl" />
                            <button onClick={handleDownload}
                                className="absolute top-4 right-4 bg-lime-500 hover:bg-lime-400 text-black font-bold px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <i className="fas fa-download"></i> Download
                            </button>
                        </div>
                    )}
                </div>

                {/* History Strip */}
                <div className="h-32 bg-white/60 dark:bg-app-dark backdrop-blur-xl border-t border-gray-200 dark:border-white/5 rounded-2xl p-4 overflow-x-auto flex gap-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                    {localHistory.length === 0 ? (
                        <div className="w-full flex items-center justify-center text-xs text-gray-400">
                            Historico vazio
                        </div>
                    ) : (
                        localHistory.map((item) => (
                            <div
                                key={item.id}
                                className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all group ${generatedImage === item.url ? 'border-lime-500 ring-2 ring-lime-500/30' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
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
