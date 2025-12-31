"""
ID Card Rendering Engine using Pillow
Generates ID cards from JSON design specifications
"""

from PIL import Image, ImageDraw, ImageFont, ImageColor
import qrcode
import barcode
from barcode.writer import ImageWriter
from io import BytesIO
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
import zipfile


class IDCardRenderer:
    """Render ID card from JSON design."""
    
    DPI = 300  # Print quality
    
    def __init__(self, design_json, width_mm, height_mm):
        """
        Initialize renderer.
        
        Args:
            design_json: Design configuration dict
            width_mm: Card width in millimeters
            height_mm: Card height in millimeters
        """
        self.design = design_json
        self.width_px = int((width_mm / 25.4) * self.DPI)
        self.height_px = int((height_mm / 25.4) * self.DPI)
    
    def render(self, data):
        """
        Render ID card with given data.
        
        Args:
            data: Dict with values for placeholders
                  e.g., {'StudentName': 'John Doe', 'Class': '5A'}
        
        Returns:
            PIL Image object
        """
        # Create canvas
        img = Image.new('RGB', (self.width_px, self.height_px), 'white')
        draw = ImageDraw.Draw(img)
        
        # Render background
        self._render_background(img, draw)
        
        # Render elements (sorted by zIndex)
        elements = sorted(
            self.design.get('elements', []),
            key=lambda x: x.get('zIndex', 0)
        )
        
        for element in elements:
            try:
                self._render_element(img, draw, element, data)
            except Exception as e:
                print(f"Error rendering element {element.get('id', 'unknown')}: {e}")
                continue
        
        return img
    
    def _render_background(self, img, draw):
        """Render background."""
        bg = self.design.get('background', {})
        bg_type = bg.get('type', 'color')
        
        if bg_type == 'color':
            color = bg.get('value', '#FFFFFF')
            try:
                rgb_color = ImageColor.getrgb(color)
                draw.rectangle(
                    [(0, 0), (self.width_px, self.height_px)],
                    fill=rgb_color
                )
            except:
                # Default to white if color parsing fails
                draw.rectangle(
                    [(0, 0), (self.width_px, self.height_px)],
                    fill='white'
                )
        
        elif bg_type == 'image':
            try:
                # Load and resize background image
                bg_path = bg.get('image_url', '')
                if os.path.exists(bg_path):
                    bg_img = Image.open(bg_path)
                    bg_img = bg_img.resize((self.width_px, self.height_px))
                    img.paste(bg_img, (0, 0))
            except Exception as e:
                print(f"Error loading background image: {e}")
    
    def _render_element(self, img, draw, element, data):
        """Render single element."""
        element_type = element.get('type')
        
        # Convert mm to px
        x = int((element.get('x', 0) / 25.4) * self.DPI)
        y = int((element.get('y', 0) / 25.4) * self.DPI)
        width = int((element.get('width', 0) / 25.4) * self.DPI)
        height = int((element.get('height', 0) / 25.4) * self.DPI)
        
        if element_type == 'text':
            self._render_text(draw, element, data, x, y, width, height)
        
        elif element_type == 'image':
            self._render_image(img, element, data, x, y, width, height)
        
        elif element_type == 'shape':
            self._render_shape(draw, element, x, y, width, height)
        
        elif element_type == 'qrcode':
            self._render_qrcode(img, element, data, x, y, width)
        
        elif element_type == 'barcode':
            self._render_barcode(img, element, data, x, y, width, height)
    
    def _render_text(self, draw, element, data, x, y, width, height):
        """Render text element."""
        text = element.get('text', '')
        
        # Replace placeholders
        text = self._replace_placeholders(text, data)
        
        # Font
        font_size = int((element.get('fontSize', 12) / 72) * self.DPI)
        font_family = element.get('fontFamily', 'arial')
        font_weight = element.get('fontWeight', 'normal')
        
        try:
            # Try to load TrueType font
            if font_weight == 'bold':
                font = ImageFont.truetype(f"{font_family}bd.ttf", font_size)
            else:
                font = ImageFont.truetype(f"{font_family}.ttf", font_size)
        except:
            try:
                # Fallback to default font
                font = ImageFont.load_default()
            except:
                font = None
        
        # Color
        color = element.get('color', '#000000')
        try:
            rgb_color = ImageColor.getrgb(color)
        except:
            rgb_color = (0, 0, 0)
        
        # Draw text
        if font:
            draw.text((x, y), text, fill=rgb_color, font=font)
        else:
            draw.text((x, y), text, fill=rgb_color)
    
    def _render_image(self, img, element, data, x, y, width, height):
        """Render image element."""
        src = element.get('src', '')
        src = self._replace_placeholders(src, data)
        
        try:
            if os.path.exists(src):
                element_img = Image.open(src)
                
                # Resize based on fit mode
                fit = element.get('fit', 'cover')
                if fit == 'cover':
                    element_img = element_img.resize((width, height), Image.Resampling.LANCZOS)
                elif fit == 'contain':
                    element_img.thumbnail((width, height), Image.Resampling.LANCZOS)
                
                # Paste image
                img.paste(element_img, (x, y))
        except Exception as e:
            print(f"Error loading image {src}: {e}")
    
    def _render_shape(self, draw, element, x, y, width, height):
        """Render shape element."""
        shape = element.get('shape', 'rectangle')
        fill = element.get('fill', '#000000')
        stroke = element.get('stroke', None)
        stroke_width = element.get('strokeWidth', 1)
        
        try:
            fill_color = ImageColor.getrgb(fill) if fill else None
            stroke_color = ImageColor.getrgb(stroke) if stroke else None
        except:
            fill_color = (0, 0, 0)
            stroke_color = None
        
        if shape == 'rectangle':
            draw.rectangle(
                [(x, y), (x + width, y + height)],
                fill=fill_color,
                outline=stroke_color,
                width=stroke_width
            )
        
        elif shape == 'circle' or shape == 'ellipse':
            draw.ellipse(
                [(x, y), (x + width, y + height)],
                fill=fill_color,
                outline=stroke_color,
                width=stroke_width
            )
        
        elif shape == 'line':
            draw.line(
                [(x, y), (x + width, y + height)],
                fill=stroke_color or fill_color,
                width=stroke_width
            )
    
    def _render_qrcode(self, img, element, data, x, y, size):
        """Render QR code."""
        qr_data = element.get('data', '')
        qr_data = self._replace_placeholders(qr_data, data)
        
        if not qr_data:
            return
        
        qr_color = element.get('qrColor', '#000000')
        qr_bg = element.get('qrBackground', '#FFFFFF')
        error_correction = element.get('errorCorrection', 'M')
        
        # Map error correction
        ec_map = {
            'L': qrcode.constants.ERROR_CORRECT_L,
            'M': qrcode.constants.ERROR_CORRECT_M,
            'Q': qrcode.constants.ERROR_CORRECT_Q,
            'H': qrcode.constants.ERROR_CORRECT_H,
        }
        
        try:
            qr = qrcode.QRCode(
                version=1,
                error_correction=ec_map.get(error_correction, qrcode.constants.ERROR_CORRECT_M),
                box_size=10,
                border=0,
            )
            qr.add_data(qr_data)
            qr.make(fit=True)
            
            qr_img = qr.make_image(fill_color=qr_color, back_color=qr_bg)
            qr_img = qr_img.resize((size, size), Image.Resampling.LANCZOS)
            
            img.paste(qr_img, (x, y))
        except Exception as e:
            print(f"Error generating QR code: {e}")
    
    def _render_barcode(self, img, element, data, x, y, width, height):
        """Render barcode."""
        barcode_data = element.get('data', '')
        barcode_data = self._replace_placeholders(barcode_data, data)
        
        if not barcode_data:
            return
        
        try:
            # Generate barcode
            CODE128 = barcode.get_barcode_class('code128')
            barcode_obj = CODE128(barcode_data, writer=ImageWriter())
            
            buffer = BytesIO()
            barcode_obj.write(buffer, options={'write_text': False})
            buffer.seek(0)
            
            bc_img = Image.open(buffer)
            bc_img = bc_img.resize((width, height), Image.Resampling.LANCZOS)
            
            img.paste(bc_img, (x, y))
        except Exception as e:
            print(f"Error generating barcode: {e}")
    
    def _replace_placeholders(self, text, data):
        """Replace placeholders like {StudentName} with actual values."""
        if not isinstance(text, str):
            return str(text)
        
        for key, value in data.items():
            placeholder = f"{{{key}}}"
            text = text.replace(placeholder, str(value))
        return text


def generate_id_cards_bulk(design, queryset, card_type):
    """
    Generate ID cards for multiple records.
    
    Args:
        design: IDCardDesign instance
        queryset: QuerySet of students/staff
        card_type: 'STUDENT' or 'STAFF'
    
    Returns:
        List of PIL Images
    """
    renderer = IDCardRenderer(
        design.design_json,
        float(design.width_mm),
        float(design.height_mm)
    )
    
    cards = []
    
    for record in queryset:
        # Prepare data based on card type
        if card_type == 'STUDENT':
            enrollment = record.get_current_enrollment()
            
            data = {
                'StudentName': record.get_full_name(),
                'AdmissionNumber': record.admission_number,
                'Class': str(enrollment.section) if enrollment else 'N/A',
                'DOB': record.date_of_birth.strftime('%d/%m/%Y'),
                'BloodGroup': record.blood_group or 'N/A',
                'StudentPhoto': record.photo.path if record.photo else '',
                'FatherName': record.father_name,
                'FatherPhone': record.father_phone,
                'MotherName': record.mother_name,
                'Address': record.address[:50] if len(record.address) > 50 else record.address,
            }
        
        elif card_type == 'STAFF':
            # TODO: Implement staff data mapping
            data = {
                'StaffName': record.get_full_name() if hasattr(record, 'get_full_name') else str(record),
                'EmployeeID': getattr(record, 'employee_id', 'N/A'),
                'Department': getattr(record, 'department', 'N/A'),
                'Designation': getattr(record, 'designation', 'N/A'),
            }
        
        else:
            data = {}
        
        # Render card
        try:
            card_img = renderer.render(data)
            cards.append(card_img)
        except Exception as e:
            print(f"Error rendering card for {record}: {e}")
            continue
    
    return cards


def save_cards_as_pdf(cards, output_path):
    """
    Save ID cards as PDF.
    
    Args:
        cards: List of PIL Images
        output_path: Path to save PDF
    """
    if not cards:
        return
    
    # Create PDF
    c = canvas.Canvas(output_path, pagesize=letter)
    
    for card_img in cards:
        # Convert PIL image to ReportLab ImageReader
        img_buffer = BytesIO()
        card_img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        img_reader = ImageReader(img_buffer)
        
        # Add to PDF (centered on page)
        width, height = card_img.size
        # Convert pixels to points (72 points = 1 inch)
        width_pt = (width / 300) * 72
        height_pt = (height / 300) * 72
        
        # Center on page
        x = (letter[0] - width_pt) / 2
        y = (letter[1] - height_pt) / 2
        
        c.drawImage(img_reader, x, y, width=width_pt, height=height_pt)
        c.showPage()
    
    c.save()


def save_cards_as_zip(cards, output_path, prefix='card'):
    """
    Save ID cards as individual images in a ZIP file.
    
    Args:
        cards: List of PIL Images
        output_path: Path to save ZIP file
        prefix: Filename prefix for images
    """
    with zipfile.ZipFile(output_path, 'w') as zipf:
        for i, card_img in enumerate(cards, 1):
            # Save image to buffer
            img_buffer = BytesIO()
            card_img.save(img_buffer, format='PNG', dpi=(300, 300))
            img_buffer.seek(0)
            
            # Add to ZIP
            filename = f"{prefix}_{i:04d}.png"
            zipf.writestr(filename, img_buffer.getvalue())
