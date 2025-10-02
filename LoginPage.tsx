
import React, { useState } from 'react';
import type { Page } from './App';
import { signIn } from './services/supabaseClient';

interface LoginPageProps {
    onNavigate: (page: Page) => void;
    onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signIn(email, password);
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || 'Email atau kata sandi salah.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-4">
            <div className="w-full max-w-sm mx-auto overflow-hidden bg-gray-800 rounded-lg shadow-md">
                <div className="px-6 py-8">
                    <h2 className="text-3xl font-bold text-center text-white">Pasar Cepat</h2>
                    <p className="mt-1 text-center text-gray-400">Masuk ke akun Anda</p>

                    <form onSubmit={handleSubmit}>
                        <div className="w-full mt-4">
                            <input 
                                className="block w-full px-4 py-2 mt-2 text-gray-200 placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-emerald-300" 
                                type="email" 
                                placeholder="Alamat Email" 
                                aria-label="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="w-full mt-4">
                            <input 
                                className="block w-full px-4 py-2 mt-2 text-gray-200 placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-emerald-300" 
                                type="password" 
                                placeholder="Kata Sandi" 
                                aria-label="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        
                        {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}

                        <div className="flex items-center justify-between mt-6">
                            <button type="submit" disabled={loading} className="w-full px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-emerald-500 rounded-lg hover:bg-emerald-600 focus:outline-none focus:ring focus:ring-emerald-300 focus:ring-opacity-50 disabled:bg-emerald-800 disabled:cursor-not-allowed">
                                {loading ? 'Memproses...' : 'Masuk'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-400">
                            Belum punya akun?{' '}
                            <span onClick={() => onNavigate('signup')} className="font-medium text-emerald-400 hover:underline cursor-pointer">
                                Daftar
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
