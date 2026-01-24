"""
Data Migration URL Configuration
Enhanced routes for import, export, validation, backup, and 10-year migration functionality
"""

from django.urls import path
from .views_enhanced import (
    ModuleListView,
    ModuleFieldsView,
    DownloadTemplateView,
    ValidateDataView,
    ImportDataView,
    ImportJobStatusView,
    ImportJobHistoryView,
    RollbackImportView,
    ExportDataView,
    FullBackupView,
)
from .migration_views import (
    # Migration Run Management
    MigrationRunListView,
    MigrationRunDetailView,
    MigrationSummaryView,
    
    # Phase Execution
    PreflightView,
    StagingView,
    ReferenceMigrationView,
    AcademicYearMigrationView,
    TransactionalMigrationView,
    ReconciliationView,
    
    # Crosswalk and Error Management
    CrosswalkListView,
    MigrationErrorListView,
    MigrationErrorDetailView,
    QuarantineListView,
    QuarantineDetailView,
    
    # Academic Year Batches
    AcademicYearBatchListView,
    AcademicYearBatchDetailView,
    
    # Rollback
    RollbackView,
    
    # Configuration
    EntityScopeConfigView,
    MigrationOrderView,
)

urlpatterns = [
    # ==========================================================================
    # BASIC IMPORT/EXPORT (Existing functionality)
    # ==========================================================================
    
    # Module information
    path('modules/', ModuleListView.as_view(), name='module-list'),
    path('modules/<str:module>/fields/', ModuleFieldsView.as_view(), name='module-fields'),
    
    # Template download
    path('template/<str:module>/', DownloadTemplateView.as_view(), name='download-template'),
    
    # Validation (preview before import)
    path('validate/', ValidateDataView.as_view(), name='validate-data'),
    
    # Import
    path('import/', ImportDataView.as_view(), name='import-data'),
    path('import/<uuid:job_id>/status/', ImportJobStatusView.as_view(), name='import-job-status'),
    path('import/<uuid:job_id>/rollback/', RollbackImportView.as_view(), name='rollback-import'),
    path('import/history/', ImportJobHistoryView.as_view(), name='import-history'),
    
    # Export
    path('export/<str:module>/', ExportDataView.as_view(), name='export-data'),
    
    # Full Backup
    path('backup/', FullBackupView.as_view(), name='full-backup'),
    
    # ==========================================================================
    # 10-YEAR MIGRATION (New comprehensive migration functionality)
    # ==========================================================================
    
    # Migration Summary/Dashboard
    path('migration/summary/', MigrationSummaryView.as_view(), name='migration-summary'),
    
    # Migration Run Management
    path('migration/runs/', MigrationRunListView.as_view(), name='migration-run-list'),
    path('migration/runs/<uuid:run_id>/', MigrationRunDetailView.as_view(), name='migration-run-detail'),
    
    # Phase Execution Endpoints
    path('migration/runs/<uuid:run_id>/preflight/', PreflightView.as_view(), name='migration-preflight'),
    path('migration/runs/<uuid:run_id>/staging/', StagingView.as_view(), name='migration-staging'),
    path('migration/runs/<uuid:run_id>/reference/', ReferenceMigrationView.as_view(), name='migration-reference'),
    path('migration/runs/<uuid:run_id>/academic-years/', AcademicYearMigrationView.as_view(), name='migration-academic-years'),
    path('migration/runs/<uuid:run_id>/transactional/', TransactionalMigrationView.as_view(), name='migration-transactional'),
    path('migration/runs/<uuid:run_id>/reconciliation/', ReconciliationView.as_view(), name='migration-reconciliation'),
    
    # Crosswalk Management
    path('migration/runs/<uuid:run_id>/crosswalk/', CrosswalkListView.as_view(), name='migration-crosswalk'),
    
    # Error Management
    path('migration/runs/<uuid:run_id>/errors/', MigrationErrorListView.as_view(), name='migration-errors'),
    path('migration/runs/<uuid:run_id>/errors/<uuid:error_id>/', MigrationErrorDetailView.as_view(), name='migration-error-detail'),
    
    # Quarantine Management
    path('migration/runs/<uuid:run_id>/quarantine/', QuarantineListView.as_view(), name='migration-quarantine'),
    path('migration/runs/<uuid:run_id>/quarantine/<uuid:record_id>/', QuarantineDetailView.as_view(), name='migration-quarantine-detail'),
    
    # Academic Year Batches
    path('migration/runs/<uuid:run_id>/year-batches/', AcademicYearBatchListView.as_view(), name='migration-year-batches'),
    path('migration/runs/<uuid:run_id>/year-batches/<uuid:batch_id>/', AcademicYearBatchDetailView.as_view(), name='migration-year-batch-detail'),
    
    # Rollback
    path('migration/runs/<uuid:run_id>/rollback/', RollbackView.as_view(), name='migration-rollback'),
    
    # Configuration & Documentation
    path('migration/entity-scopes/', EntityScopeConfigView.as_view(), name='migration-entity-scopes'),
    path('migration/order/', MigrationOrderView.as_view(), name='migration-order'),
]
