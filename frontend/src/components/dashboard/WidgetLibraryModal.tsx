/**
 * Widget Library Modal
 * Modal for browsing and adding widgets to dashboard
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { X, Search, Plus, Check, LayoutGrid, TrendingUp, Users, DollarSign, Calendar, Award } from 'lucide-react';
import { Button, Badge } from '@/design-system';
import './WidgetLibraryModal.css';

interface WidgetDefinition {
    id: string;
    widget_id: string;
    name: string;
    description: string;
    category: string;
    category_display: string;
    icon: string;
    default_width: number;
    default_height: number;
    preview_image?: string;
}

interface WidgetsByCategory {
    [category: string]: WidgetDefinition[];
}

interface WidgetLibraryModalProps {
    currentWidgets: string[];
    onAdd: (widgetId: string) => void;
    onClose: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    academic: <LayoutGrid size={18} />,
    finance: <DollarSign size={18} />,
    hr: <Users size={18} />,
    attendance: <Calendar size={18} />,
    analytics: <TrendingUp size={18} />,
    leaderboard: <Award size={18} />,
};

const CATEGORY_COLORS: Record<string, string> = {
    academic: '#3b82f6',
    finance: '#10b981',
    hr: '#8b5cf6',
    attendance: '#f59e0b',
    analytics: '#06b6d4',
    leaderboard: '#ec4899',
    communication: '#6366f1',
    system: '#64748b',
    parent: '#22c55e',
    student: '#0ea5e9',
    teacher: '#a855f7',
};

export const WidgetLibraryModal: React.FC<WidgetLibraryModalProps> = ({
    currentWidgets,
    onAdd,
    onClose
}) => {
    const { t } = useTranslation();
    const [widgets, setWidgets] = useState<WidgetsByCategory>({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [addingWidget, setAddingWidget] = useState<string | null>(null);

    useEffect(() => {
        fetchWidgets();
    }, []);

    const fetchWidgets = async () => {
        try {
            const res = await api.get<WidgetsByCategory>('/dashboard/widgets/by_category/');
            setWidgets(res.data);
        } catch (error) {
            console.error('Failed to fetch widgets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddWidget = async (widgetId: string) => {
        setAddingWidget(widgetId);
        try {
            await onAdd(widgetId);
        } finally {
            setAddingWidget(null);
        }
    };

    const filteredWidgets = Object.entries(widgets).reduce<WidgetsByCategory>((acc, [category, categoryWidgets]) => {
        // Filter by category if selected
        if (selectedCategory && category !== selectedCategory) {
            return acc;
        }

        // Filter by search query
        const filtered = categoryWidgets.filter(widget => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                widget.name.toLowerCase().includes(query) ||
                widget.description.toLowerCase().includes(query)
            );
        });

        if (filtered.length > 0) {
            acc[category] = filtered;
        }

        return acc;
    }, {});

    const categories = Object.keys(widgets);
    const totalAvailableWidgets = Object.values(widgets).flat().filter(w => !currentWidgets.includes(w.widget_id)).length;

    return (
        <div className="widget-library-modal-overlay" onClick={onClose}>
            <div className="widget-library-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="header-content">
                        <h2>{t('dashboard.widget_library', { defaultValue: 'Widget Library' })}</h2>
                        <p className="header-subtitle">
                            {t('dashboard.widget_library_subtitle', {
                                defaultValue: `${totalAvailableWidgets} widgets available to add`
                            })}
                        </p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="modal-filters">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder={t('dashboard.search_widgets', { defaultValue: 'Search widgets...' })}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="category-filters">
                        <button
                            className={`category-chip ${!selectedCategory ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(null)}
                        >
                            All
                        </button>
                        {categories.map(category => (
                            <button
                                key={category}
                                className={`category-chip ${selectedCategory === category ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(category)}
                                style={{
                                    '--category-color': CATEGORY_COLORS[category] || '#64748b'
                                } as React.CSSProperties}
                            >
                                {CATEGORY_ICONS[category]}
                                <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Widget Grid */}
                <div className="modal-content">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner">⏳</div>
                            <p>{t('common.loading', { defaultValue: 'Loading...' })}</p>
                        </div>
                    ) : Object.keys(filteredWidgets).length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🔍</div>
                            <h3>{t('dashboard.no_widgets_found', { defaultValue: 'No widgets found' })}</h3>
                            <p>{t('dashboard.try_different_search', { defaultValue: 'Try a different search term or category' })}</p>
                        </div>
                    ) : (
                        Object.entries(filteredWidgets).map(([category, categoryWidgets]) => (
                            <div key={category} className="widget-category">
                                <h3 className="category-title" style={{ color: CATEGORY_COLORS[category] }}>
                                    {CATEGORY_ICONS[category]}
                                    <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                                    <Badge variant="secondary" size="sm">{categoryWidgets.length}</Badge>
                                </h3>

                                <div className="widgets-grid">
                                    {categoryWidgets.map(widget => {
                                        const isAdded = currentWidgets.includes(widget.widget_id);
                                        const isAdding = addingWidget === widget.widget_id;

                                        return (
                                            <div
                                                key={widget.widget_id}
                                                className={`widget-card ${isAdded ? 'added' : ''}`}
                                            >
                                                <div className="widget-icon">
                                                    {widget.icon || '📊'}
                                                </div>
                                                <div className="widget-info">
                                                    <h4>{widget.name}</h4>
                                                    <p>{widget.description}</p>
                                                    <div className="widget-size">
                                                        {widget.default_width}×{widget.default_height} grid
                                                    </div>
                                                </div>
                                                <div className="widget-action">
                                                    {isAdded ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled
                                                            iconLeft={Check}
                                                        >
                                                            {t('dashboard.added', { defaultValue: 'Added' })}
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            iconLeft={Plus}
                                                            loading={isAdding}
                                                            onClick={() => handleAddWidget(widget.widget_id)}
                                                        >
                                                            {t('common.add', { defaultValue: 'Add' })}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default WidgetLibraryModal;
