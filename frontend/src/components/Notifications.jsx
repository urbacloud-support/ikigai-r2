import useSocketStore from '../store/socketStore';
import { FiBell } from 'react-icons/fi';

export default function Notifications() {
  const notifications = useSocketStore(state => state.notifications);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map(notif => (
        <div 
          key={notif.id} 
          className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl p-4 rounded-xl flex items-center gap-3 animate-bounce shadow-green-500/20"
        >
          <div className="p-2 bg-green-100 text-green-600 rounded-full">
            <FiBell />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">Live Update</p>
            <p className="text-slate-600 text-sm">{notif.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
