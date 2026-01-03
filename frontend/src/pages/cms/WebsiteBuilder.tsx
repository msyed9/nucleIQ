/**
 * Website Builder - Visual editor for school websites
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './WebsiteBuilder.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Types
interface Section {
  id?: string;
  component_type: string;
  title: string;
  content: any; // Dynamic JSON
  order: number;
  is_visible: boolean;
  background_color?: string;
  text_color?: string;
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
}

const WebsiteBuilder: React.FC = () => {
  const [website, setWebsite] = useState<Website | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [viewMode, setViewMode] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    fetchWebsiteData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    const tenantId = localStorage.getItem('tenant_id');
    return {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': tenantId || '',
    };
  };

  const fetchWebsiteData = async () => {
    setLoading(true);
    try {
      // 1. Get Website
      const siteRes = await axios.get(`${API_BASE_URL}/cms/websites/`, { headers: getAuthHeaders() });
      if (siteRes.data.results && siteRes.data.results.length > 0) {
        setWebsite(siteRes.data.results[0]);

        // 2. Get Pages
        const pagesRes = await axios.get(
          `${API_BASE_URL}/cms/pages/?website=${siteRes.data.results[0].id}`,
          { headers: getAuthHeaders() }
        );
        setPages(pagesRes.data.results);
        if (pagesRes.data.results.length > 0) {
          setSelectedPage(pagesRes.data.results[0]);
        }
      } else {
        // Handle case where website doesn't exist yet (create default)
        createDefaultWebsite();
      }
    } catch (err) {
      console.error('Error fetching builder data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultWebsite = async () => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/cms/websites/`,
        {
          site_title: 'My School',
          subdomain: `school-${Math.floor(Math.random() * 1000)}`,
          theme: null // Default theme
        },
        { headers: getAuthHeaders() }
      );
      setWebsite(res.data);
      // Create default Home page
      const pageRes = await axios.post(
        `${API_BASE_URL}/cms/pages/`,
        {
          website: res.data.id,
          title: 'Home',
          slug: 'home',
          page_type: 'HOME',
          order: 0
        },
        { headers: getAuthHeaders() }
      );
      setPages([pageRes.data]);
      setSelectedPage(pageRes.data);
    } catch (err) {
      console.error('Error creating default site:', err);
    }
  };

  // Section Management
  const handleAddSection = async (type: string) => {
    if (!selectedPage) return;

    const newSection: Partial<Section> = {
      page: selectedPage.id,
      component_type: type,
      title: 'New Section',
      content: getDefaultContentForType(type),
      order: selectedPage.sections.length,
      is_visible: true
    };

    try {
      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const sectionWithTempId = { ...newSection, id: tempId } as Section;

      const updatedPage = { ...selectedPage, sections: [...selectedPage.sections, sectionWithTempId] };
      setSelectedPage(updatedPage);
      setPages(pages.map(p => p.id === selectedPage.id ? updatedPage : p));

      // API call
      await axios.post(
        `${API_BASE_URL}/cms/sections/`,
        { ...newSection, page: selectedPage.id },
        { headers: getAuthHeaders() }
      );

      // Refresh to get real ID
      fetchWebsiteData();
    } catch (err) {
      console.error('Error adding section:', err);
    }
  };

  const handleUpdateSection = async (sectionId: string, updates: Partial<Section>) => {
    // Optimistic Update
    if (!selectedPage) return;

    const updatedSections = selectedPage.sections.map(s =>
      s.id === sectionId ? { ...s, ...updates } : s
    );

    const updatedPage = { ...selectedPage, sections: updatedSections };
    setSelectedPage(updatedPage);
    setSelectedSection({ ...selectedSection, ...updates } as Section); // Update editor view

    // API Call (Debounce in production, direct for now)
    try {
      await axios.patch(
        `${API_BASE_URL}/cms/sections/${sectionId}/`,
        updates,
        { headers: getAuthHeaders() }
      );
    } catch (err) {
      console.error('Error updating section:', err);
    }
  };

  const handlePublish = async () => {
    if (!website) return;
    setSaving(true);
    try {
      await axios.post(
        `${API_BASE_URL}/cms/websites/${website.id}/publish/`,
        {},
        { headers: getAuthHeaders() }
      );
      alert('Website Published Successfully!');
      setWebsite({ ...website, is_published: true });
    } catch (err) {
      console.error('Error publishing:', err);
      alert('Failed to publish website.');
    } finally {
      setSaving(false);
    }
  };

  // Helper: Default Content
  const getDefaultContentForType = (type: string) => {
    switch (type) {
      case 'HERO':
        return { heading: 'Welcome to Our School', subheading: 'Empowering Future Leaders', buttonText: 'Apply Now', buttonLink: '/admissions', image: '' };
      case 'PRINCIPAL_MESSAGE':
        return { name: 'Dr. Principal', message: 'Welcome to a place of learning...', image: '' };
      case 'text': // Fallback
        return { text: 'Insert text here...' };
      default:
        return {};
    }
  };

  // Renderers
  const renderEditorPanel = () => {
    if (!selectedSection) return <div className="editor-placeholder">Select a section to edit</div>;

    const type = selectedSection.component_type;

    return (
      <div className="section-editor">
        <h3>Edit {type.replace('_', ' ')}</h3>

        <div className="form-group">
          <label>Title</label>
          <input
            value={selectedSection.title}
            onChange={(e) => handleUpdateSection(selectedSection.id!, { title: e.target.value })}
          />
        </div>

        {/* Dynamic Fields based on Content */}
        {Object.keys(selectedSection.content || {}).map((key) => (
          <div className="form-group" key={key}>
            <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
            {key === 'message' || key === 'text' ? (
              <textarea
                value={selectedSection.content[key]}
                onChange={(e) => handleUpdateSection(selectedSection.id!, { content: { ...selectedSection.content, [key]: e.target.value } })}
              />
            ) : (
              <input
                value={selectedSection.content[key]}
                onChange={(e) => handleUpdateSection(selectedSection.id!, { content: { ...selectedSection.content, [key]: e.target.value } })}
              />
            )}
          </div>
        ))}

        <div className="style-editor">
          <h4>Styling</h4>
          <div className="form-group">
            <label>Background Color</label>
            <input
              type="color"
              value={selectedSection.background_color || '#ffffff'}
              onChange={(e) => handleUpdateSection(selectedSection.id!, { background_color: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Text Color</label>
            <input
              type="color"
              value={selectedSection.text_color || '#000000'}
              onChange={(e) => handleUpdateSection(selectedSection.id!, { text_color: e.target.value })}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="website-builder">
      {/* Top Bar */}
      <div className="builder-header">
        <div className="header-left">
          <h2>🌐 Site Builder</h2>
          <span className="site-url">{website ? `${website.subdomain}.nucleiq.com` : 'Loading...'}</span>
        </div>
        <div className="header-center">
          <div className="view-toggle">
            <button
              className={viewMode === 'DESKTOP' ? 'active' : ''}
              onClick={() => setViewMode('DESKTOP')}
            >💻 Desktop</button>
            <button
              className={viewMode === 'MOBILE' ? 'active' : ''}
              onClick={() => setViewMode('MOBILE')}
            >📱 Mobile</button>
          </div>
        </div>
        <div className="header-right">
          <button className="btn-preview" onClick={() => window.open(`/public/${website?.subdomain}`, '_blank')}>👁️ Live Site</button>
          <button className="btn-publish" onClick={handlePublish} disabled={saving}>
            {saving ? 'Publishing...' : '🚀 Publish'}
          </button>
        </div>
      </div>

      <div className="builder-workspace">
        {/* Sidebar: Pages & Sections */}
        <div className="builder-sidebar">
          <div className="sidebar-section">
            <h3>📑 Pages</h3>
            <ul className="page-list">
              {pages.map(page => (
                <li
                  key={page.id}
                  className={selectedPage?.id === page.id ? 'active' : ''}
                  onClick={() => setSelectedPage(page)}
                >
                  {page.title}
                </li>
              ))}
              <li className="add-page">+ Add Page</li>
            </ul>
          </div>

          <div className="sidebar-section">
            <h3>🧱 Components</h3>
            <div className="component-grid">
              <button onClick={() => handleAddSection('HERO')}>Hero Banner</button>
              <button onClick={() => handleAddSection('PRINCIPAL_MESSAGE')}>Principal Msg</button>
              <button onClick={() => handleAddSection('FACULTY')}>Faculty Grid</button>
              <button onClick={() => handleAddSection('NEWS')}>News Feed</button>
              <button onClick={() => handleAddSection('CONTACT')}>Contact Form</button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>🔧 Properties</h3>
            {renderEditorPanel()}
          </div>
        </div>

        {/* Main Preview Area */}
        <div className="builder-canvas-wrapper">
          <div className={`builder-canvas ${viewMode.toLowerCase()}`}>
            {selectedPage ? (
              <div className="preview-page">
                {/* Recursive Section Rendering for Preview */}
                {selectedPage.sections?.sort((a, b) => a.order - b.order).map(section => (
                  <div
                    key={section.id}
                    className={`preview-section ${selectedSection?.id === section.id ? 'selected' : ''}`}
                    onClick={() => setSelectedSection(section)}
                    style={{
                      backgroundColor: section.background_color || 'transparent',
                      color: section.text_color || 'inherit',
                      padding: '2rem'
                    }}
                  >
                    {section.component_type === 'HERO' && (
                      <div className="hero-preview">
                        <h1>{section.content?.heading || 'Hero Heading'}</h1>
                        <p>{section.content?.subheading || 'Subheading goes here'}</p>
                        <button className="btn-cta">{section.content?.buttonText || 'Click Me'}</button>
                      </div>
                    )}
                    {section.component_type === 'PRINCIPAL_MESSAGE' && (
                      <div className="principal-preview">
                        <div className="p-img-placeholder">Image</div>
                        <div className="p-content">
                          <h3>{section.content?.name || 'Principal Name'}</h3>
                          <p>{section.content?.message || 'Message...'}</p>
                        </div>
                      </div>
                    )}
                    {/* Default Fallback */}
                    {['HERO', 'PRINCIPAL_MESSAGE'].indexOf(section.component_type) === -1 && (
                      <div className="generic-preview">
                        <h4>{section.title}</h4>
                        <pre>{JSON.stringify(section.content, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}

                {(!selectedPage.sections || selectedPage.sections.length === 0) && (
                  <div className="empty-page-placeholder">
                    Drag or click components to add them here
                  </div>
                )}

              </div>
            ) : (
              <div className="loading-state">Select a page to edit</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteBuilder;
