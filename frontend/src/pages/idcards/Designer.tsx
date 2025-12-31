import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import interact from 'interactjs';
import { useTranslation } from 'react-i18next';
import './Designer.css';

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
    color?: string;
    src?: string;
    shape?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
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
    };
    elements: Element[];
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

const IDCardDesigner: React.FC = () => {
    const [design, setDesign] = useState<Design>({
        version: '1.0',
        background: { type: 'color', value: '#FFFFFF' },
        elements: []
    });

    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [designName, setDesignName] = useState('My Custom Design');
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLDivElement>(null);

    // Load templates
    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/idcards/templates/');
            setTemplates(response.data);
        } catch (error) {
            console.error('Error loading templates:', error);
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
                listeners: {
                    move(event) {
                        const target = event.target;
                        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                        target.style.transform = `translate(${x}px, ${y}px)`;
                        target.setAttribute('data-x', x.toString());
                        target.setAttribute('data-y', y.toString());

                        // Update design (convert px back to mm)
                        updateElementPosition(target.id, x / 10, y / 10);
                    }
                }
            })
            .resizable({
                edges: { left: true, right: true, bottom: true, top: true },
                listeners: {
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

                        updateElementSize(target.id, event.rect.width / 10, event.rect.height / 10);
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
            const response = await api.post('/idcards/designs/', {
                name: designName,
                card_type: 'STUDENT',
                orientation: 'VERTICAL',
                width_mm: 85.6,
                height_mm: 53.98,
                design_json: design,
                is_active: true
            });

            if (response.status === 201 || response.status === 200) {
                alert('Design saved successfully!');
            } else {
                alert('Error saving design');
            }
        } catch (error) {
            console.error('Error saving design:', error);
            alert('Error saving design');
        }
    };

    const updateBackground = (color: string) => {
        setDesign(prev => ({
            ...prev,
            background: { type: 'color', value: color }
        }));
    };

    const selectedEl = design.elements.find(el => el.id === selectedElement);

    // Group templates by category
    const templatesByCategory = templates.reduce((acc, template) => {
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
                <button onClick={saveDesign} className="save-btn">
                    💾 {t('designer.save') || t('designer.save_success')}
                </button>
            </div>

            {/* Main Area */}
            <div className="designer-main">
                {/* Template Library */}
                <div className="template-library">
                    <h3>📚 {t('designer.templates')}</h3>
                    {loading ? (
                        <div className="loading">{t('designer.loading_templates')}</div>
                    ) : (
                        <div className="template-categories">
                            {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
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
                            ))}
                        </div>
                    )}
                </div>

                {/* Canvas */}
                <div className="canvas-container">
                    <div className="canvas-toolbar">
                        <label>
                            Background:
                            <input
                                type="color"
                                value={design.background.value || '#FFFFFF'}
                                onChange={(e) => updateBackground(e.target.value)}
                            />
                        </label>
                        <span className="canvas-info">
                            85.6mm × 53.98mm (Credit Card Size)
                        </span>
                    </div>
                    <div
                        ref={canvasRef}
                        className="canvas"
                        style={{
                            width: '856px', // 85.6mm * 10
                            height: '540px', // 53.98mm * 10
                            backgroundColor: design.background.value || '#FFFFFF'
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
                                    ...(element.type === 'text' && {
                                        fontSize: `${element.fontSize}px`,
                                        color: element.color,
                                        fontWeight: element.fontWeight,
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '2px'
                                    }),
                                    ...(element.type === 'shape' && {
                                        backgroundColor: element.fill,
                                        border: element.stroke ? `${element.strokeWidth}px solid ${element.stroke}` : 'none',
                                        borderRadius: element.shape === 'circle' ? '50%' : '0'
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
                                    <div className="image-placeholder">
                                        🖼️ {element.src}
                                    </div>
                                )}
                                {element.type === 'qrcode' && (
                                    <div className="qr-placeholder">
                                        📱 QR<br />{element.data}
                                    </div>
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
                                        <small>Use placeholders: {'{StudentName}'}, {'{Class}'}, {'{AdmissionNumber}'}</small>
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
                                        </select>
                                    </div>

                                    <div className="property-group">
                                        <label>Color</label>
                                        <input
                                            type="color"
                                            value={selectedEl.color}
                                            onChange={e => updateElementProperty(selectedEl.id, 'color', e.target.value)}
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
                                        <small>Use placeholders like {'{AdmissionNumber}'}</small>
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
                                        <small>Use {'{StudentPhoto}'} for student photo</small>
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
                                        <small>Use {'{AdmissionNumber}'}</small>
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
