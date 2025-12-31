# 📅 Academic Year Architecture - IMPORTANT UPDATE

## ⚠️ **Duplicate Model Found!**

**Issue**: An `AcademicYear` model already exists in `tenants/models.py`!

---

## 🔍 **Existing Implementation**

The `tenants` app already has:
- ✅ `AcademicYear` model (lines 302-360 in `tenants/models.py`)
- ✅ Basic fields: name, start_date, end_date, is_active, is_locked
- ✅ Tenant relationship
- ✅ Admin configuration

---

## 🎯 **Recommended Solution**

**Option A: Use Existing Model** (RECOMMENDED)
1. Delete `academics` app
2. Enhance existing `tenants.AcademicYear` model
3. Add `AcademicTerm` to `tenants` app
4. Add utility functions to `tenants/utils.py`

**Option B: Move to Academics App**
1. Remove `AcademicYear` from `tenants/models.py`
2. Keep `academics` app implementation
3. Update all references
4. Create data migration

---

## ✅ **Recommended Actions**

### **1. Enhance Existing Model**

Update `tenants/models.py` AcademicYear to match our requirements:

```python
class AcademicYear(BaseModel):
    """Academic Year model."""
    
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='academic_years'
    )
    
    name = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Change is_active to is_current for consistency
    is_current = models.BooleanField(default=False, db_index=True)
    is_enrollment_open = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'academic_years'
        unique_together = ['tenant', 'name']
    
    def is_active(self):
        """Check if currently active by date."""
        from datetime import date
        today = date.today()
        return self.start_date <= today <= self.end_date
    
    def get_progress_percentage(self):
        """Get progress 0-100%."""
        from datetime import date
        today = date.today()
        if today < self.start_date:
            return 0.0
        elif today > self.end_date:
            return 100.0
        total_days = (self.end_date - self.start_date).days
        elapsed = (today - self.start_date).days
        return round((elapsed / total_days) * 100, 2)
```

### **2. Add AcademicTerm to tenants/models.py**

```python
class AcademicTerm(BaseModel):
    """Academic Term/Semester model."""
    
    TERM_TYPES = [
        ('TERM', 'Term'),
        ('SEMESTER', 'Semester'),
        ('QUARTER', 'Quarter'),
        ('TRIMESTER', 'Trimester'),
    ]
    
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name='terms'
    )
    
    name = models.CharField(max_length=50)
    term_type = models.CharField(max_length=20, choices=TERM_TYPES, default='TERM')
    term_number = models.IntegerField()
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False, db_index=True)
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'academic_terms'
        unique_together = ['academic_year', 'term_number']
        ordering = ['academic_year', 'term_number']
```

### **3. Add Utility Functions**

Create `tenants/academic_utils.py`:

```python
from django.core.cache import cache
from .models import AcademicYear, AcademicTerm


def get_current_academic_year(tenant):
    """Get current academic year (cached)."""
    cache_key = f'current_academic_year_{tenant.id}'
    year = cache.get(cache_key)
    
    if year is None:
        year = AcademicYear.objects.filter(
            tenant=tenant,
            is_current=True
        ).first()
        
        if year:
            cache.set(cache_key, year, 3600)
    
    return year


def get_or_current_academic_year(tenant, year_id=None):
    """Get by ID or current."""
    if year_id:
        try:
            return AcademicYear.objects.get(tenant=tenant, id=year_id)
        except AcademicYear.DoesNotExist:
            return None
    return get_current_academic_year(tenant)
```

---

## 🚀 **Quick Fix Steps**

1. **Remove academics app**:
```bash
# Remove from settings
# Delete backend/academics directory
```

2. **Enhance tenants.AcademicYear**:
- Add missing fields
- Add utility methods

3. **Add AcademicTerm to tenants**:
- Add model to tenants/models.py
- Update admin

4. **Run migrations**:
```bash
docker compose exec backend python manage.py makemigrations tenants
docker compose exec backend python manage.py migrate
```

---

## 📝 **Current Status**

**Academics App**: ❌ Has duplicate model - needs removal  
**Tenants App**: ✅ Has existing AcademicYear - needs enhancement  
**Solution**: Use and enhance existing model in tenants app  

---

**Next Action**: Please confirm which approach you prefer:
- **A**: Delete academics app, enhance tenants.AcademicYear
- **B**: Move AcademicYear from tenants to academics

I recommend **Option A** for simplicity! 🎯
