/**
 * ID Cards API Service
 * Handles all API calls for ID card templates, generation, and QR scanning
 */

import api from './api';

export interface IDCardTemplate {
    id: string;
    tenant: string;
    name: string;
    description: string;
    entity_type: 'student' | 'staff';
    orientation: 'portrait' | 'landscape';
    width: number;
    height: number;
    config: any;
    background_type: 'color' | 'gradient' | 'image';
    background_value: string;
    is_default: boolean;
    is_system: boolean;
    is_active: boolean;
    version: number;
    parent_template?: string;
    created_at: string;
    updated_at: string;
}

export interface IDCardRecord {
    id: string;
    tenant: string;
    entity_type: 'student' | 'staff';
    entity_id: string;
    template: string;
    template_name: string;
    file_url: string;
    file_format: 'pdf' | 'png' | 'jpg';
    status: 'active' | 'expired' | 'replaced' | 'revoked';
    issued_date: string;
    valid_until: string;
    printed_count: number;
    last_printed?: string;
    entity_name: string;
    entity_details: any;
}

export interface GenerationJob {
    id: string;
    tenant: string;
    entity_type: 'student' | 'staff';
    filters: any;
    template: string;
    template_name: string;
    output_format: 'pdf' | 'png' | 'jpg';
    layout: 'individual' | 'grid' | 'sheet';
    include_qr: boolean;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    total_cards: number;
    completed_cards: number;
    failed_cards: number;
    download_url?: string;
    individual_files: Array<{ entity_id: string; file_url: string }>;
    started_at?: string;
    completed_at?: string;
    error_message?: string;
    created_at: string;
    created_by_name?: string;
    estimated_completion?: string;
}

// Template Management
export const getTemplates = async (entityType?: string) => {
    const params = entityType ? { entity_type: entityType } : {};
    return api.get('/idcards/templates/', { params });
};

export const getTemplate = async (id: string) => {
    return api.get(`/idcards/templates/${id}/`);
};

export const createTemplate = async (data: Partial<IDCardTemplate>) => {
    return api.post('/idcards/templates/', data);
};

export const updateTemplate = async (id: string, data: Partial<IDCardTemplate>) => {
    return api.patch(`/idcards/templates/${id}/`, data);
};

export const deleteTemplate = async (id: string) => {
    return api.delete(`/idcards/templates/${id}/`);
};

export const duplicateTemplate = async (id: string) => {
    return api.post(`/idcards/templates/${id}/duplicate/`);
};

export const setDefaultTemplate = async (id: string) => {
    return api.post(`/idcards/templates/${id}/set_default/`);
};

export const getSystemTemplates = async () => {
    return api.get('/idcards/templates/system_templates/');
};

export const previewTemplate = async (id: string) => {
    return api.get(`/idcards/templates/${id}/preview/`);
};

// ID Card Generation
export const generateSingleCard = async (data: {
    entity_type: 'student' | 'staff';
    entity_id: string;
    template_id?: string;
    include_qr?: boolean;
}) => {
    return api.post('/idcards/generate/single/', data);
};

export const generateBulkCards = async (data: {
    entity_type: 'student' | 'staff';
    filters?: any;
    template_id?: string;
    include_qr?: boolean;
    output_format?: 'pdf' | 'png' | 'jpg';
    layout?: 'individual' | 'grid' | 'sheet';
}) => {
    return api.post('/idcards/generate/bulk/', data);
};

export const getBulkJobStatus = async (jobId: string) => {
    return api.get(`/idcards/generate/bulk-status/${jobId}/`);
};

// ID Card Records
export const getIDCardRecords = async (params?: {
    entity_type?: string;
    status?: string;
}) => {
    return api.get('/idcards/records/', { params });
};

export const getIDCardRecord = async (id: string) => {
    return api.get(`/idcards/records/${id}/`);
};

export const markCardPrinted = async (id: string) => {
    return api.post(`/idcards/records/${id}/mark_printed/`);
};

export const revokeCard = async (id: string) => {
    return api.post(`/idcards/records/${id}/revoke/`);
};

// QR Attendance
export const scanQRCode = async (data: {
    qr_data: string;
    scan_location?: string;
    scan_device?: string;
    scan_type?: 'entry' | 'exit';
    timestamp?: string;
}) => {
    return api.post('/idcards/scan/', data);
};

export const getAttendanceRecords = async (params?: {
    date?: string;
}) => {
    return api.get('/idcards/attendance/', { params });
};

export const getDailyAttendanceReport = async (date?: string) => {
    const params = date ? { date } : {};
    return api.get('/idcards/attendance/daily_report/', { params });
};

export default {
    // Templates
    getTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    setDefaultTemplate,
    getSystemTemplates,
    previewTemplate,

    // Generation
    generateSingleCard,
    generateBulkCards,
    getBulkJobStatus,

    // Records
    getIDCardRecords,
    getIDCardRecord,
    markCardPrinted,
    revokeCard,

    // Attendance
    scanQRCode,
    getAttendanceRecords,
    getDailyAttendanceReport,
};
