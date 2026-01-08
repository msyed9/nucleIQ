"""
Inventory Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Count, Q

from .models import (
    ItemCategory, Vendor, Item, PurchaseOrder, PurchaseOrderItem,
    StockTransaction, InventoryOrder, OrderItem
)
from .serializers import (
    ItemCategorySerializer, VendorSerializer, ItemSerializer,
    ItemListSerializer, PurchaseOrderSerializer, PurchaseOrderListSerializer,
    PurchaseOrderItemSerializer, StockTransactionSerializer,
    InventoryOrderSerializer, InventoryOrderListSerializer,
    OrderItemSerializer, CreatePurchaseOrderSerializer,
    ReceivePurchaseOrderSerializer, CreateStockTransactionSerializer,
    CreateInventoryOrderSerializer
)
from core.middleware import get_current_tenant


class ItemCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for ItemCategory management."""
    
    serializer_class = ItemCategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['parent_category']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return ItemCategory.objects.filter(
            tenant=tenant,
            is_deleted=False
        )
    
    def perform_create(self, serializer):
        serializer.save(tenant=get_current_tenant())


class VendorViewSet(viewsets.ModelViewSet):
    """ViewSet for Vendor management."""
    
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'contact_person', 'email', 'phone']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return Vendor.objects.filter(
            tenant=tenant,
            is_deleted=False
        )
    
    def perform_create(self, serializer):
        serializer.save(tenant=get_current_tenant())
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active vendors."""
        tenant = get_current_tenant()
        vendors = Vendor.objects.filter(
            tenant=tenant,
            is_deleted=False,
            is_active=True
        )
        
        serializer = self.get_serializer(vendors, many=True)
        return Response(serializer.data)


class ItemViewSet(viewsets.ModelViewSet):
    """ViewSet for Item management."""
    
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'is_sellable', 'is_active']
    search_fields = ['name', 'sku', 'description']
    ordering_fields = ['name', 'current_stock', 'price', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return Item.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('category', 'preferred_vendor')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ItemListSerializer
        return ItemSerializer
    
    def perform_create(self, serializer):
        serializer.save(tenant=get_current_tenant())
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get items with low stock."""
        tenant = get_current_tenant()
        items = Item.objects.filter(
            tenant=tenant,
            is_deleted=False,
            is_active=True
        ).select_related('category', 'preferred_vendor')
        
        # Filter items where current_stock <= low_stock_threshold
        low_stock_items = [item for item in items if item.is_low_stock]
        
        serializer = self.get_serializer(low_stock_items, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def sellable(self, request):
        """Get items available for sale in parent store."""
        tenant = get_current_tenant()
        items = Item.objects.filter(
            tenant=tenant,
            is_deleted=False,
            is_active=True,
            is_sellable=True,
            current_stock__gt=0
        ).select_related('category')
        
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for PurchaseOrder management."""
    
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['vendor', 'status']
    search_fields = ['po_number', 'vendor__name', 'notes']
    ordering_fields = ['order_date', 'total_amount', 'created_at']
    ordering = ['-order_date']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return PurchaseOrder.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('vendor', 'created_by').prefetch_related('items')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PurchaseOrderListSerializer
        return PurchaseOrderSerializer
    
    @action(detail=False, methods=['post'])
    def create_po(self, request):
        """
        Create a new purchase order.
        
        POST /api/inventory/purchase-orders/create_po/
        {
            "vendor_id": "uuid",
            "expected_delivery_date": "2026-01-15",
            "notes": "Urgent order",
            "items": [
                {"item_id": "uuid", "quantity": 100, "unit_price": 50.00}
            ]
        }
        """
        serializer = CreatePurchaseOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        vendor_id = serializer.validated_data['vendor_id']
        expected_delivery = serializer.validated_data.get('expected_delivery_date')
        notes = serializer.validated_data.get('notes', '')
        items_data = serializer.validated_data['items']
        
        # Verify vendor exists
        try:
            vendor = Vendor.objects.get(pk=vendor_id, is_deleted=False)
        except Vendor.DoesNotExist:
            return Response(
                {'error': 'Vendor not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get staff profile
        try:
            from staff.models import Staff
            staff = Staff.objects.get(user=request.user, is_deleted=False)
        except Staff.DoesNotExist:
            staff = None
        
        with transaction.atomic():
            # Create PO
            po = PurchaseOrder.objects.create(
                tenant=get_current_tenant(),
                vendor=vendor,
                expected_delivery_date=expected_delivery,
                notes=notes,
                created_by=staff
            )
            
            total = 0
            
            # Add items
            for item_data in items_data:
                try:
                    item = Item.objects.get(
                        pk=item_data['item_id'],
                        tenant=get_current_tenant(),
                        is_deleted=False
                    )
                except Item.DoesNotExist:
                    return Response(
                        {'error': f"Item {item_data['item_id']} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                quantity = item_data['quantity']
                unit_price = item_data['unit_price']
                
                PurchaseOrderItem.objects.create(
                    tenant=get_current_tenant(),
                    purchase_order=po,
                    item=item,
                    quantity=quantity,
                    unit_price=unit_price
                )
                
                total += quantity * unit_price
            
            po.total_amount = total
            po.save()
        
        response_serializer = PurchaseOrderSerializer(po)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        """
        Receive items from a purchase order.
        
        POST /api/inventory/purchase-orders/{id}/receive/
        {
            "items": [
                {"po_item_id": "uuid", "received_quantity": 95}
            ]
        }
        """
        po = self.get_object()
        
        if po.status not in ['SENT', 'CONFIRMED']:
            return Response(
                {'error': 'PO must be in SENT or CONFIRMED status to receive'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        items_data = request.data.get('items', [])
        
        # Get staff profile
        try:
            from staff.models import Staff
            staff = Staff.objects.get(user=request.user, is_deleted=False)
        except Staff.DoesNotExist:
            staff = None
        
        with transaction.atomic():
            for item_data in items_data:
                po_item_id = item_data['po_item_id']
                received_qty = item_data['received_quantity']
                
                try:
                    po_item = PurchaseOrderItem.objects.get(
                        pk=po_item_id,
                        purchase_order=po
                    )
                except PurchaseOrderItem.DoesNotExist:
                    continue
                
                # Update received quantity
                po_item.received_quantity += received_qty
                po_item.save()
                
                # Create stock transaction (GRN)
                StockTransaction.objects.create(
                    tenant=get_current_tenant(),
                    item=po_item.item,
                    transaction_type='GRN',
                    quantity=received_qty,
                    unit_price=po_item.unit_price,
                    reference=po.po_number,
                    notes=f"Received from PO {po.po_number}",
                    performed_by=staff
                )
            
            # Check if all items received
            all_received = all(
                item.received_quantity >= item.quantity
                for item in po.items.all()
            )
            
            if all_received:
                po.status = 'RECEIVED'
                po.save()
        
        response_serializer = PurchaseOrderSerializer(po)
        return Response(response_serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending purchase orders."""
        tenant = get_current_tenant()
        pending_pos = PurchaseOrder.objects.filter(
            tenant=tenant,
            is_deleted=False,
            status__in=['DRAFT', 'SENT', 'CONFIRMED']
        ).select_related('vendor')
        
        serializer = self.get_serializer(pending_pos, many=True)
        return Response(serializer.data)


class StockTransactionViewSet(viewsets.ModelViewSet):
    """ViewSet for StockTransaction management."""
    
    serializer_class = StockTransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['item', 'transaction_type', 'performed_by']
    search_fields = ['reference', 'notes', 'item__name']
    ordering_fields = ['transaction_date', 'created_at']
    ordering = ['-transaction_date']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return StockTransaction.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('item', 'performed_by')
    
    @action(detail=False, methods=['post'])
    def create_transaction(self, request):
        """
        Create a new stock transaction.
        
        POST /api/inventory/stock-transactions/create_transaction/
        {
            "item_id": "uuid",
            "transaction_type": "ADJUST",
            "quantity": 10,
            "unit_price": 50.00,
            "reference": "ADJ-001",
            "notes": "Stock correction"
        }
        """
        serializer = CreateStockTransactionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        item_id = serializer.validated_data['item_id']
        
        # Verify item exists
        try:
            item = Item.objects.get(
                pk=item_id,
                tenant=get_current_tenant(),
                is_deleted=False
            )
        except Item.DoesNotExist:
            return Response(
                {'error': 'Item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get staff profile
        try:
            from staff.models import Staff
            staff = Staff.objects.get(user=request.user, is_deleted=False)
        except Staff.DoesNotExist:
            staff = None
        
        transaction_obj = StockTransaction.objects.create(
            tenant=get_current_tenant(),
            item=item,
            transaction_type=serializer.validated_data['transaction_type'],
            quantity=serializer.validated_data['quantity'],
            unit_price=serializer.validated_data.get('unit_price'),
            reference=serializer.validated_data.get('reference', ''),
            notes=serializer.validated_data.get('notes', ''),
            performed_by=staff
        )
        
        response_serializer = StockTransactionSerializer(transaction_obj)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class InventoryOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for InventoryOrder management."""
    
    serializer_class = InventoryOrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student', 'status']
    search_fields = ['order_number', 'student__user__first_name']
    ordering_fields = ['ordered_at', 'total_amount']
    ordering = ['-ordered_at']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return InventoryOrder.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('student').prefetch_related('order_items')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InventoryOrderListSerializer
        return InventoryOrderSerializer
    
    @action(detail=False, methods=['post'])
    def create_order(self, request):
        """
        Create Parent Order from Cart.
        
        POST /api/inventory/orders/create_order/
        {
            "student_id": "uuid",
            "items": [
                {"item_id": "uuid", "qty": 2}
            ]
        }
        """
        serializer = CreateInventoryOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        student_id = serializer.validated_data['student_id']
        items_data = serializer.validated_data['items']
        
        tenant = get_current_tenant()
        
        # Verify student exists
        try:
            from students.models import Student
            student = Student.objects.get(pk=student_id, is_deleted=False)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        with transaction.atomic():
            # Create Order
            order = InventoryOrder.objects.create(
                tenant=tenant,
                student=student,
                order_number=f"ORD-{int(timezone.now().timestamp())}",
                status='PENDING'
            )
            
            total = 0
            
            # Add Items
            for line in items_data:
                try:
                    item = Item.objects.get(
                        id=line['item_id'],
                        tenant=tenant,
                        is_deleted=False,
                        is_sellable=True
                    )
                except Item.DoesNotExist:
                    return Response(
                        {'error': f"Item {line['item_id']} not found or not sellable"},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                qty = line['qty']
                
                # Check stock availability
                if item.current_stock < qty:
                    return Response(
                        {'error': f"Insufficient stock for {item.name}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                subtotal = item.price * qty
                total += float(subtotal)
                
                OrderItem.objects.create(
                    tenant=tenant,
                    order=order,
                    item=item,
                    quantity=qty,
                    unit_price=item.price
                )
                
                # Reduce Stock
                item.current_stock -= qty
                item.save()
                
                # Log Transaction
                StockTransaction.objects.create(
                    tenant=tenant,
                    item=item,
                    transaction_type='SALE',
                    quantity=-qty,
                    unit_price=item.price,
                    reference=order.order_number,
                    transaction_date=timezone.now()
                )
            
            order.total_amount = total
            order.save()
        
        response_serializer = InventoryOrderSerializer(order)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update order status."""
        order = self.get_object()
        
        new_status = request.data.get('status')
        if new_status not in dict(InventoryOrder.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = new_status
        order.save()
        
        response_serializer = InventoryOrderSerializer(order)
        return Response(response_serializer.data)
