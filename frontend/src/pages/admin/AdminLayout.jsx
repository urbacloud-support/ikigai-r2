import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Calendar, Users, BarChart, Clock, Coffee, Package, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const location = useLocation();

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = '/';
  };

  const navItems = [
    { name: 'Events', path: '/admin/events', icon: Calendar },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Progress', path: '/admin/progress', icon: BarChart },
    { name: 'Sessions', path: '/admin/sessions', icon: Clock },
    { name: 'Refreshments', path: '/admin/refreshments', icon: Coffee },
    { name: 'Inventory', path: '/admin/inventory', icon: Package }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r shadow-sm flex flex-col">
        <div className="p-6 border-b flex items-center gap-3">
          <img src="/ikigai.png" alt="Logo" className="h-8 w-8 object-contain" onError={(e) => e.target.style.display = 'none'} />
          <h1 className="text-xl font-bold text-gray-800">Admin Console</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-50 text-primary-600 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-primary-600' : 'text-gray-400'} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
