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
    def generate_monthly_invoices(tenant, academic_year, month_date):
        """
        Generate monthly invoices for all students.
        """
        from students.models import Student
        
        students = Student.objects.filter(tenant=tenant, is_active=True)
        invoices_created = 0
        
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
        
        return invoices_created
    
    @staticmethod
    def record_payment(invoice, amount, payment_mode, payment_reference, collected_by):
        """
        Record a fee payment and update invoice status.
        """
        transaction_number = f"TXN{timezone.now().strftime('%Y%m%d%H%M%S')}"
        
        transaction = FeeTransaction.objects.create(
            tenant=invoice.tenant,
            invoice=invoice,
            transaction_number=transaction_number,
            amount=amount,
            payment_mode=payment_mode,
            payment_reference=payment_reference,
            collected_by=collected_by,
            receipt_number=f"REC{transaction_number}"
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
                FeeDefaulter.objects.filter(tenant=tenant, student=student).delete()
