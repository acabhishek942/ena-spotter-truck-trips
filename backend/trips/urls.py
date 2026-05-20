from django.urls import path
from .views import TripPlanEngineView

urlpatterns = [
    path('plan/', TripPlanEngineView.as_view(), name='trip-plan-evaluate'),
]