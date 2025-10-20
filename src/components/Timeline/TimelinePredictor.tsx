import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, TrendingUp, Calendar, MapPin, Zap } from 'lucide-react';
import { supabase, PermitApplication, BottleneckPrediction } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const TimelinePredictor: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<PermitApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<PermitApplication | null>(null);
  const [predictions, setPredictions] = useState<BottleneckPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadApplications();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedApp) {
      loadPredictions(selectedApp.id);
    }
  }, [selectedApp]);

  const loadApplications = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('permit_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setApplications(data || []);
      if (data && data.length > 0) {
        setSelectedApp(data[0]);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPredictions = async (applicationId: string) => {
    try {
      const { data, error } = await supabase
        .from('bottleneck_predictions')
        .select('*')
        .eq('application_id', applicationId);

      if (error) throw error;
      setPredictions(data || []);
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  };

  const timelinePhases = [
    { name: 'Document Review', days: 7, status: 'completed' },
    { name: 'Technical Review', days: 14, status: 'in_progress' },
    { name: 'Zoning Compliance', days: 5, status: 'pending' },
    { name: 'Final Approval', days: 3, status: 'pending' },
  ];

  const getTotalDays = () => {
    return timelinePhases.reduce((sum, phase) => sum + phase.days, 0);
  };

  const getCompletedDays = () => {
    return timelinePhases
      .filter(p => p.status === 'completed')
      .reduce((sum, phase) => sum + phase.days, 0);
  };

  const getPhaseColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      default:
        return 'bg-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-slate-600 mt-4">Loading timeline data...</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600 mb-4">No applications to analyze</p>
        <p className="text-sm text-slate-500">
          Create a permit application first to see timeline predictions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Timeline Predictor</h1>
        <p className="text-slate-600">
          AI-powered predictions for permit processing times and potential bottlenecks
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Application
        </label>
        <select
          value={selectedApp?.id}
          onChange={(e) => {
            const app = applications.find(a => a.id === e.target.value);
            setSelectedApp(app || null);
          }}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {applications.map((app) => (
            <option key={app.id} value={app.id}>
              {app.project_name} - {app.address}
            </option>
          ))}
        </select>
      </div>

      {selectedApp && (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="w-10 h-10 text-blue-600" />
                <span className="text-xs font-medium text-slate-500 uppercase">Estimated</span>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{getTotalDays()} days</p>
              <p className="text-sm text-slate-600">Total processing time</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-10 h-10 text-green-600" />
                <span className="text-xs font-medium text-slate-500 uppercase">Progress</span>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{getCompletedDays()} days</p>
              <p className="text-sm text-slate-600">Completed so far</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <AlertTriangle className="w-10 h-10 text-amber-600" />
                <span className="text-xs font-medium text-slate-500 uppercase">Risk</span>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{predictions.length}</p>
              <p className="text-sm text-slate-600">Potential bottlenecks</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Processing Timeline</h2>

            <div className="space-y-6">
              {timelinePhases.map((phase, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full ${getPhaseColor(phase.status)} flex items-center justify-center`}>
                        {phase.status === 'completed' ? (
                          <Zap className="w-5 h-5 text-white" />
                        ) : (
                          <span className="text-white font-semibold">{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{phase.name}</p>
                        <p className="text-sm text-slate-600">{phase.days} days</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
                      phase.status === 'completed' ? 'bg-green-100 text-green-700' :
                      phase.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {phase.status.replace('_', ' ')}
                    </span>
                  </div>
                  {index < timelinePhases.length - 1 && (
                    <div className="ml-5 w-0.5 h-8 bg-slate-200" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600">Overall Progress</span>
                <span className="font-semibold text-slate-900">
                  {Math.round((getCompletedDays() / getTotalDays()) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(getCompletedDays() / getTotalDays()) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {predictions.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                <h2 className="text-xl font-semibold text-slate-900">Predicted Bottlenecks</h2>
              </div>

              <div className="space-y-4">
                {predictions.map((prediction) => (
                  <div key={prediction.id} className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 capitalize mb-1">
                          {prediction.bottleneck_type.replace('_', ' ')}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-slate-600">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            +{prediction.predicted_delay_days} days delay
                          </span>
                          <span>
                            {Math.round(prediction.confidence_score * 100)}% confidence
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-700 uppercase mb-2">
                          Contributing Factors
                        </p>
                        <ul className="space-y-1">
                          {(prediction.factors as string[]).map((factor, idx) => (
                            <li key={idx} className="text-sm text-slate-700 flex items-start">
                              <span className="text-amber-600 mr-2">•</span>
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-700 uppercase mb-2">
                          Recommendations
                        </p>
                        <ul className="space-y-1">
                          {(prediction.recommendations as string[]).slice(0, 2).map((rec, idx) => (
                            <li key={idx} className="text-sm text-slate-700 flex items-start">
                              <TrendingUp className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-6 text-white">
            <div className="flex items-start space-x-4">
              <MapPin className="w-8 h-8 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Location-Based Insights</h3>
                <p className="text-slate-300 text-sm mb-4">
                  Projects at {selectedApp.address} typically experience:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white bg-opacity-10 rounded-lg p-3">
                    <p className="text-xs text-slate-300 mb-1">Average Processing Time</p>
                    <p className="text-xl font-bold">42 days</p>
                  </div>
                  <div className="bg-white bg-opacity-10 rounded-lg p-3">
                    <p className="text-xs text-slate-300 mb-1">First-Time Approval Rate</p>
                    <p className="text-xl font-bold">73%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
