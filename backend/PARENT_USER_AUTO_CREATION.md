# Parent User Auto-Creation Feature

## Overview
When adding a new student admission, the system automatically creates parent user accounts and links them to the student.

## How It Works

### Frontend (AddStudent.tsx)
The student admission form sends `create_parent_login: true` in the API payload when creating a student.

### Backend (students/views.py)
The `StudentViewSet.perform_create()` method handles parent account creation:

1. **Check for Existing Family**: If the student has a `family_id`, the system checks if parent accounts already exist for that family
2. **Link Existing Parents**: If parent accounts exist for siblings, it simply links them to the new student
3. **Create New Accounts**: If no parent accounts exist, it creates new User accounts for:
   - **Father**: If `father_phone` is provided
   - **Mother**: If `mother_phone` is provided (and different from father)

### Account Details

#### Father Account
- **Email**: Uses `student.father_email` or generates `{father_phone}@parent.local`
- **Phone**: `student.father_phone`  
- **Username/Login**: Email address
- **Password**: Auto-generated 8-character random password
- **Name**: Parsed from `student.father_name`
- **Portal Access**: Enabled by default

#### Mother Account  
- **Email**: Uses `student.mother_email` or generates `{mother_phone}@parent.local`
- **Phone**: `student.mother_phone`
- **Username/Login**: Email address  
- **Password**: Auto-generated 8-character random password
- **Name**: Parsed from `student.mother_name`
- **Portal Access**: Enabled by default

### ParentUser Profile
Each parent gets a `ParentUser` profile linked to their User account:
- **Relation Type**: 'FATHER' or 'MOTHER'
- **Portal Access**: Enabled
- **Students**: M2M link to all their children

## API Response

When a student is created with `create_parent_login: true`, the response includes:

```json
{
  "id": 123,
  "admission_number": "STU-2026-001",
  ...student fields...,
  "parent_logins": {
    "father": {
      "username": "father@email.com",
      "password": "Abc12345",
      "phone": "+919876543210",
      "name": "John Doe",
      "created": true
    },
    "mother": {
      "username": "mother@email.com",
      "password": "Xyz98765",
      "phone": "+919876543211",
      "name": "Jane Doe",
      "created": true
    }
  }
}
```

If parent accounts already existed:
```json
{
  "parent_logins": {
    "father": {
      "username": "+919876543210",
      "phone": "+919876543210",
      "name": "John Doe",
      "created": false,
      "message": "Linked to existing account"
    },
    "existing_accounts_linked": true,
    "message": "Linked to 2 existing parent account(s)"
  }
}
```

## Parent Login

Parents can log in at: **http://localhost:5173/parent/login**

- **Username**: Their email address
- **Password**: The auto-generated password (should be changed on first login)

## Security Features

1. **Unique Phone Check**: System checks if a User with the same phone already exists before creating
2. **Family Linking**: Siblings automatically share parent accounts via `family_id`
3. **Tenant Isolation**: All parent users are scoped to the same tenant as the student
4. **Portal Access Control**: `portal_access_enabled` flag controls login ability
5. **Read-Only Access**: Parents can only view their children's data, not modify

## Database Tables

- **users_user**: Base user account (email, password, phone_number)
- **parent_users**: Parent profile (relation_type, portal_access_enabled)
- **parent_users_students**: M2M linking parents to students

## Future Enhancements

1. **SMS Notification**: Send login credentials via SMS
2. **Email Notification**: Email credentials to parent email addresses
3. **Password Reset Flow**: Allow parents to reset forgotten passwords
4. **First-Login Password Change**: Force password change on first login
5. **Multiple Contact Methods**: Support multiple phone numbers per parent

---

**Status**:  IMPLEMENTED
**Date**: January 7, 2026