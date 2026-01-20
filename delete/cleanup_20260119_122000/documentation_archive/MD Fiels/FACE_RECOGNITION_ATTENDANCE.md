# Face Recognition Attendance System

## Overview

The Face Recognition Attendance System allows schools to mark student attendance using facial recognition technology. The system consists of two main components:

1. **Face Enrollment** - Capturing and storing student faces (Admin only)
2. **Face Recognition Attendance** - Recognizing students and marking attendance via mobile capture

## Features

### Face Enrollment (Admin Only)
- List all students with their face enrollment status
- Filter students by class, section, and enrollment status
- Capture student faces using webcam
- View enrollment statistics (total, enrolled, not enrolled, percentage)
- Update or delete existing face enrollments
- Reference images stored for verification

### Face Recognition Attendance
- Real-time face capture via webcam
- Automatic face matching against enrolled students
- Automatic late status determination based on configuration
- Success/failure feedback with student details
- Works alongside QR code attendance capture

## Technical Architecture

### Backend Components

#### Models
- `StudentFaceEncoding` - Stores face encoding data for each student
  - `student` (OneToOne) - Link to Student model
  - `encoding_data` (JSON) - 128-dimensional face encoding vector
  - `reference_image` - Stored photo used for encoding
  - `encoded_at` - Timestamp of enrollment
  - `encoded_by` - User who performed enrollment
  - `confidence_score` - Quality metric
  - `is_active` - Status flag

#### API Endpoints

| Endpoint | Method | Description | Permission |
|----------|--------|-------------|------------|
| `/api/attendance/face-enrollment/` | GET | List students with enrollment status | Tenant Admin |
| `/api/attendance/face-enrollment/enroll/` | POST | Enroll a student's face | Tenant Admin |
| `/api/attendance/face-enrollment/delete/<id>/` | DELETE | Delete face enrollment | Tenant Admin |
| `/api/attendance/face-enrollment/status/` | GET | Get enrollment statistics | Tenant Admin |
| `/api/attendance/records/mobile_capture/` | POST | Mark attendance via face | Authenticated |

#### Face Recognition Utilities (`face_recognition_utils.py`)
- `extract_face_encoding()` - Extracts 128-dim face encoding from image
- `compare_faces()` - Compares two face encodings for match
- `find_matching_student()` - Searches all enrolled faces for a match
- `image_from_base64()` - Converts base64 image to PIL Image

### Frontend Components

#### FaceEnrollment.tsx
- Admin-only face enrollment page
- Student grid with enrollment status
- Webcam capture modal
- Filter by class, section, enrollment status
- Real-time status cards showing enrollment progress

### Permissions
- Face enrollment is restricted to **Tenant Admins only**
- Uses `IsTenantAdmin` permission class
- Checks for admin roles: `admin`, `super_admin`, `tenant_admin`, `school_admin`, `principal`

## Setup Instructions

### Prerequisites

1. Install system dependencies for face_recognition:
   ```bash
   # On Ubuntu/Debian
   sudo apt-get install build-essential cmake
   sudo apt-get install libopenblas-dev liblapack-dev
   sudo apt-get install libx11-dev libgtk-3-dev
   
   # On Windows
   # Download and install Visual Studio Build Tools
   # Install cmake from https://cmake.org/download/
   ```

2. Install zbar for QR code scanning:
   ```bash
   # On Ubuntu/Debian
   sudo apt-get install libzbar0
   
   # On Windows (via Chocolatey)
   choco install zbar
   ```

### Backend Installation

1. Install Python dependencies:
   ```bash
   cd backend
   pip install -r requirements/dev.txt
   ```

2. Run migrations:
   ```bash
   python manage.py makemigrations attendance
   python manage.py migrate
   ```

### Frontend Installation

1. Install npm dependencies:
   ```bash
   cd frontend
   npm install react-webcam
   ```

2. Rebuild if using Docker:
   ```bash
   docker-compose build --no-cache frontend
   docker-compose up -d
   ```

## Usage Guide

### For Admins: Enrolling Student Faces

1. Navigate to **Attendance → Face Enrollment**
2. Use filters to find students who need enrollment
3. Click **"Enroll Face"** on a student card
4. Click **"Open Camera"** to start webcam
5. Ensure student's face is clearly visible and well-lit
6. Click **"Capture"** to take photo
7. Review the captured image
8. Click **"Enroll Face"** to save

**Best Practices:**
- Ensure good lighting (natural light is best)
- Have student face the camera directly
- Remove glasses if possible
- Avoid multiple faces in frame
- Re-enroll if student's appearance changes significantly

### For Students/Staff: Marking Attendance

1. Navigate to **Attendance → Mobile Capture**
2. Select **"Face Recognition"** method
3. Position face in front of camera
4. Click **"Capture & Mark Attendance"**
5. System will recognize face and mark attendance

## Configuration

### Late Threshold
Configure the late threshold time in `AttendanceConfiguration`:
- `late_threshold_time` - Time after which students are marked LATE
- Default: 09:30 AM

### Matching Tolerance
The face matching tolerance can be adjusted in `face_recognition_utils.py`:
- Default: `0.6` (lower = stricter matching)
- Recommended range: `0.5` - `0.7`

## Troubleshooting

### "Face recognition library not available"
- Install face_recognition: `pip install face_recognition`
- On Windows, you may need to install dlib first
- Check system dependencies are installed

### "No face detected in the image"
- Ensure proper lighting
- Have student face camera directly
- Check webcam resolution is adequate

### "Multiple faces detected"
- Only one person should be in frame during enrollment/attendance

### "Face not recognized"
- Student may not be enrolled - check Face Enrollment page
- Try re-enrolling with better lighting
- Lower the tolerance if false negatives are common

## Database Schema

```sql
CREATE TABLE student_face_encodings (
    id UUID PRIMARY KEY,
    student_id UUID UNIQUE REFERENCES students(id),
    encoding_data JSONB NOT NULL,
    reference_image VARCHAR(255),
    encoded_at TIMESTAMP DEFAULT NOW(),
    encoded_by_id UUID REFERENCES users(id),
    confidence_score FLOAT DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Security Considerations

1. **Data Protection**: Face encoding data is stored as mathematical vectors, not actual images
2. **Access Control**: Only tenant admins can manage enrollments
3. **Tenant Isolation**: Face encodings are scoped to tenant
4. **Image Storage**: Reference images stored in protected media directory
5. **No External API**: All processing happens locally on server

## Future Enhancements

1. **Bulk Enrollment**: Enroll multiple students from uploaded photos
2. **Liveness Detection**: Prevent photo-based spoofing
3. **Multiple Encodings**: Store multiple angles for better accuracy
4. **Offline Mode**: Cache encodings for offline recognition
5. **Analytics**: Recognition accuracy statistics and reports
