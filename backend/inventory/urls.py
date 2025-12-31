"""
Inventory URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ItemViewSet, StockTransactionViewSet, InventoryOrderViewSet

router = DefaultRouter()
router.register(r'items', ItemViewSet)

router.register(r'transactions', StockTransactionViewSet)
router.register(r'orders', InventoryOrderViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
