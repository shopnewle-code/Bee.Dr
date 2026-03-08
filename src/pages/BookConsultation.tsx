import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Star, MapPin, IndianRupee, Video, MessageCircle, Phone, Calendar, Clock, CheckCircle, Loader2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

const BookConsultation = () => {
  const { doctorId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);

  const [consultType, setConsultType] = useState(searchParams.get('type') || 'video');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!doctorId) return;
    supabase.from('doctors').select('*').eq('id', doctorId).single()
      .then(({ data }) => { setDoctor(data); setLoading(false); });
  }, [doctorId]);

  const handleBook = async () => {
    if (!user || !doctor) return;
    if (!date || !time) { toast.error('Please select date and time'); return; }

    setBooking(true);
    const appointmentTime = new Date(`${date}T${time}`).toISOString();

    const { error } = await supabase.from('consultations').insert({
      user_id: user.id,
      doctor_id: doctor.id,
      consultation_type: consultType,
      appointment_time: appointmentTime,
      notes: notes || null,
      status: 'pending',
    });

    setBooking(false);
    if (error) { toast.error(error.message); return; }
    setBooked(true);
    toast.success('Consultation booked!');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  if (!doctor) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Doctor not found</div>;

  const typeIcons = { video: Video, chat: MessageCircle, audio: Phone };

  if (booked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-card border border-border rounded-2xl p-8 text-center max-w-sm w-full space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Consultation Booked!</h2>
          <p className="text-sm text-muted-foreground">
            Your {consultType} consultation with <strong>{doctor.name}</strong> is confirmed for{' '}
            <strong>{new Date(`${date}T${time}`).toLocaleString()}</strong>.
          </p>
          <p className="text-xs text-muted-foreground">You'll receive a reminder before your appointment.</p>
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={() => navigate('/consultations')}>View Consultations</Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate('/doctors')}>Browse Doctors</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-display font-bold text-foreground">Book Consultation</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-5">
        {/* Doctor Info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary">{doctor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{doctor.name}</h3>
            <p className="text-xs text-primary font-medium">{doctor.specialization}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{doctor.rating}</span>
              {doctor.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{doctor.location}</span>}
              <span className="flex items-center gap-1 font-semibold text-foreground"><IndianRupee className="w-3 h-3" />{doctor.consultation_fee}</span>
            </div>
          </div>
        </motion.div>

        {/* Consultation Type */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-xl p-4 space-y-3">
          <Label className="text-sm font-semibold text-foreground">Consultation Type</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['video', 'chat', 'audio'] as const).map(type => {
              const Icon = typeIcons[type];
              return (
                <button key={type} onClick={() => setConsultType(type)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${consultType === type ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium capitalize">{type === 'video' ? 'Video Call' : type === 'chat' ? 'Chat' : 'Audio Call'}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Date & Time */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4 space-y-3">
          <Label className="text-sm font-semibold text-foreground">Select Date & Time</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />Time</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
        </motion.div>

        {/* Notes */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-4 space-y-3">
          <Label className="text-sm font-semibold text-foreground">Notes for Doctor (Optional)</Label>
          <Textarea placeholder="Describe your symptoms or concerns..." value={notes}
            onChange={e => setNotes(e.target.value)} rows={3} />
          <p className="text-[10px] text-muted-foreground">Your uploaded reports and AI analysis will be shared automatically.</p>
        </motion.div>

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-accent/50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Consultation Fee</span>
            <span className="font-bold text-foreground flex items-center"><IndianRupee className="w-3 h-3" />{doctor.consultation_fee}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Type</span>
            <span className="text-foreground capitalize">{consultType}</span>
          </div>
        </motion.div>

        <Button onClick={handleBook} disabled={booking} className="w-full">
          {booking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Confirm Booking — ₹{doctor.consultation_fee}
        </Button>
      </main>
      <BottomNav />
    </div>
  );
};

export default BookConsultation;
