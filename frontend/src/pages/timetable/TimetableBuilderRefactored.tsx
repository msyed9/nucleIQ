/**
 * Timetable Builder - Refactored Main Component
 */

import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
    Calendar,
    Settings,
    Rocket,
    RotateCcw,
    FileText,
    Download,
    RefreshCw,
} from 'lucide-react';
import {
    PageHeader,
    FilterDropdown,
    LoadingSpinner,
    DataCard,
} from '../../components/shared/SharedComponents';
import { useToast, ToastContainer } from '@/design-system';
import { useTimetableData, useTimetableSlots } from './hooks';
import {
    DraggableSlot,
    DroppableCell,
    DAYS,
    TIME_SLOTS,
} from './GridComponents';
import TimetableExport from './TimetableExport';
import TeacherWorkloadPanel from './TeacherWorkloadPanel';
import ValidationReport from './ValidationReport';
import { TimetableSlot } from './types';
import './TimetableBuilder.css';
import './TimetableEnhancements.css';

const TimetableBuilderRefactored: React.FC = () => {
    const { toasts, removeToast } = useToast();

    // Selection state
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
    const [selectedGradeLevel, setSelectedGradeLevel] = useState('');
    const [selectedSection, setSelectedSection] = useState('');

    // Hooks
    const data = useTimetableData(selectedAcademicYear, selectedGradeLevel);
    const slots = useTimetableSlots(selectedSection, selectedAcademicYear);

    // Modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
    const [formData, setFormData] = useState({
        subject: '',
        teacher: '',
        room: '',
    });

    // Phase 6 feature visibility
    const [showExportModal, setShowExportModal] = useState(false);
    const [showValidationReport, setShowValidationReport] = useState(false);
    const [showWorkloadPanel, setShowWorkloadPanel] = useState(false);

    const handleDrop = async (day: string, timeSlot: any, item: TimetableSlot) => {
        const slotData = {
            ...item,
            day_of_week: day,
            start_time: timeSlot.start,
            end_time: timeSlot.end,
            period_number: timeSlot.period,
            academic_year: selectedAcademicYear,
            section: selectedSection,
            teacher: item.teacher || null,
        };
        await slots.createSlot(slotData);
    };

    const handleEdit = (slot: TimetableSlot) => {
        setEditingSlot(slot);
        setFormData({
            subject: slot.subject,
            teacher: slot.teacher,
            room: slot.room,
        });
        setShowEditModal(true);
    };

    const handleSaveSlot = async () => {
        if (!editingSlot?.id) return;
        await slots.updateSlot(editingSlot.id, formData);
        setShowEditModal(false);
        setEditingSlot(null);
    };

    const getSlotForCell = (day: string, timeSlot: any) => {
        return slots.slots.find(
            (slot) =>
                slot.day_of_week === day &&
                slot.start_time === timeSlot.start &&
                slot.end_time === timeSlot.end
        );
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="page-container">
                <ToastContainer toasts={toasts} onDismiss={removeToast} position="top-right" />

                <PageHeader
                    title="Timetable Builder"
                    subtitle="Create and manage class schedules with drag-and-drop"
                    icon={<Calendar size={32} />}
                    actions={[
                        <a key="config" href="/timetable/config" className="btn btn-outline">
                            <Settings size={16} /> Configuration
                        </a>,
                        data.generationStatus?.ready && (
                            <button
                                key="generate"
                                className="btn btn-primary"
                                onClick={() => slots.generateTimetable(false)}
                                disabled={slots.loading}
                            >
                                <Rocket size={16} /> Auto Generate
                            </button>
                        )
                    ]}
                />

                {/* KPI Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <DataCard
                        title="Total Slots"
                        value={slots.slots.length}
                        icon={<Calendar size={20} />}
                        variant="primary"
                    />
                    <DataCard
                        title="Working Days"
                        value={DAYS.length}
                        icon={<Calendar size={20} />}
                        variant="info"
                    />
                    <DataCard
                        title="Periods"
                        value={TIME_SLOTS.filter(t => t.period !== 0).length}
                        icon={<Calendar size={20} />}
                        variant="success"
                    />
                    <DataCard
                        title="Teachers"
                        value={data.teachers.length}
                        icon={<Calendar size={20} />}
                        variant="warning"
                    />
                </div>

                {/* Filters */}
                <div className="card p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FilterDropdown
                            label="Academic Year"
                            value={selectedAcademicYear}
                            onChange={setSelectedAcademicYear}
                            options={data.academicYears.map(y => ({ label: y.name, value: String(y.id) }))}
                            placeholder="Select Academic Year"
                        />
                        <FilterDropdown
                            label="Class"
                            value={selectedGradeLevel}
                            onChange={(val) => {
                                setSelectedGradeLevel(val);
                                setSelectedSection('');
                            }}
                            options={data.gradeLevels.map(g => ({ label: g.name, value: String(g.id) }))}
                            placeholder="Select Class"
                            disabled={!selectedAcademicYear}
                        />
                        <FilterDropdown
                            label="Section"
                            value={selectedSection}
                            onChange={setSelectedSection}
                            options={data.sections.map(s => ({
                                label: `${s.grade_level_name || 'Class'} - ${s.name}`,
                                value: String(s.id)
                            }))}
                            placeholder="Select Section"
                            disabled={!selectedGradeLevel}
                        />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: Subject Palette */}
                    <div className="lg:w-64 space-y-4">
                        <div className="card p-4">
                            <h3 className="text-lg font-semibold mb-4">Subjects</h3>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                {data.subjects.length === 0 ? (
                                    <p className="text-muted text-sm text-center py-4">No subjects found</p>
                                ) : (
                                    data.subjects.map((subject) => (
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
                                            readOnly={!selectedSection}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="card p-4">
                            <h3 className="text-lg font-semibold mb-4">Actions</h3>
                            <div className="flex flex-col gap-2">
                                <button
                                    className="btn btn-outline w-full justify-start"
                                    onClick={() => setShowValidationReport(true)}
                                    disabled={!selectedSection || slots.slots.length === 0}
                                >
                                    <FileText size={16} /> Validate Schedule
                                </button>
                                <button
                                    className="btn btn-outline w-full justify-start"
                                    onClick={() => setShowExportModal(true)}
                                    disabled={!selectedSection || slots.slots.length === 0}
                                >
                                    <Download size={16} /> Export (PDF/Excel)
                                </button>
                                <button
                                    className="btn btn-outline w-full justify-start text-warning"
                                    onClick={() => slots.refresh()}
                                    disabled={!selectedSection}
                                >
                                    <RefreshCw size={16} /> Refresh Data
                                </button>
                                {selectedSection && slots.slots.length > 0 && (
                                    <button
                                        className="btn btn-outline w-full justify-start text-danger"
                                        onClick={() => {
                                            if (confirm('Are you sure you want to REGENERATE all slots for this section? This will clear current items.')) {
                                                slots.generateTimetable(true);
                                            }
                                        }}
                                    >
                                        <RotateCcw size={16} /> Regenerate Section
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Grid */}
                    <div className="flex-1 overflow-x-auto">
                        {!selectedSection ? (
                            <div className="card flex flex-col items-center justify-center p-12 text-center">
                                <Calendar size={64} className="text-muted mb-4 opacity-20" />
                                <h3 className="text-xl font-medium">Select a Section</h3>
                                <p className="text-muted max-w-xs">Please select an academic year, class, and section to view or create a timetable.</p>
                            </div>
                        ) : (
                            <div className="card overflow-hidden">
                                {slots.loading && <LoadingSpinner fullPage text="Updating timetable..." />}

                                <table className="timetable-grid w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="p-4 bg-gray-50 border border-gray-100 text-left w-24">Time</th>
                                            {DAYS.map((day) => (
                                                <th key={day} className="p-4 bg-gray-50 border border-gray-100 font-semibold">{day}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {TIME_SLOTS.map((timeSlot, idx) => (
                                            <tr key={idx}>
                                                <td className="time-cell p-4 border border-gray-100 bg-gray-50 text-center">
                                                    {timeSlot.period !== 0 ? (
                                                        <>
                                                            <div className="font-bold text-primary">P{timeSlot.period}</div>
                                                            <div className="text-xs text-muted mt-1">
                                                                {timeSlot.start} - {timeSlot.end}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="font-bold text-orange-500 uppercase tracking-wider">{timeSlot.label}</div>
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
                                                        onDelete={slots.deleteSlot}
                                                    />
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Modal */}
                {showEditModal && editingSlot && (
                    <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                        <div className="modal-container modal-medium" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Edit Timetable Slot</h2>
                                <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
                            </div>

                            <div className="modal-body space-y-4">
                                <div className="form-group">
                                    <label className="form-label">Subject</label>
                                    <select
                                        className="form-select"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    >
                                        {data.subjects.map((subject) => (
                                            <option key={subject.id} value={subject.id}>
                                                {subject.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Teacher</label>
                                    <select
                                        className="form-select"
                                        value={formData.teacher}
                                        onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                                    >
                                        <option value="">Select Teacher</option>
                                        {data.teachers.map((teacher) => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.first_name} {teacher.last_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Room</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.room}
                                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                        placeholder="e.g., Room 101"
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button onClick={handleSaveSlot} className="btn btn-primary" disabled={slots.loading}>
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Phase 6 Feature Components */}
                {showWorkloadPanel && (
                    <TeacherWorkloadPanel
                        slots={slots.slots as any}
                        isOpen={showWorkloadPanel}
                        onToggle={() => setShowWorkloadPanel(!showWorkloadPanel)}
                    />
                )}

                {showExportModal && (
                    <TimetableExport
                        slots={slots.slots as any}
                        sectionName={data.sections.find(s => String(s.id) === selectedSection)?.name || 'Section'}
                        academicYearName={data.academicYears.find(y => String(y.id) === selectedAcademicYear)?.name || 'Academic Year'}
                        onClose={() => setShowExportModal(false)}
                    />
                )}

                {showValidationReport && (
                    <ValidationReport
                        slots={slots.slots as any}
                        sectionName={data.sections.find(s => String(s.id) === selectedSection)?.name || 'Section'}
                        workingDays={DAYS}
                        isOpen={showValidationReport}
                        onClose={() => setShowValidationReport(false)}
                    />
                )}

                {/* Workload panel trigger button (floating) */}
                <button
                    className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-40"
                    onClick={() => setShowWorkloadPanel(true)}
                    title="View Teacher Workload"
                >
                    <Settings size={24} />
                </button>
            </div>
        </DndProvider>
    );
};

export default TimetableBuilderRefactored;
