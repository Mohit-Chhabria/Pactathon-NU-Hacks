import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  FileCheck,
  Clock,
  MessageSquare,
  BarChart3,
  GraduationCap,
  LogOut,
  Menu,
  X,
  Bell,
  Home
} from 'lucide-react';

type View = 'overview' | 'permit-checker' | 'timeline' | 'ai-chat' | 'dashboard' | 'training';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, currentView, onViewChange }) => {
  const { profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { id: 'overview', name: 'Overview', icon: Home },
    { id: 'permit-checker', name: 'Smart Permit Checker', icon: FileCheck },
    { id: 'timeline', name: 'Timeline Predictor', icon: Clock },
    { id: 'ai-chat', name: 'AI Support', icon: MessageSquare },
    { id: 'dashboard', name: 'Analytics Dashboard', icon: BarChart3 },
    ...(profile?.role === 'reviewer' ? [{ id: 'training', name: 'Reviewer Training', icon: GraduationCap }] : []),
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold text-slate-900">Seattle Permits</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition">
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        <aside className={`
          fixed md:sticky top-16 left-0 z-20 w-64 h-[calc(100vh-4rem)] bg-white border-r border-slate-200
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <nav className="p-4 space-y-1 overflow-y-auto h-full">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id as View);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};
