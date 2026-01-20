import psycopg2
import os
from decouple import config

try:
    conn = psycopg2.connect(
        dbname=config('DB_NAME', default='nucleiq'),
        user=config('DB_USER', default='nucleiq_user'),
        password=config('DB_PASSWORD', default='nucleiq_pass_dev_only'),
        host=config('DB_HOST', default='localhost'),
        port=config('DB_PORT', default='5432'),
        connect_timeout=3
    )
    print("Successfully connected to the database!")
    conn.close()
except Exception as e:
    print(f"Error connecting to the database: {e}")
