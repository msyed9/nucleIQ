"""
Student Notification Service

Provides event-based notifications to parents/guardians via SMS and Email.
Triggers:
- Fee payment reminders
- Absent alerts
- Exam results published
- Admission confirmation
- Transfer notifications
- Promotion notifications
"""

from typing import List, Dict, Optional
from django.utils import timezone
from django.template.loader import render_to_string
from django.conf import settings

from communication.models import CommunicationProvider, MessageTemplate
from communication.services import SMSService, EmailService

from .models import Student, ParentUser


class StudentNotificationService:
    """
    Service for sending automated notifications to parents about students.
    """
    
    def __init__(self, tenant):
        """
        Initialize notification service with tenant context.
        
        Args:
            tenant: Tenant object
        """
        self.tenant = tenant
        
        # Get default providers
        try:
            self.sms_provider = CommunicationProvider.objects.get(
                tenant=tenant,
                provider_type='SMS',
                is_active=True,
                is_default=True
            )
            self.sms_service = SMSService(self.sms_provider)
        except CommunicationProvider.DoesNotExist:
            self.sms_service = None
        
        try:
            self.email_provider = CommunicationProvider.objects.get(
                tenant=tenant,
                provider_type='EMAIL',
                is_active=True,
                is_default=True
            )
            self.email_service = EmailService(self.email_provider)
        except CommunicationProvider.DoesNotExist:
            self.email_service = None
    
    def get_parent_contacts(self, student: Student) -> List[Dict]:
        """
        Get all parent contacts for a student.
        
        Returns:
            List of dicts with parent contact info
        """
        contacts = []
        
        # Get from ParentUser model
        parent_users = ParentUser.objects.filter(
            students=student,
            portal_access_enabled=True
        ).select_related('user')
        
        for parent_user in parent_users:
            if parent_user.email_notifications or parent_user.sms_notifications:
                contacts.append({
                    'name': parent_user.user.get_full_name(),
                    'email': parent_user.user.email if parent_user.email_notifications else None,
                    'phone': parent_user.user.phone_number if parent_user.sms_notifications else None,
                    'relation': parent_user.get_relation_type_display(),
                    'parent_id': parent_user.id
                })
        
        # Also get from student model (legacy)
        if student.father_phone or student.father_email:
            contacts.append({
                'name': student.father_name,
                'email': student.father_email,
                'phone': student.father_phone,
                'relation': 'Father',
                'parent_id': None
            })
        
        if student.mother_phone or student.mother_email:
            contacts.append({
                'name': student.mother_name,
                'email': student.mother_email,
                'phone': student.mother_phone,
                'relation': 'Mother',
                'parent_id': None
            })
        
        if student.guardian_phone or student.guardian_email:
            contacts.append({
                'name': student.guardian_name,
                'email': student.guardian_email,
                'phone': student.guardian_phone,
                'relation': 'Guardian',
                'parent_id': None
            })
        
        return contacts
    
    def send_admission_confirmation(self, student: Student) -> Dict:
        """
        Send admission confirmation to parents.
        
        Args:
            student: Student object
        
        Returns:
            dict with sent count
        """
        template_name = 'admission_confirmation'
        
        variables = {
            'student_name': student.get_full_name(),
            'admission_number': student.admission_number,
            'class': student.current_enrollment.grade.name if hasattr(student, 'current_enrollment') else 'N/A',
            'section': student.current_enrollment.section.name if hasattr(student, 'current_enrollment') else 'N/A',
            'date': timezone.now().strftime('%d-%m-%Y'),
            'school_name': self.tenant.name,
        }
        
        sms_message = (
            f"Dear Parent, Your child {variables['student_name']} has been successfully admitted to "
            f"{variables['school_name']}. Admission No: {variables['admission_number']}. "
            f"Class: {variables['class']}-{variables['section']}."
        )
        
        email_subject = f"Admission Confirmation - {variables['student_name']}"
        email_content = f"""
Dear Parent,

We are pleased to confirm the admission of your child to {variables['school_name']}.

Student Details:
- Name: {variables['student_name']}
- Admission Number: {variables['admission_number']}
- Class: {variables['class']}-{variables['section']}
- Date of Admission: {variables['date']}

Please keep this admission number for future reference.

If you have any questions, please feel free to contact the school office.

Best regards,
{variables['school_name']}
"""
        
        return self._send_to_parents(
            student,
            sms_message,
            email_subject,
            email_content,
            'admission_confirmation'
        )
    
    def send_absent_alert(self, student: Student, date: str, reason: Optional[str] = None) -> Dict:
        """
        Send absent alert to parents.
        
        Args:
            student: Student object
            date: Date of absence
            reason: Optional reason for absence
        
        Returns:
            dict with sent count
        """
        variables = {
            'student_name': student.get_full_name(),
            'admission_number': student.admission_number,
            'date': date,
            'reason': reason or 'Not specified',
            'school_name': self.tenant.name,
        }
        
        sms_message = (
            f"Dear Parent, Your child {variables['student_name']} (Adm: {variables['admission_number']}) "
            f"was absent on {variables['date']}. If this is unexpected, please contact the school."
        )
        
        email_subject = f"Absence Alert - {variables['student_name']} - {variables['date']}"
        email_content = f"""
Dear Parent,

This is to inform you that your child {variables['student_name']} (Admission No: {variables['admission_number']}) 
was marked absent on {variables['date']}.

Reason: {variables['reason']}

If this absence was not planned or if you have any concerns, please contact the school office immediately.

Best regards,
{variables['school_name']}
"""
        
        return self._send_to_parents(
            student,
            sms_message,
            email_subject,
            email_content,
            'absent_alert'
        )
    
    def send_fee_reminder(
        self, 
        student: Student, 
        amount: float, 
        due_date: str,
        invoice_number: Optional[str] = None
    ) -> Dict:
        """
        Send fee payment reminder to parents.
        
        Args:
            student: Student object
            amount: Amount due
            due_date: Due date
            invoice_number: Optional invoice number
        
        Returns:
            dict with sent count
        """
        variables = {
            'student_name': student.get_full_name(),
            'admission_number': student.admission_number,
            'amount': f"₹{amount:,.2f}",
            'due_date': due_date,
            'invoice_number': invoice_number or 'N/A',
            'school_name': self.tenant.name,
        }
        
        sms_message = (
            f"Dear Parent, Fee payment of {variables['amount']} is pending for {variables['student_name']} "
            f"(Adm: {variables['admission_number']}). Due date: {variables['due_date']}. "
            f"Please pay at the earliest."
        )
        
        email_subject = f"Fee Payment Reminder - {variables['student_name']}"
        email_content = f"""
Dear Parent,

This is a friendly reminder that a fee payment is pending for your child.

Student Details:
- Name: {variables['student_name']}
- Admission Number: {variables['admission_number']}
- Amount Due: {variables['amount']}
- Due Date: {variables['due_date']}
- Invoice Number: {variables['invoice_number']}

Please make the payment at your earliest convenience to avoid late fees.

You can pay online through the parent portal or visit the school office.

Best regards,
{variables['school_name']}
"""
        
        return self._send_to_parents(
            student,
            sms_message,
            email_subject,
            email_content,
            'fee_reminder'
        )
    
    def send_exam_result_published(
        self, 
        student: Student, 
        exam_name: str,
        percentage: float,
        grade: str
    ) -> Dict:
        """
        Send exam result published notification.
        
        Args:
            student: Student object
            exam_name: Name of exam
            percentage: Percentage scored
            grade: Grade obtained
        
        Returns:
            dict with sent count
        """
        variables = {
            'student_name': student.get_full_name(),
            'admission_number': student.admission_number,
            'exam_name': exam_name,
            'percentage': f"{percentage:.1f}%",
            'grade': grade,
            'school_name': self.tenant.name,
        }
        
        sms_message = (
            f"Dear Parent, {variables['exam_name']} results for {variables['student_name']} "
            f"are now available. Percentage: {variables['percentage']}, Grade: {variables['grade']}. "
            f"Check parent portal for details."
        )
        
        email_subject = f"Exam Results Published - {variables['exam_name']} - {variables['student_name']}"
        email_content = f"""
Dear Parent,

The results for {variables['exam_name']} have been published.

Student Details:
- Name: {variables['student_name']}
- Admission Number: {variables['admission_number']}

Results:
- Percentage: {variables['percentage']}
- Grade: {variables['grade']}

You can view detailed subject-wise marks and analysis through the parent portal.

Best regards,
{variables['school_name']}
"""
        
        return self._send_to_parents(
            student,
            sms_message,
            email_subject,
            email_content,
            'exam_result'
        )
    
    def send_promotion_notification(
        self,
        student: Student,
        from_class: str,
        to_class: str,
        academic_year: str
    ) -> Dict:
        """
        Send student promotion notification.
        
        Args:
            student: Student object
            from_class: Current class
            to_class: Promoted to class
            academic_year: Academic year
        
        Returns:
            dict with sent count
        """
        variables = {
            'student_name': student.get_full_name(),
            'admission_number': student.admission_number,
            'from_class': from_class,
            'to_class': to_class,
            'academic_year': academic_year,
            'school_name': self.tenant.name,
        }
        
        sms_message = (
            f"Dear Parent, Congratulations! {variables['student_name']} "
            f"has been promoted from {variables['from_class']} to {variables['to_class']} "
            f"for academic year {variables['academic_year']}."
        )
        
        email_subject = f"Student Promotion - {variables['student_name']}"
        email_content = f"""
Dear Parent,

We are pleased to inform you that your child has been promoted to the next class.

Student Details:
- Name: {variables['student_name']}
- Admission Number: {variables['admission_number']}
- Current Class: {variables['from_class']}
- Promoted To: {variables['to_class']}
- Academic Year: {variables['academic_year']}

Congratulations on this achievement!

Best regards,
{variables['school_name']}
"""
        
        return self._send_to_parents(
            student,
            sms_message,
            email_subject,
            email_content,
            'promotion_notification'
        )
    
    def send_transfer_notification(
        self,
        student: Student,
        transfer_type: str,
        details: str
    ) -> Dict:
        """
        Send student transfer notification.
        
        Args:
            student: Student object
            transfer_type: Type of transfer (section/school)
            details: Transfer details
        
        Returns:
            dict with sent count
        """
        variables = {
            'student_name': student.get_full_name(),
            'admission_number': student.admission_number,
            'transfer_type': transfer_type,
            'details': details,
            'school_name': self.tenant.name,
        }
        
        sms_message = (
            f"Dear Parent, {variables['student_name']} (Adm: {variables['admission_number']}) "
            f"has been transferred. {variables['details']}. Please contact school for more information."
        )
        
        email_subject = f"Transfer Notification - {variables['student_name']}"
        email_content = f"""
Dear Parent,

This is to inform you about a transfer for your child.

Student Details:
- Name: {variables['student_name']}
- Admission Number: {variables['admission_number']}
- Transfer Type: {variables['transfer_type']}

Details:
{variables['details']}

If you have any questions, please contact the school office.

Best regards,
{variables['school_name']}
"""
        
        return self._send_to_parents(
            student,
            sms_message,
            email_subject,
            email_content,
            'transfer_notification'
        )
    
    def _send_to_parents(
        self,
        student: Student,
        sms_message: str,
        email_subject: str,
        email_content: str,
        notification_type: str
    ) -> Dict:
        """
        Internal method to send notifications to all parents.
        
        Args:
            student: Student object
            sms_message: SMS message text
            email_subject: Email subject
            email_content: Email content
            notification_type: Type of notification
        
        Returns:
            dict with counts of sent messages
        """
        contacts = self.get_parent_contacts(student)
        
        result = {
            'sms_sent': 0,
            'sms_failed': 0,
            'email_sent': 0,
            'email_failed': 0,
            'total_parents': len(contacts)
        }
        
        for contact in contacts:
            # Send SMS
            if contact['phone'] and self.sms_service:
                try:
                    log = self.sms_service.send_sms(
                        to_phone=contact['phone'],
                        message=sms_message,
                        recipient_type='PARENT',
                        recipient_id=str(contact.get('parent_id') or student.id),
                        recipient_name=contact['name']
                    )
                    if log.status == 'SENT':
                        result['sms_sent'] += 1
                    else:
                        result['sms_failed'] += 1
                except Exception as e:
                    print(f"SMS send failed: {e}")
                    result['sms_failed'] += 1
            
            # Send Email
            if contact['email'] and self.email_service:
                try:
                    log = self.email_service.send_email(
                        to_email=contact['email'],
                        subject=email_subject,
                        content=email_content,
                        recipient_type='PARENT',
                        recipient_id=str(contact.get('parent_id') or student.id),
                        recipient_name=contact['name']
                    )
                    if log.status == 'SENT':
                        result['email_sent'] += 1
                    else:
                        result['email_failed'] += 1
                except Exception as e:
                    print(f"Email send failed: {e}")
                    result['email_failed'] += 1
        
        return result
    
    def send_bulk_notification(
        self,
        students: List[Student],
        sms_message_template: str,
        email_subject_template: str,
        email_content_template: str,
        notification_type: str
    ) -> Dict:
        """
        Send bulk notifications to multiple students' parents.
        
        Args:
            students: List of Student objects
            sms_message_template: SMS message template with {{variables}}
            email_subject_template: Email subject template
            email_content_template: Email content template
            notification_type: Type of notification
        
        Returns:
            dict with aggregated counts
        """
        total_result = {
            'students_processed': 0,
            'sms_sent': 0,
            'sms_failed': 0,
            'email_sent': 0,
            'email_failed': 0,
            'total_parents': 0
        }
        
        for student in students:
            # Prepare variables for this student
            variables = {
                'student_name': student.get_full_name(),
                'admission_number': student.admission_number,
                'class': student.current_enrollment.grade.name if hasattr(student, 'current_enrollment') else 'N/A',
                'section': student.current_enrollment.section.name if hasattr(student, 'current_enrollment') else 'N/A',
                'school_name': self.tenant.name,
            }
            
            # Render templates
            sms_message = sms_message_template
            email_subject = email_subject_template
            email_content = email_content_template
            
            for key, value in variables.items():
                sms_message = sms_message.replace(f"{{{{{key}}}}}", str(value))
                email_subject = email_subject.replace(f"{{{{{key}}}}}", str(value))
                email_content = email_content.replace(f"{{{{{key}}}}}", str(value))
            
            # Send to this student's parents
            result = self._send_to_parents(
                student,
                sms_message,
                email_subject,
                email_content,
                notification_type
            )
            
            # Aggregate results
            total_result['students_processed'] += 1
            total_result['sms_sent'] += result['sms_sent']
            total_result['sms_failed'] += result['sms_failed']
            total_result['email_sent'] += result['email_sent']
            total_result['email_failed'] += result['email_failed']
            total_result['total_parents'] += result['total_parents']
        
        return total_result
