"""
Search Index Migration for PostgreSQL Full-Text Search
Adds trigram extension and GIN indexes for efficient text search
"""

from django.db import migrations


class Migration(migrations.Migration):
    """
    Migration to add PostgreSQL extensions and indexes for full-text search.
    
    Creates:
    - pg_trgm extension for fuzzy/similarity matching
    - GIN indexes on searchable tables for performance
    """
    
    dependencies = [
        ('search', '0001_initial'),  # Assumes search app has initial migration
    ]
    
    operations = [
        # Enable trigram extension for fuzzy matching
        migrations.RunSQL(
            sql="CREATE EXTENSION IF NOT EXISTS pg_trgm;",
            reverse_sql="DROP EXTENSION IF EXISTS pg_trgm;",
        ),
        
        # Student search index
        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS students_fts_idx ON students USING GIN(
                to_tsvector('english', 
                    COALESCE(first_name, '') || ' ' || 
                    COALESCE(last_name, '') || ' ' || 
                    COALESCE(admission_number, '') || ' ' ||
                    COALESCE(email, '') || ' ' ||
                    COALESCE(phone, '')
                )
            );
            """,
            reverse_sql="DROP INDEX IF EXISTS students_fts_idx;",
        ),
        
        # Student trigram index for fuzzy matching
        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS students_trgm_idx ON students USING GIN(
                (first_name || ' ' || last_name) gin_trgm_ops
            );
            """,
            reverse_sql="DROP INDEX IF EXISTS students_trgm_idx;",
        ),
        
        # Staff search index
        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS staff_fts_idx ON staff USING GIN(
                to_tsvector('english', 
                    COALESCE(first_name, '') || ' ' || 
                    COALESCE(last_name, '') || ' ' || 
                    COALESCE(employee_id, '') || ' ' ||
                    COALESCE(email, '') || ' ' ||
                    COALESCE(phone, '')
                )
            );
            """,
            reverse_sql="DROP INDEX IF EXISTS staff_fts_idx;",
        ),
        
        # Staff trigram index
        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS staff_trgm_idx ON staff USING GIN(
                (first_name || ' ' || last_name) gin_trgm_ops
            );
            """,
            reverse_sql="DROP INDEX IF EXISTS staff_trgm_idx;",
        ),
        
        # Library books search index
        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS library_books_fts_idx ON library_books USING GIN(
                to_tsvector('english', 
                    COALESCE(title, '') || ' ' || 
                    COALESCE(author, '') || ' ' || 
                    COALESCE(isbn, '') || ' ' ||
                    COALESCE(description, '')
                )
            );
            """,
            reverse_sql="DROP INDEX IF EXISTS library_books_fts_idx;",
        ),
        
        # Fee invoices search index (by invoice number and student name via join)
        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS fee_invoices_fts_idx ON fee_invoices USING GIN(
                to_tsvector('english', 
                    COALESCE(invoice_number, '')
                )
            );
            """,
            reverse_sql="DROP INDEX IF EXISTS fee_invoices_fts_idx;",
        ),
        
        # Exams search index
        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS exams_fts_idx ON exams USING GIN(
                to_tsvector('english', 
                    COALESCE(name, '')
                )
            );
            """,
            reverse_sql="DROP INDEX IF EXISTS exams_fts_idx;",
        ),
    ]
