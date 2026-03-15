import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext'; // تأكد من المسار الصحيح للـ Context
import ProductCard from '../components/ProductCard';
import Hero from '../components/Hero';
import CategoryFilter from '../components/CategoryFilter';
import { ArrowRight, Truck, MapPin, MessageCircle, Plus, Trash2, ShoppingBasket, ShoppingBag } from 'lucide-react';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [heroProducts, setHeroProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // استدعاء وظائف السلة
  const { clearCart, addToCart } = useCart();

  // --- States الخاصة بالتوصيل الشخصي ---
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [mapLink, setMapLink] = useState('');
  const [isLocationSet, setIsLocationSet] = useState(false);

  // --- States الخاصة بالسوبر ماركت ---
  const [marketItems, setMarketItems] = useState([{ name: '', qty: '1' }]);

  const activeCategory = searchParams.get('category') || 'ALL';
  const vendorId = searchParams.get('vendorId');

  const categoryNames = {
    'ALL': 'الرئيسية',
    'RESTAURANTS': 'المطاعم',
    'SWEETS': 'الحلويات',
    'SUPERMARKET': 'السوبر ماركت',
    'PERSONAL_DELIVERY': 'توصيل طلب شخصي'
  };

  const getImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1517248135467-4c7ed9d42c7b?q=80&w=800';
    return Array.isArray(url) ? url[0] : url;
  };

  // --- وظائف السوبر ماركت (المعدلة للتحويل للـ Checkout) ---
  const addMarketItem = () => setMarketItems([...marketItems, { name: '', qty: '1' }]);
  const removeMarketItem = (index) => {
    if (marketItems.length > 1) {
      setMarketItems(marketItems.filter((_, i) => i !== index));
    }
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

    // 1. تفريغ السلة لضمان عدم خلط طلبات المطاعم مع الماركت
    clearCart();

    // 2. تحويل الطلبات لأصناف وهمية داخل السلة
    validItems.forEach((item, index) => {
      addToCart({
        id: `market-item-${index}-${Date.now()}`,
        Name: item.name,
        Price: "سعر المحل", 
        quantity: parseInt(item.qty) || 1,
        ImgUrl: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png',
        isMarketItem: true 
      });
    });

    // 3. التوجه لصفحة البيانات
    navigate('/checkout');
  };

  // --- وظائف الـ GPS والتوصيل الشخصي ---
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setMapLink(mapUrl);
        setPickupLocation("📍 تم تحديد موقعك الحالي");
        setIsLocationSet(true);
      });
    }
  };

  const sendPersonalOrder = () => {
    if (!pickupLocation || !destination) return alert("اكمل البيانات!");
    const message = `🚀 *توصيل شخصي* %0A%0A📍 *من:* ${isLocationSet ? pickupLocation + ' | ' + mapLink : pickupLocation} %0A🏁 *إلى:* ${destination}`;
    window.open(`https://wa.me/201029472254?text=${message}`, '_blank');
  };

  // --- جلب البيانات من Supabase ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: heroData } = await supabase.from('Products').select('*').limit(5).order('id', { ascending: false });
        setHeroProducts(heroData || []);

        if ((activeCategory === 'ALL' || activeCategory === 'RESTAURANTS' || activeCategory === 'SWEETS') && !vendorId) {
          let query = supabase.from('Vendors').select('*');
          if (activeCategory !== 'ALL') query = query.eq('category', activeCategory);
          const { data } = await query;
          setVendors(data || []);
        } 
        else if (vendorId) {
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
        <div className="flex flex-col mb-8 text-right items-end border-r-4 border-orange-500 pr-4">
          <h2 className="text-2xl md:text-5xl font-black italic tracking-tighter uppercase">
            {vendorId ? "منيو المحل" : categoryNames[activeCategory]} <span className="text-orange-500">طلباتك</span>
          </h2>
        </div>

        <CategoryFilter activeCategory={activeCategory} onFilterChange={(cat) => setSearchParams({ category: cat })} />

        {/* --- واجهة السوبر ماركت --- */}
        {activeCategory === 'SUPERMARKET' && (
          <div className="max-w-2xl mx-auto bg-zinc-900/60 p-6 md:p-8 rounded-[2.5rem] border border-white/5 mt-10 backdrop-blur-sm shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center">
                <ShoppingBasket className="text-orange-500" size={28} />
              </div>
              <h3 className="text-xl font-black italic">لستة <span className="text-orange-500">السوبر ماركت</span></h3>
            </div>
            
            <div className="space-y-4">
              {marketItems.map((item, index) => (
                <div key={index} className="flex gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                  <button onClick={() => removeMarketItem(index)} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 size={20} />
                  </button>
                  <input 
                    placeholder="كم" 
                    className="w-20 bg-black border border-white/10 rounded-2xl p-4 text-center focus:border-orange-500 outline-none" 
                    value={item.qty} 
                    onChange={(e) => updateMarketItem(index, 'qty', e.target.value)} 
                  />
                  <input 
                    placeholder="اسم المنتج (مثلاً: جبنة بيضا)" 
                    className="flex-1 bg-black border border-white/10 rounded-2xl p-4 text-right focus:border-orange-500 outline-none" 
                    value={item.name} 
                    onChange={(e) => updateMarketItem(index, 'name', e.target.value)} 
                  />
                </div>
              ))}
              
              <button 
                onClick={addMarketItem} 
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-zinc-500 font-bold hover:border-orange-500/50 hover:text-orange-500 transition-all"
              >
                + إضافة طلب آخر
              </button>

              <button 
                onClick={sendMarketOrder} 
                className="w-full bg-orange-500 text-black font-black py-5 rounded-2xl mt-6 italic hover:bg-white transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 text-lg"
              >
                <ShoppingBag size={22} /> استكمال بيانات التوصيل
              </button>
            </div>
          </div>
        )}

        {/* --- واجهة التوصيل الشخصي --- */}
        {activeCategory === 'PERSONAL_DELIVERY' && (
          <div className="max-w-2xl mx-auto bg-zinc-900/60 p-6 rounded-[2.5rem] border border-white/5 mt-10">
            <div className="flex items-center gap-4 mb-8 text-right">
              <Truck className="text-orange-500" size={32} />
              <h3 className="text-xl font-black italic">توصيل <span className="text-orange-500">شخصي</span></h3>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <input placeholder="هناخد الطلب منين؟" className="w-full bg-black border border-white/10 rounded-xl p-4 text-right pl-24 outline-none focus:border-orange-500" value={pickupLocation} onChange={(e) => {setPickupLocation(e.target.value); setIsLocationSet(false);}} />
                <button onClick={handleGetCurrentLocation} className="absolute left-2 top-2 bg-orange-500 text-black px-3 py-2 rounded-lg text-[10px] font-bold">📍 اللوكيشن</button>
              </div>
              <input placeholder="هيوصل لفين؟" className="w-full bg-black border border-white/10 rounded-xl p-4 text-right outline-none focus:border-orange-500" value={destination} onChange={(e) => setDestination(e.target.value)} />
              <button onClick={sendPersonalOrder} className="w-full bg-orange-500 text-black font-black py-4 rounded-xl italic hover:bg-white transition-all">تأكيد الطلب</button>
            </div>
          </div>
        )}

        {/* عرض المحلات */}
        {!vendorId && (activeCategory === 'ALL' || activeCategory === 'RESTAURANTS' || activeCategory === 'SWEETS') && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-10">
            {vendors.map((vendor) => (
              <div key={vendor.id} onClick={() => setSearchParams({ category: activeCategory, vendorId: vendor.id })} className="relative h-40 rounded-2xl overflow-hidden cursor-pointer group border border-white/5 hover:border-orange-500 transition-all">
                <img src={getImageUrl(vendor.image_url)} alt={vendor.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                <div className="absolute bottom-3 right-3 text-right">
                  <h3 className="text-sm font-black italic">{vendor.name}</h3>
                  <p className="text-orange-500 text-[10px] font-bold flex items-center justify-end gap-1">عرض المنيو <ArrowRight size={10} /></p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* عرض منتجات المحل */}
        {vendorId && (
          <div className="mt-10">
            <button onClick={() => setSearchParams({ category: activeCategory })} className="mb-6 bg-orange-500 text-black px-6 py-2 rounded-full text-xs font-black hover:bg-white transition-all">← العودة للمحلات</button>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </div>
        )}
      </div>

      <footer className="py-10 border-t border-white/5 text-center mt-20 bg-zinc-950">
        <p className="text-white text-[10px] font-black tracking-[0.3em] uppercase">Developed By <span className="text-orange-500">Abdullah Hassan</span></p>
      </footer>
    </div>
  );
};

export default Home;