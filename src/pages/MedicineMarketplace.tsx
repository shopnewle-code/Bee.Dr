import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Search, Pill, ShoppingCart, Star, Truck,
  MapPin, Tag, ChevronRight, Plus, Minus, X, Package,
  Filter, ArrowUpDown, Check
} from 'lucide-react';
import { toast } from 'sonner';

type Medicine = {
  id: string;
  name: string;
  genericName: string;
  category: string;
  image: string;
  prices: { pharmacy: string; price: number; delivery: string; rating: number; inStock: boolean }[];
  requiresPrescription: boolean;
  discount?: number;
};

type CartItem = { medicine: Medicine; qty: number; selectedPharmacy: number };

const mockMedicines: Medicine[] = [
  {
    id: '1', name: 'Paracetamol 500mg', genericName: 'Acetaminophen', category: 'Pain Relief', image: '💊',
    prices: [
      { pharmacy: 'Apollo Pharmacy', price: 30, delivery: '30 min', rating: 4.5, inStock: true },
      { pharmacy: 'MedPlus', price: 28, delivery: '45 min', rating: 4.2, inStock: true },
      { pharmacy: 'Netmeds', price: 25, delivery: '2 hrs', rating: 4.3, inStock: true },
    ],
    requiresPrescription: false, discount: 15,
  },
  {
    id: '2', name: 'Metformin 500mg', genericName: 'Metformin HCl', category: 'Diabetes', image: '💊',
    prices: [
      { pharmacy: 'Apollo Pharmacy', price: 85, delivery: '30 min', rating: 4.5, inStock: true },
      { pharmacy: 'MedPlus', price: 82, delivery: '1 hr', rating: 4.2, inStock: true },
      { pharmacy: 'PharmEasy', price: 78, delivery: '3 hrs', rating: 4.4, inStock: false },
    ],
    requiresPrescription: true,
  },
  {
    id: '3', name: 'Amoxicillin 250mg', genericName: 'Amoxicillin Trihydrate', category: 'Antibiotic', image: '💊',
    prices: [
      { pharmacy: 'Apollo Pharmacy', price: 120, delivery: '30 min', rating: 4.5, inStock: true },
      { pharmacy: '1mg', price: 105, delivery: '2 hrs', rating: 4.6, inStock: true },
    ],
    requiresPrescription: true,
  },
  {
    id: '4', name: 'Cetirizine 10mg', genericName: 'Cetirizine HCl', category: 'Allergy', image: '💊',
    prices: [
      { pharmacy: 'MedPlus', price: 35, delivery: '45 min', rating: 4.2, inStock: true },
      { pharmacy: 'Netmeds', price: 30, delivery: '2 hrs', rating: 4.3, inStock: true },
    ],
    requiresPrescription: false, discount: 10,
  },
  {
    id: '5', name: 'Omeprazole 20mg', genericName: 'Omeprazole', category: 'Acidity', image: '💊',
    prices: [
      { pharmacy: 'Apollo Pharmacy', price: 65, delivery: '30 min', rating: 4.5, inStock: true },
      { pharmacy: 'PharmEasy', price: 58, delivery: '3 hrs', rating: 4.4, inStock: true },
    ],
    requiresPrescription: false,
  },
  {
    id: '6', name: 'Vitamin D3 60K', genericName: 'Cholecalciferol', category: 'Vitamins', image: '💊',
    prices: [
      { pharmacy: 'Apollo Pharmacy', price: 130, delivery: '30 min', rating: 4.5, inStock: true },
      { pharmacy: '1mg', price: 110, delivery: '2 hrs', rating: 4.6, inStock: true },
      { pharmacy: 'Netmeds', price: 115, delivery: '1 hr', rating: 4.3, inStock: true },
    ],
    requiresPrescription: false, discount: 20,
  },
];

const categories = ['All', 'Pain Relief', 'Diabetes', 'Antibiotic', 'Allergy', 'Acidity', 'Vitamins'];

const MedicineMarketplace = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'delivery'>('price');
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');

  const filtered = mockMedicines
    .filter(m => category === 'All' || m.category === category)
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.genericName.toLowerCase().includes(search.toLowerCase()));

  const addToCart = (medicine: Medicine, pharmacyIndex: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.medicine.id === medicine.id);
      if (existing) {
        return prev.map(c => c.medicine.id === medicine.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { medicine, qty: 1, selectedPharmacy: pharmacyIndex }];
    });
    toast.success(`${medicine.name} added to cart`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.medicine.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.medicine.prices[c.selectedPharmacy].price * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const bestPrice = (m: Medicine) => Math.min(...m.prices.filter(p => p.inStock).map(p => p.price));

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Pill className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-foreground flex-1">Medicine Store</span>
          <Button variant="outline" size="sm" onClick={() => setShowCart(true)} className="relative">
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 max-w-lg space-y-4">
        {/* Delivery Toggle */}
        <div className="flex bg-muted rounded-lg p-1">
          {(['delivery', 'pickup'] as const).map(mode => (
            <button key={mode} onClick={() => setDeliveryMode(mode)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all ${
                deliveryMode === mode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}>
              {mode === 'delivery' ? <Truck className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
              {mode === 'delivery' ? 'Home Delivery' : 'Pharmacy Pickup'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search medicines..." className="pl-10" />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                category === cat ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:border-primary/30'
              }`}>{cat}</button>
          ))}
        </div>

        {/* Medicine Grid */}
        <div className="space-y-3">
          {filtered.map((med, i) => {
            const lowest = bestPrice(med);
            return (
              <motion.div key={med.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedMedicine(med)}
                className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center text-2xl shrink-0">{med.image}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{med.name}</h3>
                        <p className="text-xs text-muted-foreground">{med.genericName}</p>
                      </div>
                      {med.discount && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">{med.discount}% OFF</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-lg font-display font-bold text-foreground">₹{lowest}</span>
                      {med.discount && (
                        <span className="text-xs text-muted-foreground line-through">₹{Math.round(lowest / (1 - med.discount / 100))}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">{med.prices.length} pharmacies</span>
                    </div>
                    {med.requiresPrescription && (
                      <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                        Rx Required
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-2" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Pill className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-30" />
            <p className="text-sm text-muted-foreground">No medicines found</p>
          </div>
        )}
      </main>

      {/* Medicine Detail Modal */}
      <AnimatePresence>
        {selectedMedicine && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="bg-card border-t border-border rounded-t-2xl w-full max-h-[85vh] overflow-y-auto">
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-foreground text-lg">{selectedMedicine.name}</h2>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedMedicine(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{selectedMedicine.genericName} • {selectedMedicine.category}</p>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Sort by:</span>
                  {(['price', 'rating', 'delivery'] as const).map(s => (
                    <button key={s} onClick={() => setSortBy(s)}
                      className={`text-xs px-2.5 py-1 rounded-full ${sortBy === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Price Comparison */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Price Comparison</h3>
                  {[...selectedMedicine.prices]
                    .sort((a, b) => sortBy === 'price' ? a.price - b.price : sortBy === 'rating' ? b.rating - a.rating : 0)
                    .map((p, i) => (
                    <div key={i} className={`border rounded-xl p-3 ${
                      i === 0 && sortBy === 'price' ? 'border-success/40 bg-success/5' : 'border-border'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-foreground text-sm">{p.pharmacy}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-0.5 text-[10px] text-warning">
                              <Star className="w-2.5 h-2.5 fill-warning" /> {p.rating}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Truck className="w-2.5 h-2.5" /> {p.delivery}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-display font-bold text-foreground">₹{p.price}</span>
                          {!p.inStock ? (
                            <span className="block text-[10px] text-destructive">Out of stock</span>
                          ) : (
                            <Button size="sm" className="mt-1 h-7 text-xs gradient-primary text-primary-foreground"
                              onClick={() => addToCart(selectedMedicine, i)}>
                              <Plus className="w-3 h-3 mr-1" /> Add
                            </Button>
                          )}
                        </div>
                      </div>
                      {i === 0 && sortBy === 'price' && p.inStock && (
                        <span className="inline-block mt-2 text-[10px] font-medium text-success">✓ Best Price</span>
                      )}
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full" onClick={() => { setSelectedMedicine(null); navigate('/medicine-scanner'); }}>
                  <Pill className="w-4 h-4 mr-2" /> View Full Medicine Info
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sheet */}
      <AnimatePresence>
        {showCart && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="bg-card border-t border-border rounded-t-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-foreground text-lg">Cart ({cartCount})</h2>
                  <Button variant="ghost" size="icon" onClick={() => setShowCart(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-30" />
                    <p className="text-sm text-muted-foreground">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {cart.map(item => (
                        <div key={item.medicine.id} className="bg-muted rounded-xl p-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-lg">{item.medicine.image}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{item.medicine.name}</p>
                            <p className="text-xs text-muted-foreground">{item.medicine.prices[item.selectedPharmacy].pharmacy}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQty(item.medicine.id, -1)} className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                            <button onClick={() => updateQty(item.medicine.id, 1)} className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-display font-bold text-foreground text-sm">₹{item.medicine.prices[item.selectedPharmacy].price * item.qty}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium text-foreground">₹{cartTotal}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery</span>
                        <span className="font-medium text-success">FREE</span>
                      </div>
                      <div className="flex justify-between text-base font-bold border-t border-border pt-2">
                        <span className="text-foreground">Total</span>
                        <span className="text-foreground">₹{cartTotal}</span>
                      </div>
                    </div>
                    <Button className="w-full gradient-primary text-primary-foreground" onClick={() => { toast.success('Order placed successfully! 🎉'); setCart([]); setShowCart(false); }}>
                      <Package className="w-4 h-4 mr-2" /> Place Order • ₹{cartTotal}
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cart Bar */}
      {cartCount > 0 && !showCart && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-30">
          <Button className="w-full gradient-primary text-primary-foreground" onClick={() => setShowCart(true)}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            View Cart ({cartCount} items) • ₹{cartTotal}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default MedicineMarketplace;
