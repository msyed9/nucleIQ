import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const TransportFleet: React.FC = () => {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('access_token') || localStorage.getItem('token');
                const tenantId = localStorage.getItem('current_tenant');
                const headers = {
                    Authorization: `Bearer ${token}`,
                    'X-Tenant-ID': tenantId || ''
                };

                const [vehRes, routeRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/transport/vehicles/`, { headers }),
                    axios.get(`${API_BASE_URL}/transport/routes/`, { headers })
                ]);
                setVehicles(vehRes.data.results || vehRes.data);
                setRoutes(routeRes.data.results || routeRes.data);
            } catch (err) {
                console.error("Error fetching transport data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">🚛 Transport Fleet Management</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Vehicles Section */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Vehicles</h2>
                    {loading ? <p>Loading...</p> : (
                        <div className="space-y-4">
                            {vehicles.map(v => (
                                <div key={v.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                                    <div>
                                        <p className="font-bold">{v.vehicle_number}</p>
                                        <p className="text-sm text-gray-500">{v.model} ({v.capacity} seats)</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${v.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {v.status}
                                    </span>
                                </div>
                            ))}
                            {vehicles.length === 0 && <p className="text-gray-400">No vehicles registered.</p>}
                        </div>
                    )}
                </div>

                {/* Routes Section */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Active Routes</h2>
                    {loading ? <p>Loading...</p> : (
                        <div className="space-y-4">
                            {routes.map(r => (
                                <div key={r.id} className="p-3 bg-gray-50 rounded border">
                                    <p className="font-bold">{r.name}</p>
                                    <p className="text-sm text-gray-500">From {r.start_point} to {r.end_point}</p>
                                </div>
                            ))}
                            {routes.length === 0 && <p className="text-gray-400">No routes defined.</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransportFleet;
