import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Search,
  TrendingUp,
  Users,
  Target,
  Clock
} from 'lucide-react';

type TrainingModule = {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  completed: boolean;
  topics: string[];
};

type CommonIssue = {
  category: string;
  issue: string;
  guidance: string;
  codeReference: string;
  frequency: number;
};

export const ReviewerTraining: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const trainingModules: TrainingModule[] = [
    {
      id: '1',
      title: 'Fire and Life Safety Review Fundamentals',
      description: 'Learn to identify and resolve common fire safety plan issues based on historical review data',
      duration: '45 min',
      level: 'beginner',
      completed: true,
      topics: ['Egress calculations', 'Fire-rated assemblies', 'Occupancy classifications'],
    },
    {
      id: '2',
      title: 'Advanced Structural Review Techniques',
      description: 'Master complex structural calculations and connection details using AI-assisted analysis',
      duration: '1.5 hrs',
      level: 'advanced',
      completed: false,
      topics: ['Load path analysis', 'Seismic detailing', 'Foundation design'],
    },
    {
      id: '3',
      title: 'Energy Code Compliance Review',
      description: 'Streamline energy code reviews with automated compliance checking tools',
      duration: '30 min',
      level: 'intermediate',
      completed: true,
      topics: ['WSEC requirements', 'Equipment specifications', 'Building envelope'],
    },
    {
      id: '4',
      title: 'Zoning and Land Use Interpretation',
      description: 'Navigate Seattle\'s complex zoning code with case studies from 26,000+ permits',
      duration: '1 hr',
      level: 'intermediate',
      completed: false,
      topics: ['Setback requirements', 'Height limits', 'Lot coverage'],
    },
  ];

  const commonIssues: CommonIssue[] = [
    {
      category: 'Fire Safety',
      issue: 'Incomplete egress width calculations',
      guidance: 'Verify that exit width calculations account for all occupants per IBC Table 1006.2.1. Common error: forgetting to include basement occupants in total count.',
      codeReference: 'IBC Section 1006.2',
      frequency: 342,
    },
    {
      category: 'Structural',
      issue: 'Missing beam-to-column connection details',
      guidance: 'All steel connections must show bolt size, quantity, and spacing. Specify moment vs. shear connections. Reference AISC 360.',
      codeReference: 'IBC Section 2205',
      frequency: 289,
    },
    {
      category: 'Zoning',
      issue: 'Setback violations in corner lots',
      guidance: 'Corner lots have two street-facing setbacks. Verify both front and street side setbacks meet zone requirements per SMC 23.44.',
      codeReference: 'SMC 23.44.014',
      frequency: 267,
    },
    {
      category: 'Energy',
      issue: 'Incomplete energy compliance forms',
      guidance: 'Ensure all mandatory fields in Seattle Energy Code Worksheet are completed. Window U-values and SHGC must match manufacturer specs.',
      codeReference: 'WSEC C101.5',
      frequency: 234,
    },
    {
      category: 'Stormwater',
      issue: 'Missing stormwater management plan',
      guidance: 'Projects creating >2,000 sq ft of impervious surface require stormwater review. Include detention calculations and outfall locations.',
      codeReference: 'SMC 22.800',
      frequency: 198,
    },
  ];

  const reviewerStats = {
    avgReviewTime: 3.2,
    accuracyRate: 94,
    correctionsReduced: 23,
    applicantSatisfaction: 4.6,
  };

  const filteredIssues = commonIssues.filter(issue =>
    (selectedCategory === 'all' || issue.category === selectedCategory) &&
    (searchQuery === '' ||
     issue.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
     issue.guidance.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getLevelColor = (level: TrainingModule['level']) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-blue-100 text-blue-700';
      case 'advanced':
        return 'bg-purple-100 text-purple-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Reviewer Training Companion</h1>
        <p className="text-slate-600">
          AI-powered training and guidance to improve review efficiency and consistency
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-10 h-10 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{reviewerStats.avgReviewTime}h</p>
          <p className="text-sm text-slate-600">Avg. Review Time</p>
          <p className="text-xs text-green-600 mt-2">-0.8h with AI assistance</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-10 h-10 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{reviewerStats.accuracyRate}%</p>
          <p className="text-sm text-slate-600">Accuracy Rate</p>
          <p className="text-xs text-green-600 mt-2">+7% improvement</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-10 h-10 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{reviewerStats.correctionsReduced}%</p>
          <p className="text-sm text-slate-600">Corrections Reduced</p>
          <p className="text-xs text-green-600 mt-2">Fewer revision cycles</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-10 h-10 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{reviewerStats.applicantSatisfaction}</p>
          <p className="text-sm text-slate-600">Applicant Rating</p>
          <p className="text-xs text-green-600 mt-2">Out of 5.0</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <GraduationCap className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">Training Modules</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {trainingModules.map((module) => (
            <div
              key={module.id}
              className="border border-slate-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-slate-900">{module.title}</h3>
                    {module.completed && (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{module.description}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 mb-3">
                <span className={`px-2 py-1 text-xs font-medium rounded capitalize ${getLevelColor(module.level)}`}>
                  {module.level}
                </span>
                <span className="text-xs text-slate-600">{module.duration}</span>
              </div>

              <div className="mb-4">
                <p className="text-xs font-medium text-slate-700 mb-2">Topics covered:</p>
                <div className="flex flex-wrap gap-1">
                  {module.topics.map((topic, idx) => (
                    <span key={idx} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <button className={`w-full py-2 rounded-lg font-medium text-sm transition ${
                module.completed
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}>
                {module.completed ? 'Review Module' : 'Start Training'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <BookOpen className="w-6 h-6 text-slate-700" />
          <h2 className="text-xl font-semibold text-slate-900">Common Issues & Guidance</h2>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search issues, guidance, or code references..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="Fire Safety">Fire Safety</option>
            <option value="Structural">Structural</option>
            <option value="Zoning">Zoning</option>
            <option value="Energy">Energy</option>
            <option value="Stormwater">Stormwater</option>
          </select>
        </div>

        <div className="space-y-4">
          {filteredIssues.map((issue, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-5 hover:border-blue-300 transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded">
                      {issue.category}
                    </span>
                    <span className="text-xs text-slate-500">
                      {issue.frequency} occurrences in dataset
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{issue.issue}</h3>
                </div>
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                <p className="text-sm font-medium text-blue-900 mb-1">Review Guidance:</p>
                <p className="text-sm text-blue-800">{issue.guidance}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1 rounded">
                  {issue.codeReference}
                </span>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View Examples →
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredIssues.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No issues found matching your search</p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-8 text-white">
        <div className="flex items-start space-x-6">
          <GraduationCap className="w-16 h-16 flex-shrink-0 opacity-90" />
          <div>
            <h2 className="text-2xl font-bold mb-3">AI-Assisted Review Training</h2>
            <p className="text-green-100 mb-6">
              This training companion uses machine learning analysis of 26,000+ historical permit reviews to identify patterns, common mistakes, and best practices. New reviewers can get up to speed faster, while experienced reviewers can standardize their approach and reduce correction cycles.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <p className="text-2xl font-bold mb-1">50%</p>
                <p className="text-sm text-green-100">Faster onboarding time</p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <p className="text-2xl font-bold mb-1">30%</p>
                <p className="text-sm text-green-100">Fewer review errors</p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <p className="text-2xl font-bold mb-1">85%</p>
                <p className="text-sm text-green-100">Reviewer satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
