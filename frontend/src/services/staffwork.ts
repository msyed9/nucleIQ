/**
 * Staffwork API service: lesson plans, admin tasks, daily status updates
 * (with per-student remarks), reports, and the consolidated dashboard.
 *
 * All calls go through the shared axios instance (auth + tenant headers are
 * attached by its interceptors). Paths are v1.
 */

import api from './api';

const BASE = '/staffwork';

// ---- Types ---------------------------------------------------------------
export interface StudentRemarkInput {
    student: string;
    did_not_do_homework?: boolean;
    did_not_complete_classwork?: boolean;
    was_disruptive?: boolean;
    was_absent?: boolean;
    participated_well?: boolean;
    remark?: string;
    severity?: '' | 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DailyUpdateInput {
    role: string;
    date?: string;
    summary: string;
    details?: string;
    related_class?: string | null;
    status?: 'DRAFT' | 'SUBMITTED';
    student_remarks?: StudentRemarkInput[];
}

export interface LessonPlanInput {
    topic: string;
    date: string;
    objectives?: string;
    activities?: string;
    resources?: string;
    homework?: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    section?: string | null;
    subject?: string | null;
}

// ---- Lesson plans --------------------------------------------------------
export const lessonPlans = {
    list: (params?: Record<string, any>) => api.get(`${BASE}/lesson-plans/`, { params }),
    get: (id: string) => api.get(`${BASE}/lesson-plans/${id}/`),
    create: (data: LessonPlanInput) => api.post(`${BASE}/lesson-plans/`, data),
    update: (id: string, data: Partial<LessonPlanInput>) => api.patch(`${BASE}/lesson-plans/${id}/`, data),
    remove: (id: string) => api.delete(`${BASE}/lesson-plans/${id}/`),
    share: (id: string, userIds: string[]) => api.post(`${BASE}/lesson-plans/${id}/share/`, { user_ids: userIds }),
};

// ---- Admin tasks ---------------------------------------------------------
export const adminTasks = {
    my: (params?: Record<string, any>) => api.get(`${BASE}/admin-tasks/my/`, { params }),
    list: (params?: Record<string, any>) => api.get(`${BASE}/admin-tasks/`, { params }),
    complete: (id: string, data: { status?: string; update_notes?: string }) =>
        api.post(`${BASE}/admin-tasks/${id}/complete/`, data),
    generate: (date?: string) => api.post(`${BASE}/admin-tasks/generate/`, date ? { date } : {}),
    teamStatus: (date?: string) => api.get(`${BASE}/admin-tasks/team-status/`, { params: date ? { date } : {} }),
    createAdHoc: (data: { assigned_to: string; date: string; title: string; description?: string; due_time?: string }) =>
        api.post(`${BASE}/admin-tasks/`, data),
};

export const adminTaskTemplates = {
    list: (params?: Record<string, any>) => api.get(`${BASE}/admin-task-templates/`, { params }),
    create: (data: any) => api.post(`${BASE}/admin-task-templates/`, data),
    update: (id: string, data: any) => api.patch(`${BASE}/admin-task-templates/${id}/`, data),
    remove: (id: string) => api.delete(`${BASE}/admin-task-templates/${id}/`),
};

// ---- Daily updates -------------------------------------------------------
export const dailyUpdates = {
    list: (params?: Record<string, any>) => api.get(`${BASE}/daily-updates/`, { params }),
    get: (id: string) => api.get(`${BASE}/daily-updates/${id}/`),
    create: (data: DailyUpdateInput) => api.post(`${BASE}/daily-updates/`, data),
    update: (id: string, data: Partial<DailyUpdateInput>) => api.patch(`${BASE}/daily-updates/${id}/`, data),
    consolidated: (params?: Record<string, any>) => api.get(`${BASE}/daily-updates/consolidated/`, { params }),
    review: (id: string, reviewNotes?: string) =>
        api.post(`${BASE}/daily-updates/${id}/review/`, { review_notes: reviewNotes || '' }),
};

// ---- Reports -------------------------------------------------------------
export const reports = {
    list: (params?: Record<string, any>) => api.get(`${BASE}/reports/`, { params }),
    create: (formData: FormData) =>
        api.post(`${BASE}/reports/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export default { lessonPlans, adminTasks, adminTaskTemplates, dailyUpdates, reports };
