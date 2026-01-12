import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import {
    CreditCard,
    Download,
    Printer,
    Search,
    Filter,
    CheckSquare,
    Square,
    QrCode,
    Barcode,
    Image,
    RefreshCw,
    FileDown,
    AlertCircle
} from 'lucide-react';
import './BulkIDCards.css';

interface Student {
    id: number;
    first_name: string;
    last_name: string;
    admission_number: string;
    current_class?: string;
    section?: string;
    photo?: string;
    date_of_birth?: string;
    blood_group?: string;
    roll_number?: string;
}

interface Template {
    id: number;
    name: string;
    design_data: any;
}

interface GenerationSettings {
    includeQR: boolean;
    includeBarcode: boolean;
    template: number | null;
    cardsPerPage: number;
}

const BulkIDCards: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState('all');
    const [sectionFilter, setSectionFilter] = useState('all');
    const [classes, setClasses] = useState<string[]>([]);
    const [sections, setSections] = useState<string[]>([]);
    const [settings, setSettings] = useState<GenerationSettings>({
        includeQR: true,
        includeBarcode: false,
        template: null,
        cardsPerPage: 8
    });
    const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [studentsRes, templatesRes] = await Promise.all([
                api.get('/students/'),
                api.get('/students/idcards/templates/')
            ]);

            const studentList = studentsRes.data.results || studentsRes.data;
            setStudents(studentList);

            // Extract unique classes and sections
            const uniqueClasses = [...new Set(studentList.map((s: Student) => s.current_class))].filter(Boolean);
            const uniqueSections = [...new Set(studentList.map((s: Student) => s.section))].filter(Boolean);
            setClasses(uniqueClasses as string[]);
            setSections(uniqueSections as string[]);

            setTemplates(templatesRes.data.results || templatesRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch =
            student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.admission_number.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesClass = classFilter === 'all' || student.current_class === classFilter;
        const matchesSection = sectionFilter === 'all' || student.section === sectionFilter;

        return matchesSearch && matchesClass && matchesSection;
    });

    const toggleStudent = (id: number) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedStudents(newSelected);
    };

    const toggleAll = () => {
        if (selectedStudents.size === filteredStudents.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
        }
    };

    const selectByClass = (className: string) => {
        const classStudents = students.filter(s => s.current_class === className);
        const newSelected = new Set(selectedStudents);
        classStudents.forEach(s => newSelected.add(s.id));
        setSelectedStudents(newSelected);
    };

    const generateQRCode = async (data: string): Promise<string> => {
        return await QRCode.toDataURL(data, {
            width: 100,
            margin: 1,
            color: { dark: '#000000', light: '#FFFFFF' }
        });
    };

    const generateBarcode = (data: string): string => {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, data, {
            format: 'CODE128',
            width: 2,
            height: 30,
            displayValue: false
        });
        return canvas.toDataURL();
    };

    const generateIDCards = async () => {
        if (selectedStudents.size === 0) {
            alert('Please select at least one student');
            return;
        }

        setGenerating(true);
        setGenerationProgress(0);

        const selectedList = students.filter(s => selectedStudents.has(s.id));
        const total = selectedList.length;

        try {
            // Create a container for all ID cards
            const container = document.createElement('div');
            container.style.cssText = 'display: flex; flex-wrap: wrap; gap: 10px; padding: 20px; background: white;';

            for (let i = 0; i < selectedList.length; i++) {
                const student = selectedList[i];

                // Create individual card
                const card = await createIDCardElement(student);
                container.appendChild(card);

                setGenerationProgress(Math.round(((i + 1) / total) * 100));
            }

            // Add container to document temporarily
            document.body.appendChild(container);

            // Generate image
            const canvas = await html2canvas(container, {
                scale: 2,
                backgroundColor: '#ffffff'
            });

            // Download
            const link = document.createElement('a');
            link.download = `id_cards_${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            // Cleanup
            document.body.removeChild(container);

        } catch (error) {
            console.error('Error generating ID cards:', error);
            alert('Failed to generate ID cards. Please try again.');
        } finally {
            setGenerating(false);
            setGenerationProgress(0);
        }
    };

    const createIDCardElement = async (student: Student): Promise<HTMLDivElement> => {
        const card = document.createElement('div');
        card.style.cssText = `
            width: 324px;
            height: 204px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 15px;
            color: white;
            font-family: Arial, sans-serif;
            position: relative;
            box-sizing: border-box;
        `;

        const className = student.current_class || 'N/A';
        const section = student.section || 'N/A';

        let cardHTML = `
            <div style="text-align: center; margin-bottom: 10px; font-weight: bold; font-size: 12px;">
                SCHOOL NAME
            </div>
            <div style="display: flex; gap: 15px;">
                <div style="width: 70px; height: 85px; background: white; border-radius: 6px; overflow: hidden;">
                    ${student.photo ?
                `<img src="${student.photo}" style="width: 100%; height: 100%; object-fit: cover;" />` :
                `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #999; font-size: 10px;">No Photo</div>`
            }
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">
                        ${student.first_name} ${student.last_name}
                    </div>
                    <div style="font-size: 11px; margin-bottom: 3px;">
                        Class: ${className} - ${section}
                    </div>
                    <div style="font-size: 10px; margin-bottom: 3px;">
                        Adm No: ${student.admission_number}
                    </div>
                    ${student.blood_group ? `<div style="font-size: 10px;">Blood Group: ${student.blood_group}</div>` : ''}
                </div>
            </div>
        `;

        // Add QR code
        if (settings.includeQR) {
            const qrDataUrl = await generateQRCode(student.admission_number);
            cardHTML += `
                <div style="position: absolute; bottom: 15px; right: 15px; background: white; padding: 5px; border-radius: 4px;">
                    <img src="${qrDataUrl}" style="width: 50px; height: 50px;" />
                </div>
            `;
        }

        // Add Barcode
        if (settings.includeBarcode) {
            const barcodeDataUrl = generateBarcode(student.admission_number);
            cardHTML += `
                <div style="position: absolute; bottom: 15px; left: 15px;">
                    <img src="${barcodeDataUrl}" style="height: 25px;" />
                </div>
            `;
        }

        card.innerHTML = cardHTML;
        return card;
    };

    const printIDCards = async () => {
        if (selectedStudents.size === 0) {
            alert('Please select at least one student');
            return;
        }

        setGenerating(true);

        try {
            const selectedList = students.filter(s => selectedStudents.has(s.id));

            // Create print-friendly HTML
            let printContent = `
                <html>
                <head>
                    <title>ID Cards</title>
                    <style>
                        @page { size: A4; margin: 10mm; }
                        body { margin: 0; padding: 0; }
                        .card-grid {
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            gap: 10px;
                            page-break-inside: avoid;
                        }
                        .id-card {
                            width: 85.6mm;
                            height: 53.98mm;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            border-radius: 3mm;
                            padding: 4mm;
                            color: white;
                            font-family: Arial, sans-serif;
                            box-sizing: border-box;
                            position: relative;
                            page-break-inside: avoid;
                        }
                    </style>
                </head>
                <body>
                    <div class="card-grid">
            `;

            for (const student of selectedList) {
                const qrDataUrl = settings.includeQR ? await generateQRCode(student.admission_number) : '';
                const className = student.current_class || 'N/A';
                const section = student.section || 'N/A';

                printContent += `
                    <div class="id-card">
                        <div style="text-align: center; font-weight: bold; font-size: 10pt; margin-bottom: 2mm;">
                            SCHOOL NAME
                        </div>
                        <div style="display: flex; gap: 3mm;">
                            <div style="width: 20mm; height: 25mm; background: white; border-radius: 1mm; overflow: hidden;">
                                ${student.photo ?
                        `<img src="${student.photo}" style="width: 100%; height: 100%; object-fit: cover;" />` :
                        `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #999; font-size: 8pt;">Photo</div>`
                    }
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; font-size: 11pt; margin-bottom: 1mm;">
                                    ${student.first_name} ${student.last_name}
                                </div>
                                <div style="font-size: 9pt; margin-bottom: 1mm;">
                                    Class: ${className} - ${section}
                                </div>
                                <div style="font-size: 8pt;">
                                    Adm: ${student.admission_number}
                                </div>
                            </div>
                            ${settings.includeQR ? `
                                <div style="background: white; padding: 1mm; border-radius: 1mm;">
                                    <img src="${qrDataUrl}" style="width: 15mm; height: 15mm;" />
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }

            printContent += `
                    </div>
                </body>
                </html>
            `;

            // Open print window
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(printContent);
                printWindow.document.close();
                printWindow.print();
            }

        } catch (error) {
            console.error('Error printing ID cards:', error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="bulk-id-container">
            <div className="page-header">
                <div className="header-left">
                    <h1><CreditCard size={28} /> Bulk ID Card Generation</h1>
                    <p>Generate ID cards for multiple students at once</p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn-secondary"
                        onClick={printIDCards}
                        disabled={selectedStudents.size === 0 || generating}
                    >
                        <Printer size={18} />
                        Print Cards
                    </button>
                    <button
                        className="btn-primary"
                        onClick={generateIDCards}
                        disabled={selectedStudents.size === 0 || generating}
                    >
                        {generating ? (
                            <>
                                <RefreshCw size={18} className="spin" />
                                Generating ({generationProgress}%)
                            </>
                        ) : (
                            <>
                                <Download size={18} />
                                Generate & Download
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="main-content">
                {/* Settings Panel */}
                <div className="settings-panel">
                    <h3>Generation Settings</h3>

                    <div className="setting-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={settings.includeQR}
                                onChange={(e) => setSettings({ ...settings, includeQR: e.target.checked })}
                            />
                            <QrCode size={16} />
                            Include QR Code
                        </label>
                    </div>

                    <div className="setting-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={settings.includeBarcode}
                                onChange={(e) => setSettings({ ...settings, includeBarcode: e.target.checked })}
                            />
                            <Barcode size={16} />
                            Include Barcode
                        </label>
                    </div>

                    <div className="setting-group">
                        <label>Cards per page</label>
                        <select
                            value={settings.cardsPerPage}
                            onChange={(e) => setSettings({ ...settings, cardsPerPage: parseInt(e.target.value) })}
                        >
                            <option value={4}>4 cards</option>
                            <option value={6}>6 cards</option>
                            <option value={8}>8 cards</option>
                            <option value={10}>10 cards</option>
                        </select>
                    </div>

                    {templates.length > 0 && (
                        <div className="setting-group">
                            <label>Template</label>
                            <select
                                value={settings.template || ''}
                                onChange={(e) => setSettings({ ...settings, template: e.target.value ? parseInt(e.target.value) : null })}
                            >
                                <option value="">Default Template</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="selection-summary">
                        <strong>{selectedStudents.size}</strong> students selected
                    </div>

                    <div className="quick-select">
                        <h4>Quick Select by Class</h4>
                        <div className="class-buttons">
                            {classes.map(cls => (
                                <button
                                    key={cls}
                                    onClick={() => selectByClass(cls)}
                                    className="class-btn"
                                >
                                    {cls}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Student List */}
                <div className="student-list-panel">
                    <div className="list-header">
                        <div className="search-filter">
                            <div className="search-box">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                                <option value="all">All Classes</option>
                                {classes.map(cls => (
                                    <option key={cls} value={cls}>{cls}</option>
                                ))}
                            </select>
                            <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                                <option value="all">All Sections</option>
                                {sections.map(sec => (
                                    <option key={sec} value={sec}>{sec}</option>
                                ))}
                            </select>
                        </div>
                        <button className="select-all-btn" onClick={toggleAll}>
                            {selectedStudents.size === filteredStudents.length ? (
                                <><CheckSquare size={18} /> Deselect All</>
                            ) : (
                                <><Square size={18} /> Select All ({filteredStudents.length})</>
                            )}
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <RefreshCw size={32} className="spin" />
                            <p>Loading students...</p>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="empty-state">
                            <AlertCircle size={48} />
                            <p>No students found</p>
                        </div>
                    ) : (
                        <div className="student-grid">
                            {filteredStudents.map(student => (
                                <div
                                    key={student.id}
                                    className={`student-card ${selectedStudents.has(student.id) ? 'selected' : ''}`}
                                    onClick={() => toggleStudent(student.id)}
                                >
                                    <div className="checkbox">
                                        {selectedStudents.has(student.id) ? (
                                            <CheckSquare size={20} />
                                        ) : (
                                            <Square size={20} />
                                        )}
                                    </div>
                                    <div className="student-photo">
                                        {student.photo ? (
                                            <img src={student.photo} alt={student.first_name} />
                                        ) : (
                                            <div className="no-photo">
                                                {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="student-info">
                                        <span className="name">{student.first_name} {student.last_name}</span>
                                        <span className="details">
                                            {student.current_class || 'N/A'} - {student.section || 'N/A'}
                                        </span>
                                        <span className="admission">{student.admission_number}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkIDCards;
