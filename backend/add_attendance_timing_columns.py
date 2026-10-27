import sqlite3

DATABASE_PATH = "worksphere.db"

connection = sqlite3.connect(DATABASE_PATH)

try:
    cursor = connection.cursor()

    cursor.execute("PRAGMA table_info(attendance)")
    existing_columns = {row[1] for row in cursor.fetchall()}

    if "late_minutes" not in existing_columns:
        cursor.execute("ALTER TABLE attendance ""ADD COLUMN late_minutes INTEGER NOT NULL DEFAULT 0")
        print("Added late_minutes column")

    if "early_checkout_minutes" not in existing_columns:
        cursor.execute("ALTER TABLE attendance ""ADD COLUMN early_checkout_minutes INTEGER NOT NULL DEFAULT 0")
        print("Added early_checkout_minutes column")

    connection.commit()
    print("Attendance database update completed.")

finally:
    connection.close()
