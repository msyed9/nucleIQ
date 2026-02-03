/**
 * Video Library Page
 * Browse and watch course videos
 */

import React, { useState, useEffect } from 'react';
import {
    Play,
    Search,
    Filter,
    Clock,
    Eye,
    ThumbsUp,
    BookOpen,
    Download,
    Share2,
    Grid,
    List,
    ChevronDown,
    RefreshCw,
    Video,
    Bookmark,
    BookmarkCheck
} from 'lucide-react';
import api from '../../services/api';
import './LMS.css';

interface VideoResource {
    id: string;
    title: string;
    description: string;
    thumbnail: string | null;
    video_url: string;
    duration_minutes: number;
    views_count: number;
    likes_count: number;
    course: {
        id: string;
        title: string;
    };
    lesson: {
        id: string;
        title: string;
    } | null;
    instructor: {
        id: string;
        full_name: string;
    };
    tags: string[];
    uploaded_at: string;
    is_bookmarked?: boolean;
}

interface Category {
    id: string;
    name: string;
    videos_count: number;
}

const VideoLibrary: React.FC = () => {
    const [videos, setVideos] = useState<VideoResource[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedVideo, setSelectedVideo] = useState<VideoResource | null>(null);

    useEffect(() => {
        fetchVideos();
        fetchCategories();
    }, [categoryFilter, sortBy]);

    const fetchVideos = async () => {
        try {
            setLoading(true);
            const params: any = { sort: sortBy };
            if (categoryFilter) params.category = categoryFilter;

            const response = await api.get('/lms/videos/', { params });
            const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
            setVideos(data);
        } catch (error) {
            console.error('Error fetching videos:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/lms/video-categories/');
            const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleBookmark = async (videoId: string) => {
        try {
            await api.post(`/lms/videos/${videoId}/bookmark/`);
            setVideos(prev => prev.map(v =>
                v.id === videoId ? { ...v, is_bookmarked: !v.is_bookmarked } : v
            ));
        } catch (error) {
            console.error('Error bookmarking video:', error);
        }
    };

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes}m`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    const formatViews = (views: number) => {
        if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
        if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
        return views.toString();
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const filteredVideos = videos.filter(v =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="lms-loading">
                <RefreshCw className="spin" size={32} />
                <p>Loading video library...</p>
            </div>
        );
    }

    return (
        <div className="video-library">
            <div className="page-header">
                <div>
                    <h1>🎬 Video Library</h1>
                    <p>Browse and watch course videos</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search videos..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name} ({cat.videos_count})
                            </option>
                        ))}
                    </select>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="recent">Most Recent</option>
                        <option value="popular">Most Popular</option>
                        <option value="duration">Duration</option>
                        <option value="title">Title A-Z</option>
                    </select>
                    <div className="view-toggle">
                        <button
                            className={viewMode === 'grid' ? 'active' : ''}
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid size={16} />
                        </button>
                        <button
                            className={viewMode === 'list' ? 'active' : ''}
                            onClick={() => setViewMode('list')}
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Video Player Modal */}
            {selectedVideo && (
                <div className="video-player-modal" onClick={() => setSelectedVideo(null)}>
                    <div className="player-content" onClick={e => e.stopPropagation()}>
                        <div className="player-wrapper">
                            <video
                                src={selectedVideo.video_url}
                                controls
                                autoPlay
                                className="video-player"
                            />
                        </div>
                        <div className="video-details">
                            <h2>{selectedVideo.title}</h2>
                            <div className="video-meta">
                                <span>{formatViews(selectedVideo.views_count)} views</span>
                                <span>{formatDate(selectedVideo.uploaded_at)}</span>
                            </div>
                            <p>{selectedVideo.description}</p>
                            <div className="video-actions">
                                <button onClick={() => handleBookmark(selectedVideo.id)}>
                                    {selectedVideo.is_bookmarked ? (
                                        <BookmarkCheck size={16} />
                                    ) : (
                                        <Bookmark size={16} />
                                    )}
                                    {selectedVideo.is_bookmarked ? 'Saved' : 'Save'}
                                </button>
                                <button>
                                    <ThumbsUp size={16} />
                                    {selectedVideo.likes_count}
                                </button>
                                <button>
                                    <Share2 size={16} />
                                    Share
                                </button>
                            </div>
                        </div>
                        <button className="close-player" onClick={() => setSelectedVideo(null)}>×</button>
                    </div>
                </div>
            )}

            {/* Videos Grid/List */}
            {filteredVideos.length === 0 ? (
                <div className="empty-state">
                    <Video size={48} />
                    <h3>No videos found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className={`videos-${viewMode}`}>
                    {filteredVideos.map(video => (
                        <div
                            key={video.id}
                            className="video-card"
                            onClick={() => setSelectedVideo(video)}
                        >
                            <div className="video-thumbnail">
                                {video.thumbnail ? (
                                    <img src={video.thumbnail} alt={video.title} />
                                ) : (
                                    <div className="placeholder-thumb">
                                        <Video size={32} />
                                    </div>
                                )}
                                <div className="duration-badge">
                                    <Clock size={12} />
                                    {formatDuration(video.duration_minutes)}
                                </div>
                                <div className="play-overlay">
                                    <Play size={32} />
                                </div>
                                <button
                                    className={`bookmark-btn ${video.is_bookmarked ? 'active' : ''}`}
                                    onClick={e => {
                                        e.stopPropagation();
                                        handleBookmark(video.id);
                                    }}
                                >
                                    {video.is_bookmarked ? (
                                        <BookmarkCheck size={18} />
                                    ) : (
                                        <Bookmark size={18} />
                                    )}
                                </button>
                            </div>
                            <div className="video-info">
                                <h3 className="video-title">{video.title}</h3>
                                <div className="course-tag">
                                    <BookOpen size={12} />
                                    {video.course.title}
                                </div>
                                <div className="video-meta">
                                    <span>
                                        <Eye size={12} />
                                        {formatViews(video.views_count)}
                                    </span>
                                    <span>
                                        <ThumbsUp size={12} />
                                        {video.likes_count}
                                    </span>
                                    <span>{formatDate(video.uploaded_at)}</span>
                                </div>
                                <div className="instructor">
                                    by {video.instructor.full_name}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VideoLibrary;
