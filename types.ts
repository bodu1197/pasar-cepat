
export interface ProductCategory {
  primary: string;
  secondary: string;
}

export interface ProductLocation {
  province: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface ContactInfo {
    chat: boolean;
    whatsapp?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  imageUrls: string[];
  location: ProductLocation;
  category: ProductCategory;
  description: string;
  sellerId: string; // Changed from number to string (UUID)
  contactInfo: ContactInfo;
  postedDate: string; // Corresponds to 'created_at' from Supabase
}

export type NewProductInfo = Omit<Product, 'id' | 'sellerId' | 'postedDate'>;

export type UpdatedProductInfo = Product;

export interface Reply {
    id: number;
    reviewId: number;
    userId: string; // Should be the seller, changed to string
    text: string;
    timestamp: string;
}

export interface Review {
    id: number;
    productId: number;
    userId: string; // Changed to string
    rating: number;
    text: string;
    timestamp: string;
    replies: Reply[];
}


export interface User {
  id: string; // This is the UUID from auth.users
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatarUrl: string;
  whatsappNumber?: string;
  memberSince: string; // maps to created_at
  lastLogin: string; // maps to last_sign_in_at
  itemsSold: number;
  wishlist: number[];
}

export type UpdatedUserInfo = {
    name: string;
    whatsappNumber?: string;
    password?: string;
    avatarUrl?: string; // Can be a base64 string for new uploads
};

export interface ChatSession {
  id: number;
  productId: number;
  buyerId: string; // Changed to string
  sellerId: string; // Changed to string
  productName: string;
  productImageUrl: string;
  lastMessage?: string;
  lastMessageTimestamp?: string;
}

export interface ChatMessage {
    id: number;
    sessionId: number;
    senderId: string; // Changed to string
    text: string;
    timestamp: string;
}