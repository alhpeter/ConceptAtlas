@echo off
setlocal
cd /d "%~dp0"
if not exist .venv\Scripts\python.exe (
  echo Creating ConceptAtlas Python environment...
  py -3 -m venv .venv || python -m venv .venv
)
call .venv\Scripts\activate.bat
python -m pip install -r requirements.txt
if errorlevel 1 (
  echo.
  echo MarkItDown installation failed. Check your internet connection and Python installation.
  exit /b 1
)
if not exist node_modules (
  call npm install || exit /b 1
)
call npm run dev
endlocal
