export type HighlightType = "danger" | "warning" | "temptation" | "mixed";

export type DirectionZone = {
  id: number;
  label: string;
  yawMin: number;
  yawMax: number;
  highlightType: HighlightType;
  highlightLabel: string;
  hazardNote: string;
  ceilingWarning?: boolean;
  safeZone?: boolean;
};

export type SimulatorQuestion = {
  zoneId: number;
  text: string;
  options: string[];
  correctIndex: number;
  survivalChange: { correct: number; wrong: number };
  correctExplanation: string;
  wrongExplanation: string;
  realHazardNote: string;
};

export type ScenarioCondition =
  | "earthquake"
  | "earthquake_fire"
  | "earthquake_dark"
  | "earthquake_fire_dark";

export type BuildingHazard = {
  icon: string;
  label: string;
  risk: "SEVERE" | "HIGH" | "MODERATE";
  note: string;
};

export const DIRECTION_ZONES: DirectionZone[] = [
  {
    id: 1,
    label: "Facing Interior Corridor",
    yawMin: 315,
    yawMax: 45,
    highlightType: "danger",
    highlightLabel: "Interior Corridor — NOT Exit ❌",
    hazardNote: "This door leads deeper into HSS building — not outside",
  },
  {
    id: 2,
    label: "Facing Emergency Exit",
    yawMin: 225,
    yawMax: 315,
    highlightType: "warning",
    highlightLabel: "Emergency Exit → Outside ⚠️",
    hazardNote: "Heavy steel doors may warp — concrete debris outside",
  },
  {
    id: 3,
    label: "Facing Blue Wall",
    yawMin: 135,
    yawMax: 225,
    highlightType: "temptation",
    highlightLabel: "UNLIMITED CLAUDE CREDITS & TOKENS 🤖",
    hazardNote:
      "Water-damaged ceiling tile directly above — real pre-existing weakness",
    ceilingWarning: true,
  },
  {
    id: 4,
    label: "Facing Projection Screen",
    yawMin: 45,
    yawMax: 135,
    highlightType: "mixed",
    highlightLabel: "Projection Screen — Fall Risk 🎥",
    hazardNote:
      "Projection screen bracket directly above wall desk — most dangerous spot",
    safeZone: true,
  },
];

export const QUESTIONS: SimulatorQuestion[] = [
  {
    zoneId: 1,
    text: "The earthquake just hit. You see the corridor door. The projector above you is swinging. Do you run for it?",
    options: [
      "Yes — run immediately, any door is better than staying",
      "No — drop under the nearest table and cover my head",
      "Yes — but walk carefully to avoid falling",
      "Stand in the doorway for protection",
    ],
    correctIndex: 1,
    survivalChange: { correct: 15, wrong: -25 },
    correctExplanation:
      "Correct. That corridor leads DEEPER into HSS — not outside. During shaking the ceiling projector could fall any moment. Central tables are your shelter. The doorway myth is outdated. Drop. Cover. Hold On.",
    wrongExplanation:
      "That corridor leads deeper into the building. You would have been struck by falling debris AND the projector fell behind you. The central tables were your safest shelter.",
    realHazardNote:
      "The projector hangs from a single suspended ceiling bracket — not anchored to structural concrete. At M6.5 it can fall.",
  },
  {
    zoneId: 2,
    text: "Shaking stopped. The emergency exit leads directly outside. The heavy TV is on the wall to your left. What do you do?",
    options: [
      "Run straight through the emergency exit immediately",
      "Find something to protect my head then push through the exit",
      "Go back and grab my laptop first",
      "Wait by the TV wall for someone to help",
    ],
    correctIndex: 1,
    survivalChange: { correct: 15, wrong: -25 },
    correctExplanation:
      "Smart. The door frame may have warped. The 1970s HSS concrete facade may be shedding debris right outside. Grab a book or jacket for head protection first. Never stand near that wall-mounted TV — the mount can fail during aftershocks.",
    wrongExplanation:
      "Concrete debris was falling from the HSS facade outside that door. You also walked past the wall-mounted TV which could fall during an aftershock. Always protect your head before stepping outside this building.",
    realHazardNote:
      "The HSS building exterior facade was replaced due to severe concrete spalling. Debris falling from the exterior is a documented real risk.",
  },
  {
    zoneId: 3,
    text: "You see a laptop with a sticky note: UNLIMITED CLAUDE CREDITS & TOKENS 🤖. Look up — water-damaged ceiling tile and the projector are right above it. Do you grab it?",
    options: [
      "Yes — unlimited tokens is worth dying for",
      "Yes — but only if Cursor is open on it",
      "Absolutely not — drop under a table and cover immediately",
      "Ask Claude if grabbing it violates safety protocols",
    ],
    correctIndex: 2,
    survivalChange: { correct: 15, wrong: -25 },
    correctExplanation:
      "Perfect. That water stain is REAL — photographed today in this actual room. Pre-existing ceiling damage combined with the projector on a single bracket makes this the most dangerous spot. No Claude credits are worth your life. Drop. Cover. Hold On. Claude will still be there when you get out. 🤖",
    wrongExplanation:
      "The ceiling collapsed while you reached for the laptop. That water stain is REAL pre-existing damage in this actual room. Suspended ceiling plus damaged tiles plus swinging projector equals collapse zone. Never grab belongings during active shaking. Not even unlimited Claude tokens.",
    realHazardNote:
      "The water stain and cracked ceiling tile in this room are real and visible in the photos taken today. This is genuine pre-existing structural weakness in HSS 1345.",
  },
  {
    zoneId: 4,
    text: "Shaking intensifies. The projection screen swings on its bracket. The HVAC rattles in the corner. The podium looks solid. Where do you cover?",
    options: [
      "Under the instructor podium — solid heavy wood",
      "Under the wall desk directly below the projection screen",
      "Under a central table away from all walls",
      "Press against the white wall between hazards",
    ],
    correctIndex: 2,
    survivalChange: { correct: 15, wrong: -25 },
    correctExplanation:
      "Perfect. Central tables are the only safe shelter. The projection screen bracket can fail crashing onto the wall desk. The HVAC can dislodge. The podium is too small. Central tables are away from ALL wall-mounted hazards. Grip the table leg firmly — every table in this room is on wheels and will roll.",
    wrongExplanation:
      "The projection screen fell from its bracket directly onto the wall desk. This is the most predictable hazard in the room. Central tables away from all walls are the only safe shelter. Never shelter below wall-mounted equipment.",
    realHazardNote:
      "Every chair and table in HSS 1345 is on wheels with casters. During an earthquake they will slide. Grip the table leg tightly when sheltering under it.",
  },
];

export const MAGNITUDE_START_RATES: Record<number, number> = {
  4.0: 95,
  4.5: 90,
  5.0: 85,
  5.5: 80,
  6.0: 75,
  6.5: 65,
  7.0: 50,
  7.5: 35,
  8.0: 20,
};

export const CONDITION_MODIFIERS: Record<ScenarioCondition, number> = {
  earthquake: 0,
  earthquake_fire: -10,
  earthquake_dark: -8,
  earthquake_fire_dark: -18,
};

export const BUILDING_HAZARDS: BuildingHazard[] = [
  {
    icon: "⚠️",
    label: "Ceiling projector",
    risk: "SEVERE",
    note: "Single bracket — can fall",
  },
  {
    icon: "💧",
    label: "Water-damaged ceiling tile",
    risk: "HIGH",
    note: "Real pre-existing damage visible today",
  },
  {
    icon: "📺",
    label: "Wall-mounted TV",
    risk: "HIGH",
    note: "Heavy mount — can fail in aftershock",
  },
  {
    icon: "🎥",
    label: "Projection screen bracket",
    risk: "HIGH",
    note: "Above wall desk — direct fall zone",
  },
  {
    icon: "🌀",
    label: "HVAC unit",
    risk: "MODERATE",
    note: "Corner-mounted — can dislodge",
  },
  {
    icon: "🪑",
    label: "All chairs and tables on wheels",
    risk: "MODERATE",
    note: "Will slide during shaking — grip table legs",
  },
];

