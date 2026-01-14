from django.db import connection

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

ALTER TABLE "student_promotion_details" ADD COLUMN IF NOT EXISTS "enrollment_from_id" uuid NOT NULL
  CONSTRAINT "student_promotion_de_enrollment_from_id_15dacb25_fk_student_e"
  REFERENCES "student_enrollments"("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "student_promotion_details" ADD COLUMN IF NOT EXISTS "enrollment_to_id" uuid NULL
  CONSTRAINT "student_promotion_de_enrollment_to_id_34156e4e_fk_student_e"
  REFERENCES "student_enrollments"("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "student_promotion_details" ADD COLUMN IF NOT EXISTS "promotion_id" uuid NOT NULL
  CONSTRAINT "student_promotion_de_promotion_id_73500653_fk_student_p"
  REFERENCES "student_promotions"("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "student_promotion_details" ADD COLUMN IF NOT EXISTS "student_id" uuid NOT NULL
  CONSTRAINT "student_promotion_details_student_id_69e4eea0_fk_students_id"
  REFERENCES "students"("id") DEFERRABLE INITIALLY DEFERRED;

CREATE INDEX IF NOT EXISTS "student_promotion_details_created_at_a8fc47a6" ON "student_promotion_details" ("created_at");
CREATE INDEX IF NOT EXISTS "student_promotion_details_is_deleted_2776f9d1" ON "student_promotion_details" ("is_deleted");
CREATE INDEX IF NOT EXISTS "student_promotion_details_enrollment_from_id_15dacb25" ON "student_promotion_details" ("enrollment_from_id");
CREATE INDEX IF NOT EXISTS "student_promotion_details_enrollment_to_id_34156e4e" ON "student_promotion_details" ("enrollment_to_id");
CREATE INDEX IF NOT EXISTS "student_promotion_details_promotion_id_73500653" ON "student_promotion_details" ("promotion_id");
CREATE INDEX IF NOT EXISTS "student_promotion_details_student_id_69e4eea0" ON "student_promotion_details" ("student_id");
'''


def run():
    with connection.cursor() as c:
        # Execute statements one by one to avoid driver limitations
        for stmt in SQL.split(';'):
            stmt = stmt.strip()
            if not stmt:
                continue
            try:
                c.execute(stmt)
                print('Executed:', stmt.split('\n',1)[0])
            except Exception as e:
                print('Failed statement:', stmt.split('\n',1)[0])
                print('Error:', e)

if __name__ == '__main__':
    run()
