@echo off
echo [CET] Creating short-path venv for Windows LiteLLM...
python -m venv C:\tmp\cet-env
C:\tmp\cet-env\Scripts\pip install -r requirements.txt
echo [CET] Done. Start backend with:
echo   cd backend
echo   C:\tmp\cet-env\Scripts\uvicorn app.main:app --reload --port 8000
pause
