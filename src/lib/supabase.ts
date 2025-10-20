import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'applicant' | 'reviewer' | 'admin';
  organization: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type PermitApplication = {
  id: string;
  user_id: string;
  permit_type: string;
  project_name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  status: 'draft' | 'submitted' | 'under_review' | 'corrections_needed' | 'approved' | 'rejected';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimated_completion: string | null;
  ai_risk_score: number;
  ai_suggestions: any[];
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PermitDocument = {
  id: string;
  application_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number;
  ai_analysis: any;
  compliance_issues: any[];
  uploaded_at: string;
};

export type BottleneckPrediction = {
  id: string;
  application_id: string;
  bottleneck_type: string;
  predicted_delay_days: number;
  confidence_score: number;
  factors: any[];
  recommendations: any[];
  created_at: string;
};
