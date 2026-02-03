/**
 * Timetable Validation Report
 * Analyzes timetable for issues and provides recommendations
 */

import React, { useMemo, useState } from 'react';

interface TimetableSlot {
    id: string;
    subject: string;
    subject_name: string;
    teacher: string;
    teacher_name: string;
    room: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    period_number: number;
}

interface SubjectLoad {
    subject: string;
    subject_name: string;
    periods_per_week: number;
}

interface ValidationIssue {
    type: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    details?: string;
    affectedItems?: string[];
}

interface ValidationReportProps {
    slots: TimetableSlot[];
    subjectLoads?: SubjectLoad[];
    sectionName: string;
    workingDays?: string[];
    isOpen: boolean;
    onClose: () => void;
}

const DAYS_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const ValidationReport: React.FC<ValidationReportProps> = ({
    slots,
    subjectLoads = [],
    sectionName,
    workingDays = DAYS_ORDER.slice(0, 6),
    isOpen,
    onClose
}) => {
    const [filterType, setFilterType] = useState<'all' | 'error' | 'warning' | 'info'>('all');
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['errors', 'warnings']);

    // Run validation checks
    const issues = useMemo(() => {
        const validationIssues: ValidationIssue[] = [];

        // 1. Check for missing room assignments
        const slotsWithoutRoom = slots.filter(s => !s.room || s.room.trim() === '');
        if (slotsWithoutRoom.length > 0) {
            validationIssues.push({
                type: 'warning',
                category: 'Room Assignments',
                message: `${slotsWithoutRoom.length} slots have no room assigned`,
                details: 'Consider assigning rooms to avoid confusion',
                affectedItems: slotsWithoutRoom.map(s =>
                    `${s.subject_name} on ${s.day_of_week} P${s.period_number}`
                )
            });
        }

        // 2. Check for missing teacher assignments
        const slotsWithoutTeacher = slots.filter(s => !s.teacher);
        if (slotsWithoutTeacher.length > 0) {
            validationIssues.push({
                type: 'error',
                category: 'Teacher Assignments',
                message: `${slotsWithoutTeacher.length} slots have no teacher assigned`,
                details: 'All slots should have a teacher for proper scheduling',
                affectedItems: slotsWithoutTeacher.map(s =>
                    `${s.subject_name} on ${s.day_of_week} P${s.period_number}`
                )
            });
        }

        // 3. Check teacher overload (more than 6 periods/day)
        const teacherDailyLoad: Record<string, Record<string, number>> = {};
        slots.forEach(slot => {
            if (!slot.teacher) return;
            if (!teacherDailyLoad[slot.teacher]) {
                teacherDailyLoad[slot.teacher] = {};
            }
            teacherDailyLoad[slot.teacher][slot.day_of_week] =
                (teacherDailyLoad[slot.teacher][slot.day_of_week] || 0) + 1;
        });

        const overloadedTeachers: string[] = [];
        Object.entries(teacherDailyLoad).forEach(([teacherId, days]) => {
            Object.entries(days).forEach(([day, count]) => {
                if (count > 6) {
                    const slot = slots.find(s => s.teacher === teacherId);
                    overloadedTeachers.push(
                        `${slot?.teacher_name || teacherId}: ${count} periods on ${day}`
                    );
                }
            });
        });

        if (overloadedTeachers.length > 0) {
            validationIssues.push({
                type: 'warning',
                category: 'Teacher Workload',
                message: 'Some teachers have more than 6 periods in a day',
                details: 'This may lead to burnout. Consider redistributing',
                affectedItems: overloadedTeachers
            });
        }

        // 4. Check for uneven subject distribution
        const subjectDayDistribution: Record<string, Set<string>> = {};
        slots.forEach(slot => {
            if (!subjectDayDistribution[slot.subject]) {
                subjectDayDistribution[slot.subject] = new Set();
            }
            subjectDayDistribution[slot.subject].add(slot.day_of_week);
        });

        const unevenSubjects: string[] = [];
        const subjectPeriodCount: Record<string, number> = {};
        slots.forEach(slot => {
            subjectPeriodCount[slot.subject] = (subjectPeriodCount[slot.subject] || 0) + 1;
        });

        Object.entries(subjectDayDistribution).forEach(([subjectId, days]) => {
            const totalPeriods = subjectPeriodCount[subjectId] || 0;
            const daysUsed = days.size;

            // If subject has 4+ periods but concentrated in 1-2 days
            if (totalPeriods >= 4 && daysUsed < 3) {
                const slot = slots.find(s => s.subject === subjectId);
                unevenSubjects.push(
                    `${slot?.subject_name}: ${totalPeriods} periods in only ${daysUsed} days`
                );
            }
        });

        if (unevenSubjects.length > 0) {
            validationIssues.push({
                type: 'info',
                category: 'Subject Distribution',
                message: 'Some subjects are concentrated on few days',
                details: 'For better retention, consider spreading subjects across the week',
                affectedItems: unevenSubjects
            });
        }

        // 5. Check for back-to-back same subject
        const backToBackIssues: string[] = [];
        workingDays.forEach(day => {
            const daySlots = slots
                .filter(s => s.day_of_week === day)
                .sort((a, b) => a.period_number - b.period_number);

            for (let i = 0; i < daySlots.length - 1; i++) {
                if (daySlots[i].subject === daySlots[i + 1].subject &&
                    daySlots[i + 1].period_number - daySlots[i].period_number === 1) {
                    backToBackIssues.push(
                        `${daySlots[i].subject_name} on ${day} P${daySlots[i].period_number}-P${daySlots[i + 1].period_number}`
                    );
                }
            }
        });

        if (backToBackIssues.length > 0) {
            validationIssues.push({
                type: 'info',
                category: 'Schedule Pattern',
                message: `${backToBackIssues.length} back-to-back same subject periods found`,
                details: 'This might be intentional for certain subjects (like labs)',
                affectedItems: backToBackIssues
            });
        }

        // 6. Check subject load fulfillment
        if (subjectLoads.length > 0) {
            const actualCounts: Record<string, number> = {};
            slots.forEach(slot => {
                actualCounts[slot.subject] = (actualCounts[slot.subject] || 0) + 1;
            });

            const missingPeriods: string[] = [];
            const extraPeriods: string[] = [];

            subjectLoads.forEach(load => {
                const actual = actualCounts[load.subject] || 0;
                const expected = load.periods_per_week;

                if (actual < expected) {
                    missingPeriods.push(
                        `${load.subject_name}: ${actual}/${expected} periods (missing ${expected - actual})`
                    );
                } else if (actual > expected) {
                    extraPeriods.push(
                        `${load.subject_name}: ${actual}/${expected} periods (extra ${actual - expected})`
                    );
                }
            });

            if (missingPeriods.length > 0) {
                validationIssues.push({
                    type: 'error',
                    category: 'Subject Load',
                    message: 'Some subjects are under-scheduled',
                    details: 'These subjects need more periods to meet requirements',
                    affectedItems: missingPeriods
                });
            }

            if (extraPeriods.length > 0) {
                validationIssues.push({
                    type: 'warning',
                    category: 'Subject Load',
                    message: 'Some subjects are over-scheduled',
                    details: 'These subjects have more periods than required',
                    affectedItems: extraPeriods
                });
            }
        }

        // 7. Check for empty days
        const emptyDays = workingDays.filter(day =>
            !slots.some(s => s.day_of_week === day)
        );

        if (emptyDays.length > 0) {
            validationIssues.push({
                type: 'warning',
                category: 'Schedule Gaps',
                message: `${emptyDays.length} working days have no classes scheduled`,
                affectedItems: emptyDays
            });
        }

        // 8. Check total periods
        const totalSlots = slots.length;
        if (totalSlots === 0) {
            validationIssues.push({
                type: 'error',
                category: 'General',
                message: 'No classes scheduled yet',
                details: 'Use Auto Generate or add slots manually'
            });
        } else {
            validationIssues.push({
                type: 'info',
                category: 'Summary',
                message: `Total scheduled: ${totalSlots} periods across ${new Set(slots.map(s => s.day_of_week)).size} days`,
                details: `${new Set(slots.map(s => s.subject)).size} subjects, ${new Set(slots.map(s => s.teacher)).size} teachers`
            });
        }

        return validationIssues;
    }, [slots, subjectLoads, workingDays]);

    // Filter issues by type
    const filteredIssues = useMemo(() => {
        if (filterType === 'all') return issues;
        return issues.filter(i => i.type === filterType);
    }, [issues, filterType]);

    // Group issues by category
    const groupedIssues = useMemo(() => {
        const groups: Record<string, ValidationIssue[]> = {};
        filteredIssues.forEach(issue => {
            if (!groups[issue.category]) {
                groups[issue.category] = [];
            }
            groups[issue.category].push(issue);
        });
        return groups;
    }, [filteredIssues]);

    // Count by type
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;
    const infoCount = issues.filter(i => i.type === 'info').length;

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const getTypeIcon = (type: 'error' | 'warning' | 'info') => {
        switch (type) {
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
        }
    };

    const getTypeColor = (type: 'error' | 'warning' | 'info') => {
        switch (type) {
            case 'error': return '#ef4444';
            case 'warning': return '#f59e0b';
            case 'info': return '#3b82f6';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="validation-modal-overlay">
            <div className="validation-modal">
                <div className="validation-header">
                    <h2>📋 Validation Report</h2>
                    <span className="section-badge">{sectionName}</span>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {/* Summary */}
                <div className="validation-summary">
                    <button
                        className={`summary-btn error ${filterType === 'error' ? 'active' : ''}`}
                        onClick={() => setFilterType(filterType === 'error' ? 'all' : 'error')}
                    >
                        <span className="count">{errorCount}</span>
                        <span className="label">Errors</span>
                    </button>
                    <button
                        className={`summary-btn warning ${filterType === 'warning' ? 'active' : ''}`}
                        onClick={() => setFilterType(filterType === 'warning' ? 'all' : 'warning')}
                    >
                        <span className="count">{warningCount}</span>
                        <span className="label">Warnings</span>
                    </button>
                    <button
                        className={`summary-btn info ${filterType === 'info' ? 'active' : ''}`}
                        onClick={() => setFilterType(filterType === 'info' ? 'all' : 'info')}
                    >
                        <span className="count">{infoCount}</span>
                        <span className="label">Info</span>
                    </button>
                </div>

                {/* Issues List */}
                <div className="validation-content">
                    {Object.entries(groupedIssues).map(([category, categoryIssues]) => (
                        <div key={category} className="issue-category">
                            <button
                                className="category-header"
                                onClick={() => toggleCategory(category)}
                            >
                                <span className="category-name">{category}</span>
                                <span className="category-count">{categoryIssues.length}</span>
                                <span className="category-chevron">
                                    {expandedCategories.includes(category) ? '▼' : '▶'}
                                </span>
                            </button>

                            {expandedCategories.includes(category) && (
                                <div className="category-issues">
                                    {categoryIssues.map((issue, idx) => (
                                        <div
                                            key={idx}
                                            className={`issue-item ${issue.type}`}
                                            style={{ borderLeftColor: getTypeColor(issue.type) }}
                                        >
                                            <div className="issue-header">
                                                <span className="issue-icon">{getTypeIcon(issue.type)}</span>
                                                <span className="issue-message">{issue.message}</span>
                                            </div>
                                            {issue.details && (
                                                <p className="issue-details">{issue.details}</p>
                                            )}
                                            {issue.affectedItems && issue.affectedItems.length > 0 && (
                                                <div className="affected-items">
                                                    <details>
                                                        <summary>
                                                            View {issue.affectedItems.length} affected items
                                                        </summary>
                                                        <ul>
                                                            {issue.affectedItems.slice(0, 10).map((item, i) => (
                                                                <li key={i}>{item}</li>
                                                            ))}
                                                            {issue.affectedItems.length > 10 && (
                                                                <li className="more">
                                                                    ...and {issue.affectedItems.length - 10} more
                                                                </li>
                                                            )}
                                                        </ul>
                                                    </details>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {filteredIssues.length === 0 && (
                        <div className="no-issues">
                            ✅ No {filterType === 'all' ? '' : filterType} issues found!
                        </div>
                    )}
                </div>

                {/* Overall Status */}
                <div className="validation-footer">
                    {errorCount === 0 && warningCount === 0 ? (
                        <span className="status-good">✅ Timetable looks good!</span>
                    ) : errorCount > 0 ? (
                        <span className="status-error">⚠️ Please fix errors before publishing</span>
                    ) : (
                        <span className="status-warning">ℹ️ Review warnings for optimal scheduling</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ValidationReport;
