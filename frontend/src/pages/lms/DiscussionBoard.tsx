/**
 * Discussion Board Page
 * Course discussion forums with topics and replies
 */

import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    Plus,
    Search,
    ThumbsUp,
    MessageCircle,
    Clock,
    User,
    Pin,
    ChevronRight,
    Send,
    X,
    Filter,
    RefreshCw,
    BookOpen,
    CheckCircle,
    Flag
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import './LMS.css';

interface DiscussionTopic {
    id: string;
    title: string;
    content: string;
    author: {
        id: string;
        full_name: string;
        avatar: string | null;
    };
    course: {
        id: string;
        title: string;
    };
    is_pinned: boolean;
    is_resolved: boolean;
    replies_count: number;
    likes_count: number;
    views_count: number;
    created_at: string;
    last_activity: string;
}

interface Reply {
    id: string;
    content: string;
    author: {
        id: string;
        full_name: string;
        avatar: string | null;
        is_instructor: boolean;
    };
    likes_count: number;
    is_accepted: boolean;
    created_at: string;
}

interface Course {
    id: string;
    title: string;
}

const DiscussionBoard: React.FC = () => {
    const { courseId } = useParams<{ courseId?: string }>();
    const [topics, setTopics] = useState<DiscussionTopic[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<DiscussionTopic | null>(null);
    const [replies, setReplies] = useState<Reply[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [courseFilter, setCourseFilter] = useState(courseId || '');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [newTopic, setNewTopic] = useState({ title: '', content: '', course: courseId || '' });
    const [newReply, setNewReply] = useState('');

    useEffect(() => {
        fetchDiscussions();
        fetchCourses();
    }, [courseFilter]);

    const fetchDiscussions = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (courseFilter) params.course = courseFilter;

            const response = await api.get('/lms/discussions/', { params });
            const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
            setTopics(data);
        } catch (error) {
            console.error('Error fetching discussions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await api.get('/lms/courses/');
            const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
            setCourses(data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const fetchReplies = async (topicId: string) => {
        try {
            const response = await api.get(`/lms/discussions/${topicId}/replies/`);
            const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
            setReplies(data);
        } catch (error) {
            console.error('Error fetching replies:', error);
        }
    };

    const handleSelectTopic = (topic: DiscussionTopic) => {
        setSelectedTopic(topic);
        fetchReplies(topic.id);
    };

    const handleCreateTopic = async () => {
        if (!newTopic.title.trim() || !newTopic.content.trim() || !newTopic.course) {
            alert('Please fill all required fields');
            return;
        }
        try {
            await api.post('/lms/discussions/', newTopic);
            setShowCreateModal(false);
            setNewTopic({ title: '', content: '', course: courseId || '' });
            fetchDiscussions();
        } catch (error) {
            console.error('Error creating topic:', error);
            alert('Failed to create topic');
        }
    };

    const handlePostReply = async () => {
        if (!newReply.trim() || !selectedTopic) return;
        try {
            await api.post(`/lms/discussions/${selectedTopic.id}/replies/`, {
                content: newReply
            });
            setNewReply('');
            fetchReplies(selectedTopic.id);
        } catch (error) {
            console.error('Error posting reply:', error);
        }
    };

    const handleLikeTopic = async (topicId: string) => {
        try {
            await api.post(`/lms/discussions/${topicId}/like/`);
            fetchDiscussions();
        } catch (error) {
            console.error('Error liking topic:', error);
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return 'Just now';
    };

    const filteredTopics = topics.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="lms-loading">
                <RefreshCw className="spin" size={32} />
                <p>Loading discussions...</p>
            </div>
        );
    }

    return (
        <div className="discussion-board">
            <div className="page-header">
                <div>
                    <h1>💬 Discussion Board</h1>
                    <p>Ask questions and discuss with peers and instructors</p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                    <Plus size={16} />
                    New Topic
                </button>
            </div>

            <div className="discussion-container">
                {/* Topics List */}
                <div className="topics-panel">
                    <div className="panel-header">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search discussions..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            value={courseFilter}
                            onChange={e => setCourseFilter(e.target.value)}
                        >
                            <option value="">All Courses</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="topics-list">
                        {filteredTopics.length === 0 ? (
                            <div className="empty-topics">
                                <MessageSquare size={32} />
                                <p>No discussions yet</p>
                                <button onClick={() => setShowCreateModal(true)}>Start a Discussion</button>
                            </div>
                        ) : (
                            filteredTopics.map(topic => (
                                <div
                                    key={topic.id}
                                    className={`topic-item ${selectedTopic?.id === topic.id ? 'active' : ''} ${topic.is_pinned ? 'pinned' : ''}`}
                                    onClick={() => handleSelectTopic(topic)}
                                >
                                    <div className="topic-header">
                                        {topic.is_pinned && <Pin size={14} className="pin-icon" />}
                                        {topic.is_resolved && <CheckCircle size={14} className="resolved-icon" />}
                                        <span className="course-badge">{topic.course.title}</span>
                                    </div>
                                    <h4 className="topic-title">{topic.title}</h4>
                                    <p className="topic-preview">{topic.content.substring(0, 100)}...</p>
                                    <div className="topic-meta">
                                        <span className="author">
                                            <User size={12} />
                                            {topic.author.full_name}
                                        </span>
                                        <span className="time">
                                            <Clock size={12} />
                                            {formatTimeAgo(topic.created_at)}
                                        </span>
                                        <span className="replies">
                                            <MessageCircle size={12} />
                                            {topic.replies_count}
                                        </span>
                                        <span className="likes">
                                            <ThumbsUp size={12} />
                                            {topic.likes_count}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Topic Detail / Replies */}
                <div className="replies-panel">
                    {!selectedTopic ? (
                        <div className="no-topic-selected">
                            <MessageSquare size={48} />
                            <h3>Select a topic</h3>
                            <p>Choose a discussion from the list to view replies</p>
                        </div>
                    ) : (
                        <>
                            <div className="topic-detail">
                                <div className="topic-author">
                                    <div className="avatar">
                                        {selectedTopic.author.avatar ? (
                                            <img src={selectedTopic.author.avatar} alt="" />
                                        ) : (
                                            <User size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <span className="name">{selectedTopic.author.full_name}</span>
                                        <span className="time">{formatTimeAgo(selectedTopic.created_at)}</span>
                                    </div>
                                </div>
                                <h2>{selectedTopic.title}</h2>
                                <p className="topic-content">{selectedTopic.content}</p>
                                <div className="topic-actions">
                                    <button onClick={() => handleLikeTopic(selectedTopic.id)}>
                                        <ThumbsUp size={16} />
                                        {selectedTopic.likes_count}
                                    </button>
                                    <button>
                                        <Flag size={16} />
                                        Report
                                    </button>
                                </div>
                            </div>

                            <div className="replies-section">
                                <h3>{replies.length} Replies</h3>
                                <div className="replies-list">
                                    {replies.map(reply => (
                                        <div key={reply.id} className={`reply-item ${reply.is_accepted ? 'accepted' : ''}`}>
                                            <div className="reply-author">
                                                <div className="avatar">
                                                    {reply.author.avatar ? (
                                                        <img src={reply.author.avatar} alt="" />
                                                    ) : (
                                                        <User size={16} />
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="name">
                                                        {reply.author.full_name}
                                                        {reply.author.is_instructor && (
                                                            <span className="instructor-badge">Instructor</span>
                                                        )}
                                                    </span>
                                                    <span className="time">{formatTimeAgo(reply.created_at)}</span>
                                                </div>
                                                {reply.is_accepted && (
                                                    <span className="accepted-badge">
                                                        <CheckCircle size={14} />
                                                        Accepted Answer
                                                    </span>
                                                )}
                                            </div>
                                            <p className="reply-content">{reply.content}</p>
                                            <div className="reply-actions">
                                                <button>
                                                    <ThumbsUp size={14} />
                                                    {reply.likes_count}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="reply-form">
                                    <textarea
                                        value={newReply}
                                        onChange={e => setNewReply(e.target.value)}
                                        placeholder="Write your reply..."
                                        rows={3}
                                    />
                                    <button className="btn-primary" onClick={handlePostReply} disabled={!newReply.trim()}>
                                        <Send size={16} />
                                        Post Reply
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Create Topic Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>New Discussion Topic</h2>
                            <button className="btn-close" onClick={() => setShowCreateModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Course *</label>
                                <select
                                    value={newTopic.course}
                                    onChange={e => setNewTopic({ ...newTopic, course: e.target.value })}
                                    required
                                >
                                    <option value="">Select Course</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    value={newTopic.title}
                                    onChange={e => setNewTopic({ ...newTopic, title: e.target.value })}
                                    placeholder="What's your question or topic?"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description *</label>
                                <textarea
                                    value={newTopic.content}
                                    onChange={e => setNewTopic({ ...newTopic, content: e.target.value })}
                                    placeholder="Provide more details about your question..."
                                    rows={5}
                                    required
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleCreateTopic}>
                                <Plus size={16} />
                                Create Topic
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiscussionBoard;
