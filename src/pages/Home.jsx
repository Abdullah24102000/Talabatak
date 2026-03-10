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
    'PERSONAL_DELIVERY': 'توصيل سكوتر'
  };

  // دالة لمعالجة رابط الصورة (لحذف الأقواس المربعة إذا وجدت)
  const getImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1517248135467-4c7ed9d42c7b?q=80&w=800';
    if (Array.isArray(url)) return url[0];
    if (typeof url === 'string' && url.startsWith('[')) {
      try {
        const parsed = JSON.parse(url);
        return Array.isArray(parsed) ? parsed[0] : url;
      } catch (e) {
        return url.replace(/[\[\]"]/g, ''); // تنظيف يدوي في حالة فشل الـ Parse
      }
    }
    return url;
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setPickupLocation(mapUrl);
        setIsLocationSet(true);
        alert("📍 تم تحديد موقعك بنجاح!");
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
    const message = `🚀 *طلب توصيل سكوتر جديد* %0A%0A` +
                    `📍 *نقطة الانطلاق:* ${pickupLocation} %0A` +
                    `🏁 *نقطة الوصول:* ${destination} %0A%0A` +
                    `تم إرسال الطلب عبر تطبيق طلباتك`;
    window.open(`https://wa.me/${myNumber}?text=${message}`, '_blank');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. جلب المحلات (مطاعم أو حلويات) بناءً على القسم المختار
        if ((activeCategory === 'RESTAURANTS' || activeCategory === 'SWEETS') && !vendorId) {
          const { data, error } = await supabase
            .from('Vendors')
            .select('*')
            .eq('category', activeCategory);
          
          if (error) throw error;
          setVendors(data || []);
        } 
        // 2. جلب المنتجات (الكل، أو منيو محل محدد، أو قسم الحلويات المباشر)
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

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col mb-12 text-right items-end">
          <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase text-white">
            {categoryNames[activeCategory]} <span className="text-orange-500">طلباتك</span>
          </h2>
          <div className="w-20 h-1.5 bg-orange-500 mt-4"></div>
        </div>

        <CategoryFilter 
          activeCategory={activeCategory} 
          onFilterChange={(cat) => {
            setSearchParams({ category: cat });
            setVendors([]); // تصفير المحلات عند تغيير القسم
          }} 
        />

        {activeCategory === 'PERSONAL_DELIVERY' ? (
          <div className="max-w-2xl mx-auto bg-zinc-900/60 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl mt-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center rotate-3 shadow-lg shadow-orange-500/20">
                <Truck className="text-black" size={30} />
              </div>
              <div>
                <h3 className="text-2xl font-black italic">طلب <span className="text-orange-500">سكوتر</span></h3>
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">توصيل سريع وفوري</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-zinc-300 text-sm font-bold mb-3 mr-2">منين هنحملك؟</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={isLocationSet ? "📍 تم تحديد موقعك (جوجل ماب)" : pickupLocation}
                    onChange={(e) => { setPickupLocation(e.target.value); setIsLocationSet(false); }}
                    placeholder="اكتب العنوان أو حدد موقعك"
                    className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white focus:border-orange-500 outline-none transition-all pl-32 text-right"
                  />
                  <button 
                    onClick={handleGetCurrentLocation}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-orange-500 text-black px-3 py-2 rounded-xl text-[10px] font-black hover:bg-white transition-all"
                  >
                    <MapPin size={14} /> تحديد موقعي
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 text-sm font-bold mb-3 mr-2">رايح فين؟</label>
                <input 
                  type="text" 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="اكتب وجهتك بالتفصيل"
                  className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white focus:border-orange-500 outline-none transition-all text-right"
                />
              </div>

              <button 
                onClick={sendWhatsAppOrder}
                className="w-full bg-orange-500 text-black font-black py-6 rounded-[1.5rem] hover:bg-white transition-all shadow-xl shadow-orange-500/10 flex items-center justify-center gap-3 text-lg italic"
              >
                <MessageCircle size={24} /> إرسال الطلب عبر الواتساب
              </button>
            </div>
          </div>
        ) : (activeCategory === 'RESTAURANTS' || activeCategory === 'SWEETS') && !vendorId ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {vendors.length === 0 ? (
              <div className="col-span-full text-center py-20 text-zinc-500 font-bold">لا توجد محلات في هذا القسم حالياً</div>
            ) : (
              vendors.map((vendor) => (
                <div 
                  key={vendor.id} 
                  onClick={() => setSearchParams({ category: activeCategory, vendorId: vendor.id })} 
                  className="relative h-80 rounded-[2.5rem] overflow-hidden cursor-pointer group border border-white/5 hover:border-orange-500 transition-all duration-500 shadow-2xl"
                >
                  <div className="absolute inset-0">
                    <img 
                      src={getImageUrl(vendor.image_url)} 
                      alt={vendor.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      onError={(e) => { 
                        e.target.src = activeCategory === 'SWEETS' 
                          ? 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800' 
                          : 'https://images.unsplash.com/photo-1517248135467-4c7ed9d42c7b?q=80&w=800'; 
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                  </div>

                  <div className="absolute inset-0 p-8 flex flex-col justify-end text-right">
                    <div className="flex items-center gap-2 mb-2">
                       {activeCategory === 'SWEETS' ? <IceCream className="text-orange-500" size={24}/> : <Utensils className="text-orange-500" size={24}/>}
                       <h3 className="text-3xl font-black italic text-white group-hover:text-orange-500 transition-colors">
                        {vendor.name}
                      </h3>
                    </div>
                    <p className="text-orange-500 font-bold flex items-center gap-2">
                      عرض المنيو <ArrowRight size={18} />
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="mt-10">
            {vendorId && (
              <button 
                onClick={() => setSearchParams({ category: activeCategory })} 
                className="mb-8 bg-orange-500 text-black px-6 py-2 rounded-full text-sm font-bold hover:bg-white transition-all flex items-center gap-2 shadow-lg"
              >
                ← العودة للقائمة
              </button>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
              {products.length > 0 ? (
                products.map((product) => <ProductCard key={product.id} product={product} />)
              ) : (
                <div className="col-span-full text-center py-20 text-zinc-500 font-bold">لا توجد منتجات متاحة حالياً</div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="py-10 border-t border-white/5 text-center mt-20 bg-zinc-950">
        <p className="text-white text-[10px] font-black tracking-[0.5em] uppercase leading-relaxed">
          Developed By <a href="https://react-portf-abdallah.vercel.app/" target="_blank" rel="noreferrer" className="text-orange-500 no-underline">Abdullah Hassan</a> <br/>
          <span className="text-zinc-600">Talabatak © 2026</span>
        </p>
      </footer>
    </div>
  );
};

export default Home;