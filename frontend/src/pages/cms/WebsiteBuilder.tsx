/**
 * Website Builder - Premium Visual Editor for School Websites
 * Complete redesign with template gallery, drag-and-drop, and live preview
 */

import React, { useState, useEffect, useCallback } from 'react';
import './WebsiteBuilder.css';
import { WEBSITE_TEMPLATES, TEMPLATE_CATEGORIES, WebsiteTemplate, TemplateSection, TemplatePage } from './websiteTemplates';
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
  page?: string;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  page_type: string;
  sections: Section[];
}

interface Website {
  id: string;
  site_title: string;
  subdomain: string;
  is_published: boolean;
  theme?: any;
  primary_color?: string;
  font_family?: string;
}

// Component Icons
const SECTION_TYPES = [
  { type: 'HERO', label: 'Hero Banner', icon: '🎯', desc: 'Full-width header with CTA' },
  { type: 'FEATURES', label: 'Features Grid', icon: '✨', desc: '4-column feature cards' },
  { type: 'STATS', label: 'Statistics', icon: '📊', desc: 'Key numbers display' },
  { type: 'PRINCIPAL_MESSAGE', label: 'Principal Message', icon: '👨‍🏫', desc: 'Quote with image' },
  { type: 'GALLERY', label: 'Photo Gallery', icon: '📸', desc: 'Image grid display' },
  { type: 'TESTIMONIALS', label: 'Testimonials', icon: '💬', desc: 'Parent/student quotes' },
  { type: 'CTA', label: 'Call to Action', icon: '🚀', desc: 'Action banner' },
  { type: 'NEWS', label: 'News Feed', icon: '📰', desc: 'Latest updates' },
  { type: 'EVENTS', label: 'Events', icon: '📅', desc: 'Upcoming events' },
  { type: 'FACULTY', label: 'Faculty Grid', icon: '👥', desc: 'Teacher profiles' },
  { type: 'CONTACT', label: 'Contact Form', icon: '📧', desc: 'Get in touch' },
  { type: 'MAP', label: 'Location Map', icon: '📍', desc: 'Google Maps embed' },
  { type: 'TEXT_BLOCK', label: 'Text Content', icon: '📝', desc: 'Rich text area' },
  { type: 'VIDEO', label: 'Video Section', icon: '🎬', desc: 'YouTube/Vimeo embed' },
  { type: 'FAQ', label: 'FAQ Accordion', icon: '❓', desc: 'Questions & answers' },
];

const WebsiteBuilder: React.FC = () => {
  // State
  const [step, setStep] = useState<'templates' | 'editor'>('templates');
  const [website, setWebsite] = useState<Website | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WebsiteTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templateCategory, setTemplateCategory] = useState('all');
  const [templateSearch, setTemplateSearch] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [undoStack, setUndoStack] = useState<Page[][]>([]);

  // Fetch existing website on mount
  useEffect(() => {
    fetchWebsiteData();
  }, []);

  const fetchWebsiteData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/cms/websites/');
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      if (data.length > 0) {
        const site = data[0];
        setWebsite({
          ...site,
          site_title: site.name,
          subdomain: site.domain
        });
        // Fetch pages
        const pagesRes = await api.get(`/cms/pages/?website=${data[0].id}`);
        const pagesData = Array.isArray(pagesRes.data) ? pagesRes.data : pagesRes.data.results || [];
        setPages(pagesData);
        if (pagesData.length > 0) {
          setSelectedPage(pagesData[0]);
          setStep('editor');
        }
      }
    } catch (error) {
      console.error('Error fetching website:', error);
    } finally {
      setLoading(false);
    }
  };

  // Template filtering
  const filteredTemplates = WEBSITE_TEMPLATES.filter(t => {
    const matchesCategory = templateCategory === 'all' || t.category === templateCategory;
    const matchesSearch = t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.description.toLowerCase().includes(templateSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Apply template
  const applyTemplate = async (template: WebsiteTemplate) => {
    setLoading(true);
    try {
      // Create or update website
      let siteId = website?.id;
      if (!siteId) {
        const subdomain = template.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
        const siteRes = await api.post('/cms/websites/', {
          name: template.name, // Fixed field name
          domain: `${subdomain}-${Math.floor(Math.random() * 1000)}`,
          primary_color: template.primaryColor,
          font_family: template.fontFamily
        });
        siteId = siteRes.data.id;
        setWebsite({ ...siteRes.data, site_title: siteRes.data.name, subdomain: siteRes.data.domain });
      }

      // Create pages and sections from template
      const createdPages: Page[] = [];
      for (const templatePage of template.pages) {
        // Handle slug conflict
        let currentSlug = templatePage.slug;
        let pageRes;

        try {
          pageRes = await api.post('/cms/pages/', {
            website: siteId,
            title: templatePage.title,
            slug: currentSlug,
            page_type: templatePage.page_type,
            menu_order: createdPages.length // Fixed field name
          });
        } catch (err: any) {
          if (err.response?.status === 400) {
            // Try unique slug
            currentSlug = `${templatePage.slug}-${Math.floor(Math.random() * 1000)}`;
            pageRes = await api.post('/cms/pages/', {
              website: siteId,
              title: templatePage.title,
              slug: currentSlug,
              page_type: templatePage.page_type,
              menu_order: createdPages.length
            });
          } else {
            throw err;
          }
        }

        const pageId = pageRes.data.id;
        const createdSections: Section[] = [];

        for (const templateSection of templatePage.sections) {
          const sectionRes = await api.post('/cms/sections/', {
            page: pageId,
            section_type: templateSection.component_type, // Fixed field name
            title: templateSection.title,
            content: templateSection.content,
            order: templateSection.order,
            is_active: true,
            background_color: templateSection.background_color,
            text_color: templateSection.text_color
          });
          createdSections.push(sectionRes.data);
        }

        createdPages.push({ ...pageRes.data, sections: createdSections });
      }

      setPages(createdPages);
      if (createdPages.length > 0) {
        setSelectedPage(createdPages[0]);
      }
      setSelectedTemplate(template);
      setStep('editor');
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Failed to apply template. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Section management
  const addSection = async (type: string) => {
    if (!selectedPage) return;

    const sectionConfig = SECTION_TYPES.find(s => s.type === type);
    const newSection: Partial<Section> = {
      page: selectedPage.id,
      component_type: type,
      title: sectionConfig?.label || 'New Section',
      content: getDefaultContent(type),
      order: selectedPage.sections.length,
      is_visible: true
    };

    try {
      const response = await api.post('/cms/sections/', newSection);
      const updatedSections = [...selectedPage.sections, response.data];
      const updatedPage = { ...selectedPage, sections: updatedSections };
      setSelectedPage(updatedPage);
      setPages(pages.map(p => p.id === selectedPage.id ? updatedPage : p));
      setSelectedSection(response.data);
      setShowAddSection(false);
    } catch (error) {
      console.error('Error adding section:', error);
    }
  };

  const updateSection = async (sectionId: string, updates: Partial<Section>) => {
    if (!selectedPage) return;

    // Optimistic update
    const updatedSections = selectedPage.sections.map(s =>
      s.id === sectionId ? { ...s, ...updates } : s
    );
    const updatedPage = { ...selectedPage, sections: updatedSections };
    setSelectedPage(updatedPage);
    if (selectedSection?.id === sectionId) {
      setSelectedSection({ ...selectedSection, ...updates });
    }

    try {
      await api.patch(`/cms/sections/${sectionId}/`, updates);
    } catch (error) {
      console.error('Error updating section:', error);
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!selectedPage || !confirm('Delete this section?')) return;

    try {
      await api.delete(`/cms/sections/${sectionId}/`);
      const updatedSections = selectedPage.sections.filter(s => s.id !== sectionId);
      const updatedPage = { ...selectedPage, sections: updatedSections };
      setSelectedPage(updatedPage);
      setPages(pages.map(p => p.id === selectedPage.id ? updatedPage : p));
      if (selectedSection?.id === sectionId) {
        setSelectedSection(null);
      }
    } catch (error) {
      console.error('Error deleting section:', error);
    }
  };

  const moveSection = async (sectionId: string, direction: 'up' | 'down') => {
    if (!selectedPage) return;

    const sections = [...selectedPage.sections];
    const index = sections.findIndex(s => s.id === sectionId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
    sections.forEach((s, i) => s.order = i);

    const updatedPage = { ...selectedPage, sections };
    setSelectedPage(updatedPage);

    // Persist order changes
    try {
      await Promise.all(sections.map(s =>
        api.patch(`/cms/sections/${s.id}/`, { order: s.order })
      ));
    } catch (error) {
      console.error('Error reordering sections:', error);
    }
  };

  const duplicateSection = async (section: Section) => {
    if (!selectedPage) return;

    const newSection = {
      ...section,
      id: undefined,
      title: `${section.title} (Copy)`,
      order: selectedPage.sections.length
    };

    try {
      const response = await api.post('/cms/sections/', newSection);
      const updatedSections = [...selectedPage.sections, response.data];
      const updatedPage = { ...selectedPage, sections: updatedSections };
      setSelectedPage(updatedPage);
      setPages(pages.map(p => p.id === selectedPage.id ? updatedPage : p));
    } catch (error) {
      console.error('Error duplicating section:', error);
    }
  };

  // Page management
  const addPage = async () => {
    if (!website) return;
    const title = prompt('Enter page title:');
    if (!title) return;

    try {
      const response = await api.post('/cms/pages/', {
        website: website.id,
        title,
        slug: title.toLowerCase().replace(/\s+/g, '-'),
        page_type: 'CUSTOM',
        order: pages.length
      });
      setPages([...pages, { ...response.data, sections: [] }]);
    } catch (error) {
      console.error('Error adding page:', error);
    }
  };

  // Publish
  const handlePublish = async () => {
    if (!website) return;
    setSaving(true);
    try {
      await api.post(`/cms/websites/${website.id}/publish/`);
      setWebsite({ ...website, is_published: true });
      alert('🎉 Website published successfully!');
    } catch (error) {
      console.error('Error publishing:', error);
      alert('Failed to publish. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Default content generator
  const getDefaultContent = (type: string) => {
    const defaults: Record<string, any> = {
      HERO: { heading: 'Welcome to Our School', subheading: 'Excellence in Education', buttonText: 'Learn More', buttonLink: '/about' },
      FEATURES: { heading: 'Why Choose Us', features: [{ icon: '🎓', title: 'Feature 1', description: 'Description' }] },
      STATS: { stats: [{ value: '100+', label: 'Students' }] },
      PRINCIPAL_MESSAGE: { name: 'Principal Name', message: 'Welcome message...', designation: 'Principal' },
      GALLERY: { heading: 'Photo Gallery', images: [] },
      TESTIMONIALS: { heading: 'What Parents Say', testimonials: [] },
      CTA: { heading: 'Get Started Today', buttonText: 'Apply Now', buttonLink: '/apply' },
      NEWS: { heading: 'Latest News' },
      EVENTS: { heading: 'Upcoming Events' },
      FACULTY: { heading: 'Our Faculty' },
      CONTACT: { address: 'School Address', phone: '+1234567890', email: 'info@school.edu' },
      TEXT_BLOCK: { text: 'Enter your content here...' },
      VIDEO: { heading: 'Watch Our Story', videoUrl: '' },
      FAQ: { heading: 'Frequently Asked Questions', items: [] }
    };
    return defaults[type] || {};
  };

  // ==============================
  // RENDER: Template Gallery
  // ==============================
  if (step === 'templates') {
    return (
      <div className="website-builder">
        <div className="template-gallery">
          {/* Gallery Header */}
          <div className="gallery-header">
            <div className="gallery-header-content">
              <h1>🌐 Choose Your Website Template</h1>
              <p>Select a professional template to get started. Customize everything later.</p>
            </div>
            {website && (
              <button className="btn-secondary" onClick={() => setStep('editor')}>
                ← Back to Editor
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="gallery-filters">
            <div className="filter-categories">
              {TEMPLATE_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  className={`filter-btn ${templateCategory === cat.value ? 'active' : ''}`}
                  onClick={() => setTemplateCategory(cat.value)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="filter-search">
              <input
                type="text"
                placeholder="🔍 Search templates..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Template Grid */}
          <div className="template-grid">
            {filteredTemplates.map(template => (
              <div key={template.id} className="template-card">
                <div
                  className="template-preview"
                  style={{ background: template.thumbnail }}
                >
                  <div className="template-overlay">
                    <button
                      className="btn-use-template"
                      onClick={() => applyTemplate(template)}
                      disabled={loading}
                    >
                      {loading ? 'Applying...' : 'Use Template'}
                    </button>
                    <button className="btn-preview-template">
                      👁️ Preview
                    </button>
                  </div>
                </div>
                <div className="template-info">
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                  <div className="template-meta">
                    <span className="template-category">{template.category}</span>
                    <span className="template-pages">{template.pages.length} pages</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="no-templates">
              <p>No templates match your search. Try different keywords.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==============================
  // RENDER: Website Editor
  // ==============================
  return (
    <div className={`website-builder ${previewMode ? 'preview-mode' : ''}`}>
      {/* Top Bar */}
      <div className="builder-header">
        <div className="header-left">
          <div className="header-logo-group">
            <div className="creative-logo">
              <span className="dot dot-1"></span>
              <span className="dot dot-2"></span>
              <span className="dot dot-3"></span>
              <span className="dot dot-4"></span>
            </div>
            <h1 className="builder-title">Website Builder</h1>
          </div>
          <div className="subdomain-box">
            <span className="prefix">.</span>
            <span className="domain">nucleiq.app</span>
          </div>
        </div>

        <div className="header-center">
          <div className="viewport-controls">
            <button className={viewMode === 'desktop' ? 'active' : ''} onClick={() => setViewMode('desktop')}>
              💻
            </button>
            <button className={viewMode === 'tablet' ? 'active' : ''} onClick={() => setViewMode('tablet')}>
              📱
            </button>
            <button className={viewMode === 'mobile' ? 'active' : ''} onClick={() => setViewMode('mobile')}>
              📲
            </button>
          </div>
        </div>

        <div className="header-right">
          <button className="btn-templates-header" onClick={() => setStep('templates')}>
            📚 Templates
          </button>
          <button className={`btn-action-preview ${previewMode ? 'active' : ''}`} onClick={() => setPreviewMode(!previewMode)}>
            <span className="icon">👁️</span> Preview
          </button>
          <button className="btn-action-live" onClick={() => window.open(`/public/${website?.subdomain}`, '_blank')}>
            <span className="icon">🌐</span> View Live
          </button>
          <button className="btn-action-publish" onClick={handlePublish} disabled={saving}>
            <span className="icon">🚀</span> {saving ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="builder-workspace">
        {/* Sidebar */}
        {!previewMode && (
          <div className="builder-sidebar">
            <div className="sidebar-group">
              <div className="group-header">
                <span className="icon">📑</span>
                <h3>PAGES</h3>
                <button className="btn-add-circle" onClick={addPage}>+</button>
              </div>
              <ul className="page-items">
                {pages.map(page => (
                  <li
                    key={page.id}
                    className={selectedPage?.id === page.id ? 'selected' : ''}
                    onClick={() => { setSelectedPage(page); setSelectedSection(null); }}
                  >
                    <span className="title">{page.title}</span>
                    <span className="badge">{page.sections?.length || 0}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sidebar-group">
              <div className="group-header">
                <span className="icon">🧱</span>
                <h3>SECTIONS</h3>
                <button className="btn-add-circle" onClick={() => setShowAddSection(true)}>+</button>
              </div>
              {selectedPage && (
                <div className="section-container">
                  {(!selectedPage.sections || selectedPage.sections.length === 0) ? (
                    <div className="empty-sidebar-info">
                      <p>Add sections or</p>
                      <button className="btn-text-link" onClick={() => setStep('templates')}>
                        Use Template
                      </button>
                    </div>
                  ) : (
                    <ul className="section-items">
                      {selectedPage.sections?.sort((a, b) => a.order - b.order).map(section => (
                        <li
                          key={section.id}
                          className={selectedSection?.id === section.id ? 'selected' : ''}
                          onClick={() => setSelectedSection(section)}
                        >
                          <span className="icon">
                            {SECTION_TYPES.find(s => s.type === section.component_type)?.icon || '📦'}
                          </span>
                          <span className="name">{section.title}</span>
                          <div className="section-item-actions">
                            <button onClick={(e) => { e.stopPropagation(); moveSection(section.id!, 'up'); }}>↑</button>
                            <button onClick={(e) => { e.stopPropagation(); moveSection(section.id!, 'down'); }}>↓</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Properties Editor */}
            {selectedSection && (
              <div className="sidebar-section properties-panel">
                <div className="sidebar-header">
                  <h3>⚙️ Properties</h3>
                  <div className="property-actions">
                    <button title="Duplicate" onClick={() => duplicateSection(selectedSection)}>📋</button>
                    <button title="Delete" onClick={() => deleteSection(selectedSection.id!)}>🗑️</button>
                  </div>
                </div>
                <div className="property-form">
                  <div className="form-group">
                    <label>Section Title</label>
                    <input
                      type="text"
                      value={selectedSection.title}
                      onChange={(e) => updateSection(selectedSection.id!, { title: e.target.value })}
                    />
                  </div>

                  {/* Dynamic content fields */}
                  {Object.entries(selectedSection.content || {}).map(([key, value]) => (
                    <div className="form-group" key={key}>
                      <label>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                      {typeof value === 'string' ? (
                        key.includes('message') || key.includes('text') || key.includes('description') ? (
                          <textarea
                            value={value}
                            onChange={(e) => updateSection(selectedSection.id!, {
                              content: { ...selectedSection.content, [key]: e.target.value }
                            })}
                            rows={4}
                          />
                        ) : (
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => updateSection(selectedSection.id!, {
                              content: { ...selectedSection.content, [key]: e.target.value }
                            })}
                          />
                        )
                      ) : null}
                    </div>
                  ))}

                  <div className="style-group">
                    <h4>Styling</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Background</label>
                        <input
                          type="color"
                          value={selectedSection.background_color || '#ffffff'}
                          onChange={(e) => updateSection(selectedSection.id!, { background_color: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Text Color</label>
                        <input
                          type="color"
                          value={selectedSection.text_color || '#000000'}
                          onChange={(e) => updateSection(selectedSection.id!, { text_color: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Canvas */}
        <div className="builder-canvas-wrapper">
          <div className={`builder-canvas ${viewMode}`}>
            {selectedPage ? (
              <div className="preview-page">
                {selectedPage.sections?.sort((a, b) => a.order - b.order).map(section => (
                  <div
                    key={section.id}
                    className={`preview-section ${selectedSection?.id === section.id ? 'selected' : ''} ${!previewMode ? 'editable' : ''}`}
                    onClick={() => !previewMode && setSelectedSection(section)}
                    style={{
                      backgroundColor: section.background_color || 'transparent',
                      color: section.text_color || 'inherit',
                      backgroundImage: section.background_image ? `url(${section.background_image})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {!previewMode && (
                      <div className="section-toolbar">
                        <span className="section-type-badge">
                          {SECTION_TYPES.find(s => s.type === section.component_type)?.icon} {section.component_type}
                        </span>
                      </div>
                    )}
                    {renderSectionPreview(section)}
                  </div>
                ))}

                {(!selectedPage.sections || selectedPage.sections.length === 0) && (
                  <div className="empty-page">
                    <div className="empty-icon">📄</div>
                    <h3>This page is empty</h3>
                    <p>Start building your page by adding sections or choose a ready-made template</p>
                    <div className="empty-page-actions">
                      <button className="btn-browse-templates" onClick={() => setStep('templates')}>
                        🎨 Browse Templates
                      </button>
                      <button className="btn-add-section" onClick={() => setShowAddSection(true)}>
                        + Add Section Manually
                      </button>
                    </div>
                  </div>
                )}

                {/* Add Section Button at bottom */}
                {selectedPage.sections?.length > 0 && !previewMode && (
                  <div className="add-section-bar">
                    <button onClick={() => setShowAddSection(true)}>+ Add Section</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-page-selected">
                <p>Select a page to start editing</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Section Modal */}
      {showAddSection && (
        <div className="modal-overlay" onClick={() => setShowAddSection(false)}>
          <div className="modal add-section-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Section</h2>
              <button className="btn-close" onClick={() => setShowAddSection(false)}>×</button>
            </div>
            <div className="section-types-grid">
              {SECTION_TYPES.map(type => (
                <button
                  key={type.type}
                  className="section-type-card"
                  onClick={() => addSection(type.type)}
                >
                  <span className="section-type-icon">{type.icon}</span>
                  <span className="section-type-label">{type.label}</span>
                  <span className="section-type-desc">{type.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Section Preview Renderer
const renderSectionPreview = (section: Section) => {
  const { component_type, content } = section;

  switch (component_type) {
    case 'HERO':
      return (
        <div className="hero-section">
          <div className="hero-content">
            <h1>{content?.heading || 'Hero Heading'}</h1>
            <p>{content?.subheading || 'Subheading text'}</p>
            <div className="hero-buttons">
              <button className="btn-primary">{content?.buttonText || 'Learn More'}</button>
              {content?.secondaryButtonText && (
                <button className="btn-secondary">{content.secondaryButtonText}</button>
              )}
            </div>
          </div>
        </div>
      );

    case 'FEATURES':
      return (
        <div className="features-section">
          <h2>{content?.heading || 'Features'}</h2>
          <div className="features-grid">
            {(content?.features || []).slice(0, 4).map((feature: any, i: number) => (
              <div key={i} className="feature-card">
                <span className="feature-icon">{feature.icon || '✨'}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'STATS':
      return (
        <div className="stats-section">
          <div className="stats-grid">
            {(content?.stats || []).map((stat: any, i: number) => (
              <div key={i} className="stat-item">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'PRINCIPAL_MESSAGE':
      return (
        <div className="principal-section">
          <div className="principal-image">
            {content?.image ? (
              <img src={content.image} alt={content.name} />
            ) : (
              <div className="placeholder-avatar">👤</div>
            )}
          </div>
          <div className="principal-content">
            <h3>{content?.name || 'Principal Name'}</h3>
            <span className="designation">{content?.designation || 'Principal'}</span>
            <blockquote>{content?.message || 'Welcome message...'}</blockquote>
          </div>
        </div>
      );

    case 'CTA':
      return (
        <div className="cta-section">
          <h2>{content?.heading || 'Call to Action'}</h2>
          <p>{content?.subheading}</p>
          <button className="btn-primary">{content?.buttonText || 'Get Started'}</button>
        </div>
      );

    case 'GALLERY':
      return (
        <div className="gallery-section">
          <h2>{content?.heading || 'Gallery'}</h2>
          <div className="gallery-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="gallery-placeholder">📷</div>
            ))}
          </div>
        </div>
      );

    case 'TESTIMONIALS':
      return (
        <div className="testimonials-section">
          <h2>{content?.heading || 'Testimonials'}</h2>
          <div className="testimonials-grid">
            {(content?.testimonials || [{ name: 'Parent', quote: 'Great school!' }]).map((t: any, i: number) => (
              <div key={i} className="testimonial-card">
                <blockquote>"{t.quote}"</blockquote>
                <cite>— {t.name}, {t.role || 'Parent'}</cite>
              </div>
            ))}
          </div>
        </div>
      );

    case 'CONTACT':
      return (
        <div className="contact-section">
          <div className="contact-info">
            <h2>Contact Us</h2>
            <p>📍 {content?.address || 'Address'}</p>
            <p>📞 {content?.phone || 'Phone'}</p>
            <p>✉️ {content?.email || 'Email'}</p>
          </div>
          <div className="contact-form-preview">
            <div className="form-placeholder">
              <input type="text" placeholder="Your Name" disabled />
              <input type="email" placeholder="Your Email" disabled />
              <textarea placeholder="Your Message" disabled />
              <button className="btn-primary" disabled>Send Message</button>
            </div>
          </div>
        </div>
      );

    case 'TEXT_BLOCK':
      return (
        <div className="text-section">
          <p>{content?.text || 'Enter your content here...'}</p>
        </div>
      );

    case 'FAQ':
      return (
        <div className="faq-section">
          <h2>{content?.heading || 'FAQ'}</h2>
          <div className="faq-list">
            {(content?.items || [{ question: 'Sample Question?', answer: 'Sample answer.' }]).map((item: any, i: number) => (
              <div key={i} className="faq-item">
                <h4>{item.question}</h4>
                <p>{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'PAGE_HEADER':
      return (
        <div className="page-header-section">
          <h1>{content?.heading || 'Page Title'}</h1>
          <p className="breadcrumb">{content?.breadcrumb || 'Home > Page'}</p>
        </div>
      );

    case 'TEXT_WITH_IMAGE':
      return (
        <div className="text-image-section">
          <div className="text-image-container">
            <div className="ti-text">
              <h2>{content?.heading || 'Section Title'}</h2>
              <p>{content?.text || 'Section content goes here...'}</p>
            </div>
            <div className="ti-image">
              <div className="img-placeholder">🖼️</div>
            </div>
          </div>
        </div>
      );

    case 'MISSION_VISION':
      return (
        <div className="mission-vision-section">
          <div className="mv-grid">
            <div className="mv-card">
              <h3>Mission</h3>
              <p>{content?.mission}</p>
            </div>
            <div className="mv-card">
              <h3>Vision</h3>
              <p>{content?.vision}</p>
            </div>
          </div>
          {content?.values && (
            <div className="values-list">
              <h3>Our Values</h3>
              <ul>
                {content.values.map((v: string, i: number) => <li key={i}>{v}</li>)}
              </ul>
            </div>
          )}
        </div>
      );

    case 'IMAGE_GRID':
      return (
        <div className="image-grid-section">
          <div className={`grid cols-${content?.columns || 3}`}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="grid-item">🖼️</div>
            ))}
          </div>
        </div>
      );

    case 'TIMELINE':
      return (
        <div className="timeline-section">
          <h2>{content?.heading || 'Our Journey'}</h2>
          <div className="timeline-list">
            {(content?.events || []).map((ev: any, i: number) => (
              <div key={i} className="timeline-item">
                <div className="year">{ev.year}</div>
                <div className="details">
                  <h4>{ev.title}</h4>
                  <p>{ev.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'PROGRAMS':
      return (
        <div className="programs-section">
          <h2>{content?.heading || 'Our Programs'}</h2>
          <div className="programs-grid">
            {(content?.programs || []).map((p: any, i: number) => (
              <div key={i} className="program-card">
                <h3>{p.name}</h3>
                <p>{p.description}</p>
                <span className="age">{p.ages}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'MAP':
      return (
        <div className="map-section">
          <div className="map-container">
            <div className="map-placeholder">
              📍 Map Location
              <p>{content?.description}</p>
            </div>
          </div>
        </div>
      );

    case 'NEWS':
      return (
        <div className="news-section">
          <h2>{content?.heading || 'Latest News'}</h2>
          <div className="news-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="news-card">
                <div className="news-date">Jan {10 + i}, 2024</div>
                <h3>Sample News Title {i}</h3>
                <p>This is a preview of the school news update...</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'EVENTS':
      return (
        <div className="events-section">
          <h2>{content?.heading || 'Upcoming Events'}</h2>
          <div className="events-list">
            {[1, 2].map(i => (
              <div key={i} className="event-item-preview">
                <div className="event-date">
                  <span className="day">{15 + i}</span>
                  <span className="month">FEB</span>
                </div>
                <div className="event-info">
                  <h3>Annual Sports Meet {i}</h3>
                  <p>Join us for our annual day celebrations.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'FACULTY':
      return (
        <div className="faculty-section">
          <h2>{content?.heading || 'Our Faculty'}</h2>
          <div className="faculty-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="faculty-card">
                <div className="faculty-avatar">👤</div>
                <h3>Teacher Name {i}</h3>
                <p>Department Head</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'VIDEO':
      return (
        <div className="video-section">
          <h2>{content?.heading || 'Watch Our Story'}</h2>
          <div className="video-container">
            <div className="video-placeholder">
              <span>▶️ Play Video</span>
              <p>{content?.videoUrl || 'No video URL provided'}</p>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="generic-section">
          <h3>{section.title}</h3>
          <p className="section-type-label">{component_type}</p>
        </div>
      );
  }
};

export default WebsiteBuilder;
