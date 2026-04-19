# SeismoShield — Gamified 360 Simulator (Updated with Real Room Analysis)
> Paste this entire prompt into Cursor Composer (Cmd+Shift+I)
> Based on actual photo analysis of HSS Room 1345

---

## CONTEXT BLOCK

```
I'm building SeismoShield, a Next.js 14 PWA for earthquake risk assessment.
Demo scenario: M6.5 earthquake, Salton Sea epicenter (33.19N, 115.54W), target building: HSS Room 1345, Humanities & Social Sciences Building, UCSD Muir College, La Jolla CA 92093.
Target coordinates: 32.8785, -117.2417
Backend: FastAPI at http://localhost:8000
Frontend: Next.js 14 App Router + Tailwind CSS
Color scheme: dark navy background #0F172A, blue accent #1A56DB, white text
```

---

## PROMPT — PASTE THIS INTO CURSOR

```
[CONTEXT BLOCK]

Build a fully gamified 360-degree earthquake survival simulator for HSS Room 1345.
Create the following files:
- app/simulator/page.tsx
- components/SimulatorGame.tsx
- components/SurvivalPieChart.tsx
- components/QuestionCard.tsx
- components/ScenarioCard.tsx
- components/GameOver.tsx
- components/WinScreen.tsx
- lib/simulatorData.ts

---

## REAL ROOM CONDITIONS (from photo analysis)

HSS Room 1345 has the following confirmed hazards visible in photos:

CEILING — HIGHEST RISK:
- Standard suspended drop ceiling with 2x2 ft acoustic T-bar grid
- Ceiling-mounted projector hanging from a SINGLE drop-ceiling bracket (not anchored to structural concrete)
- VISIBLE WATER STAIN on ceiling tile in top-left corner of Photo 3 — pre-existing structural weakness
- CRACKED CEILING TILE JOINT visible near water stain in Photo 3 — pre-existing damage
- Fire sprinkler head ceiling-mounted
- HVAC diffuser grilles in ceiling grid
- Long recessed LED strip lights throughout ceiling grid

WALLS — HIGH RISK:
- Large flat screen TV wall-mounted on blue wall — heavy, mount can fail
- Two framed whiteboards wall-mounted — can fall
- Rollable projection screen on wall bracket — can swing and fall
- Exposed electrical conduit on blue wall — not fully secured
- Concrete block construction beneath paint — 1970s HSS building

FURNITURE — MODERATE RISK:
- ALL chairs on wheels (casters) — will slide away during shaking
- ALL tables on wheels (casters) — will move during shaking
- Heavy wooden instructor podium sitting on wall desk
- Equipment stack (laptops/tablets in charging stations) on right wall desk
- Loose items including bags, water bottles, food on tables

DOORS:
- Door 1: Single interior door → opens to yellow corridor → leads DEEPER into building NOT outside
- Door 2: Double steel push-bar emergency exit → leads DIRECTLY OUTSIDE → heavy steel frame may warp

NO WINDOWS in this room — actually reduces glass hazard

---

## FILE: lib/simulatorData.ts

Export the following data exactly:

DIRECTIONS array — 4 items:

Direction 1:
  id: 1
  photo: "/waypoints/IMG_0973.jpg"
  highlightType: "danger"
  highlightElement: "corridor-door"
  highlightLabel: "Interior Corridor — NOT Exit"
  highlightPosition: { top: "28%", left: "44%", width: "14%", height: "35%" }
  hazardNote: "This door leads deeper into HSS building — not outside"

Direction 2:
  id: 2
  photo: "/waypoints/IMG_0974.jpg"
  highlightType: "warning"
  highlightElement: "emergency-exit"
  highlightLabel: "Emergency Exit → Outside"
  highlightPosition: { top: "22%", left: "36%", width: "22%", height: "48%" }
  hazardNote: "Heavy steel doors may warp — concrete debris outside"
  secondaryHighlight: {
    type: "danger"
    element: "wall-mounted-tv"
    position: { top: "28%", left: "5%", width: "28%", height: "28%" }
    label: "Heavy TV — Fall Risk"
  }

Direction 3:
  id: 3
  photo: "/waypoints/IMG_0975.jpg"
  highlightType: "temptation"
  highlightElement: "laptop"
  highlightLabel: "UNLIMITED CLAUDE CREDITS & TOKENS 🤖"
  highlightPosition: { top: "52%", left: "22%", width: "18%", height: "18%" }
  ceilingHazard: {
    position: { top: "0%", left: "0%", width: "45%", height: "22%" }
    label: "⚠️ WATER DAMAGE — PRE-WEAKENED"
    note: "Visible water stain + cracked tile joint — real pre-existing damage"
  }
  projectorHazard: {
    position: { top: "8%", left: "28%", width: "20%", height: "20%" }
    label: "Projector — Single Bracket"
  }

Direction 4:
  id: 4
  photo: "/waypoints/IMG_0976.jpg"
  highlightType: "mixed"
  highlightElement: "projection-screen"
  dangerPosition: { top: "5%", left: "2%", width: "35%", height: "55%" }
  dangerLabel: "Projection Screen — Fall Risk"
  hvacPosition: { top: "0%", right: "0%", width: "20%", height: "25%" }
  hvacLabel: "HVAC Unit — Can Dislodge"
  safeZoneLabel: "SAFE ZONE ✓"
  podiumDangerLabel: "Podium — Too Small"

QUESTIONS array — 4 items:

Question 1 (directionId: 1):
  text: "The earthquake just hit. You see this door leading to the yellow corridor. The projector above you is swinging. Do you run for the door?"
  options: [
    "Yes — run immediately, any door is better than staying",
    "No — drop under the nearest table and cover my head",
    "Yes — but walk carefully to avoid falling",
    "Stand in the doorway for protection"
  ]
  correctIndex: 1
  survivalChange: { correct: +15, wrong: -25 }
  correctExplanation: "Correct. That corridor leads DEEPER into the HSS building — not outside. During active shaking the ceiling-mounted projector could fall at any moment. The central tables are your immediate shelter. The doorway myth is outdated — tables provide far better protection. Drop. Cover. Hold On."
  wrongExplanation: "That corridor leads deeper into the 1970s HSS concrete building — not outside. You would have been struck by debris in the corridor AND the projector fell behind you. The central tables were your safest shelter. Drop. Cover. Hold On."
  realHazardNote: "The projector in this room hangs from a single suspended ceiling bracket — not anchored to the structural concrete above. At M6.5 it can fall."

Question 2 (directionId: 2):
  text: "Shaking has stopped. You see the emergency exit — it leads directly outside. But notice the heavy TV on the wall to the left. What do you do?"
  options: [
    "Run straight through the emergency exit immediately",
    "Grab something to protect your head, then push through the exit",
    "Go back and grab your laptop first — you need it",
    "Wait by the TV wall for someone to tell you what to do"
  ]
  correctIndex: 1
  survivalChange: { correct: +15, wrong: -25 }
  correctExplanation: "Smart. Even though the exit leads directly outside, two things could kill you: the heavy steel door frame may have warped making it hard to open, and the 1970s HSS concrete facade may be shedding debris right outside. Grab a book, jacket, or bag for head protection. Also — never stand near that wall-mounted TV. The mount can fail during aftershocks."
  wrongExplanation: "The HSS building exterior has a history of concrete spalling. Debris was falling right outside that door. You also walked past the wall-mounted TV which could have fallen on you during an aftershock. Always protect your head before stepping outside a building that old."
  realHazardNote: "The HSS building exterior facade was replaced due to severe concrete spalling. Debris falling from the exterior is a documented real risk."

Question 3 (directionId: 3):
  text: "You spot a laptop on the desk with a sticky note: UNLIMITED CLAUDE CREDITS & TOKENS 🤖. Look up — you can see the water-damaged ceiling tile and the projector swinging above. Do you grab it?"
  options: [
    "Yes — unlimited tokens is worth dying for",
    "Yes — but only if Cursor is already open on it",
    "Absolutely not — drop under a table and cover immediately",
    "Ask Claude whether grabbing it violates safety protocols"
  ]
  correctIndex: 2
  survivalChange: { correct: +15, wrong: -25 }
  correctExplanation: "Perfect. Look at that ceiling — the water stain top-left is REAL. That tile has pre-existing structural damage from water intrusion. Combined with the projector on a single suspended bracket, this ceiling is the most dangerous spot in the room. No Claude credits are worth your life. Drop. Cover. Hold On. Claude will still be there when you get out. 🤖"
  wrongExplanation: "The ceiling collapsed on you while you reached for the laptop. That water stain you saw is REAL pre-existing damage — visible in the actual photos of this room. The suspended ceiling + damaged tiles + swinging projector created a perfect collapse zone. Never grab belongings during active shaking. Not even unlimited Claude tokens."
  realHazardNote: "The water stain and cracked ceiling tile joint in this room are real — visible in the actual photos. This is genuine pre-existing structural weakness in HSS 1345."

Question 4 (directionId: 4):
  text: "Shaking is intensifying. The projection screen is swinging on its wall bracket. The HVAC unit in the top-right corner is rattling. The instructor podium looks solid. Where do you take cover?"
  options: [
    "Under the instructor podium — it is solid heavy wood",
    "Under the wall desk directly below the projection screen",
    "Under a central table away from all walls",
    "Press against the white wall between the hazards"
  ]
  correctIndex: 2
  survivalChange: { correct: +15, wrong: -25 }
  correctExplanation: "Perfect. The central tables are the only safe shelter because: the projection screen bracket can fail sending it crashing onto the wall desk, the HVAC unit in the corner can dislodge and fall, and the instructor podium is too small to protect you. Central tables are away from ALL wall-mounted hazards. Remember — in this room every chair and table is on wheels, so grip the table leg firmly and hold on."
  wrongExplanation: "The projection screen fell from its bracket directly onto the wall desk. This is the most predictable hazard in this room — a heavy screen on a wall-mounted bracket directly above a sitting area. The central tables are the only shelter away from all wall-mounted hazards including the swinging screen and the rattling HVAC unit."
  realHazardNote: "Every chair and table in HSS 1345 is on wheels. During an earthquake they will slide. Grip the table leg when sheltering — do not let the table roll away from you."

MAGNITUDE_START_RATES object:
  4.0: 95
  4.5: 90
  5.0: 85
  5.5: 80
  6.0: 75
  6.5: 65
  7.0: 50
  7.5: 35
  8.0: 20

CONDITION_MODIFIERS object:
  earthquake: 0
  earthquake_fire: -10
  earthquake_dark: -8
  earthquake_fire_dark: -18

BUILDING_HAZARDS array (shown in left card):
  [
    { icon: "⚠️", label: "Projector", risk: "SEVERE", note: "Single bracket, can fall" },
    { icon: "💧", label: "Water-damaged ceiling tile", risk: "HIGH", note: "Pre-existing weakness — real damage visible in this room" },
    { icon: "📺", label: "Wall-mounted TV", risk: "HIGH", note: "Heavy mount, can fail in aftershock" },
    { icon: "🎥", label: "Projection screen bracket", risk: "HIGH", note: "Above wall desk — fall zone" },
    { icon: "🌀", label: "HVAC unit", risk: "MODERATE", note: "Corner-mounted, can dislodge" },
    { icon: "🪑", label: "Chairs and tables on wheels", risk: "MODERATE", note: "Will slide — grip table legs when sheltering" },
  ]

---

## FILE: components/SurvivalPieChart.tsx

Build an SVG pie chart component.

Props: { survivalRate: number, isAnimating: boolean, animationDirection: "up" | "down" | null }

SVG implementation:
- Viewbox: 0 0 120 120, circle radius 54, center at 60,60
- Track circle: stroke #1E293B, strokeWidth 12, fill none
- Arc circle: stroke color based on rate, strokeWidth 12, fill none
- strokeDasharray: 339.3 (circumference = 2 * PI * 54)
- strokeDashoffset: 339.3 - (339.3 * survivalRate / 100)
- Arc starts from top: transform rotate(-90deg) origin center
- Transition: stroke-dashoffset 0.8s ease-in-out, stroke 0.5s ease

Arc color:
  >= 70 → #16A34A green
  >= 40 → #CA8A04 yellow
  >= 20 → #EA580C orange
  < 20  → #DC2626 red

Center text:
  Large bold white: survivalRate + "%"
  Small slate-400 below: "SURVIVAL"
  Sizes: 28px number, 10px label with letter-spacing 0.1em

Pulse when below 20%:
  CSS keyframe survivalPulse: drop-shadow alternates red every 1.5s

Floating change indicators:
  animationDirection "up": green "+15%" floats upward and fades over 1s
  animationDirection "down": red "-25%" floats downward and fades over 1s
  Position: centered above the pie chart

---

## FILE: components/ScenarioCard.tsx (Left Floating Card)

Props: { magnitude: number, condition: string, onMagnitudeChange: (m: number) => void, onConditionChange: (c: string) => void, currentQuestion: number, answeredQuestions: boolean[], buildingHazards: array }

Layout — dark glass card fixed left side:

Section 1 — SCENARIO SETTINGS:
  Magnitude slider: min 4.0 max 8.0 step 0.5, shows current value large and blue
  Condition toggles stacked: "🌍 Earthquake Only" | "🔥 + Fire" | "🌑 + Blackout"
  Active condition: blue background

Section 2 — BUILDING HAZARDS (new section based on real room analysis):
  Title: "⚠️ ROOM HAZARDS" in orange
  List of BUILDING_HAZARDS from simulatorData.ts
  Each item: icon + label + colored risk badge (SEVERE=red, HIGH=orange, MODERATE=yellow)
  Scrollable if needed

Section 3 — BUILDING INFO:
  "HSS Room 1345"
  "Built: 1970 — Brutalist Concrete"
  "8-story concrete structure"
  Risk badge: red "🔴 SEVERE RISK"
  "PGV: 8.4 cm/s at M6.5"

Section 4 — PROGRESS:
  "PROGRESS" label
  Four dots: Q1 Q2 Q3 Q4
  Answered = blue filled with ✓
  Current = blue pulsing
  Upcoming = gray empty

Card styles:
  background: rgba(15, 23, 42, 0.85)
  backdropFilter: blur(12px)
  border: 1px solid rgba(255, 255, 255, 0.1)
  borderRadius: 16px
  padding: 20px
  width: 270px
  position: fixed, left: 20px, top: 50%, transform: translateY(-50%)
  maxHeight: 90vh, overflowY: auto

---

## FILE: components/QuestionCard.tsx (Right Floating Card)

Props: { question, onAnswer, answered, selectedIndex, survivalRate, isAnimating, animationDirection, questionNumber, realHazardNote }

Layout — dark glass card fixed right side:

TOP: SurvivalPieChart component centered 120px

Divider

"❓ QUESTION X OF 4" slate-400 small

Question text: white medium 16px

Four answer buttons:
  Before: dark background white text hover darkens
  After correct choice: green #16A34A white ✓ icon
  After wrong choice: red #DC2626 white ✗ icon
  Correct answer always reveals green after answering
  Disabled after answering

After answering — explanation fades in over 0.5s

After answering — "⚠️ Real Hazard:" section fades in:
  Orange text showing realHazardNote for current question
  Small italic font
  This highlights the real building condition from photo analysis

After 2.5s — "Next Direction →" blue button slides up

Card styles:
  background: rgba(15, 23, 42, 0.85)
  backdropFilter: blur(12px)
  border: 1px solid rgba(255, 255, 255, 0.1)
  borderRadius: 16px
  padding: 24px
  width: 300px
  position: fixed, right: 20px, top: 50%, transform: translateY(-50%)
  maxHeight: 90vh, overflowY: auto

---

## FILE: components/SimulatorGame.tsx

State:
  currentDirection: number (0-3)
  survivalRate: number
  answeredQuestions: boolean[] (4 false)
  selectedAnswers: (number|null)[] (4 null)
  gameState: "playing" | "gameOver" | "win"
  isTransitioning: boolean
  isAnimating: boolean
  animationDirection: "up" | "down" | null
  lastWrongAnswer: string
  lastWrongExplanation: string
  magnitude: number (default 6.5)
  condition: string (default "earthquake")

Starting survival:
  MAGNITUDE_START_RATES[magnitude] + CONDITION_MODIFIERS[condition]
  Recompute when magnitude or condition changes before game starts

Answer handling:
  1. If already answered return
  2. Record selectedAnswers[currentDirection] = chosenIndex
  3. Set answeredQuestions[currentDirection] = true
  4. Check correct: chosenIndex === QUESTIONS[currentDirection].correctIndex
  5. Calculate new rate: correct → min(100, rate+15), wrong → max(0, rate-25)
  6. Set animationDirection: correct→"up", wrong→"down"
  7. Set isAnimating true
  8. Update survivalRate
  9. After 800ms: isAnimating false, animationDirection null
  10. If rate hits 0: after animation, gameState "gameOver", set lastWrongAnswer and lastWrongExplanation
  11. If all 4 answered and rate > 0: after 2500ms, gameState "win"

Photo background:
  Full screen object-fit cover
  CSS transition opacity 0.5s on src change
  Preload all 4 images on mount

Direction navigation:
  Can only advance after answering
  No going back
  Transition: isTransitioning true → 500ms → update direction → false

Highlight overlays — render based on current direction:

Direction 1 overlays:
  Red pulsing border box at corridor door position
  ❌ badge floating above door
  Text label "Interior Corridor — NOT Exit" in red below badge
  CSS redPulse: box-shadow alternates red glow every 1s

Direction 2 overlays:
  Orange pulsing border at emergency exit position
  ⚠️ badge above exit
  Green text "→ DIRECTLY OUTSIDE" overlaid on door
  Separate red danger highlight at TV position with "📺 Heavy TV" label
  CSS orangePulse keyframe

Direction 3 overlays:
  Golden aura at laptop position — pulsing gold box-shadow
  🤖 badge floating above laptop
  Gold floating text "UNLIMITED CLAUDE CREDITS & TOKENS" above laptop
  RED DANGER ZONE overlay at ceiling water stain position:
    Semi-transparent red overlay
    "💧 WATER DAMAGE — PRE-WEAKENED" label
    Animated crack lines SVG: jagged red lines that slowly spread
    This is the most important overlay — make it dramatic and clear
  Orange projector danger zone at projector position:
    "⚠️ Projector — Single Bracket" label
  CSS goldenAura keyframe

Direction 4 overlays:
  Red danger zone at projection screen position
  Subtle swinging animation: rotate(-2deg) to rotate(2deg) every 0.8s ease-in-out
  "🎥 Projection Screen — Fall Risk" red label
  Orange danger at HVAC corner: "⚠️ HVAC — Can Dislodge"
  Green safe zone glow in center area: "✓ SAFE ZONE" green label
  Red label at podium: "Too Small"

Navigation arrows:
  Right arrow only visible after answering current question
  No left arrow — no going back
  Large translucent buttons on screen edges

Bottom dots:
  4 dots centered bottom
  Active: large blue pulsing
  Answered: blue filled ✓
  Upcoming: gray empty

---

## FILE: components/GameOver.tsx

Props: { magnitude, condition, lastWrongAnswer, lastWrongExplanation, onTryAgain, onSeeEscapeRoute }

Animation sequence:

0ms: Black overlay fades in over 2000ms
  position fixed inset-0 bg-black/95 backdrop-blur-sm z-100

2000ms: Red pulsing glow from center
  radial-gradient red

2500ms: Skull scales in with bounce
  text-8xl bounce easing

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
  Show the realHazardNote for the question they got wrong — orange italic
  Divider
  "Your awareness saved 0 lives today." slate-400 italic

4500ms: Two buttons fade in:
  "🔄 Try Again" blue
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
  30 particles random angles, gold #F59E0B or blue #1A56DB
  CSS particleBurst: translate outward + opacity 0 over 1.5s

1500ms: Main text fades in golden glow pulsing:
  "✨ YOU ESCAPED! ✨"
  fontSize 48px fontWeight 900 white
  textShadow: 0 0 30px rgba(245,158,11,0.8)
  CSS glowPulse: alternates intensity every 2s
  transform: scale(1.0) to scale(1.05) every 2s

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
  50 pieces colors #1A56DB and #F59E0B
  Random x positions random 0-2s delays
  CSS confettiFall: translateY full height + rotation over 4s
  Fades after 4s

3500ms: Two buttons:
  "🔄 Play Again — Try M[magnitude + 0.5]" blue
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
2. No external animation libraries — CSS keyframes and Tailwind only
3. Photos at /waypoints/IMG_0973.jpg through IMG_0976.jpg
4. SVG pie chart uses CSS transition on stroke-dashoffset for smooth animation
5. The water damage ceiling overlay in Direction 3 must be the most visually dramatic element — this is real evidence of building weakness and judges need to notice it
6. Game Over screen must show the realHazardNote for the question that killed the user
7. Win screen must reference the real room hazards in the congratulations text
8. All card backgrounds use backdropFilter blur
9. Mobile responsive — cards stack vertically on small screens
10. Add "← Back to Exterior" link top-left corner navigating to /exterior
11. Preload all 4 photos on mount to avoid flash during transitions
12. The "Real Hazard:" section in the question card is critical — always show it after answering so users learn about real building conditions

---

## PHOTO FILES

Place these in frontend/public/waypoints/ with exact filenames:
- IMG_0973.jpg — facing corridor door (Direction 1)
- IMG_0974.jpg — facing emergency exit + TV wall (Direction 2)
- IMG_0975.jpg — facing blue wall with laptop + water-damaged ceiling (Direction 3)
- IMG_0976.jpg — facing projection screen + HVAC (Direction 4)

Convert from HEIC to JPG before running. Use an online HEIC converter or:
  Mac: open in Preview → Export as JPEG
  Windows: use heic-to-jpg.com

---

## AFTER RUNNING THIS PROMPT

1. Run npm run dev and open /simulator
2. Check all 4 photos load without flash
3. Direction 3 — confirm the water damage ceiling overlay is visible and dramatic
4. Test answering correct: pie chart grows, +15% floats up, Real Hazard note appears
5. Test answering wrong: pie chart shrinks, -25% floats down, explanation appears
6. Answer all wrong until 0%: Game Over screen with last wrong answer
7. Refresh, answer all correct: Win screen with confetti and real hazard callout
8. Resize to mobile: both cards should stack at bottom of screen

---

## IF SOMETHING BREAKS

Open new Cursor Composer and paste:

```
[CONTEXT BLOCK]

The gamified simulator has this error:
[PASTE FULL ERROR]

Broken file:
[PASTE FILE]

Fix it without simplifying the animations or removing the real hazard notes.
The water damage overlay in Direction 3 and the Real Hazard section
in the question card are critical features — do not remove them.
```

---

## DEMO SCRIPT FOR THIS FEATURE

When presenting to judges, say this for Direction 3:

"Notice the ceiling above — that water stain and cracked tile you see are REAL.
We photographed this actual room today. HSS 1345 already has pre-existing
structural weakness in its suspended ceiling. Now watch what happens when
someone reaches for the laptop..."

This turns a game moment into a genuine data-driven insight.
Judges will remember it.

---

*SeismoShield — Gamified 360 Simulator v2 — DataHacks @ UCSD*
