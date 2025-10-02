
import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { ProductGrid } from './components/ProductGrid';
import { Footer } from './components/Footer';
import { useGeolocation } from './hooks/useGeolocation';
import type { Product, User, NewProductInfo, UpdatedProductInfo, UpdatedUserInfo } from './types';
import { LocationBanner } from './components/LocationBanner';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Filters } from './components/Filters';
import { categories, locations } from './services/filterData';
import { LoginPage } from './LoginPage';
import { SignupPage } from './SignupPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { UpdatePasswordPage } from './UpdatePasswordPage';
import { ProductDetailPage } from './ProductDetailPage';
import { AddProductPage } from './AddProductPage';
import { MyPage } from './MyPage';
import { AdminPage } from './AdminPage';
import { ChatPage } from './ChatPage';
import * as api from './services/supabaseClient';
import { InfoFooter } from './components/InfoFooter';


export type Page = 
  | 'home' 
  | 'login' 
  | 'signup' 
  | 'forgotPassword'
  | 'updatePassword'
  | 'addProduct' 
  | 'editProduct'
  | 'myPage' 
  | 'admin' 
  | { page: 'productDetail', productId: number }
  | { page: 'chat', sessionId: number };

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};


const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { location, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();
  const [isLocationSorted, setIsLocationSorted] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    category: { primary: '', secondary: '' },
    location: { province: '', city: '' },
  });

  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [productDistances, setProductDistances] = useState<Record<number, number>>({});
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Initialize currentPage based on URL pathname
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/update-password') {
      setCurrentPage('updatePassword');
    } else if (path === '/forgot-password') {
      setCurrentPage('forgotPassword');
    } else if (path === '/login') {
      setCurrentPage('login');
    } else if (path === '/signup') {
      setCurrentPage('signup');
    } else {
      setCurrentPage('home');
    }
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const initialProducts = await api.getProducts();
            setProducts(initialProducts.sort(() => Math.random() - 0.5));
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchProducts();
    
    const { data: authListener } = api.onAuthStateChange((event, session) => {
        if (session?.user) {
            api.getProfile(session.user.id).then(profile => {
                if (profile) {
                    setCurrentUser(profile);
                }
            });
        } else {
            setCurrentUser(null);
        }
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (location.latitude && location.longitude && products.length > 0) {
        const distances: Record<number, number> = {};
        products.forEach(p => {
            distances[p.id] = calculateDistance(location.latitude!, location.longitude!, p.location.latitude, p.location.longitude);
        });
        setProductDistances(distances);

        setProducts(prevProducts => [...prevProducts].sort((a, b) => distances[a.id] - distances[b.id]));
        setIsLocationSorted(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.latitude, location.longitude, products.length > 0]);

  const navigateTo = (page: Page) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
  };
  
  const handleLogout = async () => {
    await api.signOut();
    setCurrentUser(null);
    navigateTo('home');
  }

  const handleNearbyClick = () => {
    setIsLocationSorted(false);
    setProductDistances({});
    requestLocation();
  };
  
  const handleToggleWishlist = async (productId: number) => {
    if (!currentUser) {
      navigateTo('login');
      return;
    }
    const updatedUser = await api.toggleWishlist(currentUser.id, productId);
    setCurrentUser(updatedUser);
  };

  const handleAddProduct = async (productInfo: NewProductInfo) => {
    if (!currentUser) {
        alert("Anda harus login untuk menambah produk.");
        navigateTo('login');
        return;
    }
    
    try {
        const newProduct = await api.addProduct(productInfo, currentUser.id);
        setProducts(prevProducts => [newProduct, ...prevProducts]);
        navigateTo('home');
    } catch(error) {
        console.error("Failed to add product:", error);
        alert("Gagal menambahkan produk.");
    }
  };
  
  const handleStartEdit = (productId: number) => {
    const productToEdit = products.find(p => p.id === productId);
    if (productToEdit) {
      setEditingProduct(productToEdit);
      navigateTo('editProduct');
    }
  };

  const handleUpdateProduct = async (updatedInfo: UpdatedProductInfo) => {
    try {
        const updatedProduct = await api.updateProduct(updatedInfo);
        setProducts(prevProducts =>
            prevProducts.map(p => (p.id === updatedProduct.id ? updatedProduct : p))
        );
        setEditingProduct(null);
        navigateTo(currentUser?.role === 'admin' ? 'admin' : 'myPage');
    } catch(error) {
        console.error("Failed to update product:", error);
        alert("Gagal memperbarui produk.");
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat diurungkan.')) {
        try {
            await api.deleteProduct(productId);
            setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
        } catch(error) {
            console.error("Failed to delete product:", error);
            alert("Gagal menghapus produk.");
        }
    }
  };

  const handleUpdateUser = async (updatedUserInfo: UpdatedUserInfo) => {
    if (!currentUser) return;
    try {
        const updatedUser = await api.updateProfile(currentUser.id, updatedUserInfo);
        setCurrentUser(updatedUser);
        alert('Profil berhasil diperbarui.');
    } catch (error) {
        alert('Gagal memperbarui profil.');
        console.error(error);
    }
  };


  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const searchTermMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const provinceMatch = !activeFilters.location.province || product.location.province === activeFilters.location.province;
      const cityMatch = !activeFilters.location.city || product.location.city === activeFilters.location.city;
      
      const primaryCategoryMatch = !activeFilters.category.primary || product.category.primary === activeFilters.category.primary;
      const secondaryCategoryMatch = !activeFilters.category.secondary || product.category.secondary === activeFilters.category.secondary;

      return searchTermMatch && provinceMatch && cityMatch && primaryCategoryMatch && secondaryCategoryMatch;
    });
  }, [products, searchTerm, activeFilters]);

  const handleFilterChange = (filterType: 'location' | 'category', value: { primary: string, secondary: string } | { province: string, city: string }) => {
    setActiveFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const handleResetFilters = () => {
    setActiveFilters({
      category: { primary: '', secondary: '' },
      location: { province: '', city: '' },
    });
  };

  const renderContent = () => {
    const pageName = typeof currentPage === 'string' ? currentPage : currentPage.page;
    console.log('DEBUG: Current Page:', pageName); // Debug log

    switch (pageName) {
      case 'login':
        return <LoginPage onNavigate={navigateTo} onLoginSuccess={() => navigateTo('home')} />;
      case 'signup':
        return <SignupPage onNavigate={navigateTo} />;
      case 'forgotPassword':
        return <ForgotPasswordPage onNavigate={navigateTo} />;
      case 'updatePassword':
        return <UpdatePasswordPage onNavigate={navigateTo} />;
      case 'productDetail':
        if (typeof currentPage === 'object' && 'productId' in currentPage) {
            const product = products.find(p => p.id === currentPage.productId);
            if (!product) {
                return <div>Produk tidak ditemukan.</div>;
            }
            return <ProductDetailPage 
                        product={product} 
                        allProducts={products}
                        currentUser={currentUser}
                        onNavigate={navigateTo}
                        onBack={() => navigateTo('home')} 
                        wishlist={currentUser?.wishlist || []}
                        onToggleWishlist={handleToggleWishlist}
                    />;
        }
        return null;
      case 'addProduct':
        return <AddProductPage onNavigate={navigateTo} onAddProduct={handleAddProduct} />;
      case 'editProduct':
        return editingProduct ? <AddProductPage onNavigate={navigateTo} onAddProduct={handleAddProduct} productToEdit={editingProduct} onUpdateProduct={handleUpdateProduct} /> : <div>Produk untuk diedit tidak ditemukan.</div>;
      case 'myPage':
        return currentUser ? <MyPage user={currentUser} products={products} onNavigate={navigateTo} onEditProduct={handleStartEdit} onDeleteProduct={handleDeleteProduct} onUpdateUser={handleUpdateUser} onToggleWishlist={handleToggleWishlist} /> : <LoginPage onNavigate={navigateTo} onLoginSuccess={() => navigateTo('myPage')} />;
      case 'admin':
        return currentUser?.role === 'admin' ? <AdminPage products={products} onNavigate={navigateTo} onEditProduct={handleStartEdit} onDeleteProduct={handleDeleteProduct} /> : <div>Access Denied</div>;
      case 'chat':
          if (typeof currentPage === 'object' && 'sessionId' in currentPage && currentUser) {
            return <ChatPage sessionId={currentPage.sessionId} currentUser={currentUser} onNavigate={navigateTo} />;
          }
          return <div>Tidak dapat memuat sesi obrolan.</div>;
      case 'home':
      default:
        return (
          <>
            <div className="mb-6">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            </div>
            <Filters 
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              categories={categories}
              locations={locations}
            />
            <LocationBanner loading={geoLoading} error={geoError} sorted={isLocationSorted} />
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
              </div>
            ) : (
              <ProductGrid products={filteredProducts} distances={productDistances} onProductClick={(id) => navigateTo({ page: 'productDetail', productId: id })} wishlist={currentUser?.wishlist || []} onToggleWishlist={handleToggleWishlist} />
            )}
          </>
        );
    }
  };

  const pageName = typeof currentPage === 'string' ? currentPage : currentPage.page;
  const hasFooter = !['login', 'signup', 'admin', 'chat', 'productDetail', 'forgotPassword', 'updatePassword'].includes(pageName);


  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col">
      <Header currentUser={currentUser} onNavigate={navigateTo} onLogout={handleLogout} />
      <main className={`flex-grow pt-20 ${hasFooter ? 'pb-24' : 'pb-4'} px-4`}>
        <div className="flex flex-col min-h-full">
            <div className="flex-grow">
                {renderContent()}
            </div>
            <div className="mt-8 -mx-4">
                <InfoFooter />
            </div>
        </div>
      </main>
      {hasFooter && <Footer currentPage={currentPage} onNavigate={navigateTo} onNearbyClick={handleNearbyClick} />}
    </div>
  );
};

export default App;