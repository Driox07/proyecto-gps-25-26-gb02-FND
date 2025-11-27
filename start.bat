@echo off
cd .venv
cd Scripts
call activate.bat
cd ..
cd ..
python frontend.py
exit