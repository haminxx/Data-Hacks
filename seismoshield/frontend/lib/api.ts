import axios, { type AxiosError } from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

const client = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

export interface EarthquakeInput {
  magnitude: number;
  epicenter_lat: number;
  epicenter_lon: number;
}

/** POST /predict — model risk tier and tips for the target building */
export interface PredictResponse {
  pgv: number;
  tier: string;
  color: string;
  description: string;
  building_tips: string[];
}

/** POST /heatmap — grid points for Mapbox heatmap */
export interface HeatmapPoint {
  lat: number;
  lon: number;
  pgv: number;
  tier: string;
  color: string;
}

export interface HeatmapResponse {
  points: HeatmapPoint[];
}

/** POST /insurance — vulnerability-adjusted risk and premium tier */
export interface InsuranceResponse {
  pgv: number;
  tier: string;
  color: string;
  description: string;
  building_tips: string[];
  insurance_tier: string;
  premium_multiplier: number;
}

/** GET /demo — instant M6.5 Salton Sea pre-computed scenario */
export interface DemoResponse {
  magnitude?: number;
  epicenter_lat?: number;
  epicenter_lon?: number;
  pgv?: number;
  tier?: string;
  color?: string;
  description?: string;
  building_tips?: string[];
  [key: string]: unknown;
}

/** GET /scenarios — precomputed scenario list */
export interface ScenarioItem {
  magnitude: number;
  epicenter_lat: number;
  epicenter_lon: number;
  label?: string;
  pgv?: number;
  tier?: string;
  [key: string]: unknown;
}

export type ScenariosResponse = ScenarioItem[];

function unwrapAxiosError(err: unknown): never {
  const ax = err as AxiosError<{ detail?: string }>;
  const msg =
    ax.response?.data?.detail ??
    ax.message ??
    "Request failed";
  throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
}

export async function predict(
  magnitude: number,
  epicenter_lat: number,
  epicenter_lon: number,
): Promise<PredictResponse> {
  try {
    const { data } = await client.post<PredictResponse>("/predict", {
      magnitude,
      epicenter_lat,
      epicenter_lon,
    });
    return data;
  } catch (e) {
    unwrapAxiosError(e);
  }
}

export async function getHeatmap(
  magnitude: number,
  epicenter_lat: number,
  epicenter_lon: number,
): Promise<HeatmapResponse> {
  try {
    const { data } = await client.post<HeatmapResponse>("/heatmap", {
      magnitude,
      epicenter_lat,
      epicenter_lon,
    });
    return data;
  } catch (e) {
    unwrapAxiosError(e);
  }
}

export async function getInsurance(
  magnitude: number,
  epicenter_lat: number,
  epicenter_lon: number,
): Promise<InsuranceResponse> {
  try {
    const { data } = await client.post<InsuranceResponse>("/insurance", {
      magnitude,
      epicenter_lat,
      epicenter_lon,
    });
    return data;
  } catch (e) {
    unwrapAxiosError(e);
  }
}

export async function getDemo(): Promise<DemoResponse> {
  try {
    const { data } = await client.get<DemoResponse>("/demo");
    return data;
  } catch (e) {
    unwrapAxiosError(e);
  }
}

export async function getScenarios(): Promise<ScenariosResponse> {
  try {
    const { data } = await client.get<ScenariosResponse>("/scenarios");
    return data;
  } catch (e) {
    unwrapAxiosError(e);
  }
}
