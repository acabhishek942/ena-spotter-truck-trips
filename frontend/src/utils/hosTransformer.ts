// frontend/src/utils/hosTransformer.ts

export interface TimelineEvent {
  line: number;
  duration: number;
  location: string;
  description: string;
}

export interface DailyLogSheet {
  dayNumber: number;
  events: TimelineEvent[];
}

export const chunkTimelineIntoDays = (timeline: TimelineEvent[]): DailyLogSheet[] => {
  const days: DailyLogSheet[] = [];
  let currentDay = 1;
  let currentDayHours = 0;
  let currentDayEvents: TimelineEvent[] = [];

  for (const event of timeline) {
    let remainingDuration = event.duration;

    while (remainingDuration > 0) {
      const hoursLeftInDay = 24 - currentDayHours;

      if (remainingDuration <= hoursLeftInDay) {
        // The event fits entirely within the current 24-hour sheet
        currentDayEvents.push({ ...event, duration: remainingDuration });
        currentDayHours += remainingDuration;
        remainingDuration = 0;

        // If the day is exactly full, package it and start the next day
        if (Math.abs(currentDayHours - 24) < 0.01) { 
          days.push({ dayNumber: currentDay, events: currentDayEvents });
          currentDay++;
          currentDayHours = 0;
          currentDayEvents = [];
        }
      } else {
        // The event spills over into the next day (The "Midnight Slicer")
        currentDayEvents.push({ ...event, duration: hoursLeftInDay });
        days.push({ dayNumber: currentDay, events: currentDayEvents });
        
        remainingDuration -= hoursLeftInDay;
        currentDay++;
        currentDayHours = 0;
        currentDayEvents = [];
      }
    }
  }

  // If the trip ends mid-day, pad the rest of the 24-hour sheet with Off-Duty time
  if (currentDayEvents.length > 0 && currentDayHours < 24) {
    const fillerDuration = 24 - currentDayHours;
    currentDayEvents.push({
      line: 1, // Default to Off-Duty
      duration: fillerDuration,
      location: 'Destination',
      description: 'Off-Duty (Post-Trip)'
    });
    days.push({ dayNumber: currentDay, events: currentDayEvents });
  }

  return days;
};