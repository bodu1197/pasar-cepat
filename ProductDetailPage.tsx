
import React, { useState, useEffect } from 'react';
import type { Product, User, Review, Reply } from '../types';
import type { Page } from './App';
import { ChevronLeftIcon, LocationPinIcon, ChatIcon, CalendarIcon, ClockIcon, CheckBadgeIcon, WhatsAppIcon, StarIcon, HeartIcon, UserIcon } from './components/Icons';
import { ProductCard } from './components/ProductCard';
import { findOrCreateChat, getReviewsForProduct, addReview, addReplyToReview, getProfile } from './services/supabaseClient';


interface ProductDetailPageProps {
    product: Product;
    allProducts: Product[];
    currentUser: User | null;
    onNavigate: (page: Page) => void;
    onBack: () => void;
    wishlist: number[];
    onToggleWishlist: (productId: number) => void;
}

const formatRupiah = (price: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const SellerInfoItem: React.FC<{ icon: React.ReactNode, label: string, value: string | number }> = ({ icon, label, value }) => (
    <div className="flex items-center text-sm text-gray-400">
        {icon}
        <span className="ml-2">{label}: <span className="font-semibold text-gray-300">{value}</span></span>
    </div>
);

const StarRating: React.FC<{ rating: number, setRating?: (rating: number) => void }> = ({ rating, setRating }) => (
    <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
            <button
                key={star}
                type="button"
                onClick={() => setRating?.(star)}
                className={!setRating ? 'cursor-default' : ''}
                aria-label={`Rate ${star} stars`}
            >
                <StarIcon filled={star <= rating} />
            </button>
        ))}
    </div>
);


const ReviewItem: React.FC<{ review: Review, sellerId: string, currentUser: User | null, onReply: (reviewId: number, text: string) => void }> = ({ review, sellerId, currentUser, onReply }) => {
    const [reviewer, setReviewer] = useState<User | null>(null);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState('');

     useEffect(() => {
        getProfile(review.userId).then(setReviewer);
    }, [review.userId]);


    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyText.trim()) {
            onReply(review.id, replyText);
            setReplyText('');
            setShowReplyForm(false);
        }
    };

    if (!reviewer) return null; // Or a loading skeleton

    return (
        <div className="py-4 border-b border-gray-700">
            <div className="flex items-start">
                <img src={reviewer.avatarUrl} alt={reviewer.name} className="w-10 h-10 rounded-full" />
                <div className="ml-4">
                    <div className="flex items-center">
                        <p className="font-semibold text-white">{reviewer.name}</p>
                        <span className="mx-2 text-gray-500">•</span>
                        <StarRating rating={review.rating} />
                    </div>
                    <p className="text-sm text-gray-400">{formatDate(review.timestamp)}</p>
                    <p className="mt-2 text-gray-300">{review.text}</p>

                    {currentUser?.id === sellerId && !review.replies.length && (
                        <button onClick={() => setShowReplyForm(!showReplyForm)} className="text-emerald-400 text-sm mt-2">
                            {showReplyForm ? 'Batal' : 'Balas'}
                        </button>
                    )}
                </div>
            </div>

            {showReplyForm && (
                <form onSubmit={handleReplySubmit} className="ml-14 mt-2">
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white placeholder-gray-400 focus:outline-none"
                        placeholder="Tulis balasan..."
                        rows={2}
                    />
                    <button type="submit" className="mt-2 bg-emerald-500 text-white px-3 py-1 text-sm rounded-md">
                        Kirim
                    </button>
                </form>
            )}
        </div>
    );
};

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ product, allProducts, currentUser, onNavigate, onBack, wishlist, onToggleWishlist }) => {
  const [seller, setSeller] = useState<User | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(0);

  useEffect(() => {
    if (product.sellerId) {
        getProfile(product.sellerId).then(setSeller);
    }
    // getReviewsForProduct(product.id).then(setReviews); // TODO: Re-enable when review API is fully implemented
  }, [product.id, product.sellerId]);


  const isMyProduct = currentUser?.id === seller?.id;
  const hasReviewed = reviews.some(r => r.userId === currentUser?.id);
  const canReview = currentUser && !isMyProduct && !hasReviewed;

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newReviewText.trim() && newReviewRating > 0 && currentUser) {
        await addReview(product.id, currentUser.id, newReviewRating, newReviewText);
        setNewReviewText('');
        setNewReviewRating(0);
        getReviewsForProduct(product.id).then(setReviews); // Refresh reviews
    }
  };

  const handleAddReply = async (reviewId: number, text: string) => {
    if (currentUser) {
        await addReplyToReview(reviewId, currentUser.id, text);
        getReviewsForProduct(product.id).then(setReviews);
    }
  }

  const similarItems = allProducts
    .filter(p => p.id !== product.id && p.category.secondary === product.category.secondary)
    .slice(0, 4);

  const handleStartChat = async () => {
    if (!currentUser) {
        onNavigate('login');
        return;
    }
    if (isMyProduct) return;

    setIsStartingChat(true);
    try {
        const session = await findOrCreateChat(product.id, currentUser.id, product.sellerId);
        if (session) {
            onNavigate({ page: 'chat', sessionId: session.id });
        }
    } catch (error) {
        console.error("Failed to start chat:", error);
        alert("Tidak dapat memulai obrolan.");
    } finally {
        setIsStartingChat(false);
    }
  };

  const isWishlisted = wishlist.includes(product.id);

  return (
    <div className="pb-24">
        <div className="relative">
            <button onClick={onBack} className="absolute top-4 left-4 bg-gray-800 bg-opacity-60 rounded-full p-2 text-white z-10">
                <ChevronLeftIcon />
            </button>
            <button onClick={() => onToggleWishlist(product.id)} className={`absolute top-4 right-4 bg-gray-800 bg-opacity-60 rounded-full p-2 z-10 ${isWishlisted ? 'text-red-500' : 'text-white'}`}>
                <HeartIcon filled={isWishlisted} />
            </button>
            <img src={product.imageUrls[activeIndex]} alt={product.name} className="w-full h-64 object-cover" />
             {product.imageUrls.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 p-2 overflow-x-auto">
                    {product.imageUrls.map((url, index) => (
                        <img 
                            key={index}
                            src={url} 
                            alt={`thumbnail ${index + 1}`}
                            onClick={() => setActiveIndex(index)}
                            className={`w-14 h-14 object-cover rounded-md cursor-pointer border-2 ${activeIndex === index ? 'border-emerald-400' : 'border-transparent'}`}
                        />
                    ))}
                </div>
            )}
        </div>

        <div className="p-4">
            <p className="text-xs text-gray-500 mb-1">Tanggal diposting: {formatDate(product.postedDate)}</p>
            <h1 className="text-2xl font-bold text-white mb-2">{product.name}</h1>
            <p className="text-3xl font-extrabold text-emerald-400 mb-4">{formatRupiah(product.price)}</p>
            
            <div className="flex items-center text-sm text-gray-400 mb-4">
              <LocationPinIcon />
              <span className="ml-1">{product.location.city}, {product.location.province}</span>
            </div>

            <div className="border-t border-b border-gray-700 py-4 mb-4">
                 <h2 className="font-semibold text-white mb-2">Deskripsi Produk</h2>
                 <p className="text-gray-300 whitespace-pre-wrap">{product.description}</p>
            </div>
            
            <h2 className="font-semibold text-white mb-3">Informasi Penjual</h2>
            {seller ? (
                <div className="bg-gray-800 p-4 rounded-lg mb-8">
                    <div className="flex items-center space-x-4 mb-3">
                        <img src={seller.avatarUrl} alt={seller.name} className="w-12 h-12 rounded-full" />
                        <div>
                            <p className="font-semibold text-white text-lg">{seller.name}</p>
                            <p className="text-sm text-gray-400">Penjual</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <SellerInfoItem icon={<CalendarIcon />} label="Bergabung" value={formatDate(seller.memberSince)} />
                        <SellerInfoItem icon={<ClockIcon />} label="Terakhir online" value={formatDate(seller.lastLogin)} />
                        <SellerInfoItem icon={<CheckBadgeIcon />} label="Barang terjual" value={`${seller.itemsSold} barang`} />
                    </div>
                </div>
            ) : (
                <div className="text-gray-500">Memuat info penjual...</div>
            )}

            {similarItems.length > 0 && (
                <div className="mt-8">
                    <h2 className="font-semibold text-white mb-4">Produk Serupa di Sekitar</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {similarItems.map(item => (
                            <ProductCard 
                                key={item.id} 
                                product={item} 
                                onClick={() => onNavigate({ page: 'productDetail', productId: item.id })} 
                                isWishlisted={wishlist.includes(item.id)}
                                onToggleWishlist={() => onToggleWishlist(item.id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 flex gap-3">
            {product.contactInfo.chat && (
                 <button 
                    onClick={handleStartChat}
                    disabled={isMyProduct || isStartingChat}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChatIcon active />
                    <span>{isStartingChat ? "Memulai obrolan..." : "Obrolan"}</span>
                 </button>
            )}
             {product.contactInfo.whatsapp && (
                 <a 
                    href={`https://wa.me/${product.contactInfo.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors">
                    <WhatsAppIcon />
                    <span>WhatsApp</span>
                 </a>
            )}
        </div>
    </div>
  );
};
