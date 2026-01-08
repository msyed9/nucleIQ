

### 1. Backend - Student Serializer Validation

Add to `backend/students/serializers.py`:

```python
from .utils import generate_admission_number, validate_admission_number_unique

class StudentDetailSerializer(serializers.ModelSerializer):
    # ... existing code ...
    
    def validate_admission_number(self, value):
        """Validate admission number for duplicates if manual entry."""
        request = self.context.get('request')
        if not request:
            return value
            
        tenant = request.tenant
        settings = tenant.settings
        
        # If auto-generation is enabled and no value provided, that's OK
        if settings.auto_generate_admission_number and not value:
            return value
        
        # If manual entry or value provided, check for duplicates
        if value:
            instance_id = self.instance.id if self.instance else None
            is_valid, error_msg = validate_admission_number_unique(
                value, tenant, instance_id
            )
            if not is_valid:
                raise serializers.ValidationError(error_msg)
        
        # If auto-generation is disabled, admission number is required
        if not settings.auto_generate_admission_number and not value:
            raise serializers.ValidationError("Admission number is required")
        
        return value
    
    def create(self, validated_data):
        """Auto-generate admission number if enabled."""
        request = self.context.get('request')
        tenant = request.tenant if request else None
        
        if tenant:
            settings = tenant.settings
            
            # Auto-generate if enabled and not provided
            if settings.auto_generate_admission_number and not validated_data.get('admission_number'):
                academic_year = validated_data.get('academic_year')  # If available
                validated_data['admission_number'] = generate_admission_number(
                    tenant, academic_year
                )
        
        return super().create(validated_data)
```

### 2. Frontend - Academic Setup Page

Add to `frontend/src/pages/settings/AcademicSetup.tsx`:

**UI Section for Admission Number Settings:**
```tsx
{/* Admission Number Configuration */}
<div className="card">
    <h3>📝 Admission Number Configuration</h3>
    
    <div className="form-group">
        <label>
            <input
                type="checkbox"
                checked={settings.auto_generate_admission_number}
                onChange={(e) => handleSettingChange('auto_generate_admission_number', e.target.checked)}
            />
            Auto-Generate Admission Numbers
        </label>
        <small>When enabled, admission numbers will be generated automatically based on the format below</small>
    </div>
    
    {settings.auto_generate_admission_number && (
        <>
            <div className="form-group">
                <label>Admission Number Format</label>
                <input
                    type="text"
                    value={settings.admission_number_format}
                    onChange={(e) => handleSettingChange('admission_number_format', e.target.value)}
                    className="form-control"
                    placeholder="ADM{YEAR}{SEQUENCE:04d}"
                />
                <small>
                    Available placeholders: 
                    {'{YEAR}'} (2024), 
                    {'{YY}'} (24), 
                    {'{MONTH}'} (01-12), 
                    {'{SEQUENCE}'} (1,2,3...), 
                    {'{SEQUENCE:04d}'} (0001,0002...)
                    {'{ACADYEAR}'} (2024-25), 
                    {'{PREFIX}'} (uses prefix below)
                </small>
            </div>
            
            <div className="form-group">
                <label>Prefix (Optional)</label>
                <input
                    type="text"
                    value={settings.admission_number_prefix}
                    onChange={(e) => handleSettingChange('admission_number_prefix', e.target.value)}
                    className="form-control"
                    placeholder="ADM"
                    maxLength={20}
                />
            </div>
            
            <div className="form-group">
                <label>Current Sequence Number</label>
                <input
                    type="number"
                    value={settings.admission_number_sequence}
                    onChange={(e) => handleSettingChange('admission_number_sequence', parseInt(e.target.value))}
                    className="form-control"
                    min={1}
                />
                <small>Next admission number will use this sequence value</small>
            </div>
            
            {/* Preview */}
            <div className="preview-box" style={{
                background: '#f5f5f5',
                padding: '12px',
                borderRadius: '4px',
                marginTop: '12px'
            }}>
                <strong>Preview:</strong> 
                <code style={{ marginLeft: '8px', fontSize: '14px' }}>
                    {generatePreview(settings)}
                </code>
            </div>
        </>
    )}
</div>
```

**Helper Function:**
```tsx
const generatePreview = (settings: any) => {
    if (!settings.auto_generate_admission_number) return 'N/A';
    
    let preview = settings.admission_number_format || 'ADM{YEAR}{SEQUENCE:04d}';
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    preview = preview.replace('{YEAR}', String(year));
    preview = preview.replace('{YY}', String(year).slice(2));
    preview = preview.replace('{MONTH}', month);
    preview = preview.replace('{PREFIX}', settings.admission_number_prefix || '');
    
    // Handle sequence formatting
    const sequenceMatch = preview.match(/\{SEQUENCE(?::(\d+)d)?\}/);
    if (sequenceMatch) {
        const padding = sequenceMatch[1] ? parseInt(sequenceMatch[1]) : 0;
        const sequenceStr = String(settings.admission_number_sequence || 1).padStart(padding, '0');
        preview = preview.replace(sequenceMatch[0], sequenceStr);
    }
    
    return preview;
};
```

### 3. Frontend - Add Student Form

Update `frontend/src/pages/students/AddStudent.tsx`:

**Fetch Settings:**
```tsx
const [admissionNumberSettings, setAdmissionNumberSettings] = useState({
    autoGenerate: false,
    format: '',
    preview: ''
});

useEffect(() => {
    // Fetch tenant settings
    api.get('/tenants/settings/')
        .then(res => {
            setAdmissionNumberSettings({
                autoGenerate: res.data.auto_generate_admission_number,
                format: res.data.admission_number_format,
                preview: generatePreview(res.data)
            });
        })
        .catch(err => console.error('Failed to load settings:', err));
}, []);
```

**Admission Number Field:**
```tsx
<div className="form-group">
    <label htmlFor="admission_number">
        Admission Number
        {!admissionNumberSettings.autoGenerate && <span className="required">*</span>}
    </label>
    
    {admissionNumberSettings.autoGenerate ? (
        <div>
            <input
                type="text"
                id="admission_number"
                name="admission_number"
                value={formData.admission_number || ''}
                onChange={handleChange}
                className="form-control"
                placeholder={`Auto-generated (e.g., ${admissionNumberSettings.preview})`}
            />
            <small style={{ color: '#666' }}>
                Leave blank to auto-generate. Or enter manually to override.
            </small>
        </div>
    ) : (
        <div>
            <input
                type="text"
                id="admission_number"
                name="admission_number"
                value={formData.admission_number}
                onChange={handleChange}
                className="form-control"
                required
                placeholder="Enter admission number"
            />
            <small style={{ color: '#666' }}>
                Manual entry required. Auto-generation is disabled.
            </small>
        </div>
    )}
</div>
```

---

## 🎯 Format Examples

| Format | Output | Description |
|--------|--------|-------------|
| `ADM{YEAR}{SEQUENCE:04d}` | ADM20240001 | Year + 4-digit sequence |
| `{YY}/{SEQUENCE:05d}` | 24/00001 | Short year + 5-digit sequence |
| `STD-{MONTH}-{SEQUENCE}` | STD-01-1 | Month + plain sequence |
| `{PREFIX}{ACADYEAR}{SEQUENCE:03d}` | ADM2024-25001 | Prefix + academic year + sequence |

---

## 🧪 Testing Checklist

### Backend:
- [ ] Auto-generation works when enabled
- [ ] Manual entry works when disabled
- [ ] Duplicate validation prevents duplicates
- [ ] Sequence increments correctly
- [ ] Format placeholders work correctly

### Frontend:
- [ ] Settings page shows admission number config
- [ ] Preview updates in real-time
- [ ] Add student form adapts based on setting
- [ ] Auto-generated numbers shown correctly
- [ ] Duplicate error messages displayed

---

## 🔄 Migration Needed

Run this to create/update database fields:
```bash
python manage.py makemigrations
python manage.py migrate
```

---

## 📌 Key Files Modified

1. ✅ `backend/students/utils.py` - Generation logic (created)
2. ✅ `backend/tenants/serializers.py` - API fields (updated)
3. ⏳ `backend/students/serializers.py` - Validation logic (to update)
4. ⏳ `frontend/src/pages/settings/AcademicSetup.tsx` - UI config (to update)
5. ⏳ `frontend/src/pages/students/AddStudent.tsx` - Form logic (to update)

---

**Next Step:** Would you like me to implement the remaining tasks (items marked with ⏳)?
