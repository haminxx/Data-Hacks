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

I have three dataset files in backend/data/rekoske/:
1. query.csv — 3,594 real SoCal earthquakes from USGS
   Columns: time, latitude, longitude, depth, mag, magType, nst, gap, dmin, rms, net, id, updated, place, type, horizontalError, depthError, magError, magNst, status, locationSource, magSource

2. seismos_16_receivers.npy — Rekoske Scripps dataset
   Shape: (16 receivers, 600 time steps, 500 simulations)
   Contains ground velocity time series. PGV = max(abs(signal)) across time axis.

Create backend/model.py and backend/train.py:

In model.py:
- REC_GYM_LAT = 32.8786, REC_GYM_LON = -117.2364
- Function add_features(df) that computes:
  * dist_epi_km: haversine distance from epicenter (latitude, longitude) to Rec Gym
  * log_dist: log1p of dist_epi_km
  * energy_proxy: 10^(1.5 * mag) / dist_epi_km clipped at 0.5
  * depth_factor: 1 / log1p(depth)
  * soil_amp: fixed at 760/280 = 2.714 (Rec Gym Vs30 ~ 280 m/s)
- FEATURES = ['mag', 'dist_epi_km', 'log_dist', 'energy_proxy', 'depth_factor', 'soil_amp']
- TARGET = 'pgv'
- pgv_to_risk_tier(pgv) returning dict with tier, color, description, building_tips

In train.py:
Step 1 — Build training data from seismos_16_receivers.npy + query.csv:
  - Load seismos_16_receivers.npy, shape (16, 600, 500)
  - Extract PGV: pgv_array = np.max(np.abs(arr), axis=1) → shape (16, 500)
  - Average PGV across all 16 receivers → shape (500,) — one PGV per simulation
  - Scale PGV to cm/s by multiplying by 100000 (values are in m/s, very small)
  - Load query.csv, take first 500 rows to match simulation count
  - Combine: df['pgv'] = pgv_array, df uses latitude/longitude/mag/depth from query.csv

Step 2 — Add features using add_features(df)

Step 3 — Train XGBoost:
  - 80/20 train/test split
  - XGBRegressor: n_estimators=600, learning_rate=0.05, max_depth=6, subsample=0.8
  -
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

### 14. 2.5D Building Map + Seismic Overlay (deck.gl + Google Maps)
```
[CONTEXT BLOCK]

Create components/SeismoMap.tsx — a full-screen, 2.5D dark-mode map using
the Google Maps JavaScript API with a deck.gl GoogleMapsOverlay. The map
performs a cinematic flyTo from a wide view of San Diego down to the UCSD
Rec Gym, then renders extruded 3D building footprints and the seismic
hazard heatmap on top.

## Dependencies
Install:
- @deck.gl/core
- @deck.gl/layers
- @deck.gl/google-maps
- @googlemaps/js-api-loader

## Environment
- Read Google Maps key from process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  (same key used on the exterior page Street View)
- Create a dark-mode Map ID in Google Cloud Console and store as
  process.env.NEXT_PUBLIC_GOOGLE_MAP_ID (Vector map required for tilt/heading)

## Static Assets
- Place UCSD building footprints GeoJSON at /public/ucsd_buildings.geojson
  (Polygon / MultiPolygon features, each with a "name" property; Rec Gym
  footprint must be included)

## Camera State Management
Use React useState to manage viewState of the deck.gl overlay.

Initial State (San Diego Wide):
  { longitude: -117.1611, latitude: 32.7157, zoom: 10, pitch: 45, bearing: 0 }

Target State (UCSD Rec Gym):
  { longitude: -117.2340, latitude: 32.8801, zoom: 16, pitch: 60, bearing: 30 }

## FlyTo Animation
- Import FlyToInterpolator from @deck.gl/core
- On mount, wait 500ms, then setViewState to the Target State with
  transitionDuration: 3000 and transitionInterpolator: new FlyToInterpolator()
- Also expose a button "Analyze UCSD" (top-right overlay, dark pill style)
  that re-triggers the flyTo for the demo
- A second button "Reset View" snaps back to Initial State with a 2000ms
  flyTo transition
- Keep the Google base map and deck.gl WebGL layer perfectly in sync by
  driving both from a single source of truth: update the google.maps.Map
  camera via map.moveCamera({ center, zoom, tilt: pitch, heading: bearing })
  inside the deck overlay's onViewStateChange handler

## 2.5D Building Layer
- Fetch /public/ucsd_buildings.geojson on mount
- Render a deck.gl PolygonLayer with:
  * id: "ucsd-buildings"
  * data: feature.geometry.coordinates
  * extruded: true
  * getElevation: 20 (flat 20m for mock data; bump Rec Gym to 28m so it
    stands out)
  * getFillColor: [30, 41, 59, 180]  // semi-transparent dark slate
  * getLineColor: [26, 86, 219, 255] // glowing blue #1A56DB border
  * lineWidthMinPixels: 1.5
  * material: { ambient: 0.4, diffuse: 0.6, shininess: 32 }
  * pickable: true
- On hover, highlight the building with a brighter border [59, 130, 246, 255]
  and show a tooltip with feature.properties.name

## Seismic Heatmap Overlay (deck.gl HeatmapLayer)
- On mount, fetch POST /heatmap with { magnitude: 6.5, epicenter_lat: 33.19,
  epicenter_lon: -115.54 } from lib/api.ts
- Render a deck.gl HeatmapLayer above the Google base map but below the
  PolygonLayer:
  * id: "seismic-heatmap"
  * data: points array from /heatmap response
  * getPosition: d => [d.lon, d.lat]
  * getWeight: d => d.pgv
  * radiusPixels: 60
  * intensity: 1
  * threshold: 0.05
  * colorRange: [
      [22, 163, 74, 0],     // 0%   transparent green
      [22, 163, 74, 140],   // 30%  #16A34A green
      [202, 138, 4, 180],   // 60%  #CA8A04 yellow
      [234, 88, 12, 210],   // 80%  #EA580C orange
      [220, 38, 38, 240]    // 100% #DC2626 red
    ]
- Fade the heatmap in with a 1.5s opacity transition on first load

## Markers
- Animated pulsing ScatterplotLayer marker at the Salton Sea epicenter
  (33.19, -115.54): red [220, 38, 38], 3 concentric rings expanding outward
  every 1.2s using a useEffect radius animation
- Solid blue IconLayer marker at Rec Gym (32.8786, -117.2364) — clicking
  opens a deck.gl tooltip / small card with current risk tier and PGV
  (consume from the /demo endpoint in lib/api.ts)

## Code Requirements
- Strictly typed TypeScript, modular (split viewState, layers, and the
  Google Maps loader into small helpers inside the same file or co-located
  hooks: useGoogleMap, useFlyTo, useSeismicData)
- No desync between Google base map and deck.gl WebGL layer — always
  drive the Google camera from the deck viewState, never the reverse
- Client component only ("use client") — dynamic import from app/exterior
  with ssr: false to avoid window references on the server
- Export as default component

## Integration
Add the map to app/exterior/page.tsx below the Street View in a
collapsible "View 2.5D Building & Seismic Map" section. When the section
expands, the flyTo animation should play on first open.
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