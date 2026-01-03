"""
SMS Service - Wrapper for SMS providers (Twilio, MSG91, TextLocal)
"""

import logging
from typing import Optional, Dict, Any
from django.conf import settings
from twilio.rest import Client as TwilioClient
from twilio.base.exceptions import TwilioRestException
import requests

logger = logging.getLogger(__name__)


class SMSService:
    """
    Unified SMS service supporting multiple providers.
    """
    
    @staticmethod
    def send_sms(phone_number: str, message: str, provider: str = None) -> Dict[str, Any]:
        """
        Send SMS using configured provider.
        
        Args:
            phone_number: Recipient phone number (E.164 format)
            message: Message content
            provider: Provider name (TWILIO, MSG91, TEXTLOCAL) or None for default
            
        Returns:
            Dict with status and message_id
        """
        if not provider:
            provider = getattr(settings, 'DEFAULT_SMS_PROVIDER', 'TWILIO')
        
        try:
            if provider == 'TWILIO':
                return SMSService._send_via_twilio(phone_number, message)
            elif provider == 'MSG91':
                return SMSService._send_via_msg91(phone_number, message)
            elif provider == 'TEXTLOCAL':
                return SMSService._send_via_textlocal(phone_number, message)
            else:
                raise ValueError(f"Unsupported SMS provider: {provider}")
                
        except Exception as e:
            logger.error(f"Failed to send SMS via {provider}: {str(e)}")
            return {
                'status': 'failed',
                'error': str(e),
                'message_id': None
            }
    
    @staticmethod
    def _send_via_twilio(phone_number: str, message: str) -> Dict[str, Any]:
        """Send SMS via Twilio."""
        account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
        auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None)
        from_number = getattr(settings, 'TWILIO_PHONE_NUMBER', None)
        
        if not all([account_sid, auth_token, from_number]):
            raise ValueError("Twilio credentials not configured")
        
        client = TwilioClient(account_sid, auth_token)
        
        try:
            sms = client.messages.create(
                body=message,
                from_=from_number,
                to=phone_number
            )
            
            return {
                'status': 'sent',
                'message_id': sms.sid,
                'provider': 'TWILIO'
            }
            
        except TwilioRestException as e:
            logger.error(f"Twilio error: {e.msg}")
            raise
    
    @staticmethod
    def _send_via_msg91(phone_number: str, message: str) -> Dict[str, Any]:
        """Send SMS via MSG91."""
        auth_key = getattr(settings, 'MSG91_AUTH_KEY', None)
        sender_id = getattr(settings, 'MSG91_SENDER_ID', None)
        route = getattr(settings, 'MSG91_ROUTE', '4')  # 4 for Transactional
        
        if not all([auth_key, sender_id]):
            raise ValueError("MSG91 credentials not configured")
        
        # Remove + from phone number for MSG91
        phone = phone_number.replace('+', '')
        
        url = "https://api.msg91.com/api/v5/flow/"
        payload = {
            "template_id": getattr(settings, 'MSG91_TEMPLATE_ID', None),
            "short_url": "0",
            "recipients": [
                {
                    "mobiles": phone,
                    "message": message
                }
            ]
        }
        
        headers = {
            'authkey': auth_key,
            'content-type': 'application/json'
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            
            return {
                'status': 'sent',
                'message_id': result.get('request_id'),
                'provider': 'MSG91'
            }
            
        except requests.RequestException as e:
            logger.error(f"MSG91 error: {str(e)}")
            raise
    
    @staticmethod
    def _send_via_textlocal(phone_number: str, message: str) -> Dict[str, Any]:
        """Send SMS via TextLocal."""
        api_key = getattr(settings, 'TEXTLOCAL_API_KEY', None)
        sender = getattr(settings, 'TEXTLOCAL_SENDER', 'TXTLCL')
        
        if not api_key:
            raise ValueError("TextLocal API key not configured")
        
        url = "https://api.textlocal.in/send/"
        
        payload = {
            'apikey': api_key,
            'numbers': phone_number.replace('+', ''),
            'message': message,
            'sender': sender
        }
        
        try:
            response = requests.post(url, data=payload)
            response.raise_for_status()
            result = response.json()
            
            if result.get('status') == 'success':
                return {
                    'status': 'sent',
                    'message_id': result.get('messages', [{}])[0].get('id'),
                    'provider': 'TEXTLOCAL'
                }
            else:
                raise Exception(result.get('errors', [{}])[0].get('message', 'Unknown error'))
                
        except requests.RequestException as e:
            logger.error(f"TextLocal error: {str(e)}")
            raise
    
    @staticmethod
    def format_phone_number(phone: str, country_code: str = '+91') -> str:
        """
        Format phone number to E.164 format.
        
        Args:
            phone: Phone number
            country_code: Country code (default: +91 for India)
            
        Returns:
            Formatted phone number
        """
        # Remove all non-numeric characters
        phone = ''.join(filter(str.isdigit, phone))
        
        # Add country code if not present
        if not phone.startswith(country_code.replace('+', '')):
            phone = country_code + phone
        
        # Ensure + prefix
        if not phone.startswith('+'):
            phone = '+' + phone
        
        return phone
