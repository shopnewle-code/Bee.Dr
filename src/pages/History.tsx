import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Activity, ArrowLeft, FileText, Clock, TrendingUp, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ScanResult {
  id: string;
  file_name: string;
  status: string;
  created_at: string;
  report_type: string | null;
  batch_id: string | null;
}

const TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  blood_test: { label: 'Blood Tests', icon: '🩸' },
  radiology: { label: 'Radiology', icon: '📡' },
  prescription: { label: 'Prescriptions', icon: '💊' },
  general: { label: 'General Reports', icon: '📄' },
};

const FILTER_OPTIONS = ['all', 'blood_test', 'radiology', 'prescription', 'general'] as const;

const HistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    supabase
      .from('scan_results')
      .select('id, file_name, status, created_at, report_type, batch_id')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setScans(data as ScanResult[]);
      });
  }, [user]);

  const filtered = scans.filter(s => {
    if (filter !== 'all' && (s.report_type || 'general') !== filter) return false;
    if (search && !s.file_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Group by report_type
  const grouped = filtered.reduce<Record<string, ScanResult[]>>((acc, s) => {
    const type = s.report_type || 'general';
    if (!acc[type]) acc[type] = [];
    acc[type].push(s);
    return acc;
  }, {});

  const stats = {
    total: scans.length,
    complete: scans.filter(s => s.status === 'complete').length,
    processing: scans.filter(s => s.status === 'processing').length,
  };

  const toggleGroup = (type: string) => {
    setOpenGroups(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Activity className="w-6 h-6 text-primary" />
          <span className="text-lg font-display font-bold text-foreground">Medical History</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Total Scans', value: stats.total, icon: FileText },
              { label: 'Analyzed', value: stats.complete, icon: TrendingUp },
              { label: 'Pending', value: stats.processing, icon: Clock },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
                <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-display font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports..." className="pl-9" />
          </div>

          {/* Type Filter Chips */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {FILTER_OPTIONS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                  filter === f
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {f === 'all' ? 'All' : `${TYPE_CONFIG[f]?.icon || ''} ${TYPE_CONFIG[f]?.label || f}`}
              </button>
            ))}
          </div>

          {/* Grouped Results */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{search ? 'No matching reports found' : 'No medical reports yet'}</p>
            </div>
          ) : filter !== 'all' ? (
            // Flat list when a specific type is selected
            <div className="space-y-2">
              {filtered.map((scan, i) => (
                <ScanCard key={scan.id} scan={scan} index={i} navigate={navigate} />
              ))}
            </div>
          ) : (
            // Grouped collapsible sections
            <div className="space-y-4">
              {Object.entries(grouped).map(([type, items]) => {
                const config = TYPE_CONFIG[type] || TYPE_CONFIG.general;
                const isOpen = openGroups[type] !== false; // default open
                return (
                  <Collapsible key={type} open={isOpen} onOpenChange={() => toggleGroup(type)}>
                    <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-xl hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span className="font-medium text-foreground text-sm">{config.label}</span>
                        <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">{items.length}</span>
                      </div>
                      {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      {items.map((scan, i) => (
                        <ScanCard key={scan.id} scan={scan} index={i} navigate={navigate} />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

function ScanCard({ scan, index, navigate }: { scan: ScanResult; index: number; navigate: (path: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => scan.status === 'complete' ? navigate(`/results/${scan.id}`) : null}
      className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all hover:border-primary/20"
    >
      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5 text-accent-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{scan.file_name}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(scan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
        scan.status === 'complete' ? 'bg-accent text-accent-foreground' : 'bg-warning/10 text-warning'
      }`}>
        {scan.status === 'complete' ? 'Complete' : 'Processing'}
      </span>
    </motion.div>
  );
}

export default HistoryPage;
