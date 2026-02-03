/**
 * Quiz Builder Page
 * Create and manage quizzes for courses
 */

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    GripVertical,
    CheckCircle,
    Circle,
    Square,
    Type,
    Clock,
    Award,
    Settings,
    Play,
    Eye,
    Copy,
    RefreshCw,
    ArrowLeft,
    HelpCircle
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './LMS.css';

interface Quiz {
    id: string;
    title: string;
    description: string;
    course: { id: string; title: string };
    time_limit_minutes: number | null;
    passing_percentage: number;
    shuffle_questions: boolean;
    show_results: boolean;
    max_attempts: number | null;
    is_published: boolean;
    questions_count?: number;
}

interface Question {
    id: string;
    question_text: string;
    question_type: 'single' | 'multiple' | 'text';
    points: number;
    order: number;
    options: QuestionOption[];
}

interface QuestionOption {
    id: string;
    option_text: string;
    is_correct: boolean;
    order: number;
}

const QuizBuilder: React.FC = () => {
    const { quizId } = useParams<{ quizId?: string }>();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

    // Modal states
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // Form states
    const [questionForm, setQuestionForm] = useState<{
        question_text: string;
        question_type: 'single' | 'multiple' | 'text';
        points: number;
        options: { option_text: string; is_correct: boolean }[];
    }>({
        question_text: '',
        question_type: 'single',
        points: 1,
        options: [
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false }
        ]
    });

    const [settingsForm, setSettingsForm] = useState({
        time_limit_minutes: 0,
        passing_percentage: 50,
        shuffle_questions: false,
        show_results: true,
        max_attempts: 0
    });

    useEffect(() => {
        if (quizId) {
            fetchQuizData();
        } else {
            setLoading(false);
        }
    }, [quizId]);

    const fetchQuizData = async () => {
        try {
            setLoading(true);
            const [quizRes, questionsRes] = await Promise.all([
                api.get(`/lms/quizzes/${quizId}/`),
                api.get(`/lms/quizzes/${quizId}/questions/`)
            ]);
            setQuiz(quizRes.data);
            setSettingsForm({
                time_limit_minutes: quizRes.data.time_limit_minutes || 0,
                passing_percentage: quizRes.data.passing_percentage,
                shuffle_questions: quizRes.data.shuffle_questions,
                show_results: quizRes.data.show_results,
                max_attempts: quizRes.data.max_attempts || 0
            });
            const questionsData = Array.isArray(questionsRes.data)
                ? questionsRes.data
                : questionsRes.data?.results || [];
            setQuestions(questionsData);
        } catch (error) {
            console.error('Error fetching quiz data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenQuestionModal = (question?: Question) => {
        if (question) {
            setSelectedQuestion(question);
            setQuestionForm({
                question_text: question.question_text,
                question_type: question.question_type,
                points: question.points,
                options: question.options.map(o => ({
                    option_text: o.option_text,
                    is_correct: o.is_correct
                }))
            });
        } else {
            setSelectedQuestion(null);
            setQuestionForm({
                question_text: '',
                question_type: 'single',
                points: 1,
                options: [
                    { option_text: '', is_correct: false },
                    { option_text: '', is_correct: false }
                ]
            });
        }
        setShowQuestionModal(true);
    };

    const handleAddOption = () => {
        setQuestionForm({
            ...questionForm,
            options: [...questionForm.options, { option_text: '', is_correct: false }]
        });
    };

    const handleRemoveOption = (index: number) => {
        if (questionForm.options.length <= 2) return;
        const newOptions = [...questionForm.options];
        newOptions.splice(index, 1);
        setQuestionForm({ ...questionForm, options: newOptions });
    };

    const handleOptionChange = (index: number, field: string, value: any) => {
        const newOptions = [...questionForm.options];
        (newOptions[index] as any)[field] = value;

        // For single choice, ensure only one option is correct
        if (field === 'is_correct' && value && questionForm.question_type === 'single') {
            newOptions.forEach((opt, i) => {
                if (i !== index) opt.is_correct = false;
            });
        }

        setQuestionForm({ ...questionForm, options: newOptions });
    };

    const handleSaveQuestion = async () => {
        if (!questionForm.question_text.trim()) {
            alert('Question text is required');
            return;
        }

        if (questionForm.question_type !== 'text' && !questionForm.options.some(o => o.is_correct)) {
            alert('At least one correct answer is required');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...questionForm,
                quiz: quizId,
                order: selectedQuestion ? selectedQuestion.order : questions.length + 1
            };

            if (selectedQuestion) {
                await api.patch(`/lms/quiz-questions/${selectedQuestion.id}/`, payload);
            } else {
                await api.post(`/lms/quiz-questions/`, payload);
            }
            fetchQuizData();
            setShowQuestionModal(false);
        } catch (error) {
            console.error('Error saving question:', error);
            alert('Failed to save question');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteQuestion = async (questionId: string) => {
        if (!confirm('Delete this question?')) return;
        try {
            await api.delete(`/lms/quiz-questions/${questionId}/`);
            fetchQuizData();
        } catch (error) {
            console.error('Error deleting question:', error);
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await api.patch(`/lms/quizzes/${quizId}/`, {
                time_limit_minutes: settingsForm.time_limit_minutes || null,
                passing_percentage: settingsForm.passing_percentage,
                shuffle_questions: settingsForm.shuffle_questions,
                show_results: settingsForm.show_results,
                max_attempts: settingsForm.max_attempts || null
            });
            setShowSettingsModal(false);
            fetchQuizData();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const togglePublish = async () => {
        if (!quiz) return;
        try {
            await api.patch(`/lms/quizzes/${quizId}/`, {
                is_published: !quiz.is_published
            });
            setQuiz({ ...quiz, is_published: !quiz.is_published });
        } catch (error) {
            console.error('Error toggling publish:', error);
        }
    };

    const getQuestionTypeIcon = (type: string) => {
        switch (type) {
            case 'single': return <Circle size={16} />;
            case 'multiple': return <Square size={16} />;
            case 'text': return <Type size={16} />;
            default: return <HelpCircle size={16} />;
        }
    };

    const getQuestionTypeLabel = (type: string) => {
        switch (type) {
            case 'single': return 'Single Choice';
            case 'multiple': return 'Multiple Choice';
            case 'text': return 'Text Answer';
            default: return type;
        }
    };

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    if (loading) {
        return (
            <div className="lms-loading">
                <RefreshCw className="spin" size={32} />
                <p>Loading quiz...</p>
            </div>
        );
    }

    return (
        <div className="quiz-builder">
            {/* Header */}
            <div className="builder-header">
                <div className="header-left">
                    <button className="btn-back" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1>{quiz?.title || 'New Quiz'}</h1>
                        <p className="quiz-meta">
                            {questions.length} questions • {totalPoints} total points
                        </p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => setShowSettingsModal(true)}>
                        <Settings size={16} />
                        Settings
                    </button>
                    <button className="btn-secondary">
                        <Eye size={16} />
                        Preview
                    </button>
                    {quiz && (
                        <button
                            className={`btn-publish ${quiz.is_published ? 'published' : ''}`}
                            onClick={togglePublish}
                        >
                            {quiz.is_published ? 'Published' : 'Publish'}
                        </button>
                    )}
                </div>
            </div>

            {/* Quiz Info Bar */}
            <div className="quiz-info-bar">
                <div className="info-item">
                    <Clock size={16} />
                    <span>
                        {quiz?.time_limit_minutes
                            ? `${quiz.time_limit_minutes} min limit`
                            : 'No time limit'}
                    </span>
                </div>
                <div className="info-item">
                    <Award size={16} />
                    <span>Pass: {quiz?.passing_percentage || 50}%</span>
                </div>
                <div className="info-item">
                    <Play size={16} />
                    <span>
                        {quiz?.max_attempts
                            ? `${quiz.max_attempts} attempts`
                            : 'Unlimited attempts'}
                    </span>
                </div>
            </div>

            {/* Questions List */}
            <div className="questions-container">
                <div className="questions-header">
                    <h2>Questions</h2>
                    <button className="btn-primary" onClick={() => handleOpenQuestionModal()}>
                        <Plus size={16} />
                        Add Question
                    </button>
                </div>

                {questions.length === 0 ? (
                    <div className="empty-questions">
                        <HelpCircle size={48} />
                        <h3>No questions yet</h3>
                        <p>Add questions to your quiz to get started</p>
                        <button className="btn-primary" onClick={() => handleOpenQuestionModal()}>
                            <Plus size={16} />
                            Create First Question
                        </button>
                    </div>
                ) : (
                    <div className="questions-list">
                        {questions.map((question, index) => (
                            <div key={question.id} className="question-card">
                                <div className="question-drag">
                                    <GripVertical size={18} />
                                </div>
                                <div className="question-number">{index + 1}</div>
                                <div className="question-content">
                                    <div className="question-header">
                                        <div className="question-type">
                                            {getQuestionTypeIcon(question.question_type)}
                                            <span>{getQuestionTypeLabel(question.question_type)}</span>
                                        </div>
                                        <div className="question-points">
                                            <Award size={14} />
                                            {question.points} pts
                                        </div>
                                    </div>
                                    <p className="question-text">{question.question_text}</p>
                                    {question.question_type !== 'text' && (
                                        <div className="question-options-preview">
                                            {question.options.slice(0, 4).map((option, i) => (
                                                <span
                                                    key={i}
                                                    className={`option-preview ${option.is_correct ? 'correct' : ''}`}
                                                >
                                                    {option.is_correct && <CheckCircle size={12} />}
                                                    {option.option_text.substring(0, 30)}
                                                    {option.option_text.length > 30 && '...'}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="question-actions">
                                    <button onClick={() => handleOpenQuestionModal(question)}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button>
                                        <Copy size={16} />
                                    </button>
                                    <button className="danger" onClick={() => handleDeleteQuestion(question.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Question Modal */}
            {showQuestionModal && (
                <div className="modal-overlay" onClick={() => setShowQuestionModal(false)}>
                    <div className="modal-content large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedQuestion ? 'Edit Question' : 'Add Question'}</h2>
                            <button className="btn-close" onClick={() => setShowQuestionModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Question *</label>
                                <textarea
                                    value={questionForm.question_text}
                                    onChange={e => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                                    placeholder="Enter your question..."
                                    rows={3}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Question Type</label>
                                    <select
                                        value={questionForm.question_type}
                                        onChange={e => setQuestionForm({ ...questionForm, question_type: e.target.value as any })}
                                    >
                                        <option value="single">Single Choice</option>
                                        <option value="multiple">Multiple Choice</option>
                                        <option value="text">Text Answer</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Points</label>
                                    <input
                                        type="number"
                                        value={questionForm.points}
                                        onChange={e => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 1 })}
                                        min="1"
                                    />
                                </div>
                            </div>

                            {questionForm.question_type !== 'text' && (
                                <div className="options-section">
                                    <label>Answer Options</label>
                                    {questionForm.options.map((option, index) => (
                                        <div key={index} className="option-row">
                                            <button
                                                type="button"
                                                className={`correct-toggle ${option.is_correct ? 'active' : ''}`}
                                                onClick={() => handleOptionChange(index, 'is_correct', !option.is_correct)}
                                            >
                                                {questionForm.question_type === 'single'
                                                    ? (option.is_correct ? <CheckCircle size={18} /> : <Circle size={18} />)
                                                    : (option.is_correct ? <CheckCircle size={18} /> : <Square size={18} />)
                                                }
                                            </button>
                                            <input
                                                type="text"
                                                value={option.option_text}
                                                onChange={e => handleOptionChange(index, 'option_text', e.target.value)}
                                                placeholder={`Option ${index + 1}`}
                                            />
                                            <button
                                                type="button"
                                                className="btn-remove-option"
                                                onClick={() => handleRemoveOption(index)}
                                                disabled={questionForm.options.length <= 2}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" className="btn-add-option" onClick={handleAddOption}>
                                        <Plus size={16} />
                                        Add Option
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowQuestionModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleSaveQuestion} disabled={saving}>
                                {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                                {selectedQuestion ? 'Update' : 'Add'} Question
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Quiz Settings</h2>
                            <button className="btn-close" onClick={() => setShowSettingsModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Time Limit (minutes)</label>
                                    <input
                                        type="number"
                                        value={settingsForm.time_limit_minutes}
                                        onChange={e => setSettingsForm({ ...settingsForm, time_limit_minutes: parseInt(e.target.value) || 0 })}
                                        min="0"
                                        placeholder="0 = No limit"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Passing Percentage</label>
                                    <input
                                        type="number"
                                        value={settingsForm.passing_percentage}
                                        onChange={e => setSettingsForm({ ...settingsForm, passing_percentage: parseInt(e.target.value) || 50 })}
                                        min="0"
                                        max="100"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Max Attempts</label>
                                <input
                                    type="number"
                                    value={settingsForm.max_attempts}
                                    onChange={e => setSettingsForm({ ...settingsForm, max_attempts: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    placeholder="0 = Unlimited"
                                />
                            </div>
                            <div className="form-row checkboxes">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settingsForm.shuffle_questions}
                                        onChange={e => setSettingsForm({ ...settingsForm, shuffle_questions: e.target.checked })}
                                    />
                                    <span>Shuffle questions</span>
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={settingsForm.show_results}
                                        onChange={e => setSettingsForm({ ...settingsForm, show_results: e.target.checked })}
                                    />
                                    <span>Show results after submission</span>
                                </label>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowSettingsModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleSaveSettings} disabled={saving}>
                                {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizBuilder;
