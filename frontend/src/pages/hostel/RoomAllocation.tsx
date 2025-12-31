import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RoomAllocation.css';

interface Building {
    id: number;
    name: string;
    building_type: 'BOYS' | 'GIRLS' | 'STAFF' | 'GUEST';
    warden_name?: string;
    total_rooms?: number;
    occupied_rooms?: number;
}

interface Room {
    id: number;
    room_number: string;
    floor: number;
    capacity: number;
    is_ac: boolean;
    has_attached_bathroom: boolean;
    monthly_fee: number;
    beds: Bed[];
    occupied_count?: number;
}

interface Bed {
    id: number;
    bed_number: string;
    is_occupied: boolean;
    allocation?: {
        id: number;
        student_name: string;
        student_id: number;
        start_date: string;
    };
}

interface Student {
    id: number;
    first_name: string;
    last_name: string;
    admission_number: string;
    class_name: string;
    gender: string;
}

const RoomAllocation: React.FC = () => {
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showAllocationModal, setShowAllocationModal] = useState(false);
    const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchBuildings();
        fetchStudents();
    }, []);

    useEffect(() => {
        if (selectedBuilding) {
            fetchRooms(selectedBuilding.id);
        }
    }, [selectedBuilding]);

    const fetchBuildings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/hostel/buildings/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const buildingsData = response.data.results || response.data;
            setBuildings(buildingsData);
            if (buildingsData.length > 0 && !selectedBuilding) {
                setSelectedBuilding(buildingsData[0]);
            }
        } catch (err) {
            console.error('Error fetching buildings:', err);
        }
    };

    const fetchRooms = async (buildingId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/hostel/buildings/${buildingId}/rooms/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRooms(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching rooms:', err);
        }
    };

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/students/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching students:', err);
        }
    };

    const handleAllocateBed = async () => {
        if (!selectedBed || !selectedStudent) {
            setError('Please select a student');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/hostel/allocations/', {
                student: selectedStudent,
                bed: selectedBed.id,
                start_date: new Date().toISOString().split('T')[0],
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Bed allocated successfully!');
            setShowAllocationModal(false);
            setSelectedBed(null);
            setSelectedStudent(0);
            if (selectedBuilding) {
                fetchRooms(selectedBuilding.id);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to allocate bed');
        } finally {
            setLoading(false);
        }
    };

    const handleDeallocateBed = async (allocationId: number) => {
        if (!confirm('Deallocate this bed? The student will be removed from the hostel.')) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/hostel/allocations/${allocationId}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Bed deallocated successfully!');
            if (selectedBuilding) {
                fetchRooms(selectedBuilding.id);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to deallocate bed');
        } finally {
            setLoading(false);
        }
    };

    const getOccupancyRate = (building: Building): number => {
        if (!building.total_rooms) return 0;
        return ((building.occupied_rooms || 0) / building.total_rooms) * 100;
    };

    const getRoomOccupancy = (room: Room): number => {
        const occupied = room.beds.filter(b => b.is_occupied).length;
        return (occupied / room.capacity) * 100;
    };

    const filteredStudents = students.filter(student => {
        const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase()) ||
            student.admission_number.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const buildingTypeColors: { [key: string]: string } = {
        'BOYS': '#3b82f6',
        'GIRLS': '#ec4899',
        'STAFF': '#8b5cf6',
        'GUEST': '#f59e0b',
    };

    return (
        <div className="room-allocation">
            <div className="allocation-header">
                <h1>🏠 Hostel Room Allocation</h1>
                <p>Manage hostel buildings, rooms, and bed allocations</p>
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

            {/* Buildings Overview */}
            <div className="buildings-grid">
                {buildings.map(building => {
                    const occupancy = getOccupancyRate(building);
                    return (
                        <div
                            key={building.id}
                            className={`building-card ${selectedBuilding?.id === building.id ? 'active' : ''}`}
                            onClick={() => setSelectedBuilding(building)}
                        >
                            <div className="building-header">
                                <h3>{building.name}</h3>
                                <span
                                    className="type-badge"
                                    style={{ background: buildingTypeColors[building.building_type] }}
                                >
                                    {building.building_type}
                                </span>
                            </div>
                            {building.warden_name && (
                                <div className="warden-info">
                                    <span className="icon">👨‍💼</span>
                                    <span>Warden: {building.warden_name}</span>
                                </div>
                            )}
                            <div className="building-stats">
                                <div className="stat">
                                    <span className="label">Rooms:</span>
                                    <span className="value">{building.total_rooms || 0}</span>
                                </div>
                                <div className="stat">
                                    <span className="label">Occupied:</span>
                                    <span className="value">{building.occupied_rooms || 0}</span>
                                </div>
                            </div>
                            <div className="occupancy-bar">
                                <div
                                    className={`occupancy-fill ${occupancy > 90 ? 'warning' : ''}`}
                                    style={{ width: `${occupancy}%` }}
                                />
                            </div>
                            <div className="occupancy-label">{occupancy.toFixed(0)}% Occupied</div>
                        </div>
                    );
                })}
            </div>

            {/* Rooms Grid */}
            {selectedBuilding && (
                <div className="rooms-section">
                    <h2>📐 Rooms in {selectedBuilding.name}</h2>
                    <div className="rooms-grid">
                        {rooms.length === 0 ? (
                            <div className="empty-state">
                                <p>No rooms found in this building</p>
                            </div>
                        ) : (
                            rooms.map(room => {
                                const occupancy = getRoomOccupancy(room);
                                const occupiedBeds = room.beds.filter(b => b.is_occupied).length;

                                return (
                                    <div key={room.id} className="room-card">
                                        <div className="room-header">
                                            <h3>Room {room.room_number}</h3>
                                            <div className="room-badges">
                                                {room.is_ac && <span className="feature-badge">❄️ AC</span>}
                                                {room.has_attached_bathroom && <span className="feature-badge">🚿 Bathroom</span>}
                                            </div>
                                        </div>

                                        <div className="room-info">
                                            <div className="info-item">
                                                <span className="icon">🏢</span>
                                                <span>Floor {room.floor}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="icon">🛏️</span>
                                                <span>{occupiedBeds}/{room.capacity} Beds</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="icon">💰</span>
                                                <span>₹{room.monthly_fee}/month</span>
                                            </div>
                                        </div>

                                        <div className="occupancy-section">
                                            <div className="occupancy-header">
                                                <span>Occupancy</span>
                                                <span className={occupancy === 100 ? 'full' : ''}>{occupancy.toFixed(0)}%</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div
                                                    className={`progress-fill ${occupancy === 100 ? 'full' : ''}`}
                                                    style={{ width: `${occupancy}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Beds Grid */}
                                        <div className="beds-grid">
                                            {room.beds.map(bed => (
                                                <div
                                                    key={bed.id}
                                                    className={`bed-card ${bed.is_occupied ? 'occupied' : 'available'}`}
                                                    onClick={() => {
                                                        if (!bed.is_occupied) {
                                                            setSelectedBed(bed);
                                                            setSelectedRoom(room);
                                                            setShowAllocationModal(true);
                                                        }
                                                    }}
                                                >
                                                    <div className="bed-number">{bed.bed_number}</div>
                                                    {bed.is_occupied && bed.allocation ? (
                                                        <div className="bed-details">
                                                            <div className="student-name">{bed.allocation.student_name}</div>
                                                            <button
                                                                className="btn-deallocate"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeallocateBed(bed.allocation!.id);
                                                                }}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="bed-status">Available</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Allocation Modal */}
            {showAllocationModal && selectedBed && selectedRoom && (
                <div className="modal-overlay" onClick={() => setShowAllocationModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🛏️ Allocate Bed</h2>
                            <button className="close-btn" onClick={() => setShowAllocationModal(false)}>
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="allocation-summary">
                                <h3>Room {selectedRoom.room_number} - Bed {selectedBed.bed_number}</h3>
                                <p>Monthly Fee: ₹{selectedRoom.monthly_fee}</p>
                            </div>

                            <div className="form-group">
                                <label>Search Student *</label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by name or admission number..."
                                    className="form-control"
                                />
                            </div>

                            <div className="form-group">
                                <label>Select Student *</label>
                                <div className="students-list">
                                    {filteredStudents.length === 0 ? (
                                        <div className="empty-message">No students found</div>
                                    ) : (
                                        filteredStudents.map(student => (
                                            <div
                                                key={student.id}
                                                className={`student-item ${selectedStudent === student.id ? 'selected' : ''}`}
                                                onClick={() => setSelectedStudent(student.id)}
                                            >
                                                <div className="student-info">
                                                    <div className="student-name">
                                                        {student.first_name} {student.last_name}
                                                    </div>
                                                    <div className="student-details">
                                                        {student.admission_number} • {student.class_name}
                                                    </div>
                                                </div>
                                                {selectedStudent === student.id && (
                                                    <span className="check-icon">✓</span>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowAllocationModal(false)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAllocateBed}
                                disabled={loading || !selectedStudent}
                            >
                                {loading ? '⏳ Allocating...' : '✅ Allocate Bed'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomAllocation;
