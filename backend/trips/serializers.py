from rest_framework import serializers

class TripPlanRequestSerializer(serializers.Serializer):
    """
    Validates the incoming JSON payload from the React frontend.
    Ensures all types match our mathematical requirements before hitting the HOS engine.
    """
    currentLocation = serializers.CharField(max_length=255)
    pickupLocation = serializers.CharField(max_length=255)
    dropoffLocation = serializers.CharField(max_length=255)
    
    # We will let the frontend Map API calculate the real distance and time
    # and pass it to us, rather than paying for a backend Geocoding API key.
    totalMiles = serializers.FloatField(min_value=0.1, help_text="Total route miles")
    totalDrivingHours = serializers.FloatField(min_value=0.1, help_text="Total estimated driving hours")
    
    currentCycleUsed = serializers.FloatField(
        min_value=0.0, 
        max_value=70.0, 
        help_text="Hours consumed in the current 70hr/8day cycle"
    )