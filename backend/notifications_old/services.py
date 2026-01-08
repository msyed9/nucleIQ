"""
Communication Services
Handles SMS, Email, WhatsApp, Push Notifications
"""

import requests
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class SMSService:
    """SMS Service using MSG91"""
    
    def __init__(self):
        self.auth_key = getattr(settings, 'MSG91_AUTH_KEY', '')
        self.sender_id = getattr(settings, 'MSG91_SENDER_ID', 'SCHOOL')
        self.route = getattr(settings, 'MSG91_ROUTE', '4')  # Transactional
        self.api_url = 'https://api.msg91.com/api/v5/flow/'
        
    def send_sms(self, phone, message, message_type='TRANSACTIONAL'):
        """
        Send SMS via MSG91
        
        Args:
            phone: Recipient phone number
            message: SMS message text
            message_type: Type of message (TRANSACTIONAL/PROMOTIONAL/OTP)
            
        Returns:
            dict: Response with status and message_id
        """
        if not self.auth_key:
            logger.warning("MSG91 API key not configured")
            return {
                'success': False,
                'error': 'SMS service not configured'
            }
            
        try:
            # Clean phone number
            phone = phone.replace('+', '').replace('-', '').replace(' ', '')
            
            # MSG91 API request
            payload = {
                'sender': self.sender_id,
                'route': self.route,
                'country': '91',  # India country code
                'sms': [{
                    'message': message,
                    'to': [phone]
                }]
            }
            
            headers = {
                'authkey': self.auth_key,
                'content-type': 'application/json'
            }
            
            response = requests.post(
                self.api_url,
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'message_id': result.get('message_id', ''),
                    'credits_used': 1
                }
            else:
                return {
                    'success': False,
                    'error': f"SMS sending failed: {response.text}"
                }
                
        except Exception as e:
            logger.error(f"SMS sending error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def send_otp(self, phone, otp, template_id=None):
        """Send OTP SMS"""
        message = f"Your OTP is: {otp}. Valid for 10 minutes. Do not share with anyone."
        return self.send_sms(phone, message, 'OTP')
        
    def get_balance(self):
        """Get SMS credit balance"""
        try:
            url = 'https://api.msg91.com/api/v5/credits'
            headers = {'authkey': self.auth_key}
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            logger.error(f"Error fetching SMS balance: {str(e)}")
            return None


class EmailService:
    """Email Service"""
    
    def send_email(self, to_email, subject, body, html_body=None, 
                   from_email=None, attachments=None):
        """
        Send email using Django's email backend
        
        Args:
            to_email: Recipient email or list of emails
            subject: Email subject
            body: Plain text body
            html_body: HTML body (optional)
            from_email: Sender email (defaults to settings.DEFAULT_FROM_EMAIL)
            attachments: List of file paths to attach
            
        Returns:
            dict: Response with success status
        """
        try:
            if not from_email:
                from_email = settings.DEFAULT_FROM_EMAIL
                
            # Convert to list if single email
            if isinstance(to_email, str):
                to_email = [to_email]
                
            # Create email message
            email = EmailMultiAlternatives(
                subject=subject,
                body=body,
                from_email=from_email,
                to=to_email
            )
            
            # Add HTML content if provided
            if html_body:
                email.attach_alternative(html_body, "text/html")
                
            # Add attachments if provided
            if attachments:
                for attachment in attachments:
                    if isinstance(attachment, dict):
                        email.attach(
                            attachment.get('filename'),
                            attachment.get('content'),
                            attachment.get('mimetype')
                        )
                    else:
                        email.attach_file(attachment)
                        
            # Send email
            email.send(fail_silently=False)
            
            return {
                'success': True,
                'message_id': email.extra_headers.get('Message-ID', '')
            }
            
        except Exception as e:
            logger.error(f"Email sending error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def send_template_email(self, to_email, subject, template_name, context):
        """Send email using Django template"""
        try:
            html_body = render_to_string(template_name, context)
            plain_body = context.get('plain_text', '')
            
            return self.send_email(
                to_email=to_email,
                subject=subject,
                body=plain_body,
                html_body=html_body
            )
        except Exception as e:
            logger.error(f"Template email error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


class WhatsAppService:
    """WhatsApp Service using Twilio or MSG91"""
    
    def __init__(self):
        self.provider = getattr(settings, 'WHATSAPP_PROVIDER', 'TWILIO')
        
        if self.provider == 'TWILIO':
            self.account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
            self.auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
            self.from_number = getattr(settings, 'TWILIO_WHATSAPP_NUMBER', '')
        else:
            self.auth_key = getattr(settings, 'MSG91_AUTH_KEY', '')
            
    def send_message(self, phone, message, message_type='TEXT', media_url=None):
        """
        Send WhatsApp message
        
        Args:
            phone: Recipient phone number (with country code)
            message: Message text
            message_type: TEXT/IMAGE/DOCUMENT
            media_url: URL for media messages
            
        Returns:
            dict: Response with status and message_id
        """
        if self.provider == 'TWILIO':
            return self._send_via_twilio(phone, message, media_url)
        else:
            return self._send_via_msg91(phone, message)
            
    def _send_via_twilio(self, phone, message, media_url=None):
        """Send WhatsApp via Twilio"""
        try:
            from twilio.rest import Client
            
            if not self.account_sid or not self.auth_token:
                return {
                    'success': False,
                    'error': 'Twilio credentials not configured'
                }
                
            client = Client(self.account_sid, self.auth_token)
            
            # Format phone numbers
            to_number = f"whatsapp:{phone}"
            from_number = f"whatsapp:{self.from_number}"
            
            # Send message
            params = {
                'from_': from_number,
                'to': to_number,
                'body': message
            }
            
            if media_url:
                params['media_url'] = [media_url]
                
            message_obj = client.messages.create(**params)
            
            return {
                'success': True,
                'message_id': message_obj.sid,
                'status': message_obj.status
            }
            
        except Exception as e:
            logger.error(f"Twilio WhatsApp error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
            
    def _send_via_msg91(self, phone, message):
        """Send WhatsApp via MSG91"""
        # Implementation for MSG91 WhatsApp API
        logger.info("MSG91 WhatsApp not implemented yet")
        return {
            'success': False,
            'error': 'MSG91 WhatsApp not implemented'
        }


class PushNotificationService:
    """Push Notification Service using Firebase Cloud Messaging"""
    
    def __init__(self):
        self.fcm_server_key = getattr(settings, 'FCM_SERVER_KEY', '')
        self.api_url = 'https://fcm.googleapis.com/fcm/send'
        
    def send_notification(self, device_tokens, title, body, data=None, 
                         icon=None, image=None, action_url=None):
        """
        Send push notification via FCM
        
        Args:
            device_tokens: List of FCM device tokens
            title: Notification title
            body: Notification body
            data: Custom data payload
            icon: Notification icon URL
            image: Notification image URL
            action_url: URL to open on click
            
        Returns:
            dict: Response with success status
        """
        if not self.fcm_server_key:
            logger.warning("FCM server key not configured")
            return {
                'success': False,
                'error': 'FCM not configured'
            }
            
        try:
            headers = {
                'Authorization': f'key={self.fcm_server_key}',
                'Content-Type': 'application/json'
            }
            
            notification_payload = {
                'title': title,
                'body': body
            }
            
            if icon:
                notification_payload['icon'] = icon
            if image:
                notification_payload['image'] = image
            if action_url:
                notification_payload['click_action'] = action_url
                
            payload = {
                'registration_ids': device_tokens,
                'notification': notification_payload,
                'data': data or {},
                'priority': 'high'
            }
            
            response = requests.post(
                self.api_url,
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'message_id': result.get('multicast_id'),
                    'success_count': result.get('success', 0),
                    'failure_count': result.get('failure', 0)
                }
            else:
                return {
                    'success': False,
                    'error': f"FCM error: {response.text}"
                }
                
        except Exception as e:
            logger.error(f"Push notification error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


class NotificationService:
    """Unified notification service"""
    
    def __init__(self):
        self.sms_service = SMSService()
        self.email_service = EmailService()
        self.whatsapp_service = WhatsAppService()
        self.push_service = PushNotificationService()
        
    def send_multi_channel(self, tenant, recipient, title, message, 
                          channels=['IN_APP'], **kwargs):
        """
        Send notification across multiple channels
        
        Args:
            tenant: Tenant instance
            recipient: User instance
            title: Notification title
            message: Notification message
            channels: List of channels (IN_APP, EMAIL, SMS, WHATSAPP, PUSH)
            **kwargs: Additional parameters for each channel
            
        Returns:
            dict: Results for each channel
        """
        from .models import Notification
        
        results = {}
        
        # In-app notification
        if 'IN_APP' in channels:
            notification = Notification.objects.create(
                tenant=tenant,
                recipient=recipient,
                title=title,
                message=message,
                notification_type=kwargs.get('notification_type', 'INFO'),
                priority=kwargs.get('priority', 'MEDIUM'),
                action_url=kwargs.get('action_url'),
                icon=kwargs.get('icon')
            )
            results['IN_APP'] = {'success': True, 'id': notification.id}
            
        # Email
        if 'EMAIL' in channels and recipient.email:
            result = self.email_service.send_email(
                to_email=recipient.email,
                subject=title,
                body=message,
                html_body=kwargs.get('html_body')
            )
            results['EMAIL'] = result
            
        # SMS
        if 'SMS' in channels and hasattr(recipient, 'phone') and recipient.phone:
            result = self.sms_service.send_sms(
                phone=recipient.phone,
                message=message
            )
            results['SMS'] = result
            
        # WhatsApp
        if 'WHATSAPP' in channels and hasattr(recipient, 'phone') and recipient.phone:
            result = self.whatsapp_service.send_message(
                phone=recipient.phone,
                message=message
            )
            results['WHATSAPP'] = result
            
        # Push notification
        if 'PUSH' in channels:
            # Get user's device tokens
            device_tokens = kwargs.get('device_tokens', [])
            if device_tokens:
                result = self.push_service.send_notification(
                    device_tokens=device_tokens,
                    title=title,
                    body=message,
                    data=kwargs.get('data'),
                    icon=kwargs.get('icon'),
                    action_url=kwargs.get('action_url')
                )
                results['PUSH'] = result
                
        return results
