"""
Celery tasks for report generation
"""

import time
import logging
from celery import shared_task
from django.utils import timezone
from django.core.files.base import ContentFile

from .models import GeneratedReport, ReportTemplate
from .services import ReportGenerationService

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def generate_report_async(self, generated_report_id: str):
    """
    Generate a report asynchronously.
    """
    try:
        report = GeneratedReport.objects.select_related('template').get(id=generated_report_id)
    except GeneratedReport.DoesNotExist:
        logger.error("GeneratedReport not found: %s", generated_report_id)
        return {'status': 'error', 'message': 'GeneratedReport not found'}

    if not report.template:
        report.status = 'FAILED'
        report.error_message = 'Report template missing'
        report.save(update_fields=['status', 'error_message', 'updated_at'])
        return {'status': 'error', 'message': 'Template missing'}

    template = report.template
    service = ReportGenerationService(template)

    try:
        start_time = time.time()

        filters = report.filters_used or {}
        date_range = None
        if report.date_range_start and report.date_range_end:
            date_range = {
                'start': report.date_range_start,
                'end': report.date_range_end
            }

        service.fetch_data(filters=filters, date_range=date_range)

        output_format = report.format or template.output_format

        if output_format == 'PDF':
            file_buffer = service.generate_pdf()
            filename = f"{template.name.replace(' ', '_')}.pdf"
        elif output_format == 'EXCEL':
            file_buffer = service.generate_excel()
            filename = f"{template.name.replace(' ', '_')}.xlsx"
        elif output_format == 'CSV':
            file_buffer = service.generate_csv()
            filename = f"{template.name.replace(' ', '_')}.csv"
        else:
            file_buffer = service.generate_pdf()
            filename = f"{template.name.replace(' ', '_')}.pdf"

        report.file.save(filename, ContentFile(file_buffer.read()), save=False)
        report.file_size = report.file.size
        report.rows_count = len(service.data)
        report.status = 'COMPLETED'
        report.completed_at = timezone.now()
        report.generation_time = round(time.time() - start_time, 2)
        report.error_message = ''
        report.save()

        return {'status': 'success', 'report_id': str(report.id)}
    except Exception as exc:
        logger.exception("Async report generation failed: %s", exc)
        report.status = 'FAILED'
        report.error_message = str(exc)
        report.save(update_fields=['status', 'error_message', 'updated_at'])
        raise