/**
 * Timetable Builder - Drag and Drop Interface
 * Allows creating and managing timetable slots with conflict detection
 */

import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import axios from 'axios';
import { useToast, ToastContainer } from '@/design-system';
import './TimetableBuilder.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Time slots configuration
const TIME_SLOTS = [
    { start: '08:00', end: '08:45', period: 1 },
    { start: '08:45', end: '09:30', period: 2 },
    { start: '09:30', end: '10:15', period: 3 },
    { start: '10:15', end: '10:30', period: 0, label: 'Break' },
    { start: '10:30', end: '11:15', period: 4 },
    { start: '11:15', end: '12:00', period: 5 },
    { start: '12:00', end: '12:45', period: 6 },
    { start: '12:45', end: '13:30', period: 0, label: 'Lunch' },
    { start: '13:30', end: '14:15', period: 7 },
    { start: '14:15', end: '15:00', period: 8 },
];

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

interface TimetableSlot {
    id?: string;
    subject: string;
    subject_name?: string;
    teacher: string;
    teacher_name?: string;
    room: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    period_number: number;
}

interface DraggableSlotProps {
    slot: TimetableSlot;
    onEdit: (slot: TimetableSlot) => void;
    onDelete: (slotId: string) => void;
}

const DraggableSlot: React.FC<DraggableSlotProps> = ({ slot, onEdit, onDelete }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'TIMETABLE_SLOT',
        item: slot,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={drag}
            className={`timetable-slot ${isDragging ? 'dragging' : ''}`}
            onClick={() => onEdit(slot)}
        >
            <div className="slot-subject">{slot.subject_name || slot.subject}</div>
            <div className="slot-teacher">{slot.teacher_name || slot.teacher}</div>
            <div className="slot-room">{slot.room}</div>
            {slot.id && (
                <button
                    className="slot-delete"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(slot.id!);
                    }}
                >
                    ×
                </button>
            )}
        </div>
    );
};

interface DroppableCellProps {
    day: string;
    timeSlot: typeof TIME_SLOTS[0];
    slot?: TimetableSlot;
    onDrop: (day: string, timeSlot: typeof TIME_SLOTS[0], item: TimetableSlot) => void;
    onEdit: (slot: TimetableSlot) => void;
    onDelete: (slotId: string) => void;
}

const DroppableCell: React.FC<DroppableCellProps> = ({
    day,
    timeSlot,
    slot,
    onDrop,
    onEdit,
    onDelete,
}) => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: 'TIMETABLE_SLOT',
        drop: (item: TimetableSlot) => onDrop(day, timeSlot, item),
        canDrop: () => timeSlot.period !== 0, // Can't drop on breaks
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }));

    if (timeSlot.period === 0) {
        return (
            <td className="break-cell" colSpan={1}>
                <span>{timeSlot.label}</span>
            </td>
        );
    }

    return (
        <td
            ref={drop}
            className={`droppable-cell ${isOver && canDrop ? 'drop-over' : ''} ${canDrop ? 'can-drop' : ''
                }`}
        >
            {slot ? (
                <DraggableSlot slot={slot} onEdit={onEdit} onDelete={onDelete} />
            ) : (
                <div className="empty-slot">+</div>
            )}
        </td>
    );
};

const TimetableBuilder: React.FC = () => {
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);

    const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');

    const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
    const [formData, setFormData] = useState({
        subject: '',
        teacher: '',
        room: '',
    });
    const { toasts, removeToast, success, error: showError, warning } = useToast();

    // Fetch initial data
    useEffect(() => {
        fetchAcademicYears();
        fetchSubjects();
        fetchTeachers();
    }, []);

    useEffect(() => {
        if (selectedAcademicYear) {
            fetchSections();
        }
    }, [selectedAcademicYear]);

    useEffect(() => {
        if (selectedSection && selectedAcademicYear) {
            fetchTimetable();
        }
    }, [selectedSection, selectedAcademicYear]);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        const tenantId = localStorage.getItem('tenant_id');
        return {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId || '',
        };
    };

    const fetchAcademicYears = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/tenants/academic-years/`, {
                headers: getAuthHeaders(),
            });
            setAcademicYears(response.data.results || response.data);

            // Auto-select active academic year
            const activeYear = (response.data.results || response.data).find((year: any) => year.is_active);
            if (activeYear) {
                setSelectedAcademicYear(activeYear.id);
            }
        } catch (err) {
            console.error('Error fetching academic years:', err);
        }
    };

    const fetchSections = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/tenants/sections/`, {
                headers: getAuthHeaders(),
            });
            setSections(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching sections:', err);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/tenants/subjects/`, {
                headers: getAuthHeaders(),
            });
            setSubjects(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching subjects:', err);
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/staff/`, {
                headers: getAuthHeaders(),
            });
            setTeachers(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching teachers:', err);
        }
    };

    const fetchTimetable = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(
                `${API_BASE_URL}/timetable/slots/?section=${selectedSection}&academic_year=${selectedAcademicYear}`,
                { headers: getAuthHeaders() }
            );
            setTimetableSlots(response.data.results || response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error fetching timetable');
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = async (day: string, timeSlot: typeof TIME_SLOTS[0], item: TimetableSlot) => {
        // Check if slot already exists at this position
        const existingSlot = timetableSlots.find(
            (s) =>
                s.day_of_week === day &&
                s.start_time === timeSlot.start &&
                s.end_time === timeSlot.end
        );

        if (existingSlot) {
            warning('A class is already scheduled at this time!');
            return;
        }

        // Prepare slot data
        const slotData = {
            ...item,
            day_of_week: day,
            start_time: timeSlot.start,
            end_time: timeSlot.end,
            period_number: timeSlot.period,
            academic_year: selectedAcademicYear,
            section: selectedSection,
        };

        try {
            setLoading(true);

            // Check availability first
            const availabilityResponse = await axios.post(
                `${API_BASE_URL}/timetable/slots/check_availability/`,
                {
                    academic_year: selectedAcademicYear,
                    day_of_week: day,
                    start_time: timeSlot.start,
                    end_time: timeSlot.end,
                    teacher_id: item.teacher,
                    room: item.room,
                    section_id: selectedSection,
                },
                { headers: getAuthHeaders() }
            );

            if (!availabilityResponse.data.is_available) {
                const conflicts: string[] = [];
                if (availabilityResponse.data.teacher_conflicts?.length > 0) {
                    conflicts.push('Teacher is already scheduled at this time');
                }
                if (availabilityResponse.data.room_conflicts?.length > 0) {
                    conflicts.push('Room is already booked at this time');
                }
                if (availabilityResponse.data.section_conflicts?.length > 0) {
                    conflicts.push('Section already has a class at this time');
                }

                warning('Conflicts detected: ' + conflicts.join(', '));
                return;
            }

            // Create the slot
            const response = await axios.post(
                `${API_BASE_URL}/timetable/slots/`,
                slotData,
                { headers: getAuthHeaders() }
            );

            setTimetableSlots([...timetableSlots, response.data]);
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error creating timetable slot');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (slot: TimetableSlot) => {
        setEditingSlot(slot);
        setFormData({
            subject: slot.subject,
            teacher: slot.teacher,
            room: slot.room,
        });
        setShowModal(true);
    };

    const handleDelete = async (slotId: string) => {
        if (!confirm('Are you sure you want to delete this slot?')) return;

        try {
            await axios.delete(`${API_BASE_URL}/timetable/slots/${slotId}/`, {
                headers: getAuthHeaders(),
            });
            setTimetableSlots(timetableSlots.filter((s) => s.id !== slotId));
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error deleting slot');
        }
    };

    const handleSaveSlot = async () => {
        if (!editingSlot) return;

        try {
            const response = await axios.patch(
                `${API_BASE_URL}/timetable/slots/${editingSlot.id}/`,
                formData,
                { headers: getAuthHeaders() }
            );

            setTimetableSlots(
                timetableSlots.map((s) => (s.id === editingSlot.id ? response.data : s))
            );
            setShowModal(false);
            setEditingSlot(null);
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error updating slot');
        }
    };

    const getSlotForCell = (day: string, timeSlot: typeof TIME_SLOTS[0]) => {
        return timetableSlots.find(
            (slot) =>
                slot.day_of_week === day &&
                slot.start_time === timeSlot.start &&
                slot.end_time === timeSlot.end
        );
    };

    return (
        <>
            <ToastContainer toasts={toasts} onDismiss={removeToast} position="top-right" />
            <DndProvider backend={HTML5Backend}>
                <div className="timetable-builder">
                    <div className="timetable-header">
                        <h1>📅 Timetable Builder</h1>
                        <p>Drag and drop to create your timetable</p>
                    </div>

                    {/* Filters */}
                    <div className="timetable-filters">
                        <div className="filter-group">
                            <label>Academic Year</label>
                            <select
                                value={selectedAcademicYear}
                                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                            >
                                <option value="">Select Academic Year</option>
                                {academicYears.map((year) => (
                                    <option key={year.id} value={year.id}>
                                        {year.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Section</label>
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                disabled={!selectedAcademicYear}
                            >
                                <option value="">Select Section</option>
                                {sections.map((section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.grade_level?.name} - {section.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Subject Palette */}
                    {selectedSection && (
                        <div className="subject-palette">
                            <h3>Subjects</h3>
                            <div className="palette-items">
                                {subjects.map((subject) => (
                                    <DraggableSlot
                                        key={subject.id}
                                        slot={{
                                            subject: subject.id,
                                            subject_name: subject.name,
                                            teacher: '',
                                            teacher_name: '',
                                            room: '',
                                            day_of_week: '',
                                            start_time: '',
                                            end_time: '',
                                            period_number: 0,
                                        }}
                                        onEdit={() => { }}
                                        onDelete={() => { }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timetable Grid */}
                    {selectedSection && (
                        <div className="timetable-grid-container">
                            {loading && <div className="loading-overlay">Loading...</div>}
                            {error && <div className="error-message">{error}</div>}

                            <table className="timetable-grid">
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        {DAYS.map((day) => (
                                            <th key={day}>{day}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {TIME_SLOTS.map((timeSlot, idx) => (
                                        <tr key={idx}>
                                            <td className="time-cell">
                                                {timeSlot.period !== 0 ? (
                                                    <>
                                                        <div className="period-number">P{timeSlot.period}</div>
                                                        <div className="time-range">
                                                            {timeSlot.start} - {timeSlot.end}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="break-label">{timeSlot.label}</div>
                                                )}
                                            </td>
                                            {DAYS.map((day) => (
                                                <DroppableCell
                                                    key={`${day}-${idx}`}
                                                    day={day}
                                                    timeSlot={timeSlot}
                                                    slot={getSlotForCell(day, timeSlot)}
                                                    onDrop={handleDrop}
                                                    onEdit={handleEdit}
                                                    onDelete={handleDelete}
                                                />
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Edit Modal */}
                    {showModal && editingSlot && (
                        <div className="modal-overlay" onClick={() => setShowModal(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <h2>Edit Timetable Slot</h2>

                                <div className="form-group">
                                    <label>Subject</label>
                                    <select
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    >
                                        {subjects.map((subject) => (
                                            <option key={subject.id} value={subject.id}>
                                                {subject.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Teacher</label>
                                    <select
                                        value={formData.teacher}
                                        onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                                    >
                                        <option value="">Select Teacher</option>
                                        {teachers.map((teacher) => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.first_name} {teacher.last_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Room</label>
                                    <input
                                        type="text"
                                        value={formData.room}
                                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                        placeholder="e.g., Room 101"
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button onClick={() => setShowModal(false)} className="btn-cancel">
                                        Cancel
                                    </button>
                                    <button onClick={handleSaveSlot} className="btn-save">
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DndProvider>
        </>
    );
};

export default TimetableBuilder;
