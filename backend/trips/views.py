from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import TripPlanRequestSerializer
from .services.hos_engine import HOSEngine

class TripPlanEngineView(APIView):
    """
    POST /api/v1/trips/plan/
    Ingests trip telemetry, applies the 1000-mile fuel rule, and generates the HOS ELD logs.
    """
    
    def post(self, request):
        serializer = TripPlanRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                "error": "Invalid trip parameters",
                "details": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        
        # 1. Initialize the HOS Engine with the driver's current cycle
        engine = HOSEngine(initial_cycle_used=data['currentCycleUsed'])
        
        # 2. Check Assessment Assumption: Fueling every 1,000 miles
        # We calculate how many fuel stops are required based on the frontend's mileage.
        total_miles = data['totalMiles']
        fuel_stops_needed = int(total_miles // 1000)
        
        # 3. Pre-Trip & Loading
        engine.log_event(4, engine.PRE_TRIP_HOURS, data['pickupLocation'], "Pre-Trip Inspection")
        engine.log_event(4, engine.LOAD_UNLOAD_HOURS, data['pickupLocation'], "Loading Freight")

        # 4. Process Transit and Inject Fuel Stops
        if fuel_stops_needed > 0:
            # Split the driving time evenly between fuel stops
            hours_per_leg = data['totalDrivingHours'] / (fuel_stops_needed + 1)
            
            for i in range(fuel_stops_needed):
                engine.process_driving_segment(hours_per_leg, "En-Route")
                # Add a 30-minute fuel stop (Line 4: On-Duty)
                engine.log_event(4, 0.5, "En-Route Fuel Station", "Refueling (1000 Mile Rule)")
            
            # Drive the remaining final leg
            engine.process_driving_segment(hours_per_leg, "En-Route")
        else:
            # No fuel stops required, process the whole trip
            engine.process_driving_segment(data['totalDrivingHours'], "En-Route")

        # 5. Drop-off & Post-Trip
        engine.enforce_daily_reset_if_needed(data['dropoffLocation'])
        engine.log_event(4, engine.LOAD_UNLOAD_HOURS, data['dropoffLocation'], "Unloading Freight")
        engine.log_event(4, engine.PRE_TRIP_HOURS, data['dropoffLocation'], "Post-Trip Inspection")

        # 6. Return the generated timeline array to React
        return Response({
            "status": "success",
            "cycle_remaining": max(0, 70.0 - engine.cycle_used),
            "timeline": engine.timeline
        }, status=status.HTTP_200_OK)