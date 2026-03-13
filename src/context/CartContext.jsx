import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('talabatak_cart');
        try { return saved ? JSON.parse(saved) : []; } catch { return []; }
    });

    useEffect(() => {
        localStorage.setItem('talabatak_cart', JSON.stringify(cart));
    }, [cart]);

    // --- التعديل هنا: إضافة دالة مسح السلة ---
    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('talabatak_cart');
    };

    const subtotal = cart.reduce((acc, item) => {
        const price = typeof item.Price === 'string' 
            ? parseFloat(item.Price.replace(/[^\d.]/g, '')) 
            : item.Price;
        return acc + (price * (item.quantity || 1));
    }, 0);

    const addToCart = (product) => {
        setCart(prev => {
            const exists = prev.find(item => item.id === product.id);
            if (exists) {
                return prev.map(item => 
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));
    
    const updateQuantity = (id, amount) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) return { ...item, quantity: Math.max(1, item.quantity + amount) };
            return item;
        }));
    };

    return (
        // --- التعديل هنا: ضفنا clearCart جوه الـ value ---
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, subtotal, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);