
import React from 'react';
import { HomeIcon, SellIcon, ChatIcon, ProfileIcon, GpsIcon } from './Icons';
import type { Page } from '../App';

interface FooterProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
    onNearbyClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({ currentPage, onNavigate, onNearbyClick }) => {
  const pageName = typeof currentPage === 'string' ? currentPage : currentPage.page;
  
  const navItems = [
    { name: 'Beranda', icon: HomeIcon, page: 'home' as const },
    { name: 'Jual', icon: SellIcon, page: 'addProduct' as const },
    { name: 'Sekitar', icon: GpsIcon, page: 'nearby_action' as const},
    { name: 'Obrolan', icon: ChatIcon, page: 'myPage' as const },
    { name: 'Akun Saya', icon: ProfileIcon, page: 'myPage' as const },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-2 z-50">
      <nav className="flex justify-around items-center">
        {navItems.map(item => {
            const IconComponent = item.icon;

            if (item.page === 'nearby_action') {
              return (
                <button 
                    key={item.name}
                    onClick={onNearbyClick}
                    className="flex flex-col items-center p-2 transition-colors w-1/5 text-gray-400 hover:text-white"
                >
                    <IconComponent className="w-6 h-6" />
                    <span className="text-xs mt-1">{item.name}</span>
                </button>
              )
            }

            // FIX: Corrected logic for determining active state. The previous logic had a type error and did not correctly highlight the chat icon on the chat page.
            const isActive = (pageName === item.page) || (pageName === 'chat' && item.name === 'Obrolan');

            return (
                <button 
                    key={item.name}
                    onClick={() => onNavigate(item.page as Page)}
                    className={`flex flex-col items-center p-2 transition-colors w-1/5 ${isActive ? 'text-emerald-400' : 'text-gray-400 hover:text-white'}`}
                >
                    <IconComponent active={isActive} />
                    <span className="text-xs mt-1">{item.name}</span>
                </button>
            )
        })}
      </nav>
    </footer>
  );
};
