
import React from 'react';
import type { Product } from '../types';
import { LocationPinIcon, HeartIcon } from './Icons';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  distance?: number;
  isWishlisted?: boolean;
  onToggleWishlist?: (e: React.MouseEvent) => void;
}

const formatRupiah = (price: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, distance, isWishlisted, onToggleWishlist }) => {
  
  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event from firing
    onToggleWishlist?.(e);
  };
  
  return (
    <div 
      onClick={onClick}
      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-1 transition-transform duration-300 ease-in-out cursor-pointer flex flex-col"
    >
      <div className="relative">
        <img src={product.imageUrls[0]} alt={product.name} className="w-full h-32 object-cover" />
        {onToggleWishlist && (
           <button 
              onClick={handleWishlistClick} 
              className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${isWishlisted ? 'bg-red-500 bg-opacity-80 text-white' : 'bg-black bg-opacity-40 text-gray-300 hover:text-white'}`}
              aria-label="Tambahkan ke wishlist"
           >
              <HeartIcon filled={isWishlisted} className="w-5 h-5" />
           </button>
        )}
      </div>
      <div className="p-3 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-200 truncate">{product.name}</h3>
          <p className="text-base font-bold text-emerald-400 mt-1">{formatRupiah(product.price)}</p>
        </div>
        <div className="flex items-center text-xs text-gray-400 mt-2">
          <LocationPinIcon />
          <span className="ml-1 truncate">{product.location.city}</span>
          {distance !== undefined && (
            <>
              <span className="mx-1">·</span>
              <span>{distance.toFixed(1)} km</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
