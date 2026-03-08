import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  ArrowLeft, CalendarDays, Clock, User, MapPin, Star,
  CheckCircle2, Video, Building2, ChevronRight, Loader2
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '14:00', '14:30', '15:00', '15:30', '16:00',
  '16:30', '17:00', '17:30', '18:00',
];

const AIAppointmentBooking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('in_person');
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [specialtyFilter, setSpecialtyFilter] = useState('all');

  useEffect(() => {
    loadDoctors();
    if (user) loadAppointments();
  }, [user]);

  const loadDoctors = async () => {
    const { data } = await supabase.from('doctors').select('*').eq('is_available', true).order('rating', { ascending: false });
    if (data) setDoctors(data);
  };

  const loadAppointments = async () => {
    const { data } = await supabase.from('appointments').select('*, doctors(name, specialization, avatar_url)')
      .eq('user_id', user!.id).order('appointment_date', { ascending: true }).limit(10);
    if (data) setAppointments(data);
  };

  const bookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast.error('Select doctor, date, and time');
      return;
    }
    setBooking(true);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const endTime = `${String(hours).padStart(2, '0')}:${String(minutes + 30).padStart(2, '0')}`;

    const { error } = await supabase.from('appointments').insert({
      user_id: user!.id,
      doctor_id: selectedDoctor.id,
      appointment_date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: selectedTime,
      end_time: endTime,
      appointment_type: appointmentType,
      reason: reason || null,
    });

    if (error) {
      toast.error('Booking failed');
      setBooking(false);
      return;
    }
    setBooked(true);
    setBooking(false);
    toast.success('Appointment booked!');
    loadAppointments();
  };

  const specialties = [...new Set(doctors.map(d => d.specialization))];
  const filteredDoctors = specialtyFilter === 'all' ? doctors : doctors.filter(d => d.specialization === specialtyFilter);

  if (booked) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="bg-card border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="font-display font-bold text-foreground">Appointment Booked!</h1>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 max-w-lg text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-6">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
          </motion.div>
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Confirmed!</h2>
          <div className="bg-card border border-border rounded-xl p-5 text-left mb-4">
            <p className="text-sm font-semibold text-foreground">{selectedDoctor?.name}</p>
            <p className="text-xs text-muted-foreground">{selectedDoctor?.specialization}</p>
            <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" /> {selectedDate && format(selectedDate, 'PPP')}</p>
              <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {selectedTime}</p>
              <p className="flex items-center gap-2">
                {appointmentType === 'video' ? <Video className="w-4 h-4 text-primary" /> : <Building2 className="w-4 h-4 text-primary" />}
                {appointmentType === 'video' ? 'Video Consultation' : 'In-Person Visit'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setBooked(false); setStep(1); setSelectedDoctor(null); setSelectedDate(undefined); setSelectedTime(''); }}>
              Book Another
            </Button>
            <Button className="flex-1 gradient-primary text-primary-foreground" onClick={() => navigate('/dashboard')}>
              Done
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => step > 1 ? setStep(step - 1) : navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display font-bold text-foreground">Book Appointment</h1>
            <p className="text-xs text-muted-foreground">Step {step} of 3 — {step === 1 ? 'Choose Doctor' : step === 2 ? 'Select Date & Time' : 'Confirm'}</p>
          </div>
        </div>
        <div className="flex gap-1 mt-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
        {/* Step 1: Choose Doctor */}
        {step === 1 && (
          <>
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger><SelectValue placeholder="Filter by specialty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            {filteredDoctors.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No doctors available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDoctors.map(doc => (
                  <motion.button key={doc.id} layout whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedDoctor(doc); setStep(2); }}
                    className={`w-full bg-card border rounded-xl p-4 text-left transition-all ${
                      selectedDoctor?.id === doc.id ? 'border-primary shadow-glow' : 'border-border hover:border-primary/30'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-foreground text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.specialization}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Star className="w-3 h-3 text-warning" /> {doc.rating}
                          </span>
                          <span className="text-xs text-muted-foreground">{doc.experience_years}y exp</span>
                          <span className="text-xs font-medium text-primary">₹{doc.consultation_fee}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Existing appointments */}
            {appointments.length > 0 && (
              <div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-2">Your Appointments</h3>
                <div className="space-y-2">
                  {appointments.map(apt => (
                    <div key={apt.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{(apt.doctors as any)?.name}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(apt.appointment_date), 'PPP')} · {apt.start_time}</p>
                      </div>
                      <Badge className={`text-xs ${
                        apt.status === 'scheduled' ? 'bg-primary/10 text-primary' :
                        apt.status === 'completed' ? 'bg-success/10 text-success' :
                        'bg-muted text-muted-foreground'
                      }`}>{apt.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <>
            <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{selectedDoctor?.name}</p>
                <p className="text-xs text-muted-foreground">{selectedDoctor?.specialization} · ₹{selectedDoctor?.consultation_fee}</p>
              </div>
            </div>

            <div className="flex gap-2 mb-2">
              {[
                { type: 'in_person', icon: Building2, label: 'In-Person' },
                { type: 'video', icon: Video, label: 'Video Call' },
              ].map(({ type, icon: Icon, label }) => (
                <button key={type}
                  onClick={() => setAppointmentType(type)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm transition-all ${
                    appointmentType === type ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border text-muted-foreground'
                  }`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            <div className="bg-card border border-border rounded-xl p-3">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date.getDay() === 0}
                className="pointer-events-auto mx-auto" />
            </div>

            {selectedDate && (
              <div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-2">
                  Available Slots — {format(selectedDate, 'MMM d')}
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map(time => (
                    <button key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                        selectedTime === time ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground hover:border-primary/30'
                      }`}>
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedDate && selectedTime && (
              <Button className="w-full gradient-primary text-primary-foreground" onClick={() => setStep(3)}>
                Continue to Confirm
              </Button>
            )}
          </>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <>
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-display font-semibold text-foreground">Appointment Summary</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Doctor</span>
                  <span className="font-medium text-foreground">{selectedDoctor?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Specialty</span>
                  <span className="text-foreground">{selectedDoctor?.specialization}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="text-foreground">{selectedDate && format(selectedDate, 'PPP')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="text-foreground">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="text-foreground">{appointmentType === 'video' ? '📹 Video' : '🏥 In-Person'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="font-bold text-primary">₹{selectedDoctor?.consultation_fee}</span>
                </div>
              </div>
            </div>

            <Textarea placeholder="Reason for visit (optional)" value={reason}
              onChange={e => setReason(e.target.value)} rows={2} />

            <Button className="w-full gradient-primary text-primary-foreground" onClick={bookAppointment} disabled={booking}>
              {booking ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Booking...</> : 'Confirm & Book'}
            </Button>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default AIAppointmentBooking;
