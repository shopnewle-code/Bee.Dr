# 🔥 Bee.Dr Refactor - Quick Reference Guide

Fast lookup for common patterns and code snippets.

---

## 🚀 Show/Hide Based on Role

### Admin Only
```tsx
import { useRole } from '@/contexts/RoleContext';

function AdminFeature() {
  const { isAdmin } = useRole();
  
  return isAdmin ? <AdminContent /> : null;
}
```

### Specific Role
```tsx
const { userRole } = useRole();

if (userRole === 'doctor') {
  return <DoctorDashboard />;
}

if (userRole === 'hospital_admin') {
  return <HospitalDashboard />;
}
```

### Check Permission
```tsx
const { hasPermission } = useRole();

if (hasPermission('canAccessPharmacy')) {
  return <PharmacyPanel />;
}
```

---

## 🚩 Feature Flags

### Check if Enabled
```tsx
import { featureFlags } from '@/utils/feature-flags';

{featureFlags.isEnabled('pharmacy') && (
  <PharmacySection />
)}
```

### Toggle for Testing
```tsx
import { featureFlags } from '@/utils/feature-flags';

// In browser console:
// featureFlags.toggle('pharmacy');
// location.reload();
```

### Development Override
```typescript
// src/utils/feature-flags.ts
const DEV_OVERRIDES = {
  pharmacy: true,        // Always enabled in dev
  wearables: true,
};
```

---

## 🎨 Component Snippets

### Health Card (Status)
```tsx
import { HealthCard } from '@/components/ui/cards';
import { Heart } from 'lucide-react';

<HealthCard
  title="Health Score"
  value="78%"
  description="Based on recent reports"
  icon={Heart}
  type="warning"
/>
```

### Action Card (Large Button)
```tsx
import { ActionCard } from '@/components/ui/cards';
import { Upload } from 'lucide-react';

<ActionCard
  icon={Upload}
  label="Upload Report"
  description="PDF or Photo"
  onClick={() => navigate('/upload')}
  gradient="from-blue-600 to-blue-700"
/>
```

### Insight Card (Analysis)
```tsx
import { InsightCard } from '@/components/ui/cards';
import { AlertTriangle } from 'lucide-react';

<InsightCard
  title="Vitamin D Low"
  description="Increase sun exposure"
  icon={AlertTriangle}
  severity="warning"
  actionLabel="Learn More"
  onAction={() => { /* handle */ }}
/>
```

### Report Card (List Item)
```tsx
import { ReportCard } from '@/components/ui/cards';

<ReportCard
  title="Blood Work"
  date="March 20, 2026"
  type="Laboratory Test"
  status="approved"
  onClick={() => navigate('/results/123')}
/>
```

### Admin Card (Tool Button)
```tsx
import { AdminCard } from '@/components/ui/cards';
import { Activity } from 'lucide-react';

<AdminCard
  icon={Activity}
  label="Doctor Dashboard"
  description="Manage patients"
  onClick={() => navigate('/doctor-dashboard')}
/>
```

---

## 📦 Loading & Empty States

### Show Skeleton While Loading
```tsx
import { CardGridSkeleton } from '@/components/ui/loading-states';
import { EmptyReportsState } from '@/components/ui/loading-states';

{loading ? (
  <CardGridSkeleton count={3} />
) : recentReports.length === 0 ? (
  <EmptyReportsState />
) : (
  <ReportsList />
)}
```

### Individual Skeletons
```tsx
import { 
  CardSkeleton, 
  HealthScoreSkeleton 
} from '@/components/ui/loading-states';

<CardSkeleton />              {/* Single card */}
<HealthScoreSkeleton />       {/* Circular score */}
<CardGridSkeleton count={5}/> {/* Multiple cards */}
```

### Empty States
```tsx
import { 
  EmptyReportsState, 
  EmptyServicesState 
} from '@/components/ui/loading-states';

<EmptyReportsState />     {/* No medical reports */}
<EmptyServicesState />    {/* No services available */}
```

---

## 🧭 Navigation Patterns

### Navigate with Icon
```tsx
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const navigate = useNavigate();

<button 
  onClick={() => navigate('/dashboard')}
  className="p-2 hover:bg-primary/10 rounded-lg"
>
  <ArrowLeft className="w-5 h-5" />
</button>
```

### Navigate on Card Click
```tsx
<ActionCard
  icon={Upload}
  label="Upload"
  onClick={() => navigate('/upload')}
/>

<ReportCard
  title="Blood Work"
  onClick={() => navigate(`/results?id=${id}`)}
/>
```

### Back Button
```tsx
const handleBack = () => navigate(-1);

<Button variant="ghost" onClick={handleBack}>
  ← Back
</Button>
```

---

## 🎭 Conditional UI Patterns

### Role-Based Sections
```tsx
function Dashboard() {
  const { isAdmin, userRole } = useRole();
  
  return (
    <>
      {/* Show to everyone */}
      <HealthOverview />
      <QuickActions />
      
      {/* Admin only */}
      {isAdmin && <AdminToolsSection />}
      
      {/* Role-specific */}
      {userRole === 'doctor' && <PatientManagement />}
    </>
  );
}
```

### Feature-Gated Sections
```tsx
function Services() {
  return (
    <>
      {/* Core services */}
      <AppointmentSection />
      <EmergencySection />
      
      {/* Feature flags */}
      {featureFlags.isEnabled('telemedicine') && (
        <TelemedicineSection />
      )}
      
      {featureFlags.isEnabled('pharmacy') && (
        <PharmacySection />
      )}
    </>
  );
}
```

### Permission-Based Access
```tsx
export function FeatureGate({ children, permission }) {
  const { hasPermission } = useRole();
  
  if (!hasPermission(permission)) {
    return <AccessDenied />;
  }
  
  return children;
}

// Usage
<FeatureGate permission="canAccessPharmacy">
  <PharmacyPanel />
</FeatureGate>
```

---

## 🔔 Form & Data Patterns

### Handle Form Submission
```tsx
import { toast } from 'sonner';

const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    // Submit data
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) throw new Error('Failed');
    
    toast.success('Success!');
    navigate('/next-page');
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};
```

### Fetch Data on Mount
```tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const { user } = useAuth();

useEffect(() => {
  if (!user) return;
  
  const fetchData = async () => {
    try {
      const { data: result } = await supabase
        .from('table_name')
        .select('*')
        .eq('user_id', user.id);
      
      setData(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, [user]);
```

---

## 🎬 Animation Patterns

### Simple Fade-In
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  Content
</motion.div>
```

### Staggered List
```tsx
<motion.div
  initial="hidden"
  animate="show"
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }}
>
  {items.map((item, i) => (
    <motion.div
      key={i}
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 },
      }}
    >
      {item}
    </motion.div>
  ))}
</motion.div>
```

### Button Tap Animation
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  onClick={() => {}}
>
  Click Me
</motion.button>
```

### Progress Bar Animation
```tsx
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${progress}%` }}
  transition={{ duration: 0.8, ease: 'easeOut' }}
  className="h-2 bg-primary"
/>
```

---

## 🎯 Type Safety Patterns

### Define Component Props
```tsx
interface DashboardProps {
  title: string;
  healthScore: number;
  alerts: Alert[];
  onAction?: (action: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  title,
  healthScore,
  alerts,
  onAction,
}) => {
  // Component logic
};
```

### API Response Types
```tsx
interface HealthData {
  score: number;
  status: 'excellent' | 'good' | 'moderate' | 'poor';
  lastUpdated: string;
}

const [health, setHealth] = useState<HealthData | null>(null);
```

### React Query with Types
```tsx
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery<HealthData>({
  queryKey: ['health'],
  queryFn: async () => {
    const response = await fetch('/api/health');
    return response.json();
  },
});
```

---

## 🔗 Common Routes

| Route | Component | Protected |
|-------|-----------|-----------|
| `/dashboard` | Dashboard | ✅ |
| `/upload` | Upload | ✅ |
| `/chat` | AI Chat | ✅ |
| `/insights` | Insights | ✅ |
| `/services` | Services | ✅ |
| `/profile` | Profile | ✅ |
| `/doctor-dashboard` | Doctor | ✅ |
| `/hospital-dashboard` | Hospital | ✅ |
| `/pharmacy-dashboard` | Pharmacy | ✅ |
| `/auth` | Login | ❌ |
| `/pitch` | Landing | ❌ |

---

## 💾 Common Database Queries

### Get User Profile
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single();
```

### Get User Role
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('user_id', userId)
  .single();
```

### Get Recent Scans
```typescript
const { data: scans } = await supabase
  .from('scan_results')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);
```

### Get Health Data
```typescript
const { data: health } = await supabase
  .from('health_metrics')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

---

## 📝 Common Mistakes to Avoid

### ❌ Don't
```tsx
// Missing useAuth check
const Dashboard = () => {
  const { user } = useAuth(); // null on mount!
  return <div>{user.name}</div>; // Error!
};
```

### ✅ Do
```tsx
const Dashboard = () => {
  const { user } = useAuth();
  
  if (!user) return <Loading />;
  
  return <div>{user.name}</div>;
};
```

---

### ❌ Don't
```tsx
// Missing loading state
const { data } = useQuery(fetchData);
return <div>{data.length}</div>; // Error if undefined!
```

### ✅ Do
```tsx
const { data, isLoading } = useQuery(fetchData);

if (isLoading) return <Skeleton />;

return <div>{data?.length || 0}</div>;
```

---

### ❌ Don't
```tsx
// No error handling
await supabase.from('table').select();
// Silent failures!
```

### ✅ Do
```tsx
try {
  const { data, error } = await supabase
    .from('table')
    .select();
  
  if (error) throw error;
  return data;
} catch (error) {
  toast.error('Failed to load data');
  console.error(error);
}
```

---

## 🎓 Resources

- **REFACTOR_GUIDE.md** - Full architecture
- **DEVELOPER_GUIDE.md** - Implementation patterns
- **REFACTOR_SUMMARY.md** - What changed
- **This file** - Quick snippets

---

## 🤝 Get Help

1. Check this quick reference
2. Read relevant guide section
3. Check browser console for errors
4. Check Supabase logs
5. Ask in team chat

---

**Keep this tab open while coding!** 📌

---

Last Updated: April 9, 2026 | Version: 1.0-quick-ref
