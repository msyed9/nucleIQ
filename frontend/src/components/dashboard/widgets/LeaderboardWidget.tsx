/**
 * Leaderboard Widget
 * Displays rankings with scores, rank changes, and avatars
 */

import React from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Medal, Award, Crown } from 'lucide-react';
import './widgets.css';

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
    id?: string;
    name?: string;
    type?: string;
    period?: string;
    icon?: string;
    color?: string;
    show_scores?: boolean;
    show_rank_change?: boolean;
    entries: LeaderboardEntry[];
    message?: string;
}

interface LeaderboardWidgetProps {
    widgetId: string;
    config?: Record<string, any>;
    data: LeaderboardData;
    onRefresh?: () => void;
}

const RANK_ICONS = [
    { icon: Crown, color: '#ffd700' },
    { icon: Medal, color: '#c0c0c0' },
    { icon: Award, color: '#cd7f32' },
];

export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({
    widgetId,
    data,
    onRefresh
}) => {
    const { entries = [], name, icon, color, show_scores = true, show_rank_change = true } = data;

    const getRankIcon = (rank: number) => {
        if (rank <= 3) {
            const { icon: Icon, color } = RANK_ICONS[rank - 1];
            return <Icon size={18} style={{ color }} />;
        }
        return <span className="rank-number">{rank}</span>;
    };

    const getRankChangeIndicator = (change: number | null) => {
        if (change === null || change === 0) {
            return <Minus size={12} className="rank-same" />;
        }
        if (change > 0) {
            return (
                <span className="rank-up">
                    <TrendingUp size={12} />
                    <small>{change}</small>
                </span>
            );
        }
        return (
            <span className="rank-down">
                <TrendingDown size={12} />
                <small>{Math.abs(change)}</small>
            </span>
        );
    };

    if (entries.length === 0) {
        return (
            <div className="leaderboard-widget empty">
                <div className="empty-state">
                    <Trophy size={32} />
                    <p>{data.message || 'No rankings available yet'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="leaderboard-widget">
            <div className="leaderboard-header">
                <span className="leaderboard-icon">{icon || '🏆'}</span>
                <h3 className="leaderboard-title">{name || 'Leaderboard'}</h3>
            </div>

            <div className="leaderboard-list">
                {entries.map((entry, index) => (
                    <div
                        key={entry.entity?.id || index}
                        className={`leaderboard-entry ${entry.rank <= 3 ? `rank-${entry.rank}` : ''}`}
                    >
                        <div className="entry-rank">
                            {getRankIcon(entry.rank)}
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
                            <div className="entry-name">{entry.entity?.name || 'Unknown'}</div>
                            <div className="entry-subtitle">
                                {entry.entity?.class || entry.entity?.designation || ''}
                            </div>
                        </div>

                        {show_scores && (
                            <div className="entry-score">
                                {entry.score?.toFixed(1)}
                            </div>
                        )}

                        {show_rank_change && (
                            <div className="entry-change">
                                {getRankChangeIndicator(entry.rank_change)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LeaderboardWidget;
