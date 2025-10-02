
import React from 'react';
import { FacebookIcon, InstagramIcon, XIcon, YouTubeIcon } from './Icons';

export const InfoFooter: React.FC = () => {
    return (
        <footer className="bg-gray-800 border-t border-gray-700 text-gray-400 text-xs">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-center space-x-6 mb-6">
                    <a href="#" className="text-gray-400 hover:text-white">
                        <span className="sr-only">Facebook</span>
                        <FacebookIcon />
                    </a>
                    <a href="#" className="text-gray-400 hover:text-white">
                        <span className="sr-only">Instagram</span>
                        <InstagramIcon />
                    </a>
                    <a href="#" className="text-gray-400 hover:text-white">
                        <span className="sr-only">X</span>
                        <XIcon />
                    </a>
                    <a href="#" className="text-gray-400 hover:text-white">
                        <span className="sr-only">YouTube</span>
                        <YouTubeIcon />
                    </a>
                </div>
                <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 mb-6 text-center">
                    <a href="#" className="hover:text-white">Tentang Kami</a>
                    <a href="#" className="hover:text-white">Syarat & Ketentuan</a>
                    <a href="#" className="hover:text-white">Kebijakan Privasi</a>
                    <a href="#" className="hover:text-white">Pusat Bantuan</a>
                </div>
                <div className="space-y-1 text-center text-gray-500">
                    <p>(PT) InkSpot | CEO: Hong Gil-dong | NIB: 123-45-67890</p>
                    <p>Izin Usaha: No. 2024-JakartaSelatan-12345</p>
                    <p>Alamat: Jl. Sudirman No. 123, Lantai 45 (InkSpot Tower), Jakarta Selatan, Indonesia</p>
                    <p>Email: contact@inkspot.com | Layanan Pelanggan: 1588-1234</p>
                </div>
                <p className="mt-8 text-center text-gray-500">&copy; 2025 InkSpot Inc. All rights reserved.</p>
            </div>
        </footer>
    );
};
