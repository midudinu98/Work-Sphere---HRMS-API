import sqlite3

DATABASE_PATH = "worksphere.db"

connection = sqlite3.connect(DATABASE_PATH)

try:
    cursor = connection.cursor()

    cursor.execute("PRAGMA table_info(payroll)")
    columns = [row[1] for row in cursor.fetchall()]

    if not columns:
        print("Payroll table not found. Start the backend first.")
    elif "allowances" in columns:
        print("Allowances column already exists.")
    else:
        cursor.execute("ALTER TABLE payroll ""ADD COLUMN allowances NUMERIC(10, 2) ""NOT NULL DEFAULT 0")
        connection.commit()
        print("Allowances column added successfully.")

finally:
    connection.close()
