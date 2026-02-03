/**
 * Course Builder Page
 * Create and manage course content with modules and lessons
 */

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    GripVertical,
    ChevronDown,
    ChevronRight,
    BookOpen,
    Video,
    FileText,
    PlayCircle,
    Clock,
    Eye,
    EyeOff,
    ArrowLeft,
    RefreshCw,
    Settings,
    Upload
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './LMS.css';

interface Course {
    id: string;
    title: string;
    description: string;
    category: { id: string; name: string } | null;
    instructor: { id: string; full_name: string } | null;
    is_published: boolean;
    thumbnail: string | null;
    duration_hours: number;
}

interface CourseModule {
    id: string;
    title: string;
    description: string;
    order: number;
    lessons: Lesson[];
}

interface Lesson {
    id: string;
    title: string;
    description: string;
    content_type: 'video' | 'document' | 'text' | 'quiz';
    duration_minutes: number;
    order: number;
    is_preview: boolean;
}

interface LessonResource {
    id: string;
    title: string;
    resource_type: string;
    file: string | null;
    url: string | null;
}

const CourseBuilder: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<CourseModule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    // Modal states
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);

    // Form states
    const [moduleForm, setModuleForm] = useState({ title: '', description: '' });
    const [lessonForm, setLessonForm] = useState<{
        title: string;
        description: string;
        content_type: 'video' | 'document' | 'text' | 'quiz';
        duration_minutes: number;
        is_preview: boolean;
    }>({
        title: '',
        description: '',
        content_type: 'video',
        duration_minutes: 0,
        is_preview: false
    });

    useEffect(() => {
        if (courseId) {
            fetchCourseData();
        }
    }, [courseId]);

    const fetchCourseData = async () => {
        try {
            setLoading(true);
            const [courseResponse, modulesResponse] = await Promise.all([
                api.get(`/lms/courses/${courseId}/`),
                api.get(`/lms/courses/${courseId}/modules/`)
            ]);
            setCourse(courseResponse.data);
            const modulesData = Array.isArray(modulesResponse.data)
                ? modulesResponse.data
                : modulesResponse.data?.results || [];
            setModules(modulesData);
            // Expand first module by default
            if (modulesData.length > 0) {
                setExpandedModules(new Set([modulesData[0].id]));
            }
        } catch (error) {
            console.error('Error fetching course data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleModuleExpand = (moduleId: string) => {
        const newExpanded = new Set(expandedModules);
        if (newExpanded.has(moduleId)) {
            newExpanded.delete(moduleId);
        } else {
            newExpanded.add(moduleId);
        }
        setExpandedModules(newExpanded);
    };

    // Module CRUD
    const handleOpenModuleModal = (module?: CourseModule) => {
        if (module) {
            setEditingModule(module);
            setModuleForm({ title: module.title, description: module.description });
        } else {
            setEditingModule(null);
            setModuleForm({ title: '', description: '' });
        }
        setShowModuleModal(true);
    };

    const handleSaveModule = async () => {
        setSaving(true);
        try {
            if (editingModule) {
                await api.patch(`/lms/modules/${editingModule.id}/`, moduleForm);
            } else {
                await api.post(`/lms/modules/`, {
                    ...moduleForm,
                    course: courseId,
                    order: modules.length + 1
                });
            }
            fetchCourseData();
            setShowModuleModal(false);
        } catch (error) {
            console.error('Error saving module:', error);
            alert('Failed to save module');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteModule = async (moduleId: string) => {
        if (!confirm('Delete this module and all its lessons?')) return;
        try {
            await api.delete(`/lms/modules/${moduleId}/`);
            fetchCourseData();
        } catch (error) {
            console.error('Error deleting module:', error);
        }
    };

    // Lesson CRUD
    const handleOpenLessonModal = (moduleId: string, lesson?: Lesson) => {
        setCurrentModuleId(moduleId);
        if (lesson) {
            setEditingLesson(lesson);
            setLessonForm({
                title: lesson.title,
                description: lesson.description,
                content_type: lesson.content_type,
                duration_minutes: lesson.duration_minutes,
                is_preview: lesson.is_preview
            });
        } else {
            setEditingLesson(null);
            setLessonForm({
                title: '',
                description: '',
                content_type: 'video',
                duration_minutes: 0,
                is_preview: false
            });
        }
        setShowLessonModal(true);
    };

    const handleSaveLesson = async () => {
        if (!currentModuleId) return;
        setSaving(true);
        try {
            const module = modules.find(m => m.id === currentModuleId);
            if (editingLesson) {
                await api.patch(`/lms/lessons/${editingLesson.id}/`, lessonForm);
            } else {
                await api.post(`/lms/lessons/`, {
                    ...lessonForm,
                    module: currentModuleId,
                    order: (module?.lessons.length || 0) + 1
                });
            }
            fetchCourseData();
            setShowLessonModal(false);
        } catch (error) {
            console.error('Error saving lesson:', error);
            alert('Failed to save lesson');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm('Delete this lesson?')) return;
        try {
            await api.delete(`/lms/lessons/${lessonId}/`);
            fetchCourseData();
        } catch (error) {
            console.error('Error deleting lesson:', error);
        }
    };

    const getContentTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video size={16} />;
            case 'document': return <FileText size={16} />;
            case 'text': return <BookOpen size={16} />;
            case 'quiz': return <PlayCircle size={16} />;
            default: return <BookOpen size={16} />;
        }
    };

    const togglePublish = async () => {
        if (!course) return;
        try {
            await api.patch(`/lms/courses/${courseId}/`, {
                is_published: !course.is_published
            });
            setCourse({ ...course, is_published: !course.is_published });
        } catch (error) {
            console.error('Error toggling publish status:', error);
        }
    };

    if (loading) {
        return (
            <div className="lms-loading">
                <RefreshCw className="spin" size={32} />
                <p>Loading course builder...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="lms-error">
                <p>Course not found</p>
                <button onClick={() => navigate('/lms/courses')}>Back to Courses</button>
            </div>
        );
    }

    return (
        <div className="course-builder">
            {/* Header */}
            <div className="builder-header">
                <div className="header-left">
                    <button className="btn-back" onClick={() => navigate('/lms/courses')}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1>{course.title}</h1>
                        <p className="course-meta">
                            {modules.length} modules • {modules.reduce((sum, m) => sum + m.lessons.length, 0)} lessons
                        </p>
                    </div>
                </div>
                <div className="header-actions">
                    <button
                        className={`btn-publish ${course.is_published ? 'published' : ''}`}
                        onClick={togglePublish}
                    >
                        {course.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
                        {course.is_published ? 'Published' : 'Draft'}
                    </button>
                    <button className="btn-settings">
                        <Settings size={16} />
                        Settings
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="builder-content">
                {/* Sidebar - Modules */}
                <div className="modules-sidebar">
                    <div className="sidebar-header">
                        <h3>Course Content</h3>
                        <button className="btn-add-module" onClick={() => handleOpenModuleModal()}>
                            <Plus size={16} />
                            Add Module
                        </button>
                    </div>

                    <div className="modules-list">
                        {modules.length === 0 ? (
                            <div className="empty-modules">
                                <BookOpen size={32} />
                                <p>No modules yet</p>
                                <button onClick={() => handleOpenModuleModal()}>Create First Module</button>
                            </div>
                        ) : (
                            modules.map((module, index) => (
                                <div key={module.id} className="module-item">
                                    <div
                                        className="module-header"
                                        onClick={() => toggleModuleExpand(module.id)}
                                    >
                                        <div className="module-drag">
                                            <GripVertical size={16} />
                                        </div>
                                        <div className="module-expand">
                                            {expandedModules.has(module.id)
                                                ? <ChevronDown size={16} />
                                                : <ChevronRight size={16} />
                                            }
                                        </div>
                                        <div className="module-info">
                                            <span className="module-number">Module {index + 1}</span>
                                            <span className="module-title">{module.title}</span>
                                            <span className="lesson-count">{module.lessons.length} lessons</span>
                                        </div>
                                        <div className="module-actions" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => handleOpenModuleModal(module)}>
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDeleteModule(module.id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {expandedModules.has(module.id) && (
                                        <div className="lessons-list">
                                            {module.lessons.map((lesson, lessonIndex) => (
                                                <div key={lesson.id} className="lesson-item">
                                                    <div className="lesson-drag">
                                                        <GripVertical size={14} />
                                                    </div>
                                                    <div className="lesson-type">
                                                        {getContentTypeIcon(lesson.content_type)}
                                                    </div>
                                                    <div className="lesson-info">
                                                        <span className="lesson-title">{lesson.title}</span>
                                                        <span className="lesson-meta">
                                                            <Clock size={12} />
                                                            {lesson.duration_minutes} min
                                                            {lesson.is_preview && <span className="preview-badge">Preview</span>}
                                                        </span>
                                                    </div>
                                                    <div className="lesson-actions">
                                                        <button onClick={() => handleOpenLessonModal(module.id, lesson)}>
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button onClick={() => handleDeleteLesson(lesson.id)}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                className="btn-add-lesson"
                                                onClick={() => handleOpenLessonModal(module.id)}
                                            >
                                                <Plus size={14} />
                                                Add Lesson
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Editor Area */}
                <div className="editor-area">
                    <div className="editor-placeholder">
                        <BookOpen size={48} />
                        <h3>Select a lesson to edit</h3>
                        <p>Choose a lesson from the sidebar or create a new one</p>
                    </div>
                </div>
            </div>

            {/* Module Modal */}
            {showModuleModal && (
                <div className="modal-overlay" onClick={() => setShowModuleModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingModule ? 'Edit Module' : 'Add Module'}</h2>
                            <button className="btn-close" onClick={() => setShowModuleModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Module Title *</label>
                                <input
                                    type="text"
                                    value={moduleForm.title}
                                    onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })}
                                    placeholder="e.g., Introduction to Python"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={moduleForm.description}
                                    onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })}
                                    placeholder="Module description..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowModuleModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleSaveModule} disabled={saving}>
                                {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                                {editingModule ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lesson Modal */}
            {showLessonModal && (
                <div className="modal-overlay" onClick={() => setShowLessonModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</h2>
                            <button className="btn-close" onClick={() => setShowLessonModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Lesson Title *</label>
                                <input
                                    type="text"
                                    value={lessonForm.title}
                                    onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                                    placeholder="e.g., Variables and Data Types"
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Content Type *</label>
                                    <select
                                        value={lessonForm.content_type}
                                        onChange={e => setLessonForm({ ...lessonForm, content_type: e.target.value as any })}
                                    >
                                        <option value="video">Video</option>
                                        <option value="document">Document</option>
                                        <option value="text">Text/Article</option>
                                        <option value="quiz">Quiz</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Duration (minutes)</label>
                                    <input
                                        type="number"
                                        value={lessonForm.duration_minutes}
                                        onChange={e => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={lessonForm.description}
                                    onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })}
                                    placeholder="Lesson description..."
                                    rows={3}
                                />
                            </div>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={lessonForm.is_preview}
                                    onChange={e => setLessonForm({ ...lessonForm, is_preview: e.target.checked })}
                                />
                                <span>Allow preview (free access)</span>
                            </label>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowLessonModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleSaveLesson} disabled={saving}>
                                {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                                {editingLesson ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseBuilder;
