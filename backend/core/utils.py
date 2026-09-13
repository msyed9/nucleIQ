"""
Core utilities for NucleiQ
Includes encryption utilities and custom validators
"""

import re
from django.conf import settings
from django.core.exceptions import ValidationError
from cryptography.fernet import Fernet
import base64
import hashlib


class EncryptionManager:
    """
    Manages field-level encryption using Fernet (symmetric encryption).
    Uses Django SECRET_KEY to derive encryption key.
    """
    
    @staticmethod
    def _get_cipher():
        """Generate Fernet cipher from Django SECRET_KEY."""
        # Derive a 32-byte key from SECRET_KEY
        key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
        # Fernet requires base64-encoded 32-byte key
        key = base64.urlsafe_b64encode(key)
        return Fernet(key)
    
    @staticmethod
    def encrypt(plaintext):
        """
        Encrypt plaintext string.
        
        Args:
            plaintext (str): Text to encrypt
            
        Returns:
            str: Encrypted text (base64 encoded)
        """
        if not plaintext:
            return plaintext
        
        cipher = EncryptionManager._get_cipher()
        encrypted = cipher.encrypt(plaintext.encode())
        return encrypted.decode()
    
    @staticmethod
    def decrypt(encrypted_text):
        """
        Decrypt encrypted text.
        
        Args:
            encrypted_text (str): Encrypted text to decrypt
            
        Returns:
            str: Decrypted plaintext
        """
        if not encrypted_text:
            return encrypted_text
        
        try:
            cipher = EncryptionManager._get_cipher()
            decrypted = cipher.decrypt(encrypted_text.encode())
            return decrypted.decode()
        except Exception:
            # If decryption fails, might be unencrypted data (migration scenario)
            return encrypted_text


def validate_indian_phone(value):
    """
    Validator for Indian phone numbers.
    Accepts formats: +91XXXXXXXXXX or exactly 10 digits starting with 6-9
    
    Args:
        value (str): Phone number to validate
        
    Raises:
        ValidationError: If phone number is invalid
    """
    if not value:
        return
    
    # Remove spaces and dashes for validation
    cleaned = value.replace(' ', '').replace('-', '')
    
    # Pattern 1: +91 followed by 10 digits starting with 6-9
    pattern1 = r'^\+91[6-9]\d{9}$'
    # Pattern 2: 10 digits starting with 6-9
    pattern2 = r'^[6-9]\d{9}$'
    
    if not (re.match(pattern1, cleaned) or re.match(pattern2, cleaned)):
        raise ValidationError(
            'Enter a valid Indian phone number. '
            'Format: +91XXXXXXXXXX or 10 digits starting with 6-9'
        )


def normalize_phone_number(value):
    """
    Normalize a phone number to a bare 10-digit string for comparison purposes
    (e.g. matching parent mobile numbers for sibling linking).

    Strips whitespace/dashes/parentheses and any '+91', '91', or leading '0'
    country/trunk prefix, so '+91 98765-43210', '919876543210', '09876543210'
    and '9876543210' all normalize to the same value.

    Args:
        value (str): Raw phone number

    Returns:
        str: 10-digit normalized number, or '' if not a plausible 10-digit
            Indian mobile number.
    """
    if not value:
        return ''

    cleaned = re.sub(r'[\s\-\(\)]', '', str(value))
    cleaned = re.sub(r'^(\+?91|0)(?=\d{10}$)', '', cleaned)

    if re.match(r'^[6-9]\d{9}$', cleaned):
        return cleaned
    return ''


def validate_email_enhanced(value):
    """
    Enhanced email validator that rejects disposable email domains.
    
    Args:
        value (str): Email address to validate
        
    Raises:
        ValidationError: If email is from disposable domain
    """
    if not value:
        return
    
    # List of common disposable email domains
    disposable_domains = [
        'tempmail.com', 'throwaway.email', '10minutemail.com',
        'guerrillamail.com', 'mailinator.com', 'maildrop.cc',
        'temp-mail.org', 'getnada.com', 'trashmail.com',
        'yopmail.com', 'fakeinbox.com', 'sharklasers.com'
    ]
    
    try:
        domain = value.split('@')[1].lower()
        if domain in disposable_domains:
            raise ValidationError(
                'Please use a valid institutional or personal email address. '
                'Disposable email addresses are not allowed.'
            )
    except IndexError:
        # Invalid email format, will be caught by Django's EmailValidator
        pass


def mask_aadhar(aadhar_number):
    """
    Mask Aadhar number for display.
    Shows only last 4 digits: XXXX-XXXX-1234
    
    Args:
        aadhar_number (str): 12-digit Aadhar number
        
    Returns:
        str: Masked Aadhar number
    """
    if not aadhar_number or len(aadhar_number) < 4:
        return 'XXXX-XXXX-XXXX'
    
    # Get last 4 digits
    last_four = aadhar_number[-4:]
    return f'XXXX-XXXX-{last_four}'


def validate_aadhar(value):
    """
    Validator for Aadhar number.
    Must be exactly 12 digits.
    
    Args:
        value (str): Aadhar number to validate
        
    Raises:
        ValidationError: If Aadhar number is invalid
    """
    if not value:
        return
    
    # Remove spaces and dashes
    cleaned = value.replace(' ', '').replace('-', '')
    
    if not re.match(r'^\d{12}$', cleaned):
        raise ValidationError(
            'Aadhar number must be exactly 12 digits.'
        )
