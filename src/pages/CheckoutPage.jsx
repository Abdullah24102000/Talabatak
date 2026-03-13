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

    const lang = localStorage.getItem('lang') || 'en';
    const t = translations[lang];

    const subtotal = useMemo(() => cart.reduce((acc, item) => {
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
            // تعديل رابط جوجل ماب ليعمل بشكل صحيح
            const googleMapsLink = position ? `https://www.google.com/maps?q=${position.lat},${position.lng}` : '';

            const { error: supabaseError } = await supabase
                .from('Orders')
                .insert([{
                    customer_name: formData.name.trim(),
                    phone: fullPhone,
                    address: formData.address,
                    items: cart,
                    total_price: total,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }]);

            if (supabaseError) throw supabaseError;

            // تغيير اسم البراند في رسالة الواتساب إلى TALABATAK
            let message = `*📦 طلب جديد من TALABATAK*%0A%0A`;
            message += `*الاسم:* ${formData.name}%0A`;
            message += `*الموبايل:* ${fullPhone}%0A`;
            message += `*العنوان:* ${formData.address}%0A`;
            if (googleMapsLink) message += `*📍 الموقع:* ${googleMapsLink}%0A`;
            message += `%0A*🛒 المنتجات:*%0A`;
            cart.forEach((item) => {
                message += `- ${item.Name} (${item.quantity})%0A`;
            });
            message += `%0A*💰 الإجمالي: ${total} EGP*`;

            clearCart();
            localStorage.removeItem('sheon_cart'); // يمكنك تغيير هذا الـ key لاحقاً لـ talabatak_cart
            
            setShowSuccess(true);

            setTimeout(() => {
                window.open(`https://wa.me/201029472254?text=${message}`, '_blank');
            }, 2500);

        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-12 relative" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            
            {showSuccess && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-zinc-900 border border-white/10 p-8 rounded-[2.5rem] max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                            <CheckCircle size={48} className="text-green-500" />
                        </div>
                        
                        <div className="space-y-3">
                            <h2 className="text-2xl font-black text-white italic uppercase">تم طلبك بنجاح!</h2>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                شكراً لثقتك في <span className="text-orange-500 font-bold">طلباتك</span>. انتظر رد أحد خدمة العملاء على الرقم الذي أدخلته ({countryCode}${formData.phone}).
                            </p>
                        </div>

                        <button 
                            onClick={() => navigate('/', { replace: true })}
                            className="w-full bg-orange-500 text-black py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white transition-all shadow-lg shadow-orange-500/20"
                        >
                            العودة للرئيسية
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">

                {/* يسار: ملخص المنتجات */}
                <div className="bg-zinc-900/50 p-6 md:p-10 rounded-[2.5rem] border border-white/5 h-fit backdrop-blur-md order-2 lg:order-1">
                    <h3 className="text-[20px] md:text-[24px] font-black mb-6 text-orange-500 flex items-center gap-3 italic uppercase">
                        <ShoppingBag size={22} /> {lang === 'en' ? 'Order Summary' : 'ملخص الطلب'}
                    </h3>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto px-2 custom-scrollbar">
                        {cart.map(item => (
                            <div key={item.id} className="flex gap-4 items-center bg-black/40 p-4 rounded-2xl border border-white/5 group hover:border-orange-500/50 transition-all">
                                <img src={Array.isArray(item.ImgUrl) ? item.ImgUrl[0] : item.ImgUrl} className="w-16 h-16 rounded-xl object-cover" alt="" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold truncate">{item.Name}</h4>
                                    <p className="text-orange-500 font-black">{item.Price} EGP</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-orange-500 hover:text-black transition-all"><Minus size={10} /></button>
                                        <span className="text-xs font-bold">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-orange-500 hover:text-black transition-all"><Plus size={10} /></button>
                                    </div>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="text-zinc-600 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                        <div className="flex justify-between text-zinc-400 font-bold text-sm">
                            <span>{lang === 'en' ? 'Shipping (Arish):' : 'التوصيل (داخل العريش):'}</span>
                            <span>{shippingFee} EGP</span>
                        </div>
                        <div className="flex justify-between text-2xl font-black text-orange-500 italic">
                            <span>{lang === 'en' ? 'Total:' : 'الإجمالي:'}</span>
                            <span>{total.toLocaleString()} EGP</span>
                        </div>
                    </div>
                </div>

                {/* يمين: فورم البيانات */}
                <div className="bg-zinc-900 p-8 md:p-12 rounded-[3rem] border border-white/5 shadow-2xl order-1 lg:order-2">
                    <h2 className="text-2xl font-black mb-8 italic uppercase border-orange-500 border-r-4 pr-4 text-right">
                        إتمام طلبك - TALABATAK
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <input required className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white focus:border-orange-500 outline-none transition-all text-right" 
                               placeholder="الاسم بالكامل" 
                               onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        
                        <div className="flex gap-2" dir="ltr">
                            <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} 
                                    className="bg-black border border-white/10 rounded-2xl px-3 text-white focus:border-orange-500 outline-none">
                                <option value="+20">🇪🇬 +20</option>
                                <option value="+970">🇵🇸 +970</option>
                            </select>
                            <input required type="tel" className="flex-1 bg-black border border-white/10 p-4 rounded-2xl text-white focus:border-orange-500 outline-none transition-all text-right" 
                                   placeholder="رقم الهاتف" 
                                   onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] text-zinc-500 flex items-center gap-2 uppercase font-black">
                                <MapPin size={14} className="text-orange-500" />
                                حدد موقعك على الخريطة
                            </label>
                            <div className="h-48 w-full rounded-2xl overflow-hidden border border-white/10 z-0">
                                <MapContainer center={[31.1303, 33.8032]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <LocationMarker />
                                </MapContainer>
                            </div>
                        </div>

                        <textarea required className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white focus:border-orange-500 outline-none transition-all min-h-[100px] text-right" 
                               placeholder="العنوان بالتفصيل (الشارع/العمارة)" 
                               value={formData.address}
                               onChange={e => setFormData({ ...formData, address: e.target.value })} />

                        <button type="submit" disabled={loading || !isFormValid}
                                className={`w-full py-5 rounded-2xl font-black uppercase transition-all flex items-center justify-center gap-3
                                    ${!isFormValid ? 'bg-zinc-800 text-zinc-500' : 'bg-orange-500 text-black hover:bg-white shadow-xl shadow-orange-500/20 active:scale-95'}`}>
                            {loading ? <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : 
                            <><MessageCircle size={20}/> تأكيد الطلب عبر واتساب</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;