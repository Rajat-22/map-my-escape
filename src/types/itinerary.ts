export type ItineraryCategory =
  | "temple"
  | "cafe"
  | "trek"
  | "mountain"
  | "waterfall"
  | "beach"
  | "hotel"
  | "viewpoint"
  | "heritage"
  | "market"
  | "other";

export type TimeOfDay = "Morning" | "Afternoon" | "Evening" | "Night";

export interface ItineraryStop {
  id: string;
  day: number;
  order: number;
  timeOfDay: TimeOfDay;
  name: string;
  category: ItineraryCategory;
  lat: number;
  lng: number;
  estimatedDuration: string;
  travelTimeFromPrevious?: string;
  description: string;
  insiderTip?: string;
  bestTimeToVisit?: string;
}

export interface DayPlan {
  day: number;
  title: string;
  theme: string;
  stops: ItineraryStop[];
}

export interface ItineraryData {
  id: string;
  tripTitle: string;
  startingCity: string;
  mustVisitPlaces?: string[];
  destinationSummary: string;
  totalDays: number;
  pace: "relaxed" | "moderate" | "fast";
  transport: string;
  days: DayPlan[];
  stops: ItineraryStop[];
  highlights: string[];
  packingTips: string[];
}

export interface TripRequest {
  startingCity: string;
  mustVisitPlaces?: string[];
  days: number;
  interests: string[];
  pace: "relaxed" | "moderate" | "fast";
  transport: string;
  customNotes?: string;
  variationSeed?: number;
}
