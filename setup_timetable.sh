#!/bin/bash

# Timetable System Setup Script

echo "🚀 Setting up Timetable Management System..."

# Backend setup
echo ""
echo "📦 Backend Setup"
echo "================"

echo "1. Creating migrations..."
docker-compose exec backend python manage.py makemigrations timetable

echo "2. Running migrations..."
docker-compose exec backend python manage.py migrate timetable

echo "3. Collecting static files..."
docker-compose exec backend python manage.py collectstatic --noinput

# Frontend setup
echo ""
echo "🎨 Frontend Setup"
echo "================="

echo "1. Installing React DnD dependencies..."
cd frontend
npm install react-dnd react-dnd-html5-backend

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Add routes to frontend/src/App.tsx:"
echo "   - /timetable/builder → TimetableBuilder"
echo "   - /timetable/teacher → TeacherView"
echo "   - /timetable/class → ClassView"
echo ""
echo "2. Add navigation links to your sidebar/menu"
echo ""
echo "3. Restart the services:"
echo "   docker-compose restart"
echo ""
echo "🎉 Your timetable system is ready to use!"
