import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RoleSwitcher } from './components/RoleSwitcher';
import { LiveAlertToast } from './components/LiveAlertToast';
import { useAlertFeed } from './hooks/useAlertFeed';
import { ManagerPage } from './pages/ManagerPage';
import { SupervisorPage } from './pages/SupervisorPage';
import { MaintenancePage } from './pages/MaintenancePage';

function AppContent() {
  const { latestAlert, dismissAlert, lastUpdated, isConnected } = useAlertFeed();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col selection:bg-red-600 selection:text-white">
      {/* Top Persistent Role Switcher + Live Monitoring Status */}
      <RoleSwitcher lastUpdated={lastUpdated} isConnected={isConnected} />

      {/* Live Disruption Alert Toast Notification */}
      <LiveAlertToast alert={latestAlert} onDismiss={dismissAlert} />

      {/* Primary Application Route Screens */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/manager" replace />} />
          <Route path="/manager" element={<ManagerPage />} />
          <Route path="/supervisor" element={<SupervisorPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
