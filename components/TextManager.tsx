import React from 'react';
import { CreativeText, TextAlignment, TypographyStyle } from '../types';

interface TextManagerProps {
    text: CreativeText;
    onChange: (text: CreativeText) => void;
}

const TYPOGRAPHY_STYLES = [
    { id: TypographyStyle.MODERN, label: 'Moderno', icon: 'fa-font' },
    { id: TypographyStyle.BOLD, label: 'Bold', icon: 'fa-bold' },
    { id: TypographyStyle.SERIF, label: 'Classico', icon: 'fa-pen-fancy' },
    { id: TypographyStyle.HANDWRITTEN, label: 'Manuscrito', icon: 'fa-signature' },
    { id: TypographyStyle.FUTURISTIC, label: 'Tech', icon: 'fa-microchip' },
];

const TextManager: React.FC<TextManagerProps> = ({ text, onChange }) => {
    const updateField = <K extends keyof CreativeText>(key: K, value: CreativeText[K]) => {
        onChange({ ...text, [key]: value });
    };

    return (
        <div className="space-y-5">
            {/* Toggle Include Text */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <i className="fas fa-text-height text-accent"></i>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Incluir Texto no Criativo</span>
                </div>
                <button
                    onClick={() => updateField('includeText', !text.includeText)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${text.includeText ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${text.includeText ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>

            {text.includeText && (
                <div className="space-y-5 animate-fadeIn">
                    {/* Headline */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Headline (Titulo Principal)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={text.headline}
                                onChange={(e) => updateField('headline', e.target.value)}
                                placeholder="Ex: TRANSFORME SUA VIDA"
                                className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500"
                            />
                            <input
                                type="color"
                                value={text.headlineColor}
                                onChange={(e) => updateField('headlineColor', e.target.value)}
                                className="w-12 h-12 rounded-lg cursor-pointer border-0"
                                title="Cor do Headline"
                            />
                        </div>
                    </div>

                    {/* Subheadline */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Subheadline (Texto Secundario)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={text.subheadline}
                                onChange={(e) => updateField('subheadline', e.target.value)}
                                placeholder="Ex: Resultados em ate 30 dias"
                                className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500"
                            />
                            <input
                                type="color"
                                value={text.subheadlineColor}
                                onChange={(e) => updateField('subheadlineColor', e.target.value)}
                                className="w-12 h-12 rounded-lg cursor-pointer border-0"
                                title="Cor do Subheadline"
                            />
                        </div>
                    </div>

                    {/* CTA */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            CTA (Botao/Call to Action)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={text.cta}
                                onChange={(e) => updateField('cta', e.target.value)}
                                placeholder="Ex: SAIBA MAIS"
                                className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500"
                            />
                            <input
                                type="color"
                                value={text.ctaColor}
                                onChange={(e) => updateField('ctaColor', e.target.value)}
                                className="w-12 h-12 rounded-lg cursor-pointer border-0"
                                title="Cor do CTA"
                            />
                        </div>
                    </div>

                    {/* Alignment */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Alinhamento do Texto
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: TextAlignment.LEFT, label: 'Esquerda', icon: 'fa-align-left' },
                                { id: TextAlignment.CENTER, label: 'Centro', icon: 'fa-align-center' },
                                { id: TextAlignment.RIGHT, label: 'Direita', icon: 'fa-align-right' },
                            ].map((align) => (
                                <button
                                    key={align.id}
                                    onClick={() => updateField('alignment', align.id)}
                                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${text.alignment === align.id
                                            ? 'bg-accent text-black'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <i className={`fas ${align.icon}`}></i>
                                    {align.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Typography Style */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Estilo de Tipografia
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {TYPOGRAPHY_STYLES.map((style) => (
                                <button
                                    key={style.id}
                                    onClick={() => updateField('style', style.id)}
                                    className={`flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-lg text-xs font-medium transition-all ${text.style === style.id
                                            ? 'bg-accent text-black'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <i className={`fas ${style.icon} text-lg`}></i>
                                    {style.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TextManager;

