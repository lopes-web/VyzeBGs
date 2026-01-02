
import React, { useState, useEffect } from 'react';
import { checkApiKey, promptApiKeySelection } from './services/geminiService';
import { isSupabaseConfigured } from './services/supabaseClient';
import { createProject, getProjects, deleteProject, getUserHistory } from './services/databaseService';
import GeneratorWorkspace from './components/GeneratorWorkspace';
import ChatWidget from './components/ChatWidget';
import AuthModal from './components/AuthModal';
import ApiKeyInput from './components/ApiKeyInput';
import { useAuth } from './components/AuthContext';
import { GeneratorMode, ProjectTab, HistoryItem, AppSection } from './types';

import { ThemeProvider } from './components/ThemeContext';
import HomeHub from './components/HomeHub';
import ProfileModal from './components/ProfileModal';
import RemoveBgWorkspace from './components/RemoveBgWorkspace';
import WebPConverterWorkspace from './components/WebPConverterWorkspace';
import DesignsWorkspace from './components/DesignsWorkspace';

const AppContent: React.FC = () => {
    const { user, signOut, loading } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [hasKey, setHasKey] = useState(false);

    // App Navigation State
    const [currentSection, setCurrentSection] = useState<AppSection | null>(null);



    const [tabs, setTabs] = useState<ProjectTab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);

    // Global State
    const [globalHistory, setGlobalHistory] = useState<HistoryItem[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [generatingCount, setGeneratingCount] = useState(0);

    useEffect(() => {
        const verifyKey = async () => {
            try {
                const exists = await checkApiKey();
                setHasKey(exists);
            } catch (e) {
                console.error("Error checking API key", e);
            }
        };
        verifyKey();
    }, []);

    const lastUserId = React.useRef<string | null>(null);

    // Load Projects and History on Auth
    useEffect(() => {
        if (user) {
            // Only run if user ID has changed (prevents resecaon window focus/token refresh)
            if (lastUserId.current === user.id) return;
            lastUserId.current = user.id;

            // Force Hub view on login
            setCurrentSection(null);
            setActiveTabId(null);

            const loadData = async () => {
                // Projects
                const userProjects = await getProjects(user.id);
                if (userProjects) {
                    const loadedTabs: ProjectTab[] = userProjects.map((p: any) => ({
                        id: p.id,
                        title: p.title,
                        mode: p.mode as GeneratorMode,
                        section: p.section as AppSection,
                        createdAt: new Date(p.created_at).getTime()
                    }));
                    setTabs(loadedTabs);
                }

                // Global History
                const history = await getUserHistory(user.id);
                setGlobalHistory(history);
            };
            loadData();
        } else {
            lastUserId.current = null;
            setTabs([]);
            setGlobalHistory([]);
            setCurrentSection(null); // Also resecaon logout
        }
    }, [user]);

    const handleConnect = async () => {
        try {
            await promptApiKeySelection();
            setHasKey(true);
        } catch (e) {
            console.error(e);
        }
    };

    const createTab = async (mode: GeneratorMode, designCategory?: string) => {
        if (!currentSection || !user) return;

        const titleMap: Record<string, string> = {
            'HUMAN': 'Pessoa',
            'OBJECT': 'Produto',
            'ENHANCE': 'Edit',
            'INFOPRODUCT': 'Expert'
        };

        const title = `Projeto ${tabs.filter(t => t.section === currentSection).length + 1} (${titleMap[mode] || 'Novo'})`;

        // Optimistic UI update
        const tempId = crypto.randomUUID();
        const newTab: ProjectTab = {
            id: tempId,
            title: title,
            mode: mode,
            section: currentSection,
            createdAt: Date.now(),
            initialData: designCategory ? { designCategory } : undefined
        };
        setTabs([...tabs, newTab]);
        setActiveTabId(newTab.id);

        // Save to DB
        const savedProject = await createProject(user.id, title, mode, currentSection);
        if (savedProject) {
            // Update ID with real DB ID
            setTabs(prev => prev.map(t => t.id === tempId ? { ...t, id: savedProject.id } : t));
            setActiveTabId(savedProject.id);
        }
    };

    const closeTab = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();

        const tabToDelete = tabs.find(t => t.id === id);
        if (!tabToDelete) return;

        // Optimistic UI update
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);

        // Remove history items associated with this project
        setGlobalHistory(prev => prev.filter(h => h.projectId !== id));

        if (activeTabId === id) {
            // Find last active tab in CURRENT section
            const sectionTabs = newTabs.filter(t => t.section === currentSection);
            setActiveTabId(sectionTabs.length > 0 ? sectionTabs[sectionTabs.length - 1].id : null);
        }

        // Delete from DB
        const success = await deleteProject(id);
        if (!success) {
            // Revert if failed
            console.error("Failed to delete project from DB, reverting UI");
            setTabs(prev => {
                // Check if already added back (race condition safety)
                if (prev.find(t => t.id === id)) return prev;
                return [...prev, tabToDelete];
            });
            // Optional: Show error toast here
        }
    };

    const checkConcurrencyLimit = () => {
        return generatingCount < 2;
    };

    // Filter tabs for the current view
    const activeSectionTabs = currentSection ? tabs.filter(t => t.section === currentSection) : [];

    // Filter history for global view (can be toggled later, currently shows all but labeled)
    const displayedHistory = isHistoryOpen ? globalHistory.filter(h => !currentSection || h.section === currentSection) : [];

    if (!isSupabaseConfigured) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white p-4 transition-colors duration-300">
                <div className="max-w-md w-full text-center space-y-6 p-8 bg-white/60 dark:bg-gray-900/40 rounded-3xl border border-red-500/20 backdrop-blur-xl shadow-2xl">
                    <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configura??o Pendente</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        As vari?veis de ambiente do Supabase n?o foram encontradas.
                    </p>
                    <div className="bg-gray-100 dark:bg-black/40 p-4 rounded-xl text-left text-xs font-mono text-gray-500 border border-gray-200 dark:border-white/5">
                        <p className="mb-2">Adicione na Vercel:</p>
                        <p className="text-accent-dark dark:text-accent-light">VITE_SUPABASE_URL</p>
                        <p className="text-accent-dark dark:text-accent-light">VITE_SUPABASE_ANON_KEY</p>
                    </div>
                </div>
            </div>
        );
    }

    // 1. Loading State
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
        );
    }

    // 2. Auth Check (Login Required)
    if (!user) {
        return (
            <AuthModal onClose={() => { }} canClose={false} />
        );
    }

    // 3. API Key Check (After Login)
    if (!hasKey) {
        return <ApiKeyInput onKeySet={() => setHasKey(true)} />;
    }


    // --- MAIN APP HUB (SELECTION SCREEN) ---
    if (!currentSection) {
        return (
            <>
                <HomeHub
                    onSelectSection={setCurrentSection}
                    onPromptSubmit={async (prompt, section, principalFile, styleReferenceFile, generatorMode, secondaryFiles) => {
                        if (!user) return;

                        const tempId = crypto.randomUUID();
                        const newTab: ProjectTab = {
                            id: tempId,
                            title: `Projeto ${tabs.filter(t => t.section === section).length + 1} (${generatorMode === 'HUMAN' ? 'Pessoa' : generatorMode === 'OBJECT' ? 'Produto' : generatorMode === 'INFOPRODUCT' ? 'Expert' : 'Edit'})`,
                            mode: generatorMode || 'HUMAN',
                            section: section,
                            createdAt: Date.now(),
                            initialData: {
                                prompt,
                                referenceImage: principalFile,
                                styleReferenceImage: styleReferenceFile,
                                secondaryElements: secondaryFiles,
                                shouldAutoGenerate: true,
                                generatorMode
                            },
                            isOptimistic: true
                        };

                        // Update State
                        setTabs(prev => [...prev, newTab]);
                        setActiveTabId(tempId);
                        setCurrentSection(section); // Fix: Navigate to workspace

                        // Persist to DB
                        try {
                            const create = async () => {
                                const titleMap: Record<string, string> = {
                                    'HUMAN': 'Pessoa',
                                    'OBJECT': 'Produto',
                                    'ENHANCE': 'Edit',
                                    'INFOPRODUCT': 'Expert'
                                };
                                const title = `Projeto ${tabs.filter(t => t.section === section).length + 1} (${titleMap[generatorMode || 'HUMAN'] || 'Novo'})`;
                                const mode = generatorMode || 'HUMAN';

                                const savedProject = await createProject(user.id, title, mode, section);
                                if (savedProject) {
                                    setTabs(prev => prev.map(t => t.id === tempId ? { ...t, id: savedProject.id, isOptimistic: false } : t));
                                    setActiveTabId(prev => prev === tempId ? savedProject.id : prev);
                                }
                            };
                            create();
                        } catch (error) {
                            console.error("Failed to create project:", error);
                        }
                    }}
                    onNewProjectFromHistory={async ({ section, prompt, principalFile, styleReferenceFile, secondaryFiles, generatorMode }) => {
                        if (!user) return;

                        const tempId = crypto.randomUUID();
                        const newTab: ProjectTab = {
                            id: tempId,
                            title: `Projeto ${tabs.filter(t => t.section === section).length + 1} (Historico)`,
                            mode: generatorMode || 'HUMAN',
                            section: section,
                            createdAt: Date.now(),
                            initialData: {
                                prompt,
                                referenceImage: principalFile,
                                styleReferenceImage: styleReferenceFile,
                                secondaryElements: secondaryFiles,
                                shouldAutoGenerate: true,
                                generatorMode
                            }
                        };

                        // Update State
                        setTabs(prev => [...prev, newTab]);
                        setActiveTabId(tempId);

                        // Persist to DB
                        if (user) {
                            try {
                                const create = async () => {
                                    const titleMap: Record<string, string> = {
                                        'HUMAN': 'Pessoa',
                                        'OBJECT': 'Produto',
                                        'ENHANCE': 'Edit',
                                        'INFOPRODUCT': 'Expert'
                                    };
                                    const title = `Projeto ${tabs.filter(t => t.section === section).length + 1} (${titleMap[generatorMode || 'HUMAN'] || 'Novo'})`;
                                    const mode = generatorMode || 'HUMAN';

                                    const savedProject = await createProject(user.id, title, mode, section);
                                    if (savedProject) {
                                        setTabs(prev => prev.map(t => t.id === tempId ? { ...t, id: savedProject.id } : t));
                                    }
                                };
                                create();
                            } catch (error) {
                                console.error("Failed to create project:", error);
                            }
                        }
                    }}
                    userEmail={user.email}
                    onLogout={signOut}
                    onOpenProfile={() => setShowProfileModal(true)}
                />
                {/* PROFILE MODAL (HomeHub Context) */}
                {
                    showProfileModal && user && (
                        <ProfileModal
                            user={user}
                            onClose={() => setShowProfileModal(false)}
                            onLogout={() => {
                                setShowProfileModal(false);
                                signOut();
                            }}
                        />
                    )
                }
            </>
        );
    }


    if (currentSection === 'REMOVE_BG' as any) {
        return (
            <RemoveBgWorkspace
                onBack={() => setCurrentSection(null)}
            />
        );
    }

    if (currentSection === 'WEBP_CONVERTER') {
        return (
            <div className="h-[100dvh] w-full relative" style={{ backgroundColor: '#171717' }}>
                <WebPConverterWorkspace isActive={true} onBack={() => setCurrentSection(null)} />
            </div>
        );
    }

    // --- WORKSPACE VIEW (EXISTING LOGIC) ---
    return (
        <div className="h-screen flex flex-col text-white font-sans overflow-hidden" style={{ backgroundColor: '#171717' }}>

            {/* HEADER & TABS BAR */}
            <div className="flex flex-col z-50" style={{ backgroundColor: '#1F1F1F', borderBottom: '1px solid #2E2E2E' }}>

                {/* Top Bar */}
                <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setCurrentSection(null); setActiveTabId(null); }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            style={{ backgroundColor: '#171717', border: '1px solid #2E2E2E' }}
                            title="Voltar para Apps"
                        >
                            <i className="fas fa-th"></i>
                        </button>
                        <img src="/logo.webp" alt="Vyze Logo" className="h-8 w-auto" />
                        <div className="h-6 w-px mx-1" style={{ backgroundColor: '#2E2E2E' }}></div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg tracking-tight text-white leading-none">
                                {currentSection === 'LANDING_PAGES' ? 'Landing Pages' : 'Designs'}
                            </span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Workspace</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-xs text-gray-400 flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: '#171717', border: '1px solid #2E2E2E' }}>
                            <i className="fas fa-server"></i> Processamento: <span style={{ color: generatingCount > 0 ? '#00C087' : '#666' }}>{generatingCount}/2</span>
                        </div>
                        <button
                            onClick={() => setIsHistoryOpen(true)}
                            className="text-sm text-gray-300 hover:text-white flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                            style={{ backgroundColor: 'transparent' }}
                        >
                            <i className="fas fa-history" style={{ color: '#00C087' }}></i> Historico
                        </button>

                        {user ? (
                            <div className="flex items-center gap-3 pl-3" style={{ borderLeft: '1px solid #2E2E2E' }}>
                                <button
                                    onClick={() => setShowProfileModal(true)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-black font-bold text-xs hover:scale-105 transition-transform shadow-lg"
                                    style={{ backgroundColor: '#00C087' }}
                                    title="Meu Perfil"
                                >
                                    {user.email?.substring(0, 2).toUpperCase()}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAuthModal(true)}
                                className="text-sm text-white px-4 py-2 rounded-lg transition-colors font-medium"
                                style={{ backgroundColor: '#00C087' }}
                            >
                                Entrar
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs Container */}
                <div className="flex items-end px-4 gap-2 overflow-x-auto scrollbar-hide pt-2">
                    {activeSectionTabs.map(tab => (
                        <div
                            key={tab.id}
                            onClick={() => setActiveTabId(tab.id)}
                            className="group relative flex items-center gap-2 px-4 py-2 rounded-t-xl text-sm font-medium cursor-pointer transition-all min-w-[150px] max-w-[200px] select-none"
                            style={{
                                backgroundColor: activeTabId === tab.id ? '#171717' : '#1F1F1F',
                                borderTop: activeTabId === tab.id ? '1px solid #2E2E2E' : 'none',
                                borderLeft: activeTabId === tab.id ? '1px solid #2E2E2E' : 'none',
                                borderRight: activeTabId === tab.id ? '1px solid #2E2E2E' : 'none',
                                color: activeTabId === tab.id ? '#00C087' : '#888'
                            }}
                        >
                            <i className={`fas ${tab.mode === 'HUMAN' ? 'fa-user' : tab.mode === 'OBJECT' ? 'fa-cube' : tab.mode === 'INFOPRODUCT' ? 'fa-chalkboard-teacher' : 'fa-magic'} text-xs opacity-70`}></i>
                            <span className="truncate">{tab.title}</span>
                            <button
                                onClick={(e) => closeTab(e, tab.id)}
                                className="ml-auto text-gray-400 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <i className="fas fa-times text-xs"></i>
                            </button>

                            {/* Active Indicator Line */}
                            {activeTabId === tab.id && (
                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent rounded-t-full"></div>
                            )}
                        </div>
                    ))}

                    <button
                        onClick={() => setActiveTabId(null)}
                        className={`
                    px-3 py-2 rounded-t-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors mb-[2px]
                    ${activeTabId === null ? 'text-gray-900 dark:text-white bg-black/5 dark:bg-white/5' : ''}
                `}
                        title="Novo Projeto"
                    >
                        <i className="fas fa-plus"></i>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-grow relative overflow-hidden bg-gray-50 dark:bg-app-dark p-6 transition-colors duration-300">

                {/* Render All Workspaces (Hidden if inactive) to preserve state */}
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        className={`h-full w-full ${activeTabId === tab.id ? 'animate-fadeIn' : ''}`}
                        style={{ display: activeTabId === tab.id ? 'block' : 'none' }}
                    >
                        {tab.section === 'DESIGNS' ? (
                            <DesignsWorkspace
                                onAddToGlobalHistory={(item) => setGlobalHistory(prev => [item, ...prev])}
                                projectId={tab.id}
                                initialCategory={tab.initialData?.designCategory}
                            />
                        ) : (
                            <GeneratorWorkspace
                                mode={tab.mode}
                                section={tab.section}
                                initialPrompt={tab.initialData?.prompt}
                                initialReference={tab.initialData?.referenceImage || undefined}
                                initialStyleReference={tab.initialData?.styleReferenceImage || undefined}
                                initialGeneratorMode={tab.initialData?.generatorMode}
                                initialSecondaryElements={tab.initialData?.secondaryElements}
                                shouldAutoGenerate={tab.initialData?.shouldAutoGenerate}
                                isActive={activeTabId === tab.id}
                                setHasKey={setHasKey}
                                onAddToGlobalHistory={(item) => setGlobalHistory(prev => [item, ...prev])}
                                checkConcurrencyLimit={checkConcurrencyLimit}
                                onGenerationStart={() => setGeneratingCount(c => c + 1)}
                                onGenerationEnd={() => setGeneratingCount(c => Math.max(0, c - 1))}
                                projectId={tab.id}
                                isOptimistic={tab.isOptimistic}
                            />
                        )}
                    </div>
                ))}

                {/* New Tab / Hub View */}
                {activeTabId === null && (
                    <div className="h-full flex flex-col items-center justify-center animate-fadeIn pb-20 overflow-y-auto">
                        <div className="text-center mb-12 relative">
                            <h2 className="text-4xl font-bold mb-3 relative z-10 text-white">
                                Novo <span style={{ color: '#00C087' }}>Projeto</span>
                            </h2>
                            <p className="text-gray-500 relative z-10 max-w-lg mx-auto">
                                {currentSection === 'LANDING_PAGES'
                                    ? 'Crie backgrounds focados em conversao.'
                                    : 'Crie assets graficos e designs criativos.'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl px-4 relative z-10">

                            {currentSection === 'DESIGNS' ? (
                                <>
                                    {/* MOCKUPS CARD */}
                                    <div
                                        onClick={() => createTab('OBJECT', 'MOCKUPS')}
                                        className="group text-left p-6 rounded-xl transition-all duration-300 cursor-pointer hover:border-[#3E3E3E]"
                                        style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)' }}>
                                                <i className="fas fa-mobile-alt text-lg text-cyan-500"></i>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold text-white mb-1 group-hover:text-cyan-400 transition-colors">Mockups</h3>
                                                <p className="text-sm text-gray-500 leading-relaxed">
                                                    Dispositivos com <span className="text-gray-300">tela personalizavel</span> (iPhone, MacBook, iPad).
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ICONS CARD */}
                                    <div
                                        onClick={() => createTab('OBJECT', 'ICONS')}
                                        className="group text-left p-6 rounded-xl transition-all duration-300 cursor-pointer hover:border-[#3E3E3E]"
                                        style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                                                <i className="fas fa-gem text-lg text-violet-500"></i>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold text-white mb-1 group-hover:text-violet-400 transition-colors">Icones 3D</h3>
                                                <p className="text-sm text-gray-500 leading-relaxed">
                                                    Icones estilizados em <span className="text-gray-300">3D Glassmorphism, Neon, Clay</span>.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PRODUCTS CARD */}
                                    <div
                                        onClick={() => createTab('OBJECT', 'PRODUCTS')}
                                        className="group text-left p-6 rounded-xl transition-all duration-300 cursor-pointer hover:border-[#3E3E3E]"
                                        style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(0, 192, 135, 0.1)' }}>
                                                <i className="fas fa-box text-lg" style={{ color: '#00C087' }}></i>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold text-white mb-1 group-hover:text-[#00C087] transition-colors">Produtos</h3>
                                                <p className="text-sm text-gray-500 leading-relaxed">
                                                    Embalagens e frascos com <span className="text-gray-300">branding profissional</span>.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* LOGOS CARD */}
                                    <div
                                        onClick={() => createTab('OBJECT', 'LOGOS')}
                                        className="group text-left p-6 rounded-xl transition-all duration-300 cursor-pointer hover:border-[#3E3E3E]"
                                        style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)' }}>
                                                <i className="fas fa-palette text-lg text-rose-500"></i>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold text-white mb-1 group-hover:text-rose-400 transition-colors">Logos</h3>
                                                <p className="text-sm text-gray-500 leading-relaxed">
                                                    Sugestoes de logos baseadas no <span className="text-gray-300">nicho e estilo</span>.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CRIATIVOS CARD */}
                                    <div
                                        onClick={() => createTab('OBJECT', 'CRIATIVOS')}
                                        className="group text-left p-6 rounded-xl transition-all duration-300 cursor-pointer hover:border-[#3E3E3E]"
                                        style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(251, 146, 60, 0.1)' }}>
                                                <i className="fas fa-image text-lg text-orange-400"></i>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold text-white mb-1 group-hover:text-orange-400 transition-colors">Criativos</h3>
                                                <p className="text-sm text-gray-500 leading-relaxed">
                                                    Gere <span className="text-gray-300">imagens publicitárias</span> com texto e composição.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PROFILE CARD */}
                                    <div
                                        onClick={() => createTab('OBJECT', 'PROFILE')}
                                        className="group text-left p-6 rounded-xl transition-all duration-300 cursor-pointer hover:border-[#3E3E3E]"
                                        style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                                                <i className="fas fa-user-circle text-lg text-blue-500"></i>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">Foto de Perfil</h3>
                                                <p className="text-sm text-gray-500 leading-relaxed">
                                                    Gere <span className="text-gray-300">fotos profissionais 1:1</span> para LinkedIn e redes sociais.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* HUMAN CARD */}
                                    <div
                                        onClick={() => createTab('HUMAN')}
                                        className="group text-left p-6 rounded-xl transition-all duration-300 cursor-pointer hover:border-[#3E3E3E]"
                                        style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(0, 192, 135, 0.1)' }}>
                                                <i className="fas fa-user-astronaut text-lg" style={{ color: '#00C087' }}></i>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold text-white mb-1 group-hover:text-[#00C087] transition-colors">Pessoa (Simples)</h3>
                                                <p className="text-sm text-gray-500 leading-relaxed">
                                                    Mantem a <span className="text-gray-300">fisionomia e expressoes</span> com fidelidade.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* INFOPRODUCT CARD */}
                                    <div
                                        onClick={() => createTab('INFOPRODUCT')}
                                        className="group text-left p-6 rounded-xl transition-all duration-300 cursor-pointer hover:border-[#3E3E3E]"
                                        style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                                                <i className="fas fa-chalkboard-teacher text-lg text-amber-500"></i>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold text-white mb-1 group-hover:text-amber-400 transition-colors">Infoprodutos</h3>
                                                <p className="text-sm text-gray-500 leading-relaxed">
                                                    Foco em <span className="text-gray-300">cursos e mentorias</span> com luzes de estudio.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ENHANCE CARD */}
                                    <div
                                        onClick={() => createTab('ENHANCE')}
                                        className="group text-left p-6 rounded-xl transition-all duration-300 cursor-pointer hover:border-[#3E3E3E]"
                                        style={{ backgroundColor: '#1F1F1F', border: '1px solid #2E2E2E' }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                                                <i className="fas fa-wand-magic-sparkles text-lg text-purple-500"></i>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">Enhance</h3>
                                                <p className="text-sm text-gray-500 leading-relaxed">
                                                    Melhore imagens existentes mantendo a <span className="text-gray-300">composicao original</span>.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* CHAT WIDGET */}
            <ChatWidget />

            {/* GLOBAL HISTORY POPUP */}
            {isHistoryOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-8 animate-fadeIn">
                    <div className="bg-white dark:bg-app-dark border border-gray-200 dark:border-white/10 w-full max-w-6xl h-[80vh] rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">

                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 dark:border-white/5 flex items-center justify-between bg-gray-50 dark:bg-app-dark-lighter">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white"><i className="fas fa-history text-accent-dark dark:text-accent-light mr-2"></i> Galeria Global {currentSection ? `(${currentSection === 'LANDING_PAGES' ? 'Landing Pages' : 'Designs'})` : ''}</h2>
                            <button onClick={() => setIsHistoryOpen(false)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-2 text-xl">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* Grid */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                            {displayedHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <i className="fas fa-images text-4xl mb-4 opacity-50"></i>
                                    <p>Nenhuma imagem encontrada nesta secao.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {displayedHistory.map((item) => (
                                        <div key={item.id} className="group relative aspect-[9/16] bg-gray-100 dark:bg-black/40 rounded-xl overflow-hidden border border-gray-200 dark:border-white/5 hover:border-accent/50 transition-all">
                                            <img src={item.url} alt="History" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                <span className="text-xs font-bold text-accent-light mb-1 uppercase tracking-wider">{item.mode}</span>
                                                <p className="text-xs text-gray-300 line-clamp-2 mb-3">{item.prompt}</p>
                                                <a
                                                    href={item.url}
                                                    download={`design-builder-${item.id}.png`}
                                                    className="bg-accent text-black text-xs font-bold py-2 px-3 rounded-lg text-center hover:bg-accent-light transition-colors"
                                                >
                                                    Baixar
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* AUTH MODAL */}
            {showAuthModal && (
                <AuthModal onClose={() => setShowAuthModal(false)} />
            )}

            {/* PROFILE MODAL */}
            {showProfileModal && user && (
                <ProfileModal
                    user={user}
                    onClose={() => setShowProfileModal(false)}
                    onLogout={() => {
                        setShowProfileModal(false);
                        signOut();
                    }}
                />
            )}

        </div>
    );
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
};

export default App;

