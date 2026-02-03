"""
Transport Module Views - Enhanced Version

Provides comprehensive transport management including:
- Vehicle Management with GPS Tracking
- Driver Management with Attendance
- Route Management with Optimization
- Trip Management
- Maintenance Scheduling
- Fuel Management
- Parent Notifications
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Sum, Avg, Q, F
from django.utils import timezone
from datetime import timedelta, datetime

from core.middleware import get_current_tenant
from core.viewsets import (
    TenantModelViewSet, TenantReadOnlyViewSet,
    success_response, error_response, paginated_response
)
from .models import (
    Vehicle, Driver, DriverAttendance, Route, Stop, StudentTransport,
    VehicleTracking, VehicleCurrentLocation, TripLog, TripStopLog,
    StudentTripAttendance, VehicleMaintenance, FuelLog,
    TransportNotification, TransportNotificationSetting, TransportExpenseSummary
)
from .serializers import (
    VehicleSerializer, VehicleListSerializer,
    DriverSerializer, DriverListSerializer, DriverAttendanceSerializer,
    BulkDriverAttendanceSerializer,
    RouteSerializer, RouteListSerializer, RouteWithStopsSerializer,
    StopSerializer, StopListSerializer,
    StudentTransportSerializer, StudentTransportBulkSerializer,
    VehicleTrackingSerializer, VehicleCurrentLocationSerializer, GPSDataIngestSerializer,
    TripLogSerializer, TripLogListSerializer, TripStopLogSerializer,
    StudentTripAttendanceSerializer, StartTripSerializer, EndTripSerializer,
    StudentBoardingSerializer,
    VehicleMaintenanceSerializer, VehicleMaintenanceListSerializer,
    MaintenanceApprovalSerializer, MaintenanceCompletionSerializer,
    FuelLogSerializer, FuelLogListSerializer,
    TransportNotificationSerializer, TransportNotificationSettingSerializer,
    SendNotificationSerializer,
    TransportExpenseSummarySerializer, TransportDashboardSerializer
)


# =============================================================================
# VEHICLE MANAGEMENT
# =============================================================================

class VehicleViewSet(TenantModelViewSet):
    """
    ViewSet for Vehicle management.
    
    Provides CRUD operations and additional actions for:
    - Document status tracking
    - Maintenance history
    - Fuel consumption analysis
    - GPS tracking
    """
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    filterset_fields = ['vehicle_type', 'fuel_type', 'status', 'is_active']
    search_fields = ['vehicle_number', 'make', 'model', 'registration_number']
    ordering_fields = ['vehicle_number', 'created_at', 'capacity']
    ordering = ['vehicle_number']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return VehicleListSerializer
        return VehicleSerializer
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Get transport dashboard statistics.
        
        GET /api/transport/vehicles/dashboard/
        """
        tenant = get_current_tenant()
        today = timezone.now().date()
        
        vehicles = Vehicle.objects.filter(tenant=tenant)
        drivers = Driver.objects.filter(tenant=tenant)
        
        stats = {
            'total_vehicles': vehicles.count(),
            'active_vehicles': vehicles.filter(status='ACTIVE').count(),
            'vehicles_in_maintenance': vehicles.filter(status='MAINTENANCE').count(),
            'total_drivers': drivers.count(),
            'active_drivers': drivers.filter(status='ACTIVE').count(),
            'total_routes': Route.objects.filter(tenant=tenant, is_active=True).count(),
            'total_students': StudentTransport.objects.filter(tenant=tenant, is_active=True).count(),
            'active_trips_today': TripLog.objects.filter(
                tenant=tenant, date=today, status='IN_PROGRESS'
            ).count(),
            'completed_trips_today': TripLog.objects.filter(
                tenant=tenant, date=today, status='COMPLETED'
            ).count(),
            'documents_expiring_soon': vehicles.filter(
                Q(insurance_expiry__lte=today + timedelta(days=30)) |
                Q(fitness_certificate_expiry__lte=today + timedelta(days=30)) |
                Q(permit_expiry__lte=today + timedelta(days=30))
            ).count()
        }
        
        return success_response(data=stats)
    
    @action(detail=True, methods=['get'])
    def document_status(self, request, pk=None):
        """
        Get document expiry status for a vehicle.
        
        GET /api/transport/vehicles/{id}/document_status/
        """
        vehicle = self.get_object()
        today = timezone.now().date()
        
        documents = []
        
        doc_fields = [
            ('Insurance', vehicle.insurance_expiry),
            ('Registration', vehicle.registration_expiry),
            ('Fitness Certificate', vehicle.fitness_certificate_expiry),
            ('Pollution Certificate', vehicle.pollution_certificate_expiry),
            ('Permit', vehicle.permit_expiry),
        ]
        
        for name, expiry in doc_fields:
            if expiry:
                days_remaining = (expiry - today).days
                if days_remaining < 0:
                    status_text = 'EXPIRED'
                elif days_remaining <= 7:
                    status_text = 'CRITICAL'
                elif days_remaining <= 30:
                    status_text = 'WARNING'
                else:
                    status_text = 'VALID'
                
                documents.append({
                    'document_type': name,
                    'expiry_date': expiry,
                    'days_remaining': days_remaining,
                    'status': status_text
                })
        
        return success_response(data=documents)
    
    @action(detail=True, methods=['get'])
    def maintenance_history(self, request, pk=None):
        """
        Get maintenance history for a vehicle.
        
        GET /api/transport/vehicles/{id}/maintenance_history/
        """
        vehicle = self.get_object()
        maintenances = vehicle.maintenances.all()[:20]
        serializer = VehicleMaintenanceListSerializer(maintenances, many=True)
        return success_response(data=serializer.data)
    
    @action(detail=True, methods=['get'])
    def fuel_consumption(self, request, pk=None):
        """
        Get fuel consumption analysis for a vehicle.
        
        GET /api/transport/vehicles/{id}/fuel_consumption/?months=3
        """
        vehicle = self.get_object()
        months = int(request.query_params.get('months', 3))
        start_date = timezone.now().date() - timedelta(days=months * 30)
        
        fuel_logs = vehicle.fuel_logs.filter(date__gte=start_date)
        
        stats = fuel_logs.aggregate(
            total_fuel=Sum('quantity'),
            total_cost=Sum('total_cost'),
            total_distance=Sum('km_since_last_fill'),
            avg_mileage=Avg('calculated_mileage')
        )
        
        monthly_breakdown = []
        for i in range(months):
            month_start = timezone.now().date().replace(day=1) - timedelta(days=30 * i)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            month_stats = fuel_logs.filter(
                date__gte=month_start,
                date__lte=month_end
            ).aggregate(
                fuel=Sum('quantity'),
                cost=Sum('total_cost')
            )
            
            monthly_breakdown.append({
                'month': month_start.strftime('%B %Y'),
                'fuel_liters': month_stats['fuel'] or 0,
                'cost': month_stats['cost'] or 0
            })
        
        return success_response(data={
            'summary': stats,
            'monthly_breakdown': monthly_breakdown
        })
    
    @action(detail=True, methods=['get'])
    def current_location(self, request, pk=None):
        """
        Get current location of a vehicle.
        
        GET /api/transport/vehicles/{id}/current_location/
        """
        vehicle = self.get_object()
        
        try:
            location = vehicle.current_location
            serializer = VehicleCurrentLocationSerializer(location)
            return success_response(data=serializer.data)
        except VehicleCurrentLocation.DoesNotExist:
            return error_response('Location data not available for this vehicle')
    
    @action(detail=True, methods=['get'])
    def tracking_history(self, request, pk=None):
        """
        Get tracking history for a vehicle.
        
        GET /api/transport/vehicles/{id}/tracking_history/?hours=24
        """
        vehicle = self.get_object()
        hours = int(request.query_params.get('hours', 24))
        since = timezone.now() - timedelta(hours=hours)
        
        history = vehicle.tracking_history.filter(timestamp__gte=since)[:1000]
        serializer = VehicleTrackingSerializer(history, many=True)
        return success_response(data=serializer.data)
    
    @action(detail=False, methods=['get'])
    def expiring_documents(self, request):
        """
        Get all vehicles with documents expiring soon.
        
        GET /api/transport/vehicles/expiring_documents/?days=30
        """
        tenant = get_current_tenant()
        days = int(request.query_params.get('days', 30))
        threshold = timezone.now().date() + timedelta(days=days)
        
        vehicles = Vehicle.objects.filter(
            tenant=tenant,
            is_active=True
        ).filter(
            Q(insurance_expiry__lte=threshold) |
            Q(fitness_certificate_expiry__lte=threshold) |
            Q(pollution_certificate_expiry__lte=threshold) |
            Q(permit_expiry__lte=threshold)
        )
        
        result = []
        for vehicle in vehicles:
            docs = self._get_expiring_docs(vehicle, threshold)
            if docs:
                result.append({
                    'vehicle': VehicleListSerializer(vehicle).data,
                    'expiring_documents': docs
                })
        
        return success_response(data=result)
    
    def _get_expiring_docs(self, vehicle, threshold):
        docs = []
        today = timezone.now().date()
        
        if vehicle.insurance_expiry and vehicle.insurance_expiry <= threshold:
            docs.append({
                'type': 'Insurance',
                'expiry': vehicle.insurance_expiry,
                'days_remaining': (vehicle.insurance_expiry - today).days
            })
        if vehicle.fitness_certificate_expiry and vehicle.fitness_certificate_expiry <= threshold:
            docs.append({
                'type': 'Fitness Certificate',
                'expiry': vehicle.fitness_certificate_expiry,
                'days_remaining': (vehicle.fitness_certificate_expiry - today).days
            })
        if vehicle.pollution_certificate_expiry and vehicle.pollution_certificate_expiry <= threshold:
            docs.append({
                'type': 'Pollution Certificate',
                'expiry': vehicle.pollution_certificate_expiry,
                'days_remaining': (vehicle.pollution_certificate_expiry - today).days
            })
        if vehicle.permit_expiry and vehicle.permit_expiry <= threshold:
            docs.append({
                'type': 'Permit',
                'expiry': vehicle.permit_expiry,
                'days_remaining': (vehicle.permit_expiry - today).days
            })
        
        return docs


# =============================================================================
# DRIVER MANAGEMENT
# =============================================================================

class DriverViewSet(TenantModelViewSet):
    """
    ViewSet for Driver management.
    """
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    filterset_fields = ['status', 'license_type']
    search_fields = ['staff__first_name', 'staff__last_name', 'license_number', 'phone']
    ordering_fields = ['staff__first_name', 'license_expiry']
    ordering = ['staff__first_name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return DriverListSerializer
        return DriverSerializer
    
    @action(detail=False, methods=['get'])
    def expiring_licenses(self, request):
        """
        Get drivers with licenses expiring soon.
        
        GET /api/transport/drivers/expiring_licenses/?days=30
        """
        tenant = get_current_tenant()
        days = int(request.query_params.get('days', 30))
        threshold = timezone.now().date() + timedelta(days=days)
        
        drivers = Driver.objects.filter(
            tenant=tenant,
            status='ACTIVE',
            license_expiry__lte=threshold
        ).order_by('license_expiry')
        
        serializer = DriverListSerializer(drivers, many=True)
        return success_response(data=serializer.data)


class DriverAttendanceViewSet(TenantModelViewSet):
    """
    ViewSet for Driver Attendance management.
    """
    queryset = DriverAttendance.objects.all()
    serializer_class = DriverAttendanceSerializer
    filterset_fields = ['driver', 'date', 'status']
    ordering = ['-date']
    
    @action(detail=False, methods=['post'])
    def bulk_mark(self, request):
        """
        Mark attendance for multiple drivers.
        
        POST /api/transport/driver-attendance/bulk_mark/
        {
            "date": "2026-01-27",
            "attendances": [
                {"driver_id": "uuid", "status": "PRESENT", "check_in_time": "08:00"},
                ...
            ]
        }
        """
        serializer = BulkDriverAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tenant = get_current_tenant()
        date = serializer.validated_data['date']
        attendances_data = serializer.validated_data['attendances']
        
        created = 0
        updated = 0
        errors = []
        
        for att in attendances_data:
            driver_id = att.get('driver_id')
            try:
                driver = Driver.objects.get(id=driver_id, tenant=tenant)
                obj, is_new = DriverAttendance.objects.update_or_create(
                    tenant=tenant,
                    driver=driver,
                    date=date,
                    defaults={
                        'status': att.get('status', 'PRESENT'),
                        'check_in_time': att.get('check_in_time'),
                        'check_out_time': att.get('check_out_time'),
                        'remarks': att.get('remarks', '')
                    }
                )
                if is_new:
                    created += 1
                else:
                    updated += 1
            except Driver.DoesNotExist:
                errors.append(f"Driver {driver_id} not found")
            except Exception as e:
                errors.append(f"Error for driver {driver_id}: {str(e)}")
        
        return success_response(
            data={
                'created': created,
                'updated': updated,
                'errors': errors
            },
            message=f"Attendance marked: {created} created, {updated} updated"
        )
    
    @action(detail=False, methods=['get'])
    def daily_report(self, request):
        """
        Get attendance report for a date.
        
        GET /api/transport/driver-attendance/daily_report/?date=2026-01-27
        """
        tenant = get_current_tenant()
        date_str = request.query_params.get('date')
        
        if date_str:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        else:
            date = timezone.now().date()
        
        all_drivers = Driver.objects.filter(tenant=tenant, status='ACTIVE')
        attendances = DriverAttendance.objects.filter(
            tenant=tenant,
            date=date
        ).select_related('driver', 'vehicle')
        
        attendance_dict = {att.driver_id: att for att in attendances}
        
        report = []
        for driver in all_drivers:
            att = attendance_dict.get(driver.id)
            report.append({
                'driver': DriverListSerializer(driver).data,
                'attendance': DriverAttendanceSerializer(att).data if att else None,
                'marked': att is not None
            })
        
        summary = {
            'total': all_drivers.count(),
            'present': attendances.filter(status='PRESENT').count(),
            'absent': attendances.filter(status='ABSENT').count(),
            'late': attendances.filter(status='LATE').count(),
            'on_leave': attendances.filter(status='ON_LEAVE').count(),
            'not_marked': all_drivers.count() - attendances.count()
        }
        
        return success_response(data={
            'date': date,
            'summary': summary,
            'details': report
        })


# =============================================================================
# ROUTE MANAGEMENT
# =============================================================================

class RouteViewSet(TenantModelViewSet):
    """
    ViewSet for Route management.
    """
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
    filterset_fields = ['route_type', 'status', 'is_active', 'vehicle', 'driver']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return RouteListSerializer
        if self.action == 'with_stops':
            return RouteWithStopsSerializer
        return RouteSerializer
    
    @action(detail=True, methods=['get'])
    def with_stops(self, request, pk=None):
        """
        Get route with all stop details.
        
        GET /api/transport/routes/{id}/with_stops/
        """
        route = self.get_object()
        serializer = RouteWithStopsSerializer(route)
        return success_response(data=serializer.data)
    
    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """
        Get all students assigned to this route.
        
        GET /api/transport/routes/{id}/students/
        """
        route = self.get_object()
        allocations = StudentTransport.objects.filter(
            stop__route=route,
            is_active=True
        ).select_related('student', 'stop')
        
        serializer = StudentTransportSerializer(allocations, many=True)
        return success_response(data=serializer.data)
    
    @action(detail=True, methods=['post'])
    def optimize(self, request, pk=None):
        """
        Suggest optimized stop order based on geolocation.
        
        POST /api/transport/routes/{id}/optimize/
        """
        route = self.get_object()
        stops = route.stops.filter(
            is_active=True,
            latitude__isnull=False,
            longitude__isnull=False
        ).order_by('order')
        
        if stops.count() < 2:
            return error_response('Need at least 2 stops with coordinates to optimize')
        
        # Simple nearest-neighbor optimization
        optimized = self._optimize_route(list(stops))
        
        return success_response(data={
            'current_order': [{'id': str(s.id), 'name': s.name, 'order': s.order} for s in stops],
            'suggested_order': optimized,
            'message': 'Review suggested order and apply if appropriate'
        })
    
    def _optimize_route(self, stops):
        """Simple nearest-neighbor route optimization."""
        if not stops:
            return []
        
        # Start from school (first stop) or first in list
        result = [stops[0]]
        remaining = stops[1:]
        
        while remaining:
            current = result[-1]
            nearest = min(remaining, key=lambda s: self._distance(current, s))
            result.append(nearest)
            remaining.remove(nearest)
        
        return [{'id': str(s.id), 'name': s.name, 'suggested_order': i + 1} 
                for i, s in enumerate(result)]
    
    def _distance(self, stop1, stop2):
        """Calculate approximate distance between two stops."""
        if not all([stop1.latitude, stop1.longitude, stop2.latitude, stop2.longitude]):
            return float('inf')
        
        lat_diff = float(stop1.latitude - stop2.latitude)
        lng_diff = float(stop1.longitude - stop2.longitude)
        return (lat_diff ** 2 + lng_diff ** 2) ** 0.5


class StopViewSet(TenantModelViewSet):
    """
    ViewSet for Stop management.
    """
    queryset = Stop.objects.all()
    serializer_class = StopSerializer
    filterset_fields = ['route', 'is_active']
    search_fields = ['name', 'address', 'landmark']
    ordering_fields = ['order', 'name']
    ordering = ['route', 'order']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return StopListSerializer
        return StopSerializer
    
    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """
        Get students at this stop.
        
        GET /api/transport/stops/{id}/students/
        """
        stop = self.get_object()
        allocations = stop.students.filter(is_active=True).select_related('student')
        serializer = StudentTransportSerializer(allocations, many=True)
        return success_response(data=serializer.data)


# =============================================================================
# STUDENT TRANSPORT ALLOCATION
# =============================================================================

class StudentTransportViewSet(TenantModelViewSet):
    """
    ViewSet for Student Transport allocation.
    """
    queryset = StudentTransport.objects.all()
    serializer_class = StudentTransportSerializer
    filterset_fields = ['stop', 'stop__route', 'is_active', 'transport_type']
    search_fields = ['student__first_name', 'student__last_name', 'student__admission_number']
    ordering = ['student__first_name']
    
    @action(detail=False, methods=['post'])
    def bulk_allocate(self, request):
        """
        Bulk allocate transport to students.
        
        POST /api/transport/allocations/bulk_allocate/
        {
            "allocations": [
                {"student_id": "uuid", "stop_id": "uuid", "transport_type": "BOTH"},
                ...
            ]
        }
        """
        serializer = StudentTransportBulkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tenant = get_current_tenant()
        allocations_data = serializer.validated_data['allocations']
        
        created = 0
        updated = 0
        errors = []
        
        for alloc in allocations_data:
            try:
                obj, is_new = StudentTransport.objects.update_or_create(
                    tenant=tenant,
                    student_id=alloc['student_id'],
                    defaults={
                        'stop_id': alloc['stop_id'],
                        'transport_type': alloc.get('transport_type', 'BOTH'),
                        'is_active': True,
                        'start_date': alloc.get('start_date', timezone.now().date())
                    }
                )
                if is_new:
                    created += 1
                else:
                    updated += 1
            except Exception as e:
                errors.append(f"Error for student {alloc.get('student_id')}: {str(e)}")
        
        return success_response(
            data={'created': created, 'updated': updated, 'errors': errors},
            message=f"Allocations processed: {created} created, {updated} updated"
        )
    
    @action(detail=False, methods=['get'])
    def by_route(self, request):
        """
        Get student allocations grouped by route.
        
        GET /api/transport/allocations/by_route/
        """
        tenant = get_current_tenant()
        routes = Route.objects.filter(tenant=tenant, is_active=True)
        
        result = []
        for route in routes:
            allocations = StudentTransport.objects.filter(
                tenant=tenant,
                stop__route=route,
                is_active=True
            ).select_related('student', 'stop')
            
            result.append({
                'route': RouteListSerializer(route).data,
                'students': StudentTransportSerializer(allocations, many=True).data,
                'count': allocations.count()
            })
        
        return success_response(data=result)


# =============================================================================
# GPS TRACKING
# =============================================================================

class VehicleTrackingViewSet(TenantReadOnlyViewSet):
    """
    ViewSet for Vehicle GPS Tracking data (read-only).
    """
    queryset = VehicleTracking.objects.all()
    serializer_class = VehicleTrackingSerializer
    filterset_fields = ['vehicle']
    ordering = ['-timestamp']
    
    @action(detail=False, methods=['post'])
    def ingest(self, request):
        """
        Ingest GPS data from tracking devices.
        
        POST /api/transport/tracking/ingest/
        {
            "device_id": "GPS123",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "speed": 45.5,
            "timestamp": "2026-01-27T08:30:00Z"
        }
        """
        serializer = GPSDataIngestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tenant = get_current_tenant()
        data = serializer.validated_data
        
        # Find vehicle by GPS device ID
        try:
            vehicle = Vehicle.objects.get(
                tenant=tenant,
                gps_device_id=data['device_id']
            )
        except Vehicle.DoesNotExist:
            return error_response(f"No vehicle found with device ID: {data['device_id']}")
        
        # Create tracking record
        tracking = VehicleTracking.objects.create(
            tenant=tenant,
            vehicle=vehicle,
            latitude=data['latitude'],
            longitude=data['longitude'],
            speed=data.get('speed', 0),
            heading=data.get('heading'),
            altitude=data.get('altitude'),
            accuracy=data.get('accuracy'),
            timestamp=data.get('timestamp', timezone.now()),
            ignition_on=data.get('ignition_on', True),
            is_moving=data.get('speed', 0) > 5,
            raw_data=data.get('raw_data')
        )
        
        # Update current location
        VehicleCurrentLocation.objects.update_or_create(
            tenant=tenant,
            vehicle=vehicle,
            defaults={
                'latitude': data['latitude'],
                'longitude': data['longitude'],
                'speed': data.get('speed', 0),
                'heading': data.get('heading'),
                'ignition_on': data.get('ignition_on', True),
                'is_moving': data.get('speed', 0) > 5,
                'location_updated_at': timezone.now()
            }
        )
        
        return success_response(
            data={'tracking_id': str(tracking.id)},
            message='GPS data recorded successfully'
        )
    
    @action(detail=False, methods=['get'])
    def live_locations(self, request):
        """
        Get live locations of all active vehicles.
        
        GET /api/transport/tracking/live_locations/
        """
        tenant = get_current_tenant()
        locations = VehicleCurrentLocation.objects.filter(
            tenant=tenant,
            vehicle__is_active=True
        ).select_related('vehicle', 'current_route', 'next_stop')
        
        serializer = VehicleCurrentLocationSerializer(locations, many=True)
        return success_response(data=serializer.data)


# =============================================================================
# TRIP MANAGEMENT
# =============================================================================

class TripLogViewSet(TenantModelViewSet):
    """
    ViewSet for Trip management.
    """
    queryset = TripLog.objects.all()
    serializer_class = TripLogSerializer
    filterset_fields = ['route', 'vehicle', 'driver', 'date', 'trip_type', 'status']
    search_fields = ['trip_number']
    ordering = ['-date', '-scheduled_start_time']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TripLogListSerializer
        return TripLogSerializer
    
    @action(detail=False, methods=['post'])
    def start(self, request):
        """
        Start a new trip.
        
        POST /api/transport/trips/start/
        {
            "route_id": "uuid",
            "trip_type": "PICKUP",
            "driver_id": "uuid",  // optional, uses route default
            "vehicle_id": "uuid", // optional, uses route default
            "start_odometer": 12500
        }
        """
        serializer = StartTripSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tenant = get_current_tenant()
        data = serializer.validated_data
        
        try:
            route = Route.objects.get(id=data['route_id'], tenant=tenant)
        except Route.DoesNotExist:
            return error_response('Route not found')
        
        # Get driver and vehicle
        driver_id = data.get('driver_id') or (route.driver_id if route.driver else None)
        vehicle_id = data.get('vehicle_id') or (route.vehicle_id if route.vehicle else None)
        
        if not driver_id or not vehicle_id:
            return error_response('Driver and vehicle are required')
        
        # Create trip
        trip = TripLog.objects.create(
            tenant=tenant,
            route=route,
            vehicle_id=vehicle_id,
            driver_id=driver_id,
            helper=route.helper,
            trip_type=data['trip_type'],
            date=timezone.now().date(),
            scheduled_start_time=timezone.now().time(),
            actual_start_time=timezone.now().time(),
            start_odometer=data.get('start_odometer'),
            expected_passengers=StudentTransport.objects.filter(
                stop__route=route, is_active=True
            ).count(),
            status='IN_PROGRESS'
        )
        
        # Update vehicle location
        VehicleCurrentLocation.objects.filter(
            tenant=tenant, vehicle_id=vehicle_id
        ).update(current_route=route, current_trip=trip)
        
        return success_response(
            data=TripLogSerializer(trip).data,
            message='Trip started successfully'
        )
    
    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        """
        End a trip.
        
        POST /api/transport/trips/{id}/end/
        """
        trip = self.get_object()
        
        if trip.status != 'IN_PROGRESS':
            return error_response('Only in-progress trips can be ended')
        
        serializer = EndTripSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        trip.actual_end_time = timezone.now().time()
        trip.end_odometer = data.get('end_odometer')
        trip.fuel_consumed = data.get('fuel_consumed')
        trip.remarks = data.get('remarks', '')
        trip.incidents = data.get('incidents', '')
        trip.status = 'COMPLETED'
        
        # Calculate actual passengers
        trip.actual_passengers = trip.student_attendance.filter(
            boarding_status='BOARDED'
        ).count()
        
        trip.save()
        
        # Clear vehicle location trip info
        VehicleCurrentLocation.objects.filter(
            current_trip=trip
        ).update(current_trip=None, current_route=None)
        
        return success_response(
            data=TripLogSerializer(trip).data,
            message='Trip ended successfully'
        )
    
    @action(detail=True, methods=['post'])
    def record_stop(self, request, pk=None):
        """
        Record arrival/departure at a stop.
        
        POST /api/transport/trips/{id}/record_stop/
        {
            "stop_id": "uuid",
            "event_type": "ARRIVAL",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "students_boarded": 5,
            "students_alighted": 0
        }
        """
        trip = self.get_object()
        
        if trip.status != 'IN_PROGRESS':
            return error_response('Can only record stops for in-progress trips')
        
        stop_id = request.data.get('stop_id')
        try:
            stop = Stop.objects.get(id=stop_id, route=trip.route)
        except Stop.DoesNotExist:
            return error_response('Stop not found on this route')
        
        log = TripStopLog.objects.create(
            tenant=get_current_tenant(),
            trip=trip,
            stop=stop,
            event_type=request.data.get('event_type', 'ARRIVAL'),
            scheduled_time=stop.pickup_time or stop.drop_time or timezone.now().time(),
            actual_time=timezone.now().time(),
            latitude=request.data.get('latitude'),
            longitude=request.data.get('longitude'),
            students_boarded=request.data.get('students_boarded', 0),
            students_alighted=request.data.get('students_alighted', 0),
            remarks=request.data.get('remarks', '')
        )
        
        # Update current location
        VehicleCurrentLocation.objects.filter(
            current_trip=trip
        ).update(
            last_stop=stop,
            latitude=request.data.get('latitude'),
            longitude=request.data.get('longitude'),
            location_updated_at=timezone.now()
        )
        
        return success_response(
            data=TripStopLogSerializer(log).data,
            message='Stop recorded'
        )
    
    @action(detail=True, methods=['post'])
    def record_boarding(self, request, pk=None):
        """
        Record student boarding.
        
        POST /api/transport/trips/{id}/record_boarding/
        """
        trip = self.get_object()
        serializer = StudentBoardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        tenant = get_current_tenant()
        
        try:
            allocation = StudentTransport.objects.get(
                tenant=tenant,
                student_id=data['student_id'],
                is_active=True
            )
        except StudentTransport.DoesNotExist:
            return error_response('Student transport allocation not found')
        
        attendance, created = StudentTripAttendance.objects.update_or_create(
            tenant=tenant,
            trip=trip,
            student_id=data['student_id'],
            defaults={
                'stop': allocation.stop,
                'boarding_status': data['boarding_status'],
                'boarding_time': timezone.now().time() if data['boarding_status'] == 'BOARDED' else None,
                'scanned_via_rfid': data.get('scanned_via_rfid', False),
                'remarks': data.get('remarks', '')
            }
        )
        
        # Send notification if enabled
        if data['boarding_status'] == 'BOARDED' and allocation.notify_on_pickup:
            self._send_boarding_notification(trip, allocation.student)
        
        return success_response(
            data=StudentTripAttendanceSerializer(attendance).data,
            message='Boarding recorded'
        )
    
    def _send_boarding_notification(self, trip, student):
        """Send notification to parent when student boards."""
        # This would integrate with the communication module
        pass
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """
        Get today's trips.
        
        GET /api/transport/trips/today/
        """
        tenant = get_current_tenant()
        today = timezone.now().date()
        
        trips = TripLog.objects.filter(
            tenant=tenant,
            date=today
        ).select_related('route', 'vehicle', 'driver')
        
        serializer = TripLogListSerializer(trips, many=True)
        return success_response(data=serializer.data)


# =============================================================================
# MAINTENANCE MANAGEMENT
# =============================================================================

class VehicleMaintenanceViewSet(TenantModelViewSet):
    """
    ViewSet for Vehicle Maintenance management.
    """
    queryset = VehicleMaintenance.objects.all()
    serializer_class = VehicleMaintenanceSerializer
    filterset_fields = ['vehicle', 'maintenance_type', 'status', 'priority']
    search_fields = ['description', 'vendor_name', 'invoice_number']
    ordering = ['-scheduled_date']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return VehicleMaintenanceListSerializer
        return VehicleMaintenanceSerializer
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve a maintenance request.
        
        POST /api/transport/maintenance/{id}/approve/
        """
        maintenance = self.get_object()
        
        if maintenance.status != 'SCHEDULED':
            return error_response('Only scheduled maintenance can be approved')
        
        maintenance.approved_by = request.user
        maintenance.approved_at = timezone.now()
        maintenance.status = 'IN_PROGRESS'
        
        # Update vehicle status
        maintenance.vehicle.status = 'MAINTENANCE'
        maintenance.vehicle.save()
        
        maintenance.save()
        
        return success_response(
            data=VehicleMaintenanceSerializer(maintenance).data,
            message='Maintenance approved and vehicle marked for maintenance'
        )
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Complete a maintenance.
        
        POST /api/transport/maintenance/{id}/complete/
        """
        maintenance = self.get_object()
        
        if maintenance.status not in ['SCHEDULED', 'IN_PROGRESS']:
            return error_response('Cannot complete this maintenance')
        
        serializer = MaintenanceCompletionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        maintenance.completed_date = data['completed_date']
        maintenance.completed_at_km = data.get('completed_at_km')
        maintenance.actual_cost = data['actual_cost']
        maintenance.parts_cost = data.get('parts_cost', 0)
        maintenance.labor_cost = data.get('labor_cost', 0)
        maintenance.vendor_name = data.get('vendor_name', maintenance.vendor_name)
        maintenance.invoice_number = data.get('invoice_number', '')
        maintenance.next_scheduled_date = data.get('next_scheduled_date')
        maintenance.next_scheduled_km = data.get('next_scheduled_km')
        maintenance.notes = data.get('notes', '')
        maintenance.status = 'COMPLETED'
        maintenance.save()
        
        # Update vehicle status back to active
        maintenance.vehicle.status = 'ACTIVE'
        if maintenance.completed_at_km:
            maintenance.vehicle.current_odometer = maintenance.completed_at_km
        maintenance.vehicle.save()
        
        return success_response(
            data=VehicleMaintenanceSerializer(maintenance).data,
            message='Maintenance completed'
        )
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """
        Get upcoming scheduled maintenance.
        
        GET /api/transport/maintenance/upcoming/?days=30
        """
        tenant = get_current_tenant()
        days = int(request.query_params.get('days', 30))
        threshold = timezone.now().date() + timedelta(days=days)
        
        maintenance = VehicleMaintenance.objects.filter(
            tenant=tenant,
            status='SCHEDULED',
            scheduled_date__lte=threshold
        ).order_by('scheduled_date')
        
        serializer = VehicleMaintenanceListSerializer(maintenance, many=True)
        return success_response(data=serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """
        Get overdue maintenance.
        
        GET /api/transport/maintenance/overdue/
        """
        tenant = get_current_tenant()
        today = timezone.now().date()
        
        maintenance = VehicleMaintenance.objects.filter(
            tenant=tenant,
            status='SCHEDULED',
            scheduled_date__lt=today
        ).order_by('scheduled_date')
        
        # Also mark as overdue
        maintenance.update(status='OVERDUE')
        
        serializer = VehicleMaintenanceListSerializer(maintenance, many=True)
        return success_response(data=serializer.data)


# =============================================================================
# FUEL MANAGEMENT
# =============================================================================

class FuelLogViewSet(TenantModelViewSet):
    """
    ViewSet for Fuel Log management.
    """
    queryset = FuelLog.objects.all()
    serializer_class = FuelLogSerializer
    filterset_fields = ['vehicle', 'driver', 'fuel_type', 'date']
    search_fields = ['station_name', 'receipt_number']
    ordering = ['-date', '-time']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FuelLogListSerializer
        return FuelLogSerializer
    
    @action(detail=False, methods=['get'])
    def consumption_report(self, request):
        """
        Get fuel consumption report.
        
        GET /api/transport/fuel/consumption_report/?start_date=2026-01-01&end_date=2026-01-31
        """
        tenant = get_current_tenant()
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            # Default to current month
            today = timezone.now().date()
            start_date = today.replace(day=1)
            end_date = (start_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        vehicles = Vehicle.objects.filter(tenant=tenant, is_active=True)
        
        report = []
        for vehicle in vehicles:
            logs = vehicle.fuel_logs.filter(
                date__gte=start_date,
                date__lte=end_date
            )
            
            if logs.exists():
                stats = logs.aggregate(
                    total_fuel=Sum('quantity'),
                    total_cost=Sum('total_cost'),
                    total_distance=Sum('km_since_last_fill'),
                    avg_mileage=Avg('calculated_mileage')
                )
                
                report.append({
                    'vehicle_id': str(vehicle.id),
                    'vehicle_number': vehicle.vehicle_number,
                    'period': f"{start_date} to {end_date}",
                    'total_fuel': stats['total_fuel'] or 0,
                    'total_cost': stats['total_cost'] or 0,
                    'total_distance': stats['total_distance'] or 0,
                    'average_mileage': stats['avg_mileage'] or 0
                })
        
        return success_response(data={
            'period': {'start': start_date, 'end': end_date},
            'vehicles': report
        })


# =============================================================================
# NOTIFICATIONS
# =============================================================================

class TransportNotificationViewSet(TenantReadOnlyViewSet):
    """
    ViewSet for Transport Notifications (read-only).
    """
    queryset = TransportNotification.objects.all()
    serializer_class = TransportNotificationSerializer
    filterset_fields = ['notification_type', 'student', 'delivery_status']
    ordering = ['-created_at']


class TransportNotificationSettingViewSet(TenantModelViewSet):
    """
    ViewSet for Transport Notification Settings.
    """
    queryset = TransportNotificationSetting.objects.all()
    serializer_class = TransportNotificationSettingSerializer
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return TransportNotificationSetting.objects.filter(tenant=tenant)
    
    @action(detail=False, methods=['get', 'put'])
    def settings(self, request):
        """
        Get or update notification settings.
        
        GET/PUT /api/transport/notification-settings/settings/
        """
        tenant = get_current_tenant()
        
        if request.method == 'GET':
            settings, _ = TransportNotificationSetting.objects.get_or_create(
                tenant=tenant,
                defaults={}
            )
            serializer = TransportNotificationSettingSerializer(settings)
            return success_response(data=serializer.data)
        
        settings, _ = TransportNotificationSetting.objects.get_or_create(
            tenant=tenant,
            defaults={}
        )
        serializer = TransportNotificationSettingSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return success_response(
            data=serializer.data,
            message='Settings updated'
        )
