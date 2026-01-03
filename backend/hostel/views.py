"""
Hostel Views - Phase 5 Complete
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q, Avg, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from core.middleware import get_current_tenant

from .models import (
    HostelBuilding, Room, Bed, HostelAllocation,
    HostelFeeStructure, HostelFeePayment,
    HostelAttendance, HostelGatePass,
    HostelComplaint, MaintenanceSchedule,
    MessRegistration, MessMenu, MessAttendance
)

from .serializers import (
    HostelBuildingSerializer, HostelBuildingDetailSerializer, 
    RoomSerializer, BedSerializer, HostelAllocationSerializer,
    HostelFeeStructureSerializer, HostelFeePaymentSerializer,
    HostelAttendanceSerializer, HostelGatePassSerializer,
    HostelComplaintSerializer, MaintenanceScheduleSerializer,
    MessRegistrationSerializer, MessMenuSerializer, MessAttendanceSerializer
)


# Phase 5.1: Infrastructure ViewSets
class HostelBuildingViewSet(viewsets.ModelViewSet):
    queryset = HostelBuilding.objects.all()
    serializer_class = HostelBuildingSerializer
    
    def get_queryset(self):
        return HostelBuilding.objects.filter(tenant=get_current_tenant())
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return HostelBuildingDetailSerializer
        return HostelBuildingSerializer
    
    @action(detail=True, methods=['get'])
    def rooms(self, request, pk=None):
        """Get all rooms in a building"""
        building = self.get_object()
        rooms = building.rooms.all()
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get building statistics"""
        building = self.get_object()
        
        total_rooms = building.rooms.count()
        total_beds = sum(room.capacity for room in building.rooms.all())
        occupied_beds = building.rooms.aggregate(
            occupied=Count('beds', filter=Q(beds__is_occupied=True))
        )['occupied'] or 0
        
        return Response({
            'total_rooms': total_rooms,
            'total_beds': total_beds,
            'occupied_beds': occupied_beds,
            'available_beds': total_beds - occupied_beds,
            'occupancy_percentage': (occupied_beds / total_beds * 100) if total_beds > 0 else 0,
        })


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    
    def get_queryset(self):
        queryset = Room.objects.filter(tenant=get_current_tenant())
        
        # Filter by building
        building_id = self.request.query_params.get('building')
        if building_id:
            queryset = queryset.filter(building_id=building_id)
        
        # Filter by availability
        available = self.request.query_params.get('available')
        if available == 'true':
            queryset = queryset.filter(is_available=True, beds__is_occupied=False).distinct()
        
        # Filter by floor
        floor = self.request.query_params.get('floor')
        if floor:
            queryset = queryset.filter(floor=floor)
        
        return queryset.select_related('building').prefetch_related('beds')
    
    @action(detail=True, methods=['post'])
    def create_beds(self, request, pk=None):
        """Auto-create beds for a room based on capacity"""
        room = self.get_object()
        capacity = room.capacity
        
        # Clear existing beds if any
        room.beds.all().delete()
        
        # Create beds with labels A, B, C, D, etc.
        for i in range(capacity):
            bed_number = chr(65 + i)  # A=65 in ASCII
            Bed.objects.create(
                room=room,
                bed_number=bed_number,
                tenant=room.tenant
            )
        
        return Response({
            'message': f'{capacity} beds created successfully',
            'room': RoomSerializer(room).data
        })


class BedViewSet(viewsets.ModelViewSet):
    queryset = Bed.objects.all()
    serializer_class = BedSerializer
    
    def get_queryset(self):
        queryset = Bed.objects.filter(tenant=get_current_tenant())
        
        # Filter by room
        room_id = self.request.query_params.get('room')
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        
        # Filter by availability
        available = self.request.query_params.get('available')
        if available == 'true':
            queryset = queryset.filter(is_occupied=False)
        
        return queryset.select_related('room__building')


# Phase 5.2: Allocation ViewSet
class HostelAllocationViewSet(viewsets.ModelViewSet):
    queryset = HostelAllocation.objects.all()
    serializer_class = HostelAllocationSerializer
    
    def get_queryset(self):
        queryset = HostelAllocation.objects.filter(tenant=get_current_tenant())
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active == 'true':
            queryset = queryset.filter(is_active=True)
        
        # Filter by student
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        # Filter by building
        building_id = self.request.query_params.get('building')
        if building_id:
            queryset = queryset.filter(bed__room__building_id=building_id)
        
        return queryset.select_related('student', 'bed__room__building')
    
    @action(detail=True, methods=['post'])
    def transfer(self, request, pk=None):
        """Transfer student to a different bed"""
        allocation = self.get_object()
        new_bed_id = request.data.get('new_bed_id')
        reason = request.data.get('reason', '')
        
        try:
            new_bed = Bed.objects.get(id=new_bed_id, tenant=get_current_tenant())
            
            if new_bed.is_occupied:
                return Response(
                    {'error': 'New bed is already occupied'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Save previous bed
            old_bed = allocation.bed
            allocation.previous_bed = old_bed
            allocation.transfer_date = timezone.now().date()
            allocation.transfer_reason = reason
            
            # Free old bed
            old_bed.is_occupied = False
            old_bed.save()
            
            # Allocate new bed
            allocation.bed = new_bed
            new_bed.is_occupied = True
            new_bed.save()
            
            allocation.save()
            
            return Response({
                'message': 'Transfer completed successfully',
                'allocation': HostelAllocationSerializer(allocation).data
            })
            
        except Bed.DoesNotExist:
            return Response(
                {'error': 'Bed not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def vacate(self, request, pk=None):
        """Vacate student from hostel"""
        allocation = self.get_object()
        end_date = request.data.get('end_date', timezone.now().date())
        
        allocation.is_active = False
        allocation.end_date = end_date
        allocation.save()
        
        # Free bed
        allocation.bed.is_occupied = False
        allocation.bed.save()
        
        return Response({
            'message': 'Student vacated successfully',
            'allocation': HostelAllocationSerializer(allocation).data
        })
    
    @action(detail=False, methods=['post'])
    def auto_allocate(self, request):
        """Auto-allocate student to available bed"""
        student_id = request.data.get('student_id')
        building_id = request.data.get('building_id')
        gender_preference = request.data.get('gender_preference')  # 'BOYS' or 'GIRLS'
        
        # Find available beds
        available_beds = Bed.objects.filter(
            tenant=get_current_tenant(),
            is_occupied=False,
            room__is_available=True,
            room__building__is_active=True
        )
        
        if building_id:
            available_beds = available_beds.filter(room__building_id=building_id)
        
        if gender_preference:
            available_beds = available_beds.filter(room__building__building_type=gender_preference)
        
        # Prefer rooms with lower occupancy for better distribution
        available_beds = available_beds.select_related('room__building').order_by('room__beds__is_occupied')
        
        if not available_beds.exists():
            return Response(
                {'error': 'No available beds found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Allocate first available bed
        bed = available_beds.first()
        
        from students.models import Student
        try:
            student = Student.objects.get(id=student_id, tenant=get_current_tenant())
            
            allocation = HostelAllocation.objects.create(
                student=student,
                bed=bed,
                start_date=timezone.now().date(),
                is_active=True,
                tenant=get_current_tenant()
            )
            
            return Response({
                'message': 'Auto-allocation successful',
                'allocation': HostelAllocationSerializer(allocation).data
            }, status=status.HTTP_201_CREATED)
            
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )


# Phase 5.3: Fee ViewSets
class HostelFeeStructureViewSet(viewsets.ModelViewSet):
    queryset = HostelFeeStructure.objects.all()
    serializer_class = HostelFeeStructureSerializer
    
    def get_queryset(self):
        queryset = HostelFeeStructure.objects.filter(tenant=get_current_tenant())
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active == 'true':
            queryset = queryset.filter(is_active=True)
        
        # Filter by academic year
        academic_year_id = self.request.query_params.get('academic_year')
        if academic_year_id:
            queryset = queryset.filter(academic_year_id=academic_year_id)
        
        return queryset.select_related('academic_year')


class HostelFeePaymentViewSet(viewsets.ModelViewSet):
    queryset = HostelFeePayment.objects.all()
    serializer_class = HostelFeePaymentSerializer
    
    def get_queryset(self):
        queryset = HostelFeePayment.objects.filter(tenant=get_current_tenant())
        
        # Filter by allocation
        allocation_id = self.request.query_params.get('allocation')
        if allocation_id:
            queryset = queryset.filter(allocation_id=allocation_id)
        
        # Filter by student
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(allocation__student_id=student_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(payment_date__range=[start_date, end_date])
        
        return queryset.select_related('allocation__student', 'fee_structure')
    
    @action(detail=False, methods=['get'])
    def pending_payments(self, request):
        """Get students with pending payments"""
        current_month = timezone.now().date().replace(day=1)
        
        # Get all active allocations
        active_allocations = HostelAllocation.objects.filter(
            tenant=get_current_tenant(),
            is_active=True
        )
        
        pending_list = []
        
        for allocation in active_allocations:
            # Check if payment exists for current month
            payment_exists = HostelFeePayment.objects.filter(
                allocation=allocation,
                payment_month=current_month
            ).exists()
            
            if not payment_exists:
                pending_list.append({
                    'allocation_id': allocation.id,
                    'student_id': allocation.student.id,
                    'student_name': allocation.student.get_full_name(),
                    'admission_number': allocation.student.admission_number,
                    'room': str(allocation.bed.room),
                    'pending_month': current_month.strftime('%B %Y'),
                })
        
        return Response(pending_list)


# Phase 5.4: Attendance & Gate Pass ViewSets
class HostelAttendanceViewSet(viewsets.ModelViewSet):
    queryset = HostelAttendance.objects.all()
    serializer_class = HostelAttendanceSerializer
    
    def get_queryset(self):
        queryset = HostelAttendance.objects.filter(tenant=get_current_tenant())
        
        # Filter by date
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        
        # Filter by allocation
        allocation_id = self.request.query_params.get('allocation')
        if allocation_id:
            queryset = queryset.filter(allocation_id=allocation_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(date__range=[start_date, end_date])
        
        return queryset.select_related('allocation__student')
    
    @action(detail=False, methods=['post'])
    def mark_bulk_attendance(self, request):
        """Mark attendance for multiple students"""
        date = request.data.get('date', timezone.now().date())
        attendance_data = request.data.get('attendance', [])
        
        created_count = 0
        
        for item in attendance_data:
            allocation_id = item.get('allocation_id')
            morning_status = item.get('morning_status', 'PRESENT')
            evening_status = item.get('evening_status', 'PRESENT')
            night_status = item.get('night_status', 'PRESENT')
            
            HostelAttendance.objects.update_or_create(
                allocation_id=allocation_id,
                date=date,
                tenant=get_current_tenant(),
                defaults={
                    'morning_status': morning_status,
                    'evening_status': evening_status,
                    'night_status': night_status,
                }
            )
            created_count += 1
        
        return Response({
            'message': f'Attendance marked for {created_count} students',
            'date': date
        })


class HostelGatePassViewSet(viewsets.ModelViewSet):
    queryset = HostelGatePass.objects.all()
    serializer_class = HostelGatePassSerializer
    
    def get_queryset(self):
        queryset = GatePass.objects.filter(tenant=get_current_tenant())
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by allocation
        allocation_id = self.request.query_params.get('allocation')
        if allocation_id:
            queryset = queryset.filter(allocation_id=allocation_id)
        
        # Filter by student
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(allocation__student_id=student_id)
        
        return queryset.select_related('allocation__student', 'approved_by')
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a gate pass"""
        gate_pass = self.get_object()
        
        if gate_pass.status != 'PENDING':
            return Response(
                {'error': 'Only pending gate passes can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from staff.models import Staff
        approved_by_id = request.data.get('approved_by_id')
        
        try:
            staff = Staff.objects.get(id=approved_by_id, tenant=get_current_tenant())
            
            gate_pass.status = 'APPROVED'
            gate_pass.approved_by = staff
            gate_pass.approval_date = timezone.now()
            gate_pass.save()
            
            return Response({
                'message': 'Gate pass approved',
                'gate_pass': HostelGatePassSerializer(gate_pass).data
            })
            
        except Staff.DoesNotExist:
            return Response(
                {'error': 'Staff not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a gate pass"""
        gate_pass = self.get_object()
        
        if gate_pass.status != 'PENDING':
            return Response(
                {'error': 'Only pending gate passes can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        gate_pass.status = 'REJECTED'
        gate_pass.remarks = request.data.get('remarks', '')
        gate_pass.save()
        
        return Response({
            'message': 'Gate pass rejected',
            'gate_pass': HostelGatePassSerializer(gate_pass).data
        })
    
    @action(detail=True, methods=['post'])
    def mark_exit(self, request, pk=None):
        """Mark student exit"""
        gate_pass = self.get_object()
        
        if gate_pass.status != 'APPROVED':
            return Response(
                {'error': 'Gate pass must be approved first'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        gate_pass.exit_time = timezone.now()
        gate_pass.save()
        
        return Response({
            'message': 'Exit marked',
            'gate_pass': HostelGatePassSerializer(gate_pass).data
        })
    
    @action(detail=True, methods=['post'])
    def mark_entry(self, request, pk=None):
        """Mark student entry"""
        gate_pass = self.get_object()
        
        if not gate_pass.exit_time:
            return Response(
                {'error': 'Student has not exited yet'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        gate_pass.entry_time = timezone.now()
        gate_pass.save()
        
        return Response({
            'message': 'Entry marked',
            'gate_pass': HostelGatePassSerializer(gate_pass).data
        })


# Phase 5.5: Complaint & Maintenance ViewSets
class HostelComplaintViewSet(viewsets.ModelViewSet):
    queryset = HostelComplaint.objects.all()
    serializer_class = HostelComplaintSerializer
    
    def get_queryset(self):
        queryset = HostelComplaint.objects.filter(tenant=get_current_tenant())
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by priority
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        # Filter by complaint type
        complaint_type = self.request.query_params.get('type')
        if complaint_type:
            queryset = queryset.filter(complaint_type=complaint_type)
        
        # Filter by allocation
        allocation_id = self.request.query_params.get('allocation')
        if allocation_id:
            queryset = queryset.filter(allocation_id=allocation_id)
        
        return queryset.select_related('allocation__student', 'room', 'assigned_to')
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign complaint to staff"""
        complaint = self.get_object()
        
        from staff.models import Staff
        staff_id = request.data.get('staff_id')
        
        try:
            staff = Staff.objects.get(id=staff_id, tenant=get_current_tenant())
            
            complaint.assigned_to = staff
            complaint.assigned_date = timezone.now()
            complaint.status = 'ASSIGNED'
            complaint.save()
            
            return Response({
                'message': 'Complaint assigned',
                'complaint': HostelComplaintSerializer(complaint).data
            })
            
        except Staff.DoesNotExist:
            return Response(
                {'error': 'Staff not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark complaint as resolved"""
        complaint = self.get_object()
        
        complaint.status = 'RESOLVED'
        complaint.resolution_date = timezone.now()
        complaint.resolution_notes = request.data.get('resolution_notes', '')
        complaint.save()
        
        return Response({
            'message': 'Complaint resolved',
            'complaint': HostelComplaintSerializer(complaint).data
        })
    
    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        """Student rating and feedback"""
        complaint = self.get_object()
        
        if complaint.status != 'RESOLVED':
            return Response(
                {'error': 'Complaint must be resolved first'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        complaint.student_rating = request.data.get('rating')
        complaint.student_feedback = request.data.get('feedback', '')
        complaint.status = 'CLOSED'
        complaint.save()
        
        return Response({
            'message': 'Feedback submitted',
            'complaint': HostelComplaintSerializer(complaint).data
        })


class MaintenanceScheduleViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceSchedule.objects.all()
    serializer_class = MaintenanceScheduleSerializer
    
    def get_queryset(self):
        queryset = MaintenanceSchedule.objects.filter(tenant=get_current_tenant())
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(scheduled_date__range=[start_date, end_date])
        
        # Filter by room or building
        room_id = self.request.query_params.get('room')
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        
        building_id = self.request.query_params.get('building')
        if building_id:
            queryset = queryset.filter(building_id=building_id)
        
        return queryset.select_related('room', 'building', 'assigned_to')
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark maintenance as completed"""
        schedule = self.get_object()
        
        schedule.status = 'COMPLETED'
        schedule.completion_date = timezone.now()
        schedule.completion_notes = request.data.get('completion_notes', '')
        schedule.save()
        
        # Update room maintenance status if applicable
        if schedule.room and schedule.maintenance_type in ['QUARTERLY_MAINTENANCE', 'ANNUAL_MAINTENANCE']:
            schedule.room.maintenance_status = 'GOOD'
            schedule.room.save()
        
        return Response({
            'message': 'Maintenance marked as completed',
            'schedule': MaintenanceScheduleSerializer(schedule).data
        })


# Phase 5.6: Mess Management ViewSets
class MessRegistrationViewSet(viewsets.ModelViewSet):
    queryset = MessRegistration.objects.all()
    serializer_class = MessRegistrationSerializer
    
    def get_queryset(self):
        queryset = MessRegistration.objects.filter(tenant=get_current_tenant())
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active == 'true':
            queryset = queryset.filter(is_active=True)
        
        # Filter by meal plan
        meal_plan = self.request.query_params.get('meal_plan')
        if meal_plan:
            queryset = queryset.filter(meal_plan=meal_plan)
        
        return queryset.select_related('allocation__student')


class MessMenuViewSet(viewsets.ModelViewSet):
    queryset = MessMenu.objects.all()
    serializer_class = MessMenuSerializer
    
    def get_queryset(self):
        queryset = MessMenu.objects.filter(tenant=get_current_tenant())
        
        # Filter by building
        building_id = self.request.query_params.get('building')
        if building_id:
            queryset = queryset.filter(building_id=building_id)
        
        # Filter by week
        week_start = self.request.query_params.get('week_start_date')
        if week_start:
            queryset = queryset.filter(week_start_date=week_start)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active == 'true':
            queryset = queryset.filter(is_active=True)
        
        return queryset.select_related('building')
    
    @action(detail=False, methods=['post'])
    def create_weekly_menu(self, request):
        """Create menu for entire week"""
        building_id = request.data.get('building_id')
        week_start_date = request.data.get('week_start_date')
        menus = request.data.get('menus', [])
        
        created_count = 0
        
        for menu_item in menus:
            MessMenu.objects.update_or_create(
                building_id=building_id,
                week_start_date=week_start_date,
                day_of_week=menu_item['day_of_week'],
                meal_type=menu_item['meal_type'],
                tenant=get_current_tenant(),
                defaults={
                    'items': menu_item['items'],
                    'calories': menu_item.get('calories'),
                    'protein_grams': menu_item.get('protein_grams'),
                    'is_active': True,
                }
            )
            created_count += 1
        
        return Response({
            'message': f'Weekly menu created with {created_count} entries',
            'week_start_date': week_start_date
        })


class MessAttendanceViewSet(viewsets.ModelViewSet):
    queryset = MessAttendance.objects.all()
    serializer_class = MessAttendanceSerializer
    
    def get_queryset(self):
        queryset = MessAttendance.objects.filter(tenant=get_current_tenant())
        
        # Filter by date
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        
        # Filter by registration
        registration_id = self.request.query_params.get('registration')
        if registration_id:
            queryset = queryset.filter(registration_id=registration_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(date__range=[start_date, end_date])
        
        return queryset.select_related('registration__allocation__student')
    
    @action(detail=False, methods=['post'])
    def mark_meal(self, request):
        """Mark a meal as taken"""
        registration_id = request.data.get('registration_id')
        meal_type = request.data.get('meal_type')  # 'breakfast', 'lunch', 'snacks', 'dinner'
        date = request.data.get('date', timezone.now().date())
        
        attendance, created = MessAttendance.objects.get_or_create(
            registration_id=registration_id,
            date=date,
            tenant=get_current_tenant()
        )
        
        # Update the specific meal
        current_time = timezone.now().time()
        
        if meal_type == 'breakfast':
            attendance.breakfast_taken = True
            attendance.breakfast_time = current_time
        elif meal_type == 'lunch':
            attendance.lunch_taken = True
            attendance.lunch_time = current_time
        elif meal_type == 'snacks':
            attendance.snacks_taken = True
            attendance.snacks_time = current_time
        elif meal_type == 'dinner':
            attendance.dinner_taken = True
            attendance.dinner_time = current_time
        
        attendance.save()
        
        return Response({
            'message': f'{meal_type.capitalize()} marked as taken',
            'attendance': MessAttendanceSerializer(attendance).data
        })
    
    @action(detail=False, methods=['get'])
    def monthly_report(self, request):
        """Generate monthly mess attendance report"""
        registration_id = request.query_params.get('registration_id')
        month = request.query_params.get('month')  # YYYY-MM format
        
        if not registration_id or not month:
            return Response(
                {'error': 'registration_id and month are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse month
        year, month_num = map(int, month.split('-'))
        start_date = datetime(year, month_num, 1).date()
        
        # Calculate end date
        if month_num == 12:
            end_date = datetime(year + 1, 1, 1).date() - timedelta(days=1)
        else:
            end_date = datetime(year, month_num + 1, 1).date() - timedelta(days=1)
        
        # Get attendance records
        attendance_records = MessAttendance.objects.filter(
            registration_id=registration_id,
            date__range=[start_date, end_date],
            tenant=get_current_tenant()
        )
        
        # Calculate totals
        total_breakfast = attendance_records.filter(breakfast_taken=True).count()
        total_lunch = attendance_records.filter(lunch_taken=True).count()
        total_snacks = attendance_records.filter(snacks_taken=True).count()
        total_dinner = attendance_records.filter(dinner_taken=True).count()
        
        return Response({
            'registration_id': registration_id,
            'month': month,
            'total_breakfast': total_breakfast,
            'total_lunch': total_lunch,
            'total_snacks': total_snacks,
            'total_dinner': total_dinner,
            'total_meals': total_breakfast + total_lunch + total_snacks + total_dinner,
            'records': MessAttendanceSerializer(attendance_records, many=True).data
        })

