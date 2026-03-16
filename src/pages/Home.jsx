import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import Hero from '../components/Hero';
import CategoryFilter from '../components/CategoryFilter';
import { ArrowRight, Truck, Trash2, ShoppingBasket, ShoppingBag } from 'lucide-react';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [heroProducts, setHeroProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart, addToCart } = useCart();

  // --- States ---
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [mapLink, setMapLink] = useState('');
  const [isLocationSet, setIsLocationSet] = useState(false);
  const [marketItems, setMarketItems] = useState([{ name: '', qty: '1' }]);

  const activeCategory = searchParams.get('category') || 'ALL';
  const vendorId = searchParams.get('vendorId');

  const categoryNames = {
    'ALL': 'الرئيسية',
    'RESTAURANTS': 'المطاعم',
    'SWEETS': 'الحلويات',
    'SUPERMARKET': 'السوبر ماركت',
    'VEGETABLES': 'خضروات وفواكه',
    'PERSONAL_DELIVERY': 'توصيل طلب شخصي'
  };

  const getImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1517248135467-4c7ed9d42c7b?q=80&w=800';
    return Array.isArray(url) ? url[0] : url;
  };

  // --- Logic السوبر ماركت والخضروات ---
  const addMarketItem = () => setMarketItems([...marketItems, { name: '', qty: '1' }]);
  const removeMarketItem = (index) => {
    if (marketItems.length > 1) setMarketItems(marketItems.filter((_, i) => i !== index));
  };
  const updateMarketItem = (index, field, value) => {
    const updated = [...marketItems];
    updated[index][field] = value;
    setMarketItems(updated);
  };

  const sendMarketOrder = () => {
    const validItems = marketItems.filter(item => item.name.trim() !== '');
    if (validItems.length === 0) {
      alert("يرجى كتابة طلباتك أولاً!");
      return;
    }
    clearCart();
    validItems.forEach((item, index) => {
      addToCart({
        id: `custom-${index}-${Date.now()}`,
        Name: item.name,
        Price: "سعر المحل", 
        quantity: item.qty, // يقبل نصوص مثل "نص كيلو"
        ImgUrl: activeCategory === 'VEGETABLES' 
          ? 'https://cdn-icons-png.flaticon.com/512/2329/2329895.png' 
          : 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png',
        isMarketItem: true 
      });
    });
    navigate('/checkout');
  };

  // --- Logic التوصيل الشخصي ---
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        setMapLink(url);
        setPickupLocation("📍 موقعي الحالي");
        setIsLocationSet(true);
      });
    }
  };

  const sendPersonalOrder = () => {
    if (!pickupLocation || !destination) return alert("اكمل البيانات!");
    const msg = `🚀 *توصيل شخصي* %0A📍 *من:* ${isLocationSet ? pickupLocation + ' | ' + mapLink : pickupLocation} %0A🏁 *إلى:* ${destination}`;
    window.open(`https://wa.me/201029472254?text=${msg}`, '_blank');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: hero } = await supabase.from('Products').select('*').limit(5).order('id', { ascending: false });
        setHeroProducts(hero || []);

        if (['ALL', 'RESTAURANTS', 'SWEETS'].includes(activeCategory) && !vendorId) {
          let query = supabase.from('Vendors').select('*');
          if (activeCategory !== 'ALL') query = query.eq('category', activeCategory);
          const { data } = await query;
          setVendors(data || []);
        } else if (vendorId) {
          const { data } = await supabase.from('Products').select('*').eq('vendor_id', vendorId).order('id', { ascending: false });
          setProducts(data || []);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [activeCategory, vendorId]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-20" dir="rtl">
      <Hero products={heroProducts} />
      <div className="container mx-auto px-4 py-8">
        
        {/* Navbar الأقسام الجديد */}
        <CategoryFilter activeCategory={activeCategory} onFilterChange={(cat) => setSearchParams({ category: cat })} />

        <div className="flex flex-col mb-8 text-right items-end border-r-4 border-orange-500 pr-4">
          <h2 className="text-2xl md:text-5xl font-black italic tracking-tighter uppercase">
            {vendorId ? "منيو المحل" : categoryNames[activeCategory]} <span className="text-orange-500">طلباتك</span>
          </h2>
        </div>

        {/* واجهة الماركت والخضروات */}
        {(activeCategory === 'SUPERMARKET' || activeCategory === 'VEGETABLES') && (
          <div className="max-w-2xl mx-auto bg-zinc-900/40 p-6 rounded-[2.5rem] border border-white/5 mt-6 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <ShoppingBasket className="text-black" size={20} />
              </div>
              <h3 className="text-lg font-black italic">لستة <span className="text-orange-500">{categoryNames[activeCategory]}</span></h3>
            </div>
            <div className="space-y-3">
              {marketItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input placeholder="الوزن/الكمية" className="w-24 bg-black/60 border border-white/5 rounded-2xl p-4 text-center focus:border-orange-500 outline-none text-[11px] font-bold" value={item.qty} onChange={(e) => updateMarketItem(index, 'qty', e.target.value)} />
                  <input placeholder={activeCategory === 'VEGETABLES' ? "عايز خضار إيه؟" : "اسم المنتج"} className="flex-1 bg-black/60 border border-white/5 rounded-2xl p-4 text-right focus:border-orange-500 outline-none text-sm" value={item.name} onChange={(e) => updateMarketItem(index, 'name', e.target.value)} />
                  <button onClick={() => removeMarketItem(index)} className="p-4 text-zinc-600 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              ))}
              <button onClick={addMarketItem} className="w-full py-4 bg-white/5 border border-dashed border-white/10 rounded-2xl text-zinc-500 text-xs font-bold">+ صنف إضافي</button>
              <button onClick={sendMarketOrder} className="w-full bg-orange-500 text-black font-black py-5 rounded-2xl mt-6 italic shadow-xl shadow-orange-500/10 flex items-center justify-center gap-3"><ShoppingBag size={20} /> متابعة الطلب</button>
            </div>
          </div>
        )}

        {/* واجهة السكوتر */}
        {activeCategory === 'PERSONAL_DELIVERY' && (
          <div className="max-w-2xl mx-auto bg-zinc-900/40 p-6 rounded-[2.5rem] border border-white/5 mt-6 backdrop-blur-md">
            <div className="flex items-center gap-4 mb-8">
              <Truck className="text-orange-500" size={32} />
              <h3 className="text-xl font-black italic text-white uppercase">توصيل <span className="text-orange-500">سريع</span></h3>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <input placeholder="هناخد الطلب منين؟" className="w-full bg-black border border-white/10 rounded-xl p-4 text-right pl-24 outline-none focus:border-orange-500" value={pickupLocation} onChange={(e) => {setPickupLocation(e.target.value); setIsLocationSet(false);}} />
                <button onClick={handleGetCurrentLocation} className="absolute left-2 top-2 bg-orange-500 text-black px-3 py-2 rounded-lg text-[10px] font-bold">📍 الموقع</button>
              </div>
              <input placeholder="هيوصل لفين؟" className="w-full bg-black border border-white/10 rounded-xl p-4 text-right outline-none focus:border-orange-500" value={destination} onChange={(e) => setDestination(e.target.value)} />
              <button onClick={sendPersonalOrder} className="w-full bg-orange-500 text-black font-black py-4 rounded-xl italic transition-all shadow-xl shadow-orange-500/10">تأكيد السكوتر</button>
            </div>
          </div>
        )}

        {/* عرض المحلات والمنتجات */}
        {!vendorId && ['ALL', 'RESTAURANTS', 'SWEETS'].includes(activeCategory) && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-10">
            {vendors.map((v) => (
              <div key={v.id} onClick={() => setSearchParams({ category: activeCategory, vendorId: v.id })} className="relative h-40 rounded-2xl overflow-hidden cursor-pointer group border border-white/5 hover:border-orange-500 transition-all">
                <img src={getImageUrl(v.image_url)} alt={v.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                <div className="absolute bottom-3 right-3 text-right">
                  <h3 className="text-sm font-black italic">{v.name}</h3>
                  <p className="text-orange-500 text-[10px] font-bold flex items-center justify-end gap-1">المنيو <ArrowRight size={10} /></p>
                </div>
              </div>
            ))}
          </div>
        )}
        {vendorId && (
          <div className="mt-10 text-right">
            <button onClick={() => setSearchParams({ category: activeCategory })} className="mb-6 bg-orange-500 text-black px-6 py-2 rounded-full text-xs font-black">← رجوع</button>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Home;