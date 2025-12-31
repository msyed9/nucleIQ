"""
Communication Services - SMS, Email, WhatsApp Integration
"""

import re
from typing import Dict, List, Optional
from django.utils import timezone
from django.conf import settings
from .models import CommunicationProvider, MessageLog, MessageTemplate


class BaseMessageService:
    """Base class for message services."""
    
    def __init__(self, provider: CommunicationProvider):
        self.provider = provider
    
    def render_template(self, template: str, variables: Dict) -> str:
        """
        Render template with variables.
        Supports {{variable_name}} syntax.
        """
        rendered = template
        for key, value in variables.items():
            rendered = rendered.replace(f"{{{{{key}}}}}", str(value))
        return rendered
    
    def log_message(self, **kwargs) -> MessageLog:
        """Create a message log entry."""
        return MessageLog.objects.create(
            tenant=self.provider.tenant,
            provider=self.provider,
            **kwargs
        )


class SMSService(BaseMessageService):
    """
    SMS Service supporting Twilio and MSG91
    """
    
    def send_sms(
        self,
        to_phone: str,
        message: str,
        recipient_type: str,
        recipient_id: str,
        recipient_name: str,
        template: Optional[MessageTemplate] = None,
        notice=None
    ) -> MessageLog:
        """Send SMS via configured provider."""
        
        # Create log entry
        log = self.log_message(
            message_type='SMS',
            template=template,
            notice=notice,
            recipient_type=recipient_type,
            recipient_id=recipient_id,
            recipient_name=recipient_name,
            to_phone=to_phone,
            content=message,
            status='PENDING'
        )
        
        try:
            if self.provider.name == 'TWILIO':
                result = self._send_via_twilio(to_phone, message)
            elif self.provider.name == 'MSG91':
                result = self._send_via_msg91(to_phone, message)
            else:
                raise ValueError(f"Unsupported SMS provider: {self.provider.name}")
            
            # Update log
            log.status = 'SENT'
            log.sent_at = timezone.now()
            log.provider_message_id = result.get('message_id', '')
            log.provider_response = result
            log.save()
            
            # Update provider stats
            self.provider.total_sent += 1
            self.provider.save()
            
        except Exception as e:
            log.status = 'FAILED'
            log.error_message = str(e)
            log.save()
            
            self.provider.total_failed += 1
            self.provider.save()
        
        return log
    
    def _send_via_twilio(self, to_phone: str, message: str) -> Dict:
        """Send SMS via Twilio."""
        try:
            from twilio.rest import Client
            
            config = self.provider.config
            client = Client(
                config.get('account_sid'),
                config.get('auth_token')
            )
            
            message_obj = client.messages.create(
                body=message,
                from_=config.get('from_number'),
                to=to_phone
            )
            
            return {
                'message_id': message_obj.sid,
                'status': message_obj.status,
                'provider': 'twilio'
            }
        
        except Exception as e:
            raise Exception(f"Twilio error: {str(e)}")
    
    def _send_via_msg91(self, to_phone: str, message: str) -> Dict:
        """Send SMS via MSG91."""
        try:
            import requests
            
            config = self.provider.config
            url = "https://api.msg91.com/api/v5/flow/"
            
            payload = {
                "sender": config.get('sender_id'),
                "mobiles": to_phone,
                "message": message,
                "authkey": config.get('auth_key'),
                "route": config.get('route', '4')
            }
            
            response = requests.post(url, json=payload)
            response.raise_for_status()
            
            result = response.json()
            return {
                'message_id': result.get('request_id', ''),
                'status': result.get('type', ''),
                'provider': 'msg91',
                'response': result
            }
        
        except Exception as e:
            raise Exception(f"MSG91 error: {str(e)}")


class EmailService(BaseMessageService):
    """
    Email Service supporting AWS SES and SendGrid
    """
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        content: str,
        recipient_type: str,
        recipient_id: str,
        recipient_name: str,
        template: Optional[MessageTemplate] = None,
        notice=None,
        html_content: Optional[str] = None
    ) -> MessageLog:
        """Send email via configured provider."""
        
        # Create log entry
        log = self.log_message(
            message_type='EMAIL',
            template=template,
            notice=notice,
            recipient_type=recipient_type,
            recipient_id=recipient_id,
            recipient_name=recipient_name,
            to_email=to_email,
            subject=subject,
            content=content,
            status='PENDING'
        )
        
        try:
            if self.provider.name == 'AWS_SES':
                result = self._send_via_ses(to_email, subject, content, html_content)
            elif self.provider.name == 'SENDGRID':
                result = self._send_via_sendgrid(to_email, subject, content, html_content)
            else:
                raise ValueError(f"Unsupported email provider: {self.provider.name}")
            
            # Update log
            log.status = 'SENT'
            log.sent_at = timezone.now()
            log.provider_message_id = result.get('message_id', '')
            log.provider_response = result
            log.save()
            
            # Update provider stats
            self.provider.total_sent += 1
            self.provider.save()
            
        except Exception as e:
            log.status = 'FAILED'
            log.error_message = str(e)
            log.save()
            
            self.provider.total_failed += 1
            self.provider.save()
        
        return log
    
    def _send_via_ses(
        self,
        to_email: str,
        subject: str,
        content: str,
        html_content: Optional[str] = None
    ) -> Dict:
        """Send email via AWS SES."""
        try:
            import boto3
            
            config = self.provider.config
            client = boto3.client(
                'ses',
                region_name=config.get('region', 'us-east-1'),
                aws_access_key_id=config.get('access_key_id'),
                aws_secret_access_key=config.get('secret_access_key')
            )
            
            message = {
                'Subject': {'Data': subject},
                'Body': {
                    'Text': {'Data': content}
                }
            }
            
            if html_content:
                message['Body']['Html'] = {'Data': html_content}
            
            response = client.send_email(
                Source=config.get('from_email'),
                Destination={'ToAddresses': [to_email]},
                Message=message
            )
            
            return {
                'message_id': response['MessageId'],
                'provider': 'aws_ses'
            }
        
        except Exception as e:
            raise Exception(f"AWS SES error: {str(e)}")
    
    def _send_via_sendgrid(
        self,
        to_email: str,
        subject: str,
        content: str,
        html_content: Optional[str] = None
    ) -> Dict:
        """Send email via SendGrid."""
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail
            
            config = self.provider.config
            
            message = Mail(
                from_email=config.get('from_email'),
                to_emails=to_email,
                subject=subject,
                plain_text_content=content,
                html_content=html_content or content
            )
            
            sg = SendGridAPIClient(config.get('api_key'))
            response = sg.send(message)
            
            return {
                'message_id': response.headers.get('X-Message-Id', ''),
                'status_code': response.status_code,
                'provider': 'sendgrid'
            }
        
        except Exception as e:
            raise Exception(f"SendGrid error: {str(e)}")


class WhatsAppService(BaseMessageService):
    """
    WhatsApp Service using WhatsApp Business API
    """
    
    def send_whatsapp(
        self,
        to_phone: str,
        message: str,
        recipient_type: str,
        recipient_id: str,
        recipient_name: str,
        template: Optional[MessageTemplate] = None,
        notice=None,
        template_params: Optional[List] = None
    ) -> MessageLog:
        """Send WhatsApp message."""
        
        # Create log entry
        log = self.log_message(
            message_type='WHATSAPP',
            template=template,
            notice=notice,
            recipient_type=recipient_type,
            recipient_id=recipient_id,
            recipient_name=recipient_name,
            to_phone=to_phone,
            content=message,
            status='PENDING'
        )
        
        try:
            result = self._send_via_whatsapp_business(
                to_phone,
                message,
                template,
                template_params
            )
            
            # Update log
            log.status = 'SENT'
            log.sent_at = timezone.now()
            log.provider_message_id = result.get('message_id', '')
            log.provider_response = result
            log.save()
            
            # Update provider stats
            self.provider.total_sent += 1
            self.provider.save()
            
        except Exception as e:
            log.status = 'FAILED'
            log.error_message = str(e)
            log.save()
            
            self.provider.total_failed += 1
            self.provider.save()
        
        return log
    
    def _send_via_whatsapp_business(
        self,
        to_phone: str,
        message: str,
        template: Optional[MessageTemplate] = None,
        template_params: Optional[List] = None
    ) -> Dict:
        """Send via WhatsApp Business API."""
        try:
            import requests
            
            config = self.provider.config
            url = f"{config.get('api_url')}/messages"
            
            headers = {
                'Authorization': f"Bearer {config.get('access_token')}",
                'Content-Type': 'application/json'
            }
            
            # If using approved template
            if template and template.whatsapp_template_id:
                payload = {
                    "messaging_product": "whatsapp",
                    "to": to_phone,
                    "type": "template",
                    "template": {
                        "name": template.whatsapp_template_id,
                        "language": {"code": config.get('language_code', 'en')},
                        "components": [
                            {
                                "type": "body",
                                "parameters": template_params or []
                            }
                        ]
                    }
                }
            else:
                # Plain text message (may require approval)
                payload = {
                    "messaging_product": "whatsapp",
                    "to": to_phone,
                    "type": "text",
                    "text": {"body": message}
                }
            
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            return {
                'message_id': result.get('messages', [{}])[0].get('id', ''),
                'provider': 'whatsapp_business',
                'response': result
            }
        
        except Exception as e:
            raise Exception(f"WhatsApp Business API error: {str(e)}")


class CommunicationService:
    """
    Main communication service that handles all channels
    """
    
    @staticmethod
    def get_provider(tenant, provider_type: str) -> Optional[CommunicationProvider]:
        """Get default active provider for a type."""
        return CommunicationProvider.objects.filter(
            tenant=tenant,
            provider_type=provider_type,
            is_active=True,
            is_default=True
        ).first()
    
    @staticmethod
    def send_message(
        tenant,
        message_type: str,
        recipient_type: str,
        recipient_id: str,
        recipient_name: str,
        content: str,
        to_phone: str = '',
        to_email: str = '',
        subject: str = '',
        template: Optional[MessageTemplate] = None,
        notice=None,
        variables: Optional[Dict] = None
    ) -> Optional[MessageLog]:
        """
        Universal send message method.
        """
        provider = CommunicationService.get_provider(tenant, message_type)
        if not provider:
            raise ValueError(f"No active {message_type} provider configured")
        
        # Render template if provided
        if template and variables:
            content = BaseMessageService(provider).render_template(
                template.content,
                variables
            )
            if template.subject and message_type == 'EMAIL':
                subject = BaseMessageService(provider).render_template(
                    template.subject,
                    variables
                )
        
        # Send via appropriate service
        if message_type == 'SMS':
            service = SMSService(provider)
            return service.send_sms(
                to_phone, content, recipient_type,
                recipient_id, recipient_name, template, notice
            )
        
        elif message_type == 'EMAIL':
            service = EmailService(provider)
            return service.send_email(
                to_email, subject, content, recipient_type,
                recipient_id, recipient_name, template, notice
            )
        
        elif message_type == 'WHATSAPP':
            service = WhatsAppService(provider)
            return service.send_whatsapp(
                to_phone, content, recipient_type,
                recipient_id, recipient_name, template, notice
            )
        
        return None
