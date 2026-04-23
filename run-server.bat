@echo off
echo Starting Vialifecoach Academy Backend...
echo.

REM Force CommonJS mode for Node.js
set NODE_OPTIONS=
set NODE_ENV=development

REM Try different Node.js approaches
echo Attempt 1: Direct CommonJS...
node --input-type=commonjs src/server.js
if %ERRORLEVEL% EQU 0 (
    echo ✅ Server started successfully!
    goto end
)

echo Attempt 2: Legacy mode...
node --legacy-commonjs src/server.js
if %ERRORLEVEL% EQU 0 (
    echo ✅ Server started successfully!
    goto end
)

echo Attempt 3: Package reset...
node src/server.js
if %ERRORLEVEL% EQU 0 (
    echo ✅ Server started successfully!
    goto end
)

echo ❌ All attempts failed. Please check Node.js configuration.
pause

:end
echo Server process ended.
