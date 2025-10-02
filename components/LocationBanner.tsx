
import React from 'react';

interface LocationBannerProps {
  loading: boolean;
  error: string | null;
  sorted: boolean;
}

export const LocationBanner: React.FC<LocationBannerProps> = ({ loading, error, sorted }) => {
  let content;
  
  if (!loading && !error && !sorted) {
    return null;
  }

  if (loading) {
    content = 'Mencari lokasi Anda...';
  } else if (error) {
    content = 'Gagal menemukan lokasi. Menampilkan daftar default.';
  } else if (sorted) {
    content = 'Daftar produk di sekitar Anda';
  }

  const bgColor = error ? 'bg-red-500 bg-opacity-20 text-red-300' : 'bg-emerald-500 bg-opacity-20 text-emerald-300';

  return (
    <div className={`text-center p-2 rounded-lg mb-4 text-sm ${bgColor}`}>
      {content}
    </div>
  );
};
