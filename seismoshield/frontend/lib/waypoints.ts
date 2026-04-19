export type EscapeDirection =
  | "forward"
  | "left"
  | "right"
  | "behind"
  | null;

export type WaypointTips = {
  general: string;
  hazard: string;
  action: string;
  exit: string;
};

export type Waypoint = {
  id: number;
  label: string;
  /** Public URL path under `public/` (e.g. `/waypoints/01_entrance.jpg`). */
  photo: string;
  description: string;
  nextWaypoint: number | null;
  tips: WaypointTips;
  escapeDirection: EscapeDirection;
  exitDistance: string;
};

export const WAYPOINTS: Waypoint[] = [
  {
    id: 1,
    label: "Main Entrance",
    photo: "/waypoints/01_entrance.jpg",
    description:
      "Glass-heavy lobby and main entry. Use the front desk zone as short cover if shaking starts, then move toward the main exit route behind the desk when it is safe.",
    nextWaypoint: 2,
    tips: {
      general:
        "Stay clear of the glass curtain wall; shards are the primary risk in this space.",
      hazard:
        "Falling glass, swinging doors, and slick floors after sprinkler or pipe damage.",
      action:
        "If shaking is violent, drop near the front desk or interior columns—not in the open glass line—then head toward the gym floor when movement stops.",
      exit:
        "Main egress continues past the desk toward the gym floor and interior corridors; do not cluster in the revolving or automatic door throat.",
    },
    escapeDirection: "behind",
    exitDistance: "~25 m to gym floor threshold",
  },
  {
    id: 2,
    label: "Gym Floor",
    photo: "/waypoints/02_gym_floor.jpg",
    description:
      "Open activity floor with racks and machines. Move toward the main corridor on the left, keeping aisles clear and watching for rolling equipment.",
    nextWaypoint: 3,
    tips: {
      general:
        "Open span means fewer falling ceilings but more unsecured equipment and rolling loads.",
      hazard:
        "Weight plates, barbells, and racks can slide or tip; cables and benches become trip hazards.",
      action:
        "Stay low, shield your head, and move perpendicular to rows of racks toward the marked corridor opening on the left.",
      exit:
        "The primary interior route is the main corridor to the left of the floor—avoid cutting across active machine zones.",
    },
    escapeDirection: "left",
    exitDistance: "~18 m to corridor mouth",
  },
  {
    id: 3,
    label: "Main Corridor",
    photo: "/waypoints/03_corridor.jpg",
    description:
      "Interior corridor with stronger partitions than the glass lobby. Stay to one side, move in single file if crowded, and follow illuminated exit signage.",
    nextWaypoint: 4,
    tips: {
      general:
        "Interior corridors often shelter better than glass lobbies, but watch for ceiling tiles, lights, and door frames.",
      hazard:
        "Swinging doors, broken fixtures, and stampede risk if groups stop or reverse direction.",
      action:
        "Stay low, use a wall side for balance, call out obstacles, and keep moving toward the signed emergency exit ahead.",
      exit:
        "Continue forward along the corridor to the emergency exit door—do not duck into side rooms unless the path is blocked.",
    },
    escapeDirection: "forward",
    exitDistance: "~22 m to emergency door",
  },
  {
    id: 4,
    label: "Emergency Exit Door",
    photo: "/waypoints/04_exit_door.jpg",
    description:
      "Rated egress door with panic hardware. Push the bar to open—do not pause in the threshold; clear the landing immediately outside.",
    nextWaypoint: 5,
    tips: {
      general:
        "This is the last controlled interior point; treat the doorway as a choke point to pass through quickly.",
      hazard:
        "Door closer resistance, debris on the sill, and people stacking at the bar.",
      action:
        "Push the panic bar firmly, hold the door only long enough for the person behind you, and step out without stopping in the opening.",
      exit:
        "Proceed straight to the outside assembly area—do not re-enter for belongings until the building is cleared.",
    },
    escapeDirection: "forward",
    exitDistance: "~4 m to exterior landing",
  },
  {
    id: 5,
    label: "Outside Assembly Area",
    photo: "/waypoints/05_outside.jpg",
    description:
      "Designated open zone at least 50 m from the building footprint. Account for your group, avoid glass lines and overhead wires, and wait for the all-clear.",
    nextWaypoint: null,
    tips: {
      general:
        "You are safer outside than in aftershocks, but stay clear of façades, trees, and overhead hazards.",
      hazard:
        "Falling glass or masonry from façades, damaged utilities, and vehicle traffic on access drives.",
      action:
        "Move to the marked assembly point, perform head counts, and follow staff or emergency personnel—do not wander back toward entrances.",
      exit:
        "Remain beyond ~50 m from the structure until officials clear re-entry; aftershocks can redistribute debris near doorways.",
    },
    escapeDirection: null,
    exitDistance: "≥50 m from building face (assembly complete)",
  },
];
