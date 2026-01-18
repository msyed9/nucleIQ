"""
URL Configuration for Staff
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StaffViewSet,
    StaffDocumentViewSet,
    StaffAttendanceViewSet,
    StaffLeaveViewSet,
    StaffHealthProfileViewSet,
    StaffMedicalHistoryViewSet,
    StaffMedicalCheckupViewSet,
    StaffVaccinationViewSet,
    StaffInjuryReportViewSet,
    TrainingProgramViewSet,
    TrainingEnrollmentViewSet,
    TrainingFeedbackViewSet,
    AppraisalCycleViewSet,
    StaffAppraisalViewSet,
    StaffGoalViewSet,
    generate_qr_token,
    verify_qr_token,
)

router = DefaultRouter()
router.register(r'staff', StaffViewSet, basename='staff')
router.register(r'documents', StaffDocumentViewSet, basename='staff-document')
router.register(r'attendance', StaffAttendanceViewSet, basename='staff-attendance')
router.register(r'leaves', StaffLeaveViewSet, basename='staff-leave')
router.register(r'health-profiles', StaffHealthProfileViewSet, basename='staff-health-profile')
router.register(r'medical-history', StaffMedicalHistoryViewSet, basename='staff-medical-history')
router.register(r'medical-checkups', StaffMedicalCheckupViewSet, basename='staff-medical-checkup')
router.register(r'vaccinations', StaffVaccinationViewSet, basename='staff-vaccination')
router.register(r'injury-reports', StaffInjuryReportViewSet, basename='staff-injury-report')
router.register(r'training-programs', TrainingProgramViewSet, basename='training-program')
router.register(r'training-enrollments', TrainingEnrollmentViewSet, basename='training-enrollment')
router.register(r'training-feedbacks', TrainingFeedbackViewSet, basename='training-feedback')
router.register(r'appraisal-cycles', AppraisalCycleViewSet, basename='appraisal-cycle')
router.register(r'appraisals', StaffAppraisalViewSet, basename='staff-appraisal')
router.register(r'goals', StaffGoalViewSet, basename='staff-goal')

urlpatterns = [
    # QR-Based Staff Attendance endpoints
    path('attendance/generate-qr-token/', generate_qr_token, name='staff-generate-qr-token'),
    path('attendance/verify-qr/', verify_qr_token, name='staff-verify-qr'),
    # Router URLs (includes all viewset routes)
    path('', include(router.urls)),
]

