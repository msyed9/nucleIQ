/**
 * Consolidated daily-update dashboard for supervisors and principals.
 *
 * Shows submitted updates grouped by date → role → user, with per-student
 * remarks and negative-flag counts, a date-range/role filter, and inline review.
 * Backend enforces full-access-only; a 403 renders a friendly notice.
 */

import React, { useEffect, useState } from 'react';
import { Button, Card } from '@/design-system';
import { dailyUpdates } from '../../services/staffwork';
import { formatDate } from '../../utils/helpers';

const ROLE_OPTIONS = ['', 'TEACHER', 'ADMIN', 'FINANCE', 'HR', 'FRONT_OFFICE', 'OTHER'];

const ConsolidatedDashboard: React.FC = () => {
    const today = new Date().toISOString().slice(0, 10);
    const [dateFrom, setDateFrom] = useState(today);
    const [dateTo, setDateTo] = useState(today);
    const [role, setRole] = useState('');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);
    const [reviewingId, setReviewingId] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        setForbidden(false);
        const params: Record<string, any> = { date_from: dateFrom, date_to: dateTo };
        if (role) params.role = role;
        dailyUpdates.consolidated(params)
            .then((res) => setData(res.data))
            .catch((e) => {
                if (e?.response?.status === 403) setForbidden(true);
                setData(null);
            })
            .finally(() => setLoading(false));
    };

    useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

    const review = async (id: string) => {
        setReviewingId(id);
        try {
            await dailyUpdates.review(id, '');
            load();
        } finally {
            setReviewingId(null);
        }
    };

    if (forbidden) {
        return (
            <Card padding="lg">
                <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    Only supervisors and principals can view the consolidated dashboard.
                </p>
            </Card>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ margin: 0 }}>Consolidated Daily Updates</h2>

            {/* Filters */}
            <Card padding="md">
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <label>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>From</div>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={ctrl} />
                    </label>
                    <label>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>To</div>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={ctrl} />
                    </label>
                    <label>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Role</div>
                        <select value={role} onChange={(e) => setRole(e.target.value)} style={ctrl}>
                            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r || 'All roles'}</option>)}
                        </select>
                    </label>
                    <Button onClick={load}>Apply</Button>
                </div>
            </Card>

            {loading && <p>Loading…</p>}

            {!loading && data && (
                <>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <SummaryCard label="Updates" value={data.summary?.updates ?? 0} color="var(--color-info)" />
                        <SummaryCard label="Negative flags" value={data.summary?.negative_flags ?? 0} color="var(--color-danger)" />
                    </div>

                    {(data.days || []).length === 0 && (
                        <Card padding="lg"><p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>No updates in this range.</p></Card>
                    )}

                    {(data.days || []).map((day: any) => (
                        <Card key={day.date} header={<h3 style={{ margin: 0 }}>{formatDate(day.date)}</h3>} padding="lg">
                            {day.roles.map((roleBlock: any) => (
                                <div key={roleBlock.role} style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: '0.5rem' }}>
                                        {roleBlock.role}
                                    </div>
                                    {roleBlock.users.map((u: any) => (
                                        <div key={u.user_id} style={{ paddingLeft: '0.5rem', marginBottom: '0.75rem' }}>
                                            <div style={{ fontWeight: 600 }}>{u.user_name}</div>
                                            {u.updates.map((upd: any) => (
                                                <div key={upd.id} style={{ padding: '0.6rem 0.75rem', margin: '0.4rem 0', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                                        <span style={{ fontSize: '0.875rem' }}>{upd.summary}</span>
                                                        <span style={{ fontSize: '0.75rem', color: upd.status === 'REVIEWED' ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
                                                            {upd.status_display || upd.status}
                                                        </span>
                                                    </div>
                                                    {upd.negative_flag_count > 0 && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '0.25rem' }}>
                                                            {upd.negative_flag_count} negative flag(s)
                                                        </div>
                                                    )}
                                                    {(upd.student_remarks || []).length > 0 && (
                                                        <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.1rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                                                            {upd.student_remarks.map((r: any) => (
                                                                <li key={r.id}>
                                                                    {r.student_detail?.full_name}: {[
                                                                        r.did_not_do_homework && 'no HW',
                                                                        r.did_not_complete_classwork && 'incomplete CW',
                                                                        r.was_disruptive && 'disruptive',
                                                                        r.was_absent && 'absent',
                                                                        r.participated_well && 'participated',
                                                                    ].filter(Boolean).join(', ')}
                                                                    {r.remark ? ` — ${r.remark}` : ''}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                    {upd.status !== 'REVIEWED' && (
                                                        <div style={{ marginTop: '0.5rem' }}>
                                                            <Button variant="secondary" disabled={reviewingId === upd.id} onClick={() => review(upd.id)}>
                                                                Mark reviewed
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </Card>
                    ))}
                </>
            )}
        </div>
    );
};

const SummaryCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div style={{ padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-secondary)' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{label}</div>
    </div>
);

const ctrl: React.CSSProperties = {
    padding: '0.5rem 0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
};

export default ConsolidatedDashboard;
