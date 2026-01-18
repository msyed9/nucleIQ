/**
 * Public School Site Renderer
 * Renders the school website based on CMS config
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useSearchParams } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const PublicSchoolSite: React.FC = () => {
    // We would typically use subdomain matching here, but for this demo, 
    // we might use a query param or route param if running on localhost
    const { domain } = useParams<{ domain: string }>();
    const [searchParams] = useSearchParams();
    const pageSlug = searchParams.get('p') || 'home';

    const [siteData, setSiteData] = useState<any>(null);
    const [pageData, setPageData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSite = async () => {
            setLoading(true);
            try {
                // If checking locally, use a hardcoded domain or get from param
                const targetDomain = domain || 'demo-school';

                // 1. Get Public Website Config
                const siteRes = await axios.get(`${API_BASE_URL}/cms/public/${targetDomain}/`);
                setSiteData(siteRes.data);

                // 2. Get Specific Page
                const pageRes = await axios.get(`${API_BASE_URL}/cms/public/${targetDomain}/page`, {
                    params: { slug: pageSlug }
                });
                setPageData(pageRes.data);

            } catch (err: any) {
                console.error("Error loading site:", err);
                setError("Site not found or not published.");
            } finally {
                setLoading(false);
            }
        };

        fetchSite();
    }, [domain, pageSlug]);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
    if (error) return <div style={{ textAlign: 'center', padding: '5rem' }}><h1>⚠️ {error}</h1></div>;

    const { website, navigation } = siteData;
    const { page } = pageData;

    // --- Component Renderers ---

    // 1. Hero
    const HeroSection = ({ content, style }: any) => (
        <section style={{
            padding: '5rem 2rem',
            textAlign: 'center',
            backgroundColor: style.background || '#f3f4f6',
            color: style.color || '#111'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>{content.heading}</h1>
                <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.9 }}>{content.subheading}</p>
                {content.buttonText && (
                    <a href={content.buttonLink} style={{
                        display: 'inline-block',
                        padding: '1rem 2rem',
                        background: '#2563eb',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold'
                    }}>
                        {content.buttonText}
                    </a>
                )}
            </div>
        </section>
    );

    // 2. Navigation Bar
    const NavBar = () => (
        <nav style={{
            padding: '1rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e5e7eb',
            position: 'sticky',
            top: 0,
            background: 'white',
            zIndex: 50
        }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>{website.site_title}</div>
            <ul style={{ display: 'flex', gap: '2rem', listStyle: 'none', margin: 0 }}>
                {navigation.map((item: any) => (
                    <li key={item.id}>
                        <a
                            href={`/public/${website.subdomain}?p=${item.page ? item.page_title.toLowerCase() : 'home'}`}
                            style={{ textDecoration: 'none', color: '#374151', fontWeight: 500 }}
                        >
                            {item.label}
                        </a>
                    </li>
                ))}
                {/* Auto-Inject Apply Now */}
                <li>
                    <a href="/admissions/apply" style={{
                        padding: '0.5rem 1rem',
                        background: '#2563eb',
                        color: 'white',
                        borderRadius: '6px',
                        textDecoration: 'none'
                    }}>Apply Now</a>
                </li>
            </ul>
        </nav>
    );

    // 3. Principal Message
    const PrincipalMessage = ({ content, style }: any) => (
        <section style={{ padding: '5rem 2rem', backgroundColor: style.background || 'white' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '4rem' }}>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Principal's Message</h2>
                    <p style={{ lineHeight: 1.8, fontSize: '1.1rem', color: '#4b5563' }}>"{content.message}"</p>
                    <p style={{ marginTop: '1.5rem', fontWeight: 'bold', color: '#111' }}>- {content.name}</p>
                </div>
                <div style={{ width: '300px', height: '300px', background: '#e5e7eb', borderRadius: '12px', flexShrink: 0 }}></div>
            </div>
        </section>
    );

    // 4. Footer
    const Footer = () => (
        <footer style={{ background: '#111827', color: 'white', padding: '4rem 2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                <div>
                    <h3 style={{ marginBottom: '1rem' }}>{website.site_title}</h3>
                    <p style={{ color: '#9ca3af' }}>{website.site_tagline}</p>
                </div>
                <div>
                    <h4 style={{ marginBottom: '1rem' }}>Contact</h4>
                    <p style={{ color: '#9ca3af', marginBottom: '0.5rem' }}>{website.contact_email}</p>
                    <p style={{ color: '#9ca3af' }}>{website.contact_phone}</p>
                </div>
                <div>
                    <h4 style={{ marginBottom: '1rem' }}>Address</h4>
                    <p style={{ color: '#9ca3af' }}>{website.address}</p>
                </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '4rem', color: '#6b7280', fontSize: '0.875rem' }}>
                &copy; {new Date().getFullYear()} {website.site_title}. Powered by NucleiQ.
            </div>
        </footer>
    );

    return (
        <div className="public-site">
            <NavBar />

            <main>
                {page.sections.sort((a: any, b: any) => a.order - b.order).map((section: any) => {
                    const style = {
                        background: section.background_color,
                        color: section.text_color
                    };

                    if (!section.is_visible) return null;

                    switch (section.component_type) {
                        case 'HERO':
                            return <HeroSection key={section.id} content={section.content} style={style} />;
                        case 'PRINCIPAL_MESSAGE':
                            return <PrincipalMessage key={section.id} content={section.content} style={style} />;
                        default:
                            return (
                                <section key={section.id} style={{ padding: '4rem 2rem', ...style }}>
                                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                                        <h2>{section.title}</h2>
                                        <div dangerouslySetInnerHTML={{ __html: section.content.html || JSON.stringify(section.content) }} />
                                    </div>
                                </section>
                            );
                    }
                })}
            </main>

            <Footer />
        </div>
    );
};

export default PublicSchoolSite;
