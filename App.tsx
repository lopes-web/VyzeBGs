
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
import ThemeToggle from './components/ThemeToggle';
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
            // Only run if user ID has changed (prevents reset on window focus/token refresh)
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
            setCurrentSection(null); // Also reset on logout
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

    const createTab = async (mode: GeneratorMode) => {
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
            createdAt: Date.now()
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuração Pendente</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        As variáveis de ambiente do Supabase não foram encontradas.
                    </p>
                    <div className="bg-gray-100 dark:bg-black/40 p-4 rounded-xl text-left text-xs font-mono text-gray-500 border border-gray-200 dark:border-white/5">
                        <p className="mb-2">Adicione na Vercel:</p>
                        <p className="text-lime-600 dark:text-lime-400">VITE_SUPABASE_URL</p>
                        <p className="text-lime-600 dark:text-lime-400">VITE_SUPABASE_ANON_KEY</p>
                    </div>
                </div>
            </div>
        );
    }

    // 1. Loading State
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-500"></div>
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
                            title: `Projeto ${tabs.filter(t => t.section === section).length + 1} (Histórico)`,
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

    if (currentSection === 'DESIGNS') {
        return (
            <div className="h-[100dvh] w-full relative bg-app-dark">
                <button
                    onClick={() => setCurrentSection(null)}
                    className="absolute top-8 right-8 z-50 w-10 h-10 rounded-full bg-gray-200 dark:bg-app-dark-lighter hover:bg-red-500 hover:text-white text-gray-500 dark:text-gray-400 flex items-center justify-center transition-all backdrop-blur-md shadow-lg"
                    title="Voltar ao Hub"
                >
                    <i className="fas fa-times"></i>
                </button>
                <div className="h-full pt-20 px-8 pb-8">
                    <DesignsWorkspace onAddToGlobalHistory={(item) => setGlobalHistory(prev => [item, ...prev])} />
                </div>
            </div>
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
            <div className="h-[100dvh] w-full relative bg-app-dark">
                <button
                    onClick={() => setCurrentSection(null)}
                    className="absolute top-8 right-8 z-50 w-10 h-10 rounded-full bg-gray-200 dark:bg-app-dark-lighter hover:bg-red-500 hover:text-white text-gray-500 dark:text-gray-400 flex items-center justify-center transition-all backdrop-blur-md shadow-lg"
                    title="Voltar ao Hub"
                >
                    <i className="fas fa-times"></i>
                </button>
                <WebPConverterWorkspace isActive={true} />
            </div>
        );
    }

    // --- WORKSPACE VIEW (EXISTING LOGIC) ---
    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-app-dark text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">

            {/* HEADER & TABS BAR */}
            <div className="bg-white/80 dark:bg-app-dark backdrop-blur-md border-b border-gray-200 dark:border-white/5 flex flex-col z-50 transition-colors duration-300">

                {/* Top Bar */}
                <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setCurrentSection(null); setActiveTabId(null); }}
                            className="w-8 h-8 bg-black/5 dark:bg-black/20 hover:bg-black/10 dark:hover:bg-white/5 rounded-lg flex items-center justify-center text-gray-500 hover:text-lime-600 dark:hover:text-lime-400 transition-colors border border-transparent hover:border-black/5 dark:hover:border-white/5"
                            title="Voltar para Apps"
                        >
                            <i className="fas fa-th"></i>
                        </button>
                        <img src="/logo.webp" alt="Vyze Logo" className="h-8 w-auto" />
                        <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white leading-none">
                                {currentSection === 'LANDING_PAGES' ? 'Landing Pages' : 'Designs'}
                            </span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Workspace</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-xs text-gray-500 flex items-center gap-2 px-3 py-1 bg-black/5 dark:bg-black/20 rounded-full border border-black/5 dark:border-white/5">
                            <i className="fas fa-server"></i> Processamento: <span className={generatingCount > 0 ? 'text-lime-600 dark:text-lime-400' : 'text-gray-400'}>{generatingCount}/2</span>
                        </div>
                        <button
                            onClick={() => setIsHistoryOpen(true)}
                            className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <i className="fas fa-history text-lime-600 dark:text-lime-400"></i> Histórico
                        </button>

                        <ThemeToggle />

                        {user ? (
                            <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-white/10">
                                <button
                                    onClick={() => setShowProfileModal(true)}
                                    className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-black font-bold text-xs hover:scale-105 transition-transform shadow-lg shadow-lime-500/20"
                                    title="Meu Perfil"
                                >
                                    {user.email?.substring(0, 2).toUpperCase()}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAuthModal(true)}
                                className="text-sm bg-gray-900 dark:bg-white/10 hover:bg-gray-800 dark:hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors font-medium"
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
                            className={`
                        group relative flex items-center gap-2 px-4 py-2 rounded-t-xl text-sm font-medium cursor-pointer transition-all min-w-[150px] max-w-[200px] select-none
                        ${activeTabId === tab.id
                                    ? 'bg-white dark:bg-gray-900/60 text-lime-600 dark:text-lime-400 border-t border-x border-gray-200 dark:border-white/5 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_-5px_15px_rgba(0,0,0,0.3)] z-10'
                                    : 'bg-black/5 dark:bg-black/20 text-gray-500 hover:bg-black/10 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-gray-300 border-transparent mb-[2px]'
                                }
                    `}
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
                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-lime-500 rounded-t-full"></div>
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
                    </div>
                ))}

                {/* New Tab / Hub View */}
                {activeTabId === null && (
                    <div className="h-full flex flex-col items-center justify-center animate-fadeIn pb-20 overflow-y-auto">
                        <div className="text-center mb-12 relative">
                            <h2 className="text-4xl font-bold mb-4 relative z-10 text-gray-900 dark:text-white">Novo Projeto</h2>
                            <p className="text-gray-600 dark:text-gray-400 relative z-10 max-w-lg mx-auto">
                                {currentSection === 'LANDING_PAGES'
                                    ? 'Crie backgrounds focados em conversão.'
                                    : 'Crie assets gráficos e designs criativos.'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl px-4 relative z-10">
                            {/* HUMAN CARD */}
                            <div
                                onClick={() => createTab('HUMAN')}
                                className="bg-white/60 dark:bg-app-dark-lighter border border-gray-200 dark:border-white/5 rounded-3xl p-6 hover:bg-white/80 dark:hover:bg-app-dark hover:border-lime-500/30 transition-all cursor-pointer group shadow-xl dark:shadow-2xl relative overflow-hidden flex flex-col"
                            >
                                <div className="w-14 h-14 bg-lime-100 dark:bg-lime-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-lime-500/20 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-user-astronaut text-2xl text-lime-600 dark:text-black"></i>
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">Pessoa (Simples)</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 text-xs leading-relaxed flex-grow">
                                    Ideal para especialistas e retratos. Mantém a fisionomia e expressões com fidelidade.
                                </p>
                                <span className="text-lime-600 dark:text-lime-400 font-bold text-xs flex items-center mt-auto">
                                    Criar <i className="fas fa-arrow-right ml-2 group-hover:translate-x-2 transition-transform"></i>
                                </span>
                            </div>

                            {/* INFOPRODUCT CARD */}
                            <div
                                onClick={() => createTab('INFOPRODUCT')}
                                className="bg-white/60 dark:bg-app-dark-lighter border border-gray-200 dark:border-white/5 rounded-3xl p-6 hover:bg-white/80 dark:hover:bg-app-dark hover:border-amber-500/30 transition-all cursor-pointer group shadow-xl dark:shadow-2xl relative overflow-hidden flex flex-col"
                            >
                                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-chalkboard-teacher text-2xl text-amber-600 dark:text-black"></i>
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Infoprodutos</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 text-xs leading-relaxed flex-grow">
                                    Foco em cursos e mentorias. Gera camadas de profundidade, luzes de estúdio e melhora a postura/roupa do expert.
                                </p>
                                <span className="text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center mt-auto">
                                    Criar <i className="fas fa-arrow-right ml-2 group-hover:translate-x-2 transition-transform"></i>
                                </span>
                            </div>

                            {/* OBJECT CARD */}
                            <div
                                onClick={() => createTab('OBJECT')}
                                className="bg-white/60 dark:bg-app-dark-lighter border border-gray-200 dark:border-white/5 rounded-3xl p-6 hover:bg-white/80 dark:hover:bg-app-dark hover:border-blue-500/30 transition-all cursor-pointer group shadow-xl dark:shadow-2xl relative overflow-hidden flex flex-col"
                            >
                                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-cube text-2xl text-blue-600 dark:text-black"></i>
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Produto</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 text-xs leading-relaxed flex-grow">
                                    Foco em geometria, materiais e iluminação realista (Ray-tracing) para objetos.
                                </p>
                                <span className="text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center mt-auto">
                                    Criar <i className="fas fa-arrow-right ml-2 group-hover:translate-x-2 transition-transform"></i>
                                </span>
                            </div>

                            {/* ENHANCE CARD */}
                            <div
                                onClick={() => createTab('ENHANCE')}
                                className="bg-white/60 dark:bg-app-dark-lighter border border-gray-200 dark:border-white/5 rounded-3xl p-6 hover:bg-white/80 dark:hover:bg-app-dark hover:border-purple-500/30 transition-all cursor-pointer group shadow-xl dark:shadow-2xl relative overflow-hidden flex flex-col"
                            >
                                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-wand-magic-sparkles text-2xl text-purple-600 dark:text-black"></i>
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Enhance</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 text-xs leading-relaxed flex-grow">
                                    Melhore imagens existentes. Aumente detalhes e iluminação mantendo a composição original.
                                </p>
                                <span className="text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center mt-auto">
                                    Criar <i className="fas fa-arrow-right ml-2 group-hover:translate-x-2 transition-transform"></i>
                                </span>
                            </div>
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
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white"><i className="fas fa-history text-lime-600 dark:text-lime-400 mr-2"></i> Galeria Global {currentSection ? `(${currentSection === 'LANDING_PAGES' ? 'Landing Pages' : 'Designs'})` : ''}</h2>
                            <button onClick={() => setIsHistoryOpen(false)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-2 text-xl">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* Grid */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                            {displayedHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <i className="fas fa-images text-4xl mb-4 opacity-50"></i>
                                    <p>Nenhuma imagem encontrada nesta seção.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {displayedHistory.map((item) => (
                                        <div key={item.id} className="group relative aspect-[9/16] bg-gray-100 dark:bg-black/40 rounded-xl overflow-hidden border border-gray-200 dark:border-white/5 hover:border-lime-500/50 transition-all">
                                            <img src={item.url} alt="History" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                <span className="text-xs font-bold text-lime-400 mb-1 uppercase tracking-wider">{item.mode}</span>
                                                <p className="text-xs text-gray-300 line-clamp-2 mb-3">{item.prompt}</p>
                                                <a
                                                    href={item.url}
                                                    download={`design-builder-${item.id}.png`}
                                                    className="bg-lime-500 text-black text-xs font-bold py-2 px-3 rounded-lg text-center hover:bg-lime-400 transition-colors"
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
