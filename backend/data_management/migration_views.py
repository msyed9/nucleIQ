"""
API Views for 10-Year School Data Migration Module

Implements the comprehensive migration API with:
- Migration run management (CRUD, status, progress)
- Phase-based execution endpoints
- Crosswalk and error management
- Reconciliation and reporting
- Rollback capabilities
"""

import logging
from datetime import datetime
from django.db.models import Count, Sum, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.pagination import PageNumberPagination

from core.permissions import IsPlatformAdmin
from .migration_models import (
    MigrationRun, MigrationPhaseLog, CrosswalkEntry, MigrationError,
    QuarantineRecord, ReconciliationReport, AcademicYearBatch,
    EntityScopeConfig, DataScope, MigrationPhase, EntityType
)
from .migration_serializers import (
    MigrationRunSerializer, MigrationRunCreateSerializer,
    MigrationRunDetailSerializer, MigrationPhaseLogSerializer,
    CrosswalkEntrySerializer, MigrationErrorSerializer,
    QuarantineRecordSerializer, QuarantineRecordUpdateSerializer,
    ReconciliationReportSerializer, AcademicYearBatchSerializer,
    EntityScopeConfigSerializer, MigrationSummarySerializer,
    MigrationSourceDataSerializer, PreflightRequestSerializer,
    MigrationRunConfigSerializer, RollbackRequestSerializer,
    ErrorResolutionSerializer
)
from .migration_engine import MigrationEngine, MigrationConfig
from .utils import FileParser

logger = logging.getLogger(__name__)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


# =============================================================================
# MIGRATION RUN MANAGEMENT
# =============================================================================

class MigrationRunListView(APIView):
    """
    List all migration runs for the tenant.
    POST to create a new migration run.
    """
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    
    def get(self, request):
        """List all migration runs."""
        # For platform admins, allow filtering by tenant via query param
        # Otherwise, default to user's assigned tenant
        tenant_id = request.query_params.get('tenant')
        
        if request.user.is_platform_admin and tenant_id:
            runs = MigrationRun.objects.filter(tenant_id=tenant_id)
        else:
            runs = MigrationRun.objects.filter(tenant=request.user.tenant)
            
        runs = runs.order_by('-created_at')
        
        # Apply filters
        status_filter = request.query_params.get('status')
        if status_filter:
            runs = runs.filter(status=status_filter)
        
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(runs, request)
        serializer = MigrationRunSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    def post(self, request):
        """Create a new migration run."""
        serializer = MigrationRunCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            run = serializer.save()
            return Response(
                MigrationRunSerializer(run).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MigrationRunDetailView(APIView):
    """
    Get, update, or delete a specific migration run.
    """
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    
    def get_object(self, run_id, request):
        if request.user.is_platform_admin:
            return MigrationRun.objects.filter(id=run_id).first()
        return MigrationRun.objects.filter(id=run_id, tenant=request.user.tenant).first()
    
    def get(self, request, run_id):
        """Get detailed migration run information."""
        run = self.get_object(run_id, request)
        if not run:
            return Response(
                {'error': 'Migration run not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = MigrationRunDetailSerializer(run)
        return Response(serializer.data)
    
    def patch(self, request, run_id):
        """Update migration run (limited fields)."""
        run = self.get_object(run_id, request)
        if not run:
            return Response(
                {'error': 'Migration run not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Only allow updating certain fields
        allowed_fields = ['description', 'config']
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        for key, value in update_data.items():
            setattr(run, key, value)
        run.save()
        
        return Response(MigrationRunSerializer(run).data)
    
    def delete(self, request, run_id):
        """Delete a migration run (soft delete)."""
        run = self.get_object(run_id, request)
        if not run:
            return Response(
                {'error': 'Migration run not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if run.status == 'RUNNING':
            return Response(
                {'error': 'Cannot delete a running migration'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        run.is_deleted = True
        run.save()
        
        return Response({'message': 'Migration run deleted'})


class MigrationSummaryView(APIView):
    """
    Get migration summary/dashboard data for the tenant.
    """
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    
    def get(self, request):
        """Get migration summary."""
        # For platform admins, allow filtering by tenant via query param
        tenant_id = request.query_params.get('tenant')
        
        if request.user.is_platform_admin and tenant_id:
            tenant = tenant_id
            runs = MigrationRun.objects.filter(tenant_id=tenant, is_deleted=False)
        else:
            tenant = request.user.tenant
            runs = MigrationRun.objects.filter(tenant=tenant, is_deleted=False)
        
        summary = {
            'total_runs': runs.count(),
            'active_runs': runs.filter(status='RUNNING').count(),
            'completed_runs': runs.filter(status='COMPLETED').count(),
            'failed_runs': runs.filter(status='FAILED').count(),
            'total_records_migrated': runs.aggregate(
                total=Sum('successful_records')
            )['total'] or 0,
            'total_errors': MigrationError.objects.filter(
                migration_run__tenant_id=tenant if isinstance(tenant, (str, int)) else tenant
            ).count() if not isinstance(tenant, (str, int)) or tenant else 0, # Handle case where tenant might be ID or object
            'recent_runs': MigrationRunSerializer(
                runs.order_by('-created_at')[:5], many=True
            ).data
        }
        
        # Correctly handle total_errors filtering
        if request.user.is_platform_admin and tenant_id:
             summary['total_errors'] = MigrationError.objects.filter(migration_run__tenant_id=tenant_id).count()
        else:
             summary['total_errors'] = MigrationError.objects.filter(migration_run__tenant=request.user.tenant).count()

        return Response(summary)


# =============================================================================
# PHASE EXECUTION ENDPOINTS
# =============================================================================

class PreflightView(APIView):
    """
    Execute Phase 0: Preflight & Discovery
    Analyzes source data and generates migration mapping report.
    """
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    def post(self, request, run_id):
        """Execute preflight analysis."""
        try:
            run = MigrationRun.objects.get(
                id=run_id,
                tenant=request.user.tenant
            )
        except MigrationRun.DoesNotExist:
            return Response(
                {'error': 'Migration run not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if run.status not in ['PENDING', 'FAILED']:
            return Response(
                {'error': 'Invalid run status for preflight'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse source data
        source_data = request.data.get('source_data', {})
        
        # Handle file upload if present
        file = request.FILES.get('file')
        if file:
            try:
                data, _, file_type = FileParser.parse(file, file.name)
                entity_type = request.data.get('entity_type', 'unknown')
                source_data[entity_type] = data
            except Exception as e:
                return Response(
                    {'error': f'Failed to parse file: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if not source_data:
            return Response(
                {'error': 'No source data provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create engine and run preflight
        config = MigrationConfig(**run.config) if run.config else MigrationConfig()
        engine = MigrationEngine(run, config)
        
        try:
            report = engine.run_preflight(source_data)
            return Response({
                'success': True,
                'run_id': str(run.id),
                'phase': 'PREFLIGHT',
                'report': report
            })
        except Exception as e:
            logger.exception(f"Preflight failed: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StagingView(APIView):
    """
    Execute Phase 1: Staging & Crosswalk
    Loads raw data and creates crosswalk entries.
    """
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    def post(self, request, run_id):
        """Execute staging phase."""
        try:
            run = MigrationRun.objects.get(
                id=run_id,
                tenant=request.user.tenant
            )
        except MigrationRun.DoesNotExist:
            return Response(
                {'error': 'Migration run not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        source_data = request.data.get('source_data', {})
        
        # Handle file upload
        file = request.FILES.get('file')
        if file:
            try:
                data, _, file_type = FileParser.parse(file, file.name)
                entity_type = request.data.get('entity_type', 'unknown')
                source_data[entity_type] = data
            except Exception as e:
                return Response(
                    {'error': f'Failed to parse file: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if not source_data:
            return Response(
                {'error': 'No source data provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        config = MigrationConfig(**run.config) if run.config else MigrationConfig()
        engine = MigrationEngine(run, config)
        
        try:
            stats = engine.run_staging(source_data)
            return Response({
                'success': True,
                'run_id': str(run.id),
                'phase': 'STAGING',
                'stats': {
                    'total': stats.total,
                    'created': stats.created,
                    'failed': stats.failed,
                    'errors': stats.errors[:20]
                }
            })
        except Exception as e:
            logger.exception(f"Staging failed: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReferenceMigrationView(APIView):
    """
    Execute Phase 2: Reference & Evergreen Migration
    Migrates global/master data.
    """
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    
    def post(self, request, run_id):
        """Execute reference migration phase."""
        try:
            run = MigrationRun.objects.get(
                id=run_id,
                tenant=request.user.tenant
            )
        except MigrationRun.DoesNotExist:
            return Response(
                {'error': 'Migration run not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        config = MigrationConfig(**run.config) if run.config else MigrationConfig()
        engine = MigrationEngine(run, config)
        
        try:
            stats = engine.run_reference_migration()
            return Response({
                'success': True,
                'run_id': str(run.id),
                'phase': 'REFERENCE',
                'stats': {
                    'total': stats.total,
                    'created': stats.created,
                    'updated': stats.updated,
                    'skipped': stats.skipped,
                    'failed': stats.failed,
                    'errors': stats.errors[:20]
                }
            })
        except Exception as e:
            logger.exception(f"Reference migration failed: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AcademicYearMigrationView(APIView):
    """
    Execute Phase 3: Academic Year Core
    Creates academic years and terms.
    """
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    
    def post(self, request, run_id):
        """Execute academic year migration phase."""
        try:
            run = MigrationRun.objects.get(
                id=run_id,
                tenant=request.user.tenant
            )
        except MigrationRun.DoesNotExist:
            return Response(
                {'error': 'Migration run not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        config = MigrationConfig(**run.config) if run.config else MigrationConfig()
        engine = MigrationEngine(run, config)
        
        try:
            stats = engine.run_academic_year_migration()
            return Response({
                'success': True,
                'run_id': str(run.id),
                'phase': 'ACADEMIC_CORE',
                'stats': {
                    'total': stats.total,
                    'created': stats.created,
                    'skipped': stats.skipped,
                    'failed': stats.failed,
                    'errors': stats.errors[:20]
                }
            })
        except Exception as e:
            logger.exception(f"Academic year migration failed: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TransactionalMigrationView(APIView):
    """
    Execute Phase 4: Year-Scoped Transactional Data
    Migrates enrollments, attendance, fees, etc.
    """
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    
    def post(self, request, run_id):
        """Execute transactional migration phase."""
        try:
            run = MigrationRun.objects.get(
                id=run_id,
                tenant=request.user.tenant
            )
        except MigrationRun.DoesNotExist:
            return Response(
                {'error': 'Migration run not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        config = MigrationConfig(**run.config) if run.config else MigrationConfig()
        engine = MigrationEngine(run, config)
        
        try:
            stats = engine.run_transactional_migration()
            return Response({
                'success': True,
                'run_id': str(run.id),
                'phase': 'TRANSACTIONAL',
                'stats': {
                    'total': stats.total,
                    'created': stats.created,
                    'updated': stats.updated,
                    'skipped': stats.skipped,
                    'failed': stats.failed,
                    'errors': stats.errors[:20]
                }
            })
        except Exception as e:
            logger.exception(f"Transactional migration failed: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReconciliationView(APIView):
    """
    Execute Phase 5: Reconciliation & Validation
    Validates migration results and generates reports.
    """
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    
    def post(self, request, run_id):
        """Execute reconciliation phase."""
        try:
            run = MigrationRun.objects.get(
                id=run_id,
                tenant=request.user.tenant
            )
        except MigrationRun.DoesNotExist:
            return Response(
                {'error': 'Migration run not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        config = MigrationConfig(**run.config) if run.config else MigrationConfig()
        engine = MigrationEngine(run, config)
        
        try:
            reports = engine.run_reconciliation()
            return Response({
                'success': True,
                'run_id': str(run.id),
                'phase': 'RECONCILIATION',
                'reports': reports
            })
        except Exception as e:
            logger.exception(f"Reconciliation failed: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get(self, request, run_id):
        """Get reconciliation reports for a migration run."""
        try:
            run = MigrationRun.objects.get(
                id=run_id,
                tenant=request.user.tenant
            )
        except MigrationRun.DoesNotExist:
            return Response(
                {'error': 'Migration run not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        reports = ReconciliationReport.objects.filter(migration_run=run)
        serializer = ReconciliationReportSerializer(reports, many=True)
        return Response(serializer.data)


# =============================================================================
# CROSSWALK AND ERROR MANAGEMENT
# =============================================================================

class CrosswalkListView(APIView):
    """
    List and filter crosswalk entries for a migration run.
    """
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    
    def get(self, request, run_id):
        """List crosswalk entries with filtering."""
        try:
            run = MigrationRun.objects.get(
                id=run_id,
                tenant=request.user.tenant
            )
        except MigrationRun.DoesNotExist:
            return Response(
                {'error': 'Migration run not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        entries = CrosswalkEntry.objects.filter(migration_run=run)
        
        # Apply filters
        entity_type = request.query_params.get('entity_type')
        if entity_type:
            entries = entries.filter(entity_type=entity_type)
        
        status_filter = request.query_params.get('status')
        if status_filter:
            entries = entries.filter(status=status_filter)
        
        academic_year = request.query_params.get('academic_year')
        if academic_year:
            entries = entries.filter(academic_year_code=academic_year)
        
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(entries, request)
        serializer = CrosswalkEntrySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class MigrationErrorListView(APIView):
    """
    List and manage migration errors.
    """
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    
    def get(self, request, run_id):
        """List migration errors with filtering."""
        try:
            run = MigrationRun.objects.get(
                id=run_id,
                tenant=request.user.tenant
            )
        except MigrationRun.DoesNotExist:
            return Response(
                {'error': 'Migration run not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        errors = MigrationError.objects.filter(migration_run=run)
        
        # Apply filters
        entity_type = request.query_params.get('entity_type')
        if entity_type:
            errors = errors.filter(entity_type=entity_type)
        
        error_type = request.query_params.get('error_type')
        if error_type:
            errors = errors.filter(error_type=error_type)
        
        is_resolved = request.query_params.get('is_resolved')
        if is_resolved is not None:
            errors = errors.filter(is_resolved=is_resolved.lower() == 'true')
        
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(errors, request)
        serializer = MigrationErrorSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class MigrationErrorDetailView(APIView):
    """
    Get and resolve a specific migration error.
    """
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    
    def get(self, request, run_id, error_id):
        """Get error details."""
        try:
            error = MigrationError.objects.get(
                id=error_id,
                migration_run__id=run_id,
                migration_run__tenant=request.user.tenant
            )
        except MigrationError.DoesNotExist:
            return Response(
                {'error': 'Error not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(MigrationErrorSerializer(error).data)
    
    def post(self, request, run_id, error_id):
        """Resolve an error."""
        try:
            error = MigrationError.objects.get(
                id=error_id,
                migration_run__id=run_id,
                migration_run__tenant=request.user.tenant
            )
        except MigrationError.DoesNotExist:
            return Response(
                {'error': 'Error not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ErrorResolutionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action = serializer.validated_data['action']
        
        if action == 'RESOLVE':
            error.is_resolved = True
            error.resolution_notes = serializer.validated_data['resolution_notes']
            error.resolved_at = timezone.now()
            error.resolved_by = request.user
            error.save()
            
        elif action == 'DISCARD':
            # Move to quarantine with discard status
            QuarantineRecord.objects.create(
                migration_run=error.migration_run,
                entity_type=error.entity_type,
                source_id=error.source_id,
                original_data=error.source_data,
                academic_year_code=error.academic_year_code,
                reason=error.error_message,
                status='DISCARDED'
            )
            error.is_resolved = True
            error.resolution_notes = f"Discarded: {serializer.validated_data['resolution_notes']}"
            error.resolved_at = timezone.now()
            error.resolved_by = request.user
            error.save()
        
        return Response(MigrationErrorSerializer(error).data)


class QuarantineListView(APIView):
    """
    List and manage quarantined records.
    """
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    
    def get(self, request, run_id):
        """List quarantine records."""
        try:
            run = MigrationRun.objects.get(
                id=run_id,
                tenant=request.user.tenant
            )
        except MigrationRun.DoesNotExist:
            return Response(
                {'error': 'Migration run not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        records = QuarantineRecord.objects.filter(migration_run=run)
        
        # Apply filters
        entity_type = request.query_params.get('entity_type')
        if entity_type:
            records = records.filter(entity_type=entity_type)
        
        status_filter = request.query_params.get('status')
        if status_filter:
            records = records.filter(status=status_filter)
        
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(records, request)
        serializer = QuarantineRecordSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class QuarantineDetailView(APIView):
    """
    Get and update a quarantine record.
    """
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    
    def get(self, request, run_id, record_id):
        """Get quarantine record details."""
        try:
            record = QuarantineRecord.objects.get(
                id=record_id,
                migration_run__id=run_id,
                migration_run__tenant=request.user.tenant
            )
        except QuarantineRecord.DoesNotExist:
            return Response(
                {'error': 'Record not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(QuarantineRecordSerializer(record).data)
    
    def patch(self, request, run_id, record_id):
        """Update quarantine record with corrected data."""
        try:
            record = QuarantineRecord.objects.get(
                id=record_id,
                migration_run__id=run_id,
                migration_run__tenant=request.user.tenant
            )
        except QuarantineRecord.DoesNotExist:
            return Response(
                {'error': 'Record not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = QuarantineRecordUpdateSerializer(
            record, data=request.data, partial=True
        )
        
        if serializer.is_valid():
            serializer.save(processed_at=timezone.now())
            return Response(QuarantineRecordSerializer(record).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# ACADEMIC YEAR BATCHES
# =============================================================================

class AcademicYearBatchListView(APIView):
    """
    List academic year batches for a migration run.
    """
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    
    def get(self, request, run_id):
        """List year batches."""
        try:
            run = MigrationRun.objects.get(
                id=run_id,
                tenant=request.user.tenant
            )
        except MigrationRun.DoesNotExist:
            return Response(
                {'error': 'Migration run not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        batches = AcademicYearBatch.objects.filter(
            migration_run=run
        ).order_by('year_sequence')
        
        serializer = AcademicYearBatchSerializer(batches, many=True)
        return Response(serializer.data)


class AcademicYearBatchDetailView(APIView):
    """
    Get details or retry a specific year batch.
    """
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    
    def get(self, request, run_id, batch_id):
        """Get year batch details."""
        try:
            batch = AcademicYearBatch.objects.get(
                id=batch_id,
                migration_run__id=run_id,
                migration_run__tenant=request.user.tenant
            )
        except AcademicYearBatch.DoesNotExist:
            return Response(
                {'error': 'Batch not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(AcademicYearBatchSerializer(batch).data)


# =============================================================================
# ROLLBACK
# =============================================================================

class RollbackView(APIView):
    """
    Rollback migration for a specific year or entire run.
    """
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    
    def post(self, request, run_id):
        """Execute rollback."""
        try:
            run = MigrationRun.objects.get(
                id=run_id,
                tenant=request.user.tenant
            )
        except MigrationRun.DoesNotExist:
            return Response(
                {'error': 'Migration run not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = RollbackRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        if not serializer.validated_data.get('confirm'):
            return Response(
                {'error': 'Please confirm the rollback operation'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        config = MigrationConfig(**run.config) if run.config else MigrationConfig()
        engine = MigrationEngine(run, config)
        
        try:
            if serializer.validated_data.get('rollback_all'):
                result = engine.rollback_all()
            else:
                year_code = serializer.validated_data.get('academic_year_code')
                if not year_code:
                    return Response(
                        {'error': 'Please specify academic_year_code or rollback_all'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                result = engine.rollback_year(year_code)
            
            return Response({
                'success': True,
                'result': result
            })
            
        except Exception as e:
            logger.exception(f"Rollback failed: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# =============================================================================
# ENTITY SCOPE CONFIGURATION
# =============================================================================

class EntityScopeConfigView(APIView):
    """
    Get entity scope configuration (for reference).
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all entity scope configurations."""
        from .migration_engine import DEFAULT_ENTITY_CONFIG
        
        configs = []
        for entity_type, config in DEFAULT_ENTITY_CONFIG.items():
            configs.append({
                'entity_type': entity_type.value,
                'entity_type_display': dict(EntityType.choices).get(
                    entity_type.value, entity_type.value
                ),
                'data_scope': config['scope'].value,
                'scope_display': dict(DataScope.choices).get(
                    config['scope'].value, config['scope'].value
                ),
                'model_path': config['model'],
                'natural_key_fields': config['natural_key'],
                'unique_field': config.get('unique_field'),
                'depends_on': [et.value for et in config['depends_on']],
                'migration_order': config['order']
            })
        
        # Sort by scope then order
        configs.sort(key=lambda x: (x['data_scope'], x['migration_order']))
        
        return Response(configs)


class MigrationOrderView(APIView):
    """
    Get recommended migration order.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get migration order documentation."""
        order = [
            {'step': 1, 'description': 'Tenants/Campuses', 'scope': 'GLOBAL'},
            {'step': 2, 'description': 'Reference data (subjects, grades, fee heads)', 'scope': 'GLOBAL'},
            {'step': 3, 'description': 'People (students, guardians, staff)', 'scope': 'GLOBAL'},
            {'step': 4, 'description': 'AcademicYear + Term', 'scope': 'ACADEMIC_YEAR'},
            {'step': 5, 'description': 'Class/Section instances per year', 'scope': 'ACADEMIC_YEAR'},
            {'step': 6, 'description': 'Enrollments', 'scope': 'ACADEMIC_YEAR'},
            {'step': 7, 'description': 'Timetables', 'scope': 'ACADEMIC_YEAR'},
            {'step': 8, 'description': 'Attendance', 'scope': 'TIMESTAMPED'},
            {'step': 9, 'description': 'Exams + Marks + Reports', 'scope': 'ACADEMIC_YEAR'},
            {'step': 10, 'description': 'Fees + Payments', 'scope': 'ACADEMIC_YEAR'},
            {'step': 11, 'description': 'Transport/Hostel allocations', 'scope': 'ACADEMIC_YEAR'},
            {'step': 12, 'description': 'Communications/logs (optional)', 'scope': 'TIMESTAMPED'},
        ]
        
        return Response({
            'migration_order': order,
            'notes': [
                'Always migrate in the order specified above',
                'Global/evergreen data must be migrated before year-scoped data',
                'Year-scoped data should be migrated chronologically (oldest to newest)',
                'Use crosswalk tables to ensure idempotent reruns',
                'Each year can be rolled back independently'
            ]
        })
