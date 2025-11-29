
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('Check your email for the confirmation link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onClose();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#141414] p-4 font-sans">
            <div className="w-full max-w-[400px] p-8 relative bg-[#1a1a1a] rounded-2xl shadow-2xl border border-white/5">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-gray-400 transition-colors">
                    <i className="fas fa-times text-xl"></i>
                </button>

                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-[#141414] rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-inner-custom shadow-black/40">
                        <img src="/logo.webp" alt="Logo" className="w-8 h-auto" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {isSignUp ? 'Criar uma conta' : 'Entrar no Design Builder'}
                    </h2>
                    <div className="flex items-center gap-1 text-sm">
                        <span className="text-gray-500">
                            {isSignUp ? 'Já tem uma conta?' : 'Novo no workspace?'}
                        </span>
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-[#039E73] hover:text-[#04d49b] font-medium transition-colors"
                        >
                            {isSignUp ? 'Entrar' : 'Criar uma conta'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-5">
                    {/* Email Input */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-gray-500 tracking-wider uppercase">E-mail de Trabalho</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i className="fas fa-envelope text-gray-600 group-focus-within:text-gray-400 transition-colors"></i>
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="voce@empresa.com"
                                className="w-full bg-[#141414] border border-[#262626] rounded-lg py-2.5 pl-10 pr-3 text-sm text-white placeholder-gray-700 focus:border-[#039E73] focus:ring-1 focus:ring-[#039E73] outline-none transition-all shadow-inner-custom shadow-black/40"
                                required
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="block text-[10px] font-bold text-gray-500 tracking-wider uppercase">Senha</label>
                            {!isSignUp && (
                                <button type="button" className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
                                    Esqueceu?
                                </button>
                            )}
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i className="fas fa-lock text-gray-600 group-focus-within:text-gray-400 transition-colors"></i>
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Digite sua senha"
                                className="w-full bg-[#141414] border border-[#262626] rounded-lg py-2.5 pl-10 pr-12 text-sm text-white placeholder-gray-700 focus:border-[#039E73] focus:ring-1 focus:ring-[#039E73] outline-none transition-all shadow-inner-custom shadow-black/40"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-600 hover:text-gray-400 transition-colors font-medium"
                            >
                                {showPassword ? 'Ocultar' : 'Mostrar'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#039E73] hover:bg-[#027a59] text-white font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-[#039E73]/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <i className="fas fa-circle-notch fa-spin"></i> Processando...
                            </span>
                        ) : (
                            isSignUp ? 'Criar conta' : 'Continuar para o dashboard'
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-[10px] text-gray-600 leading-relaxed">
                    Ao continuar, você concorda com os <a href="#" className="text-gray-500 hover:text-gray-400">Termos</a> e <a href="#" className="text-gray-500 hover:text-gray-400">Política de Privacidade</a> do Design Builder.
                </p>
            </div>
        </div>
    );
};

export default AuthModal;
