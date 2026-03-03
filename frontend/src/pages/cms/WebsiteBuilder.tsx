/**
 * Website Builder - Premium Visual Editor for School Websites
 * Backend-driven template system with drag-and-drop and live preview
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './WebsiteBuilder.css';
import api from '../../services/api';

// Types
interface Section {
  id?: string;
  component_type: string;
  title: string;
  content: any;
  order: number;
  is_visible: boolean;
  background_color?: string;
  text_color?: string;
  background_image?: string;
  padding?: string;
}

interface Page {
  title: string;
  slug: string;
  page_type: string;
  sections: Section[];
}

interface WebsiteTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  structure?: { pages: Page[] };
  is_system: boolean;
  is_custom: boolean;
  pages_count: number;
}

interface WebsiteInstance {
  id: number;
  name: string;
  source_template: number;
  source_template_name: string;
  subdomain: string;
  domain: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  custom_structure: { pages: Page[] };
  effective_structure: { pages: Page[] };
  effective_theme: any;
  status: string;
  is_published: boolean;
  meta_title: string;
  meta_description: string;
}

interface SectionType {
  type: string;
  label: string;
  icon: string;
  description: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

// Main Component
const WebsiteBuilder: React.FC = () => {
  // State
  const [view, setView] = useState<'gallery' | 'editor' | 'upload'>('gallery');
  const [templates, setTemplates] = useState<WebsiteTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sectionTypes, setSectionTypes] = useState<SectionType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [instances, setInstances] = useState<WebsiteInstance[]>([]);
  const [currentInstance, setCurrentInstance] = useState<WebsiteInstance | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showAddSection, setShowAddSection] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);

  // Refs
  const previewRef = useRef<HTMLDivElement>(null);

  // Load data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [templatesRes, categoriesRes, sectionTypesRes, instancesRes] = await Promise.all([
        api.get('/cms/templates/'),
        api.get('/cms/templates/categories/'),
        api.get('/cms/templates/section_types/'),
        api.get('/cms/instances/')
      ]);

      setTemplates(templatesRes.data.results || templatesRes.data);
      setCategories(categoriesRes.data.results || categoriesRes.data);
      setSectionTypes(sectionTypesRes.data.results || sectionTypesRes.data);
      setInstances(instancesRes.data.results || instancesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter templates by category
  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  // Fork a template to create instance
  const handleForkTemplate = async (template: WebsiteTemplate) => {
    try {
      setLoading(true);
      const response = await api.post(`/cms/templates/${template.id}/fork/`, {
        name: `${template.name} - My Website`
      });

      setCurrentInstance(response.data);
      setCurrentPageIndex(0);
      setSelectedSectionIndex(null);
      setView('editor');

      // Refresh instances list
      const instancesRes = await api.get('/cms/instances/');
      setInstances(instancesRes.data.results || instancesRes.data);
    } catch (error) {
      console.error('Failed to fork template:', error);
      alert('Failed to create website from template');
    } finally {
      setLoading(false);
    }
  };

  // Load existing instance for editing
  const handleEditInstance = async (instance: WebsiteInstance) => {
    try {
      setLoading(true);
      const response = await api.get(`/cms/instances/${instance.id}/`);
      setCurrentInstance(response.data);
      setCurrentPageIndex(0);
      setSelectedSectionIndex(null);
      setView('editor');
    } catch (error) {
      console.error('Failed to load instance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get current page
  const getCurrentPage = (): Page | null => {
    if (!currentInstance) return null;
    const structure = currentInstance.custom_structure || currentInstance.effective_structure;
    return structure?.pages?.[currentPageIndex] || null;
  };

  // Update section
  const handleUpdateSection = async (sectionIndex: number, updates: Partial<Section>) => {
    if (!currentInstance) return;

    setSaving(true);
    try {
      const response = await api.post(`/cms/instances/${currentInstance.id}/update_section/`, {
        page_index: currentPageIndex,
        section_index: sectionIndex,
        updates
      });
      setCurrentInstance(response.data);
    } catch (error) {
      console.error('Failed to update section:', error);
    } finally {
      setSaving(false);
    }
  };

  // Add section
  const handleAddSection = async (sectionType: string) => {
    if (!currentInstance) return;

    setSaving(true);
    try {
      const response = await api.post(`/cms/instances/${currentInstance.id}/add_section/`, {
        page_index: currentPageIndex,
        section_type: sectionType,
        title: `New ${sectionType} Section`,
        content: getDefaultContent(sectionType)
      });
      setCurrentInstance(response.data);
      setShowAddSection(false);
    } catch (error) {
      console.error('Failed to add section:', error);
    } finally {
      setSaving(false);
    }
  };

  // Delete section
  const handleDeleteSection = async (sectionIndex: number) => {
    if (!currentInstance || !confirm('Delete this section?')) return;

    setSaving(true);
    try {
      const response = await api.post(`/cms/instances/${currentInstance.id}/delete_section/`, {
        page_index: currentPageIndex,
        section_index: sectionIndex
      });
      setCurrentInstance(response.data);
      setSelectedSectionIndex(null);
    } catch (error) {
      console.error('Failed to delete section:', error);
    } finally {
      setSaving(false);
    }
  };

  // Move section (drag and drop)
  const handleMoveSection = async (fromIndex: number, toIndex: number) => {
    if (!currentInstance || fromIndex === toIndex) return;

    const page = getCurrentPage();
    if (!page) return;

    // Calculate new order
    const newOrder = page.sections.map((_, i) => i);
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);

    setSaving(true);
    try {
      const response = await api.post(`/cms/instances/${currentInstance.id}/reorder_sections/`, {
        page_index: currentPageIndex,
        section_order: newOrder
      });
      setCurrentInstance(response.data);
    } catch (error) {
      console.error('Failed to reorder sections:', error);
    } finally {
      setSaving(false);
    }
  };

  // Add page
  const handleAddPage = async () => {
    if (!currentInstance) return;

    const title = prompt('Enter page title:');
    if (!title) return;

    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    setSaving(true);
    try {
      const response = await api.post(`/cms/instances/${currentInstance.id}/add_page/`, {
        title,
        slug,
        page_type: 'CUSTOM',
        sections: [{
          id: `section_${Date.now()}`,
          component_type: 'PAGE_HEADER',
          title: 'Page Header',
          content: { heading: title, breadcrumb: `Home > ${title}` },
          order: 0,
          is_visible: true
        }]
      });
      setCurrentInstance(response.data);
      setCurrentPageIndex(response.data.custom_structure.pages.length - 1);
    } catch (error) {
      console.error('Failed to add page:', error);
    } finally {
      setSaving(false);
    }
  };

  // Delete page
  const handleDeletePage = async (pageIndex: number) => {
    if (!currentInstance || !confirm('Delete this page and all its sections?')) return;

    setSaving(true);
    try {
      const response = await api.post(`/cms/instances/${currentInstance.id}/delete_page/`, {
        page_index: pageIndex
      });
      setCurrentInstance(response.data);
      if (currentPageIndex >= pageIndex && currentPageIndex > 0) {
        setCurrentPageIndex(currentPageIndex - 1);
      }
    } catch (error) {
      console.error('Failed to delete page:', error);
    } finally {
      setSaving(false);
    }
  };

  // Publish/Unpublish
  const handlePublish = async () => {
    if (!currentInstance) return;

    setSaving(true);
    try {
      const endpoint = currentInstance.is_published ? 'unpublish' : 'publish';
      const response = await api.post(`/cms/instances/${currentInstance.id}/${endpoint}/`);

      const updatedInstance = response.data;
      setCurrentInstance(updatedInstance);

      // Update instances array so the gallery view shows the correct state
      setInstances(prev => prev.map(inst =>
        inst.id === currentInstance.id ? updatedInstance : inst
      ));
    } catch (error) {
      console.error('Failed to publish:', error);
    } finally {
      setSaving(false);
    }
  };

  // Update theme
  const handleUpdateTheme = async (updates: any) => {
    if (!currentInstance) return;

    setSaving(true);
    try {
      const response = await api.patch(`/cms/instances/${currentInstance.id}/update_theme/`, updates);
      setCurrentInstance(response.data);
    } catch (error) {
      console.error('Failed to update theme:', error);
    } finally {
      setSaving(false);
    }
  };

  // Upload custom template
  const handleUploadTemplate = async (templateData: any) => {
    try {
      setSaving(true);
      await api.post('/cms/templates/upload/', templateData);
      await loadInitialData();
      setShowUploadModal(false);
      alert('Template uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload template:', error);
      alert('Failed to upload template');
    } finally {
      setSaving(false);
    }
  };

  // Default content for new sections
  const getDefaultContent = (type: string) => {
    const defaults: Record<string, any> = {
      HERO: { heading: 'Welcome to Our School', subheading: 'Excellence in Education', buttonText: 'Learn More', buttonLink: '/about' },
      FEATURES: { heading: 'Our Features', features: [{ icon: '⭐', title: 'Feature 1', description: 'Description' }] },
      STATS: { stats: [{ value: '100+', label: 'Students' }] },
      TESTIMONIALS: { heading: 'What People Say', testimonials: [{ name: 'John', quote: 'Great school!', role: 'Parent' }] },
      CONTACT: { address: 'Your Address', phone: '+1234567890', email: 'info@school.com' },
      CTA: { heading: 'Get Started', subheading: 'Join us today', buttonText: 'Apply Now', buttonLink: '/apply' },
      PAGE_HEADER: { heading: 'Page Title', breadcrumb: 'Home > Page' },
      TEXT_BLOCK: { text: 'Enter your content here...' },
      FAQ: { heading: 'FAQ', items: [{ question: 'Question?', answer: 'Answer.' }] },
    };
    return defaults[type] || {};
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSectionIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedSectionIndex !== null && draggedSectionIndex !== index) {
      e.currentTarget.classList.add('drag-over');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    if (draggedSectionIndex !== null) {
      handleMoveSection(draggedSectionIndex, index);
    }
    setDraggedSectionIndex(null);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="wb-loading">
        <div className="wb-spinner"></div>
        <p>Loading Website Builder...</p>
      </div>
    );
  }

  // Render Gallery View
  if (view === 'gallery') {
    return (
      <div className="website-builder">
        <div className="wb-header">
          <div className="wb-header-left">
            <h1>🌐 Website Builder</h1>
            <p>Create stunning websites for your institution</p>
          </div>
          <div className="wb-header-right">
            <button className="wb-btn wb-btn-secondary" onClick={() => setShowUploadModal(true)}>
              📤 Upload Template
            </button>
          </div>
        </div>

        {/* Existing Instances */}
        {instances.length > 0 && (
          <div className="wb-section">
            <h2>📁 Your Websites</h2>
            <div className="wb-instances-grid">
              {instances.map(instance => (
                <div key={instance.id} className="wb-instance-card">
                  <div className="wb-instance-header">
                    <h3>{instance.name}</h3>
                    <span className={`wb-status ${instance.is_published ? 'published' : 'draft'}`}>
                      {instance.is_published ? '🟢 Published' : '🟡 Draft'}
                    </span>
                  </div>
                  <p className="wb-instance-template">Based on: {instance.source_template_name}</p>
                  <div className="wb-instance-actions">
                    <button className="wb-btn wb-btn-primary" onClick={() => handleEditInstance(instance)}>
                      ✏️ Edit
                    </button>
                    {instance.is_published && instance.subdomain && (
                      <a
                        href={`/api/cms/render/${instance.subdomain}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="wb-btn wb-btn-secondary"
                      >
                        🔗 View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="wb-section">
          <h2>📚 Template Gallery</h2>
          <div className="wb-categories">
            <button
              className={`wb-category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Templates
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`wb-category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="wb-templates-grid">
          {filteredTemplates.map(template => (
            <div key={template.id} className="wb-template-card">
              <div
                className="wb-template-preview"
                style={{ background: template.thumbnail }}
              >
                {template.is_custom && (
                  <span className="wb-custom-badge">Custom</span>
                )}
              </div>
              <div className="wb-template-info">
                <h3>{template.name}</h3>
                <p>{template.description}</p>
                <div className="wb-template-meta">
                  <span>{template.pages_count} pages</span>
                  <span className="wb-template-category">{template.category}</span>
                </div>
                <div className="wb-template-colors">
                  <span style={{ background: template.primary_color }}></span>
                  <span style={{ background: template.secondary_color }}></span>
                  <span style={{ background: template.accent_color }}></span>
                </div>
                <button
                  className="wb-btn wb-btn-primary wb-btn-full"
                  onClick={() => handleForkTemplate(template)}
                >
                  🚀 Use This Template
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <UploadTemplateModal
            onClose={() => setShowUploadModal(false)}
            onUpload={handleUploadTemplate}
          />
        )}
      </div>
    );
  }

  // Render Editor View
  const currentPage = getCurrentPage();
  const structure = currentInstance?.custom_structure || currentInstance?.effective_structure;
  const theme = currentInstance?.effective_theme || {};

  return (
    <div className="website-builder wb-editor-mode">
      {/* Editor Header */}
      <div className="wb-editor-header">
        <div className="wb-editor-left">
          <button className="wb-btn wb-btn-ghost" onClick={() => setView('gallery')}>
            ← Back
          </button>
          <h2>{currentInstance?.name}</h2>
          {saving && <span className="wb-saving">Saving...</span>}
        </div>
        <div className="wb-editor-center">
          <div className="wb-preview-modes">
            <button
              className={previewMode === 'desktop' ? 'active' : ''}
              onClick={() => setPreviewMode('desktop')}
              title="Desktop"
            >🖥️</button>
            <button
              className={previewMode === 'tablet' ? 'active' : ''}
              onClick={() => setPreviewMode('tablet')}
              title="Tablet"
            >📱</button>
            <button
              className={previewMode === 'mobile' ? 'active' : ''}
              onClick={() => setPreviewMode('mobile')}
              title="Mobile"
            >📲</button>
          </div>
        </div>
        <div className="wb-editor-right">
          <button
            className={`wb-btn ${currentInstance?.is_published ? 'wb-btn-secondary' : 'wb-btn-primary'}`}
            onClick={handlePublish}
          >
            {currentInstance?.is_published ? '📤 Unpublish' : '🚀 Publish'}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="wb-editor-body">
        {/* Left Sidebar - Pages */}
        <div className="wb-sidebar wb-sidebar-left">
          <div className="wb-sidebar-header">
            <h3>Pages</h3>
            <button className="wb-btn-icon" onClick={handleAddPage} title="Add Page">+</button>
          </div>
          <div className="wb-pages-list">
            {structure?.pages?.map((page, idx) => (
              <div
                key={idx}
                className={`wb-page-item ${idx === currentPageIndex ? 'active' : ''}`}
                onClick={() => { setCurrentPageIndex(idx); setSelectedSectionIndex(null); }}
              >
                <span className="wb-page-icon">📄</span>
                <span className="wb-page-title">{page.title}</span>
                {idx > 0 && (
                  <button
                    className="wb-btn-delete"
                    onClick={(e) => { e.stopPropagation(); handleDeletePage(idx); }}
                  >×</button>
                )}
              </div>
            ))}
          </div>

          {/* Theme Settings */}
          <div className="wb-sidebar-section">
            <h3>Theme</h3>
            <div className="wb-theme-colors">
              <label>
                Primary
                <input
                  type="color"
                  value={currentInstance?.primary_color || theme.primary_color || '#2563eb'}
                  onChange={(e) => handleUpdateTheme({ primary_color: e.target.value })}
                />
              </label>
              <label>
                Secondary
                <input
                  type="color"
                  value={currentInstance?.secondary_color || theme.secondary_color || '#1e40af'}
                  onChange={(e) => handleUpdateTheme({ secondary_color: e.target.value })}
                />
              </label>
              <label>
                Accent
                <input
                  type="color"
                  value={currentInstance?.accent_color || theme.accent_color || '#60a5fa'}
                  onChange={(e) => handleUpdateTheme({ accent_color: e.target.value })}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Main Preview Area */}
        <div className={`wb-preview-container wb-preview-${previewMode}`}>
          <div className="wb-preview-frame" ref={previewRef}>
            {/* Preview Navigation */}
            <div className="wb-preview-nav" style={{ background: theme.primary_color }}>
              {structure?.pages?.map((page, idx) => (
                <span key={idx} className={idx === currentPageIndex ? 'active' : ''}>
                  {page.title}
                </span>
              ))}
            </div>

            {/* Sections */}
            <div className="wb-preview-sections">
              {currentPage?.sections?.map((section, idx) => (
                <div
                  key={section.id || idx}
                  className={`wb-preview-section ${selectedSectionIndex === idx ? 'selected' : ''} ${!section.is_visible ? 'hidden' : ''}`}
                  onClick={() => setSelectedSectionIndex(idx)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, idx)}
                >
                  <div className="wb-section-controls">
                    <span className="wb-section-type">{section.component_type}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSection(idx); }}>🗑️</button>
                  </div>
                  <SectionPreview section={section} theme={theme} />
                </div>
              ))}

              {/* Add Section Button */}
              <button
                className="wb-add-section-btn"
                onClick={() => setShowAddSection(true)}
              >
                + Add Section
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Section Editor */}
        <div className="wb-sidebar wb-sidebar-right">
          {selectedSectionIndex !== null && currentPage?.sections?.[selectedSectionIndex] ? (
            <SectionEditor
              section={currentPage.sections[selectedSectionIndex]}
              onUpdate={(updates) => handleUpdateSection(selectedSectionIndex, updates)}
            />
          ) : (
            <div className="wb-sidebar-empty">
              <p>Select a section to edit</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Section Modal */}
      {showAddSection && (
        <div className="wb-modal-overlay" onClick={() => setShowAddSection(false)}>
          <div className="wb-modal" onClick={e => e.stopPropagation()}>
            <div className="wb-modal-header">
              <h3>Add Section</h3>
              <button onClick={() => setShowAddSection(false)}>×</button>
            </div>
            <div className="wb-section-types-grid">
              {sectionTypes.map(st => (
                <button
                  key={st.type}
                  className="wb-section-type-btn"
                  onClick={() => handleAddSection(st.type)}
                >
                  <span className="wb-st-icon">{st.icon}</span>
                  <span className="wb-st-label">{st.label}</span>
                  <span className="wb-st-desc">{st.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Section Preview Component
const SectionPreview: React.FC<{ section: Section; theme: any }> = ({ section, theme }) => {
  const { component_type, content, background_color, text_color } = section;

  const style: React.CSSProperties = {
    backgroundColor: background_color || '#fff',
    color: text_color || '#000',
    padding: '2rem',
  };

  switch (component_type) {
    case 'HERO':
      return (
        <div className="wb-p-hero" style={style}>
          <h1>{content.heading}</h1>
          <p>{content.subheading}</p>
          <button style={{ background: theme.accent_color }}>{content.buttonText}</button>
        </div>
      );
    case 'FEATURES':
      return (
        <div className="wb-p-features" style={style}>
          <h2>{content.heading}</h2>
          <div className="wb-p-features-grid">
            {content.features?.map((f: any, i: number) => (
              <div key={i} className="wb-p-feature">
                <span>{f.icon}</span>
                <h4>{f.title}</h4>
                <p>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case 'STATS':
      return (
        <div className="wb-p-stats" style={style}>
          {content.stats?.map((s: any, i: number) => (
            <div key={i} className="wb-p-stat">
              <span className="wb-p-stat-value" style={{ color: theme.primary_color }}>{s.value}</span>
              <span className="wb-p-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      );
    case 'PAGE_HEADER':
      return (
        <div className="wb-p-header" style={style}>
          <h1>{content.heading}</h1>
          <p>{content.breadcrumb}</p>
        </div>
      );
    case 'CONTACT':
      return (
        <div className="wb-p-contact" style={style}>
          <h2>Contact Us</h2>
          <p>📍 {content.address}</p>
          <p>📞 {content.phone}</p>
          <p>✉️ {content.email}</p>
        </div>
      );
    case 'CTA':
      return (
        <div className="wb-p-cta" style={style}>
          <h2>{content.heading}</h2>
          <p>{content.subheading}</p>
          <button style={{ background: theme.accent_color }}>{content.buttonText}</button>
        </div>
      );
    case 'TESTIMONIALS':
      return (
        <div className="wb-p-testimonials" style={style}>
          <h2>{content.heading}</h2>
          {content.testimonials?.slice(0, 2).map((t: any, i: number) => (
            <div key={i} className="wb-p-testimonial">
              <p>"{t.quote}"</p>
              <strong>— {t.name}</strong>
            </div>
          ))}
        </div>
      );
    default:
      return (
        <div className="wb-p-default" style={style}>
          <p>{component_type} Section</p>
        </div>
      );
  }
};

// Section Editor Component
const SectionEditor: React.FC<{ section: Section; onUpdate: (updates: Partial<Section>) => void }> = ({ section, onUpdate }) => {
  const [localContent, setLocalContent] = useState(section.content);

  useEffect(() => {
    setLocalContent(section.content);
  }, [section]);

  const handleContentChange = (key: string, value: any) => {
    const newContent = { ...localContent, [key]: value };
    setLocalContent(newContent);
  };

  const handleSave = () => {
    onUpdate({ content: localContent });
  };

  return (
    <div className="wb-section-editor">
      <h3>Edit {section.component_type}</h3>

      <div className="wb-editor-field">
        <label>Visibility</label>
        <label className="wb-toggle">
          <input
            type="checkbox"
            checked={section.is_visible !== false}
            onChange={(e) => onUpdate({ is_visible: e.target.checked })}
          />
          <span>Visible</span>
        </label>
      </div>

      <div className="wb-editor-field">
        <label>Background Color</label>
        <input
          type="color"
          value={section.background_color || '#ffffff'}
          onChange={(e) => onUpdate({ background_color: e.target.value })}
        />
      </div>

      <div className="wb-editor-field">
        <label>Text Color</label>
        <input
          type="color"
          value={section.text_color || '#000000'}
          onChange={(e) => onUpdate({ text_color: e.target.value })}
        />
      </div>

      <hr />

      {/* Content fields based on section type */}
      {section.component_type === 'HERO' && (
        <>
          <div className="wb-editor-field">
            <label>Heading</label>
            <input
              type="text"
              value={localContent.heading || ''}
              onChange={(e) => handleContentChange('heading', e.target.value)}
            />
          </div>
          <div className="wb-editor-field">
            <label>Subheading</label>
            <textarea
              value={localContent.subheading || ''}
              onChange={(e) => handleContentChange('subheading', e.target.value)}
            />
          </div>
          <div className="wb-editor-field">
            <label>Button Text</label>
            <input
              type="text"
              value={localContent.buttonText || ''}
              onChange={(e) => handleContentChange('buttonText', e.target.value)}
            />
          </div>
          <div className="wb-editor-field">
            <label>Button Link</label>
            <input
              type="text"
              value={localContent.buttonLink || ''}
              onChange={(e) => handleContentChange('buttonLink', e.target.value)}
            />
          </div>
        </>
      )}

      {section.component_type === 'PAGE_HEADER' && (
        <>
          <div className="wb-editor-field">
            <label>Heading</label>
            <input
              type="text"
              value={localContent.heading || ''}
              onChange={(e) => handleContentChange('heading', e.target.value)}
            />
          </div>
          <div className="wb-editor-field">
            <label>Breadcrumb</label>
            <input
              type="text"
              value={localContent.breadcrumb || ''}
              onChange={(e) => handleContentChange('breadcrumb', e.target.value)}
            />
          </div>
        </>
      )}

      {section.component_type === 'CONTACT' && (
        <>
          <div className="wb-editor-field">
            <label>Address</label>
            <input
              type="text"
              value={localContent.address || ''}
              onChange={(e) => handleContentChange('address', e.target.value)}
            />
          </div>
          <div className="wb-editor-field">
            <label>Phone</label>
            <input
              type="text"
              value={localContent.phone || ''}
              onChange={(e) => handleContentChange('phone', e.target.value)}
            />
          </div>
          <div className="wb-editor-field">
            <label>Email</label>
            <input
              type="email"
              value={localContent.email || ''}
              onChange={(e) => handleContentChange('email', e.target.value)}
            />
          </div>
        </>
      )}

      {section.component_type === 'CTA' && (
        <>
          <div className="wb-editor-field">
            <label>Heading</label>
            <input
              type="text"
              value={localContent.heading || ''}
              onChange={(e) => handleContentChange('heading', e.target.value)}
            />
          </div>
          <div className="wb-editor-field">
            <label>Subheading</label>
            <textarea
              value={localContent.subheading || ''}
              onChange={(e) => handleContentChange('subheading', e.target.value)}
            />
          </div>
          <div className="wb-editor-field">
            <label>Button Text</label>
            <input
              type="text"
              value={localContent.buttonText || ''}
              onChange={(e) => handleContentChange('buttonText', e.target.value)}
            />
          </div>
        </>
      )}

      <button className="wb-btn wb-btn-primary wb-btn-full" onClick={handleSave}>
        💾 Save Changes
      </button>
    </div>
  );
};

// Upload Template Modal
const UploadTemplateModal: React.FC<{ onClose: () => void; onUpload: (data: any) => void }> = ({ onClose, onUpload }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('modern');
  const [jsonStructure, setJsonStructure] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [secondaryColor, setSecondaryColor] = useState('#1e40af');
  const [accentColor, setAccentColor] = useState('#60a5fa');

  const handleSubmit = () => {
    try {
      const structure = JSON.parse(jsonStructure);
      onUpload({
        name,
        description,
        category,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
        thumbnail: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        font_family: 'Inter, sans-serif',
        structure
      });
    } catch (e) {
      alert('Invalid JSON structure');
    }
  };

  return (
    <div className="wb-modal-overlay" onClick={onClose}>
      <div className="wb-modal wb-modal-large" onClick={e => e.stopPropagation()}>
        <div className="wb-modal-header">
          <h3>📤 Upload Custom Template</h3>
          <button onClick={onClose}>×</button>
        </div>
        <div className="wb-modal-body">
          <div className="wb-editor-field">
            <label>Template Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="My Custom Template" />
          </div>
          <div className="wb-editor-field">
            <label>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Template description..." />
          </div>
          <div className="wb-editor-field">
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="modern">Modern</option>
              <option value="classic">Classic</option>
              <option value="minimal">Minimal</option>
              <option value="vibrant">Vibrant</option>
              <option value="professional">Professional</option>
            </select>
          </div>
          <div className="wb-color-row">
            <div className="wb-editor-field">
              <label>Primary</label>
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
            </div>
            <div className="wb-editor-field">
              <label>Secondary</label>
              <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} />
            </div>
            <div className="wb-editor-field">
              <label>Accent</label>
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} />
            </div>
          </div>
          <div className="wb-editor-field">
            <label>Template Structure (JSON) *</label>
            <textarea
              className="wb-json-input"
              value={jsonStructure}
              onChange={e => setJsonStructure(e.target.value)}
              placeholder='{"pages": [{"title": "Home", "slug": "home", "page_type": "HOME", "sections": [...]}]}'
            />
          </div>
        </div>
        <div className="wb-modal-footer">
          <button className="wb-btn wb-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="wb-btn wb-btn-primary" onClick={handleSubmit} disabled={!name || !jsonStructure}>Upload Template</button>
        </div>
      </div>
    </div>
  );
};

export default WebsiteBuilder;
