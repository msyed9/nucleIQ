import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MessageComposer.css';

interface MessageTemplate {
    id: number;
    name: string;
    template_type: 'SMS' | 'EMAIL' | 'WHATSAPP';
    category: string;
    content: string;
    subject?: string;
    variables: string[];
}

interface Recipient {
    id: string;
    name: string;
    type: 'STUDENT' | 'PARENT' | 'STAFF';
    phone?: string;
    email?: string;
}

interface BroadcastMessage {
    title: string;
    message_type: 'SMS' | 'EMAIL' | 'WHATSAPP' | 'ALL';
    target_audience: string;
    content: string;
    subject?: string;
    scheduled_at?: string;
    target_classes?: number[];
    target_sections?: number[];
}

const MessageComposer: React.FC = () => {
    const [messageType, setMessageType] = useState<'SMS' | 'EMAIL' | 'WHATSAPP' | 'ALL'>('SMS');
    const [targetAudience, setTargetAudience] = useState<string>('ALL_STUDENTS');
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
    const [selectedSections, setSelectedSections] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [characterCount, setCharacterCount] = useState(0);
    const [estimatedRecipients, setEstimatedRecipients] = useState(0);
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);

    const audienceOptions = [
        { value: 'ALL_STUDENTS', label: 'All Students' },
        { value: 'ALL_PARENTS', label: 'All Parents' },
        { value: 'ALL_STAFF', label: 'All Staff' },
        { value: 'SPECIFIC_CLASS', label: 'Specific Class' },
        { value: 'SPECIFIC_SECTION', label: 'Specific Section' },
        { value: 'FEE_DEFAULTERS', label: 'Fee Defaulters' },
        { value: 'ABSENT_TODAY', label: 'Absent Today' },
    ];

    useEffect(() => {
        fetchTemplates();
        fetchClasses();
    }, [messageType]);

    useEffect(() => {
        setCharacterCount(content.length);
        estimateRecipients();
    }, [content, targetAudience, selectedClasses, selectedSections]);

    const fetchTemplates = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/communication/templates/', {
                headers: { Authorization: `Bearer ${token}` },
                params: { template_type: messageType !== 'ALL' ? messageType : undefined }
            });
            setTemplates(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching templates:', err);
        }
    };

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/academics/classes/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClasses(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching classes:', err);
        }
    };

    const estimateRecipients = () => {
        // Simplified estimation logic
        let count = 0;
        if (targetAudience === 'ALL_STUDENTS') count = 500;
        else if (targetAudience === 'ALL_PARENTS') count = 500;
        else if (targetAudience === 'ALL_STAFF') count = 50;
        else if (targetAudience === 'SPECIFIC_CLASS') count = selectedClasses.length * 40;
        else if (targetAudience === 'SPECIFIC_SECTION') count = selectedSections.length * 30;
        else if (targetAudience === 'FEE_DEFAULTERS') count = 25;
        else if (targetAudience === 'ABSENT_TODAY') count = 15;

        setEstimatedRecipients(count);
    };

    const handleTemplateSelect = (templateId: number) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setSelectedTemplate(templateId);
            setContent(template.content);
            if (template.subject) setSubject(template.subject);
            if (!title) setTitle(template.name);
        }
    };

    const handleSendNow = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const payload: BroadcastMessage = {
                title,
                message_type: messageType,
                target_audience: targetAudience,
                content,
                subject: messageType === 'EMAIL' ? subject : undefined,
                target_classes: selectedClasses.length > 0 ? selectedClasses : undefined,
                target_sections: selectedSections.length > 0 ? selectedSections : undefined,
            };

            const response = await axios.post('/api/communication/broadcasts/', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Send immediately
            await axios.post(`/api/communication/broadcasts/${response.data.id}/send/`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(`Message sent successfully to ${estimatedRecipients} recipients!`);
            resetForm();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    const handleSchedule = async () => {
        if (!validateForm() || !scheduledDate || !scheduledTime) {
            setError('Please select date and time for scheduling');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const scheduledAt = `${scheduledDate}T${scheduledTime}:00`;

            const payload: BroadcastMessage = {
                title,
                message_type: messageType,
                target_audience: targetAudience,
                content,
                subject: messageType === 'EMAIL' ? subject : undefined,
                scheduled_at: scheduledAt,
                target_classes: selectedClasses.length > 0 ? selectedClasses : undefined,
                target_sections: selectedSections.length > 0 ? selectedSections : undefined,
            };

            await axios.post('/api/communication/broadcasts/', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(`Message scheduled for ${scheduledDate} at ${scheduledTime}`);
            resetForm();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to schedule message');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        if (!title.trim()) {
            setError('Please enter a title');
            return false;
        }
        if (!content.trim()) {
            setError('Please enter message content');
            return false;
        }
        if (messageType === 'EMAIL' && !subject.trim()) {
            setError('Please enter email subject');
            return false;
        }
        if (messageType === 'SMS' && content.length > 160) {
            setError('SMS message exceeds 160 characters');
            return false;
        }
        return true;
    };

    const resetForm = () => {
        setTitle('');
        setSubject('');
        setContent('');
        setSelectedTemplate(null);
        setScheduledDate('');
        setScheduledTime('');
        setSelectedClasses([]);
        setSelectedSections([]);
    };

    const getSMSCount = () => {
        if (messageType !== 'SMS') return 0;
        return Math.ceil(content.length / 160);
    };

    return (
        <div className="message-composer">
            <div className="composer-header">
                <h1>📨 Message Composer</h1>
                <p>Send SMS, Email, or WhatsApp messages to students, parents, and staff</p>
            </div>

            {success && (
                <div className="alert alert-success">
                    <span className="icon">✅</span>
                    {success}
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <span className="icon">⚠️</span>
                    {error}
                </div>
            )}

            <div className="composer-grid">
                {/* Left Panel - Compose */}
                <div className="compose-panel">
                    <div className="panel-card">
                        <h2>Compose Message</h2>

                        {/* Message Type */}
                        <div className="form-group">
                            <label>Message Type</label>
                            <div className="message-type-tabs">
                                <button
                                    className={messageType === 'SMS' ? 'active' : ''}
                                    onClick={() => setMessageType('SMS')}
                                >
                                    📱 SMS
                                </button>
                                <button
                                    className={messageType === 'EMAIL' ? 'active' : ''}
                                    onClick={() => setMessageType('EMAIL')}
                                >
                                    📧 Email
                                </button>
                                <button
                                    className={messageType === 'WHATSAPP' ? 'active' : ''}
                                    onClick={() => setMessageType('WHATSAPP')}
                                >
                                    💬 WhatsApp
                                </button>
                                <button
                                    className={messageType === 'ALL' ? 'active' : ''}
                                    onClick={() => setMessageType('ALL')}
                                >
                                    🌐 All Channels
                                </button>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="form-group">
                            <label>Campaign Title *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Monthly Fee Reminder"
                                className="form-control"
                            />
                        </div>

                        {/* Template Selection */}
                        <div className="form-group">
                            <label>Use Template (Optional)</label>
                            <select
                                value={selectedTemplate || ''}
                                onChange={(e) => handleTemplateSelect(Number(e.target.value))}
                                className="form-control"
                            >
                                <option value="">-- Select Template --</option>
                                {templates.map(template => (
                                    <option key={template.id} value={template.id}>
                                        {template.name} ({template.category})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Email Subject */}
                        {(messageType === 'EMAIL' || messageType === 'ALL') && (
                            <div className="form-group">
                                <label>Email Subject *</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Enter email subject"
                                    className="form-control"
                                />
                            </div>
                        )}

                        {/* Message Content */}
                        <div className="form-group">
                            <label>Message Content *</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Type your message here..."
                                className="form-control message-textarea"
                                rows={8}
                            />
                            <div className="character-count">
                                {characterCount} characters
                                {messageType === 'SMS' && (
                                    <span className={getSMSCount() > 1 ? 'warning' : ''}>
                                        {' '}• {getSMSCount()} SMS {getSMSCount() > 1 ? '(Multiple messages)' : ''}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Variables Help */}
                        <div className="info-box">
                            <strong>💡 Available Variables:</strong>
                            <div className="variables">
                                <code>{'{{name}}'}</code>
                                <code>{'{{class}}'}</code>
                                <code>{'{{section}}'}</code>
                                <code>{'{{roll_number}}'}</code>
                                <code>{'{{amount}}'}</code>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Recipients & Schedule */}
                <div className="settings-panel">
                    {/* Recipients */}
                    <div className="panel-card">
                        <h2>👥 Recipients</h2>

                        <div className="form-group">
                            <label>Target Audience *</label>
                            <select
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                className="form-control"
                            >
                                {audienceOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Class Selection */}
                        {targetAudience === 'SPECIFIC_CLASS' && (
                            <div className="form-group">
                                <label>Select Classes</label>
                                <div className="checkbox-group">
                                    {classes.map(cls => (
                                        <label key={cls.id} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={selectedClasses.includes(cls.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedClasses([...selectedClasses, cls.id]);
                                                    } else {
                                                        setSelectedClasses(selectedClasses.filter(id => id !== cls.id));
                                                    }
                                                }}
                                            />
                                            {cls.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="recipient-estimate">
                            <div className="estimate-icon">👤</div>
                            <div className="estimate-details">
                                <div className="estimate-count">{estimatedRecipients}</div>
                                <div className="estimate-label">Estimated Recipients</div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="panel-card">
                        <h2>⏰ Schedule (Optional)</h2>

                        <div className="form-group">
                            <label>Date</label>
                            <input
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                className="form-control"
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div className="form-group">
                            <label>Time</label>
                            <input
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className="form-control"
                            />
                        </div>

                        {scheduledDate && scheduledTime && (
                            <div className="schedule-preview">
                                📅 Scheduled for: {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                            </div>
                        )}
                    </div>

                    {/* Cost Estimate */}
                    <div className="panel-card cost-card">
                        <h2>💰 Cost Estimate</h2>
                        <div className="cost-breakdown">
                            {messageType === 'SMS' && (
                                <div className="cost-item">
                                    <span>SMS ({getSMSCount()} × {estimatedRecipients})</span>
                                    <span className="cost-value">₹{(getSMSCount() * estimatedRecipients * 0.25).toFixed(2)}</span>
                                </div>
                            )}
                            {messageType === 'EMAIL' && (
                                <div className="cost-item">
                                    <span>Email ({estimatedRecipients})</span>
                                    <span className="cost-value">₹{(estimatedRecipients * 0.05).toFixed(2)}</span>
                                </div>
                            )}
                            {messageType === 'WHATSAPP' && (
                                <div className="cost-item">
                                    <span>WhatsApp ({estimatedRecipients})</span>
                                    <span className="cost-value">₹{(estimatedRecipients * 0.35).toFixed(2)}</span>
                                </div>
                            )}
                            {messageType === 'ALL' && (
                                <>
                                    <div className="cost-item">
                                        <span>SMS</span>
                                        <span className="cost-value">₹{(estimatedRecipients * 0.25).toFixed(2)}</span>
                                    </div>
                                    <div className="cost-item">
                                        <span>Email</span>
                                        <span className="cost-value">₹{(estimatedRecipients * 0.05).toFixed(2)}</span>
                                    </div>
                                    <div className="cost-item">
                                        <span>WhatsApp</span>
                                        <span className="cost-value">₹{(estimatedRecipients * 0.35).toFixed(2)}</span>
                                    </div>
                                    <div className="cost-item total">
                                        <span>Total</span>
                                        <span className="cost-value">₹{(estimatedRecipients * 0.65).toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        <button
                            className="btn btn-primary"
                            onClick={handleSendNow}
                            disabled={loading}
                        >
                            {loading ? '⏳ Sending...' : '📤 Send Now'}
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={handleSchedule}
                            disabled={loading}
                        >
                            ⏰ Schedule
                        </button>
                        <button
                            className="btn btn-outline"
                            onClick={resetForm}
                            disabled={loading}
                        >
                            🔄 Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageComposer;
