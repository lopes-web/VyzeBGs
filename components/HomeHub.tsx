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
                                className="w-8 h-8 rounded-full flex items-center justify-center text-black font-bold text-xs hover:scale-105 transition-transform shadow-lg"
                                style={{ backgroundColor: '#00C087' }}
                                title="Meu Perfil"
                            >
                                {userEmail.substring(0, 2).toUpperCase()}
                            </button>
                        </div>
                    )}
                </div>
            </div>



            {/* Main Content */}
            <div className="relative z-10 flex-grow flex flex-col items-center justify-center p-8">

                {/* Hero Text */}
                <div className="text-center mb-12 space-y-3 animate-fadeInDown">
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white">
                        Como posso <span style={{ color: '#00C087' }}>ajudar</span>?
                    </h1>
                    <p className="text-base text-gray-500 max-w-md mx-auto">
                        Crie assets incríveis para seus projetos em segundos.
                    </p>
                </div>

                {/* Cards Grid - Supabase Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full animate-fadeInUp delay-100 opacity-0" style={{ animationFillMode: 'forwards' }}>

                    {/* Card 1: Landing Pages */}
                    <button
                        onClick={() => onSelectSection('LANDING_PAGES')}
                        className="group text-left p-6 rounded-xl transition-all duration-300 hover:border-[#3E3E3E]"
                        style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(0, 192, 135, 0.1)' }}>
                                <i className="fas fa-chart-line text-lg" style={{ color: '#00C087' }}></i>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-white mb-1 group-hover:text-[#00C087] transition-colors">
                                    Landing Pages
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Gere <span className="text-gray-300">backgrounds de alta conversão</span> para suas páginas de vendas.
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Card 2: Designs */}
                    <button
                        onClick={() => onSelectSection('DESIGNS')}
                        className="group text-left p-6 rounded-xl transition-all duration-300 hover:border-[#3E3E3E]"
                        style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                                <i className="fas fa-layer-group text-lg text-purple-500"></i>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">
                                    Designs
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Crie <span className="text-gray-300">mockups, ícones 3D, logos</span> e criativos artísticos.
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Card 3: Remove BG */}
                    <button
                        onClick={() => onSelectSection('REMOVE_BG' as any)}
                        className="group text-left p-6 rounded-xl transition-all duration-300 hover:border-[#3E3E3E]"
                        style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(0, 192, 135, 0.1)' }}>
                                <i className="fas fa-eraser text-lg" style={{ color: '#00C087' }}></i>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-white mb-1 group-hover:text-[#00C087] transition-colors">
                                    Remover Fundo
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Remova <span className="text-gray-300">fundos automaticamente</span> com precisão profissional.
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Card 4: WebP Converter */}
                    <button
                        onClick={() => onSelectSection('WEBP_CONVERTER')}
                        className="group text-left p-6 rounded-xl transition-all duration-300 hover:border-[#3E3E3E]"
                        style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                                <i className="fas fa-file-image text-lg text-blue-500"></i>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                                    Conversor WebP
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Otimize suas imagens para <span className="text-gray-300">máxima performance web</span>.
                                </p>
                            </div>
                        </div>
                    </button>

                </div>
            </div>
        </div>
    );
};

export default HomeHub;
