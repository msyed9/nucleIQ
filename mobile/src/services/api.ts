import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - Update this for production
const API_BASE_URL = __DEV__
    ? 'http://10.0.2.2:8000/api'  // Android Emulator - Change to your local IP for physical devices
    : 'https://api.nucleiq.com/api';    // Production URL

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            // Add tenant header if available
            const isPlatformAdmin = await AsyncStorage.getItem('is_platform_admin');
            if (isPlatformAdmin !== 'true') {
                const tenant = await AsyncStorage.getItem('current_tenant');
                if (tenant && config.headers) {
                    config.headers['X-Tenant-ID'] = tenant;
                }
            }
        } catch (error) {
            console.error('Error in request interceptor:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await AsyncStorage.getItem('refresh_token');
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                        refresh: refreshToken,
                    });

                    const { access } = response.data;
                    await AsyncStorage.setItem('access_token', access);

                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
            }
        }

        return Promise.reject(error);
    }
);

// Auth API endpoints
export const authAPI = {
    login: async (credentials: { email: string; password: string }) => {
        const response = await api.post('/auth/login/', credentials);
        return response.data;
    },

    logout: async (refreshToken: string) => {
        const response = await api.post('/auth/logout/', { refresh: refreshToken });
        return response.data;
    },

    refreshToken: async (refreshToken: string) => {
        const response = await api.post('/auth/token/refresh/', { refresh: refreshToken });
        return response.data;
    },
};

// User API endpoints
export const userAPI = {
    getProfile: async () => {
        const response = await api.get('/users/profile/');
        return response.data;
    },

    updateProfile: async (data: any) => {
        const response = await api.patch('/users/profile/', data);
        return response.data;
    },

    changePassword: async (data: { old_password: string; new_password: string }) => {
        const response = await api.post('/users/change-password/', data);
        return response.data;
    },
};

// Students API
export const studentsAPI = {
    getAll: async (params?: any) => {
        const response = await api.get('/students/', { params });
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get(`/students/${id}/`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post('/students/', data);
        return response.data;
    },

    update: async (id: number, data: any) => {
        const response = await api.patch(`/students/${id}/`, data);
        return response.data;
    },

    delete: async (id: number) => {
        const response = await api.delete(`/students/${id}/`);
        return response.data;
    },

    getByClass: async (classId: number, sectionId?: number) => {
        const params: any = { current_class: classId };
        if (sectionId) params.section = sectionId;
        const response = await api.get('/students/', { params });
        return response.data;
    },
};

// Staff API
export const staffAPI = {
    getAll: async (params?: any) => {
        const response = await api.get('/staff/', { params });
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get(`/staff/${id}/`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post('/staff/', data);
        return response.data;
    },

    update: async (id: number, data: any) => {
        const response = await api.patch(`/staff/${id}/`, data);
        return response.data;
    },

    delete: async (id: number) => {
        const response = await api.delete(`/staff/${id}/`);
        return response.data;
    },
};

// Staff Attendance QR API
export const staffAttendanceAPI = {
    /**
     * Generate a secure, time-sensitive QR token for staff attendance.
     * Only staff members can generate this token.
     * Token expires in 90 seconds.
     */
    generateQRToken: async () => {
        const response = await api.post('/staff/attendance/generate-qr-token/');
        return response.data;
    },

    /**
     * Verify a scanned QR token and mark staff attendance.
     * Only authorized personnel (Admin, Receptionist) can verify.
     * @param token - The scanned QR token string
     */
    verifyQRToken: async (token: string) => {
        const response = await api.post('/staff/attendance/verify-qr/', { token });
        return response.data;
    },
};

// Classes/Grade Levels API
export const classesAPI = {
    getAll: async () => {
        const response = await api.get('/academics/grade-levels/');
        return response.data;
    },

    getSections: async (classId: number) => {
        const response = await api.get(`/academics/grade-levels/${classId}/sections/`);
        return response.data;
    },
};

// Sections API
export const sectionsAPI = {
    getAll: async () => {
        const response = await api.get('/academics/sections/');
        return response.data;
    },

    getByClass: async (classId: number) => {
        const response = await api.get('/academics/sections/', { params: { grade_level: classId } });
        return response.data;
    },
};

// Attendance API
export const attendanceAPI = {
    mark: async (data: any) => {
        const response = await api.post('/attendance/mark/', data);
        return response.data;
    },

    getByDate: async (date: string, classId?: number, sectionId?: number) => {
        const params: any = { date };
        if (classId) params.class_id = classId;
        if (sectionId) params.section_id = sectionId;
        const response = await api.get('/attendance/', { params });
        return response.data;
    },

    getStudentAttendance: async (studentId: number, startDate?: string, endDate?: string) => {
        const params: any = { student_id: studentId };
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        const response = await api.get('/attendance/student/', { params });
        return response.data;
    },

    getAggregates: async (params?: any) => {
        const response = await api.get('/attendance/aggregates/', { params });
        return response.data;
    },
};

// Fees API
export const feesAPI = {
    getStudentFees: async (studentId: number) => {
        const response = await api.get(`/fees/student/${studentId}/`);
        return response.data;
    },

    collectFee: async (data: any) => {
        const response = await api.post('/fees/collect/', data);
        return response.data;
    },

    getPaymentHistory: async (params?: any) => {
        const response = await api.get('/fees/payments/', { params });
        return response.data;
    },

    getDefaulters: async (params?: any) => {
        const response = await api.get('/fees/defaulters/', { params });
        return response.data;
    },

    getFeeStructure: async () => {
        const response = await api.get('/fees/structure/');
        return response.data;
    },
};

// Exams API
export const examsAPI = {
    getAll: async (params?: any) => {
        const response = await api.get('/exams/', { params });
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get(`/exams/${id}/`);
        return response.data;
    },

    getResults: async (examId: number, params?: any) => {
        const response = await api.get(`/exams/${examId}/results/`, { params });
        return response.data;
    },

    submitResult: async (examId: number, data: any) => {
        const response = await api.post(`/exams/${examId}/results/`, data);
        return response.data;
    },
};

// Assignments API
export const assignmentsAPI = {
    getAll: async (params?: any) => {
        const response = await api.get('/assignments/', { params });
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get(`/assignments/${id}/`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post('/assignments/', data);
        return response.data;
    },

    submit: async (id: number, data: any) => {
        const response = await api.post(`/assignments/${id}/submit/`, data);
        return response.data;
    },

    getSubmissions: async (assignmentId: number) => {
        const response = await api.get(`/assignments/${assignmentId}/submissions/`);
        return response.data;
    },
};

// Subjects API
export const subjectsAPI = {
    getAll: async (params?: any) => {
        const response = await api.get('/academics/subjects/', { params });
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get(`/academics/subjects/${id}/`);
        return response.data;
    },
};

// Homework API
export const homeworkAPI = {
    getAll: async (params?: any) => {
        const response = await api.get('/homework/', { params });
        return response.data;
    },

    markComplete: async (id: number) => {
        const response = await api.post(`/homework/${id}/complete/`);
        return response.data;
    },
};

// Syllabus API
export const syllabusAPI = {
    getAll: async (params?: any) => {
        const response = await api.get('/syllabus/', { params });
        return response.data;
    },

    getBySubject: async (subjectId: number) => {
        const response = await api.get(`/syllabus/subject/${subjectId}/`);
        return response.data;
    },
};

// Grades/Results API
export const gradesAPI = {
    getStudentResults: async (studentId?: number) => {
        const params = studentId ? { student_id: studentId } : {};
        const response = await api.get('/results/', { params });
        return response.data;
    },

    getExamResults: async (examId: number, params?: any) => {
        const response = await api.get(`/results/exam/${examId}/`, { params });
        return response.data;
    },

    getReportCard: async (studentId: number, params?: any) => {
        const response = await api.get(`/results/report-card/${studentId}/`, { params });
        return response.data;
    },
};

// ID Cards API
export const idCardsAPI = {
    getTemplates: async () => {
        const response = await api.get('/idcards/templates/');
        return response.data;
    },

    generateBulk: async (data: any) => {
        const response = await api.post('/idcards/generate/bulk/', data);
        return response.data;
    },

    verifyQR: async (qrData: string) => {
        const response = await api.post('/idcards/verify/', { qr_data: qrData });
        return response.data;
    },
};

// Communication API
export const communicationAPI = {
    getNotices: async (params?: any) => {
        const response = await api.get('/communication/notices/', { params });
        return response.data;
    },

    createNotice: async (data: any) => {
        const response = await api.post('/communication/notices/', data);
        return response.data;
    },

    sendMessage: async (data: any) => {
        const response = await api.post('/communication/messages/', data);
        return response.data;
    },

    getMessages: async (params?: any) => {
        const response = await api.get('/communication/messages/', { params });
        return response.data;
    },
};

// Timetable API
export const timetableAPI = {
    getClassTimetable: async (classId: number, sectionId?: number) => {
        const params: any = { class_id: classId };
        if (sectionId) params.section_id = sectionId;
        const response = await api.get('/timetable/class/', { params });
        return response.data;
    },

    getTeacherTimetable: async (teacherId: number) => {
        const response = await api.get(`/timetable/teacher/${teacherId}/`);
        return response.data;
    },
};

// Dashboard API
export const dashboardAPI = {
    getStats: async () => {
        const response = await api.get('/dashboard/stats/');
        return response.data;
    },

    getRecentActivity: async () => {
        const response = await api.get('/dashboard/activity/');
        return response.data;
    },
};

// Transport API
export const transportAPI = {
    getRoutes: async () => {
        const response = await api.get('/transport/routes/');
        return response.data;
    },

    getVehicles: async () => {
        const response = await api.get('/transport/vehicles/');
        return response.data;
    },

    getAllocations: async (params?: any) => {
        const response = await api.get('/transport/allocations/', { params });
        return response.data;
    },
};

// Library API
export const libraryAPI = {
    getBooks: async (params?: any) => {
        const response = await api.get('/library/books/', { params });
        return response.data;
    },

    issueBook: async (data: any) => {
        const response = await api.post('/library/issue/', data);
        return response.data;
    },

    returnBook: async (data: any) => {
        const response = await api.post('/library/return/', data);
        return response.data;
    },

    getIssuedBooks: async (memberId?: number) => {
        const params = memberId ? { member_id: memberId } : {};
        const response = await api.get('/library/issued/', { params });
        return response.data;
    },
};

// Hostel API
export const hostelAPI = {
    getRooms: async () => {
        const response = await api.get('/hostel/rooms/');
        return response.data;
    },

    getAllocations: async (params?: any) => {
        const response = await api.get('/hostel/allocations/', { params });
        return response.data;
    },
};

// Finance API
export const financeAPI = {
    getExpenses: async (params?: any) => {
        const response = await api.get('/finance/expenses/', { params });
        return response.data;
    },

    createExpense: async (data: any) => {
        const response = await api.post('/finance/expenses/', data);
        return response.data;
    },

    getVendors: async () => {
        const response = await api.get('/finance/vendors/');
        return response.data;
    },
};

// HR API
export const hrAPI = {
    getLeaves: async (params?: any) => {
        const response = await api.get('/hr/leaves/', { params });
        return response.data;
    },

    applyLeave: async (data: any) => {
        const response = await api.post('/hr/leaves/', data);
        return response.data;
    },

    approveLeave: async (id: number, data: any) => {
        const response = await api.patch(`/hr/leaves/${id}/approve/`, data);
        return response.data;
    },
};

// Payroll API
export const payrollAPI = {
    getPayslips: async (params?: any) => {
        const response = await api.get('/payroll/payslips/', { params });
        return response.data;
    },

    getSalaryStructure: async (staffId: number) => {
        const response = await api.get(`/payroll/salary-structure/${staffId}/`);
        return response.data;
    },
};

// Inventory API
export const inventoryAPI = {
    getItems: async (params?: any) => {
        const response = await api.get('/inventory/items/', { params });
        return response.data;
    },

    getStock: async (params?: any) => {
        const response = await api.get('/inventory/stock/', { params });
        return response.data;
    },
};

// CRM API
export const crmAPI = {
    getLeads: async (params?: any) => {
        const response = await api.get('/crm/leads/', { params });
        return response.data;
    },

    createLead: async (data: any) => {
        const response = await api.post('/crm/leads/', data);
        return response.data;
    },

    updateLead: async (id: number, data: any) => {
        const response = await api.patch(`/crm/leads/${id}/`, data);
        return response.data;
    },
};

// Helpdesk API
export const helpdeskAPI = {
    getTickets: async (params?: any) => {
        const response = await api.get('/helpdesk/tickets/', { params });
        return response.data;
    },

    createTicket: async (data: any) => {
        const response = await api.post('/helpdesk/tickets/', data);
        return response.data;
    },

    updateTicket: async (id: number, data: any) => {
        const response = await api.patch(`/helpdesk/tickets/${id}/`, data);
        return response.data;
    },
};

// Calendar API
export const calendarAPI = {
    getEvents: async (params?: any) => {
        const response = await api.get('/calendar/events/', { params });
        return response.data;
    },

    getHolidays: async (params?: any) => {
        const response = await api.get('/calendar/holidays/', { params });
        return response.data;
    },
};

// Reports API
export const reportsAPI = {
    getAttendanceReport: async (params: any) => {
        const response = await api.get('/reports/attendance/', { params });
        return response.data;
    },

    getFeeReport: async (params: any) => {
        const response = await api.get('/reports/fees/', { params });
        return response.data;
    },

    getExamReport: async (params: any) => {
        const response = await api.get('/reports/exams/', { params });
        return response.data;
    },
};

// Trackers API
export const trackersAPI = {
    getSalahLogs: async (params?: any) => {
        const response = await api.get('/salah-tracker/logs/', { params });
        return response.data;
    },

    logSalah: async (data: any) => {
        const response = await api.post('/salah-tracker/logs/', data);
        return response.data;
    },

    getHabits: async (params?: any) => {
        const response = await api.get('/habit-tracker/habits/', { params });
        return response.data;
    },

    logHabit: async (data: any) => {
        const response = await api.post('/habit-tracker/logs/', data);
        return response.data;
    },
};

// Notifications API
export const notificationsAPI = {
    getAll: async (params?: any) => {
        const response = await api.get('/notifications/', { params });
        return response.data;
    },

    markRead: async (id: number) => {
        const response = await api.patch(`/notifications/${id}/read/`);
        return response.data;
    },

    markAllRead: async () => {
        const response = await api.post('/notifications/mark-all-read/');
        return response.data;
    },
};

// CMS / Website Builder API
export const cmsAPI = {
    // Templates
    getTemplates: async (params?: any) => {
        const response = await api.get('/cms/templates/', { params });
        return response.data;
    },

    getTemplateById: async (id: number) => {
        const response = await api.get(`/cms/templates/${id}/`);
        return response.data;
    },

    getCategories: async () => {
        const response = await api.get('/cms/templates/categories/');
        return response.data;
    },

    getSectionTypes: async () => {
        const response = await api.get('/cms/templates/section_types/');
        return response.data;
    },

    forkTemplate: async (templateId: number, data: any) => {
        const response = await api.post(`/cms/templates/${templateId}/fork/`, data);
        return response.data;
    },

    uploadTemplate: async (data: any) => {
        const response = await api.post('/cms/templates/upload/', data);
        return response.data;
    },

    // Instances
    getInstances: async (params?: any) => {
        const response = await api.get('/cms/instances/', { params });
        return response.data;
    },

    getInstanceById: async (id: number) => {
        const response = await api.get(`/cms/instances/${id}/`);
        return response.data;
    },

    publishInstance: async (id: number) => {
        const response = await api.post(`/cms/instances/${id}/publish/`);
        return response.data;
    },

    unpublishInstance: async (id: number) => {
        const response = await api.post(`/cms/instances/${id}/unpublish/`);
        return response.data;
    },

    updateTheme: async (id: number, data: any) => {
        const response = await api.patch(`/cms/instances/${id}/update_theme/`, data);
        return response.data;
    },

    updateSection: async (id: number, data: any) => {
        const response = await api.post(`/cms/instances/${id}/update_section/`, data);
        return response.data;
    },

    addSection: async (id: number, data: any) => {
        const response = await api.post(`/cms/instances/${id}/add_section/`, data);
        return response.data;
    },

    deleteSection: async (id: number, pageIndex: number, sectionIndex: number) => {
        const response = await api.post(`/cms/instances/${id}/delete_section/`, {
            page_index: pageIndex,
            section_index: sectionIndex
        });
        return response.data;
    },

    addPage: async (id: number, data: any) => {
        const response = await api.post(`/cms/instances/${id}/add_page/`, data);
        return response.data;
    },

    deletePage: async (id: number, pageIndex: number) => {
        const response = await api.post(`/cms/instances/${id}/delete_page/`, {
            page_index: pageIndex
        });
        return response.data;
    },

    getPreview: async (id: number) => {
        const response = await api.get(`/cms/instances/${id}/preview/`);
        return response.data;
    },
};

export default api;
