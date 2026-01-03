"""
Celery Tasks for ID Card Generation
"""

from celery import shared_task
from django.core.files.base import ContentFile
from io import BytesIO
import os


@shared_task(bind=True)
def generate_cards_async(self, generation_id):
    """
    Asynchronously generate ID cards for a generation request.
    
    Args:
        generation_id: ID of IDCardGeneration instance
    """
    from .models import IDCardGeneration
    from .utils import generate_id_cards_bulk, save_cards_as_pdf, save_cards_as_zip
    from staff.models import Staff
    from students.models import Student
    
    try:
        # Get generation object
        generation = IDCardGeneration.objects.get(id=generation_id)
        generation.status = 'PROCESSING'
        generation.save()
        
        # Get design
        design = generation.design
        card_type = generation.card_type
        filters = generation.filters or {}
        
        # Build queryset based on card type and filters
        if card_type == 'STUDENT':
            queryset = Student.objects.filter(
                tenant=generation.tenant,
                is_deleted=False
            )
            
            # Apply filters
            if filters.get('grade_id'):
                queryset = queryset.filter(
                    enrollments__grade_id=filters['grade_id'],
                    enrollments__is_active=True
                )
            if filters.get('section_id'):
                queryset = queryset.filter(
                    enrollments__section_id=filters['section_id'],
                    enrollments__is_active=True
                )
            if filters.get('student_ids'):
                queryset = queryset.filter(id__in=filters['student_ids'])
                
        elif card_type == 'STAFF':
            queryset = Staff.objects.filter(
                tenant=generation.tenant,
                is_deleted=False,
                status='ACTIVE'
            )
            
            # Apply filters
            if filters.get('department_id'):
                queryset = queryset.filter(department_id=filters['department_id'])
            if filters.get('designation'):
                queryset = queryset.filter(designation=filters['designation'])
            if filters.get('staff_ids'):
                queryset = queryset.filter(id__in=filters['staff_ids'])
        
        else:
            raise ValueError(f"Unsupported card type: {card_type}")
        
        # Update total count
        total_cards = queryset.count()
        generation.total_cards = total_cards
        generation.save()
        
        if total_cards == 0:
            generation.status = 'FAILED'
            generation.error_message = 'No records found matching the filters'
            generation.save()
            return
        
        # Generate cards
        cards = generate_id_cards_bulk(design, queryset, card_type)
        
        if not cards:
            generation.status = 'FAILED'
            generation.error_message = 'Failed to generate any cards'
            generation.save()
            return
        
        # Save as PDF
        pdf_buffer = BytesIO()
        temp_pdf_path = f'/tmp/idcards_{generation_id}.pdf'
        save_cards_as_pdf(cards, temp_pdf_path)
        
        # Read PDF and save to model
        with open(temp_pdf_path, 'rb') as f:
            pdf_content = f.read()
        
        filename = f"IDCards_{card_type}_{generation.tenant.subdomain}_{generation_id}.pdf"
        generation.output_file.save(filename, ContentFile(pdf_content), save=True)
        
        # Clean up temp file
        if os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)
        
        # Mark as completed
        generation.status = 'COMPLETED'
        generation.save()
        
        return f"Successfully generated {len(cards)} ID cards"
        
    except IDCardGeneration.DoesNotExist:
        return f"Generation {generation_id} not found"
    
    except Exception as e:
        # Update generation with error
        try:
            generation = IDCardGeneration.objects.get(id=generation_id)
            generation.status = 'FAILED'
            generation.error_message = str(e)
            generation.save()
        except:
            pass
        
        # Re-raise for Celery to log
        raise


@shared_task
def cleanup_old_generations():
    """
    Cleanup old ID card generation files (older than 30 days).
    Run this as a periodic task.
    """
    from .models import IDCardGeneration
    from datetime import timedelta
    from django.utils import timezone
    
    cutoff_date = timezone.now() - timedelta(days=30)
    
    old_generations = IDCardGeneration.objects.filter(
        created_at__lt=cutoff_date,
        status='COMPLETED'
    )
    
    deleted_count = 0
    for generation in old_generations:
        if generation.output_file:
            # Delete file
            generation.output_file.delete()
            deleted_count += 1
    
    return f"Cleaned up {deleted_count} old generation files"
