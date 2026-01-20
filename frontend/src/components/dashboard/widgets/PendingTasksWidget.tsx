/**
 * Pending Tasks Widget
 * Displays pending tasks for teachers/staff
 */

import React from 'react';
import { CheckSquare, Clock, AlertTriangle, Circle, CheckCircle } from 'lucide-react';
import './widgets.css';

interface TaskItem {
    id: string;
    title: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    status: string;
    created_at: string;
}

interface PendingTasksData {
    tasks: TaskItem[];
}

interface PendingTasksWidgetProps {
    widgetId: string;
    config?: Record<string, any>;
    data: PendingTasksData;
    onRefresh?: () => void;
}

const PRIORITY_COLORS = {
    HIGH: '#ef4444',
    MEDIUM: '#f59e0b',
    LOW: '#22c55e'
};

export const PendingTasksWidget: React.FC<PendingTasksWidgetProps> = ({
    data,
    onRefresh
}) => {
    const { tasks = [] } = data;

    if (tasks.length === 0) {
        return (
            <div className="pending-tasks-widget empty">
                <div className="empty-state">
                    <CheckCircle size={32} />
                    <p>All caught up! No pending tasks</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pending-tasks-widget">
            <div className="widget-header">
                <CheckSquare size={18} />
                <h3>Pending Tasks</h3>
                <span className="task-count">{tasks.length}</span>
            </div>

            <div className="tasks-list">
                {tasks.slice(0, 8).map((task, index) => (
                    <div key={task.id || index} className="task-item">
                        <div
                            className="priority-dot"
                            style={{ backgroundColor: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.LOW }}
                        />
                        <div className="task-info">
                            <div className="task-title">{task.title}</div>
                            <div className="task-meta">
                                <span className="task-status">{task.status}</span>
                            </div>
                        </div>
                        <div className="task-priority" style={{ color: PRIORITY_COLORS[task.priority] }}>
                            {task.priority}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PendingTasksWidget;
