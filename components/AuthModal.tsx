
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-lime-500 focus:outline-none transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-lime-500 focus:outline-none transition-colors"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-lime-500 text-black font-bold py-3 rounded-xl hover:bg-lime-400 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Processando...' : (isSignUp ? 'Cadastrar' : 'Entrar')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-gray-400 hover:text-white text-sm underline"
                    >
                        {isSignUp ? 'Já tem uma conta? Entrar' : 'Não tem conta? Cadastrar'}
                    </button>
                </div>
            </div >
        </div >
    );
};

export default AuthModal;
