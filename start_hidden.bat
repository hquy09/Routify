@echo off
title LifeOS - Khoi dong chay an

:: ====================================================================
::                   LIFEOS - KHOI DONG AN TOAN BO CMD
:: ====================================================================

set "ROOT_DIR=%~dp0"
set "PYW_CMD=pythonw"

:: Uu tien virtualenv neu co
if exist "%ROOT_DIR%backend\.venv\Scripts\pythonw.exe" set "PYW_CMD=%ROOT_DIR%backend\.venv\Scripts\pythonw.exe"
if exist "%ROOT_DIR%.venv\Scripts\pythonw.exe" set "PYW_CMD=%ROOT_DIR%.venv\Scripts\pythonw.exe"

:: Khoi dong qua pythonw de an hoan toan 100% cua so CMD
start "" "%PYW_CMD%" "%ROOT_DIR%run_silent.py"

exit /b
