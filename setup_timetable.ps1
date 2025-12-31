# Timetable System Setup Script (PowerShell)

Write-Host "🚀 Setting up Timetable Management System..." -ForegroundColor Cyan

# Backend setup
Write-Host ""
Write-Host "📦 Backend Setup" -ForegroundColor Yellow
Write-Host "================"

Write-Host "1. Creating migrations..."
docker-compose exec backend python manage.py makemigrations timetable

Write-Host "2. Running migrations..."
docker-compose exec backend python manage.py migrate timetable

Write-Host "3. Collecting static files..."
docker-compose exec backend python manage.py collectstatic --noinput

# Frontend setup
Write-Host ""
Write-Host "🎨 Frontend Setup" -ForegroundColor Yellow
Write-Host "================="

Write-Host "1. Installing React DnD dependencies..."
Set-Location frontend
npm install react-dnd react-dnd-html5-backend
Set-Location ..

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Add routes to frontend/src/App.tsx:"
Write-Host "   - /timetable/builder → TimetableBuilder"
Write-Host "   - /timetable/teacher → TeacherView"
Write-Host "   - /timetable/class → ClassView"
Write-Host ""
Write-Host "2. Add navigation links to your sidebar/menu"
Write-Host ""
Write-Host "3. Restart the services:"
Write-Host "   docker-compose restart"
Write-Host ""
Write-Host "🎉 Your timetable system is ready to use!" -ForegroundColor Green
