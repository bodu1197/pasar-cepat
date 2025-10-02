
import React from 'react';

export const LoadingSpinner: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center space-y-2">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
            <p className="text-gray-400">Memuat produk...</p>
        </div>
    );
};
