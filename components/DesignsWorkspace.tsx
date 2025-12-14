import React, { useState } from 'react';
import { DesignCategory } from '../types';
import { generateDesignAsset } from '../services/geminiService';
import { checkApiKey } from '../services/geminiService';

interface DesignsWorkspaceProps {
    onAddToGlobalHistory: (item: any) => void;
}

const CATEGORIES: { id: DesignCategory; label: string; icon: string; description: string }[] = [
    { id: 'MOCKUPS', label: 'Mockups', icon: 'fa-mobile-alt', description: 'Dispositivos com tela personalizável' },
    { id: 'ICONS', label: 'Ícones 3D', icon: 'fa-gem', description: 'Ícones estilizados em 3D' },
    { id: 'PRODUCTS', label: 'Produtos', icon: 'fa-box', description: 'Embalagens e produtos' },
    { id: 'LOGOS', label: 'Logos', icon: 'fa-palette', description: 'Sugestões de logos' },
];

const DEVICE_OPTIONS = ['iPhone', 'MacBook', 'iPad', 'Android', 'Monitor'];
const ANGLE_OPTIONS = ['Frontal', 'Isométrico', 'Flutuante'];
const ICON_STYLES = ['Glassmorphism', 'Neon', 'Clay 3D', 'Gradiente'];
const PRODUCT_TYPES = ['Caixa', 'Frasco', 'Sacola', 'Embalagem', 'Bolsa'];
const LOGO_STYLES = ['Minimalista', 'Moderno', 'Vintage', 'Tech', 'Elegante'];

const DesignsWorkspace: React.FC<DesignsWorkspaceProps> = ({ onAddToGlobalHistory }) => {
    const [selectedCategory, setSelectedCategory] = useState<DesignCategory>('MOCKUPS');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Mockup inputs
    const [deviceType, setDeviceType] = useState('iPhone');
    const [screenImage, setScreenImage] = useState<string | null>(null);
    const [angle, setAngle] = useState('Frontal');
    const [bgColor, setBgColor] = useState('#1a1a2e');

    // Icon inputs
    const [iconDescription, setIconDescription] = useState('');
    const [iconStyle, setIconStyle] = useState('Glassmorphism');
    const [iconColor, setIconColor] = useState('#6366f1');

    // Product inputs
    const [productType, setProductType] = useState('Caixa');
    const [brandName, setBrandName] = useState('');
    const [niche, setNiche] = useState('');
    const [logoImage, setLogoImage] = useState<string | null>(null);
    const [productColors, setProductColors] = useState(['#1a1a2e', '#6366f1', '#a3e635']);

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
            reader.onloadend = () => {
                setter(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const hasKey = await checkApiKey();
            if (!hasKey) {
                setError('API Key não configurada.');
                setIsGenerating(false);
                return;
            }

            let inputs: any = {};

            switch (selectedCategory) {
                case 'MOCKUPS':
                    inputs = { deviceType, screenImage, angle, bgColor };
                    break;
                case 'ICONS':
                    inputs = { iconDescription, iconStyle, iconColor };
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

            onAddToGlobalHistory({
                id: Date.now().toString(),
                url: result.image,
                prompt: result.finalPrompt,
                timestamp: Date.now(),
                mode: 'OBJECT',
                section: 'DESIGNS'
            });

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
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Dispositivo</label>
                            <div className="grid grid-cols-5 gap-2">
                                {DEVICE_OPTIONS.map(device => (
                                    <button
                                        key={device}
                                        onClick={() => setDeviceType(device)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${deviceType === device
                                            ? 'bg-lime-500 text-black'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                    >
                                        {device}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Imagem da Tela (Opcional)</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, setScreenImage)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300"
                            />
                            {screenImage && <img src={screenImage} alt="Screen preview" className="mt-2 h-20 rounded-lg object-cover" />}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Ângulo</label>
                            <div className="flex gap-2">
                                {ANGLE_OPTIONS.map(a => (
                                    <button
                                        key={a}
                                        onClick={() => setAngle(a)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${angle === a
                                            ? 'bg-lime-500 text-black'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                    >
                                        {a}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Cor de Fundo</label>
                            <div className="flex gap-2 items-center">
                                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                                <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
                            </div>
                        </div>
                    </div>
                );

            case 'ICONS':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Descrição do Ícone *</label>
                            <input
                                type="text"
                                value={iconDescription}
                                onChange={(e) => setIconDescription(e.target.value)}
                                placeholder="Ex: foguete, dinheiro, coração, cérebro..."
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Estilo</label>
                            <div className="grid grid-cols-4 gap-2">
                                {ICON_STYLES.map(style => (
                                    <button
                                        key={style}
                                        onClick={() => setIconStyle(style)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${iconStyle === style
                                            ? 'bg-lime-500 text-black'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Cor Principal</label>
                            <div className="flex gap-2 items-center">
                                <input type="color" value={iconColor} onChange={(e) => setIconColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                                <input type="text" value={iconColor} onChange={(e) => setIconColor(e.target.value)} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
                            </div>
                        </div>
                    </div>
                );

            case 'PRODUCTS':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Produto *</label>
                            <div className="grid grid-cols-5 gap-2">
                                {PRODUCT_TYPES.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setProductType(type)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${productType === type
                                            ? 'bg-lime-500 text-black'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nome/Marca</label>
                                <input
                                    type="text"
                                    value={brandName}
                                    onChange={(e) => setBrandName(e.target.value)}
                                    placeholder="Ex: VyzeSupplements"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nicho</label>
                                <input
                                    type="text"
                                    value={niche}
                                    onChange={(e) => setNiche(e.target.value)}
                                    placeholder="Ex: cosméticos, suplementos..."
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Logo (Opcional)</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, setLogoImage)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Cores</label>
                            <div className="flex gap-2">
                                {productColors.map((color, i) => (
                                    <input
                                        key={i}
                                        type="color"
                                        value={color}
                                        onChange={(e) => {
                                            const newColors = [...productColors];
                                            newColors[i] = e.target.value;
                                            setProductColors(newColors);
                                        }}
                                        className="w-10 h-10 rounded cursor-pointer"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'LOGOS':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Marca *</label>
                                <input
                                    type="text"
                                    value={logoName}
                                    onChange={(e) => setLogoName(e.target.value)}
                                    placeholder="Ex: VyzeBG"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nicho *</label>
                                <input
                                    type="text"
                                    value={logoNiche}
                                    onChange={(e) => setLogoNiche(e.target.value)}
                                    placeholder="Ex: tecnologia, fitness..."
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Estilo</label>
                            <div className="grid grid-cols-5 gap-2">
                                {LOGO_STYLES.map(style => (
                                    <button
                                        key={style}
                                        onClick={() => setLogoStyle(style)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${logoStyle === style
                                            ? 'bg-lime-500 text-black'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Cores</label>
                            <div className="flex gap-2">
                                {logoColors.map((color, i) => (
                                    <input
                                        key={i}
                                        type="color"
                                        value={color}
                                        onChange={(e) => {
                                            const newColors = [...logoColors];
                                            newColors[i] = e.target.value;
                                            setLogoColors(newColors);
                                        }}
                                        className="w-10 h-10 rounded cursor-pointer"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIncludeIcon(!includeIcon)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includeIcon ? 'bg-lime-500' : 'bg-gray-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includeIcon ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <span className="text-sm text-gray-300">Incluir ícone no logo</span>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn h-full overflow-hidden">
            {/* Left Panel - Controls */}
            <div className="lg:col-span-4 h-full flex flex-col bg-gray-900/40 backdrop-blur-xl border-r border-white/5 rounded-l-2xl overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Category Selector */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white/90">
                            <i className="fas fa-layer-group text-lime-400"></i>
                            Tipo de Asset
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`flex flex-col items-center p-4 rounded-xl border transition-all ${selectedCategory === cat.id
                                        ? 'bg-lime-500/10 border-lime-500 text-lime-400'
                                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800'}`}
                                >
                                    <i className={`fas ${cat.icon} text-2xl mb-2`}></i>
                                    <span className="text-sm font-medium">{cat.label}</span>
                                    <span className="text-xs text-gray-500 mt-1">{cat.description}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Inputs */}
                    <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                            Configurações
                        </h3>
                        {renderCategoryInputs()}
                    </div>
                </div>

                {/* Generate Button */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full bg-gradient-to-r from-lime-500 to-emerald-500 text-black font-bold py-4 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Gerando...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-magic"></i>
                                Gerar {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Right Panel - Preview */}
            <div className="lg:col-span-8 h-full flex flex-col bg-gray-900/20 rounded-r-2xl overflow-hidden">
                <div className="flex-1 flex items-center justify-center p-8">
                    {error && (
                        <div className="text-red-400 bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                            <i className="fas fa-exclamation-circle mr-2"></i>
                            {error}
                        </div>
                    )}

                    {!generatedImage && !error && !isGenerating && (
                        <div className="text-center text-gray-500">
                            <i className="fas fa-image text-6xl mb-4 opacity-20"></i>
                            <p>Selecione as opções e clique em Gerar</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="text-center text-gray-400">
                            <i className="fas fa-spinner fa-spin text-4xl mb-4 text-lime-400"></i>
                            <p>Gerando seu asset...</p>
                        </div>
                    )}

                    {generatedImage && (
                        <img
                            src={generatedImage}
                            alt="Generated asset"
                            className="max-h-full max-w-full rounded-xl shadow-2xl"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DesignsWorkspace;
