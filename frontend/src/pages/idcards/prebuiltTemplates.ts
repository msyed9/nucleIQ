/**
 * Pre-built ID Card Templates
 * 100+ professionally designed templates for various use cases
 * Portrait templates use proper portrait dimensions (54x86 or 53.98x85.6)
 */

export interface PrebuiltTemplate {
    id: string;
    name: string;
    description: string;
    category: 'student' | 'staff' | 'visitor' | 'event' | 'corporate' | 'medical' | 'library' | 'sports' | 'transport' | 'access';
    orientation: 'portrait' | 'landscape';
    style: 'modern' | 'classic' | 'minimal' | 'colorful' | 'professional' | 'elegant' | 'bold' | 'gradient';
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
    };
    dimensions: {
        width: number;  // in mm
        height: number; // in mm
    };
    design: {
        version: string;
        background: {
            type: 'color' | 'gradient' | 'image';
            value?: string;
            gradient?: string;
            image_url?: string;
        };
        elements: any[];
    };
    thumbnail?: string;
}

// Standard ID Card Sizes
export const CARD_SIZES = {
    CR80: { name: 'CR80 Landscape (86x54)', width: 85.6, height: 53.98 },
    CR80_PORTRAIT: { name: 'CR80 Portrait (54x86)', width: 53.98, height: 85.6 },
    CR79: { name: 'CR79 (Adhesive Back)', width: 83.9, height: 51.0 },
    CR100: { name: 'CR100 (Large)', width: 99.0, height: 67.0 },
    A7: { name: 'A7 Portrait', width: 74, height: 105 },
    A7_LANDSCAPE: { name: 'A7 Landscape', width: 105, height: 74 },
    PORTRAIT_STANDARD: { name: 'Portrait Standard (54x86)', width: 54, height: 86 },
    LANDSCAPE_STANDARD: { name: 'Landscape Standard (86x54)', width: 86, height: 54 },
    BADGE: { name: 'Badge (3x4)', width: 76.2, height: 101.6 },
    BADGE_LANDSCAPE: { name: 'Badge Landscape (4x3)', width: 101.6, height: 76.2 },
    CUSTOM: { name: 'Custom Size', width: 85.6, height: 53.98 },
};

// Portrait card dimensions (width x height = 54 x 86)
const PORTRAIT_DIMS = { width: 54, height: 86 };
const LANDSCAPE_DIMS = { width: 86, height: 54 };

// Color Palettes
const PALETTES = {
    royal: { primary: '#2C3E50', secondary: '#3498DB', accent: '#E74C3C', background: '#FFFFFF', text: '#2C3E50' },
    forest: { primary: '#27AE60', secondary: '#2ECC71', accent: '#F39C12', background: '#FFFFFF', text: '#2C3E50' },
    ocean: { primary: '#0077B6', secondary: '#00B4D8', accent: '#90E0EF', background: '#CAF0F8', text: '#03045E' },
    sunset: { primary: '#FF6B6B', secondary: '#FFA07A', accent: '#FFD93D', background: '#FFF5EE', text: '#2C2C2C' },
    purple: { primary: '#6C63FF', secondary: '#9D4EDD', accent: '#E0AAFF', background: '#F8F0FF', text: '#240046' },
    corporate: { primary: '#1A237E', secondary: '#303F9F', accent: '#7986CB', background: '#E8EAF6', text: '#1A237E' },
    medical: { primary: '#00897B', secondary: '#26A69A', accent: '#80CBC4', background: '#E0F2F1', text: '#004D40' },
    education: { primary: '#5C6BC0', secondary: '#7986CB', accent: '#C5CAE9', background: '#E8EAF6', text: '#1A237E' },
    gold: { primary: '#B8860B', secondary: '#DAA520', accent: '#FFD700', background: '#FFFAF0', text: '#2C2C2C' },
    dark: { primary: '#1A1A2E', secondary: '#16213E', accent: '#0F3460', background: '#E94560', text: '#FFFFFF' },
    nature: { primary: '#4CAF50', secondary: '#8BC34A', accent: '#CDDC39', background: '#F1F8E9', text: '#33691E' },
    cherry: { primary: '#C2185B', secondary: '#E91E63', accent: '#F8BBD0', background: '#FCE4EC', text: '#880E4F' },
    sky: { primary: '#039BE5', secondary: '#4FC3F7', accent: '#B3E5FC', background: '#E1F5FE', text: '#01579B' },
    earth: { primary: '#795548', secondary: '#A1887F', accent: '#D7CCC8', background: '#EFEBE9', text: '#3E2723' },
    neon: { primary: '#00FF88', secondary: '#00E5FF', accent: '#FF00FF', background: '#0D0D0D', text: '#FFFFFF' },
    teal: { primary: '#009688', secondary: '#4DB6AC', accent: '#80CBC4', background: '#E0F2F1', text: '#004D40' },
    indigo: { primary: '#3F51B5', secondary: '#5C6BC0', accent: '#9FA8DA', background: '#E8EAF6', text: '#1A237E' },
    amber: { primary: '#FF8F00', secondary: '#FFA000', accent: '#FFD54F', background: '#FFF8E1', text: '#E65100' },
};

// Helper to create basic element structure - adapted for portrait layout
const createTextElement = (id: string, text: string, x: number, y: number, fontSize: number, color: string, fontWeight = 'normal', width = 44, height = 6) => ({
    id,
    type: 'text',
    x,
    y,
    width,
    height,
    text,
    fontSize,
    fontWeight,
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center' as const,
    color,
    zIndex: 10
});

const createImageElement = (id: string, x: number, y: number, width: number, height: number, placeholder: string) => ({
    id,
    type: 'image',
    x,
    y,
    width,
    height,
    src: placeholder,
    zIndex: 5
});

const createQRElement = (id: string, x: number, y: number, size: number, data: string) => ({
    id,
    type: 'qrcode',
    x,
    y,
    width: size,
    height: size,
    data,
    qrColor: '#000000',
    qrBackground: '#FFFFFF',
    zIndex: 8
});

const createShapeElement = (id: string, x: number, y: number, width: number, height: number, fill: string, shape = 'rectangle') => ({
    id,
    type: 'shape',
    x,
    y,
    width,
    height,
    shape,
    fill,
    stroke: 'transparent',
    strokeWidth: 0,
    zIndex: 1
});

// Generate Pre-built Templates
export const PREBUILT_TEMPLATES: PrebuiltTemplate[] = [
    // ==========================================
    // === STUDENT PORTRAIT TEMPLATES (1-30) ===
    // ==========================================
    {
        id: 'student-portrait-premium-corporate',
        name: 'Student Portrait - Premium Corporate',
        description: 'Elite corporate design with professional background image',
        category: 'student',
        orientation: 'portrait',
        style: 'modern',
        colors: PALETTES.royal,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'image', image_url: '/media/idcards/bgs/corporate_portrait.png' },
            elements: [
                createTextElement('school-name', '{{school_name}}', 2, 6, 11, '#1A237E', 'bold', 50, 8),
                createImageElement('photo', 6, 30, 26, 32, '{{photo}}'),
                createTextElement('name', '{{student_name}}', 2, 64, 11, '#FFFFFF', 'bold', 50, 7),
                createTextElement('class', 'Class: {{class}} - {{section}}', 2, 72, 8, '#CCCCCC', 'normal', 50, 5),
                createTextElement('adm', 'Adm: {{admission_number}}', 2, 78, 7, '#FFFFFF', 'normal', 30, 5),
                createQRElement('qr', 38, 72, 12, '{{admission_number}}')
            ]
        }
    },
    {
        id: 'student-portrait-premium-fresh',
        name: 'Student Portrait - Premium Fresh',
        description: 'Fresh eco-inspired design with background image',
        category: 'student',
        orientation: 'portrait',
        style: 'modern',
        colors: PALETTES.forest,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'image', image_url: '/media/idcards/bgs/fresh_green_portrait.png' },
            elements: [
                createTextElement('school-name', '{{school_name}}', 2, 12, 10, '#11998e', 'bold', 50, 7),
                createImageElement('photo', 12, 26, 30, 36, '{{photo}}'),
                createTextElement('name', '{{student_name}}', 2, 64, 11, '#11998e', 'bold', 50, 7),
                createTextElement('class', '{{class}} | {{section}}', 2, 73, 9, '#333333', 'normal', 50, 5),
                createTextElement('adm', 'Adm: {{admission_number}}', 2, 80, 7, '#666666', 'normal', 30, 5),
                createQRElement('qr', 38, 70, 12, '{{admission_number}}')
            ]
        }
    },
    {
        id: 'student-portrait-classic-navy',
        name: 'Student Portrait - Classic Navy',
        description: 'Traditional navy blue portrait design',
        category: 'student',
        orientation: 'portrait',
        style: 'classic',
        colors: PALETTES.corporate,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'color', value: '#FFFFFF' },
            elements: [
                createShapeElement('header', 0, 0, 54, 12, '#1A237E'),
                createTextElement('school-name', '{{school_name}}', 2, 2, 9, '#FFFFFF', 'bold', 50, 7),
                createShapeElement('photo-border', 11, 15, 32, 38, '#1A237E'),
                createImageElement('photo', 12, 16, 30, 36, '{{photo}}'),
                createTextElement('name', '{{student_name}}', 2, 56, 10, '#1A237E', 'bold', 50, 7),
                createTextElement('class', 'Class: {{class}} - {{section}}', 2, 64, 8, '#333333', 'normal', 50, 5),
                createTextElement('adm', 'Admission No: {{admission_number}}', 2, 71, 6, '#333333', 'normal', 50, 4),
                createQRElement('qr', 36, 75, 14, '{{admission_number}}')
            ]
        }
    },
    {
        id: 'student-portrait-minimal-white',
        name: 'Student Portrait - Minimal White',
        description: 'Clean minimalist white portrait',
        category: 'student',
        orientation: 'portrait',
        style: 'minimal',
        colors: { primary: '#333333', secondary: '#666666', accent: '#000000', background: '#FFFFFF', text: '#333333' },
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'color', value: '#FFFFFF' },
            elements: [
                createTextElement('school-name', '{{school_name}}', 2, 4, 9, '#333333', 'bold', 50, 6),
                createShapeElement('line', 2, 12, 50, 0.5, '#DDDDDD'),
                createImageElement('photo', 12, 16, 30, 36, '{{photo}}'),
                createTextElement('name', '{{student_name}}', 2, 56, 11, '#000000', 'bold', 50, 7),
                createTextElement('class', '{{class}} - {{section}}', 2, 64, 8, '#666666', 'normal', 50, 5),
                createTextElement('adm', '{{admission_number}}', 2, 72, 7, '#999999', 'normal', 30, 5),
                createQRElement('qr', 36, 68, 14, '{{admission_number}}')
            ]
        }
    },
    {
        id: 'student-portrait-colorful-rainbow',
        name: 'Student Portrait - Rainbow Kids',
        description: 'Vibrant colorful design for young students',
        category: 'student',
        orientation: 'portrait',
        style: 'colorful',
        colors: PALETTES.sunset,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient', value: 'linear-gradient(180deg, #FF6B6B 0%, #FFA07A 50%, #FFD93D 100%)' },
            elements: [
                createShapeElement('header', 0, 0, 54, 10, '#FFFFFF40'),
                createTextElement('school-name', '{{school_name}}', 2, 2, 8, '#FFFFFF', 'bold', 50, 6),
                createShapeElement('photo-circle', 10, 14, 34, 38, '#FFFFFF'),
                createImageElement('photo', 12, 16, 30, 34, '{{photo}}'),
                createTextElement('name', '{{student_name}}', 2, 56, 10, '#FFFFFF', 'bold', 50, 7),
                createTextElement('class', 'Class: {{class}} | {{section}}', 2, 64, 8, '#FFFFFF', 'normal', 50, 5),
                createQRElement('qr', 36, 72, 14, '{{admission_number}}')
            ]
        }
    },
    {
        id: 'student-portrait-elegant-gold',
        name: 'Student Portrait - Premium Gold',
        description: 'Elegant gold accented design',
        category: 'student',
        orientation: 'portrait',
        style: 'elegant',
        colors: PALETTES.gold,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient', value: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)' },
            elements: [
                createShapeElement('gold-bar-top', 0, 0, 54, 2, '#DAA520'),
                createTextElement('school-name', '{{school_name}}', 2, 5, 9, '#DAA520', 'bold', 50, 6),
                createShapeElement('photo-border', 11, 14, 32, 38, '#DAA520'),
                createImageElement('photo', 12, 15, 30, 36, '{{photo}}'),
                createTextElement('name', '{{student_name}}', 2, 55, 10, '#FFFFFF', 'bold', 50, 7),
                createTextElement('class', 'Class: {{class}} - {{section}}', 2, 63, 8, '#CCCCCC', 'normal', 50, 5),
                createShapeElement('gold-bar-bottom', 0, 82, 54, 2, '#DAA520'),
                createQRElement('qr', 36, 70, 14, '{{admission_number}}')
            ]
        }
    },
    {
        id: 'student-portrait-bold-dark',
        name: 'Student Portrait - Bold Dark',
        description: 'Bold dark theme with accent',
        category: 'student',
        orientation: 'portrait',
        style: 'bold',
        colors: PALETTES.dark,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'color', value: '#1A1A2E' },
            elements: [
                createShapeElement('accent-bar', 0, 0, 4, 86, '#E94560'),
                createTextElement('school-name', '{{school_name}}', 6, 4, 8, '#E94560', 'bold', 46, 6),
                createImageElement('photo', 12, 14, 30, 36, '{{photo}}'),
                createTextElement('name', '{{student_name}}', 6, 54, 10, '#FFFFFF', 'bold', 46, 7),
                createTextElement('class', 'Class: {{class}} - {{section}}', 6, 62, 8, '#CCCCCC', 'normal', 46, 5),
                createTextElement('adm', '{{admission_number}}', 6, 70, 7, '#E94560', 'normal', 26, 5),
                createQRElement('qr', 36, 68, 14, '{{admission_number}}')
            ]
        }
    },
    {
        id: 'student-portrait-nature-eco',
        name: 'Student Portrait - Eco Green',
        description: 'Eco-friendly green design',
        category: 'student',
        orientation: 'portrait',
        style: 'modern',
        colors: PALETTES.nature,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient', value: 'linear-gradient(180deg, #4CAF50 0%, #8BC34A 100%)' },
            elements: [
                createTextElement('school-name', '{{school_name}}', 2, 4, 9, '#FFFFFF', 'bold', 50, 6),
                createShapeElement('photo-frame', 10, 14, 34, 40, '#FFFFFF'),
                createImageElement('photo', 12, 16, 30, 36, '{{photo}}'),
                createTextElement('name', '{{student_name}}', 2, 58, 10, '#FFFFFF', 'bold', 50, 7),
                createTextElement('class', 'Class: {{class}} | {{section}}', 2, 66, 8, '#F1F8E9', 'normal', 50, 5),
                createQRElement('qr', 36, 74, 14, '{{admission_number}}')
            ]
        }
    },
    {
        id: 'student-portrait-cherry-blossom',
        name: 'Student Portrait - Cherry Blossom',
        description: 'Beautiful pink cherry theme',
        category: 'student',
        orientation: 'portrait',
        style: 'elegant',
        colors: PALETTES.cherry,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient', value: 'linear-gradient(180deg, #E91E63 0%, #F8BBD0 100%)' },
            elements: [
                createTextElement('school-name', '{{school_name}}', 2, 4, 9, '#FFFFFF', 'bold', 50, 6),
                createImageElement('photo', 12, 14, 30, 36, '{{photo}}'),
                createTextElement('name', '{{student_name}}', 2, 54, 10, '#FFFFFF', 'bold', 50, 7),
                createTextElement('class', '{{class}} - {{section}}', 2, 62, 8, '#FCE4EC', 'normal', 50, 5),
                createQRElement('qr', 36, 70, 14, '{{admission_number}}')
            ]
        }
    },
    {
        id: 'student-portrait-ocean-wave',
        name: 'Student Portrait - Ocean Wave',
        description: 'Calming ocean blue design',
        category: 'student',
        orientation: 'portrait',
        style: 'modern',
        colors: PALETTES.ocean,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient', value: 'linear-gradient(180deg, #0077B6 0%, #00B4D8 50%, #90E0EF 100%)' },
            elements: [
                createTextElement('school-name', '{{school_name}}', 2, 4, 9, '#FFFFFF', 'bold', 50, 6),
                createImageElement('photo', 12, 14, 30, 36, '{{photo}}'),
                createTextElement('name', '{{student_name}}', 2, 54, 10, '#03045E', 'bold', 50, 7),
                createTextElement('class', 'Class: {{class}} - {{section}}', 2, 62, 8, '#03045E', 'normal', 50, 5),
                createTextElement('adm', '{{admission_number}}', 2, 70, 7, '#FFFFFF', 'normal', 30, 5),
                createQRElement('qr', 36, 68, 14, '{{admission_number}}')
            ]
        }
    },
    // More portrait student templates
    {
        id: 'student-portrait-purple-gradient',
        name: 'Student Portrait - Purple Dream',
        description: 'Elegant purple gradient design',
        category: 'student',
        orientation: 'portrait',
        style: 'gradient',
        colors: PALETTES.purple,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient', value: 'linear-gradient(180deg, #6C63FF 0%, #9D4EDD 100%)' },
            elements: [
                createShapeElement('header', 0, 0, 54, 12, '#FFFFFF20'),
                createTextElement('school-name', '{{school_name}}', 2, 2, 9, '#FFFFFF', 'bold', 50, 7),
                createImageElement('photo', 12, 16, 30, 36, '{{photo}}'),
                createTextElement('name', '{{student_name}}', 2, 56, 10, '#FFFFFF', 'bold', 50, 7),
                createTextElement('class', '{{class}} - {{section}}', 2, 64, 8, '#E0AAFF', 'normal', 50, 5),
                createTextElement('adm', '{{admission_number}}', 2, 72, 7, '#E0AAFF', 'normal', 30, 5),
                createQRElement('qr', 36, 70, 14, '{{admission_number}}')
            ]
        }
    },
    {
        id: 'student-portrait-teal-modern',
        name: 'Student Portrait - Teal Modern',
        description: 'Modern teal color scheme',
        category: 'student',
        orientation: 'portrait',
        style: 'modern',
        colors: PALETTES.teal,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient', value: 'linear-gradient(180deg, #009688 0%, #4DB6AC 100%)' },
            elements: [
                createTextElement('school-name', '{{school_name}}', 2, 4, 9, '#FFFFFF', 'bold', 50, 6),
                createShapeElement('photo-border', 11, 13, 32, 38, '#FFFFFF40'),
                createImageElement('photo', 12, 14, 30, 36, '{{photo}}'),
                createTextElement('name', '{{student_name}}', 2, 56, 10, '#FFFFFF', 'bold', 50, 7),
                createTextElement('class', 'Class: {{class}} | Section: {{section}}', 2, 64, 7, '#FFFFFF', 'normal', 50, 5),
                createQRElement('qr', 36, 72, 14, '{{admission_number}}')
            ]
        }
    },
    {
        id: 'student-portrait-indigo-professional',
        name: 'Student Portrait - Indigo Pro',
        description: 'Professional indigo design',
        category: 'student',
        orientation: 'portrait',
        style: 'professional',
        colors: PALETTES.indigo,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient', value: 'linear-gradient(180deg, #3F51B5 0%, #5C6BC0 100%)' },
            elements: [
                createShapeElement('header', 0, 0, 54, 14, '#1A237E'),
                createTextElement('school-name', '{{school_name}}', 2, 3, 9, '#FFFFFF', 'bold', 50, 7),
                createImageElement('photo', 12, 18, 30, 36, '{{photo}}'),
                createTextElement('name', '{{student_name}}', 2, 58, 10, '#FFFFFF', 'bold', 50, 7),
                createTextElement('class', 'Class: {{class}} - {{section}}', 2, 66, 8, '#9FA8DA', 'normal', 50, 5),
                createTextElement('adm', 'ID: {{admission_number}}', 2, 74, 7, '#FFFFFF', 'normal', 30, 5),
                createQRElement('qr', 36, 72, 14, '{{admission_number}}')
            ]
        }
    },
    {
        id: 'student-portrait-amber-warm',
        name: 'Student Portrait - Warm Amber',
        description: 'Warm amber color scheme',
        category: 'student',
        orientation: 'portrait',
        style: 'colorful',
        colors: PALETTES.amber,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient', value: 'linear-gradient(180deg, #FF8F00 0%, #FFA000 50%, #FFD54F 100%)' },
            elements: [
                createTextElement('school-name', '{{school_name}}', 2, 4, 9, '#FFFFFF', 'bold', 50, 6),
                createImageElement('photo', 12, 14, 30, 36, '{{photo}}'),
                createTextElement('name', '{{student_name}}', 2, 54, 10, '#E65100', 'bold', 50, 7),
                createTextElement('class', '{{class}} - {{section}}', 2, 62, 8, '#FFFFFF', 'normal', 50, 5),
                createQRElement('qr', 36, 70, 14, '{{admission_number}}')
            ]
        }
    },
    {
        id: 'student-portrait-sky-light',
        name: 'Student Portrait - Sky Light',
        description: 'Light sky blue design',
        category: 'student',
        orientation: 'portrait',
        style: 'minimal',
        colors: PALETTES.sky,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient', value: 'linear-gradient(180deg, #039BE5 0%, #4FC3F7 50%, #B3E5FC 100%)' },
            elements: [
                createTextElement('school-name', '{{school_name}}', 2, 4, 9, '#01579B', 'bold', 50, 6),
                createShapeElement('photo-frame', 10, 12, 34, 40, '#FFFFFF'),
                createImageElement('photo', 12, 14, 30, 36, '{{photo}}'),
                createTextElement('name', '{{student_name}}', 2, 56, 10, '#01579B', 'bold', 50, 7),
                createTextElement('class', 'Class: {{class}} | {{section}}', 2, 64, 8, '#01579B', 'normal', 50, 5),
                createQRElement('qr', 36, 72, 14, '{{admission_number}}')
            ]
        }
    },
    // Generate more student portrait templates programmatically
    ...Array.from({ length: 15 }, (_, i) => ({
        id: `student-portrait-auto-${i + 16}`,
        name: `Student Portrait ${i + 16}`,
        description: `Pre-built portrait student template ${i + 16}`,
        category: 'student' as const,
        orientation: 'portrait' as const,
        style: ['modern', 'classic', 'minimal', 'colorful', 'professional', 'elegant', 'bold', 'gradient'][i % 8] as any,
        colors: Object.values(PALETTES)[i % Object.values(PALETTES).length],
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient' as const, value: `linear-gradient(${180 + i * 10}deg, ${Object.values(PALETTES)[i % Object.values(PALETTES).length].primary} 0%, ${Object.values(PALETTES)[i % Object.values(PALETTES).length].secondary} 100%)` },
            elements: [
                createTextElement('school-name', '{{school_name}}', 2, 4, 9, '#FFFFFF', 'bold', 50, 6),
                createImageElement('photo', 12, 14, 30, 36, '{{photo}}'),
                createTextElement('name', '{{student_name}}', 2, 54, 10, '#FFFFFF', 'bold', 50, 7),
                createTextElement('class', '{{class}} - {{section}}', 2, 62, 8, '#FFFFFF', 'normal', 50, 5),
                createQRElement('qr', 36, 70, 14, '{{admission_number}}')
            ]
        }
    })),

    // ===========================================
    // === STAFF PORTRAIT TEMPLATES (31-60) ===
    // ===========================================
    {
        id: 'staff-portrait-premium-navy',
        name: 'Staff Portrait - Premium Elite',
        description: 'Elite professional staff ID with premium background',
        category: 'staff',
        orientation: 'portrait',
        style: 'professional',
        colors: PALETTES.corporate,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'image', image_url: '/media/idcards/bgs/corporate_portrait.png' },
            elements: [
                createTextElement('org-name', '{{school_name}}', 2, 6, 11, '#1A237E', 'bold', 50, 8),
                createImageElement('photo', 6, 28, 24, 30, '{{photo}}'),
                createTextElement('name', '{{staff_name}}', 2, 62, 11, '#FFFFFF', 'bold', 50, 7),
                createTextElement('designation', '{{designation}}', 2, 70, 8, '#CCCCCC', 'normal', 50, 5),
                createTextElement('dept', '{{department}}', 2, 78, 7, '#FFFFFF', 'normal', 30, 4),
                createQRElement('qr', 38, 72, 12, '{{employee_id}}')
            ]
        }
    },
    {
        id: 'staff-portrait-professional-navy',
        name: 'Staff Portrait - Professional Navy',
        description: 'Corporate professional staff ID',
        category: 'staff',
        orientation: 'portrait',
        style: 'professional',
        colors: PALETTES.corporate,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient', value: 'linear-gradient(180deg, #1A237E 0%, #303F9F 100%)' },
            elements: [
                createTextElement('org-name', '{{school_name}}', 2, 4, 9, '#FFFFFF', 'bold', 50, 6),
                createImageElement('photo', 12, 14, 30, 36, '{{photo}}'),
                createTextElement('name', '{{staff_name}}', 2, 54, 10, '#FFFFFF', 'bold', 50, 7),
                createTextElement('designation', '{{designation}}', 2, 62, 8, '#C5CAE9', 'normal', 50, 5),
                createTextElement('dept', 'Dept: {{department}}', 2, 70, 7, '#C5CAE9', 'normal', 30, 4),
                createTextElement('emp-id', 'ID: {{employee_id}}', 2, 76, 6, '#FFFFFF', 'normal', 26, 4),
                createQRElement('qr', 36, 68, 14, '{{employee_id}}')
            ]
        }
    },
    {
        id: 'staff-portrait-modern-blue',
        name: 'Staff Portrait - Modern Blue',
        description: 'Modern blue gradient staff ID',
        category: 'staff',
        orientation: 'portrait',
        style: 'modern',
        colors: PALETTES.sky,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient', value: 'linear-gradient(180deg, #039BE5 0%, #4FC3F7 100%)' },
            elements: [
                createShapeElement('header', 0, 0, 54, 12, '#01579B'),
                createTextElement('org-name', '{{school_name}}', 2, 2, 9, '#FFFFFF', 'bold', 50, 7),
                createImageElement('photo', 12, 16, 30, 36, '{{photo}}'),
                createTextElement('name', '{{staff_name}}', 2, 56, 10, '#FFFFFF', 'bold', 50, 7),
                createTextElement('designation', '{{designation}}', 2, 64, 8, '#01579B', 'normal', 50, 5),
                createQRElement('qr', 36, 72, 14, '{{employee_id}}')
            ]
        }
    },
    {
        id: 'staff-portrait-elegant-gold',
        name: 'Staff Portrait - Elegant Gold',
        description: 'Elegant gold accented staff ID',
        category: 'staff',
        orientation: 'portrait',
        style: 'elegant',
        colors: PALETTES.gold,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'color', value: '#1A1A2E' },
            elements: [
                createShapeElement('gold-top', 0, 0, 54, 2, '#DAA520'),
                createShapeElement('gold-bottom', 0, 82, 54, 2, '#DAA520'),
                createTextElement('org-name', '{{school_name}}', 2, 5, 9, '#DAA520', 'bold', 50, 6),
                createImageElement('photo', 12, 14, 30, 36, '{{photo}}'),
                createTextElement('name', '{{staff_name}}', 2, 54, 10, '#FFFFFF', 'bold', 50, 7),
                createTextElement('designation', '{{designation}}', 2, 62, 8, '#DAA520', 'normal', 50, 5),
                createTextElement('dept', '{{department}}', 2, 70, 7, '#CCCCCC', 'normal', 30, 5),
                createQRElement('qr', 36, 68, 14, '{{employee_id}}')
            ]
        }
    },
    {
        id: 'staff-portrait-minimal-clean',
        name: 'Staff Portrait - Minimal Clean',
        description: 'Clean minimal staff design',
        category: 'staff',
        orientation: 'portrait',
        style: 'minimal',
        colors: { primary: '#333333', secondary: '#666666', accent: '#000000', background: '#FFFFFF', text: '#333333' },
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'color', value: '#FFFFFF' },
            elements: [
                createTextElement('org-name', '{{school_name}}', 2, 4, 9, '#333333', 'bold', 50, 6),
                createShapeElement('line', 2, 12, 50, 0.5, '#DDDDDD'),
                createImageElement('photo', 12, 16, 30, 36, '{{photo}}'),
                createTextElement('name', '{{staff_name}}', 2, 56, 10, '#000000', 'bold', 50, 7),
                createTextElement('designation', '{{designation}}', 2, 64, 8, '#666666', 'normal', 50, 5),
                createQRElement('qr', 36, 72, 14, '{{employee_id}}')
            ]
        }
    },
    {
        id: 'staff-portrait-bold-dark',
        name: 'Staff Portrait - Bold Dark',
        description: 'Bold dark theme staff ID',
        category: 'staff',
        orientation: 'portrait',
        style: 'bold',
        colors: PALETTES.dark,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'color', value: '#1A1A2E' },
            elements: [
                createShapeElement('accent-bar', 0, 0, 4, 86, '#E94560'),
                createTextElement('org-name', '{{school_name}}', 6, 4, 8, '#E94560', 'bold', 46, 6),
                createImageElement('photo', 12, 14, 30, 36, '{{photo}}'),
                createTextElement('name', '{{staff_name}}', 6, 54, 10, '#FFFFFF', 'bold', 46, 7),
                createTextElement('designation', '{{designation}}', 6, 62, 8, '#CCCCCC', 'normal', 46, 5),
                createTextElement('emp-id', '{{employee_id}}', 6, 70, 7, '#E94560', 'normal', 26, 5),
                createQRElement('qr', 36, 68, 14, '{{employee_id}}')
            ]
        }
    },
    {
        id: 'staff-portrait-teal-medical',
        name: 'Staff Portrait - Teal Medical',
        description: 'Teal color for medical/education staff',
        category: 'staff',
        orientation: 'portrait',
        style: 'modern',
        colors: PALETTES.medical,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient', value: 'linear-gradient(180deg, #00897B 0%, #26A69A 100%)' },
            elements: [
                createTextElement('org-name', '{{school_name}}', 2, 4, 9, '#FFFFFF', 'bold', 50, 6),
                createImageElement('photo', 12, 14, 30, 36, '{{photo}}'),
                createTextElement('name', '{{staff_name}}', 2, 54, 10, '#FFFFFF', 'bold', 50, 7),
                createTextElement('designation', '{{designation}}', 2, 62, 8, '#80CBC4', 'normal', 50, 5),
                createTextElement('dept', '{{department}}', 2, 70, 7, '#80CBC4', 'normal', 30, 5),
                createQRElement('qr', 36, 70, 14, '{{employee_id}}')
            ]
        }
    },
    {
        id: 'staff-portrait-purple-creative',
        name: 'Staff Portrait - Purple Creative',
        description: 'Creative purple design',
        category: 'staff',
        orientation: 'portrait',
        style: 'gradient',
        colors: PALETTES.purple,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient', value: 'linear-gradient(180deg, #6C63FF 0%, #9D4EDD 100%)' },
            elements: [
                createShapeElement('header', 0, 0, 54, 12, '#FFFFFF20'),
                createTextElement('org-name', '{{school_name}}', 2, 2, 9, '#FFFFFF', 'bold', 50, 7),
                createImageElement('photo', 12, 16, 30, 36, '{{photo}}'),
                createTextElement('name', '{{staff_name}}', 2, 56, 10, '#FFFFFF', 'bold', 50, 7),
                createTextElement('designation', '{{designation}}', 2, 64, 8, '#E0AAFF', 'normal', 50, 5),
                createQRElement('qr', 36, 72, 14, '{{employee_id}}')
            ]
        }
    },
    {
        id: 'staff-portrait-earth-classic',
        name: 'Staff Portrait - Earth Classic',
        description: 'Classic earth tone design',
        category: 'staff',
        orientation: 'portrait',
        style: 'classic',
        colors: PALETTES.earth,
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient', value: 'linear-gradient(180deg, #795548 0%, #A1887F 100%)' },
            elements: [
                createTextElement('org-name', '{{school_name}}', 2, 4, 9, '#FFFFFF', 'bold', 50, 6),
                createShapeElement('photo-frame', 10, 12, 34, 40, '#FFFFFF30'),
                createImageElement('photo', 12, 14, 30, 36, '{{photo}}'),
                createTextElement('name', '{{staff_name}}', 2, 56, 10, '#FFFFFF', 'bold', 50, 7),
                createTextElement('designation', '{{designation}}', 2, 64, 8, '#D7CCC8', 'normal', 50, 5),
                createQRElement('qr', 36, 72, 14, '{{employee_id}}')
            ]
        }
    },
    // Generate more staff portrait templates
    ...Array.from({ length: 22 }, (_, i) => ({
        id: `staff-portrait-auto-${i + 9}`,
        name: `Staff Portrait ${i + 9}`,
        description: `Pre-built portrait staff template ${i + 9}`,
        category: 'staff' as const,
        orientation: 'portrait' as const,
        style: ['professional', 'modern', 'elegant', 'classic', 'minimal', 'bold'][i % 6] as any,
        colors: Object.values(PALETTES)[(i + 5) % Object.values(PALETTES).length],
        dimensions: PORTRAIT_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient' as const, value: `linear-gradient(${180 + i * 10}deg, ${Object.values(PALETTES)[(i + 5) % Object.values(PALETTES).length].primary} 0%, ${Object.values(PALETTES)[(i + 5) % Object.values(PALETTES).length].secondary} 100%)` },
            elements: [
                createTextElement('org-name', '{{school_name}}', 2, 4, 9, '#FFFFFF', 'bold', 50, 6),
                createImageElement('photo', 12, 14, 30, 36, '{{photo}}'),
                createTextElement('name', '{{staff_name}}', 2, 54, 10, '#FFFFFF', 'bold', 50, 7),
                createTextElement('designation', '{{designation}}', 2, 62, 8, '#FFFFFF', 'normal', 50, 5),
                createQRElement('qr', 36, 70, 14, '{{employee_id}}')
            ]
        }
    })),

    // ==========================================
    // === LANDSCAPE TEMPLATES (61-100) ===
    // ==========================================
    {
        id: 'student-landscape-premium-vibrant',
        name: 'Student Landscape - Premium Vibrant',
        description: 'Vibrant horizontal layout with background image',
        category: 'student',
        orientation: 'landscape',
        style: 'colorful',
        colors: PALETTES.sunset,
        dimensions: LANDSCAPE_DIMS,
        design: {
            version: '1.0',
            background: { type: 'image', image_url: '/media/idcards/bgs/vibrant_landscape.png' },
            elements: [
                createImageElement('photo', 6, 12, 24, 30, '{{photo}}'),
                createTextElement('school-name', '{{school_name}}', 32, 6, 12, '#FFFFFF', 'bold', 50, 8),
                createTextElement('name', '{{student_name}}', 32, 18, 14, '#BF360C', 'bold', 50, 10),
                createTextElement('class', 'Class: {{class}} - {{section}}', 32, 32, 10, '#D84315', 'normal', 50, 7),
                createTextElement('adm', 'Adm: {{admission_number}}', 32, 42, 9, '#FFFFFF', 'normal', 30, 6),
                createQRElement('qr', 68, 30, 14, '{{admission_number}}')
            ]
        }
    },
    {
        id: 'student-landscape-purple',
        name: 'Student Landscape - Purple',
        description: 'Modern purple horizontal ID',
        category: 'student',
        orientation: 'landscape',
        style: 'gradient',
        colors: PALETTES.purple,
        dimensions: LANDSCAPE_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient', value: 'linear-gradient(90deg, #6C63FF 0%, #9D4EDD 100%)' },
            elements: [
                createShapeElement('side-panel', 0, 0, 35, 54, '#FFFFFF20'),
                createImageElement('photo', 5, 8, 25, 30, '{{photo}}'),
                createTextElement('school-name', '{{school_name}}', 38, 5, 9, '#FFFFFF', 'bold', 45, 5),
                createTextElement('name', '{{student_name}}', 38, 14, 11, '#FFFFFF', 'bold', 45, 7),
                createTextElement('class', '{{class}} - {{section}}', 38, 24, 9, '#E0AAFF', 'normal', 45, 5),
                createTextElement('adm', '{{admission_number}}', 38, 32, 8, '#E0AAFF', 'normal', 30, 5),
                createQRElement('qr', 68, 32, 14, '{{admission_number}}')
            ]
        }
    },
    {
        id: 'staff-landscape-professional',
        name: 'Staff Landscape - Professional',
        description: 'Horizontal professional staff ID',
        category: 'staff',
        orientation: 'landscape',
        style: 'professional',
        colors: PALETTES.corporate,
        dimensions: LANDSCAPE_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient', value: 'linear-gradient(90deg, #1A237E 0%, #303F9F 100%)' },
            elements: [
                createShapeElement('panel', 0, 0, 30, 54, '#FFFFFF10'),
                createImageElement('photo', 3, 8, 24, 30, '{{photo}}'),
                createTextElement('org-name', '{{school_name}}', 32, 4, 9, '#FFFFFF', 'bold', 50, 5),
                createTextElement('name', '{{staff_name}}', 32, 14, 11, '#FFFFFF', 'bold', 50, 7),
                createTextElement('designation', '{{designation}}', 32, 24, 9, '#C5CAE9', 'normal', 50, 5),
                createTextElement('dept', '{{department}}', 32, 32, 8, '#C5CAE9', 'normal', 35, 5),
                createQRElement('qr', 68, 30, 14, '{{employee_id}}')
            ]
        }
    },
    // Generate remaining landscape templates
    ...Array.from({ length: 37 }, (_, i) => ({
        id: `${i % 2 === 0 ? 'student' : 'staff'}-landscape-auto-${i + 4}`,
        name: `${i % 2 === 0 ? 'Student' : 'Staff'} Landscape ${Math.floor(i / 2) + 4}`,
        description: `Pre-built landscape template ${i + 4}`,
        category: (i % 2 === 0 ? 'student' : 'staff') as 'student' | 'staff',
        orientation: 'landscape' as const,
        style: ['modern', 'classic', 'minimal', 'professional', 'elegant', 'bold'][i % 6] as any,
        colors: Object.values(PALETTES)[i % Object.values(PALETTES).length],
        dimensions: LANDSCAPE_DIMS,
        design: {
            version: '1.0',
            background: { type: 'gradient' as const, value: `linear-gradient(90deg, ${Object.values(PALETTES)[i % Object.values(PALETTES).length].primary} 0%, ${Object.values(PALETTES)[i % Object.values(PALETTES).length].secondary} 100%)` },
            elements: i % 2 === 0 ? [
                createImageElement('photo', 3, 8, 28, 35, '{{photo}}'),
                createTextElement('school-name', '{{school_name}}', 35, 3, 10, '#FFFFFF', 'bold', 48, 6),
                createTextElement('name', '{{student_name}}', 35, 14, 12, '#FFFFFF', 'bold', 48, 7),
                createTextElement('class', 'Class: {{class}} - {{section}}', 35, 24, 9, '#FFFFFF', 'normal', 48, 5),
                createQRElement('qr', 68, 28, 15, '{{admission_number}}')
            ] : [
                createImageElement('photo', 3, 8, 24, 30, '{{photo}}'),
                createTextElement('org-name', '{{school_name}}', 32, 4, 9, '#FFFFFF', 'bold', 50, 5),
                createTextElement('name', '{{staff_name}}', 32, 14, 11, '#FFFFFF', 'bold', 50, 7),
                createTextElement('designation', '{{designation}}', 32, 24, 9, '#FFFFFF', 'normal', 50, 5),
                createQRElement('qr', 68, 30, 14, '{{employee_id}}')
            ]
        }
    })),
];

// Export categories for filtering
export const TEMPLATE_CATEGORIES = [
    { value: 'all', label: 'All Templates' },
    { value: 'student', label: 'Student IDs' },
    { value: 'staff', label: 'Staff IDs' },
    { value: 'visitor', label: 'Visitor Passes' },
    { value: 'event', label: 'Event Badges' },
    { value: 'corporate', label: 'Corporate IDs' },
    { value: 'medical', label: 'Medical IDs' },
    { value: 'library', label: 'Library Cards' },
    { value: 'sports', label: 'Sports IDs' },
    { value: 'transport', label: 'Transport Passes' },
    { value: 'access', label: 'Access Cards' },
];

export const TEMPLATE_STYLES = [
    { value: 'all', label: 'All Styles' },
    { value: 'modern', label: 'Modern' },
    { value: 'classic', label: 'Classic' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'colorful', label: 'Colorful' },
    { value: 'professional', label: 'Professional' },
    { value: 'elegant', label: 'Elegant' },
    { value: 'bold', label: 'Bold' },
    { value: 'gradient', label: 'Gradient' },
];

// Orientation filter
export const TEMPLATE_ORIENTATIONS = [
    { value: 'all', label: 'All Orientations' },
    { value: 'portrait', label: 'Portrait' },
    { value: 'landscape', label: 'Landscape' },
];

export default PREBUILT_TEMPLATES;
