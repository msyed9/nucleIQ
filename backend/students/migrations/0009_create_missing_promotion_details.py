from django.db import migrations

SQL = '''
CREATE TABLE IF NOT EXISTS "student_promotion_details" (
  "id" uuid NOT NULL PRIMARY KEY,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  "is_deleted" boolean NOT NULL,
  "deleted_at" timestamp with time zone NULL,
  "promotion_status" varchar(20) NOT NULL,
  "attendance_percentage" numeric(5, 2) NULL,
  "final_percentage" numeric(5, 2) NULL,
  "detention_reason" text NOT NULL,
  "remarks" text NOT NULL,
  "parent_notified" boolean NOT NULL,
  "parent_notified_at" timestamp with time zone NULL
);

-- Add FK columns without enforcing constraints if referenced tables missing
ALTER TABLE "student_promotion_details" ADD COLUMN IF NOT EXISTS "enrollment_from_id" uuid NULL;
ALTER TABLE "student_promotion_details" ADD COLUMN IF NOT EXISTS "enrollment_to_id" uuid NULL;
ALTER TABLE "student_promotion_details" ADD COLUMN IF NOT EXISTS "promotion_id" uuid NULL;
ALTER TABLE "student_promotion_details" ADD COLUMN IF NOT EXISTS "student_id" uuid NULL;

CREATE INDEX IF NOT EXISTS "student_promotion_details_created_at_a8fc47a6" ON "student_promotion_details" ("created_at");
CREATE INDEX IF NOT EXISTS "student_promotion_details_is_deleted_2776f9d1" ON "student_promotion_details" ("is_deleted");
CREATE INDEX IF NOT EXISTS "student_promotion_details_enrollment_from_id_15dacb25" ON "student_promotion_details" ("enrollment_from_id");
CREATE INDEX IF NOT EXISTS "student_promotion_details_enrollment_to_id_34156e4e" ON "student_promotion_details" ("enrollment_to_id");
CREATE INDEX IF NOT EXISTS "student_promotion_details_promotion_id_73500653" ON "student_promotion_details" ("promotion_id");
CREATE INDEX IF NOT EXISTS "student_promotion_details_student_id_69e4eea0" ON "student_promotion_details" ("student_id");
'''


def forwards(apps, schema_editor):
    schema_editor.execute(SQL)


def backwards(apps, schema_editor):
    schema_editor.execute('DROP TABLE IF EXISTS "student_promotion_details"')


class Migration(migrations.Migration):

    dependencies = [
        ('students', '0008_historicalstudent_caste_and_more'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
