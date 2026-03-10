import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingCart, ArrowRight, ArrowLeft } from 'lucide-react';

const Hero = ({ products }) => {
    const { addToCart } = useCart();
    const [currentIndex, setCurrentIndex] = useState(0);

    // جلب اللغة الحالية
    const lang = localStorage.getItem('lang') || 'ar'; // الافتراضي عربي

    // فلترة المنتجات التي عليها خصومات فقط لعرضها في السلايدر
    const saleProducts = products.filter(p => p.oldPrice && p.oldPrice > p.Price);

    useEffect(() => {
        if (saleProducts.length <= 1) return;
        const interval = setInterval(() => {
            handleNext();
        }, 5000);
        return () => clearInterval(interval);
    }, [saleProducts.length, currentIndex]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % saleProducts.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + saleProducts.length) % saleProducts.length);
    };

    if (saleProducts.length === 0) return null;

    const current = saleProducts[currentIndex];

    return (
        <div className="relative w-full bg-black overflow-hidden py-6 md:py-12 border-b border-white/5" dir="rtl">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-6 md:gap-10">

                {/* المحتوى النصي - اليمين */}
                <div className="flex-1 text-right space-y-4 z-10">
                    <div className="inline-block bg-orange-500 text-black px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                        {lang === 'en' ? 'Limited Offer' : 'عرض محدود لفترة وجيزة'}
                    </div>
                    
                    <h1 className="text-4xl md:text-7xl font-black italic tracking-tighter leading-none text-white uppercase">
                        {lang === 'en' ? (
                            <>SPECIAL <br /> <span className="text-orange-500">OFFER</span></>
                        ) : (
                            <>أقوى <br /> <span className="text-orange-500">العروض</span></>
                        )}
                    </h1>

                    <p className="text-zinc-400 text-sm md:text-base font-medium max-w-sm">
                        {lang === 'en' 
                            ? `Don't miss the chance to get ${current.Name} at a special price.`
                            : `لا تفوت فرصة الحصول على ${current.Name} بسعر خاص جداً لفترة محدودة.`
                        }
                    </p>

                    <div className="flex items-center gap-3">
                        <div className="text-2xl md:text-5xl font-black text-white">{current.Price} EGP</div>
                        <div className="text-lg md:text-xl text-zinc-600 line-through decoration-orange-500 font-bold">{current.oldPrice} EGP</div>
                    </div>

                    <button
                        onClick={() => addToCart(current)}
                        className="group flex items-center gap-3 bg-orange-500 text-black px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-white transition-all duration-300 cursor-pointer border-none shadow-xl shadow-orange-500/10"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        {lang === 'en' ? 'Add to Cart' : 'أضف للطلب الآن'}
                    </button>
                </div>

                {/* صورة المنتج - اليسار */}
                <div className="flex-1 relative flex justify-center items-center mt-4 md:mt-0">
                    {/* هالة ضوئية برتقالية خلف المنتج */}
                    <div className="absolute w-48 h-48 md:w-[400px] md:h-[400px] bg-orange-500/10 rounded-full blur-[100px]"></div>
                    
                    <div className="relative z-10 p-2 bg-gradient-to-br from-orange-500/20 to-transparent rounded-[2.5rem]">
                        <img
                            key={current.id}
                            src={Array.isArray(current.ImgUrl) ? current.ImgUrl[0] : current.ImgUrl}
                            alt={current.Name}
                            className="w-full max-w-[250px] md:max-w-[450px] h-[300px] md:h-[480px] object-cover rounded-[2rem] shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-700 animate-in fade-in zoom-in-95"
                        />
                    </div>
                    
                    {/* شارة الخصم فوق الصورة */}
                    <div className="absolute top-0 right-0 md:right-10 bg-white text-black w-16 h-16 md:w-20 md:h-20 rounded-full flex flex-col items-center justify-center rotate-12 z-20 border-4 border-black font-black italic">
                        <span className="text-[10px] uppercase">Save</span>
                        <span className="text-lg">-{Math.round(((current.oldPrice - current.Price) / current.oldPrice) * 100)}%</span>
                    </div>
                </div>

            </div>

            {/* أزرار التحكم بالسلايدر */}
            <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 flex gap-4 z-20" dir="ltr">
                <button
                    onClick={handlePrev}
                    className="p-3 border border-white/10 rounded-2xl text-white hover:bg-orange-500 hover:text-black transition-all cursor-pointer bg-black/50 backdrop-blur-sm"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={handleNext}
                    className="p-3 border border-white/10 rounded-2xl text-white hover:bg-orange-500 hover:text-black transition-all cursor-pointer bg-black/50 backdrop-blur-sm"
                >
                    <ArrowRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default Hero;