/**
 * Widget Renderer
 * Dynamic widget component renderer based on widget ID
 */

import React, { Suspense, lazy } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import './WidgetRenderer.css';

// Import widget components
import { OverviewStatsWidget } from './widgets/OverviewStatsWidget';
import { FeeTrendWidget } from './widgets/FeeTrendWidget';
import { AttendanceHeatmapWidget } from './widgets/AttendanceHeatmapWidget';
import { LeaderboardWidget } from './widgets/LeaderboardWidget';
import { RecentActivityWidget } from './widgets/RecentActivityWidget';
import { UpcomingEventsWidget } from './widgets/UpcomingEventsWidget';
import { ChildrenOverviewWidget } from './widgets/ChildrenOverviewWidget';
import { AttendanceSummaryWidget } from './widgets/AttendanceSummaryWidget';
import { FeeSummaryWidget } from './widgets/FeeSummaryWidget';
import { AcademicProgressWidget } from './widgets/AcademicProgressWidget';
import { HomeworkWidget } from './widgets/HomeworkWidget';
import { AnnouncementsWidget } from './widgets/AnnouncementsWidget';
import { PendingTasksWidget } from './widgets/PendingTasksWidget';
import { TimetableWidget } from './widgets/TimetableWidget';
import { QuickStatsWidget } from './widgets/QuickStatsWidget';

interface WidgetRendererProps {
    widgetId: string;
    config?: Record<string, any>;
    data?: any;
    onRefresh?: () => void;
}

// Widget component registry
const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
    // Overview & Stats
    'overview_stats': OverviewStatsWidget,
    'student_count': QuickStatsWidget,
    'staff_count': QuickStatsWidget,

    // Finance
    'fee_trend_chart': FeeTrendWidget,
    'fee_collection_chart': FeeTrendWidget,
    'fee_overview': FeeSummaryWidget,
    'fee_summary': FeeSummaryWidget,
    'pending_dues': FeeSummaryWidget,
    'recent_payments': RecentActivityWidget,
    'fee_defaulters': RecentActivityWidget,

    // Attendance
    'attendance_heatmap': AttendanceHeatmapWidget,
    'attendance_summary': AttendanceSummaryWidget,
    'attendance_quick': AttendanceSummaryWidget,
    'my_attendance': AttendanceSummaryWidget,

    // Leaderboard
    'leaderboard_academic': LeaderboardWidget,
    'class_leaderboard': LeaderboardWidget,
    'teacher_leaderboard': LeaderboardWidget,

    // Activity & Events
    'recent_activity': RecentActivityWidget,
    'upcoming_events': UpcomingEventsWidget,
    'school_announcements': AnnouncementsWidget,
    'recent_remarks': RecentActivityWidget,

    // Parent widgets
    'children_overview': ChildrenOverviewWidget,
    'academic_progress': AcademicProgressWidget,
    'homework_pending': HomeworkWidget,

    // Teacher widgets
    'my_classes_today': TimetableWidget,
    'timetable_today': TimetableWidget,
    'pending_tasks': PendingTasksWidget,
    'homework_status': HomeworkWidget,

    // Student widgets
    'my_schedule_today': TimetableWidget,
    'my_rank': LeaderboardWidget,
    'pending_homework': HomeworkWidget,
    'recent_results': AcademicProgressWidget,
};

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
    widgetId,
    config,
    data,
    onRefresh
}) => {
    const WidgetComponent = WIDGET_COMPONENTS[widgetId];

    if (!WidgetComponent) {
        return (
            <div className="widget-placeholder">
                <AlertCircle size={24} />
                <span>Widget not found: {widgetId}</span>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="widget-loading">
                <div className="loading-spinner">
                    <RefreshCw size={20} className="spin" />
                </div>
                <span>Loading...</span>
            </div>
        );
    }

    if (data.error) {
        return (
            <div className="widget-error">
                <AlertCircle size={24} />
                <span>{data.error}</span>
                {onRefresh && (
                    <button className="retry-btn" onClick={onRefresh}>
                        <RefreshCw size={14} />
                        Retry
                    </button>
                )}
            </div>
        );
    }

    return (
        <Suspense fallback={
            <div className="widget-loading">
                <div className="loading-spinner">
                    <RefreshCw size={20} className="spin" />
                </div>
            </div>
        }>
            <WidgetComponent
                widgetId={widgetId}
                config={config}
                data={data}
                onRefresh={onRefresh}
            />
        </Suspense>
    );
};

export default WidgetRenderer;
