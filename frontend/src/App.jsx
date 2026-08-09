import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { STORAGE_KEYS, ROLES } from './config/constants';

// Pages
import Login from './pages/Login';
import AdminLayout from './pages/admin/AdminLayout';
import EventsView from './pages/admin/EventsView';
import UsersView from './pages/admin/UsersView';
import ProgressView from './pages/admin/ProgressView';
import SessionsView from './pages/admin/SessionsView';
import RefreshmentsView from './pages/admin/RefreshmentsView';
import InventoryView from './pages/admin/InventoryView';

import JudgeDashboard from './pages/judge/JudgeDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import EvaluatorConsole from './pages/evaluator/EvaluatorConsole';

// Custom Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
  const userRole = sessionStorage.getItem(STORAGE_KEYS.ROLE);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If they have a token but wrong role, send them back to login to prevent snooping
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Admin Routes - Strictly protected */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="events" replace />} />
          <Route path="events" element={<EventsView />} />
          <Route path="users" element={<UsersView />} />
          <Route path="progress" element={<ProgressView />} />
          <Route path="sessions" element={<SessionsView />} />
          <Route path="refreshments" element={<RefreshmentsView />} />
          <Route path="inventory" element={<InventoryView />} />
        </Route>
        
        {/* Other Role Routes */}
        <Route path="/evaluator" element={
          <ProtectedRoute allowedRoles={[ROLES.EVALUATOR]}>
            <EvaluatorConsole />
          </ProtectedRoute>
        } />
        <Route path="/judge" element={
          <ProtectedRoute allowedRoles={[ROLES.JUDGE]}>
            <JudgeDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT_COORDINATOR]}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
