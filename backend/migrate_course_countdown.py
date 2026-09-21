import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "lifeos.db")

def migrate():
    if not os.path.exists(db_path):
        print(f"Database {db_path} does not exist yet. It will be created on startup.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check columns in courses table
    cursor.execute("PRAGMA table_info(courses)")
    columns = [row[1] for row in cursor.fetchall()]
    print("Current columns in courses:", columns)

    if "countdown_id" not in columns:
        print("Adding countdown_id column to courses table...")
        cursor.execute("ALTER TABLE courses ADD COLUMN countdown_id INTEGER REFERENCES countdowns(id) ON DELETE SET NULL")
        conn.commit()
        print("Successfully added countdown_id to courses table!")
    else:
        print("Column countdown_id already exists in courses table.")

    conn.close()

if __name__ == "__main__":
    migrate()
