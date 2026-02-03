/**
 * Timetable Hooks
 */

import { useState, useCallback, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '@/design-system';

export function useTimetableData(academicYearId: string, gradeLevelId: string) {
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [gradeLevels, setGradeLevels] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [generationStatus, setGenerationStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchAcademicYears = useCallback(async () => {
        try {
            const response = await api.get('/tenants/years/');
            setAcademicYears(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching academic years:', err);
        }
    }, []);

    const fetchGradeLevels = useCallback(async () => {
        try {
            const response = await api.get('/tenants/grades/');
            setGradeLevels(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching grade levels:', err);
        }
    }, []);

    const fetchSections = useCallback(async (yearId: string, gradeId: string) => {
        if (!yearId) return;
        try {
            const params: any = {};
            if (gradeId) params.grade_level = gradeId;
            const response = await api.get('/tenants/sections/', { params });
            setSections(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching sections:', err);
        }
    }, []);

    const fetchSubjects = useCallback(async () => {
        try {
            const response = await api.get('/tenants/subjects/');
            setSubjects(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching subjects:', err);
        }
    }, []);

    const fetchTeachers = useCallback(async () => {
        try {
            const response = await api.get('/staff/');
            setTeachers(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching teachers:', err);
        }
    }, []);

    const fetchGenerationStatus = useCallback(async () => {
        try {
            const response = await api.get('/timetable/generation/status/');
            setGenerationStatus(response.data);
        } catch (err) {
            console.error('Error fetching generation status:', err);
        }
    }, []);

    useEffect(() => {
        fetchAcademicYears();
        fetchGradeLevels();
        fetchSubjects();
        fetchTeachers();
        fetchGenerationStatus();
    }, [fetchAcademicYears, fetchGradeLevels, fetchSubjects, fetchTeachers, fetchGenerationStatus]);

    useEffect(() => {
        fetchSections(academicYearId, gradeLevelId);
    }, [academicYearId, gradeLevelId, fetchSections]);

    return {
        academicYears,
        gradeLevels,
        sections,
        subjects,
        teachers,
        generationStatus,
        loading,
        fetchGenerationStatus,
    };
}

export function useTimetableSlots(sectionId: string, academicYearId: string) {
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { success, error: showError, warning } = useToast();

    const fetchSlots = useCallback(async () => {
        if (!sectionId || !academicYearId) {
            setSlots([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/timetable/slots/', {
                params: { section: sectionId, academic_year: academicYearId }
            });
            setSlots(response.data.results || response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error fetching timetable');
        } finally {
            setLoading(false);
        }
    }, [sectionId, academicYearId]);

    useEffect(() => {
        fetchSlots();
    }, [fetchSlots]);

    const createSlot = async (slotData: any) => {
        try {
            // Check availability first
            const availabilityResponse = await api.post('/timetable/slots/check_availability/', {
                academic_year: slotData.academic_year,
                day_of_week: slotData.day_of_week,
                start_time: slotData.start_time,
                end_time: slotData.end_time,
                teacher_id: slotData.teacher,
                room: slotData.room || '',
                section_id: slotData.section,
            });

            if (!availabilityResponse.data.is_available) {
                const conflicts: string[] = [];
                if (availabilityResponse.data.teacher_conflicts?.length > 0) conflicts.push('Teacher');
                if (availabilityResponse.data.room_conflicts?.length > 0) conflicts.push('Room');
                if (availabilityResponse.data.section_conflicts?.length > 0) conflicts.push('Section');

                warning('Conflicts: ' + conflicts.join(', '));
                return null;
            }

            const response = await api.post('/timetable/slots/', slotData);
            setSlots(prev => [...prev, response.data]);
            success('Slot created successfully');
            return response.data;
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error creating slot');
            return null;
        }
    };

    const updateSlot = async (id: string, slotData: any) => {
        try {
            const response = await api.patch(`/timetable/slots/${id}/`, slotData);
            setSlots(prev => prev.map(s => s.id === id ? response.data : s));
            success('Slot updated successfully');
            return response.data;
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error updating slot');
            return null;
        }
    };

    const deleteSlot = async (id: string) => {
        try {
            await api.delete(`/timetable/slots/${id}/`);
            setSlots(prev => prev.filter(s => s.id !== id));
            success('Slot deleted successfully');
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error deleting slot');
        }
    };

    const generateTimetable = async (clearExisting: boolean = false) => {
        setLoading(true);
        try {
            const response = await api.post('/timetable/generation/generate/', {
                section_ids: sectionId ? [sectionId] : undefined,
                clear_existing: clearExisting
            });

            if (response.data.success) {
                success(`Generated ${response.data.generated_count} slots!`);
                fetchSlots();
            } else {
                showError(response.data.errors?.[0] || 'Generation failed');
            }
        } catch (err: any) {
            showError(err.response?.data?.error || 'Error generating timetable');
        } finally {
            setLoading(false);
        }
    };

    return {
        slots,
        loading,
        error,
        createSlot,
        updateSlot,
        deleteSlot,
        generateTimetable,
        refresh: fetchSlots,
    };
}
