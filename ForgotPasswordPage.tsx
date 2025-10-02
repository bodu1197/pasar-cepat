import React, { useState } from 'react';
import type { Page } from './App';
import { supabase } from './services/supabase'; // Assuming supabase object is exported from services/supabase.ts
import { ChevronLeftIcon } from './components/Icons'; // Assuming ChevronLeftIcon exists

interface ForgotPasswordPageProps {
    onNavigate: (page: Page) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/update-password', // Redirect to the new password update page
            });

            if (resetError) {
                throw resetError;
            }

            setMessage('Silakan periksa email Anda untuk tautan pengaturan ulang kata sandi.');
        } catch (err: any) {
            setError(err.message || 'Gagal mengirim tautan pengaturan ulang kata sandi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-4">
            <div className="w-full max-w-sm mx-auto overflow-hidden bg-gray-800 rounded-lg shadow-md">
                <div className="px-6 py-8">
                    <div className="flex items-center mb-6">
                        <button onClick={() => onNavigate('login')} className="p-2 -ml-2 text-white">
                            <ChevronLeftIcon />
                        </button>
                        <h2 className="text-xl font-bold text-white ml-2">Lupa Kata Sandi</h2>
                    </div>

                    <p className="mt-1 text-center text-gray-400">Masukkan email Anda untuk mengatur ulang kata sandi.</p>

                    <form onSubmit={handleSubmit}>
                        <div className="w-full mt-4">
                            <input
                                className="block w-full px-4 py-2 mt-2 text-gray-200 placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-emerald-300"
                                type="email"
                                placeholder="Alamat Email"
                                aria-label="Alamat Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        {message && <p className="mt-4 text-sm text-emerald-400 text-center">{message}</p>}
                        {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}

                        <div className="flex items-center justify-between mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-emerald-500 rounded-lg hover:bg-emerald-600 focus:outline-none focus:ring focus:ring-emerald-300 focus:ring-opacity-50 disabled:bg-emerald-800 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Memproses...' : 'Kirim Tautan Pengaturan Ulang'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};