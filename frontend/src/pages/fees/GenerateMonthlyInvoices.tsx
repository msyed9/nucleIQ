import React, { useEffect, useState } from 'react';
import { Button, Card, Select, Checkbox, useToast, ToastContainer } from '@/design-system';
import api from '../../services/api';

interface GradeLevel {
    id: string;
    name: string;
}

interface Section {
    id: string;
    name: string;
    grade_level: string;
}

interface PreviewRow {
    student_id: string;
    admission_number: string;
    name: string;
    class: string | null;
    section: string | null;
    amount: number;
    items: { description: string; amount: number }[];
}

const FREQUENCY_OPTIONS = [
    { value: '', label: 'Auto-detect (Monthly / Term)' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'TERM', label: 'Term' },
    { value: 'QUARTERLY', label: 'Quarterly' },
    { value: 'HALF_YEARLY', label: 'Half-Yearly' },
    { value: 'YEARLY', label: 'Yearly' },
    { value: 'ONE_TIME', label: 'One-Time' },
];

const GenerateMonthlyInvoices: React.FC = () => {
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedGradeIds, setSelectedGradeIds] = useState<Set<string>>(new Set());
    const [frequency, setFrequency] = useState('');
    const [preview, setPreview] = useState<PreviewRow[] | null>(null);
    const [previewMeta, setPreviewMeta] = useState<{ count: number; message: string } | null>(null);
    const [previewing, setPreviewing] = useState(false);
    const [generating, setGenerating] = useState(false);
    const { toasts, removeToast, success, error: showError } = useToast();

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        try {
            const [gradesRes, sectionsRes] = await Promise.all([
                api.get('/tenants/grades/'),
                api.get('/tenants/sections/'),
            ]);
            setGradeLevels(gradesRes.data.results || gradesRes.data);
            setSections(sectionsRes.data.results || sectionsRes.data);
        } catch (err) {
            console.error('Failed to load classes', err);
        }
    };

    const toggleGrade = (id: string) => {
        setSelectedGradeIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
        // Selection changed - invalidate any stale preview
        setPreview(null);
        setPreviewMeta(null);
    };

    const sectionIdsForSelectedGrades = () => {
        if (selectedGradeIds.size === 0) return [];
        return sections
            .filter((s) => selectedGradeIds.has(s.grade_level))
            .map((s) => s.id);
    };

    const buildPayload = (dryRun: boolean) => {
        const payload: Record<string, any> = { dry_run: dryRun };
        if (frequency) payload.frequency = frequency;
        if (selectedGradeIds.size > 0) {
            payload.grade_level_ids = Array.from(selectedGradeIds);
        }
        return payload;
    };

    const handlePreview = async () => {
        setPreviewing(true);
        setPreview(null);
        setPreviewMeta(null);
        try {
            const response = await api.post('/fees/invoices/generate_monthly/', buildPayload(true));
            setPreview(response.data.preview || []);
            setPreviewMeta({ count: response.data.count, message: response.data.message });
        } catch (err: any) {
            const data = err.response?.data;
            if (data && typeof data.count === 'number') {
                setPreview(data.preview || []);
                setPreviewMeta({ count: data.count, message: data.message });
            } else {
                showError(data?.error || 'Failed to preview invoices');
            }
        } finally {
            setPreviewing(false);
        }
    };

    const handleGenerate = async () => {
        if (!window.confirm(
            previewMeta
                ? `Generate ${previewMeta.count} invoice(s) now? This cannot be undone.`
                : 'Generate invoices now? Run a preview first to see what will be created.'
        )) {
            return;
        }

        setGenerating(true);
        try {
            const response = await api.post('/fees/invoices/generate_monthly/', buildPayload(false));
            success(response.data.message || `Generated ${response.data.count} invoices`);
            setPreview(null);
            setPreviewMeta(null);
        } catch (err: any) {
            showError(err.response?.data?.error || 'Failed to generate monthly invoices');
        } finally {
            setGenerating(false);
        }
    };

    const totalAmount = (preview || []).reduce((sum, row) => sum + row.amount, 0);

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <ToastContainer toasts={toasts} onDismiss={removeToast} />
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Generate Invoices</h1>
                <p className="text-gray-600">Preview and generate fee invoices for the current billing period.</p>
            </div>

            <Card>
                <div className="p-4 space-y-4">
                    <div className="max-w-xs">
                        <Select
                            label="Frequency"
                            options={FREQUENCY_OPTIONS}
                            value={frequency}
                            onChange={setFrequency}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Class-wise selection (optional — leave blank for all classes)
                        </label>
                        {gradeLevels.length === 0 ? (
                            <p className="text-sm text-gray-500">No classes found.</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {gradeLevels.map((grade) => (
                                    <Checkbox
                                        key={grade.id}
                                        label={grade.name}
                                        checked={selectedGradeIds.has(grade.id)}
                                        onChange={() => toggleGrade(grade.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={handlePreview} disabled={previewing || generating}>
                            {previewing ? 'Previewing...' : 'Preview (Dry Run)'}
                        </Button>
                        <Button onClick={handleGenerate} disabled={generating || previewing}>
                            {generating ? 'Generating...' : 'Generate Invoices'}
                        </Button>
                    </div>
                </div>
            </Card>

            {previewMeta && (
                <Card>
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="font-semibold text-gray-900">
                                Preview: {previewMeta.count} student(s) would be invoiced
                            </h2>
                            <span className="text-gray-700 font-medium">
                                Total: ₹{totalAmount.toLocaleString()}
                            </span>
                        </div>
                        {preview && preview.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="p-2">Admission No.</th>
                                            <th className="p-2">Name</th>
                                            <th className="p-2">Class</th>
                                            <th className="p-2">Section</th>
                                            <th className="p-2 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {preview.map((row) => (
                                            <tr key={row.student_id}>
                                                <td className="p-2">{row.admission_number}</td>
                                                <td className="p-2">{row.name}</td>
                                                <td className="p-2">{row.class || '—'}</td>
                                                <td className="p-2">{row.section || '—'}</td>
                                                <td className="p-2 text-right">₹{row.amount.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-600">{previewMeta.message}</p>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default GenerateMonthlyInvoices;
