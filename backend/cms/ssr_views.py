"""
Server-Side Rendering (SSR) views for school websites.
Generates static HTML for SEO purposes.
"""
from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse
from django.views import View
from django.template import Template, Context
from django.utils.html import escape
from .models import TenantWebsiteInstance
import json


class SSRWebsiteView(View):
    """
    Renders a tenant's website as static HTML for SEO.
    """
    
    def get(self, request, subdomain=None, page_slug='home'):
        # Get the website instance
        if subdomain:
            instance = get_object_or_404(
                TenantWebsiteInstance,
                subdomain=subdomain,
                is_published=True
            )
        else:
            # Try to get from domain
            domain = request.get_host()
            instance = get_object_or_404(
                TenantWebsiteInstance,
                domain=domain,
                is_published=True
            )
        
        # Increment visitor count
        instance.visitor_count += 1
        instance.save(update_fields=['visitor_count'])
        
        # Get structure and theme
        structure = instance.get_effective_structure()
        theme = instance.get_effective_theme()
        
        # Find the requested page
        pages = structure.get('pages', [])
        current_page = None
        for page in pages:
            if page.get('slug') == page_slug:
                current_page = page
                break
        
        if not current_page:
            return HttpResponse('Page not found', status=404)
        
        # Render the HTML
        html = self._render_page(instance, current_page, pages, theme)
        
        return HttpResponse(html, content_type='text/html')
    
    def _render_page(self, instance, page, all_pages, theme):
        """Renders a complete HTML page"""
        sections_html = ''
        for section in page.get('sections', []):
            if section.get('is_visible', True):
                sections_html += self._render_section(section, theme)
        
        # Build navigation
        nav_html = self._render_navigation(all_pages, page.get('slug'))
        
        html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{escape(instance.meta_title or page.get('title', instance.name))}</title>
    <meta name="description" content="{escape(instance.meta_description or '')}">
    <meta name="keywords" content="{escape(instance.meta_keywords or '')}">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --primary-color: {theme.get('primary_color', '#2563eb')};
            --secondary-color: {theme.get('secondary_color', '#1e40af')};
            --accent-color: {theme.get('accent_color', '#60a5fa')};
        }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: {theme.get('font_family', 'Inter, sans-serif')}; line-height: 1.6; }}
        .header {{ background: var(--primary-color); color: white; padding: 1rem 2rem; }}
        .nav {{ display: flex; gap: 2rem; justify-content: center; }}
        .nav a {{ color: white; text-decoration: none; padding: 0.5rem 1rem; }}
        .nav a:hover {{ background: rgba(255,255,255,0.1); border-radius: 4px; }}
        .nav a.active {{ background: rgba(255,255,255,0.2); border-radius: 4px; }}
        .section {{ padding: 4rem 2rem; }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        .hero {{ min-height: 60vh; display: flex; align-items: center; justify-content: center; text-align: center; }}
        .hero h1 {{ font-size: 3rem; margin-bottom: 1rem; }}
        .hero p {{ font-size: 1.25rem; opacity: 0.9; }}
        .btn {{ display: inline-block; padding: 0.75rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600; }}
        .btn-primary {{ background: var(--accent-color); color: white; }}
        .features {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; }}
        .feature-card {{ text-align: center; padding: 2rem; }}
        .feature-icon {{ font-size: 3rem; margin-bottom: 1rem; }}
        .stats {{ display: flex; justify-content: space-around; flex-wrap: wrap; gap: 2rem; }}
        .stat {{ text-align: center; }}
        .stat-value {{ font-size: 2.5rem; font-weight: 700; color: var(--primary-color); }}
        .footer {{ background: #1f2937; color: white; padding: 2rem; text-align: center; }}
    </style>
</head>
<body>
    <header class="header">
        <nav class="nav">
            {nav_html}
        </nav>
    </header>
    <main>
        {sections_html}
    </main>
    <footer class="footer">
        <p>&copy; 2024 {escape(instance.name)}. All rights reserved.</p>
    </footer>
</body>
</html>'''
        return html
    
    def _render_navigation(self, pages, current_slug):
        """Renders the navigation menu"""
        nav_items = []
        for page in pages:
            active = 'active' if page.get('slug') == current_slug else ''
            nav_items.append(
                f'<a href="/{page.get("slug", "")}" class="{active}">{escape(page.get("title", ""))}</a>'
            )
        return '\n'.join(nav_items)
    
    def _render_section(self, section, theme):
        """Renders a single section"""
        section_type = section.get('component_type', 'TEXT')
        content = section.get('content', {})
        bg_color = section.get('background_color', '#ffffff')
        text_color = section.get('text_color', '#000000')
        
        style = f'background-color: {bg_color}; color: {text_color};'
        
        if section_type == 'HERO':
            return self._render_hero(content, style)
        elif section_type == 'FEATURES':
            return self._render_features(content, style)
        elif section_type == 'STATS':
            return self._render_stats(content, style)
        elif section_type == 'PAGE_HEADER':
            return self._render_page_header(content, style)
        elif section_type == 'CONTACT':
            return self._render_contact(content, style)
        elif section_type == 'CTA':
            return self._render_cta(content, style)
        elif section_type == 'TESTIMONIALS':
            return self._render_testimonials(content, style)
        else:
            return self._render_text_block(content, style)
    
    def _render_hero(self, content, style):
        heading = escape(content.get('heading', ''))
        subheading = escape(content.get('subheading', ''))
        btn_text = escape(content.get('buttonText', ''))
        btn_link = escape(content.get('buttonLink', '#'))
        bg_img = content.get('backgroundImage', '')
        
        bg_style = f'background-image: url({bg_img}); background-size: cover; background-position: center;' if bg_img else ''
        
        return f'''
        <section class="section hero" style="{style} {bg_style}">
            <div class="container">
                <h1>{heading}</h1>
                <p>{subheading}</p>
                <a href="{btn_link}" class="btn btn-primary">{btn_text}</a>
            </div>
        </section>'''
    
    def _render_features(self, content, style):
        heading = escape(content.get('heading', 'Features'))
        features = content.get('features', [])
        
        features_html = ''
        for f in features:
            features_html += f'''
            <div class="feature-card">
                <div class="feature-icon">{f.get('icon', '⭐')}</div>
                <h3>{escape(f.get('title', ''))}</h3>
                <p>{escape(f.get('description', ''))}</p>
            </div>'''
        
        return f'''
        <section class="section" style="{style}">
            <div class="container">
                <h2 style="text-align: center; margin-bottom: 3rem;">{heading}</h2>
                <div class="features">{features_html}</div>
            </div>
        </section>'''
    
    def _render_stats(self, content, style):
        stats = content.get('stats', [])
        stats_html = ''
        for s in stats:
            stats_html += f'''
            <div class="stat">
                <div class="stat-value">{escape(str(s.get('value', '')))}</div>
                <div class="stat-label">{escape(s.get('label', ''))}</div>
            </div>'''
        
        return f'''
        <section class="section" style="{style}">
            <div class="container">
                <div class="stats">{stats_html}</div>
            </div>
        </section>'''
    
    def _render_page_header(self, content, style):
        heading = escape(content.get('heading', ''))
        breadcrumb = escape(content.get('breadcrumb', ''))
        
        return f'''
        <section class="section" style="{style} padding: 3rem 2rem;">
            <div class="container" style="text-align: center;">
                <h1>{heading}</h1>
                <p style="opacity: 0.8;">{breadcrumb}</p>
            </div>
        </section>'''
    
    def _render_contact(self, content, style):
        address = escape(content.get('address', ''))
        phone = escape(content.get('phone', ''))
        email = escape(content.get('email', ''))
        
        return f'''
        <section class="section" style="{style}">
            <div class="container">
                <h2>Contact Us</h2>
                <p><strong>Address:</strong> {address}</p>
                <p><strong>Phone:</strong> {phone}</p>
                <p><strong>Email:</strong> {email}</p>
            </div>
        </section>'''
    
    def _render_cta(self, content, style):
        heading = escape(content.get('heading', ''))
        subheading = escape(content.get('subheading', ''))
        btn_text = escape(content.get('buttonText', ''))
        btn_link = escape(content.get('buttonLink', '#'))
        
        return f'''
        <section class="section" style="{style} text-align: center;">
            <div class="container">
                <h2>{heading}</h2>
                <p>{subheading}</p>
                <a href="{btn_link}" class="btn btn-primary">{btn_text}</a>
            </div>
        </section>'''
    
    def _render_testimonials(self, content, style):
        heading = escape(content.get('heading', 'Testimonials'))
        testimonials = content.get('testimonials', [])
        
        testimonials_html = ''
        for t in testimonials:
            testimonials_html += f'''
            <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <p style="font-style: italic;">"{escape(t.get('quote', ''))}"</p>
                <p style="margin-top: 1rem;"><strong>{escape(t.get('name', ''))}</strong> - {escape(t.get('role', ''))}</p>
            </div>'''
        
        return f'''
        <section class="section" style="{style}">
            <div class="container">
                <h2 style="text-align: center; margin-bottom: 2rem;">{heading}</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                    {testimonials_html}
                </div>
            </div>
        </section>'''
    
    def _render_text_block(self, content, style):
        text = escape(content.get('text', ''))
        heading = escape(content.get('heading', ''))
        
        return f'''
        <section class="section" style="{style}">
            <div class="container">
                {f'<h2>{heading}</h2>' if heading else ''}
                <p>{text}</p>
            </div>
        </section>'''
