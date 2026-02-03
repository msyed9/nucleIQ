/**
 * Timetable Types
 */

export interface TimetableSlot {
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
    academic_year?: string;
    section?: string;
}

export interface PeriodConfig {
    period: number;
    start: string;
    end: string;
    type: 'class' | 'break';
    label?: string;
}

export interface TimetableConfig {
    periods: PeriodConfig[];
    working_days: string[];
}
