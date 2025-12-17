
import React from 'react';
import { CreativeText, ReferenceItem, TextAlignment, TypographyStyle } from '../types';
import ReferenceManager from './ReferenceManager';

interface TextManagerProps {
  text: CreativeText;
  onTextChange: (text: CreativeText) => void;
  textReferences: ReferenceItem[];
  onReferencesChange: (refs: ReferenceItem[]) => void;
}

const TextManager: React.FC<TextManagerProps> = ({ 
  text, 
  onTextChange, 
  textReferences, 
  onReferencesChange 
}) => {

  const handleChange = (field: keyof CreativeText, value: any) => {
    onTextChange({ ...text, [field]: value });
  };

  const ColorPicker = ({ value, onChange, label }: { value?: string, onChange: (v: string) => void, label: string }) => (
      <div className="flex flex-col">
          <label className="text-[10px] text-gray-500 mb-1">{label}</label>
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-600 shadow-sm">
                <input 
                    type="color" 
                    value={value || '#ffffff'}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 m-0 border-none cursor-pointer"
                />
            </div>
          </div>
      </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Main Toggle */}
      <div className="flex items-center justify-between bg-gray-950 p-4 rounded-xl border border-gray-800">
        <label className="text-sm font-medium text-gray-300">Incluir Texto no Criativo</label>
        <button 
            onClick={() => handleChange('includeText', !text.includeText)}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${text.includeText ? 'bg-lime-500' : 'bg-gray-700'}`}
        >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${text.includeText ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

      {text.includeText && (
        <>
            {/* Settings Row */}
            <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                {/* Alignment */}
                <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Alinhamento</label>
                <div className="flex bg-gray-950 rounded-lg p-1 border border-gray-700">
                    {[
                    { id: TextAlignment.LEFT, icon: 'fa-align-left' },
                    { id: TextAlignment.CENTER, icon: 'fa-align-center' },
                    { id: TextAlignment.RIGHT, icon: 'fa-align-right' }
                    ].map((align) => (
                    <button
                        key={align.id}
                        onClick={() => onTextChange({...text, alignment: align.id})}
                        className={`flex-1 py-2 rounded-md transition-all ${text.alignment === align.id ? 'bg-gray-800 text-lime-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <i className={`fas ${align.icon}`}></i>
                    </button>
                    ))}
                </div>
                </div>

                {/* Style */}
                <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Estilo Tipográfico</label>
                <select 
                    value={text.style}
                    onChange={(e) => onTextChange({...text, style: e.target.value as TypographyStyle})}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-xs focus:border-lime-500 outline-none appearance-none"
                >
                    <option value={TypographyStyle.MODERN}>Modern Sans</option>
                    <option value={TypographyStyle.BOLD}>Bold Impact</option>
                    <option value={TypographyStyle.SERIF}>Classic Serif</option>
                    <option value={TypographyStyle.HANDWRITTEN}>Handwritten</option>
                    <option value={TypographyStyle.FUTURISTIC}>Futuristic</option>
                </select>
                </div>
            </div>

            {/* Content Inputs */}
            <div className="space-y-4 animate-fadeIn">
                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-lime-400 mb-1 uppercase tracking-wide">Headline (Título)</label>
                        <input 
                            type="text" 
                            value={text.headline}
                            onChange={(e) => handleChange('headline', e.target.value)}
                            placeholder="Ex: DESCONTOS DE VERÃO"
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-lime-500 outline-none font-bold"
                        />
                    </div>
                    <ColorPicker 
                        label="Cor" 
                        value={text.headlineColor} 
                        onChange={(v) => handleChange('headlineColor', v)} 
                    />
                </div>

                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Subheadline</label>
                        <input 
                            type="text" 
                            value={text.subheadline}
                            onChange={(e) => handleChange('subheadline', e.target.value)}
                            placeholder="Ex: Até 50% off em toda a loja"
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-lime-500 outline-none"
                        />
                    </div>
                    <ColorPicker 
                        label="Cor" 
                        value={text.subheadlineColor} 
                        onChange={(v) => handleChange('subheadlineColor', v)} 
                    />
                </div>

                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Call to Action (Botão)</label>
                        <input 
                            type="text" 
                            value={text.cta}
                            onChange={(e) => handleChange('cta', e.target.value)}
                            placeholder="Ex: COMPRAR AGORA"
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-lime-500 outline-none"
                        />
                    </div>
                     <ColorPicker 
                        label="Cor" 
                        value={text.ctaColor} 
                        onChange={(v) => handleChange('ctaColor', v)} 
                    />
                </div>
            </div>

            <div className="border-t border-gray-800 pt-4 animate-fadeIn">
                <ReferenceManager 
                    label="Referências de Tipografia & Layout"
                    description="Envie exemplos de layouts de texto, fontes ou designs que você gosta. Descreva o que copiar (ex: 'Use essa fonte bold', 'Texto alinhado a esquerda')."
                    items={textReferences}
                    onChange={onReferencesChange}
                />
            </div>
        </>
      )}
    </div>
  );
};

export default TextManager;
