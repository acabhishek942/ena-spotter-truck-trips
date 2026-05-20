class HOSEngine:
    """
    State machine that processes trip durations and enforces FMCSA Hours of Service rules.
    Yields discrete timeline events (Driving, On-Duty, Off-Duty, Sleeper) for the ELD graph.
    """
    
    # FMCSA Regulatory Constants
    MAX_DRIVING_HOURS = 11.0      # Max driving hours before 10hr reset is required
    MAX_DUTY_WINDOW = 14.0        # Max shift window (driving + on-duty) before 10hr reset
    MAX_DRIVE_BEFORE_BREAK = 8.0  # Max continuous driving before a 30-min break
    CYCLE_LIMIT = 70.0            # Max on-duty hours in 8 days
    
    # Standard Durations
    MANDATORY_BREAK_HOURS = 0.5   # 30 minutes
    DAILY_RESET_HOURS = 10.0      # 10 hours
    PRE_TRIP_HOURS = 0.5          # 30 mins for pre-trip/post-trip inspections
    LOAD_UNLOAD_HOURS = 1.0       # 1 hour for pickup/dropoff

    def __init__(self, initial_cycle_used=0.0):
        # Global Cycle Clock
        self.cycle_used = initial_cycle_used
        
        # Daily Shift Clocks
        self.shift_drive_time = 0.0
        self.shift_duty_time = 0.0
        self.drive_time_since_break = 0.0
        
        # Timeline array to feed the React frontend
        self.timeline = []

    def log_event(self, status_line, duration, location, description):
        """Records an event and updates the global/shift clocks."""
        self.timeline.append({
            "line": status_line, # 1: Off-Duty, 2: Sleeper, 3: Driving, 4: On-Duty
            "duration": round(duration, 2),
            "location": location,
            "description": description
        })
        
        # Update clocks based on the status line
        if status_line in [3, 4]:  # Driving or On-Duty
            self.cycle_used += duration
            self.shift_duty_time += duration
            if status_line == 3:
                self.shift_drive_time += duration
                self.drive_time_since_break += duration
        elif status_line == 1 and duration >= self.MANDATORY_BREAK_HOURS:
            # A 30+ min break resets the 8-hour driving clock
            self.drive_time_since_break = 0.0
        elif status_line in [1, 2] and duration >= self.DAILY_RESET_HOURS:
            # A 10+ hr rest resets the entire daily shift clocks
            self.shift_drive_time = 0.0
            self.shift_duty_time = 0.0
            self.drive_time_since_break = 0.0

    def enforce_daily_reset_if_needed(self, location):
        """Checks if the 11-hour or 14-hour limits are hit. If so, forces a 10-hour sleeper break."""
        if self.shift_drive_time >= self.MAX_DRIVING_HOURS or self.shift_duty_time >= self.MAX_DUTY_WINDOW:
            # Force a post-trip inspection before sleep
            self.log_event(4, self.PRE_TRIP_HOURS, location, "Post-Trip Inspection")
            # Force 10 hours in the sleeper berth
            self.log_event(2, self.DAILY_RESET_HOURS, location, "10-Hour Daily Reset")
            # Start the next day with a pre-trip
            self.log_event(4, self.PRE_TRIP_HOURS, location, "Pre-Trip Inspection")

    def process_driving_segment(self, hours_needed, location):
        """
        Chunks a driving requirement into legally compliant blocks.
        If a segment exceeds limits, it inserts breaks and daily resets automatically.
        """
        remaining_drive_time = hours_needed

        while remaining_drive_time > 0:
            # 1. Check if we need a 70-hour cycle reset (34-hour restart)
            if self.cycle_used >= self.CYCLE_LIMIT:
                self.log_event(1, 34.0, location, "34-Hour Cycle Restart")
                self.cycle_used = 0.0
                
            # 2. Check Daily Resets (11hr / 14hr)
            self.enforce_daily_reset_if_needed(location)

            # 3. Calculate how much we can drive right now without hitting a violation
            time_until_break = self.MAX_DRIVE_BEFORE_BREAK - self.drive_time_since_break
            time_until_11hr = self.MAX_DRIVING_HOURS - self.shift_drive_time
            time_until_14hr = self.MAX_DUTY_WINDOW - self.shift_duty_time

            # The maximum chunk we can drive in this loop is the lowest of our constraints
            safe_drive_chunk = min(
                remaining_drive_time, 
                time_until_break, 
                time_until_11hr, 
                time_until_14hr
            )

            # Log the driving chunk
            if safe_drive_chunk > 0:
                self.log_event(3, safe_drive_chunk, location, "Driving En-Route")
                remaining_drive_time -= safe_drive_chunk

            # 4. Handle Mandatory 30-Minute Breaks
            if self.drive_time_since_break >= self.MAX_DRIVE_BEFORE_BREAK and remaining_drive_time > 0:
                self.log_event(1, self.MANDATORY_BREAK_HOURS, location, "Mandatory 30-Min Rest Break")

    def plan_trip(self, origin, destination, total_drive_hours):
        """Main orchestration method for a trip."""
        # 1. Start with Pre-Trip and Loading
        self.log_event(4, self.PRE_TRIP_HOURS, origin, "Pre-Trip Inspection")
        self.log_event(4, self.LOAD_UNLOAD_HOURS, origin, "Loading Freight")
        
        # 2. Process the main transit
        # Note: In a real routing scenario, we would break this into segments based on fuel stops.
        self.process_driving_segment(total_drive_hours, "En-Route")
        
        # 3. Handle Drop-off and Post-Trip
        self.enforce_daily_reset_if_needed(destination)
        self.log_event(4, self.LOAD_UNLOAD_HOURS, destination, "Unloading Freight")
        self.log_event(4, self.PRE_TRIP_HOURS, destination, "Post-Trip Inspection")

        return self.timeline