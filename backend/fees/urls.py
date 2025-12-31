"""
URL Configuration for Fees
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FeeCategoryViewSet, FeeStructureViewSet, FeeAllocationViewSet,
    FeeInvoiceViewSet, FeeTransactionViewSet, FeeDefaulterViewSet,
    SiblingDiscountViewSet
)

router = DefaultRouter()
router.register(r'categories', FeeCategoryViewSet, basename='fee-category')
router.register(r'structures', FeeStructureViewSet, basename='fee-structure')
router.register(r'allocations', FeeAllocationViewSet, basename='fee-allocation')
router.register(r'invoices', FeeInvoiceViewSet, basename='fee-invoice')
router.register(r'transactions', FeeTransactionViewSet, basename='fee-transaction')
router.register(r'defaulters', FeeDefaulterViewSet, basename='fee-defaulter')
router.register(r'sibling-discounts', SiblingDiscountViewSet, basename='sibling-discount')

urlpatterns = [
    path('', include(router.urls)),
]
