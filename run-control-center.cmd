@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0control-center"
call npm run dev
