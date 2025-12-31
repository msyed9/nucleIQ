# 🔐 LOGIN CREDENTIALS & SETUP GUIDE

## ✅ **PostCSS Error Fixed!**

The PostCSS configuration has been fixed by renaming `postcss.config.js` to `postcss.config.cjs` and using CommonJS syntax.

**Restart your frontend server** to apply the changes.

---

## 🔑 **LOGIN CREDENTIALS**

### **Platform Admin (Super Admin)**

**URL**: `http://localhost:8000/admin/`

**Credentials**:
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@nucleiq.com`

**Capabilities**:
- Full system access
- Manage all tenants
- Create/edit users
- System configuration
- View all data across tenants

---

### **Tenant Admin (School Admin)**

**URL**: `http://localhost:3000/` or `http://localhost:5173/`

**Default Tenant Credentials**:
- **Username**: `school_admin`
- **Password**: `school123`
- **Email**: `admin@school.com`

**Capabilities**:
- Manage school data
- Add students, staff
- Fee collection
- Attendance management
- Reports & analytics

---

## 🚀 **CREATING USERS**

### **Method 1: Django Admin (Recommended)**

1. **Login to Django Admin**:
   ```
   http://localhost:8000/admin/
   Username: admin
   Password: admin123
   ```

2. **Create Platform Admin**:
   - Go to `Users` → `Add User`
   - Fill in details
   - Check `Is staff` and `Is superuser`
   - Save

3. **Create Tenant**:
   - Go to `Tenants` → `Add Tenant`
   - Fill in school details
   - Save

4. **Create Tenant Admin**:
   - Go to `Users` → `Add User`
   - Fill in details
   - Select the tenant
   - Assign role: `ADMIN`
   - Save

---

### **Method 2: Django Shell**

```bash
# Access Django shell
docker compose exec backend python manage.py shell
```

```python
from users.models import User
from tenants.models import Tenant

# Create Platform Admin
platform_admin = User.objects.create_superuser(
    username='admin',
    email='admin@nucleiq.com',
    password='admin123',
    first_name='Platform',
    last_name='Admin'
)

# Create Tenant
tenant = Tenant.objects.create(
    name='Demo School',
    subdomain='demo',
    is_active=True
)

# Create Tenant Admin
tenant_admin = User.objects.create_user(
    username='school_admin',
    email='admin@school.com',
    password='school123',
    first_name='School',
    last_name='Admin',
    tenant=tenant,
    role='ADMIN'
)
```

---

### **Method 3: Management Command**

```bash
# Create superuser
docker compose exec backend python manage.py createsuperuser

# Follow prompts:
Username: admin
Email: admin@nucleiq.com
Password: admin123
Password (again): admin123
```

---

## 🔧 **FIXING THE FRONTEND ERROR**

### **Step 1: Stop Frontend**
```bash
# Press Ctrl+C in the terminal running frontend
```

### **Step 2: Restart Frontend**
```bash
docker compose restart frontend
```

**OR**

```bash
docker compose down
docker compose up -d
```

---

## 🧪 **TESTING LOGIN**

### **Test Platform Admin**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### **Test Tenant Admin**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "school_admin",
    "password": "school123"
  }'
```

---

## 📝 **DEFAULT USER ROLES**

### **Platform Level**
- **PLATFORM_ADMIN**: Full system access
- **PLATFORM_SUPPORT**: Support access

### **Tenant Level**
- **ADMIN**: School administrator
- **PRINCIPAL**: Principal access
- **TEACHER**: Teacher access
- **ACCOUNTANT**: Finance access
- **LIBRARIAN**: Library access
- **RECEPTIONIST**: Front desk access

---

## 🎯 **QUICK START GUIDE**

### **1. Access Django Admin**
```
URL: http://localhost:8000/admin/
Username: admin
Password: admin123
```

### **2. Create Your School (Tenant)**
- Navigate to `Tenants` → `Add Tenant`
- Fill in:
  - Name: Your School Name
  - Subdomain: yourschool
  - Is Active: ✓
- Save

### **3. Create School Admin User**
- Navigate to `Users` → `Add User`
- Fill in:
  - Username: your_username
  - Password: your_password
  - Email: your@email.com
  - Tenant: Select your school
  - Role: ADMIN
- Save

### **4. Login to Frontend**
```
URL: http://localhost:3000/
Username: your_username
Password: your_password
```

---

## 🔐 **SECURITY NOTES**

### **⚠️ IMPORTANT: Change Default Passwords!**

**For Production**:
1. Change all default passwords
2. Use strong passwords (12+ characters)
3. Enable 2FA (if implemented)
4. Restrict admin access by IP
5. Use HTTPS only

### **Default Passwords (CHANGE THESE!)**
- Platform Admin: `admin123`
- Tenant Admin: `school123`

---

## 🐛 **TROUBLESHOOTING**

### **Issue: Cannot login**
**Solution**:
```bash
# Reset password
docker compose exec backend python manage.py changepassword admin
```

### **Issue: User not found**
**Solution**:
```bash
# Create user via shell
docker compose exec backend python manage.py shell
>>> from users.models import User
>>> User.objects.create_superuser('admin', 'admin@nucleiq.com', 'admin123')
```

### **Issue: Frontend won't start**
**Solution**:
```bash
# Rebuild frontend
docker compose down
docker compose build frontend
docker compose up -d
```

### **Issue: PostCSS error persists**
**Solution**:
```bash
# Clear node_modules and reinstall
docker compose exec frontend rm -rf node_modules
docker compose exec frontend npm install
docker compose restart frontend
```

---

## ✅ **VERIFICATION CHECKLIST**

- [ ] PostCSS error fixed
- [ ] Frontend running on http://localhost:3000 or http://localhost:5173
- [ ] Backend running on http://localhost:8000
- [ ] Django admin accessible
- [ ] Platform admin login works
- [ ] Tenant created
- [ ] Tenant admin created
- [ ] Tenant admin login works

---

## 📞 **NEED HELP?**

If you're still experiencing issues:

1. **Check logs**:
   ```bash
   docker compose logs frontend
   docker compose logs backend
   ```

2. **Restart all services**:
   ```bash
   docker compose down
   docker compose up -d
   ```

3. **Rebuild everything**:
   ```bash
   docker compose down
   docker compose build
   docker compose up -d
   ```

---

**Updated**: December 28, 2025, 12:23 PM  
**Status**: ✅ **Ready to Use**

🔐 **Login credentials provided!** 🚀
