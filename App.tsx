
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

const App: React.FC = () => {
    const { user, signOut, loading } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
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

    // Load Projects and History on Auth
    useEffect(() => {
        if (user) {
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
            setTabs([]);
            setGlobalHistory([]);
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
        const tempId = Date.now().toString();
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

        // Optimistic UI update
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);
        if (activeTabId === id) {
            // Find last active tab in CURRENT section
            const sectionTabs = newTabs.filter(t => t.section === currentSection);
            setActiveTabId(sectionTabs.length > 0 ? sectionTabs[sectionTabs.length - 1].id : null);
        }

        // Delete from DB
        await deleteProject(id);
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
            <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4">
                <div className="max-w-md w-full text-center space-y-6 p-8 bg-gray-900/40 rounded-3xl border border-red-500/20 backdrop-blur-xl shadow-2xl">
                    <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Configuração Pendente</h1>
                    <p className="text-gray-400">
                        As variáveis de ambiente do Supabase não foram encontradas.
                    </p>
                    <div className="bg-black/40 p-4 rounded-xl text-left text-xs font-mono text-gray-500 border border-white/5">
                        <p className="mb-2">Adicione na Vercel:</p>
                        <p className="text-lime-400">VITE_SUPABASE_URL</p>
                        <p className="text-lime-400">VITE_SUPABASE_ANON_KEY</p>
                    </div>
                </div>
            </div>
        );
    }

    // 1. Loading State
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-500"></div>
            </div>
        );
    }

    // 2. Auth Check (Login Required)
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-black text-white p-4">
                <div className="max-w-md w-full text-center space-y-8 p-8 bg-gray-900/40 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-lime-500/5 blur-3xl rounded-full transform scale-150"></div>
                    <div className="relative z-10">
                        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-lime-400 to-lime-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-lime-500/20 mb-6 rotate-3 transform hover:rotate-6 transition-transform">
                            <i className="fas fa-layer-group text-4xl text-black"></i>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Design Builder IA</h1>
                        <p className="text-gray-400">Plataforma de criação de assets para Landing Pages.</p>

                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="mt-8 w-full py-4 px-6 bg-white text-gray-900 rounded-xl font-bold text-lg hover:bg-lime-50 transition-all shadow-xl"
                        >
                            Entrar na Plataforma
                        </button>
                    </div>
                </div>
                {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
            </div>
        );
    }

    // 3. API Key Check (After Login)
    if (!hasKey) {
        return <ApiKeyInput onKeySet={() => setHasKey(true)} />;
    }


    // --- MAIN APP HUB (SELECTION SCREEN) ---
    if (!currentSection) {
        return (
            <div className="h-screen flex flex-col bg-gray-950 text-white font-sans overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
                <div className="flex items-center justify-between px-8 py-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-lime-400 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/20">
                            <i className="fas fa-layer-group text-black text-lg"></i>
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-white">Design Builder <span className="text-lime-400 font-light">IA</span></span>
                    </div>
                </div>

                <div className="flex-grow flex items-center justify-center p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
                        {/* LANDING PAGES APP */}
                        <div
                            onClick={() => setCurrentSection('LANDING_PAGES')}
                            className="group bg-gray-900/40 border border-white/10 hover:border-lime-500/50 rounded-[2rem] p-10 cursor-pointer backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-lime-500/10 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-lime-500/0 to-lime-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:bg-lime-500 group-hover:text-black transition-colors">
                                <i className="fas fa-laptop-code text-4xl text-lime-500 group-hover:text-black transition-colors"></i>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Landing Pages</h2>
                            <p className="text-gray-400 mb-8 text-lg">
                                Gerador de backgrounds de alta conversão. Foco em sujeitos humanos e produtos com posicionamento para texto.
                            </p>
                            <span className="inline-flex items-center text-lime-400 font-bold uppercase tracking-wider text-sm">
                                Acessar App <i className="fas fa-arrow-right ml-2 group-hover:translate-x-2 transition-transform"></i>
                            </span>
                        </div>

                        {/* DESIGNS APP */}
                        <div
                            onClick={() => setCurrentSection('DESIGNS')}
                            className="group bg-gray-900/40 border border-white/10 hover:border-purple-500/50 rounded-[2rem] p-10 cursor-pointer backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:bg-purple-500 group-hover:text-black transition-colors">
                                <i className="fas fa-palette text-4xl text-purple-500 group-hover:text-black transition-colors"></i>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Designs</h2>
                            <p className="text-gray-400 mb-8 text-lg">
                                Criação de assets gráficos, texturas e composições artísticas para redes sociais e marketing.
                            </p>
                            <span className="inline-flex items-center text-purple-400 font-bold uppercase tracking-wider text-sm">
                                Acessar App <i className="fas fa-arrow-right ml-2 group-hover:translate-x-2 transition-transform"></i>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- WORKSPACE VIEW (EXISTING LOGIC) ---
    return (
        <div className="h-screen flex flex-col bg-gray-950 text-white font-sans overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">

            {/* HEADER & TABS BAR */}
            <div className="bg-gray-900/80 backdrop-blur-md border-b border-white/5 flex flex-col z-50">

                {/* Top Bar */}
                <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setCurrentSection(null); setActiveTabId(null); }}
                            className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 transition-colors"
                            title="Voltar para Apps"
                        >
                            <i className="fas fa-th"></i>
                        </button>
                        <div className="h-6 w-px bg-white/10 mx-1"></div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg tracking-tight text-white leading-none">
                                {currentSection === 'LANDING_PAGES' ? 'Landing Pages' : 'Designs'}
                            </span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Workspace</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-xs text-gray-500 flex items-center gap-2 px-3 py-1 bg-black/20 rounded-full border border-white/5">
                            <i className="fas fa-server"></i> Processamento: <span className={generatingCount > 0 ? 'text-lime-400' : 'text-gray-400'}>{generatingCount}/2</span>
                        </div>
                        <button
                            onClick={() => setIsHistoryOpen(true)}
                            className="text-sm text-gray-300 hover:text-white flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <i className="fas fa-history text-lime-400"></i> Histórico
                        </button>

                        {user ? (
                            <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-black font-bold text-xs">
                                    {user.email?.substring(0, 2).toUpperCase()}
                                </div>
                                <button
                                    onClick={() => signOut()}
                                    className="text-xs text-gray-400 hover:text-white"
                                    title="Sair"
                                >
                                    <i className="fas fa-sign-out-alt"></i>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAuthModal(true)}
                                className="text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors font-medium"
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
                                    ? 'bg-gray-900/60 text-lime-400 border-t border-x border-white/5 shadow-[0_-5px_15px_rgba(0,0,0,0.3)] z-10'
                                    : 'bg-black/20 text-gray-500 hover:bg-white/5 hover:text-gray-300 border-transparent mb-[2px]'
                                }
                    `}
                        >
                            <i className={`fas ${tab.mode === 'HUMAN' ? 'fa-user' : tab.mode === 'OBJECT' ? 'fa-cube' : tab.mode === 'INFOPRODUCT' ? 'fa-chalkboard-teacher' : 'fa-magic'} text-xs opacity-70`}></i>
                            <span className="truncate">{tab.title}</span>
                            <button
                                onClick={(e) => closeTab(e, tab.id)}
                                className="ml-auto text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
                    px-3 py-2 rounded-t-xl text-gray-500 hover:text-white hover:bg-white/5 transition-colors mb-[2px]
                    ${activeTabId === null ? 'text-white bg-white/5' : ''}
                `}
                        title="Novo Projeto"
                    >
                        <i className="fas fa-plus"></i>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-grow relative overflow-hidden bg-gray-950 p-6">

                {/* Render All Workspaces (Hidden if inactive) to preserve state */}
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        className="h-full w-full"
                        style={{ display: activeTabId === tab.id ? 'block' : 'none' }}
                    >
                        <GeneratorWorkspace
                            mode={tab.mode}
                            section={currentSection}
                            isActive={activeTabId === tab.id}
                            setHasKey={setHasKey}
                            onAddToGlobalHistory={(item) => setGlobalHistory(prev => [item, ...prev])}
                            checkConcurrencyLimit={checkConcurrencyLimit}
                            onGenerationStart={() => setGeneratingCount(c => c + 1)}
                            onGenerationEnd={() => setGeneratingCount(c => c - 1)}
                            projectId={tab.id}
                        />
                    </div>
                ))}

                {/* New Tab / Hub View */}
                {activeTabId === null && (
                    <div className="h-full flex flex-col items-center justify-center animate-fadeIn pb-20 overflow-y-auto">
                        <div className="text-center mb-12 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-lime-500/10 rounded-full blur-[100px]"></div>
                            <h2 className="text-4xl font-bold mb-4 relative z-10 text-white">Novo Projeto</h2>
                            <p className="text-gray-400 relative z-10 max-w-lg mx-auto">
                                {currentSection === 'LANDING_PAGES'
                                    ? 'Crie backgrounds focados em conversão.'
                                    : 'Crie assets gráficos e designs criativos.'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl px-4 relative z-10">
                            {/* HUMAN CARD */}
                            <div
                                onClick={() => createTab('HUMAN')}
                                className="bg-gray-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-6 hover:bg-gray-800/60 hover:border-lime-500/30 transition-all cursor-pointer group shadow-2xl relative overflow-hidden flex flex-col"
                            >
                                <div className="w-14 h-14 bg-lime-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-lime-500/20 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-user-astronaut text-2xl text-black"></i>
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-lime-400 transition-colors">Pessoa (Simples)</h3>
                                <p className="text-gray-400 mb-6 text-xs leading-relaxed flex-grow">
                                    Ideal para especialistas e retratos. Mantém a fisionomia e expressões com fidelidade.
                                </p>
                                <span className="text-lime-400 font-bold text-xs flex items-center mt-auto">
                                    Criar <i className="fas fa-arrow-right ml-2 group-hover:translate-x-2 transition-transform"></i>
                                </span>
                            </div>

                            {/* INFOPRODUCT CARD */}
                            <div
                                onClick={() => createTab('INFOPRODUCT')}
                                className="bg-gray-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-6 hover:bg-gray-800/60 hover:border-amber-500/30 transition-all cursor-pointer group shadow-2xl relative overflow-hidden flex flex-col"
                            >
                                <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-chalkboard-teacher text-2xl text-black"></i>
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-amber-400 transition-colors">Infoprodutos</h3>
                                <p className="text-gray-400 mb-6 text-xs leading-relaxed flex-grow">
                                    Foco em cursos e mentorias. Gera camadas de profundidade, luzes de estúdio e melhora a postura/roupa do expert.
                                </p>
                                <span className="text-amber-400 font-bold text-xs flex items-center mt-auto">
                                    Criar <i className="fas fa-arrow-right ml-2 group-hover:translate-x-2 transition-transform"></i>
                                </span>
                            </div>

                            {/* OBJECT CARD */}
                            <div
                                onClick={() => createTab('OBJECT')}
                                className="bg-gray-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-6 hover:bg-gray-800/60 hover:border-blue-500/30 transition-all cursor-pointer group shadow-2xl relative overflow-hidden flex flex-col"
                            >
                                <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-cube text-2xl text-black"></i>
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">Produto</h3>
                                <p className="text-gray-400 mb-6 text-xs leading-relaxed flex-grow">
                                    Foco em geometria, materiais e iluminação realista (Ray-tracing) para objetos.
                                </p>
                                <span className="text-blue-400 font-bold text-xs flex items-center mt-auto">
                                    Criar <i className="fas fa-arrow-right ml-2 group-hover:translate-x-2 transition-transform"></i>
                                </span>
                            </div>

                            {/* ENHANCE CARD */}
                            <div
                                onClick={() => createTab('ENHANCE')}
                                className="bg-gray-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-6 hover:bg-gray-800/60 hover:border-purple-500/30 transition-all cursor-pointer group shadow-2xl relative overflow-hidden flex flex-col"
                            >
                                <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-wand-magic-sparkles text-2xl text-black"></i>
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-purple-400 transition-colors">Enhance</h3>
                                <p className="text-gray-400 mb-6 text-xs leading-relaxed flex-grow">
                                    Melhore imagens existentes. Aumente detalhes e iluminação mantendo a composição original.
                                </p>
                                <span className="text-purple-400 font-bold text-xs flex items-center mt-auto">
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
                    <div className="bg-gray-900 border border-white/10 w-full max-w-6xl h-[80vh] rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">

                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                            <h2 className="text-2xl font-bold text-white"><i className="fas fa-history text-lime-400 mr-2"></i> Galeria Global {currentSection ? `(${currentSection === 'LANDING_PAGES' ? 'Landing Pages' : 'Designs'})` : ''}</h2>
                            <button onClick={() => setIsHistoryOpen(false)} className="text-gray-400 hover:text-white p-2 text-xl">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* Grid */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700">
                            {displayedHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <i className="fas fa-images text-4xl mb-4 opacity-50"></i>
                                    <p>Nenhuma imagem encontrada nesta seção.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {displayedHistory.map((item) => (
                                        <div key={item.id} className="group relative aspect-[9/16] bg-black/40 rounded-xl overflow-hidden border border-white/5 hover:border-lime-500/50 transition-all">
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

        </div>
    );
};

export default App;