import axios, { type AxiosError } from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

// 6s timeout is plenty for the local FastAPI (<100ms round-trip) and
// cuts the "stuck loading…" case when the backend isn't running down
// from ~30s (OS TCP wait) to a visible failure we can fall back on
// with the MOCK payloads below. Without this every API-less demo
// saw the /risk/results page hang on the spinner.
const client = axios.create({
  baseURL,
  timeout: 6000,
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

/**
 * Offline fallbacks for the two risk endpoints. These are the exact
 * shapes the demo page expects, populated with the deterministic
 * HSS scenario values the backend normally returns. Having them
 * means the /risk/results page NEVER hangs on the loading spinner
 * just because the FastAPI server isn't running — a critical
 * fix for the hackathon demo loop.
 *
 * Keep these in sync with the real backend defaults in
 * `seismoshield/backend/main.py`.
 */
export const MOCK_RISK_SCORE: RiskScoreResponse = {
  overall: 72,
  seismic_hazard: {
    score: 62,
    weight: 0.4,
    sub_factors: [
      { name: "Proximity to fault", value: "~8 km (Rose Canyon)", score: 74, level: "High" },
      { name: "Soil type (Vs30)", value: "280 m/s", score: 58, level: "Moderate" },
      { name: "Seismic zone", value: "UBC Zone 4", score: 80, level: "High" },
    ],
  },
  building_vulnerability: {
    score: 78,
    weight: 0.35,
    sub_factors: [
      { name: "Age", value: "55 yrs (1970)", score: 82, level: "High" },
      { name: "Structure", value: "Brutalist concrete", score: 70, level: "High" },
      { name: "Height", value: "8 stories", score: 66, level: "Moderate" },
    ],
  },
  historical_record: {
    score: 80,
    weight: 0.25,
    sub_factors: [
      { name: "M5+ within 50 km", value: "54 events", score: 74, level: "High" },
      { name: "M6+ within 150 km", value: "21 events", score: 82, level: "High" },
      { name: "Peak historical PGA", value: "0.28 g", score: 84, level: "High" },
    ],
  },
};

export const MOCK_FINANCIAL_PROJECTION: FinancialProjectionResponse = {
  building: "HSS · Room 1345, UC San Diego",
  data_source: "USGS catalog (2000–2023) + Scripps Rekoske simulations",
  events_analyzed: 1845,
  years_of_data: 24,
  annual_rates: {
    m4_plus: 5.2,
    m5_plus: 0.58,
    m6_plus: 0.071,
    m7_plus: 0.009,
  },
  yearly_projections: Array.from({ length: 10 }).map((_, i) => {
    const year = i + 1;
    const premium = 4200;
    const claims = 2600;
    const cumulative_premium = premium * year;
    const cumulative_claims = claims * year;
    return {
      year,
      annual_premium: premium,
      annual_expected_claims: claims,
      cumulative_premium,
      cumulative_claims,
      net_position: cumulative_premium - cumulative_claims,
      worst_case: cumulative_claims * 3.2,
      p_m5_plus: 1 - Math.exp(-0.58 * year),
      p_m6_plus: 1 - Math.exp(-0.071 * year),
      p_m7_plus: 1 - Math.exp(-0.009 * year),
    };
  }),
  risk_scores: MOCK_RISK_SCORE,
  interior_hazards: [
    { hazard: "Unsecured bookcases", location: "Room 1345", risk: "High", action: "L-bracket to stud", cost: 40 },
    { hazard: "Overhead pendants", location: "Hallway 1300", risk: "Moderate", action: "Safety cable retrofits", cost: 180 },
    { hazard: "Glass partitions", location: "Stairwell B", risk: "High", action: "Laminate film", cost: 420 },
    { hazard: "Water heater", location: "Mechanical room", risk: "Moderate", action: "Double-strap anchoring", cost: 90 },
  ],
  insurance_recommendation: {
    tier: "Tier 3 · High risk",
    policy_type: "Standalone earthquake (CEA supplement recommended)",
    minimum_coverage: 250_000,
    premium_multiplier: 2.4,
    annual_premium: 4200,
    action_items: [
      "Retrofit non-structural interior hazards before binding the policy.",
      "Request a CEA Mini-Policy quote to pair with your standard HO-3.",
      "Document pre-existing ceiling water damage with dated photos.",
      "Verify shutoff valves + brace the 8th-floor water tank.",
    ],
  },
};

export async function getRiskScore(): Promise<RiskScoreResponse> {
  try {
    const { data } = await client.get<RiskScoreResponse>("/risk-score");
    return data;
  } catch {
    // Graceful degradation — see MOCK_RISK_SCORE comment.
    return MOCK_RISK_SCORE;
  }
}

export async function getFinancialProjection(): Promise<FinancialProjectionResponse> {
  try {
    const { data } = await client.get<FinancialProjectionResponse>(
      "/financial-projection",
    );
    return data;
  } catch {
    return MOCK_FINANCIAL_PROJECTION;
  }
}
