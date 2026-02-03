/**
 * Timetable Configuration Page
 * Allows configuration of period timings and subject loads
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast, ToastContainer } from '@/design-system';
import './TimetableConfig.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface PeriodConfig {
    period: number;
    start: string;
    end: string;
    type: 'class' | 'break';
    label?: string;
}

interface TimetableConfig {
    id?: string;
    academic_year: string;
    academic_year_name?: string;
    name: string;
    working_days: string[];
    periods: PeriodConfig[];
    is_active: boolean;
}

interface SubjectLoad {
    id?: string;
    academic_year: string;
    section: string;
    section_name?: string;
    subject: string;
    subject_name?: string;
    periods_per_week: number;
    preferred_teacher?: string;
    teacher_name?: string;
    room_preference?: string;
    max_periods_per_day: number;
    requires_lab: boolean;
    priority: number;
    is_active: boolean;
}

const DAYS = [
    { value: 'MONDAY', label: 'Mon' },
    { value: 'TUESDAY', label: 'Tue' },
    { value: 'WEDNESDAY', label: 'Wed' },
    { value: 'THURSDAY', label: 'Thu' },
    { value: 'FRIDAY', label: 'Fri' },
    { value: 'SATURDAY', label: 'Sat' },
    { value: 'SUNDAY', label: 'Sun' },
];

const DEFAULT_PERIODS: PeriodConfig[] = [
    { period: 1, start: '08:00', end: '08:45', type: 'class' },
    { period: 2, start: '08:45', end: '09:30', type: 'class' },
    { period: 3, start: '09:30', end: '10:15', type: 'class' },
    { period: 0, start: '10:15', end: '10:30', type: 'break', label: 'Short Break' },
    { period: 4, start: '10:30', end: '11:15', type: 'class' },
    { period: 5, start: '11:15', end: '12:00', type: 'class' },
    { period: 6, start: '12:00', end: '12:45', type: 'class' },
    { period: 0, start: '12:45', end: '13:30', type: 'break', label: 'Lunch Break' },
    { period: 7, start: '13:30', end: '14:15', type: 'class' },
    { period: 8, start: '14:15', end: '15:00', type: 'class' },
];

const TimetableConfigPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'periods' | 'loads'>('periods');
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
    const [config, setConfig] = useState<TimetableConfig | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Subject loads state
    const [sections, setSections] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [subjectLoads, setSubjectLoads] = useState<SubjectLoad[]>([]);
    const [selectedSection, setSelectedSection] = useState<string>('');
    
    // Generation status
    const [generationStatus, setGenerationStatus] = useState<any>(null);
    const [generating, setGenerating] = useState(false);
    
    const { toasts, removeToast, success, error: showError, warning } = useToast();

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('current_tenant');
        return {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId || '',
        };
    };

    useEffect(() => {
        fetchAcademicYears();
        fetchSections();
        fetchSubjects();
        fetchTeachers();
    }, []);

    useEffect(() => {
        if (selectedAcademicYear) {
            fetchConfig();
            fetchGenerationStatus();
        }
    }, [selectedAcademicYear]);

    useEffect(() => {
        if (selectedAcademicYear && selectedSection) {
            fetchSubjectLoads();
        }
    }, [selectedAcademicYear, selectedSection]);

    const fetchAcademicYears = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/tenants/years/`, {
                headers: getAuthHeaders(),
            });
            const years = response.data.results || response.data;
            setAcademicYears(years);
            
            const activeYear = years.find((year: any) => year.is_active);
            if (activeYear) {
                setSelectedAcademicYear(String(activeYear.id));
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

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${API_BASE_URL}/timetable/configs/active/?academic_year=${selectedAcademicYear}`,
                { headers: getAuthHeaders() }
            );
            setConfig(response.data);
        } catch (err: any) {
            if (err.response?.status === 404) {
                // No config exists, create default
                setConfig({
                    academic_year: selectedAcademicYear,
                    name: 'Default Schedule',
                    working_days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
                    periods: DEFAULT_PERIODS,
                    is_active: true,
                });
            } else {
                console.error('Error fetching config:', err);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjectLoads = async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/timetable/loads/?academic_year=${selectedAcademicYear}&section=${selectedSection}`,
                { headers: getAuthHeaders() }
            );
            setSubjectLoads(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching subject loads:', err);
        }
    };

    const fetchGenerationStatus = async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/timetable/generation/status/`,
                { headers: getAuthHeaders() }
            );
            setGenerationStatus(response.data);
        } catch (err) {
            console.error('Error fetching generation status:', err);
        }
    };

    const saveConfig = async () => {
        if (!config) return;
        
        setSaving(true);
        try {
            if (config.id) {
                await axios.put(
                    `${API_BASE_URL}/timetable/configs/${config.id}/`,
                    config,
                    { headers: getAuthHeaders() }
                );
            } else {
                const response = await axios.post(
                    `${API_BASE_URL}/timetable/configs/`,
                    config,
                    { headers: getAuthHeaders() }
                );
                setConfig(response.data);
            }
            success('Configuration saved successfully!');
            fetchGenerationStatus();
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error saving configuration');
        } finally {
            setSaving(false);
        }
    };

    const toggleWorkingDay = (day: string) => {
        if (!config) return;
        
        const newDays = config.working_days.includes(day)
            ? config.working_days.filter(d => d !== day)
            : [...config.working_days, day];
        
        setConfig({ ...config, working_days: newDays });
    };

    const updatePeriod = (index: number, field: keyof PeriodConfig, value: any) => {
        if (!config) return;
        
        const newPeriods = [...config.periods];
        newPeriods[index] = { ...newPeriods[index], [field]: value };
        setConfig({ ...config, periods: newPeriods });
    };

    const addPeriod = () => {
        if (!config) return;
        
        const lastPeriod = config.periods.filter(p => p.type === 'class').length;
        const lastEnd = config.periods[config.periods.length - 1]?.end || '08:00';
        
        setConfig({
            ...config,
            periods: [
                ...config.periods,
                {
                    period: lastPeriod + 1,
                    start: lastEnd,
                    end: addMinutes(lastEnd, 45),
                    type: 'class',
                },
            ],
        });
    };

    const addBreak = () => {
        if (!config) return;
        
        const lastEnd = config.periods[config.periods.length - 1]?.end || '08:00';
        
        setConfig({
            ...config,
            periods: [
                ...config.periods,
                {
                    period: 0,
                    start: lastEnd,
                    end: addMinutes(lastEnd, 15),
                    type: 'break',
                    label: 'Break',
                },
            ],
        });
    };

    const removePeriod = (index: number) => {
        if (!config) return;
        
        const newPeriods = config.periods.filter((_, i) => i !== index);
        // Renumber class periods
        let periodNum = 1;
        const renumbered = newPeriods.map(p => {
            if (p.type === 'class') {
                return { ...p, period: periodNum++ };
            }
            return p;
        });
        
        setConfig({ ...config, periods: renumbered });
    };

    const addMinutes = (time: string, minutes: number): string => {
        const [h, m] = time.split(':').map(Number);
        const totalMinutes = h * 60 + m + minutes;
        const newH = Math.floor(totalMinutes / 60) % 24;
        const newM = totalMinutes % 60;
        return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    };

    const saveSubjectLoad = async (load: SubjectLoad) => {
        try {
            if (load.id) {
                await axios.put(
                    `${API_BASE_URL}/timetable/loads/${load.id}/`,
                    load,
                    { headers: getAuthHeaders() }
                );
            } else {
                await axios.post(
                    `${API_BASE_URL}/timetable/loads/`,
                    load,
                    { headers: getAuthHeaders() }
                );
            }
            success('Subject load saved!');
            fetchSubjectLoads();
            fetchGenerationStatus();
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error saving subject load');
        }
    };

    const deleteSubjectLoad = async (loadId: string) => {
        if (!confirm('Delete this subject load?')) return;
        
        try {
            await axios.delete(
                `${API_BASE_URL}/timetable/loads/${loadId}/`,
                { headers: getAuthHeaders() }
            );
            success('Subject load deleted');
            fetchSubjectLoads();
            fetchGenerationStatus();
        } catch (err: any) {
            showError('Error deleting subject load');
        }
    };

    const generateTimetable = async (clearExisting: boolean = false) => {
        if (!generationStatus?.ready) {
            warning('Please configure periods and subject loads first');
            return;
        }
        
        setGenerating(true);
        try {
            const response = await axios.post(
                `${API_BASE_URL}/timetable/generation/generate/`,
                { clear_existing: clearExisting },
                { headers: getAuthHeaders() }
            );
            
            if (response.data.success) {
                success(`Generated ${response.data.generated_count} slots!`);
                if (response.data.unscheduled?.length > 0) {
                    warning(`${response.data.unscheduled.length} items could not be scheduled`);
                }
            } else {
                showError(response.data.errors?.[0] || 'Generation failed');
            }
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error generating timetable');
        } finally {
            setGenerating(false);
        }
    };

    const addQuickLoad = (subjectId: string) => {
        const subject = subjects.find(s => s.id === subjectId);
        if (!subject || !selectedSection) return;

        const newLoad: SubjectLoad = {
            academic_year: selectedAcademicYear,
            section: selectedSection,
            subject: subjectId,
            subject_name: subject.name,
            periods_per_week: 5,
            max_periods_per_day: 2,
            requires_lab: false,
            priority: 5,
            is_active: true,
        };

        saveSubjectLoad(newLoad);
    };

    return (
        <>
            <ToastContainer toasts={toasts} onDismiss={removeToast} position="top-right" />
            <div className="timetable-config">
                <div className="config-header">
                    <div className="header-content">
                        <h1>⚙️ Timetable Configuration</h1>
                        <p>Configure periods, subject loads, and generate timetables</p>
                    </div>
                    
                    <div className="header-actions">
                        <select
                            value={selectedAcademicYear}
                            onChange={(e) => setSelectedAcademicYear(e.target.value)}
                            className="year-select"
                        >
                            <option value="">Select Academic Year</option>
                            {academicYears.map((year) => (
                                <option key={year.id} value={year.id}>
                                    {year.name} {year.is_active && '(Active)'}
                                </option>
                            ))}
                        </select>
                        
                        {generationStatus?.ready && (
                            <button
                                className="btn-generate"
                                onClick={() => generateTimetable(false)}
                                disabled={generating}
                            >
                                {generating ? '⏳ Generating...' : '🚀 Generate Timetable'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Status Card */}
                {generationStatus && (
                    <div className={`status-card ${generationStatus.ready ? 'ready' : 'not-ready'}`}>
                        <div className="status-items">
                            <div className="status-item">
                                <span className={`status-icon ${generationStatus.has_config ? 'yes' : 'no'}`}>
                                    {generationStatus.has_config ? '✓' : '✗'}
                                </span>
                                <span>Period Configuration</span>
                            </div>
                            <div className="status-item">
                                <span className={`status-icon ${generationStatus.has_loads ? 'yes' : 'no'}`}>
                                    {generationStatus.has_loads ? '✓' : '✗'}
                                </span>
                                <span>Subject Loads ({generationStatus.total_loads || 0})</span>
                            </div>
                            <div className="status-item">
                                <span className={`status-icon ${generationStatus.sections_with_loads > 0 ? 'yes' : 'no'}`}>
                                    {generationStatus.sections_with_loads > 0 ? '✓' : '✗'}
                                </span>
                                <span>Sections ({generationStatus.sections_with_loads || 0})</span>
                            </div>
                        </div>
                        <div className="status-message">
                            {generationStatus.ready 
                                ? '✅ Ready to generate timetable!' 
                                : '⚠️ Configure all items to enable generation'}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="config-tabs">
                    <button
                        className={`tab ${activeTab === 'periods' ? 'active' : ''}`}
                        onClick={() => setActiveTab('periods')}
                    >
                        📅 Period Configuration
                    </button>
                    <button
                        className={`tab ${activeTab === 'loads' ? 'active' : ''}`}
                        onClick={() => setActiveTab('loads')}
                    >
                        📚 Subject Loads
                    </button>
                </div>

                {/* Period Configuration Tab */}
                {activeTab === 'periods' && config && (
                    <div className="tab-content">
                        <div className="config-section">
                            <h3>Working Days</h3>
                            <div className="day-toggles">
                                {DAYS.map((day) => (
                                    <button
                                        key={day.value}
                                        className={`day-toggle ${config.working_days.includes(day.value) ? 'active' : ''}`}
                                        onClick={() => toggleWorkingDay(day.value)}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="config-section">
                            <div className="section-header">
                                <h3>Period Timings</h3>
                                <div className="section-actions">
                                    <button className="btn-add" onClick={addPeriod}>+ Add Period</button>
                                    <button className="btn-add-break" onClick={addBreak}>+ Add Break</button>
                                </div>
                            </div>
                            
                            <div className="periods-table">
                                <div className="periods-header">
                                    <span>Type</span>
                                    <span>Period #</span>
                                    <span>Start Time</span>
                                    <span>End Time</span>
                                    <span>Label</span>
                                    <span>Actions</span>
                                </div>
                                {config.periods.map((period, index) => (
                                    <div key={index} className={`period-row ${period.type}`}>
                                        <span className="period-type">
                                            {period.type === 'class' ? '📖 Class' : '☕ Break'}
                                        </span>
                                        <span className="period-number">
                                            {period.type === 'class' ? `P${period.period}` : '-'}
                                        </span>
                                        <input
                                            type="time"
                                            value={period.start}
                                            onChange={(e) => updatePeriod(index, 'start', e.target.value)}
                                        />
                                        <input
                                            type="time"
                                            value={period.end}
                                            onChange={(e) => updatePeriod(index, 'end', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={period.label || ''}
                                            onChange={(e) => updatePeriod(index, 'label', e.target.value)}
                                            placeholder={period.type === 'break' ? 'Break name' : '-'}
                                            disabled={period.type === 'class'}
                                        />
                                        <button
                                            className="btn-remove"
                                            onClick={() => removePeriod(index)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="config-actions">
                            <button
                                className="btn-save"
                                onClick={saveConfig}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : '💾 Save Configuration'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Subject Loads Tab */}
                {activeTab === 'loads' && (
                    <div className="tab-content">
                        <div className="loads-header">
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                className="section-select"
                            >
                                <option value="">Select Section</option>
                                {sections.map((section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.grade_level_name || section.grade_level?.name} - {section.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedSection && (
                            <>
                                {/* Quick Add */}
                                <div className="quick-add">
                                    <h4>Quick Add Subject</h4>
                                    <div className="subject-chips">
                                        {subjects
                                            .filter(s => !subjectLoads.some(l => l.subject === s.id))
                                            .map((subject) => (
                                                <button
                                                    key={subject.id}
                                                    className="subject-chip"
                                                    onClick={() => addQuickLoad(subject.id)}
                                                >
                                                    + {subject.name}
                                                </button>
                                            ))}
                                    </div>
                                </div>

                                {/* Loads Table */}
                                <div className="loads-table">
                                    <div className="loads-header-row">
                                        <span>Subject</span>
                                        <span>Periods/Week</span>
                                        <span>Max/Day</span>
                                        <span>Teacher</span>
                                        <span>Priority</span>
                                        <span>Lab</span>
                                        <span>Actions</span>
                                    </div>
                                    {subjectLoads.map((load) => (
                                        <div key={load.id} className="load-row">
                                            <span className="load-subject">{load.subject_name}</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max="15"
                                                value={load.periods_per_week}
                                                onChange={(e) => {
                                                    const updated = { ...load, periods_per_week: parseInt(e.target.value) || 1 };
                                                    setSubjectLoads(prev => prev.map(l => l.id === load.id ? updated : l));
                                                }}
                                                onBlur={() => saveSubjectLoad(load)}
                                            />
                                            <input
                                                type="number"
                                                min="1"
                                                max="5"
                                                value={load.max_periods_per_day}
                                                onChange={(e) => {
                                                    const updated = { ...load, max_periods_per_day: parseInt(e.target.value) || 1 };
                                                    setSubjectLoads(prev => prev.map(l => l.id === load.id ? updated : l));
                                                }}
                                                onBlur={() => saveSubjectLoad(load)}
                                            />
                                            <select
                                                value={load.preferred_teacher || ''}
                                                onChange={(e) => {
                                                    const updated = { ...load, preferred_teacher: e.target.value || undefined };
                                                    setSubjectLoads(prev => prev.map(l => l.id === load.id ? updated : l));
                                                    saveSubjectLoad(updated);
                                                }}
                                            >
                                                <option value="">No preference</option>
                                                {teachers.map((teacher) => (
                                                    <option key={teacher.id} value={teacher.id}>
                                                        {teacher.first_name} {teacher.last_name}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={load.priority}
                                                onChange={(e) => {
                                                    const updated = { ...load, priority: parseInt(e.target.value) || 5 };
                                                    setSubjectLoads(prev => prev.map(l => l.id === load.id ? updated : l));
                                                }}
                                                onBlur={() => saveSubjectLoad(load)}
                                            />
                                            <input
                                                type="checkbox"
                                                checked={load.requires_lab}
                                                onChange={(e) => {
                                                    const updated = { ...load, requires_lab: e.target.checked };
                                                    setSubjectLoads(prev => prev.map(l => l.id === load.id ? updated : l));
                                                    saveSubjectLoad(updated);
                                                }}
                                            />
                                            <button
                                                className="btn-delete"
                                                onClick={() => load.id && deleteSubjectLoad(load.id)}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                    {subjectLoads.length === 0 && (
                                        <div className="no-loads">
                                            No subject loads configured. Use "Quick Add" above to add subjects.
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {loading && <div className="loading-overlay">Loading...</div>}
            </div>
        </>
    );
};

export default TimetableConfigPage;
