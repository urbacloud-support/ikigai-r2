import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Menu, CalendarDays, TrendingUp, Users } from "lucide-react";
import Header from '../../components/shared/Header';

export default function AdminLayout() {
  const location = useLocation();
  const path = location.pathname;
  const [isCollapsed, setIsCollapsed] = useState(false);

  let activeTab = "events";
  if (path.includes("/progress")) activeTab = "progress";
  if (path.includes("/users")) activeTab = "users";

  const navItems = [
    { id: "events", label: "Events", icon: CalendarDays, path: "/dashboard/events" },
    { id: "progress", label: "Progress", icon: TrendingUp, path: "/dashboard/progress" },
    { id: "users", label: "Users", icon: Users, path: "/dashboard/users" },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <Header />
      
      <div className="flex flex-1 overflow-hidden relative pb-16 md:pb-0">
        
        {/* Desktop Sidebar - Collapsible */}
        <aside 
          className={`bg-white border-r border-gray-200 shadow-sm flex flex-col shrink-0 transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-20' : 'w-64'} hidden md:flex`}
        >
          {/* Sidebar Header */}
          <div className={`flex items-center pt-8 pb-6 ${isCollapsed ? 'flex-col gap-6' : 'px-6 gap-4'}`}>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex-shrink-0 bg-white border border-primary-200 rounded-lg p-2.5 shadow-sm text-primary-700 hover:bg-primary-50 transition-colors"
              title="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>
            
            <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'opacity-0 w-0 h-0' : 'opacity-100 w-auto h-auto'}`}>
              <h1 className="text-2xl font-black text-primary-800 tracking-tight">Admin</h1>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 space-y-2 mt-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <Link 
                  key={item.id}
                  to={item.path}
                  title={isCollapsed ? item.label : ""}
                  className={`flex items-center gap-4 py-3.5 px-4 rounded-xl font-semibold transition-all duration-200 ${
                    isActive 
                      ? "bg-primary-100/60 text-primary-800 shadow-sm" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon size={20} className={`flex-shrink-0 ${isActive ? "text-primary-700" : "text-gray-400"}`} />
                  
                  <span className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${
                    isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto w-full min-w-0 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
        
        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="flex justify-around items-center h-16 px-2 pb-safe">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                    isActive ? 'text-primary-600' : 'text-gray-500'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'fill-primary-50' : ''} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
