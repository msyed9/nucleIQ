/**
 * LMS Course List Page
 * 
 * Displays all available courses with filtering and search capabilities.
 * Allows users to browse, search, and enroll in courses.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    BookOpen, Search, Filter, Clock, Users, Star, ChevronRight,
    Play, GraduationCap, BarChart3, Plus, Layers
} from 'lucide-react';
import api from '../../services/api';
import './LMS.css';

interface Course {
    id: string;
    title: string;
    slug: string;
    short_description: string;
    thumbnail: string | null;
    category_name: string;
    instructor_name: string;
    difficulty: string;
    course_type: string;
    status: string;
    enrolled_count: number;
    estimated_duration_hours: number;
    average_rating: number;
    is_featured: boolean;
    modules_count: number;
    lessons_count: number;
}

interface Category {
    id: string;
    name: string;
    icon: string;
    course_count: number;
}

interface DashboardStats {
    total_courses: number;
    published_courses: number;
    total_enrollments: number;
    active_enrollments: number;
    upcoming_live_classes: number;
    average_course_rating: number;
}

const CourseList: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('');
    const [view, setView] = useState<'grid' | 'list'>('grid');

    const fetchCourses = useCallback(async () => {
        try {
            const params: Record<string, string> = {};
            if (searchTerm) params.search = searchTerm;
            if (selectedCategory) params.category = selectedCategory;
            if (selectedDifficulty) params.difficulty = selectedDifficulty;
            if (selectedType) params.course_type = selectedType;

            const response = await api.get('/lms/courses/', { params });
            setCourses(response.data.results || response.data);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        }
    }, [searchTerm, selectedCategory, selectedDifficulty, selectedType]);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await api.get('/lms/categories/');
            setCategories(response.data.results || response.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    }, []);

    const fetchDashboard = useCallback(async () => {
        try {
            const response = await api.get('/lms/courses/dashboard/');
            setDashboardStats(response.data.data || response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard:', error);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchCourses(), fetchCategories(), fetchDashboard()]);
            setLoading(false);
        };
        loadData();
    }, [fetchCourses, fetchCategories, fetchDashboard]);

    const getDifficultyColor = (difficulty: string) => {
        const colors: Record<string, string> = {
            'BEGINNER': '#10b981',
            'INTERMEDIATE': '#f59e0b',
            'ADVANCED': '#ef4444',
            'EXPERT': '#8b5cf6'
        };
        return colors[difficulty] || '#6b7280';
    };

    const formatDuration = (hours: number) => {
        if (hours < 1) return `${Math.round(hours * 60)} mins`;
        return `${hours} hrs`;
    };

    if (loading) {
        return (
            <div className="lms-loading">
                <div className="loading-spinner" />
                <p>Loading courses...</p>
            </div>
        );
    }

    return (
        <div className="lms-container">
            {/* Header */}
            <div className="lms-header">
                <div className="lms-header-content">
                    <div className="lms-header-text">
                        <h1>
                            <GraduationCap className="header-icon" />
                            Learning Management System
                        </h1>
                        <p>Explore courses, track progress, and enhance your skills</p>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/lms/courses/new')}
                    >
                        <Plus size={18} />
                        Create Course
                    </button>
                </div>
            </div>

            {/* Dashboard Stats */}
            {dashboardStats && (
                <div className="lms-stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon courses">
                            <BookOpen size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{dashboardStats.published_courses}</span>
                            <span className="stat-label">Published Courses</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon enrollments">
                            <Users size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{dashboardStats.active_enrollments}</span>
                            <span className="stat-label">Active Enrollments</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon live">
                            <Play size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{dashboardStats.upcoming_live_classes}</span>
                            <span className="stat-label">Upcoming Classes</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon rating">
                            <Star size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{dashboardStats.average_course_rating.toFixed(1)}</span>
                            <span className="stat-label">Avg. Rating</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="lms-filters">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                    >
                        <option value="">All Levels</option>
                        <option value="BEGINNER">Beginner</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="ADVANCED">Advanced</option>
                        <option value="EXPERT">Expert</option>
                    </select>

                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="SELF_PACED">Self-Paced</option>
                        <option value="INSTRUCTOR_LED">Instructor-Led</option>
                        <option value="BLENDED">Blended</option>
                        <option value="LIVE">Live Only</option>
                    </select>
                </div>

                <div className="view-toggle">
                    <button
                        className={view === 'grid' ? 'active' : ''}
                        onClick={() => setView('grid')}
                    >
                        <Layers size={18} />
                    </button>
                    <button
                        className={view === 'list' ? 'active' : ''}
                        onClick={() => setView('list')}
                    >
                        <BarChart3 size={18} />
                    </button>
                </div>
            </div>

            {/* Course Grid/List */}
            <div className={`courses-container ${view}`}>
                {courses.length === 0 ? (
                    <div className="no-courses">
                        <BookOpen size={48} />
                        <h3>No courses found</h3>
                        <p>Try adjusting your filters or search term</p>
                    </div>
                ) : (
                    courses.map(course => (
                        <div
                            key={course.id}
                            className="course-card"
                            onClick={() => navigate(`/lms/courses/${course.id}`)}
                        >
                            <div className="course-thumbnail">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} alt={course.title} />
                                ) : (
                                    <div className="thumbnail-placeholder">
                                        <BookOpen size={32} />
                                    </div>
                                )}
                                {course.is_featured && (
                                    <span className="featured-badge">Featured</span>
                                )}
                                <span
                                    className="difficulty-badge"
                                    style={{ backgroundColor: getDifficultyColor(course.difficulty) }}
                                >
                                    {course.difficulty}
                                </span>
                            </div>

                            <div className="course-content">
                                <div className="course-category">{course.category_name}</div>
                                <h3 className="course-title">{course.title}</h3>
                                <p className="course-description">{course.short_description}</p>

                                <div className="course-instructor">
                                    <span>By {course.instructor_name || 'Unknown Instructor'}</span>
                                </div>

                                <div className="course-meta">
                                    <span className="meta-item">
                                        <Clock size={14} />
                                        {formatDuration(course.estimated_duration_hours)}
                                    </span>
                                    <span className="meta-item">
                                        <Layers size={14} />
                                        {course.modules_count} modules
                                    </span>
                                    <span className="meta-item">
                                        <Users size={14} />
                                        {course.enrolled_count} enrolled
                                    </span>
                                </div>

                                <div className="course-footer">
                                    <div className="course-rating">
                                        <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                                        <span>{course.average_rating?.toFixed(1) || 'N/A'}</span>
                                    </div>
                                    <button className="view-course-btn">
                                        View Course <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CourseList;
