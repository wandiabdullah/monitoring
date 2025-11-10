@echo off
echo ========================================
echo   Alert UI Quick Fix Script
echo ========================================
echo.

echo [1/4] Checking container status...
docker-compose -f docker-compose.ssl.yml ps
echo.

echo [2/4] Restarting container...
docker-compose -f docker-compose.ssl.yml restart backend
echo.

echo [3/4] Waiting for backend to start (10 seconds)...
timeout /t 10 /nobreak > nul
echo.

echo [4/4] Checking if backend is ready...
docker-compose -f docker-compose.ssl.yml logs backend | findstr "Running on"
echo.

echo ========================================
echo   Files Check
echo ========================================
echo.

echo Checking if alertsView exists in HTML...
docker-compose -f docker-compose.ssl.yml exec -T backend grep -c "id=\"alertsView\"" /app/dashboard/dashboard.html
echo.

echo Checking if showAlertsView exists in JS...
docker-compose -f docker-compose.ssl.yml exec -T backend grep -c "function showAlertsView" /app/dashboard/dashboard.js
echo.

echo ========================================
echo   API Test
echo ========================================
echo.

echo Testing alert config API...
curl -k https://eyes.indoinfinite.com/api/alerts/config
echo.
echo.

echo ========================================
echo   NEXT STEPS
echo ========================================
echo.
echo 1. Open browser
echo 2. Press: Ctrl + Shift + Delete
echo 3. Clear "Cached images and files" (All time)
echo 4. Close browser completely
echo 5. Reopen browser
echo 6. Go to: https://eyes.indoinfinite.com
echo 7. Login
echo 8. Press F12 (open DevTools)
echo 9. Click "Alert Settings" menu
echo 10. Check Console tab for [DEBUG] messages
echo.
echo If still not working:
echo - Open: https://eyes.indoinfinite.com/static/alert-ui-test.html
echo - Run all tests
echo - Check which tests fail
echo.

pause
