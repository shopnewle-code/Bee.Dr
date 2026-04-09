import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRole } from '@/contexts/RoleContext';
import { featureFlags } from '@/utils/feature-flags';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Calendar,
  Video,
  MapPin,
  ShoppingCart,
  Users,
  Watch,
  AlertTriangle,
  BellRing,
} from 'lucide-react';
import { ActionCard } from '@/components/ui/cards';
import BottomNav from '@/components/BottomNav';

const services = [
  {
    icon: Calendar,
    label: 'Book Appointment',
    description: 'Schedule appointment with doctors',
    path: '/book-appointment',
    enabled: true,
    badge: null,
  },
  {
    icon: Video,
    label: 'Telemedicine',
    description: 'Video consultation with specialists',
    path: '/telemedicine',
    enabled: featureFlags.isEnabled('telemedicine'),
    badge: featureFlags.isEnabled('telemedicine') ? null : 'Coming Soon',
  },
  {
    icon: MapPin,
    label: 'Health Map',
    description: 'Find hospitals & clinics near you',
    path: '/health-map',
    enabled: featureFlags.isEnabled('healthMap'),
    badge: featureFlags.isEnabled('healthMap') ? null : 'Coming Soon',
  },
  {
    icon: ShoppingCart,
    label: 'Medicine Store',
    description: 'Order medicines & health products',
    path: '/medicine-store',
    enabled: featureFlags.isEnabled('pharmacy'),
    badge: featureFlags.isEnabled('pharmacy') ? null : 'Coming Soon',
  },
  {
    icon: Users,
    label: 'Family Health',
    description: 'Manage health records for family',
    path: '/family',
    enabled: featureFlags.isEnabled('familyHealth'),
    badge: featureFlags.isEnabled('familyHealth') ? null : 'Coming Soon',
  },
  {
    icon: Watch,
    label: 'Wearables',
    description: 'Sync your health devices',
    path: '/wearables',
    enabled: featureFlags.isEnabled('wearables'),
    badge: featureFlags.isEnabled('wearables') ? null : 'Coming Soon',
  },
  {
    icon: AlertTriangle,
    label: 'Emergency Card',
    description: 'Create emergency medical profile',
    path: '/emergency-card',
    enabled: true,
    badge: null,
  },
  {
    icon: BellRing,
    label: 'Emergency Alerts',
    description: 'Alert contacts & hospitals',
    path: '/alerts',
    enabled: featureFlags.isEnabled('emergencyAlerts'),
    badge: null,
  },
];

const ServicesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-primary/10">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Services</h1>
            <p className="text-xs text-muted-foreground">Health & wellness services</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Available Services */}
        <div className="grid grid-cols-2 gap-3">
          {services
            .filter((s) => s.enabled)
            .map((service, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(service.path)}
                className="relative p-4 rounded-xl border border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all group"
              >
                <service.icon className="w-6 h-6 text-primary mb-2" />
                <h3 className="font-semibold text-sm text-left">{service.label}</h3>
                <p className="text-xs text-muted-foreground text-left mt-1">
                  {service.description}
                </p>
              </motion.button>
            ))}
        </div>

        {/* Coming Soon Services */}
        {services.filter((s) => !s.enabled).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <span className="text-primary">✨</span> Coming Soon
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {services
                .filter((s) => !s.enabled)
                .map((service, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative p-4 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 opacity-60 cursor-not-allowed"
                  >
                    <service.icon className="w-6 h-6 text-muted-foreground mb-2" />
                    <h3 className="font-semibold text-sm text-left">{service.label}</h3>
                    <p className="text-xs text-muted-foreground text-left mt-1">
                      {service.description}
                    </p>
                    <span className="absolute top-2 right-2 text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
                      Coming Soon
                    </span>
                  </motion.div>
                ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default ServicesPage;
