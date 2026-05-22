from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import TripPlanRequestSerializer
from .services.hos_engine import HOSEngine

class TripPlanEngineView(APIView):
    """
    POST /api/v1/trips/plan/
    Ingests 3-point trip telemetry (Current -> Pickup -> Dropoff),
    applies the 1000-mile fuel rule, and generates the HOS ELD logs.
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
        
        # 2. Pre-Trip at Current Location
        engine.log_event(4, engine.PRE_TRIP_HOURS, data['currentLocation'], "Pre-Trip Inspection")

        # 3. Deadhead Transit (Current Location -> Pickup)
        if data['deadheadHours'] > 0:
            engine.process_driving_segment(data['deadheadHours'], "Deadhead to Pickup")

        # 4. Load at Pickup Location
        # Ensure the driver has legal hours to load, force a reset if they burned them on the deadhead
        engine.enforce_daily_reset_if_needed(data['pickupLocation'])
        engine.log_event(4, engine.LOAD_UNLOAD_HOURS, data['pickupLocation'], "Loading Freight")

        # 5. Process Main Transit with Fuel Stops (Pickup -> Drop-off)
        # Calculate if fuel stops are needed based on the 1000-mile assumption rule
        fuel_stops_needed = int(data['transitMiles'] // 1000)
        
        if fuel_stops_needed > 0:
            # Divide the driving time evenly between the required fuel stops
            hours_per_leg = data['transitHours'] / (fuel_stops_needed + 1)
            
            for _ in range(fuel_stops_needed):
                engine.process_driving_segment(hours_per_leg, "Loaded Transit")
                # Add a 30-minute fuel stop (Line 4: On-Duty)
                engine.log_event(4, 0.5, "En-Route", "Refueling (1000 Mile Rule)")
            
            # Drive the remaining final leg to the destination
            engine.process_driving_segment(hours_per_leg, "Loaded Transit")
        else:
            # No fuel stops required, process the entire transit block
            engine.process_driving_segment(data['transitHours'], "Loaded Transit")

        # 6. Unload & Post-Trip at Drop-off
        engine.enforce_daily_reset_if_needed(data['dropoffLocation'])
        engine.log_event(4, engine.LOAD_UNLOAD_HOURS, data['dropoffLocation'], "Unloading Freight")
        engine.log_event(4, engine.PRE_TRIP_HOURS, data['dropoffLocation'], "Post-Trip Inspection")

        # 7. Return the generated timeline array to React
        return Response({
            "status": "success",
            "cycle_remaining": max(0, 70.0 - engine.cycle_used),
            "timeline": engine.timeline
        }, status=status.HTTP_200_OK)