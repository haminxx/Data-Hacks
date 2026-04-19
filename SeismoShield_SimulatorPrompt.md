[CONTEXT BLOCK]

Build a fully gamified 360-degree earthquake survival simulator for HSS Room 1345.
The 360 panorama image is at /public/waypoints/panorama_hss.jpg.
Use Pannellum to render the interactive 360 view as the background.
The user drags to look around the room freely. When they face a specific
direction, the game question for that direction appears automatically.

Install: npm install pannellum react-pannellum

Create these files:
- app/simulator/page.tsx
- components/SimulatorGame.tsx
- components/SurvivalPieChart.tsx
- components/QuestionCard.tsx
- components/ScenarioCard.tsx
- components/GameOver.tsx
- components/WinScreen.tsx
- lib/simulatorData.ts

---

## REAL ROOM CONDITIONS

HSS Room 1345 confirmed hazards:

CEILING:
- Suspended drop ceiling T-bar grid
- Ceiling-mounted projector on single bracket not anchored to structural concrete
- VISIBLE WATER STAIN on ceiling tile — real pre-existing structural weakness
- CRACKED CEILING TILE JOINT near water stain — real pre-existing damage
- Fire sprinkler, HVAC diffusers, LED strip lights in ceiling grid

WALLS:
- Large flat screen TV wall-mounted on blue wall — heavy mount can fail
- Two framed whiteboards wall-mounted — can fall
- Rollable projection screen on wall bracket — can swing and fall
- Concrete block construction beneath paint — 1970s HSS building

FURNITURE:
- ALL chairs on wheels — will slide during shaking
- ALL tables on wheels — will move during shaking
- Heavy wooden instructor podium on wall desk
- Equipment stack on right wall desk

DOORS:
- Door 1: Single interior door to yellow corridor — leads DEEPER into building NOT outside
- Door 2: Double steel push-bar emergency exit — leads DIRECTLY OUTSIDE

NO WINDOWS — reduces glass hazard

---

## FILE: lib/simulatorData.ts

Export the following exactly:

DIRECTION_ZONES array — 4 items defining yaw angle ranges:

Zone 1 — Corridor Door:
  id: 1
  label: "Facing Interior Corridor"
  yawMin: 315
  yawMax: 45
  highlightType: "danger"
  highlightLabel: "Interior Corridor — NOT Exit ❌"
  hazardNote: "This door leads deeper into HSS building — not outside"

Zone 2 — Emergency Exit:
  id: 2
  label: "Facing Emergency Exit"
  yawMin: 45
  yawMax: 135
  highlightType: "warning"
  highlightLabel: "Emergency Exit → Outside ⚠️"
  hazardNote: "Heavy steel doors may warp — concrete debris outside"

Zone 3 — Blue Wall with Laptop:
  id: 3
  label: "Facing Blue Wall"
  yawMin: 135
  yawMax: 225
  highlightType: "temptation"
  highlightLabel: "UNLIMITED CLAUDE CREDITS & TOKENS 🤖"
  hazardNote: "Water-damaged ceiling tile directly above — real pre-existing weakness"
  ceilingWarning: true

Zone 4 — Projection Screen:
  id: 4
  label: "Facing Projection Screen"
  yawMin: 225
  yawMax: 315
  highlightType: "mixed"
  highlightLabel: "Projection Screen — Fall Risk 🎥"
  hazardNote: "Projection screen bracket directly above wall desk — most dangerous spot"
  safeZone: true

QUESTIONS array — 4 items:

Question 1 (zoneId: 1):
  text: "The earthquake just hit. You see the corridor door. The projector above you is swinging. Do you run for it?"
  options: [
    "Yes — run immediately, any door is better than staying",
    "No — drop under the nearest table and cover my head",
    "Yes — but walk carefully to avoid falling",
    "Stand in the doorway for protection"
  ]
  correctIndex: 1
  survivalChange: { correct: +15, wrong: -25 }
  correctExplanation: "Correct. That corridor leads DEEPER into HSS — not outside. During shaking the ceiling projector could fall any moment. Central tables are your shelter. The doorway myth is outdated. Drop. Cover. Hold On."
  wrongExplanation: "That corridor leads deeper into the building. You would have been struck by falling debris AND the projector fell behind you. The central tables were your safest shelter."
  realHazardNote: "The projector hangs from a single suspended ceiling bracket — not anchored to structural concrete. At M6.5 it can fall."

Question 2 (zoneId: 2):
  text: "Shaking stopped. The emergency exit leads directly outside. The heavy TV is on the wall to your left. What do you do?"
  options: [
    "Run straight through the emergency exit immediately",
    "Find something to protect my head then push through the exit",
    "Go back and grab my laptop first",
    "Wait by the TV wall for someone to help"
  ]
  correctIndex: 1
  survivalChange: { correct: +15, wrong: -25 }
  correctExplanation: "Smart. The door frame may have warped. The 1970s HSS concrete facade may be shedding debris right outside. Grab a book or jacket for head protection first. Never stand near that wall-mounted TV — the mount can fail during aftershocks."
  wrongExplanation: "Concrete debris was falling from the HSS facade outside that door. You also walked past the wall-mounted TV which could fall during an aftershock. Always protect your head before stepping outside this building."
  realHazardNote: "The HSS building exterior facade was replaced due to severe concrete spalling. Debris falling from the exterior is a documented real risk."

Question 3 (zoneId: 3):
  text: "You see a laptop with a sticky note: UNLIMITED CLAUDE CREDITS & TOKENS 🤖. Look up — water-damaged ceiling tile and the projector are right above it. Do you grab it?"
  options: [
    "Yes — unlimited tokens is worth dying for",
    "Yes — but only if Cursor is open on it",
    "Absolutely not — drop under a table and cover immediately",
    "Ask Claude if grabbing it violates safety protocols"
  ]
  correctIndex: 2
  survivalChange: { correct: +15, wrong: -25 }
  correctExplanation: "Perfect. That water stain is REAL — photographed today in this actual room. Pre-existing ceiling damage combined with the projector on a single bracket makes this the most dangerous spot. No Claude credits are worth your life. Drop. Cover. Hold On. Claude will still be there when you get out. 🤖"
  wrongExplanation: "The ceiling collapsed while you reached for the laptop. That water stain is REAL pre-existing damage in this actual room. Suspended ceiling plus damaged tiles plus swinging projector equals collapse zone. Never grab belongings during active shaking. Not even unlimited Claude tokens."
  realHazardNote: "The water stain and cracked ceiling tile in this room are real and visible in the photos taken today. This is genuine pre-existing structural weakness in HSS 1345."

Question 4 (zoneId: 4):
  text: "Shaking intensifies. The projection screen swings on its bracket. The HVAC rattles in the corner. The podium looks solid. Where do you cover?"
  options: [
    "Under the instructor podium — solid heavy wood",
    "Under the wall desk directly below the projection screen",
    "Under a central table away from all walls",
    "Press against the white wall between hazards"
  ]
  correctIndex: 2
  survivalChange: { correct: +15, wrong: -25 }
  correctExplanation: "Perfect. Central tables are the only safe shelter. The projection screen bracket can fail crashing onto the wall desk. The HVAC can dislodge. The podium is too small. Central tables are away from ALL wall-mounted hazards. Grip the table leg firmly — every table in this room is on wheels and will roll."
  wrongExplanation: "The projection screen fell from its bracket directly onto the wall desk. This is the most predictable hazard in the room. Central tables away from all walls are the only safe shelter. Never shelter below wall-mounted equipment."
  realHazardNote: "Every chair and table in HSS 1345 is on wheels with casters. During an earthquake they will slide. Grip the table leg tightly when sheltering under it."

MAGNITUDE_START_RATES:
  4.0: 95, 4.5: 90, 5.0: 85, 5.5: 80
  6.0: 75, 6.5: 65, 7.0: 50, 7.5: 35, 8.0: 20

CONDITION_MODIFIERS:
  earthquake: 0
  earthquake_fire: -10
  earthquake_dark: -8
  earthquake_fire_dark: -18

BUILDING_HAZARDS:
  [
    { icon: "⚠️", label: "Ceiling projector", risk: "SEVERE", note: "Single bracket — can fall" },
    { icon: "💧", label: "Water-damaged ceiling tile", risk: "HIGH", note: "Real pre-existing damage visible today" },
    { icon: "📺", label: "Wall-mounted TV", risk: "HIGH", note: "Heavy mount — can fail in aftershock" },
    { icon: "🎥", label: "Projection screen bracket", risk: "HIGH", note: "Above wall desk — direct fall zone" },
    { icon: "🌀", label: "HVAC unit", risk: "MODERATE", note: "Corner-mounted — can dislodge" },
    { icon: "🪑", label: "All chairs and tables on wheels", risk: "MODERATE", note: "Will slide during shaking — grip table legs" }
  ]

---

## FILE: components/SurvivalPieChart.tsx

SVG pie chart component.

Props: { survivalRate: number, isAnimating: boolean, animationDirection: "up" | "down" | null }

SVG:
- Viewbox 0 0 120 120, circle radius 54, center 60,60
- Track circle: stroke #1E293B strokeWidth 12 fill none
- Arc circle: stroke color based on rate strokeWidth 12 fill none
- strokeDasharray: 339.3
- strokeDashoffset: 339.3 - (339.3 * survivalRate / 100)
- Arc starts from top: transform rotate(-90deg) origin center
- CSS transition: stroke-dashoffset 0.8s ease-in-out, stroke 0.5s ease

Arc colors:
  >= 70 → #16A34A green
  >= 40 → #CA8A04 yellow
  >= 20 → #EA580C orange
  < 20  → #DC2626 red

Center text:
  survivalRate% white bold 28px
  "SURVIVAL" slate-400 10px letter-spacing 0.1em

Pulse when below 20%:
  CSS survivalPulse keyframe: drop-shadow alternates red every 1.5s

Floating indicators:
  animationDirection "up": green "+15%" floats up fades over 1s
  animationDirection "down": red "-25%" floats down fades over 1s
  Position centered above chart

---

## FILE: components/ScenarioCard.tsx (Left Floating Card)

Props: { magnitude, condition, onMagnitudeChange, onConditionChange, currentZone, answeredZones, buildingHazards }

Layout — dark glass card fixed left:

SCENARIO SETTINGS section:
  Magnitude slider: min 4.0 max 8.0 step 0.5 large blue value label
  Condition toggles stacked:
    "🌍 Earthquake Only"
    "🔥 + Fire"
    "🌑 + Blackout"
  Active = blue background

ROOM HAZARDS section:
  Title: "⚠️ ROOM HAZARDS" orange
  List from BUILDING_HAZARDS:
    icon + label + risk badge
    SEVERE = red, HIGH = orange, MODERATE = yellow

BUILDING INFO section:
  "HSS Room 1345"
  "Built 1970 — Brutalist Concrete"
  "8-story concrete structure"
  Risk badge: red "🔴 SEVERE RISK"
  "PGV: 8.4 cm/s at M6.5"

PROGRESS section:
  "PROGRESS" label
  Four dots: Z1 Z2 Z3 Z4
  Answered = blue filled ✓
  Current = blue pulsing
  Upcoming = gray empty

COMPASS section:
  Small compass showing current yaw direction
  Updates in real time as user drags the panorama
  Shows which zone the user is currently facing
  Label below: current zone name

Card styles:
  background: rgba(15, 23, 42, 0.85)
  backdropFilter: blur(12px)
  border: 1px solid rgba(255, 255, 255, 0.1)
  borderRadius: 16px
  padding: 20px
  width: 270px
  position: fixed left: 20px top: 50% transform: translateY(-50%)
  maxHeight: 90vh overflowY: auto

---

## FILE: components/QuestionCard.tsx (Right Floating Card)

Props: { question, zone, onAnswer, answered, selectedIndex, survivalRate, isAnimating, animationDirection, questionNumber, totalQuestions }

Layout — dark glass card fixed right:

TOP: SurvivalPieChart centered 120px

Divider

Zone indicator: "👁️ YOU ARE FACING: [zone.label]" slate-400 small italic

"❓ QUESTION X OF 4" slate-400 small

Question text: white medium 16px

Four answer buttons:
  Before: dark #1E293B border slate hover darkens
  After correct: green #16A34A white ✓ icon
  After wrong: red #DC2626 white ✗ icon
  Correct answer always reveals green after answering
  Disabled after answering

After answering — explanation fades in 0.5s

After answering — "⚠️ Real Hazard:" section fades in orange:
  realHazardNote for current question
  Small italic font

After 2.5s — "Look Around to Continue →" button appears
  Blue button
  On click: enables panorama dragging and shows arrow hint
  pointing to next zone direction

Card styles:
  background: rgba(15, 23, 42, 0.85)
  backdropFilter: blur(12px)
  border: 1px solid rgba(255, 255, 255, 0.1)
  borderRadius: 16px
  padding: 24px
  width: 300px
  position: fixed right: 20px top: 50% transform: translateY(-50%)
  maxHeight: 90vh overflowY: auto

---

## FILE: components/SimulatorGame.tsx

This is the main orchestrator. It contains:
- Pannellum 360 viewer as the full-screen background
- All game state
- Overlay elements on top of the viewer

### Pannellum Setup

Import react-pannellum:
  import ReactPannellum from "react-pannellum"

Config:
  imageSource: "/waypoints/panorama_hss.jpg"
  equirectangular projection
  autoLoad: true
  autoRotate: -2 (slow auto-rotate when idle)
  compass: false (we show our own)
  showZoomCtrl: false
  showFullscreenCtrl: false
  mouseZoom: false
  minPitch: -20 (prevents looking too far down at broken floor)
  maxPitch: 25 (prevents looking too far up at broken ceiling)
  minYaw: undefined (full 360)
  maxYaw: undefined (full 360)
  pitch: 0 (start at eye level)
  yaw: 0 (start facing Zone 1 corridor door)
  hfov: 100 (field of view)

Pannellum CSS:
  width: 100vw
  height: 100vh
  position: fixed
  top: 0
  left: 0
  zIndex: 0

### Shake Overlay

When shakeActive is true, apply CSS animation to a div overlay on top of Pannellum:
  position: fixed inset-0 zIndex: 5 pointerEvents: none
  shake animation based on magnitude:
    magnitude < 5 → shake-low
    magnitude < 6.5 → shake-medium
    >= 6.5 → shake-high

Shake CSS keyframes in globals.css:
  shake-low: 3px displacement 0.5s repeats 3
  shake-medium: 8px displacement with rotation 0.4s repeats 4
  shake-high: 15px displacement 2deg rotation 0.3s repeats 6

### Scenario Overlays

Apply CSS filter overlays on top of Pannellum based on condition:
  earthquake_fire: warm orange tint div overlay rgba(234,88,12,0.25) + pulsing animation
  earthquake_dark: dark overlay rgba(0,0,0,0.7)

### Zone Detection

Use Pannellum's onYawChange callback or poll the viewer yaw every 200ms:
  const currentYaw = pannellumRef.current?.getYaw()

Function getCurrentZone(yaw):
  normalize yaw to 0-360
  check against DIRECTION_ZONES yawMin and yawMax
  handle zone 1 wrapping (315-360 and 0-45)
  return matching zone or null

When currentZone changes AND that zone has not been answered yet:
  Show question for that zone in QuestionCard
  Show direction-specific highlight overlay

### Zone Highlight Overlays

When user faces a specific zone, show a pulsing highlight overlay:
  These are fixed-position divs positioned over the relevant area of the screen
  They must track the panorama — use CSS transforms based on current yaw offset

Zone 1 overlay (corridor door area — center of screen when facing Zone 1):
  Red pulsing border box
  ❌ badge floating above
  "Interior Corridor — NOT Exit" label in red

Zone 2 overlay (emergency exit — center of screen when facing Zone 2):
  Orange pulsing border
  ⚠️ badge above
  "→ DIRECTLY OUTSIDE" green text on door area
  Secondary red highlight for TV on left side

Zone 3 overlay (blue wall laptop area):
  Golden aura around laptop area
  🤖 badge floating
  "UNLIMITED CLAUDE CREDITS & TOKENS" gold floating text
  RED ceiling danger overlay at top of screen:
    Semi-transparent red
    "💧 WATER DAMAGE — PRE-WEAKENED" label
    Animated crack lines SVG
  Orange projector danger at top center:
    "⚠️ Projector — Single Bracket"

Zone 4 overlay (projection screen area):
  Red danger box around screen area left side
  Subtle swinging CSS animation on the danger box
  "🎥 Projection Screen — Fall Risk" red label
  Orange HVAC danger top right corner
  Green safe zone glow center: "✓ SAFE ZONE"

### Direction Arrow Hints

After answering a question, show a glowing arrow hint pointing to the next zone:
  Small animated arrow at bottom center of screen
  "→ Turn right to continue" or "← Turn left to continue"
  Disappears when user faces the next zone

### State

currentZone: Zone | null
answeredZones: Set of zone ids
selectedAnswers: Map of zoneId to answerIndex
survivalRate: number (starts from MAGNITUDE_START_RATES[magnitude] + CONDITION_MODIFIERS[condition])
gameState: "playing" | "gameOver" | "win"
isShaking: boolean
isAnimating: boolean
animationDirection: "up" | "down" | null
lastWrongAnswer: string
lastWrongExplanation: string
lastWrongRealHazard: string
magnitude: number (default 6.5)
condition: string (default "earthquake")

### Answer Handling

1. If zone already answered return
2. Record answer for zone
3. Mark zone as answered
4. Check correct
5. Compute new survival rate
6. Set animationDirection
7. Set isAnimating true
8. Trigger shake animation for 1.5s
9. Update survivalRate
10. After 800ms: isAnimating false
11. If rate hits 0: after animation, gameState "gameOver"
12. If all 4 zones answered and rate > 0: after 2500ms, gameState "win"

### Render Structure

return (
  <div className="w-screen h-screen relative overflow-hidden">

    // Layer 0 — Pannellum 360 viewer (full screen background)
    <ReactPannellum ... />

    // Layer 1 — Scenario overlays (fire tint, dark overlay)
    {condition === "earthquake_fire" && <div className="fire-overlay" />}
    {condition === "earthquake_dark" && <div className="dark-overlay" />}

    // Layer 2 — Shake overlay
    {isShaking && <div className={shakeClass} />}

    // Layer 3 — Zone highlight overlays
    {currentZone && <ZoneHighlight zone={currentZone} />}

    // Layer 4 — Direction arrow hint
    {nextZoneHint && <DirectionArrow hint={nextZoneHint} />}

    // Layer 5 — Left floating card (scenario controls)
    <ScenarioCard ... />

    // Layer 6 — Right floating card (question + pie chart)
    {currentZone && !answeredZones.has(currentZone.id) && (
      <QuestionCard question={...} zone={currentZone} ... />
    )}

    // Layer 7 — Back button
    <a href="/exterior" className="fixed top-4 left-4 z-50 ...">← Back</a>

    // Layer 8 — Game Over overlay
    {gameState === "gameOver" && <GameOver ... />}

    // Layer 9 — Win screen overlay
    {gameState === "win" && <WinScreen ... />}

  </div>
)

---

## FILE: components/GameOver.tsx

Props: { magnitude, condition, lastWrongAnswer, lastWrongExplanation, lastWrongRealHazard, onTryAgain, onSeeEscapeRoute }

Animation sequence:

0ms: Black overlay fades in over 2000ms
  position fixed inset-0 bg-black/95 backdrop-blur-sm z-[100]

2000ms: Red pulsing glow from center
  radial-gradient red glow

2500ms: Skull scales in with bounce easing
  text-8xl

3000ms: Text fades in line by line 300ms between each:
  "💀 YOU DID NOT SURVIVE" large white bold
  "HSS Room 1345 claimed your life." slate-300
  Divider
  "Magnitude: X.X" slate-400
  "Condition: [condition]" slate-400
  "Final Survival Rate: 0%" red
  Divider
  "What got you:" slate-400 small
  lastWrongAnswer — red italic
  Divider
  "What you should have done:" slate-400 small
  lastWrongExplanation — green small
  Divider
  "Real hazard in this room:" orange small
  lastWrongRealHazard — orange italic
  Divider
  "Your awareness saved 0 lives today." slate-400 italic

4500ms: Two buttons:
  "🔄 Try Again" blue — resets all state
  "🚪 See Escape Route" dark slate — navigates to /exterior

---

## FILE: components/WinScreen.tsx

Props: { survivalRate, magnitude, condition, onPlayAgain, onSeeRiskScore }

Animation sequence:

0ms: White flash fills screen fades over 500ms

500ms: Dark bg + rotating golden light rays from center
  conic-gradient gold rgba(245,158,11,0.2) rotating
  animation: spin 8s linear infinite

1000ms: Gold and blue particles burst from center
  30 particles random angles gold #F59E0B or blue #1A56DB
  CSS particleBurst: translate outward opacity 0 over 1.5s

1500ms: Main text fades in golden glow pulsing:
  "✨ YOU ESCAPED! ✨"
  fontSize 48px fontWeight 900 white
  textShadow: 0 0 30px rgba(245,158,11,0.8)
  CSS glowPulse: alternates intensity every 2s
  scale 1.0 to 1.05 every 2s

2000ms: Stats fade in 300ms between each:
  "🏆 PERFECT SURVIVAL" gold #F59E0B
  "Final Survival Rate: X%" white large
  "Magnitude Survived: X.X" slate-300
  "Condition: [name]" slate-300
  "Questions Correct: 4 of 4" green
  Divider
  "You knew exactly what to do." white italic
  "HSS 1345 could not stop you." white italic
  Divider
  "Real talk: This room has a water-damaged ceiling tile," slate-300 small
  "a projector on a single bracket, and chairs on wheels." slate-300 small
  "You identified every hazard correctly. 🎯" green small
  Divider
  "Your awareness could save lives in a real earthquake. 🌍" slate-300

3000ms: Blue and gold confetti from top
  50 pieces #1A56DB and #F59E0B
  Random x positions random 0-2s delays
  CSS confettiFall: translateY + rotation over 4s
  Fades after 4s

3500ms: Two buttons:
  "🔄 Play Again — Try M[magnitude + 0.5]" blue — bumps magnitude by 0.5
  "📊 See Your Risk Score" dark slate — navigates to /risk

---

## FILE: app/simulator/page.tsx

"use client"
import SimulatorGame from "@/components/SimulatorGame"

export default function SimulatorPage() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-950">
      <SimulatorGame />
    </main>
  )
}

---

## ADDITIONAL REQUIREMENTS

1. All components must be "use client"
2. Install react-pannellum: npm install react-pannellum
3. Panorama image at /public/waypoints/panorama_hss.jpg — must exist before running
4. minPitch -20 and maxPitch 25 in Pannellum config — critical to hide broken floor and ceiling
5. SVG pie chart uses CSS transition on stroke-dashoffset for smooth animation
6. Zone 3 water damage ceiling overlay must be the most dramatic visual element
7. Game Over shows realHazardNote for the specific question that killed the user
8. Win screen references the real room hazards
9. All card backgrounds use backdropFilter blur
10. Mobile: both cards stack at bottom on small screens
11. Add "← Back to Exterior" fixed top-left navigating to /exterior
12. The compass in the left card must update in real time as user drags panorama
13. Direction arrow hints appear after answering to guide user to next zone
14. Auto-rotate stops when user touches the panorama
15. Shake animation applies to the entire screen including the panorama

---

## PHOTO FILE

Place this file in frontend/public/waypoints/:
- panorama_hss.jpg — the full 360 equirectangular panorama of HSS Room 1345

---

## AFTER RUNNING THIS PROMPT

1. Run npm install react-pannellum
2. Run npm run dev and open /simulator
3. Confirm panorama loads and you can drag to look around
4. Confirm auto-rotate is working when idle
5. Face Zone 1 (corridor door area) — question card should appear
6. Answer correctly — pie chart grows, +15% floats up, Real Hazard note appears
7. Arrow hint appears pointing to Zone 2
8. Drag to face Zone 2 — next question appears
9. Answer all wrong until 0% — Game Over screen
10. Refresh, answer all correct — Win screen with confetti
11. Confirm minPitch and maxPitch prevent seeing broken floor and ceiling

---

## IF SOMETHING BREAKS

Open new Cursor Composer: