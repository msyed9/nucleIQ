from django.urls import path
from .views import (
    DownloadTemplateView,
    ImportDataView,
    OverrideDuplicatesView,
    ExportDataView,
    FullBackupView
)

urlpatterns = [
    # Template download
    path('template/<str:module>/', DownloadTemplateView.as_view(), name='download-template'),
    
    # Import
    path('import/', ImportDataView.as_view(), name='import-data'),
    path('override-duplicates/', OverrideDuplicatesView.as_view(), name='override-duplicates'),
    
    # Export
    path('export/<str:module>/', ExportDataView.as_view(), name='export-data'),
    
    # Backup
    path('backup/', FullBackupView.as_view(), name='full-backup'),
]
