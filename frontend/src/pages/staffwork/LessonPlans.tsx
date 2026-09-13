/**
 * Lesson Plans: teachers create/list their plans; supervisors/principals see all
 * (backend scopes visibility). Includes a create form with the core fields.
 */

import React, { useEffect, useState } from 'react';
import { Button, Card } from '@/design-system';
import api from '../../services/api';
import { lessonPlans, LessonPlanInput } from '../../services/staffwork';
import { formatDate } from '../../utils/helpers';

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'var(--color-text-tertiary)',
    PUBLISHED: 'var(--color-success)',
    ARCHIVED: 'var(--color-text-secondary)',
};

const emptyForm: LessonPlanInput = {
    topic: '', date: new Date().toISOString().slice(0, 10),
    objectives: '', activities: '', resources: '', homework: '',
    status: 'DRAFT', section: '', subject: '',
};

const LessonPlans: React.FC = () => {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<LessonPlanInput>(emptyForm);
    const [sections, setSections] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        lessonPlans.list()
            .then((res) => setPlans(res.data?.results ?? res.data ?? []))
            .catch(() => setPlans([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        api.get('/tenants/sections/').then((r) => setSections(r.data?.results ?? r.data ?? [])).catch(() => {});
        api.get('/tenants/subjects/').then((r) => setSubjects(r.data?.results ?? r.data ?? [])).catch(() => {});
    }, []);

    const set = (field: keyof LessonPlanInput, value: any) => setForm((f) => ({ ...f, [field]: value }));

    const save = async (status: 'DRAFT' | 'PUBLISHED') => {
        setError(null);
        if (!form.topic.trim() || !form.date) {
            setError('Topic and date are required.');
            return;
        }
        setSaving(true);
        try {
            await lessonPlans.create({
                ...form, status,
                section: form.section || null,
                subject: form.subject || null,
            });
            setForm(emptyForm);
            setShowForm(false);
            load();
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Could not save the lesson plan.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Lesson Plans</h2>
                <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'New plan'}</Button>
            </div>

            {error && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(244,67,54,0.1)', color: 'var(--color-danger)' }}>{error}</div>
            )}

            {showForm && (
                <Card padding="lg">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <Field label="Topic *"><input style={inp} value={form.topic} onChange={(e) => set('topic', e.target.value)} /></Field>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <Field label="Date *"><input type="date" style={inp} value={form.date} onChange={(e) => set('date', e.target.value)} /></Field>
                            <Field label="Class"><select style={inp} value={form.section || ''} onChange={(e) => set('section', e.target.value)}>
                                <option value="">—</option>
                                {sections.map((s) => <option key={s.id} value={s.id}>{(s.grade_level_name || s.grade_level?.name || '')} {s.name}</option>)}
                            </select></Field>
                            <Field label="Subject"><select style={inp} value={form.subject || ''} onChange={(e) => set('subject', e.target.value)}>
                                <option value="">—</option>
                                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select></Field>
                        </div>
                        <Field label="Objectives"><textarea rows={2} style={inp} value={form.objectives} onChange={(e) => set('objectives', e.target.value)} /></Field>
                        <Field label="Activities"><textarea rows={2} style={inp} value={form.activities} onChange={(e) => set('activities', e.target.value)} /></Field>
                        <Field label="Resources"><textarea rows={2} style={inp} value={form.resources} onChange={(e) => set('resources', e.target.value)} /></Field>
                        <Field label="Homework"><textarea rows={2} style={inp} value={form.homework} onChange={(e) => set('homework', e.target.value)} /></Field>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <Button variant="secondary" disabled={saving} onClick={() => save('DRAFT')}>Save draft</Button>
                            <Button disabled={saving} onClick={() => save('PUBLISHED')}>Publish</Button>
                        </div>
                    </div>
                </Card>
            )}

            {loading && <p>Loading…</p>}
            {!loading && plans.length === 0 && (
                <Card padding="lg"><p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>No lesson plans yet.</p></Card>
            )}

            {plans.map((p) => (
                <Card key={p.id} padding="lg">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontWeight: 600 }}>{p.topic}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                {formatDate(p.date)}{p.section_name ? ` · ${p.section_name}` : ''}{p.subject_name ? ` · ${p.subject_name}` : ''}
                                {p.teacher_name ? ` · ${p.teacher_name}` : ''}
                            </div>
                        </div>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: STATUS_COLORS[p.status] }}>{p.status_display || p.status}</span>
                    </div>
                </Card>
            ))}
        </div>
    );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <label style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' }}>{label}</div>
        {children}
    </label>
);

const inp: React.CSSProperties = {
    width: '100%', padding: '0.55rem 0.7rem', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)', fontFamily: 'inherit', fontSize: '0.875rem',
};

export default LessonPlans;
