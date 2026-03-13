import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
    Search, Calendar, User, Phone, Truck, Eye, 
    Plus, Package, ChevronDown, ChevronUp, Trash2, Edit, X, MapPin, ShoppingBag, Clock, CheckCircle, MessageCircle
} from 'lucide-react';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [stockFilter, setStockFilter] = useState('all');
    
    const [expandedDates, setExpandedDates] = useState({});
    const [selectedOrder, setSelectedOrder] = useState(null);
    
    const [editingProduct, setEditingProduct] = useState(null);
    const [editLoading, setEditLoading] = useState(false);

    const [newProduct, setNewProduct] = useState({ 
        Name: '', Price: '', vendor_id: '', ImgUrl: '', Stock: 0 
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        await Promise.all([fetchOrders(), fetchProducts(), fetchVendors()]);
        setLoading(false);
    };

    const fetchOrders = async () => {
        const { data, error } = await supabase.from('Orders').select('*').order('created_at', { ascending: false });
        if (!error) {
            setOrders(data || []);
            if (data.length > 0) {
                const firstDate = new Date(data[0].created_at).toLocaleDateString('ar-EG');
                setExpandedDates({ [firstDate]: true });
            }
        }
    };

    const fetchVendors = async () => {
        const { data } = await supabase.from('Vendors').select('id, name');
        setVendors(data || []);
        if (data?.length > 0) setNewProduct(prev => ({ ...prev, vendor_id: data[0].id }));
    };

    const fetchProducts = async () => {
        const { data } = await supabase.from('Products').select('*').order('id', { ascending: false });
        setProducts(data || []);
    };

    // --- إدارة المنتجات (إضافة وحذف) ---
    const handleAddProduct = async (e) => {
        e.preventDefault();
        setLoading(true);
        const imgArray = newProduct.ImgUrl.split(',').map(u => u.trim());
        
        const { error } = await supabase.from('Products').insert([{
            ...newProduct,
            Price: parseFloat(newProduct.Price),
            Stock: parseInt(newProduct.Stock),
            ImgUrl: imgArray
        }]);

        if (!error) {
            alert("تم إضافة المنتج بنجاح ✅");
            setNewProduct({ Name: '', Price: '', vendor_id: vendors[0]?.id, ImgUrl: '', Stock: 0 });
            fetchProducts();
        } else {
            alert("خطأ في الإضافة");
        }
        setLoading(false);
    };

    const deleteProduct = async (id) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
        const { error } = await supabase.from('Products').delete().eq('id', id);
        if (!error) fetchProducts();
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        const imgArray = typeof editingProduct.ImgUrl === 'string' 
            ? editingProduct.ImgUrl.split(',').map(u => u.trim()) 
            : editingProduct.ImgUrl;

        const { error } = await supabase
            .from('Products')
            .update({
                Name: editingProduct.Name,
                Price: parseFloat(editingProduct.Price),
                Stock: parseInt(editingProduct.Stock),
                ImgUrl: imgArray,
                vendor_id: editingProduct.vendor_id
            })
            .eq('id', editingProduct.id);

        if (!error) {
            alert("تم تحديث المنتج بنجاح ✅");
            setEditingProduct(null);
            fetchProducts();
        }
        setEditLoading(false);
    };

    // --- تحديث حالة الطلب ---
    const updateOrderStatus = async (orderId, updates) => {
        setLoading(true);
        const { error } = await supabase
            .from('Orders')
            .update(updates)
            .eq('id', orderId);

        if (!error) {
            alert("تم التحديث بنجاح ✅");
            fetchOrders();
            if (selectedOrder) setSelectedOrder({ ...selectedOrder, ...updates });
        }
        setLoading(false);
    };

    // --- إرسال إشعار واتساب ---
    const sendWhatsAppNotification = (order) => {
        let message = "";
        const customerName = order.customer_name || "عميلنا العزيز";
        
        if (order.status === 'shipping') {
            message = `أهلاً يا ${customerName}، طلبك من "طلباتك" أصبح في الطريق مع المندوب الآن! 🚚%0a%0a📦 *بيانات المندوب:*%0a- الاسم: ${order.delivery_name}%0a- التليفون: ${order.delivery_phone}%0a%0aشكراً لاختيارك لنا! ✨`;
        } else if (order.status === 'delivered') {
            message = `سعادتنا اكتملت بوصول طلبك يا ${customerName}! ✅%0aنتمنى أن نكون عند حسن ظنك دائماً.`;
        } else {
            message = `أهلاً يا ${customerName}، تم استلام طلبك رقم #${order.id} بنجاح وجاري تجهيزه حالياً. ⏳ ✨`;
        }

        const cleanPhone = order.phone.startsWith('0') ? `2${order.phone}` : order.phone;
        window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    };

    // --- الفلترة والتنظيم ---
    const filteredOrders = orders.filter(order => {
        return (
            order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.phone?.includes(searchTerm) ||
            order.delivery_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const groupedOrders = filteredOrders.reduce((groups, order) => {
        const date = new Date(order.created_at).toLocaleDateString('ar-EG', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        if (!groups[date]) groups[date] = [];
        groups[date].push(order);
        return groups;
    }, {});

    const filteredProducts = products.filter(prod => stockFilter === 'all' || prod.vendor_id == stockFilter);

    const toggleDate = (date) => {
        setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
    };

    const getStatusInfo = (status) => {
        switch(status) {
            case 'delivered': return { label: 'تم التوصيل', color: 'bg-green-500/20 text-green-500', icon: <CheckCircle size={12}/> };
            case 'shipping': return { label: 'مع المندوب', color: 'bg-blue-500/20 text-blue-500', icon: <Truck size={12}/> };
            case 'cancelled': return { label: 'ملغي', color: 'bg-red-500/20 text-red-500', icon: <X size={12}/> };
            default: return { label: 'قيد الانتظار', color: 'bg-zinc-500/20 text-zinc-400', icon: <Clock size={12}/> };
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8" dir="rtl">
            <header className="max-w-7xl mx-auto mb-10 flex flex-wrap justify-between items-center gap-6 bg-zinc-900/40 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-md shadow-2xl">
                <h1 className="text-2xl font-black italic text-orange-500 uppercase tracking-tighter text-right">TALABATAK <span className="text-white">DASH</span></h1>
                <div className="flex bg-black/50 p-1.5 rounded-2xl border border-white/5">
                    <button onClick={() => setActiveTab('orders')} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${activeTab === 'orders' ? 'bg-orange-500 text-black shadow-lg' : 'text-zinc-500'}`}>الطلبات</button>
                    <button onClick={() => setActiveTab('stock')} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${activeTab === 'stock' ? 'bg-orange-500 text-black shadow-lg' : 'text-zinc-500'}`}>المخزن</button>
                    <button onClick={() => setActiveTab('add')} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${activeTab === 'add' ? 'bg-orange-500 text-black shadow-lg' : 'text-zinc-500'}`}>إضافة منتج</button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto">
                {activeTab === 'orders' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="relative group max-w-2xl mx-auto">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-500" size={20} />
                            <input type="text" placeholder="ابحث باسم العميل، الرقم، أو المندوب..." className="w-full bg-zinc-900/50 border border-white/10 p-5 pr-14 rounded-3xl outline-none focus:border-orange-500/50 text-sm font-bold shadow-inner text-right" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>

                        <div className="space-y-6">
                            {Object.keys(groupedOrders).map(date => (
                                <div key={date} className="space-y-4">
                                    <button onClick={() => toggleDate(date)} className="w-full flex items-center gap-4 group">
                                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-zinc-800"></div>
                                        <div className="bg-zinc-900/80 border border-white/5 px-6 py-2 rounded-full flex items-center gap-3 group-hover:border-orange-500/20">
                                            <Calendar size={14} className="text-orange-500" />
                                            <span className="text-[11px] font-black italic text-zinc-300">{date}</span>
                                            <span className="bg-orange-500 text-black px-2 py-0.5 rounded-md text-[9px] font-black">{groupedOrders[date].length}</span>
                                            {expandedDates[date] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-zinc-800"></div>
                                    </button>

                                    {expandedDates[date] && (
                                        <div className="grid grid-cols-1 gap-3 animate-in slide-in-from-top-2 duration-300">
                                            {groupedOrders[date].map(order => {
                                                const status = getStatusInfo(order.status);
                                                return (
                                                    <div key={order.id} className="bg-zinc-900/20 border border-white/5 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-center hover:bg-zinc-900/40 transition-all">
                                                        <div className="flex items-center gap-5 flex-1 w-full text-right">
                                                            <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500"><User size={20}/></div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-bold text-sm tracking-tight">{order.customer_name}</h4>
                                                                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${status.color}`}>
                                                                        {status.icon} {status.label}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] text-zinc-600 font-bold mt-1">{order.phone} | المندوب: {order.delivery_name || "—"}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between border-t md:border-t-0 md:border-r border-white/5 pt-3 md:pt-0 md:pr-6">
                                                            <p className="text-xl font-black text-orange-500 italic">{order.total_price} <span className="text-[9px]">EGP</span></p>
                                                            <button onClick={() => setSelectedOrder(order)} className="p-3 bg-white/5 rounded-xl hover:bg-orange-500 hover:text-black transition-all shadow-lg"><Eye size={18}/></button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {selectedOrder && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-[3rem] p-8 md:p-12 space-y-8 shadow-2xl relative overflow-y-auto max-h-[90vh]">
                            <button onClick={() => setSelectedOrder(null)} className="absolute top-8 left-8 p-3 bg-zinc-800 rounded-full hover:bg-red-500 transition-all"><X size={20}/></button>
                            
                            <div className="border-r-4 border-orange-500 pr-5 text-right">
                                <h2 className="text-2xl font-black italic text-orange-500 uppercase tracking-tighter">تفاصيل الطلب</h2>
                                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">ID: #{selectedOrder.id}</p>
                            </div>

                            <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 space-y-6 text-right">
                                <div className="flex justify-between items-center">
                                    <button onClick={() => sendWhatsAppNotification(selectedOrder)} className="flex items-center gap-2 bg-green-500 text-black px-4 py-2 rounded-full text-[10px] font-black hover:bg-green-400 transition-all">
                                        إرسال تحديث للعميل <MessageCircle size={14}/>
                                    </button>
                                    <h3 className="text-[11px] font-black text-orange-500 uppercase italic flex items-center gap-2">التحكم في التوصيل <Truck size={14}/></h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-zinc-500 mr-2">حالة الطلب</label>
                                        <select 
                                            className="w-full bg-zinc-900 border border-white/10 p-4 rounded-2xl text-xs font-bold outline-none focus:border-orange-500 appearance-none text-right"
                                            value={selectedOrder.status || 'pending'}
                                            onChange={(e) => updateOrderStatus(selectedOrder.id, { status: e.target.value })}
                                        >
                                            <option value="pending">قيد الانتظار ⏳</option>
                                            <option value="shipping">مع المندوب 🚚</option>
                                            <option value="delivered">تم التوصيل ✅</option>
                                            <option value="cancelled">ملغي ❌</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-zinc-500 mr-2">المندوب</label>
                                        <button 
                                            onClick={() => {
                                                const name = prompt("اسم المندوب:", selectedOrder.delivery_name || "");
                                                const phone = prompt("رقم تليفون المندوب:", selectedOrder.delivery_phone || "");
                                                if(name) updateOrderStatus(selectedOrder.id, { delivery_name: name, delivery_phone: phone, status: 'shipping' });
                                            }}
                                            className="w-full bg-orange-500/10 border border-orange-500/20 text-orange-500 p-4 rounded-2xl text-xs font-black"
                                        >
                                            {selectedOrder.delivery_name ? `المندوب: ${selectedOrder.delivery_name}` : "تعيين مندوب"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 justify-end">
                                        <div><p className="text-[9px] text-zinc-500 font-black">العميل</p><p className="text-sm font-bold">{selectedOrder.customer_name}</p></div>
                                        <User className="text-orange-500" size={18}/>
                                    </div>
                                    <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 justify-end">
                                        <div><p className="text-[9px] text-zinc-500 font-black">الهاتف</p><p className="text-sm font-bold">{selectedOrder.phone}</p></div>
                                        <Phone className="text-orange-500" size={18}/>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 justify-end h-full">
                                        <div><p className="text-[9px] text-zinc-500 font-black">العنوان</p><p className="text-sm font-bold">{selectedOrder.address || "غير محدد"}</p></div>
                                        <MapPin className="text-orange-500" size={18}/>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 text-right">
                                <div className="flex items-center gap-2 text-orange-500 font-black italic text-sm justify-end">المنتجات المطلوبة <ShoppingBag size={16}/></div>
                                <div className="bg-black/40 rounded-[2rem] p-6 border border-white/5 space-y-4">
                                    {selectedOrder.items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 border-b border-white/5 pb-3 last:border-0">
                                            <p className="font-black text-orange-500 italic">{(item.Price * item.quantity).toLocaleString()} EGP</p>
                                            <div className="flex-1 text-right">
                                                <p className="text-sm font-black italic">{item.Name}</p>
                                                <p className="text-[10px] text-zinc-500 font-bold">{item.quantity} قطعة × {item.Price} EGP</p>
                                            </div>
                                            <div className="w-12 h-12 bg-zinc-800 rounded-xl overflow-hidden shadow-lg border border-white/5">
                                                <img src={Array.isArray(item.ImgUrl) ? item.ImgUrl[0] : item.ImgUrl} className="w-full h-full object-cover" alt="" />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="pt-4 border-t border-orange-500/20 flex justify-between items-center">
                                        <span className="text-2xl font-black text-orange-500 italic">{selectedOrder.total_price} EGP</span>
                                        <span className="font-black text-sm italic">الإجمالي النهائي</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'stock' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar" dir="rtl">
                            <button onClick={() => setStockFilter('all')} className={`px-5 py-2 rounded-full text-[10px] font-black border transition-all ${stockFilter === 'all' ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-zinc-500'}`}>الكل</button>
                            {vendors.map(v => (
                                <button key={v.id} onClick={() => setStockFilter(v.id)} className={`px-5 py-2 rounded-full text-[10px] font-black border transition-all whitespace-nowrap ${stockFilter == v.id ? 'bg-orange-500 text-black border-orange-500' : 'bg-transparent border-white/10 text-zinc-500'}`}>{v.name}</button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredProducts.map(prod => (
                                <div key={prod.id} className="bg-zinc-900/40 border border-white/5 rounded-[2rem] overflow-hidden group hover:border-orange-500/30 transition-all shadow-xl relative">
                                    <div className="aspect-square bg-black relative overflow-hidden">
                                        <img src={Array.isArray(prod.ImgUrl) ? prod.ImgUrl[0] : prod.ImgUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] font-black text-orange-500">{vendors.find(v => v.id == prod.vendor_id)?.name}</div>
                                    </div>
                                    <div className="p-4 space-y-2 text-right">
                                        <h4 className="text-[11px] font-black truncate italic uppercase tracking-tighter">{prod.Name}</h4>
                                        <div className="flex justify-between items-center" dir="ltr">
                                            <span className="text-[9px] font-bold text-zinc-500">Stock: {prod.Stock || 0}</span>
                                            <span className="text-sm font-black text-orange-500 italic">{prod.Price} EGP</span>
                                        </div>
                                        <div className="flex gap-2 pt-2 border-t border-white/5">
                                            <button onClick={() => deleteProduct(prod.id)} className="flex-1 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 p-2 rounded-xl transition-all"><Trash2 size={14} className="mx-auto" /></button>
                                            <button onClick={() => setEditingProduct(prod)} className="flex-1 bg-white/5 hover:bg-white hover:text-black p-2 rounded-xl transition-all"><Edit size={14} className="mx-auto" /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {editingProduct && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
                        <div className="bg-zinc-900 border border-white/10 w-full max-w-xl rounded-[3rem] p-8 space-y-8 shadow-2xl relative">
                            <button onClick={() => setEditingProduct(null)} className="absolute top-8 left-8 p-3 bg-zinc-800 rounded-full hover:bg-red-500 transition-all"><X size={20}/></button>
                            <h2 className="text-2xl font-black italic text-orange-500 uppercase text-right border-r-4 border-orange-500 pr-4">تعديل المنتج</h2>
                            <form onSubmit={handleUpdateProduct} className="space-y-5 text-right">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase italic">القسم</label>
                                        <select className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none text-right appearance-none" value={editingProduct.vendor_id} onChange={e => setEditingProduct({...editingProduct, vendor_id: e.target.value})}>
                                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase italic">اسم المنتج</label>
                                        <input required className="w-full bg-black border border-white/10 p-4 rounded-2xl text-right" value={editingProduct.Name} onChange={e => setEditingProduct({...editingProduct, Name: e.target.value})} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input required type="number" placeholder="المخزون" className="w-full bg-black border border-white/10 p-4 rounded-2xl text-right" value={editingProduct.Stock} onChange={e => setEditingProduct({...editingProduct, Stock: e.target.value})} />
                                    <input required type="number" placeholder="السعر" className="w-full bg-black border border-white/10 p-4 rounded-2xl text-right" value={editingProduct.Price} onChange={e => setEditingProduct({...editingProduct, Price: e.target.value})} />
                                </div>
                                <textarea placeholder="روابط الصور (مفصولة بفاصلة)" className="w-full bg-black border border-white/10 p-4 rounded-2xl min-h-[100px] text-right" value={Array.isArray(editingProduct.ImgUrl) ? editingProduct.ImgUrl.join(', ') : editingProduct.ImgUrl} onChange={e => setEditingProduct({...editingProduct, ImgUrl: e.target.value})} />
                                <button type="submit" disabled={editLoading} className="w-full bg-orange-500 text-black py-5 rounded-[2rem] font-black uppercase italic shadow-xl shadow-orange-500/20">
                                    {editLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'add' && (
                   <div className="max-w-xl mx-auto bg-zinc-900/40 border border-white/5 p-10 rounded-[3rem] shadow-2xl backdrop-blur-md animate-in zoom-in-95">
                        <div className="flex items-center gap-4 mb-10 border-r-4 border-orange-500 pr-5 text-right">
                             <h2 className="text-2xl font-black italic text-orange-500 uppercase tracking-tighter w-full">منتج جديد</h2>
                        </div>
                        <form onSubmit={handleAddProduct} className="space-y-6 text-right">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase px-2">المورد (Vendor)</label>
                                <select className="w-full bg-black border border-white/10 p-5 rounded-2xl text-right appearance-none" value={newProduct.vendor_id} onChange={e => setNewProduct({...newProduct, vendor_id: e.target.value})}>
                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                            <input required placeholder="اسم المنتج" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-right outline-none focus:border-orange-500/50" value={newProduct.Name} onChange={e => setNewProduct({...newProduct, Name: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" placeholder="الكمية" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-right outline-none focus:border-orange-500/50" value={newProduct.Stock} onChange={e => setNewProduct({...newProduct, Stock: e.target.value})} />
                                <input required type="number" placeholder="السعر" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-right outline-none focus:border-orange-500/50" value={newProduct.Price} onChange={e => setNewProduct({...newProduct, Price: e.target.value})} />
                            </div>
                            <textarea placeholder="روابط الصور (مفصولة بفاصلة)" className="w-full bg-black border border-white/10 p-5 rounded-2xl min-h-[100px] text-right outline-none focus:border-orange-500/50" value={newProduct.ImgUrl} onChange={e => setNewProduct({...newProduct, ImgUrl: e.target.value})} />
                            <button type="submit" disabled={loading} className="w-full bg-orange-500 text-black py-5 rounded-[2rem] font-black uppercase italic shadow-xl shadow-orange-500/20 active:scale-95 transition-all">
                                {loading ? 'جاري الحفظ...' : 'تأكيد الحفظ في المخزن'}
                            </button>
                        </form>
                   </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;