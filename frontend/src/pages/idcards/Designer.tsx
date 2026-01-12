import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import interact from 'interactjs';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import './Designer.css';
import { PREBUILT_TEMPLATES, CARD_SIZES, TEMPLATE_CATEGORIES, TEMPLATE_STYLES, TEMPLATE_ORIENTATIONS, PrebuiltTemplate } from './prebuiltTemplates';

interface Element {
    id: string;
    type: 'text' | 'image' | 'shape' | 'qrcode' | 'barcode';
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    zIndex: number;
    // Type-specific properties
    text?: string;
    fontSize?: number;
    fontWeight?: string;
    fontFamily?: string;
    textAlign?: 'left' | 'center' | 'right';
    letterSpacing?: number;
    lineHeight?: number;
    color?: string;
    src?: string;
    shape?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    borderRadius?: number;
    boxShadow?: string;
    opacity?: number;
    data?: string;
    qrColor?: string;
    qrBackground?: string;
}

interface Design {
    version: string;
    background: {
        type: 'color' | 'image' | 'gradient';
        value?: string;
        image_url?: string;
        gradient?: string;
    };
    elements: Element[];
    dimensions?: {
        width: number;
        height: number;
    };
}

interface Template {
    id: number;
    name: string;
    description: string;
    entity_type: string;
    orientation: string;
    width: number;
    height: number;
    config: Design;
    background_type: string;
    background_value: string;
    is_default: boolean;
    is_system: boolean;
    is_active: boolean;
    // Support old field names for backward compatibility
    card_type?: string;
    category?: string;
    design_json?: Design;
    preview_image?: string;
}

// Millimetres to pixels conversion (CSS standard: 1in = 96px, 1in = 25.4mm)
const MM_TO_PX = 96 / 25.4;
// QR Code Image Component
const QRCodeImage: React.FC<{
    element: Element;
    qrCodeDataUrls: { [key: string]: string };
    setQrCodeDataUrls: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}> = ({ element, qrCodeDataUrls, setQrCodeDataUrls }) => {
    useEffect(() => {
        const generateQR = async () => {
            try {
                const dataUrl = await QRCode.toDataURL(element.data || 'Sample', {
                    errorCorrectionLevel: 'H',
                    color: {
                        dark: element.qrColor || '#000000',
                        light: element.qrBackground || '#FFFFFF'
                    },
                    width: Math.min((element.width * MM_TO_PX), (element.height * MM_TO_PX))
                });
                setQrCodeDataUrls(prev => ({ ...prev, [element.id]: dataUrl }));
            } catch (err) {
                console.error('Error generating QR code:', err);
            }
        };
        generateQR();
    }, [element.data, element.qrColor, element.qrBackground, element.width, element.height, element.id, setQrCodeDataUrls]);

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: element.qrBackground || '#FFFFFF' }}>
            {qrCodeDataUrls[element.id] ? (
                <img
                    src={qrCodeDataUrls[element.id]}
                    alt="QR Code"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            ) : (
                <div className="qr-placeholder">Generating QR...</div>
            )}
        </div>
    );
};

const IDCardDesigner: React.FC = () => {
    const [design, setDesign] = useState<Design>({
        version: '1.0',
        background: { type: 'color', value: '#FFFFFF' },
        elements: [],
        dimensions: { width: 85.6, height: 53.98 }
    });

    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [entities, setEntities] = useState<any[]>([]);
    const [selectedEntityId, setSelectedEntityId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [designName, setDesignName] = useState('My Custom Design');
    const [cardType, setCardType] = useState<'STUDENT' | 'STAFF'>('STUDENT');
    const [uploadedImages, setUploadedImages] = useState<{ [key: string]: string }>({});
    const [qrCodeDataUrls, setQrCodeDataUrls] = useState<{ [key: string]: string }>({});
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLDivElement>(null);

    // Template browser state
    const [showPrebuiltTemplates, setShowPrebuiltTemplates] = useState(true);
    const [templateCategory, setTemplateCategory] = useState('all');
    const [templateStyle, setTemplateStyle] = useState('all');
    const [templateOrientation, setTemplateOrientation] = useState('all');
    const [cardSize, setCardSize] = useState('CR80');
    const [backgroundType, setBackgroundType] = useState<'color' | 'gradient' | 'image'>('color');
    const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
    const [backgroundGradient, setBackgroundGradient] = useState('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
    const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
    const [showLayoutGuides, setShowLayoutGuides] = useState(false);

    // Custom dimensions
    const [useCustomDimensions, setUseCustomDimensions] = useState(false);
    const [customWidth, setCustomWidth] = useState(85.6);
    const [customHeight, setCustomHeight] = useState(53.98);

    // Font options
    const FONT_FAMILIES = [
        { value: 'Arial, sans-serif', label: 'Arial' },
        { value: "'Helvetica Neue', Helvetica, sans-serif", label: 'Helvetica' },
        { value: 'Georgia, serif', label: 'Georgia' },
        { value: "'Times New Roman', serif", label: 'Times New Roman' },
        { value: "'Courier New', monospace", label: 'Courier New' },
        { value: "'Segoe UI', sans-serif", label: 'Segoe UI' },
        { value: 'Verdana, sans-serif', label: 'Verdana' },
        { value: "'Trebuchet MS', sans-serif", label: 'Trebuchet MS' },
        { value: "'Roboto', sans-serif", label: 'Roboto' },
        { value: "'Open Sans', sans-serif", label: 'Open Sans' },
        { value: "'Poppins', sans-serif", label: 'Poppins' },
        { value: "'Montserrat', sans-serif", label: 'Montserrat' },
        { value: "'Playfair Display', serif", label: 'Playfair Display' },
    ];

    // Card border options
    const [cardBorder, setCardBorder] = useState({ width: 0, color: '#000000', radius: 0 });
    const [cardShadow, setCardShadow] = useState({ enabled: false, blur: 10, color: 'rgba(0,0,0,0.2)' });

    // Code editor state
    const [showCodeEditor, setShowCodeEditor] = useState(false);
    const [codeEditorContent, setCodeEditorContent] = useState('');
    const [codeEditorError, setCodeEditorError] = useState<string | null>(null);

    // Preview state
    const [showPreview, setShowPreview] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);

    // URL params for editing existing template
    const [searchParams] = useSearchParams();
    const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);

    // Load templates
    useEffect(() => {
        fetchTemplates();
    }, []);

    // Load a small list of real entities for preview selection
    useEffect(() => {
        const loadEntities = async () => {
            try {
                const url = cardType === 'STUDENT' ? '/students/students/' : '/staff/staff/';
                const res = await api.get(url);
                const payload = res.data;
                const list = Array.isArray(payload) ? payload : (payload.results || []);
                setEntities(list || []);
                if (list && list.length > 0) {
                    setSelectedEntityId(list[0].id || '');
                } else {
                    setSelectedEntityId('');
                }
            } catch (err) {
                console.debug('Failed to load entities for preview', err);
                setEntities([]);
                setSelectedEntityId('');
            }
        };
        loadEntities();
    }, [cardType]);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/idcards/templates/');
            // Ensure we always set an array
            const data = response.data;
            if (Array.isArray(data)) {
                setTemplates(data);
            } else if (data && Array.isArray(data.results)) {
                // Handle paginated response
                setTemplates(data.results);
            } else {
                console.warn('Unexpected API response format:', data);
                setTemplates([]);
            }
        } catch (error) {
            console.error('Error loading templates:', error);
            setTemplates([]); // Ensure templates is always an array
        } finally {
            setLoading(false);
        }
    };

    // Load template from URL parameter if present (for editing)
    useEffect(() => {
        const templateId = searchParams.get('template');
        if (templateId && templates.length > 0 && !currentTemplateId) {
            const templateToEdit = templates.find(t => String(t.id) === templateId);
            if (templateToEdit) {
                loadTemplate(templateToEdit);
                setCurrentTemplateId(templateId);
                setShowPrebuiltTemplates(false); // Switch to "My Templates" tab
                console.log('Loaded template from URL:', templateToEdit.name);
            } else {
                // Template not found in list, try to fetch it directly
                api.get(`/idcards/templates/${templateId}/`)
                    .then(response => {
                        const template = response.data;
                        if (template) {
                            loadTemplate(template);
                            setCurrentTemplateId(templateId);
                            setShowPrebuiltTemplates(false);
                        }
                    })
                    .catch(err => console.error('Failed to load template:', err));
            }
        }
    }, [searchParams, templates, currentTemplateId]);

    // Sync design to code editor whenever design changes
    useEffect(() => {
        setCodeEditorContent(JSON.stringify(design, null, 2));
        setCodeEditorError(null);
    }, [design]);

    // Initialize Interact.js
    useEffect(() => {
        if (!canvasRef.current) return;

        // Make elements draggable and resizable
        interact('.element')
            .draggable({
                inertia: false,
                modifiers: [
                    interact.modifiers.restrict({
                        restriction: 'parent',
                        endOnly: false
                    })
                ],
                inertia: false,
                modifiers: [
                    interact.modifiers.restrict({
                        restriction: 'parent',
                        endOnly: false
                    })
                ],
                listeners: {
                    start(event) {
                        const target = event.target;
                        target.classList.add('dragging');
                    },
                    start(event) {
                        const target = event.target;
                        target.classList.add('dragging');
                    },
                    move(event) {
                        const target = event.target;
                        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                        target.style.transform = `translate(${x}px, ${y}px)`;
                        target.setAttribute('data-x', x.toString());
                        target.setAttribute('data-y', y.toString());
                    },
                    end(event) {
                        const target = event.target;
                        target.classList.remove('dragging');
                        const x = parseFloat(target.getAttribute('data-x')) || 0;
                        const y = parseFloat(target.getAttribute('data-y')) || 0;
                    },
                    end(event) {
                        const target = event.target;
                        target.classList.remove('dragging');
                        const x = parseFloat(target.getAttribute('data-x')) || 0;
                        const y = parseFloat(target.getAttribute('data-y')) || 0;
                        // Update design (convert px back to mm)
                        updateElementPosition(target.id, x / MM_TO_PX, y / MM_TO_PX);
                    }
                }
            })
            .resizable({
                edges: { left: true, right: true, bottom: true, top: true },
                modifiers: [
                    interact.modifiers.restrictSize({
                        min: { width: 10, height: 10 }
                    })
                ],
                modifiers: [
                    interact.modifiers.restrictSize({
                        min: { width: 10, height: 10 }
                    })
                ],
                listeners: {
                    start(event) {
                        const target = event.target;
                        target.classList.add('resizing');
                    },
                    start(event) {
                        const target = event.target;
                        target.classList.add('resizing');
                    },
                    move(event) {
                        const target = event.target;
                        let x = parseFloat(target.getAttribute('data-x')) || 0;
                        let y = parseFloat(target.getAttribute('data-y')) || 0;

                        target.style.width = event.rect.width + 'px';
                        target.style.height = event.rect.height + 'px';

                        x += event.deltaRect.left;
                        y += event.deltaRect.top;

                        target.style.transform = `translate(${x}px, ${y}px)`;
                        target.setAttribute('data-x', x.toString());
                        target.setAttribute('data-y', y.toString());
                    },
                    end(event) {
                        const target = event.target;
                        target.classList.remove('resizing');
                        const width = event.rect.width;
                        const height = event.rect.height;
                        updateElementSize(target.id, width / MM_TO_PX, height / MM_TO_PX);
                    }
                }
            });

        return () => {
            interact('.element').unset();
        };
    }, [design.elements]);

    const addElement = (type: Element['type']) => {
        const newElement: Element = {
            id: `element_${Date.now()}`,
            type,
            x: 10,
            y: 10,
            width: type === 'text' ? 30 : 20,
            height: type === 'text' ? 8 : 20,
            zIndex: design.elements.length + 1,
            ...(type === 'text' && {
                text: 'New Text',
                fontSize: 12,
                fontWeight: 'normal',
                color: '#000000'
            }),
            ...(type === 'shape' && {
                shape: 'rectangle',
                fill: '#1976D2',
                stroke: '#000000',
                strokeWidth: 1
            }),
            ...(type === 'qrcode' && {
                data: '{AdmissionNumber}',
                qrColor: '#000000',
                qrBackground: '#FFFFFF'
            }),
            ...(type === 'barcode' && {
                data: '{AdmissionNumber}'
            }),
            ...(type === 'image' && {
                src: '{StudentPhoto}'
            })
        };

        setDesign(prev => ({
            ...prev,
            elements: [...prev.elements, newElement]
        }));
        setSelectedElement(newElement.id);
    };

    const updateElementPosition = (id: string, x: number, y: number) => {
        setDesign(prev => ({
            ...prev,
            elements: prev.elements.map(el =>
                el.id === id ? { ...el, x, y } : el
            )
        }));
    };

    const updateElementSize = (id: string, width: number, height: number) => {
        setDesign(prev => ({
            ...prev,
            elements: prev.elements.map(el =>
                el.id === id ? { ...el, width, height } : el
            )
        }));
    };

    const updateElementProperty = (id: string, property: string, value: any) => {
        setDesign(prev => ({
            ...prev,
            elements: prev.elements.map(el =>
                el.id === id ? { ...el, [property]: value } : el
            )
        }));
    };

    const deleteElement = (id: string) => {
        setDesign(prev => ({
            ...prev,
            elements: prev.elements.filter(el => el.id !== id)
        }));
        setSelectedElement(null);
    };

    const loadTemplate = (template: Template) => {
        // Support both old 'design_json' and new 'config' field names
        const designData = template.config || template.design_json;
        if (designData) {
            setDesign(designData);
            // Keep name if editing (has ID), add (Custom) if from prebuilt
            if (template.id) {
                setDesignName(template.name);
                setCurrentTemplateId(String(template.id));
                // Set the card type based on the template
                if (template.entity_type) {
                    setCardType(template.entity_type.toUpperCase() as 'STUDENT' | 'STAFF');
                }
            } else {
                setDesignName(`${template.name} (Custom)`);
                setCurrentTemplateId(null);
            }
            setSelectedElement(null);
        } else {
            console.error('Template has no design data');
            alert('This template has no design configuration');
        }
    };

    const saveDesign = async () => {
        try {
            const orientation = design.dimensions && design.dimensions.width > design.dimensions.height
                ? 'landscape'
                : 'portrait';

            const width = design.dimensions?.width ?? (orientation === 'portrait' ? 54.0 : 86.0);
            const height = design.dimensions?.height ?? (orientation === 'portrait' ? 86.0 : 54.0);

            const templateData = {
                name: designName,
                description: `${cardType} ID Card Design`,
                entity_type: cardType.toLowerCase(),
                orientation,
                width,
                height,
                config: design,
                background_type: design.background.type,
                background_value: design.background.value || design.background.gradient || design.background.image_url || '#FFFFFF',
                is_active: true
            };

            console.log('Saving template:', templateData);

            let response;
            if (currentTemplateId) {
                // Update existing template
                response = await api.patch(`/idcards/templates/${currentTemplateId}/`, templateData);
                if (response.status === 200) {
                    alert('Template updated successfully!');
                    await fetchTemplates(); // Reload templates
                } else {
                    alert('Error updating template');
                }
            } else {
                // Create new template
                response = await api.post('/idcards/templates/', templateData);
                if (response.status === 201 || response.status === 200) {
                    alert('Design saved successfully!');
                    // Set the new template ID so subsequent saves become updates
                    if (response.data?.id) {
                        setCurrentTemplateId(String(response.data.id));
                    }
                    await fetchTemplates(); // Reload templates
                } else {
                    alert('Error saving design');
                }
            }
        } catch (error: any) {
            console.error('Error saving design:', error);
            console.error('Error details:', error.response?.data);
            const errorMsg = error.response?.data?.detail ||
                error.response?.data?.message ||
                JSON.stringify(error.response?.data) ||
                'Error saving design';
            alert(`Failed to save: ${errorMsg}`);
        }
    };

    const exportAsImage = async () => {
        if (!canvasRef.current) return;

        try {
            const canvas = await html2canvas(canvasRef.current, {
                backgroundColor: design.background.value || '#FFFFFF',
                scale: 2
            });

            const link = document.createElement('a');
            link.download = `${designName}.png`;
            link.href = canvas.toDataURL();
            link.click();
        } catch (error) {
            console.error('Error exporting image:', error);
            alert('Failed to export image');
        }
    };

    // Generate preview using real student/staff data when available, fallback to sample data
    const generatePreview = async () => {
        setPreviewLoading(true);

        // Try to fetch a real entity from the API
        let realEntity: any = null;
        try {
            const list = entities || [];
            if (list.length > 0) {
                realEntity = list.find((e: any) => String(e.id) === String(selectedEntityId)) || list[0];
            }
        } catch (err) {
            // ignore and fall back to sample data
            console.debug('Failed to fetch real entity for preview, using sample data', err);
            realEntity = null;
        }

        // Sample data based on card type
        const sampleData = cardType === 'STUDENT' ? {
            student_name: 'Ahmad Khan',
            first_name: 'Ahmad',
            last_name: 'Khan',
            admission_number: '2024/STU/001',
            class: 'Class 10',
            section: 'A',
            roll_number: '15',
            dob: '2010-05-15',
            blood_group: 'O+',
            guardian_name: 'Mohammad Khan',
            phone: '+91 98765 43210',
            address: '123 Main Street, City',
            photo_url: 'https://ui-avatars.com/api/?name=Ahmad+Khan&size=200&background=4F46E5&color=fff',
        } : {
            staff_name: 'Dr. Sarah Ahmed',
            first_name: 'Sarah',
            last_name: 'Ahmed',
            employee_id: 'EMP/2024/001',
            designation: 'Senior Teacher',
            department: 'Science',
            dob: '1985-03-20',
            blood_group: 'A+',
            phone: '+91 98765 12345',
            email: 'sarah.ahmed@school.edu',
            photo_url: 'https://ui-avatars.com/api/?name=Sarah+Ahmed&size=200&background=10B981&color=fff',
        };

        // If we have a real entity, map its fields to the preview data shape
        const entityData = { ...sampleData };
        if (realEntity) {
            if (cardType === 'STUDENT') {
                entityData.student_name = `${realEntity.first_name || ''} ${realEntity.last_name || ''}`.trim() || entityData.student_name;
                entityData.first_name = realEntity.first_name || entityData.first_name;
                entityData.last_name = realEntity.last_name || entityData.last_name;
                entityData.admission_number = realEntity.admission_number || realEntity.admission_no || entityData.admission_number;
                entityData.class = realEntity.class || (realEntity.current_enrollment?.section?.grade_level?.name) || entityData.class;
                entityData.section = realEntity.section || (realEntity.current_enrollment?.section?.name) || entityData.section;
                entityData.roll_number = realEntity.roll_number || realEntity.current_enrollment?.roll_number || entityData.roll_number;
                entityData.dob = realEntity.date_of_birth || realEntity.dob || entityData.dob;
                entityData.blood_group = realEntity.blood_group || entityData.blood_group;
                entityData.phone = realEntity.phone_number || realEntity.phone || entityData.phone;
                entityData.address = realEntity.address || entityData.address;
                entityData.photo_url = realEntity.photo || realEntity.photo_url || (realEntity.photo?.url) || entityData.photo_url;
            } else {
                entityData.staff_name = `${realEntity.first_name || ''} ${realEntity.last_name || ''}`.trim() || entityData.staff_name;
                entityData.first_name = realEntity.first_name || entityData.first_name;
                entityData.last_name = realEntity.last_name || entityData.last_name;
                entityData.employee_id = realEntity.employee_id || entityData.employee_id;
                entityData.designation = realEntity.designation || realEntity.get_designation_display || entityData.designation;
                entityData.department = realEntity.department || entityData.department;
                entityData.dob = realEntity.date_of_birth || entityData.dob;
                entityData.blood_group = realEntity.blood_group || entityData.blood_group;
                entityData.phone = realEntity.phone_number || realEntity.phone || entityData.phone;
                entityData.email = realEntity.personal_email || realEntity.email || entityData.email;
                entityData.photo_url = realEntity.photo || realEntity.photo_url || (realEntity.photo?.url) || entityData.photo_url;
            }
        }

        const schoolData = {
            school_name: 'International Islamic School',
            school_logo: 'https://ui-avatars.com/api/?name=IIS&size=100&background=1E40AF&color=fff',
            school_address: '123 Education Street, City - 110001',
            school_phone: '+91 11 2345 6789',
            school_website: 'www.iis.edu',
            academic_year: '2024-25',
            valid_until: '2025-03-31'
        };

        // Replace placeholders in elements
        const bgStyle = design.background.type === 'gradient'
            ? (design.background.gradient || design.background.value)
            : (design.background.type === 'image' && design.background.image_url)
                ? `url(${design.background.image_url})`
                : (design.background.value || '#FFFFFF');

        let previewContent = `
            <div style="
                width: ${(design.dimensions?.width || 85.6)}mm;
                height: ${(design.dimensions?.height || 53.98)}mm;
                background: ${bgStyle};
                background-size: cover;
                position: relative;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.15);
                overflow: hidden;
                ${showLayoutGuides ? 'outline: 1px solid rgba(99,102,241,0.35);' : ''}
            ">
        `;

        design.elements.forEach(el => {
            let content = '';
            const style = `
                position: absolute;
                left: ${el.x}mm;
                top: ${el.y}mm;
                width: ${el.width}mm;
                height: ${el.height}mm;
                z-index: ${el.zIndex};
            `;

            const borderOverlay = showLayoutGuides ? 'outline: 1px dashed rgba(0,0,0,0.35); background: rgba(0,0,0,0.02);' : '';

            if (el.type === 'text') {
                // Replace placeholders with sample data
                let text = el.text || '';
                Object.entries({ ...entityData, ...schoolData }).forEach(([key, value]) => {
                    text = text.replace(new RegExp(`\\{\\{?${key}\\}?\\}`, 'gi'), String(value));
                    text = text.replace(new RegExp(`\\{${key.replace('_', '')}\\}`, 'gi'), String(value));
                });

                content = `
                    <div style="${style}
                        font-size: ${(el.fontSize || 12) / MM_TO_PX}mm;
                        font-family: ${el.fontFamily || 'Arial, sans-serif'};
                        color: ${el.color || '#000'};
                        font-weight: ${el.fontWeight || 'normal'};
                        text-align: ${el.textAlign || 'left'};
                        display: flex;
                        align-items: center;
                        justify-content: ${el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start'};
                        ${borderOverlay}
                    ">
                        ${text}
                    </div>
                `;
            } else if (el.type === 'image') {
                const imgSrc = el.src?.includes('Photo') || el.src?.includes('photo')
                    ? entityData.photo_url
                    : el.src?.includes('Logo') || el.src?.includes('logo')
                        ? schoolData.school_logo
                        : el.src || '';

                content = `
                    <div style="${style} overflow: hidden; border-radius: 8px; ${borderOverlay}">
                        <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover;" />
                    </div>
                `;
            } else if (el.type === 'shape') {
                content = `
                    <div style="${style}
                        background-color: ${el.fill || '#1976D2'};
                        border-radius: ${el.shape === 'circle' ? '50%' : ((el.borderRadius || 0) / MM_TO_PX) + 'mm'};
                        border: ${el.stroke ? ((el.strokeWidth || 1) / MM_TO_PX) + 'mm solid ' + el.stroke : 'none'};
                        ${borderOverlay}
                    "></div>
                `;
            } else if (el.type === 'qrcode') {
                content = `
                    <div style="${style} background: ${el.qrBackground || '#fff'}; display: flex; align-items: center; justify-content: center; border-radius: 4px; ${borderOverlay}">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(entityData.admission_number || entityData.employee_id || 'SAMPLE')}" 
                             style="width: 90%; height: 90%; object-fit: contain;" />
                    </div>
                `;
            } else if (el.type === 'barcode') {
                content = `
                    <div style="${style} background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: monospace; font-size: 10px; ${borderOverlay}">
                        <div style="display: flex; height: 70%; width: 90%;">
                            ${Array(25).fill(0).map(() => `<div style="flex: 1; background: ${Math.random() > 0.5 ? '#000' : '#fff'};"></div>`).join('')}
                        </div>
                        <div style="margin-top: 4px;">${entityData.admission_number || entityData.employee_id || 'SAMPLE'}</div>
                    </div>
                `;
            }

            previewContent += content;
        });

        previewContent += '</div>';

        setPreviewHtml(previewContent);
        setShowPreview(true);
        setPreviewLoading(false);
    };

    const handleImageUpload = (elementId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target?.result as string;
                setUploadedImages(prev => ({ ...prev, [elementId]: imageUrl }));
                updateElementProperty(elementId, 'src', imageUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBackgroundImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target?.result as string;
                setBackgroundImageUrl(imageUrl);
                updateBackground('image', imageUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const updateBackground = (type: 'color' | 'gradient' | 'image', value: string) => {
        setBackgroundType(type);
        if (type === 'color') {
            setBackgroundColor(value);
            setDesign(prev => ({
                ...prev,
                background: { type: 'color', value: value }
            }));
        } else if (type === 'gradient') {
            setBackgroundGradient(value);
            setDesign(prev => ({
                ...prev,
                background: { type: 'gradient', value: value, gradient: value }
            }));
        } else {
            setDesign(prev => ({
                ...prev,
                background: { type: 'image', image_url: value }
            }));
        }
    };

    const updateCardDimensions = (sizeKey: string) => {
        setCardSize(sizeKey);
        const size = (CARD_SIZES as any)[sizeKey];
        if (size) {
            setDesign(prev => ({
                ...prev,
                dimensions: { width: size.width, height: size.height }
            }));
        }
    };

    const loadPrebuiltTemplate = (template: PrebuiltTemplate) => {
        setDesign({
            version: '1.0',
            background: template.design.background,
            elements: template.design.elements,
            dimensions: template.dimensions
        });
        setDesignName(`${template.name} (Custom)`);
        setSelectedElement(null);
        setCurrentTemplateId(null); // Prebuilt templates should be saved as new

        // Find and set the matching card size
        const matchingSize = Object.entries(CARD_SIZES).find(
            ([_, size]) => size.width === template.dimensions.width && size.height === template.dimensions.height
        );
        if (matchingSize) {
            setCardSize(matchingSize[0]);
        }
    };

    // Filter prebuilt templates
    const filteredPrebuiltTemplates = PREBUILT_TEMPLATES.filter(t => {
        const categoryMatch = templateCategory === 'all' || t.category === templateCategory;
        const styleMatch = templateStyle === 'all' || t.style === templateStyle;
        const orientationMatch = templateOrientation === 'all' || t.orientation === templateOrientation;
        return categoryMatch && styleMatch && orientationMatch;
    });

    const selectedEl = design.elements.find(el => el.id === selectedElement);

    // Filter templates by card type (convert to lowercase to match entity_type)
    const filteredTemplates = Array.isArray(templates)
        ? templates.filter(t => {
            const entityType = t.entity_type || t.card_type?.toLowerCase() || '';
            return entityType === cardType.toLowerCase();
        })
        : [];

    const templatesByCategory = filteredTemplates.reduce((acc, template) => {
        const category = template.category || 'Custom Designs';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(template);
        return acc;
    }, {} as Record<string, Template[]>);

    return (
        <div className="designer-container">
            {/* Toolbar */}
            <div className="toolbar">
                <div className="toolbar-left">
                    <h2>🪪 {t('designer.title')}</h2>
                    <input
                        type="text"
                        value={designName}
                        onChange={(e) => setDesignName(e.target.value)}
                        className="design-name-input"
                        placeholder={t('designer.design_name_placeholder')}
                    />
                    <div className="card-type-toggle" style={{ marginLeft: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <button
                            className={cardType === 'STUDENT' ? 'active' : ''}
                            onClick={() => setCardType('STUDENT')}
                            style={{
                                padding: '0.5rem 1rem',
                                border: cardType === 'STUDENT' ? '2px solid #1976D2' : '1px solid #ccc',
                                background: cardType === 'STUDENT' ? '#E3F2FD' : 'white',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            👨‍🎓 Student
                        </button>
                        <button
                            className={cardType === 'STAFF' ? 'active' : ''}
                            onClick={() => setCardType('STAFF')}
                            style={{
                                padding: '0.5rem 1rem',
                                border: cardType === 'STAFF' ? '2px solid #1976D2' : '1px solid #ccc',
                                background: cardType === 'STAFF' ? '#E3F2FD' : 'white',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            👨‍💼 Staff
                        </button>
                    </div>
                </div>
                <div className="tool-buttons">
                    <button onClick={() => addElement('text')} title={t('designer.add_text')}>
                        📝 {t('designer.add_text')}
                    </button>
                    <button onClick={() => addElement('image')} title={t('designer.add_image')}>
                        🖼️ {t('designer.add_image')}
                    </button>
                    <button onClick={() => addElement('shape')} title={t('designer.add_shape')}>
                        ⬜ {t('designer.add_shape')}
                    </button>
                    <button onClick={() => addElement('qrcode')} title={t('designer.add_qrcode')}>
                        📱 {t('designer.add_qrcode')}
                    </button>
                    <button onClick={() => addElement('barcode')} title={t('designer.add_barcode')}>
                        📊 {t('designer.add_barcode')}
                    </button>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.75rem', fontSize: '0.85rem' }}>
                        <input
                            type="checkbox"
                            checked={showLayoutGuides}
                            onChange={(e) => setShowLayoutGuides(e.target.checked)}
                        />
                        Show layout guides
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem' }}>Preview entity:</span>
                        <select
                            value={selectedEntityId}
                            onChange={(e) => setSelectedEntityId(e.target.value)}
                            style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #ddd', minWidth: '140px' }}
                        >
                            {entities.length === 0 && <option value="">Sample data</option>}
                            {entities.map((ent) => (
                                <option key={ent.id} value={ent.id}>
                                    {cardType === 'STUDENT'
                                        ? `${ent.first_name || ''} ${ent.last_name || ''} ${ent.admission_number ? '(' + ent.admission_number + ')' : ''}`
                                        : `${ent.first_name || ''} ${ent.last_name || ''} ${ent.employee_id ? '(' + ent.employee_id + ')' : ''}`}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => {
                                // refresh list for the current card type
                                (async () => {
                                    try {
                                        const url = cardType === 'STUDENT' ? '/students/students/' : '/staff/staff/';
                                        const res = await api.get(url);
                                        const payload = res.data;
                                        const list = Array.isArray(payload) ? payload : (payload.results || []);
                                        setEntities(list || []);
                                        if (list && list.length > 0) setSelectedEntityId(list[0].id || '');
                                    } catch (err) {
                                        console.debug('Failed to refresh entities', err);
                                    }
                                })();
                            }}
                            style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #ddd', background: '#f8fafc', cursor: 'pointer' }}
                        >
                            ↻
                        </button>
                    </div>
                </div>
                <button onClick={generatePreview} className="btn-preview" style={{
                    marginLeft: 'auto',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    👁️ Preview with Real Data
                </button>
                <button onClick={exportAsImage} className="btn-export" style={{ marginLeft: '0.5rem' }}>
                    💾 Export PNG
                </button>
                <button onClick={saveDesign} className="save-btn" style={{
                    background: currentTemplateId ? 'linear-gradient(135deg, #f59e0b, #d97706)' : undefined
                }}>
                    {currentTemplateId ? '✏️ Update Template' : '💾 Save as New'}
                </button>
                {currentTemplateId && (
                    <button
                        onClick={() => {
                            setCurrentTemplateId(null);
                            setDesignName(`${designName} (Copy)`);
                        }}
                        style={{
                            marginLeft: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: '#e5e7eb',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                        }}
                        title="Save as new template instead of updating"
                    >
                        📄 Save as Copy
                    </button>
                )}
            </div>

            {/* Main Area */}
            <div className="designer-main">
                {/* Template Library */}
                <div className="template-library" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 150px)' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <button
                            onClick={() => setShowPrebuiltTemplates(true)}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                border: showPrebuiltTemplates ? '2px solid #6366f1' : '1px solid #ddd',
                                background: showPrebuiltTemplates ? '#EEF2FF' : 'white',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: showPrebuiltTemplates ? 600 : 400
                            }}
                        >
                            📚 Pre-built ({PREBUILT_TEMPLATES.length})
                        </button>
                        <button
                            onClick={() => setShowPrebuiltTemplates(false)}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                border: !showPrebuiltTemplates ? '2px solid #6366f1' : '1px solid #ddd',
                                background: !showPrebuiltTemplates ? '#EEF2FF' : 'white',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: !showPrebuiltTemplates ? 600 : 400
                            }}
                        >
                            💾 My Templates ({templates.length})
                        </button>
                    </div>

                    {showPrebuiltTemplates ? (
                        <>
                            {/* Filters */}
                            <div style={{ marginBottom: '1rem' }}>
                                <select
                                    value={templateCategory}
                                    onChange={(e) => setTemplateCategory(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                >
                                    {TEMPLATE_CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <select
                                        value={templateStyle}
                                        onChange={(e) => setTemplateStyle(e.target.value)}
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                    >
                                        {TEMPLATE_STYLES.map(style => (
                                            <option key={style.value} value={style.value}>{style.label}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={templateOrientation}
                                        onChange={(e) => setTemplateOrientation(e.target.value)}
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                    >
                                        {TEMPLATE_ORIENTATIONS.map(orient => (
                                            <option key={orient.value} value={orient.value}>{orient.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
                                Showing {filteredPrebuiltTemplates.length} templates
                            </div>
                            <div className="template-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                                {filteredPrebuiltTemplates.map(template => (
                                    <div
                                        key={template.id}
                                        className="template-card"
                                        onClick={() => loadPrebuiltTemplate(template)}
                                        title={template.description}
                                        style={{
                                            padding: '0.5rem',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            background: 'white'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#6366f1';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = '#e5e7eb';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <div style={{
                                            height: '60px',
                                            borderRadius: '4px',
                                            marginBottom: '0.5rem',
                                            background: template.design.background.value || template.design.background.gradient || template.colors.primary,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: '0.7rem',
                                            textAlign: 'center',
                                            padding: '0.25rem'
                                        }}>
                                            {template.orientation === 'landscape' ? '📄' : '🪪'} {template.style}
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {template.name}
                                        </p>
                                        <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                                            {template.category} • {template.orientation}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        loading ? (
                            <div className="loading">{t('designer.loading_templates')}</div>
                        ) : (
                            <div className="template-categories">
                                {templates.length > 0 ? (
                                    <>
                                        {/* Show all templates option */}
                                        <div style={{ marginBottom: '1rem' }}>
                                            <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
                                                Showing {filteredTemplates.length} of {templates.length} templates for {cardType}
                                            </p>
                                        </div>
                                        {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                                            <div key={category} className="category-section" style={{ marginBottom: '1.5rem' }}>
                                                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                                                    {category} ({categoryTemplates.length})
                                                </h4>
                                                <div className="template-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                                                    {categoryTemplates.map(template => (
                                                        <div
                                                            key={template.id}
                                                            className="template-card"
                                                            style={{
                                                                padding: '0.75rem',
                                                                border: '1px solid #e5e7eb',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s',
                                                                background: 'white',
                                                                position: 'relative'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.borderColor = '#6366f1';
                                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.15)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.borderColor = '#e5e7eb';
                                                                e.currentTarget.style.boxShadow = 'none';
                                                            }}
                                                        >
                                                            <div
                                                                onClick={() => loadTemplate(template)}
                                                                style={{
                                                                    height: '70px',
                                                                    borderRadius: '6px',
                                                                    marginBottom: '0.5rem',
                                                                    background: template.background_value || template.config?.background?.value || '#f3f4f6',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontSize: '1.5rem'
                                                                }}
                                                                title={template.description || 'Click to load'}
                                                            >
                                                                {template.orientation === 'landscape' ? '📄' : '🪪'}
                                                            </div>
                                                            <p style={{
                                                                margin: '0 0 0.25rem 0',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 600,
                                                                color: '#1f2937',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }}>
                                                                {template.name}
                                                            </p>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                                                                <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                                                                    {template.entity_type} • {template.orientation}
                                                                </span>
                                                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            loadTemplate(template);
                                                                        }}
                                                                        style={{
                                                                            padding: '0.25rem 0.5rem',
                                                                            fontSize: '0.65rem',
                                                                            background: '#10b981',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        title="Load this template"
                                                                    >
                                                                        Load
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            // Open in new tab for editing
                                                                            window.open(`/idcards/designer?template=${template.id}`, '_blank');
                                                                        }}
                                                                        style={{
                                                                            padding: '0.25rem 0.5rem',
                                                                            fontSize: '0.65rem',
                                                                            background: '#6366f1',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        title="Edit in new tab"
                                                                    >
                                                                        ✏️ Edit
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            {template.is_default && (
                                                                <span style={{
                                                                    position: 'absolute',
                                                                    top: '0.5rem',
                                                                    right: '0.5rem',
                                                                    fontSize: '0.6rem',
                                                                    background: '#fbbf24',
                                                                    color: '#78350f',
                                                                    padding: '0.125rem 0.375rem',
                                                                    borderRadius: '4px',
                                                                    fontWeight: 600
                                                                }}>
                                                                    ⭐ Default
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {filteredTemplates.length === 0 && templates.length > 0 && (
                                            <div style={{ padding: '1rem', textAlign: 'center', color: '#666', background: '#f9fafb', borderRadius: '8px' }}>
                                                <p style={{ marginBottom: '0.5rem' }}>No templates for <strong>{cardType}</strong> entity type.</p>
                                                <p style={{ fontSize: '0.8rem' }}>Switch to {cardType === 'STUDENT' ? 'STAFF' : 'STUDENT'} or create a new template.</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                                        No saved templates yet. Create and save your first design!
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>

                {/* Canvas */}
                <div className="canvas-container">
                    <div className="canvas-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '1rem' }}>
                        {/* Card Size Selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>📐 Size:</label>
                            <select
                                value={cardSize}
                                onChange={(e) => updateCardDimensions(e.target.value)}
                                style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.875rem' }}
                            >
                                {Object.entries(CARD_SIZES).map(([key, size]) => (
                                    <option key={key} value={key}>{size.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Background Type */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>🎨 Background:</label>
                            <select
                                value={backgroundType}
                                onChange={(e) => setBackgroundType(e.target.value as any)}
                                style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.875rem' }}
                            >
                                <option value="color">Solid Color</option>
                                <option value="gradient">Gradient</option>
                                <option value="image">Image</option>
                            </select>
                        </div>

                        {/* Color/Gradient Input */}
                        {backgroundType === 'color' && (
                            <input
                                type="color"
                                value={backgroundColor}
                                onChange={(e) => updateBackground('color', e.target.value)}
                                style={{ width: '40px', height: '32px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                            />
                        )}

                        {backgroundType === 'gradient' && (
                            <select
                                value={backgroundGradient}
                                onChange={(e) => updateBackground('gradient', e.target.value)}
                                style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.875rem', maxWidth: '200px' }}
                            >
                                <option value="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">Purple Wave</option>
                                <option value="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)">Green Nature</option>
                                <option value="linear-gradient(135deg, #0077B6 0%, #00B4D8 100%)">Ocean Blue</option>
                                <option value="linear-gradient(135deg, #FF6B6B 0%, #FFA07A 100%)">Sunset</option>
                                <option value="linear-gradient(135deg, #1A237E 0%, #303F9F 100%)">Corporate Navy</option>
                                <option value="linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)">Dark Elegant</option>
                                <option value="linear-gradient(135deg, #E91E63 0%, #F8BBD0 100%)">Cherry Blossom</option>
                                <option value="linear-gradient(135deg, #DAA520 0%, #FFD700 100%)">Gold Premium</option>
                                <option value="linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)">Eco Green</option>
                                <option value="linear-gradient(135deg, #795548 0%, #A1887F 100%)">Earth Brown</option>
                                <option value="linear-gradient(90deg, #00FF88 0%, #00E5FF 100%)">Neon Glow</option>
                            </select>
                        )}

                        {backgroundType === 'image' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label
                                    htmlFor="background-image-upload"
                                    style={{
                                        padding: '0.4rem 0.75rem',
                                        borderRadius: '6px',
                                        border: '1px solid #ddd',
                                        fontSize: '0.875rem',
                                        cursor: 'pointer',
                                        background: '#f8fafc',
                                        display: 'inline-block'
                                    }}
                                >
                                    📁 Upload Image
                                </label>
                                <input
                                    id="background-image-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleBackgroundImageUpload}
                                    style={{ display: 'none' }}
                                />
                                {backgroundImageUrl && (
                                    <span style={{ fontSize: '0.75rem', color: '#059669' }}>✓ Image loaded</span>
                                )}
                            </div>
                        )}

                        <span className="canvas-info" style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#666' }}>
                            {design.dimensions?.width || 85.6}mm × {design.dimensions?.height || 53.98}mm
                        </span>
                    </div>

                    {/* Second Row: Custom Dimensions & Styling */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', padding: '0.5rem 1rem', background: '#f1f5f9', borderRadius: '8px', marginBottom: '1rem' }}>
                        {/* Custom Dimensions Toggle */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={useCustomDimensions}
                                onChange={(e) => {
                                    setUseCustomDimensions(e.target.checked);
                                    if (e.target.checked) {
                                        setCardSize('CUSTOM');
                                    }
                                }}
                            />
                            Custom Size
                        </label>

                        {useCustomDimensions && (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.75rem' }}>W:</label>
                                    <input
                                        type="number"
                                        value={customWidth}
                                        onChange={(e) => {
                                            const w = parseFloat(e.target.value) || 54;
                                            setCustomWidth(w);
                                            setDesign(prev => ({ ...prev, dimensions: { width: w, height: prev.dimensions?.height || 86 } }));
                                        }}
                                        style={{ width: '60px', padding: '0.3rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.8rem' }}
                                        min="30"
                                        max="200"
                                    />
                                    <span style={{ fontSize: '0.75rem' }}>mm</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <label style={{ fontSize: '0.75rem' }}>H:</label>
                                    <input
                                        type="number"
                                        value={customHeight}
                                        onChange={(e) => {
                                            const h = parseFloat(e.target.value) || 86;
                                            setCustomHeight(h);
                                            setDesign(prev => ({ ...prev, dimensions: { width: prev.dimensions?.width || 54, height: h } }));
                                        }}
                                        style={{ width: '60px', padding: '0.3rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.8rem' }}
                                        min="30"
                                        max="200"
                                    />
                                    <span style={{ fontSize: '0.75rem' }}>mm</span>
                                </div>
                            </>
                        )}

                        {/* Swap Orientation Button */}
                        <button
                            onClick={() => {
                                const currentW = design.dimensions?.width || 85.6;
                                const currentH = design.dimensions?.height || 53.98;
                                setDesign(prev => ({ ...prev, dimensions: { width: currentH, height: currentW } }));
                                setCustomWidth(currentH);
                                setCustomHeight(currentW);
                            }}
                            style={{
                                padding: '0.4rem 0.8rem',
                                background: '#e0e7ff',
                                border: '1px solid #6366f1',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                color: '#4338ca'
                            }}
                            title="Switch between Portrait and Landscape"
                        >
                            🔄 Swap W↔H
                        </button>

                        {/* Border Options */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid #ddd', paddingLeft: '1rem' }}>
                            <label style={{ fontSize: '0.75rem' }}>Border:</label>
                            <input
                                type="number"
                                value={cardBorder.width}
                                onChange={(e) => setCardBorder(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                                style={{ width: '40px', padding: '0.3rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.8rem' }}
                                min="0"
                                max="10"
                            />
                            <input
                                type="color"
                                value={cardBorder.color}
                                onChange={(e) => setCardBorder(prev => ({ ...prev, color: e.target.value }))}
                                style={{ width: '28px', height: '24px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                            />
                            <label style={{ fontSize: '0.75rem' }}>Radius:</label>
                            <input
                                type="number"
                                value={cardBorder.radius}
                                onChange={(e) => setCardBorder(prev => ({ ...prev, radius: parseInt(e.target.value) || 0 }))}
                                style={{ width: '40px', padding: '0.3rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.8rem' }}
                                min="0"
                                max="20"
                            />
                        </div>

                        {/* Shadow Toggle */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer', borderLeft: '1px solid #ddd', paddingLeft: '1rem' }}>
                            <input
                                type="checkbox"
                                checked={cardShadow.enabled}
                                onChange={(e) => setCardShadow(prev => ({ ...prev, enabled: e.target.checked }))}
                            />
                            Shadow
                        </label>
                    </div>
                    <div
                        ref={canvasRef}
                        className="canvas"
                        style={{
                            width: `${(design.dimensions?.width || 85.6)}mm`,
                            height: `${(design.dimensions?.height || 53.98)}mm`,
                            ...(design.background.type === 'gradient' ? {
                                backgroundImage: design.background.gradient || design.background.value || 'none'
                            } : design.background.type === 'image' && design.background.image_url ? {
                                backgroundImage: `url(${design.background.image_url})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            } : {
                                backgroundColor: design.background.value || '#FFFFFF'
                            }),
                            transition: 'width 0.3s, height 0.3s',
                            border: cardBorder.width > 0 ? `${cardBorder.width}px solid ${cardBorder.color}` : 'none',
                            borderRadius: `${cardBorder.radius}px`,
                            boxShadow: cardShadow.enabled ? `0 4px ${cardShadow.blur}px ${cardShadow.color}` : 'none',
                            overflow: 'hidden'
                        }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setSelectedElement(null);
                            }
                        }}
                    >
                        {design.elements.map(element => (
                            <div
                                key={element.id}
                                id={element.id}
                                className={`element element-${element.type} ${selectedElement === element.id ? 'selected' : ''}`}
                                style={{
                                    position: 'absolute',
                                    left: `${element.x}mm`,
                                    top: `${element.y}mm`,
                                    width: `${element.width}mm`,
                                    height: `${element.height}mm`,
                                    zIndex: element.zIndex,
                                    opacity: element.opacity ?? 1,
                                    ...(element.type === 'text' && {
                                        fontSize: `${(element.fontSize || 12) / MM_TO_PX}mm`,
                                        fontFamily: element.fontFamily || 'Arial, sans-serif',
                                        color: element.color,
                                        fontWeight: element.fontWeight,
                                        textAlign: element.textAlign || 'left',
                                        letterSpacing: element.letterSpacing ? `${(element.letterSpacing || 0) / MM_TO_PX}mm` : 'normal',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                                        padding: '2px'
                                    }),
                                    ...(element.type === 'shape' && {
                                        backgroundColor: element.fill,
                                        border: element.stroke ? `${(element.strokeWidth || 0) / MM_TO_PX}mm solid ${element.stroke}` : 'none',
                                        borderRadius: element.borderRadius ? `${(element.borderRadius || 0) / MM_TO_PX}mm` : (element.shape === 'circle' ? '50%' : '0'),
                                        boxShadow: element.boxShadow || 'none'
                                    })
                                }}
                                data-x={element.x * MM_TO_PX}
                                data-y={element.y * MM_TO_PX}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedElement(element.id);
                                }}
                            >
                                {element.type === 'text' && element.text}
                                {element.type === 'image' && (
                                    uploadedImages[element.id] || element.src?.startsWith('http') || element.src?.startsWith('data:') ? (
                                        <img
                                            src={uploadedImages[element.id] || element.src}
                                            alt="ID Card"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <div className="image-placeholder">
                                            🖼️ {element.src}
                                        </div>
                                    )
                                )}
                                {element.type === 'qrcode' && (
                                    <QRCodeImage
                                        element={element}
                                        qrCodeDataUrls={qrCodeDataUrls}
                                        setQrCodeDataUrls={setQrCodeDataUrls}
                                    />
                                )}
                                {element.type === 'barcode' && (
                                    <div className="barcode-placeholder">
                                        |||||||<br />{element.data}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Property Editor */}
                <div className="property-editor">
                    <h3>⚙️ Properties</h3>
                    {selectedEl ? (
                        <div className="properties">
                            <div className="property-section">
                                <h4>Position & Size</h4>
                                <div className="property-group">
                                    <label>X (mm)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={selectedEl.x}
                                        onChange={e => updateElementProperty(selectedEl.id, 'x', parseFloat(e.target.value))}
                                    />
                                </div>

                                <div className="property-group">
                                    <label>Y (mm)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={selectedEl.y}
                                        onChange={e => updateElementProperty(selectedEl.id, 'y', parseFloat(e.target.value))}
                                    />
                                </div>

                                <div className="property-group">
                                    <label>Width (mm)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={selectedEl.width}
                                        onChange={e => updateElementProperty(selectedEl.id, 'width', parseFloat(e.target.value))}
                                    />
                                </div>

                                <div className="property-group">
                                    <label>Height (mm)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={selectedEl.height}
                                        onChange={e => updateElementProperty(selectedEl.id, 'height', parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>

                            {selectedEl.type === 'text' && (
                                <div className="property-section">
                                    <h4>Text Properties</h4>
                                    <div className="property-group">
                                        <label>Text</label>
                                        <textarea
                                            value={selectedEl.text}
                                            onChange={e => updateElementProperty(selectedEl.id, 'text', e.target.value)}
                                            rows={3}
                                        />
                                        <small>
                                            {cardType === 'STUDENT'
                                                ? 'Use placeholders: {{student_name}}, {{class}}, {{section}}, {{admission_number}}, {{blood_group}}'
                                                : 'Use placeholders: {{staff_name}}, {{employee_id}}, {{designation}}, {{department}}'}
                                        </small>
                                    </div>

                                    <div className="property-group">
                                        <label>Font Family</label>
                                        <select
                                            value={selectedEl.fontFamily || 'Arial, sans-serif'}
                                            onChange={e => updateElementProperty(selectedEl.id, 'fontFamily', e.target.value)}
                                        >
                                            {FONT_FAMILIES.map(f => (
                                                <option key={f.value} value={f.value}>{f.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="property-group">
                                        <label>Font Size</label>
                                        <input
                                            type="number"
                                            value={selectedEl.fontSize}
                                            onChange={e => updateElementProperty(selectedEl.id, 'fontSize', parseInt(e.target.value))}
                                        />
                                    </div>

                                    <div className="property-group">
                                        <label>Font Weight</label>
                                        <select
                                            value={selectedEl.fontWeight}
                                            onChange={e => updateElementProperty(selectedEl.id, 'fontWeight', e.target.value)}
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="bold">Bold</option>
                                            <option value="lighter">Light</option>
                                            <option value="600">Semi-Bold</option>
                                            <option value="800">Extra Bold</option>
                                        </select>
                                    </div>

                                    <div className="property-group">
                                        <label>Text Align</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {(['left', 'center', 'right'] as const).map(align => (
                                                <button
                                                    key={align}
                                                    onClick={() => updateElementProperty(selectedEl.id, 'textAlign', align)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.4rem',
                                                        border: selectedEl.textAlign === align ? '2px solid #6366f1' : '1px solid #ddd',
                                                        background: selectedEl.textAlign === align ? '#e0e7ff' : 'white',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    {align === 'left' ? '⬅️' : align === 'center' ? '↔️' : '➡️'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="property-group">
                                        <label>Letter Spacing (px)</label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={selectedEl.letterSpacing || 0}
                                            onChange={e => updateElementProperty(selectedEl.id, 'letterSpacing', parseFloat(e.target.value))}
                                        />
                                    </div>

                                    <div className="property-group">
                                        <label>Color</label>
                                        <input
                                            type="color"
                                            value={selectedEl.color}
                                            onChange={e => updateElementProperty(selectedEl.id, 'color', e.target.value)}
                                        />
                                    </div>

                                    <div className="property-group">
                                        <label>Opacity (%)</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={(selectedEl.opacity ?? 1) * 100}
                                            onChange={e => updateElementProperty(selectedEl.id, 'opacity', parseInt(e.target.value) / 100)}
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedEl.type === 'shape' && (
                                <div className="property-section">
                                    <h4>Shape Properties</h4>
                                    <div className="property-group">
                                        <label>Shape</label>
                                        <select
                                            value={selectedEl.shape}
                                            onChange={e => updateElementProperty(selectedEl.id, 'shape', e.target.value)}
                                        >
                                            <option value="rectangle">Rectangle</option>
                                            <option value="circle">Circle</option>
                                        </select>
                                    </div>

                                    <div className="property-group">
                                        <label>Fill Color</label>
                                        <input
                                            type="color"
                                            value={selectedEl.fill}
                                            onChange={e => updateElementProperty(selectedEl.id, 'fill', e.target.value)}
                                        />
                                    </div>

                                    <div className="property-group">
                                        <label>Stroke Color</label>
                                        <input
                                            type="color"
                                            value={selectedEl.stroke || '#000000'}
                                            onChange={e => updateElementProperty(selectedEl.id, 'stroke', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedEl.type === 'qrcode' && (
                                <div className="property-section">
                                    <h4>QR Code Properties</h4>
                                    <div className="property-group">
                                        <label>Data</label>
                                        <input
                                            type="text"
                                            value={selectedEl.data}
                                            onChange={e => updateElementProperty(selectedEl.id, 'data', e.target.value)}
                                        />
                                        <small>
                                            {cardType === 'STUDENT'
                                                ? 'Use placeholders like {AdmissionNumber}'
                                                : 'Use placeholders like {EmployeeID}'}
                                        </small>
                                    </div>

                                    <div className="property-group">
                                        <label>QR Color</label>
                                        <input
                                            type="color"
                                            value={selectedEl.qrColor}
                                            onChange={e => updateElementProperty(selectedEl.id, 'qrColor', e.target.value)}
                                        />
                                    </div>

                                    <div className="property-group">
                                        <label>Background</label>
                                        <input
                                            type="color"
                                            value={selectedEl.qrBackground}
                                            onChange={e => updateElementProperty(selectedEl.id, 'qrBackground', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedEl.type === 'image' && (
                                <div className="property-section">
                                    <h4>Image Properties</h4>
                                    <div className="property-group">
                                        <label>Source</label>
                                        <input
                                            type="text"
                                            value={selectedEl.src}
                                            onChange={e => updateElementProperty(selectedEl.id, 'src', e.target.value)}
                                        />
                                        <small>
                                            {cardType === 'STUDENT'
                                                ? 'Use {StudentPhoto} for student photo'
                                                : 'Use {StaffPhoto} for staff photo'}
                                        </small>
                                    </div>
                                    <div className="property-group">
                                        <label>Upload Image</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(selectedEl.id, e)}
                                            className="file-input"
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedEl.type === 'barcode' && (
                                <div className="property-section">
                                    <h4>Barcode Properties</h4>
                                    <div className="property-group">
                                        <label>Data</label>
                                        <input
                                            type="text"
                                            value={selectedEl.data}
                                            onChange={e => updateElementProperty(selectedEl.id, 'data', e.target.value)}
                                        />
                                        <small>
                                            {cardType === 'STUDENT'
                                                ? 'Use {AdmissionNumber}'
                                                : 'Use {EmployeeID}'}
                                        </small>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => deleteElement(selectedEl.id)}
                                className="delete-btn"
                            >
                                🗑️ Delete Element
                            </button>
                        </div>
                    ) : (
                        <div className="no-selection">
                            <p>Select an element to edit its properties</p>
                            <p className="hint">Click on any element in the canvas</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Live Code Editor Panel */}
            {showCodeEditor && (
                <div className="code-editor-panel" style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '40vh',
                    background: '#1e1e1e',
                    borderTop: '3px solid #6366f1',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 16px',
                        background: '#2d2d2d',
                        borderBottom: '1px solid #444'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>📝 Live JSON Editor</span>
                            <span style={{ color: '#888', fontSize: '12px' }}>Edit JSON → Updates Canvas | Edit Canvas → Updates JSON</span>
                            {codeEditorError && (
                                <span style={{ color: '#ef4444', fontSize: '12px', background: '#451a1a', padding: '4px 8px', borderRadius: '4px' }}>
                                    ⚠️ {codeEditorError}
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => {
                                    try {
                                        const parsed = JSON.parse(codeEditorContent);
                                        setDesign(parsed);
                                        setCodeEditorError(null);
                                    } catch (e: any) {
                                        setCodeEditorError('Invalid JSON: ' + e.message);
                                    }
                                }}
                                style={{
                                    padding: '6px 12px',
                                    background: '#22c55e',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 500
                                }}
                            >
                                ✓ Apply Changes
                            </button>
                            <button
                                onClick={() => setCodeEditorContent(JSON.stringify(design, null, 2))}
                                style={{
                                    padding: '6px 12px',
                                    background: '#6366f1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 500
                                }}
                            >
                                ↻ Reset to Canvas
                            </button>
                            <button
                                onClick={() => navigator.clipboard.writeText(codeEditorContent)}
                                style={{
                                    padding: '6px 12px',
                                    background: '#374151',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                📋 Copy
                            </button>
                            <button
                                onClick={() => setShowCodeEditor(false)}
                                style={{
                                    padding: '6px 12px',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                ✕ Close
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={codeEditorContent}
                        onChange={(e) => {
                            setCodeEditorContent(e.target.value);
                            // Auto-validate
                            try {
                                JSON.parse(e.target.value);
                                setCodeEditorError(null);
                            } catch (err: any) {
                                setCodeEditorError('Invalid JSON: ' + err.message);
                            }
                        }}
                        style={{
                            flex: 1,
                            background: '#1e1e1e',
                            color: '#d4d4d4',
                            border: 'none',
                            padding: '16px',
                            fontFamily: 'Monaco, "Cascadia Code", Consolas, monospace',
                            fontSize: '13px',
                            lineHeight: '1.5',
                            resize: 'none',
                            outline: 'none'
                        }}
                        spellCheck={false}
                    />
                </div>
            )}

            {/* Toggle Code Editor Button */}
            <button
                onClick={() => setShowCodeEditor(!showCodeEditor)}
                style={{
                    position: 'fixed',
                    bottom: showCodeEditor ? 'calc(40vh + 10px)' : '20px',
                    right: '20px',
                    padding: '12px 20px',
                    background: showCodeEditor ? '#6366f1' : '#1e1e1e',
                    color: 'white',
                    border: '2px solid #6366f1',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    zIndex: 1001,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s'
                }}
            >
                {showCodeEditor ? '⌨️ Hide Code' : '⌨️ Show Code'}
            </button>

            {/* Preview Modal */}
            {showPreview && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    padding: '20px'
                }} onClick={() => setShowPreview(false)}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        maxWidth: '90vw',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '20px', color: '#1f2937' }}>
                                👁️ Preview with Sample Data
                            </h2>
                            <button
                                onClick={() => setShowPreview(false)}
                                style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '8px 16px',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                ✕ Close
                            </button>
                        </div>

                        <div style={{
                            background: '#f3f4f6',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            fontSize: '13px',
                            color: '#6b7280'
                        }}>
                            💡 This preview shows how the ID card will look with actual {cardType === 'STUDENT' ? 'student' : 'staff'} data.
                            Placeholder variables like <code style={{ background: '#e5e7eb', padding: '2px 6px', borderRadius: '4px' }}>{'{{student_name}}'}</code> are replaced with sample values.
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            padding: '20px',
                            background: '#f9fafb',
                            borderRadius: '12px',
                            border: '2px dashed #e5e7eb'
                        }}>
                            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '12px',
                            marginTop: '20px'
                        }}>
                            <button
                                onClick={() => {
                                    setShowPreview(false);
                                    exportAsImage();
                                }}
                                style={{
                                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '14px'
                                }}
                            >
                                💾 Export as PNG
                            </button>
                            <button
                                onClick={() => setShowPreview(false)}
                                style={{
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '14px'
                                }}
                            >
                                Continue Editing
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IDCardDesigner;
