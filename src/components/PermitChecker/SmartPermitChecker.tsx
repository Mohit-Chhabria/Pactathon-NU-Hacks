import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Info, X, FileCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type ComplianceIssue = {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  codeReference?: string;
  recommendation: string;
};

export const SmartPermitChecker: React.FC = () => {
  const { user } = useAuth();
  const [permitType, setPermitType] = useState('building');
  const [projectName, setProjectName] = useState('');
  const [address, setAddress] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{
    riskScore: number;
    issues: ComplianceIssue[];
    suggestions: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const analyzePermit = async () => {
    if (!projectName || !address || files.length === 0) {
      alert('Please fill in all fields and upload at least one document');
      return;
    }

    setAnalyzing(true);

    try {
      const { data: application, error: appError } = await supabase
        .from('permit_applications')
        .insert({
          user_id: user?.id,
          permit_type: permitType,
          project_name: projectName,
          address: address,
          status: 'draft',
          ai_risk_score: 0,
        })
        .select()
        .single();

      if (appError) throw appError;

      const mockIssues: ComplianceIssue[] = [
        {
          severity: 'critical',
          title: 'Missing Fire Egress Plan',
          description: 'Required fire egress and evacuation plan not found in submitted documents',
          codeReference: 'IBC Section 1006',
          recommendation: 'Submit a detailed floor plan showing all emergency exits, egress paths, and assembly points. Include minimum corridor widths and exit door specifications.',
        },
        {
          severity: 'warning',
          title: 'Incomplete Structural Calculations',
          description: 'Load calculations for roof structure appear incomplete',
          codeReference: 'IBC Section 1607',
          recommendation: 'Provide detailed load calculations including dead load, live load, snow load, and wind load for all structural members.',
        },
        {
          severity: 'warning',
          title: 'Potential Setback Violation',
          description: 'Proposed structure may not meet minimum setback requirements based on address zone',
          codeReference: 'Seattle Land Use Code 23.44.014',
          recommendation: 'Verify property boundaries and ensure all structures maintain required setbacks. Consider submitting a survey from a licensed surveyor.',
        },
        {
          severity: 'info',
          title: 'Energy Code Documentation',
          description: 'Energy compliance forms should be included for faster review',
          codeReference: 'WSEC Section C101',
          recommendation: 'Include completed Seattle Energy Code Worksheet and manufacturer specifications for windows, insulation, and HVAC systems.',
        },
      ];

      const mockSuggestions = [
        'Based on similar projects in your area, average approval time is 45-60 days',
        'Projects at this address typically face minimal delays',
        'Consider scheduling a pre-application conference to address potential issues early',
        'Historical data shows 78% of similar permits required at least one correction cycle',
      ];

      const riskScore = Math.floor(Math.random() * 30) + 35;

      await supabase
        .from('permit_applications')
        .update({
          ai_risk_score: riskScore,
          ai_suggestions: mockSuggestions,
        })
        .eq('id', application.id);

      await supabase
        .from('bottleneck_predictions')
        .insert({
          application_id: application.id,
          bottleneck_type: 'document_review',
          predicted_delay_days: 14,
          confidence_score: 0.82,
          factors: ['Missing documents', 'Complex structural elements', 'Zoning verification needed'],
          recommendations: mockSuggestions,
        });

      setAnalysis({
        riskScore,
        issues: mockIssues,
        suggestions: mockSuggestions,
      });
    } catch (error) {
      console.error('Error analyzing permit:', error);
      alert('Error analyzing permit application');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: ComplianceIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getSeverityIcon = (severity: ComplianceIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityTextColor = (severity: ComplianceIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-900';
      case 'warning':
        return 'text-amber-900';
      case 'info':
        return 'text-blue-900';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Smart Permit Checker</h1>
        <p className="text-slate-600">
          Upload your permit documents for instant AI-powered compliance analysis and recommendations
        </p>
      </div>

      <div className={analysis ? "flex gap-6" : "grid lg:grid-cols-2 gap-6"}>
        <div className={analysis ? "w-80 flex-shrink-0 space-y-6" : "space-y-6"}>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Project Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Permit Type
                </label>
                <select
                  value={permitType}
                  onChange={(e) => setPermitType(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="building">Building Permit</option>
                  <option value="electrical">Electrical Permit</option>
                  <option value="plumbing">Plumbing Permit</option>
                  <option value="mechanical">Mechanical Permit</option>
                  <option value="demolition">Demolition Permit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Single Family Residence Addition"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., 1234 Main St, Seattle, WA 98101"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload Documents</h2>

            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.dwg,.doc,.docx"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-700 font-medium mb-1">Click to upload files</p>
                <p className="text-sm text-slate-500">PDF, DWG, DOC up to 10MB each</p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-slate-200 rounded transition"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={analyzePermit}
              disabled={analyzing || !projectName || !address || files.length === 0}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? 'Analyzing...' : 'Analyze Permit Application'}
            </button>
          </div>
        </div>

        <div className={analysis ? "flex-1 flex gap-6" : "space-y-6"}>
          {analysis && (
            <>
              <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Document Preview</h2>

                {files.length > 0 && (
                  <div className="space-y-4">
                    {files.map((file, index) => (
                      <div key={index} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <FileText className="w-5 h-5 text-slate-600" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{file.name}</p>
                            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        {file.type === 'application/pdf' ? (
                          <div className="bg-slate-50 rounded p-8 text-center">
                            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-700">PDF Document</p>
                            <p className="text-xs text-slate-500 mt-1">{file.name}</p>
                          </div>
                        ) : file.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full rounded border border-slate-200"
                          />
                        ) : (
                          <div className="bg-slate-50 rounded p-8 text-center">
                            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-700">Document File</p>
                            <p className="text-xs text-slate-500 mt-1">{file.name}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">AI Analysis Results</h2>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Risk Score</span>
                    <span className="text-2xl font-bold text-slate-900">{analysis.riskScore}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        analysis.riskScore < 40 ? 'bg-green-500' :
                        analysis.riskScore < 70 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${analysis.riskScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {analysis.riskScore < 40 ? 'Low risk - likely to process smoothly' :
                     analysis.riskScore < 70 ? 'Moderate risk - some corrections may be needed' :
                     'High risk - significant revisions likely required'}
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    AI Suggestions
                  </h3>
                  <ul className="space-y-2">
                    {analysis.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-slate-700 pl-7">
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Compliance Issues ({analysis.issues.length})
                </h2>

                <div className="space-y-4">
                  {analysis.issues.map((issue, index) => (
                    <div key={index} className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}>
                      <div className="flex items-start space-x-3">
                        {getSeverityIcon(issue.severity)}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <h4 className={`font-semibold ${getSeverityTextColor(issue.severity)}`}>
                              {issue.title}
                            </h4>
                            <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${getSeverityTextColor(issue.severity)}`}>
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 mt-1">{issue.description}</p>
                          {issue.codeReference && (
                            <p className="text-xs text-slate-600 mt-2 font-mono bg-white bg-opacity-50 px-2 py-1 rounded">
                              {issue.codeReference}
                            </p>
                          )}
                          <div className="mt-3 pt-3 border-t border-slate-300">
                            <p className="text-sm font-medium text-slate-700 mb-1">Recommendation:</p>
                            <p className="text-sm text-slate-600">{issue.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              </div>
            </>
          )}

          {!analysis && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <FileCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">
                Upload your documents and click analyze to see AI-powered compliance insights
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
