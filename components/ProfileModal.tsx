import React, { useState, useEffect } from 'react';
import { saveApiKey, checkApiKey } from '../services/geminiService';
import { User } from '@supabase/supabase-js';

interface ProfileModalProps {
    user: User;
    onClose: () => void;
    onLogout: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onLogout }) => {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Load existing key (masked) if exists
        const loadKey = async () => {
            const exists = await checkApiKey();
            if (exists) {
                setApiKey('AIza***********************************');
            }
        };
        loadKey();
    }, []);

    const handleSaveKey = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!apiKey.trim()) {
            setError('A chave não pode estar vazia.');
            return;
        }

        if (!apiKey.startsWith('AIza')) {
            setError('A chave parece inválida (deve começar com "AIza").');
            return;
        }

        saveApiKey(apiKey.trim());
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-100 dark:bg-[#141414] p-4 font-sans transition-colors duration-300">
            <div className="w-full max-w-[400px] p-8 relative bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/5 transition-colors duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 transition-colors">
                    <i className="fas fa-times text-xl"></i>
                </button>

                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-lime-400 to-lime-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-lime-500/20">
                        <span className="text-3xl font-bold text-black">
                            {user.email?.substring(0, 2).toUpperCase()}
                        </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Meu Perfil
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {user.email}
                    </p>
                </div>

                {/* API Key Section */}
                <div className="mb-8">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Configuração da API</h3>
                    <form onSubmit={handleSaveKey} className="space-y-3">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i className="fas fa-key text-gray-400 dark:text-gray-600"></i>
                            </div>
                            <input
                                type={showKey ? "text" : "password"}
                                value={apiKey}
                                onChange={(e) => { setApiKey(e.target.value); setError(null); setSuccess(false); }}
                                placeholder="Nova API Key (AIza...)"
                                className="w-full bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#262626] rounded-lg py-2.5 pl-10 pr-10 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-700 focus:border-lime-500 dark:focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <i className={`fas ${showKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>

                        {error && <p className="text-red-500 text-xs">{error}</p>}
                        {success && <p className="text-lime-500 text-xs"><i className="fas fa-check-circle mr-1"></i> Chave salva com sucesso!</p>}

                        <button
                            type="submit"
                            className="w-full bg-gray-900 dark:bg-white/10 hover:bg-gray-800 dark:hover:bg-white/20 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                        >
                            Atualizar Chave
                        </button>
                    </form>
                    <div className="mt-3 text-center">
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-gray-500 hover:text-lime-600 dark:hover:text-lime-400 transition-colors inline-flex items-center gap-1"
                        >
                            Gerar nova chave no Google AI Studio <i className="fas fa-external-link-alt"></i>
                        </a>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={onLogout}
                    className="w-full border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <i className="fas fa-sign-out-alt"></i> Sair da Conta
                </button>
            </div>
        </div>
    );
};

export default ProfileModal;
