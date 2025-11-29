import React, { useState, useRef } from 'react';
import { AppSection } from '../types';
import ThemeToggle from './ThemeToggle';

interface HomeHubProps {
    onSelectSection: (section: AppSection) => void;
    onPromptSubmit: (prompt: string, section: AppSection, referenceFile?: File) => void;
    userEmail?: string;
    onLogout: () => void;
}

const HomeHub: React.FC<HomeHubProps> = ({ onSelectSection, onPromptSubmit, userEmail, onLogout }) => {
    const [prompt, setPrompt] = useState('');
    const [selectedMode, setSelectedMode] = useState<AppSection>('LANDING_PAGES');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Reference Upload State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && prompt.trim()) {
            onPromptSubmit(prompt, selectedMode, selectedFile || undefined);
        }
    };

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    const selectMode = (mode: AppSection) => {
        setSelectedMode(mode);
        setIsDropdownOpen(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearReference = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-black font-bold text-xs">
                                {userEmail.substring(0, 2).toUpperCase()}
                            </div>
                            <button
                                onClick={onLogout}
                                className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                title="Sair"
                            >
                                <i className="fas fa-sign-out-alt"></i>
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

                            {/* Reference Upload Button */}
                            <div className="relative">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${previewUrl ? 'bg-lime-100 dark:bg-lime-500/20 text-lime-600 dark:text-lime-400' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                    title="Adicionar referência"
                                >
                                    <i className="fas fa-paperclip"></i>
                                </button>

                                {/* Preview Tooltip */}
                                {previewUrl && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-white/10 animate-in fade-in zoom-in-95">
                                        <div className="relative w-16 h-16 rounded overflow-hidden">
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); clearReference(); }}
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
                                onClick={() => prompt.trim() && onPromptSubmit(prompt, selectedMode, selectedFile || undefined)}
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
                                onClick={() => onPromptSubmit(suggestion, selectedMode)}
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
