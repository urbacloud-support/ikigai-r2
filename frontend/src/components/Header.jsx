import { useState } from 'react';
import useAuthStore from '../store/authStore';
import { LogOut, Bell, User } from 'lucide-react';
import ikigaiLogo from '../assets/ikigai.png';

export default function Header() {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="w-full bg-white/70 backdrop-blur-md border-b border-green-200 shadow-sm relative z-50">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:h-20">
        <div className="flex items-center min-w-0 w-1/2">
          <img
            src={ikigaiLogo}
            alt="Ikigai Logo"
            className="h-12 md:h-16 object-contain w-auto max-w-full"
          />
        </div>

        <div className="flex items-center gap-2 relative">
          <button 
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors mr-2">
            <Bell size={22} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-green-50"
          >
            <div className="w-10 h-10 bg-green-600 text-white flex items-center justify-center rounded-full font-semibold">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-semibold">{user?.name}</span>
              <span className="text-xs text-green-700 capitalize">{user?.role?.replace('_', ' ')}</span>
            </div>
          </button>

          {open && (
            <div className="absolute right-0 top-14 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || "No email"}</p>
                <p className="text-xs font-semibold text-green-600 mt-1 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
