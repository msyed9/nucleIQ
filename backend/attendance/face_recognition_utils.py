"""
Face Recognition Utilities for Attendance Module
Handles face encoding extraction and comparison for student attendance.
"""

import numpy as np
import base64
import json
from io import BytesIO
from PIL import Image
import logging

logger = logging.getLogger(__name__)

# Try to import face_recognition library
try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    logger.warning("face_recognition library not installed. Face recognition features will be disabled.")


def is_face_recognition_available():
    """Check if face recognition is available."""
    return FACE_RECOGNITION_AVAILABLE


def extract_face_encoding(image):
    """
    Extract face encoding from a PIL Image.
    
    Args:
        image: PIL Image object
        
    Returns:
        tuple: (face_encoding as list, error_message)
        If successful, error_message is None.
        If failed, face_encoding is None and error_message describes the issue.
    """
    if not FACE_RECOGNITION_AVAILABLE:
        return None, "Face recognition library is not installed"
    
    try:
        # Convert PIL Image to numpy array
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        image_np = np.array(image)
        
        # Find face locations
        face_locations = face_recognition.face_locations(image_np)
        
        if not face_locations:
            return None, "No face detected in the image"
        
        if len(face_locations) > 1:
            return None, "Multiple faces detected. Please ensure only one face is visible"
        
        # Extract face encoding
        face_encodings = face_recognition.face_encodings(image_np, face_locations)
        
        if not face_encodings:
            return None, "Could not extract face encoding"
        
        # Convert numpy array to list for JSON serialization
        encoding_list = face_encodings[0].tolist()
        
        return encoding_list, None
        
    except Exception as e:
        logger.error(f"Error extracting face encoding: {str(e)}")
        return None, f"Error processing image: {str(e)}"


def compare_faces(known_encoding, unknown_encoding, tolerance=0.6):
    """
    Compare a known face encoding with an unknown face encoding.
    
    Args:
        known_encoding: List or numpy array of known face encoding
        unknown_encoding: List or numpy array of unknown face encoding
        tolerance: How much distance between faces to consider a match (lower = stricter)
        
    Returns:
        tuple: (is_match: bool, distance: float)
    """
    if not FACE_RECOGNITION_AVAILABLE:
        return False, 1.0
    
    try:
        # Convert to numpy arrays if needed
        if isinstance(known_encoding, list):
            known_encoding = np.array(known_encoding)
        if isinstance(unknown_encoding, list):
            unknown_encoding = np.array(unknown_encoding)
        
        # Calculate face distance
        distance = face_recognition.face_distance([known_encoding], unknown_encoding)[0]
        
        # Check if it's a match
        is_match = distance <= tolerance
        
        return is_match, float(distance)
        
    except Exception as e:
        logger.error(f"Error comparing faces: {str(e)}")
        return False, 1.0


def find_matching_student(face_encoding, tenant, tolerance=0.6):
    """
    Find a matching student from the database based on face encoding.
    
    Args:
        face_encoding: List of the face encoding to match
        tenant: Tenant object to filter students
        tolerance: Matching tolerance (default 0.6)
        
    Returns:
        tuple: (Student object or None, confidence score)
    """
    if not FACE_RECOGNITION_AVAILABLE:
        return None, 0.0
    
    from .models import StudentFaceEncoding
    from students.models import Student
    
    try:
        # Get all face encodings for this tenant's active students
        face_records = StudentFaceEncoding.objects.filter(
            student__tenant=tenant,
            student__is_active=True,
            is_active=True
        ).select_related('student')
        
        if not face_records.exists():
            return None, 0.0
        
        unknown_encoding = np.array(face_encoding)
        
        best_match = None
        best_distance = 1.0
        
        for record in face_records:
            try:
                known_encoding = record.get_encoding_array()
                if known_encoding is None:
                    continue
                
                is_match, distance = compare_faces(known_encoding, unknown_encoding, tolerance)
                
                if is_match and distance < best_distance:
                    best_distance = distance
                    best_match = record.student
                    
            except Exception as e:
                logger.error(f"Error comparing with student {record.student_id}: {str(e)}")
                continue
        
        if best_match:
            # Convert distance to confidence (lower distance = higher confidence)
            confidence = max(0.0, 1.0 - (best_distance / tolerance))
            return best_match, confidence
        
        return None, 0.0
        
    except Exception as e:
        logger.error(f"Error finding matching student: {str(e)}")
        return None, 0.0


def image_from_base64(base64_string):
    """
    Convert a base64 string to a PIL Image.
    
    Args:
        base64_string: Base64 encoded image string
        
    Returns:
        PIL Image object or None
    """
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_data = base64.b64decode(base64_string)
        image = Image.open(BytesIO(image_data))
        
        return image
        
    except Exception as e:
        logger.error(f"Error decoding base64 image: {str(e)}")
        return None
