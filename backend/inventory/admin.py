"""
Inventory Admin
"""
from django.contrib import admin
from .models import Item, StockTransaction, InventoryOrder, OrderItem, ItemCategory

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'category', 'current_stock', 'price', 'is_sellable']
    search_fields = ['name', 'sku']
    list_filter = ['category', 'is_sellable']

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(InventoryOrder)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'student', 'total_amount', 'status', 'ordered_at']
    inlines = [OrderItemInline]

@admin.register(StockTransaction)
class StockTransactionAdmin(admin.ModelAdmin):
    list_display = ['item', 'transaction_type', 'quantity', 'transaction_date', 'reference']
    list_filter = ['transaction_type']
