"""
Dynamic QR-Based Staff Attendance System

This module provides secure, time-sensitive QR code generation and verification
for staff attendance marking.
"""

import hmac
import hashlib
import json
import base64
import uuid
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone


# Token expiration time in seconds (90 seconds for staff QR tokens)
TOKEN_EXPIRY_SECONDS = 90

# Secret key for HMAC signing (uses Django's SECRET_KEY)
def get_secret_key():
    return settings.SECRET_KEY.encode('utf-8')


def generate_staff_attendance_token(staff_id: int, tenant_id: int) -> str:
    """
    Generate a secure, short-lived signed token for staff attendance QR code.
    
    The token contains:
    - staff_id: The staff member's ID
    - tenant_id: The tenant/school ID for tenant isolation
    - timestamp: Creation time for expiration checking
    - nonce: Unique identifier to prevent replay attacks
    
    Returns a base64-encoded signed token string.
    """
    # Create payload with all required data
    payload = {
        'staff_id': staff_id,
        'tenant_id': tenant_id,
        'timestamp': timezone.now().isoformat(),
        'nonce': str(uuid.uuid4()),  # Unique for every request
        'type': 'staff_attendance'  # Token type identifier
    }
    
    # Convert payload to JSON and encode
    payload_json = json.dumps(payload, sort_keys=True)
    payload_bytes = payload_json.encode('utf-8')
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode('utf-8')
    
    # Create HMAC signature
    signature = hmac.new(
        get_secret_key(),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()
    
    # Combine payload and signature with prefix for easy identification
    token = f"STAFF_ATT:{payload_b64}.{signature}"
    
    return token


def verify_staff_attendance_token(token: str, expected_tenant_id: int) -> dict:
    """
    Verify a staff attendance QR token.
    
    Validates:
    - Token format and prefix
    - HMAC signature integrity
    - Token hasn't expired
    - Tenant ID matches
    
    Returns a dict with:
    - valid: bool indicating if token is valid
    - staff_id: The staff member's ID (if valid)
    - error: Error message (if invalid)
    - payload: Full decoded payload (if valid)
    """
    result = {
        'valid': False,
        'staff_id': None,
        'error': None,
        'payload': None
    }
    
    try:
        # Check token prefix
        if not token.startswith('STAFF_ATT:'):
            result['error'] = 'Invalid token format'
            return result
        
        # Remove prefix and split payload from signature
        token_data = token[10:]  # Remove 'STAFF_ATT:'
        parts = token_data.split('.')
        
        if len(parts) != 2:
            result['error'] = 'Invalid token structure'
            return result
        
        payload_b64, provided_signature = parts
        
        # Decode payload
        try:
            payload_bytes = base64.urlsafe_b64decode(payload_b64.encode('utf-8'))
            payload = json.loads(payload_bytes.decode('utf-8'))
        except Exception:
            result['error'] = 'Failed to decode token payload'
            return result
        
        # Verify HMAC signature
        expected_signature = hmac.new(
            get_secret_key(),
            payload_bytes,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(expected_signature, provided_signature):
            result['error'] = 'Invalid token signature'
            return result
        
        # Check token type
        if payload.get('type') != 'staff_attendance':
            result['error'] = 'Invalid token type'
            return result
        
        # Check tenant isolation
        if payload.get('tenant_id') != expected_tenant_id:
            result['error'] = 'Token tenant mismatch'
            return result
        
        # Check token expiration
        try:
            token_timestamp = datetime.fromisoformat(payload['timestamp'])
            # Make timezone-aware if it isn't
            if token_timestamp.tzinfo is None:
                token_timestamp = token_timestamp.replace(tzinfo=timezone.utc)
            
            current_time = timezone.now()
            token_age = (current_time - token_timestamp).total_seconds()
            
            if token_age > TOKEN_EXPIRY_SECONDS:
                result['error'] = f'Token expired (age: {int(token_age)}s, max: {TOKEN_EXPIRY_SECONDS}s)'
                return result
            
            if token_age < 0:
                result['error'] = 'Token timestamp is in the future'
                return result
                
        except Exception as e:
            result['error'] = f'Failed to validate token timestamp: {str(e)}'
            return result
        
        # Token is valid
        result['valid'] = True
        result['staff_id'] = payload['staff_id']
        result['payload'] = payload
        
        return result
        
    except Exception as e:
        result['error'] = f'Token verification error: {str(e)}'
        return result


def is_staff_attendance_token(data: str) -> bool:
    """
    Check if the provided data is a staff attendance token.
    Used to distinguish between standard QR scans (like student ID cards)
    and staff attendance tokens.
    """
    return isinstance(data, str) and data.startswith('STAFF_ATT:')
