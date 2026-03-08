import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft, Building2, Package, ShoppingCart, BarChart3, Plus,
  Search, Edit2, Trash2, AlertTriangle, TrendingUp, DollarSign,
  Clock, CheckCircle2, XCircle, Truck, Eye, RefreshCw, Filter,
  Pill, Box, Settings
} from 'lucide-react';

/* ─── types ─── */
interface Pharmacy {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  is_active: boolean;
  delivery_available: boolean;
  rating: number;
  total_orders: number;
}

interface Product {
  id: string;
  pharmacy_id: string;
  name: string;
  generic_name: string | null;
  category: string;
  manufacturer: string | null;
  dosage: string | null;
  unit: string | null;
  price: number;
  mrp: number | null;
  stock_quantity: number;
  min_stock_alert: number | null;
  requires_prescription: boolean;
  is_available: boolean;
}

interface Order {
  id: string;
  order_number: string;
  items: any;
  total_amount: number;
  status: string;
  delivery_type: string;
  delivery_address: string | null;
  notes: string | null;
  created_at: string;
  customer_id: string;
}

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

const statusColor: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  confirmed: 'bg-info/10 text-info border-info/20',
  preparing: 'bg-primary/10 text-primary border-primary/20',
  ready: 'bg-success/10 text-success border-success/20',
  out_for_delivery: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

/* ─── component ─── */
const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [orderFilter, setOrderFilter] = useState('all');

  // Setup dialog
  const [showSetup, setShowSetup] = useState(false);
  const [setupName, setSetupName] = useState('');
  const [setupAddress, setSetupAddress] = useState('');
  const [setupCity, setSetupCity] = useState('');
  const [setupPhone, setSetupPhone] = useState('');

  // Product dialog
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
    const { data } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('owner_id', user!.id)
      .maybeSingle();

    if (data) {
      setPharmacy(data as Pharmacy);
      await Promise.all([loadProducts(data.id), loadOrders(data.id)]);
    } else {
      setShowSetup(true);
    }
    setLoading(false);
  };

  const loadProducts = async (pharmacyId: string) => {
    const { data } = await supabase
      .from('pharmacy_products')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('name');
    if (data) setProducts(data as Product[]);
  };

  const loadOrders = async (pharmacyId: string) => {
    const { data } = await supabase
      .from('pharmacy_orders')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false });
    if (data) setOrders(data as Order[]);
  };

  const createPharmacy = async () => {
    if (!setupName.trim()) { toast.error('Pharmacy name is required'); return; }
    const { data, error } = await supabase.from('pharmacies').insert({
      owner_id: user!.id,
      name: setupName.trim(),
      address: setupAddress.trim() || null,
      city: setupCity.trim() || null,
      phone: setupPhone.trim() || null,
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
        name: product.name,
        generic_name: product.generic_name || '',
        category: product.category,
        manufacturer: product.manufacturer || '',
        dosage: product.dosage || '',
        unit: product.unit || 'strip',
        price: String(product.price),
        mrp: product.mrp ? String(product.mrp) : '',
        stock_quantity: String(product.stock_quantity),
        min_stock_alert: String(product.min_stock_alert || 10),
        requires_prescription: product.requires_prescription,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '', generic_name: '', category: 'general', manufacturer: '',
        dosage: '', unit: 'strip', price: '', mrp: '', stock_quantity: '',
        min_stock_alert: '10', requires_prescription: false,
      });
    }
    setShowProduct(true);
  };

  const saveProduct = async () => {
    if (!productForm.name.trim() || !productForm.price) {
      toast.error('Name and price are required');
      return;
    }
    const payload = {
      pharmacy_id: pharmacy!.id,
      name: productForm.name.trim(),
      generic_name: productForm.generic_name.trim() || null,
      category: productForm.category,
      manufacturer: productForm.manufacturer.trim() || null,
      dosage: productForm.dosage.trim() || null,
      unit: productForm.unit,
      price: parseFloat(productForm.price),
      mrp: productForm.mrp ? parseFloat(productForm.mrp) : null,
      stock_quantity: parseInt(productForm.stock_quantity) || 0,
      min_stock_alert: parseInt(productForm.min_stock_alert) || 10,
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

  // Derived stats
  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total_amount, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const lowStockProducts = products.filter(p => p.stock_quantity <= (p.min_stock_alert || 10));
  const activeProducts = products.filter(p => p.is_available).length;

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.generic_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredOrders = orders.filter(o => orderFilter === 'all' || o.status === orderFilter);

  const categories = [...new Set(products.map(p => p.category))];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  // Setup screen
  if (showSetup && !pharmacy) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto pt-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-1">Register Your Pharmacy</h1>
            <p className="text-sm text-muted-foreground mb-6">Set up your pharmacy to start managing inventory and receiving orders</p>
            <div className="space-y-3">
              <Input placeholder="Pharmacy Name *" value={setupName} onChange={e => setSetupName(e.target.value)} />
              <Input placeholder="Address" value={setupAddress} onChange={e => setSetupAddress(e.target.value)} />
              <Input placeholder="City" value={setupCity} onChange={e => setSetupCity(e.target.value)} />
              <Input placeholder="Phone" value={setupPhone} onChange={e => setSetupPhone(e.target.value)} />
              <Button className="w-full gradient-primary text-primary-foreground" onClick={createPharmacy}>
                Register Pharmacy
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display font-bold text-foreground text-lg">{pharmacy?.name}</h1>
            <p className="text-xs text-muted-foreground">{pharmacy?.city || 'Pharmacy Partner Dashboard'}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={loadPharmacy}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="px-4 pt-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full grid grid-cols-4 mb-4">
            <TabsTrigger value="overview" className="text-xs">
              <BarChart3 className="w-3 h-3 mr-1" /> Overview
            </TabsTrigger>
            <TabsTrigger value="inventory" className="text-xs">
              <Package className="w-3 h-3 mr-1" /> Inventory
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs">
              <ShoppingCart className="w-3 h-3 mr-1" /> Orders
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              <Settings className="w-3 h-3 mr-1" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* ─── OVERVIEW ─── */}
          <TabsContent value="overview">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: DollarSign, label: 'Revenue', value: `₹${totalRevenue.toLocaleString()}`, color: 'text-primary' },
                  { icon: ShoppingCart, label: 'Pending Orders', value: String(pendingOrders), color: pendingOrders > 0 ? 'text-warning' : 'text-primary' },
                  { icon: Package, label: 'Active Products', value: `${activeProducts}/${products.length}`, color: 'text-primary' },
                  { icon: AlertTriangle, label: 'Low Stock', value: String(lowStockProducts.length), color: lowStockProducts.length > 0 ? 'text-destructive' : 'text-primary' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="bg-card border border-border rounded-xl p-4">
                    <Icon className={`w-5 h-5 ${color} mb-2`} />
                    <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              {/* Low stock alerts */}
              {lowStockProducts.length > 0 && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                  <h3 className="font-display font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" /> Low Stock Alerts
                  </h3>
                  <div className="space-y-2">
                    {lowStockProducts.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{p.name}</span>
                        <Badge variant="destructive" className="text-xs">{p.stock_quantity} left</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent orders */}
              <div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-2">Recent Orders</h3>
                {orders.length === 0 ? (
                  <div className="bg-card border border-border rounded-xl p-6 text-center">
                    <ShoppingCart className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orders.slice(0, 5).map(order => (
                      <div key={order.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{order.order_number}</p>
                          <p className="text-xs text-muted-foreground">₹{order.total_amount} · {order.delivery_type}</p>
                        </div>
                        <Badge className={`text-xs border ${statusColor[order.status] || 'bg-muted text-muted-foreground'}`}>
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ─── INVENTORY ─── */}
          <TabsContent value="inventory">
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search products..." className="pl-9"
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[120px]">
                    <Filter className="w-3 h-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="icon" className="gradient-primary text-primary-foreground shrink-0" onClick={() => openProductDialog()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <Box className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No products yet. Add your first medicine!</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => openProductDialog()}>
                    <Plus className="w-3 h-3 mr-1" /> Add Product
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map(product => (
                    <motion.div key={product.id} layout
                      className={`bg-card border rounded-xl p-3 ${
                        product.stock_quantity <= (product.min_stock_alert || 10) ? 'border-destructive/30' : 'border-border'
                      }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground text-sm truncate">{product.name}</h4>
                            {product.requires_prescription && (
                              <Badge variant="outline" className="text-[10px] shrink-0 border-primary/30 text-primary">Rx</Badge>
                            )}
                          </div>
                          {product.generic_name && (
                            <p className="text-xs text-muted-foreground truncate">{product.generic_name}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-sm font-bold text-foreground">₹{product.price}</span>
                            {product.mrp && product.mrp > product.price && (
                              <span className="text-xs text-muted-foreground line-through">₹{product.mrp}</span>
                            )}
                            <span className={`text-xs ${
                              product.stock_quantity <= (product.min_stock_alert || 10) ? 'text-destructive font-medium' : 'text-muted-foreground'
                            }`}>
                              Stock: {product.stock_quantity}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Switch checked={product.is_available}
                            onCheckedChange={() => toggleProductAvailability(product)} />
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openProductDialog(product)}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteProduct(product.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ─── ORDERS ─── */}
          <TabsContent value="orders">
            <div className="space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {['all', ...ORDER_STATUSES].map(s => (
                  <Button key={s} size="sm" variant={orderFilter === s ? 'default' : 'outline'}
                    className={`text-xs shrink-0 ${orderFilter === s ? 'gradient-primary text-primary-foreground' : ''}`}
                    onClick={() => setOrderFilter(s)}>
                    {s === 'all' ? 'All' : s.replace('_', ' ')}
                    {s !== 'all' && (
                      <span className="ml-1 opacity-70">({orders.filter(o => o.status === s).length})</span>
                    )}
                  </Button>
                ))}
              </div>

              {filteredOrders.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No {orderFilter === 'all' ? '' : orderFilter} orders</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map(order => {
                    const items = Array.isArray(order.items) ? order.items : [];
                    const currentIdx = ORDER_STATUSES.indexOf(order.status);
                    const nextStatus = currentIdx < ORDER_STATUSES.length - 2 ? ORDER_STATUSES[currentIdx + 1] : null;

                    return (
                      <motion.div key={order.id} layout
                        className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-display font-semibold text-foreground text-sm">{order.order_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()} · {order.delivery_type === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                            </p>
                          </div>
                          <Badge className={`text-xs border ${statusColor[order.status] || ''}`}>{order.status}</Badge>
                        </div>

                        {items.length > 0 && (
                          <div className="bg-accent/30 rounded-lg p-2 mb-2 space-y-1">
                            {items.slice(0, 3).map((item: any, i: number) => (
                              <div key={i} className="flex justify-between text-xs text-muted-foreground">
                                <span>{item.name || 'Item'} × {item.quantity || 1}</span>
                                <span>₹{item.price || 0}</span>
                              </div>
                            ))}
                            {items.length > 3 && (
                              <p className="text-[10px] text-muted-foreground">+{items.length - 3} more items</p>
                            )}
                          </div>
                        )}

                        {order.delivery_address && (
                          <p className="text-xs text-muted-foreground mb-2">📍 {order.delivery_address}</p>
                        )}

                        <div className="flex items-center justify-between">
                          <p className="font-display font-bold text-foreground">₹{order.total_amount}</p>
                          <div className="flex gap-2">
                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                              <Button variant="outline" size="sm" className="text-xs text-destructive"
                                onClick={() => updateOrderStatus(order.id, 'cancelled')}>
                                <XCircle className="w-3 h-3 mr-1" /> Cancel
                              </Button>
                            )}
                            {nextStatus && order.status !== 'cancelled' && (
                              <Button size="sm" className="text-xs gradient-primary text-primary-foreground"
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
            </div>
          </TabsContent>

          {/* ─── SETTINGS ─── */}
          <TabsContent value="settings">
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <h3 className="font-display font-semibold text-foreground">Pharmacy Settings</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">Active Status</p>
                    <p className="text-xs text-muted-foreground">Visible to customers</p>
                  </div>
                  <Switch checked={pharmacy?.is_active || false}
                    onCheckedChange={async (checked) => {
                      await supabase.from('pharmacies').update({ is_active: checked }).eq('id', pharmacy!.id);
                      setPharmacy(prev => prev ? { ...prev, is_active: checked } : null);
                      toast.success(checked ? 'Pharmacy is now active' : 'Pharmacy is now hidden');
                    }} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">Delivery Available</p>
                    <p className="text-xs text-muted-foreground">Offer home delivery</p>
                  </div>
                  <Switch checked={pharmacy?.delivery_available || false}
                    onCheckedChange={async (checked) => {
                      await supabase.from('pharmacies').update({ delivery_available: checked }).eq('id', pharmacy!.id);
                      setPharmacy(prev => prev ? { ...prev, delivery_available: checked } : null);
                      toast.success(checked ? 'Delivery enabled' : 'Delivery disabled');
                    }} />
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-display font-semibold text-foreground mb-2">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Total Products:</span> <span className="font-medium text-foreground">{products.length}</span></div>
                  <div><span className="text-muted-foreground">Total Orders:</span> <span className="font-medium text-foreground">{orders.length}</span></div>
                  <div><span className="text-muted-foreground">Rating:</span> <span className="font-medium text-foreground">⭐ {pharmacy?.rating || 0}</span></div>
                  <div><span className="text-muted-foreground">Revenue:</span> <span className="font-medium text-foreground">₹{totalRevenue.toLocaleString()}</span></div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Dialog */}
      <Dialog open={showProduct} onOpenChange={setShowProduct}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Medicine Name *" value={productForm.name}
              onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Generic Name" value={productForm.generic_name}
              onChange={e => setProductForm(f => ({ ...f, generic_name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <Select value={productForm.category} onValueChange={v => setProductForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {['general', 'antibiotics', 'painkillers', 'vitamins', 'cardiac', 'diabetes', 'dermatology', 'ayurvedic', 'surgical', 'other'].map(c => (
                    <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Manufacturer" value={productForm.manufacturer}
                onChange={e => setProductForm(f => ({ ...f, manufacturer: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Dosage" value={productForm.dosage}
                onChange={e => setProductForm(f => ({ ...f, dosage: e.target.value }))} />
              <Select value={productForm.unit} onValueChange={v => setProductForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['strip', 'tablet', 'bottle', 'tube', 'box', 'pack', 'vial', 'sachet'].map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Stock *" type="number" value={productForm.stock_quantity}
                onChange={e => setProductForm(f => ({ ...f, stock_quantity: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Price (₹) *" type="number" value={productForm.price}
                onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} />
              <Input placeholder="MRP (₹)" type="number" value={productForm.mrp}
                onChange={e => setProductForm(f => ({ ...f, mrp: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between bg-accent/30 rounded-lg p-3">
              <div>
                <p className="text-sm text-foreground">Requires Prescription</p>
                <p className="text-xs text-muted-foreground">Mark as Rx-only medicine</p>
              </div>
              <Switch checked={productForm.requires_prescription}
                onCheckedChange={v => setProductForm(f => ({ ...f, requires_prescription: v }))} />
            </div>
            <Button className="w-full gradient-primary text-primary-foreground" onClick={saveProduct}>
              {editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PharmacyDashboard;
