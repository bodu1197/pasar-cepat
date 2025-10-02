

import React, { useState, useEffect } from 'react';
import type { Page } from './App';
import { ChevronLeftIcon, EditIcon, DeleteIcon } from './components/Icons';
import type { Product, User } from './types';
import { supabase } from './services/supabase';

interface AdminPageProps {
    products: Product[];
    onNavigate: (page: Page) => void;
    onEditProduct: (id: number) => void;
    onDeleteProduct: (id: number) => void;
}

const StatCard: React.FC<{title: string; value: string | number}> = ({ title, value }) => (
    <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
    </div>
);

export const AdminPage: React.FC<AdminPageProps> = ({ products, onNavigate, onEditProduct, onDeleteProduct }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            const { data, error } = await supabase.from('profiles').select('*');
            if (error) {
                console.error("Error fetching users:", error);
            } else {
                setUsers(data.map((u: any) => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role || 'user',
                    avatarUrl: u.avatar_url,
                    memberSince: u.created_at,
                    // These are simplified for admin view
                    lastLogin: '', 
                    itemsSold: 0,
                    wishlist: [],
                })));
            }
            setLoading(false);
        };
        fetchUsers();
    }, []);

    if (loading) {
        return <div>Loading admin data...</div>;
    }

    return (
        <div className="pb-6">
            <div className="flex items-center mb-6">
                <button onClick={() => onNavigate('home')} className="p-2 -ml-2 text-white">
                    <ChevronLeftIcon />
                </button>
                <h1 className="text-xl font-bold text-white ml-2">총 관리자 페이지</h1>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard title="총 사용자 수" value={users.length} />
                <StatCard title="총 상품 수" value={products.length} />
                <StatCard title="오늘 방문자 수" value="1,234" />
                <StatCard title="이번 달 방문자 수" value="25,678" />
            </div>

            {/* User Management */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-white mb-4">회원 관리</h2>
                <div className="bg-gray-800 rounded-lg overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">이름</th>
                                <th scope="col" className="px-6 py-3">이메일</th>
                                <th scope="col" className="px-6 py-3">역할</th>
                                <th scope="col" className="px-6 py-3">작업</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-gray-700">
                                    <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{user.name}</th>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4">{user.role}</td>
                                    <td className="px-6 py-4 flex space-x-2">
                                        <button className="text-gray-400 hover:text-white"><EditIcon /></button>
                                        <button className="text-gray-400 hover:text-red-400"><DeleteIcon /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

             {/* Product Management */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">등록 상품 관리</h2>
                 <div className="bg-gray-800 rounded-lg overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">상품명</th>
                                <th scope="col" className="px-6 py-3">가격</th>
                                <th scope="col" className="px-6 py-3">판매자</th>
                                <th scope="col" className="px-6 py-3">작업</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id} className="border-b border-gray-700">
                                    <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{product.name}</th>
                                    <td className="px-6 py-4">Rp {product.price.toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4">{users.find(u => u.id === product.sellerId)?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 flex space-x-2">
                                        <button onClick={() => onEditProduct(product.id)} className="text-gray-400 hover:text-white"><EditIcon /></button>
                                        <button onClick={() => onDeleteProduct(product.id)} className="text-gray-400 hover:text-red-400"><DeleteIcon /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};
