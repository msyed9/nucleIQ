"""
Celery Tasks for ID Card Generation
Handles background processing for bulk generation
"""

from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import traceback
import zipfile
from io import BytesIO

from .models import IDCardGenerationJob, IDCardTemplate
from .utils import generate_single_id_card, create_grid_layout, html_to_pdf, upload_to_storage
from students.models import Student
from staff.models import Staff


@shared_task(bind=True, max_retries=3)
def generate_bulk_id_cards(self, job_id):
    """
    Celery task to generate bulk ID cards
    """
    # First fetch the job outside the main try/except to handle the common
    # race where the HTTP request hasn't committed yet (ATOMIC_REQUESTS=True).
    try:
        job = IDCardGenerationJob.objects.get(id=job_id)
    except IDCardGenerationJob.DoesNotExist as e:
        # Retry quickly; the row may not be committed/visible yet.
        if getattr(self.request, 'retries', 0) < getattr(self, 'max_retries', 3):
            raise self.retry(exc=e, countdown=1)
        raise

    try:
        job.status = 'processing'
        job.started_at = timezone.now()
        job.celery_task_id = self.request.id
        job.save()
        
        # Get template
        template = job.template
        
        # Get entities based on filters
        entities = get_filtered_entities(
            job.entity_type,
            job.filters,
            job.tenant
        )
        
        job.total_cards = len(entities)
        job.save()
        
        if job.total_cards == 0:
            job.status = 'failed'
            job.error_message = 'No entities found matching the filters'
            job.completed_at = timezone.now()
            job.save()
            return
        
        # Generate cards
        generated_files = []
        individual_urls = []
        
        for index, entity in enumerate(entities):
            try:
                # Generate single card
                id_card, qr_code, preview_image = generate_single_id_card(
                    entity=entity,
                    entity_type=job.entity_type,
                    template=template,
                    tenant=job.tenant,
                    include_qr=job.include_qr,
                    output_format=job.output_format,
                    return_preview_image=job.layout in ['grid', 'sheet']
                )
                
                # Link to bulk job
                id_card.bulk_job = job
                id_card.save()
                
                # Store file info
                generated_files.append({
                    'entity_id': str(entity.id),
                    'file_url': id_card.file_url,
                    'file_format': id_card.file_format,
                    'preview_image': preview_image,
                })
                individual_urls.append(id_card.file_url)
                
                # Update progress
                job.completed_cards += 1
                job.update_progress()
                
            except Exception as e:
                job.failed_cards += 1
                job.save()
                print(f"Failed to generate card for {entity}: {str(e)}")
                traceback.print_exc()
        
        # Store individual files
        job.individual_files = [
            {
                'entity_id': item.get('entity_id'),
                'file_url': item.get('file_url'),
                'file_format': item.get('file_format', 'pdf'),
            }
            for item in generated_files
        ]
        job.save()
        
        # Create combined file if needed
        if job.layout == 'grid':
            # Create grid layout (9 cards per A4)
            download_url = create_grid_pdf(job, generated_files)
            job.download_url = download_url
        elif job.layout == 'sheet':
            # Create print sheet
            download_url = create_print_sheet(job, generated_files)
            job.download_url = download_url
        else:
            # Create ZIP of individual files
            download_url = create_zip_file(job, individual_urls)
            job.download_url = download_url
        
        # Mark as completed
        job.status = 'completed'
        job.completed_at = timezone.now()
        job.save()
        
        return {
            'status': 'completed',
            'total_cards': job.total_cards,
           'completed_cards': job.completed_cards,
            'failed_cards': job.failed_cards,
            'download_url': job.download_url
        }
        
    except Exception as e:
        # Handle errors
        import logging
        logger = logging.getLogger(__name__)
        logger.exception("generate_bulk_id_cards failed for job_id=%s: %s", job_id, e)

        if job is not None:
            try:
                job.status = 'failed'
                job.error_message = str(e)
                job.completed_at = timezone.now()
                job.save()
            except Exception:
                logger.exception("Failed to mark job as failed for job_id=%s", job_id)
        else:
            # Job was not found; nothing to update in DB
            logger.error("IDCardGenerationJob with id=%s does not exist; cannot update status", job_id)

        traceback.print_exc()
        raise


def get_filtered_entities(entity_type, filters, tenant):
    """
    Get entities based on filters
    Supports:
    - entity_ids: list of specific entity UUIDs (individual selection)
    - grade_level: UUID of grade level
    - section: UUID of section  
    - class: name-based class filter (legacy)
    - department: staff department
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"get_filtered_entities called: entity_type={entity_type}, filters={filters}, tenant={tenant}")
    
    # Handle individual entity selection (entity_ids filter)
    entity_ids = filters.get('entity_ids', [])
    if entity_ids:
        logger.info(f"Individual selection mode: {len(entity_ids)} entities selected")
        if entity_type == 'student':
            queryset = Student.objects.filter(tenant=tenant, id__in=entity_ids)
        elif entity_type == 'staff':
            queryset = Staff.objects.filter(tenant=tenant, id__in=entity_ids)
        else:
            return []
        logger.info(f"Found {queryset.count()} entities by ID")
        return list(queryset)
    
    # Class/section based filtering
    if entity_type == 'student':
        queryset = Student.objects.filter(tenant=tenant, is_active=True)
        logger.info(f"Initial student count: {queryset.count()}")
        
        # Support UUID-based grade_level filter (from frontend)
        if filters.get('grade_level'):
            queryset = queryset.filter(
                enrollments__section__grade_level__id=filters['grade_level'],
                enrollments__status='ACTIVE'
            )
            logger.info(f"After grade_level filter: {queryset.count()}")
        
        # Support UUID-based section filter
        if filters.get('section'):
            queryset = queryset.filter(
                enrollments__section__id=filters['section'],
                enrollments__status='ACTIVE'
            )
            logger.info(f"After section filter: {queryset.count()}")
        
        # Legacy: name-based class filter
        if filters.get('class'):
            queryset = queryset.filter(
                enrollments__section__grade_level__name=filters['class'],
                enrollments__status='ACTIVE'
            )
            logger.info(f"After class filter: {queryset.count()}")
        
        if filters.get('academic_year'):
            queryset = queryset.filter(
                enrollments__academic_year__name=filters['academic_year'],
                enrollments__status='ACTIVE'
            )
        
        if filters.get('status'):
            queryset = queryset.filter(
                enrollments__status=filters['status'].upper()
            )
        
        # If no filters, get students with any active enrollment
        if not any(filters.get(k) for k in ['grade_level', 'section', 'class', 'academic_year', 'status']):
            queryset = queryset.filter(enrollments__status='ACTIVE')
            logger.info(f"Default filter (active enrollment): {queryset.count()}")
        
        # Get distinct students
        queryset = queryset.distinct()
        logger.info(f"Final student count (distinct): {queryset.count()}")
        
    elif entity_type == 'staff':
        queryset = Staff.objects.filter(tenant=tenant, is_active=True)
        
        # Apply filters
        if filters.get('department'):
            queryset = queryset.filter(department=filters['department'])
        
        if filters.get('designation'):
            queryset = queryset.filter(designation=filters['designation'])
        
        if filters.get('status'):
            queryset = queryset.filter(status=filters['status'])
    else:
        return []
    
    return list(queryset)


def create_zip_file(job, file_urls):
    """
    Create ZIP file from individual card files
    """
    from django.core.files.base import ContentFile
    import requests
    from django.core.files.storage import default_storage
    from django.conf import settings

    zip_buffer = BytesIO()

    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for index, file_url in enumerate(file_urls):
            try:
                file_bytes = None

                # If it's an absolute HTTP URL, fetch it
                if isinstance(file_url, str) and file_url.startswith(('http://', 'https://')):
                    response = requests.get(file_url)
                    if response.status_code == 200:
                        file_bytes = response.content
                else:
                    # Assume it's a storage/media URL (e.g. /media/... or MEDIA_URL prefixed)
                    try:
                        media_url = settings.MEDIA_URL or '/media/'
                        # Normalize and strip MEDIA_URL if present
                        if isinstance(file_url, str) and file_url.startswith(media_url):
                            saved_path = file_url[len(media_url):]
                        else:
                            # Strip leading slash
                            saved_path = file_url.lstrip('/') if isinstance(file_url, str) else None

                        if saved_path and default_storage.exists(saved_path):
                            with default_storage.open(saved_path, 'rb') as f:
                                file_bytes = f.read()
                    except Exception:
                        # Fallback: try to open file_url directly as path
                        try:
                            if default_storage.exists(file_url):
                                with default_storage.open(file_url, 'rb') as f:
                                    file_bytes = f.read()
                        except Exception:
                            file_bytes = None

                if file_bytes:
                    ext = 'pdf'
                    try:
                        if isinstance(file_url, dict):
                            ext = file_url.get('file_format', 'pdf')
                        elif isinstance(file_url, str):
                            if file_url.lower().endswith(('.png', '.jpg', '.jpeg')):
                                ext = file_url.split('.')[-1]
                    except Exception:
                        ext = 'pdf'
                    file_name = f"id_card_{index + 1}.{ext}"
                    zip_file.writestr(file_name, file_bytes)
                else:
                    print(f"Failed to add file to ZIP (not found or fetch failed): {file_url}")
            except Exception as e:
                print(f"Failed to add file to ZIP: {str(e)}")
    
    zip_buffer.seek(0)
    
    # Upload ZIP to storage
    zip_file_name = f"bulk_idcards_{job.id}.zip"
    zip_url = upload_to_storage(
        zip_buffer.getvalue(),
        zip_file_name,
        job.tenant
    )
    # If storage returned a MEDIA_URL-relative path, make it absolute in dev
    try:
        from django.conf import settings
        if isinstance(zip_url, str) and zip_url.startswith(getattr(settings, 'MEDIA_URL', '/media/')) and getattr(settings, 'DEBUG', False):
            # Local dev server is accessible at localhost:8000
            zip_url = f"http://localhost:8000{zip_url}"
    except Exception:
        pass

    return zip_url


def create_grid_pdf(job, generated_files):
    """Create grid layout output (default 9 cards per A4 page)."""
    from .utils import create_grid_layout, to_file_uri_if_media
    from base64 import b64encode

    cards = []
    for card in generated_files:
        image_url = None
        if card.get('preview_image'):
            image_url = f"data:image/png;base64,{b64encode(card['preview_image']).decode()}"
        else:
            image_url = to_file_uri_if_media(card.get('file_url'))
        cards.append({'image_url': image_url})

    html = create_grid_layout(cards, cards_per_page=9, columns=3, layout_name='grid')
    output_bytes = html_to_pdf(html, output_format=job.output_format, width_mm=210, height_mm=297)

    extension = 'pdf' if job.output_format == 'pdf' else job.output_format
    file_name = f"bulk_grid_{job.id}.{extension}"
    return upload_to_storage(output_bytes, file_name, job.tenant)


def create_print_sheet(job, generated_files):
    """Create print sheet output (2x4 layout for easier cutting)."""
    from .utils import create_grid_layout, to_file_uri_if_media
    from base64 import b64encode

    cards = []
    for card in generated_files:
        image_url = None
        if card.get('preview_image'):
            image_url = f"data:image/png;base64,{b64encode(card['preview_image']).decode()}"
        else:
            image_url = to_file_uri_if_media(card.get('file_url'))
        cards.append({'image_url': image_url})

    # 2 columns, 8 cards per page for print sheet
    html = create_grid_layout(cards, cards_per_page=8, columns=2, layout_name='sheet', card_width_mm=100, card_height_mm=70, gap_mm=8)
    output_bytes = html_to_pdf(html, output_format=job.output_format, width_mm=210, height_mm=297)

    extension = 'pdf' if job.output_format == 'pdf' else job.output_format
    file_name = f"bulk_sheet_{job.id}.{extension}"
    return upload_to_storage(output_bytes, file_name, job.tenant)


@shared_task
def cleanup_expired_qr_codes():
    """
    Periodic task to clean up expired QR codes
    """
    from .models import IDCardQRCode
    
    expired_count = IDCardQRCode.objects.filter(
        is_active=True,
        valid_until__lt=timezone.now()
    ).update(is_active=False)
    
    return f"Deactivated {expired_count} expired QR codes"


@shared_task
def generate_qr_attendance_report(date, tenant_id):
    """
    Generate daily attendance report from QR scans
    """
    from .models import QRAttendance
    from tenants.models import Tenant
    
    try:
        tenant = Tenant.objects.get(id=tenant_id)
        
        # Get all scans for the date
        scans = QRAttendance.objects.filter(
            tenant=tenant,
            scan_timestamp__date=date
        )
        
        # Generate report
        report_data = {
            'date': str(date),
            'total_scans': scans.count(),
            'unique_students': scans.filter(student__isnull=False).values('student').distinct().count(),
            'unique_staff': scans.filter(staff__isnull=False).values('staff').distinct().count(),
            'present': scans.filter(attendance_status='present').count(),
            'late': scans.filter(attendance_status='late').count(),
        }
        
        return report_data
        
    except Exception as e:
        raise
