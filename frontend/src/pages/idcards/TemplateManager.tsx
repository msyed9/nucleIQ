import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as idcardsAPI from '../../services/idcards';
import { IDCardTemplate } from '../../services/idcards';
import './TemplateManager.css';

const TemplateManager: React.FC = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<IDCardTemplate[]>([]);
    const [systemTemplates, setSystemTemplates] = useState<IDCardTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'my' | 'system'>('my');
    const [entityFilter, setEntityFilter] = useState<'all' | 'student' | 'staff'>('all');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<IDCardTemplate | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, [entityFilter]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const filterParam = entityFilter !== 'all' ? entityFilter : undefined;

            const [myTemplatesRes, systemTemplatesRes] = await Promise.all([
                idcardsAPI.getTemplates(filterParam),
                idcardsAPI.getSystemTemplates(),
            ]);

            // Handle both array and object responses
            const myTemplatesData = Array.isArray(myTemplatesRes.data) 
                ? myTemplatesRes.data 
                : (myTemplatesRes.data?.results || []);
            const systemTemplatesData = Array.isArray(systemTemplatesRes.data)
                ? systemTemplatesRes.data
                : (systemTemplatesRes.data?.results || []);

            setTemplates(myTemplatesData.filter((t: IDCardTemplate) => !t.is_system));
            setSystemTemplates(systemTemplatesData);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        navigate('/idcards/designer');
    };

    const handleEditTemplate = (template: IDCardTemplate) => {
        navigate(`/idcards/designer?template=${template.id}`);
    };

    const handleDuplicateTemplate = async (template: IDCardTemplate) => {
        try {
            await idcardsAPI.duplicateTemplate(template.id);
            fetchTemplates();
        } catch (error) {
            console.error('Failed to duplicate template:', error);
            alert('Failed to duplicate template');
        }
    };

    const handleSetDefault = async (template: IDCardTemplate) => {
        try {
            await idcardsAPI.setDefaultTemplate(template.id);
            fetchTemplates();
        } catch (error) {
            console.error('Failed to set default template:', error);
            alert('Failed to set default template');
        }
    };

    const handleDeleteTemplate = async () => {
        if (!templateToDelete) return;

        try {
            await idcardsAPI.deleteTemplate(templateToDelete.id);
            fetchTemplates();
            setShowDeleteModal(false);
            setTemplateToDelete(null);
        } catch (error) {
            console.error('Failed to delete template:', error);
            alert('Failed to delete template');
        }
    };

    const confirmDelete = (template: IDCardTemplate) => {
        setTemplateToDelete(template);
        setShowDeleteModal(true);
    };

    const displayTemplates = activeTab === 'my' ? templates : systemTemplates;

    return (
        <div className="template-manager">
            <div className="template-manager-header">
                <div>
                    <h1>ID Card Templates</h1>
                    <p>Create and manage ID card templates for students and staff</p>
                </div>
                <button className="btn-primary" onClick={handleCreateNew}>
                    <i className="fas fa-plus"></i> Create New Template
                </button>
            </div>

            {/* Filters */}
            <div className="template-filters">
                <div className="filter-tabs">
                    <button
                        className={activeTab === 'my' ? 'active' : ''}
                        onClick={() => setActiveTab('my')}
                    >
                        My Templates ({templates.length})
                    </button>
                    <button
                        className={activeTab === 'system' ? 'active' : ''}
                        onClick={() => setActiveTab('system')}
                    >
                        System Templates ({systemTemplates.length})
                    </button>
                </div>

                <div className="filter-entity">
                    <label>Entity Type:</label>
                    <select
                        value={entityFilter}
                        onChange={(e) => setEntityFilter(e.target.value as any)}
                    >
                        <option value="all">All</option>
                        <option value="student">Student</option>
                        <option value="staff">Staff</option>
                    </select>
                </div>
            </div>

            {/* Templates Grid */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading templates...</p>
                </div>
            ) : displayTemplates.length === 0 ? (
                <div className="empty-state">
                    <i className="fas fa-id-card fa-3x"></i>
                    <h3>No templates found</h3>
                    <p>
                        {activeTab === 'my'
                            ? 'Create your first template to get started'
                            : 'No system templates available'}
                    </p>
                    {activeTab === 'my' && (
                        <button className="btn-primary" onClick={handleCreateNew}>
                            Create New Template
                        </button>
                    )}
                </div>
            ) : (
                <div className="templates-grid">
                    {displayTemplates.map((template) => (
                        <div key={template.id} className="template-card">
                            <div className="template-preview">
                                <div className={`preview-placeholder ${template.orientation}`}>
                                    <i className="fas fa-id-card"></i>
                                    <span>{template.orientation === 'portrait' ? '↕' : '↔'}</span>
                                </div>
                                {template.is_default && (
                                    <div className="default-badge">
                                        <i className="fas fa-star"></i> Default
                                    </div>
                                )}
                            </div>

                            <div className="template-info">
                                <h3>{template.name}</h3>
                                <p className="template-description">{template.description}</p>
                                <div className="template-meta">
                                    <span className={`entity-badge ${template.entity_type}`}>
                                        {template.entity_type === 'student' ? 'Student' : 'Staff'}
                                    </span>
                                    <span className="orientation-badge">
                                        {template.orientation === 'portrait' ? 'Portrait' : 'Landscape'}
                                    </span>
                                    <span className="size-badge">
                                        {template.width}x{template.height}mm
                                    </span>
                                </div>
                            </div>

                            <div className="template-actions">
                                {activeTab === 'my' ? (
                                    <>
                                        <button
                                            className="btn-action"
                                            onClick={() => handleEditTemplate(template)}
                                            title="Edit Template"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                            className="btn-action"
                                            onClick={() => handleDuplicateTemplate(template)}
                                            title="Duplicate Template"
                                        >
                                            <i className="fas fa-copy"></i>
                                        </button>
                                        {!template.is_default && (
                                            <button
                                                className="btn-action"
                                                onClick={() => handleSetDefault(template)}
                                                title="Set as Default"
                                            >
                                                <i className="fas fa-star"></i>
                                            </button>
                                        )}
                                        {!template.is_system && (
                                            <button
                                                className="btn-action btn-danger"
                                                onClick={() => confirmDelete(template)}
                                                title="Delete Template"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className="btn-action"
                                            onClick={() => handleDuplicateTemplate(template)}
                                            title="Use This Template"
                                        >
                                            <i className="fas fa-download"></i> Use Template
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && templateToDelete && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Delete Template</h2>
                            <button className="close-btn" onClick={() => setShowDeleteModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>
                                Are you sure you want to delete the template "{templateToDelete.name}"?
                            </p>
                            <p className="warning-text">
                                <i className="fas fa-exclamation-triangle"></i>
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-danger" onClick={handleDeleteTemplate}>
                                Delete Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplateManager;
