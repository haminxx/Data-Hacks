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
  adjusted_pgv?: number;
  vulnerability_multiplier?: number;
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

/** Offline / demo fallback when GET /demo fails (hackathon resilience). */
export const MOCK_DEMO: DemoResponse = {
  magnitude: 6.5,
  epicenter_lat: 33.19,
  epicenter_lon: -115.54,
  depth_km: 8.25,
  pgv: 12,
  tier: "Moderate",
  color: "#eab308",
  description:
    "Moderate velocities may cause nonstructural damage and some structural distress.",
  building_tips: [
    "Prioritize diaphragm ties and parapet bracing for older construction.",
    "Review egress paths and exterior glass at large openings.",
  ],
};

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
  } catch {
    return {
      pgv: Number(MOCK_DEMO.pgv ?? 10),
      tier: String(MOCK_DEMO.tier ?? "Moderate"),
      color: String(MOCK_DEMO.color ?? "#eab308"),
      description: String(
        MOCK_DEMO.description ?? "Moderate shaking at the building site.",
      ),
      building_tips: Array.isArray(MOCK_DEMO.building_tips)
        ? (MOCK_DEMO.building_tips as string[])
        : ["API offline — showing cached demo risk."],
    };
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
  } catch {
    return {
      points: [
        { lat: 33.19, lon: -115.54, pgv: 50, tier: "High", color: "#f97316" },
        { lat: 32.88, lon: -117.24, pgv: 12, tier: "Moderate", color: "#eab308" },
      ],
    };
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
  } catch {
    return { ...MOCK_DEMO };
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

/** --- Risk assessment (HSS demo) --- */

export interface RiskSubFactor {
  name: string;
  value: string;
  score: number;
  level: string;
}

export interface RiskCriterionBlock {
  score: number;
  weight: number;
  sub_factors: RiskSubFactor[];
}

export interface RiskScoreResponse {
  overall: number;
  seismic_hazard: RiskCriterionBlock;
  building_vulnerability: RiskCriterionBlock;
  historical_record: RiskCriterionBlock;
}

export interface YearlyProjectionRow {
  year: number;
  annual_premium: number;
  annual_expected_claims: number;
  cumulative_premium: number;
  cumulative_claims: number;
  net_position: number;
  worst_case: number;
  p_m5_plus: number;
  p_m6_plus: number;
  p_m7_plus: number;
}

export interface InteriorHazardRow {
  hazard: string;
  location: string;
  risk: string;
  action: string;
  cost: number;
}

export interface FinancialProjectionResponse {
  building: string;
  data_source: string;
  events_analyzed: number;
  years_of_data: number;
  annual_rates: {
    m4_plus: number;
    m5_plus: number;
    m6_plus: number;
    m7_plus: number;
  };
  yearly_projections: YearlyProjectionRow[];
  risk_scores: RiskScoreResponse;
  interior_hazards: InteriorHazardRow[];
  insurance_recommendation: {
    tier: string;
    policy_type: string;
    minimum_coverage: number;
    premium_multiplier: number;
    annual_premium: number;
    action_items: string[];
  };
}

export async function getRiskScore(): Promise<RiskScoreResponse> {
  const { data } = await client.get<RiskScoreResponse>("/risk-score");
  return data;
}

export async function getFinancialProjection(): Promise<FinancialProjectionResponse> {
  const { data } = await client.get<FinancialProjectionResponse>(
    "/financial-projection",
  );
  return data;
}
