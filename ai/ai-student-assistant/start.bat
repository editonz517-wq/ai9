@echo off
echo ==========================================
echo   AI Student Assistant - Запуск сервера
echo ==========================================

cd server

IF NOT EXIST ".env" (
    echo [!] Файл .env не найден!
    echo [!] Скопируй .env.example в .env и заполни API ключ
    echo.
    copy .env.example .env
    echo [+] Файл .env создан. Открой его и вставь свой AI_API_KEY
    pause
    exit
)

IF NOT EXIST "node_modules" (
    echo [+] Устанавливаю зависимости...
    npm install
)

echo [+] Запускаю сервер...
echo [+] Открой браузер: http://localhost:5000
echo [+] Для остановки нажми Ctrl+C
echo.
node server.js
pause
