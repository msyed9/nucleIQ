"""
Inventory Serializers
"""
from rest_framework import serializers
from .models import ItemCategory, Item, StockTransaction, InventoryOrder, OrderItem

class ItemCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemCategory
        fields = '__all__'

class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    class Meta:
        model = Item
        fields = '__all__'

class StockTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockTransaction
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    class Meta:
        model = OrderItem
        fields = '__all__'

class InventoryOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    class Meta:
        model = InventoryOrder
        fields = '__all__'


