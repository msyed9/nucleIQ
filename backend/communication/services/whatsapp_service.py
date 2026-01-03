"""
WhatsApp Service - Wrapper for WhatsApp Business API
"""

import logging
from typing import Dict, Any, List, Optional
from django.conf import settings
from twilio.rest import Client as TwilioClient
from twilio.base.exceptions import TwilioRestException
import requests

logger = logging.getLogger(__name__)


class WhatsAppService:
    """
    Unified WhatsApp service supporting Twilio WhatsApp API and official WhatsApp Business API.
    """
    
    # Message templates
    TEMPLATES = {
        'FEE_INVOICE_GENERATED': {
            'name': 'fee_invoice',
            'message': """Hello {parent_name},

A new fee invoice has been generated for {student_name}.

 Invoice Details:
Amount: {amount}
Due Date: {due_date}
Invoice Number: {invoice_number}

Please pay before the due date to avoid late fees.

Pay Now: {payment_link}

Thank you!
{school_name}"""
        },
        'FEE_REMINDER': {
            'name': 'fee_reminder',
            'message': """Dear {parent_name},

This is a friendly reminder that fee payment for {student_name} is due in {days_left} days.

 Amount Due: {amount}
 Due Date: {due_date}

Please clear the payment at your earliest convenience.

Pay Now: {payment_link}

{school_name}"""
        },
        'FEE_OVERDUE': {
            'name': 'fee_overdue',
            'message': """Dear {parent_name},

 URGENT: Fee payment for {student_name} is overdue by {overdue_days} days.

 Amount Due: {amount}
 Overdue Since: {due_date}
 Late Fee: {late_fee}

Please clear the payment immediately to avoid access restrictions.

Pay Now: {payment_link}

For assistance, contact: {contact_number}

{school_name}"""
        },
        'FEE_PAYMENT_RECEIVED': {
            'name': 'payment_confirmation',
            'message': """Dear {parent_name},

 Payment Received Successfully!

Thank you for your payment for {student_name}.

Receipt Details:
 Amount Paid: {amount}
 Payment Date: {payment_date}
 Receipt Number: {receipt_number}

Your receipt is attached.

{school_name}"""
        }
    }
    
    @staticmethod
    def send_whatsapp(
        phone_number: str,
        template_name: str,
        params: Dict[str, Any],
        provider: str = None
    ) -> Dict[str, Any]:
        """
        Send WhatsApp message using configured provider.
        
        Args:
            phone_number: Recipient phone number (E.164 format)
            template_name: Template name (e.g., 'FEE_REMINDER')
            params: Parameters to fill in template
            provider: Provider name or None for default
            
        Returns:
            Dict with status and message_id
        """
        if not provider:
            provider = getattr(settings, 'DEFAULT_WHATSAPP_PROVIDER', 'TWILIO')
        
        # Get template
        if template_name not in WhatsAppService.TEMPLATES:
            raise ValueError(f"Template not found: {template_name}")
        
        template = WhatsAppService.TEMPLATES[template_name]
        message = template['message'].format(**params)
        
        try:
            if provider == 'TWILIO':
                return WhatsAppService._send_via_twilio(phone_number, message)
            elif provider == 'WHATSAPP_BUSINESS':
                return WhatsAppService._send_via_official_api(phone_number, template_name, params)
            else:
                raise ValueError(f"Unsupported WhatsApp provider: {provider}")
                
        except Exception as e:
            logger.error(f"Failed to send WhatsApp via {provider}: {str(e)}")
            return {
                'status': 'failed',
                'error': str(e),
                'message_id': None
            }
    
    @staticmethod
    def _send_via_twilio(phone_number: str, message: str) -> Dict[str, Any]:
        """Send WhatsApp message via Twilio."""
        account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
        auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None)
        from_number = getattr(settings, 'TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886')
        
        if not all([account_sid, auth_token]):
            raise ValueError("Twilio credentials not configured")
        
        client = TwilioClient(account_sid, auth_token)
        
        # Ensure phone number has whatsapp: prefix
        to_number = phone_number if phone_number.startswith('whatsapp:') else f'whatsapp:{phone_number}'
        
        try:
            message_obj = client.messages.create(
                body=message,
                from_=from_number,
                to=to_number
            )
            
            return {
                'status': 'sent',
                'message_id': message_obj.sid,
                'provider': 'TWILIO'
            }
            
        except TwilioRestException as e:
            logger.error(f"Twilio WhatsApp error: {e.msg}")
            raise
    
    @staticmethod
    def _send_via_official_api(
        phone_number: str,
        template_name: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send WhatsApp message via official WhatsApp Business API."""
        api_url = getattr(settings, 'WHATSAPP_API_URL', None)
        api_key = getattr(settings, 'WHATSAPP_API_KEY', None)
        phone_number_id = getattr(settings, 'WHATSAPP_PHONE_NUMBER_ID', None)
        
        if not all([api_url, api_key, phone_number_id]):
            raise ValueError("WhatsApp Business API credentials not configured")
        
        # Remove whatsapp: prefix and + if present
        to_number = phone_number.replace('whatsapp:', '').replace('+', '')
        
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        # Build template components (for official API)
        components = []
        for key, value in params.items():
            components.append({
                'type': 'text',
                'text': str(value)
            })
        
        payload = {
            'messaging_product': 'whatsapp',
            'to': to_number,
            'type': 'template',
            'template': {
                'name': template_name.lower(),
                'language': {
                    'code': 'en'
                },
                'components': [
                    {
                        'type': 'body',
                        'parameters': components
                    }
                ]
            }
        }
        
        try:
            url = f"{api_url}/{phone_number_id}/messages"
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            
            return {
                'status': 'sent',
                'message_id': result.get('messages', [{}])[0].get('id'),
                'provider': 'WHATSAPP_BUSINESS'
            }
            
        except requests.RequestException as e:
            logger.error(f"WhatsApp Business API error: {str(e)}")
            raise
    
    @staticmethod
    def send_fee_invoice_notification(
        phone_number: str,
        parent_name: str,
        student_name: str,
        amount: float,
        due_date: str,
        invoice_number: str,
        payment_link: str,
        school_name: str
    ) -> Dict[str, Any]:
        """Send fee invoice generated notification."""
        return WhatsAppService.send_whatsapp(
            phone_number=phone_number,
            template_name='FEE_INVOICE_GENERATED',
            params={
                'parent_name': parent_name,
                'student_name': student_name,
                'amount': f"{amount:,.2f}",
                'due_date': due_date,
                'invoice_number': invoice_number,
                'payment_link': payment_link,
                'school_name': school_name
            }
        )
    
    @staticmethod
    def send_fee_reminder(
        phone_number: str,
        parent_name: str,
        student_name: str,
        amount: float,
        due_date: str,
        days_left: int,
        payment_link: str,
        school_name: str
    ) -> Dict[str, Any]:
        """Send fee reminder notification."""
        return WhatsAppService.send_whatsapp(
            phone_number=phone_number,
            template_name='FEE_REMINDER',
            params={
                'parent_name': parent_name,
                'student_name': student_name,
                'amount': f"{amount:,.2f}",
                'due_date': due_date,
                'days_left': days_left,
                'payment_link': payment_link,
                'school_name': school_name
            }
        )
    
    @staticmethod
    def send_overdue_reminder(
        phone_number: str,
        parent_name: str,
        student_name: str,
        amount: float,
        due_date: str,
        overdue_days: int,
        late_fee: float,
        payment_link: str,
        contact_number: str,
        school_name: str
    ) -> Dict[str, Any]:
        """Send overdue fee reminder."""
        return WhatsAppService.send_whatsapp(
            phone_number=phone_number,
            template_name='FEE_OVERDUE',
            params={
                'parent_name': parent_name,
                'student_name': student_name,
                'amount': f"{amount:,.2f}",
                'due_date': due_date,
                'overdue_days': overdue_days,
                'late_fee': f"{late_fee:,.2f}",
                'payment_link': payment_link,
                'contact_number': contact_number,
                'school_name': school_name
            }
        )
    
    @staticmethod
    def send_payment_confirmation(
        phone_number: str,
        parent_name: str,
        student_name: str,
        amount: float,
        payment_date: str,
        receipt_number: str,
        school_name: str
    ) -> Dict[str, Any]:
        """Send payment received confirmation."""
        return WhatsAppService.send_whatsapp(
            phone_number=phone_number,
            template_name='FEE_PAYMENT_RECEIVED',
            params={
                'parent_name': parent_name,
                'student_name': student_name,
                'amount': f"{amount:,.2f}",
                'payment_date': payment_date,
                'receipt_number': receipt_number,
                'school_name': school_name
            }
        )
