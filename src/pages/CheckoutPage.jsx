import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabaseClient';
import { translations } from '../translations';
import { Trash2, Plus, Minus, ShoppingBag, MapPin, MessageCircle, CheckCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// إصلاح أيقونات الخريطة
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const CheckoutPage = () => {
    const { cart = [], removeFromCart, updateQuantity, clearCart } = useCart();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false); 
    const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
    const [countryCode, setCountryCode] = useState('+20');
    const [position, setPosition] = useState(null);

    const lang = localStorage.getItem('lang') || 'ar';
    const t = translations[lang];

    // معرفة إذا كان الطلب من السوبر ماركت
    const isMarketOrder = useMemo(() => cart.some(item => item.isMarketItem), [cart]);

    const subtotal = useMemo(() => cart.reduce((acc, item) => {
        // إذا كان سعر المحل (سوبر ماركت) لا يحسب رقمياً الآن
        if (item.Price === "سعر المحل" || item.isMarketItem) return acc + 0;
        
        const price = typeof item.Price === 'string'
            ? parseFloat(item.Price.replace(/[^\d.]/g, ''))
            : item.Price;
        return acc + (price * (item.quantity || 1));
    }, 0), [cart]);

    const shippingFee = 40;
    const total = subtotal + shippingFee;

    const getAddressName = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ar`);
            const data = await res.json();
            return data.address.suburb || data.address.neighbourhood || data.address.city || "موقع محدد";
        } catch (e) { return "موقع على الخريطة"; }
    };

    const isFormValid = cart.length > 0 &&
        formData.name.trim().length >= 3 &&
        formData.phone.length >= 8 &&
        formData.address.trim().length >= 5;

    function LocationMarker() {
        useMapEvents({
            async click(e) {
                const { lat, lng } = e.latlng;
                setPosition(e.latlng);
                const addressName = await getAddressName(lat, lng);
                setFormData(prev => ({
                    ...prev,
                    address: `${addressName} (${lat.toFixed(4)}, ${lng.toFixed(4)})`
                }));
            },
        });
        return position === null ? null : <Marker position={position}></Marker>;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid || loading) return;

        setLoading(true);
        const audio = new Audio('/add.mp3');
        audio.play().catch(() => {});

        try {
            const fullPhone = `${countryCode}${formData.phone}`;
            const googleMapsLink = position ? `https://www.google.com/maps?q=${position.lat},${position.lng}` : '';

            // 1. الإرسال لـ Supabase
            const { error: supabaseError } = await supabase
                .from('Orders')
                .insert([{
                    customer_name: formData.name.trim(),
                    phone: fullPhone,
                    address: formData.address,
                    items: cart,
                    total_price: isMarketOrder ? 0 : total, // السوبر ماركت نسجل سعره 0 حالياً
                    status: 'pending',
                    created_at: new Date().toISOString()
                }]);

            if (supabaseError) throw supabaseError;

            // 2. تجهيز رسالة الواتساب
            let message = isMarketOrder ? `*🛒 طلب سوبر ماركت جديد من TALABATAK*%0A%0A` : `*📦 طلب جديد من TALABATAK*%0A%0A`;
            message += `*الاسم:* ${formData.name}%0A`;
            message += `*الموبايل:* ${fullPhone}%0A`;
            message += `*العنوان:* ${formData.address}%0A`;
            if (googleMapsLink) message += `*📍 الموقع:* ${googleMapsLink}%0A`;
            
            message += `%0A*🛒 الطلبات:*%0A`;
            cart.forEach((item) => {
                message += `- ${item.Name} (العدد: ${item.quantity})%0A`;
            });

            if (isMarketOrder) {
                message += `%0A*💰 الإجمالي:* سعر المنتجات + ${shippingFee} EGP توصيل`;
            } else {
                message += `%0A*💰 الإجمالي: ${total} EGP*`;
            }

            clearCart();
            localStorage.removeItem('sheon_cart');
            setShowSuccess(true);

            const whatsappUrl = `https://wa.me/201029472254?text=${message}`;
            setTimeout(() => {
                window.location.href = whatsappUrl;
            }, 2500);

        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-12 relative" dir="rtl">
            {showSuccess && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md text-center">
                    <div className="bg-zinc-900 border border-white/10 p-8 rounded-[2.5rem] max-w-sm w-full space-y-6 shadow-2xl animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                            <CheckCircle size={48} className="text-green-500" />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl font-black text-white italic uppercase">تم طلبك بنجاح!</h2>
                            <p className="text-zinc-400 text-sm leading-relaxed">سيتم تحويلك الآن للواتساب لتأكيد الطلب.</p>
                        </div>
                        <button onClick={() => navigate('/', { replace: true })} className="w-full bg-orange-500 text-black py-4 rounded-2xl font-black uppercase text-xs tracking-widest">العودة للرئيسية</button>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ملخص الطلب */}
                <div className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5 h-fit backdrop-blur-md order-1 lg:order-2">
                    <h3 className="text-[20px] font-black mb-6 text-orange-500 flex items-center gap-3 italic uppercase">
                        <ShoppingBag size={22} /> {isMarketOrder ? "طلبات السوبر ماركت" : "ملخص الطلب"}
                    </h3>
                    <div className="space-y-4 max-h-[350px] overflow-y-auto px-1 custom-scrollbar">
                        {cart.map(item => (
                            <div key={item.id} className="flex gap-4 items-center bg-black/40 p-3 rounded-2xl border border-white/5">
                                <img src={Array.isArray(item.ImgUrl) ? item.ImgUrl[0] : item.ImgUrl} className="w-14 h-14 rounded-xl object-cover" alt="" />
                                <div className="flex-1 min-w-0 text-right">
                                    <h4 className="text-sm font-bold truncate">{item.Name}</h4>
                                    <p className="text-orange-500 font-black text-xs">{item.Price === "سعر المحل" ? "سيتم تحديده" : `${item.Price} EGP`}</p>
                                    <div className="flex items-center gap-3 mt-1 justify-end">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center"><Minus size={8} /></button>
                                        <span className="text-xs font-bold">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center"><Plus size={8} /></button>
                                    </div>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                        <div className="flex justify-between text-zinc-400 font-bold text-xs">
                            <span>التوصيل (داخل العريش):</span>
                            <span>{shippingFee} EGP</span>
                        </div>
                        <div className="flex justify-between text-xl font-black text-orange-500 italic">
                            <span>الإجمالي:</span>
                            <span>{isMarketOrder ? "سعر المحل + التوصيل" : `${total.toLocaleString()} EGP`}</span>
                        </div>
                    </div>
                </div>

                {/* فورم البيانات */}
                <div className="bg-zinc-900 p-6 md:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl order-2 lg:order-1">
                    <h2 className="text-xl font-black mb-8 italic uppercase border-orange-500 border-r-4 pr-4 text-right">بيانات التوصيل</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <input required className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white focus:border-orange-500 outline-none transition-all text-right" 
                               placeholder="الاسم بالكامل" 
                               onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        
                        <div className="flex gap-2 w-full" dir="ltr">
                            <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} 
                                    className="bg-black border border-white/10 rounded-2xl px-2 text-white text-xs focus:border-orange-500 outline-none w-[90px]">
                                <option value="+20">🇪🇬 +20</option>
                                <option value="+970">🇵🇸 +970</option>
                            </select>
                            <input required type="tel" className="flex-1 bg-black border border-white/10 p-4 rounded-2xl text-white focus:border-orange-500 outline-none text-right" 
                                   placeholder="رقم الهاتف" 
                                   onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] text-zinc-500 flex items-center gap-2 uppercase font-black">
                                <MapPin size={14} className="text-orange-500" /> حدد موقعك بدقة (اختياري)
                            </label>
                            {!showSuccess && (
                                <div className="h-40 w-full rounded-2xl overflow-hidden border border-white/10 relative z-0">
                                    <MapContainer center={[31.1303, 33.8032]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <LocationMarker />
                                    </MapContainer>
                                </div>
                            )}
                        </div>

                        <textarea required className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white focus:border-orange-500 outline-none min-h-[80px] text-right" 
                               placeholder="العنوان بالتفصيل" 
                               value={formData.address}
                               onChange={e => setFormData({ ...formData, address: e.target.value })} />

                        <button type="submit" disabled={loading || !isFormValid}
                                className={`w-full py-5 rounded-2xl font-black uppercase transition-all flex items-center justify-center gap-3
                                    ${!isFormValid ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-orange-500 text-black hover:bg-white shadow-xl shadow-orange-500/20 active:scale-95'}`}>
                            {loading ? <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : 
                            <><MessageCircle size={20}/> تأكيد طلب {isMarketOrder ? "الماركت" : "المنتجات"}</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;