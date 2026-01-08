
import React, { useState } from 'react';
import ImageUpload from './ImageUpload';
import PositionSelector from './PositionSelector';
import ReferenceManager from './ReferenceManager';
import { SubjectPosition, HistoryItem, ReferenceItem, GenerationAttributes, GeneratorMode } from '../types';
import { generateBackground, refineImage, reframeImageForTextLayout } from '../services/geminiService';

interface GeneratorWorkspaceProps {
    mode: GeneratorMode;
    isActive: boolean; // Controls visibility for tab system
    setHasKey: (val: boolean) => void;
    onAddToGlobalHistory: (item: HistoryItem) => void;
    checkConcurrencyLimit: () => boolean;
    onGenerationStart: () => void;
    onGenerationEnd: () => void;
}

const GeneratorWorkspace: React.FC<GeneratorWorkspaceProps> = ({ 
    mode, 
    isActive, 
    setHasKey,
    onAddToGlobalHistory,
    checkConcurrencyLimit,
    onGenerationStart,
    onGenerationEnd
}) => {
  // Inputs
  const [userImages, setUserImages] = useState<string[]>([]);
  const [referenceItems, setReferenceItems] = useState<ReferenceItem[]>([]);
  const [assetImages, setAssetImages] = useState<string[]>([]);
  
  const [userPrompt, setUserPrompt] = useState('');
  const [position, setPosition] = useState<SubjectPosition>(SubjectPosition.RIGHT);
  const [attributes, setAttributes] = useState<GenerationAttributes>({ useGradient: true, useBlur: false });
  const [batchSize, setBatchSize] = useState<number>(1);

  const [customHeight, setCustomHeight] = useState<number>(1080);
  const [verticalHeight, setVerticalHeight] = useState<number>(1920);
  const [verticalPrompt, setVerticalPrompt] = useState<string>(""); 
  
  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit
  const [refinePrompt, setRefinePrompt] = useState('');
  const [refineAssets, setRefineAssets] = useState<string[]>([]);

  // Local History (still kept for restoration logic, but also synced globally)
  const [localHistory, setLocalHistory] = useState<HistoryItem[]>([]);

  const addToHistory = (url: string, promptUsed: string) => {
      const newItem: HistoryItem = {
          id: Date.now().toString() + Math.random().toString(),
          url,
          prompt: promptUsed,
          timestamp: Date.now(),
          mode: mode
      };
      setLocalHistory(prev => [newItem, ...prev]);
      onAddToGlobalHistory(newItem);
  };

  // Restore logic is local to this tab
  const restoreFromHistory = (item: HistoryItem) => {
      setGeneratedImage(item.url);
      if (item.prompt && item.prompt !== "Auto-generated from references") {
         setUserPrompt(item.prompt);
      }
  };

  const getModeLabel = () => {
      switch(mode) {
          case 'HUMAN': return 'Pessoas (Sujeito)';
          case 'OBJECT': return 'Objeto/Produto';
          case 'ENHANCE': return 'Imagem Original';
          default: return 'Sujeito';
      }
  };

  const getUploadLabel = () => {
      switch(mode) {
          case 'HUMAN': return 'Fotos da Pessoa';
          case 'OBJECT': return 'Fotos do Objeto';
          case 'ENHANCE': return 'Imagem Base para Melhorar';
          default: return 'Imagens';
      }
  };

  const getUploadDesc = () => {
      switch(mode) {
          case 'HUMAN': return "Envie fotos para fidelidade facial.";
          case 'OBJECT': return "Envie fotos do produto em alta resolução.";
          case 'ENHANCE': return "A imagem original será mantida, mas enriquecida.";
          default: return "";
      }
  };

  const handleGenerate = async () => {
    if (userImages.length === 0) {
      setError(mode === 'ENHANCE' ? "Envie a imagem que deseja melhorar." : "Por favor, envie pelo menos uma foto do sujeito.");
      return;
    }

    if (!checkConcurrencyLimit()) {
        setError("Limite de gerações simultâneas atingido (Max 2). Aguarde uma terminar.");
        return;
    }
    
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    onGenerationStart();

    try {
      // BATCH GENERATION LOGIC
      const requests = [];
      for (let i = 0; i < batchSize; i++) {
          const variationNoise = batchSize > 1 ? ` (Variation ${i+1}: slightly vary lighting and micro-details)` : "";
          const effectivePrompt = userPrompt + variationNoise;

          requests.push(
              generateBackground(
                mode,
                userImages,
                referenceItems,
                assetImages,
                effectivePrompt,
                position,
                attributes,
                customHeight
              )
          );
      }

      const results = await Promise.allSettled(requests);
      
      const successResults = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<{image: string, finalPrompt: string}>[];
      const failResults = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];

      if (successResults.length > 0) {
          setGeneratedImage(successResults[0].value.image);
          successResults.forEach(res => {
              addToHistory(res.value.image, res.value.finalPrompt);
          });
      }

      if (failResults.length > 0) {
          const errMsg = failResults[0].reason?.message || "Erro desconhecido";
          if (errMsg.includes("Requested entity was not found")) {
              setError("Chave de API inválida ou expirada.");
              setHasKey(false);
          } else {
              setError(`Algumas gerações falharam: ${errMsg}`);
          }
      }

    } catch (err: any) {
        setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setIsGenerating(false);
      onGenerationEnd();
    }
  };

  const handleRefine = async () => {
    if (!generatedImage || !refinePrompt) return;

    if (!checkConcurrencyLimit()) {
        setError("Limite de gerações simultâneas atingido (Max 2).");
        return;
    }

    setIsGenerating(true);
    setError(null);
    onGenerationStart();

    try {
        const result = await refineImage(generatedImage, refinePrompt, refineAssets);
        setGeneratedImage(result);
        addToHistory(result, `Ajuste: ${refinePrompt}`);
        setRefinePrompt(''); 
        setRefineAssets([]);
    } catch (err: any) {
        setError(err.message || "Falha ao refinar imagem.");
    } finally {
        setIsGenerating(false);
        onGenerationEnd();
    }
  };

  const handleValidateAndFormat = async () => {
      if (!generatedImage) return;

      if (!checkConcurrencyLimit()) {
        setError("Limite de gerações simultâneas atingido (Max 2).");
        return;
      }
      
      setIsGenerating(true);
      setError(null);
      onGenerationStart();

      try {
          const result = await reframeImageForTextLayout(generatedImage, verticalHeight, verticalPrompt);
          setGeneratedImage(result);
          addToHistory(result, `Formato Vertical (${verticalHeight}px) - ${verticalPrompt || 'Padrão'}`);
      } catch (err: any) {
          setError(err.message || "Falha ao formatar imagem.");
      } finally {
          setIsGenerating(false);
          onGenerationEnd();
      }
  };

  const toggleAttribute = (key: keyof GenerationAttributes) => {
      setAttributes(prev => ({...prev, [key]: !prev[key]}));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn h-full" style={{ display: isActive ? 'grid' : 'none' }}>
          
          {/* LEFT PANEL: CONTROLS (GLASS STYLE) */}
          <div className="lg:col-span-4 space-y-6 h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700">
            
            {/* Image Inputs */}
            <div className="bg-gray-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl">
               <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white/90">
                  <i className={`fas ${mode === 'HUMAN' ? 'fa-user' : mode === 'OBJECT' ? 'fa-cube' : 'fa-wand-magic'} text-lime-400`}></i> 
                  {getModeLabel()}
               </h2>
               <ImageUpload 
                 label={getUploadLabel()} 
                 value={userImages} 
                 onChange={setUserImages}
                 multiple={true}
                 description={getUploadDesc()}
               />
               
               <ReferenceManager 
                  items={referenceItems}
                  onChange={setReferenceItems}
               />

               <ImageUpload 
                 label="Elementos Secundários" 
                 value={assetImages} 
                 onChange={setAssetImages}
                 multiple={true}
                 description="Logotipos ou elementos extras."
               />
            </div>

            {/* Configuration */}
            <div className="bg-gray-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white/90">
                    <i className="fas fa-sliders-h text-lime-400"></i> Configuração
                </h2>
                
                <PositionSelector value={position} onChange={setPosition} />

                {/* Attributes Toggles */}
                <div className="mb-6 grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => toggleAttribute('useGradient')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                            attributes.useGradient 
                                ? 'bg-lime-500/10 border-lime-500 text-lime-400' 
                                : 'bg-black/40 border-gray-700 text-gray-400'
                        }`}
                    >
                        <i className={`fas ${attributes.useGradient ? 'fa-check-square' : 'fa-square'}`}></i>
                        Degradê (Fade)
                    </button>
                    <button 
                        onClick={() => toggleAttribute('useBlur')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                            attributes.useBlur 
                                ? 'bg-lime-500/10 border-lime-500 text-lime-400' 
                                : 'bg-black/40 border-gray-700 text-gray-400'
                        }`}
                    >
                         <i className={`fas ${attributes.useBlur ? 'fa-check-square' : 'fa-square'}`}></i>
                         Blur (Rack Focus)
                    </button>
                </div>

                {/* Dimensions Input */}
                <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Largura (px)</label>
                        <input 
                            type="number" 
                            value={1920} 
                            disabled 
                            className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-gray-500 text-sm cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Altura (px)</label>
                        <input 
                            type="number" 
                            value={customHeight} 
                            onChange={(e) => setCustomHeight(Number(e.target.value))}
                            className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-lime-500 outline-none"
                            min={500}
                            max={2160}
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        {mode === 'ENHANCE' ? 'Instruções de Melhoria' : 'Prompt do Cenário'}
                    </label>
                    <textarea
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        placeholder={
                            mode === 'ENHANCE' 
                            ? "Descreva o que melhorar..." 
                            : (referenceItems.length > 0 ? "Se vazio, mesclará referências..." : "Descreva o cenário...")
                        }
                        className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition-all min-h-[100px]"
                    />
                </div>
            </div>
            
            {/* BATCH SELECTOR */}
            <div className="flex items-center justify-between px-2">
                 <span className="text-sm text-gray-400">Quantidade:</span>
                 <div className="flex gap-2 bg-black/40 p-1 rounded-lg border border-gray-800">
                     {[1, 2, 3, 4].map(num => (
                         <button
                            key={num}
                            onClick={() => setBatchSize(num)}
                            className={`w-8 h-8 rounded text-sm font-bold transition-all ${
                                batchSize === num ? 'bg-lime-500 text-black shadow' : 'text-gray-500 hover:text-white'
                            }`}
                         >
                             {num}x
                         </button>
                     ))}
                 </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={isGenerating || userImages.length === 0}
                className={`
                    w-full py-4 px-6 rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-2
                    transition-all duration-300 transform hover:scale-[1.01]
                    ${isGenerating || userImages.length === 0
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                        : 'bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-gray-900 border border-lime-400'
                    }
                `}
            >
                {isGenerating ? (
                    <>
                        <i className="fas fa-circle-notch fa-spin"></i> {mode === 'ENHANCE' ? 'Melhorando' : 'Criando'} {batchSize > 1 ? `(${batchSize}x)` : ''}...
                    </>
                ) : (
                    <>
                        <i className="fas fa-wand-magic-sparkles"></i> {mode === 'ENHANCE' ? 'Melhorar Imagem' : 'Gerar Fundo'} {batchSize > 1 ? `(${batchSize}x)` : ''}
                    </>
                )}
            </button>
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm backdrop-blur-sm">
                    <i className="fas fa-exclamation-triangle mr-2"></i> {error}
                </div>
            )}
          </div>

          {/* RIGHT PANEL: PREVIEW */}
          <div className="lg:col-span-8 flex flex-col h-full">
             
             {/* Main Preview */}
             <div className="bg-gray-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-1 shadow-2xl flex-grow min-h-[500px] relative overflow-hidden group mb-6">
                {generatedImage ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black/20 rounded-xl overflow-hidden">
                        <img 
                            src={generatedImage} 
                            alt="Generated Background" 
                            className="max-w-full max-h-full object-contain shadow-2xl"
                        />
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <a 
                                href={generatedImage} 
                                download="design-builder.png"
                                className="bg-black/60 hover:bg-lime-600 hover:text-black text-white p-3 rounded-lg backdrop-blur-md border border-white/10 transition-colors"
                                title="Baixar Imagem"
                            >
                                <i className="fas fa-download"></i>
                            </a>
                        </div>
                        
                        {/* Validation Actions Overlay */}
                        {!isGenerating && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-4 shadow-2xl">
                                    <div className="flex-1 w-full">
                                        <input 
                                            type="text" 
                                            value={verticalPrompt}
                                            onChange={(e) => setVerticalPrompt(e.target.value)}
                                            placeholder="Prompt Vertical (Opcional)"
                                            className="w-full bg-transparent border-b border-gray-600 px-3 py-2 text-xs text-white focus:border-lime-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pl-4">
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-gray-500">H:</span>
                                            <input 
                                                type="number" 
                                                value={verticalHeight}
                                                onChange={(e) => setVerticalHeight(Number(e.target.value))}
                                                className="w-14 bg-gray-800 border border-gray-600 rounded text-xs px-1 py-1 text-white text-center"
                                            />
                                        </div>
                                        <button 
                                            onClick={handleValidateAndFormat}
                                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
                                        >
                                            <i className="fas fa-mobile-alt"></i> Formatar 9:16
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 bg-black/20 rounded-xl min-h-[500px]">
                        {isGenerating ? (
                            <div className="text-center">
                                <div className="inline-block w-16 h-16 border-4 border-lime-500/30 border-t-lime-500 rounded-full animate-spin mb-4"></div>
                                <p className="text-lime-400 animate-pulse font-medium">Renderizando com Gemini...</p>
                            </div>
                        ) : (
                            <div className="text-center p-8">
                                <i className={`fas ${mode === 'HUMAN' ? 'fa-user-circle' : mode === 'OBJECT' ? 'fa-cube' : 'fa-wand-magic'} text-6xl mb-4 text-gray-800`}></i>
                                <p className="text-xl font-medium text-gray-500">
                                    {mode === 'ENHANCE' ? 'Melhorar Imagem' : `Criar ${mode === 'HUMAN' ? 'Pessoa' : 'Objeto'}`}
                                </p>
                            </div>
                        )}
                    </div>
                )}
             </div>

             {/* Refinement */}
             {generatedImage && !isGenerating && (
                 <div className="bg-gray-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-lg animate-fadeIn mb-6">
                     <label className="block text-sm font-medium text-gray-300 mb-2 flex justify-between">
                         <span><i className="fas fa-sliders-h mr-2 text-lime-400"></i>Ajustes Finos</span>
                     </label>
                     <div className="flex flex-col gap-3">
                         <div className="flex gap-2 items-start">
                             <div className="w-24">
                                <ImageUpload 
                                    label="" 
                                    value={refineAssets} 
                                    onChange={setRefineAssets} 
                                    multiple={true}
                                    description=""
                                />
                             </div>
                             <div className="flex-1 flex gap-2">
                                <input 
                                    type="text" 
                                    value={refinePrompt}
                                    onChange={(e) => setRefinePrompt(e.target.value)}
                                    placeholder="Ex: 'Deixe a luz mais quente'..."
                                    className="flex-1 bg-black/40 border border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-lime-500 outline-none h-12 text-white"
                                    onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                                />
                                <button 
                                    onClick={handleRefine}
                                    disabled={!refinePrompt}
                                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 h-12 border border-gray-700"
                                >
                                    Refinar
                                </button>
                             </div>
                         </div>
                     </div>
                 </div>
             )}
             
             {/* Local history strip removed, moved to global popup per request */}
          </div>
    </div>
  );
};

export default GeneratorWorkspace;