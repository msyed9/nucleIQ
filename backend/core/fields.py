"""
Custom model fields for NucleIQ
"""

from django.db import models
from .utils import EncryptionManager


class EncryptedCharField(models.CharField):
    """
    CharField that automatically encrypts data before saving
    and decrypts when retrieving from database.
    """
    
    description = "Encrypted CharField"
    
    def from_db_value(self, value, expression, connection):
        """Decrypt value when loading from database."""
        if value is None:
            return value
        return EncryptionManager.decrypt(value)
    
    def get_prep_value(self, value):
        """Encrypt value before saving to database."""
        if value is None or value == '':
            return value
        
        # Check if already encrypted (for updates)
        # If it looks like base64 Fernet token, assume encrypted
        try:
            if len(value) > 50 and value.startswith('gAAAAA'):
                # Already encrypted (Fernet tokens start with version)
                return value
        except:
            pass
        
        # Encrypt the value
        return EncryptionManager.encrypt(value)
    
    def to_python(self, value):
        """Convert to Python string."""
        if isinstance(value, str) or value is None:
            return value
        return str(value)
