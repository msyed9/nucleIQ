import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Store.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const StockManager: React.FC = () => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('token');
            const tenantId = localStorage.getItem('current_tenant');
            const response = await axios.get(`${API_BASE_URL}/inventory/items/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'X-Tenant-ID': tenantId || ''
                }
            });
            setItems(response.data);
        } catch (error) {
            console.error("Error fetching inventory", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="store-container">
            <h1>📦 Inventory Stock Manager</h1>
            <p>Manage items, track stock levels, and update prices.</p>

            {loading ? (
                <p>Loading inventory...</p>
            ) : (
                <table className="stock-table">
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Item Name</th>
                            <th>Category</th>
                            <th>Stock Level</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id}>
                                <td>{item.sku || '-'}</td>
                                <td>{item.name}</td>
                                <td>{item.category_name || 'General'}</td>
                                <td className={item.current_stock < item.low_stock_threshold ? 'stock-status-low' : ''}>
                                    {item.current_stock}
                                </td>
                                <td>₹{item.price}</td>
                                <td>
                                    <span className={`badge ${item.is_sellable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {item.is_sellable ? 'Store Active' : 'Internal'}
                                    </span>
                                </td>
                                <td>
                                    <button className="btn-sm btn-outline">Edit</button>
                                    <button className="btn-sm btn-outline ml-2">Adjust Stock</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default StockManager;
