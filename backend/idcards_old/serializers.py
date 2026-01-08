"""
Serializers for ID Cards
"""

from rest_framework import serializers
from .models import IDCardTemplate, IDCardDesign, IDCardGeneration


class IDCardTemplateSerializer(serializers.ModelSerializer):
    """Serializer for ID card templates."""
    
    class Meta:
        model = IDCardTemplate
        fields = [
            'id', 'name', 'description', 'card_type', 'orientation',
            'category', 'width_mm', 'height_mm', 'design_json',
            'preview_image', 'is_global', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class IDCardDesignSerializer(serializers.ModelSerializer):
    """Serializer for ID card designs."""
    
    class Meta:
        model = IDCardDesign
        fields = [
            'id', 'tenant', 'name', 'description', 'card_type',
            'orientation', 'width_mm', 'height_mm', 'design_json',
            'is_active', 'is_default',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class IDCardGenerationSerializer(serializers.ModelSerializer):
    """Serializer for ID card generations."""
    
    design_name = serializers.CharField(source='design.name', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    
    class Meta:
        model = IDCardGeneration
        fields = [
            'id', 'tenant', 'design', 'design_name', 'card_type',
            'filters', 'total_cards', 'output_file', 'status',
            'error_message', 'generated_by', 'generated_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'design_name', 'generated_by_name']
