@echo off
REM Installs dependencies and runs backend + frontend in this one terminal.
setlocal
set ROOT=%~dp0

REM --- backend setup ---
cd /d "%ROOT%backend"
if not exist venv (
  echo ^>^> Creating Python virtual environment
  python -m venv venv || goto :fail
)
echo ^>^> Installing backend dependencies
venv\Scripts\python.exe -m pip install -q -r requirements.txt || goto :fail


REM --- frontend setup ---
cd /d "%ROOT%frontend"
echo ^>^> Installing frontend dependencies
call npm install --silent || goto :fail

REM --- run both ---
cd /d "%ROOT%"
echo ^>^> Starting backend on http://localhost:5000
powershell -NoProfile -Command "$p = Start-Process -FilePath '%ROOT%backend\venv\Scripts\python.exe' -ArgumentList 'app.py' -WorkingDirectory '%ROOT%backend' -NoNewWindow -PassThru; $p.Id | Out-File -Encoding ascii '%ROOT%backend.pid'"

cd /d "%ROOT%frontend"
echo ^>^> Starting frontend on http://localhost:5173 (Ctrl+C stops it)
call npm run dev

REM --- cleanup backend when frontend exits ---
echo ^>^> Stopping backend
set /p BPID=<"%ROOT%backend.pid"
taskkill /f /t /pid %BPID% >nul 2>&1
del "%ROOT%backend.pid" >nul 2>&1
exit /b 0

:fail
echo !! Setup failed. See the error above.
pause
exit /b 1
