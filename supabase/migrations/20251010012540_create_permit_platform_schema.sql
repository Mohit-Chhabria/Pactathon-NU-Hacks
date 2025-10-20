/*
  # Seattle AI Permit Platform - Complete Database Schema

  ## Overview
  This migration creates the complete database structure for the AI-powered 
  Permit Guidance and Acceleration Platform for Seattle's permitting system.

  ## New Tables Created

  ### 1. `profiles`
  User profiles extending Supabase auth.users
  - `id` (uuid, FK to auth.users) - User ID
  - `email` (text) - User email
  - `full_name` (text) - Full name
  - `role` (text) - User role: applicant, reviewer, admin
  - `organization` (text) - Company/organization name
  - `phone` (text) - Contact phone
  - `created_at` (timestamptz) - Account creation time
  - `updated_at` (timestamptz) - Last update time

  ### 2. `permit_applications`
  Main permit application records
  - `id` (uuid, PK) - Application ID
  - `user_id` (uuid, FK) - Applicant user ID
  - `permit_type` (text) - Type of permit
  - `project_name` (text) - Project name/description
  - `address` (text) - Project address
  - `latitude` (decimal) - Geographic latitude
  - `longitude` (decimal) - Geographic longitude
  - `status` (text) - Current status
  - `priority` (text) - Priority level
  - `estimated_completion` (date) - Predicted completion date
  - `ai_risk_score` (decimal) - AI-calculated risk score
  - `ai_suggestions` (jsonb) - AI-generated suggestions
  - `submitted_at` (timestamptz) - Submission timestamp
  - `created_at` (timestamptz) - Record creation time
  - `updated_at` (timestamptz) - Last update time

  ### 3. `permit_documents`
  Documents attached to permit applications

  ### 4. `review_history`
  Historical review data from Seattle's datasets

  ### 5. `permit_reviews`
  Active reviews for current applications

  ### 6. `ai_chat_sessions`
  Chat sessions with the AI support bot

  ### 7. `ai_chat_messages`
  Individual messages in chat sessions

  ### 8. `bottleneck_predictions`
  AI predictions for permit processing bottlenecks

  ### 9. `notification_preferences`
  User notification settings

  ### 10. `activity_logs`
  System-wide activity logging

  ## Security
  - RLS enabled on all tables
  - Policies restrict access based on user role and ownership
  - Public dashboard data available through specific views
  - Sensitive data protected by authentication requirements
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'applicant' CHECK (role IN ('applicant', 'reviewer', 'admin')),
  organization text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================
-- PERMIT APPLICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS permit_applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permit_type text NOT NULL,
  project_name text NOT NULL,
  address text NOT NULL,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'corrections_needed', 'approved', 'rejected')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  estimated_completion date,
  ai_risk_score decimal(5, 2) DEFAULT 0,
  ai_suggestions jsonb DEFAULT '[]'::jsonb,
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE permit_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON permit_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Reviewers can view all applications"
  ON permit_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('reviewer', 'admin')
    )
  );

CREATE POLICY "Users can insert own applications"
  ON permit_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON permit_applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Reviewers can update applications"
  ON permit_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('reviewer', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_permit_applications_user_id ON permit_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_permit_applications_status ON permit_applications(status);
CREATE INDEX IF NOT EXISTS idx_permit_applications_created_at ON permit_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permit_applications_lat_lon ON permit_applications(latitude, longitude);

-- ============================================
-- PERMIT DOCUMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS permit_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id uuid NOT NULL REFERENCES permit_applications(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint DEFAULT 0,
  ai_analysis jsonb DEFAULT '{}'::jsonb,
  compliance_issues jsonb DEFAULT '[]'::jsonb,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE permit_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents for own applications"
  ON permit_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM permit_applications
      WHERE permit_applications.id = permit_documents.application_id
      AND permit_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Reviewers can view all documents"
  ON permit_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('reviewer', 'admin')
    )
  );

CREATE POLICY "Users can insert documents for own applications"
  ON permit_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM permit_applications
      WHERE permit_applications.id = permit_documents.application_id
      AND permit_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents for own applications"
  ON permit_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM permit_applications
      WHERE permit_applications.id = permit_documents.application_id
      AND permit_applications.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_permit_documents_application_id ON permit_documents(application_id);

-- ============================================
-- REVIEW HISTORY (Historical Data)
-- ============================================

CREATE TABLE IF NOT EXISTS review_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  permit_type text NOT NULL,
  review_step text,
  correction_comment text,
  issue_category text,
  resolution_time_days integer,
  address text,
  review_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE review_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view review history"
  ON review_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert review history"
  ON review_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_review_history_permit_type ON review_history(permit_type);
CREATE INDEX IF NOT EXISTS idx_review_history_issue_category ON review_history(issue_category);

-- ============================================
-- PERMIT REVIEWS (Active Reviews)
-- ============================================

CREATE TABLE IF NOT EXISTS permit_reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id uuid NOT NULL REFERENCES permit_applications(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  review_step text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('pending', 'in_progress', 'completed', 'escalated')),
  comments text,
  corrections_needed jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE permit_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can view reviews for own applications"
  ON permit_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM permit_applications
      WHERE permit_applications.id = permit_reviews.application_id
      AND permit_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Reviewers can view assigned reviews"
  ON permit_reviews FOR SELECT
  TO authenticated
  USING (
    auth.uid() = reviewer_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Reviewers can insert reviews"
  ON permit_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('reviewer', 'admin')
    )
  );

CREATE POLICY "Reviewers can update own reviews"
  ON permit_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

CREATE INDEX IF NOT EXISTS idx_permit_reviews_application_id ON permit_reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_permit_reviews_reviewer_id ON permit_reviews(reviewer_id);

-- ============================================
-- AI CHAT SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  application_id uuid REFERENCES permit_applications(id) ON DELETE SET NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat sessions"
  ON ai_chat_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions"
  ON ai_chat_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON ai_chat_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id ON ai_chat_sessions(user_id);

-- ============================================
-- AI CHAT MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for own sessions"
  ON ai_chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions
      WHERE ai_chat_sessions.id = ai_chat_messages.session_id
      AND ai_chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages for own sessions"
  ON ai_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions
      WHERE ai_chat_sessions.id = ai_chat_messages.session_id
      AND ai_chat_sessions.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_id ON ai_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created_at ON ai_chat_messages(created_at);

-- ============================================
-- BOTTLENECK PREDICTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS bottleneck_predictions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id uuid NOT NULL REFERENCES permit_applications(id) ON DELETE CASCADE,
  bottleneck_type text NOT NULL,
  predicted_delay_days integer NOT NULL DEFAULT 0,
  confidence_score decimal(3, 2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  factors jsonb DEFAULT '[]'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bottleneck_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view predictions for own applications"
  ON bottleneck_predictions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM permit_applications
      WHERE permit_applications.id = bottleneck_predictions.application_id
      AND permit_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Reviewers can view all predictions"
  ON bottleneck_predictions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('reviewer', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_bottleneck_predictions_application_id ON bottleneck_predictions(application_id);

-- ============================================
-- NOTIFICATION PREFERENCES
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  notification_types jsonb DEFAULT '["status_change", "review_comments", "deadline_reminder"]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ACTIVITY LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_permit_applications_updated_at ON permit_applications;
CREATE TRIGGER update_permit_applications_updated_at
  BEFORE UPDATE ON permit_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
