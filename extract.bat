@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

if "%~1"=="" (
    echo ========================================================
    echo   SMP GeoGebra → TikZ Extractor (Offline Batch Tool)
    echo ========================================================
    echo.
    echo Hướng dẫn:
    echo.
    echo Cách 1: Kéo thả file .ggb bất kỳ vào file batch (extract.bat) này.
    echo.
    echo Cách 2: Chạy lệnh sau trong Terminal:
    echo   extract.bat [tên_file.ggb]
    echo.
    echo ========================================================
    echo.
    pause
    exit /b
)

echo [*] Đang xử lý file: %~nx1
python "%~dp0tools\extract_ggb.py" "%~1"
if %errorlevel% neq 0 (
    echo [-] Đã có lỗi xảy ra trong quá trình trích xuất.
) else (
    echo [+] Đã trích xuất xong! Bạn có thể copy đoạn code TikZ ở trên.
)
echo.
pause
