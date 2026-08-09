import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import EventsView from './pages/admin/EventsView';
import UsersView from './pages/admin/UsersView';
import ProgressView from './pages/admin/ProgressView';
import SessionsView from './pages/admin/SessionsView';
import RefreshmentsView from './pages/admin/RefreshmentsView';
import InventoryView from './pages/admin/InventoryView';

// Other Pages
import JudgeDashboard from './pages/judge/JudgeDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Placeholder Login Route */}
        <Route path="/" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Login Screen (Phase 6)</h1><a href="/admin/events" className="text-blue-500 hover:underline">Skip to Admin Console for now</a></div>} />

        {/* Modular Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="events" replace />} />
          <Route path="events" element={<EventsView />} />
          <Route path="users" element={<UsersView />} />
          <Route path="progress" element={<ProgressView />} />
          <Route path="sessions" element={<SessionsView />} />
          <Route path="refreshments" element={<RefreshmentsView />} />
          <Route path="inventory" element={<InventoryView />} />
        </Route>
        
        {/* Placeholders for other roles */}
        <Route path="/judge" element={<JudgeDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
