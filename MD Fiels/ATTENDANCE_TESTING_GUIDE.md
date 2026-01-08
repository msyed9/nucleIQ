# Attendance Mobile Capture - Testing Guide

## Prerequisites

### Backend Setup
1. **Python Packages Installed** 
   - pyzbar (for QR code decoding)
   - Pillow (for image processing)

2. **Database Migration**
   `ash
   cd backend
   python manage.py migrate attendance
   `

3. **Generate QR Tokens**
   `ash
   # Generate tokens for all students
   python manage.py generate_qr_tokens --tenant <tenant_slug> --students
   
   # Generate tokens for all staff
   python manage.py generate_qr_tokens --tenant <tenant_slug> --staff
   `

### Frontend Setup
1. **NPM Packages Installed** 
   - html5-qrcode
   - react-webcam

2. **Build Frontend**
   `ash
   cd frontend
   npm run build
   `

## Testing QR Code Attendance

### Step 1: Access Mobile Capture Page
1. Navigate to: /attendance/mobile-capture
2. Or use sidebar: **Attendance  Mobile Capture**

### Step 2: Test QR Code Scanning

#### Method A: Using Camera (Real QR Code)
1. Click **"Scan QR Code"** button
2. Allow camera access when prompted
3. Point camera at student/staff QR code
4. Wait for auto-detection
5. Verify:
   -  Student/Staff photo appears
   -  Name, admission number, class displayed
   -  Status badge shows (PRESENT/LATE)
   -  Check-in time displayed

#### Method B: Manual QR Token Entry (Testing)
1. Get a QR token from database:
   `ash
   cd backend
   python manage.py shell
   >>> from attendance.models import QRCodeToken
   >>> token = QRCodeToken.objects.filter(student__isnull=False).first()
   >>> print(token.token)
   `
2. Create a QR code image containing this token using online QR generator
3. Scan with Mobile Capture page

### Step 3: Verify Database Entry
`ash
cd backend
python manage.py shell
>>> from attendance.models import AttendanceRecord
>>> from datetime import date
>>> records = AttendanceRecord.objects.filter(date=date.today(), method='QR_CODE')
>>> for r in records:
...     print(f"{r.student.get_full_name()} - {r.status} - {r.check_in_time}")
`

### Step 4: Test Late Status
1. Configure late threshold:
   - Admin Panel  Attendance Configuration
   - Set late_threshold_time (e.g., 09:30 AM)
2. Scan QR code after threshold time
3. Verify status shows **LATE** instead of **PRESENT**

## Testing Face Capture

### Step 1: Capture Face Image
1. Click **"Capture Face"** button
2. Allow camera access when prompted
3. Position face in frame
4. Click **"Capture"** button
5. Verify:
   -  Image preview appears
   -  "Processing..." message shows
   -  Currently: Error "Face not recognized" (expected - not implemented yet)

### Step 2: Implement Face Recognition (Phase 2)
**Note**: Face recognition is currently a placeholder. To fully implement:

1. **Install face_recognition library**:
   `ash
   cd backend
   pip install face_recognition
   `

2. **Add face encoding to Student model**:
   `python
   # In students/models.py
   face_encoding = models.TextField(blank=True, null=True)
   `

3. **Create face enrollment process**:
   - Capture multiple student photos
   - Generate face encodings
   - Store in database

4. **Update _recognize_face method**:
   `python
   def _recognize_face(self, image, tenant):
       import face_recognition
       import pickle
       import numpy as np
       
       # Convert PIL image to numpy array
       image_array = np.array(image)
       
       # Get face encodings from image
       face_encodings = face_recognition.face_encodings(image_array)
       
       if not face_encodings:
           return None
       
       face_encoding = face_encodings[0]
       
       # Compare with stored encodings
       from students.models import Student
       students = Student.objects.filter(
           tenant=tenant,
           is_active=True,
           face_encoding__isnull=False
       )
       
       for student in students:
           stored_encoding = pickle.loads(student.face_encoding.encode())
           matches = face_recognition.compare_faces([stored_encoding], face_encoding)
           
           if matches[0]:
               return student
       
       return None
   `

## Testing Attendance Reports

### Step 1: Access Reports Page
1. Navigate to: /attendance/reports
2. Or use sidebar: **Attendance  Reports**

### Step 2: Test Report Filters
1. **Date Filter**:
   - Select specific date
   - Click "Apply"
   - Verify records for that date appear

2. **Grade Filter**:
   - Select a grade
   - Select a section
   - Verify only students from that class appear

3. **Status Filter**:
   - Click "Late Students" card
   - Verify only LATE status records appear
   - Click "Absent Students" card
   - Verify only ABSENT status records appear

### Step 3: Test Export
1. Apply filters
2. Click "Export to Excel"
3. Verify downloaded file contains:
   - Filtered data only
   - Columns: Date, Name, Admission Number, Class, Section, Status, Check-in Time

## API Testing with Postman/cURL

### Test QR Code Image Upload
`ash
curl -X POST http://localhost:8000/api/attendance/records/mobile_capture/ \
  -H "Authorization: Bearer <token>" \
  -F "method=QR_CODE" \
  -F "image=@qr_code_image.jpg"
`

Expected Response:
`json
{
  "success": true,
  "message": "Attendance marked successfully!",
  "student": {
    "id": "uuid",
    "full_name": "John Doe",
    "admission_number": "ADM001",
    "class_name": "Class 10",
    "section": "A",
    "photo_url": "/media/students/photos/john.jpg"
  },
  "status": "PRESENT",
  "check_in_time": "08:45:00"
}
`

### Test Face Image Upload
`ash
curl -X POST http://localhost:8000/api/attendance/records/mobile_capture/ \
  -H "Authorization: Bearer <token>" \
  -F "method=FACE" \
  -F "image=@face_photo.jpg"
`

Expected Response (Currently):
`json
{
  "error": "Face not recognized. Please try again or contact admin."
}
`

## Troubleshooting

### Issue: "No QR code found in image"
- **Cause**: QR code not clearly visible or image quality poor
- **Solution**: 
  - Ensure good lighting
  - Hold camera steady
  - Get closer to QR code
  - Try manual token entry for testing

### Issue: "Invalid or expired token"
- **Cause**: QR token not in database or expired
- **Solution**:
  - Run generate_qr_tokens command
  - Check token exists: QRCodeToken.objects.filter(token='<token>').exists()
  - Verify alid_date is today
  - Verify is_active=True

### Issue: Camera access denied
- **Cause**: Browser permissions not granted
- **Solution**:
  - Check browser settings
  - Ensure HTTPS or localhost
  - Try different browser
  - Check for conflicting camera apps

### Issue: Face not recognized (after implementation)
- **Cause**: No face encoding stored or poor match
- **Solution**:
  - Re-enroll student face
  - Ensure good lighting
  - Face looking directly at camera
  - Remove glasses/hats if causing issues

### Issue: Late status not working
- **Cause**: late_threshold_time not configured
- **Solution**:
  - Set in AttendanceConfiguration model
  - Or update _determine_status method default threshold

## Performance Considerations

### QR Code Scanning
- **Average time**: 1-2 seconds
- **Dependencies**: pyzbar speed, image quality
- **Optimization**: Use smaller images, better lighting

### Face Recognition (when implemented)
- **Average time**: 3-5 seconds per face
- **Dependencies**: Database size, encoding quality
- **Optimization**: 
  - Index face_encoding field
  - Cache encodings in memory
  - Use face detection to pre-filter

### Database Queries
- **Attendance records**: Indexed by date, student, staff
- **QR tokens**: Indexed by token, valid_date
- **Optimization**: Proper use of select_related/prefetch_related

## Security Notes

1. **QR Token Security**:
   - Tokens are daily and expire
   - Each student has unique token
   - Tokens are UUID-based (hard to guess)

2. **Face Recognition**:
   - Store encodings, not actual images (when implemented)
   - Use proper encryption for sensitive data
   - Implement rate limiting for API calls

3. **CORS Configuration**:
   - Ensure mobile app domain is whitelisted
   - Use HTTPS in production
   - Validate file uploads (size, type)

## Next Steps

1. **Complete Face Recognition** (Phase 2)
2. **Add RFID Support** (if hardware available)
3. **Implement Biometric Integration** (if available)
4. **Add Geofencing** (location-based attendance)
5. **Create Admin Dashboard** for monitoring
6. **Add SMS/Email Notifications** for parents

## Success Criteria

-  QR scanning works with >95% accuracy
-  Late status correctly determined
-  Student data properly linked
-  Reports generated correctly
-  No errors in browser console
-  No errors in backend logs
-  Response time < 3 seconds
-  Works on mobile devices (Chrome, Safari)

---

**Last Updated**: 2026-01-07 11:50
**Status**: QR Code Ready for Testing | Face Recognition Pending Implementation
