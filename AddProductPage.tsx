
import React, { useState, useMemo, useEffect } from 'react';
import type { Page } from './App';
import type { NewProductInfo, Product, UpdatedProductInfo } from './types';
import { ChevronLeftIcon } from './components/Icons';
import { categories, locations } from './services/filterData';
import { convertToWebP } from './utils/imageConverter';
import { supabase } from '../services/supabase';

interface AddProductPageProps {
    onNavigate: (page: Page) => void;
    onAddProduct: (productInfo: NewProductInfo) => void;
    productToEdit?: Product;
    onUpdateProduct?: (productInfo: UpdatedProductInfo) => void;
}

const Input = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input {...props} className="block w-full px-4 py-2 text-gray-200 placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-emerald-300" />
    </div>
);

const Textarea = ({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <textarea {...props} className="block w-full px-4 py-2 text-gray-200 placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-emerald-300 h-28 resize-none" />
    </div>
);

const Select = ({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <select {...props} className="block w-full px-4 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-emerald-300">
            {children}
        </select>
    </div>
);

const Checkbox = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
     <label className="flex items-center space-x-2">
        <input type="checkbox" {...props} className="form-checkbox h-5 w-5 bg-gray-600 border-gray-500 rounded text-emerald-500 focus:ring-emerald-400" />
        <span className="text-gray-300">{label}</span>
    </label>
);


export const AddProductPage: React.FC<AddProductPageProps> = ({ onNavigate, onAddProduct, productToEdit, onUpdateProduct }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [primaryCategory, setPrimaryCategory] = useState('');
    const [secondaryCategory, setSecondaryCategory] = useState('');
    const [province, setProvince] = useState('');
    const [city, setCity] = useState('');
    const [imagesToUpload, setImagesToUpload] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]); // Can be URLs or blob URLs
    const [isUploading, setIsUploading] = useState(false);
    
    const [useChat, setUseChat] = useState(true);
    const [useWhatsapp, setUseWhatsapp] = useState(false);
    const [whatsappNumber, setWhatsappNumber] = useState('');

    const isEditMode = !!productToEdit;

    useEffect(() => {
        if (isEditMode) {
            setName(productToEdit.name);
            setPrice(productToEdit.price.toString());
            setDescription(productToEdit.description);
            setPrimaryCategory(productToEdit.category.primary);
            setSecondaryCategory(productToEdit.category.secondary);
            setProvince(productToEdit.location.province);
            setCity(productToEdit.location.city);
            setImagePreviews(productToEdit.imageUrls);
            setUseChat(productToEdit.contactInfo.chat);
            setUseWhatsapp(!!productToEdit.contactInfo.whatsapp);
            setWhatsappNumber(productToEdit.contactInfo.whatsapp || '');
        }
    }, [isEditMode, productToEdit]);


    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const newImages = [...imagesToUpload, ...filesArray].slice(0, 10 - imagePreviews.length);
            setImagesToUpload(prev => [...prev, ...newImages]);

            const newPreviews = newImages.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        const removedPreview = imagePreviews[index];
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        setImagePreviews(newPreviews);
        
        if (removedPreview.startsWith('blob:')) {
            const blobUrlIndex = imagePreviews.slice(0, index).filter(p => p.startsWith('blob:')).length;
            setImagesToUpload(prev => prev.filter((_, i) => i !== blobUrlIndex));
        }
    }
    
    const selectedPrimaryCategory = useMemo(() => {
        return categories.find(c => c.name === primaryCategory);
    }, [primaryCategory]);

    const availableCities = useMemo(() => {
        return locations[province as keyof typeof locations] || [];
    }, [province]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        
        let uploadedImageUrls: string[] = [];
        
        if (imagesToUpload.length > 0) {
             const { data: { user } } = await supabase.auth.getUser();
             if (!user) {
                 alert("You must be logged in to upload images.");
                 setIsUploading(false);
                 return;
             }
            
             const uploadPromises = imagesToUpload.map(async (file) => {
                 const webpBlob = await convertToWebP(file);
                 if (!webpBlob) throw new Error("Failed to convert image to WebP");

                 const fileName = `${user.id}/${Date.now()}.webp`;
                 const { data, error } = await supabase.storage.from('product-images').upload(fileName, webpBlob, { contentType: 'image/webp' });
                 if (error) throw error;

                 const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(data.path);
                 return publicUrl;
             });

            try {
                uploadedImageUrls = await Promise.all(uploadPromises);
            } catch (error) {
                console.error("Image upload failed:", error);
                alert("Gagal mengunggah gambar.");
                setIsUploading(false);
                return;
            }
        }

        const existingImageUrls = imagePreviews.filter(p => !p.startsWith('blob:'));
        const finalImageUrls = [...existingImageUrls, ...uploadedImageUrls];
       
        if (finalImageUrls.length === 0) {
            finalImageUrls.push('https://picsum.photos/seed/default/600/400'); // Default image
        }

        const productData = {
            name,
            price: Number(price),
            description,
            category: { primary: primaryCategory, secondary: secondaryCategory },
            location: { 
                province, 
                city,
                latitude: productToEdit?.location.latitude || -6.2088,
                longitude: productToEdit?.location.longitude || 106.8456,
            },
            imageUrls: finalImageUrls,
            contactInfo: {
                chat: useChat,
                whatsapp: useWhatsapp ? whatsappNumber : undefined,
            }
        };

        if (isEditMode && onUpdateProduct && productToEdit) {
            const updatedProduct: UpdatedProductInfo = {
                ...productToEdit,
                ...productData
            };
            onUpdateProduct(updatedProduct);
        } else {
            onAddProduct(productData as NewProductInfo);
        }
        setIsUploading(false);
    };
    
    return (
        <div>
            <div className="flex items-center mb-6">
                <button onClick={() => onNavigate(isEditMode ? 'myPage' : 'home')} className="p-2 -ml-2 text-white">
                    <ChevronLeftIcon />
                </button>
                <h1 className="text-xl font-bold text-white ml-2">{isEditMode ? 'Edit Produk' : 'Tambah Produk'}</h1>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 pb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Gambar Produk ({imagePreviews.length}/10)</label>
                    {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative">
                                    <img src={preview} alt="preview" className="w-full h-24 object-cover rounded-md" />
                                    <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-0.5 text-xs">
                                        &#x2715;
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {imagePreviews.length < 10 && (
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-gray-400">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-emerald-400 hover:text-emerald-300 focus-within:outline-none">
                                        <span>Unggah file</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleImageChange} disabled={imagePreviews.length >= 10}/>
                                    </label>
                                    <p className="pl-1">atau seret dan lepas</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        </div>
                    )}
                </div>

                <Input label="Nama Produk" type="text" placeholder="Contoh: iPhone 11 Pro" required value={name} onChange={e => setName(e.target.value)} />
                <Input label="Harga (Rp)" type="number" placeholder="Contoh: 6000000" required value={price} onChange={e => setPrice(e.target.value)} />
                
                <div className="grid grid-cols-2 gap-4">
                    <Select label="Kategori" value={primaryCategory} onChange={e => {setPrimaryCategory(e.target.value); setSecondaryCategory('');}} required>
                        <option value="">Pilih</option>
                        {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                    </Select>
                    <Select label="Sub-Kategori" value={secondaryCategory} onChange={e => setSecondaryCategory(e.target.value)} disabled={!selectedPrimaryCategory} required>
                        <option value="">Pilih</option>
                        {selectedPrimaryCategory?.subcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </Select>
                </div>
                 
                <div className="grid grid-cols-2 gap-4">
                    <Select label="Provinsi" value={province} onChange={e => { setProvince(e.target.value); setCity(''); }} required>
                        <option value="">Pilih Provinsi</option>
                        {Object.keys(locations).sort().map(prov => <option key={prov} value={prov}>{prov}</option>)}
                    </Select>
                    <Select label="Kota/Kabupaten" value={city} onChange={e => setCity(e.target.value)} disabled={!province} required>
                        <option value="">Pilih Kota/Kabupaten</option>
                        {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                </div>
                
                <Textarea label="Deskripsi Rinci" placeholder="Masukkan informasi detail tentang produk Anda..." required value={description} onChange={e => setDescription(e.target.value)} />
                
                <div>
                     <label className="block text-sm font-medium text-gray-300 mb-2">Metode Kontak</label>
                     <div className="space-y-3">
                        <Checkbox label="Chat" checked={useChat} onChange={e => setUseChat(e.target.checked)} />
                        <Checkbox label="WhatsApp" checked={useWhatsapp} onChange={e => setUseWhatsapp(e.target.checked)} />
                        {useWhatsapp && (
                            <Input label="Nomor WhatsApp" type="tel" placeholder="6281234567890" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} required />
                        )}
                     </div>
                </div>

                <div>
                    <button type="submit" disabled={isUploading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-emerald-800 disabled:cursor-not-allowed">
                        {isUploading ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambahkan Produk')}
                    </button>
                </div>
            </form>
        </div>
    );
};
