from rest_framework import serializers

# backend/trips/serializers.py
from rest_framework import serializers

class TripPlanRequestSerializer(serializers.Serializer):
    currentLocation = serializers.CharField(max_length=255)
    pickupLocation = serializers.CharField(max_length=255)
    dropoffLocation = serializers.CharField(max_length=255)
    
    currentCycleUsed = serializers.FloatField(min_value=0.0, max_value=70.0)
    
    deadheadMiles = serializers.FloatField(min_value=0.0)
    deadheadHours = serializers.FloatField(min_value=0.0)
    transitMiles = serializers.FloatField(min_value=0.1)
    transitHours = serializers.FloatField(min_value=0.1)