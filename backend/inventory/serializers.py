"""
Inventory Serializers
"""

from rest_framework import serializers
from .models import (
    ItemCategory, Vendor, Item, PurchaseOrder, PurchaseOrderItem,
    StockTransaction, InventoryOrder, OrderItem
)


class ItemCategorySerializer(serializers.ModelSerializer):
    """Serializer for ItemCategory."""
    
    subcategory_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ItemCategory
        fields = [
            'id', 'name', 'description', 'parent_category',
            'subcategory_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_subcategory_count(self, obj):
        return obj.subcategories.count()


class VendorSerializer(serializers.ModelSerializer):
    """Serializer for Vendor."""
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'name', 'contact_person', 'email', 'phone', 'address',
            'gstin', 'pan', 'payment_terms', 'is_active', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ItemSerializer(serializers.ModelSerializer):
    """Serializer for Item."""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    vendor_name = serializers.SerializerMethodField()
    is_low_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Item
        fields = [
            'id', 'category', 'category_name', 'name', 'sku', 'description',
            'unit', 'is_sellable', 'price', 'cost_price', 'current_stock',
            'low_stock_threshold', 'reorder_quantity', 'preferred_vendor',
            'vendor_name', 'image', 'is_active', 'is_low_stock',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_vendor_name(self, obj):
        return obj.preferred_vendor.name if obj.preferred_vendor else None


class ItemListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing items."""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Item
        fields = [
            'id', 'name', 'sku', 'category_name', 'current_stock',
            'low_stock_threshold', 'price', 'is_sellable', 'is_low_stock'
        ]


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    """Serializer for PurchaseOrderItem."""
    
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_sku = serializers.CharField(source='item.sku', read_only=True)
    
    class Meta:
        model = PurchaseOrderItem
        fields = [
            'id', 'purchase_order', 'item', 'item_name', 'item_sku',
            'quantity', 'unit_price', 'subtotal', 'received_quantity',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'subtotal', 'created_at', 'updated_at']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    """Serializer for PurchaseOrder."""
    
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'po_number', 'vendor', 'vendor_name', 'order_date',
            'expected_delivery_date', 'status', 'total_amount', 'notes',
            'created_by', 'created_by_name', 'items', 'item_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'po_number', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None
    
    def get_item_count(self, obj):
        return obj.items.count()


class PurchaseOrderListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing purchase orders."""
    
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'po_number', 'vendor_name', 'order_date',
            'status', 'total_amount'
        ]


class StockTransactionSerializer(serializers.ModelSerializer):
    """Serializer for StockTransaction."""
    
    item_name = serializers.CharField(source='item.name', read_only=True)
    performed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = StockTransaction
        fields = [
            'id', 'item', 'item_name', 'transaction_type', 'quantity',
            'unit_price', 'reference', 'notes', 'performed_by',
            'performed_by_name', 'transaction_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_performed_by_name(self, obj):
        return obj.performed_by.get_full_name() if obj.performed_by else None


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for OrderItem."""
    
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_image = serializers.ImageField(source='item.image', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'order', 'item', 'item_name', 'item_image',
            'quantity', 'unit_price', 'subtotal', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'subtotal', 'created_at', 'updated_at']


class InventoryOrderSerializer(serializers.ModelSerializer):
    """Serializer for InventoryOrder."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    order_items = OrderItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = InventoryOrder
        fields = [
            'id', 'student', 'student_name', 'order_number', 'total_amount',
            'status', 'ordered_at', 'updated_at', 'order_items', 'item_count'
        ]
        read_only_fields = ['id', 'order_number', 'ordered_at', 'updated_at']
    
    def get_item_count(self, obj):
        return obj.order_items.count()


class InventoryOrderListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing inventory orders."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    
    class Meta:
        model = InventoryOrder
        fields = [
            'id', 'order_number', 'student_name', 'total_amount',
            'status', 'ordered_at'
        ]


# Request Serializers

class CreatePurchaseOrderSerializer(serializers.Serializer):
    """Serializer for creating a purchase order."""
    
    vendor_id = serializers.UUIDField()
    expected_delivery_date = serializers.DateField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    items = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )


class ReceivePurchaseOrderSerializer(serializers.Serializer):
    """Serializer for receiving a purchase order."""
    
    po_id = serializers.UUIDField()
    items = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )


class CreateStockTransactionSerializer(serializers.Serializer):
    """Serializer for creating a stock transaction."""
    
    item_id = serializers.UUIDField()
    transaction_type = serializers.ChoiceField(choices=StockTransaction.TRANSACTION_TYPES)
    quantity = serializers.IntegerField()
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    reference = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class CreateInventoryOrderSerializer(serializers.Serializer):
    """Serializer for creating an inventory order."""
    
    student_id = serializers.UUIDField()
    items = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
