import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  ArrowLeft, Users, Plus, Heart, AlertTriangle, Shield, Loader2,
  Trash2, Edit2
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  health_score: number;
  risk_summary: any;
}

const demoMembers: FamilyMember[] = [
  { id: 'demo-1', name: 'Aman (You)', relation: 'Self', age: 28, gender: 'Male', blood_group: 'B+', health_score: 78, risk_summary: { diabetes: 'low', heart: 'low', vitamin: 'medium' } },
  { id: 'demo-2', name: 'Priya', relation: 'Spouse', age: 26, gender: 'Female', blood_group: 'A+', health_score: 85, risk_summary: { diabetes: 'low', heart: 'low', vitamin: 'low' } },
  { id: 'demo-3', name: 'Raj Kumar', relation: 'Father', age: 58, gender: 'Male', blood_group: 'B+', health_score: 62, risk_summary: { diabetes: 'high', heart: 'medium', vitamin: 'medium' } },
  { id: 'demo-4', name: 'Sunita', relation: 'Mother', age: 54, gender: 'Female', blood_group: 'O+', health_score: 70, risk_summary: { diabetes: 'medium', heart: 'low', vitamin: 'high' } },
];

const riskColors: Record<string, string> = {
  low: 'bg-success/10 text-success',
  medium: 'bg-warning/10 text-warning',
  high: 'bg-destructive/10 text-destructive',
};

const FamilyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [useDemo, setUseDemo] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', relation: '', age: '', gender: '', blood_group: '' });

  useEffect(() => {
    if (!user) return;
    supabase.from('family_members').select('*').eq('owner_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMembers(data as FamilyMember[]);
        } else {
          setMembers(demoMembers);
          setUseDemo(true);
        }
        setLoading(false);
      });
  }, [user]);

  const addMember = async () => {
    if (!form.name || !form.relation) {
      toast.error('Name and relation are required');
      return;
    }
    if (useDemo) {
      const newMember: FamilyMember = {
        id: `new-${Date.now()}`,
        name: form.name, relation: form.relation,
        age: form.age ? parseInt(form.age) : null,
        gender: form.gender || null,
        blood_group: form.blood_group || null,
        health_score: 0,
        risk_summary: null,
      };
      setMembers(prev => [...prev, newMember]);
      setDialogOpen(false);
      setForm({ name: '', relation: '', age: '', gender: '', blood_group: '' });
      toast.success('Family member added');
      return;
    }

    const { data, error } = await supabase.from('family_members').insert({
      owner_id: user!.id,
      name: form.name,
      relation: form.relation,
      age: form.age ? parseInt(form.age) : null,
      gender: form.gender || null,
      blood_group: form.blood_group || null,
    }).select().single();

    if (error) {
      toast.error(error.message);
    } else {
      setMembers(prev => [...prev, data as FamilyMember]);
      setDialogOpen(false);
      setForm({ name: '', relation: '', age: '', gender: '', blood_group: '' });
      toast.success('Family member added');
    }
  };

  const deleteMember = async (id: string) => {
    if (useDemo || id.startsWith('demo') || id.startsWith('new')) {
      setMembers(prev => prev.filter(m => m.id !== id));
      toast.success('Removed');
      return;
    }
    const { error } = await supabase.from('family_members').delete().eq('id', id);
    if (!error) {
      setMembers(prev => prev.filter(m => m.id !== id));
      toast.success('Removed');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Users className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-foreground">Family Health</span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="ml-auto gradient-primary text-primary-foreground text-xs h-8 gap-1">
                <Plus className="w-3 h-3" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Family Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
                </div>
                <div>
                  <Label className="text-xs">Relation</Label>
                  <Select value={form.relation} onValueChange={v => setForm(f => ({ ...f, relation: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select relation" /></SelectTrigger>
                    <SelectContent>
                      {['Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Sibling', 'Other'].map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Age</Label>
                    <Input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="Age" />
                  </div>
                  <div>
                    <Label className="text-xs">Blood Group</Label>
                    <Select value={form.blood_group} onValueChange={v => setForm(f => ({ ...f, blood_group: v }))}>
                      <SelectTrigger><SelectValue placeholder="Blood" /></SelectTrigger>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                          <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Gender</Label>
                  <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      {['Male', 'Female', 'Other'].map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addMember} className="w-full gradient-primary text-primary-foreground">Add Member</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {useDemo && (
          <div className="bg-accent/40 border border-border rounded-xl p-3">
            <p className="text-xs text-muted-foreground text-center">
              👨‍👩‍👧‍👦 Showing demo family — add real members and upload their reports to track health.
            </p>
          </div>
        )}

        {/* Family overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <span className="text-2xl font-bold font-display text-primary">{members.length}</span>
            <p className="text-[10px] text-muted-foreground mt-1">Family Members</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <span className="text-2xl font-bold font-display text-success">
              {members.filter(m => m.health_score >= 70).length}
            </span>
            <p className="text-[10px] text-muted-foreground mt-1">Healthy</p>
          </div>
        </div>

        {/* Member cards */}
        <div className="space-y-3">
          {members.map((member, i) => (
            <motion.div key={member.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {member.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{member.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {member.relation} {member.age ? `• ${member.age}y` : ''} {member.blood_group ? `• ${member.blood_group}` : ''}
                  </p>
                </div>
                <div className="text-center">
                  <span className={`text-lg font-bold font-display ${getScoreColor(member.health_score)}`}>
                    {member.health_score || '—'}
                  </span>
                  <p className="text-[9px] text-muted-foreground">Score</p>
                </div>
                {member.relation !== 'Self' && (
                  <button onClick={() => deleteMember(member.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Risk summary */}
              {member.risk_summary && (
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(member.risk_summary).map(([key, level]: [string, any]) => (
                    <span key={key} className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${riskColors[level] || 'bg-muted text-muted-foreground'}`}>
                      {key}: {level}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default FamilyDashboard;
