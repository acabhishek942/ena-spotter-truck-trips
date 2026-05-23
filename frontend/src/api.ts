// frontend/src/api.ts

export interface HOSResponse {
  status: string;
  cycle_remaining: number;
  timeline: Array<{
    line: number; // 1: Off-Duty, 2: Sleeper, 3: Driving, 4: On-Duty
    duration: number; // in hours
    location: string;
    description: string;
  }>;
}

export const API_BASE_URL = import.meta.env.PROD 
  ? 'https://ena-spotter-truck-trips.onrender.com' 
  : 'http://127.0.0.1:8000';

export const fetchTripPlan = async (payload: any): Promise<HOSResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/trips/plan/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch trip plan');
  }

  return response.json();
};