import os
import django

os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.dev"
django.setup()

from django.db import connection

sqls = [
    # Add foreign key from parent_users to users
    """ALTER TABLE parent_users ADD CONSTRAINT parent_users_user_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) DEFERRABLE INITIALLY DEFERRED""",
    
    # Add foreign key from parent_users to tenants
    """ALTER TABLE parent_users ADD CONSTRAINT parent_users_tenant_id_fk 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) DEFERRABLE INITIALLY DEFERRED""",
    
    # Add unique constraint on user_id
    """ALTER TABLE parent_users ADD CONSTRAINT parent_users_user_id_unique UNIQUE (user_id)""",
    
    # Add foreign keys for parent_users_students
    """ALTER TABLE parent_users_students ADD CONSTRAINT parent_users_students_parent_fk 
    FOREIGN KEY (parentuser_id) REFERENCES parent_users(id) DEFERRABLE INITIALLY DEFERRED""",
    
    """ALTER TABLE parent_users_students ADD CONSTRAINT parent_users_students_student_fk 
    FOREIGN KEY (student_id) REFERENCES students(id) DEFERRABLE INITIALLY DEFERRED""",
    
    # Add unique constraint to prevent duplicate links
    """ALTER TABLE parent_users_students ADD CONSTRAINT parent_users_students_unique 
    UNIQUE (parentuser_id, student_id)""",
]

try:
    with connection.cursor() as cursor:
        for i, sql in enumerate(sqls, 1):
            try:
                cursor.execute(sql)
                print(f"{i}. Executed successfully")
            except Exception as e:
                print(f"{i}. Error (might already exist): {str(e)[:100]}")
    print("DONE!")
except Exception as e:
    print(f"ERROR: {e}")