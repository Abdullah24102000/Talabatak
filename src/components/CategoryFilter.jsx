import React from 'react';

const CategoryFilter = ({ activeCategory, onFilterChange }) => {
    const lang = localStorage.getItem('lang') || 'ar'; 

    const categories = [
        { id: 'ALL', ar: '🏠 الرئيسية', en: 'Home' },
        { id: 'RESTAURANTS', ar: '🍔 المطاعم', en: 'Food' },
        { id: 'SWEETS', ar: '🍰 الحلويات', en: 'Sweets' },
        { id: 'SUPERMARKET', ar: '🛒 الماركت', en: 'Market' },
        { id: 'VEGETABLES', ar: '🥦 خضروات', en: 'Veggie' }, // القسم الجديد
        { id: 'PERSONAL_DELIVERY', ar: '🚀 سكوتر', en: 'Scooter' }
    ];

    return (
        <div className="sticky top-0 z-[100] bg-black/80 backdrop-blur-lg border-b border-white/5 mb-8 -mx-4 px-4 overflow-x-auto no-scrollbar">
            <div 
                className="flex items-center justify-start md:justify-center gap-2 py-4 min-w-max" 
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => onFilterChange(cat.id)}
                        className={`px-5 py-2.5 rounded-2xl text-[12px] md:text-[14px] font-black uppercase tracking-tighter transition-all relative
                        ${activeCategory === cat.id 
                            ? 'text-orange-500 bg-orange-500/10' 
                            : 'text-zinc-500 hover:text-white'}`}
                    >
                        {lang === 'ar' ? cat.ar : cat.en}
                        {activeCategory === cat.id && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full"></span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CategoryFilter;