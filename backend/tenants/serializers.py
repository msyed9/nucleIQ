from rest_framework import serializers
from .models import AcademicYear, GradeLevel, Section, Department

class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class GradeLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeLevel
        fields = '__all__'

class SectionSerializer(serializers.ModelSerializer):
    grade_level_name = serializers.CharField(source='grade_level.name', read_only=True)
    
    class Meta:
        model = Section
        fields = '__all__'
