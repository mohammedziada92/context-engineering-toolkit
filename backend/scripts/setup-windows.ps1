Write-Host "[CET] Creating short-path venv..." -ForegroundColor Cyan
python -m venv C:\tmp\cet-env
C:\tmp\cet-env\Scripts\pip install -r requirements.txt
Write-Host "[CET] Start with: C:\tmp\cet-env\Scripts\uvicorn app.main:app --reload" -ForegroundColor Green
