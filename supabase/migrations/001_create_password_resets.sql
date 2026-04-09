-- Database Migration: Create password_resets table
-- Purpose: Store secure password reset tokens with expiration
-- Security: Tokens are hashed, single-use, time-limited

-- Create password_resets table
CREATE TABLE IF NOT EXISTS public.password_resets (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Foreign key to auth.users
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Token hash (never store plain token)
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  
  -- Expiration time (15 minutes by default)
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Track if token has been used (single-use)
  is_used BOOLEAN DEFAULT FALSE,
  
  -- When the reset was created
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- When the reset was actually used
  used_at TIMESTAMP WITH TIME ZONE,
  
  -- IP address for security audit (optional)
  ip_address INET,
  
  -- User agent for security audit (optional)
  user_agent TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id 
  ON public.password_resets(user_id);

CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash 
  ON public.password_resets(token_hash);

CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at 
  ON public.password_resets(expires_at);

-- Create index for finding unused tokens
CREATE INDEX IF NOT EXISTS idx_password_resets_unused 
  ON public.password_resets(user_id, is_used) 
  WHERE is_used = FALSE;

-- Set up Row Level Security (RLS)
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can create their own password reset tokens
CREATE POLICY "Users can create their own password resets"
  ON public.password_resets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Authenticated users can view their own password reset tokens
CREATE POLICY "Users can view their own password resets"
  ON public.password_resets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Authenticated users can update their own password reset tokens
CREATE POLICY "Users can update their own password resets"
  ON public.password_resets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Service role can read all (for backend validation)
CREATE POLICY "Service role can manage password resets"
  ON public.password_resets
  USING (auth.role() = 'service_role');

-- Create function to clean up expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_password_resets()
RETURNS void AS $$
BEGIN
  DELETE FROM public.password_resets
  WHERE expires_at < NOW() OR (is_used AND used_at < NOW() - INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql;

-- Optional: Create grants table for rate limiting
CREATE TABLE IF NOT EXISTS public.password_reset_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  status VARCHAR(20) -- 'success', 'failed', 'expired'
);

CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_user_ip 
  ON public.password_reset_attempts(user_id, ip_address, attempted_at);

COMMENT ON TABLE public.password_resets IS 'Secure password reset tokens with expiration and single-use enforcement';
COMMENT ON TABLE public.password_reset_attempts IS 'Track password reset attempts for rate limiting and security audit';
