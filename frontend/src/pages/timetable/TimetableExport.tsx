/**
 * Timetable Export Component
 * Handles PDF and Excel export with school branding
 */

import React, { useState } from 'react';
import axios from 'axios';
import { useTenantBranding } from '../../contexts/TenantBrandingContext';

interface TimetableSlot {
    id: string;
    subject_name: string;
    teacher_name: string;
    room: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    period_number: number;
}

interface ExportProps {
    slots: TimetableSlot[];
    sectionName: string;
    academicYearName: string;
    periodConfig?: {
        periods: Array<{
            period: number;
            start: string;
            end: string;
            type: 'class' | 'break';
            label?: string;
        }>;
        working_days: string[];
    };
    onClose: () => void;
}

const DAYS_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const TimetableExport: React.FC<ExportProps> = ({
    slots,
    sectionName,
    academicYearName,
    periodConfig,
    onClose
}) => {
    const { branding } = useTenantBranding();
    const [exporting, setExporting] = useState(false);
    const [format, setFormat] = useState<'pdf' | 'excel' | 'print'>('pdf');

    const workingDays = periodConfig?.working_days || DAYS_ORDER.slice(0, 6);
    const periods = periodConfig?.periods?.filter(p => p.type === 'class') || [];

    const getSlotForCell = (day: string, periodNum: number): TimetableSlot | undefined => {
        return slots.find(
            slot => slot.day_of_week === day && slot.period_number === periodNum
        );
    };

    const generateTableHTML = (): string => {
        const logoUrl = branding?.logo_url || '';
        const schoolName = branding?.tenant_name || 'School';

        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Timetable - ${sectionName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #4f46e5; }
        .header img { max-height: 60px; margin-bottom: 10px; }
        .header h1 { font-size: 24px; color: #1a1a1a; margin-bottom: 5px; }
        .header h2 { font-size: 18px; color: #4f46e5; font-weight: 500; }
        .header p { color: #666; font-size: 14px; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px 8px; text-align: center; }
        th { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; font-weight: 600; }
        th.time-header { background: #1e1b4b; width: 100px; }
        .period-num { font-weight: 700; color: #4f46e5; font-size: 12px; }
        .time-range { font-size: 11px; color: #666; }
        .slot { padding: 8px; }
        .slot-subject { font-weight: 600; color: #1a1a1a; font-size: 13px; }
        .slot-teacher { font-size: 11px; color: #4f46e5; margin-top: 2px; }
        .slot-room { font-size: 10px; color: #888; margin-top: 2px; }
        .empty-slot { color: #ccc; font-style: italic; }
        .break-row { background: #fef3c7 !important; }
        .break-row td { color: #92400e; font-weight: 500; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #888; }
        @media print {
            body { padding: 10px; }
            .no-print { display: none; }
            table { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        ${logoUrl ? `<img src="${logoUrl}" alt="Logo">` : ''}
        <h1>${schoolName}</h1>
        <h2>Timetable - ${sectionName}</h2>
        <p>Academic Year: ${academicYearName}</p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th class="time-header">Time</th>
                ${workingDays.map(day => `<th>${day.charAt(0) + day.slice(1).toLowerCase()}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
`;

        // Add period rows
        const allPeriods = periodConfig?.periods || [];
        for (const period of allPeriods) {
            if (period.type === 'break') {
                html += `
            <tr class="break-row">
                <td><span class="time-range">${period.start} - ${period.end}</span></td>
                <td colspan="${workingDays.length}">${period.label || 'Break'}</td>
            </tr>`;
            } else {
                html += `
            <tr>
                <td>
                    <span class="period-num">P${period.period}</span><br>
                    <span class="time-range">${period.start} - ${period.end}</span>
                </td>
                ${workingDays.map(day => {
                    const slot = getSlotForCell(day, period.period);
                    if (slot) {
                        return `
                <td class="slot">
                    <div class="slot-subject">${slot.subject_name}</div>
                    <div class="slot-teacher">${slot.teacher_name}</div>
                    <div class="slot-room">${slot.room || '-'}</div>
                </td>`;
                    }
                    return `<td class="empty-slot">-</td>`;
                }).join('')}
            </tr>`;
            }
        }

        html += `
        </tbody>
    </table>
    
    <div class="footer">
        Generated on ${new Date().toLocaleDateString()} | ${schoolName} Management System
    </div>
</body>
</html>`;

        return html;
    };

    const exportToPDF = async () => {
        setExporting(true);
        try {
            const html = generateTableHTML();

            // Create a new window for printing as PDF
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();

                // Wait for content to load then trigger print
                printWindow.onload = () => {
                    printWindow.print();
                };
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export PDF');
        } finally {
            setExporting(false);
        }
    };

    const exportToExcel = () => {
        setExporting(true);
        try {
            // Create CSV content
            let csv = `Timetable - ${sectionName} (${academicYearName})\n\n`;
            csv += `Time,${workingDays.map(d => d.charAt(0) + d.slice(1).toLowerCase()).join(',')}\n`;

            const allPeriods = periodConfig?.periods || [];
            for (const period of allPeriods) {
                if (period.type === 'break') {
                    csv += `${period.start}-${period.end},${Array(workingDays.length).fill(period.label || 'Break').join(',')}\n`;
                } else {
                    const rowData = workingDays.map(day => {
                        const slot = getSlotForCell(day, period.period);
                        return slot ? `"${slot.subject_name} (${slot.teacher_name})"` : '-';
                    });
                    csv += `P${period.period} (${period.start}-${period.end}),${rowData.join(',')}\n`;
                }
            }

            // Download as CSV
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `timetable_${sectionName.replace(/\s+/g, '_')}.csv`;
            link.click();
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export Excel');
        } finally {
            setExporting(false);
        }
    };

    const handlePrint = () => {
        const html = generateTableHTML();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 500);
        }
    };

    const handleExport = () => {
        switch (format) {
            case 'pdf':
                exportToPDF();
                break;
            case 'excel':
                exportToExcel();
                break;
            case 'print':
                handlePrint();
                break;
        }
    };

    return (
        <div className="export-modal-overlay">
            <div className="export-modal">
                <div className="export-header">
                    <h2>📤 Export Timetable</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="export-content">
                    <div className="export-info">
                        <div className="info-item">
                            <span className="info-label">Section:</span>
                            <span className="info-value">{sectionName}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Academic Year:</span>
                            <span className="info-value">{academicYearName}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Total Slots:</span>
                            <span className="info-value">{slots.length}</span>
                        </div>
                    </div>

                    <div className="export-options">
                        <h4>Export Format</h4>
                        <div className="format-buttons">
                            <button
                                className={`format-btn ${format === 'pdf' ? 'active' : ''}`}
                                onClick={() => setFormat('pdf')}
                            >
                                📄 PDF
                            </button>
                            <button
                                className={`format-btn ${format === 'excel' ? 'active' : ''}`}
                                onClick={() => setFormat('excel')}
                            >
                                📊 Excel/CSV
                            </button>
                            <button
                                className={`format-btn ${format === 'print' ? 'active' : ''}`}
                                onClick={() => setFormat('print')}
                            >
                                🖨️ Print
                            </button>
                        </div>
                    </div>

                    <div className="export-preview">
                        <h4>Preview</h4>
                        <div className="preview-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        {workingDays.slice(0, 3).map(day => (
                                            <th key={day}>{day.substring(0, 3)}</th>
                                        ))}
                                        <th>...</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {periods.slice(0, 3).map(period => (
                                        <tr key={period.period}>
                                            <td>P{period.period}</td>
                                            {workingDays.slice(0, 3).map(day => {
                                                const slot = getSlotForCell(day, period.period);
                                                return (
                                                    <td key={day}>
                                                        {slot ? slot.subject_name.substring(0, 8) + '...' : '-'}
                                                    </td>
                                                );
                                            })}
                                            <td>...</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="export-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button
                        className="btn-export"
                        onClick={handleExport}
                        disabled={exporting}
                    >
                        {exporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimetableExport;
