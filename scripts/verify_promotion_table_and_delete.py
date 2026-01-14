from django.db import connection, transaction
from django.db.utils import ProgrammingError
from students.models import Student
from uuid import UUID

def print_table_info():
    with connection.cursor() as c:
        print('\nColumns:')
        c.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = %s
            ORDER BY ordinal_position
        """, ['student_promotion_details'])
        for row in c.fetchall():
            print(row)

        print('\nConstraints:')
        try:
            c.execute("""
                SELECT conname, pg_get_constraintdef(oid) AS definition
                FROM pg_constraint
                WHERE conrelid = %s::regclass
            """, ['student_promotion_details'])
            for row in c.fetchall():
                print(row)
        except Exception as e:
            print('Error reading constraints:', e)

        print('\nIndexes:')
        c.execute("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = %s
        """, ['student_promotion_details'])
        for row in c.fetchall():
            print(row)


def try_delete(student_id_str):
    sid = UUID(student_id_str)
    print(f"\nAttempting delete for student {sid} inside rollback savepoint")
    try:
        student = Student.objects.get(id=sid)
    except Student.DoesNotExist:
        print('Student not found; skipping delete test')
        return

    try:
        with transaction.atomic():
            sid = transaction.savepoint()
            try:
                student.delete()
                print('Delete executed successfully inside savepoint (will rollback now)')
            except Exception as e:
                print('Delete raised exception:', type(e).__name__, str(e))
            finally:
                transaction.savepoint_rollback(sid)
                print('Rolled back savepoint; no changes persisted')
    except ProgrammingError as pe:
        print('ProgrammingError during delete attempt:', pe)


if __name__ == '__main__':
    print_table_info()
    # test ids from earlier error logs
    test_ids = [
        '91759434-fefd-4463-b6d9-3ade5996cba4',
        '3faa15a9-e71d-456d-8bb6-ee670a3771b8'
    ]
    for tid in test_ids:
        try_delete(tid)
