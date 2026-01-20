/**
 * Leaderboard Page
 * Displays various leaderboards with filtering options
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
    Trophy,
    Award,
    Medal,
    Users,
    GraduationCap,
    Calendar,
    TrendingUp,
    TrendingDown,
    Minus,
    Filter,
    RefreshCw,
    Crown
} from 'lucide-react';
import { Button, Card, Badge } from '@/design-system';
import './LeaderboardPage.css';

interface LeaderboardEntry {
    rank: number;
    previous_rank: number | null;
    rank_change: number | null;
    score: number;
    entity: {
        id: string;
        name: string;
        type: string;
        photo: string | null;
        class?: string;
        designation?: string;
    };
    details: Record<string, any>;
}

interface LeaderboardData {
    id: string;
    name: string;
    type: string;
    period: string;
    icon: string;
    color: string;
    show_scores: boolean;
    show_rank_change: boolean;
    period_start: string;
    period_end: string;
    entries: LeaderboardEntry[];
}

type LeaderboardType = 'all' | 'ACADEMIC' | 'ATTENDANCE' | 'HOMEWORK' | 'BEHAVIOR' | 'TEACHER_PERFORMANCE';

const TYPE_CONFIG: Record<LeaderboardType, { label: string; icon: React.ReactNode; color: string }> = {
    all: { label: 'All', icon: <Trophy size={18} />, color: '#6366f1' },
    ACADEMIC: { label: 'Academic', icon: <GraduationCap size={18} />, color: '#3b82f6' },
    ATTENDANCE: { label: 'Attendance', icon: <Calendar size={18} />, color: '#22c55e' },
    HOMEWORK: { label: 'Homework', icon: <Award size={18} />, color: '#f59e0b' },
    BEHAVIOR: { label: 'Behavior', icon: <Users size={18} />, color: '#8b5cf6' },
    TEACHER_PERFORMANCE: { label: 'Teachers', icon: <GraduationCap size={18} />, color: '#ec4899' },
};

const RANK_STYLES = [
    { bg: 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)', color: '#92400e' },
    { bg: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)', color: '#334155' },
    { bg: 'linear-gradient(135deg, #fdba74 0%, #fb923c 100%)', color: '#7c2d12' },
];

const LeaderboardPage: React.FC = () => {
    const { t } = useTranslation();
    const [leaderboards, setLeaderboards] = useState<LeaderboardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedType, setSelectedType] = useState<LeaderboardType>('all');
    const [expandedBoard, setExpandedBoard] = useState<string | null>(null);

    useEffect(() => {
        fetchLeaderboards();
    }, []);

    const fetchLeaderboards = async () => {
        try {
            setLoading(true);
            const [studentRes, teacherRes] = await Promise.all([
                axios.get('/api/dashboard/leaderboards/student_leaderboards/'),
                axios.get('/api/dashboard/leaderboards/teacher_leaderboards/')
            ]);

            setLeaderboards([...studentRes.data, ...teacherRes.data]);
        } catch (error) {
            console.error('Failed to fetch leaderboards:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchLeaderboards();
        setRefreshing(false);
    };

    const filteredLeaderboards = selectedType === 'all'
        ? leaderboards
        : leaderboards.filter(lb => lb.type === selectedType);

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown size={20} />;
        if (rank === 2) return <Medal size={18} />;
        if (rank === 3) return <Award size={18} />;
        return null;
    };

    const getRankChangeIndicator = (change: number | null) => {
        if (change === null || change === 0) {
            return <Minus size={14} className="rank-same" />;
        }
        if (change > 0) {
            return (
                <span className="rank-up">
                    <TrendingUp size={14} />
                    <small>+{change}</small>
                </span>
            );
        }
        return (
            <span className="rank-down">
                <TrendingDown size={14} />
                <small>{change}</small>
            </span>
        );
    };

    if (loading) {
        return (
            <div className="leaderboard-page">
                <div className="loading-container">
                    <Trophy size={48} className="loading-icon" />
                    <p>{t('leaderboard.loading', { defaultValue: 'Loading leaderboards...' })}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="leaderboard-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1>
                        <Trophy size={28} />
                        {t('leaderboard.title', { defaultValue: 'Leaderboards' })}
                    </h1>
                    <p>{t('leaderboard.subtitle', { defaultValue: 'Track performance and rankings across categories' })}</p>
                </div>
                <Button
                    variant="ghost"
                    iconLeft={RefreshCw}
                    onClick={handleRefresh}
                    loading={refreshing}
                >
                    {t('common.refresh', { defaultValue: 'Refresh' })}
                </Button>
            </div>

            {/* Type Filters */}
            <div className="type-filters">
                {Object.entries(TYPE_CONFIG).map(([type, config]) => (
                    <button
                        key={type}
                        className={`type-chip ${selectedType === type ? 'active' : ''}`}
                        onClick={() => setSelectedType(type as LeaderboardType)}
                        style={{ '--chip-color': config.color } as React.CSSProperties}
                    >
                        {config.icon}
                        <span>{config.label}</span>
                    </button>
                ))}
            </div>

            {/* Leaderboards Grid */}
            {filteredLeaderboards.length === 0 ? (
                <div className="empty-state">
                    <Trophy size={64} />
                    <h3>{t('leaderboard.no_leaderboards', { defaultValue: 'No leaderboards available' })}</h3>
                    <p>{t('leaderboard.no_leaderboards_desc', { defaultValue: 'Check back later for rankings.' })}</p>
                </div>
            ) : (
                <div className="leaderboards-grid">
                    {filteredLeaderboards.map(leaderboard => (
                        <Card key={leaderboard.id} className="leaderboard-card">
                            <div className="leaderboard-header">
                                <div className="header-left">
                                    <span className="leaderboard-icon" style={{ fontSize: '1.5rem' }}>
                                        {leaderboard.icon || '🏆'}
                                    </span>
                                    <div className="header-info">
                                        <h3>{leaderboard.name}</h3>
                                        <span className="period">
                                            {leaderboard.period} • {new Date(leaderboard.period_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(leaderboard.period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                </div>
                                <Badge
                                    variant="secondary"
                                    style={{ backgroundColor: `${TYPE_CONFIG[leaderboard.type as LeaderboardType]?.color || '#6366f1'}20`, color: TYPE_CONFIG[leaderboard.type as LeaderboardType]?.color || '#6366f1' }}
                                >
                                    {TYPE_CONFIG[leaderboard.type as LeaderboardType]?.label || leaderboard.type}
                                </Badge>
                            </div>

                            {/* Top 3 Podium */}
                            {leaderboard.entries.length >= 3 && (
                                <div className="podium">
                                    {[1, 0, 2].map(podiumIndex => {
                                        const entry = leaderboard.entries[podiumIndex];
                                        if (!entry) return null;

                                        return (
                                            <div
                                                key={entry.entity?.id || podiumIndex}
                                                className={`podium-spot rank-${entry.rank}`}
                                            >
                                                <div className="avatar-container">
                                                    {entry.entity?.photo ? (
                                                        <img src={entry.entity.photo} alt={entry.entity.name} />
                                                    ) : (
                                                        <div className="avatar-placeholder">
                                                            {entry.entity?.name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                    <div
                                                        className="rank-badge"
                                                        style={entry.rank <= 3 ? { background: RANK_STYLES[entry.rank - 1].bg, color: RANK_STYLES[entry.rank - 1].color } : {}}
                                                    >
                                                        {entry.rank}
                                                    </div>
                                                </div>
                                                <div className="podium-info">
                                                    <div className="name">{entry.entity?.name?.split(' ')[0]}</div>
                                                    {leaderboard.show_scores && (
                                                        <div className="score">{entry.score.toFixed(1)}</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Full List */}
                            <div className="entries-list">
                                {leaderboard.entries.slice(expandedBoard === leaderboard.id ? 0 : 3, expandedBoard === leaderboard.id ? undefined : 8).map((entry, index) => (
                                    <div key={entry.entity?.id || index} className="entry-row">
                                        <div className="entry-rank">
                                            {getRankIcon(entry.rank) || <span>{entry.rank}</span>}
                                        </div>
                                        <div className="entry-avatar">
                                            {entry.entity?.photo ? (
                                                <img src={entry.entity.photo} alt={entry.entity.name} />
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    {entry.entity?.name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="entry-info">
                                            <div className="entry-name">{entry.entity?.name}</div>
                                            <div className="entry-subtitle">
                                                {entry.entity?.class || entry.entity?.designation}
                                            </div>
                                        </div>
                                        {leaderboard.show_scores && (
                                            <div className="entry-score">{entry.score.toFixed(1)}</div>
                                        )}
                                        {leaderboard.show_rank_change && (
                                            <div className="entry-change">
                                                {getRankChangeIndicator(entry.rank_change)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {leaderboard.entries.length > 8 && (
                                <button
                                    className="show-more-btn"
                                    onClick={() => setExpandedBoard(expandedBoard === leaderboard.id ? null : leaderboard.id)}
                                >
                                    {expandedBoard === leaderboard.id
                                        ? t('common.show_less', { defaultValue: 'Show Less' })
                                        : t('common.show_all', { defaultValue: `Show All (${leaderboard.entries.length})` })
                                    }
                                </button>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LeaderboardPage;
