"""
Payroll URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SalaryComponentViewSet, SalaryStructureViewSet,
    PayrollCycleViewSet, PayslipViewSet
)

router = DefaultRouter()
router.register(r'components', SalaryComponentViewSet, basename='salarycomponent')
router.register(r'structures', SalaryStructureViewSet, basename='salarystructure')
router.register(r'cycles', PayrollCycleViewSet, basename='payrollcycle')
router.register(r'payslips', PayslipViewSet, basename='payslip')

urlpatterns = [
    path('', include(router.urls)),
]
