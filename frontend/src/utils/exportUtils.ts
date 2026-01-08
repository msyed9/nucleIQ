/**
 * Export Utilities - Industry Standard Export Formats
 * Supports: Excel (.xlsx), CSV, PDF, Copy to Clipboard
 * 
 * Usage:
 * import { exportToExcel, exportToCSV, exportToPDF, copyToClipboard } from '@/utils/exportUtils';
 * 
 * exportToExcel(data, 'students', 'Students List');
 * exportToCSV(data, 'students');
 * exportToPDF(data, 'Students Report', columns);
 * copyToClipboard(data);
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
    key: string;
    label: string;
    width?: number;
    format?: (value: any) => string;
}

export interface ExportOptions {
    filename?: string;
    sheetName?: string;
    title?: string;
    columns?: ExportColumn[];
    includeTimestamp?: boolean;
    orientation?: 'portrait' | 'landscape';
    pageSize?: 'a4' | 'letter' | 'legal';
}

/**
 * Format data for export by applying column definitions
 */
const formatDataForExport = (
    data: any[],
    columns?: ExportColumn[]
): any[] => {
    if (!columns || columns.length === 0) {
        return data;
    }

    return data.map(row => {
        const formattedRow: any = {};
        columns.forEach(col => {
            const value = row[col.key];
            formattedRow[col.label] = col.format ? col.format(value) : value;
        });
        return formattedRow;
    });
};

/**
 * Generate filename with timestamp
 */
const generateFilename = (
    baseName: string,
    extension: string,
    includeTimestamp: boolean = true
): string => {
    const timestamp = includeTimestamp
        ? `_${new Date().toISOString().split('T')[0]}_${new Date().getTime()}`
        : '';
    return `${baseName}${timestamp}.${extension}`;
};

/**
 * Export data to Excel (.xlsx)
 * 
 * @param data - Array of objects to export
 * @param filename - Base filename (without extension)
 * @param options - Export options
 */
export const exportToExcel = (
    data: any[],
    filename: string = 'export',
    options: ExportOptions = {}
): void => {
    try {
        const {
            sheetName = 'Sheet1',
            columns,
            includeTimestamp = true,
            title
        } = options;

        // Format data if columns are provided
        const formattedData = formatDataForExport(data, columns);

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(formattedData);

        // Auto-size columns
        const colWidths = Object.keys(formattedData[0] || {}).map(key => ({
            wch: Math.max(
                key.length,
                ...formattedData.map(row => String(row[key] || '').length)
            ) + 2
        }));
        ws['!cols'] = colWidths;

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // Add metadata
        wb.Props = {
            Title: title || filename,
            Subject: 'Data Export',
            Author: 'NucleIQ ERP',
            CreatedDate: new Date()
        };

        // Generate filename and download
        const finalFilename = generateFilename(filename, 'xlsx', includeTimestamp);
        XLSX.writeFile(wb, finalFilename);

        console.log(`✅ Exported ${data.length} rows to ${finalFilename}`);
    } catch (error) {
        console.error('❌ Excel export failed:', error);
        throw new Error('Failed to export to Excel. Please try again.');
    }
};

/**
 * Export data to CSV
 * 
 * @param data - Array of objects to export
 * @param filename - Base filename (without extension)
 * @param options - Export options
 */
export const exportToCSV = (
    data: any[],
    filename: string = 'export',
    options: ExportOptions = {}
): void => {
    try {
        const { columns, includeTimestamp = true } = options;

        // Format data if columns are provided
        const formattedData = formatDataForExport(data, columns);

        // Convert to CSV
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const csv = XLSX.utils.sheet_to_csv(ws);

        // Create blob and download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const finalFilename = generateFilename(filename, 'csv', includeTimestamp);
        link.setAttribute('href', url);
        link.setAttribute('download', finalFilename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`✅ Exported ${data.length} rows to ${finalFilename}`);
    } catch (error) {
        console.error('❌ CSV export failed:', error);
        throw new Error('Failed to export to CSV. Please try again.');
    }
};

/**
 * Export data to PDF
 * 
 * @param data - Array of objects to export
 * @param title - Document title
 * @param options - Export options
 */
export const exportToPDF = (
    data: any[],
    title: string = 'Report',
    options: ExportOptions = {}
): void => {
    try {
        const {
            filename = 'export',
            columns,
            includeTimestamp = true,
            orientation = 'landscape',
            pageSize = 'a4'
        } = options;

        // Initialize PDF
        const doc = new jsPDF({
            orientation,
            unit: 'mm',
            format: pageSize
        });

        // Add title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 14, 15);

        // Add timestamp
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Generated on: ${new Date().toLocaleString()}`,
            14,
            22
        );

        // Prepare table data
        let tableColumns: string[];
        let tableRows: any[][];

        if (columns && columns.length > 0) {
            tableColumns = columns.map(col => col.label);
            tableRows = data.map(row =>
                columns.map(col => {
                    const value = row[col.key];
                    return col.format ? col.format(value) : value;
                })
            );
        } else {
            // Auto-detect columns from first row
            tableColumns = Object.keys(data[0] || {});
            tableRows = data.map(row => Object.values(row));
        }

        // Generate table
        autoTable(doc, {
            head: [tableColumns],
            body: tableRows,
            startY: 28,
            theme: 'grid',
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { top: 28, left: 14, right: 14 }
        });

        // Add page numbers
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(
                `Page ${i} of ${pageCount}`,
                doc.internal.pageSize.getWidth() - 30,
                doc.internal.pageSize.getHeight() - 10
            );
        }

        // Save PDF
        const finalFilename = generateFilename(filename, 'pdf', includeTimestamp);
        doc.save(finalFilename);

        console.log(`✅ Exported ${data.length} rows to ${finalFilename}`);
    } catch (error) {
        console.error('❌ PDF export failed:', error);
        throw new Error('Failed to export to PDF. Please try again.');
    }
};

/**
 * Copy data to clipboard (tab-delimited for Excel paste)
 * 
 * @param data - Array of objects to copy
 * @param options - Export options
 */
export const copyToClipboard = (
    data: any[],
    options: ExportOptions = {}
): Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            const { columns } = options;

            // Format data if columns are provided
            const formattedData = formatDataForExport(data, columns);

            if (formattedData.length === 0) {
                throw new Error('No data to copy');
            }

            // Get headers
            const headers = Object.keys(formattedData[0]);

            // Create tab-delimited string
            const headerRow = headers.join('\t');
            const dataRows = formattedData.map(row =>
                headers.map(header => row[header] || '').join('\t')
            );
            const clipboardText = [headerRow, ...dataRows].join('\n');

            // Copy to clipboard
            navigator.clipboard.writeText(clipboardText).then(
                () => {
                    console.log(`✅ Copied ${data.length} rows to clipboard`);
                    resolve();
                },
                (err) => {
                    console.error('❌ Clipboard copy failed:', err);
                    reject(new Error('Failed to copy to clipboard. Please try again.'));
                }
            );
        } catch (error) {
            console.error('❌ Clipboard operation failed:', error);
            reject(error);
        }
    });
};

/**
 * Export data to JSON file
 * 
 * @param data - Array of objects to export
 * @param filename - Base filename (without extension)
 * @param options - Export options
 */
export const exportToJSON = (
    data: any[],
    filename: string = 'export',
    options: ExportOptions = {}
): void => {
    try {
        const { includeTimestamp = true } = options;

        // Convert to JSON string with formatting
        const jsonString = JSON.stringify(data, null, 2);

        // Create blob and download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const finalFilename = generateFilename(filename, 'json', includeTimestamp);
        link.setAttribute('href', url);
        link.setAttribute('download', finalFilename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`✅ Exported ${data.length} rows to ${finalFilename}`);
    } catch (error) {
        console.error('❌ JSON export failed:', error);
        throw new Error('Failed to export to JSON. Please try again.');
    }
};

/**
 * Print data (opens print dialog)
 * 
 * @param data - Array of objects to print
 * @param title - Document title
 * @param options - Export options
 */
export const printData = (
    data: any[],
    title: string = 'Report',
    options: ExportOptions = {}
): void => {
    try {
        const { columns } = options;

        // Format data if columns are provided
        const formattedData = formatDataForExport(data, columns);

        if (formattedData.length === 0) {
            throw new Error('No data to print');
        }

        // Get headers
        const headers = Object.keys(formattedData[0]);

        // Create HTML table
        const tableHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          h1 {
            color: #2c3e50;
            margin-bottom: 10px;
          }
          .meta {
            color: #7f8c8d;
            font-size: 12px;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #2980b9;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">Generated on: ${new Date().toLocaleString()}</div>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${formattedData.map(row => `
              <tr>
                ${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

        // Open print window
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(tableHTML);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        } else {
            throw new Error('Failed to open print window. Please check popup blocker.');
        }

        console.log(`✅ Opened print dialog for ${data.length} rows`);
    } catch (error) {
        console.error('❌ Print failed:', error);
        throw new Error('Failed to print data. Please try again.');
    }
};

export default {
    exportToExcel,
    exportToCSV,
    exportToPDF,
    exportToJSON,
    copyToClipboard,
    printData
};
