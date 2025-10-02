
import React, { useState, useEffect, useRef } from 'react';
import type { Page } from './App';
import type { User, Product, ChatSession, UpdatedUserInfo } from './types';
import { EditIcon, DeleteIcon, ChevronLeftIcon, HeartIcon } from './components/Icons';
import { getChatsForUser } from './services/supabaseClient';
import { ProductGrid } from './components/ProductGrid';

interface MyPageProps {
    user: User;
    products: Product[];
    onNavigate: (page: Page) => void;
    onEditProduct: (id: number) => void;
    onDeleteProduct: (id: number) => void;
    onToggleWishlist: (productId: number) => void;
    onUpdateUser: (updatedInfo: UpdatedUserInfo) => void;
}

const MyProductItem: React.FC<{product: Product; onEdit: () => void; onDelete: () => void}> = ({ product, onEdit, onDelete }) => (
    <div className="flex items-center bg-gray-800 p-3 rounded-lg">
        <img src={product.imageUrls[0]} alt={product.name} className="w-16 h-16 rounded-md object-cover" />
        <div className="flex-grow ml-4">
            <p className="text-white font-semibold">{product.name}</p>
            <p className="text-sm text-emerald-400">Rp {product.price.toLocaleString('id-ID')}</p>
        </div>
        <div className="flex space-x-2">
            <button onClick={onEdit} className="p-2 text-gray-400 hover:text-white"><EditIcon /></button>
            <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-400"><DeleteIcon /></button>
        </div>
    </div>
);

const ChatListItem: React.FC<{ session: ChatSession; onNavigate: (page: Page) => void }> = ({ session, onNavigate }) => (
    <div 
        className="flex items-center bg-gray-800 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
        onClick={() => onNavigate({ page: 'chat', sessionId: session.id })}
    >
        <img src={session.productImageUrl} alt={session.productName} className="w-16 h-16 rounded-md object-cover" />
        <div className="flex-grow ml-4 overflow-hidden">
            <p className="text-white font-semibold truncate">{session.productName}</p>
            <p className="text-sm text-gray-400 truncate">{session.lastMessage}</p>
        </div>
        <div className="text-xs text-gray-500 ml-2 flex-shrink-0">
            {session.lastMessageTimestamp && new Date(session.lastMessageTimestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </div>
    </div>
);

const ProfileForm: React.FC<{ user: User, onUpdateUser: (updatedInfo: UpdatedUserInfo) => void, onSaving: boolean }> = ({ user, onUpdateUser, onSaving }) => {
    const [name, setName] = useState(user.name);
    const [whatsapp, setWhatsapp] = useState(user.whatsappNumber || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(user.name);
        setWhatsapp(user.whatsappNumber || '');
        setAvatarPreview(null);
        setPassword('');
        setConfirmPassword('');
    }, [user]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password && password !== confirmPassword) {
            setError('Kata sandi baru tidak cocok.');
            return;
        }

        const updatedInfo: UpdatedUserInfo = {
            name,
            whatsappNumber: whatsapp,
        };
        
        if (password) {
            updatedInfo.password = password;
        }
        if (avatarPreview) {
            updatedInfo.avatarUrl = avatarPreview;
        }

        onUpdateUser(updatedInfo);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto bg-gray-800 p-6 rounded-lg">
             <h2 className="text-lg font-semibold text-white mb-4">Edit Informasi Profil</h2>
             
             <div className="flex flex-col items-center">
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                <img 
                    src={avatarPreview || user.avatarUrl} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover cursor-pointer mb-2"
                    onClick={handleAvatarClick}
                />
                <button type="button" onClick={handleAvatarClick} className="text-sm text-emerald-400 hover:underline">Ubah Foto</button>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nama</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="block w-full px-4 py-2 text-gray-200 placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-emerald-300" />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email (tidak dapat diubah)</label>
                <input type="email" value={user.email} readOnly className="block w-full px-4 py-2 text-gray-400 placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-lg cursor-not-allowed" />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nomor WhatsApp (opsional)</label>
                <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="block w-full px-4 py-2 text-gray-200 placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-emerald-300" />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Kata Sandi Baru (isi untuk mengubah)</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="block w-full px-4 py-2 text-gray-200 placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-emerald-300" />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Konfirmasi Kata Sandi Baru</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="block w-full px-4 py-2 text-gray-200 placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-emerald-300" />
             </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
             
            <button type="submit" disabled={onSaving} className="w-full px-6 py-3 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-emerald-500 rounded-lg hover:bg-emerald-600 focus:outline-none focus:ring focus:ring-emerald-300 focus:ring-opacity-50 disabled:bg-emerald-800 disabled:cursor-not-allowed">
                {onSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
        </form>
    );
}


export const MyPage: React.FC<MyPageProps> = ({ user, products, onNavigate, onEditProduct, onDeleteProduct, onToggleWishlist, onUpdateUser }) => {
    const [activeTab, setActiveTab] = useState<'products' | 'wishlist' | 'chats' | 'profile'>('products');
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [loadingChats, setLoadingChats] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const userProducts = products.filter(p => p.sellerId === user.id);
    const wishlistedProducts = products.filter(p => user.wishlist.includes(p.id));

    useEffect(() => {
        if (activeTab === 'chats') {
            setLoadingChats(true);
            getChatsForUser(user.id)
                .then(sessions => {
                    const sortedSessions = sessions.sort((a, b) => 
                        new Date(b.lastMessageTimestamp || 0).getTime() - new Date(a.lastMessageTimestamp || 0).getTime()
                    );
                    setChatSessions(sortedSessions);
                })
                .catch(console.error)
                .finally(() => setLoadingChats(false));
        }
    }, [activeTab, user.id]);

    const handleUpdateUserWrapper = async (updatedInfo: UpdatedUserInfo) => {
        setIsSavingProfile(true);
        try {
            await onUpdateUser(updatedInfo);
        } finally {
            setIsSavingProfile(false);
        }
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'products':
                return (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-white">Produk yang Saya Jual ({userProducts.length})</h2>
                        {userProducts.length > 0 ? (
                            userProducts.map(p => (
                                <MyProductItem 
                                    key={p.id} 
                                    product={p} 
                                    onEdit={() => onEditProduct(p.id)} 
                                    onDelete={() => onDeleteProduct(p.id)}
                                />
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-8">Tidak ada produk yang dijual.</p>
                        )}
                    </div>
                );
            case 'wishlist':
                 return (
                    <div>
                        <h2 className="text-lg font-semibold text-white mb-4">Wishlist ({wishlistedProducts.length})</h2>
                        {wishlistedProducts.length > 0 ? (
                            <ProductGrid 
                                products={wishlistedProducts}
                                distances={{}}
                                onProductClick={(id) => onNavigate({ page: 'productDetail', productId: id })}
                                wishlist={user.wishlist}
                                onToggleWishlist={onToggleWishlist}
                            />
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <HeartIcon className="w-12 h-12 mx-auto" />
                                <p className="mt-2">Wishlist Anda kosong.</p>
                                <p className="text-sm mt-1">Tambahkan produk yang Anda sukai ke wishlist!</p>
                            </div>
                        )}
                    </div>
                );
            case 'chats':
                 if (loadingChats) return <div className="text-gray-500 text-center py-8">Memuat daftar obrolan...</div>;
                 return (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-white">Daftar Obrolan ({chatSessions.length})</h2>
                        {chatSessions.length > 0 ? (
                            chatSessions.map(session => (
                                <ChatListItem key={session.id} session={session} onNavigate={onNavigate} />
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-8">Tidak ada obrolan yang sedang berlangsung.</p>
                        )}
                    </div>
                );
            case 'profile':
                return <ProfileForm user={user} onUpdateUser={handleUpdateUserWrapper} onSaving={isSavingProfile} />;
            default:
                return null;
        }
    }

    return (
        <div className="pb-6">
             <div className="flex items-center mb-6">
                <button onClick={() => onNavigate('home')} className="p-2 -ml-2 text-white">
                    <ChevronLeftIcon />
                </button>
                <h1 className="text-xl font-bold text-white ml-2">Halaman Saya</h1>
            </div>
            
            <div className="flex items-center space-x-4 mb-6">
                <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-full object-cover" />
                <div>
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    <p className="text-gray-400">{user.email}</p>
                </div>
            </div>

            <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
                <button onClick={() => setActiveTab('products')} className={`py-2 px-4 font-medium flex-shrink-0 ${activeTab === 'products' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-gray-400'}`}>
                    Produk Saya
                </button>
                 <button onClick={() => setActiveTab('wishlist')} className={`py-2 px-4 font-medium flex-shrink-0 ${activeTab === 'wishlist' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-gray-400'}`}>
                    Wishlist
                </button>
                <button onClick={() => setActiveTab('chats')} className={`py-2 px-4 font-medium flex-shrink-0 ${activeTab === 'chats' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-gray-400'}`}>
                    Obrolan
                </button>
                <button onClick={() => setActiveTab('profile')} className={`py-2 px-4 font-medium flex-shrink-0 ${activeTab === 'profile' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-gray-400'}`}>
                    Profil
                </button>
            </div>

            {renderContent()}
        </div>
    );
};
