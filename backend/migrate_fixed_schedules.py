import sqlite3

def migrate():
    conn = sqlite3.connect('backend/lifeos.db')
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(fixed_schedules)")
    columns = [col[1] for col in cursor.fetchall()]
    print("Current columns:", columns)
    
    if 'icon' not in columns:
        cursor.execute("ALTER TABLE fixed_schedules ADD COLUMN icon VARCHAR(20) DEFAULT '📌'")
        conn.commit()
        print("Successfully added 'icon' column to fixed_schedules table.")
    else:
        print("'icon' column already exists.")
        
    conn.close()

if __name__ == "__main__":
    migrate()
