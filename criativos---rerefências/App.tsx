
import React, { useState, useEffect } from 'react';
import ImageUpload from './components/ImageUpload';
import PositionSelector from './components/PositionSelector';
import ReferenceManager from './components/ReferenceManager';
import TextManager from './components/TextManager';
import DimensionSelector from './components/DimensionSelector';
import AreaSelector from './components/AreaSelector';
import { SubjectPosition, HistoryItem, ReferenceItem, GenerationAttributes, CreativeText, AspectRatio, TextAlignment, TypographyStyle } from './types';
import { checkApiKey, promptApiKeySelection, generateCreative, refineImage } from './services/geminiService';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
  
  // --- STATE ---
  const [userImages, setUserImages] = useState<string[]>([]);
  const [visualReferences, setVisualReferences] = useState<ReferenceItem[]>([]);
  const [textReferences, setTextReferences] = useState<ReferenceItem[]>([]);
  const [assetImages, setAssetImages] = useState<string[]>([]);
  
  const [creativeText, setCreativeText] = useState<CreativeText>({ 
      includeText: true,
      headline: '', 
      headlineColor: '#ffffff',
      subheadline: '', 
      subheadlineColor: '#e5e7eb',
      cta: '',
      ctaColor: '#bef264', // default lime-400
      alignment: TextAlignment.CENTER,
      style: TypographyStyle.MODERN
  });
  const [userPrompt, setUserPrompt] = useState('');
  const [position, setPosition] = useState<SubjectPosition>(SubjectPosition.RIGHT);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.PORTRAIT);
  const [attributes, setAttributes] = useState<GenerationAttributes>({ 
      useGradient: true, 
      useBlur: false, 
      useMainColor: false,
      mainColor: '#000000' 
  });

  // UI State
  const [activeTab, setActiveTab] = useState<'VISUAL' | 'TEXT'>('VISUAL');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit & History
  const [refinePrompt, setRefinePrompt] = useState('');
  const [isSelectingArea, setIsSelectingArea] = useState(false);
  const [refineMask, setRefineMask] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

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

  const handleConnect = async () => {
    try {
      await promptApiKeySelection();
      setHasKey(true); 
    } catch (e) {
      console.error(e);
      setError("Falha ao conectar ao Google AI Studio.");
    }
  };

  const addToHistory = (url: string, promptUsed: string) => {
      const newItem: HistoryItem = {
          id: Date.now().toString(),
          url,
          prompt: promptUsed,
          timestamp: Date.now()
      };
      setHistory(prev => [newItem, ...prev]);
  };

  const restoreFromHistory = (item: HistoryItem) => {
      setGeneratedImage(item.url);
      setRefineMask(null);
      setIsSelectingArea(false);
  };

  // Modified to optionally accept an override for aspect ratio
  const handleGenerate = async (overrideRatio?: AspectRatio) => {
    if (userImages.length === 0) {
      setError("Por favor, envie a foto do produto ou pessoa principal.");
      return;
    }

    const ratioToUse = overrideRatio || aspectRatio;
    // If overriding, update the state so UI reflects it
    if (overrideRatio) setAspectRatio(overrideRatio);
    
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setRefineMask(null);
    setIsSelectingArea(false);

    try {
      const result = await generateCreative(
        userImages,
        visualReferences,
        textReferences,
        assetImages,
        creativeText,
        userPrompt,
        position,
        attributes,
        ratioToUse
      );
      setGeneratedImage(result.image);
      addToHistory(result.image, result.finalPrompt);
    } catch (err: any) {
      if (err.message && err.message.includes("Requested entity was not found")) {
          setError("Chave de API inválida ou expirada. Reconecte.");
          setHasKey(false);
      } else {
          setError(err.message || "Ocorreu um erro inesperado.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async () => {
    if (!generatedImage || !refinePrompt) return;
    setIsGenerating(true);
    setError(null);
    try {
        const result = await refineImage(generatedImage, refinePrompt, refineMask);
        setGeneratedImage(result);
        addToHistory(result, `Ajuste: ${refinePrompt} ${refineMask ? '(Com Máscara)' : ''}`);
        setRefinePrompt(''); 
        setRefineMask(null); // Reset mask after use
        setIsSelectingArea(false);
    } catch (err: any) {
        setError(err.message || "Falha ao refinar imagem.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      // Convert Data URL to Blob for reliable downloading of large files
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `easy-creative-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed:", e);
      setError("Erro ao salvar a imagem. Tente novamente.");
    }
  };

  const toggleAttribute = (key: keyof GenerationAttributes) => {
      setAttributes(prev => ({...prev, [key]: !prev[key]}));
  };

  if (!hasKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900 text-white p-4">
        <div className="max-w-md w-full text-center space-y-8 p-8 bg-gray-900/50 rounded-2xl border border-gray-800 backdrop-blur-xl shadow-2xl">
          <div className="mx-auto w-20 h-20 bg-lime-500 rounded-2xl flex items-center justify-center shadow-lg shadow-lime-500/20 rotate-3">
             <i className="fas fa-paint-brush text-4xl text-black"></i>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Easy.Creative</h1>
            <p className="text-gray-400">Gere criativos de alta performance com Texto, Layout e IA.</p>
          </div>
          <button
            onClick={handleConnect}
            className="w-full py-4 px-6 bg-white text-gray-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl"
          >
            Conectar API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-lime-500/30">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-lime-500 rounded-lg flex items-center justify-center shadow-md shadow-lime-500/10">
                <i className="fas fa-paint-brush text-black text-xl"></i>
             </div>
             <span className="font-bold text-2xl tracking-tight">Easy.<span className="text-lime-400">Creative</span></span>
          </div>
          <div className="flex items-center gap-4">
              <a href="#" onClick={() => setHasKey(false)} className="text-xs text-gray-500 hover:text-gray-300">Trocar Chave</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT PANEL: CONFIGURATION */}
          <div className="lg:col-span-5 space-y-6 h-fit overflow-y-auto max-h-[calc(100vh-100px)] scrollbar-thin scrollbar-thumb-gray-700 pb-20">
            
            {/* 1. Global Dimensions */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
               <DimensionSelector value={aspectRatio} onChange={setAspectRatio} />
            </div>

            {/* 2. Assets (Subject) */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <i className="fas fa-user-circle text-lime-400"></i> Sujeito & Assets
                </h2>
                <ImageUpload 
                    label="Imagem Principal (Pessoa/Produto)" 
                    value={userImages} 
                    onChange={setUserImages}
                    multiple={true}
                    description="100% de fidelidade será mantida."
                />
                <div className="mt-4">
                     <ImageUpload 
                        label="Logo / Selo (Opcional)" 
                        value={assetImages} 
                        onChange={setAssetImages}
                        multiple={true}
                    />
                </div>
            </div>

            {/* 3. TABS: Style vs Text */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="flex border-b border-gray-800">
                    <button 
                        onClick={() => setActiveTab('VISUAL')}
                        className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'VISUAL' ? 'bg-gray-800 text-lime-400 border-b-2 border-lime-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <i className="fas fa-image mr-2"></i> Estilo Visual
                    </button>
                    <button 
                        onClick={() => setActiveTab('TEXT')}
                        className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'TEXT' ? 'bg-gray-800 text-lime-400 border-b-2 border-lime-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <i className="fas fa-font mr-2"></i> Texto & Layout
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'VISUAL' ? (
                        <div className="animate-fadeIn space-y-6">
                             <ReferenceManager 
                                items={visualReferences}
                                onChange={setVisualReferences}
                                label="Referências de Cenário/Fundo"
                                description="Envie imagens para inspirar a iluminação, cores e ambiente."
                             />

                             <PositionSelector value={position} onChange={setPosition} />

                             {/* Optional Color Picker Section */}
                             <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                                 <div className="flex items-center justify-between mb-3">
                                     <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                         <i className="fas fa-palette text-lime-400"></i> Cor Dominante (Opcional)
                                     </label>
                                     <button 
                                        onClick={() => toggleAttribute('useMainColor')}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${attributes.useMainColor ? 'bg-lime-500' : 'bg-gray-700'}`}
                                     >
                                         <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${attributes.useMainColor ? 'translate-x-6' : 'translate-x-0'}`} />
                                     </button>
                                 </div>

                                 {attributes.useMainColor && (
                                     <div className="flex items-center gap-3 animate-fadeIn">
                                         <input 
                                            type="color" 
                                            value={attributes.mainColor || '#000000'}
                                            onChange={(e) => setAttributes({...attributes, mainColor: e.target.value})}
                                            className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none p-0 overflow-hidden"
                                         />
                                         <input 
                                            type="text"
                                            value={attributes.mainColor || ''}
                                            onChange={(e) => setAttributes({...attributes, mainColor: e.target.value})}
                                            placeholder="#000000"
                                            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-lime-500 outline-none"
                                         />
                                     </div>
                                 )}
                                 <p className="text-xs text-gray-500 mt-2">
                                     {attributes.useMainColor 
                                        ? "O IA forçará o uso desta cor na composição." 
                                        : "O IA decidirá a cor com base nas referências e imagem do produto."}
                                 </p>
                             </div>
                             
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Prompt Adicional (Cenário)</label>
                                <textarea
                                    value={userPrompt}
                                    onChange={(e) => setUserPrompt(e.target.value)}
                                    placeholder="Descreva o ambiente se não tiver referências..."
                                    className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-lime-500 outline-none h-24"
                                />
                             </div>

                             <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => toggleAttribute('useGradient')} className={`p-3 rounded-lg border text-xs font-medium ${attributes.useGradient ? 'border-lime-500 text-lime-400' : 'border-gray-700 text-gray-400'}`}>
                                    <i className={`fas ${attributes.useGradient ? 'fa-check' : 'fa-minus'} mr-1`}></i> Gradiente Leitura
                                </button>
                             </div>
                        </div>
                    ) : (
                        <div className="animate-fadeIn">
                            <TextManager 
                                text={creativeText}
                                onTextChange={setCreativeText}
                                textReferences={textReferences}
                                onReferencesChange={setTextReferences}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* GENERATE BUTTON */}
            <button
                onClick={() => handleGenerate()}
                disabled={isGenerating || userImages.length === 0}
                className={`
                    w-full py-5 px-6 rounded-xl font-bold text-xl shadow-xl flex items-center justify-center gap-2
                    transition-all duration-300 transform hover:-translate-y-1
                    ${isGenerating || userImages.length === 0
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-gray-900'
                    }
                `}
            >
                {isGenerating ? (
                    <>
                        <i className="fas fa-circle-notch fa-spin"></i> Criando Anúncio...
                    </>
                ) : (
                    <>
                        <i className="fas fa-magic"></i> Gerar Criativo
                    </>
                )}
            </button>
             {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <i className="fas fa-exclamation-triangle mr-2"></i> {error}
                </div>
            )}
          </div>

          {/* RIGHT PANEL: PREVIEW */}
          <div className="lg:col-span-7 flex flex-col h-full sticky top-24">
             <div className="bg-gray-900 border border-gray-800 rounded-2xl p-2 shadow-xl flex-grow min-h-[600px] flex items-center justify-center relative overflow-hidden group">
                {generatedImage ? (
                    <div className="relative w-full h-full">
                        <AreaSelector 
                            imageSrc={generatedImage} 
                            onMaskChange={setRefineMask}
                            isSelecting={isSelectingArea}
                            onCancel={() => setIsSelectingArea(false)}
                        />
                         {/* Download Button - Moved out of hidden group hover for better UX */}
                         <div className="absolute top-4 right-4 flex gap-2">
                            <button 
                                onClick={handleDownload}
                                className="bg-gray-900/90 hover:bg-lime-600 hover:text-black text-white p-3 rounded-lg backdrop-blur-sm border border-gray-700 transition-colors shadow-lg"
                                title="Baixar Imagem"
                            >
                                <i className="fas fa-download"></i>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-600 opacity-50">
                        {isGenerating ? (
                            <div className="text-center">
                                <div className="inline-block w-16 h-16 border-4 border-lime-500/30 border-t-lime-500 rounded-full animate-spin mb-4"></div>
                                <p className="text-lime-400 animate-pulse font-medium">Renderizando Texto & Imagem...</p>
                            </div>
                        ) : (
                            <div className="text-center p-8">
                                <i className="fas fa-layer-group text-6xl mb-4 text-gray-800"></i>
                                <p className="text-xl font-medium text-gray-500">Preview do Criativo</p>
                                <p className="text-sm text-gray-600 max-w-sm mt-2">
                                    Configure o formato, textos e referências visuais para começar.
                                </p>
                            </div>
                        )}
                    </div>
                )}
             </div>

             {/* Refinement */}
             {generatedImage && !isGenerating && (
                 <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-lg mt-6">
                     <div className="flex flex-col gap-3">
                         
                         {/* Quick Resizes */}
                         <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-800">
                             <span className="text-xs text-gray-400 font-medium">Gerar Variação:</span>
                             {[
                                { id: AspectRatio.SQUARE, icon: 'fa-square' },
                                { id: AspectRatio.PORTRAIT, icon: 'fa-tablet-alt' },
                                { id: AspectRatio.STORY, icon: 'fa-mobile-alt' }
                              ].map(r => (
                                 <button
                                    key={r.id}
                                    onClick={() => handleGenerate(r.id as AspectRatio)}
                                    disabled={aspectRatio === r.id} // Disable current ratio to prevent redundant clicks
                                    className={`px-3 py-1 rounded-md text-xs border transition-colors flex items-center gap-2 ${aspectRatio === r.id ? 'bg-lime-500/10 border-lime-500 text-lime-400 cursor-default' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                                 >
                                    <i className={`fas ${r.icon}`}></i>
                                    {r.id.split(':')[0]}:{r.id.split(':')[1]}
                                 </button>
                             ))}
                         </div>

                         {/* Tools Row */}
                         <div className="flex gap-2 mb-1">
                             <button 
                                onClick={() => {
                                    setIsSelectingArea(!isSelectingArea);
                                    if(isSelectingArea) setRefineMask(null);
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${isSelectingArea ? 'bg-lime-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                             >
                                 <i className={`fas ${isSelectingArea ? 'fa-check' : 'fa-crop-alt'}`}></i>
                                 {isSelectingArea ? 'Terminar Seleção' : 'Selecionar Área'}
                             </button>
                             {refineMask && (
                                 <span className="text-xs text-lime-400 flex items-center animate-pulse">
                                     <i className="fas fa-check-circle mr-1"></i> Área Definida
                                 </span>
                             )}
                         </div>

                         <div className="flex gap-2">
                             <input 
                                type="text" 
                                value={refinePrompt}
                                onChange={(e) => setRefinePrompt(e.target.value)}
                                placeholder="Ajuste: 'Aumente o texto', 'Mude a cor do fundo'..."
                                className="flex-1 bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-lime-500 outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                             />
                             <button 
                                onClick={handleRefine}
                                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors"
                             >
                                 Refinar
                             </button>
                         </div>
                     </div>
                 </div>
             )}
             
             {/* Simple History */}
             {history.length > 0 && (
                <div className="mt-6 overflow-x-auto pb-4">
                    <div className="flex gap-3">
                         {history.map((item) => (
                            <div key={item.id} onClick={() => restoreFromHistory(item)} className="w-16 h-16 rounded-lg overflow-hidden cursor-pointer border border-gray-700 hover:border-lime-500 flex-shrink-0 relative">
                                <img src={item.url} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
