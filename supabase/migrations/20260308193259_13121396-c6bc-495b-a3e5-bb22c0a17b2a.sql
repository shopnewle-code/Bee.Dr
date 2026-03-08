
-- Wearable data table for heart rate, sleep, steps, calories etc.
CREATE TABLE public.wearable_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL, -- 'heart_rate', 'steps', 'sleep_hours', 'calories', 'spo2', 'blood_pressure'
  value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT '',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'manual', -- 'manual', 'apple_watch', 'fitbit', 'google_fit', 'samsung_health'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wearable_data ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own wearable data" ON public.wearable_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wearable data" ON public.wearable_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wearable data" ON public.wearable_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wearable data" ON public.wearable_data FOR DELETE USING (auth.uid() = user_id);

-- Index for fast queries
CREATE INDEX idx_wearable_data_user_metric ON public.wearable_data (user_id, metric_type, recorded_at DESC);
