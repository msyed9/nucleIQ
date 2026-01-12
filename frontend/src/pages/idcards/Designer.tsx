import React, { useState, useRef, useEffect } from 'react';
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
    card_type: string;
    orientation: string;
    category: string;
    design_json: Design;
    preview_image?: string;
}

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
                    width: Math.min((element.width * 10), (element.height * 10))
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

    // Load templates
    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/students/idcards/templates/');
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
                listeners: {
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
                        // Update design (convert px back to mm)
                        updateElementPosition(target.id, x / 10, y / 10);
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
                listeners: {
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
                        updateElementSize(target.id, width / 10, height / 10);
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
        setDesign(template.design_json);
        setDesignName(`${template.name} (Custom)`);
        setSelectedElement(null);
    };

    const saveDesign = async () => {
        try {
            const templateData = {
                name: designName,
                description: `${cardType} ID Card Design`,
                card_type: cardType,
                orientation: design.dimensions && design.dimensions.width > design.dimensions.height ? 'LANDSCAPE' : 'PORTRAIT',
                category: 'CUSTOM',
                design_json: design,
                is_active: true
            };

            console.log('Saving template:', templateData);

            const response = await api.post('/students/idcards/templates/', templateData);

            if (response.status === 201 || response.status === 200) {
                alert('Design saved successfully!');
                await fetchTemplates(); // Reload templates
            } else {
                alert('Error saving design');
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

    // Filter templates by card type and group by category
    const filteredTemplates = Array.isArray(templates)
        ? templates.filter(t => t.card_type === cardType)
        : [];

    const templatesByCategory = filteredTemplates.reduce((acc, template) => {
        if (!acc[template.category]) {
            acc[template.category] = [];
        }
        acc[template.category].push(template);
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
                </div>
                <button onClick={exportAsImage} className="btn-export" style={{ marginLeft: 'auto' }}>
                    💾 Export PNG
                </button>
                <button onClick={saveDesign} className="save-btn">
                    💾 {t('designer.save') || t('designer.save_success')}
                </button>
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
                                {Object.entries(templatesByCategory).length > 0 ? (
                                    Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                                        <div key={category} className="category-section">
                                            <h4>{category}</h4>
                                            <div className="template-grid">
                                                {categoryTemplates.map(template => (
                                                    <div
                                                        key={template.id}
                                                        className="template-card"
                                                        onClick={() => loadTemplate(template)}
                                                        title={template.description}
                                                    >
                                                        <div className="template-preview">
                                                            {template.preview_image ? (
                                                                <img src={template.preview_image} alt={template.name} />
                                                            ) : (
                                                                <div className="template-placeholder">
                                                                    <span>{template.name.substring(0, 2)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="template-name">{template.name}</p>
                                                        <span className="template-orientation">{template.orientation}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
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
                            width: `${(design.dimensions?.width || 85.6) * 10}px`,
                            height: `${(design.dimensions?.height || 53.98) * 10}px`,
                            background: design.background.type === 'gradient'
                                ? (design.background.gradient || design.background.value)
                                : (design.background.type === 'image' && design.background.image_url)
                                    ? `url(${design.background.image_url})`
                                    : (design.background.value || '#FFFFFF'),
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
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
                                    left: `${element.x * 10}px`,
                                    top: `${element.y * 10}px`,
                                    width: `${element.width * 10}px`,
                                    height: `${element.height * 10}px`,
                                    zIndex: element.zIndex,
                                    opacity: element.opacity ?? 1,
                                    ...(element.type === 'text' && {
                                        fontSize: `${element.fontSize}px`,
                                        fontFamily: element.fontFamily || 'Arial, sans-serif',
                                        color: element.color,
                                        fontWeight: element.fontWeight,
                                        textAlign: element.textAlign || 'left',
                                        letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : 'normal',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                                        padding: '2px'
                                    }),
                                    ...(element.type === 'shape' && {
                                        backgroundColor: element.fill,
                                        border: element.stroke ? `${element.strokeWidth}px solid ${element.stroke}` : 'none',
                                        borderRadius: element.borderRadius ? `${element.borderRadius}px` : (element.shape === 'circle' ? '50%' : '0'),
                                        boxShadow: element.boxShadow || 'none'
                                    })
                                }}
                                data-x={element.x * 10}
                                data-y={element.y * 10}
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
        </div>
    );
};

export default IDCardDesigner;
