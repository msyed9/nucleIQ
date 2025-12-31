"""
Inventory & School Store Models
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from core.models import TenantAwareModel

class ItemCategory(TenantAwareModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'inventory_categories'
        verbose_name_plural = 'Item Categories'

    def __str__(self):
        return self.name

class Item(TenantAwareModel):
    """Product Master"""
    category = models.ForeignKey(ItemCategory, on_delete=models.SET_NULL, null=True, related_name='items_in_category')
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, blank=True, help_text=_("Stock Keeping Unit"))
    description = models.TextField(blank=True)
    
    # Store settings
    is_sellable = models.BooleanField(default=False, help_text=_("Available in Parent Store?"))
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text=_("Selling Price"))
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text=_("Purchase Cost"))
    
    # Stock
    current_stock = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=10)
    
    image = models.ImageField(upload_to='inventory/items/', null=True, blank=True)

    class Meta:
        db_table = 'inventory_items'

    def __str__(self):
        return self.name

class StockTransaction(TenantAwareModel):
    """GRN, Issues, Adjustments"""
    TRANSACTION_TYPES = [
        ('GRN', 'Goods Received (Purchase)'),
        ('ISSUE', 'Issued Internal'),
        ('SALE', 'Sold via Store'),
        ('ADJUST', 'Stock Adjustment'),
        ('RETURN', 'Return In'),
    ]
    
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='stock_transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.IntegerField() # Positive adds to stock, negative removes
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    reference = models.CharField(max_length=100, blank=True, help_text=_("PO Number / Order ID"))
    notes = models.TextField(blank=True)
    performed_by = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True, related_name='staff_stock_transactions')
    
    transaction_date = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'inventory_transactions'

    def save(self, *args, **kwargs):
        # Update Item Stock on save (Simple MVP Logic)
        if not self.id:
            self.item.current_stock += self.quantity
            self.item.save()
        super().save(*args, **kwargs)

class InventoryOrder(TenantAwareModel):
    """Parent E-commerce Order"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending Payment'),
        ('PAID', 'Paid / Processing'),
        ('READY', 'Ready for Pickup'),
        ('DELIVERED', 'Delivered / Picked Up'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='student_store_orders')
    order_number = models.CharField(max_length=50, unique=True)
    
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    ordered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventory_orders'

class OrderItem(TenantAwareModel):
    order = models.ForeignKey(InventoryOrder, on_delete=models.CASCADE, related_name='order_items')
    item = models.ForeignKey(Item, on_delete=models.SET_NULL, null=True, related_name='item_orders')
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'inventory_order_items'


