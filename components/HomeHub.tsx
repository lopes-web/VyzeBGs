import React, { useState, useRef } from 'react';
import { AppSection, GeneratorMode } from '../types';

interface HomeHubProps {
    onSelectSection: (section: AppSection) => void;
    onPromptSubmit: (
        prompt: string,
        section: AppSection,
        principalFile?: File,
        styleReferenceFile?: File,
        generatorMode?: GeneratorMode,
        secondaryFiles?: File[]
    ) => void;
    userEmail?: string;
    onLogout: () => void;
    onOpenProfile: () => void;
    onNewProjectFromHistory?: (data: {
        section: AppSection;
        prompt: string;
        principalFile?: File;
        styleReferenceFile?: File;
        secondaryFiles?: File[];
        generatorMode?: GeneratorMode;
    }) => void;
}

const HomeHub: React.FC<HomeHubProps> = ({ onSelectSection, onPromptSubmit, userEmail, onLogout, onOpenProfile }) => {
    const [prompt, setPrompt] = useState('');
    const [selectedMode, setSelectedMode] = useState<AppSection>('LANDING_PAGES');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    // Generator Configuration
    const [generatorMode, setGeneratorMode] = useState<GeneratorMode>('HUMAN');
    const [secondaryFiles, setSecondaryFiles] = useState<File[]>([]);

    // Principal Image State (Subject/Input)
    const [principalFile, setPrincipalFile] = useState<File | null>(null);
    const [principalPreview, setPrincipalPreview] = useState<string | null>(null);
    const principalInputRef = useRef<HTMLInputElement>(null);

    // Style Reference State (Style/Example)
    const [styleReferenceFile, setStyleReferenceFile] = useState<File | null>(null);
    const [styleReferencePreview, setStyleReferencePreview] = useState<string | null>(null);
    const styleReferenceInputRef = useRef<HTMLInputElement>(null);

    const secondaryInputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && prompt.trim()) {
            onPromptSubmit(prompt, selectedMode, principalFile || undefined, styleReferenceFile || undefined, generatorMode, secondaryFiles);
        }
    };

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
    const toggleConfig = () => setIsConfigOpen(!isConfigOpen);

    const selectMode = (mode: AppSection) => {
        setSelectedMode(mode);
        setIsDropdownOpen(false);
    };

    const handlePrincipalSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPrincipalFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPrincipalPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStyleReferenceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setStyleReferenceFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setStyleReferencePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSecondarySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSecondaryFiles(prev => [...prev, ...files]);
        }
    };

    const removeSecondaryFile = (index: number) => {
        setSecondaryFiles(prev => prev.filter((_, i) => i !== index));
    };

    const clearPrincipal = () => {
        setPrincipalFile(null);
        setPrincipalPreview(null);
        if (principalInputRef.current) {
            principalInputRef.current.value = '';
        }
    };

    const clearStyleReference = () => {
        setStyleReferenceFile(null);
        setStyleReferencePreview(null);
        if (styleReferenceInputRef.current) {
            styleReferenceInputRef.current.value = '';
        }
    };

    const getModeIcon = (mode: GeneratorMode) => {
        switch (mode) {
            case 'HUMAN': return 'fa-user';
            case 'OBJECT': return 'fa-cube';
            case 'INFOPRODUCT': return 'fa-chalkboard-teacher';
            case 'ENHANCE': return 'fa-wand-magic';
            default: return 'fa-user';
        }
    };

    const getModeLabel = (mode: GeneratorMode) => {
        switch (mode) {
            case 'HUMAN': return 'Pessoa';
            case 'OBJECT': return 'Objeto';
            case 'INFOPRODUCT': return 'Infoproduto';
            case 'ENHANCE': return 'Enhance';
            default: return 'Pessoa';
        }
    };

    return (
        <div className="relative h-[100dvh] w-full overflow-hidden flex flex-col font-sans transition-colors duration-500" style={{ backgroundColor: '#171717' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 z-10" style={{ backgroundColor: '#1F1F1F', borderBottom: '1px solid #2E2E2E' }}>
                <div className="flex items-center gap-3">
                    <img src="/logo.webp" alt="Vyze Logo" className="h-8 w-auto" />
                </div>
                <div className="flex items-center gap-4">
                    {userEmail && (
                        <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                            <button
                                onClick={onOpenProfile}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-light to-accent-dark flex items-center justify-center text-black font-bold text-xs hover:scale-105 transition-transform shadow-lg shadow-accent/20"
                                title="Meu Perfil"
                            >
                                {userEmail.substring(0, 2).toUpperCase()}
                            </button>
                        </div>
                    )}
                </div>
            </div>



            {/* Main Content */}
            <div className="relative z-10 flex-grow flex flex-col items-center justify-center p-4 -mt-10">

                {/* Hero Text */}
                <div className="text-center mb-16 space-y-4 animate-fadeInDown">
                    <h1 className="text-6xl md:text-7xl font-black tracking-tight text-white drop-shadow-2xl">
                        Como posso ajudar?
                    </h1>
                    <p className="text-lg text-gray-400 max-w-xl mx-auto font-light">
                        Crie assets incríveis para seus projetos em segundos.
                    </p>
                </div>

                {/* Cards Grid - REDESIGNED (SIMPLE) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full mb-16 animate-fadeInUp delay-100 opacity-0" style={{ animationFillMode: 'forwards' }}>

                    {/* Card 1: Landing Pages */}
                    <button
                        onClick={() => onSelectSection('LANDING_PAGES')}
                        className="group relative h-64 rounded-[32px] transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(0,202,140,0.3)]" style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}
                    >
                        <div className="relative h-full w-full rounded-[31px] overflow-hidden flex flex-col items-center justify-center p-6">
                            <div className="w-20 h-20 rounded-2xl bg-[#00ca8c]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-[#00ca8c]/20 group-hover:border-[#00ca8c]/50">
                                <i className="fas fa-chart-line text-4xl text-[#00ca8c] drop-shadow-[0_0_10px_rgba(0,202,140,0.5)]"></i>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00ca8c] transition-colors">Landing Pages</h3>
                            <p className="text-sm text-gray-400 text-center leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute bottom-6 px-4">
                                Gere backgrounds de alta conversão.
                            </p>
                        </div>
                    </button>

                    {/* Card 2: Designs */}
                    <button
                        onClick={() => onSelectSection('DESIGNS')}
                        className="group relative h-64 rounded-[32px] transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)]" style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}
                    >
                        <div className="relative h-full w-full rounded-[31px] overflow-hidden flex flex-col items-center justify-center p-6">
                            <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-purple-500/20 group-hover:border-purple-500/50">
                                <i className="fas fa-layer-group text-4xl text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"></i>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Designs</h3>
                            <p className="text-sm text-gray-400 text-center leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute bottom-6 px-4">
                                Crie assets gráficos artísticos.
                            </p>
                        </div>
                    </button>

                    {/* Card 3: Remove BG */}
                    <button
                        onClick={() => onSelectSection('REMOVE_BG' as any)}
                        className="group relative h-64 rounded-[32px] transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(0,202,140,0.3)]" style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}
                    >
                        <div className="relative h-full w-full rounded-[31px] overflow-hidden flex flex-col items-center justify-center p-6">
                            <div className="w-20 h-20 rounded-2xl bg-[#00ca8c]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-[#00ca8c]/20 group-hover:border-[#00ca8c]/50">
                                <i className="fas fa-eraser text-4xl text-[#00ca8c] drop-shadow-[0_0_10px_rgba(0,202,140,0.5)]"></i>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00ca8c] transition-colors">Remover Fundo</h3>
                            <p className="text-sm text-gray-400 text-center leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute bottom-6 px-4">
                                Remova fundos instantaneamente.
                            </p>
                        </div>
                    </button>

                    {/* Card 4: WebP Converter */}
                    <button
                        onClick={() => onSelectSection('WEBP_CONVERTER')}
                        className="group relative h-64 rounded-[32px] transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]" style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}
                    >
                        <div className="relative h-full w-full rounded-[31px] overflow-hidden flex flex-col items-center justify-center p-6">
                            <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-blue-500/20 group-hover:border-blue-500/50">
                                <i className="fas fa-file-image text-4xl text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"></i>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Conversor WebP</h3>
                            <p className="text-sm text-gray-400 text-center leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute bottom-6 px-4">
                                Otimize imagens para web.
                            </p>
                        </div>
                    </button>
                </div>

                {/* Input Bar */}
                <div className="w-full max-w-2xl relative z-20 animate-fadeInUp delay-200 opacity-0" style={{ animationFillMode: 'forwards' }}>
                    <div className="relative group">
                        <div className="relative bg-black/60 backdrop-blur-2xl rounded-2xl flex items-center p-2 shadow-2xl border border-white/10">

                            {/* Dropdown Trigger */}
                            <div className="relative">
                                <button
                                    onClick={toggleDropdown}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-sm font-medium text-gray-300 transition-colors min-w-[140px]"
                                >
                                    {selectedMode === 'LANDING_PAGES' ? (
                                        <>
                                            <i className="fas fa-laptop-code text-accent"></i>
                                            <span>Landing Page</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-palette text-purple-500"></i>
                                            <span>Design</span>
                                        </>
                                    )}
                                    <i className={`fas fa-chevron-down text-xs text-gray-400 ml-auto transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div
                                        className="absolute top-full left-0 mt-2 w-48 bg-black border border-white/10 rounded-xl shadow-xl overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-200"
                                    >
                                        <button
                                            onClick={() => selectMode('LANDING_PAGES')}
                                            className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 text-sm text-gray-200"
                                        >
                                            <i className="fas fa-laptop-code text-accent"></i>
                                            Landing Page
                                        </button>
                                        <button
                                            onClick={() => selectMode('DESIGNS')}
                                            className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 text-sm text-gray-200"
                                        >
                                            <i className="fas fa-palette text-purple-500"></i>
                                            Design
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="w-px h-8 bg-white/10 mx-2"></div>

                            {/* Config Button */}
                            <div className="relative">
                                <button
                                    onClick={toggleConfig}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isConfigOpen ? 'bg-accent/20 text-accent-light' : 'hover:bg-white/5 text-gray-400 hover:text-gray-300'}`}
                                    title="Configurações de Geração"
                                >
                                    <i className="fas fa-sliders-h"></i>
                                </button>

                                {/* Config Dropdown */}
                                {isConfigOpen && (
                                    <div
                                        className="absolute bottom-full left-0 mb-4 w-80 bg-black border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200 max-h-[500px] overflow-y-auto"
                                    >
                                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                            <i className="fas fa-cog text-accent"></i> Configuração
                                        </h3>

                                        {/* Mode Selector */}
                                        <div className="mb-4">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">Modo</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(['HUMAN', 'OBJECT', 'INFOPRODUCT', 'ENHANCE'] as GeneratorMode[]).map(mode => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => setGeneratorMode(mode)}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${generatorMode === mode
                                                            ? 'bg-accent/10 border-accent text-accent-light'
                                                            : 'bg-white/5 border-transparent hover:bg-white/10 text-gray-300'
                                                            }`}
                                                    >
                                                        <i className={`fas ${getModeIcon(mode)}`}></i>
                                                        {getModeLabel(mode)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* PRINCIPAL IMAGE UPLOAD */}
                                        <div className="mb-4">
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                                Imagem Principal (Para melhorar/mudar)
                                            </label>
                                            <div className="flex gap-2 items-start">
                                                <input
                                                    type="file"
                                                    ref={principalInputRef}
                                                    onChange={handlePrincipalSelect}
                                                    accept="image/*"
                                                    className="hidden"
                                                />
                                                <button
                                                    onClick={() => principalInputRef.current?.click()}
                                                    className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-400 hover:text-accent hover:border-accent hover:bg-accent/10 transition-all"
                                                    title="Adicionar Imagem Principal"
                                                >
                                                    <i className="fas fa-user text-lg mb-1"></i>
                                                </button>

                                                {principalFile && (
                                                    <div className="relative group w-16 h-16">
                                                        <img
                                                            src={principalPreview || ''}
                                                            alt="Principal"
                                                            className="w-full h-full object-cover rounded-lg border border-gray-700"
                                                        />
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                clearPrincipal();
                                                            }}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md hover:bg-red-600 transition-colors"
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* STYLE REFERENCE UPLOAD (NEW) */}
                                        <div className="mb-4">
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                                Imagem de Referência (Estilo/Exemplo)
                                            </label>
                                            <div className="flex gap-2 items-start">
                                                <input
                                                    type="file"
                                                    ref={styleReferenceInputRef}
                                                    onChange={handleStyleReferenceSelect}
                                                    accept="image/*"
                                                    className="hidden"
                                                />
                                                <button
                                                    onClick={() => styleReferenceInputRef.current?.click()}
                                                    className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-400 hover:text-purple-500 hover:border-purple-500 hover:bg-purple-500/10 transition-all"
                                                    title="Adicionar Referência de Estilo"
                                                >
                                                    <i className="fas fa-image text-lg mb-1"></i>
                                                </button>

                                                {styleReferenceFile && (
                                                    <div className="relative group w-16 h-16">
                                                        <img
                                                            src={styleReferencePreview || ''}
                                                            alt="Style Ref"
                                                            className="w-full h-full object-cover rounded-lg border border-gray-700"
                                                        />
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                clearStyleReference();
                                                            }}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md hover:bg-red-600 transition-colors"
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Secondary Elements */}
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">
                                                Elementos Secundários ({secondaryFiles.length})
                                            </label>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {secondaryFiles.map((file, idx) => (
                                                    <div key={idx} className="relative group">
                                                        <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/5 flex items-center justify-center overflow-hidden">
                                                            <i className="fas fa-image text-gray-400"></i>
                                                        </div>
                                                        <button
                                                            onClick={() => removeSecondaryFile(idx)}
                                                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => secondaryInputRef.current?.click()}
                                                    className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-600 hover:border-accent flex items-center justify-center text-gray-400 hover:text-accent transition-colors"
                                                >
                                                    <i className="fas fa-plus"></i>
                                                </button>
                                            </div>
                                            <input
                                                type="file"
                                                ref={secondaryInputRef}
                                                onChange={handleSecondarySelect}
                                                multiple
                                                className="hidden"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Principal Image Quick Upload (Paperclip) - REMOVED */}

                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="O que você quer criar hoje?..."
                                className="flex-grow bg-transparent border-none outline-none text-white placeholder-gray-400 px-2 h-10"
                                autoFocus
                            />

                            <button
                                onClick={() => prompt.trim() && onPromptSubmit(prompt, selectedMode, principalFile || undefined, styleReferenceFile || undefined, generatorMode, secondaryFiles)}
                                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-accent hover:text-black text-gray-400 flex items-center justify-center transition-all duration-300"
                            >
                                <i className="fas fa-arrow-up"></i>
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer / Info */}
            <div className="absolute bottom-6 left-0 w-full text-center text-xs text-gray-600">
                <p>Pressione <kbd className="font-mono bg-white/10 px-1 rounded">Enter</kbd> para gerar</p>
            </div>
        </div >
    );
};

export default HomeHub;

