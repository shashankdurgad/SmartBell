import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/shared/BottomNav';
import { FullPageSpinner } from './components/shared/Spinner';
import { DashboardPage } from './pages/DashboardPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { WorkoutPage } from './pages/WorkoutPage';
import { LibraryPage } from './pages/LibraryPage';
import { ProfilePage } from './pages/ProfilePage';
import { seedDatabase } from './database/seed';
import { useUserStore } from './stores/useUserStore';
import { ActiveWorkout } from './components/Tracker/ActiveWorkout';
import { WorkoutComplete } from './components/Tracker/WorkoutComplete';


function App() {
  const [isReady, setIsReady] = useState(false);
  const loadSettings = useUserStore((s) => s.loadSettings);

  useEffect(() => {
    async function init() {
      await seedDatabase();
      await loadSettings();
      setIsReady(true);
    }
    init();
  }, [loadSettings]);

  if (!isReady) {
    return <FullPageSpinner />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark-900">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/generator" element={<GeneratorPage />} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/workout/active" element={<ActiveWorkout />} />
          <Route path="/workout/complete" element={<WorkoutComplete />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
