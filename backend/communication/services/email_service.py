"""
Email Service - AWS SES and SendGrid Integration
"""

from typing import Dict, Optional
from django.utils import timezone
from communication.models import CommunicationProvider, MessageLog, MessageTemplate


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
