import { create } from 'zustand';
import { io } from 'socket.io-client';
import useAuthStore from './authStore';

const useSocketStore = create((set, get) => ({
  socket: null,
  notifications: [],
  
  connect: () => {
    if (get().socket) return;
    const socket = io(); // Connects to the same origin (via proxy /api if configured, or just / since socket.io auto-detects)
    
    socket.on('team_registered', (data) => {
      set((state) => ({
        notifications: [...state.notifications, {
          id: Date.now(),
          type: 'success',
          message: `Team "${data.teamName}" just successfully registered!`
        }]
      }));
      
      // Auto-remove after 5s
      const notificationId = Date.now();
      setTimeout(() => {
        get().removeNotification(notificationId);
      }, 5000);

      // Refresh auth state if this is our team
      const currentUser = useAuthStore.getState().user;
      if (currentUser && currentUser.team && currentUser.team._id === data.teamId) {
        useAuthStore.getState().checkAuth();
      }
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => Math.abs(n.id - id) > 5000) // Rough cleanup hack, ideally use exact ID
    }));
  }
}));

export default useSocketStore;
