import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RouteOptimization.css';

interface Route {
    id: number;
    name: string;
    vehicle?: {
        id: number;
        vehicle_number: string;
        model: string;
        capacity: number;
    };
    driver?: {
        id: number;
        name: string;
    };
    start_time?: string;
    stops: Stop[];
}

interface Stop {
    id: number;
    name: string;
    order: number;
    pickup_time?: string;
    drop_time?: string;
    monthly_fare: number;
    student_count?: number;
}

interface Vehicle {
    id: number;
    vehicle_number: string;
    model: string;
    capacity: number;
    is_active: boolean;
}

interface Driver {
    id: number;
    staff_name: string;
    license_number: string;
}

const RouteOptimization: React.FC = () => {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showStopModal, setShowStopModal] = useState(false);

    const [newRoute, setNewRoute] = useState({
        name: '',
        vehicle_id: 0,
        driver_id: 0,
        start_time: '',
    });

    const [newStop, setNewStop] = useState({
        name: '',
        order: 1,
        pickup_time: '',
        drop_time: '',
        monthly_fare: 0,
    });

    useEffect(() => {
        fetchRoutes();
        fetchVehicles();
        fetchDrivers();
    }, []);

    const fetchRoutes = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/transport/routes/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoutes(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching routes:', err);
        }
    };

    const fetchVehicles = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/transport/vehicles/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVehicles(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching vehicles:', err);
        }
    };

    const fetchDrivers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/transport/drivers/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDrivers(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching drivers:', err);
        }
    };

    const handleCreateRoute = async () => {
        if (!newRoute.name.trim()) {
            setError('Please enter route name');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/transport/routes/', {
                name: newRoute.name,
                vehicle: newRoute.vehicle_id || null,
                driver: newRoute.driver_id || null,
                start_time: newRoute.start_time || null,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Route created successfully!');
            setShowCreateModal(false);
            setNewRoute({ name: '', vehicle_id: 0, driver_id: 0, start_time: '' });
            fetchRoutes();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create route');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStop = async () => {
        if (!selectedRoute) return;
        if (!newStop.name.trim()) {
            setError('Please enter stop name');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/transport/stops/', {
                route: selectedRoute.id,
                name: newStop.name,
                order: newStop.order,
                pickup_time: newStop.pickup_time || null,
                drop_time: newStop.drop_time || null,
                monthly_fare: newStop.monthly_fare,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Stop added successfully!');
            setShowStopModal(false);
            setNewStop({ name: '', order: 1, pickup_time: '', drop_time: '', monthly_fare: 0 });
            fetchRoutes();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add stop');
        } finally {
            setLoading(false);
        }
    };

    const handleOptimizeRoute = async (routeId: number) => {
        if (!confirm('Optimize this route? This will reorder stops based on efficiency.')) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/transport/routes/${routeId}/optimize/`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Route optimized successfully!');
            fetchRoutes();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to optimize route');
        } finally {
            setLoading(false);
        }
    };

    const getTotalStudents = (route: Route): number => {
        return route.stops.reduce((sum, stop) => sum + (stop.student_count || 0), 0);
    };

    const getTotalRevenue = (route: Route): number => {
        return route.stops.reduce((sum, stop) => sum + (stop.monthly_fare * (stop.student_count || 0)), 0);
    };

    const getCapacityUtilization = (route: Route): number => {
        if (!route.vehicle) return 0;
        const totalStudents = getTotalStudents(route);
        return (totalStudents / route.vehicle.capacity) * 100;
    };

    return (
        <div className="route-optimization">
            <div className="optimization-header">
                <div>
                    <h1>🚌 Transport Route Optimization</h1>
                    <p>Manage routes, stops, and optimize transport efficiency</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    ➕ Create New Route
                </button>
            </div>

            {success && (
                <div className="alert alert-success">
                    <span className="icon">✅</span>
                    {success}
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <span className="icon">⚠️</span>
                    {error}
                </div>
            )}

            {/* Routes Grid */}
            <div className="routes-grid">
                {routes.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🚌</div>
                        <h3>No Routes Found</h3>
                        <p>Create your first transport route to get started</p>
                    </div>
                ) : (
                    routes.map(route => {
                        const totalStudents = getTotalStudents(route);
                        const totalRevenue = getTotalRevenue(route);
                        const utilization = getCapacityUtilization(route);

                        return (
                            <div key={route.id} className="route-card">
                                <div className="route-header">
                                    <h3>{route.name}</h3>
                                    {route.vehicle && (
                                        <span className="vehicle-badge">
                                            🚌 {route.vehicle.vehicle_number}
                                        </span>
                                    )}
                                </div>

                                <div className="route-details">
                                    {route.vehicle && (
                                        <div className="detail-row">
                                            <span className="icon">🚐</span>
                                            <span>{route.vehicle.model} (Capacity: {route.vehicle.capacity})</span>
                                        </div>
                                    )}
                                    {route.driver && (
                                        <div className="detail-row">
                                            <span className="icon">👨‍✈️</span>
                                            <span>{route.driver.name}</span>
                                        </div>
                                    )}
                                    {route.start_time && (
                                        <div className="detail-row">
                                            <span className="icon">⏰</span>
                                            <span>Start Time: {route.start_time}</span>
                                        </div>
                                    )}
                                    <div className="detail-row">
                                        <span className="icon">📍</span>
                                        <span>{route.stops.length} Stops</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="icon">👥</span>
                                        <span>{totalStudents} Students</span>
                                    </div>
                                </div>

                                {/* Capacity Utilization */}
                                {route.vehicle && (
                                    <div className="utilization-section">
                                        <div className="utilization-header">
                                            <span>Capacity Utilization</span>
                                            <span className={utilization > 90 ? 'warning' : ''}>{utilization.toFixed(0)}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className={`progress-fill ${utilization > 90 ? 'warning' : ''}`}
                                                style={{ width: `${Math.min(utilization, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Revenue */}
                                <div className="revenue-section">
                                    <span className="label">Monthly Revenue:</span>
                                    <span className="value">₹{totalRevenue.toLocaleString()}</span>
                                </div>

                                {/* Stops List */}
                                <div className="stops-section">
                                    <h4>📍 Stops ({route.stops.length})</h4>
                                    <div className="stops-list">
                                        {route.stops.map(stop => (
                                            <div key={stop.id} className="stop-item">
                                                <div className="stop-number">{stop.order}</div>
                                                <div className="stop-details">
                                                    <div className="stop-name">{stop.name}</div>
                                                    <div className="stop-info">
                                                        {stop.pickup_time && <span>🕐 {stop.pickup_time}</span>}
                                                        <span>💰 ₹{stop.monthly_fare}</span>
                                                        {stop.student_count && <span>👥 {stop.student_count}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="route-actions">
                                    <button
                                        className="btn btn-optimize"
                                        onClick={() => handleOptimizeRoute(route.id)}
                                    >
                                        ⚡ Optimize
                                    </button>
                                    <button
                                        className="btn btn-add-stop"
                                        onClick={() => {
                                            setSelectedRoute(route);
                                            setNewStop({ ...newStop, order: route.stops.length + 1 });
                                            setShowStopModal(true);
                                        }}
                                    >
                                        ➕ Add Stop
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create Route Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🚌 Create New Route</h2>
                            <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Route Name *</label>
                                <input
                                    type="text"
                                    value={newRoute.name}
                                    onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                                    placeholder="e.g., Route 5 - North Zone"
                                    className="form-control"
                                />
                            </div>

                            <div className="form-group">
                                <label>Assign Vehicle</label>
                                <select
                                    value={newRoute.vehicle_id}
                                    onChange={(e) => setNewRoute({ ...newRoute, vehicle_id: Number(e.target.value) })}
                                    className="form-control"
                                >
                                    <option value="">-- Select Vehicle --</option>
                                    {vehicles.filter(v => v.is_active).map(vehicle => (
                                        <option key={vehicle.id} value={vehicle.id}>
                                            {vehicle.vehicle_number} - {vehicle.model} (Capacity: {vehicle.capacity})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Assign Driver</label>
                                <select
                                    value={newRoute.driver_id}
                                    onChange={(e) => setNewRoute({ ...newRoute, driver_id: Number(e.target.value) })}
                                    className="form-control"
                                >
                                    <option value="">-- Select Driver --</option>
                                    {drivers.map(driver => (
                                        <option key={driver.id} value={driver.id}>
                                            {driver.staff_name} - {driver.license_number}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Start Time</label>
                                <input
                                    type="time"
                                    value={newRoute.start_time}
                                    onChange={(e) => setNewRoute({ ...newRoute, start_time: e.target.value })}
                                    className="form-control"
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowCreateModal(false)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleCreateRoute}
                                disabled={loading}
                            >
                                {loading ? '⏳ Creating...' : '✅ Create Route'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Stop Modal */}
            {showStopModal && selectedRoute && (
                <div className="modal-overlay" onClick={() => setShowStopModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📍 Add Stop to {selectedRoute.name}</h2>
                            <button className="close-btn" onClick={() => setShowStopModal(false)}>
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Stop Name *</label>
                                <input
                                    type="text"
                                    value={newStop.name}
                                    onChange={(e) => setNewStop({ ...newStop, name: e.target.value })}
                                    placeholder="e.g., Main Market"
                                    className="form-control"
                                />
                            </div>

                            <div className="form-group">
                                <label>Order/Sequence *</label>
                                <input
                                    type="number"
                                    value={newStop.order}
                                    onChange={(e) => setNewStop({ ...newStop, order: Number(e.target.value) })}
                                    min="1"
                                    className="form-control"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Pickup Time</label>
                                    <input
                                        type="time"
                                        value={newStop.pickup_time}
                                        onChange={(e) => setNewStop({ ...newStop, pickup_time: e.target.value })}
                                        className="form-control"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Drop Time</label>
                                    <input
                                        type="time"
                                        value={newStop.drop_time}
                                        onChange={(e) => setNewStop({ ...newStop, drop_time: e.target.value })}
                                        className="form-control"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Monthly Fare (₹) *</label>
                                <input
                                    type="number"
                                    value={newStop.monthly_fare}
                                    onChange={(e) => setNewStop({ ...newStop, monthly_fare: Number(e.target.value) })}
                                    min="0"
                                    placeholder="e.g., 500"
                                    className="form-control"
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowStopModal(false)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddStop}
                                disabled={loading}
                            >
                                {loading ? '⏳ Adding...' : '✅ Add Stop'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RouteOptimization;
