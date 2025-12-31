from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HelpdeskTicketViewSet

router = DefaultRouter()
router.register(r'tickets', HelpdeskTicketViewSet)

urlpatterns = [path('', include(router.urls))]
