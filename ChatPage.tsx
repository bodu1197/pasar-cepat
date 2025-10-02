
import React, { useState, useEffect, useRef } from 'react';
import type { Page } from './App';
import type { User, ChatMessage, ChatSession } from './types';
import { getMessagesForChat, sendMessage, getChatSession, getProfile } from './services/supabaseClient';
import { ChevronLeftIcon, SendIcon } from './components/Icons';

interface ChatPageProps {
    sessionId: number;
    currentUser: User;
    onNavigate: (page: Page) => void;
}

const MessageBubble: React.FC<{ message: ChatMessage, isCurrentUser: boolean }> = ({ message, isCurrentUser }) => {
    const alignment = isCurrentUser ? 'justify-end' : 'justify-start';
    const bubbleColor = isCurrentUser ? 'bg-emerald-600' : 'bg-gray-700';
    
    return (
        <div className={`flex ${alignment} mb-2`}>
            <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${bubbleColor}`}>
                <p className="text-white">{message.text}</p>
                <p className={`text-xs mt-1 ${isCurrentUser ? 'text-emerald-200' : 'text-gray-400'} text-right`}>
                    {new Date(message.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
}

export const ChatPage: React.FC<ChatPageProps> = ({ sessionId, currentUser, onNavigate }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sessionInfo, setSessionInfo] = useState<ChatSession | null>(null);
    const [otherUser, setOtherUser] = useState<User | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getChatSession(sessionId).then(session => {
            if (session) {
                setSessionInfo(session);
                const otherUserId = session.buyerId === currentUser.id ? session.sellerId : session.buyerId;
                getProfile(otherUserId).then(setOtherUser);
            }
        });

        const unsubscribe = getMessagesForChat(sessionId, (message) => {
            setMessages(prev => {
                if (prev.some(m => m.id === message.id)) {
                    return prev;
                }
                const newMessages = [...prev, message];
                return newMessages.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            });
        });

        return () => unsubscribe();
    }, [sessionId, currentUser.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            sendMessage(sessionId, currentUser.id, newMessage.trim());
            setNewMessage('');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
             <header className="flex items-center p-4 border-b border-gray-700 bg-gray-800 flex-shrink-0">
                <button onClick={() => onNavigate('myPage')} className="p-2 -ml-2 text-white">
                    <ChevronLeftIcon />
                </button>
                {sessionInfo && otherUser && (
                    <div className="flex items-center ml-2">
                        <img src={otherUser.avatarUrl} alt={otherUser.name} className="w-10 h-10 rounded-full object-cover"/>
                        <div className="ml-3">
                            <p className="font-bold text-white">{otherUser.name}</p>
                            <p className="text-sm text-gray-400 truncate">{sessionInfo.productName}</p>
                        </div>
                    </div>
                )}
            </header>
            
            <main className="flex-grow p-4 overflow-y-auto">
                {messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} isCurrentUser={msg.senderId === currentUser.id} />
                ))}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-4 border-t border-gray-700 bg-gray-800 flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input 
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Ketik pesan Anda..."
                        className="flex-grow bg-gray-700 border border-gray-600 rounded-full py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-3 transition-colors">
                        <SendIcon />
                    </button>
                </form>
            </footer>
        </div>
    );
};
