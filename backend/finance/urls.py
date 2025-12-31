"""
URL Configuration for Finance
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LedgerAccountViewSet, JournalEntryViewSet, PettyCashRequestViewSet,
    VendorPaymentViewSet, SalaryPaymentViewSet, FinancialReportsViewSet
)

router = DefaultRouter()
router.register(r'accounts', LedgerAccountViewSet, basename='ledger-account')
router.register(r'journal-entries', JournalEntryViewSet, basename='journal-entry')
router.register(r'petty-cash', PettyCashRequestViewSet, basename='petty-cash')
router.register(r'vendor-payments', VendorPaymentViewSet, basename='vendor-payment')
router.register(r'salary-payments', SalaryPaymentViewSet, basename='salary-payment')
router.register(r'reports', FinancialReportsViewSet, basename='financial-reports')

urlpatterns = [
    path('', include(router.urls)),
]
