"""
Data Migration URL Configuration
Enhanced routes for import, export, validation, and backup functionality
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

urlpatterns = [
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
]
