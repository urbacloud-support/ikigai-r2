import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';

// Placeholder dashboards (will build in subsequent phases)
const AdminDashboard = () => <div className="p-8 text-center text-primary-800 text-xl font-bold">Admin Dashboard Stub</div>;
const EvaluatorDashboard = () => <div className="p-8 text-center text-primary-800 text-xl font-bold">Evaluator Dashboard Stub</div>;
const TeamLeaderDashboard = () => <div className="p-8 text-center text-primary-800 text-xl font-bold">Team Leader Dashboard Stub</div>;

const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'evaluator':
    case 'judge':
      return <EvaluatorDashboard />;
    case 'teamLeader':
      return <TeamLeaderDashboard />;
    default:
      return <div className="p-8 text-center text-red-500 font-bold">Unauthorized Role</div>;
  }
};

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
