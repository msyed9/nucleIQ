"""
Unified QR Resolution Service.

Single source of truth for turning "whatever text a scanner read" into a
Student or Staff record. Used by every QR-based feature (ID card scanning,
attendance) so system-generated QR codes and manually assigned/external QR
codes behave identically once resolved.

Resolution order:
    1. System-generated ID card QR (encrypted `IDCardQRCode` payload) - unchanged, backward compatible.
    2. Manually assigned / external QR (`Student.manual_qr_code` / `Staff.manual_qr_code`).
    3. Legacy fallback: raw scanned text treated as a plain admission number / employee id
       (preserves the pre-existing behavior of `attendance.scan_idcard`).
"""

from dataclasses import dataclass
from typing import Optional, Union

from django.core.exceptions import ValidationError

SOURCE_GENERATED = 'generated'
SOURCE_MANUAL = 'manual'
SOURCE_LEGACY_ID = 'legacy_id'


class QRResolutionError(Exception):
    """Raised when scanned QR text cannot be resolved to an active entity."""
    pass


@dataclass
class QRIdentity:
    entity_type: str  # 'student' or 'staff'
    entity: Union['Student', 'Staff']
    source: str  # one of SOURCE_* constants
    qr_code: Optional[object] = None  # IDCardQRCode instance, if resolved via generated QR


def normalize_manual_qr_value(value):
    """
    Normalize manual/external QR text before storing or comparing it.
    Returns None for empty/blank input.
    """
    if value is None:
        return None
    normalized = str(value).strip()
    return normalized or None


def validate_manual_qr_uniqueness(value, tenant, exclude_student_id=None, exclude_staff_id=None):
    """
    Ensure `value` isn't already assigned to another student or staff member
    (within the tenant). Raises django.core.exceptions.ValidationError if a
    conflict is found. No-op if value is empty.
    """
    from students.models import Student
    from staff.models import Staff

    normalized = normalize_manual_qr_value(value)
    if not normalized:
        return

    student_qs = Student.objects.filter(tenant=tenant, manual_qr_code=normalized)
    if exclude_student_id:
        student_qs = student_qs.exclude(id=exclude_student_id)
    if student_qs.exists():
        raise ValidationError('This QR code is already assigned to another student.')

    staff_qs = Staff.objects.filter(tenant=tenant, manual_qr_code=normalized)
    if exclude_staff_id:
        staff_qs = staff_qs.exclude(id=exclude_staff_id)
    if staff_qs.exists():
        raise ValidationError('This QR code is already assigned to another staff member.')


def decode_qr_image_to_text(image_file):
    """
    Decode an uploaded QR code image into its raw payload text using pyzbar.
    Returns the decoded string, or raises QRResolutionError if no QR code is
    found or the decoder isn't available.
    """
    try:
        from pyzbar.pyzbar import decode
        from PIL import Image
    except ImportError:
        raise QRResolutionError(
            'QR image decoding is not available on this server. Please provide the QR text directly.'
        )

    try:
        image = Image.open(image_file)
        decoded_objects = decode(image)
    except Exception as e:
        raise QRResolutionError(f'Failed to read QR image: {e}')

    if not decoded_objects:
        raise QRResolutionError('No QR code could be detected in the uploaded image.')

    return decoded_objects[0].data.decode('utf-8')


def resolve_qr_identity(tenant, raw_text) -> QRIdentity:
    """
    Resolve arbitrary scanned QR text to a Student or Staff record.

    Tries, in order: system-generated encrypted QR -> manual/external QR ->
    legacy raw admission/employee number match. Raises QRResolutionError if
    nothing matches or the matched entity is inactive/disabled.
    """
    from .utils import validate_qr_code
    from students.models import Student
    from staff.models import Staff

    if raw_text is None:
        raise QRResolutionError('QR data is required.')

    text = str(raw_text).strip()
    if not text:
        raise QRResolutionError('QR data is required.')

    # 1) System-generated encrypted ID card QR (existing behavior, unchanged)
    try:
        payload, qr_code = validate_qr_code(text, tenant)
    except ValueError:
        payload, qr_code = None, None

    if payload is not None:
        entity_type = payload.get('type')
        entity_id = payload.get('id')
        try:
            if entity_type == 'student':
                entity = Student.objects.get(id=entity_id, tenant=tenant, is_active=True)
                return QRIdentity('student', entity, SOURCE_GENERATED, qr_code)
            elif entity_type == 'staff':
                entity = Staff.objects.get(id=entity_id, tenant=tenant, status='ACTIVE')
                return QRIdentity('staff', entity, SOURCE_GENERATED, qr_code)
        except (Student.DoesNotExist, Staff.DoesNotExist):
            raise QRResolutionError('QR code is valid but the linked record is no longer active.')

    normalized = normalize_manual_qr_value(text)

    # 2) Manual / external QR
    student = Student.objects.filter(
        tenant=tenant, manual_qr_code=normalized, is_active=True
    ).first()
    if student:
        return QRIdentity('student', student, SOURCE_MANUAL)

    staff = Staff.objects.filter(
        tenant=tenant, manual_qr_code=normalized, status='ACTIVE'
    ).first()
    if staff:
        return QRIdentity('staff', staff, SOURCE_MANUAL)

    # 3) Legacy fallback: raw text is a plain admission number / employee id
    student = Student.objects.filter(
        tenant=tenant, admission_number=text, is_active=True
    ).first()
    if student:
        return QRIdentity('student', student, SOURCE_LEGACY_ID)

    staff = Staff.objects.filter(
        tenant=tenant, employee_id=text, status='ACTIVE'
    ).first()
    if staff:
        return QRIdentity('staff', staff, SOURCE_LEGACY_ID)

    raise QRResolutionError('QR code not recognized or the linked record is inactive.')
