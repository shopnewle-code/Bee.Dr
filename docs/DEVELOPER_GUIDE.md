# 🚀 Bee.Dr Platform Refactor - Developer Implementation Guide

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Role-Based Access](#role-based-access)
4. [Feature Flags](#feature-flags)
5. [Component Library](#component-library)
6. [Common Tasks](#common-tasks)
7. [Testing Guide](#testing-guide)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### 1. View the Refactored Dashboard

Navigate to: `/dashboard` after login

**Features:**
- Clean, uncluttered interface
- Health score visualization
- Quick actions (Upload, AI Chat)
- Recent reports showcase
- Admin tools (only for super_admin/developers)
- Insights & Services shortcuts

### 2. View AI Health Insights

Navigate to: `/insights`

**Features:**
- Health status summary
- AI confidence scoring
- Key issues with severity
- Recommended actions
- Call-to-action buttons

### 3. View Services Catalog

Navigate to: `/services`

**Features:**
- All available services (2x2 grid)
- Coming soon services (grayed out)
- Feature flag controlled
- Responsive design

---

## 🏗️ Architecture Overview

### System Design

```
┌─────────────────────────────────────────────┐
│            App.tsx (Root)                   │
├─────────────────────────────────────────────┤
│  ├─ AuthProvider (Auth state)               │
│  ├─ RoleProvider (Role-based access)        │
│  ├─ ThemeProvider (Dark mode)               │
│  └─ QueryClientProvider (Data fetching)     │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│       AnimatedRoutes (Route definitions)    │
├─────────────────────────────────────────────┤
│ Dashboard → InsightsPage → ServicesPage    │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│     BottomNav (5-tab navigation)            │
├─────────────────────────────────────────────┤
│  Home | Reports | AI | Insights | Profile   │
└─────────────────────────────────────────────┘
```

### Data Flow

```
User Login
   ↓
AuthContext (user data)
   ↓
RoleContext (fetch role from DB)
   ↓
useRole() hook (access permissions)
   ↓
Conditional Rendering (Hide/Show features)
```

---

## 🔐 Role-Based Access

### Understanding Roles

```typescript
// Define your role in Supabase `profiles` table
interface Profile {
  user_id: string;
  role: 'user' | 'doctor' | 'hospital_admin' | 'pharmacy' | 'super_admin';
  // ... other fields
}
```

### Permission Matrix

| Feature | User | Doctor | Hospital | Pharmacy | Super Admin |
|---------|------|--------|----------|----------|------------|
| Upload Reports | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI Chat | ✅ | ✅ | ✅ | ✅ | ✅ |
| Health Insights | ✅ | ✅ | ✅ | ✅ | ✅ |
| Doctor Dashboard | ❌ | ✅ | ❌ | ❌ | ✅ |
| Hospital Admin | ❌ | ❌ | ✅ | ❌ | ✅ |
| Pharmacy Panel | ❌ | ❌ | ❌ | ✅ | ✅ |

### Using Role Context

#### Check if Admin

```tsx
import { useRole } from '@/contexts/RoleContext';

export const AdminSection = () => {
  const { isAdmin } = useRole();
  
  if (!isAdmin) return null;
  
  return <AdminToolsPanel />;
};
```

#### Check Specific Permission

```tsx
const { hasPermission } = useRole();

if (hasPermission('canAccessPharmacy')) {
  return <PharmacyDashboard />;
}
```

#### Get Current Role

```tsx
const { userRole } = useRole();

console.log(userRole); // 'user' | 'doctor' | 'super_admin' | etc.
```

#### Developer Mode Check

```tsx
const { isDeveloper } = useRole();

if (isDeveloper) {
  return <DevToolsPanel />;
}
```

### Adding New Roles

**Step 1:** Update `src/types/roles.ts`

```typescript
export type UserRole = 'user' | 'doctor' | 'hospital_admin' | 'pharmacy' | 'super_admin' | 'counselor'; // Add 'counselor'

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  // ... existing roles
  counselor: {
    role: 'counselor',
    canAccessDoctorDashboard: false,
    canAccessHospitalAdmin: false,
    canAccessPharmacy: false,
    canAccessAdminTools: true,
    canViewAnalytics: true,
    canManageUsers: false,
  },
};
```

**Step 2:** Update Supabase `profiles` table

```sql
ALTER TABLE profiles 
ADD CONSTRAINT role_check 
CHECK (role IN ('user', 'doctor', 'hospital_admin', 'pharmacy', 'super_admin', 'counselor'));
```

---

## ✨ Feature Flags

### Understanding Feature Flags

Feature flags allow you to control which features are visible **without code changes**:

```typescript
// Files: src/utils/feature-flags.ts

// Enable a feature
featureFlags.enable('pharmacy');

// Disable a feature
featureFlags.disable('pharmacy');

// Check if enabled
if (featureFlags.isEnabled('pharmacy')) {
  // Show pharmacy section
}

// Toggle
featureFlags.toggle('pharmacy');
```

### Available Flags

```typescript
'adminPanel'        // Super admin tools
'pharmacy'          // Medicine store
'hospitalAdmin'     // Hospital operations
'telemedicine'      // Video consultation
'wearables'         // Device sync
'voiceDoctor'       // Voice interaction
'predictiveHealth'  // AI predictions
'skinScanner'       // Dermatology AI
'melanoma'          // Melanoma detection
'symptomChecker'    // Symptom analysis
'treatmentPlan'     // AI care plan
'aiTriage'          // Emergency triage
'familyHealth'      // Family management
'healthMap'         // Location services
'emergencyAlerts'   // Emergency alerts
```

### Setting Flags in Development

Edit `src/utils/feature-flags.ts`:

```typescript
const DEV_OVERRIDES: Partial<Record<FeatureFlag, boolean>> = {
  // Uncomment to test features in development
  pharmacy: true,
  voiceDoctor: true,
  predictiveHealth: true,
  wearables: true,
};
```

### Using Flags in Components

```tsx
import { featureFlags } from '@/utils/feature-flags';

export const ServicesPage = () => {
  return (
    <>
      {featureFlags.isEnabled('telemedicine') && (
        <TelemedicineSection />
      )}
      
      {featureFlags.isEnabled('pharmacy') && (
        <PharmacySection />
      )}
    </>
  );
};
```

---

## 🎨 Component Library

### 1. HealthCard

Display health metrics with type indication.

```tsx
import { HealthCard } from '@/components/ui/cards';
import { Heart } from 'lucide-react';

<HealthCard
  title="Health Score"
  value="78%"
  description="Based on recent reports"
  icon={Heart}
  type="warning"  // 'normal' | 'warning' | 'critical' | 'success'
  onClick={() => navigate('/insights')}
/>
```

**Props:**
- `title: string` - Card label
- `value: string | ReactNode` - Main value display
- `description?: string` - Subtext
- `icon: LucideIcon` - Icon display
- `type?: 'normal' | 'warning' | 'critical' | 'success'`
- `onClick?: () => void` - Click handler

---

### 2. ActionCard

Large, gradient button card for primary actions.

```tsx
import { ActionCard } from '@/components/ui/cards';
import { Upload } from 'lucide-react';

<ActionCard
  icon={Upload}
  label="Upload Report"
  description="PDF or Photo"
  onClick={() => navigate('/upload')}
  gradient="from-blue-600 to-blue-700"
  disabled={false}
/>
```

**Props:**
- `icon: LucideIcon` - Icon
- `label: string` - Title
- `description?: string` - Subtitle
- `onClick: () => void` - Click handler
- `gradient?: string` - Tailwind gradient class
- `disabled?: boolean` - Disable state

---

### 3. InsightCard

Card for displaying health insights with severity.

```tsx
import { InsightCard } from '@/components/ui/cards';
import { AlertTriangle } from 'lucide-react';

<InsightCard
  title="Vitamin D Deficiency"
  description="Your Vitamin D levels are lower than recommended"
  icon={AlertTriangle}
  severity="warning"  // 'info' | 'warning' | 'alert'
  actionLabel="Learn More"
  onAction={() => { /* handle action */ }}
/>
```

**Props:**
- `title: string` - Issue title
- `description: string` - Details
- `icon: LucideIcon` - Icon
- `severity?: 'info' | 'warning' | 'alert'`
- `actionLabel?: string` - CTA text
- `onAction?: () => void` - CTA handler

---

### 4. ReportCard

Card for displaying medical reports.

```tsx
import { ReportCard } from '@/components/ui/cards';

<ReportCard
  title="Blood Work Report"
  date="March 20, 2026"
  type="Laboratory Test"
  status="approved"  // 'pending' | 'approved' | 'flagged'
  onClick={() => navigate('/results/123')}
/>
```

**Props:**
- `title: string` - Report name
- `date: string` - Report date
- `type: string` - Report type
- `status?: 'pending' | 'approved' | 'flagged'`
- `onClick?: () => void` - Click handler

---

### 5. AdminCard

Card for admin/internal tools.

```tsx
import { AdminCard } from '@/components/ui/cards';
import { Activity } from 'lucide-react';

<AdminCard
  icon={Activity}
  label="Doctor Dashboard"
  description="Manage patient records"
  onClick={() => navigate('/doctor-dashboard')}
  gradient="from-emerald-600/20 to-emerald-700/20"
/>
```

**Props:**
- `icon: LucideIcon` - Icon
- `label: string` - Title
- `description: string` - Details
- `onClick: () => void` - Click handler
- `gradient?: string` - Background gradient

---

### Loading States

```tsx
import { 
  CardSkeleton, 
  HealthScoreSkeleton, 
  CardGridSkeleton,
  EmptyReportsState,
  EmptyServicesState
} from '@/components/ui/loading-states';

// Single card skeleton
<CardSkeleton />

// Health score skeleton
<HealthScoreSkeleton />

// Multiple cards
<CardGridSkeleton count={3} />

// Empty states
<EmptyReportsState />
<EmptyServicesState />
```

---

## 📋 Common Tasks

### Task 1: Hide Feature from Non-Admins

```tsx
const { isAdmin } = useRole();

if (!isAdmin) {
  return <div>Access Denied</div>;
}

return <FeatureComponent />;
```

### Task 2: Add New Admin Tool

**Step 1:** Create page component
```tsx
// src/pages/NewAdminTool.tsx
export const NewAdminTool = () => {
  return <div>Tool content</div>;
};
```

**Step 2:** Add route
```tsx
// src/components/AnimatedRoutes.tsx
const NewAdminToolPage = lazy(() => import("@/pages/NewAdminTool"));

<Route path="/new-admin-tool" element={
  <ProtectedRoute><P><NewAdminToolPage /></P></ProtectedRoute>
} />
```

**Step 3:** Add to admin section in Dashboard
```tsx
{isAdmin && (
  <AdminCard
    icon={SettingsIcon}
    label="New Admin Tool"
    description="Manage settings"
    onClick={() => navigate('/new-admin-tool')}
  />
)}
```

### Task 3: Implement Feature Toggle

**Step 1:** Update feature flags
```tsx
// src/utils/feature-flags.ts
const BASE_FEATURES = {
  myNewFeature: false,  // Start disabled
  // ... existing
};
```

**Step 2:** Use in component
```tsx
import { featureFlags } from '@/utils/feature-flags';

{featureFlags.isEnabled('myNewFeature') && (
  <MyNewFeatureComponent />
)}
```

**Step 3:** Enable for testing
```tsx
// src/utils/feature-flags.ts
const DEV_OVERRIDES = {
  myNewFeature: true,  // Enable in dev mode
};
```

### Task 4: Add New Service

**Step 1:** Add to ServicesPage
```tsx
// src/pages/ServicesPage.tsx
const services = [
  // ... existing
  {
    icon: YourIcon,
    label: 'New Service',
    description: 'Service description',
    path: '/new-service',
    enabled: featureFlags.isEnabled('newService'),
    badge: null,
  },
];
```

**Step 2:** Create service page
```tsx
// src/pages/NewService.tsx
export default function NewServicePage() {
  return <div>Service content</div>;
}
```

**Step 3:** Add route
```tsx
const NewServicePage = lazy(() => import("@/pages/NewService"));

<Route path="/new-service" element={
  <ProtectedRoute><P><NewServicePage /></P></ProtectedRoute>
} />
```

---

## 🧪 Testing Guide

### Test Role-Based Access

```bash
# Test as regular user
1. Register/login with regular email
2. Navigate to /dashboard
3. Verify admin tools are NOT visible
4. Navigate to /doctor-dashboard
5. Should redirect or deny access

# Test as admin
1. Login with admin email (add @shopnewle.com)
2. Navigate to /dashboard
3. Verify admin tools ARE visible
4. Try accessing /doctor-dashboard
5. Should show content
```

### Test Feature Flags

```tsx
// In browser console
import { featureFlags } from '@/utils/feature-flags';

// Check status
featureFlags.getFlags();

// Toggle a feature
featureFlags.toggle('pharmacy');

// Reload page to see changes
window.location.reload();
```

### Test Empty States

```tsx
// Clear your scan_results table in Supabase
// Navigate to /dashboard
// Should see "No Reports Yet" state

// Clear your insights data
// Navigate to /insights
// Should show placeholder insights
```

### Test Responsiveness

```bash
# Test on different screen sizes
Chrome DevTools → F12 → Ctrl+Shift+M

# Test breakpoints
- Mobile: 320px - 480px
- Tablet: 768px - 1024px
- Desktop: 1024px+
```

---

## 🐛 Troubleshooting

### Issue: Admin Tools Not Showing

**Check:**
1. Is user role 'super_admin' in database?
2. Is RoleProvider wrapping the app?
3. Check browser console for errors

```tsx
// Debug
const { userRole, isAdmin, isDeveloper } = useRole();
console.log({ userRole, isAdmin, isDeveloper });
```

### Issue: Feature Flag Not Working

**Check:**
1. Is feature flag name correct?
2. Are you using `featureFlags.isEnabled()`?
3. Need to refresh page if toggled in console

```tsx
// Debug
import { featureFlags } from '@/utils/feature-flags';
console.log(featureFlags.getFlags());
```

### Issue: Loading State Not Showing

**Check:**
1. Is `loading` state set properly?
2. Are you returning correct component?

```tsx
{loading && <CardGridSkeleton count={3} />}
{!loading && <ActualContent />}
```

### Issue: Empty State Not Displaying

**Check:**
1. Is data actually empty? `data.length === 0`
2. Is component rendering?

```tsx
{recentReports.length === 0 ? (
  <EmptyReportsState />
) : (
  <ReportsList />
)}
```

### Issue: Permissions Still Showing

**Clear Cache:**
```bash
# Chrome
1. DevTools → Application → Clear Storage
2. Refresh page
3. Re-login

# Or
localStorage.clear();
location.reload();
```

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Check browser console for errors
3. Check Supabase RLS policies
4. Check role/permission configuration

---

## ✨ Summary

You now have:
- ✅ Clean dashboard architecture
- ✅ Role-based access control
- ✅ Feature flag system
- ✅ Reusable component library
- ✅ Professional UX patterns
- ✅ Production-ready code

**Next:** Integrate real data and deploy! 🚀
