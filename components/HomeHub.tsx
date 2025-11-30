import React, { useState, useRef } from 'react';
import { AppSection, GeneratorMode } from '../types';
import ThemeToggle from './ThemeToggle';

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
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300 relative">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-lime-500/10 dark:bg-lime-500/5 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 z-10">
                <div className="flex items-center gap-3">
                    <img src="/logo.webp" alt="Vyze Logo" className="h-8 w-auto" />
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    {userEmail && (
                        <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-white/10">
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

            {/* Main Content */}
            <div className="flex-grow flex flex-col items-center justify-center p-4 z-10 -mt-10">

                {/* Hero Text */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center mb-4">
                        <i className="fas fa-sparkles text-lime-500 text-2xl animate-pulse"></i>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">
                        Como posso ajudar?
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        Crie assets incríveis para seus projetos em segundos.
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full mb-12">
                    {/* Landing Pages Card */}
                    <button
                        onClick={() => onSelectSection('LANDING_PAGES')}
                        className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 text-left hover:border-lime-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-lime-500/5"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-lime-500/0 to-lime-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-lime-100 dark:bg-lime-500/10 rounded-xl text-lime-600 dark:text-lime-400 group-hover:bg-lime-500 group-hover:text-black transition-colors">
                                <i className="fas fa-laptop-code text-xl"></i>
                            </div>
                            <i className="fas fa-arrow-right text-gray-300 dark:text-gray-700 group-hover:text-lime-500 transition-colors -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"></i>
                        </div>
                        <h3 className="text-lg font-bold mb-1">Landing Pages</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Gere backgrounds otimizados para conversão com sujeitos e produtos.
                        </p>
                    </button>

                    {/* Designs Card */}
                    <button
                        onClick={() => onSelectSection('DESIGNS')}
                        className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 text-left hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400 group-hover:bg-purple-500 group-hover:text-black transition-colors">
                                <i className="fas fa-palette text-xl"></i>
                            </div>
                            <i className="fas fa-arrow-right text-gray-300 dark:text-gray-700 group-hover:text-purple-500 transition-colors -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"></i>
                        </div>
                        <h3 className="text-lg font-bold mb-1">Designs</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Crie texturas, padrões e elementos gráficos artísticos.
                        </p>
                    </button>
                </div>

                {/* Input Bar */}
                <div className="w-full max-w-2xl relative z-20">
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-lime-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-300"></div>
                        <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl flex items-center p-2 shadow-2xl border border-gray-200 dark:border-white/5">

                            {/* Dropdown Trigger */}
                            <div className="relative">
                                <button
                                    onClick={toggleDropdown}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors min-w-[140px]"
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
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#262626] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <button
                                            onClick={() => selectMode('LANDING_PAGES')}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200"
                                        >
                                            <i className="fas fa-laptop-code text-lime-500"></i>
                                            Landing Page
                                        </button>
                                        <button
                                            onClick={() => selectMode('DESIGNS')}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200"
                                        >
                                            <i className="fas fa-palette text-purple-500"></i>
                                            Design
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="w-px h-8 bg-gray-200 dark:bg-white/10 mx-2"></div>

                            {/* Config Button */}
                            <div className="relative">
                                <button
                                    onClick={toggleConfig}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isConfigOpen ? 'bg-lime-100 dark:bg-lime-500/20 text-lime-600 dark:text-lime-400' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                    title="Configurações de Geração"
                                >
                                    <i className="fas fa-sliders-h"></i>
                                </button>

                                {/* Config Dropdown */}
                                {isConfigOpen && (
                                    <div className="absolute bottom-full left-0 mb-4 w-80 bg-white dark:bg-[#262626] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200 max-h-[500px] overflow-y-auto">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <i className="fas fa-cog text-lime-500"></i> Configuração
                                        </h3>

                                        {/* Mode Selector */}
                                        <div className="mb-4">
                                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2 block">Modo</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(['HUMAN', 'OBJECT', 'INFOPRODUCT', 'ENHANCE'] as GeneratorMode[]).map(mode => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => setGeneratorMode(mode)}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${generatorMode === mode
                                                            ? 'bg-lime-500/10 border-lime-500 text-lime-600 dark:text-lime-400'
                                                            : 'bg-gray-50 dark:bg-white/5 border-transparent hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300'
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
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
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
                                                    className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 hover:text-lime-500 hover:border-lime-500 hover:bg-lime-50 dark:hover:bg-lime-500/10 transition-all"
                                                    title="Adicionar Imagem Principal"
                                                >
                                                    <i className="fas fa-user text-lg mb-1"></i>
                                                </button>

                                                {principalFile && (
                                                    <div className="relative group w-16 h-16">
                                                        <img
                                                            src={principalPreview || ''}
                                                            alt="Principal"
                                                            className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700"
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
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
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
                                                    className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 hover:text-purple-500 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all"
                                                    title="Adicionar Referência de Estilo"
                                                >
                                                    <i className="fas fa-image text-lg mb-1"></i>
                                                </button>

                                                {styleReferenceFile && (
                                                    <div className="relative group w-16 h-16">
                                                        <img
                                                            src={styleReferencePreview || ''}
                                                            alt="Style Ref"
                                                            className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700"
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
                                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2 block">
                                                Elementos Secundários ({secondaryFiles.length})
                                            </label>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {secondaryFiles.map((file, idx) => (
                                                    <div key={idx} className="relative group">
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/5 flex items-center justify-center overflow-hidden">
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
                                                    className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-lime-500 dark:hover:border-lime-500 flex items-center justify-center text-gray-400 hover:text-lime-500 transition-colors"
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

                            {/* Principal Image Quick Upload (Paperclip) - Mapped to Principal */}
                            <div className="relative">
                                <button
                                    onClick={() => principalInputRef.current?.click()}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${principalPreview ? 'bg-lime-100 dark:bg-lime-500/20 text-lime-600 dark:text-lime-400' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                    title="Adicionar imagem principal"
                                >
                                    <i className="fas fa-paperclip"></i>
                                </button>

                                {/* Preview Tooltip */}
                                {principalPreview && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-white/10 animate-in fade-in zoom-in-95">
                                        <div className="relative w-16 h-16 rounded overflow-hidden">
                                            <img src={principalPreview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); clearPrincipal(); }}
                                                className="absolute top-0 right-0 bg-black/50 hover:bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-bl-lg text-xs transition-colors"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="O que você quer criar hoje?..."
                                className="flex-grow bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 px-2 h-10"
                                autoFocus
                            />

                            <button
                                onClick={() => prompt.trim() && onPromptSubmit(prompt, selectedMode, principalFile || undefined, styleReferenceFile || undefined, generatorMode, secondaryFiles)}
                                className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-lime-500 hover:text-black dark:hover:bg-lime-500 dark:hover:text-black text-gray-500 dark:text-gray-400 flex items-center justify-center transition-all duration-300"
                            >
                                <i className="fas fa-arrow-up"></i>
                            </button>
                        </div>
                    </div>

                    {/* Quick Suggestions (Optional) */}
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mr-2 pt-1">Sugestões:</span>
                        {['Cyberpunk City', 'Minimalist Office', 'Neon Abstract'].map((suggestion) => (
                            <button
                                key={suggestion}
                                onClick={() => onPromptSubmit(suggestion, selectedMode, undefined, undefined, generatorMode, secondaryFiles)}
                                className="text-xs px-3 py-1 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-lime-500/50 text-gray-600 dark:text-gray-400 hover:text-lime-600 dark:hover:text-lime-400 transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer / Info */}
            <div className="absolute bottom-6 left-0 w-full text-center text-xs text-gray-400 dark:text-gray-600">
                <p>Pressione <kbd className="font-mono bg-gray-100 dark:bg-white/10 px-1 rounded">Enter</kbd> para gerar</p>
            </div>
        </div>
    );
};

export default HomeHub;
