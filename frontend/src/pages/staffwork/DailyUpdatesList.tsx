/**
 * List of the current user's daily status updates (own updates; full-access
 * users see all — the backend scopes the queryset). Links to the new-update form.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/design-system';
import { dailyUpdates } from '../../services/staffwork';
import { formatDate } from '../../utils/helpers';

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'var(--color-text-tertiary)',
    SUBMITTED: 'var(--color-info)',
    REVIEWED: 'var(--color-success)',
};

const DailyUpdatesList: React.FC = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dailyUpdates.list()
            .then((res) => setItems(res.data?.results ?? res.data ?? []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Daily Updates</h2>
                <Button onClick={() => navigate('/staffwork/daily-updates/new')}>New update</Button>
            </div>

            {loading && <p>Loading…</p>}
            {!loading && items.length === 0 && (
                <Card padding="lg"><p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>No updates yet.</p></Card>
            )}

            {items.map((u) => (
                <Card key={u.id} padding="lg">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontWeight: 600 }}>{u.summary}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                {formatDate(u.date)} · {u.role}{u.remark_count ? ` · ${u.remark_count} student remark(s)` : ''}
                            </div>
                        </div>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: STATUS_COLORS[u.status] }}>{u.status_display || u.status}</span>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default DailyUpdatesList;
