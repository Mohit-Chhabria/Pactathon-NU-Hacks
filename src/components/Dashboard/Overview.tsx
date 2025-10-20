import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, PermitApplication } from '../../lib/supabase';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity
} from 'lucide-react';

export const Overview: React.FC = () => {
  const { user, profile } = useAuth();
  const [applications, setApplications] = useState<PermitApplication[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    underReview: 0,
    approved: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadApplications();
    }
  }, [user?.id, profile?.role]);

  const loadApplications = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('permit_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (profile?.role === 'applicant') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.limit(5);

      if (error) throw error;

      setApplications(data || []);

      const total = data?.length || 0;
      const submitted = data?.filter(a => a.status === 'submitted').length || 0;
      const underReview = data?.filter(a => a.status === 'under_review').length || 0;
      const approved = data?.filter(a => a.status === 'approved').length || 0;

      setStats({ total, submitted, underReview, approved });
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: PermitApplication['status']) => {
    const styles = {
      draft: 'bg-slate-100 text-slate-700',
      submitted: 'bg-blue-100 text-blue-700',
      under_review: 'bg-amber-100 text-amber-700',
      corrections_needed: 'bg-red-100 text-red-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const statCards = [
    {
      title: 'Total Applications',
      value: stats.total,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      title: 'Submitted',
      value: stats.submitted,
      icon: Clock,
      color: 'bg-amber-500',
    },
    {
      title: 'Under Review',
      value: stats.underReview,
      icon: Activity,
      color: 'bg-purple-500',
    },
    {
      title: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome back, {profile?.full_name || 'User'}
        </h1>
        <p className="text-slate-600">
          Here's an overview of your permit applications and system activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Recent Applications</h2>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-600 mt-4">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">No applications yet</p>
            <p className="text-sm text-slate-500">
              Start by using the Smart Permit Checker to analyze your first permit
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{app.project_name}</h3>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{app.address}</p>
                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <span className="capitalize">{app.permit_type} Permit</span>
                      <span>•</span>
                      <span>Risk Score: {app.ai_risk_score}/100</span>
                      <span>•</span>
                      <span>Created {new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {app.ai_risk_score > 70 ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : app.ai_risk_score > 40 ? (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <TrendingUp className="w-12 h-12 mb-4 opacity-90" />
          <h3 className="text-xl font-semibold mb-2">AI-Powered Insights</h3>
          <p className="text-blue-100 mb-4">
            Our AI analyzes 26,000+ historical permit reviews to provide personalized guidance
          </p>
          <div className="text-sm text-blue-100">
            <div className="flex items-center justify-between py-2 border-t border-blue-400">
              <span>Average Review Time</span>
              <span className="font-semibold">45 days</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-blue-400">
              <span>Success Rate</span>
              <span className="font-semibold">87%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <Activity className="w-12 h-12 text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition">
              <p className="font-medium text-slate-900 text-sm">Start New Application</p>
              <p className="text-xs text-slate-600">Begin a new permit application</p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition">
              <p className="font-medium text-slate-900 text-sm">Ask AI Support</p>
              <p className="text-xs text-slate-600">Get instant answers to permit questions</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
