import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Shield, Menu, X } from 'lucide-react';
import { ROLE_LABELS } from '../../config/constants';
import logo from '../../assets/ikigai.png';

export default function Header() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <div className="flex-shrink-0 flex items-center">
            <img src={logo} alt="IKIGAI" className="h-8 w-auto" />
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700">
                <UserIcon size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800 leading-none">{user?.name}</span>
                <span className="text-xs font-medium text-primary-600 flex items-center gap-1 mt-1">
                  <Shield size={10} />
                  {ROLE_LABELS[user?.role] || user?.role}
                </span>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>

          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-primary-600 focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pt-2 pb-4 space-y-1 shadow-lg">
          <div className="px-3 py-3 border-b border-gray-50 mb-2">
            <p className="text-sm font-medium text-gray-800">{user?.name}</p>
            <p className="text-xs text-primary-600 mt-1 flex items-center gap-1">
              <Shield size={12} />
              {ROLE_LABELS[user?.role] || user?.role}
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
}
