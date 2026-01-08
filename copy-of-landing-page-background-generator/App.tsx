
import React, { useState, useEffect } from 'react';
import { checkApiKey, promptApiKeySelection } from './services/geminiService';
import GeneratorWorkspace from './components/GeneratorWorkspace';
import ChatWidget from './components/ChatWidget';
import { GeneratorMode, ProjectTab, HistoryItem } from './types';

const App: React.FC = () => {
    const [hasKey, setHasKey] = useState(false);
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

    const [apiKeyInput, setApiKeyInput] = useState('');

    // ... (useEffect remains same)

    const handleConnect = async () => {
        try {
            if (apiKeyInput.trim()) {
                localStorage.setItem('gemini_api_key', apiKeyInput.trim());
                setHasKey(true);
                return;
            }
            await promptApiKeySelection();
            setHasKey(true);
        } catch (e) {
            console.error(e);
        }
    };

    const createTab = (mode: GeneratorMode) => {
        const newTab: ProjectTab = {
            id: Date.now().toString(),
            title: `Projeto ${tabs.length + 1} (${mode === 'HUMAN' ? 'Pessoa' : mode === 'OBJECT' ? 'Obj' : 'Edit'})`,
            mode: mode,
            createdAt: Date.now()
        };
        setTabs([...tabs, newTab]);
        setActiveTabId(newTab.id);
    };

    const closeTab = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);
        if (activeTabId === id) {
            setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
        }
    };

    const checkConcurrencyLimit = () => {
        return generatingCount < 2;
    };

    if (!hasKey) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-black text-white p-4">
                <div className="max-w-md w-full text-center space-y-8 p-8 bg-gray-900/40 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-lime-500/5 blur-3xl rounded-full transform scale-150"></div>
                    <div className="relative z-10">
                        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-lime-400 to-lime-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-lime-500/20 mb-6 rotate-3 transform hover:rotate-6 transition-transform">
                            <i className="fas fa-layer-group text-4xl text-black"></i>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Design Builder IA</h1>
                        <p className="text-gray-400 mb-6">Plataforma de criação de assets para Landing Pages.</p>

                        <div className="space-y-4">
                            <input
                                type="password"
                                placeholder="Cole sua Gemini API Key aqui..."
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                            />
                            <button
                                onClick={handleConnect}
                                className="w-full py-4 px-6 bg-white text-gray-900 rounded-xl font-bold text-lg hover:bg-lime-50 transition-all shadow-xl"
                            >
                                {apiKeyInput ? 'Entrar com Chave' : 'Conectar via AI Studio'}
                            </button>
                            <p className="text-xs text-gray-500">
                                Sua chave será salva localmente no navegador.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-950 text-white font-sans overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">

            {/* HEADER & TABS BAR */}
            <div className="bg-gray-900/80 backdrop-blur-md border-b border-white/5 flex flex-col z-50">

                {/* Top Bar */}
                <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-lime-400 to-lime-600 rounded-lg flex items-center justify-center shadow-lg shadow-lime-500/20">
                            <i className="fas fa-layer-group text-black text-sm"></i>
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white">Design Builder <span className="text-lime-400 font-light">IA</span></span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-xs text-gray-500 flex items-center gap-2 px-3 py-1 bg-black/20 rounded-full border border-white/5">
                            <i className="fas fa-server"></i> Processamento: <span className={generatingCount > 0 ? 'text-lime-400' : 'text-gray-400'}>{generatingCount}/2</span>
                        </div>
                        <button
                            onClick={() => setIsHistoryOpen(true)}
                            className="text-sm text-gray-300 hover:text-white flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <i className="fas fa-history text-lime-400"></i> Histórico Global
                        </button>
                        <button
                            onClick={() => {
                                localStorage.removeItem('gemini_api_key');
                                setHasKey(false);
                            }}
                            className="text-sm text-gray-500 hover:text-red-400 flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors"
                            title="Sair / Trocar Chave"
                        >
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </div>       </div>


                {/* Tabs Container */}
                <div className="flex items-end px-4 gap-2 overflow-x-auto scrollbar-hide pt-2">
                    {tabs.map(tab => (
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
                            <i className={`fas ${tab.mode === 'HUMAN' ? 'fa-user' : tab.mode === 'OBJECT' ? 'fa-cube' : 'fa-magic'} text-xs opacity-70`}></i>
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
                            isActive={activeTabId === tab.id}
                            setHasKey={setHasKey}
                            onAddToGlobalHistory={(item) => setGlobalHistory(prev => [item, ...prev])}
                            checkConcurrencyLimit={checkConcurrencyLimit}
                            onGenerationStart={() => setGeneratingCount(c => c + 1)}
                            onGenerationEnd={() => setGeneratingCount(c => c - 1)}
                        />
                    </div>
                ))}

                {/* New Tab / Hub View */}
                {activeTabId === null && (
                    <div className="h-full flex flex-col items-center justify-center animate-fadeIn pb-20">
                        <div className="text-center mb-12 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-lime-500/10 rounded-full blur-[100px]"></div>
                            <h2 className="text-4xl font-bold mb-4 relative z-10 text-white">Novo Projeto</h2>
                            <p className="text-gray-400 relative z-10 max-w-lg mx-auto">Escolha o tipo de background que deseja criar. Você pode manter vários projetos abertos nas abas acima.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl px-4 relative z-10">
                            {/* HUMAN CARD */}
                            <div
                                onClick={() => createTab('HUMAN')}
                                className="bg-gray-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-8 hover:bg-gray-800/60 hover:border-lime-500/30 transition-all cursor-pointer group shadow-2xl relative overflow-hidden"
                            >
                                <div className="w-16 h-16 bg-lime-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-lime-500/20 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-user-astronaut text-3xl text-black"></i>
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-lime-400 transition-colors">Pessoa</h3>
                                <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                                    Ideal para especialistas e retratos. Mantém a fisionomia e expressões com fidelidade.
                                </p>
                                <span className="text-lime-400 font-bold text-sm flex items-center">
                                    Criar <i className="fas fa-arrow-right ml-2 group-hover:translate-x-2 transition-transform"></i>
                                </span>
                            </div>

                            {/* OBJECT CARD */}
                            <div
                                onClick={() => createTab('OBJECT')}
                                className="bg-gray-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-8 hover:bg-gray-800/60 hover:border-blue-500/30 transition-all cursor-pointer group shadow-2xl relative overflow-hidden"
                            >
                                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-cube text-3xl text-black"></i>
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">Produto</h3>
                                <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                                    Foco em geometria, materiais e iluminação realista (Ray-tracing) para objetos.
                                </p>
                                <span className="text-blue-400 font-bold text-sm flex items-center">
                                    Criar <i className="fas fa-arrow-right ml-2 group-hover:translate-x-2 transition-transform"></i>
                                </span>
                            </div>

                            {/* ENHANCE CARD */}
                            <div
                                onClick={() => createTab('ENHANCE')}
                                className="bg-gray-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-8 hover:bg-gray-800/60 hover:border-purple-500/30 transition-all cursor-pointer group shadow-2xl relative overflow-hidden"
                            >
                                <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-wand-magic-sparkles text-3xl text-black"></i>
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-purple-400 transition-colors">Enhance</h3>
                                <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                                    Melhore imagens existentes. Aumente detalhes e iluminação mantendo a composição original.
                                </p>
                                <span className="text-purple-400 font-bold text-sm flex items-center">
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
            {
                isHistoryOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-8 animate-fadeIn">
                        <div className="bg-gray-900 border border-white/10 w-full max-w-6xl h-[80vh] rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">

                            {/* Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                                <h2 className="text-2xl font-bold text-white"><i className="fas fa-history text-lime-400 mr-2"></i> Galeria Global</h2>
                                <button onClick={() => setIsHistoryOpen(false)} className="text-gray-400 hover:text-white p-2 text-xl">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            {/* Grid */}
                            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700">
                                {globalHistory.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <i className="fas fa-images text-4xl mb-4 opacity-50"></i>
                                        <p>Nenhuma imagem gerada nesta sessão ainda.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {globalHistory.map((item) => (
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
                )
            }

        </div >
    );
};

export default App;
