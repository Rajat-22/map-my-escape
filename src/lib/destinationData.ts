import {
  ItineraryData,
  ItineraryStop,
  DayPlan,
  TripRequest,
  ItineraryCategory,
} from "@/types/itinerary";

// Known coordinates database for popular Indian destinations
export const KNOWN_DESTINATIONS: Record<
  string,
  {
    lat: number;
    lng: number;
    region: string;
    summary: string;
    highlights: string[];
    packing: string[];
    season: string;
    presetStops: Array<{
      name: string;
      category: ItineraryCategory;
      deltaLat: number;
      deltaLng: number;
      duration: string;
      description: string;
      tip: string;
    }>;
  }
> = {
  manali: {
    lat: 32.2432,
    lng: 77.1892,
    region: "Himachal Pradesh",
    summary: "Highland valleys, cedar forests, rapid Beas river, and bohemian mountain cafes.",
    highlights: ["Hadimba Temple forest walks", "Jogini Waterfalls hike", "Old Manali riverside cafes"],
    packing: ["Layered thermals", "Trekking shoes with grip", "Woolen beanie & gloves"],
    season: "March to June & September to November",
    presetStops: [
      {
        name: "Hadimba Devi Temple",
        category: "temple",
        deltaLat: 0.005,
        deltaLng: -0.008,
        duration: "1.5 hours",
        description: "Historic 16th-century wooden pagoda temple amidst towering deodar cedars.",
        tip: "Visit early morning around 8 AM before tourist tour buses arrive.",
      },
      {
        name: "Old Manali Riverside Cafe",
        category: "cafe",
        deltaLat: 0.009,
        deltaLng: -0.004,
        duration: "1.5 hours",
        description: "Cozy bohemian wooden terrace overlooking the mountain stream.",
        tip: "Try the freshly baked apple pie and local ginger lemon honey tea.",
      },
      {
        name: "Jogini Waterfall Trek",
        category: "waterfall",
        deltaLat: 0.025,
        deltaLng: 0.012,
        duration: "2.5 hours",
        description: "Scenic pine trail crossing apple orchards to a cascading cliff waterfall.",
        tip: "Carry a small water bottle and camera for panoramic valley views.",
      },
      {
        name: "Vashisht Hot Springs & Temple",
        category: "temple",
        deltaLat: 0.018,
        deltaLng: 0.01,
        duration: "1 hour",
        description: "Ancient stone temple featuring natural mineral-rich sulfur thermal baths.",
        tip: "Early evening is soothing after hiking the trail.",
      },
      {
        name: "Solang Valley Viewpoint",
        category: "mountain",
        deltaLat: 0.065,
        deltaLng: -0.035,
        duration: "3 hours",
        description: "Expansive high-altitude meadow framed by snow-capped Himalayan peaks.",
        tip: "Book paragliding or ropeway tickets in advance on clear sunny mornings.",
      },
      {
        name: "Mall Road Cultural Bazaars",
        category: "market",
        deltaLat: -0.004,
        deltaLng: 0.002,
        duration: "2 hours",
        description: "Vibrant pedestrian promenade with Kullu shawls, wooden crafts, and street eats.",
        tip: "Great place for local hot momos and souvenir shopping in the evening.",
      },
    ],
  },
  goa: {
    lat: 15.4989,
    lng: 73.8278,
    region: "Goa Coast",
    summary: "Golden tropical beaches, cliffside sunset points, Portuguese heritage, and seafood shacks.",
    highlights: ["Vagator cliff sunsets", "Anjuna flea market vibe", "Chapora Fort coastline views"],
    packing: ["Sunscreen SPF 50+", "Comfortable flip-flops", "Light breathable linen clothing"],
    season: "October to April",
    presetStops: [
      {
        name: "Vagator Sunset Cliff",
        category: "viewpoint",
        deltaLat: 0.103,
        deltaLng: -0.088,
        duration: "2 hours",
        description: "Dramatic red laterite cliffs dropping straight into the Arabian Sea.",
        tip: "Arrive at 5:15 PM to grab a front-row ledge for the orange sunset.",
      },
      {
        name: "Anjuna Beach Shack",
        category: "cafe",
        deltaLat: 0.088,
        deltaLng: -0.087,
        duration: "2 hours",
        description: "Laid-back beachfront cafe with chilled coconut water and ambient music.",
        tip: "Order the fresh catch rava fry and coconut smoothie.",
      },
      {
        name: "Chapora Fort Vista",
        category: "heritage",
        deltaLat: 0.108,
        deltaLng: -0.084,
        duration: "1.5 hours",
        description: "Historic 17th-century bastion offering 360-degree views of Ozran and Morjim.",
        tip: "Wear shoes with good grip on the sloping cobblestone path.",
      },
      {
        name: "Ashwem Quiet Sands",
        category: "beach",
        deltaLat: 0.171,
        deltaLng: -0.098,
        duration: "2.5 hours",
        description: "Pristine white sand beach with gentle surf and peaceful coconut groves.",
        tip: "Rent a beach lounger under the shade for a tranquil reading afternoon.",
      },
      {
        name: "Fontainhas Latin Quarter",
        category: "heritage",
        deltaLat: -0.005,
        deltaLng: 0.006,
        duration: "2 hours",
        description: "Colorful Portuguese-era heritage streets lined with terracotta-tiled mansions.",
        tip: "Walk early in the morning for striking architectural photography.",
      },
      {
        name: "Saturday Night Market Vibe",
        category: "market",
        deltaLat: 0.085,
        deltaLng: -0.071,
        duration: "2 hours",
        description: "Lively bazaar filled with handmade jewelry, live world music, and spice stalls.",
        tip: "Carry some cash as card machines can get patchy in outdoor stalls.",
      },
    ],
  },
  rishikesh: {
    lat: 30.0869,
    lng: 78.2676,
    region: "Uttarakhand",
    summary: "The Yoga Capital perched along emerald waters of the holy Ganges river.",
    highlights: ["Triveni Ghat evening Maha Aarti", "Neer Garh hidden waterfall", "Beatles Ashram murals"],
    packing: ["Modest cotton clothing for ghats", "Quick-dry shorts for rafting", "Slip-on sandals"],
    season: "September to May",
    presetStops: [
      {
        name: "Triveni Ghat Evening Aarti",
        category: "temple",
        deltaLat: 0.024,
        deltaLng: 0.038,
        duration: "1.5 hours",
        description: "Spiritual ritual of rhythmic fire lamps and Vedic chanting along the riverbanks.",
        tip: "Arrive 30 minutes before sunset to sit near the main steps.",
      },
      {
        name: "Neer Garh Waterfall Hike",
        category: "waterfall",
        deltaLat: 0.052,
        deltaLng: 0.051,
        duration: "2.5 hours",
        description: "Two-tiered crystal mountain stream plunging into turquoise plunge pools.",
        tip: "Wear trekking sandals as you will cross small shallow pebble streams.",
      },
      {
        name: "Beatles Ashram (Chaurasi Kutia)",
        category: "heritage",
        deltaLat: 0.015,
        deltaLng: 0.045,
        duration: "2 hours",
        description: "Former meditation retreat covered in vibrant psychedelic pop-art murals.",
        tip: "Great photo spot inside the stone meditation dome caves.",
      },
      {
        name: "Tapovan Rooftop Bakery",
        category: "cafe",
        deltaLat: 0.043,
        deltaLng: 0.041,
        duration: "1.5 hours",
        description: "Organic terrace cafe with panoramic bridge views and herbal teas.",
        tip: "Try the freshly pulled espresso and cinnamon carrot cake.",
      },
      {
        name: "Kunjapuri Sunrise Peak",
        category: "viewpoint",
        deltaLat: 0.085,
        deltaLng: 0.022,
        duration: "3 hours",
        description: "High mountain temple offering dawn views of the snow-clad Garhwal peaks.",
        tip: "Departure at 4:30 AM is essential to catch first light hitting the mountains.",
      },
    ],
  },
};

// Helper function to generate an authentic fallback itinerary based on destination and vibes
export function generateFallbackItinerary(request: TripRequest): ItineraryData {
  const cityKey = request.startingCity.toLowerCase();
  let baseCoords = { lat: 28.6139, lng: 77.209 }; // Default Delhi
  let destinationInfo = {
    region: "India",
    summary: `Dynamic, sequenced ${request.days}-day itinerary tailored for ${request.pace} pace and vibes: ${request.interests.join(", ")}.`,
    highlights: ["Scenic morning walks", "Local cultural highlights", "Evening sunset vantage points"],
    packing: ["Comfortable walking shoes", "Weather-appropriate layers", "Universal phone charger & power bank"],
    season: "Year-Round",
    presetStops: [
      {
        name: "Historic Heritage Landmark",
        category: "heritage" as ItineraryCategory,
        deltaLat: 0.015,
        deltaLng: 0.01,
        duration: "2 hours",
        description: "Explore storied architectural ruins and iconic historic monuments.",
        tip: "Early morning hours are ideal to beat any crowd.",
      },
      {
        name: "Artisanal Coffee & Roastery",
        category: "cafe" as ItineraryCategory,
        deltaLat: -0.01,
        deltaLng: 0.015,
        duration: "1.5 hours",
        description: "Relax at a vibrant neighborhood cafe with local roasts and pastries.",
        tip: "Ask the barista for their signature single-origin brew.",
      },
      {
        name: "Panoramic Sunset Viewpoint",
        category: "viewpoint" as ItineraryCategory,
        deltaLat: 0.02,
        deltaLng: -0.015,
        duration: "1.5 hours",
        description: "Elevated vantage point offering golden hour views across the skyline.",
        tip: "Bring a light jacket as the breeze picks up at sunset.",
      },
      {
        name: "Night Lantern Market",
        category: "market" as ItineraryCategory,
        deltaLat: -0.005,
        deltaLng: -0.008,
        duration: "2 hours",
        description: "Bustling evening market featuring artisan crafts, spices, and street culinary delights.",
        tip: "Sample the local specialties and pick up handcrafted keepsakes.",
      },
    ],
  };

  // Match known destinations
  for (const [key, dest] of Object.entries(KNOWN_DESTINATIONS)) {
    if (cityKey.includes(key)) {
      baseCoords = { lat: dest.lat, lng: dest.lng };
      destinationInfo = dest;
      break;
    }
  }

  const stopsPerDay = request.pace === "relaxed" ? 2 : request.pace === "fast" ? 4 : 3;
  const timeSlots: Array<"Morning" | "Afternoon" | "Evening" | "Night"> = [
    "Morning",
    "Afternoon",
    "Evening",
    "Night",
  ];

  const allStops: ItineraryStop[] = [];
  const days: DayPlan[] = [];

  const availablePresetStops = [...destinationInfo.presetStops];

  for (let dayNum = 1; dayNum <= request.days; dayNum++) {
    const dayStops: ItineraryStop[] = [];
    const dayThemes = [
      "Arrival & Cultural Foundations",
      "Scenic Trails & Secret Havens",
      "Heritage Discoveries & Sunset Vistas",
      "Local Flavors & Hidden Waterways",
      "Alpine Heights & Serene Retreats",
      "Artisan Quarters & Coastal Bazaars",
      "Dawn Contemplation & Grand Finale",
    ];

    for (let s = 0; s < stopsPerDay; s++) {
      const stopIndex = ((dayNum - 1) * stopsPerDay + s) % availablePresetStops.length;
      const template = availablePresetStops[stopIndex];
      const timeOfDay = timeSlots[s % timeSlots.length];

      // Jitter coordinates realistically so each day stop has unique positions
      const jitterLat = (s - 1) * 0.007 + (dayNum - 1) * 0.004;
      const jitterLng = (s - 1) * 0.006 - (dayNum - 1) * 0.003;

      const stop: ItineraryStop = {
        id: `stop-d${dayNum}-${s + 1}`,
        day: dayNum,
        order: s + 1,
        timeOfDay,
        name: `${template.name} ${dayNum > 1 && s === 0 ? "(Day " + dayNum + ")" : ""}`.trim(),
        category: template.category,
        lat: Number((baseCoords.lat + template.deltaLat + jitterLat).toFixed(5)),
        lng: Number((baseCoords.lng + template.deltaLng + jitterLng).toFixed(5)),
        estimatedDuration: template.duration,
        travelTimeFromPrevious: s === 0 ? "15-20 min from Stay" : "20-25 min via " + request.transport,
        description: template.description,
        insiderTip: template.tip,
        bestTimeToVisit: timeOfDay,
      };

      dayStops.push(stop);
      allStops.push(stop);
    }

    days.push({
      day: dayNum,
      title: `Day ${dayNum}: ${dayThemes[(dayNum - 1) % dayThemes.length]}`,
      theme: dayThemes[(dayNum - 1) % dayThemes.length],
      stops: dayStops,
    });
  }

  return {
    id: `escape-${Date.now()}`,
    tripTitle: `${request.days}-Day ${request.startingCity} Escape Route`,
    startingCity: request.startingCity,
    hotel: request.hotel,
    destinationSummary: destinationInfo.summary,
    totalDays: request.days,
    pace: request.pace,
    transport: request.transport,
    days,
    stops: allStops,
    highlights: destinationInfo.highlights,
    packingTips: destinationInfo.packing,
    bestSeason: destinationInfo.season,
    isFallback: true,
  };
}
