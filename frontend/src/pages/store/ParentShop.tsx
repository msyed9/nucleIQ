import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../inventory/Store.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const ParentShop: React.FC = () => {
    const [items, setItems] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStoreItems();
    }, []);

    const fetchStoreItems = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/inventory/items/?is_sellable=true`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setItems(response.data);
        } catch (error) {
            console.error("Error fetching store items", error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (item: any) => {
        const existing = cart.find(c => c.item.id === item.id);
        if (existing) {
            setCart(cart.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c));
        } else {
            setCart([...cart, { item, qty: 1 }]);
        }
        setIsCartOpen(true);
    };

    const calculateTotal = () => {
        return cart.reduce((sum, c) => sum + (c.item.price * c.qty), 0);
    };

    const checkout = async () => {
        // Placeholder for checkout logic
        alert(`Checkout Total: ₹${calculateTotal()}. Payment integration coming in Phase 5.`);
    };

    if (loading) return <div className="p-10 text-center">Loading store items...</div>;

    return (
        <div className="store-container">
            <div className="flex justify-between items-center mb-6">
                <h1>🛍️ School Store</h1>
                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold"
                    onClick={() => setIsCartOpen(!isCartOpen)}
                >
                    🛒 Cart ({cart.reduce((s, c) => s + c.qty, 0)})
                </button>
            </div>

            <div className="item-grid">
                {items.map((item) => (
                    <div key={item.id} className="item-card">
                        <div className="item-image" style={{ backgroundImage: `url(${item.image || 'https://via.placeholder.com/300'})` }}></div>
                        <div className="item-details">
                            <span className="item-category">{item.category_name || 'General'}</span>
                            <h3>{item.name}</h3>
                            <p className="item-price">₹{item.price}</p>
                            <button
                                className="add-to-cart-btn"
                                onClick={() => addToCart(item)}
                                disabled={item.current_stock <= 0}
                            >
                                {item.current_stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Cart Sidebar */}
            <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                    <h2>Your Cart</h2>
                    <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-red-500">✕</button>
                </div>

                {cart.length === 0 ? (
                    <p className="text-gray-500 text-center mt-10">Your cart is empty.</p>
                ) : (
                    <>
                        <div className="cart-items">
                            {cart.map((line, idx) => (
                                <div key={idx} className="cart-item">
                                    <div>
                                        <div className="font-bold">{line.item.name}</div>
                                        <div className="text-sm text-gray-500">₹{line.item.price} x {line.qty}</div>
                                    </div>
                                    <div className="font-bold">₹{line.item.price * line.qty}</div>
                                </div>
                            ))}
                        </div>
                        <div className="cart-total">
                            Total: ₹{calculateTotal()}
                        </div>
                        <button className="checkout-btn" onClick={checkout}>
                            Proceed to Checkout
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ParentShop;
