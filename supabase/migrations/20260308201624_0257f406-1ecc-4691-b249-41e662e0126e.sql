
-- Doctor availability slots
CREATE TABLE public.doctor_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Appointments
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  appointment_type TEXT NOT NULL DEFAULT 'in_person',
  reason TEXT,
  symptoms TEXT[],
  triage_level TEXT,
  ai_notes TEXT,
  consultation_notes TEXT,
  prescription TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Telemedicine sessions
CREATE TABLE public.telemedicine_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waiting',
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  ai_summary TEXT,
  patient_rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Telemedicine chat messages
CREATE TABLE public.telemedicine_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.telemedicine_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'patient',
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemedicine_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemedicine_messages ENABLE ROW LEVEL SECURITY;

-- Doctor availability: anyone can view
CREATE POLICY "Anyone can view doctor availability" ON public.doctor_availability FOR SELECT USING (true);

-- Appointments policies
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = user_id);

-- Telemedicine sessions
CREATE POLICY "Users can view own sessions" ON public.telemedicine_sessions FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can insert own sessions" ON public.telemedicine_sessions FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can update own sessions" ON public.telemedicine_sessions FOR UPDATE USING (auth.uid() = patient_id);

-- Telemedicine messages
CREATE POLICY "Session participants can view messages" ON public.telemedicine_messages FOR SELECT USING (
  session_id IN (SELECT id FROM public.telemedicine_sessions WHERE patient_id = auth.uid())
);
CREATE POLICY "Session participants can send messages" ON public.telemedicine_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

-- Indexes
CREATE INDEX idx_doctor_availability_doctor ON public.doctor_availability(doctor_id);
CREATE INDEX idx_appointments_user ON public.appointments(user_id);
CREATE INDEX idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_telemedicine_sessions_patient ON public.telemedicine_sessions(patient_id);
CREATE INDEX idx_telemedicine_messages_session ON public.telemedicine_messages(session_id);

-- Enable realtime for telemedicine messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemedicine_messages;

-- Update triggers
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
