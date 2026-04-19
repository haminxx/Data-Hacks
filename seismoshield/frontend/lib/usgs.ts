const USGS_SIGNIFICANT_HOUR =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_hour.geojson";

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export type EarthquakeCheckResult =
  | {
      triggered: true;
      magnitude: number;
      distance: number;
      location: string;
    }
  | { triggered: false };

/**
 * Poll USGS significant earthquakes in the past hour; trigger if one is within radius and ≥ minMag.
 */
export async function checkForEarthquake(
  userLat = 32.8786,
  userLon = -117.2364,
  minMag = 4.0,
  radiusKm = 150,
): Promise<EarthquakeCheckResult> {
  try {
    const res = await fetch(USGS_SIGNIFICANT_HOUR, { cache: "no-store" });
    if (!res.ok) return { triggered: false };
    const gj = (await res.json()) as {
      features?: Array<{
        geometry?: { coordinates?: [number, number, number?] };
        properties?: {
          mag?: number;
          place?: string;
          title?: string;
        };
      }>;
    };
    const feats = gj.features ?? [];
    for (const f of feats) {
      const mag = f.properties?.mag;
      const coords = f.geometry?.coordinates;
      if (mag == null || coords == null) continue;
      if (mag < minMag) continue;
      const [lon, lat] = coords;
      const distance = haversineKm(userLat, userLon, lat, lon);
      if (distance <= radiusKm) {
        const location =
          f.properties?.place ??
          f.properties?.title ??
          "Unknown location";
        return { triggered: true, magnitude: mag, distance, location };
      }
    }
    return { triggered: false };
  } catch {
    return { triggered: false };
  }
}
