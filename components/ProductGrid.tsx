
import React from 'react';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onProductClick: (id: number) => void;
  distances: Record<number, number>;
  wishlist: number[];
  onToggleWishlist: (productId: number) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, onProductClick, distances, wishlist, onToggleWishlist }) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p>Tidak ada produk yang cocok.</p>
        <p className="text-sm mt-1">Coba sesuaikan pencarian atau filter Anda.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map(product => (
        <ProductCard 
            key={product.id} 
            product={product} 
            onClick={() => onProductClick(product.id)} 
            distance={distances[product.id]} 
            isWishlisted={wishlist.includes(product.id)}
            onToggleWishlist={() => onToggleWishlist(product.id)}
        />
      ))}
    </div>
  );
};