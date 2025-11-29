import React, { useState } from 'react';
import { saveApiKey } from '../services/geminiService';

interface ApiKeyInputProps {
    onKeySet: () => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onKeySet }) => {
    const [key, setKey] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!key.trim()) {
            setError('Por favor, insira uma chave válida.');
            return;
        }
        if (!key.startsWith('AIza')) {
            setError('A chave parece inválida (geralmente começa com "AIza").');
            return;
        }

        saveApiKey(key.trim());
        onKeySet();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
            <div className="max-w-md w-full bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-lime-400 to-lime-600"></div>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-lime-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-lime-500/20">
                        <i className="fas fa-key text-2xl text-lime-400"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Configurar Gemini API</h2>
                    <p className="text-gray-400 text-sm">
                        Para gerar imagens, você precisa de uma API Key do Google AI Studio.
                        Ela será salva no seu navegador.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Sua API Key
                        </label>
                        <input
                            type="password"
                            value={key}
                            onChange={(e) => { setKey(e.target.value); setError(''); }}
                            placeholder="AIzaSy..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/50 transition-all font-mono text-sm"
                        />
                        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-lime-500 hover:bg-lime-400 text-black font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-lime-500/20"
                    >
                        Salvar e Continuar
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-lime-400 transition-colors flex items-center justify-center gap-1"
                    >
                        Não tem uma chave? <span className="underline">Gerar no Google AI Studio</span> <i className="fas fa-external-link-alt text-[10px]"></i>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyInput;
