import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANUALS_DIR = ROOT / 'docs' / 'manuals'
TEMPLATES_DIR = MANUALS_DIR / 'templates'
OUTPUT_DIR = MANUALS_DIR / 'manuals'


def load_json(path):
    with path.open('r', encoding='utf-8') as handle:
        return json.load(handle)


def title_from_slug(slug):
    special = {
        'platform-admin': 'Platform Administration',
        'idcards': 'ID Cards',
        'lms': 'LMS',
        'crm': 'CRM',
        'cms': 'CMS',
        'hr': 'HR',
        'auth': 'Authentication',
        'salah-tracker': 'Salah Tracker',
        'habit-tracker': 'Habit Tracker',
        'audit-history': 'Audit History',
        'scheduled-tasks': 'Scheduled Tasks',
        'task-results': 'Task Results',
        'token-blacklist': 'Token Blacklist',
        'data-management': 'Data Management',
        'helpdesk': 'Helpdesk',
        'idcards': 'ID Cards',
    }
    if slug in special:
        return special[slug]
    return slug.replace('-', ' ').replace('_', ' ').title()


def menu_path_from_title(title):
    if title == 'Platform Administration':
        return 'Platform Admin Dashboard'
    return title


def audience_title(audience):
    mapping = {
        'platform-admin': 'Platform Administrator',
        'tenant-admin': 'Tenant Administrator',
        'teacher': 'Teacher',
        'accountant': 'Accountant',
        'hr': 'HR',
        'parent': 'Parent',
        'student': 'Student',
        'staff-other': 'Staff (Other Roles)'
    }
    return mapping.get(audience, title_from_slug(audience))


def _pdf_escape(text):
    return text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')


def write_simple_pdf(path, lines):
    """Write a minimal PDF with the given lines of text."""
    lines = [_pdf_escape(line) for line in lines]
    content = "BT /F1 12 Tf 50 750 Td "
    for index, line in enumerate(lines):
        if index > 0:
            content += " T* "
        content += f"({line}) Tj"
    content += " ET"

    content_bytes = content.encode('utf-8')

    objects = []
    objects.append(b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n")
    objects.append(b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n")
    objects.append(
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
    )
    objects.append(
        b"4 0 obj << /Length " + str(len(content_bytes)).encode('utf-8') + b" >>\nstream\n" +
        content_bytes + b"\nendstream\nendobj\n"
    )
    objects.append(b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n")

    xref_offsets = []
    pdf = bytearray()
    pdf.extend(b"%PDF-1.4\n")
    for obj in objects:
        xref_offsets.append(len(pdf))
        pdf.extend(obj)

    xref_start = len(pdf)
    pdf.extend(b"xref\n0 6\n")
    pdf.extend(b"0000000000 65535 f \n")
    for offset in xref_offsets:
        pdf.extend(f"{offset:010d} 00000 n \n".encode('utf-8'))

    pdf.extend(b"trailer << /Size 6 /Root 1 0 R >>\n")
    pdf.extend(b"startxref\n")
    pdf.extend(f"{xref_start}\n".encode('utf-8'))
    pdf.extend(b"%%EOF\n")

    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('wb') as handle:
        handle.write(pdf)


def render_template(template_text, replacements):
    rendered = template_text
    for key, value in replacements.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", value)
    return rendered


def generate_manuals():
    modules_config = load_json(MANUALS_DIR / 'modules.json')
    audiences = modules_config['audiences']
    modules = modules_config['modules']

    base_template = (TEMPLATES_DIR / 'module_base.md').read_text(encoding='utf-8')
    audience_template = (TEMPLATES_DIR / 'module_audience.md').read_text(encoding='utf-8')

    for module_slug in modules:
        module_title = title_from_slug(module_slug)
        menu_path = menu_path_from_title(module_title)

        module_folder = OUTPUT_DIR / module_slug
        module_folder.mkdir(parents=True, exist_ok=True)

        base_md_path = module_folder / 'base.md'
        base_pdf_path = module_folder / 'base.pdf'

        base_rendered = render_template(
            base_template,
            {
                'MODULE_TITLE': module_title,
                'MODULE_MENU_PATH': menu_path,
                'MODULE_SLUG': module_slug,
                'AUDIENCE': 'base'
            }
        )
        base_md_path.write_text(base_rendered, encoding='utf-8')

        write_simple_pdf(
            base_pdf_path,
            [
                f"{module_title} — User Manual (Base)",
                "This PDF is a placeholder generated automatically.",
                "Use the Markdown version for full click-by-click steps.",
            ]
        )

        for audience in audiences:
            audience_title_text = audience_title(audience)
            audience_md_path = module_folder / f"{audience}.md"
            audience_pdf_path = module_folder / f"{audience}.pdf"

            audience_rendered = render_template(
                audience_template,
                {
                    'MODULE_TITLE': module_title,
                    'MODULE_SLUG': module_slug,
                    'AUDIENCE': audience,
                    'AUDIENCE_TITLE': audience_title_text,
                    'BASE_MANUAL_LINK': 'base.md'
                }
            )
            audience_md_path.write_text(audience_rendered, encoding='utf-8')

            write_simple_pdf(
                audience_pdf_path,
                [
                    f"{module_title} — {audience_title_text} Manual",
                    "This PDF is a placeholder generated automatically.",
                    "Use the Markdown version for full click-by-click steps.",
                ]
            )


if __name__ == '__main__':
    generate_manuals()
