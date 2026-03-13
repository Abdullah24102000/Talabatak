import React, { useState } from 'react';
import { ShoppingBag, AlertCircle, Timer, Heart, Store, Check } from 'lucide-react';
import { useCart } from '../context/CartContext'; 
import { useWishlist } from '../context/WishlistContext'; 
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const [added, setAdded] = useState(false);
    
    const isSoldOut = product.Stock <= 0;
    const isLowStock = product.Stock > 0 && product.Stock <= 5;
    const isFavorite = isInWishlist(product.id);

    const handleFavorite = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);
    };

    const handleCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!isSoldOut && !added) {
            addToCart(product);
            setAdded(true);
            toast.success(`${product.Name} اتضاف للسلة!`, {
                style: {
                    border: '1px solid #f97316',
                    padding: '12px',
                    color: '#fff',
                    background: '#18181b',
                    borderRadius: '15px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    direction: 'rtl',
                },
                iconTheme: { primary: '#f97316', secondary: '#fff' },
            });
            setTimeout(() => setAdded(false), 2000);
        }
    };

    const getCategoryName = (catId) => {
        switch(catId) {
            case 'RESTAURANTS': return 'مطاعم';
            case 'SWEETS': return 'حلويات';
            case 'PERSONAL_DELIVERY': return 'توصيل سكوتر';
            default: return 'قسم عام';
        }
    };

    return (
        <div 
            className={`relative flex flex-col h-full bg-zinc-900/40 border rounded-[2rem] overflow-hidden group transition-all duration-500 ${added ? 'border-green-500/50' : 'border-white/5 hover:border-orange-500/30'}`} 
            dir="rtl"
        >
            {/* زر المفضلة */}
            <button 
                onClick={handleFavorite}
                type="button"
                className="absolute top-3 right-3 z-[40] p-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-white hover:scale-110 active:scale-90 transition-all cursor-pointer"
            >
                <Heart 
                    size={14} 
                    fill={isFavorite ? "#f97316" : "none"} 
                    color={isFavorite ? "#f97316" : "white"} 
                />
            </button>

            {/* النصف الأول: منطقة الصورة (مالية المكان تماماً) */}
            <div className="relative h-48 w-full overflow-hidden bg-zinc-800">
                <img
                    src={Array.isArray(product.ImgUrl) ? product.ImgUrl[0] : product.ImgUrl}
                    alt={product.Name}
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 
                    ${isSoldOut ? 'grayscale opacity-50' : ''}`}
                />

                {isSoldOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-10">
                        <div className="bg-zinc-800 text-white px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl border border-white/10 rotate-[-5deg]">
                            خلصان
                        </div>
                    </div>
                )}
            </div>

            {/* النصف الثاني: المحتوى (الوصف والسعر والزرار) */}
            <div className="flex flex-col flex-grow p-4 justify-between">
                <div>
                    <div className="flex items-center gap-1 text-zinc-500 mb-1">
                        <Store size={10} />
                        <span className="text-[9px] font-bold uppercase tracking-wider">
                            {getCategoryName(product.Category)}
                        </span>
                    </div>
                    <h3 className="text-white font-bold text-base leading-tight line-clamp-2 h-10 mb-2">
                        {product.Name}
                    </h3>

                    <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-1">
                            <span className="text-orange-500 font-black text-xl italic tracking-tighter">
                                {product.Price}
                            </span>
                            <span className="text-[9px] font-bold text-zinc-500 mt-1">جنيه</span>
                        </div>
                        
                        {isLowStock && (
                            <div className="bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-md font-black text-[8px] flex items-center gap-1 animate-pulse border border-orange-500/20">
                                <Timer size={8} />
                                باقي {product.Stock}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleCart}
                    disabled={isSoldOut || added}
                    type="button"
                    className={`w-full py-3 rounded-xl font-black text-[12px] flex items-center justify-center gap-2 transition-all border-none relative z-[40] 
                    ${isSoldOut
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : added
                        ? 'bg-green-600 text-white cursor-default'
                        : 'bg-orange-500 text-black hover:bg-white active:scale-95 shadow-lg shadow-orange-500/10 cursor-pointer'
                    }`}
                >
                    {isSoldOut ? (
                        <><AlertCircle size={14} /> غير متوفر</>
                    ) : added ? (
                        <><Check size={16} /> تم</>
                    ) : (
                        <><ShoppingBag size={14} /> أضف للطلب</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;