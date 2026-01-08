"""
Inventory URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ItemCategoryViewSet, VendorViewSet, ItemViewSet,
    PurchaseOrderViewSet, StockTransactionViewSet, InventoryOrderViewSet
)

router = DefaultRouter()
router.register(r'categories', ItemCategoryViewSet, basename='itemcategory')
router.register(r'vendors', VendorViewSet, basename='vendor')
router.register(r'items', ItemViewSet, basename='item')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchaseorder')
router.register(r'stock-transactions', StockTransactionViewSet, basename='stocktransaction')
router.register(r'orders', InventoryOrderViewSet, basename='inventoryorder')

urlpatterns = [
    path('', include(router.urls)),
]
