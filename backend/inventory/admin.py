"""
Inventory Admin Configuration
"""

from django.contrib import admin
from .models import (
    ItemCategory, Vendor, Item, PurchaseOrder, PurchaseOrderItem,
    StockTransaction, InventoryOrder, OrderItem
)


@admin.register(ItemCategory)
class ItemCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent_category', 'created_at']
    list_filter = ['parent_category', 'created_at']
    search_fields = ['name', 'description']
    raw_id_fields = ['parent_category']
    ordering = ['name']


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_person', 'email', 'phone', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'contact_person', 'email', 'phone']
    ordering = ['name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'contact_person', 'email', 'phone', 'address')
        }),
        ('Tax Information', {
            'fields': ('gstin', 'pan')
        }),
        ('Payment Terms', {
            'fields': ('payment_terms', 'is_active')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
    )


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'category', 'current_stock', 'low_stock_threshold', 'price', 'is_sellable', 'is_active']
    list_filter = ['category', 'is_sellable', 'is_active', 'unit']
    search_fields = ['name', 'sku', 'description']
    raw_id_fields = ['category', 'preferred_vendor']
    ordering = ['name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('category', 'name', 'sku', 'description', 'unit', 'image')
        }),
        ('Pricing', {
            'fields': ('price', 'cost_price', 'is_sellable')
        }),
        ('Stock Management', {
            'fields': ('current_stock', 'low_stock_threshold', 'reorder_quantity', 'preferred_vendor')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 0
    fields = ['item', 'quantity', 'unit_price', 'subtotal', 'received_quantity']
    readonly_fields = ['subtotal']
    raw_id_fields = ['item']


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ['po_number', 'vendor', 'order_date', 'status', 'total_amount', 'created_by']
    list_filter = ['status', 'order_date', 'created_at']
    search_fields = ['po_number', 'vendor__name', 'notes']
    raw_id_fields = ['vendor', 'created_by']
    readonly_fields = ['po_number', 'created_at', 'updated_at']
    ordering = ['-order_date']
    inlines = [PurchaseOrderItemInline]
    
    fieldsets = (
        ('Purchase Order Information', {
            'fields': ('po_number', 'vendor', 'order_date', 'expected_delivery_date')
        }),
        ('Status & Amount', {
            'fields': ('status', 'total_amount')
        }),
        ('Additional Information', {
            'fields': ('notes', 'created_by')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(StockTransaction)
class StockTransactionAdmin(admin.ModelAdmin):
    list_display = ['item', 'transaction_type', 'quantity', 'unit_price', 'transaction_date', 'performed_by']
    list_filter = ['transaction_type', 'transaction_date', 'created_at']
    search_fields = ['item__name', 'reference', 'notes']
    raw_id_fields = ['item', 'performed_by']
    readonly_fields = ['transaction_date', 'created_at', 'updated_at']
    ordering = ['-transaction_date']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ['item', 'quantity', 'unit_price', 'subtotal']
    readonly_fields = ['subtotal']
    raw_id_fields = ['item']


@admin.register(InventoryOrder)
class InventoryOrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'student', 'total_amount', 'status', 'ordered_at']
    list_filter = ['status', 'ordered_at', 'updated_at']
    search_fields = ['order_number', 'student__user__first_name', 'student__user__last_name']
    raw_id_fields = ['student']
    readonly_fields = ['order_number', 'ordered_at', 'updated_at']
    ordering = ['-ordered_at']
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Order Information', {
            'fields': ('order_number', 'student', 'status')
        }),
        ('Amount', {
            'fields': ('total_amount',)
        }),
        ('Timestamps', {
            'fields': ('ordered_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
