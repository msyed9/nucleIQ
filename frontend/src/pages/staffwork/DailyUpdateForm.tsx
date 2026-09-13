/**
 * Daily Status Update form for teachers and admin staff.
 *
 * - Teachers pick a class, load its students, and flag per-student observations
 *   (no homework / incomplete classwork / disruptive / absent / participated
 *   well) alongside the day's summary — all submitted in one call.
 * - Non-teaching staff (Finance/HR/Admin/Front office) get a role-tailored form
 *   with just the summary/details (no student section).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/design-system';
import api from '../../services/api';
import { dailyUpdates, StudentRemarkInput } from '../../services/staffwork';

const ROLE_OPTIONS = [
    { value: 'TEACHER', label: 'Teacher' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'FINANCE', label: 'Finance' },
    { value: 'HR', label: 'HR' },
    { value: 'FRONT_OFFICE', label: 'Front Office' },
    { value: 'OTHER', label: 'Other' },
];

type RemarkState = Record<string, StudentRemarkInput>;

const DailyUpdateForm: React.FC = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('TEACHER');
    const [summary, setSummary] = useState('');
    const [details, setDetails] = useState('');
    const [sections, setSections] = useState<any[]>([]);
    const [sectionId, setSectionId] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [remarks, setRemarks] = useState<RemarkState>({});
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isTeacher = role === 'TEACHER';

    useEffect(() => {
        api.get('/tenants/sections/')
            .then((res) => setSections(res.data?.results ?? res.data ?? []))
            .catch(() => setSections([]));
    }, []);

    useEffect(() => {
        if (!isTeacher || !sectionId) {
            setStudents([]);
            return;
        }
        setLoadingStudents(true);
        api.get(`/students/students/?section=${sectionId}`)
            .then((res) => setStudents(res.data?.results ?? res.data ?? []))
            .catch(() => setStudents([]))
            .finally(() => setLoadingStudents(false));
    }, [sectionId, isTeacher]);

    const toggleFlag = (studentId: string, field: keyof StudentRemarkInput) => {
        setRemarks((prev) => {
            const existing = prev[studentId] || { student: studentId };
            return { ...prev, [studentId]: { ...existing, [field]: !existing[field as keyof StudentRemarkInput] } };
        });
    };

    const setRemarkText = (studentId: string, text: string) => {
        setRemarks((prev) => ({
            ...prev,
            [studentId]: { ...(prev[studentId] || { student: studentId }), remark: text },
        }));
    };

    // Only send rows that carry at least one flag or a note.
    const activeRemarks = useMemo(() => {
        return Object.values(remarks).filter((r) =>
            r.did_not_do_homework || r.did_not_complete_classwork || r.was_disruptive ||
            r.was_absent || r.participated_well || (r.remark && r.remark.trim())
        );
    }, [remarks]);

    const submit = async (status: 'DRAFT' | 'SUBMITTED') => {
        setError(null);
        if (!summary.trim()) {
            setError('Please enter a summary for the day.');
            return;
        }
        setSubmitting(true);
        try {
            await dailyUpdates.create({
                role,
                summary,
                details,
                status,
                related_class: isTeacher && sectionId ? sectionId : null,
                student_remarks: isTeacher ? activeRemarks : [],
            });
            navigate('/staffwork/daily-updates');
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Could not save the update. Please review the form.');
        } finally {
            setSubmitting(false);
        }
    };

    const FLAG_FIELDS: { field: keyof StudentRemarkInput; label: string }[] = [
        { field: 'did_not_do_homework', label: 'No HW' },
        { field: 'did_not_complete_classwork', label: 'Incomplete CW' },
        { field: 'was_disruptive', label: 'Disruptive' },
        { field: 'was_absent', label: 'Absent' },
        { field: 'participated_well', label: 'Participated' },
    ];

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ margin: 0 }}>Daily Status Update</h2>

            {error && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(244,67,54,0.1)', color: 'var(--color-danger)' }}>
                    {error}
                </div>
            )}

            <Card padding="lg">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Role</div>
                        <select value={role} onChange={(e) => setRole(e.target.value)} style={selectStyle}>
                            {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </label>

                    <label>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Summary *</div>
                        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} style={inputStyle}
                            placeholder="What happened today?" />
                    </label>

                    <label>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Details</div>
                        <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} style={inputStyle} />
                    </label>
                </div>
            </Card>

            {isTeacher && (
                <Card header={<h3 style={{ margin: 0 }}>Per-student observations</h3>} padding="lg">
                    <label style={{ display: 'block', marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Class / Section</div>
                        <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={selectStyle}>
                            <option value="">Select a class…</option>
                            {sections.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {(s.grade_level_name || s.grade_level?.name || '')} {s.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    {loadingStudents && <p>Loading students…</p>}

                    {!loadingStudents && sectionId && students.length === 0 && (
                        <p style={{ color: 'var(--color-text-secondary)' }}>No students in this class.</p>
                    )}

                    {students.map((st) => {
                        const r = remarks[st.id] || { student: st.id };
                        return (
                            <div key={st.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--color-border-light)' }}>
                                <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>
                                    {st.full_name || `${st.first_name} ${st.last_name}`} <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>({st.admission_number})</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                                    {FLAG_FIELDS.map((f) => (
                                        <label key={f.field} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={!!r[f.field]} onChange={() => toggleFlag(st.id, f.field)} />
                                            {f.label}
                                        </label>
                                    ))}
                                </div>
                                <input type="text" value={r.remark || ''} onChange={(e) => setRemarkText(st.id, e.target.value)}
                                    placeholder="Optional note" style={{ ...inputStyle, padding: '0.4rem 0.6rem' }} />
                            </div>
                        );
                    })}
                </Card>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => submit('DRAFT')} disabled={submitting}>Save draft</Button>
                <Button onClick={() => submit('SUBMITTED')} disabled={submitting}>Submit</Button>
            </div>
        </div>
    );
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)', fontFamily: 'inherit', fontSize: '0.875rem',
};
const selectStyle: React.CSSProperties = { ...inputStyle };

export default DailyUpdateForm;
