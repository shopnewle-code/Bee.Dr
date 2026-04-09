-- Database Migration: Create security_questions table
-- Purpose: Store user-selected security questions and hashed answers for account recovery
-- Security: Answers are hashed with bcrypt, not stored in plain text

-- Create security_questions table
CREATE TABLE IF NOT EXISTS public.security_questions (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Foreign key to auth.users
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Question ID from predefined list
  question_id VARCHAR(3) NOT NULL,

  -- Question text (denormalized for display)
  question_text TEXT NOT NULL,

  -- Hashed answer (bcrypt hash - never store plain text)
  answer_hash VARCHAR(255) NOT NULL,

  -- When was this question/answer set
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Metadata
  attempt_count INTEGER DEFAULT 0,  -- Track failed verification attempts
  last_attempt_at TIMESTAMP WITH TIME ZONE  -- For rate limiting
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_security_questions_user_id 
  ON public.security_questions(user_id);

CREATE INDEX IF NOT EXISTS idx_security_questions_user_question 
  ON public.security_questions(user_id, question_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.security_questions ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view their own questions
CREATE POLICY "Users can view their own security questions"
  ON public.security_questions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own security questions
CREATE POLICY "Users can create their own security questions"
  ON public.security_questions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own security questions
CREATE POLICY "Users can update their own security questions"
  ON public.security_questions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all
CREATE POLICY "Service role can manage security questions"
  ON public.security_questions
  USING (auth.role() = 'service_role');

-- Create security_question_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS public.security_question_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  success BOOLEAN DEFAULT FALSE,
  failure_reason VARCHAR(100)  -- 'invalid_answer', 'timeout', etc.
);

CREATE INDEX IF NOT EXISTS idx_security_question_attempts_user_at
  ON public.security_question_attempts(user_id, attempted_at);

-- Function to check if user can attempt verification
CREATE OR REPLACE FUNCTION check_security_question_rate_limit(
  p_user_id UUID,
  p_max_attempts INTEGER DEFAULT 5,
  p_time_window INTERVAL DEFAULT '1 hour'
)
RETURNS TABLE (
  can_attempt BOOLEAN,
  attempts_remaining INTEGER,
  reset_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_failed_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  v_window_start := NOW() - p_time_window;
  
  SELECT COUNT(*)
  INTO v_failed_count
  FROM public.security_question_attempts
  WHERE user_id = p_user_id
  AND attempted_at >= v_window_start
  AND success = FALSE;
  
  RETURN QUERY SELECT
    (v_failed_count < p_max_attempts) AS can_attempt,
    GREATEST(0, p_max_attempts - v_failed_count) AS attempts_remaining,
    (SELECT MAX(attempted_at) + p_time_window 
     FROM public.security_question_attempts 
     WHERE user_id = p_user_id 
     AND attempted_at >= v_window_start 
     AND success = FALSE) AS reset_at;
END;
$$ LANGUAGE plpgsql;

-- Function to log security question verification attempt
CREATE OR REPLACE FUNCTION log_security_question_attempt(
  p_user_id UUID,
  p_success BOOLEAN,
  p_failure_reason VARCHAR DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.security_question_attempts (
    user_id,
    success,
    failure_reason,
    ip_address
  ) VALUES (
    p_user_id,
    p_success,
    p_failure_reason,
    p_ip_address
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get user's security questions for recovery
CREATE OR REPLACE FUNCTION get_user_security_questions(p_user_id UUID)
RETURNS TABLE (
  question_id VARCHAR,
  question_text TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT sq.question_id, sq.question_text
  FROM public.security_questions sq
  WHERE sq.user_id = p_user_id
  ORDER BY sq.created_at ASC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE public.security_questions IS 'User security questions and hashed answers for account recovery';
COMMENT ON TABLE public.security_question_attempts IS 'Log of security question verification attempts for rate limiting and security audit';
COMMENT ON COLUMN public.security_questions.answer_hash IS 'bcrypt hash of the answer - never store plain text';
COMMENT ON FUNCTION check_security_question_rate_limit IS 'Check if user can attempt security question verification (rate limit)';
COMMENT ON FUNCTION log_security_question_attempt IS 'Log a security question verification attempt';
COMMENT ON FUNCTION get_user_security_questions IS 'Get user''s security questions for recovery flow';
