# SeismoShield — Cursor Prompts
> Copy-paste these one at a time into Cursor Chat (Cmd+L) or Composer (Cmd+Shift+I)
> Always start a new task in a fresh Composer window

---

## CONTEXT BLOCK
> Paste this at the start of EVERY prompt

```
I'm building SeismoShield, a Next.js 14 PWA for earthquake risk assessment.
Demo scenario: M6.5 earthquake, Salton Sea epicenter (33.19N, 115.54W), target building: UCSD Recreation Center, 9500 Gilman Dr, La Jolla CA 92093.
Backend: FastAPI at http://localhost:8000
Frontend: Next.js 14 App Router + Tailwind CSS
Color scheme: dark navy background #0F172A, blue accent #1A56DB, white text
```

---

## HOUR 0 — SETUP

### 1. Create Full Repo Structure
```
[CONTEXT BLOCK]

Create the following folder and file structure for my project. Create empty files with placeholder comments so I know what goes in each:

seismoshield/
├── backend/
│   ├── main.py
│   ├── train.py
│   ├── model.py
│   ├── requirements.txt
│   └── data/rekoske/
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── exterior/page.tsx
│   │   ├── simulator/page.tsx
│   │   └── emergency/page.tsx
│   ├── components/
│   │   ├── SeismoMap.tsx
│   │   ├── RiskCard.tsx
│   │   ├── Simulator.tsx
│   │   ├── ShakeOverlay.tsx
│   │   └── EmergencyModal.tsx
│   ├── public/waypoints/
│   ├── public/models/
│   ├── lib/
│   │   ├── api.ts
│   │   └── usgs.ts
│   ├── next.config.js
│   └── public/manifest.json
└── README.md
```

---

### 2. PWA Config
```
[CONTEXT BLOCK]

Set up my Next.js app as a Progressive Web App (PWA) so it works on mobile browsers.

1. Install next-pwa
2. Update next.config.js to wrap with withPWA, disable in development
3. Create public/manifest.json with:
   - name: SeismoShield
   - short_name: SeismoShield
   - background_color: #0F172A
   - theme_color: #1A56DB
   - display: standalone
4. Add manifest link to app/layout.tsx
5. Add a dark themed layout.tsx with the Geist font, dark background #0F172A
```

---

### 3. API Helper
```
[CONTEXT BLOCK]

Create lib/api.ts with typed helper functions for all backend calls:

- predict(magnitude, epicenter_lat, epicenter_lon) → POST /predict
- getHeatmap(magnitude, epicenter_lat, epicenter_lon) → POST /heatmap
- getInsurance(magnitude, epicenter_lat, epicenter_lon) → POST /insurance
- getDemo() → GET /demo
- getScenarios() → GET /scenarios

Base URL from process.env.NEXT_PUBLIC_API_URL
Use axios. Export all functions. Include TypeScript types for all responses.
Response type for predict includes: pgv (number), tier (string), color (string), description (string), building_tips (string[])
```

---

## PERSON A — BACKEND (CHRISTIAN)

### 4. Dataset Explorer
```
[CONTEXT BLOCK]

Create backend/train.py. 

Step 1 only for now: write code to explore the Rekoske dataset.
- List all files in data/rekoske/
- Try loading the first CSV or parquet file it finds
- Print: shape, column names, first 5 rows, and basic stats
- Print any columns that look like: magnitude, lat, lon, pgv, velocity, vs30

I will run this first to understand the column names before we write the model.
```

---

### 5. Feature Engineering + Model Training
```
[CONTEXT BLOCK]

The Rekoske dataset columns are: [PASTE YOUR ACTUAL COLUMNS HERE AFTER RUNNING STEP 4]

Update backend/train.py and backend/model.py to:

1. In model.py:
   - Define REC_GYM_LAT = 32.8786, REC_GYM_LON = -117.2364
   - Map dataset columns to: magnitude, epicenter_lat, epicenter_lon, pgv
   - Function add_features(df) that adds:
     * dist_epi_km: haversine distance from epicenter to Rec Gym
     * log_dist: log1p of dist_epi_km
     * energy_proxy: 10^(1.5 * magnitude) / dist_epi_km clipped at 0.5
     * soil_amp: 760 / vs30 (use 280 as default if vs30 not in dataset)
   - FEATURES list
   - pgv_to_risk_tier(pgv) function returning tier, color, description, building_tips

2. In train.py:
   - Load dataset, call add_features
   - Train XGBoost regressor (600 estimators, lr 0.05, max_depth 6)
   - 80/20 train/test split
   - Print RMSE and R2
   - Save model as seismoshield_model.joblib
   - Pre-compute and save 8 demo scenarios to precomputed_scenarios.json
     covering M4.0 to M7.5 on Salton Sea fault (33.19, -115.54)
```

---

### 6. FastAPI All Endpoints
```
[CONTEXT BLOCK]

Create backend/main.py with FastAPI. Import from model.py.

Endpoints:
1. GET /health → {"status": "ok"}
2. POST /predict → body: {magnitude, epicenter_lat, epicenter_lon} → returns pgv + risk tier + building_tips
3. POST /heatmap → same body → generates 25x25 grid of PGV values across SoCal for Mapbox heatmap rendering, returns {"points": [{lat, lon, pgv, tier, color}]}
4. POST /insurance → same body → applies building vulnerability multipliers for Rec Gym (large public building, ~1980s construction) → returns risk data + insurance_tier + premium_multiplier
5. GET /scenarios → returns precomputed_scenarios.json
6. GET /demo → returns the M6.5 Salton Sea pre-computed scenario instantly

Add CORS middleware allowing all origins.
Add uvicorn runner at bottom: if __name__ == "__main__"
```

---

## PERSON B — FRONTEND (RYAN)

### 7. Landing Page
```
[CONTEXT BLOCK]

Create app/page.tsx — the SeismoShield landing page.

Requirements:
- Full screen, dark background #0F172A
- Large centered logo text "SeismoShield" in blue #1A56DB, bold, large
- Tagline below: "We know your building. We know your risk. We get you out safely."
- Single address input field, pre-filled with: "UCSD Recreation Center, 9500 Gilman Dr, La Jolla, CA 92093"
- Blue CTA button: "Analyze This Building" — on click navigates to /exterior
- Three small feature pills below the button: "🌍 Risk Assessment" | "🏗️ 3D Simulation" | "🚨 Emergency Guidance"
- Subtle animated background: slow-moving concentric circle pulse from center, color #1A56DB at 8% opacity, using CSS keyframes
- Fully responsive, works on mobile
```

---

### 8. Exterior Page
```
[CONTEXT BLOCK]

Create app/exterior/page.tsx — shows the Rec Gym exterior and entry point to simulator.

Layout: two column on desktop, stacked on mobile
LEFT HALF:
- Google Street View iframe of UCSD Rec Gym
- Use this embed URL: https://www.google.com/maps/embed/v1/streetview?key=YOUR_KEY&location=32.8786,-117.2364&heading=210&pitch=0&fov=90
- Read key from process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY

RIGHT HALF:
- Building name: "UCSD Recreation Center"
- Address: "9500 Gilman Dr, La Jolla, CA 92093"
- On page load, fetch from GET /demo and display a RiskCard component
- Two buttons:
  * "Enter Earthquake Simulator" → navigates to /simulator (primary, blue)
  * "View Insurance Score" → opens a modal showing insurance data from POST /insurance
- A small "Powered by Scripps Institution of Oceanography data" badge at bottom

Import and use RiskCard component from components/RiskCard.tsx
Show a loading skeleton while fetching.
```

---

### 9. Risk Card Component
```
[CONTEXT BLOCK]

Create components/RiskCard.tsx

Props: { pgv: number, tier: string, color: string, description: string, building_tips: string[] }

Design:
- Dark card with colored left border matching the tier color
- Top: large tier label (Low / Moderate / High / Severe) in the tier color
- PGV value: "Peak Ground Velocity: X.X cm/s"
- Description text
- Section: "Building-Specific Risks" — render building_tips as a bulleted list
- Bottom: insurance tier badge derived from tier:
  * Severe → "Tier 1 — Specialist Coverage Required" red
  * High → "Tier 2 — High Risk Surcharge" orange  
  * Moderate → "Tier 3 — Standard Rate" yellow
  * Low → "Tier 4 — Low Risk Rate" green
```

---

### 10. Shake Animation CSS
```
[CONTEXT BLOCK]

Add the following CSS animations to app/globals.css for the earthquake simulator.
Do not remove any existing CSS, only append:

Three shake animations: shake-low, shake-medium, shake-high
- shake-low: subtle 3px displacement, 0.5s duration, repeats 3 times
- shake-medium: 8px displacement with slight rotation, 0.4s, repeats 4 times  
- shake-high: 15px displacement with 2 degree rotation, 0.3s, repeats 6 times

Also add:
- .fire-overlay: warm orange/red tint using CSS filter sepia + hue-rotate + brightness
- .dark-overlay: brightness filter reduced to 25%
- .debris-overlay: slight blur + contrast increase

Use CSS @keyframes, apply via utility classes.
```

---

### 11. Waypoint Data File
```
[CONTEXT BLOCK]

Create lib/waypoints.ts

Define an array of 5 waypoints for the UCSD Rec Gym escape route.
Each waypoint has:
- id, label, photo (path in /public/waypoints/), description
- nextWaypoint (number or null for last)
- tips object with keys: general, hazard, action, exit
- escapeDirection: "forward" | "left" | "right" | "behind" | null
- exitDistance: string

Waypoints:
1. Main Entrance — photo: /waypoints/01_entrance.jpg — tips about glass facade, front desk as shelter, main exit behind
2. Gym Floor — photo: /waypoints/02_gym_floor.jpg — tips about weight equipment shifting, open floor, corridor to left
3. Main Corridor — photo: /waypoints/03_corridor.jpg — tips about staying low, interior walls, corridor width
4. Emergency Exit Door — photo: /waypoints/04_exit_door.jpg — tips about push bar, not stopping in doorway
5. Outside Assembly Area — photo: /waypoints/05_outside.jpg — tips about 50m from building, not re-entering, this is safe

Export as WAYPOINTS constant. Export the Waypoint type.
```

---

### 12. Simulator Component
```
[CONTEXT BLOCK]

Create components/Simulator.tsx

This is a full-screen POV walkthrough of the Rec Gym using pre-taken photos as backgrounds.

Props: { magnitude: number, scenario: "earthquake" | "earthquake_fire" | "earthquake_dark", riskTier: string }

Features:
- Full screen image background showing current waypoint photo
- CSS shake animation applied to the image based on magnitude:
  * magnitude < 5 → shake-low
  * magnitude < 6.5 → shake-medium  
  * magnitude >= 6.5 → shake-high
- Scenario overlays:
  * earthquake_fire: warm orange tint filter + subtle pulsing red vignette
  * earthquake_dark: dark overlay reducing brightness to 25%
- Large animated escape direction arrow (green, bouncing) pointing the escape direction
- EXIT distance label below the arrow
- Top bar: current waypoint label, stop counter, risk tier badge, magnitude
- Right side tips panel: dark semi-transparent card showing all tips for current waypoint
- Bottom navigation: Back button, "Simulate Shake" button (triggers shake animation once), Next button
- Progress bar showing position in escape route
- Import WAYPOINTS from lib/waypoints.ts
```

---

### 13. Simulator Page
```
[CONTEXT BLOCK]

Create app/simulator/page.tsx

This page wraps the Simulator component with controls.

Layout:
- Top control bar (dark, slim):
  * Magnitude slider: range 4.0 to 8.0, step 0.1, default 6.5
    Label shows current value: "MAGNITUDE: 6.5"
  * Three scenario toggle buttons: "🌍 Earthquake Only" | "🔥 + Fire" | "🌑 + Blackout"
  * Live risk badge that updates as magnitude changes (fetches from /predict on slider change, debounced 300ms)
- Below: full-screen Simulator component
- On magnitude change, fetch new risk data from POST /predict with Salton Sea epicenter
- Pass magnitude, scenario, and riskTier down to Simulator

Use useCallback and debounce for the API call on slider change.
```

---

### 14. Seismic Heatmap
```
[CONTEXT BLOCK]

Create components/SeismoMap.tsx — full screen interactive Mapbox heatmap.

Requirements:
- Dark Mapbox map: style "mapbox://styles/mapbox/dark-v11"
- Initial center: [-116.5, 33.5], zoom 7 (shows all of Southern California)
- On load, fetch heatmap grid from POST /heatmap with magnitude 6.5, epicenter 33.19, -115.54
- Render grid as Mapbox heatmap layer, colored by PGV:
  * 0% → transparent
  * 30% → #16A34A green
  * 60% → #CA8A04 yellow
  * 80% → #EA580C orange
  * 100% → #DC2626 red
- Animated pulsing marker at epicenter (Salton Sea) — red, 3 rings pulsing outward
- Blue marker at Rec Gym with popup showing risk tier and PGV
- Heatmap fades in with 1.5s opacity transition on load
- Read token from process.env.NEXT_PUBLIC_MAPBOX_TOKEN
- Export as default component

Add this map to the exterior page below the Street View, in a collapsible "View Seismic Heatmap" section.
```

---

### 15. USGS Feed + Emergency Modal
```
[CONTEXT BLOCK]

Create two files:

1. lib/usgs.ts
- Function checkForEarthquake(userLat=32.8786, userLon=-117.2364, minMag=4.0, radiusKm=150)
- Fetches: https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_hour.geojson
- Returns { triggered: true, magnitude, distance, location } or { triggered: false }
- Haversine distance calculation
- Export function

2. components/EmergencyModal.tsx
Full-screen emergency takeover modal.

Features:
- Fixed overlay, z-index 50, deep red background #450A0A
- Red header bar with pulsing ⚠️ icon, earthquake details (magnitude, location, distance)
- 6 step-by-step escape instructions specific to UCSD Rec Gym:
  1. DROP to hands and knees
  2. COVER head — use gym bench as shelter if nearby
  3. HOLD ON until shaking stops
  4. Walk (don't run) to nearest exit when shaking stops
  5. Do NOT use the elevator — use stairs or ground level exits
  6. Proceed to open field SOUTH of Rec Gym, 50m from building
- Each step shows: large emoji icon, bold instruction, detail text
- Back/Next navigation, progress dots
- Final step has green "I Am Safe" button that closes modal
- Polls checkForEarthquake every 30 seconds using useEffect
- IMPORTANT: also trigger when user presses the "D" key anywhere (for demo purposes)
- Add this component to app/layout.tsx so it appears on every page
```

---

### 16. Global Emergency D-Key Trigger
```
[CONTEXT BLOCK]

Update app/layout.tsx to:
1. Import EmergencyModal
2. Add a global keydown listener for the "D" key
3. When D is pressed, show the EmergencyModal with fake data:
   { magnitude: 6.5, location: "Salton Sea region, CA", distance: 142 }
4. The modal should be dismissible and re-triggerable
5. Add a subtle "Press D to demo emergency mode" hint in the bottom-right corner of every page, small gray text, only visible on desktop
```

---

## FIXING THINGS

### When something breaks — use this template:
```
[CONTEXT BLOCK]

I have an error. Here is the error message:
[PASTE FULL ERROR]

Here is the relevant code:
[PASTE THE BROKEN FILE OR COMPONENT]

Fix the issue. If the fix is complex, rewrite the entire component cleanly.
```

---

### When a component looks wrong — use this:
```
[CONTEXT BLOCK]

This component is not matching the design I want. Here is what it currently looks like:
[DESCRIBE WHAT'S WRONG]

Here is the current code:
[PASTE COMPONENT]

Rewrite it to match: dark navy background, blue accents #1A56DB, white text, clean modern design. Use only Tailwind utility classes.
```

---

### When Cursor goes off track — reset with this:
```
Ignore everything above. Fresh start.

[CONTEXT BLOCK]

Build [COMPONENT NAME] from scratch. Requirements:
[PASTE JUST THE RELEVANT SECTION FROM THE TECH GUIDE]

Keep it simple. Use Tailwind only. No external UI libraries.
```

---

## DEMO DAY REMINDERS

- **D key** triggers emergency modal anywhere in the app
- **Backend must be running** at localhost:8000 before opening frontend
- **Fallback**: if API is down, hardcode the M6.5 demo result in lib/api.ts as a mock response
- **Mobile demo**: open the deployed Vercel URL on your phone to show PWA install prompt
- **Film the demo video early** — have it ready before Hour 18

---

*SeismoShield — DataHacks @ UCSD — Good luck.*
