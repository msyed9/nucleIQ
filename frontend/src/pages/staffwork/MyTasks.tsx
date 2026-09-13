/**
 * "My Tasks" page for admin/finance/HR staff: the daily/weekly tasks assigned to
 * the current user, with inline completion (notes + status).
 */

import React, { useEffect, useState } from 'react';
import { Button, Card } from '@/design-system';
import { adminTasks } from '../../services/staffwork';
import { formatDate } from '../../utils/helpers';

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'var(--color-warning)',
    IN_PROGRESS: 'var(--color-info)',
    COMPLETED: 'var(--color-success)',
    SKIPPED: 'var(--color-text-tertiary)',
    OVERDUE: 'var(--color-danger)',
};

const MyTasks: React.FC = () => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        adminTasks.my()
            .then((res) => setTasks(res.data?.results ?? res.data ?? []))
            .catch(() => setTasks([]))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const complete = async (id: string, status: string) => {
        setBusyId(id);
        try {
            await adminTasks.complete(id, { status, update_notes: notes[id] || '' });
            load();
        } finally {
            setBusyId(null);
        }
    };

    if (loading) return <p style={{ padding: '2rem' }}>Loading your tasks…</p>;

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>My Tasks</h2>

            {tasks.length === 0 && (
                <Card padding="lg"><p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>No tasks assigned.</p></Card>
            )}

            {tasks.map((t) => {
                const done = t.status === 'COMPLETED';
                return (
                    <Card key={t.id} padding="lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>{t.title}</div>
                                {t.description && <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{t.description}</div>}
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
                                    Due {formatDate(t.date)}{t.due_time ? ` · ${t.due_time}` : ''}
                                </div>
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: STATUS_COLORS[t.status] || 'var(--color-text-secondary)' }}>
                                {t.status_display || t.status}
                            </span>
                        </div>

                        {!done && (
                            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    placeholder="Completion note (optional)"
                                    value={notes[t.id] || ''}
                                    onChange={(e) => setNotes((p) => ({ ...p, [t.id]: e.target.value }))}
                                    style={{ flex: 1, minWidth: 200, padding: '0.5rem 0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                                />
                                <Button variant="secondary" disabled={busyId === t.id} onClick={() => complete(t.id, 'IN_PROGRESS')}>In progress</Button>
                                <Button disabled={busyId === t.id} onClick={() => complete(t.id, 'COMPLETED')}>Complete</Button>
                            </div>
                        )}
                        {done && t.update_notes && (
                            <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-success)' }}>✅ {t.update_notes}</p>
                        )}
                    </Card>
                );
            })}
        </div>
    );
};

export default MyTasks;
