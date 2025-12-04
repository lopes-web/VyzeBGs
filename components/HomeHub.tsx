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
        <div className="relative h-[100dvh] w-full overflow-hidden flex flex-col bg-black font-sans transition-colors duration-500">
            {/* Backgrounds - Dark Mode Only */}
            <div
                className="absolute inset-0 w-full h-full transition-opacity duration-500 opacity-100"
                style={{
                    backgroundImage: 'url("/bg-home.avif")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 z-10 bg-black/20 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-3">
                    <img src="/logo.webp" alt="Vyze Logo" className="h-8 w-auto" />
                </div>
                <div className="flex items-center gap-4">
                    {userEmail && (
                        <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                            <button
                                onClick={onOpenProfile}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-black font-bold text-xs hover:scale-105 transition-transform shadow-lg shadow-lime-500/20"
                                title="Meu Perfil"
                            >
                                {userEmail.substring(0, 2).toUpperCase()}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Background Overlay for Contrast */}
            <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none"></div>

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

                {/* Cards Grid - REDESIGNED */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full mb-16 animate-fadeInUp delay-100 opacity-0" style={{ animationFillMode: 'forwards' }}>

                    {/* Card 1: Landing Pages (Gauge Style) */}
                    <button
                        onClick={() => onSelectSection('LANDING_PAGES')}
                        className="group relative h-80 rounded-[32px] p-[1px] bg-gradient-to-b from-white/10 to-white/5 hover:from-[#00ca8c]/50 hover:to-[#00ca8c]/20 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(0,202,140,0.3)]"
                    >
                        <div className="relative h-full w-full bg-[#0a0a0a] rounded-[31px] overflow-hidden flex flex-col">
                            {/* Graphic Area */}
                            <div className="flex-grow relative flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-[#00ca8c]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                {/* Gauge Graphic */}
                                <div className="relative w-40 h-40">
                                    {/* Outer Glow */}
                                    <div className="absolute inset-0 bg-[#00ca8c]/20 blur-3xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>

                                    {/* Progress Arc */}
                                    <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="#333" strokeWidth="8" />
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="#00ca8c" strokeWidth="8" strokeDasharray="283" strokeDashoffset="20" strokeLinecap="round" className="drop-shadow-[0_0_10px_rgba(0,202,140,0.5)]" />
                                    </svg>

                                    {/* Center Text */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">98%</span>
                                        <span className="text-[10px] text-[#00ca8c] uppercase tracking-wider font-bold">Conversion</span>
                                    </div>
                                </div>
                            </div>

                            {/* Text Content */}
                            <div className="p-6 relative z-10 bg-gradient-to-t from-black/80 to-transparent">
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00ca8c] transition-colors">Landing Pages</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Gere backgrounds de alta conversão com sujeitos e produtos integrados.
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Card 2: Designs (Tree Style) */}
                    <button
                        onClick={() => onSelectSection('DESIGNS')}
                        className="group relative h-80 rounded-[32px] p-[1px] bg-gradient-to-b from-white/10 to-white/5 hover:from-purple-500/50 hover:to-purple-500/20 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)]"
                    >
                        <div className="relative h-full w-full bg-[#0a0a0a] rounded-[31px] overflow-hidden flex flex-col">
                            {/* Graphic Area */}
                            <div className="flex-grow relative flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                {/* Tree Graphic */}
                                <div className="relative w-full h-full flex flex-col items-center justify-center p-8">
                                    {/* Top Node */}
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center mb-8 relative z-10 group-hover:scale-110 transition-transform duration-500">
                                        <i className="fas fa-layer-group text-white text-lg"></i>
                                    </div>

                                    {/* Connecting Lines */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-4 w-32 h-16 border-t-2 border-l-2 border-r-2 border-purple-500/30 rounded-t-2xl"></div>

                                    {/* Bottom Nodes */}
                                    <div className="flex gap-6 relative z-10 mt-2">
                                        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-purple-500/50 group-hover:bg-purple-500/10 transition-all duration-300 delay-75">
                                            <i className="fas fa-image text-gray-400 text-xs group-hover:text-purple-400"></i>
                                        </div>
                                        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-purple-500/50 group-hover:bg-purple-500/10 transition-all duration-300 delay-100">
                                            <i className="fas fa-font text-gray-400 text-xs group-hover:text-purple-400"></i>
                                        </div>
                                        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-purple-500/50 group-hover:bg-purple-500/10 transition-all duration-300 delay-150">
                                            <i className="fas fa-palette text-gray-400 text-xs group-hover:text-purple-400"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Text Content */}
                            <div className="p-6 relative z-10 bg-gradient-to-t from-black/80 to-transparent">
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Designs</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Crie texturas, padrões e elementos gráficos artísticos.
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Card 3: Remove BG (Network Style) */}
                    <button
                        onClick={() => onSelectSection('REMOVE_BG' as any)}
                        className="group relative h-80 rounded-[32px] p-[1px] bg-gradient-to-b from-white/10 to-white/5 hover:from-[#00ca8c]/50 hover:to-[#00ca8c]/20 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(0,202,140,0.3)]"
                    >
                        <div className="relative h-full w-full bg-[#0a0a0a] rounded-[31px] overflow-hidden flex flex-col">
                            {/* Graphic Area */}
                            <div className="flex-grow relative flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-[#00ca8c]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                {/* Network Graphic */}
                                <div className="relative w-full px-8">
                                    {/* Nodes */}
                                    <div className="flex justify-between items-center mb-6 relative">
                                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00ca8c]/30 to-transparent"></div>
                                        <div className="w-8 h-8 rounded-full bg-[#00ca8c]/20 border border-[#00ca8c]/50 flex items-center justify-center relative z-10 shadow-[0_0_15px_rgba(0,202,140,0.3)]">
                                            <div className="w-2 h-2 bg-[#00ca8c] rounded-full animate-pulse"></div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-[#00ca8c]/20 border border-[#00ca8c]/50 flex items-center justify-center relative z-10 shadow-[0_0_15px_rgba(0,202,140,0.3)]">
                                            <div className="w-2 h-2 bg-[#00ca8c] rounded-full animate-pulse delay-75"></div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-[#00ca8c]/20 border border-[#00ca8c]/50 flex items-center justify-center relative z-10 shadow-[0_0_15px_rgba(0,202,140,0.3)]">
                                            <div className="w-2 h-2 bg-[#00ca8c] rounded-full animate-pulse delay-150"></div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="bg-white/5 rounded-full h-2 w-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-[#00ca8c] to-[#00ca8c]/80 w-3/4 rounded-full shadow-[0_0_10px_rgba(0,202,140,0.5)] group-hover:w-full transition-all duration-1000 ease-out"></div>
                                    </div>
                                    <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-mono uppercase">
                                        <span>Processing</span>
                                        <span className="text-[#00ca8c]">Done</span>
                                    </div>
                                </div>
                            </div>

                            {/* Text Content */}
                            <div className="p-6 relative z-10 bg-gradient-to-t from-black/80 to-transparent">
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00ca8c] transition-colors">Remover Fundo</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Remova o fundo de imagens instantaneamente.
                                </p>
                            </div>
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
                                            <i className="fas fa-laptop-code text-lime-500"></i>
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
                                            <i className="fas fa-laptop-code text-lime-500"></i>
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
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isConfigOpen ? 'bg-lime-500/20 text-lime-400' : 'hover:bg-white/5 text-gray-400 hover:text-gray-300'}`}
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
                                            <i className="fas fa-cog text-lime-500"></i> Configuração
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
                                                            ? 'bg-lime-500/10 border-lime-500 text-lime-400'
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
                                                    className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-400 hover:text-lime-500 hover:border-lime-500 hover:bg-lime-500/10 transition-all"
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
                                                    className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-600 hover:border-lime-500 flex items-center justify-center text-gray-400 hover:text-lime-500 transition-colors"
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
                                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-lime-500 hover:text-black text-gray-400 flex items-center justify-center transition-all duration-300"
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
        </div>
    );
};

export default HomeHub;
