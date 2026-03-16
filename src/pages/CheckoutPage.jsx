import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabaseClient';
import { Trash2, Plus, Minus, ShoppingBag, MapPin, MessageCircle, CheckCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const CheckoutPage = () => {
    const { cart = [], removeFromCart, updateQuantity, clearCart } = useCart();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
    const [position, setPosition] = useState(null);

    const isMarketOrder = useMemo(() => cart.some(item => item.isMarketItem), [cart]);

    const subtotal = useMemo(() => cart.reduce((acc, item) => {
        if (item.Price === "سعر المحل") return acc + 0;
        const p = typeof item.Price === 'string' ? parseFloat(item.Price.replace(/[^\d.]/g, '')) : item.Price;
        return acc + (p * (item.quantity || 1));
    }, 0), [cart]);

    const shippingFee = 40;
    const total = subtotal + shippingFee;

    function LocationMarker() {
        useMapEvents({
            click(e) {
                setPosition(e.latlng);
                setFormData(prev => ({ ...prev, address: `موقع محدد (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)})` }));
            },
        });
        return position === null ? null : <Marker position={position}></Marker>;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (cart.length === 0 || loading) return;
        setLoading(true);

        try {
            const googleLink = position ? `http://maps.google.com/maps?q=${position.lat},${position.lng}` : '';
            
            // 1. Supabase
            await supabase.from('Orders').insert([{
                customer_name: formData.name,
                phone: formData.phone,
                address: formData.address,
                items: cart,
                total_price: isMarketOrder ? 0 : total,
                status: 'pending'
            }]);

            // 2. WhatsApp Message
            let msg = isMarketOrder ? `*🛒 طلب خاص (ماركت/خضار)*%0A` : `*📦 طلب منتجات مطاعم*%0A`;
            msg += `*الاسم:* ${formData.name}%0A*العنوان:* ${formData.address}%0A`;
            if (googleLink) msg += `*📍 الخريطة:* ${googleLink}%0A`;
            msg += `%0A*الطلبات:*%0A`;
            cart.forEach(i => msg += `- ${i.Name} (الكمية: ${i.quantity})%0A`);
            msg += isMarketOrder ? `%0A*💰 الإجمالي:* سعر المحل + ${shippingFee} ج توصيل` : `%0A*💰 الإجمالي:* ${total} EGP`;

            clearCart();
            setShowSuccess(true);
            setTimeout(() => { window.location.href = `https://wa.me/201029472254?text=${msg}`; }, 2000);
        } catch (err) { alert(err.message); } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-12 relative font-sans" dir="rtl">
            {showSuccess && (
                <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-zinc-900 p-8 rounded-[2.5rem] text-center border border-white/10 animate-in zoom-in">
                        <CheckCircle size={60} className="text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-black mb-2">تم استلام طلبك!</h2>
                        <p className="text-zinc-400 mb-6">يتم تحويلك للواتساب الآن...</p>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ملخص الطلب */}
                <div className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5 h-fit order-1 lg:order-2">
                    <h3 className="text-xl font-black mb-6 text-orange-500 flex items-center gap-2"><ShoppingBag /> ملخص طلباتك</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto px-1 custom-scrollbar">
                        {cart.map(item => (
                            <div key={item.id} className="flex gap-4 items-center bg-black/40 p-3 rounded-2xl border border-white/5">
                                <img src={Array.isArray(item.ImgUrl) ? item.ImgUrl[0] : item.ImgUrl} className="w-14 h-14 rounded-xl object-cover" alt="" />
                                <div className="flex-1 text-right">
                                    <h4 className="text-sm font-bold">{item.Name}</h4>
                                    <p className="text-orange-500 font-black text-xs">{item.Price === "سعر المحل" ? "سعر المحل" : `${item.Price} EGP`}</p>
                                    <div className="flex items-center gap-3 mt-1 justify-end">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center"><Minus size={10} /></button>
                                        <span className="text-xs font-bold">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center"><Plus size={10} /></button>
                                    </div>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={18} /></button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                        {isMarketOrder && (
                            <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl mb-4 text-center">
                                <p className="text-orange-500 text-[10px] font-bold">⚠️ سيتم حساب سعر أصناف الماركت/الخضار بدقة عند الشراء.</p>
                            </div>
                        )}
                        <div className="flex justify-between text-zinc-400 text-xs font-bold"><span>التوصيل:</span><span>{shippingFee} EGP</span></div>
                        <div className="flex justify-between text-xl font-black text-orange-500 italic">
                            <span>الإجمالي:</span>
                            <span>{isMarketOrder ? "سعر المحل + التوصيل" : `${total} EGP`}</span>
                        </div>
                    </div>
                </div>

                {/* الفورم */}
                <div className="bg-zinc-900 p-6 md:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl order-2 lg:order-1">
                    <h2 className="text-xl font-black mb-8 border-r-4 border-orange-500 pr-4 text-right">بيانات الشحن</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <input required className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white text-right outline-none focus:border-orange-500" placeholder="الاسم" onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        <input required type="tel" className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white text-right outline-none focus:border-orange-500" placeholder="رقم الهاتف" onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        
                        <div className="h-40 w-full rounded-2xl overflow-hidden border border-white/10 relative z-0">
                            <MapContainer center={[31.1303, 33.8032]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <LocationMarker />
                            </MapContainer>
                        </div>

                        <textarea required className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white text-right outline-none min-h-[80px]" placeholder="العنوان بالتفصيل" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        
                        <button type="submit" disabled={loading} className="w-full py-5 bg-orange-500 text-black rounded-2xl font-black italic shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 hover:bg-white transition-all">
                            {loading ? <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <><MessageCircle /> إرسال الطلب عبر واتساب</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default CheckoutPage;