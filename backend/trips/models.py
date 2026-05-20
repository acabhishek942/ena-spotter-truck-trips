from django.contrib.gis.db import models as gis_models
from django.db import models

class TripPlanRequest(models.Model):
    """
    Architectural GIS schema utilizing native spatial geometry fields.
    Stores coordinate data natively as Point geometry (Longitude, Latitude).
    """
    # Using spatial_index=True optimizes querying if you ever need to search "trips near me"
    current_coordinates = gis_models.PointField(
        spatial_index=True,
        null=True,
        blank=True,
        help_text="Current physical location pin"
    )
    pickup_coordinates = gis_models.PointField(
        spatial_index=True,
        null=True,
        blank=True,
        help_text="Origin load pickup pin"
    )
    dropoff_coordinates = gis_models.PointField(
        spatial_index=True,
        null=True,
        blank=True,
        help_text="Destination dropoff pin"
    )
    
    current_cycle_used = models.FloatField(
        help_text="Current cumulative hours consumed within the active 70hr window",
        default=0.0
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Trip Evaluation: {self.pickup_coordinates.coords} -> {self.dropoff_coordinates.coords}"