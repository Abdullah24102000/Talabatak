import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ProductCard from '../components/ProductCard';
import Hero from '../components/Hero';
import CategoryFilter from '../components/CategoryFilter';
import { ArrowRight, Truck, MapPin, MessageCircle, Utensils, IceCream } from 'lucide-react';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [isLocationSet, setIsLocationSet] = useState(false);
  
  const activeCategory = searchParams.get('category') || 'ALL';
  const vendorId = searchParams.get('vendorId');

  const categoryNames = {
    'ALL': 'الكل',
    'RESTAURANTS': 'المطاعم',
    'SWEETS': 'الحلويات',
    'PERSONAL_DELIVERY': 'توصيل طلب شخصي'
  };

  const getImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1517248135467-4c7ed9d42c7b?q=80&w=800';
    if (Array.isArray(url)) return url[0];
    return url;
  };

  // دالة تحويل الإحداثيات لعنوان نصي (مثل اسم الحي)
  const getAddressFromCoords = async (lat, lon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=ar`);
      const data = await res.json();
      return data.address.suburb || data.address.neighbourhood || data.address.city || "موقع محدد";
    } catch (e) {
      return `موقع (GPS: ${lat.toFixed(2)}, ${lon.toFixed(2)})`;
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const addressName = await getAddressFromCoords(latitude, longitude);
        const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        
        setPickupLocation(addressName); // نضع الاسم للعميل
        setIsLocationSet(true);
        // نخزن اللينك في متغير مخفي أو ندمجه عند الإرسال
        window.tempMapUrl = mapUrl; 
        alert("📍 تم تحديد موقعك: " + addressName);
      }, () => {
        alert("يرجى تفعيل الـ GPS لتحديد موقعك.");
      });
    }
  };

  const sendWhatsAppOrder = () => {
    if (!pickupLocation || !destination) {
      alert("يرجى إدخال موقع الانطلاق والوصول!");
      return;
    }
    const myNumber = "201029472254"; 
    const finalPickup = isLocationSet ? `${pickupLocation} | اللينك: ${window.tempMapUrl}` : pickupLocation;
    
    const message = `🚀 *طلب توصيل شخصي جديد* %0A%0A` +
                    `📍 *من:* ${finalPickup} %0A` +
                    `🏁 *إلى:* ${destination} %0A%0A` +
                    `تم إرسال الطلب عبر تطبيق طلباتك`;
    window.open(`https://wa.me/${myNumber}?text=${message}`, '_blank');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if ((activeCategory === 'RESTAURANTS' || activeCategory === 'SWEETS') && !vendorId) {
          const { data, error } = await supabase
            .from('Vendors')
            .select('*')
            .eq('category', activeCategory);
          if (error) throw error;
          setVendors(data || []);
        } 
        else if (activeCategory !== 'PERSONAL_DELIVERY') {
          let query = supabase.from('Products').select('*');
          if (vendorId) {
            query = query.eq('vendor_id', vendorId);
          } else if (activeCategory !== 'ALL') {
            query = query.eq('category', activeCategory);
          }
          const { data, error } = await query.order('id', { ascending: false });
          if (error) throw error;
          setProducts(data || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeCategory, vendorId]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      <Hero products={products.slice(0, 5)} />

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col mb-8 md:mb-12 text-right items-end border-r-4 border-orange-500 pr-4">
          <h2 className="text-2xl md:text-5xl font-black italic tracking-tighter uppercase text-white">
            {categoryNames[activeCategory]} <span className="text-orange-500">طلباتك</span>
          </h2>
        </div>

        <CategoryFilter 
          activeCategory={activeCategory} 
          onFilterChange={(cat) => {
            setSearchParams({ category: cat });
            setVendors([]);
          }} 
        />

        {activeCategory === 'PERSONAL_DELIVERY' ? (
          <div className="max-w-2xl mx-auto bg-zinc-900/60 p-6 md:p-8 rounded-[2rem] border border-white/5 shadow-2xl mt-10 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center rotate-3 shadow-lg shadow-orange-500/20">
                <Truck className="text-black" size={24} />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black italic">توصيل <span className="text-orange-500">طلب شخصي</span></h3>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">من مكان لمكان داخل العريش</p>
              </div>
            </div>

            <div className="space-y-4 md:space-y-6">
              <div className="relative">
                <label className="block text-zinc-300 text-xs font-bold mb-2 mr-2">هناخد الطلب منين؟</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={pickupLocation}
                    onChange={(e) => { setPickupLocation(e.target.value); setIsLocationSet(false); }}
                    placeholder="اكتب العنوان أو استخدم الموقع"
                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all pl-28 text-sm text-right"
                  />
                  <button 
                    onClick={handleGetCurrentLocation}
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-orange-500 text-black px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-white transition-all"
                  >
                    <MapPin size={12} /> لوكيشن
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 text-xs font-bold mb-2 mr-2">هيوصل لفين؟</label>
                <input 
                  type="text" 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="اكتب وجهة التوصيل بالتفصيل"
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all text-sm text-right"
                />
              </div>

              <button 
                onClick={sendWhatsAppOrder}
                className="w-full bg-orange-500 text-black font-black py-4 rounded-xl hover:bg-white transition-all shadow-xl shadow-orange-500/10 flex items-center justify-center gap-3 text-lg italic"
              >
                <MessageCircle size={20} /> تأكيد طلب التوصيل
              </button>
            </div>
          </div>
        ) : (activeCategory === 'RESTAURANTS' || activeCategory === 'SWEETS') && !vendorId ? (
          /* تعديل: كروت المحلات الآن أصغر (نصف الحجم) وعددها 2 في الموبايل و 4 في الشاشات الكبيرة */
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 mt-10">
            {vendors.map((vendor) => (
              <div 
                key={vendor.id} 
                onClick={() => setSearchParams({ category: activeCategory, vendorId: vendor.id })} 
                className="relative h-32 md:h-44 rounded-2xl overflow-hidden cursor-pointer group border border-white/5 hover:border-orange-500 transition-all duration-300"
              >
                <img 
                  src={getImageUrl(vendor.image_url)} 
                  alt={vendor.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                
                <div className="absolute inset-0 p-3 flex flex-col justify-end text-right">
                  <h3 className="text-xs md:text-sm font-black italic text-white group-hover:text-orange-500 transition-colors">
                    {vendor.name}
                  </h3>
                  <p className="text-orange-500 text-[8px] md:text-[10px] font-bold flex items-center justify-end gap-1">
                    المنيو <ArrowRight size={10} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10">
            {vendorId && (
              <button 
                onClick={() => setSearchParams({ category: activeCategory })} 
                className="mb-6 bg-orange-500 text-black px-5 py-2 rounded-full text-xs font-black hover:bg-white transition-all flex items-center gap-2"
              >
                ← العودة للمحلات
              </button>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </div>
        )}
      </div>

      <footer className="py-10 border-t border-white/5 text-center mt-20 bg-zinc-950">
        <p className="text-white text-[10px] font-black tracking-[0.3em] uppercase">
          Developed By <span className="text-orange-500">Abdullah Hassan</span> <br/>
          <span className="text-zinc-600">Talabatak © 2026</span>
        </p>
      </footer>
    </div>
  );
};

export default Home;