import React, { useState } from "react";
import TimerWidget from '../../components/admin/TimerWidget.jsx';
import { Link, useLocation, Outlet } from "react-router-dom";
import { Menu, CalendarDays, TrendingUp, Users, FolderKanban } from "lucide-react";
import Header from '../../components/shared/Header';

export default function AdminLayout() {
  const location = useLocation();
  const path = location.pathname;
  const [isCollapsed, setIsCollapsed] = useState(false);

  let activeTab = "events";
  if (path.includes("/progress")) activeTab = "progress";
  if (path.includes("/users")) activeTab = "users";
  if (path.includes("/problems")) activeTab = "problems";

  const navItems = [
    { id: "events", label: "Events", icon: CalendarDays, path: "/dashboard/events" },
    { id: "problems", label: "Problem Statements", icon: FolderKanban, path: "/dashboard/problems" },
    { id: "progress", label: "Progress", icon: TrendingUp, path: "/dashboard/progress" },
    { id: "users", label: "Users", icon: Users, path: "/dashboard/users" },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <Header />
      
      <div className="flex flex-1 overflow-hidden relative pb-16 md:pb-0">
        
        {/* Desktop Sidebar - Collapsible */}
        <aside 
          className={`bg-white border-r border-gray-100 flex flex-col shrink-0 transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-24' : 'w-64'} hidden md:flex`}
        >
          {/* Sidebar Header */}
          <div className={`flex items-center pt-8 pb-6 transition-all duration-300 px-5`}>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`flex-shrink-0 bg-white border border-primary-200 rounded-[20px] flex items-center justify-center text-primary-800 hover:bg-primary-50 transition-all duration-300 w-14 h-14`}
              title="Toggle Sidebar"
            >
              <Menu size={22} strokeWidth={2} />
            </button>
            
            <div className={`transition-all duration-300 ease-in-out overflow-hidden flex items-center whitespace-nowrap ${isCollapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[200px] ml-4'}`}>
              <h1 className="text-2xl font-medium text-primary-900 tracking-tight">Admin</h1>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2 mt-4 px-5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <Link 
                  key={item.id}
                  to={item.path}
                  title={isCollapsed ? item.label : ""}
                  className={`flex items-center rounded-[20px] font-medium transition-all duration-300 overflow-hidden ${
                    isActive 
                      ? "bg-primary-50 text-primary-800" 
                      : "text-slate-500 hover:bg-gray-50 hover:text-slate-700"
                  } ${isCollapsed ? 'w-14' : 'w-full'}`}
                >
                  <div className="w-14 h-14 flex items-center justify-center shrink-0">
                    <Icon size={24} strokeWidth={2} className={`transition-all duration-300 ${isActive ? "text-primary-800" : "text-slate-400"}`} />
                  </div>
                  
                  <span className={`whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden ${
                    isCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[200px] pr-4'
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

      {/* Floating Timer Widget — visible on all admin pages */}
      <TimerWidget />
    </div>
  );
}
