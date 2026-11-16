import React, { useState } from 'react';
import { ChallengeFormModal } from './components/challenges/ChallengeFormModal';
import { MobileNav } from './components/layout/MobileNav';
import { Sidebar } from './components/layout/Sidebar';
import { MissionFormModal } from './components/missions/MissionFormModal';
import { PinLockScreen } from './components/ui/PinLockScreen';
import { ToastContainer } from './components/ui/ToastContainer';
import { AchievementsPage } from './pages/AchievementsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CalendarPage } from './pages/CalendarPage';
import { ChallengesPage } from './pages/ChallengesPage';
import { MissionsPage } from './pages/MissionsPage';
import { OverviewPage } from './pages/OverviewPage';
import { SettingsPage } from './pages/SettingsPage';
import { AppProvider, useApp } from './state/AppContext';
import type { Challenge, Mission } from './types';

const AppShell: React.FC = () => {
  const { loading, error, activePage, isLocked } = useApp();

  const [missionModalOpen, setMissionModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-bg gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center font-mono font-bold text-accent animate-pulse">
          IZ
        </div>
        <p className="text-sm text-text-muted">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg px-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-surface border border-red-500/30 text-center space-y-2">
          <h1 className="text-lg font-bold text-red-400">Xatolik yuz berdi</h1>
          <p className="text-sm text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return <PinLockScreen />;
  }

  const openCreateMission = () => {
    setEditingMission(null);
    setMissionModalOpen(true);
  };

  const openEditMission = (mission: Mission) => {
    setEditingMission(mission);
    setMissionModalOpen(true);
  };

  const openCreateChallenge = () => {
    setEditingChallenge(null);
    setChallengeModalOpen(true);
  };

  const openEditChallenge = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setChallengeModalOpen(true);
  };

  return (
    <div className="min-h-dvh bg-bg text-text-primary flex">
      <Sidebar />

      <main className="flex-1 md:pl-64 min-w-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 pb-28 md:pb-10">
          {activePage === 'overview' && (
            <OverviewPage
              onOpenCreateMission={openCreateMission}
              onOpenCreateChallenge={openCreateChallenge}
            />
          )}
          {activePage === 'missions' && (
            <MissionsPage
              onOpenCreateMission={openCreateMission}
              onEditMission={openEditMission}
            />
          )}
          {activePage === 'challenges' && (
            <ChallengesPage
              onOpenCreateChallenge={openCreateChallenge}
              onEditChallenge={openEditChallenge}
            />
          )}
          {activePage === 'calendar' && <CalendarPage />}
          {activePage === 'analytics' && <AnalyticsPage />}
          {activePage === 'achievements' && <AchievementsPage />}
          {activePage === 'settings' && <SettingsPage />}
        </div>
      </main>

      <MobileNav onCreateMission={openCreateMission} />
      <ToastContainer />

      <MissionFormModal
        open={missionModalOpen}
        onClose={() => setMissionModalOpen(false)}
        editingMission={editingMission}
      />

      <ChallengeFormModal
        open={challengeModalOpen}
        onClose={() => setChallengeModalOpen(false)}
        editingChallenge={editingChallenge}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
};

export default App;