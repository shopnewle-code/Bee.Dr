
-- Add lifestyle and extended fields to health_profiles
ALTER TABLE public.health_profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS smoking text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS alcohol text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS exercise_frequency text DEFAULT 'moderate',
  ADD COLUMN IF NOT EXISTS diet_type text DEFAULT 'mixed',
  ADD COLUMN IF NOT EXISTS sleep_pattern text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS family_disease_history text[] DEFAULT '{}';

-- Doctors directory table
CREATE TABLE public.doctors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  specialization text NOT NULL,
  experience_years integer DEFAULT 0,
  rating numeric DEFAULT 4.5,
  consultation_fee numeric DEFAULT 500,
  languages text[] DEFAULT '{English}',
  location text,
  bio text,
  avatar_url text,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Doctors table is public read for discovery
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view doctors" ON public.doctors FOR SELECT TO authenticated USING (true);

-- Consultations table
CREATE TABLE public.consultations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  consultation_type text NOT NULL DEFAULT 'chat',
  status text NOT NULL DEFAULT 'pending',
  appointment_time timestamp with time zone,
  notes text,
  ai_summary text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own consultations" ON public.consultations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consultations" ON public.consultations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own consultations" ON public.consultations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
