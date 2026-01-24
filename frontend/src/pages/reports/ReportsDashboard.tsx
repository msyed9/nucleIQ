/**
 * Reports Dashboard - Redesigned with NucleiQ Design System
 * Modern reports interface with export functionality
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
    FileText,
    Download,
    Calendar,
    Users,
    DollarSign,
    TrendingUp,
    BarChart3,
    PieChart,
    FileSpreadsheet,
    Filter
} from 'lucide-react';
import { Button, Card, Select, Input } from '@/design-system';

interface ReportCategory {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    reports: Report[];
}

interface Report {
    id: string;
    name: string;
    description: string;
    lastGenerated?: string;
}

const ReportsDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const reportCategories: ReportCategory[] = [
        {
            id: 'students',
            title: 'Student Reports',
            description: 'Student-related analytics and reports',
            icon: Users,
            reports: [
                { id: 'student-list', name: 'Student List', description: 'Complete student directory with details', lastGenerated: '2 hours ago' },
                { id: 'attendance-summary', name: 'Attendance Summary', description: 'Student attendance statistics', lastGenerated: '1 day ago' },
                { id: 'performance', name: 'Academic Performance', description: 'Student grades and performance metrics', lastGenerated: '3 days ago' },
            ]
        },
        {
            id: 'financial',
            title: 'Financial Reports',
            description: 'Fee collection and financial analytics',
            icon: DollarSign,
            reports: [
                { id: 'fee-collection', name: 'Fee Collection', description: 'Fee collection summary by class/month', lastGenerated: '5 hours ago' },
                { id: 'defaulters', name: 'Fee Defaulters', description: 'List of pending fee payments', lastGenerated: '1 day ago' },
                { id: 'income-expense', name: 'Income vs Expense', description: 'Financial overview and trends', lastGenerated: '1 week ago' },
            ]
        },
        {
            id: 'attendance',
            title: 'Attendance Reports',
            description: 'Attendance tracking and analytics',
            icon: Calendar,
            reports: [
                { id: 'daily-attendance', name: 'Daily Attendance', description: 'Day-wise attendance records', lastGenerated: 'Today' },
                { id: 'monthly-attendance', name: 'Monthly Attendance', description: 'Month-wise attendance summary', lastGenerated: '2 days ago' },
                { id: 'absentee-list', name: 'Absentee List', description: 'Students absent today', lastGenerated: 'Today' },
            ]
        },
        {
            id: 'academic',
            title: 'Academic Reports',
            description: 'Exam results and academic analytics',
            icon: BarChart3,
            reports: [
                { id: 'exam-results', name: 'Exam Results', description: 'Detailed exam results by class', lastGenerated: '1 week ago' },
                { id: 'subject-analysis', name: 'Subject Analysis', description: 'Subject-wise performance analysis', lastGenerated: '1 week ago' },
                { id: 'toppers-list', name: 'Toppers List', description: 'Top performing students', lastGenerated: '1 week ago' },
            ]
        },
    ];

    const categoryOptions = [
        { value: 'all', label: 'All Categories' },
        { value: 'students', label: 'Student Reports' },
        { value: 'financial', label: 'Financial Reports' },
        { value: 'attendance', label: 'Attendance Reports' },
        { value: 'academic', label: 'Academic Reports' },
    ];

    const filteredCategories = reportCategories.filter(category =>
        selectedCategory === 'all' || category.id === selectedCategory
    );

    const handleGenerateReport = (reportId: string) => {
        // Trigger server-side report generation and navigate to result if available
        (async () => {
            try {
                const resp = await api.post('/reports/generate/', { report_id: reportId });
                const payload = resp.data || {};
                // If server returns a report URL or job id, navigate to viewer
                if (payload.report_url) {
                    window.open(payload.report_url, '_blank');
                } else if (payload.job_id) {
                    navigate(`/reports/jobs/${payload.job_id}`);
                } else {
                    // Fallback: simple notification
                    alert('Report generation started. Check Reports > Jobs for status.');
                }
            } catch (err: any) {
                console.error('Report generation failed', err);
                alert(err?.response?.data?.error || 'Failed to generate report');
            }
        })();
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    <h1 style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '2.25rem',
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                        margin: '0 0 0.5rem 0'
                    }}>
                        Reports & Analytics
                    </h1>
                    <p style={{
                        fontSize: '1rem',
                        color: 'var(--color-text-secondary)',
                        margin: 0
                    }}>
                        Generate and download various reports
                    </p>
                </div>

                <Button variant="primary" iconLeft={Download}>
                    Export All
                </Button>
            </div>

            {/* Filters */}
            <Card padding="lg" style={{ marginBottom: '2rem' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1rem'
                }}>
                    <Select
                        options={categoryOptions}
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        placeholder="Filter by category"
                        fullWidth
                    />

                    <Input
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        iconLeft={Filter}
                        fullWidth
                    />
                </div>
            </Card>

            {/* Report Categories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {filteredCategories.map((category) => {
                    const CategoryIcon = category.icon;

                    return (
                        <Card key={category.id} padding="lg">
                            {/* Category Header */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                marginBottom: '1.5rem',
                                paddingBottom: '1rem',
                                borderBottom: '1px solid var(--color-border-light)'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'var(--color-primary-50)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <CategoryIcon size={24} style={{ color: 'var(--color-primary-600)' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h2 style={{
                                        margin: '0 0 0.25rem 0',
                                        fontSize: '1.25rem',
                                        fontWeight: 600,
                                        color: 'var(--color-text-primary)'
                                    }}>
                                        {category.title}
                                    </h2>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '0.875rem',
                                        color: 'var(--color-text-secondary)'
                                    }}>
                                        {category.description}
                                    </p>
                                </div>
                            </div>

                            {/* Reports Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: '1rem'
                            }}>
                                {category.reports.map((report) => (
                                    <div
                                        key={report.id}
                                        style={{
                                            padding: '1.25rem',
                                            border: '1px solid var(--color-border-light)',
                                            borderRadius: '0.75rem',
                                            transition: 'all 200ms',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--color-primary-300)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--color-border-light)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '0.75rem',
                                            marginBottom: '1rem'
                                        }}>
                                            <FileText size={20} style={{ color: 'var(--color-primary-600)', flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{
                                                    margin: '0 0 0.25rem 0',
                                                    fontSize: '1rem',
                                                    fontWeight: 600,
                                                    color: 'var(--color-text-primary)'
                                                }}>
                                                    {report.name}
                                                </h3>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '0.8125rem',
                                                    color: 'var(--color-text-secondary)',
                                                    lineHeight: 1.5
                                                }}>
                                                    {report.description}
                                                </p>
                                            </div>
                                        </div>

                                        {report.lastGenerated && (
                                            <p style={{
                                                margin: '0 0 1rem 0',
                                                fontSize: '0.75rem',
                                                color: 'var(--color-text-tertiary)'
                                            }}>
                                                Last generated: {report.lastGenerated}
                                            </p>
                                        )}

                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                iconLeft={Download}
                                                onClick={() => handleGenerateReport(report.id)}
                                                fullWidth
                                            >
                                                Generate
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default ReportsDashboard;