import React from 'react';

const CategoryFilter = ({ activeCategory, onFilterChange }) => {
    // جلب اللغة من localStorage لضمان التزامن
    const lang = localStorage.getItem('lang') || 'ar'; 

    const categories = [
        { id: 'ALL', ar: 'الكل', en: 'All' },
        { id: 'RESTAURANTS', ar: 'المطاعم', en: 'Restaurants' },
        { id: 'SWEETS', ar: 'الحلويات', en: 'Sweets' }, // استبدال السوبر ماركت بالحلويات
        { id: 'PERSONAL_DELIVERY', ar: 'توصيل سكوتر', en: 'Scooter Delivery' }
    ];

    return (
        <div 
            className="flex flex-wrap justify-center gap-3 mb-10 relative z-50" 
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
            {categories.map(cat => (
                <button 
                    key={cat.id}
                    onClick={() => onFilterChange(cat.id)}
                    className={`px-6 py-2 rounded-full text-[13px] md:text-[15px] font-black uppercase tracking-widest transition-all cursor-pointer border
                    ${activeCategory === cat.id 
                        ? 'bg-orange-500 text-black border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]' 
                        : 'bg-white/5 text-zinc-400 border-white/10 hover:border-orange-500 hover:text-white'}`}
                >
                    {lang === 'ar' ? cat.ar : cat.en}
                </button>
            ))}
        </div>
    );
};

export default CategoryFilter;