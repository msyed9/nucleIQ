import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

type WidgetDefinition = {
    id: string;
    name: string;
    description?: string;
    category?: string;
    icon?: string;
    default_width?: number;
    default_height?: number;
};

type WidgetLibraryProps = {
    onClose?: () => void;
    onWidgetAdded?: () => void;
};

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({ onClose, onWidgetAdded }) => {
    const [widgets, setWidgets] = useState<WidgetDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addingId, setAddingId] = useState<string | null>(null);

    useEffect(() => {
        const loadWidgets = async () => {
            try {
                setLoading(true);
                const response = await api.get<WidgetDefinition[]>('/dashboard/layout/available_widgets/');
                setWidgets(response.data || []);
            } catch (err) {
                console.error('Failed to load widgets:', err);
                setError('Failed to load widgets. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadWidgets();
    }, []);

    const groupedWidgets = useMemo(() => {
        const groups: Record<string, WidgetDefinition[]> = {};
        widgets.forEach((widget) => {
            const category = widget.category || 'Other';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(widget);
        });
        return groups;
    }, [widgets]);

    const handleAddWidget = async (widget: WidgetDefinition) => {
        if (addingId) return;
        setAddingId(widget.id);

        try {
            await api.post('/dashboard/layout/add_widget/', {
                widget_id: widget.id,
                x: 0,
                y: 1000,
                w: widget.default_width,
                h: widget.default_height,
            });
            setWidgets((prev) => prev.filter((w) => w.id !== widget.id));
            onWidgetAdded?.();
        } catch (err) {
            console.error('Failed to add widget:', err);
            setError('Failed to add widget. Please try again.');
        } finally {
            setAddingId(null);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
                zIndex: 1000,
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '900px',
                    background: 'var(--color-bg-primary)',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                    border: '1px solid var(--color-border)',
                    padding: '1.5rem',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Add Widget</h2>
                    {onClose && (
                        <button
                            onClick={onClose}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--color-text-secondary)',
                                fontSize: '1.25rem',
                                cursor: 'pointer',
                            }}
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {loading && (
                    <div style={{ padding: '1rem 0', color: 'var(--color-text-secondary)' }}>
                        Loading widgets...
                    </div>
                )}

                {error && (
                    <div style={{ padding: '0.75rem 0', color: 'var(--color-error)' }}>{error}</div>
                )}

                {!loading && widgets.length === 0 && !error && (
                    <div style={{ padding: '1rem 0', color: 'var(--color-text-secondary)' }}>
                        No more widgets available to add.
                    </div>
                )}

                <div style={{ maxHeight: '60vh', overflow: 'auto', marginTop: '1rem' }}>
                    {Object.entries(groupedWidgets).map(([category, items]) => (
                        <div key={category} style={{ marginBottom: '1.25rem' }}>
                            <h3 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-text-secondary)' }}>
                                {category}
                            </h3>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                    gap: '0.75rem',
                                }}
                            >
                                {items.map((widget) => (
                                    <div
                                        key={widget.id}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg-secondary)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.25rem' }}>{widget.icon || '📊'}</span>
                                            <strong style={{ color: 'var(--color-text-primary)' }}>
                                                {widget.name}
                                            </strong>
                                        </div>
                                        {widget.description && (
                                            <p
                                                style={{
                                                    margin: '0.5rem 0 0',
                                                    fontSize: '0.85rem',
                                                    color: 'var(--color-text-secondary)',
                                                }}
                                            >
                                                {widget.description}
                                            </p>
                                        )}
                                        <button
                                            onClick={() => handleAddWidget(widget)}
                                            disabled={addingId === widget.id}
                                            style={{
                                                marginTop: '0.75rem',
                                                width: '100%',
                                                border: 'none',
                                                padding: '0.5rem 0.75rem',
                                                borderRadius: '8px',
                                                background: 'var(--color-primary)',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                opacity: addingId === widget.id ? 0.7 : 1,
                                            }}
                                        >
                                            {addingId === widget.id ? 'Adding...' : 'Add'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WidgetLibrary;
