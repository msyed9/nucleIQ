import React from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useTranslation } from 'react-i18next';
import './Reports.css';

const ReportsDashboard: React.FC = () => {
    const reportCategories = [
        {
            title: 'Student Reports',
            icon: '👨‍🎓',
            reports: [
                'Student List',
                'Admission Report',
                'Class-wise Report',
                'Student Attendance',
            ],
        },
        {
            title: 'Staff Reports',
            icon: '👨‍🏫',
            reports: [
                'Staff List',
                'Department-wise',
                'Staff Attendance',
                'Salary Report',
            ],
        },
        {
            title: 'Financial Reports',
            icon: '💰',
            reports: [
                'Fee Collection',
                'Fee Defaulters',
                'Income Statement',
                'Balance Sheet',
            ],
        },
        {
            title: 'Attendance Reports',
            icon: '📅',
            reports: [
                'Daily Attendance',
                'Monthly Summary',
                'Class-wise Attendance',
                'Absentee Report',
            ],
        },
    ];

    const { t } = useTranslation();

    return (
        <div className="reports-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('reports.title')}</h1>
                    <p className="page-subtitle">{t('reports.subtitle')}</p>
                </div>
            </div>

            <div className="reports-grid">
                {reportCategories.map((category) => (
                    <Card key={category.title} title={category.title}>
                        <div className="report-category">
                            <div className="category-icon">{category.icon}</div>
                            <div className="report-list">
                                {category.reports.map((report) => (
                                    <div key={report} className="report-item">
                                        <span className="report-name">{report}</span>
                                        <Button size="small" variant="outline">
                                            {t('reports.generate')}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ReportsDashboard;