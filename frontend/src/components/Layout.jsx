import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import useAuthStore from '../store/authStore';

export default function Layout() {
  const { user } = useAuthStore();
  
  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-80px)]">
        <Sidebar role={user?.role} />
        <main className="flex-1 overflow-y-auto w-full min-w-0 flex flex-col relative p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
