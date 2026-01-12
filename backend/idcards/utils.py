"""
ID Cards Utility Functions
Handles QR generation, encryption, PDF rendering
"""

import json
import hashlib
import qrcode
import barcode
from barcode.writer import ImageWriter
from io import BytesIO
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
from django.conf import settings
from django.utils import timezone
import base64
import copy
import re
from pathlib import Path
import urllib.parse


def get_encryption_key(tenant):
    """
    Get or create encryption key for tenant
    In production, store in secure key management service
    """
    # For now, use a combination of secret key and tenant ID
    # In production, use AWS KMS, Azure Key Vault, or similar
    secret = settings.SECRET_KEY + str(tenant.id)
    key = hashlib.sha256(secret.encode()).digest()
    return base64.urlsafe_b64encode(key)


def encrypt_data(data, tenant):
    """Encrypt data using Fernet (AES-256)"""
    key = get_encryption_key(tenant)
    f = Fernet(key)
    json_data = json.dumps(data)
    encrypted = f.encrypt(json_data.encode())
    return encrypted.decode()


def decrypt_data(encrypted_data, tenant):
    """Decrypt data using Fernet"""
    try:
        key = get_encryption_key(tenant)
        f = Fernet(key)
        decrypted = f.decrypt(encrypted_data.encode())
        return json.loads(decrypted.decode())
    except Exception as e:
        raise ValueError(f"Failed to decrypt data: {str(e)}")


def generate_qr_payload(entity, entity_type, tenant):
    """
    Generate QR code payload with entity data
    """
    from students.models import Student
    from staff.models import Staff
    
    payload = {
        'type': entity_type,
        'id': str(entity.id),
        'tenant_id': str(tenant.id),
        'issued_date': datetime.now().isoformat(),
        'valid_until': (datetime.now() + timedelta(days=365)).isoformat(),
    }
    
    if entity_type == 'student':
        enrollment = entity.get_current_enrollment() if hasattr(entity, 'get_current_enrollment') else None
        # Resolve class (grade level) and section safely
        class_name = None
        section_name = None
        try:
            if enrollment and enrollment.section:
                section = enrollment.section
                section_name = getattr(section, 'name', None)
                grade_level = getattr(section, 'grade_level', None)
                class_name = getattr(grade_level, 'name', None) if grade_level else None
        except Exception:
            class_name = None
            section_name = None

        payload.update({
            'admission_no': entity.admission_number,
            'name': entity.get_full_name(),
            'dob': str(entity.date_of_birth) if entity.date_of_birth else None,
            'class': class_name,
            'section': section_name,
        })
    elif entity_type == 'staff':
        payload.update({
            'employee_id': entity.employee_id,
            'name': entity.get_full_name(),
            'designation': entity.designation,
            'department': entity.department if hasattr(entity, 'department') else None,
        })
    
    return payload


def generate_qr_code_image(data, size=200):
    """
    Generate QR code image from data
    Returns base64 encoded image
    Args:
        data: Data to encode in QR code
        size: Desired size in pixels (will be square)
    """
    # Build a minimal QR first to determine module size, then render at an
    # integer `box_size` so the QR remains sharp. If the exact requested
    # `size` cannot be achieved by integer box sizing, pad the QR centered
    # on a white canvas to avoid high-quality resampling artifacts.
    from PIL import Image

    border = 1
    # temporary QR to discover required modules/version
    qr_tmp = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=1,
        border=border,
    )
    qr_tmp.add_data(data)
    qr_tmp.make(fit=True)

    matrix = qr_tmp.get_matrix()
    modules = len(matrix)

    total_modules = modules + 2 * border
    # choose the largest integer box_size that fits within `size`
    box_size = max(1, int(int(size) / total_modules))

    # final rendered pixel size for the QR (may be <= requested size)
    pixel_size = total_modules * box_size

    # render QR at computed box_size for sharp modules
    qr = qrcode.QRCode(
        version=qr_tmp.version,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=box_size,
        border=border,
    )
    qr.add_data(data)
    # Prefer SVG output (vector) to avoid rasterization/distortion when
    # embedding inside PDFs. Fall back to PNG if SVG factory is unavailable.
    try:
        from qrcode.image.svg import SvgImage
        buffered = BytesIO()
        img_svg = qrcode.make(data, image_factory=SvgImage)
        img_svg.save(buffered)
        svg_text = buffered.getvalue().decode('utf-8')
        # Inline SVG can be used as a data URI; URL-encode to be safe
        return 'data:image/svg+xml;utf8,' + urllib.parse.quote(svg_text)
    except Exception:
        # Fallback to high-quality PNG rendering
        from PIL import Image

        border = 1
        qr_tmp = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=1,
            border=border,
        )
        qr_tmp.add_data(data)
        qr_tmp.make(fit=True)

        matrix = qr_tmp.get_matrix()
        modules = len(matrix)

        total_modules = modules + 2 * border
        box_size = max(1, int(int(size) / total_modules))
        pixel_size = total_modules * box_size

        qr = qrcode.QRCode(
            version=qr_tmp.version,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=box_size,
            border=border,
        )
        qr.add_data(data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

        if pixel_size < int(size):
            canvas = Image.new("RGB", (int(size), int(size)), "white")
            offset = ((int(size) - pixel_size) // 2, (int(size) - pixel_size) // 2)
            canvas.paste(img, offset)
            final_img = canvas
        elif pixel_size > int(size):
            final_img = img.resize((int(size), int(size)), Image.Resampling.LANCZOS)
        else:
            final_img = img

        buffered = BytesIO()
        final_img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()

        return f"data:image/png;base64,{img_str}"


def create_qr_code_record(entity, entity_type, tenant):
    """
    Create or update an `IDCardQRCode` record for the given entity.
    Returns the `IDCardQRCode` instance.
    """
    from .models import IDCardQRCode

    # Build payload and encrypt
    payload = generate_qr_payload(entity, entity_type, tenant)
    encrypted_data = encrypt_data(payload, tenant)

    # Compute hash for quick lookup
    qr_hash = hashlib.sha256(encrypted_data.encode()).hexdigest()

    # Create or update QR code record
    qr_code, created = IDCardQRCode.objects.update_or_create(
        tenant=tenant,
        entity_type=entity_type,
        entity_id=entity.id,
        defaults={
            'qr_data': encrypted_data,
            'qr_hash': qr_hash,
            'issued_date': timezone.now(),
            'valid_until': timezone.now() + timedelta(days=365),
            'is_active': True,
        }
    )

    return qr_code


def validate_qr_code(qr_data, tenant):
    """
    Validate and decrypt QR code data
    Returns decrypted payload or raises exception
    """
    from .models import IDCardQRCode
    
    # Generate hash
    qr_hash = hashlib.sha256(qr_data.encode()).hexdigest()
    
    # Find QR code record
    try:
        qr_code = IDCardQRCode.objects.get(qr_hash=qr_hash, tenant=tenant)
    except IDCardQRCode.DoesNotExist:
        raise ValueError("Invalid QR code")
    
    # Check if expired
    if not qr_code.is_active:
        raise ValueError("QR code has been deactivated")
    
    if qr_code.valid_until < timezone.now():
        raise ValueError("QR code has expired")
    
    # Decrypt data
    payload = decrypt_data(qr_data, tenant)
    
    return payload, qr_code


def get_entity_data_for_template(entity, entity_type, tenant):
    """
    Get entity data formatted for template rendering
    """
    from students.models import Student
    from staff.models import Staff
    
    data = {
        'school': {
            'name': tenant.name if hasattr(tenant, 'name') else 'School Name',
            'logo': tenant.logo.url if hasattr(tenant, 'logo') and tenant.logo else None,
            'address': getattr(tenant, 'address', ''),
            'phone': getattr(tenant, 'phone', ''),
            'email': getattr(tenant, 'email', ''),
        }
    }
    
    if entity_type == 'student':
        enrollment = entity.get_current_enrollment() if hasattr(entity, 'get_current_enrollment') else None

        # Safely resolve class (grade level) and section names
        class_name = ''
        section_name = ''
        if enrollment and enrollment.section:
            section = enrollment.section
            section_name = getattr(section, 'name', '') or ''
            grade_level = getattr(section, 'grade_level', None)
            class_name = getattr(grade_level, 'name', '') if grade_level else ''

        data['student'] = {
            'id': str(entity.id),
            'name': entity.get_full_name(),
            'first_name': entity.first_name,
            'last_name': entity.last_name,
            'admission_number': entity.admission_number,
            'dob': str(entity.date_of_birth) if entity.date_of_birth else '',
            'gender': entity.get_gender_display() if hasattr(entity, 'get_gender_display') else '',
            'blood_group': entity.blood_group if hasattr(entity, 'blood_group') else '',
            'photo': entity.photo.url if entity.photo else None,
            'class': class_name,
            'section': section_name,
            'roll_number': enrollment.roll_number if enrollment and hasattr(enrollment, 'roll_number') else '',
            'academic_year': enrollment.academic_year.name if enrollment and enrollment.academic_year else '',
        }
    
    elif entity_type == 'staff':
        data['staff'] = {
            'id': str(entity.id),
            'name': entity.get_full_name(),
            'first_name': entity.first_name,
            'last_name': entity.last_name,
            'employee_id': entity.employee_id,
            'designation': entity.get_designation_display() if hasattr(entity, 'get_designation_display') else entity.designation,
            'department': entity.department if hasattr(entity, 'department') else '',
            'dob': str(entity.date_of_birth) if entity.date_of_birth else '',
            'blood_group': entity.blood_group if hasattr(entity, 'blood_group') else '',
            'photo': entity.photo.url if entity.photo else None,
            'phone': entity.phone_number if hasattr(entity, 'phone_number') else '',
            'email': entity.personal_email if hasattr(entity, 'personal_email') else '',
        }
    
    return data


def render_template_to_html(template, entity_data, qr_code_image=None):
    """
    Render ID card template to HTML
    """
    from django.template.loader import render_to_string

    # Defensive: some older templates were saved with swapped width/height.
    width_mm = float(template.width or 0)
    height_mm = float(template.height or 0)
    if template.orientation == 'portrait' and width_mm > height_mm:
        width_mm, height_mm = height_mm, width_mm
    elif template.orientation == 'landscape' and height_mm > width_mm:
        width_mm, height_mm = height_mm, width_mm

    background_value = to_file_uri_if_media(getattr(template, 'background_value', None))

    # Normalize config and resolve placeholders coming from the designer/prebuilt templates
    # (e.g. {{student_name}}, {{class}}, {{admission_number}}) so the HTML receives
    # actual values instead of raw tokens. Also align element types (qr vs qrcode).
    config = prepare_template_config(template, entity_data, qr_code_image)
    
    # Build context
    context = {
        'template': template,
        'config': config,
        'data': entity_data,
        'qr_code_image': qr_code_image,
        'width_mm': width_mm,
        'height_mm': height_mm,
        'background_type': template.background_type,
        'background_value': background_value,
    }
    
    # Render using Django template
    html = render_to_string('idcards/id_card_template.html', context)
    
    return html


PLACEHOLDER_PATTERN = re.compile(r"\{\{\s*([^}]+?)\s*\}\}")


def to_file_uri_if_media(value):
    """Convert MEDIA_URL-based paths (e.g. /media/x.png) to file:// URIs.

    This makes WeasyPrint able to load images during Celery execution inside Docker
    without needing an HTTP base_url.
    """
    if not isinstance(value, str) or not value:
        return value

    value = value.strip()

    # Leave already-resolvable URIs untouched
    if value.startswith(('data:', 'http://', 'https://', 'file://')):
        return value

    try:
        from django.conf import settings
        media_url = getattr(settings, 'MEDIA_URL', '/media/') or '/media/'
        media_root = getattr(settings, 'MEDIA_ROOT', None)
        if not media_root:
            return value

        # Normalize common forms
        if value.startswith(media_url):
            rel_path = value[len(media_url):].lstrip('/')
        elif value.startswith('/media/'):
            rel_path = value[len('/media/'):].lstrip('/')
        else:
            return value

        file_path = Path(media_root) / rel_path
        try:
            file_path = file_path.resolve()
        except Exception:
            pass

        return file_path.as_uri()
    except Exception:
        return value


def build_placeholder_map(entity_data, qr_code_image=None):
    """Flatten entity/school data for easy placeholder replacement."""
    placeholders = {}

    school = entity_data.get('school', {}) if isinstance(entity_data, dict) else {}
    placeholders.update({
        'school_name': school.get('name', '') or '',
        'school_logo': to_file_uri_if_media(school.get('logo', '') or ''),
        'school_address': school.get('address', '') or '',
        'school_phone': school.get('phone', '') or '',
        'school_email': school.get('email', '') or '',
    })

    student = entity_data.get('student') if isinstance(entity_data, dict) else None
    if isinstance(student, dict):
        student_name = student.get('name') or f"{student.get('first_name', '')} {student.get('last_name', '')}".strip()
        placeholders.update({
            'student_name': student_name,
            'name': student_name,
            'first_name': student.get('first_name', ''),
            'last_name': student.get('last_name', ''),
            'admission_number': student.get('admission_number', ''),
            'admission_no': student.get('admission_number', ''),
            'class': student.get('class', ''),
            'section': student.get('section', ''),
            'roll_number': student.get('roll_number', ''),
            'academic_year': student.get('academic_year', ''),
            'date_of_birth': student.get('dob', ''),
            'dob': student.get('dob', ''),
            'blood_group': student.get('blood_group', ''),
            'gender': student.get('gender', ''),
            'photo': to_file_uri_if_media(student.get('photo', '')),
        })

    staff = entity_data.get('staff') if isinstance(entity_data, dict) else None
    if isinstance(staff, dict):
        staff_name = staff.get('name') or f"{staff.get('first_name', '')} {staff.get('last_name', '')}".strip()
        placeholders.update({
            'staff_name': staff_name,
            'name': staff_name if not placeholders.get('name') else placeholders['name'],
            'employee_id': staff.get('employee_id', ''),
            'designation': staff.get('designation', ''),
            'department': staff.get('department', ''),
            'dob': staff.get('dob', ''),
            'blood_group': staff.get('blood_group', ''),
            'phone': staff.get('phone', ''),
            'email': staff.get('email', ''),
            'photo': to_file_uri_if_media(staff.get('photo', '')),
        })

    if qr_code_image:
        placeholders['qr_image'] = qr_code_image

    # Ensure all placeholders are strings to avoid template type issues
    return {key: '' if value is None else str(value) for key, value in placeholders.items()}


def replace_placeholders(value, placeholders):
    """Replace {{placeholder}} tokens in strings with actual values."""
    if not isinstance(value, str):
        return value

    def _repl(match):
        key = match.group(1).strip()
        return placeholders.get(key, '')

    return PLACEHOLDER_PATTERN.sub(_repl, value)


def prepare_template_config(template, entity_data, qr_code_image=None):
    """
    Resolve placeholders and normalize element definitions from designer/prebuilt templates.
    - Converts {{token}} strings to actual values.
    - Accepts both `qr` and `qrcode` element types.
    - Adds qr_image onto QR elements for the Django template to render.
    - Keeps raw numeric values as-is (designer converts to mm in template).
    """
    placeholders = build_placeholder_map(entity_data, qr_code_image)
    config = copy.deepcopy(template.config or {})
    elements = config.get('elements', []) if isinstance(config, dict) else []

    # MM_TO_PX conversion (same as frontend: 96px per inch / 25.4mm per inch)
    # Designer stores raw numbers and converts to mm when rendering
    # We do the same in the Django template
    MM_TO_PX = 96.0 / 25.4

    normalized_elements = []
    for element in elements:
        if not isinstance(element, dict):
            continue

        normalized = copy.deepcopy(element)

        # Normalize element type for downstream template logic
        el_type = str(normalized.get('type', '')).lower()
        if el_type in ['qr', 'qrcode']:
            el_type = 'qrcode'
        normalized['type'] = el_type

        # Store the MM_TO_PX conversion factor for the template to use
        # The template will convert: fontSize / MM_TO_PX to get mm
        normalized['mm_to_px'] = MM_TO_PX

        # Replace placeholders on common fields first so we can honor a
        # designer-configured `data` field on QR elements (e.g. {{admission_number}})
        for field in ['text', 'src', 'url', 'data', 'fill', 'fillColor', 'backgroundColor', 'color']:
            if field in normalized:
                normalized[field] = replace_placeholders(normalized[field], placeholders)

        # For QR codes, generate at the correct size based on element dimensions
        # Prefer element.data (designer-configured payload) when present; fall
        # back to the encrypted `qr_code_image` payload produced server-side.
        if el_type == 'qrcode':
            # Determine payload to encode in QR
            payload_to_encode = None
            if isinstance(normalized.get('data'), str) and normalized.get('data').strip():
                payload_to_encode = normalized.get('data')
            elif qr_code_image:
                payload_to_encode = qr_code_image

            if payload_to_encode:
                # Calculate size in pixels based on element mm dimensions (use smaller dimension)
                width_mm = float(normalized.get('width', 20))
                height_mm = float(normalized.get('height', 20))
                # Use minimum dimension and convert to pixels (match designer exactly)
                qr_size_mm = min(width_mm, height_mm)
                # Convert mm to pixels using same formula as designer
                qr_size_px = int(qr_size_mm * MM_TO_PX)
                # Generate QR at exact size matching element
                normalized['qr_image'] = generate_qr_code_image(payload_to_encode, size=qr_size_px)

        # Make sure image-like fields are resolvable by WeasyPrint
        for field in ['src', 'url']:
            if field in normalized:
                normalized[field] = to_file_uri_if_media(normalized[field])

        # Do not attach raw encrypted payload as `qr_image`; QR image is already
        # created above from either element.data or qr_code_image. Leave `qr_image`
        # absent when neither payload nor qr_code_image provided so template can
        # omit the element gracefully.

        normalized_elements.append(normalized)

    if isinstance(config, dict):
        config['elements'] = normalized_elements
        config['mm_to_px'] = MM_TO_PX
    else:
        config = {'elements': normalized_elements, 'mm_to_px': MM_TO_PX}

    return config


def _mm_to_px(mm, dpi=300):
    """Convert millimeters to pixels for screenshot sizing."""
    try:
        return int((float(mm) * dpi) / 25.4)
    except Exception:
        return 0


def html_to_pdf(html_content, output_path=None, output_format='pdf', width_mm=86, height_mm=54):
    """Convert HTML to the desired output (pdf/png/jpg).

    The function prefers WeasyPrint for PDF generation, and Playwright screenshots
    for raster formats. It always returns bytes unless an output_path is provided.
    """
    import logging

    normalized_format = (output_format or 'pdf').lower()
    normalized_format = 'jpg' if normalized_format == 'jpeg' else normalized_format

    def _save_bytes(data, path):
        if path:
            with open(path, 'wb') as f:
                f.write(data)
            return path
        return data

    # Fast path: raster via Playwright screenshot
    if normalized_format in {'png', 'jpg'}:
        try:
            from playwright.sync_api import sync_playwright
            width_px = max(_mm_to_px(width_mm, dpi=300), 200)
            height_px = max(_mm_to_px(height_mm, dpi=300), 200)
            with sync_playwright() as p:
                browser = p.chromium.launch(args=['--no-sandbox'], headless=True)
                page = browser.new_page(viewport={'width': width_px, 'height': height_px})
                page.set_content(html_content, wait_until='networkidle')
                screenshot_bytes = page.screenshot(full_page=True)
                browser.close()

            if normalized_format == 'jpg':
                from PIL import Image
                img = Image.open(BytesIO(screenshot_bytes)).convert('RGB')
                buf = BytesIO()
                img.save(buf, format='JPEG', quality=90)
                screenshot_bytes = buf.getvalue()

            return _save_bytes(screenshot_bytes, output_path)
        except Exception as e:
            logging.warning("Playwright screenshot failed for %s: %s", normalized_format, e)

    # Primary path: WeasyPrint PDF (used directly for PDF, used as intermediate for images when needed)
    try:
        from weasyprint import HTML, CSS
        from weasyprint.text.fonts import FontConfiguration

        font_config = FontConfiguration()
        css = CSS(string=f'''
            @page {{
                size: {width_mm}mm {height_mm}mm;
                margin: 0;
            }}
            body {{
                margin: 0;
                padding: 0;
            }}
        ''', font_config=font_config)

        html_doc = HTML(string=html_content)
        pdf_bytes = html_doc.write_pdf(stylesheets=[css], font_config=font_config)

        if normalized_format == 'pdf':
            return _save_bytes(pdf_bytes, output_path)
        else:
            try:
                # Try converting the PDF to an image if possible
                try:
                    from pdf2image import convert_from_bytes

                    images = convert_from_bytes(pdf_bytes)
                    if images:
                        img = images[0]
                    else:
                        img = None
                except Exception:
                    from PIL import Image
                    img = Image.open(BytesIO(pdf_bytes))

                if img:
                    if normalized_format == 'jpg':
                        img = img.convert('RGB')
                        buf = BytesIO()
                        img.save(buf, format='JPEG', quality=90)
                        return _save_bytes(buf.getvalue(), output_path)
                    buf = BytesIO()
                    img.save(buf, format='PNG')
                    return _save_bytes(buf.getvalue(), output_path)
            except Exception as conversion_error:
                logging.warning("PDF to image conversion failed: %s", conversion_error)
    except Exception as e:
        logging.warning("WeasyPrint failed: %s", e)

    if normalized_format == 'pdf':
        # Fallback: pdfkit (wkhtmltopdf)
        try:
            import pdfkit
            logging.info("Attempting pdfkit (wkhtmltopdf) fallback")
            options = {
                'page-width': f'{width_mm}mm',
                'page-height': f'{height_mm}mm',
                'margin-top': '0mm',
                'margin-bottom': '0mm',
                'margin-left': '0mm',
                'margin-right': '0mm',
            }
            pdf_bytes = pdfkit.from_string(html_content, False, options=options)
            return _save_bytes(pdf_bytes, output_path)
        except Exception as e2:
            logging.warning("pdfkit fallback failed: %s", e2)

        # Fallback: Playwright PDF
        try:
            logging.info("Attempting Playwright (headless Chromium) PDF fallback")
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                browser = p.chromium.launch(args=['--no-sandbox'], headless=True)
                page = browser.new_page()
                page.set_content(html_content, wait_until='networkidle')
                pdf_kwargs = {
                    'print_background': True,
                    'margin': {'top': '0', 'bottom': '0', 'left': '0', 'right': '0'},
                    'width': f'{width_mm}mm',
                    'height': f'{height_mm}mm',
                }
                pdf_bytes = page.pdf(**pdf_kwargs)
                browser.close()
                return _save_bytes(pdf_bytes, output_path)
        except Exception as e3:
            logging.warning("Playwright PDF fallback failed: %s", e3)

    # Final fallback: generate a simple placeholder image to avoid returning PDFs when asked for images
    try:
        from PIL import Image, ImageDraw, ImageFont
        img_width = max(_mm_to_px(width_mm, dpi=96), 200)
        img_height = max(_mm_to_px(height_mm, dpi=96), 200)
        img = Image.new('RGB', (img_width, img_height), color=(240, 240, 240))
        draw = ImageDraw.Draw(img)
        message = 'Render failed'
        try:
            font = ImageFont.load_default()
        except Exception:
            font = None
        draw.text((10, img_height // 2 - 10), message, fill=(80, 80, 80), font=font)
        buf = BytesIO()
        target_format = 'PNG' if normalized_format != 'jpg' else 'JPEG'
        img.save(buf, format=target_format)
        return _save_bytes(buf.getvalue(), output_path)
    except Exception:
        pass

    raise RuntimeError("Failed to render HTML to output")


def upload_to_storage(file_data, file_name, tenant):
    """
    Upload file to cloud storage (S3/Azure Blob)
    Returns public URL
    """
    # This is a placeholder - implement based on your storage backend
    # Use django-storages with S3 or Azure Blob
    
    from django.core.files.base import ContentFile
    from django.core.files.storage import default_storage
    
    file_path = f"idcards/{tenant.id}/{file_name}"
    
    if isinstance(file_data, bytes):
        file_content = ContentFile(file_data)
    else:
        file_content = file_data
    
    saved_path = default_storage.save(file_path, file_content)
    file_url = default_storage.url(saved_path)
    
    return file_url


def generate_single_id_card(entity, entity_type, template, tenant, include_qr=True, output_format='pdf', return_preview_image=False):
    """
    Generate a single ID card.

    Returns a tuple of (IDCardRecord, QRCode, preview_image_bytes|None).
    preview_image_bytes is a PNG representation used for grid/sheet layout when requested.
    """
    from .models import IDCardRecord

    normalized_format = (output_format or 'pdf').lower()
    normalized_format = 'jpg' if normalized_format == 'jpeg' else normalized_format

    # Create QR code if needed
    qr_code = None
    qr_code_data = None

    if include_qr:
        qr_code = create_qr_code_record(entity, entity_type, tenant)
        qr_code_data = qr_code.qr_data

    # Get entity data
    entity_data = get_entity_data_for_template(entity, entity_type, tenant)

    # Add QR payload to data
    if qr_code:
        entity_data['qr_payload'] = qr_code.qr_data

    # Render HTML - pass QR data instead of image, let prepare_template_config generate it at the right size
    html = render_template_to_html(template, entity_data, qr_code_data)

    # Normalize dimensions for output sizing
    width_mm = float(template.width or 0)
    height_mm = float(template.height or 0)
    if template.orientation == 'portrait' and width_mm > height_mm:
        width_mm, height_mm = height_mm, width_mm
    elif template.orientation == 'landscape' and height_mm > width_mm:
        width_mm, height_mm = height_mm, width_mm

    # Convert to desired format
    rendered_bytes = html_to_pdf(html, output_format=normalized_format, width_mm=width_mm, height_mm=height_mm)

    # Upload to storage
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    file_extension = normalized_format if normalized_format in {'pdf', 'png', 'jpg'} else 'pdf'
    file_name = f"{entity_type}_{entity.id}_{timestamp}.{file_extension}"
    file_url = upload_to_storage(rendered_bytes, file_name, tenant)

    # Create ID card record
    id_card = IDCardRecord.objects.create(
        tenant=tenant,
        entity_type=entity_type,
        entity_id=entity.id,
        template=template,
        file_url=file_url,
        file_format=file_extension,
        valid_until=timezone.now() + timedelta(days=365),
    )

    # Link QR code to ID card
    if qr_code:
        qr_code.id_card = id_card
        qr_code.save()

    preview_image = None
    if return_preview_image and file_extension != 'png':
        try:
            preview_image = html_to_pdf(html, output_format='png', width_mm=width_mm, height_mm=height_mm)
        except Exception:
            preview_image = None

    return id_card, qr_code, preview_image


def create_grid_layout(cards, cards_per_page=9, columns=3, card_width_mm=86, card_height_mm=54, gap_mm=5, layout_name='grid'):
    """Build an HTML grid for multiple cards on an A4 sheet.

    cards: list of dicts with either `image_url` or `html` keys.
    """
    from django.template.loader import render_to_string

    normalized_cards = []
    for card in cards:
        if not isinstance(card, dict):
            continue
        image_url = card.get('image_url') or card.get('file_url')
        html = card.get('html')
        normalized_cards.append({
            'image_url': to_file_uri_if_media(image_url) if image_url else None,
            'html': html,
        })

    pages = []
    for i in range(0, len(normalized_cards), cards_per_page):
        pages.append(normalized_cards[i:i+cards_per_page])

    context = {
        'pages': pages,
        'columns': columns,
        'card_width_mm': card_width_mm,
        'card_height_mm': card_height_mm,
        'gap_mm': gap_mm,
        'layout_name': layout_name,
    }

    html = render_to_string('idcards/grid_layout.html', context)
    return html
