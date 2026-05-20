from django.db import models

class TripPlanRequest(models.Model):
    """
    Captures incoming telemetry parameters for an HOS route planning evaluation.
    Tracks state values mapped against strict compliance regulations.
    """
    current_location = models.CharField(max_length=255, help_text="Starting geolocation description or coordinate pair")
    pickup_location = models.CharField(max_length=255, help_text="Origin freight loading terminal location")
    dropoff_location = models.CharField(max_length=255, help_text="Destination freight unloading drop-off point")
    current_cycle_used = models.FloatField(help_text="Current cumulative hours consumed within the active 70hr window")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Plan request from {self.current_location} to {self.dropoff_location} ({self.created_at.date()})"