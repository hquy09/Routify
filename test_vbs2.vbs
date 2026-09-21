Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "c:\Users\Huu Quy\Pictures\lifeos\backend"
WshShell.Run "cmd /c python -m uvicorn app.main:app --host 127.0.0.1 --port 8000", 0, False
WshShell.CurrentDirectory = "c:\Users\Huu Quy\Pictures\lifeos\frontend"
WshShell.Run "cmd /c npm run dev", 0, False
