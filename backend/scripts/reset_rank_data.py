import sqlite3
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

db_path = os.path.join(os.path.dirname(__file__), '..', 'lifeos.db')
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    sys.exit(1)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Reset courses mastery points and level
cur.execute("UPDATE courses SET mastery_points = 0, mastery_level = 1")
updated_courses = cur.rowcount
print(f"Reset {updated_courses} course(s) to 0 EXP, Level 1.")

# Reset any course nodes status to NOT_STARTED and progress to 0 if needed
cur.execute("UPDATE course_nodes SET status = 'NOT_STARTED', progress = 0.0")
updated_nodes = cur.rowcount
print(f"Reset {updated_nodes} course node(s) to NOT_STARTED, 0% progress.")

conn.commit()
conn.close()
print("Rank data reset successfully completed.")
