import React, { useState, useEffect } from 'react';
import { getDownloadLink, openDownload } from '../../utils/downloadLink';
import api from '../../services/api';
import * as idcardsAPI from '../../services/idcards';
import { GenerationJob, IDCardTemplate } from '../../services/idcards';
import './BulkGeneration.css';

interface GradeLevel {
    id: string;
    name: string;
}

interface Section {
    id: string;
    name: string;
    grade_level: string | number | { id: string; name: string };  // Can be UUID, numeric ID, or object
    grade_level_name?: string;  // Added by serializer
}

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    admission_number: string;
    photo?: string;
    current_class?: string;
    current_section?: string;
}

interface Staff {
    id: string;
    first_name: string;
    last_name: string;
    employee_id: string;
    designation: string;
    department?: string;
    photo?: string;
}

const BulkGeneration: React.FC = () => {
    const [step, setStep] = useState<'config' | 'progress' | 'complete'>('config');
    const [entityType, setEntityType] = useState<'student' | 'staff'>('student');
    const [templates, setTemplates] = useState<IDCardTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [filters, setFilters] = useState<any>({});
    const [outputFormat, setOutputFormat] = useState<'pdf' | 'png' | 'jpg'>('pdf');
    const [layout, setLayout] = useState<'individual' | 'grid' | 'sheet'>('individual');
    // QR codes are always included by default based on template design
    const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null);
    const [jobHistory, setJobHistory] = useState<GenerationJob[]>([]);

    // Selection mode: 'class' for entire class, 'individual' for student-wise selection
    const [selectionMode, setSelectionMode] = useState<'class' | 'individual'>('class');

    // Filter options
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [filteredSections, setFilteredSections] = useState<Section[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);

    // Selected filters
    const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');

    // Students/Staff for individual selection
    const [students, setStudents] = useState<Student[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingEntities, setLoadingEntities] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getSectionGradeId = (section: Section) => {
        const gradeValue: any = section.grade_level;
        if (typeof gradeValue === 'string' || typeof gradeValue === 'number') {
            return String(gradeValue);
        }
        if (gradeValue && typeof gradeValue === 'object' && 'id' in gradeValue) {
            return String((gradeValue as any).id);
        }
        return '';
    };

    useEffect(() => {
        fetchTemplates();
        fetchFilterOptions();
        loadJobHistory();
    }, [entityType]);

    // Filter sections when grade level changes
    useEffect(() => {
        if (selectedGradeLevel) {
            const filtered = sections.filter(s => {
                // Handle grade_level as id (string/number) or object
                const gradeId = getSectionGradeId(s);
                return gradeId === selectedGradeLevel;
            });
            console.log('Filtered sections for grade', selectedGradeLevel, ':', filtered);
            setFilteredSections(filtered);
            setSelectedSection('');
        } else {
            setFilteredSections(sections);
        }
    }, [selectedGradeLevel, sections]);

    // Fetch entities when class/section changes in individual mode
    // Now also fetches students when switching to individual mode (even without filters)
    useEffect(() => {
        if (selectionMode === 'individual' && entityType === 'student') {
            fetchStudents();
        }
    }, [selectionMode, entityType, selectedGradeLevel, selectedSection]);

    // Fetch staff when department changes in individual mode
    useEffect(() => {
        if (selectionMode === 'individual' && entityType === 'staff') {
            fetchStaff();
        }
    }, [selectionMode, entityType, selectedDepartment]);

    useEffect(() => {
        if (currentJob && currentJob.status === 'processing') {
            const interval = setInterval(() => {
                pollJobStatus(currentJob.id);
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [currentJob]);

    const fetchTemplates = async () => {
        try {
            const response = await idcardsAPI.getTemplates(entityType);
            const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
            setTemplates(data);
            const defaultTemplate = data.find((t: IDCardTemplate) => t.is_default);
            if (defaultTemplate) {
                setSelectedTemplate(defaultTemplate.id);
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
            setTemplates([]);
        }
    };

    const fetchFilterOptions = async () => {
        try {
            // Fetch grade levels from tenants app
            const gradeResponse = await api.get('/tenants/grades/');
            const gradeData = Array.isArray(gradeResponse.data) ? gradeResponse.data : (gradeResponse.data?.results || []);
            console.log('Grade levels loaded:', gradeData);
            setGradeLevels(gradeData);

            // Fetch sections from tenants app
            const sectionResponse = await api.get('/tenants/sections/');
            const sectionData = Array.isArray(sectionResponse.data) ? sectionResponse.data : (sectionResponse.data?.results || []);
            console.log('Sections loaded:', sectionData);
            setSections(sectionData);
            setFilteredSections(sectionData);

            // Departments for staff - try to fetch from API
            try {
                const deptResponse = await api.get('/tenants/departments/');
                const deptData = Array.isArray(deptResponse.data) ? deptResponse.data : (deptResponse.data?.results || []);
                setDepartments(deptData.map((d: any) => d.name || d));
            } catch {
                setDepartments(['Teaching', 'Administration', 'Support', 'Management']);
            }
        } catch (error) {
            console.error('Failed to fetch filter options:', error);
            // Fallback to empty data
            setGradeLevels([]);
            setSections([]);
            setDepartments(['Teaching', 'Administration', 'Support']);
        }
    };

    const fetchStudents = async () => {
        setLoadingEntities(true);
        try {
            const params: any = {};
            if (selectedSection) {
                params.section = selectedSection;
            } else if (selectedGradeLevel) {
                params.grade_level = selectedGradeLevel;
            }

            const response = await api.get('/students/', { params });
            const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
            setStudents(data);
        } catch (error) {
            console.error('Failed to fetch students:', error);
            setStudents([]);
        } finally {
            setLoadingEntities(false);
        }
    };

    const fetchStaff = async () => {
        setLoadingEntities(true);
        try {
            const params: any = {};
            if (selectedDepartment) {
                params.department = selectedDepartment;
            }

            const response = await api.get('/staff/', { params });
            const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
            setStaffList(data);
        } catch (error) {
            console.error('Failed to fetch staff:', error);
            setStaffList([]);
        } finally {
            setLoadingEntities(false);
        }
    };

    const loadJobHistory = () => {
        const saved = localStorage.getItem('idcard_job_history');
        if (saved) {
            setJobHistory(JSON.parse(saved));
        }
    };

    const saveJobHistory = (job: GenerationJob) => {
        const updated = [job, ...jobHistory.slice(0, 9)];
        setJobHistory(updated);
        localStorage.setItem('idcard_job_history', JSON.stringify(updated));
    };

    const handleSelectAll = () => {
        if (entityType === 'student') {
            const filtered = getFilteredStudents();
            if (selectedIds.size === filtered.length) {
                setSelectedIds(new Set());
            } else {
                setSelectedIds(new Set(filtered.map(s => s.id)));
            }
        } else {
            const filtered = getFilteredStaff();
            if (selectedIds.size === filtered.length) {
                setSelectedIds(new Set());
            } else {
                setSelectedIds(new Set(filtered.map(s => s.id)));
            }
        }
    };

    const handleToggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const getFilteredStudents = () => {
        if (!searchQuery) return students;
        const query = searchQuery.toLowerCase();
        return students.filter(s =>
            (s.first_name || '').toLowerCase().includes(query) ||
            (s.last_name || '').toLowerCase().includes(query) ||
            (s.full_name || '').toLowerCase().includes(query) ||
            (s.admission_number || '').toLowerCase().includes(query)
        );
    };

    const getFilteredStaff = () => {
        if (!searchQuery) return staffList;
        const query = searchQuery.toLowerCase();
        return staffList.filter(s =>
            (s.first_name || '').toLowerCase().includes(query) ||
            (s.last_name || '').toLowerCase().includes(query) ||
            (s.employee_id || '').toLowerCase().includes(query) ||
            (s.designation || '').toLowerCase().includes(query) ||
            (s.department || '').toLowerCase().includes(query)
        );
    };

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);

        try {
            // Build filters based on selection mode
            let generationFilters: any = {};

            if (selectionMode === 'class') {
                // Full class/section selection
                if (entityType === 'student') {
                    if (selectedGradeLevel) generationFilters.grade_level = selectedGradeLevel;
                    if (selectedSection) generationFilters.section = selectedSection;
                } else {
                    if (selectedDepartment) generationFilters.department = selectedDepartment;
                }
            } else {
                // Individual selection - pass selected IDs
                if (selectedIds.size === 0) {
                    setError('Please select at least one ' + entityType);
                    setLoading(false);
                    return;
                }
                generationFilters.entity_ids = Array.from(selectedIds);
            }

            const response = await idcardsAPI.generateBulkCards({
                entity_type: entityType,
                filters: generationFilters,
                template_id: selectedTemplate || undefined,
                include_qr: true, // QR codes are included by default
                output_format: outputFormat,
                layout,
            });

            const jobData = response.data;
            const jobId = jobData.job_id || jobData.id;

            if (!jobId) {
                throw new Error('No job ID returned from server');
            }

            const job: GenerationJob = {
                id: jobId,
                tenant: '',
                entity_type: entityType,
                filters: generationFilters,
                template: selectedTemplate,
                template_name: '',
                output_format: outputFormat,
                layout: layout,
                include_qr: true,
                status: 'processing',
                progress: 0,
                total_cards: selectionMode === 'individual' ? selectedIds.size : 0,
                completed_cards: 0,
                failed_cards: 0,
                individual_files: [],
                created_at: new Date().toISOString()
            };

            setCurrentJob(job);
            saveJobHistory(job);
            setStep('progress');
            pollJobStatus(jobId);
        } catch (error: any) {
            console.error('Failed to start bulk generation:', error);
            const errMsg = error.response?.data?.detail || error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to start generation. Please try again.';
            setError(errMsg);
        } finally {
            setLoading(false);
        }
    };

    const pollJobStatus = async (jobId: string) => {
        if (!jobId) return;
        try {
            const response = await idcardsAPI.getBulkJobStatus(jobId);
            const job = response.data;
            setCurrentJob(job);
            if (job.status === 'completed' || job.status === 'failed') {
                setStep('complete');
                saveJobHistory(job);
            }
        } catch (error) {
            console.error('Failed to fetch job status:', error);
        }
    };

    const handleReset = () => {
        setStep('config');
        setCurrentJob(null);
        setFilters({});
        setSelectedIds(new Set());
        setSearchQuery('');
    };

    const handleDownload = () => openDownload(currentJob?.download_url);

    const getSelectionSummary = () => {
        if (selectionMode === 'class') {
            if (entityType === 'student') {
                const parts: string[] = [];
                if (selectedGradeLevel) {
                    const grade = gradeLevels.find(g => g.id === selectedGradeLevel);
                    parts.push(grade?.name || 'Selected Class');
                }
                if (selectedSection) {
                    const section = sections.find(s => s.id === selectedSection);
                    parts.push(`Section ${section?.name || ''}`);
                }
                return parts.length > 0 ? parts.join(' - ') : 'All Students';
            } else {
                return selectedDepartment || 'All Staff';
            }
        } else {
            return `${selectedIds.size} ${entityType}(s) selected`;
        }
    };

    return (
        <div className="bulk-generation">
            <div className="bulk-generation-header">
                <h1>Bulk ID Card Generation</h1>
                <p>Generate ID cards for entire classes or select specific students/staff</p>
            </div>

            {step === 'config' && (
                <div className="generation-config">
                    {/* Step 1: Entity Type */}
                    <div className="config-section">
                        <h2>1. Select Entity Type</h2>
                        <div className="entity-selector">
                            <button
                                className={`entity-btn ${entityType === 'student' ? 'active' : ''}`}
                                onClick={() => { setEntityType('student'); setSelectedIds(new Set()); }}
                            >
                                <i className="fas fa-user-graduate"></i>
                                <span>Students</span>
                            </button>
                            <button
                                className={`entity-btn ${entityType === 'staff' ? 'active' : ''}`}
                                onClick={() => { setEntityType('staff'); setSelectedIds(new Set()); }}
                            >
                                <i className="fas fa-chalkboard-teacher"></i>
                                <span>Staff</span>
                            </button>
                        </div>
                    </div>

                    {/* Step 2: Selection Mode */}
                    <div className="config-section">
                        <h2>2. Selection Mode</h2>
                        <div className="selection-mode-toggle" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                            <button
                                className={`mode-btn ${selectionMode === 'class' ? 'active' : ''}`}
                                onClick={() => { setSelectionMode('class'); setSelectedIds(new Set()); }}
                                style={{
                                    padding: '1.5rem',
                                    border: selectionMode === 'class' ? '2px solid #6366f1' : '2px solid #e2e8f0',
                                    background: selectionMode === 'class' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.12) 100%)' : 'white',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: selectionMode === 'class' ? '0 4px 14px rgba(99, 102, 241, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', filter: selectionMode === 'class' ? 'none' : 'grayscale(0.3)' }}>🏫</div>
                                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: selectionMode === 'class' ? '#4f46e5' : '#1f2937' }}>Entire Class/Section</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.35rem' }}>
                                    Generate for all students in selected class
                                </div>
                            </button>
                            <button
                                className={`mode-btn ${selectionMode === 'individual' ? 'active' : ''}`}
                                onClick={() => setSelectionMode('individual')}
                                style={{
                                    padding: '1.5rem',
                                    border: selectionMode === 'individual' ? '2px solid #6366f1' : '2px solid #e2e8f0',
                                    background: selectionMode === 'individual' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.12) 100%)' : 'white',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: selectionMode === 'individual' ? '0 4px 14px rgba(99, 102, 241, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', filter: selectionMode === 'individual' ? 'none' : 'grayscale(0.3)' }}>👤</div>
                                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: selectionMode === 'individual' ? '#4f46e5' : '#1f2937' }}>Individual Selection</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.35rem' }}>
                                    Pick specific students from a class
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Step 3: Class/Section Filter */}
                    <div className="config-section">
                        <h2>3. {selectionMode === 'class' ? 'Select Class/Section' : 'Filter & Select Students'}</h2>
                        <div className="filters-grid">
                            {entityType === 'student' ? (
                                <>
                                    <div className="filter-group">
                                        <label>Class (Grade Level)</label>
                                        <select
                                            value={selectedGradeLevel}
                                            onChange={(e) => setSelectedGradeLevel(e.target.value)}
                                        >
                                            <option value="">All Classes</option>
                                            {gradeLevels.map((grade) => (
                                                <option key={grade.id} value={grade.id}>
                                                    {grade.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="filter-group">
                                        <label>Section</label>
                                        <select
                                            value={selectedSection}
                                            onChange={(e) => setSelectedSection(e.target.value)}
                                        >
                                            <option value="">All Sections</option>
                                            {filteredSections.map((sec) => (
                                                <option key={sec.id} value={sec.id}>
                                                    Section {sec.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <div className="filter-group">
                                    <label>Department</label>
                                    <select
                                        value={selectedDepartment}
                                        onChange={(e) => setSelectedDepartment(e.target.value)}
                                    >
                                        <option value="">All Departments</option>
                                        {departments.map((dept) => (
                                            <option key={dept} value={dept}>
                                                {dept}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Individual Selection List */}
                        {selectionMode === 'individual' && (
                            <div className="individual-selection" style={{ marginTop: '1rem' }}>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        placeholder={`Search ${entityType}s...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem 1rem',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                    <button
                                        onClick={handleSelectAll}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            background: '#f3f4f6',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 500
                                        }}
                                    >
                                        {selectedIds.size === (entityType === 'student' ? getFilteredStudents().length : getFilteredStaff().length)
                                            ? 'Deselect All'
                                            : 'Select All'}
                                    </button>
                                </div>

                                <div style={{
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    background: '#fafafa'
                                }}>
                                    {loadingEntities ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                            <div className="spinner-small" style={{ marginBottom: '0.5rem' }}></div>
                                            Loading {entityType}s...
                                        </div>
                                    ) : entityType === 'student' ? (
                                        getFilteredStudents().length === 0 ? (
                                            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                                {selectedGradeLevel || selectedSection
                                                    ? 'No students found for selected class/section'
                                                    : 'Please select a class or section to view students'}
                                            </div>
                                        ) : (
                                            getFilteredStudents().map((student) => (
                                                <div
                                                    key={student.id}
                                                    onClick={() => handleToggleSelection(student.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '1rem',
                                                        padding: '0.75rem 1rem',
                                                        borderBottom: '1px solid #e5e7eb',
                                                        cursor: 'pointer',
                                                        background: selectedIds.has(student.id) ? '#eef2ff' : 'white',
                                                        transition: 'background 0.2s'
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(student.id)}
                                                        onChange={() => handleToggleSelection(student.id)}
                                                        style={{ width: '18px', height: '18px' }}
                                                    />
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        background: '#e5e7eb',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '1rem',
                                                        fontWeight: 600,
                                                        color: '#6b7280',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {student.photo ? (
                                                            <img src={student.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            student.first_name.charAt(0) + student.last_name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 500 }}>
                                                            {student.first_name} {student.last_name}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                            {student.admission_number}
                                                            {student.current_class && ` • ${student.current_class}`}
                                                            {student.current_section && ` - ${student.current_section}`}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    ) : (
                                        getFilteredStaff().length === 0 ? (
                                            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                                No staff found
                                            </div>
                                        ) : (
                                            getFilteredStaff().map((staff) => (
                                                <div
                                                    key={staff.id}
                                                    onClick={() => handleToggleSelection(staff.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '1rem',
                                                        padding: '0.75rem 1rem',
                                                        borderBottom: '1px solid #e5e7eb',
                                                        cursor: 'pointer',
                                                        background: selectedIds.has(staff.id) ? '#eef2ff' : 'white',
                                                        transition: 'background 0.2s'
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(staff.id)}
                                                        onChange={() => handleToggleSelection(staff.id)}
                                                        style={{ width: '18px', height: '18px' }}
                                                    />
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        background: '#e5e7eb',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '1rem',
                                                        fontWeight: 600,
                                                        color: '#6b7280',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {staff.photo ? (
                                                            <img src={staff.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            staff.first_name.charAt(0) + staff.last_name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 500 }}>
                                                            {staff.first_name} {staff.last_name}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                            {staff.employee_id} • {staff.designation}
                                                            {staff.department && ` • ${staff.department}`}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    )}
                                </div>

                                {selectionMode === 'individual' && selectedIds.size > 0 && (
                                    <div style={{
                                        marginTop: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        background: '#ecfdf5',
                                        borderRadius: '8px',
                                        color: '#059669',
                                        fontWeight: 500
                                    }}>
                                        ✓ {selectedIds.size} {entityType}(s) selected for ID card generation
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Step 4: Template Selection */}
                    <div className="config-section">
                        <h2>4. Select Template</h2>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className="template-select"
                        >
                            <option value="">Use Default Template</option>
                            {templates.map((template) => (
                                <option key={template.id} value={template.id}>
                                    {template.name} {template.is_default ? '(Default)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Step 5: Output Settings */}
                    <div className="config-section">
                        <h2>5. Output Settings</h2>
                        <div className="output-grid">
                            <div className="output-group">
                                <label>Format</label>
                                <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value as any)}>
                                    <option value="pdf">PDF</option>
                                    <option value="png">PNG</option>
                                    <option value="jpg">JPG</option>
                                </select>
                            </div>
                            <div className="output-group">
                                <label>Layout</label>
                                <select value={layout} onChange={(e) => setLayout(e.target.value as any)}>
                                    <option value="individual">Individual Files</option>
                                    <option value="grid">Grid (9 per A4)</option>
                                    <option value="sheet">Print Sheet</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Summary & Generate */}
                    <div className="config-section" style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.08) 100%)',
                        borderRadius: '16px',
                        padding: '1.75rem',
                        border: '1px solid rgba(99, 102, 241, 0.1)'
                    }}>
                        <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>📋</span> Generation Summary
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                            <div style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Entity Type</div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>{entityType === 'student' ? '👨‍🎓 Students' : '👨‍💼 Staff'}</div>
                            </div>
                            <div style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Selection</div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>{getSelectionSummary()}</div>
                            </div>
                            <div style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Output Format</div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>{outputFormat.toUpperCase()} • {layout === 'individual' ? 'Individual Files' : layout === 'grid' ? 'Grid Layout' : 'Print Sheet'}</div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="error-banner" style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            border: '1px solid #fecaca'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="config-actions">
                        <button
                            className="btn-primary btn-lg"
                            onClick={handleGenerate}
                            disabled={loading || (selectionMode === 'individual' && selectedIds.size === 0)}
                        >
                            {loading ? (
                                <><span className="spinner-small"></span> Starting...</>
                            ) : (
                                <><i className="fas fa-play"></i> Generate {selectionMode === 'individual' ? `${selectedIds.size} ID Cards` : 'ID Cards'}</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {step === 'progress' && currentJob && (
                <div className="generation-progress">
                    <div className="progress-container">
                        <div className="progress-icon">
                            {currentJob.status === 'processing' ? (
                                <div className="spinner-large"></div>
                            ) : (
                                <i className="fas fa-check-circle success-icon"></i>
                            )}
                        </div>

                        <h2>
                            {currentJob.status === 'processing'
                                ? 'Generating ID Cards...'
                                : 'Generation Complete!'}
                        </h2>

                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${currentJob.progress}%` }}
                            ></div>
                        </div>

                        <div className="progress-stats">
                            <div className="stat">
                                <span className="stat-label">Progress</span>
                                <span className="stat-value">{currentJob.progress}%</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">Total Cards</span>
                                <span className="stat-value">{currentJob.total_cards}</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">Completed</span>
                                <span className="stat-value success">{currentJob.completed_cards}</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">Failed</span>
                                <span className="stat-value error">{currentJob.failed_cards}</span>
                            </div>
                        </div>

                        {currentJob.estimated_completion && (
                            <p className="estimated-time">
                                Estimated completion: {new Date(currentJob.estimated_completion).toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {step === 'complete' && currentJob && (
                <div className="generation-complete">
                    <div className="complete-container">
                        {currentJob.status === 'completed' ? (
                            <>
                                <div className="success-icon-large">
                                    <i className="fas fa-check-circle"></i>
                                </div>
                                <h2>Generation Completed Successfully!</h2>
                                <p>
                                    Generated {currentJob.completed_cards} ID cards
                                    {currentJob.failed_cards > 0 && ` (${currentJob.failed_cards} failed)`}
                                </p>

                                <div className="complete-actions">
                                    <button className="btn-primary btn-lg" onClick={handleDownload}>
                                        <i className="fas fa-download"></i>
                                        Download Files
                                    </button>
                                    <button className="btn-secondary" onClick={handleReset}>
                                        Generate More
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="error-icon-large">
                                    <i className="fas fa-exclamation-circle"></i>
                                </div>
                                <h2>Generation Failed</h2>
                                <p className="error-message">{currentJob.error_message}</p>
                                <button className="btn-primary" onClick={handleReset}>
                                    Try Again
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Job History */}
            {jobHistory.length > 0 && step === 'config' && (
                <div className="job-history">
                    <h2>Recent Jobs</h2>
                    <div className="history-list">
                        {jobHistory.map((job, index) => (
                            <div key={`${job.id}-${index}`} className="history-item">
                                <div className="history-info">
                                    <span className="history-type">
                                        {job.entity_type === 'student' ? 'Students' : 'Staff'}
                                    </span>
                                    <span className="history-date">
                                        {new Date(job.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <div className="history-stats">
                                    <span className={`history-status ${job.status}`}>{job.status}</span>
                                    <span>{job.total_cards} cards</span>
                                </div>
                                {job.download_url && (
                                    <button
                                        className="btn-small"
                                        onClick={() => openDownload(job.download_url)}
                                    >
                                        <i className="fas fa-download"></i>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkGeneration;
