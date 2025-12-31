from rest_framework import serializers, viewsets
from .models import Habit, StudentHabitLog
from core.middleware import get_current_tenant

class HabitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habit
        fields = '__all__'

class StudentHabitLogSerializer(serializers.ModelSerializer):
    habit_name = serializers.CharField(source='habit.name', read_only=True)
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    class Meta:
        model = StudentHabitLog
        fields = '__all__'

class HabitViewSet(viewsets.ModelViewSet):
    queryset = Habit.objects.all()
    serializer_class = HabitSerializer
    def get_queryset(self): return Habit.objects.filter(tenant=get_current_tenant())

class StudentHabitLogViewSet(viewsets.ModelViewSet):
    queryset = StudentHabitLog.objects.all()
    serializer_class = StudentHabitLogSerializer
    def get_queryset(self): return StudentHabitLog.objects.filter(tenant=get_current_tenant())
