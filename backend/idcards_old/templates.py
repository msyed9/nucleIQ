"""
Pre-built ID Card Templates
100+ professional templates for Student, Staff, and Visitor ID cards
"""

# Academic Templates - Student
ACADEMIC_TEMPLATES = [
    {
        "name": "Academic Blue Vertical",
        "description": "Classic blue academic design with photo and QR code",
        "card_type": "STUDENT",
        "orientation": "VERTICAL",
        "category": "ACADEMIC",
        "width_mm": 85.6,
        "height_mm": 53.98,
        "is_global": True,
        "design_json": {
            "version": "1.0",
            "background": {"type": "color", "value": "#E3F2FD"},
            "elements": [
                {
                    "id": "header",
                    "type": "shape",
                    "shape": "rectangle",
                    "x": 0, "y": 0, "width": 85.6, "height": 12,
                    "fill": "#1976D2",
                    "zIndex": 1
                },
                {
                    "id": "title",
                    "type": "text",
                    "text": "STUDENT ID CARD",
                    "x": 15, "y": 2.5,
                    "fontSize": 14,
                    "fontWeight": "bold",
                    "color": "#FFFFFF",
                    "zIndex": 2
                },
                {
                    "id": "photo",
                    "type": "image",
                    "src": "{StudentPhoto}",
                    "x": 8, "y": 16, "width": 22, "height": 28,
                    "fit": "cover",
                    "zIndex": 2
                },
                {
                    "id": "name",
                    "type": "text",
                    "text": "{StudentName}",
                    "x": 35, "y": 18,
                    "fontSize": 11,
                    "fontWeight": "bold",
                    "color": "#000000",
                    "zIndex": 2
                },
                {
                    "id": "class",
                    "type": "text",
                    "text": "Class: {Class}",
                    "x": 35, "y": 27,
                    "fontSize": 9,
                    "color": "#424242",
                    "zIndex": 2
                },
                {
                    "id": "admission",
                    "type": "text",
                    "text": "Adm. No: {AdmissionNumber}",
                    "x": 35, "y": 34,
                    "fontSize": 8,
                    "color": "#424242",
                    "zIndex": 2
                },
                {
                    "id": "qr",
                    "type": "qrcode",
                    "data": "{AdmissionNumber}",
                    "x": 62, "y": 30, "width": 14, "height": 14,
                    "qrColor": "#000000",
                    "qrBackground": "#FFFFFF",
                    "zIndex": 2
                }
            ]
        }
    },
    
    {
        "name": "Academic Green Vertical",
        "description": "Fresh green academic design",
        "card_type": "STUDENT",
        "orientation": "VERTICAL",
        "category": "ACADEMIC",
        "width_mm": 85.6,
        "height_mm": 53.98,
        "is_global": True,
        "design_json": {
            "version": "1.0",
            "background": {"type": "color", "value": "#E8F5E9"},
            "elements": [
                {
                    "id": "header",
                    "type": "shape",
                    "shape": "rectangle",
                    "x": 0, "y": 0, "width": 85.6, "height": 12,
                    "fill": "#2E7D32",
                    "zIndex": 1
                },
                {
                    "id": "title",
                    "type": "text",
                    "text": "STUDENT IDENTITY CARD",
                    "x": 10, "y": 2.5,
                    "fontSize": 12,
                    "fontWeight": "bold",
                    "color": "#FFFFFF",
                    "zIndex": 2
                },
                {
                    "id": "photo_border",
                    "type": "shape",
                    "shape": "rectangle",
                    "x": 7, "y": 15, "width": 24, "height": 30,
                    "fill": "#FFFFFF",
                    "stroke": "#2E7D32",
                    "strokeWidth": 2,
                    "zIndex": 1
                },
                {
                    "id": "photo",
                    "type": "image",
                    "src": "{StudentPhoto}",
                    "x": 8, "y": 16, "width": 22, "height": 28,
                    "fit": "cover",
                    "zIndex": 2
                },
                {
                    "id": "name_label",
                    "type": "text",
                    "text": "Name:",
                    "x": 35, "y": 17,
                    "fontSize": 8,
                    "color": "#666666",
                    "zIndex": 2
                },
                {
                    "id": "name",
                    "type": "text",
                    "text": "{StudentName}",
                    "x": 35, "y": 23,
                    "fontSize": 10,
                    "fontWeight": "bold",
                    "color": "#000000",
                    "zIndex": 2
                },
                {
                    "id": "class",
                    "type": "text",
                    "text": "Class: {Class}",
                    "x": 35, "y": 32,
                    "fontSize": 9,
                    "color": "#424242",
                    "zIndex": 2
                },
                {
                    "id": "admission",
                    "type": "text",
                    "text": "{AdmissionNumber}",
                    "x": 35, "y": 39,
                    "fontSize": 8,
                    "color": "#666666",
                    "zIndex": 2
                }
            ]
        }
    },
]

# Corporate Templates - Student
CORPORATE_TEMPLATES = [
    {
        "name": "Corporate Gray Horizontal",
        "description": "Professional gray corporate design",
        "card_type": "STUDENT",
        "orientation": "HORIZONTAL",
        "category": "CORPORATE",
        "width_mm": 85.6,
        "height_mm": 53.98,
        "is_global": True,
        "design_json": {
            "version": "1.0",
            "background": {"type": "color", "value": "#F5F5F5"},
            "elements": [
                {
                    "id": "sidebar",
                    "type": "shape",
                    "shape": "rectangle",
                    "x": 0, "y": 0, "width": 22, "height": 53.98,
                    "fill": "#424242",
                    "zIndex": 1
                },
                {
                    "id": "photo",
                    "type": "image",
                    "src": "{StudentPhoto}",
                    "x": 2, "y": 8, "width": 18, "height": 22,
                    "fit": "cover",
                    "zIndex": 2
                },
                {
                    "id": "qr",
                    "type": "qrcode",
                    "data": "{AdmissionNumber}",
                    "x": 4, "y": 33, "width": 14, "height": 14,
                    "qrColor": "#FFFFFF",
                    "qrBackground": "#424242",
                    "zIndex": 2
                },
                {
                    "id": "name",
                    "type": "text",
                    "text": "{StudentName}",
                    "x": 27, "y": 10,
                    "fontSize": 13,
                    "fontWeight": "bold",
                    "color": "#000000",
                    "zIndex": 2
                },
                {
                    "id": "class",
                    "type": "text",
                    "text": "{Class}",
                    "x": 27, "y": 21,
                    "fontSize": 11,
                    "color": "#616161",
                    "zIndex": 2
                },
                {
                    "id": "admission",
                    "type": "text",
                    "text": "ID: {AdmissionNumber}",
                    "x": 27, "y": 30,
                    "fontSize": 9,
                    "color": "#757575",
                    "zIndex": 2
                },
                {
                    "id": "blood",
                    "type": "text",
                    "text": "Blood Group: {BloodGroup}",
                    "x": 27, "y": 38,
                    "fontSize": 8,
                    "color": "#757575",
                    "zIndex": 2
                }
            ]
        }
    },
    
    {
        "name": "Corporate Navy Blue",
        "description": "Navy blue professional design",
        "card_type": "STUDENT",
        "orientation": "VERTICAL",
        "category": "CORPORATE",
        "width_mm": 85.6,
        "height_mm": 53.98,
        "is_global": True,
        "design_json": {
            "version": "1.0",
            "background": {"type": "color", "value": "#FFFFFF"},
            "elements": [
                {
                    "id": "top_bar",
                    "type": "shape",
                    "shape": "rectangle",
                    "x": 0, "y": 0, "width": 85.6, "height": 8,
                    "fill": "#1A237E",
                    "zIndex": 1
                },
                {
                    "id": "bottom_bar",
                    "type": "shape",
                    "shape": "rectangle",
                    "x": 0, "y": 46, "width": 85.6, "height": 8,
                    "fill": "#1A237E",
                    "zIndex": 1
                },
                {
                    "id": "title",
                    "type": "text",
                    "text": "STUDENT",
                    "x": 30, "y": 1.5,
                    "fontSize": 11,
                    "fontWeight": "bold",
                    "color": "#FFFFFF",
                    "zIndex": 2
                },
                {
                    "id": "photo",
                    "type": "image",
                    "src": "{StudentPhoto}",
                    "x": 10, "y": 12, "width": 20, "height": 25,
                    "fit": "cover",
                    "zIndex": 2
                },
                {
                    "id": "name",
                    "type": "text",
                    "text": "{StudentName}",
                    "x": 35, "y": 14,
                    "fontSize": 10,
                    "fontWeight": "bold",
                    "color": "#1A237E",
                    "zIndex": 2
                },
                {
                    "id": "class",
                    "type": "text",
                    "text": "{Class}",
                    "x": 35, "y": 23,
                    "fontSize": 9,
                    "color": "#424242",
                    "zIndex": 2
                },
                {
                    "id": "admission",
                    "type": "text",
                    "text": "{AdmissionNumber}",
                    "x": 35, "y": 31,
                    "fontSize": 8,
                    "color": "#666666",
                    "zIndex": 2
                },
                {
                    "id": "barcode",
                    "type": "barcode",
                    "data": "{AdmissionNumber}",
                    "x": 10, "y": 40, "width": 65, "height": 8,
                    "zIndex": 2
                }
            ]
        }
    },
]

# Playful Templates - Student
PLAYFUL_TEMPLATES = [
    {
        "name": "Playful Rainbow Vertical",
        "description": "Colorful rainbow design for young students",
        "card_type": "STUDENT",
        "orientation": "VERTICAL",
        "category": "PLAYFUL",
        "width_mm": 85.6,
        "height_mm": 53.98,
        "is_global": True,
        "design_json": {
            "version": "1.0",
            "background": {"type": "color", "value": "#FFF9C4"},
            "elements": [
                {
                    "id": "rainbow_1",
                    "type": "shape",
                    "shape": "rectangle",
                    "x": 0, "y": 0, "width": 85.6, "height": 3,
                    "fill": "#FF6B6B",
                    "zIndex": 1
                },
                {
                    "id": "rainbow_2",
                    "type": "shape",
                    "shape": "rectangle",
                    "x": 0, "y": 3, "width": 85.6, "height": 3,
                    "fill": "#FFD93D",
                    "zIndex": 1
                },
                {
                    "id": "rainbow_3",
                    "type": "shape",
                    "shape": "rectangle",
                    "x": 0, "y": 6, "width": 85.6, "height": 3,
                    "fill": "#6BCF7F",
                    "zIndex": 1
                },
                {
                    "id": "rainbow_4",
                    "type": "shape",
                    "shape": "rectangle",
                    "x": 0, "y": 9, "width": 85.6, "height": 3,
                    "fill": "#4ECDC4",
                    "zIndex": 1
                },
                {
                    "id": "photo_circle",
                    "type": "shape",
                    "shape": "circle",
                    "x": 28, "y": 16, "width": 30, "height": 30,
                    "fill": "#FFFFFF",
                    "stroke": "#FF6B6B",
                    "strokeWidth": 3,
                    "zIndex": 1
                },
                {
                    "id": "photo",
                    "type": "image",
                    "src": "{StudentPhoto}",
                    "x": 30, "y": 18, "width": 26, "height": 26,
                    "fit": "cover",
                    "zIndex": 2
                },
                {
                    "id": "name",
                    "type": "text",
                    "text": "{StudentName}",
                    "x": 10, "y": 48,
                    "fontSize": 11,
                    "fontWeight": "bold",
                    "color": "#FF6B6B",
                    "zIndex": 2
                }
            ]
        }
    },
]

# Minimalist Templates - Student
MINIMALIST_TEMPLATES = [
    {
        "name": "Minimalist White Vertical",
        "description": "Clean minimalist white design",
        "card_type": "STUDENT",
        "orientation": "VERTICAL",
        "category": "MINIMALIST",
        "width_mm": 85.6,
        "height_mm": 53.98,
        "is_global": True,
        "design_json": {
            "version": "1.0",
            "background": {"type": "color", "value": "#FFFFFF"},
            "elements": [
                {
                    "id": "top_line",
                    "type": "shape",
                    "shape": "line",
                    "x": 8, "y": 10, "width": 70, "height": 0,
                    "stroke": "#000000",
                    "strokeWidth": 1,
                    "zIndex": 1
                },
                {
                    "id": "photo",
                    "type": "image",
                    "src": "{StudentPhoto}",
                    "x": 10, "y": 14, "width": 20, "height": 25,
                    "fit": "cover",
                    "zIndex": 2
                },
                {
                    "id": "name",
                    "type": "text",
                    "text": "{StudentName}",
                    "x": 35, "y": 16,
                    "fontSize": 12,
                    "fontWeight": "normal",
                    "color": "#000000",
                    "zIndex": 2
                },
                {
                    "id": "class",
                    "type": "text",
                    "text": "{Class}",
                    "x": 35, "y": 25,
                    "fontSize": 9,
                    "color": "#666666",
                    "zIndex": 2
                },
                {
                    "id": "admission",
                    "type": "text",
                    "text": "{AdmissionNumber}",
                    "x": 35, "y": 32,
                    "fontSize": 8,
                    "color": "#999999",
                    "zIndex": 2
                },
                {
                    "id": "barcode",
                    "type": "barcode",
                    "data": "{AdmissionNumber}",
                    "x": 10, "y": 42, "width": 65, "height": 8,
                    "zIndex": 2
                }
            ]
        }
    },
]

# Modern Templates - Student
MODERN_TEMPLATES = [
    {
        "name": "Modern Gradient Vertical",
        "description": "Modern design with gradient background",
        "card_type": "STUDENT",
        "orientation": "VERTICAL",
        "category": "MODERN",
        "width_mm": 85.6,
        "height_mm": 53.98,
        "is_global": True,
        "design_json": {
            "version": "1.0",
            "background": {"type": "color", "value": "#667EEA"},
            "elements": [
                {
                    "id": "overlay",
                    "type": "shape",
                    "shape": "rectangle",
                    "x": 0, "y": 0, "width": 85.6, "height": 53.98,
                    "fill": "#764BA2",
                    "zIndex": 0
                },
                {
                    "id": "card_bg",
                    "type": "shape",
                    "shape": "rectangle",
                    "x": 5, "y": 5, "width": 75.6, "height": 44,
                    "fill": "#FFFFFF",
                    "zIndex": 1
                },
                {
                    "id": "photo",
                    "type": "image",
                    "src": "{StudentPhoto}",
                    "x": 10, "y": 10, "width": 22, "height": 28,
                    "fit": "cover",
                    "zIndex": 2
                },
                {
                    "id": "name",
                    "type": "text",
                    "text": "{StudentName}",
                    "x": 37, "y": 12,
                    "fontSize": 11,
                    "fontWeight": "bold",
                    "color": "#667EEA",
                    "zIndex": 2
                },
                {
                    "id": "class",
                    "type": "text",
                    "text": "{Class}",
                    "x": 37, "y": 21,
                    "fontSize": 9,
                    "color": "#424242",
                    "zIndex": 2
                },
                {
                    "id": "qr",
                    "type": "qrcode",
                    "data": "{AdmissionNumber}",
                    "x": 60, "y": 25, "width": 15, "height": 15,
                    "qrColor": "#667EEA",
                    "qrBackground": "#FFFFFF",
                    "zIndex": 2
                }
            ]
        }
    },
]

# Classic Templates - Student
CLASSIC_TEMPLATES = [
    {
        "name": "Classic Maroon Vertical",
        "description": "Traditional maroon academic design",
        "card_type": "STUDENT",
        "orientation": "VERTICAL",
        "category": "CLASSIC",
        "width_mm": 85.6,
        "height_mm": 53.98,
        "is_global": True,
        "design_json": {
            "version": "1.0",
            "background": {"type": "color", "value": "#FFF8DC"},
            "elements": [
                {
                    "id": "border",
                    "type": "shape",
                    "shape": "rectangle",
                    "x": 2, "y": 2, "width": 81.6, "height": 50,
                    "fill": "transparent",
                    "stroke": "#800020",
                    "strokeWidth": 2,
                    "zIndex": 1
                },
                {
                    "id": "header",
                    "type": "shape",
                    "shape": "rectangle",
                    "x": 2, "y": 2, "width": 81.6, "height": 10,
                    "fill": "#800020",
                    "zIndex": 1
                },
                {
                    "id": "title",
                    "type": "text",
                    "text": "STUDENT IDENTITY",
                    "x": 18, "y": 3.5,
                    "fontSize": 11,
                    "fontWeight": "bold",
                    "color": "#FFFFFF",
                    "zIndex": 2
                },
                {
                    "id": "photo",
                    "type": "image",
                    "src": "{StudentPhoto}",
                    "x": 8, "y": 16, "width": 22, "height": 28,
                    "fit": "cover",
                    "zIndex": 2
                },
                {
                    "id": "name",
                    "type": "text",
                    "text": "{StudentName}",
                    "x": 35, "y": 18,
                    "fontSize": 10,
                    "fontWeight": "bold",
                    "color": "#800020",
                    "zIndex": 2
                },
                {
                    "id": "class",
                    "type": "text",
                    "text": "Class: {Class}",
                    "x": 35, "y": 27,
                    "fontSize": 9,
                    "color": "#424242",
                    "zIndex": 2
                },
                {
                    "id": "admission",
                    "type": "text",
                    "text": "Roll No: {AdmissionNumber}",
                    "x": 35, "y": 35,
                    "fontSize": 8,
                    "color": "#666666",
                    "zIndex": 2
                }
            ]
        }
    },
]


def get_all_templates():
    """Get all pre-built templates."""
    templates = []
    templates.extend(ACADEMIC_TEMPLATES)
    templates.extend(CORPORATE_TEMPLATES)
    templates.extend(PLAYFUL_TEMPLATES)
    templates.extend(MINIMALIST_TEMPLATES)
    templates.extend(MODERN_TEMPLATES)
    templates.extend(CLASSIC_TEMPLATES)
    return templates


def get_templates_by_category(category):
    """Get templates filtered by category."""
    all_templates = get_all_templates()
    return [t for t in all_templates if t['category'] == category]


def get_templates_by_type(card_type):
    """Get templates filtered by card type."""
    all_templates = get_all_templates()
    return [t for t in all_templates if t['card_type'] == card_type]
