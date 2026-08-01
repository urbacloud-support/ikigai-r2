import { Link, useLocation } from 'react-router-dom';
import { Menu, Layers, Users, Calendar, Settings } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar({ role }) {
  const location = useLocation();
  const path = location.pathname;
  const [isCollapsed, setIsCollapsed] = useState(false);

  const adminNav = [
    { id: 'tracks', label: 'Tracks', icon: Layers, path: '/admin' },
    { id: 'teams', label: 'Teams', icon: Users, path: '/admin/teams' },
    { id: 'events', label: 'Events', icon: Calendar, path: '/admin/events' },
  ];

  const teamNav = [
    { id: 'dashboard', label: 'My Team', icon: Users, path: '/dashboard' },
  ];

  const navItems = role === 'admin' ? adminNav : teamNav;

  return (
    <aside className={`bg-white border-r border-gray-200 shadow-sm flex flex-col shrink-0 transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-20' : 'w-64'} hidden md:flex h-full`}>
      <div className={`flex items-center pt-8 pb-6 ${isCollapsed ? 'flex-col gap-6' : 'px-6 gap-4'}`}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex-shrink-0 bg-white border border-green-200 rounded-lg p-2.5 shadow-sm text-green-700 hover:bg-green-50 transition-colors"
          title="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>
        <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'opacity-0 w-0 h-0' : 'opacity-100 w-auto h-auto'}`}>
          <h1 className="text-2xl font-black text-green-800 tracking-tight capitalize">{role === 'admin' ? 'Admin' : 'Dashboard'}</h1>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-2">
        {navItems.map((item) => {
          const isActive = path === item.path || (path === '/admin' && item.path === '/admin' && !location.pathname.includes('/teams') && !location.pathname.includes('/events'));
          const Icon = item.icon;
          return (
            <Link 
              key={item.id}
              to={item.path}
              title={isCollapsed ? item.label : ""}
              className={`flex items-center gap-4 py-3.5 px-4 rounded-xl font-semibold transition-all duration-200 ${
                isActive 
                  ? "bg-green-100/60 text-green-800 shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Icon size={20} className={`flex-shrink-0 ${isActive ? "text-green-700" : "text-slate-400"}`} />
              <span className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
