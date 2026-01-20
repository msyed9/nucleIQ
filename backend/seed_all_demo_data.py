"""
Complete Demo Data Seeding Script for NucleiQ
This script seeds all necessary data including:
- Academic Years, Grades, Sections
- Students and Enrollments
- Staff and Attendance
- Dashboard Widgets and Layouts
"""

import os
import django
from django.db import connection
import uuid
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()


def seed_widgets():
    """Seed dashboard widget definitions."""
    from dashboard.models import WidgetDefinition
    
    print("\n📊 Seeding Dashboard Widgets...")
    
    widgets = [
        # Overview Widgets
        {
            'widget_id': 'overview_stats',
            'name': 'Overview Statistics',
            'description': 'Key metrics including students, staff, attendance, and fees',
            'component_name': 'OverviewStatsWidget',
            'category': 'system',
            'available_for_roles': ['principal', 'admin'],
            'default_width': 12,
            'default_height': 2,
            'min_width': 6,
            'min_height': 2,
            'icon': '📊',
            'is_system': True,
            'data_endpoint': '/api/dashboard/widget-data/overview_stats/',
            'refresh_interval': 300,
        },
        {
            'widget_id': 'student_count',
            'name': 'Student Count',
            'description': 'Total number of active students',
            'component_name': 'QuickStatsWidget',
            'category': 'academic',
            'available_for_roles': ['principal', 'admin', 'teacher'],
            'default_width': 3,
            'default_height': 2,
            'min_width': 2,
            'min_height': 2,
            'icon': '👨‍🎓',
            'data_endpoint': '/api/dashboard/widget-data/student_count/',
        },
        {
            'widget_id': 'staff_count',
            'name': 'Staff Count',
            'description': 'Total number of active staff members',
            'component_name': 'QuickStatsWidget',
            'category': 'hr',
            'available_for_roles': ['principal', 'admin'],
            'default_width': 3,
            'default_height': 2,
            'min_width': 2,
            'min_height': 2,
            'icon': '👨‍🏫',
            'data_endpoint': '/api/dashboard/widget-data/staff_count/',
        },
        
        # Finance Widgets
        {
            'widget_id': 'fee_trend_chart',
            'name': 'Fee Collection Trend',
            'description': 'Fee collection trend over time',
            'component_name': 'FeeTrendWidget',
            'category': 'finance',
            'available_for_roles': ['principal', 'admin', 'accountant'],
            'default_width': 6,
            'default_height': 4,
            'min_width': 4,
            'min_height': 3,
            'icon': '📈',
            'data_endpoint': '/api/dashboard/widget-data/fee_trend_chart/',
            'refresh_interval': 600,
        },
        {
            'widget_id': 'fee_overview',
            'name': 'Fee Overview',
            'description': 'Fee collection summary with pending dues',
            'component_name': 'FeeSummaryWidget',
            'category': 'finance',
            'available_for_roles': ['principal', 'admin', 'accountant'],
            'default_width': 4,
            'default_height': 3,
            'min_width': 3,
            'min_height': 2,
            'icon': '💰',
            'data_endpoint': '/api/dashboard/widget-data/fee_overview/',
        },
        
        # Attendance Widgets
        {
            'widget_id': 'attendance_heatmap',
            'name': 'Attendance Heatmap',
            'description': 'Class-wise attendance heatmap',
            'component_name': 'AttendanceHeatmapWidget',
            'category': 'attendance',
            'available_for_roles': ['principal', 'admin'],
            'default_width': 8,
            'default_height': 4,
            'min_width': 6,
            'min_height': 3,
            'icon': '📅',
            'data_endpoint': '/api/dashboard/widget-data/attendance_heatmap/',
        },
        {
            'widget_id': 'attendance_summary',
            'name': 'Attendance Summary',
            'description': 'Overall attendance statistics',
            'component_name': 'AttendanceSummaryWidget',
            'category': 'attendance',
            'available_for_roles': ['principal', 'admin', 'teacher', 'parent'],
            'default_width': 4,
            'default_height': 4,
            'min_width': 3,
            'min_height': 3,
            'icon': '✅',
            'data_endpoint': '/api/dashboard/widget-data/attendance_summary/',
        },
        
        # Leaderboard Widgets
        {
            'widget_id': 'leaderboard_academic',
            'name': 'Academic Leaderboard',
            'description': 'Top performing students academically',
            'component_name': 'LeaderboardWidget',
            'category': 'leaderboard',
            'available_for_roles': ['principal', 'admin', 'teacher', 'student', 'parent'],
            'default_width': 4,
            'default_height': 4,
            'min_width': 3,
            'min_height': 3,
            'icon': '🏆',
            'data_endpoint': '/api/dashboard/widget-data/leaderboard_academic/',
        },
        
        # Activity Widgets
        {
            'widget_id': 'recent_activity',
            'name': 'Recent Activity',
            'description': 'Latest activities and updates',
            'component_name': 'RecentActivityWidget',
            'category': 'system',
            'available_for_roles': ['principal', 'admin', 'teacher'],
            'default_width': 6,
            'default_height': 4,
            'min_width': 4,
            'min_height': 3,
            'icon': '📝',
            'data_endpoint': '/api/dashboard/widget-data/recent_activity/',
        },
        {
            'widget_id': 'upcoming_events',
            'name': 'Upcoming Events',
            'description': 'Scheduled events and reminders',
            'component_name': 'UpcomingEventsWidget',
            'category': 'communication',
            'available_for_roles': ['principal', 'admin', 'teacher', 'student', 'parent'],
            'default_width': 4,
            'default_height': 4,
            'min_width': 3,
            'min_height': 3,
            'icon': '📆',
            'data_endpoint': '/api/dashboard/widget-data/upcoming_events/',
        },
        {
            'widget_id': 'school_announcements',
            'name': 'Announcements',
            'description': 'Important school announcements',
            'component_name': 'AnnouncementsWidget',
            'category': 'communication',
            'available_for_roles': ['principal', 'admin', 'teacher', 'student', 'parent'],
            'default_width': 6,
            'default_height': 3,
            'min_width': 4,
            'min_height': 2,
            'icon': '📢',
            'data_endpoint': '/api/dashboard/widget-data/school_announcements/',
        },
    ]
    
    created_count = 0
    updated_count = 0
    
    for widget_data in widgets:
        obj, created = WidgetDefinition.objects.update_or_create(
            widget_id=widget_data['widget_id'],
            defaults=widget_data
        )
        if created:
            created_count += 1
        else:
            updated_count += 1
    
    print(f"✅ Widgets: {created_count} created, {updated_count} updated")


def seed_complete():
    """Seed complete demo data."""
    print("🚀 Complete Demo Data Seeding...")
    
    with connection.cursor() as cursor:
        # Get Tenant
        cursor.execute("SELECT id, subdomain FROM tenants LIMIT 1")
        row = cursor.fetchone()
        if not row:
            print("❌ No tenant found. Please ensure at least one tenant exists.")
            return
        t_id = str(row[0])
        subdomain = row[1]
        print(f"Using Tenant: '{subdomain}' (ID: {t_id})")

        # 1. Academic Year
        cursor.execute(f"SELECT id FROM academic_years WHERE tenant_id = '{t_id}' AND is_active = true LIMIT 1")
        ay_row = cursor.fetchone()
        if ay_row:
            ay_id = str(ay_row[0])
            print(f"✅ Active Academic Year exists: {ay_id}")
        else:
            # Check if any academic year exists
            cursor.execute(f"SELECT id FROM academic_years WHERE tenant_id = '{t_id}' LIMIT 1")
            any_ay = cursor.fetchone()
            if any_ay:
                ay_id = str(any_ay[0])
                # Make it active
                cursor.execute(f"UPDATE academic_years SET is_active = true WHERE id = '{ay_id}'")
                print(f"✅ Activated existing Academic Year: {ay_id}")
            else:
                ay_id = str(uuid.uuid4())
                cursor.execute(f"""
                    INSERT INTO academic_years (id, tenant_id, name, start_date, end_date, is_active, is_deleted, created_at, updated_at) 
                    VALUES ('{ay_id}', '{t_id}', '2024-2025', '2024-04-01', '2025-03-31', true, false, now(), now())
                """)
                print(f"✅ Created Academic Year: {ay_id}")

        # 2. Department
        cursor.execute(f"SELECT id FROM departments WHERE tenant_id = '{t_id}' LIMIT 1")
        dept_row = cursor.fetchone()
        if dept_row:
            dept_id = str(dept_row[0])
            print(f"✅ Department exists: {dept_id}")
        else:
            dept_id = str(uuid.uuid4())
            cursor.execute(f"""
                INSERT INTO departments (id, tenant_id, name, code, description, is_deleted, is_active, display_order, created_at, updated_at) 
                VALUES ('{dept_id}', '{t_id}', 'Academics', 'ACAD', 'Academic Department', false, true, 1, now(), now())
            """)
            print(f"✅ Created Department: {dept_id}")

        # 3. Grade Levels (Multiple)
        grades_data = [
            ('Grade 1', '1', 1),
            ('Grade 2', '2', 2),
            ('Grade 3', '3', 3),
            ('Grade 4', '4', 4),
            ('Grade 5', '5', 5),
            ('Grade 6', '6', 6),
            ('Grade 7', '7', 7),
            ('Grade 8', '8', 8),
            ('Grade 9', '9', 9),
            ('Grade 10', '10', 10),
        ]
        
        grade_ids = []
        cursor.execute(f"SELECT id, name FROM grade_levels WHERE tenant_id = '{t_id}'")
        existing_grades = {row[1]: str(row[0]) for row in cursor.fetchall()}
        
        for name, short_name, order in grades_data:
            if name in existing_grades:
                grade_ids.append(existing_grades[name])
            else:
                g_id = str(uuid.uuid4())
                cursor.execute(f"""
                    INSERT INTO grade_levels (id, tenant_id, department_id, name, short_name, display_order, description, is_active, is_deleted, created_at, updated_at) 
                    VALUES ('{g_id}', '{t_id}', '{dept_id}', '{name}', '{short_name}', {order}, '{name}', true, false, now(), now())
                """)
                grade_ids.append(g_id)
        
        print(f"✅ Grade Levels: {len(grade_ids)} available")

        # 4. Sections for each Grade
        section_ids = {}
        for g_id in grade_ids:
            for section_name in ['A', 'B']:
                cursor.execute(f"""
                    SELECT id FROM sections WHERE tenant_id = '{t_id}' AND grade_level_id = '{g_id}' AND name = '{section_name}' LIMIT 1
                """)
                s_row = cursor.fetchone()
                if s_row:
                    section_ids[f"{g_id}_{section_name}"] = str(s_row[0])
                else:
                    s_id = str(uuid.uuid4())
                    cursor.execute(f"""
                        INSERT INTO sections (id, tenant_id, grade_level_id, name, capacity, room_number, is_active, display_order, is_deleted, created_at, updated_at) 
                        VALUES ('{s_id}', '{t_id}', '{g_id}', '{section_name}', 40, 'Room {section_name}', true, 1, false, now(), now())
                    """)
                    section_ids[f"{g_id}_{section_name}"] = s_id
        
        print(f"✅ Sections: {len(section_ids)} available")

        # Get first section for enrollments
        first_section_key = list(section_ids.keys())[0] if section_ids else None
        first_section_id = section_ids[first_section_key] if first_section_key else None

        # 5. Students
        student_names = [
            ('Aarav', 'Sharma', 'M'),
            ('Priya', 'Patel', 'F'),
            ('Arjun', 'Kumar', 'M'),
            ('Ananya', 'Reddy', 'F'),
            ('Vihaan', 'Singh', 'M'),
            ('Aisha', 'Gupta', 'F'),
            ('Krishna', 'Nair', 'M'),
            ('Sara', 'Khan', 'F'),
            ('Rahul', 'Verma', 'M'),
            ('Neha', 'Joshi', 'F'),
            ('Dev', 'Rao', 'M'),
            ('Kavya', 'Mehta', 'F'),
            ('Rohan', 'Iyer', 'M'),
            ('Zara', 'Shah', 'F'),
            ('Aditya', 'Bhatt', 'M'),
        ]
        
        students_created = 0
        student_ids = []
        
        for i, (first_name, last_name, gender) in enumerate(student_names, 1):
            adm = f"S2024{str(i).zfill(3)}"
            cursor.execute(f"SELECT id FROM students WHERE tenant_id = '{t_id}' AND admission_number = '{adm}' LIMIT 1")
            existing = cursor.fetchone()
            
            if existing:
                student_ids.append(str(existing[0]))
            else:
                stu_id = str(uuid.uuid4())
                dob = f"2012-{str((i % 12) + 1).zfill(2)}-{str((i % 28) + 1).zfill(2)}"
                cursor.execute(f"""
                    INSERT INTO students (
                        id, tenant_id, admission_number, first_name, last_name, date_of_birth, 
                        gender, blood_group, email, phone, address, admission_date, 
                        father_name, father_phone, father_email, father_occupation, 
                        mother_name, mother_phone, mother_email, mother_occupation, 
                        guardian_name, guardian_phone, guardian_relation, family_id, 
                        is_active, notes, aadhar_number, aapar_number, pen_number,
                        is_deleted, created_at, updated_at
                    )
                    VALUES (
                        '{stu_id}', '{t_id}', '{adm}', '{first_name}', '{last_name}', '{dob}', 
                        '{gender}', 'O+', '', '9876543{str(i).zfill(3)}', '123 Demo Street', '2024-04-01', 
                        'Mr. {last_name}', '9876543{str(100+i).zfill(3)}', '', 'Business', 
                        'Mrs. {last_name}', '9876543{str(200+i).zfill(3)}', '', 'Teacher', 
                        '', '', '', '', 
                        true, '', '', '', '',
                        false, now(), now()
                    )
                """)
                student_ids.append(stu_id)
                students_created += 1
        
        print(f"✅ Students: {students_created} new, {len(student_ids) - students_created} existing")

        # 6. Student Enrollments
        if first_section_id:
            enrollments_created = 0
            section_keys = list(section_ids.keys())
            
            for i, stu_id in enumerate(student_ids):
                # Distribute students across sections
                section_key = section_keys[i % len(section_keys)]
                section_id = section_ids[section_key]
                
                cursor.execute(f"""
                    SELECT id FROM student_enrollments 
                    WHERE tenant_id = '{t_id}' AND student_id = '{stu_id}' AND academic_year_id = '{ay_id}' 
                    LIMIT 1
                """)
                if not cursor.fetchone():
                    enr_id = str(uuid.uuid4())
                    cursor.execute(f"""
                        INSERT INTO student_enrollments (
                            id, tenant_id, student_id, academic_year_id, section_id, 
                            roll_number, status, enrollment_date, is_deleted, created_at, updated_at, 
                            total_days, present_days, absent_days
                        )
                        VALUES (
                            '{enr_id}', '{t_id}', '{stu_id}', '{ay_id}', '{section_id}', 
                            '{i+1}', 'ACTIVE', '2024-04-01', false, now(), now(), 
                            180, 175, 5
                        )
                    """)
                    enrollments_created += 1
            
            print(f"✅ Enrollments: {enrollments_created} new")
        else:
            print("⚠️ No sections available for enrollments")

        # 7. Staff
        cursor.execute(f"SELECT COUNT(*) FROM staff WHERE tenant_id = '{t_id}'")
        staff_count = cursor.fetchone()[0]
        
        if staff_count == 0:
            staff_data = [
                ('EMP001', 'Ramesh', 'Kumar', 'TEACHER', 'PERMANENT'),
                ('EMP002', 'Sunita', 'Sharma', 'TEACHER', 'PERMANENT'),
                ('EMP003', 'Vijay', 'Menon', 'HOD', 'PERMANENT'),
                ('EMP004', 'Lakshmi', 'Rao', 'TEACHER', 'CONTRACT'),
                ('EMP005', 'Admin', 'User', 'ADMIN', 'PERMANENT'),
            ]
            
            for emp_id, first_name, last_name, designation, emp_type in staff_data:
                stf_id = str(uuid.uuid4())
                cursor.execute(f"""
                    INSERT INTO staff (
                        id, tenant_id, employee_id, first_name, last_name, designation, 
                        department_id, employment_type, joining_date, status, is_deleted, 
                        created_at, updated_at, experience_years
                    )
                    VALUES (
                        '{stf_id}', '{t_id}', '{emp_id}', '{first_name}', '{last_name}', '{designation}', 
                        '{dept_id}', '{emp_type}', '2024-01-01', 'ACTIVE', false, 
                        now(), now(), 5
                    )
                """)
            
            print(f"✅ Staff: {len(staff_data)} created")
        else:
            print(f"✅ Staff: {staff_count} existing")

        # 8. Fee Category
        cursor.execute(f"SELECT id FROM fee_categories WHERE tenant_id = '{t_id}' LIMIT 1")
        fc_row = cursor.fetchone()
        if not fc_row:
            fc_id = str(uuid.uuid4())
            cursor.execute(f"""
                INSERT INTO fee_categories (id, tenant_id, name, code, description, is_active, is_deleted, created_at, updated_at)
                VALUES ('{fc_id}', '{t_id}', 'Tuition Fee', 'TUIT', 'Tuition Fee Category', true, false, now(), now())
            """)
            print(f"✅ Fee Category created")
        else:
            print(f"✅ Fee Category exists")

    print("\n🏁 Demo Data Seeding Complete!")


def main():
    """Run all seeding in order."""
    print("=" * 60)
    print("NucleiQ Complete Demo Data Seeder")
    print("=" * 60)
    
    # First seed widgets (no tenant required)
    seed_widgets()
    
    # Then seed complete demo data
    seed_complete()
    
    print("\n" + "=" * 60)
    print("All seeding complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Restart your backend server")
    print("2. Refresh the frontend")
    print("3. Check Students, Enrollments, and Dashboard")


if __name__ == "__main__":
    main()
