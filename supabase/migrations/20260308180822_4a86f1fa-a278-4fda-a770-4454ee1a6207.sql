
-- Health Profiles table
CREATE TABLE public.health_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blood_group TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  allergies TEXT[],
  chronic_conditions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.health_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own health profile" ON public.health_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health profile" ON public.health_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health profile" ON public.health_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Test Results table (structured lab values)
CREATE TABLE public.test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES public.scan_results(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_name TEXT NOT NULL,
  result_value NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  normal_range_min NUMERIC,
  normal_range_max NUMERIC,
  status TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own test results" ON public.test_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own test results" ON public.test_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat Messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scan_id UUID REFERENCES public.scan_results(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own chat messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Health Insights table
CREATE TABLE public.health_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  risk_type TEXT NOT NULL,
  risk_score NUMERIC NOT NULL DEFAULT 0,
  details JSONB,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.health_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own health insights" ON public.health_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health insights" ON public.health_insights FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Family Members table
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  relation TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  blood_group TEXT,
  health_score INTEGER DEFAULT 0,
  risk_summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own family members" ON public.family_members FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own family members" ON public.family_members FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own family members" ON public.family_members FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own family members" ON public.family_members FOR DELETE USING (auth.uid() = owner_id);

-- Emergency Alerts table
CREATE TABLE public.emergency_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scan_id UUID REFERENCES public.scan_results(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'critical',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  test_name TEXT,
  test_value NUMERIC,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own alerts" ON public.emergency_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON public.emergency_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.emergency_alerts FOR UPDATE USING (auth.uid() = user_id);

-- Updated_at triggers
CREATE TRIGGER update_health_profiles_updated_at BEFORE UPDATE ON public.health_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON public.family_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
