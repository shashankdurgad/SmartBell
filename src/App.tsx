import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/shared/BottomNav';
import { ActiveWorkoutBanner } from './components/shared/ActiveWorkoutBanner';
import { FullPageSpinner } from './components/shared/Spinner';
import { DashboardPage } from './pages/DashboardPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { WorkoutPage } from './pages/WorkoutPage';
import { LibraryPage } from './pages/LibraryPage';
import { ProfilePage } from './pages/ProfilePage';
import { PlanDetailsPage } from './pages/PlanDetailsPage';
import { PerformanceAnalysisPage } from './pages/PerformanceAnalysisPage';
import { ExercisePerformancePage } from './pages/ExercisePerformancePage';
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
          <Route path="/library/exercise/:exerciseId" element={<ExercisePerformancePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/workout/active" element={<ActiveWorkout />} />
          <Route path="/workout/complete" element={<WorkoutComplete />} />
          <Route path="/plan/:planId" element={<PlanDetailsPage />} />
          <Route path="/performance" element={<PerformanceAnalysisPage />} />
        </Routes>
        <ActiveWorkoutBanner />
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
