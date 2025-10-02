import React, { useState, useEffect, useMemo } from 'react';
import type { Page } from './App';
import { supabase } from './services/supabase'; // Assuming supabase object is exported from services/supabase.ts
import { CheckIcon, XMarkIcon } from './components/Icons'; // Assuming Icons.tsx has these

interface UpdatePasswordPageProps {
    onNavigate: (page: Page) => void;
}

export const UpdatePasswordPage: React.FC<UpdatePasswordPageProps> = ({ onNavigate }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [session, setSession] = useState<any>(null);
    const [sessionLoading, setSessionLoading] = useState(true); // New loading state

    useEffect(() => {
        console.log('DEBUG: UpdatePasswordPage loaded.'); // Debug log
        const handleSession = async () => {
            setSessionLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setSessionLoading(false);

            if (!session) {
                setError('Sesi tidak valid atau kedaluwarsa. Silakan coba lagi dari awal.');
            }
        };
        handleSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setSessionLoading(false); // Ensure loading is false after any auth state change
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const passwordRequirements = useMemo(() => {
        const hasMinLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);

        const charTypeCount = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;
        const meetsCharTypeVariety = charTypeCount >= 3;

        return {
            hasMinLength,
            hasUpperCase,
            hasLowerCase,
            hasNumber,
            hasSpecialChar,
            meetsCharTypeVariety,
            isStrongEnough: hasMinLength && meetsCharTypeVariety,
        };
    }, [password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!session) {
            setError('Anda harus masuk untuk mengatur ulang kata sandi.');
            return;
        }

        if (!passwordRequirements.isStrongEnough) {
            setError('Kata sandi tidak memenuhi semua persyaratan.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Kata sandi tidak cocok.');
            return;
        }

        setLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password,
            });

            if (updateError) {
                throw updateError;
            }

            setMessage('Kata sandi Anda berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.');
            setTimeout(() => onNavigate('login'), 3000);
        } catch (err: any) {
            setError(err.message || 'Gagal memperbarui kata sandi.');
        } finally {
            setLoading(false);
        }
    };

    const RequirementItem: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
        <li className={"flex items-center text-sm " + (met ? 'text-emerald-400' : 'text-gray-400')}>
            {met ? <CheckIcon className="w-4 h-4 mr-2" /> : <XMarkIcon className="w-4 h-4 mr-2" />}
            {text}
        </li>
    );

    if (sessionLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-4">
                <div className="w-full max-w-sm mx-auto overflow-hidden bg-gray-800 rounded-lg shadow-md py-8">
                    <p className="text-center text-white">Memuat sesi...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-4">
            <div className="w-full max-w-sm mx-auto overflow-hidden bg-gray-800 rounded-lg shadow-md">
                <div className="px-6 py-8">
                    <h2 className="text-xl font-bold text-white text-center">Atur Ulang Kata Sandi</h2>
                    <p className="mt-1 text-center text-gray-400">Masukkan kata sandi baru Anda.</p>

                    <form onSubmit={handleSubmit}>
                        <div className="w-full mt-4">
                            <input
                                className="block w-full px-4 py-2 mt-2 text-gray-200 placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-emerald-300"
                                type="password"
                                placeholder="Kata Sandi Baru"
                                aria-label="Kata Sandi Baru"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                            <ul className="mt-2 text-gray-400 text-sm space-y-1">
                                <p className="font-medium text-white">Persyaratan Kata Sandi:</p>
                                <RequirementItem met={passwordRequirements.hasMinLength} text="Minimal 8 karakter" />
                                <RequirementItem met={passwordRequirements.hasUpperCase} text="Setidaknya satu huruf kapital" />
                                <RequirementItem met={passwordRequirements.hasLowerCase} text="Setidaknya satu huruf kecil" />
                                <RequirementItem met={passwordRequirements.hasNumber} text="Setidaknya satu angka" />
                                <RequirementItem met={passwordRequirements.hasSpecialChar} text="Setidaknya satu karakter khusus (!@#$%^&*)" />
                                <li className={"flex items-center text-sm " + (passwordRequirements.meetsCharTypeVariety ? 'text-emerald-400' : 'text-gray-400')}>
                                    {passwordRequirements.meetsCharTypeVariety ? <CheckIcon className="w-4 h-4 mr-2" /> : <XMarkIcon className="w-4 h-4 mr-2" />}
                                    Minimal 3 dari 4 jenis karakter (huruf besar, kecil, angka, khusus)
                                </li>
                            </ul>
                        </div>
                        <div className="w-full mt-4">
                            <input
                                className={"block w-full px-4 py-2 mt-2 text-gray-200 placeholder-gray-500 bg-gray-700 border " + (confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-gray-600') + " rounded-lg focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-emerald-300"}
                                type="password"
                                placeholder="Konfirmasi Kata Sandi Baru"
                                aria-label="Konfirmasi Kata Sandi Baru"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                            {confirmPassword && password !== confirmPassword && (
                                <p className="mt-2 text-sm text-red-400">Kata sandi tidak cocok.</p>
                            )}
                        </div>

                        {message && <p className="mt-4 text-sm text-emerald-400 text-center">{message}</p>}
                        {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}

                        <div className="flex items-center justify-between mt-6">
                            <button
                                type="submit"
                                disabled={loading || !passwordRequirements.isStrongEnough || password !== confirmPassword || !session}
                                className="w-full px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-emerald-500 rounded-lg hover:bg-emerald-600 focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-emerald-300"
                            >
                                {loading ? 'Memproses...' : 'Atur Ulang Kata Sandi'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};