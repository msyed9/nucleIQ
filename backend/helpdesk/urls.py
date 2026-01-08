"""
Helpdesk URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HelpdeskTicketViewSet, TicketCommentViewSet

router = DefaultRouter()
router.register(r'tickets', HelpdeskTicketViewSet, basename='helpdeskticket')
router.register(r'comments', TicketCommentViewSet, basename='ticketcomment')

urlpatterns = [
    path('', include(router.urls)),
]
