import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Star, MapPin, Globe, IndianRupee, Video, MessageCircle, Phone, Loader2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const SPECIALIZATIONS = ['All', 'General Physician', 'Cardiologist', 'Dermatologist', 'Nutritionist', 'Endocrinologist', 'Mental Health Expert', 'Orthopedic', 'Neurologist'];

const DoctorDiscovery = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('All');

  useEffect(() => {
    supabase.from('doctors').select('*').eq('is_available', true)
      .then(({ data }) => {
        setDoctors(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = doctors.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.specialization.toLowerCase().includes(search.toLowerCase());
    const matchSpec = specialty === 'All' || d.specialization === specialty;
    return matchSearch && matchSpec;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-display font-bold text-foreground">Find a Doctor</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 max-w-lg space-y-4">
        {/* Search & Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search doctors..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10" />
          </div>
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SPECIALIZATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No doctors found</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((doc, i) => (
              <motion.div key={doc.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-primary">{doc.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">{doc.name}</h3>
                    <p className="text-xs text-primary font-medium">{doc.specialization}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{doc.rating}</span>
                      <span>{doc.experience_years}y exp</span>
                      {doc.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{doc.location}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="flex items-center text-sm font-bold text-foreground"><IndianRupee className="w-3 h-3" />{doc.consultation_fee}</span>
                  </div>
                </div>

                {doc.bio && <p className="text-xs text-muted-foreground line-clamp-2">{doc.bio}</p>}

                <div className="flex items-center gap-2 flex-wrap">
                  {doc.languages?.map((lang: string) => (
                    <Badge key={lang} variant="outline" className="text-[10px] py-0 px-1.5">
                      <Globe className="w-2.5 h-2.5 mr-1" />{lang}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 text-xs h-8" onClick={() => navigate(`/book-consultation/${doc.id}`)}>
                    <Video className="w-3 h-3 mr-1" /> Video Call
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => navigate(`/book-consultation/${doc.id}?type=chat`)}>
                    <MessageCircle className="w-3 h-3 mr-1" /> Chat
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-8 px-2" onClick={() => navigate(`/book-consultation/${doc.id}?type=audio`)}>
                    <Phone className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default DoctorDiscovery;
