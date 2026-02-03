/**
 * Subjects List Page
 * Display and manage subjects with teacher assignments and syllabus progress
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './SubjectsList.css';

interface Subject {
    id: string;
    name: string;
    code: string;
    description?: string;
    subject_type?: 'THEORY' | 'PRACTICAL' | 'BOTH';
    is_active?: boolean;
    display_order?: number;
}

interface ClassSubject {
    id: string;
    subject: string;
    subject_name?: string;
    subject_code?: string;
    grade_level: string;
    grade_level_name?: string;
    academic_year: string;
    academic_year_name?: string;
    teacher?: string | null;
    teacher_name?: string | null;
    weekly_periods?: number;
    total_marks?: number;
    passing_marks?: number;
    is_mandatory?: boolean;
    is_elective?: boolean;
    display_order?: number;
}

interface GradeLevel {
    id: string;
    name: string;
}

interface AcademicYear {
    id: string;
    name: string;
    is_active?: boolean;
}

interface Teacher {
    id: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    email?: string;
}

interface SyllabusSummary {
    subject_id: string | number;
    completion_percentage?: number;
}

interface SubjectFormState {
    name: string;
    code: string;
    description: string;
    subject_type: 'THEORY' | 'PRACTICAL' | 'BOTH';
    is_active: boolean;
    display_order: number;
}

interface MappingRow {
    id?: string;
    grade_level: string;
    academic_year: string;
    teacher?: string | null;
    weekly_periods: number;
    total_marks: number;
    passing_marks: number;
    is_mandatory: boolean;
    is_elective: boolean;
    display_order?: number;
}

const SUBJECT_COLORS: Record<string, string> = {
    'Mathematics': '#3B82F6',
    'English': '#8B5CF6',
    'Science': '#10B981',
    'Physics': '#F59E0B',
    'Chemistry': '#EF4444',
    'Biology': '#22C55E',
    'History': '#A855F7',
    'Geography': '#06B6D4',
    'Computer Science': '#6366F1',
    'Hindi': '#EC4899',
    'Arabic': '#059669',
    'Physical Education': '#F97316',
    'Art': '#D946EF',
    'Music': '#E11D48',
};

const getMockSubjects = (): Subject[] => [
    { id: '1', name: 'Mathematics', code: 'MATH10', description: 'Mathematics fundamentals', subject_type: 'THEORY', is_active: true, display_order: 1 },
    { id: '2', name: 'English', code: 'ENG10', description: 'Language and literature', subject_type: 'THEORY', is_active: true, display_order: 2 },
    { id: '3', name: 'Physics', code: 'PHY10', description: 'Physics fundamentals', subject_type: 'BOTH', is_active: true, display_order: 3 },
    { id: '4', name: 'Chemistry', code: 'CHEM10', description: 'Chemistry fundamentals', subject_type: 'BOTH', is_active: true, display_order: 4 },
    { id: '5', name: 'Biology', code: 'BIO10', description: 'Biology fundamentals', subject_type: 'BOTH', is_active: true, display_order: 5 },
    { id: '6', name: 'History', code: 'HIST10', description: 'World history', subject_type: 'THEORY', is_active: true, display_order: 6 },
    { id: '7', name: 'Computer Science', code: 'CS10', description: 'Programming basics', subject_type: 'PRACTICAL', is_active: true, display_order: 7 },
    { id: '8', name: 'Physical Education', code: 'PE10', description: 'Sports and fitness', subject_type: 'PRACTICAL', is_active: true, display_order: 8 },
];

const normalizeListResponse = <T,>(data: any): { items: T[]; count: number } => {
    if (Array.isArray(data)) {
        return { items: data, count: data.length };
    }
    if (data?.results) {
        return { items: data.results, count: data.count ?? data.results.length };
    }
    return { items: data ? [data] : [], count: data?.count ?? 0 };
};

const SubjectsList: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGrade, setSelectedGrade] = useState<string>('all');
    const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [total, setTotal] = useState(0);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState<SubjectFormState>({
        name: '',
        code: '',
        description: '',
        subject_type: 'THEORY',
        is_active: true,
        display_order: 0,
    });
    const [mappingRows, setMappingRows] = useState<MappingRow[]>([]);
    const [deletedMappingIds, setDeletedMappingIds] = useState<string[]>([]);
    const [assignmentEdits, setAssignmentEdits] = useState<MappingRow[]>([]);
    const [formError, setFormError] = useState<string | null>(null);
    const [formFieldErrors, setFormFieldErrors] = useState<Record<string, string[]>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingAssignments, setIsSavingAssignments] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [usingMockData, setUsingMockData] = useState(false);

    const detailModalRef = useRef<HTMLDivElement | null>(null);
    const formModalRef = useRef<HTMLDivElement | null>(null);

    const { data: subjects = getMockSubjects(), isLoading, refetch: refetchSubjects } = useQuery<Subject[], Error>({
        queryKey: ['subjects', page, pageSize, searchQuery],
        queryFn: async () => {
            try {
                setApiError(null);
                setUsingMockData(false);
                const params: Record<string, string | number> = {
                    page,
                    page_size: pageSize,
                };
                if (searchQuery.trim()) {
                    params.search = searchQuery.trim();
                }
                const response = await api.get('/tenants/subjects/', { params });
                const normalized = normalizeListResponse<Subject>(response.data);
                setTotal(normalized.count);
                return normalized.items;
            } catch (error: any) {
                console.error('Failed to fetch subjects:', error);
                setApiError('Unable to load subjects from the server. Showing demo data.');
                setUsingMockData(true);
                const fallback = getMockSubjects();
                setTotal(fallback.length);
                return fallback;
            }
        },
    });

    const subjectIds = useMemo(() => subjects.map((subject) => subject.id).filter(Boolean), [subjects]);

    const { data: classSubjects = [], refetch: refetchClassSubjects } = useQuery<ClassSubject[], Error>({
        queryKey: ['class-subjects', subjectIds.join(',')],
        enabled: subjectIds.length > 0,
        queryFn: async () => {
            try {
                const response = await api.get('/tenants/class-subjects/', {
                    params: { subject__in: subjectIds.join(',') }
                });
                const normalized = normalizeListResponse<ClassSubject>(response.data);
                return normalized.items;
            } catch (error) {
                console.error('Failed to fetch class subjects:', error);
                setApiError('Unable to load grade mappings. Some details may be missing.');
                return [];
            }
        }
    });

    const { data: gradeLevels = [] } = useQuery<GradeLevel[], Error>({
        queryKey: ['grade-levels'],
        queryFn: async () => {
            try {
                const response = await api.get('/tenants/grades/');
                const normalized = normalizeListResponse<GradeLevel>(response.data);
                return normalized.items;
            } catch (error) {
                console.error('Failed to fetch grade levels:', error);
                return [];
            }
        }
    });

    const { data: academicYears = [] } = useQuery<AcademicYear[], Error>({
        queryKey: ['academic-years'],
        queryFn: async () => {
            try {
                const response = await api.get('/tenants/years/');
                const normalized = normalizeListResponse<AcademicYear>(response.data);
                return normalized.items;
            } catch (error) {
                console.error('Failed to fetch academic years:', error);
                return [];
            }
        }
    });

    const { data: teachers = [] } = useQuery<Teacher[], Error>({
        queryKey: ['teachers'],
        queryFn: async () => {
            try {
                const response = await api.get('/staff/');
                const normalized = normalizeListResponse<Teacher>(response.data);
                return normalized.items;
            } catch (error) {
                console.error('Failed to fetch teachers:', error);
                return [];
            }
        }
    });

    const { data: syllabi = [] } = useQuery<SyllabusSummary[], Error>({
        queryKey: ['syllabus-summary'],
        queryFn: async () => {
            try {
                const response = await api.get('/academics/syllabus/');
                const normalized = normalizeListResponse<SyllabusSummary>(response.data);
                return normalized.items;
            } catch (error) {
                console.error('Failed to fetch syllabus progress:', error);
                return [];
            }
        }
    });

    const classSubjectsBySubject = useMemo(() => {
        return classSubjects.reduce<Record<string, ClassSubject[]>>((acc, mapping) => {
            const subjectId = String(mapping.subject);
            if (!acc[subjectId]) {
                acc[subjectId] = [];
            }
            acc[subjectId].push(mapping);
            return acc;
        }, {});
    }, [classSubjects]);

    const syllabusBySubjectId = useMemo(() => {
        return syllabi.reduce<Record<string, number>>((acc, item) => {
            if (item.subject_id !== undefined && item.subject_id !== null) {
                acc[String(item.subject_id)] = item.completion_percentage ?? 0;
            }
            return acc;
        }, {});
    }, [syllabi]);

    const duplicateSummary = useMemo(() => {
        const nameCounts: Record<string, number> = {};
        const codeCounts: Record<string, number> = {};
        subjects.forEach((subject) => {
            const nameKey = subject.name.trim().toLowerCase();
            const codeKey = subject.code.trim().toLowerCase();
            nameCounts[nameKey] = (nameCounts[nameKey] || 0) + 1;
            codeCounts[codeKey] = (codeCounts[codeKey] || 0) + 1;
        });
        const duplicateNames = new Set(Object.keys(nameCounts).filter((key) => nameCounts[key] > 1));
        const duplicateCodes = new Set(Object.keys(codeCounts).filter((key) => codeCounts[key] > 1));
        return {
            duplicateNames,
            duplicateCodes,
            hasDuplicates: duplicateNames.size > 0 || duplicateCodes.size > 0,
        };
    }, [subjects]);

    const filteredSubjects = useMemo(() => {
        const search = searchQuery.trim().toLowerCase();
        return subjects.filter((subject) => {
            const mappings = classSubjectsBySubject[subject.id] || [];
            const teacherMatch = mappings.some((mapping) => (mapping.teacher_name || '').toLowerCase().includes(search));
            const matchesSearch = !search || subject.name.toLowerCase().includes(search) || subject.code.toLowerCase().includes(search) || teacherMatch;
            const matchesGrade = selectedGrade === 'all'
                ? true
                : mappings.some((mapping) => String(mapping.grade_level) === selectedGrade);
            const matchesDuplicate = showDuplicatesOnly
                ? duplicateSummary.duplicateNames.has(subject.name.trim().toLowerCase()) || duplicateSummary.duplicateCodes.has(subject.code.trim().toLowerCase())
                : true;
            return matchesSearch && matchesGrade && matchesDuplicate;
        });
    }, [subjects, classSubjectsBySubject, searchQuery, selectedGrade, showDuplicatesOnly, duplicateSummary]);

    const getSubjectColor = (name: string) => SUBJECT_COLORS[name] || '#6B7280';

    const getTeacherLabel = (mappings: ClassSubject[]) => {
        const teacherNames = Array.from(new Set(mappings.map((mapping) => mapping.teacher_name).filter(Boolean))) as string[];
        if (teacherNames.length === 0) return 'Not assigned';
        if (teacherNames.length === 1) return teacherNames[0];
        return `${teacherNames[0]} +${teacherNames.length - 1}`;
    };

    const getPeriodsLabel = (mappings: ClassSubject[]) => {
        const periods = Array.from(new Set(mappings.map((mapping) => mapping.weekly_periods).filter((value) => value !== undefined && value !== null))) as number[];
        if (periods.length === 0) return 'N/A';
        if (periods.length === 1) return `${periods[0]} periods/week`;
        return 'Varies';
    };

    const getGradesLabel = (mappings: ClassSubject[]) => {
        const gradeNames = mappings.map((mapping) => mapping.grade_level_name).filter(Boolean) as string[];
        if (gradeNames.length === 0) return 'No grades linked';
        return gradeNames.join(', ');
    };

    const getTeacherDisplayName = (teacher: Teacher) => {
        if (teacher.name) return teacher.name;
        const fullName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim();
        return fullName || teacher.email || 'Unknown';
    };

    const resetFormState = () => {
        setFormData({
            name: '',
            code: '',
            description: '',
            subject_type: 'THEORY',
            is_active: true,
            display_order: 0,
        });
        setMappingRows([]);
        setDeletedMappingIds([]);
        setFormError(null);
        setFormFieldErrors({});
    };

    const getDefaultAcademicYear = () => {
        const activeYear = academicYears.find((year) => year.is_active);
        return activeYear?.id || academicYears[0]?.id || '';
    };

    const openCreateModal = () => {
        resetFormState();
        setSelectedSubject(null);
        setShowDetailModal(false);
        setFormMode('create');
        setMappingRows([
            {
                grade_level: gradeLevels[0]?.id || '',
                academic_year: getDefaultAcademicYear(),
                teacher: null,
                weekly_periods: 5,
                total_marks: 100,
                passing_marks: 40,
                is_mandatory: true,
                is_elective: false,
                display_order: 0,
            }
        ]);
        setShowFormModal(true);
    };

    const openEditModal = (subject: Subject) => {
        setFormMode('edit');
        setSelectedSubject(subject);
        setShowDetailModal(false);
        setFormData({
            name: subject.name,
            code: subject.code,
            description: subject.description || '',
            subject_type: subject.subject_type || 'THEORY',
            is_active: subject.is_active ?? true,
            display_order: subject.display_order ?? 0,
        });
        const mappings = (classSubjectsBySubject[subject.id] || []).map((mapping) => ({
            id: mapping.id,
            grade_level: String(mapping.grade_level),
            academic_year: String(mapping.academic_year),
            teacher: mapping.teacher || null,
            weekly_periods: mapping.weekly_periods ?? 5,
            total_marks: mapping.total_marks ?? 100,
            passing_marks: mapping.passing_marks ?? 40,
            is_mandatory: mapping.is_mandatory ?? true,
            is_elective: mapping.is_elective ?? false,
            display_order: mapping.display_order ?? 0,
        }));
        setMappingRows(mappings);
        setDeletedMappingIds([]);
        setFormError(null);
        setFormFieldErrors({});
        setShowFormModal(true);
    };

    const openSubjectDetail = (subject: Subject) => {
        const mappings = (classSubjectsBySubject[subject.id] || []).map((mapping) => ({
            id: mapping.id,
            grade_level: String(mapping.grade_level),
            academic_year: String(mapping.academic_year),
            teacher: mapping.teacher || null,
            weekly_periods: mapping.weekly_periods ?? 5,
            total_marks: mapping.total_marks ?? 100,
            passing_marks: mapping.passing_marks ?? 40,
            is_mandatory: mapping.is_mandatory ?? true,
            is_elective: mapping.is_elective ?? false,
            display_order: mapping.display_order ?? 0,
        }));
        setSelectedSubject(subject);
        setAssignmentEdits(mappings);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedSubject(null);
    };

    const closeFormModal = () => {
        setShowFormModal(false);
    };

    const updateMappingRow = (index: number, updates: Partial<MappingRow>) => {
        setMappingRows((prev) => prev.map((row, rowIndex) => rowIndex === index ? { ...row, ...updates } : row));
    };

    const removeMappingRow = (index: number) => {
        setMappingRows((prev) => {
            const row = prev[index];
            if (row?.id) {
                setDeletedMappingIds((ids) => [...ids, row.id!]);
            }
            return prev.filter((_, rowIndex) => rowIndex !== index);
        });
    };

    const addMappingRow = () => {
        setMappingRows((prev) => [
            ...prev,
            {
                grade_level: gradeLevels[0]?.id || '',
                academic_year: getDefaultAcademicYear(),
                teacher: null,
                weekly_periods: 5,
                total_marks: 100,
                passing_marks: 40,
                is_mandatory: true,
                is_elective: false,
                display_order: prev.length + 1,
            }
        ]);
    };

    const handleAssignmentChange = (index: number, updates: Partial<MappingRow>) => {
        setAssignmentEdits((prev) => prev.map((row, rowIndex) => rowIndex === index ? { ...row, ...updates } : row));
    };

    const handleSaveAssignments = async () => {
        if (!selectedSubject) return;
        setIsSavingAssignments(true);
        setApiError(null);
        try {
            const updates = assignmentEdits.filter((mapping) => mapping.id);
            await Promise.all(updates.map((mapping) => api.patch(`/tenants/class-subjects/${mapping.id}/`, {
                teacher: mapping.teacher || null,
                weekly_periods: mapping.weekly_periods,
                total_marks: mapping.total_marks,
                passing_marks: mapping.passing_marks,
                is_mandatory: mapping.is_mandatory,
                is_elective: mapping.is_elective,
                display_order: mapping.display_order ?? 0,
            })));
            await refetchClassSubjects();
        } catch (error) {
            console.error('Failed to update teacher assignments:', error);
            setApiError('Failed to update teacher assignments. Please try again.');
        } finally {
            setIsSavingAssignments(false);
        }
    };

    const handleSaveSubject = async () => {
        setIsSaving(true);
        setFormError(null);
        setFormFieldErrors({});
        try {
            const subjectPayload = {
                name: formData.name.trim(),
                code: formData.code.trim(),
                description: formData.description.trim(),
                subject_type: formData.subject_type,
                is_active: formData.is_active,
                display_order: formData.display_order,
            };
            let subjectId = selectedSubject?.id;
            if (formMode === 'create') {
                const response = await api.post('/tenants/subjects/', subjectPayload);
                subjectId = response.data?.id || response.data?.uuid || subjectId;
            } else if (subjectId) {
                await api.patch(`/tenants/subjects/${subjectId}/`, subjectPayload);
            }

            if (!subjectId) {
                throw new Error('Subject ID not available after save.');
            }

            const mappingPromises = mappingRows.map((mapping) => {
                const payload = {
                    subject: subjectId,
                    grade_level: mapping.grade_level,
                    academic_year: mapping.academic_year || getDefaultAcademicYear(),
                    teacher: mapping.teacher || null,
                    weekly_periods: mapping.weekly_periods,
                    total_marks: mapping.total_marks,
                    passing_marks: mapping.passing_marks,
                    is_mandatory: mapping.is_mandatory,
                    is_elective: mapping.is_elective,
                    display_order: mapping.display_order ?? 0,
                };
                if (mapping.id) {
                    return api.patch(`/tenants/class-subjects/${mapping.id}/`, payload);
                }
                return api.post('/tenants/class-subjects/', payload);
            });

            const deletePromises = deletedMappingIds.map((id) => api.delete(`/tenants/class-subjects/${id}/`));
            await Promise.all([...mappingPromises, ...deletePromises]);

            await refetchSubjects();
            await refetchClassSubjects();
            setShowFormModal(false);
        } catch (error: any) {
            console.error('Failed to save subject:', error);
            const errorData = error?.response?.data;
            if (errorData && typeof errorData === 'object') {
                const fieldErrors: Record<string, string[]> = {};
                Object.keys(errorData).forEach((key) => {
                    fieldErrors[key] = Array.isArray(errorData[key]) ? errorData[key] : [String(errorData[key])];
                });
                setFormFieldErrors(fieldErrors);
            }
            setFormError('Unable to save subject. Please review the highlighted fields and try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSubject = async (subject: Subject) => {
        if (!window.confirm(`Delete ${subject.name}? This will remove all linked grade mappings.`)) {
            return;
        }
        try {
            await api.delete(`/tenants/subjects/${subject.id}/`);
            await refetchSubjects();
            await refetchClassSubjects();
            if (selectedSubject?.id === subject.id) {
                closeDetailModal();
            }
        } catch (error) {
            console.error('Failed to delete subject:', error);
            setApiError('Unable to delete subject. Please try again.');
        }
    };

    const handleViewSyllabus = (subject: Subject) => {
        navigate(`/syllabus?subject=${subject.id}`);
    };

    const handleExport = () => {
        const rows = filteredSubjects.map((subject) => {
            const mappings = classSubjectsBySubject[subject.id] || [];
            return {
                name: subject.name,
                code: subject.code,
                subject_type: subject.subject_type || 'THEORY',
                grades: getGradesLabel(mappings),
                teacher: getTeacherLabel(mappings),
                weekly_periods: getPeriodsLabel(mappings),
            };
        });
        const headers = ['name', 'code', 'subject_type', 'grades', 'teacher', 'weekly_periods'];
        const csvContent = [headers.join(','), ...rows.map((row) => headers.map((key) => `"${String((row as any)[key] ?? '')}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'subjects_export.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        navigate('/settings/data-management');
    };

    const handleModalKeyDown = (
        event: React.KeyboardEvent,
        modalRef: React.RefObject<HTMLDivElement>,
        onClose: () => void
    ) => {
        if (event.key === 'Escape') {
            event.stopPropagation();
            onClose();
            return;
        }
        if (event.key !== 'Tab') return;
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    useEffect(() => {
        if (showDetailModal && detailModalRef.current) {
            const focusable = detailModalRef.current.querySelector<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            focusable?.focus();
        }
    }, [showDetailModal]);

    useEffect(() => {
        if (showFormModal && formModalRef.current) {
            const focusable = formModalRef.current.querySelector<HTMLElement>(
                'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])'
            );
            focusable?.focus();
        }
    }, [showFormModal]);

    if (isLoading) {
        return (
            <div className="subjects-loading">
                <div className="loading-spinner"></div>
                <p>Loading subjects...</p>
            </div>
        );
    }

    return (
        <div className="subjects-container">
            <div className="subjects-header">
                <div className="header-content">
                    <h1>Subjects</h1>
                    <p className="header-subtitle">Manage subjects, grade mappings, teacher assignments, and syllabus progress</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={handleImport}>Import</button>
                    <button className="btn-secondary" onClick={handleExport}>Export</button>
                    <button className="btn-primary" onClick={openCreateModal}>
                        <i className="icon-plus"></i>
                        Add Subject
                    </button>
                </div>
            </div>

            {apiError && (
                <div className="subjects-alert error" role="alert">
                    {apiError}
                </div>
            )}

            {usingMockData && (
                <div className="subjects-alert warning" role="status">
                    Demo data is displayed because the live API is unreachable.
                </div>
            )}

            {duplicateSummary.hasDuplicates && (
                <div className="subjects-alert warning" role="status">
                    Duplicate subject names or codes detected. Review duplicates to avoid conflicts.
                    <button className="btn-ghost" onClick={() => setShowDuplicatesOnly((prev) => !prev)}>
                        {showDuplicatesOnly ? 'Show all' : 'Show duplicates'}
                    </button>
                </div>
            )}

            <div className="subjects-filters">
                <div className="search-box">
                    <i className="icon-search"></i>
                    <input
                        type="text"
                        placeholder="Search subjects, teachers..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        aria-label="Search subjects or teachers"
                    />
                </div>
                <select
                    value={selectedGrade}
                    onChange={(e) => { setSelectedGrade(e.target.value); setPage(1); }}
                    className="grade-filter"
                    aria-label="Filter by grade"
                >
                    <option value="all">All Grades</option>
                    {gradeLevels.map((grade) => (
                        <option key={grade.id} value={grade.id}>{grade.name}</option>
                    ))}
                </select>
            </div>

            <div className="subjects-grid">
                {filteredSubjects.map((subject: Subject) => {
                    const color = getSubjectColor(subject.name);
                    const mappings = classSubjectsBySubject[subject.id] || [];
                    const syllabusProgress = Math.round(syllabusBySubjectId[subject.id] ?? 0);
                    const progressColor = syllabusProgress >= 70 ? '#10B981' :
                        syllabusProgress >= 40 ? '#F59E0B' : '#EF4444';
                    const gradeNames = mappings.map((mapping) => mapping.grade_level_name).filter(Boolean) as string[];
                    const displayedGrades = gradeNames.slice(0, 3);
                    const remainingGrades = gradeNames.length - displayedGrades.length;

                    return (
                        <div
                            key={subject.id}
                            className="subject-card"
                            onClick={() => openSubjectDetail(subject)}
                        >
                            <div className="subject-color-bar" style={{ backgroundColor: color }}></div>
                            <div className="subject-content">
                                <div className="subject-header">
                                    <div className="subject-icon" style={{ backgroundColor: `${color}20`, color }}>
                                        {subject.name.charAt(0)}
                                    </div>
                                    <div className="subject-info">
                                        <h3>{subject.name}</h3>
                                        <span className="subject-code">{subject.code}</span>
                                    </div>
                                    {mappings.some((mapping) => mapping.is_elective) && (
                                        <span className="elective-badge">Elective</span>
                                    )}
                                </div>

                                <div className="grade-chips">
                                    {displayedGrades.map((grade) => (
                                        <span key={grade} className="grade-chip">{grade}</span>
                                    ))}
                                    {remainingGrades > 0 && (
                                        <span className="grade-chip grade-overflow">+{remainingGrades}</span>
                                    )}
                                    {gradeNames.length === 0 && (
                                        <span className="grade-chip grade-empty">No grade links</span>
                                    )}
                                </div>

                                <div className="subject-meta">
                                    <div className="meta-item">
                                        <i className="icon-user"></i>
                                        <span>{getTeacherLabel(mappings)}</span>
                                    </div>
                                    <div className="meta-item">
                                        <i className="icon-clock"></i>
                                        <span>{getPeriodsLabel(mappings)}</span>
                                    </div>
                                    <div className="meta-item">
                                        <i className="icon-award"></i>
                                        <span>{subject.subject_type || 'THEORY'}</span>
                                    </div>
                                </div>

                                <div className="syllabus-progress">
                                    <div className="progress-header">
                                        <span>Syllabus Progress</span>
                                        <span style={{ color: progressColor, fontWeight: 600 }}>
                                            {syllabusProgress}%
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${syllabusProgress}%`,
                                                backgroundColor: progressColor
                                            }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="subject-actions" onClick={(event) => event.stopPropagation()}>
                                    <button className="btn-ghost" onClick={() => openEditModal(subject)}>Edit</button>
                                    <button className="btn-ghost danger" onClick={() => handleDeleteSubject(subject)}>Delete</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="subjects-pagination">
                <div className="pagination-info">
                    Showing {filteredSubjects.length} of {total} subjects
                </div>
                <div className="pagination-controls">
                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                        aria-label="Subjects per page"
                    >
                        {[12, 24, 48].map((size) => (
                            <option key={size} value={size}>{size} per page</option>
                        ))}
                    </select>
                    <button className="btn-secondary" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
                        Previous
                    </button>
                    <span className="page-indicator">Page {page}</span>
                    <button
                        className="btn-secondary"
                        onClick={() => setPage((prev) => prev + 1)}
                        disabled={page * pageSize >= total}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Subject Detail Modal */}
            {showDetailModal && selectedSubject && (
                <div className="modal-overlay" onClick={closeDetailModal}>
                    <div
                        className="modal-content subject-modal"
                        onClick={e => e.stopPropagation()}
                        onKeyDown={(event) => handleModalKeyDown(event, detailModalRef, closeDetailModal)}
                        ref={detailModalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="subject-detail-title"
                    >
                        <div className="modal-header" style={{ borderLeftColor: getSubjectColor(selectedSubject.name) }}>
                            <div className="modal-icon" style={{
                                backgroundColor: `${getSubjectColor(selectedSubject.name)}20`,
                                color: getSubjectColor(selectedSubject.name)
                            }}>
                                {selectedSubject.name.charAt(0)}
                            </div>
                            <div className="modal-title-area">
                                <h2 id="subject-detail-title">{selectedSubject.name}</h2>
                                <span className="modal-subtitle">{selectedSubject.code} • {selectedSubject.subject_type || 'THEORY'}</span>
                            </div>
                            <button className="modal-close" onClick={closeDetailModal} aria-label="Close subject details">×</button>
                        </div>

                        <div className="modal-body">
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <label>Status</label>
                                    <span>{selectedSubject.is_active ? 'Active' : 'Inactive'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Grades</label>
                                    <span>{getGradesLabel(classSubjectsBySubject[selectedSubject.id] || [])}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Teachers</label>
                                    <span>{getTeacherLabel(classSubjectsBySubject[selectedSubject.id] || [])}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Periods</label>
                                    <span>{getPeriodsLabel(classSubjectsBySubject[selectedSubject.id] || [])}</span>
                                </div>
                            </div>

                            <div className="assignments-section">
                                <h4>Grade Mappings & Assignments</h4>
                                {assignmentEdits.length === 0 && (
                                    <p className="empty-state">No grade mappings yet.</p>
                                )}
                                {assignmentEdits.map((mapping, index) => (
                                    <div key={mapping.id || index} className="mapping-row">
                                        <div className="mapping-cell">
                                            <label>Grade</label>
                                            <span>
                                                {gradeLevels.find((grade) => grade.id === mapping.grade_level)?.name || 'Unassigned'}
                                            </span>
                                        </div>
                                        <div className="mapping-cell">
                                            <label>Teacher</label>
                                            <select
                                                value={mapping.teacher || ''}
                                                onChange={(e) => handleAssignmentChange(index, { teacher: e.target.value || null })}
                                                aria-label="Assign teacher"
                                            >
                                                <option value="">Not assigned</option>
                                                {teachers.map((teacher) => (
                                                    <option key={teacher.id} value={teacher.id}>{getTeacherDisplayName(teacher)}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mapping-cell">
                                            <label>Periods/Week</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={mapping.weekly_periods}
                                                onChange={(e) => handleAssignmentChange(index, { weekly_periods: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="mapping-cell">
                                            <label>Total Marks</label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={mapping.total_marks}
                                                onChange={(e) => handleAssignmentChange(index, { total_marks: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {assignmentEdits.length > 0 && (
                                    <button className="btn-secondary" onClick={handleSaveAssignments} disabled={isSavingAssignments}>
                                        {isSavingAssignments ? 'Saving...' : 'Save Assignments'}
                                    </button>
                                )}
                            </div>

                            <div className="syllabus-section">
                                <h4>Syllabus Progress</h4>
                                <div className="full-progress-bar">
                                    <div
                                        className="full-progress-fill"
                                        style={{ width: `${Math.round(syllabusBySubjectId[selectedSubject.id] ?? 0)}%` }}
                                    ></div>
                                </div>
                                <p className="progress-text">{Math.round(syllabusBySubjectId[selectedSubject.id] ?? 0)}% Complete</p>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={closeDetailModal}>Close</button>
                            <button className="btn-secondary" onClick={() => openEditModal(selectedSubject)}>Edit Subject</button>
                            <button className="btn-danger" onClick={() => handleDeleteSubject(selectedSubject)}>Delete</button>
                            <button className="btn-primary" onClick={() => handleViewSyllabus(selectedSubject)}>View Syllabus</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Subject Create/Edit Modal */}
            {showFormModal && (
                <div className="modal-overlay" onClick={closeFormModal}>
                    <div
                        className="modal-content subject-modal form-modal"
                        onClick={e => e.stopPropagation()}
                        onKeyDown={(event) => handleModalKeyDown(event, formModalRef, closeFormModal)}
                        ref={formModalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="subject-form-title"
                    >
                        <div className="modal-header" style={{ borderLeftColor: '#6366F1' }}>
                            <div className="modal-title-area">
                                <h2 id="subject-form-title">{formMode === 'create' ? 'Add Subject' : 'Edit Subject'}</h2>
                                <span className="modal-subtitle">Define subject details and grade mappings</span>
                            </div>
                            <button className="modal-close" onClick={closeFormModal} aria-label="Close subject form">×</button>
                        </div>

                        <div className="modal-body">
                            {formError && <div className="subjects-alert error" role="alert">{formError}</div>}

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Subject Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                        aria-invalid={Boolean(formFieldErrors.name)}
                                    />
                                    {formFieldErrors.name && <span className="field-error">{formFieldErrors.name.join(', ')}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Subject Code</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                                        aria-invalid={Boolean(formFieldErrors.code)}
                                    />
                                    {formFieldErrors.code && <span className="field-error">{formFieldErrors.code.join(', ')}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Subject Type</label>
                                    <select
                                        value={formData.subject_type}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, subject_type: e.target.value as SubjectFormState['subject_type'] }))}
                                    >
                                        <option value="THEORY">Theory</option>
                                        <option value="PRACTICAL">Practical</option>
                                        <option value="BOTH">Theory + Practical</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Display Order</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={formData.display_order}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, display_order: Number(e.target.value) }))}
                                    />
                                </div>
                                <div className="form-group full">
                                    <label>Description</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                                        />
                                        Active
                                    </label>
                                </div>
                            </div>

                            <div className="mapping-editor">
                                <div className="mapping-header">
                                    <h4>Grade Mappings</h4>
                                    <button className="btn-ghost" onClick={addMappingRow}>+ Add Mapping</button>
                                </div>
                                {mappingRows.length === 0 && (
                                    <p className="empty-state">No grade mappings yet. Add at least one mapping to link this subject to a grade.</p>
                                )}
                                {mappingRows.map((mapping, index) => (
                                    <div key={mapping.id || index} className="mapping-row">
                                        <div className="mapping-cell">
                                            <label>Grade</label>
                                            <select
                                                value={mapping.grade_level}
                                                onChange={(e) => updateMappingRow(index, { grade_level: e.target.value })}
                                            >
                                                <option value="">Select grade</option>
                                                {gradeLevels.map((grade) => (
                                                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mapping-cell">
                                            <label>Academic Year</label>
                                            <select
                                                value={mapping.academic_year}
                                                onChange={(e) => updateMappingRow(index, { academic_year: e.target.value })}
                                            >
                                                <option value="">Select year</option>
                                                {academicYears.map((year) => (
                                                    <option key={year.id} value={year.id}>{year.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mapping-cell">
                                            <label>Teacher</label>
                                            <select
                                                value={mapping.teacher || ''}
                                                onChange={(e) => updateMappingRow(index, { teacher: e.target.value || null })}
                                            >
                                                <option value="">Not assigned</option>
                                                {teachers.map((teacher) => (
                                                    <option key={teacher.id} value={teacher.id}>{getTeacherDisplayName(teacher)}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mapping-cell">
                                            <label>Periods/Week</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={mapping.weekly_periods}
                                                onChange={(e) => updateMappingRow(index, { weekly_periods: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="mapping-cell">
                                            <label>Total Marks</label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={mapping.total_marks}
                                                onChange={(e) => updateMappingRow(index, { total_marks: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="mapping-cell">
                                            <label>Passing Marks</label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={mapping.passing_marks}
                                                onChange={(e) => updateMappingRow(index, { passing_marks: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="mapping-cell checkbox">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={mapping.is_mandatory}
                                                    onChange={(e) => updateMappingRow(index, { is_mandatory: e.target.checked })}
                                                />
                                                Mandatory
                                            </label>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={mapping.is_elective}
                                                    onChange={(e) => updateMappingRow(index, { is_elective: e.target.checked })}
                                                />
                                                Elective
                                            </label>
                                        </div>
                                        <div className="mapping-cell actions">
                                            <button className="btn-ghost danger" onClick={() => removeMappingRow(index)}>Remove</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={closeFormModal}>Cancel</button>
                            <button className="btn-primary" onClick={handleSaveSubject} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Subject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectsList;
