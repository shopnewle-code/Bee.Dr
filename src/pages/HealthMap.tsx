import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, MapPin, Star, Clock, Navigation, Phone,
  Search, Hospital, Pill, FlaskConical, Stethoscope, Filter
} from 'lucide-react';

type PlaceType = 'all' | 'pharmacy' | 'hospital' | 'clinic' | 'lab';
type Place = {
  id: string;
  name: string;
  type: PlaceType;
  rating: number;
  distance: string;
  address: string;
  hours: string;
  phone: string;
  isOpen: boolean;
};

const typeConfig: Record<Exclude<PlaceType, 'all'>, { icon: typeof Hospital; color: string; label: string }> = {
  pharmacy: { icon: Pill, color: 'text-success', label: 'Pharmacy' },
  hospital: { icon: Hospital, color: 'text-destructive', label: 'Hospital' },
  clinic: { icon: Stethoscope, color: 'text-primary', label: 'Clinic' },
  lab: { icon: FlaskConical, color: 'text-warning', label: 'Diagnostic Lab' },
};

// Simulated nearby places — in production, this would come from Google Maps API
const mockPlaces: Place[] = [
  { id: '1', name: 'Apollo Pharmacy', type: 'pharmacy', rating: 4.5, distance: '0.3 km', address: '123 MG Road, Sector 5', hours: '8 AM – 10 PM', phone: '+91 98765 43210', isOpen: true },
  { id: '2', name: 'MedPlus Pharmacy', type: 'pharmacy', rating: 4.2, distance: '0.7 km', address: '45 Park Avenue', hours: '9 AM – 9 PM', phone: '+91 98765 43211', isOpen: true },
  { id: '3', name: 'City General Hospital', type: 'hospital', rating: 4.7, distance: '1.2 km', address: '78 Hospital Road', hours: '24 Hours', phone: '+91 98765 43212', isOpen: true },
  { id: '4', name: 'LifeCare Hospital', type: 'hospital', rating: 4.4, distance: '2.5 km', address: '90 Main Street', hours: '24 Hours', phone: '+91 98765 43213', isOpen: true },
  { id: '5', name: 'Smile Clinic', type: 'clinic', rating: 4.6, distance: '0.5 km', address: '12 Green Lane', hours: '10 AM – 7 PM', phone: '+91 98765 43214', isOpen: true },
  { id: '6', name: 'Dr. Sharma Clinic', type: 'clinic', rating: 4.3, distance: '1.0 km', address: '34 Rose Garden', hours: '9 AM – 6 PM', phone: '+91 98765 43215', isOpen: false },
  { id: '7', name: 'Pathcare Diagnostics', type: 'lab', rating: 4.8, distance: '0.8 km', address: '56 Tech Park', hours: '7 AM – 8 PM', phone: '+91 98765 43216', isOpen: true },
  { id: '8', name: 'SRL Diagnostics', type: 'lab', rating: 4.5, distance: '1.5 km', address: '23 Industrial Area', hours: '6 AM – 9 PM', phone: '+91 98765 43217', isOpen: true },
  { id: '9', name: 'Netmeds Pharmacy', type: 'pharmacy', rating: 4.1, distance: '1.8 km', address: '67 Station Road', hours: '8 AM – 11 PM', phone: '+91 98765 43218', isOpen: true },
  { id: '10', name: 'Fortis Hospital', type: 'hospital', rating: 4.9, distance: '3.2 km', address: '101 Highway Road', hours: '24 Hours', phone: '+91 98765 43219', isOpen: true },
];

const HealthMap = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<PlaceType>('all');
  const [search, setSearch] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const filtered = mockPlaces
    .filter(p => filter === 'all' || p.type === filter)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase()));

  const counts = {
    all: mockPlaces.length,
    pharmacy: mockPlaces.filter(p => p.type === 'pharmacy').length,
    hospital: mockPlaces.filter(p => p.type === 'hospital').length,
    clinic: mockPlaces.filter(p => p.type === 'clinic').length,
    lab: mockPlaces.filter(p => p.type === 'lab').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <MapPin className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-foreground">Health Map</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-4">
        {/* Map Placeholder */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="h-48 bg-gradient-to-br from-primary/5 via-accent/10 to-primary/5 flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-10">
              {/* Grid pattern */}
              <div className="w-full h-full" style={{
                backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
              }} />
            </div>
            {/* Place markers */}
            {filtered.slice(0, 6).map((p, i) => {
              const config = typeConfig[p.type as Exclude<PlaceType, 'all'>];
              if (!config) return null;
              const Icon = config.icon;
              const positions = [
                { top: '25%', left: '30%' }, { top: '40%', left: '60%' }, { top: '60%', left: '25%' },
                { top: '35%', left: '75%' }, { top: '70%', left: '50%' }, { top: '20%', left: '50%' },
              ];
              return (
                <motion.button key={p.id}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedPlace(p)}
                  style={positions[i]}
                  className={`absolute w-8 h-8 rounded-full bg-card border-2 border-border shadow-md flex items-center justify-center hover:scale-110 transition-transform ${
                    selectedPlace?.id === p.id ? 'ring-2 ring-primary' : ''
                  }`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </motion.button>
              );
            })}
            <div className="absolute bottom-2 right-2 bg-card/80 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] text-muted-foreground">
              📍 Showing nearby locations
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search pharmacies, hospitals, clinics..." className="pl-10" />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {([
            { key: 'all' as PlaceType, label: 'All', icon: Filter },
            { key: 'pharmacy' as PlaceType, label: 'Pharmacy', icon: Pill },
            { key: 'hospital' as PlaceType, label: 'Hospital', icon: Hospital },
            { key: 'clinic' as PlaceType, label: 'Clinic', icon: Stethoscope },
            { key: 'lab' as PlaceType, label: 'Labs', icon: FlaskConical },
          ]).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filter === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:border-primary/30'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {label} ({counts[key]})
            </button>
          ))}
        </div>

        {/* Selected Place Detail */}
        {selectedPlace && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border-2 border-primary/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              {(() => {
                const config = typeConfig[selectedPlace.type as Exclude<PlaceType, 'all'>];
                const Icon = config?.icon || MapPin;
                return (
                  <div className={`w-11 h-11 rounded-xl bg-accent flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${config?.color || 'text-primary'}`} />
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-foreground text-sm">{selectedPlace.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedPlace.address}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs text-warning">
                    <Star className="w-3 h-3 fill-warning" /> {selectedPlace.rating}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Navigation className="w-3 h-3" /> {selectedPlace.distance}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    selectedPlace.isOpen ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  }`}>{selectedPlace.isOpen ? 'Open' : 'Closed'}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="flex-1 text-xs">
                <Navigation className="w-3.5 h-3.5 mr-1" /> Directions
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs">
                <Phone className="w-3.5 h-3.5 mr-1" /> Call
              </Button>
            </div>
          </motion.div>
        )}

        {/* Place List */}
        <div className="space-y-2">
          {filtered.map((place, i) => {
            const config = typeConfig[place.type as Exclude<PlaceType, 'all'>];
            const Icon = config?.icon || MapPin;
            return (
              <motion.div key={place.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedPlace(place)}
                className={`bg-card border rounded-xl p-3.5 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all ${
                  selectedPlace?.id === place.id ? 'border-primary/40' : 'border-border'
                }`}>
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <Icon className={`w-5 h-5 ${config?.color || 'text-primary'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{place.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{place.address}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-0.5 text-[10px] text-warning">
                      <Star className="w-2.5 h-2.5 fill-warning" /> {place.rating}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {place.hours}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-medium text-foreground">{place.distance}</span>
                  <span className={`block text-[10px] mt-0.5 ${place.isOpen ? 'text-success' : 'text-destructive'}`}>
                    {place.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-30" />
            <p className="text-sm text-muted-foreground">No places found</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default HealthMap;
