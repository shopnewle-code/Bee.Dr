import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ArrowLeft, Building2, Package, ShoppingCart, Plus,
  Search, Edit2, Trash2, AlertTriangle, DollarSign,
  Clock, CheckCircle2, XCircle, Filter, Activity,
  Pill, Box, Settings, RefreshCw, Bell, ArrowUpRight,
  ArrowDownRight, Truck, TrendingUp, Star
} from 'lucide-react';

/* ─── types ─── */
interface Pharmacy {
  id: string; name: string; address: string | null; city: string | null;
  phone: string | null; is_active: boolean; delivery_available: boolean;
  rating: number; total_orders: number;
}

interface Product {
  id: string; pharmacy_id: string; name: string; generic_name: string | null;
  category: string; manufacturer: string | null; dosage: string | null;
  unit: string | null; price: number; mrp: number | null; stock_quantity: number;
  min_stock_alert: number | null; requires_prescription: boolean; is_available: boolean;
}

interface Order {
  id: string; order_number: string; items: any; total_amount: number;
  status: string; delivery_type: string; delivery_address: string | null;
  notes: string | null; created_at: string; customer_id: string;
}

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

const statusColor: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  confirmed: 'bg-info/10 text-info border-info/20',
  preparing: 'bg-primary/10 text-primary border-primary/20',
  ready: 'bg-success/10 text-success border-success/20',
  out_for_delivery: 'bg-secondary/10 text-secondary border-secondary/20',
  delivered: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'orders' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [orderFilter, setOrderFilter] = useState('all');

  const [showSetup, setShowSetup] = useState(false);
  const [setupName, setSetupName] = useState('');
  const [setupAddress, setSetupAddress] = useState('');
  const [setupCity, setSetupCity] = useState('');
  const [setupPhone, setSetupPhone] = useState('');

  const [showProduct, setShowProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '', generic_name: '', category: 'general', manufacturer: '',
    dosage: '', unit: 'strip', price: '', mrp: '', stock_quantity: '',
    min_stock_alert: '10', requires_prescription: false,
  });

  useEffect(() => { if (user) loadPharmacy(); }, [user]);

  const loadPharmacy = async () => {
    setLoading(true);
    const { data } = await supabase.from('pharmacies').select('*').eq('owner_id', user!.id).maybeSingle();
    if (data) {
      setPharmacy(data as Pharmacy);
      await Promise.all([loadProducts(data.id), loadOrders(data.id)]);
    } else { setShowSetup(true); }
    setLoading(false);
  };

  const loadProducts = async (pharmacyId: string) => {
    const { data } = await supabase.from('pharmacy_products').select('*').eq('pharmacy_id', pharmacyId).order('name');
    if (data) setProducts(data as Product[]);
  };

  const loadOrders = async (pharmacyId: string) => {
    const { data } = await supabase.from('pharmacy_orders').select('*').eq('pharmacy_id', pharmacyId).order('created_at', { ascending: false });
    if (data) setOrders(data as Order[]);
  };

  const createPharmacy = async () => {
    if (!setupName.trim()) { toast.error('Pharmacy name is required'); return; }
    const { data, error } = await supabase.from('pharmacies').insert({
      owner_id: user!.id, name: setupName.trim(),
      address: setupAddress.trim() || null, city: setupCity.trim() || null, phone: setupPhone.trim() || null,
    }).select().single();
    if (error) { toast.error('Failed to create pharmacy'); return; }
    setPharmacy(data as Pharmacy);
    setShowSetup(false);
    toast.success('Pharmacy registered!');
  };

  const openProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name, generic_name: product.generic_name || '', category: product.category,
        manufacturer: product.manufacturer || '', dosage: product.dosage || '', unit: product.unit || 'strip',
        price: String(product.price), mrp: product.mrp ? String(product.mrp) : '',
        stock_quantity: String(product.stock_quantity), min_stock_alert: String(product.min_stock_alert || 10),
        requires_prescription: product.requires_prescription,
      });
    } else {
      setEditingProduct(null);
      setProductForm({ name: '', generic_name: '', category: 'general', manufacturer: '', dosage: '', unit: 'strip', price: '', mrp: '', stock_quantity: '', min_stock_alert: '10', requires_prescription: false });
    }
    setShowProduct(true);
  };

  const saveProduct = async () => {
    if (!productForm.name.trim() || !productForm.price) { toast.error('Name and price are required'); return; }
    const payload = {
      pharmacy_id: pharmacy!.id, name: productForm.name.trim(), generic_name: productForm.generic_name.trim() || null,
      category: productForm.category, manufacturer: productForm.manufacturer.trim() || null,
      dosage: productForm.dosage.trim() || null, unit: productForm.unit,
      price: parseFloat(productForm.price), mrp: productForm.mrp ? parseFloat(productForm.mrp) : null,
      stock_quantity: parseInt(productForm.stock_quantity) || 0, min_stock_alert: parseInt(productForm.min_stock_alert) || 10,
      requires_prescription: productForm.requires_prescription,
    };
    if (editingProduct) {
      const { error } = await supabase.from('pharmacy_products').update(payload).eq('id', editingProduct.id);
      if (error) { toast.error('Failed to update'); return; }
      toast.success('Product updated');
    } else {
      const { error } = await supabase.from('pharmacy_products').insert(payload);
      if (error) { toast.error('Failed to add product'); return; }
      toast.success('Product added');
    }
    setShowProduct(false);
    loadProducts(pharmacy!.id);
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('pharmacy_products').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success('Product removed');
  };

  const toggleProductAvailability = async (product: Product) => {
    await supabase.from('pharmacy_products').update({ is_available: !product.is_available }).eq('id', product.id);
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_available: !p.is_available } : p));
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('pharmacy_orders').update({ status: newStatus }).eq('id', orderId);
    if (error) { toast.error('Failed to update order'); return; }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    toast.success(`Order ${newStatus}`);
  };

  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total_amount, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const lowStockProducts = products.filter(p => p.stock_quantity <= (p.min_stock_alert || 10));
  const activeProducts = products.filter(p => p.is_available).length;
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.generic_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  const filteredOrders = orders.filter(o => orderFilter === 'all' || o.status === orderFilter);
  const categories = [...new Set(products.map(p => p.category))];

  if (loading) {
    return (
      <div className="min-h-screen bg-background gradient-mesh flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading pharmacy...</p>
        </div>
      </div>
    );
  }

  // Setup screen
  if (showSetup && !pharmacy) {
    return (
      <div className="min-h-screen bg-background gradient-mesh p-4 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-glow">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">Register Your Pharmacy</h1>
          <p className="text-sm text-muted-foreground mb-6">Set up your pharmacy to start managing inventory and receiving orders</p>
          <div className="space-y-3">
            <Input placeholder="Pharmacy Name *" value={setupName} onChange={e => setSetupName(e.target.value)} className="rounded-xl bg-white/50" />
            <Input placeholder="Address" value={setupAddress} onChange={e => setSetupAddress(e.target.value)} className="rounded-xl bg-white/50" />
            <Input placeholder="City" value={setupCity} onChange={e => setSetupCity(e.target.value)} className="rounded-xl bg-white/50" />
            <Input placeholder="Phone" value={setupPhone} onChange={e => setSetupPhone(e.target.value)} className="rounded-xl bg-white/50" />
            <Button className="w-full rounded-xl gradient-primary text-white shadow-glow" onClick={createPharmacy}>
              Register Pharmacy
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      {/* Header */}
      <header className="sticky top-0 z-40">
        <div className="glass border-b border-white/20">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary to-teal-dark flex items-center justify-center">
                <Pill className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-base font-display font-bold text-foreground block leading-tight">{pharmacy?.name}</span>
                <span className="text-[10px] text-muted-foreground">{pharmacy?.city || 'Pharmacy Dashboard'}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={loadPharmacy}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl relative">
                <Bell className="w-4 h-4" />
                {pendingOrders > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive animate-pulse" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-5 max-w-4xl space-y-5">
        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 glass-subtle rounded-2xl">
          {[
            { key: 'overview' as const, label: 'Overview', icon: TrendingUp },
            { key: 'inventory' as const, label: 'Inventory', icon: Package },
            { key: 'orders' as const, label: 'Orders', icon: ShoppingCart },
            { key: 'settings' as const, label: 'Settings', icon: Settings },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === key ? 'glass-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: DollarSign, label: 'Revenue', value: `₹${totalRevenue.toLocaleString()}`, change: '+12%', up: true, color: 'from-primary to-blue-glow' },
                { icon: ShoppingCart, label: 'Pending', value: String(pendingOrders), change: pendingOrders > 0 ? 'Action needed' : 'All clear', up: pendingOrders === 0, color: 'from-amber-400 to-orange-500' },
                { icon: Package, label: 'Products', value: `${activeProducts}/${products.length}`, change: `${activeProducts} active`, up: true, color: 'from-secondary to-teal' },
                { icon: AlertTriangle, label: 'Low Stock', value: String(lowStockProducts.length), change: lowStockProducts.length > 0 ? 'Restock' : 'OK', up: lowStockProducts.length === 0, color: 'from-red-400 to-rose-600' },
              ].map(({ icon: Icon, label, value, change, up, color }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                  className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className={`text-[10px] font-medium flex items-center gap-0.5 ${up ? 'text-success' : 'text-destructive'}`}>
                      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {change}
                    </span>
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">{value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                </motion.div>
              ))}
            </div>

            {/* Low Stock Alerts */}
            {lowStockProducts.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 border-l-4 border-l-destructive">
                <h3 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" /> Low Stock Alerts
                </h3>
                <div className="space-y-2.5">
                  {lowStockProducts.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-destructive/8 flex items-center justify-center">
                          <Pill className="w-3.5 h-3.5 text-destructive" />
                        </div>
                        <span className="text-sm text-foreground">{p.name}</span>
                      </div>
                      <Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/20 rounded-full" variant="outline">
                        {p.stock_quantity} left
                      </Badge>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recent Orders */}
            <div>
              <h3 className="font-display font-semibold text-foreground text-sm mb-3">Recent Orders</h3>
              {orders.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 5).map((order, i) => (
                    <motion.div key={order.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="glass-card p-3.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">{order.order_number}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {new Date(order.created_at).toLocaleDateString()} · ₹{order.total_amount}
                        </p>
                      </div>
                      <Badge className={`text-[10px] border rounded-full ${statusColor[order.status] || 'bg-muted text-muted-foreground'}`} variant="outline">
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Rating Card */}
            <div className="glass-card p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-foreground">{pharmacy?.rating || 0} <span className="text-sm text-muted-foreground">/ 5</span></p>
                <p className="text-xs text-muted-foreground">{pharmacy?.total_orders || 0} total orders · Pharmacy rating</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── INVENTORY ─── */}
        {activeTab === 'inventory' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input placeholder="Search products..." className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[110px] rounded-xl">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="icon" className="shrink-0 rounded-xl gradient-primary text-white shadow-glow" onClick={() => openProductDialog()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Box className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No products yet. Add your first medicine!</p>
                <Button variant="outline" size="sm" className="mt-3 rounded-xl" onClick={() => openProductDialog()}>
                  <Plus className="w-3 h-3 mr-1" /> Add Product
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map((product, i) => (
                  <motion.div key={product.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`glass-card p-3.5 ${product.stock_quantity <= (product.min_stock_alert || 10) ? 'border-destructive/30' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          product.is_available ? 'bg-primary/8' : 'bg-muted'
                        }`}>
                          <Pill className={`w-4 h-4 ${product.is_available ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground text-sm truncate">{product.name}</h4>
                            {product.requires_prescription && (
                              <Badge variant="outline" className="text-[9px] shrink-0 border-primary/30 text-primary rounded-full px-1.5">Rx</Badge>
                            )}
                          </div>
                          {product.generic_name && <p className="text-[10px] text-muted-foreground truncate">{product.generic_name}</p>}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm font-bold text-foreground">₹{product.price}</span>
                            {product.mrp && product.mrp > product.price && (
                              <span className="text-[10px] text-muted-foreground line-through">₹{product.mrp}</span>
                            )}
                            <span className={`text-[10px] font-medium ${product.stock_quantity <= (product.min_stock_alert || 10) ? 'text-destructive' : 'text-muted-foreground'}`}>
                              Stock: {product.stock_quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Switch checked={product.is_available} onCheckedChange={() => toggleProductAvailability(product)} />
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => openProductDialog(product)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive" onClick={() => deleteProduct(product.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── ORDERS ─── */}
        {activeTab === 'orders' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 custom-scrollbar">
              {['all', ...ORDER_STATUSES].map(s => (
                <button key={s}
                  onClick={() => setOrderFilter(s)}
                  className={`text-xs shrink-0 px-3 py-1.5 rounded-full font-medium transition-all ${
                    orderFilter === s ? 'gradient-primary text-white shadow-glow' : 'glass-subtle text-muted-foreground hover:text-foreground'
                  }`}>
                  {s === 'all' ? 'All' : s.replace('_', ' ')}
                  {s !== 'all' && <span className="ml-1 opacity-70">({orders.filter(o => o.status === s).length})</span>}
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No {orderFilter === 'all' ? '' : orderFilter} orders</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order, i) => {
                  const items = Array.isArray(order.items) ? order.items : [];
                  const currentIdx = ORDER_STATUSES.indexOf(order.status);
                  const nextStatus = currentIdx < ORDER_STATUSES.length - 2 ? ORDER_STATUSES[currentIdx + 1] : null;
                  return (
                    <motion.div key={order.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="glass-card p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-display font-semibold text-foreground text-sm">{order.order_number}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5" /> {new Date(order.created_at).toLocaleDateString()} · {order.delivery_type === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                          </p>
                        </div>
                        <Badge className={`text-[10px] border rounded-full ${statusColor[order.status] || ''}`} variant="outline">
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      {items.length > 0 && (
                        <div className="bg-primary/5 rounded-xl p-2.5 mb-3 space-y-1">
                          {items.slice(0, 3).map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                              <span>{item.name || 'Item'} × {item.quantity || 1}</span>
                              <span>₹{item.price || 0}</span>
                            </div>
                          ))}
                          {items.length > 3 && <p className="text-[10px] text-muted-foreground">+{items.length - 3} more items</p>}
                        </div>
                      )}

                      {order.delivery_address && (
                        <p className="text-xs text-muted-foreground mb-2">📍 {order.delivery_address}</p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <p className="font-display font-bold text-foreground text-lg">₹{order.total_amount}</p>
                        <div className="flex gap-2">
                          {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <Button variant="outline" size="sm" className="text-xs text-destructive rounded-xl"
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}>
                              <XCircle className="w-3 h-3 mr-1" /> Cancel
                            </Button>
                          )}
                          {nextStatus && order.status !== 'cancelled' && (
                            <Button size="sm" className="text-xs gradient-primary text-white rounded-xl"
                              onClick={() => updateOrderStatus(order.id, nextStatus)}>
                              <CheckCircle2 className="w-3 h-3 mr-1" /> {nextStatus.replace('_', ' ')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── SETTINGS ─── */}
        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass-card p-5 space-y-4">
              <h3 className="font-display font-semibold text-foreground">Pharmacy Settings</h3>
              {[
                {
                  title: 'Active Status', desc: 'Visible to customers',
                  checked: pharmacy?.is_active || false,
                  onChange: async (checked: boolean) => {
                    await supabase.from('pharmacies').update({ is_active: checked }).eq('id', pharmacy!.id);
                    setPharmacy(prev => prev ? { ...prev, is_active: checked } : null);
                    toast.success(checked ? 'Pharmacy is now active' : 'Pharmacy is now hidden');
                  }
                },
                {
                  title: 'Delivery Available', desc: 'Offer home delivery',
                  checked: pharmacy?.delivery_available || false,
                  onChange: async (checked: boolean) => {
                    await supabase.from('pharmacies').update({ delivery_available: checked }).eq('id', pharmacy!.id);
                    setPharmacy(prev => prev ? { ...prev, delivery_available: checked } : null);
                    toast.success(checked ? 'Delivery enabled' : 'Delivery disabled');
                  }
                }
              ].map(({ title, desc, checked, onChange }) => (
                <div key={title} className="flex items-center justify-between p-3 rounded-xl bg-primary/5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </div>
                  <Switch checked={checked} onCheckedChange={onChange} />
                </div>
              ))}
            </div>

            <div className="glass-card p-5">
              <h3 className="font-display font-semibold text-foreground mb-3">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Products', value: String(products.length), icon: Package },
                  { label: 'Total Orders', value: String(orders.length), icon: ShoppingCart },
                  { label: 'Rating', value: `⭐ ${pharmacy?.rating || 0}`, icon: Star },
                  { label: 'Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="text-center p-3 rounded-xl bg-primary/5">
                    <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="text-sm font-bold text-foreground">{value}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* FAB */}
      <div className="fixed bottom-6 right-6">
        <Button onClick={() => navigate('/dashboard')} size="sm" className="rounded-full shadow-glow gradient-primary text-white">
          <Activity className="w-4 h-4 mr-1" /> Patient App
        </Button>
      </div>

      {/* Product Dialog */}
      <Dialog open={showProduct} onOpenChange={setShowProduct}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Medicine Name *" value={productForm.name} className="rounded-xl"
              onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Generic Name" value={productForm.generic_name} className="rounded-xl"
              onChange={e => setProductForm(f => ({ ...f, generic_name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <Select value={productForm.category} onValueChange={v => setProductForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {['general', 'antibiotics', 'painkillers', 'vitamins', 'cardiac', 'diabetes', 'dermatology', 'ayurvedic', 'surgical', 'other'].map(c => (
                    <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Manufacturer" value={productForm.manufacturer} className="rounded-xl"
                onChange={e => setProductForm(f => ({ ...f, manufacturer: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Dosage" value={productForm.dosage} className="rounded-xl"
                onChange={e => setProductForm(f => ({ ...f, dosage: e.target.value }))} />
              <Select value={productForm.unit} onValueChange={v => setProductForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['strip', 'tablet', 'bottle', 'tube', 'box', 'pack', 'vial', 'sachet'].map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Stock *" type="number" value={productForm.stock_quantity} className="rounded-xl"
                onChange={e => setProductForm(f => ({ ...f, stock_quantity: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Price (₹) *" type="number" value={productForm.price} className="rounded-xl"
                onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} />
              <Input placeholder="MRP (₹)" type="number" value={productForm.mrp} className="rounded-xl"
                onChange={e => setProductForm(f => ({ ...f, mrp: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5">
              <div>
                <p className="text-sm text-foreground">Requires Prescription</p>
                <p className="text-[10px] text-muted-foreground">Mark as Rx-only medicine</p>
              </div>
              <Switch checked={productForm.requires_prescription}
                onCheckedChange={v => setProductForm(f => ({ ...f, requires_prescription: v }))} />
            </div>
            <Button className="w-full rounded-xl gradient-primary text-white shadow-glow" onClick={saveProduct}>
              {editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PharmacyDashboard;
