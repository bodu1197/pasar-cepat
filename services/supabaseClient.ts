import { supabase } from './supabase';
import type { User, Product, NewProductInfo, UpdatedProductInfo, UpdatedUserInfo, ChatSession, ChatMessage, Review, Reply } from '../types';
import { dataURLtoBlob } from '../utils/imageConverter';

// --- Auth Functions ---
export const signUp = async (name: string, email: string, password: string) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw authError;
    if (!authData.user) throw new Error("Signup successful, but no user data returned.");

    // Create a profile for the new user
    const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        name: name,
        email: email,
        avatar_url: `https://i.pravatar.cc/150?u=${authData.user.id}`, // Default avatar
        wishlist: [],
    });

    if (profileError) {
        // Optional: In a real app, you might want to delete the auth user if profile creation fails.
        console.error("Error creating profile:", profileError);
        throw profileError;
    }

    return authData.user;
};

export const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const onAuthStateChange = (callback: (event: string, session: import('@supabase/supabase-js').Session | null) => void) => {
    return supabase.auth.onAuthStateChange(callback);
};

// --- Profile/User Functions ---
const mapProfileDataToUser = (profileData: any): User => ({
    id: profileData.id,
    name: profileData.name,
    email: profileData.email,
    role: profileData.role || 'user',
    avatarUrl: profileData.avatar_url,
    whatsappNumber: profileData.whatsapp_number,
    memberSince: profileData.created_at,
    lastLogin: new Date().toISOString(), // This should be handled server-side, mocking for now
    itemsSold: profileData.items_sold || 0,
    wishlist: profileData.wishlist || [],
});


export const getProfile = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data ? mapProfileDataToUser(data) : null;
};

export const updateProfile = async (userId: string, updatedInfo: UpdatedUserInfo): Promise<User> => {
    const updateData: { name: string; whatsapp_number?: string; avatar_url?: string; password?: string } = {
        name: updatedInfo.name,
        whatsapp_number: updatedInfo.whatsappNumber,
    };
    
    // Handle avatar upload
    if (updatedInfo.avatarUrl && updatedInfo.avatarUrl.startsWith('data:image')) {
        const blob = dataURLtoBlob(updatedInfo.avatarUrl);
        const filePath = `avatars/${userId}/${Date.now()}.webp`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, blob, { upsert: true, contentType: 'image/webp' });

        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
        updateData.avatar_url = urlData.publicUrl;
    }

    // Update profile table
    const { data, error } = await supabase.from('profiles').update(updateData).eq('id', userId).select().single();
    if (error) throw error;
    
    // Update password if provided
    if (updatedInfo.password) {
        const { error: passwordError } = await supabase.auth.updateUser({ password: updatedInfo.password });
        if (passwordError) throw passwordError;
    }

    return mapProfileDataToUser(data);
};

// --- Product Functions ---
export const getProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((p: any) => ({
        ...p,
        postedDate: p.created_at,
        imageUrls: p.image_urls,
        contactInfo: p.contact_info,
        sellerId: p.seller_id
    }));
};

export const addProduct = async (productInfo: NewProductInfo, sellerId: string): Promise<Product> => {
    const { data, error } = await supabase.from('products').insert({
        name: productInfo.name,
        price: productInfo.price,
        description: productInfo.description,
        category: productInfo.category,
        location: productInfo.location,
        image_urls: productInfo.imageUrls,
        contact_info: productInfo.contactInfo,
        seller_id: sellerId,
    }).select().single();

    if (error) throw error;
    return { ...data, postedDate: data.created_at, imageUrls: data.image_urls, contactInfo: data.contact_info, sellerId: data.seller_id };
};

export const updateProduct = async (productInfo: UpdatedProductInfo): Promise<Product> => {
     const { data, error } = await supabase.from('products').update({
        name: productInfo.name,
        price: productInfo.price,
        description: productInfo.description,
        category: productInfo.category,
        location: productInfo.location,
        image_urls: productInfo.imageUrls,
        contact_info: productInfo.contactInfo,
    }).eq('id', productInfo.id).select().single();

    if (error) throw error;
    return { ...data, postedDate: data.created_at, imageUrls: data.image_urls, contactInfo: data.contact_info, sellerId: data.seller_id };
};

export const deleteProduct = async (productId: number) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;
};

// --- Wishlist Functions ---
export const toggleWishlist = async (userId: string, productId: number): Promise<User> => {
    const profile = await getProfile(userId);
    if (!profile) throw new Error("User not found");

    const newWishlist = profile.wishlist.includes(productId)
        ? profile.wishlist.filter(id => id !== productId)
        : [...profile.wishlist, productId];
    
    const { data, error } = await supabase.from('profiles').update({ wishlist: newWishlist }).eq('id', userId).select().single();
    if (error) throw error;
    
    return mapProfileDataToUser(data);
};

// --- Chat Functions ---
export const findOrCreateChat = async (productId: number, buyerId: string, sellerId: string): Promise<ChatSession> => {
    // Check if a session already exists
    let { data: existingSession, error: selectError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('product_id', productId)
        .eq('buyer_id', buyerId)
        .single();
    
    if (existingSession) return { ...existingSession, buyerId: existingSession.buyer_id, sellerId: existingSession.seller_id, productId: existingSession.product_id, productName: '', productImageUrl: '' }; // simplified return, chat page will fetch full info

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116: "exact one row expected"
        throw selectError;
    }

    // Create new session if not found
    const { data: newSession, error: insertError } = await supabase
        .from('chat_sessions')
        .insert({ product_id: productId, buyer_id: buyerId, seller_id: sellerId })
        .select()
        .single();

    if (insertError) throw insertError;
    return { ...newSession, buyerId: newSession.buyer_id, sellerId: newSession.seller_id, productId: newSession.product_id, productName: '', productImageUrl: '' };
};

export const getChatsForUser = async (userId: string): Promise<ChatSession[]> => {
    const { data, error } = await supabase
        .from('chat_sessions')
        .select('*, product:products(name, image_urls)')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
        
    if (error) throw error;

    return data.map((s: any) => ({
        id: s.id,
        productId: s.product_id,
        buyerId: s.buyer_id,
        sellerId: s.seller_id,
        productName: s.product.name,
        productImageUrl: s.product.image_urls[0],
        lastMessage: s.last_message,
        lastMessageTimestamp: s.last_message_timestamp,
    }));
};

export const getChatSession = async (sessionId: number): Promise<ChatSession | undefined> => {
    const { data, error } = await supabase
        .from('chat_sessions')
        .select('*, product:products(name, image_urls)')
        .eq('id', sessionId)
        .single();

    if (error) {
        console.error("Error fetching chat session", error);
        return undefined;
    }
    
    return {
        id: data.id,
        productId: data.product_id,
        buyerId: data.buyer_id,
        sellerId: data.seller_id,
        productName: data.product.name,
        productImageUrl: data.product.image_urls[0],
        lastMessage: data.last_message,
        lastMessageTimestamp: data.last_message_timestamp,
    };
};

export const getMessagesForChat = (sessionId: number, onNewMessage: (message: ChatMessage) => void): (() => void) => {
    const fetchInitialMessages = async () => {
        const { data, error } = await supabase.from('chat_messages').select('*').eq('session_id', sessionId).order('created_at');
        if (error) {
            console.error("Error fetching messages", error);
        } else {
            data.forEach(m => onNewMessage({ ...m, senderId: m.sender_id, sessionId: m.session_id, timestamp: m.created_at }));
        }
    };
    fetchInitialMessages();

    const subscription = supabase
        .channel(`chat_messages:${sessionId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${sessionId}` },
            payload => {
                onNewMessage({ ...payload.new as any, senderId: payload.new.sender_id, sessionId: payload.new.session_id, timestamp: payload.new.created_at });
            }
        )
        .subscribe();
    
    return () => {
        supabase.removeChannel(subscription);
    };
};

export const sendMessage = async (sessionId: number, senderId: string, text: string): Promise<ChatMessage> => {
    const { data, error } = await supabase.from('chat_messages').insert({
        session_id: sessionId,
        sender_id: senderId,
        text: text,
    }).select().single();

    if (error) throw error;
    
    // Update last message on session
    await supabase.from('chat_sessions').update({
        last_message: text,
        last_message_timestamp: data.created_at,
    }).eq('id', sessionId);
    
    return { ...data, senderId: data.sender_id, sessionId: data.session_id, timestamp: data.created_at };
};


// --- Review Functions ---
// (Implementations for getReviews, addReview, addReplyToReview would go here, similar to the above functions using Supabase calls)
export const getReviewsForProduct = async (productId: number): Promise<Review[]> => {
    // This is a complex query to get reviews and their replies.
    // For now, returning an empty array. A real implementation would use RPC or careful queries.
    return Promise.resolve([]);
};
export const addReview = (productId: number, userId: string, rating: number, text: string): Promise<Review> => {
    return Promise.resolve({} as Review); // Placeholder
};
export const addReplyToReview = (reviewId: number, userId: string, text: string): Promise<Reply> => {
    return Promise.resolve({} as Reply); // Placeholder
};
