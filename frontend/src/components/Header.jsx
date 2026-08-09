import React from 'react';
import { User, LogOut } from 'lucide-react';

const Header = ({ title, userName, role }) => {
    const handleLogout = () => {
        sessionStorage.clear();
        window.location.href = '/';
    };

    return (
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                        <User size={20} />
                    </div>
                    <div className="hidden md:block">
                        <p className="text-sm font-semibold text-gray-900">{userName || 'User'}</p>
                        <p className="text-xs text-gray-500 capitalize">{role || 'Role'}</p>
                    </div>
                </div>
                
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                >
                    <LogOut size={18} />
                    <span className="hidden sm:block">Logout</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
