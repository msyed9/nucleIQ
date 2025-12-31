from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HabitViewSet, StudentHabitLogViewSet

router = DefaultRouter()
router.register(r'habits', HabitViewSet)
router.register(r'logs', StudentHabitLogViewSet)

urlpatterns = [path('', include(router.urls))]
