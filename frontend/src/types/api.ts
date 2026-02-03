/**
 * TypeScript interfaces for API responses
 * Comprehensive type definitions for all modules
 */

// ============================================
// Base Types
// ============================================

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface ApiError {
    detail?: string;
    message?: string;
    errors?: Record<string, string[]>;
    code?: string;
    status?: number;
}

export interface BaseEntity {
    id: string;
    created_at: string;
    updated_at: string;
}

export interface TenantEntity extends BaseEntity {
    tenant: string;
}

// ============================================
// Student Module
// ============================================

export interface Student extends TenantEntity {
    admission_number: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    full_name: string;
    short_name: string;
    date_of_birth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    blood_group?: string;
    religion?: string;
    category?: string;
    nationality?: string;
    mother_tongue?: string;
    email?: string;
    phone?: string;
    photo?: string;
    photo_url?: string;
    address?: Address;
    father_name?: string;
    father_phone?: string;
    father_email?: string;
    father_occupation?: string;
    mother_name?: string;
    mother_phone?: string;
    mother_email?: string;
    mother_occupation?: string;
    guardian_name?: string;
    guardian_phone?: string;
    guardian_email?: string;
    guardian_relation?: string;
    parent_phone?: string;
    admission_date?: string;
    joining_date?: string;
    current_class_name?: string;
    section_name?: string;
    roll_number?: string;
    is_active: boolean;
    status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED' | 'DROPPED';
    academic_status?: string;
    previous_school?: string;
    transfer_certificate_number?: string;
    special_needs?: boolean;
    special_needs_details?: string;
    medical_conditions?: string;
    allergies?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    documents?: Document[];
    enrollments?: Enrollment[];
}

export interface StudentListItem {
    id: string;
    admission_number: string;
    first_name: string;
    last_name: string;
    full_name: string;
    current_class_name?: string;
    section_name?: string;
    roll_number?: string;
    photo_url?: string;
    is_active: boolean;
    status: string;
    parent_phone?: string;
}

export interface Address {
    street?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    pin_code?: string;
}

export interface Enrollment extends TenantEntity {
    student: string;
    student_name?: string;
    academic_year: string;
    academic_year_name?: string;
    section: string;
    section_name?: string;
    grade_level: string;
    grade_level_name?: string;
    roll_number?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'TRANSFERRED';
    enrollment_date: string;
    completion_date?: string;
}

export interface Document {
    id: string;
    name: string;
    file_url: string;
    document_type: string;
    uploaded_at: string;
}

// ============================================
// Staff Module
// ============================================

export interface Staff extends TenantEntity {
    employee_id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone?: string;
    date_of_birth?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    photo?: string;
    photo_url?: string;
    department?: string;
    department_name?: string;
    designation?: string;
    designation_name?: string;
    joining_date?: string;
    employment_type?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
    reporting_to?: string;
    reporting_to_name?: string;
    is_active: boolean;
    status: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'TERMINATED';
    is_teacher: boolean;
    qualifications?: string[];
    specializations?: string[];
    address?: Address;
    bank_account_number?: string;
    bank_name?: string;
    bank_ifsc?: string;
    pan_number?: string;
    aadhar_number?: string;
}

export interface StaffListItem {
    id: string;
    employee_id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone?: string;
    department_name?: string;
    designation_name?: string;
    photo_url?: string;
    is_active: boolean;
    is_teacher: boolean;
}

// ============================================
// Academics Module
// ============================================

export interface AcademicYear extends TenantEntity {
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    is_current: boolean;
}

export interface GradeLevel extends TenantEntity {
    name: string;
    display_name?: string;
    order: number;
    is_active: boolean;
    sections?: Section[];
}

export interface Section extends TenantEntity {
    name: string;
    grade_level: string;
    grade_level_name?: string;
    class_teacher?: string;
    class_teacher_name?: string;
    capacity?: number;
    current_strength?: number;
    is_active: boolean;
}

export interface Subject extends TenantEntity {
    name: string;
    code?: string;
    description?: string;
    subject_type: 'ACADEMIC' | 'EXTRACURRICULAR' | 'ELECTIVE';
    is_active: boolean;
}

export interface SubjectAllocation extends TenantEntity {
    subject: string;
    subject_name?: string;
    section: string;
    section_name?: string;
    teacher: string;
    teacher_name?: string;
    academic_year: string;
}

// ============================================
// Attendance Module
// ============================================

export interface AttendanceRecord extends TenantEntity {
    student: string;
    student_name?: string;
    admission_number?: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE';
    session?: 'MORNING' | 'AFTERNOON' | 'FULL_DAY';
    remarks?: string;
    marked_by?: string;
    marked_at?: string;
}

export interface AttendanceSummary {
    total_days: number;
    present_days: number;
    absent_days: number;
    late_days: number;
    half_days: number;
    leave_days: number;
    attendance_percentage: number;
}

export interface ClassAttendanceStats {
    class_name: string;
    section_name?: string;
    total_students: number;
    present: number;
    absent: number;
    late: number;
    attendance_percentage: number;
}

// ============================================
// Fees Module
// ============================================

export interface FeeCategory extends TenantEntity {
    name: string;
    code?: string;
    description?: string;
    is_mandatory: boolean;
    is_active: boolean;
    account_head?: string;
}

export interface FeeStructure extends TenantEntity {
    name: string;
    academic_year: string;
    academic_year_name?: string;
    grade_level?: string;
    grade_level_name?: string;
    category: string;
    category_name?: string;
    amount: number;
    due_date?: string;
    late_fee_per_day?: number;
    is_active: boolean;
}

export interface FeeInvoice extends TenantEntity {
    invoice_number: string;
    student: string;
    student_name?: string;
    admission_number?: string;
    class_name?: string;
    academic_year: string;
    total_amount: number;
    discount_amount: number;
    paid_amount: number;
    balance_amount: number;
    due_date?: string;
    status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    items?: FeeInvoiceItem[];
    transactions?: FeeTransaction[];
}

export interface FeeInvoiceItem {
    id: string;
    fee_category: string;
    fee_category_name?: string;
    amount: number;
    discount: number;
    net_amount: number;
}

export interface FeeTransaction extends TenantEntity {
    receipt_number?: string;
    invoice: string;
    invoice_number?: string;
    student: string;
    student_name?: string;
    amount: number;
    payment_mode: 'CASH' | 'CHEQUE' | 'ONLINE' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
    payment_reference?: string;
    transaction_date: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    remarks?: string;
    collected_by?: string;
    collected_by_name?: string;
}

export interface FeeDefaulter {
    student_id: string;
    student_name: string;
    admission_number: string;
    class_name?: string;
    section_name?: string;
    total_due: number;
    days_overdue: number;
    parent_phone?: string;
    invoices: FeeInvoice[];
}

// Payment Gateway Types
export interface PaymentGateway {
    id: string;
    name: string;
    type: 'razorpay' | 'phonepe' | 'upi' | 'googlepay';
    supports_qr: boolean;
    supports_payment_link: boolean;
    key?: string;
    upi_vpa?: string;
}

export interface PaymentGatewayConfig {
    gateways: PaymentGateway[];
    default_gateway: string;
}

export interface PaymentOrder {
    transaction_id: string;
    amount: number;
    currency: string;
    gateway: string;
    status: 'pending' | 'created' | 'completed' | 'failed';
    order_id?: string;
    razorpay_key?: string;
    payment_link?: string;
    qr_code?: string;
    upi_url?: string;
    upi_vpa?: string;
    error?: string;
}

export interface PaymentVerificationResult {
    success: boolean;
    payment_id?: string;
    amount?: number;
    transaction_id?: string;
    receipt_number?: string;
    error?: string;
}

// ============================================
// Exams Module
// ============================================

export interface Exam extends TenantEntity {
    name: string;
    exam_type: 'UNIT_TEST' | 'MID_TERM' | 'FINAL' | 'PRACTICAL' | 'OTHER';
    academic_year: string;
    start_date?: string;
    end_date?: string;
    result_date?: string;
    status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    is_published: boolean;
}

export interface ExamSchedule extends TenantEntity {
    exam: string;
    exam_name?: string;
    subject: string;
    subject_name?: string;
    section: string;
    section_name?: string;
    date: string;
    start_time: string;
    end_time: string;
    room?: string;
    max_marks: number;
    passing_marks: number;
}

export interface ExamResult extends TenantEntity {
    exam: string;
    exam_name?: string;
    student: string;
    student_name?: string;
    subject: string;
    subject_name?: string;
    marks_obtained: number;
    max_marks: number;
    grade?: string;
    percentage?: number;
    remarks?: string;
    is_absent: boolean;
}

// ============================================
// Communication Module
// ============================================

export interface Notice extends TenantEntity {
    title: string;
    content: string;
    category?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    target_audience: 'ALL' | 'STUDENTS' | 'STAFF' | 'PARENTS' | 'SPECIFIC';
    attachment_url?: string;
    is_published: boolean;
    publish_date?: string;
    expiry_date?: string;
    created_by?: string;
    created_by_name?: string;
}

export interface Message extends TenantEntity {
    sender: string;
    sender_name?: string;
    recipient_type: 'USER' | 'GROUP' | 'CLASS' | 'BROADCAST';
    recipients?: string[];
    subject?: string;
    content: string;
    message_type: 'SMS' | 'EMAIL' | 'WHATSAPP' | 'PUSH';
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
    sent_at?: string;
    delivered_at?: string;
    read_at?: string;
}

export interface MessageTemplate extends TenantEntity {
    name: string;
    code: string;
    content: string;
    message_type: 'SMS' | 'EMAIL' | 'WHATSAPP';
    variables: string[];
    is_active: boolean;
}

// ============================================
// Timetable Module
// ============================================

export interface TimetableEntry extends TenantEntity {
    day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
    period: number;
    start_time: string;
    end_time: string;
    subject: string;
    subject_name?: string;
    teacher: string;
    teacher_name?: string;
    section: string;
    section_name?: string;
    room?: string;
    entry_type: 'CLASS' | 'BREAK' | 'ASSEMBLY' | 'FREE';
}

export interface TimetableConfig extends TenantEntity {
    academic_year: string;
    periods_per_day: number;
    period_duration: number;
    break_duration: number;
    school_start_time: string;
    school_end_time: string;
    working_days: string[];
}

// ============================================
// Transport Module
// ============================================

export interface Vehicle extends TenantEntity {
    registration_number: string;
    vehicle_type: 'BUS' | 'VAN' | 'CAB';
    make?: string;
    model?: string;
    capacity: number;
    fuel_type?: string;
    driver_name?: string;
    driver_phone?: string;
    attendant_name?: string;
    attendant_phone?: string;
    is_active: boolean;
    insurance_expiry?: string;
    fitness_expiry?: string;
    gps_device_id?: string;
}

export interface Route extends TenantEntity {
    name: string;
    route_number?: string;
    description?: string;
    vehicle?: string;
    vehicle_number?: string;
    start_location?: string;
    end_location?: string;
    distance_km?: number;
    estimated_time_mins?: number;
    monthly_fee?: number;
    is_active: boolean;
    stops?: RouteStop[];
}

export interface RouteStop {
    id: string;
    name: string;
    latitude?: number;
    longitude?: number;
    pickup_time?: string;
    drop_time?: string;
    order: number;
    fee_amount?: number;
}

// ============================================
// Library Module
// ============================================

export interface Book extends TenantEntity {
    title: string;
    isbn?: string;
    author?: string;
    publisher?: string;
    category?: string;
    genre?: string;
    language?: string;
    publication_year?: number;
    edition?: string;
    total_copies: number;
    available_copies: number;
    location?: string;
    cover_image_url?: string;
    description?: string;
    is_active: boolean;
}

export interface LibraryMember extends TenantEntity {
    member_type: 'STUDENT' | 'STAFF';
    member_id: string;
    member_name?: string;
    membership_number: string;
    membership_date: string;
    expiry_date?: string;
    max_books: number;
    issued_books: number;
    is_active: boolean;
}

export interface BookIssue extends TenantEntity {
    book: string;
    book_title?: string;
    member: string;
    member_name?: string;
    issue_date: string;
    due_date: string;
    return_date?: string;
    status: 'ISSUED' | 'RETURNED' | 'OVERDUE' | 'LOST';
    fine_amount?: number;
    fine_paid?: boolean;
    remarks?: string;
}

// ============================================
// Reporting Module
// ============================================

export interface ReportType {
    name: string;
    subtypes: string[];
}

export interface ReportTypes {
    ATTENDANCE: ReportType;
    FEES: ReportType;
    ACADEMICS: ReportType;
    STAFF: ReportType;
    STUDENTS: ReportType;
    FINANCE: ReportType;
    TRANSPORT: ReportType;
    CUSTOM: ReportType;
}

export interface ReportData {
    report_type: string;
    date_range?: {
        start: string;
        end: string;
    };
    data: Record<string, any>[];
    summary?: Record<string, any>;
}

export interface DashboardSummary {
    students: {
        total: number;
        active_enrollments: number;
        boys: number;
        girls: number;
    };
    staff: {
        total: number;
        teachers: number;
    };
    attendance: {
        date: string;
        present: number;
        absent: number;
        total: number;
        percentage: number;
    };
    fees: {
        collected_this_month: number;
        total_pending: number;
        defaulters_count: number;
    };
}

// ============================================
// CMS Module
// ============================================

export interface WebsiteTemplate extends BaseEntity {
    name: string;
    category: string;
    description?: string;
    preview_image_url?: string;
    structure: Record<string, any>;
    theme: Record<string, any>;
    is_active: boolean;
    is_premium: boolean;
    fork_count: number;
}

export interface WebsiteInstance extends TenantEntity {
    name: string;
    template?: string;
    template_name?: string;
    subdomain: string;
    domain?: string;
    is_published: boolean;
    visitor_count: number;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    custom_structure?: Record<string, any>;
    custom_theme?: Record<string, any>;
}

// ============================================
// Helpdesk Module
// ============================================

export interface Ticket extends TenantEntity {
    ticket_number: string;
    title: string;
    description: string;
    category: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';
    raised_by: string;
    raised_by_name?: string;
    assigned_to?: string;
    assigned_to_name?: string;
    resolution?: string;
    resolved_at?: string;
    closed_at?: string;
}

// ============================================
// Finance Module
// ============================================

export interface Expense extends TenantEntity {
    expense_number?: string;
    category: string;
    category_name?: string;
    amount: number;
    date: string;
    vendor?: string;
    vendor_name?: string;
    description?: string;
    payment_mode?: string;
    payment_reference?: string;
    status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
    approved_by?: string;
    attachment_url?: string;
}

export interface Vendor extends TenantEntity {
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    gst_number?: string;
    pan_number?: string;
    bank_account_number?: string;
    bank_name?: string;
    bank_ifsc?: string;
    is_active: boolean;
}

// ============================================
// HR/Payroll Module
// ============================================

export interface LeaveRequest extends TenantEntity {
    staff: string;
    staff_name?: string;
    leave_type: string;
    leave_type_name?: string;
    start_date: string;
    end_date: string;
    days: number;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    approved_by?: string;
    approval_remarks?: string;
}

export interface Payslip extends TenantEntity {
    staff: string;
    staff_name?: string;
    employee_id?: string;
    month: number;
    year: number;
    basic_salary: number;
    gross_salary: number;
    total_deductions: number;
    net_salary: number;
    earnings?: PayrollComponent[];
    deductions?: PayrollComponent[];
    status: 'DRAFT' | 'APPROVED' | 'PAID';
    payment_date?: string;
    payment_reference?: string;
}

export interface PayrollComponent {
    name: string;
    code: string;
    amount: number;
    is_taxable?: boolean;
}

// ============================================
// API Request Types
// ============================================

export interface CreatePaymentOrderRequest {
    invoice_id: string;
    gateway: string;
    amount: number;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
}

export interface VerifyPaymentRequest {
    gateway: string;
    invoice_id: string;
    payment_data: Record<string, any>;
}

export interface SendPaymentLinkRequest {
    invoice_id: string;
    phone: string;
    channel: 'whatsapp' | 'sms' | 'both';
    include_qr?: boolean;
}

export interface GenerateReportRequest {
    report_type: string;
    subtype?: string;
    start_date?: string;
    end_date?: string;
    filters?: Record<string, any>;
    format?: 'json' | 'excel' | 'csv' | 'pdf';
    group_by?: string;
}

export interface BulkAttendanceRequest {
    date: string;
    section_id: string;
    academic_year_id: string;
    records: Array<{
        student_id: string;
        status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
        remarks?: string;
    }>;
}

export interface StudentSearchParams {
    search?: string;
    class_id?: string;
    section_id?: string;
    status?: string;
    academic_year_id?: string;
    page?: number;
    page_size?: number;
}
