"""
Inventory & School Store Models
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.core.validators import MinValueValidator
from core.models import TenantAwareModel
import uuid

class ItemCategory(TenantAwareModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    parent_category = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subcategories'
    )

    class Meta:
        db_table = 'inventory_categories'
        verbose_name = 'Item Category'
        verbose_name_plural = 'Item Categories'
        ordering = ['name']
        indexes = [
            models.Index(fields=['tenant', 'name']),
        ]

    def __str__(self):
        return self.name


class Vendor(TenantAwareModel):
    """Supplier/Vendor Management"""
    
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    
    gstin = models.CharField(
        max_length=15,
        blank=True,
        help_text="GST Identification Number"
    )
    pan = models.CharField(
        max_length=10,
        blank=True,
        help_text="PAN Number"
    )
    
    payment_terms = models.CharField(
        max_length=100,
        blank=True,
        help_text="e.g., Net 30 days"
    )
    
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'inventory_vendors'
        verbose_name = 'Vendor'
        verbose_name_plural = 'Vendors'
        ordering = ['name']
        indexes = [
            models.Index(fields=['tenant', 'is_active']),
        ]
    
    def __str__(self):
        return self.name


class Item(TenantAwareModel):
    """Product Master"""
    
    UNIT_CHOICES = [
        ('PCS', 'Pieces'),
        ('KG', 'Kilograms'),
        ('LTR', 'Liters'),
        ('BOX', 'Box'),
        ('SET', 'Set'),
        ('PACK', 'Pack'),
    ]
    
    category = models.ForeignKey(
        ItemCategory,
        on_delete=models.SET_NULL,
        null=True,
        related_name='items_in_category'
    )
    name = models.CharField(max_length=200)
    sku = models.CharField(
        max_length=50,
        blank=True,
        help_text=_("Stock Keeping Unit")
    )
    description = models.TextField(blank=True)
    unit = models.CharField(
        max_length=10,
        choices=UNIT_CHOICES,
        default='PCS'
    )
    
    # Store settings
    is_sellable = models.BooleanField(
        default=False,
        help_text=_("Available in Parent Store?")
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text=_("Selling Price")
    )
    cost_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_("Purchase Cost")
    )
    
    # Stock
    current_stock = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=10)
    reorder_quantity = models.IntegerField(default=50)
    
    # Preferred vendor
    preferred_vendor = models.ForeignKey(
        Vendor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='preferred_items'
    )
    
    image = models.ImageField(
        upload_to='inventory/items/',
        null=True,
        blank=True
    )
    
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'inventory_items'
        verbose_name = 'Item'
        verbose_name_plural = 'Items'
        ordering = ['name']
        indexes = [
            models.Index(fields=['tenant', 'is_active']),
            models.Index(fields=['category', 'is_sellable']),
            models.Index(fields=['sku']),
        ]

    def __str__(self):
        return self.name
    
    @property
    def is_low_stock(self):
        return self.current_stock <= self.low_stock_threshold


class PurchaseOrder(TenantAwareModel):
    """Purchase Order to Vendor"""
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SENT', 'Sent to Vendor'),
        ('CONFIRMED', 'Confirmed'),
        ('RECEIVED', 'Received'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    po_number = models.CharField(max_length=50, unique=True)
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.PROTECT,
        related_name='purchase_orders'
    )
    
    order_date = models.DateField(default=timezone.now)
    expected_delivery_date = models.DateField(null=True, blank=True)
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT'
    )
    
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_purchase_orders'
    )
    
    class Meta:
        db_table = 'inventory_purchase_orders'
        verbose_name = 'Purchase Order'
        verbose_name_plural = 'Purchase Orders'
        ordering = ['-order_date']
        indexes = [
            models.Index(fields=['tenant', 'status', 'order_date']),
            models.Index(fields=['vendor', 'status']),
            models.Index(fields=['po_number']),
        ]
    
    def __str__(self):
        return f"{self.po_number} - {self.vendor.name}"
    
    def save(self, *args, **kwargs):
        if not self.po_number:
            # Generate PO number
            self.po_number = f"PO-{timezone.now().year}-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)


class PurchaseOrderItem(TenantAwareModel):
    """Line items in a Purchase Order"""
    
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name='items'
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.PROTECT,
        related_name='po_items'
    )
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    received_quantity = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'inventory_po_items'
        verbose_name = 'Purchase Order Item'
        verbose_name_plural = 'Purchase Order Items'
    
    def save(self, *args, **kwargs):
        self.subtotal = self.quantity * self.unit_price
        super().save(*args, **kwargs)


class StockTransaction(TenantAwareModel):
    """GRN, Issues, Adjustments"""
    
    TRANSACTION_TYPES = [
        ('GRN', 'Goods Received (Purchase)'),
        ('ISSUE', 'Issued Internal'),
        ('SALE', 'Sold via Store'),
        ('ADJUST', 'Stock Adjustment'),
        ('RETURN', 'Return In'),
    ]
    
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='stock_transactions'
    )
    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPES
    )
    quantity = models.IntegerField()  # Positive adds to stock, negative removes
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    reference = models.CharField(
        max_length=100,
        blank=True,
        help_text=_("PO Number / Order ID")
    )
    notes = models.TextField(blank=True)
    performed_by = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        related_name='staff_stock_transactions'
    )
    
    transaction_date = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'inventory_transactions'
        verbose_name = 'Stock Transaction'
        verbose_name_plural = 'Stock Transactions'
        ordering = ['-transaction_date']
        indexes = [
            models.Index(fields=['tenant', 'transaction_date']),
            models.Index(fields=['item', 'transaction_type']),
        ]
    
    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.item.name} ({self.quantity})"

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
    
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='student_store_orders'
    )
    order_number = models.CharField(max_length=50, unique=True)
    
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    
    ordered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventory_orders'
        verbose_name = 'Inventory Order'
        verbose_name_plural = 'Inventory Orders'
        ordering = ['-ordered_at']
        indexes = [
            models.Index(fields=['tenant', 'status', 'ordered_at']),
            models.Index(fields=['student', 'status']),
            models.Index(fields=['order_number']),
        ]
    
    def __str__(self):
        return f"{self.order_number} - {self.student.get_full_name()}"


class OrderItem(TenantAwareModel):
    order = models.ForeignKey(
        InventoryOrder,
        on_delete=models.CASCADE,
        related_name='order_items'
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.SET_NULL,
        null=True,
        related_name='item_orders'
    )
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    class Meta:
        db_table = 'inventory_order_items'
        verbose_name = 'Order Item'
        verbose_name_plural = 'Order Items'
    
    def save(self, *args, **kwargs):
        self.subtotal = self.quantity * self.unit_price
        super().save(*args, **kwargs)


