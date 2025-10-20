import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { DashboardLayout } from './components/Dashboard/DashboardLayout';
import { Overview } from './components/Dashboard/Overview';
import { SmartPermitChecker } from './components/PermitChecker/SmartPermitChecker';
import { TimelinePredictor } from './components/Timeline/TimelinePredictor';
import { AiChatbot } from './components/AiChat/AiChatbot';
import { PublicDashboard } from './components/Analytics/PublicDashboard';
import { ReviewerTraining } from './components/Reviewer/ReviewerTraining';

type View = 'overview' | 'permit-checker' | 'timeline' | 'ai-chat' | 'dashboard' | 'training';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('overview');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <DashboardLayout currentView={currentView} onViewChange={setCurrentView}>
      <div style={{ display: currentView === 'overview' ? 'block' : 'none' }}>
        <Overview />
      </div>
      <div style={{ display: currentView === 'permit-checker' ? 'block' : 'none' }}>
        <SmartPermitChecker />
      </div>
      <div style={{ display: currentView === 'timeline' ? 'block' : 'none' }}>
        <TimelinePredictor />
      </div>
      <div style={{ display: currentView === 'ai-chat' ? 'block' : 'none' }}>
        <AiChatbot />
      </div>
      <div style={{ display: currentView === 'dashboard' ? 'block' : 'none' }}>
        <PublicDashboard />
      </div>
      <div style={{ display: currentView === 'training' ? 'block' : 'none' }}>
        <ReviewerTraining />
      </div>
    </DashboardLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
