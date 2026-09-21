import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def post(url, data):
    req = urllib.request.Request(
        'http://127.0.0.1:8000' + url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    return json.loads(urllib.request.urlopen(req).read())

def get(url):
    return json.loads(urllib.request.urlopen('http://127.0.0.1:8000' + url).read())

def run_tests():
    print("=== STARTING END-TO-END VERIFICATION ===")

    # 1. Task Creation
    task = post('/api/tasks', {
        'title': 'Test Task Verification',
        'difficulty': 3,
        'priority': 'HIGH'
    })
    print(f"1. Task Created: ID={task['id']}, Title={task['title']}")
    assert task['status'] == 'TODO'

    # 2. Add subtasks
    sub1 = post(f"/api/tasks/{task['id']}/subtasks", {'title': 'Subtask 1: Đọc đề'})
    sub2 = post(f"/api/tasks/{task['id']}/subtasks", {'title': 'Subtask 2: Giải chi tiết'})
    print(f"2. Subtasks Added: '{sub1['title']}', '{sub2['title']}'")

    # 3. Task Transfer
    transfer_res = post(f"/api/tasks/{task['id']}/transfer", {
        'new_due_datetime': '2026-09-22T21:00:00Z',
        'keep_subtasks': True,
        'notes': 'Chuyển sang tuần sau'
    })
    old_task = transfer_res['old_task']
    new_task = transfer_res['new_task']
    print(f"3. Task Transfer:")
    print(f"   Old Task ID={old_task['id']} Status={old_task['status']}")
    print(f"   New Task ID={new_task['id']} Status={new_task['status']}, Transferred From={new_task['transferred_from_id']}")
    assert old_task['status'] == 'TRANSFERRED'
    assert new_task['status'] == 'TODO'
    assert new_task['transferred_from_id'] == task['id']

    # 4. Schedule Conflict Check
    conflict = post('/api/tasks/check-conflict', {
        'start_datetime': '2026-09-07T15:30:00Z',  # Monday afternoon during Math class
        'end_datetime': '2026-09-07T17:00:00Z'
    })
    print(f"4. Conflict Check: Has Conflict={conflict['has_conflict']}, Count={len(conflict['conflicts'])}")
    assert conflict['has_conflict'] is True

    # 5. Calendar Weekly & Monthly View
    weekly = get('/api/calendar/weekly')
    print(f"5. Calendar Weekly View: {len(weekly['days'])} days, Week={weekly['week_number']}")
    assert len(weekly['days']) == 7

    monthly = get('/api/calendar/monthly?year=2026&month=9')
    print(f"   Calendar Monthly View: Completed={monthly['total_completed']}, Completion Rate={monthly['completion_rate']}%")

    # 6. Dashboard Stats & Heatmap
    stats = get('/api/dashboard/stats')
    print(f"6. Dashboard Stats: Completed={stats['tasks_completed']}, Points={stats['total_difficulty_points']}, Streak={stats['current_streak']}")
    heatmap = get('/api/dashboard/heatmap')
    print(f"   Heatmap Days Count: {len(heatmap)}")

    # 7. Courses & Progress Aggregation
    courses = get('/api/courses')
    print(f"7. Courses List: {len(courses)} course(s), Overall Progress={courses[0]['overall_progress']}%")

    # 8. Global Search
    search_res = get('/api/search?q=Toan')
    print(f"8. Global Search for 'Toan': Found {len(search_res['tasks'])} tasks, {len(search_res['courses'])} courses, {len(search_res['projects'])} projects")

    # 9. Backup Creation
    backup = post('/api/settings/backup', {})
    print(f"9. Database Backup: Filename={backup['filename']}, Size={backup['file_size_bytes']} bytes")
    assert backup['file_size_bytes'] > 0

    print("=== ALL E2E VERIFICATIONS SUCCEEDED! ===")

if __name__ == '__main__':
    run_tests()
