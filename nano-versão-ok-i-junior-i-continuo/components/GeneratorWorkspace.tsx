
import React, { useState } from 'react';
import ImageUpload from './ImageUpload';
import PositionSelector from './PositionSelector';
import ReferenceManager from './ReferenceManager';
import { SubjectPosition, HistoryItem, ReferenceItem, GenerationAttributes, FramingType, LightingColors, ActiveColors } from '../types';
import { generateBackground, refineImage, reframeImageForTextLayout } from '../services/geminiService';
import { FRAMING_OPTIONS } from '../constants';

interface GeneratorWorkspaceProps {
    isActive: boolean; // Controls visibility for tab system
    setHasKey: (val: boolean) => void;
    onAddToGlobalHistory: (item: HistoryItem) => void;
    checkConcurrencyLimit: () => boolean;
    onGenerationStart: () => void;
    onGenerationEnd: () => void;
}

const GeneratorWorkspace: React.FC<GeneratorWorkspaceProps> = ({ 
    isActive, 
    setHasKey,
    onAddToGlobalHistory,
    checkConcurrencyLimit,
    onGenerationStart,
    onGenerationEnd
}) => {
  // --- STATE ---
  
  // 1. Context & Style
  const [niche, setNiche] = useState('');
  const [environment, setEnvironment] = useState('');
  const [useEnvironmentImages, setUseEnvironmentImages] = useState(false);
  const [environmentImages, setEnvironmentImages] = useState<string[]>([]);
  
  // 2. Visual Attributes
  const [colors, setColors] = useState<LightingColors>({ ambient: '#0f172a', rim: '#a3e635', complementary: '#6366f1' }); 
  const [activeColors, setActiveColors] = useState<ActiveColors>({ ambient: false, rim: false, complementary: false });
  const [ambientOpacity, setAmbientOpacity] = useState(50);
  const [framing, setFraming] = useState<FramingType>('MEDIUM');
  
  // 3. Floating Elements (New)
  const [useFloatingElements, setUseFloatingElements] = useState(true);
  const [floatingElementsPrompt, setFloatingElementsPrompt] = useState('');

  // 4. Uploads
  const [userImages, setUserImages] = useState<string[]>([]);
  const [subjectDescription, setSubjectDescription] = useState(''); 
  const [referenceItems, setReferenceItems] = useState<ReferenceItem[]>([]);
  const [assetImages, setAssetImages] = useState<string[]>([]);
  
  // 5. Composition
  const [position, setPosition] = useState<SubjectPosition>(SubjectPosition.RIGHT);
  const [attributes, setAttributes] = useState<GenerationAttributes>({ useGradient: true, useBlur: true });
  
  // 6. Config
  const [customHeight, setCustomHeight] = useState<number>(1080);
  
  // 7. Post-Processing
  const [verticalHeight, setVerticalHeight] = useState<number>(1920);
  const [verticalPrompt, setVerticalPrompt] = useState<string>(""); 
  const [refinePrompt, setRefinePrompt] = useState('');
  const [refineAssets, setRefineAssets] = useState<string[]>([]);

  // 8. System
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // History State
  const [localHistory, setLocalHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);

  // --- HANDLERS ---

  const addToHistory = (url: string, promptUsed: string) => {
      const newItem: HistoryItem = {
          id: Date.now().toString() + Math.random().toString(),
          url,
          prompt: promptUsed,
          timestamp: Date.now(),
          configuration: { 
              niche, 
              colors, 
              activeColors,
              framing, 
              ambientOpacity, 
              environment,
              environmentImages,
              subjectDescription,
              useFloatingElements,
              floatingElementsPrompt,
              attributes
          }
      };
      setLocalHistory(prev => [newItem, ...prev]);
      onAddToGlobalHistory(newItem);
  };

  const restoreFromHistory = (item: HistoryItem) => {
      setGeneratedImage(item.url);
      if (item.configuration) {
          setNiche(item.configuration.niche);
          setColors(item.configuration.colors);
          setFraming(item.configuration.framing);
          if (item.configuration.activeColors) setActiveColors(item.configuration.activeColors);
          if (item.configuration.ambientOpacity !== undefined) setAmbientOpacity(item.configuration.ambientOpacity);
          if (item.configuration.environment) setEnvironment(item.configuration.environment);
          if (item.configuration.environmentImages) {
              setEnvironmentImages(item.configuration.environmentImages);
              setUseEnvironmentImages(item.configuration.environmentImages.length > 0);
          }
          if (item.configuration.subjectDescription) setSubjectDescription(item.configuration.subjectDescription);
          if (item.configuration.useFloatingElements !== undefined) setUseFloatingElements(item.configuration.useFloatingElements);
          if (item.configuration.floatingElementsPrompt) setFloatingElementsPrompt(item.configuration.floatingElementsPrompt);
          if (item.configuration.attributes) setAttributes(item.configuration.attributes);
      }
  };

  const toggleHistorySelection = (id: string) => {
      setSelectedHistoryIds(prev => 
          prev.includes(id) ? prev.filter(hid => hid !== id) : [...prev, id]
      );
  };

  const handleMerge = () => {
      const selectedItems = localHistory.filter(item => selectedHistoryIds.includes(item.id));
      const imagesToMerge = selectedItems.map(item => item.url.split(',')[1]); 
      setUserImages(imagesToMerge);
      setReferenceItems([]); 
      setSelectedHistoryIds([]);
  };

  const handleGenerate = async () => {
    if (userImages.length === 0) {
      setError("Por favor, envie pelo menos uma foto do sujeito (pessoa).");
      return;
    }
    if (!niche.trim()) {
        setError("Por favor, defina o Nicho/Projeto (Ex: Trader, Dentista).");
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
      const result = await generateBackground(
        userImages,
        referenceItems,
        useEnvironmentImages ? environmentImages : [],
        assetImages,
        niche,
        environment,
        subjectDescription,
        colors,
        activeColors,
        ambientOpacity,
        framing,
        useFloatingElements,
        floatingElementsPrompt,
        position,
        attributes,
        customHeight
      );

      setGeneratedImage(result.image);
      addToHistory(result.image, result.finalPrompt);

    } catch (err: any) {
        if (err.message && err.message.includes("Requested entity was not found")) {
            setError("Chave de API inválida ou expirada.");
            setHasKey(false);
        } else {
            setError(`Erro na geração: ${err.message || "Erro desconhecido"}`);
        }
    } finally {
      setIsGenerating(false);
      onGenerationEnd();
    }
  };

  const handleRefine = async () => {
    if (!generatedImage || !refinePrompt) return;
    if (!checkConcurrencyLimit()) return;

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
      if (!checkConcurrencyLimit()) return;
      
      setIsGenerating(true);
      setError(null);
      onGenerationStart();

      try {
          const result = await reframeImageForTextLayout(generatedImage, verticalHeight, verticalPrompt);
          setGeneratedImage(result);
          addToHistory(result, `Formato Vertical (${verticalHeight}px)`);
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn h-full overflow-hidden" style={{ display: isActive ? 'grid' : 'none' }}>
          
          {/* LEFT PANEL: INPUTS */}
          <div className="lg:col-span-4 h-full flex flex-col relative bg-gray-900/40 backdrop-blur-xl border-r border-white/5 rounded-l-2xl overflow-hidden">
             
             <div className="flex-1 overflow-y-auto pr-2 pb-6 scrollbar-thin scrollbar-thumb-gray-700 p-6 space-y-6">
                
                {/* 1. COMPOSITION (MOVED TO TOP) */}
                <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 shadow-sm">
                   <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white/90">
                      <i className="fas fa-camera text-lime-400"></i> Sujeito Principal
                   </h2>
                   
                   <ImageUpload 
                     label="Fotos do Sujeito" 
                     value={userImages} 
                     onChange={setUserImages}
                     multiple={true}
                     description="Envie fotos para fidelidade facial."
                   />

                   <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Descrição do Sujeito (Opcional)</label>
                        <textarea 
                            value={subjectDescription}
                            onChange={(e) => setSubjectDescription(e.target.value)}
                            placeholder="Descreva pose, roupa, estilo, se deve segurar algo..."
                            className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-lime-500 outline-none text-xs font-medium resize-none h-20"
                        />
                   </div>
                   
                   <div className="mt-4">
                       <PositionSelector value={position} onChange={setPosition} />
                   </div>
                </div>

                {/* 2. CONTEXT */}
                <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 shadow-sm">
                   <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white/90">
                      <i className="fas fa-bullseye text-lime-400"></i> Contexto do Projeto
                   </h2>
                   
                   <div className="mb-4">
                       <label className="block text-xs font-medium text-gray-400 mb-1">Nicho / Profissão</label>
                       <input 
                           type="text" 
                           value={niche}
                           onChange={(e) => setNiche(e.target.value)}
                           placeholder="Ex: Trader de Elite, Dentista, Advogada..."
                           className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-lime-500 outline-none text-sm font-medium"
                       />
                   </div>

                   <div className="mb-4">
                       <label className="block text-xs font-medium text-gray-400 mb-1">Descrição do Ambiente</label>
                       <input 
                           type="text" 
                           value={environment}
                           onChange={(e) => setEnvironment(e.target.value)}
                           placeholder="Ex: Clínica de estética, Textura de mármore..."
                           className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-lime-500 outline-none text-sm font-medium mb-2"
                       />
                       
                       <div className="flex items-center justify-between mt-2">
                           <label className="text-xs text-gray-400">Usar Referência de Ambiente?</label>
                           <button 
                                onClick={() => setUseEnvironmentImages(!useEnvironmentImages)}
                                className={`w-8 h-4 rounded-full p-0.5 transition-colors ${useEnvironmentImages ? 'bg-lime-500' : 'bg-gray-700'}`}
                            >
                                <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${useEnvironmentImages ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </button>
                       </div>
                       
                       {useEnvironmentImages && (
                           <div className="mt-3 animate-fadeIn">
                               <ImageUpload 
                                    label="Foto do Ambiente"
                                    value={environmentImages}
                                    onChange={setEnvironmentImages}
                                    multiple={true}
                                    compact={true}
                               />
                           </div>
                       )}
                   </div>

                   {/* Floating Elements Control */}
                   <div className="mb-4">
                       <div className="flex items-center justify-between mb-2">
                           <label className="block text-xs font-medium text-gray-400">Elementos Flutuantes 3D</label>
                           <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 uppercase font-bold">{useFloatingElements ? "ATIVADO" : "DESATIVADO"}</span>
                                <button 
                                    onClick={() => setUseFloatingElements(!useFloatingElements)}
                                    className={`w-8 h-4 rounded-full p-0.5 transition-colors ${useFloatingElements ? 'bg-lime-500' : 'bg-gray-700'}`}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${useFloatingElements ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </button>
                           </div>
                       </div>
                       
                       {useFloatingElements && (
                           <input 
                               type="text" 
                               value={floatingElementsPrompt}
                               onChange={(e) => setFloatingElementsPrompt(e.target.value)}
                               placeholder="Ex: Ícones de vidro, partículas douradas, moedas..."
                               className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-lime-500 outline-none text-sm font-medium animate-fadeIn"
                           />
                       )}
                   </div>
                </div>

                {/* 3. VISUAL ATTRIBUTES (COLORS & FRAMING) */}
                <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 shadow-sm">
                   <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-white/90">
                            <i className="fas fa-palette text-lime-400"></i> Cores & Luz
                        </h2>
                   </div>

                   {/* Independent Color Controls */}
                   <div className="space-y-4 mb-6">
                       
                       {/* Ambient/Background Color */}
                       <div className="bg-black/20 p-3 rounded-xl border border-gray-700">
                           <div className="flex items-center justify-between mb-2">
                               <div className="flex items-center gap-2">
                                   <input 
                                     type="checkbox" 
                                     checked={activeColors.ambient} 
                                     onChange={(e) => setActiveColors({...activeColors, ambient: e.target.checked})}
                                     className="rounded bg-gray-700 border-gray-600 text-lime-500 focus:ring-lime-500"
                                   />
                                   <label className="text-xs font-medium text-gray-300">Cor do Fundo</label>
                               </div>
                               <input 
                                   type="color" 
                                   value={colors.ambient}
                                   onChange={(e) => setColors({...colors, ambient: e.target.value})}
                                   disabled={!activeColors.ambient}
                                   className={`w-6 h-6 rounded cursor-pointer bg-transparent border-none ${!activeColors.ambient && 'opacity-30'}`}
                               />
                           </div>
                           
                           {/* Opacity Slider (Only relevant if background color is active) */}
                           <div className={`transition-all ${activeColors.ambient ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] text-gray-500">Intensidade / Opacidade</span>
                                    <span className="text-[10px] font-bold text-lime-400">{ambientOpacity}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={ambientOpacity}
                                    onChange={(e) => setAmbientOpacity(Number(e.target.value))}
                                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-lime-500"
                                />
                           </div>
                       </div>

                       {/* Rim Light Color */}
                       <div className="bg-black/20 p-3 rounded-xl border border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <input 
                                 type="checkbox" 
                                 checked={activeColors.rim} 
                                 onChange={(e) => setActiveColors({...activeColors, rim: e.target.checked})}
                                 className="rounded bg-gray-700 border-gray-600 text-lime-500 focus:ring-lime-500"
                               />
                               <label className="text-xs font-medium text-gray-300">Rim Light (Recorte)</label>
                            </div>
                           <input 
                               type="color" 
                               value={colors.rim}
                               onChange={(e) => setColors({...colors, rim: e.target.value})}
                               disabled={!activeColors.rim}
                               className={`w-6 h-6 rounded cursor-pointer bg-transparent border-none ${!activeColors.rim && 'opacity-30'}`}
                           />
                       </div>

                       {/* Complementary Color */}
                       <div className="bg-black/20 p-3 rounded-xl border border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <input 
                                 type="checkbox" 
                                 checked={activeColors.complementary} 
                                 onChange={(e) => setActiveColors({...activeColors, complementary: e.target.checked})}
                                 className="rounded bg-gray-700 border-gray-600 text-lime-500 focus:ring-lime-500"
                               />
                               <label className="text-xs font-medium text-gray-300">Luz Complementar</label>
                            </div>
                           <input 
                               type="color" 
                               value={colors.complementary}
                               onChange={(e) => setColors({...colors, complementary: e.target.value})}
                               disabled={!activeColors.complementary}
                               className={`w-6 h-6 rounded cursor-pointer bg-transparent border-none ${!activeColors.complementary && 'opacity-30'}`}
                           />
                       </div>

                   </div>

                   {/* Framing Selection */}
                   <label className="block text-xs font-medium text-gray-400 mb-2">Enquadramento</label>
                   <div className="grid grid-cols-3 gap-2">
                       {FRAMING_OPTIONS.map((opt) => (
                           <button
                               key={opt.id}
                               onClick={() => setFraming(opt.id)}
                               className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                                   framing === opt.id 
                                       ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' 
                                       : 'bg-black/40 border-gray-700 text-gray-500 hover:border-gray-500'
                               }`}
                           >
                               <i className={`fas ${opt.icon} text-xl mb-1`}></i>
                               <span className="text-[10px] font-medium text-center leading-tight">{opt.label}</span>
                           </button>
                       ))}
                   </div>
                </div>

                {/* 4. ASSETS (References & Assets) */}
                <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 shadow-sm">
                   <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white/90">
                      <i className="fas fa-layer-group text-lime-400"></i> Referências & Estilo
                   </h2>
                   
                   <ReferenceManager 
                      items={referenceItems}
                      onChange={setReferenceItems}
                   />

                   <div className="mt-4">
                       {/* Secondary Options */}
                       <div className="flex gap-2 mb-4">
                           <button 
                                onClick={() => toggleAttribute('useGradient')}
                                className={`flex-1 py-2 text-xs rounded border ${attributes.useGradient ? 'border-lime-500 text-lime-400 bg-lime-500/10' : 'border-gray-700 text-gray-500'}`}
                           >
                               <i className="fas fa-adjust mr-1"></i> Degradê (Fade)
                           </button>
                           <button 
                                onClick={() => toggleAttribute('useBlur')}
                                className={`flex-1 py-2 text-xs rounded border ${attributes.useBlur ? 'border-lime-500 text-lime-400 bg-lime-500/10' : 'border-gray-700 text-gray-500'}`}
                           >
                               <i className="fas fa-tint mr-1"></i> Blur (Foco)
                           </button>
                       </div>
                   </div>
                </div>
                
                <div className="h-32"></div>
             </div>

             {/* FOOTER */}
             <div className="absolute bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-white/10 p-4 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || userImages.length === 0}
                    className={`
                        w-full py-4 px-6 rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-2
                        transition-all duration-300 transform hover:scale-[1.01] active:scale-95
                        ${isGenerating || userImages.length === 0
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                            : 'bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-gray-900 border border-lime-400'
                        }
                    `}
                >
                    {isGenerating ? (
                        <>
                            <i className="fas fa-circle-notch fa-spin"></i> Criando...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-magic"></i> Gerar Background
                        </>
                    )}
                </button>
                {error && (
                    <div className="mt-2 p-2 text-center text-xs text-red-400 bg-red-500/10 rounded">
                        <i className="fas fa-exclamation-triangle mr-1"></i> {error}
                    </div>
                )}
             </div>
          </div>

          {/* RIGHT PANEL: PREVIEW */}
          <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
             
             {/* Canvas */}
             <div className="bg-gray-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-1 shadow-2xl flex-grow relative overflow-hidden group mb-4 min-h-[400px]">
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
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 bg-black/20 rounded-xl">
                        {isGenerating ? (
                            <div className="text-center">
                                <div className="inline-block w-16 h-16 border-4 border-lime-500/30 border-t-lime-500 rounded-full animate-spin mb-4"></div>
                                <p className="text-lime-400 animate-pulse font-medium">Arquitetando Prompt & Renderizando...</p>
                            </div>
                        ) : (
                            <div className="text-center p-8">
                                <i className="fas fa-layer-group text-6xl mb-4 text-gray-800"></i>
                                <p className="text-xl font-medium text-gray-500">
                                    Preencha o Contexto do Nicho
                                </p>
                            </div>
                        )}
                    </div>
                )}
             </div>

             {/* Refinement */}
             {generatedImage && !isGenerating && (
                 <div className="bg-gray-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-lg mb-4">
                     <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={refinePrompt}
                            onChange={(e) => setRefinePrompt(e.target.value)}
                            placeholder="Ajuste fino (ex: 'Mais partículas no fundo')..."
                            className="flex-1 bg-black/40 border border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-lime-500 outline-none text-white"
                            onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                        />
                        <button 
                            onClick={handleRefine}
                            disabled={!refinePrompt}
                            className="bg-gray-800 hover:bg-gray-700 text-white px-4 rounded-xl text-sm font-medium transition-colors border border-gray-700"
                        >
                            Refinar
                        </button>
                     </div>
                 </div>
             )}

             {/* History Strip */}
             {localHistory.length > 0 && (
                 <div className="bg-gray-900/80 backdrop-blur-xl border border-white/5 rounded-t-2xl p-4 flex flex-col mt-auto shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                     <div className="flex items-center justify-between mb-2">
                         <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                             <i className="fas fa-history"></i> Histórico
                         </h3>
                         {selectedHistoryIds.length > 0 && (
                             <button 
                                onClick={handleMerge}
                                className="text-xs bg-lime-500 hover:bg-lime-400 text-black px-3 py-1 rounded font-bold transition-colors"
                             >
                                 <i className="fas fa-object-group mr-1"></i> Mesclar
                             </button>
                         )}
                     </div>
                     <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 h-28 items-center">
                         {localHistory.map(item => {
                             const isSelected = selectedHistoryIds.includes(item.id);
                             return (
                                 <div 
                                    key={item.id} 
                                    className={`relative flex-shrink-0 h-24 aspect-[16/9] rounded-lg overflow-hidden border-2 cursor-pointer transition-all group ${isSelected ? 'border-lime-500 ring-2 ring-lime-500/30' : 'border-gray-700 hover:border-gray-500'}`}
                                    onClick={() => restoreFromHistory(item)}
                                 >
                                     <img src={item.url} alt="Histórico" className="w-full h-full object-cover" />
                                     <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center p-2 text-center">
                                         <span className="text-[10px] text-lime-400 font-bold">Restaurar</span>
                                     </div>
                                     <div 
                                        className="absolute top-1 left-1 z-10"
                                        onClick={(e) => { e.stopPropagation(); toggleHistorySelection(item.id); }}
                                     >
                                         <div className={`w-4 h-4 rounded border ${isSelected ? 'bg-lime-500 border-lime-500' : 'bg-black/50 border-gray-400'} flex items-center justify-center`}>
                                             {isSelected && <i className="fas fa-check text-[10px] text-black"></i>}
                                         </div>
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                 </div>
             )}
          </div>
    </div>
  );
};

export default GeneratorWorkspace;
