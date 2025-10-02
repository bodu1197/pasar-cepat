
import React from 'react';
import type { User } from '../types';
import type { Page } from '../App';
import { MessageIcon, UserIcon, AdminIcon, LogoutIcon } from './Icons';

interface HeaderProps {
    currentUser: User | null;
    onNavigate: (page: Page) => void;
    onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onNavigate, onLogout }) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900 bg-opacity-80 backdrop-blur-md border-b border-gray-700 p-4 flex justify-between items-center z-50">
      <h1 className="text-xl font-bold text-emerald-400 cursor-pointer" onClick={() => onNavigate('home')}>Pasar Cepat</h1>
      <div className="flex items-center space-x-4">
        {currentUser ? (
          <>
            <button className="text-gray-300 hover:text-white transition-colors">
              <MessageIcon />
            </button>
            {currentUser.role === 'admin' && (
                 <button onClick={() => onNavigate('admin')} className="text-gray-300 hover:text-white transition-colors">
                    <AdminIcon />
                 </button>
            )}
            <button onClick={() => onNavigate('myPage')} className="text-gray-300 hover:text-white transition-colors">
              <UserIcon />
            </button>
            <button onClick={onLogout} className="text-gray-300 hover:text-white transition-colors">
              <LogoutIcon />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => onNavigate('login')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Masuk
            </button>
            <button onClick={() => onNavigate('signup')} className="text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-full transition-colors">
              Daftar
            </button>
          </>
        )}
      </div>
    </header>
  );
};
