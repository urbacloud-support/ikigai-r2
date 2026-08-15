import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';

import AdminLayout from './pages/admin/AdminLayout';
import EventsView from './pages/admin/EventsView';
import UsersView from './pages/admin/UsersView';
import ProgressView from './pages/admin/ProgressView';
import ProblemStatementsView from './pages/admin/ProblemStatementsView';
import EvaluatorConsole from './pages/evaluator/EvaluatorConsole';

const TeamLeaderDashboard = () => <div className="p-8 text-center text-primary-800 text-xl font-bold">Team Leader Dashboard Stub</div>;

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="p-8 text-center text-red-500 font-bold">Unauthorized Role</div>;
  }
  return children;
};

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  
  if (user.role === 'admin') return <Navigate to="/dashboard/events" replace />;
  if (user.role === 'evaluator' || user.role === 'judge') return <Navigate to="/evaluator" replace />;
  if (user.role === 'teamLeader') return <Navigate to="/teamLeader" replace />;
  
  return <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="events" replace />} />
            <Route path="events" element={<EventsView />} />
            <Route path="progress" element={<ProgressView />} />
            <Route path="users" element={<UsersView />} />
            <Route path="problems" element={<ProblemStatementsView />} />
          </Route>

          {/* Evaluator Routes */}
          <Route path="/evaluator" element={
            <ProtectedRoute allowedRoles={['evaluator', 'judge']}>
              <EvaluatorConsole />
            </ProtectedRoute>
          } />

          {/* Other Roles */}
          <Route path="/teamLeader" element={
            <ProtectedRoute allowedRoles={['teamLeader']}>
              <TeamLeaderDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback & Root */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
