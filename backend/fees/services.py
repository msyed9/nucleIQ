"""
Fee Collection Services
"""

from decimal import Decimal
from datetime import date, timedelta
from django.db.models import Sum, Q
from django.utils import timezone
from .models import (
    FeeStructure, FeeAllocation, FeeInvoice, FeeInvoiceItem,
    FeeTransaction, FeeDefaulter, SiblingDiscount
)


class FeeCalculationService:
    """Service for fee calculations and invoice generation."""
    
    @staticmethod
    def calculate_sibling_discount(student, base_amount):
        """
        Calculate sibling discount based on number of siblings.
        """
        from students.models import Student
        
        # Get siblings (same parent)
        siblings = Student.objects.filter(
            tenant=student.tenant,
            father_name=student.father_name,
            is_active=True
        ).exclude(id=student.id)
        
        sibling_count = siblings.count() + 1
        
        if sibling_count < 2:
            return Decimal('0.00'), 0
        
        # Get discount configuration
        discount_config = SiblingDiscount.objects.filter(
            tenant=student.tenant,
            sibling_count=sibling_count,
            is_active=True
        ).first()
        
        if not discount_config and sibling_count >= 4:
            discount_config = SiblingDiscount.objects.filter(
                tenant=student.tenant,
                sibling_count=4,
                is_active=True
            ).first()
        
        if discount_config:
            discount_amount = base_amount * (discount_config.discount_percentage / 100)
            return discount_amount, discount_config.discount_percentage
        
        return Decimal('0.00'), 0
    
    @staticmethod
    def generate_invoice_number(tenant):
        """Generate unique invoice number."""
        from django.db.models import Max
        
        today = date.today()
        prefix = f"INV{today.year}{today.month:02d}"
        
        last_invoice = FeeInvoice.objects.filter(
            tenant=tenant,
            invoice_number__startswith=prefix
        ).aggregate(Max('invoice_number'))
        
        if last_invoice['invoice_number__max']:
            last_number = int(last_invoice['invoice_number__max'][-4:])
            new_number = last_number + 1
        else:
            new_number = 1
        
        return f"{prefix}{new_number:04d}"
    
    @staticmethod
    def _filter_students_for_generation(tenant, academic_year, grade_level_ids=None, section_ids=None, student_ids=None):
        """Shared student scoping for invoice generation (used by dry-run preview and actual generation)."""
        from students.models import Student

        students = Student.objects.filter(tenant=tenant, is_active=True)

        if student_ids:
            students = students.filter(id__in=student_ids)

        if section_ids or grade_level_ids:
            students = students.filter(
                enrollments__tenant=tenant,
                enrollments__academic_year=academic_year,
                enrollments__status='ACTIVE'
            )
            if section_ids:
                students = students.filter(enrollments__section_id__in=section_ids)
            if grade_level_ids:
                students = students.filter(enrollments__section__grade_level_id__in=grade_level_ids)
            students = students.distinct()

        return students

    @staticmethod
    def generate_monthly_invoices(
        tenant, academic_year, month_date,
        dry_run=False, grade_level_ids=None, section_ids=None, student_ids=None
    ):
        """
        Generate (or preview) monthly invoices for all eligible students.

        Returns a tuple: (count, preview_rows). `preview_rows` is only populated
        when dry_run=True and contains one entry per student that would be invoiced.
        """
        students = FeeCalculationService._filter_students_for_generation(
            tenant, academic_year, grade_level_ids, section_ids, student_ids
        )
        invoices_created = 0
        preview_rows = []

        for student in students:
            allocations = FeeAllocation.objects.filter(
                tenant=tenant,
                student=student,
                is_active=True,
                fee_structure__academic_year=academic_year,
                fee_structure__frequency='MONTHLY'
            )
            
            if not allocations.exists():
                continue
            
            # Check if invoice already exists
            existing = FeeInvoice.objects.filter(
                tenant=tenant,
                student=student,
                invoice_date__year=month_date.year,
                invoice_date__month=month_date.month
            ).exists()
            
            if existing:
                continue
            
            # Calculate total
            total_amount = Decimal('0.00')
            items_data = []
            
            for allocation in allocations:
                amount = allocation.get_final_amount()
                total_amount += amount
                items_data.append({
                    'allocation': allocation,
                    'description': f"{allocation.fee_structure.category.name}",
                    'amount': amount
                })

            if dry_run:
                enrollment = student.get_current_enrollment() if hasattr(student, 'get_current_enrollment') else None
                preview_rows.append({
                    'student_id': str(student.id),
                    'admission_number': student.admission_number,
                    'name': student.get_full_name(),
                    'class': enrollment.section.grade_level.name if enrollment and enrollment.section and enrollment.section.grade_level else None,
                    'section': enrollment.section.name if enrollment and enrollment.section else None,
                    'amount': float(total_amount),
                    'items': [
                        {'description': item['description'], 'amount': float(item['amount'])}
                        for item in items_data
                    ]
                })
                invoices_created += 1
                continue
            
            # Create invoice
            invoice = FeeInvoice.objects.create(
                tenant=tenant,
                student=student,
                invoice_number=FeeCalculationService.generate_invoice_number(tenant),
                academic_year=academic_year,
                invoice_date=month_date,
                due_date=month_date + timedelta(days=5),
                total_amount=total_amount,
                balance_amount=total_amount
            )
            
            # Create items
            for item_data in items_data:
                FeeInvoiceItem.objects.create(
                    invoice=invoice,
                    fee_allocation=item_data['allocation'],
                    description=item_data['description'],
                    amount=item_data['amount']
                )
            
            invoices_created += 1
        
        return invoices_created, preview_rows

    @staticmethod
    def generate_term_invoices(
        tenant, academic_year, month_date, frequencies=None,
        dry_run=False, grade_level_ids=None, section_ids=None, student_ids=None
    ):
        """Generate (or preview) term/period invoices based on fee structure term_months."""

        if frequencies is None:
            frequencies = ['TERM', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'ONE_TIME']

        students = FeeCalculationService._filter_students_for_generation(
            tenant, academic_year, grade_level_ids, section_ids, student_ids
        )
        invoices_created = 0
        preview_rows = []

        for student in students:
            allocations = FeeAllocation.objects.filter(
                tenant=tenant,
                student=student,
                is_active=True,
                fee_structure__academic_year=academic_year,
                fee_structure__frequency__in=frequencies
            )

            if not allocations.exists():
                continue

            # Skip if invoice already exists for this month/year
            existing = FeeInvoice.objects.filter(
                tenant=tenant,
                student=student,
                invoice_date__year=month_date.year,
                invoice_date__month=month_date.month
            ).exists()
            if existing:
                continue

            total_amount = Decimal('0.00')
            items_data = []

            for allocation in allocations:
                structure = allocation.fee_structure
                term_months = structure.term_months or {}

                # Determine if this structure should be collected in this month
                should_collect = False
                matched_term_index = None

                if term_months:
                    for term_key, months in term_months.items():
                        try:
                            if month_date.month in months:
                                should_collect = True
                                matched_term_index = term_key.replace('term_', '').strip()
                                break
                        except Exception:
                            continue
                else:
                    # Default collection for yearly/one-time at academic year start month
                    if structure.frequency in ['YEARLY', 'ONE_TIME', 'TERM', 'QUARTERLY', 'HALF_YEARLY']:
                        should_collect = month_date.month == academic_year.start_date.month

                if not should_collect:
                    continue

                amount = allocation.get_final_amount()
                installment_amounts = structure.installment_amounts or {}
                if matched_term_index:
                    key = f"installment_{matched_term_index}"
                    if key in installment_amounts:
                        try:
                            amount = Decimal(str(installment_amounts[key]))
                        except Exception:
                            pass

                total_amount += amount
                items_data.append({
                    'allocation': allocation,
                    'description': f"{structure.category.name}",
                    'amount': amount
                })

            if not items_data:
                continue

            if dry_run:
                enrollment = student.get_current_enrollment() if hasattr(student, 'get_current_enrollment') else None
                preview_rows.append({
                    'student_id': str(student.id),
                    'admission_number': student.admission_number,
                    'name': student.get_full_name(),
                    'class': enrollment.section.grade_level.name if enrollment and enrollment.section and enrollment.section.grade_level else None,
                    'section': enrollment.section.name if enrollment and enrollment.section else None,
                    'amount': float(total_amount),
                    'items': [
                        {'description': item['description'], 'amount': float(item['amount'])}
                        for item in items_data
                    ]
                })
                invoices_created += 1
                continue

            invoice = FeeInvoice.objects.create(
                tenant=tenant,
                student=student,
                invoice_number=FeeCalculationService.generate_invoice_number(tenant),
                academic_year=academic_year,
                invoice_date=month_date,
                due_date=month_date + timedelta(days=5),
                total_amount=total_amount,
                balance_amount=total_amount
            )

            for item_data in items_data:
                FeeInvoiceItem.objects.create(
                    invoice=invoice,
                    fee_allocation=item_data['allocation'],
                    description=item_data['description'],
                    amount=item_data['amount']
                )

            invoices_created += 1

        return invoices_created, preview_rows
    
    @staticmethod
    def _generate_transaction_number(tenant):
        """Generate unique transaction number."""
        return f"TXN{timezone.now().strftime('%Y%m%d%H%M%S%f')[:17]}"
    
    @staticmethod
    def record_payment(invoice, amount, payment_mode, payment_reference, collected_by, remarks=''):
        """
        Record a fee payment and update invoice status.
        """
        transaction_number = FeeCalculationService._generate_transaction_number(invoice.tenant)
        
        transaction = FeeTransaction.objects.create(
            tenant=invoice.tenant,
            invoice=invoice,
            transaction_number=transaction_number,
            amount=amount,
            payment_mode=payment_mode,
            payment_reference=payment_reference,
            collected_by=collected_by,
            receipt_number=f"REC{transaction_number}",
            remarks=remarks
        )
        
        # Update invoice
        invoice.paid_amount += amount
        invoice.update_status()
        
        return transaction
    
    @staticmethod
    def update_defaulters(tenant):
        """
        Update fee defaulters list.
        """
        from students.models import Student
        
        students = Student.objects.filter(tenant=tenant, is_active=True)
        
        for student in students:
            pending_invoices = FeeInvoice.objects.filter(
                tenant=tenant,
                student=student,
                status__in=['PENDING', 'PARTIAL']
            )
            
            total_due = pending_invoices.aggregate(
                Sum('balance_amount')
            )['balance_amount__sum'] or 0
            
            if total_due > 0:
                oldest_invoice = pending_invoices.order_by('due_date').first()
                if oldest_invoice:
                    overdue_days = (date.today() - oldest_invoice.due_date).days
                    overdue_days = max(overdue_days, 0)
                else:
                    overdue_days = 0
                
                defaulter, created = FeeDefaulter.objects.update_or_create(
                    tenant=tenant,
                    student=student,
                    defaults={
                        'total_due': total_due,
                        'overdue_days': overdue_days
                    }
                )
                
                # Stop access if overdue > 30 days
                if overdue_days > 30 and not defaulter.access_stopped:
                    defaulter.access_stopped = True
                    defaulter.stop_access_date = date.today()
                    defaulter.save()
            else:
                # Use soft-delete for defaulter records to avoid hard deletes
                FeeDefaulter.objects.filter(tenant=tenant, student=student).update(
                    is_deleted=True,
                    deleted_at=timezone.now()
                )
