
import React, { useState, useMemo } from 'react';
import type { Page } from './App';
import { signUp } from './services/supabaseClient';
import { CheckIcon, XMarkIcon } from './components/Icons'; // Assuming Icons.tsx has these

interface SignupPageProps {
    onNavigate: (page: Page) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigate }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const passwordRequirements = useMemo(() => {
        const hasMinLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        // At least 3 out of 4 character types (upper, lower, number, special)
        const charTypeCount = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;
        const meetsCharTypeVariety = charTypeCount >= 3;

        return {
            hasMinLength,
            hasUpperCase,
            hasLowerCase,
            hasNumber,
            hasSpecialChar,
            meetsCharTypeVariety,
            isStrongEnough: hasMinLength && meetsCharTypeVariety, // Define "strong enough"
        };
    }, [password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

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
            await signUp(name, email, password);
            alert('Pendaftaran berhasil! Silakan periksa email Anda untuk verifikasi, lalu login.');
            onNavigate('login');
        } catch (err: any) {
            setError(err.message || 'Gagal mendaftar.');
        } finally {
            setLoading(false);
        }
    };

    const RequirementItem: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
        <li className={\`flex items-center text-sm \${met ? 'text-emerald-400' : 'text-gray-400'}\`}>
            {met ? <CheckIcon className="w-4 h-4 mr-2" /> : <XMarkIcon className="w-4 h-4 mr-2" />}
            {text}
        </li>
    );

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-4">
            <div className="w-full max-w-sm mx-auto overflow-hidden bg-gray-800 rounded-lg shadow-md">
                <div className="px-6 py-8">
                    <h2 className="text-3xl font-bold text-center text-white">Pasar Cepat</h2>
                    <p className="mt-1 text-center text-gray-400">Buat akun baru</p>

                    <form onSubmit={handleSubmit}>
                        <div className="w-full mt-4">
                            <input 
                                className="block w-full px-4 py-2 mt-2 text-gray-200 placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-emerald-300" 
                                type="text" 
                                placeholder="Nama" 
                                aria-label="Nama"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
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
                        <div className="w-full mt-4">
                            <input 
                                className="block w-full px-4 py-2 mt-2 text-gray-200 placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-emerald-300" 
                                type="password" 
                                placeholder="Kata Sandi" 
                                aria-label="Kata Sandi"
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
                                <li className={\`flex items-center text-sm \${passwordRequirements.meetsCharTypeVariety ? 'text-emerald-400' : 'text-gray-400'}\`}>
                                    {passwordRequirements.meetsCharTypeVariety ? <CheckIcon className="w-4 h-4 mr-2" /> : <XMarkIcon className="w-4 h-4 mr-2" />}
                                    Minimal 3 dari 4 jenis karakter (huruf besar, kecil, angka, khusus)
                                </li>
                            </ul>
                        </div>
                         <div className="w-full mt-4">
                            <input 
                                className={\`block w-full px-4 py-2 mt-2 text-gray-200 placeholder-gray-500 bg-gray-700 border \${confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-emerald-300\`} 
                                type="password" 
                                placeholder="Konfirmasi Kata Sandi" 
                                aria-label="Konfirmasi Kata Sandi"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                            {confirmPassword && password !== confirmPassword && (
                                <p className="mt-2 text-sm text-red-400">Kata sandi tidak cocok.</p>
                            )}
                        </div>
                        
                        {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}

                        <div className="flex items-center justify-between mt-6">
                            <button type="submit" disabled={loading || !passwordRequirements.isStrongEnough || password !== confirmPassword} className="w-full px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-emerald-500 rounded-lg hover:bg-emerald-600 focus:outline-none focus:ring focus:ring-emerald-300 focus:ring-opacity-50 disabled:bg-emerald-800 disabled:cursor-not-allowed">
                                {loading ? 'Memproses...' : 'Daftar'}
                            </button>
                        </div>
                    </form>

                     <div className="mt-4 text-center">
                        <p className="text-sm text-gray-400">
                            Sudah punya akun?{' '}
                            <span onClick={() => onNavigate('login')} className="font-medium text-emerald-400 hover:underline cursor-pointer">
                                Masuk
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
