"""
Inventory Views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Item, StockTransaction, InventoryOrder, OrderItem, ItemCategory
from .serializers import (ItemSerializer, StockTransactionSerializer, InventoryOrderSerializer, ItemCategorySerializer)
from core.middleware import get_current_tenant

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    def get_queryset(self): return Item.objects.filter(tenant=get_current_tenant())

class StockTransactionViewSet(viewsets.ModelViewSet):
    queryset = StockTransaction.objects.all()
    serializer_class = StockTransactionSerializer
    def get_queryset(self): return StockTransaction.objects.filter(tenant=get_current_tenant())

class InventoryOrderViewSet(viewsets.ModelViewSet):
    queryset = InventoryOrder.objects.all()
    serializer_class = InventoryOrderSerializer
    def get_queryset(self): return InventoryOrder.objects.filter(tenant=get_current_tenant())

    @action(detail=False, methods=['post'])
    def create_order(self, request):
        """
        Create Parent Order from Cart
        Data: { student_id: 1, items: [{item_id: 1, qty: 2}] }
        """
        tenant = get_current_tenant()
        data = request.data
        
        # 1. Create Order Stub
        order = InventoryOrder.objects.create(
            tenant=tenant,
            student_id=data.get('student_id'),
            order_number=f"ORD-{int(timezone.now().timestamp())}",
            status='PENDING'
        )
        
        total = 0
        
        # 2. Add Items
        for line in data.get('items', []):
            item = Item.objects.get(id=line['item_id'], tenant=tenant)
            subtotal = item.price * line['qty']
            total += float(subtotal)
            
            OrderItem.objects.create(
                tenant=tenant,
                order=order,
                item=item,
                quantity=line['qty'],
                unit_price=item.price,
                subtotal=subtotal
            )
            
            # Reduce Stock (Reserved logic omitted for MVP, assuming deducted on PAID or now)
            item.current_stock -= line['qty']
            item.save()
            
            # Log Transaction
            StockTransaction.objects.create(
                tenant=tenant,
                item=item,
                transaction_type='SALE',
                quantity=-line['qty'],
                unit_price=item.price,
                reference=order.order_number,
                transaction_date=timezone.now()
            )
            
        order.total_amount = total
        order.save()
        
        return Response(InventoryOrderSerializer(order).data, status=status.HTTP_201_CREATED)
