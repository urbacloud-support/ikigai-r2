import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeamDashboard from './pages/TeamDashboard';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Notifications from './components/Notifications';
import useAuthStore from './store/authStore';
import useSocketStore from './store/socketStore';

function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);
  const connectSocket = useSocketStore(state => state.connect);
  const disconnectSocket = useSocketStore(state => state.disconnect);
  
  useEffect(() => {
    checkAuth();
    connectSocket();
    return () => disconnectSocket();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 text-slate-800 font-sans antialiased selection:bg-green-300/50">
        <Notifications />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute allowedRoles={['admin']}><Layout /></ProtectedRoute>}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/teams" element={<AdminDashboard />} />
            <Route path="/admin/events" element={<AdminDashboard />} />
            <Route path="/admin/settings" element={<AdminDashboard />} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={['teamLeader', 'teamMember']}><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<TeamDashboard />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
