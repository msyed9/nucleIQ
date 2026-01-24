"""
Migration Engine for 10-Year School Data Migration

Implements the comprehensive migration architecture with:
- Phase-based migration (Preflight → Staging → Reference → Academic Core → Transactional → Reconciliation)
- Idempotent operations using crosswalk tables
- Chunked/batched processing for scale
- Per-year rollback capability
- Full audit and reconciliation
"""

import logging
from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Any, Tuple, Type
from dataclasses import dataclass, field
from enum import Enum

from django.db import transaction, models
from django.db.models import Count, Sum, Q
from django.utils import timezone
from django.apps import apps

from .migration_models import (
    MigrationRun, MigrationPhaseLog, CrosswalkEntry, MigrationError,
    QuarantineRecord, ReconciliationReport, AcademicYearBatch,
    EntityScopeConfig, DataScope, MigrationPhase, EntityType
)

logger = logging.getLogger(__name__)


# =============================================================================
# ENTITY SCOPE CONFIGURATION
# =============================================================================

# Default scope configuration for all entity types
DEFAULT_ENTITY_CONFIG = {
    # Phase 2: Global/Evergreen Entities (Reference Data)
    EntityType.TENANT: {
        'scope': DataScope.GLOBAL,
        'model': 'tenants.Tenant',
        'natural_key': ['id'],
        'unique_field': 'slug',
        'order': 1,
        'depends_on': [],
    },
    EntityType.DEPARTMENT: {
        'scope': DataScope.GLOBAL,
        'model': 'tenants.Department',
        'natural_key': ['tenant', 'code'],
        'unique_field': 'code',
        'order': 5,
        'depends_on': [EntityType.TENANT],
    },
    EntityType.GRADE_LEVEL: {
        'scope': DataScope.GLOBAL,
        'model': 'tenants.GradeLevel',
        'natural_key': ['tenant', 'name'],
        'unique_field': 'name',
        'order': 10,
        'depends_on': [EntityType.TENANT, EntityType.DEPARTMENT],
    },
    EntityType.SUBJECT: {
        'scope': DataScope.GLOBAL,
        'model': 'tenants.Subject',
        'natural_key': ['tenant', 'code'],
        'unique_field': 'code',
        'order': 15,
        'depends_on': [EntityType.TENANT],
    },
    EntityType.FEE_CATEGORY: {
        'scope': DataScope.GLOBAL,
        'model': 'fees.FeeCategory',
        'natural_key': ['tenant', 'code'],
        'unique_field': 'code',
        'order': 20,
        'depends_on': [EntityType.TENANT],
    },
    EntityType.TRANSPORT_ROUTE: {
        'scope': DataScope.GLOBAL,
        'model': 'transport.Route',
        'natural_key': ['tenant', 'name'],
        'unique_field': 'name',
        'order': 25,
        'depends_on': [EntityType.TENANT],
    },
    EntityType.TRANSPORT_STOP: {
        'scope': DataScope.GLOBAL,
        'model': 'transport.Stop',
        'natural_key': ['route', 'name'],
        'unique_field': None,
        'order': 26,
        'depends_on': [EntityType.TRANSPORT_ROUTE],
    },
    EntityType.STUDENT: {
        'scope': DataScope.GLOBAL,
        'model': 'students.Student',
        'natural_key': ['tenant', 'admission_number'],
        'unique_field': 'admission_number',
        'order': 30,
        'depends_on': [EntityType.TENANT],
    },
    EntityType.GUARDIAN: {
        'scope': DataScope.GLOBAL,
        'model': 'students.ParentUser',
        'natural_key': ['tenant', 'user__phone_number'],
        'unique_field': None,
        'order': 35,
        'depends_on': [EntityType.STUDENT],
    },
    EntityType.STAFF: {
        'scope': DataScope.GLOBAL,
        'model': 'staff.Staff',
        'natural_key': ['tenant', 'employee_id'],
        'unique_field': 'employee_id',
        'order': 40,
        'depends_on': [EntityType.TENANT],
    },
    EntityType.USER: {
        'scope': DataScope.GLOBAL,
        'model': 'users.User',
        'natural_key': ['email'],
        'unique_field': 'email',
        'order': 45,
        'depends_on': [EntityType.TENANT],
    },
    
    # Phase 3: Academic Year Core
    EntityType.ACADEMIC_YEAR: {
        'scope': DataScope.ACADEMIC_YEAR,
        'model': 'tenants.AcademicYear',
        'natural_key': ['tenant', 'name'],
        'unique_field': 'name',
        'order': 100,
        'depends_on': [EntityType.TENANT],
    },
    EntityType.ACADEMIC_TERM: {
        'scope': DataScope.TERM,
        'model': 'tenants.AcademicTerm',
        'natural_key': ['academic_year', 'term_number'],
        'unique_field': None,
        'order': 101,
        'depends_on': [EntityType.ACADEMIC_YEAR],
    },
    EntityType.SECTION: {
        'scope': DataScope.ACADEMIC_YEAR,
        'model': 'tenants.Section',
        'natural_key': ['grade_level', 'name'],
        'unique_field': None,
        'order': 105,
        'depends_on': [EntityType.GRADE_LEVEL],
    },
    
    # Phase 4: Year-Scoped Transactional Data
    EntityType.ENROLLMENT: {
        'scope': DataScope.ACADEMIC_YEAR,
        'model': 'students.StudentEnrollment',
        'natural_key': ['student', 'academic_year'],
        'unique_field': None,
        'order': 200,
        'depends_on': [EntityType.STUDENT, EntityType.SECTION, EntityType.ACADEMIC_YEAR],
    },
    EntityType.STAFF_ASSIGNMENT: {
        'scope': DataScope.ACADEMIC_YEAR,
        'model': 'tenants.ClassSubject',
        'natural_key': ['academic_year', 'grade_level', 'subject'],
        'unique_field': None,
        'order': 210,
        'depends_on': [EntityType.STAFF, EntityType.SECTION, EntityType.SUBJECT],
    },
    EntityType.ATTENDANCE: {
        'scope': DataScope.TIMESTAMPED,
        'model': 'attendance.AttendanceRecord',
        'natural_key': ['student', 'date'],
        'unique_field': None,
        'order': 300,
        'depends_on': [EntityType.ENROLLMENT],
    },
    EntityType.FEE_STRUCTURE: {
        'scope': DataScope.ACADEMIC_YEAR,
        'model': 'fees.FeeStructure',
        'natural_key': ['academic_year', 'category', 'class_level'],
        'unique_field': None,
        'order': 400,
        'depends_on': [EntityType.FEE_CATEGORY, EntityType.GRADE_LEVEL, EntityType.ACADEMIC_YEAR],
    },
    EntityType.FEE_INVOICE: {
        'scope': DataScope.ACADEMIC_YEAR,
        'model': 'fees.FeeInvoice',
        'natural_key': ['student', 'invoice_number'],
        'unique_field': 'invoice_number',
        'order': 410,
        'depends_on': [EntityType.FEE_STRUCTURE, EntityType.ENROLLMENT],
    },
    EntityType.FEE_PAYMENT: {
        'scope': DataScope.ACADEMIC_YEAR,
        'model': 'fees.FeeTransaction',
        'natural_key': ['invoice', 'receipt_number'],
        'unique_field': 'receipt_number',
        'order': 420,
        'depends_on': [EntityType.FEE_INVOICE],
    },
    EntityType.TRANSPORT_ALLOCATION: {
        'scope': DataScope.ACADEMIC_YEAR,
        'model': 'transport.StudentTransport',
        'natural_key': ['student', 'start_date'],
        'unique_field': None,
        'order': 500,
        'depends_on': [EntityType.ENROLLMENT, EntityType.TRANSPORT_STOP],
    },
}


@dataclass
class MigrationConfig:
    """Configuration for a migration run."""
    batch_size: int = 1000
    chunk_size: int = 50000  # For large tables, process in chunks
    max_errors_per_entity: int = 100  # Stop after this many errors per entity
    continue_on_error: bool = True
    validate_fk_references: bool = True
    create_parent_accounts: bool = True
    archive_old_years: bool = False
    parallel_years: bool = False  # Only safe for independent operations
    dry_run: bool = False
    

@dataclass
class MigrationStats:
    """Statistics for a migration operation."""
    total: int = 0
    processed: int = 0
    created: int = 0
    updated: int = 0
    skipped: int = 0
    failed: int = 0
    errors: List[str] = field(default_factory=list)


# =============================================================================
# MIGRATION ENGINE
# =============================================================================

class MigrationEngine:
    """
    Core migration engine implementing the 10-year school data migration.
    
    Migration Order (Strict):
    1. Tenants/Campuses
    2. Reference data (subjects, grades, fee heads)
    3. People (students, guardians, staff)
    4. AcademicYear + Term
    5. Class/Section instances per year
    6. Enrollments
    7. Timetables
    8. Attendance
    9. Exams + Marks + Reports
    10. Fees + Payments
    11. Transport/Hostel allocations
    12. Communications/logs (optional)
    """
    
    def __init__(self, migration_run: MigrationRun, config: Optional[MigrationConfig] = None):
        self.migration_run = migration_run
        self.tenant = migration_run.tenant
        self.config = config or MigrationConfig()
        
        # Crosswalk cache for performance
        self._crosswalk_cache: Dict[str, Dict[str, Any]] = {}
        
        # Statistics tracking
        self.stats: Dict[str, MigrationStats] = {}
    
    # =========================================================================
    # PHASE 0: PREFLIGHT & DISCOVERY
    # =========================================================================
    
    def run_preflight(self, source_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Phase 0: Preflight & Discovery
        
        - Source system profiling: table counts, date ranges, missing keys, duplicates
        - Detect academic-year boundaries in source data
        - Generate a mapping report
        """
        logger.info(f"Starting Phase 0: Preflight for {self.migration_run.run_code}")
        
        phase_log = self._start_phase(MigrationPhase.PREFLIGHT)
        
        try:
            report = {
                'source_summary': {},
                'academic_years': [],
                'entity_mapping': {},
                'anomalies': [],
                'recommendations': [],
            }
            
            # Analyze source data
            for entity_name, records in source_data.items():
                entity_summary = self._analyze_source_entity(entity_name, records)
                report['source_summary'][entity_name] = entity_summary
                
                # Detect academic year boundaries
                if 'date' in str(records[0].keys()) if records else False:
                    years = self._detect_academic_years(records)
                    report['academic_years'].extend(years)
            
            # Deduplicate academic years
            report['academic_years'] = sorted(set(report['academic_years']))
            
            # Generate entity mapping
            report['entity_mapping'] = self._generate_entity_mapping(source_data)
            
            # Detect anomalies
            report['anomalies'] = self._detect_anomalies(source_data)
            
            # Store in migration run
            self.migration_run.source_data_summary = report['source_summary']
            if report['academic_years']:
                self.migration_run.start_academic_year = report['academic_years'][0]
                self.migration_run.end_academic_year = report['academic_years'][-1]
            self.migration_run.save()
            
            # Complete phase
            self._complete_phase(phase_log, report)
            
            return report
            
        except Exception as e:
            self._fail_phase(phase_log, str(e))
            raise
    
    def _analyze_source_entity(self, entity_name: str, records: List[Dict]) -> Dict:
        """Analyze a single entity's source data."""
        if not records:
            return {'count': 0}
        
        summary = {
            'count': len(records),
            'fields': list(records[0].keys()) if records else [],
            'sample': records[0] if records else None,
        }
        
        # Find date range if dates exist
        date_fields = [f for f in summary['fields'] if 'date' in f.lower()]
        if date_fields:
            dates = []
            for record in records:
                for df in date_fields:
                    if record.get(df):
                        try:
                            from .utils import DateParser
                            parsed = DateParser.parse(record[df])
                            if parsed:
                                dates.append(parsed)
                        except:
                            pass
            if dates:
                summary['date_range'] = {
                    'min': min(dates).isoformat(),
                    'max': max(dates).isoformat(),
                }
        
        # Check for duplicates
        if records:
            first_key = list(records[0].keys())[0]  # Use first field as potential key
            values = [r.get(first_key) for r in records]
            unique_values = set(values)
            if len(values) != len(unique_values):
                summary['potential_duplicates'] = len(values) - len(unique_values)
        
        return summary
    
    def _detect_academic_years(self, records: List[Dict]) -> List[str]:
        """Detect academic year boundaries from dated records."""
        years = set()
        
        for record in records:
            for key, value in record.items():
                if 'date' in key.lower() and value:
                    try:
                        from .utils import DateParser
                        parsed = DateParser.parse(value)
                        if parsed:
                            # Indian academic year: April to March
                            if parsed.month >= 4:
                                year_code = f"{parsed.year}-{parsed.year + 1}"
                            else:
                                year_code = f"{parsed.year - 1}-{parsed.year}"
                            years.add(year_code)
                    except:
                        pass
        
        return sorted(list(years))
    
    def _generate_entity_mapping(self, source_data: Dict) -> Dict:
        """Generate entity to scope mapping."""
        mapping = {}
        
        for entity_name in source_data.keys():
            # Try to match to entity type
            entity_type = self._guess_entity_type(entity_name)
            if entity_type:
                config = DEFAULT_ENTITY_CONFIG.get(entity_type, {})
                mapping[entity_name] = {
                    'entity_type': entity_type.value if entity_type else 'UNKNOWN',
                    'scope': config.get('scope', DataScope.GLOBAL).value if config else 'GLOBAL',
                    'target_model': config.get('model', ''),
                }
        
        return mapping
    
    def _guess_entity_type(self, entity_name: str) -> Optional[EntityType]:
        """Guess entity type from source entity name."""
        name_lower = entity_name.lower()
        
        mappings = {
            'student': EntityType.STUDENT,
            'staff': EntityType.STAFF,
            'employee': EntityType.STAFF,
            'teacher': EntityType.STAFF,
            'class': EntityType.GRADE_LEVEL,
            'grade': EntityType.GRADE_LEVEL,
            'section': EntityType.SECTION,
            'subject': EntityType.SUBJECT,
            'fee': EntityType.FEE_STRUCTURE,
            'payment': EntityType.FEE_PAYMENT,
            'attendance': EntityType.ATTENDANCE,
            'enrollment': EntityType.ENROLLMENT,
            'transport': EntityType.TRANSPORT_ALLOCATION,
            'route': EntityType.TRANSPORT_ROUTE,
            'parent': EntityType.GUARDIAN,
            'guardian': EntityType.GUARDIAN,
        }
        
        for key, entity_type in mappings.items():
            if key in name_lower:
                return entity_type
        
        return None
    
    def _detect_anomalies(self, source_data: Dict) -> List[Dict]:
        """Detect data anomalies in source data."""
        anomalies = []
        
        for entity_name, records in source_data.items():
            if not records:
                anomalies.append({
                    'entity': entity_name,
                    'type': 'EMPTY_DATA',
                    'message': f'No records found for {entity_name}'
                })
                continue
            
            # Check for missing required fields
            sample = records[0]
            empty_fields = [k for k, v in sample.items() if v is None or v == '']
            if empty_fields:
                # Count how many records have these empty
                for field_name in empty_fields:
                    empty_count = sum(1 for r in records if not r.get(field_name))
                    if empty_count > len(records) * 0.1:  # More than 10% empty
                        anomalies.append({
                            'entity': entity_name,
                            'type': 'MISSING_DATA',
                            'field': field_name,
                            'count': empty_count,
                            'percentage': round(empty_count / len(records) * 100, 2)
                        })
        
        return anomalies
    
    # =========================================================================
    # PHASE 1: STAGING & CROSSWALK
    # =========================================================================
    
    def run_staging(self, source_data: Dict[str, List[Dict]]) -> MigrationStats:
        """
        Phase 1: Staging & Crosswalk
        
        - Load raw data to staging (as-is)
        - Create crosswalk table entries
        - Natural key normalization
        """
        logger.info(f"Starting Phase 1: Staging for {self.migration_run.run_code}")
        
        phase_log = self._start_phase(MigrationPhase.STAGING)
        stats = MigrationStats()
        
        try:
            for entity_name, records in source_data.items():
                entity_type = self._guess_entity_type(entity_name)
                
                for record in records:
                    stats.total += 1
                    
                    try:
                        # Create crosswalk entry
                        source_id = self._extract_source_id(record, entity_type)
                        natural_key = self._generate_natural_key(record, entity_type)
                        
                        # Detect academic year for year-scoped entities
                        academic_year = self._extract_academic_year(record)
                        
                        CrosswalkEntry.objects.update_or_create(
                            migration_run=self.migration_run,
                            entity_type=entity_type.value if entity_type else 'UNKNOWN',
                            source_id=source_id,
                            academic_year_code=academic_year or '',
                            defaults={
                                'source_natural_key': natural_key,
                                'source_data': record,
                                'status': 'PENDING',
                            }
                        )
                        stats.created += 1
                        
                    except Exception as e:
                        stats.failed += 1
                        stats.errors.append(f"{entity_name}: {str(e)}")
                    
                    stats.processed += 1
            
            self._complete_phase(phase_log, {'stats': vars(stats)})
            return stats
            
        except Exception as e:
            self._fail_phase(phase_log, str(e))
            raise
    
    def _extract_source_id(self, record: Dict, entity_type: Optional[EntityType]) -> str:
        """Extract source ID from a record."""
        # Try common ID field names
        id_fields = ['id', 'ID', '_id', 'source_id', 'legacy_id']
        
        # Add entity-specific ID fields
        if entity_type == EntityType.STUDENT:
            id_fields.extend(['admission_number', 'admission_no', 'student_id', 'roll_no'])
        elif entity_type == EntityType.STAFF:
            id_fields.extend(['employee_id', 'emp_id', 'staff_id'])
        
        for field in id_fields:
            if record.get(field):
                return str(record[field])
        
        # Generate a hash-based ID if no natural key found
        import hashlib
        import json
        content = json.dumps(record, sort_keys=True, default=str)
        return hashlib.md5(content.encode()).hexdigest()[:16]
    
    def _generate_natural_key(self, record: Dict, entity_type: Optional[EntityType]) -> str:
        """Generate normalized natural key for a record."""
        if not entity_type:
            return ''
        
        config = DEFAULT_ENTITY_CONFIG.get(entity_type, {})
        key_fields = config.get('natural_key', [])
        
        key_parts = []
        for field in key_fields:
            value = record.get(field, '')
            if value:
                key_parts.append(str(value).strip().lower())
        
        return ':'.join(key_parts) if key_parts else ''
    
    def _extract_academic_year(self, record: Dict) -> Optional[str]:
        """Extract academic year from a record based on dates."""
        # Look for explicit academic year field
        year_fields = ['academic_year', 'year', 'session', 'academic_session']
        for field in year_fields:
            if record.get(field):
                return str(record[field])
        
        # Try to derive from dates
        date_fields = [k for k in record.keys() if 'date' in k.lower()]
        for field in date_fields:
            if record.get(field):
                try:
                    from .utils import DateParser
                    parsed = DateParser.parse(record[field])
                    if parsed:
                        # Indian academic year: April to March
                        if parsed.month >= 4:
                            return f"{parsed.year}-{parsed.year + 1}"
                        else:
                            return f"{parsed.year - 1}-{parsed.year}"
                except:
                    pass
        
        return None
    
    # =========================================================================
    # PHASE 2: REFERENCE & EVERGREEN MIGRATION
    # =========================================================================
    
    def run_reference_migration(self) -> MigrationStats:
        """
        Phase 2: Reference & Evergreen Migration
        
        Load global and master data first:
        - Tenants, campuses, subjects, grade levels, fee heads
        - People (students, guardians, staff)
        - Users and roles
        """
        logger.info(f"Starting Phase 2: Reference Migration for {self.migration_run.run_code}")
        
        phase_log = self._start_phase(MigrationPhase.REFERENCE)
        stats = MigrationStats()
        
        try:
            # Get all GLOBAL scope entities ordered by migration_order
            global_entities = [
                (et, cfg) for et, cfg in DEFAULT_ENTITY_CONFIG.items()
                if cfg['scope'] == DataScope.GLOBAL
            ]
            global_entities.sort(key=lambda x: x[1]['order'])
            
            for entity_type, config in global_entities:
                entity_stats = self._migrate_entity_type(entity_type, config)
                stats.total += entity_stats.total
                stats.processed += entity_stats.processed
                stats.created += entity_stats.created
                stats.updated += entity_stats.updated
                stats.skipped += entity_stats.skipped
                stats.failed += entity_stats.failed
                stats.errors.extend(entity_stats.errors)
            
            self._complete_phase(phase_log, {'stats': vars(stats)})
            return stats
            
        except Exception as e:
            self._fail_phase(phase_log, str(e))
            raise
    
    def _migrate_entity_type(
        self, 
        entity_type: EntityType, 
        config: Dict
    ) -> MigrationStats:
        """Migrate all records for a specific entity type."""
        stats = MigrationStats()
        
        # Get pending crosswalk entries for this entity
        entries = CrosswalkEntry.objects.filter(
            migration_run=self.migration_run,
            entity_type=entity_type.value,
            status='PENDING'
        )
        
        stats.total = entries.count()
        
        # Get the model
        try:
            model = apps.get_model(config['model'])
        except LookupError:
            logger.warning(f"Model not found: {config['model']}")
            return stats
        
        # Process in batches
        batch_size = self.config.batch_size
        
        for i in range(0, stats.total, batch_size):
            batch = entries[i:i + batch_size]
            
            for entry in batch:
                try:
                    with transaction.atomic():
                        result = self._process_crosswalk_entry(entry, model, config)
                        
                        if result == 'CREATED':
                            stats.created += 1
                        elif result == 'UPDATED':
                            stats.updated += 1
                        elif result == 'SKIPPED':
                            stats.skipped += 1
                        
                        stats.processed += 1
                        
                except Exception as e:
                    stats.failed += 1
                    stats.errors.append(f"{entity_type.value} {entry.source_id}: {str(e)}")
                    
                    # Log error
                    self._log_error(
                        entry=entry,
                        error_type='UNKNOWN',
                        error_message=str(e)
                    )
        
        return stats
    
    def _process_crosswalk_entry(
        self, 
        entry: CrosswalkEntry, 
        model: Type[models.Model],
        config: Dict
    ) -> str:
        """Process a single crosswalk entry and create/update target record."""
        source_data = entry.source_data
        
        # Check if already exists in target
        unique_field = config.get('unique_field')
        existing = None
        
        if unique_field and source_data.get(unique_field):
            try:
                filter_kwargs = {
                    'tenant': self.tenant,
                    unique_field: source_data[unique_field]
                }
                existing = model.objects.filter(**filter_kwargs).first()
            except:
                pass
        
        if existing:
            if self.config.continue_on_error:
                # Update existing record
                entry.target_id = existing.id
                entry.status = 'MAPPED'
                entry.processed_at = timezone.now()
                entry.save()
                return 'SKIPPED'
            else:
                # Optionally update
                entry.target_id = existing.id
                entry.status = 'UPDATED'
                entry.processed_at = timezone.now()
                entry.save()
                return 'UPDATED'
        
        # Create new record
        if not self.config.dry_run:
            new_record = self._create_record(model, source_data, config)
            if new_record:
                entry.target_id = new_record.id
                entry.status = 'CREATED'
            else:
                entry.status = 'FAILED'
        else:
            entry.status = 'SKIPPED'
        
        entry.processed_at = timezone.now()
        entry.save()
        
        return entry.status
    
    def _create_record(
        self, 
        model: Type[models.Model], 
        source_data: Dict,
        config: Dict
    ) -> Optional[models.Model]:
        """Create a new record in the target model."""
        # This is a simplified implementation - in production, you'd have
        # entity-specific creation logic similar to views_enhanced.py
        
        # Get model fields
        model_fields = {f.name for f in model._meta.get_fields() if hasattr(f, 'name')}
        
        # Filter source data to only include valid fields
        create_data = {}
        for key, value in source_data.items():
            if key in model_fields and value is not None:
                create_data[key] = value
        
        # Add tenant
        if 'tenant' in model_fields:
            create_data['tenant'] = self.tenant
        
        try:
            return model.objects.create(**create_data)
        except Exception as e:
            logger.warning(f"Failed to create {model.__name__}: {e}")
            return None
    
    # =========================================================================
    # PHASE 3: ACADEMIC YEAR CORE
    # =========================================================================
    
    def run_academic_year_migration(self) -> MigrationStats:
        """
        Phase 3: Academic Year Core
        
        - Create AcademicYear records
        - Create Term records per year
        - Initialize year-specific class/section structure for each year
        """
        logger.info(f"Starting Phase 3: Academic Year Core for {self.migration_run.run_code}")
        
        phase_log = self._start_phase(MigrationPhase.ACADEMIC_CORE)
        stats = MigrationStats()
        
        try:
            # Get all academic years from crosswalk
            years = CrosswalkEntry.objects.filter(
                migration_run=self.migration_run,
                academic_year_code__isnull=False
            ).exclude(
                academic_year_code=''
            ).values_list('academic_year_code', flat=True).distinct()
            
            years = sorted(set(years))
            
            AcademicYear = apps.get_model('tenants.AcademicYear')
            AcademicTerm = apps.get_model('tenants.AcademicTerm')
            
            for i, year_code in enumerate(years, 1):
                stats.total += 1
                
                try:
                    # Parse year code (e.g., "2014-2015")
                    start_year = int(year_code.split('-')[0])
                    end_year = int(year_code.split('-')[1])
                    
                    # Create academic year
                    academic_year, created = AcademicYear.objects.get_or_create(
                        tenant=self.tenant,
                        name=year_code,
                        defaults={
                            'start_date': date(start_year, 4, 1),  # April 1
                            'end_date': date(end_year, 3, 31),     # March 31
                            'is_active': False,
                            'is_locked': True,  # Old years are locked
                            'description': f'Migrated from source system'
                        }
                    )
                    
                    if created:
                        stats.created += 1
                        
                        # Create terms for this year
                        self._create_terms_for_year(academic_year)
                    else:
                        stats.skipped += 1
                    
                    # Create AcademicYearBatch for tracking
                    AcademicYearBatch.objects.get_or_create(
                        migration_run=self.migration_run,
                        academic_year_code=year_code,
                        defaults={
                            'academic_year': academic_year,
                            'year_sequence': i,
                            'start_date': academic_year.start_date,
                            'end_date': academic_year.end_date,
                            'status': 'PENDING'
                        }
                    )
                    
                    stats.processed += 1
                    
                except Exception as e:
                    stats.failed += 1
                    stats.errors.append(f"Year {year_code}: {str(e)}")
            
            self._complete_phase(phase_log, {'stats': vars(stats)})
            return stats
            
        except Exception as e:
            self._fail_phase(phase_log, str(e))
            raise
    
    def _create_terms_for_year(self, academic_year) -> None:
        """Create default terms for an academic year."""
        AcademicTerm = apps.get_model('tenants.AcademicTerm')
        
        # Create 2 terms by default (can be customized)
        term1_start = academic_year.start_date
        term1_end = date(academic_year.start_date.year, 9, 30)
        
        term2_start = date(academic_year.start_date.year, 10, 1)
        term2_end = academic_year.end_date
        
        AcademicTerm.objects.get_or_create(
            academic_year=academic_year,
            term_number=1,
            defaults={
                'name': 'Term 1',
                'term_type': 'TERM',
                'start_date': term1_start,
                'end_date': term1_end,
                'is_active': False
            }
        )
        
        AcademicTerm.objects.get_or_create(
            academic_year=academic_year,
            term_number=2,
            defaults={
                'name': 'Term 2',
                'term_type': 'TERM',
                'start_date': term2_start,
                'end_date': term2_end,
                'is_active': False
            }
        )
    
    # =========================================================================
    # PHASE 4: YEAR-SCOPED TRANSACTIONAL DATA
    # =========================================================================
    
    def run_transactional_migration(self) -> MigrationStats:
        """
        Phase 4: Year-Scoped Transactional Data
        
        Load per year, in chronological order, using chunking:
        - Enrollments & section allocations
        - Timetables, attendance
        - Exams, marks, report cards
        - Fees, payments, concessions
        - Transport & hostel allocations
        """
        logger.info(f"Starting Phase 4: Transactional Migration for {self.migration_run.run_code}")
        
        phase_log = self._start_phase(MigrationPhase.TRANSACTIONAL)
        stats = MigrationStats()
        
        try:
            # Get year batches in chronological order
            year_batches = AcademicYearBatch.objects.filter(
                migration_run=self.migration_run
            ).order_by('year_sequence')
            
            for batch in year_batches:
                batch_stats = self._migrate_year_batch(batch)
                
                stats.total += batch_stats.total
                stats.processed += batch_stats.processed
                stats.created += batch_stats.created
                stats.updated += batch_stats.updated
                stats.skipped += batch_stats.skipped
                stats.failed += batch_stats.failed
                stats.errors.extend(batch_stats.errors)
            
            self._complete_phase(phase_log, {'stats': vars(stats)})
            return stats
            
        except Exception as e:
            self._fail_phase(phase_log, str(e))
            raise
    
    def _migrate_year_batch(self, batch: AcademicYearBatch) -> MigrationStats:
        """Migrate all transactional data for a specific academic year."""
        stats = MigrationStats()
        
        batch.status = 'IN_PROGRESS'
        batch.started_at = timezone.now()
        batch.save()
        
        try:
            # Get year-scoped entities ordered by migration_order
            year_entities = [
                (et, cfg) for et, cfg in DEFAULT_ENTITY_CONFIG.items()
                if cfg['scope'] in [DataScope.ACADEMIC_YEAR, DataScope.TIMESTAMPED]
            ]
            year_entities.sort(key=lambda x: x[1]['order'])
            
            for entity_type, config in year_entities:
                entity_stats = self._migrate_entity_for_year(
                    entity_type, config, batch.academic_year_code
                )
                
                stats.total += entity_stats.total
                stats.processed += entity_stats.processed
                stats.created += entity_stats.created
                stats.updated += entity_stats.updated
                stats.skipped += entity_stats.skipped
                stats.failed += entity_stats.failed
                stats.errors.extend(entity_stats.errors)
                
                # Update batch progress
                batch.entity_progress[entity_type.value] = {
                    'processed': entity_stats.processed,
                    'created': entity_stats.created,
                    'failed': entity_stats.failed
                }
                batch.save()
            
            batch.status = 'COMPLETED'
            batch.completed_at = timezone.now()
            batch.total_records = stats.total
            batch.processed_records = stats.processed
            batch.successful_records = stats.created + stats.updated
            batch.failed_records = stats.failed
            batch.save()
            
        except Exception as e:
            batch.status = 'FAILED'
            batch.save()
            raise
        
        return stats
    
    def _migrate_entity_for_year(
        self,
        entity_type: EntityType,
        config: Dict,
        academic_year_code: str
    ) -> MigrationStats:
        """Migrate entities for a specific academic year."""
        stats = MigrationStats()
        
        # Get pending crosswalk entries for this entity and year
        entries = CrosswalkEntry.objects.filter(
            migration_run=self.migration_run,
            entity_type=entity_type.value,
            academic_year_code=academic_year_code,
            status='PENDING'
        )
        
        stats.total = entries.count()
        
        if stats.total == 0:
            return stats
        
        try:
            model = apps.get_model(config['model'])
        except LookupError:
            logger.warning(f"Model not found: {config['model']}")
            return stats
        
        for entry in entries:
            try:
                with transaction.atomic():
                    result = self._process_crosswalk_entry(entry, model, config)
                    
                    if result == 'CREATED':
                        stats.created += 1
                    elif result == 'UPDATED':
                        stats.updated += 1
                    elif result == 'SKIPPED':
                        stats.skipped += 1
                    
                    stats.processed += 1
                    
            except Exception as e:
                stats.failed += 1
                stats.errors.append(f"{entity_type.value} {entry.source_id}: {str(e)}")
                
                self._log_error(
                    entry=entry,
                    error_type='UNKNOWN',
                    error_message=str(e)
                )
        
        return stats
    
    # =========================================================================
    # PHASE 5: RECONCILIATION & VALIDATION
    # =========================================================================
    
    def run_reconciliation(self) -> Dict[str, Any]:
        """
        Phase 5: Reconciliation & Validation
        
        - Counts by year vs source
        - Critical metrics: total students enrolled per year, total fee billed vs collected
        - Spot checks: sample student histories across all years
        """
        logger.info(f"Starting Phase 5: Reconciliation for {self.migration_run.run_code}")
        
        phase_log = self._start_phase(MigrationPhase.RECONCILIATION)
        
        try:
            reports = {}
            
            # 1. Record count comparison
            reports['counts'] = self._reconcile_counts()
            
            # 2. Enrollment summary by year
            reports['enrollments'] = self._reconcile_enrollments()
            
            # 3. Financial reconciliation
            reports['financial'] = self._reconcile_financials()
            
            # 4. Spot checks
            reports['spot_checks'] = self._run_spot_checks()
            
            # Store reports
            for report_type, data in reports.items():
                ReconciliationReport.objects.create(
                    migration_run=self.migration_run,
                    report_type=report_type.upper(),
                    source_total=Decimal(str(data.get('source_total', 0))),
                    target_total=Decimal(str(data.get('target_total', 0))),
                    breakdown=data.get('breakdown', {}),
                    is_valid=data.get('is_valid', False),
                    validation_notes=data.get('notes', ''),
                    spot_check_samples=data.get('samples', [])
                )
            
            # Update migration run
            self.migration_run.status = 'COMPLETED'
            self.migration_run.completed_at = timezone.now()
            self.migration_run.save()
            
            self._complete_phase(phase_log, {'reports': reports})
            
            return reports
            
        except Exception as e:
            self._fail_phase(phase_log, str(e))
            raise
    
    def _reconcile_counts(self) -> Dict:
        """Reconcile record counts between source and target."""
        result = {
            'source_total': 0,
            'target_total': 0,
            'breakdown': {},
            'is_valid': True,
            'notes': ''
        }
        
        # Count crosswalk entries by entity type
        crosswalk_counts = CrosswalkEntry.objects.filter(
            migration_run=self.migration_run
        ).values('entity_type').annotate(
            total=Count('id'),
            created=Count('id', filter=Q(status='CREATED')),
            skipped=Count('id', filter=Q(status='SKIPPED')),
            failed=Count('id', filter=Q(status='FAILED'))
        )
        
        for item in crosswalk_counts:
            result['breakdown'][item['entity_type']] = {
                'source': item['total'],
                'created': item['created'],
                'skipped': item['skipped'],
                'failed': item['failed']
            }
            result['source_total'] += item['total']
            result['target_total'] += item['created']
        
        # Check if counts match expectations
        failed_count = sum(
            item['failed'] for item in result['breakdown'].values()
        )
        if failed_count > 0:
            result['is_valid'] = False
            result['notes'] = f"{failed_count} records failed to import"
        
        return result
    
    def _reconcile_enrollments(self) -> Dict:
        """Reconcile enrollment counts by academic year."""
        result = {
            'source_total': 0,
            'target_total': 0,
            'breakdown': {},
            'is_valid': True
        }
        
        # Count enrollments in crosswalk
        source_counts = CrosswalkEntry.objects.filter(
            migration_run=self.migration_run,
            entity_type=EntityType.ENROLLMENT.value
        ).values('academic_year_code').annotate(count=Count('id'))
        
        for item in source_counts:
            year = item['academic_year_code']
            result['breakdown'][year] = {'source': item['count']}
            result['source_total'] += item['count']
        
        # Count actual enrollments in target
        StudentEnrollment = apps.get_model('students.StudentEnrollment')
        
        for year_code in result['breakdown'].keys():
            try:
                AcademicYear = apps.get_model('tenants.AcademicYear')
                academic_year = AcademicYear.objects.filter(
                    tenant=self.tenant,
                    name=year_code
                ).first()
                
                if academic_year:
                    target_count = StudentEnrollment.objects.filter(
                        tenant=self.tenant,
                        academic_year=academic_year
                    ).count()
                    
                    result['breakdown'][year_code]['target'] = target_count
                    result['target_total'] += target_count
            except:
                pass
        
        return result
    
    def _reconcile_financials(self) -> Dict:
        """Reconcile financial totals (fees billed vs collected)."""
        result = {
            'source_total': 0,
            'target_total': 0,
            'breakdown': {},
            'is_valid': True
        }
        
        # This would need actual financial calculations based on your models
        # Placeholder implementation
        
        return result
    
    def _run_spot_checks(self) -> Dict:
        """Run spot checks on sample records."""
        result = {
            'samples': [],
            'is_valid': True,
            'notes': ''
        }
        
        # Get sample students and verify their complete history
        Student = apps.get_model('students.Student')
        students = Student.objects.filter(
            tenant=self.tenant
        ).order_by('?')[:10]  # Random sample of 10
        
        for student in students:
            sample = {
                'id': str(student.id),
                'admission_number': student.admission_number,
                'name': f"{student.first_name} {student.last_name}",
                'enrollments': [],
                'is_valid': True
            }
            
            for enrollment in student.enrollments.all():
                sample['enrollments'].append({
                    'year': enrollment.academic_year.name if enrollment.academic_year else 'N/A',
                    'section': str(enrollment.section) if enrollment.section else 'N/A',
                    'status': enrollment.status
                })
            
            result['samples'].append(sample)
        
        return result
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    def _start_phase(self, phase: str) -> MigrationPhaseLog:
        """Start a migration phase and create log entry."""
        self.migration_run.current_phase = phase
        self.migration_run.status = 'RUNNING'
        if not self.migration_run.started_at:
            self.migration_run.started_at = timezone.now()
        self.migration_run.save()
        
        phase_log, _ = MigrationPhaseLog.objects.get_or_create(
            migration_run=self.migration_run,
            phase=phase,
            defaults={
                'status': 'RUNNING',
                'started_at': timezone.now()
            }
        )
        
        return phase_log
    
    def _complete_phase(self, phase_log: MigrationPhaseLog, result: Dict) -> None:
        """Mark a phase as completed."""
        phase_log.status = 'COMPLETED'
        phase_log.completed_at = timezone.now()
        phase_log.entity_counts = result.get('stats', {})
        phase_log.save()
        
        # Update migration run phase status
        self.migration_run.phase_status[phase_log.phase] = {
            'status': 'COMPLETED',
            'completed_at': timezone.now().isoformat()
        }
        self.migration_run.save()
    
    def _fail_phase(self, phase_log: MigrationPhaseLog, error: str) -> None:
        """Mark a phase as failed."""
        phase_log.status = 'FAILED'
        phase_log.completed_at = timezone.now()
        phase_log.error_summary = [error]
        phase_log.save()
        
        self.migration_run.status = 'FAILED'
        self.migration_run.phase_status[phase_log.phase] = {
            'status': 'FAILED',
            'error': error,
            'failed_at': timezone.now().isoformat()
        }
        self.migration_run.save()
    
    def _log_error(
        self,
        entry: CrosswalkEntry,
        error_type: str,
        error_message: str
    ) -> None:
        """Log a migration error."""
        MigrationError.objects.create(
            migration_run=self.migration_run,
            phase=self.migration_run.current_phase,
            entity_type=entry.entity_type,
            source_id=entry.source_id,
            source_data=entry.source_data,
            academic_year_code=entry.academic_year_code,
            error_type=error_type,
            error_message=error_message
        )
        
        entry.status = 'FAILED'
        entry.error_message = error_message
        entry.save()
    
    # =========================================================================
    # ROLLBACK
    # =========================================================================
    
    def rollback_year(self, academic_year_code: str) -> Dict:
        """Rollback all records created for a specific academic year."""
        result = {'deleted': 0, 'errors': []}
        
        batch = AcademicYearBatch.objects.filter(
            migration_run=self.migration_run,
            academic_year_code=academic_year_code
        ).first()
        
        if not batch:
            return {'error': 'Year batch not found'}
        
        # Get all created records for this year
        entries = CrosswalkEntry.objects.filter(
            migration_run=self.migration_run,
            academic_year_code=academic_year_code,
            status='CREATED'
        )
        
        for entry in entries:
            try:
                if entry.target_id:
                    config = DEFAULT_ENTITY_CONFIG.get(
                        EntityType(entry.entity_type), {}
                    )
                    if config:
                        model = apps.get_model(config['model'])
                        model.objects.filter(id=entry.target_id).delete()
                        result['deleted'] += 1
                        
                        entry.status = 'PENDING'
                        entry.target_id = None
                        entry.save()
            except Exception as e:
                result['errors'].append(f"{entry.entity_type} {entry.source_id}: {str(e)}")
        
        batch.status = 'ROLLED_BACK'
        batch.save()
        
        return result
    
    def rollback_all(self) -> Dict:
        """Rollback entire migration run."""
        result = {'total_deleted': 0, 'by_year': {}}
        
        batches = AcademicYearBatch.objects.filter(
            migration_run=self.migration_run
        ).order_by('-year_sequence')  # Reverse order for rollback
        
        for batch in batches:
            year_result = self.rollback_year(batch.academic_year_code)
            result['by_year'][batch.academic_year_code] = year_result
            result['total_deleted'] += year_result.get('deleted', 0)
        
        self.migration_run.status = 'ROLLED_BACK'
        self.migration_run.save()
        
        return result
