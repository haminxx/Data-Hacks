# SeismoShield — Risk Assessment & Enterprise Dashboard
> Paste each prompt separately into Cursor Composer (Cmd+Shift+I)
> Build in order: Backend first, then B2C, then Enterprise

---

## CONTEXT BLOCK
> Paste this at the start of EVERY prompt

```
I'm building SeismoShield, a Next.js 14 PWA for earthquake risk assessment.
Demo scenario: M6.5 earthquake, Salton Sea epicenter (33.19N, 115.54W), target building: HSS Room 1345, Humanities & Social Sciences Building, UCSD Muir College, La Jolla CA 92093.
Target coordinates: 32.8785, -117.2417
Backend: FastAPI at http://localhost:8000
Frontend: Next.js 14 App Router + Tailwind CSS
Color scheme: dark navy background #0F172A, blue accent #1A56DB, white text
```

---

## PROMPT 1 — BACKEND: Financial Projection Endpoint

```
[CONTEXT BLOCK]

Add a new endpoint to backend/main.py called /financial-projection.
Also create a new file backend/risk_calculator.py with all calculation logic.

---

## FILE: backend/risk_calculator.py

Import pandas, numpy, math. Load query.csv from data/rekoske/query.csv.

### Step 1 — Filter USGS data near HSS

HSS_LAT = 32.8785
HSS_LON = -117.2417
RADIUS_KM = 50
YEARS_OF_DATA = 23  # 2000-2023

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

Load query.csv. Add column dist_km using haversine from each row lat/lon to HSS.
Filter to rows where dist_km <= 50.
Save as nearby_df.

### Step 2 — Count events by magnitude band

Count events in nearby_df:
  count_m4 = len(nearby_df[nearby_df['mag'] >= 4.0])
  count_m5 = len(nearby_df[nearby_df['mag'] >= 5.0])
  count_m6 = len(nearby_df[nearby_df['mag'] >= 6.0])
  count_m7 = len(nearby_df[nearby_df['mag'] >= 7.0])

Annual rates (Poisson):
  lambda_m4 = count_m4 / YEARS_OF_DATA
  lambda_m5 = count_m5 / YEARS_OF_DATA
  lambda_m6 = count_m6 / YEARS_OF_DATA
  lambda_m7 = count_m7 / YEARS_OF_DATA

### Step 3 — Poisson probability function

def poisson_probability(lambda_rate, years):
    return 1 - math.exp(-lambda_rate * years)

### Step 4 — Damage factors

BUILDING_VALUE = 8_000_000  # HSS estimated replacement value

DAMAGE_FACTORS = {
    'm4': 0.005,   # 0.5% of building value
    'm5': 0.03,    # 3%
    'm6': 0.12,    # 12%
    'm65': 0.25,   # 25%
    'm7': 0.60,    # 60%
}

### Step 5 — Expected annual claims

def expected_annual_claims(lambda_m4, lambda_m5, lambda_m6, lambda_m7):
    # Probability of each band occurring in a single year
    p_m4_only = poisson_probability(lambda_m4, 1) - poisson_probability(lambda_m5, 1)
    p_m5_only = poisson_probability(lambda_m5, 1) - poisson_probability(lambda_m6, 1)
    p_m6_only = poisson_probability(lambda_m6, 1) - poisson_probability(lambda_m7, 1)
    p_m7_plus = poisson_probability(lambda_m7, 1)

    expected = (
        p_m4_only * BUILDING_VALUE * DAMAGE_FACTORS['m4'] +
        p_m5_only * BUILDING_VALUE * DAMAGE_FACTORS['m5'] +
        p_m6_only * BUILDING_VALUE * DAMAGE_FACTORS['m6'] +
        p_m7_plus * BUILDING_VALUE * DAMAGE_FACTORS['m7']
    )
    return expected

### Step 6 — Premium calculation

BASE_ANNUAL_PREMIUM = 142_000  # Based on risk score 78/100
PREMIUM_ESCALATION = 0.03  # 3% per year

def calculate_premium(year):
    return BASE_ANNUAL_PREMIUM * ((1 + PREMIUM_ESCALATION) ** (year - 1))

### Step 7 — Generate yearly projections

def generate_projections():
    annual_claims = expected_annual_claims(lambda_m4, lambda_m5, lambda_m6, lambda_m7)
    
    yearly_data = []
    cumulative_premium = 0
    cumulative_claims = 0
    
    for year in range(1, 11):
        premium_this_year = calculate_premium(year)
        
        # Claims increase with compounding probability over time
        claims_this_year = annual_claims * (1 + (year - 1) * 0.08)
        
        cumulative_premium += premium_this_year
        cumulative_claims += claims_this_year
        
        net_position = cumulative_premium - cumulative_claims
        
        # Worst case: M7.0+ occurs in this year
        p_m7_in_year = poisson_probability(lambda_m7, year)
        worst_case = cumulative_premium - (BUILDING_VALUE * DAMAGE_FACTORS['m7'] * p_m7_in_year)
        
        yearly_data.append({
            'year': year,
            'annual_premium': round(premium_this_year),
            'annual_expected_claims': round(claims_this_year),
            'cumulative_premium': round(cumulative_premium),
            'cumulative_claims': round(cumulative_claims),
            'net_position': round(net_position),
            'worst_case': round(worst_case),
            'p_m5_plus': round(poisson_probability(lambda_m5, year) * 100, 1),
            'p_m6_plus': round(poisson_probability(lambda_m6, year) * 100, 1),
            'p_m7_plus': round(poisson_probability(lambda_m7, year) * 100, 1),
        })
    
    return yearly_data

### Step 8 — Risk score calculation

def calculate_risk_score():
    # Seismic Hazard (40% weight)
    # Based on PGV from ML model at M6.5
    pgv_score = 72  # normalized from PGV 8.4 cm/s
    fault_score = 80  # Rose Canyon fault 8km away
    soil_score = 60  # Vs30 280 m/s moderate stiff
    historical_freq_score = 85  # high earthquake frequency
    seismic_hazard = (pgv_score * 0.35 + fault_score * 0.30 + soil_score * 0.15 + historical_freq_score * 0.20)
    
    # Building Vulnerability (35% weight)
    age_score = 100  # 1970 pre-seismic code
    material_score = 95  # 1970s concrete
    stories_score = 85  # 8 stories
    ceiling_score = 100  # water damage + suspended ceiling
    hazards_score = 90  # TV, projection screen, projector
    building_vulnerability = (age_score * 0.30 + material_score * 0.25 + stories_score * 0.15 + ceiling_score * 0.20 + hazards_score * 0.10)
    
    # Historical Record (25% weight)
    nearby_count = len(nearby_df)
    freq_score = min(100, (nearby_count / 23) * 10)  # normalize annual rate
    max_mag = nearby_df['mag'].max() if len(nearby_df) > 0 else 0
    max_mag_score = min(100, (max_mag - 3.0) / 4.0 * 100)
    damage_history_score = 75  # documented concrete spalling
    historical_record = (freq_score * 0.50 + max_mag_score * 0.30 + damage_history_score * 0.20)
    
    # Final weighted score
    final_score = (seismic_hazard * 0.40 + building_vulnerability * 0.35 + historical_record * 0.25)
    
    return {
        'overall': round(min(100, final_score)),
        'seismic_hazard': {
            'score': round(seismic_hazard),
            'weight': 40,
            'sub_factors': [
                {'name': 'PGV at M6.5', 'value': '8.4 cm/s', 'score': pgv_score, 'level': 'High'},
                {'name': 'Distance to Rose Canyon Fault', 'value': '8 km', 'score': fault_score, 'level': 'High'},
                {'name': 'Soil Stiffness (Vs30)', 'value': '280 m/s', 'score': soil_score, 'level': 'Moderate'},
                {'name': 'Historical M5+ Events Nearby', 'value': f'{count_m5} events / 23yr', 'score': historical_freq_score, 'level': 'High'},
            ]
        },
        'building_vulnerability': {
            'score': round(building_vulnerability),
            'weight': 35,
            'sub_factors': [
                {'name': 'Year Built', 'value': '1970 — Pre-seismic code', 'score': age_score, 'level': 'Severe'},
                {'name': 'Construction Type', 'value': '1970s Brutalist Concrete', 'score': material_score, 'level': 'Severe'},
                {'name': 'Building Height', 'value': '8 Stories', 'score': stories_score, 'level': 'High'},
                {'name': 'Ceiling Condition', 'value': 'Water damage + suspended grid', 'score': ceiling_score, 'level': 'Severe'},
                {'name': 'Wall-mounted Hazards', 'value': 'TV, projector, screen', 'score': hazards_score, 'level': 'High'},
            ]
        },
        'historical_record': {
            'score': round(historical_record),
            'weight': 25,
            'sub_factors': [
                {'name': 'Earthquakes within 50km (23yr)', 'value': f'{nearby_count} events', 'score': round(freq_score), 'level': 'Severe'},
                {'name': 'Largest Recorded Nearby', 'value': f'M{round(max_mag, 1)}', 'score': round(max_mag_score), 'level': 'High'},
                {'name': 'Building Damage History', 'value': 'Concrete spalling documented', 'score': damage_history_score, 'level': 'High'},
                {'name': 'Fault System Proximity', 'value': 'Rose Canyon 8km, Elsinore 40km', 'score': 80, 'level': 'High'},
            ]
        }
    }

---

## ENDPOINT: Add to backend/main.py

@app.get("/financial-projection")
def financial_projection():
    from risk_calculator import generate_projections, calculate_risk_score, nearby_df, count_m4, count_m5, count_m6, count_m7, lambda_m5, YEARS_OF_DATA
    import math
    
    projections = generate_projections()
    risk_scores = calculate_risk_score()
    
    return {
        "building": "HSS Room 1345, UCSD",
        "data_source": "USGS Earthquake Hazards Program 2000-2023",
        "events_analyzed": len(nearby_df),
        "years_of_data": YEARS_OF_DATA,
        "annual_rates": {
            "m4_plus": round(count_m4 / YEARS_OF_DATA, 2),
            "m5_plus": round(count_m5 / YEARS_OF_DATA, 2),
            "m6_plus": round(count_m6 / YEARS_OF_DATA, 2),
            "m7_plus": round(count_m7 / YEARS_OF_DATA, 2),
        },
        "yearly_projections": projections,
        "risk_scores": risk_scores,
        "interior_hazards": [
            {"hazard": "Ceiling projector", "location": "Center ceiling", "risk": "SEVERE", "action": "Anchor to structural concrete", "cost": 2400},
            {"hazard": "Water-damaged ceiling tile", "location": "NW ceiling corner", "risk": "HIGH", "action": "Replace + inspect above", "cost": 800},
            {"hazard": "Wall-mounted TV", "location": "Blue wall", "risk": "HIGH", "action": "Add safety straps", "cost": 150},
            {"hazard": "Projection screen bracket", "location": "Wall bracket", "risk": "HIGH", "action": "Add secondary anchor", "cost": 300},
            {"hazard": "HVAC unit", "location": "Corner ceiling", "risk": "MODERATE", "action": "Secure mounting", "cost": 500},
            {"hazard": "Mobile chairs and tables", "location": "Throughout room", "risk": "MODERATE", "action": "Replace with fixed furniture", "cost": 12000},
        ],
        "insurance_recommendation": {
            "tier": "Tier 1 — Specialist Coverage Required",
            "policy_type": "Earthquake Specialist Policy",
            "minimum_coverage": 2_000_000,
            "premium_multiplier": 2.5,
            "annual_premium": 142_000,
            "action_items": [
                "Structural retrofit assessment required before renewal",
                "Secure or remove ceiling-mounted projector immediately",
                "Anchor all wall-mounted equipment to structural elements",
            ]
        }
    }

@app.get("/risk-score")
def risk_score():
    from risk_calculator import calculate_risk_score
    return calculate_risk_score()
```

---

## PROMPT 2 — B2C: Address Input Page

```
[CONTEXT BLOCK]

Create app/risk/page.tsx — the B2C risk assessment address input page.

Requirements:
- Full screen dark background #0F172A
- Back arrow top left navigating to /exterior
- Centered content:
  * Heading: "Risk Assessment"
  * Subheading: "Enter any Southern California address to assess seismic risk"
  * Large address input field, pre-filled with: "HSS Room 1345, Humanities & Social Sciences Building, UCSD"
  * Blue submit button: "Assess This Building"
  * Small text below: "Powered by Scripps Institution of Oceanography data + USGS earthquake records"

Address validation logic:
  If input contains any of: "HSS", "1345", "Humanities", "Social Sciences", "UCSD", "32.8785"
    → navigate to /risk/results
  Else
    → show inline message below the input:
      "SeismoShield currently supports HSS Building, UCSD for this demo."
      "Full Southern California coverage launching Q3 2026."
      Blue button below: "Assess HSS Building Instead"
      Clicking this button pre-fills the address and submits

Also add a "Risk Assessment" button to the top navigation bar in app/layout.tsx
  - Position: left side of nav next to logo
  - Style: small pill button, slate border
  - Navigates to /risk
```

---

## PROMPT 3 — B2C: Risk Assessment Results Page

```
[CONTEXT BLOCK]

Create app/risk/results/page.tsx — the B2C risk assessment results page.

On page load: fetch from GET /risk-score and GET /financial-projection

Layout: two column side by side on desktop, stacked on mobile

---

LEFT CARD — 3D Building Model:

Use the same 3D building component already built for the exterior page.
Import and render the rotating GLTF model of HSS Building.

Below the 3D model, show a building info panel:
  Building: HSS Room 1345
  Address: Muir College, UC San Diego, La Jolla CA 92093
  Built: 1970
  Type: Brutalist Concrete — 8 Stories
  Condition: Pre-existing ceiling water damage documented
  Vs30 Soil: 280 m/s (Medium Stiff)
  Nearest Fault: Rose Canyon — 8 km
  Distance from Salton Sea Fault: ~185 km

---

RIGHT CARD — Risk Score Panel (three sections):

SECTION 1 — Overall Score (top):

Large animated circular gauge — speedometer style:
  Size: 180px diameter
  Arc goes from left (0%) to right (100%) — half circle like a speedometer
  Needle points to current score
  Score: animated from 0 to 78 on page load over 1.5s
  Color at 78: red #DC2626
  Center shows: large "78" white bold, small "/ 100" slate-400, "SEVERE RISK" red below
  Outside arc: tick marks at 25, 50, 75, 100 with Low / Moderate / High / Severe labels

SECTION 2 — Three Criteria (middle):

For each criterion render a card with:
  Header row: criterion name + weight badge (e.g. "40% weight") + score (e.g. "72 / 100")
  Colored score bar animating from 0 to score on load
  Expandable sub-factors list (collapsed by default, click to expand):
    Each sub-factor: name | value | colored level badge | small score bar

Criterion 1 — Seismic Hazard:
  Score: from API risk_scores.seismic_hazard.score
  Weight: 40%
  Color: orange (high risk)
  Sub-factors: from API risk_scores.seismic_hazard.sub_factors

Criterion 2 — Building Vulnerability:
  Score: from API risk_scores.building_vulnerability.score
  Weight: 35%
  Color: red (severe)
  Sub-factors: from API

Criterion 3 — Historical Record:
  Score: from API risk_scores.historical_record.score
  Weight: 25%
  Color: orange
  Sub-factors: from API

Level badge colors:
  Severe → red #DC2626
  High → orange #EA580C
  Moderate → yellow #CA8A04
  Low → green #16A34A

SECTION 3 — Insurance Recommendation (bottom):

Dark card with blue left border:
  Large badge: "Tier 1 — Specialist Coverage Required" red
  Policy: "Earthquake Specialist Policy"
  Minimum Coverage: "$2,000,000+"
  Estimated Premium: "2.5x base rate (~$142,000/yr)"
  Divider
  "Recommended Actions:" label
  Three action items as bulleted list in orange text
  Divider
  Small text: "Contact your insurance provider with this SeismoShield report"
  Blue button: "Get Insurance Quote" (shows toast: "Connecting you to a specialist...")

---

PAGE FOOTER:
Small centered text:
"Analysis based on 3,594 USGS earthquake records (2000-2023) + Scripps Rekoske physics-based simulations"
```

---

## PROMPT 4 — Enterprise: Fake Login Page

```
[CONTEXT BLOCK]

Create app/enterprise/login/page.tsx — the enterprise fake login page.

Also add an "Enterprise Login →" button to app/page.tsx (landing page):
  Position: top right corner
  Style: small pill, slate border, white text
  Navigates to /enterprise/login

Login page design:
- Full screen dark background #0F172A
- Centered card: background #1E293B, rounded-2xl, padding 40px, width 400px
- SeismoShield logo text at top in blue
- Below logo: "Enterprise Portal" in slate-400
- Divider
- Form fields:
  * Email input: pre-filled with "demo@seismoshield.com"
  * Password input: pre-filled with "demo123", type password
  * Both have dark background #0F172A, slate border, white text
- "Sign In" blue button full width
- On click: navigate to /enterprise/dashboard
- Small text below button: "Demo credentials pre-filled for DataHacks @ UCSD"
- Back link: "← Back to SeismoShield" navigates to /
```

---

## PROMPT 5 — Enterprise: Portfolio Dashboard

```
[CONTEXT BLOCK]

Create app/enterprise/dashboard/page.tsx — the enterprise portfolio dashboard.

Install recharts if not already installed: npm install recharts

---

TOP BAR:
Dark bar full width:
  Left: "SeismoShield Enterprise" logo text blue
  Center: "Portfolio Overview"
  Right: "demo@seismoshield.com" | "Sign Out" button (navigates to /enterprise/login)

---

SUMMARY CARDS ROW (4 cards):

Card 1: Total Properties
  Value: 4
  Icon: 🏢
  Color: blue

Card 2: High/Severe Risk Properties
  Value: 3
  Icon: ⚠️
  Color: red

Card 3: Total Portfolio Value
  Value: $48M
  Icon: 💰
  Color: slate

Card 4: Estimated Annual Claims Exposure
  Value: $2.1M
  Icon: 📊
  Color: orange

Each card: dark background, rounded, padding, icon top left, large value, small label below

---

PORTFOLIO TABLE:

Heading: "Insured Properties"
Search bar: placeholder "Search properties..."

Table columns: Building | Address | Risk Score | Tier | Annual Premium | Status | Actions

Table rows (hardcoded):

Row 1 — HSS Building (clickable → /enterprise/building/hss):
  Building: HSS Building — Room 1345
  Address: Muir College, UCSD, La Jolla CA
  Risk Score: 78/100 with red filled bar
  Tier: red badge "Tier 1 — Specialist"
  Annual Premium: $142,000
  Status: green badge "Active"
  Actions: "View Details →" blue button

Row 2 — Geisel Library:
  Building: Geisel Library
  Address: UC San Diego, La Jolla CA
  Risk Score: 71/100 with orange bar
  Tier: orange badge "Tier 2 — High Risk"
  Annual Premium: $98,000
  Status: green badge "Active"
  Actions: "View Details →" gray disabled button (shows toast "Available in full version")

Row 3 — Price Center:
  Building: Price Center
  Address: UC San Diego, La Jolla CA
  Risk Score: 65/100 with orange bar
  Tier: orange badge "Tier 2 — High Risk"
  Annual Premium: $76,000
  Status: green badge "Active"
  Actions: "View Details →" gray disabled button

Row 4 — Torrey Pines Residence:
  Building: Torrey Pines Residence Hall
  Address: La Jolla, CA 92037
  Risk Score: 42/100 with yellow bar
  Tier: yellow badge "Tier 3 — Standard"
  Annual Premium: $31,000
  Status: green badge "Active"
  Actions: "View Details →" gray disabled button

Row 1 (HSS) is highlighted with a subtle blue left border to indicate it is the demo building.
Clicking anywhere on Row 1 navigates to /enterprise/building/hss
```

---

## PROMPT 6 — Enterprise: HSS Building Detail Page

```
[CONTEXT BLOCK]

Create app/enterprise/building/hss/page.tsx — the enterprise HSS building detail page.

On page load fetch: GET /financial-projection and GET /risk-score

Install recharts if not already: npm install recharts

---

TOP BAR:
Same enterprise top bar as dashboard.
Add breadcrumb: "Portfolio → HSS Building"

---

BUILDING HEADER SECTION:

Two columns:
Left: Building info card
  "HSS Building — Room 1345" large white bold
  "Muir College, UC San Diego, La Jolla CA 92093"
  Subtitle: "8-story Brutalist Concrete Structure — Built 1970"
  Small badges row: "🔴 Tier 1 Specialist" | "📅 Last Assessed: Today" | "⚠️ Active Policy"
  Building stats grid (2x3):
    Year Built: 1970
    Stories: 8
    Construction: Brutalist Concrete
    Floor Area: ~16,000 sqft
    Vs30 Soil: 280 m/s
    Nearest Fault: Rose Canyon 8km

Right: Overall risk gauge (same speedometer as B2C but smaller)
  Score: 78/100 animated on load
  Below gauge: three criterion scores as small horizontal bars
    Seismic Hazard: X/100 orange bar
    Building Vulnerability: X/100 red bar
    Historical Record: X/100 orange bar

---

SECTION 1 — RISK CRITERIA (detailed, enterprise view):

Three expandable cards, all expanded by default:

Card 1 — Seismic Hazard (40%):
  Header: score + weight + colored bar
  Sub-factors table:
    Columns: Factor | Value | Score | Level | Data Source
    Rows from API risk_scores.seismic_hazard.sub_factors
    Add Data Source column:
      PGV → "Scripps Rekoske ML Model"
      Fault Distance → "USGS Fault Database"
      Vs30 → "USGS National Seismic Hazard Map"
      Historical Events → "USGS Earthquake Catalog 2000-2023"
  Bottom: trend indicator — "Seismic hazard stable — no significant change in fault activity"

Card 2 — Building Vulnerability (35%):
  Header: score + weight + colored bar
  Sub-factors table same format
  Add Data Source column:
    Year Built → "UCSD Facilities Records"
    Construction → "Visual Assessment + Historical Records"
    Height → "Building Survey"
    Ceiling → "SeismoShield Photo Analysis — HSS 1345"
    Hazards → "SeismoShield Photo Analysis — HSS 1345"
  Bottom: trend indicator — "⚠️ Vulnerability INCREASING — ceiling water damage identified in recent assessment"

Card 3 — Historical Record (25%):
  Header: score + weight + colored bar
  Sub-factors table same format
  Data Sources → "USGS Earthquake Hazards Program"
  Bottom: trend indicator — "Historical risk elevated — 3,500+ seismic events recorded near site since 2000"

---

SECTION 2 — INTERIOR HAZARD ANALYSIS:

Heading: "Interior Hazard Analysis" with badge "SeismoShield Photo Assessment"
Subheading: "Based on visual inspection of HSS Room 1345 — April 2026"

Table from API interior_hazards:
  Columns: Hazard | Location | Risk Level | Recommended Action | Est. Retrofit Cost

Color code Risk Level column:
  SEVERE → red badge
  HIGH → orange badge
  MODERATE → yellow badge

Bottom row: "Total Estimated Retrofit Cost: $16,150"
Blue callout box below table:
  "Completing all recommended retrofits would reduce Building Vulnerability score
   from 96/100 to an estimated 68/100, reducing annual premium by approximately $31,000."

---

SECTION 3 — FINANCIAL PROJECTIONS:

Heading: "Financial Projections"
Subheading: "Based on [X] USGS earthquake events analyzed within 50km of property (2000-2023)"
  X comes from API events_analyzed field

Time horizon tabs: [1 YR] [3 YR] [5 YR] [10 YR]
Default selected: 10 YR (shows the most dramatic data)

RECHARTS LINE CHART:
  Data: yearly_projections from API (all 10 years)
  Width: full width of section, height: 320px
  Dark background, no outer border

  Three lines:
    Line 1 — "Premium Revenue": color #1A56DB blue, strokeWidth 2
      dataKey: cumulative_premium
    Line 2 — "Expected Claims": color #DC2626 red, strokeWidth 2
      dataKey: cumulative_claims
    Line 3 — "Net Position": color #16A34A green, strokeWidth 2, strokeDasharray "5 5"
      dataKey: net_position

  XAxis: year 1-10, label "Year"
  YAxis: dollar values formatted as $X,XXX,XXX
  Tooltip: dark background, shows all 3 values + worst case for hovered year
  Legend: bottom center
  ReferenceLine at y=0: red dashed line labeled "Break Even"
  Animate lines on mount: isAnimationActive true

  When time horizon tab changes:
    Filter data to show only years 1, 3, 5, or 10 depending on selection
    But always show the full 10-year chart — just highlight the selected year
    with a vertical ReferenceLine in blue

DATA TABLE below chart:
  Show data for selected time horizon only
  Columns: Metric | Value

  For selected horizon rows:
    Total Premium Revenue | $X,XXX,XXX
    Expected Total Claims | $X,XXX,XXX
    Net Position | $X,XXX,XXX (green if positive, red if negative)
    Probability M5.0+ | XX% (from p_m5_plus)
    Probability M6.0+ | XX% (from p_m6_plus)
    Probability M7.0+ | XX% (from p_m7_plus)
    Worst Case Scenario | $X,XXX,XXX (red)

  Annual rates box below table (always visible):
    "Based on USGS data analysis:"
    M4.0+ events per year: X.XX
    M5.0+ events per year: X.XX
    M6.0+ events per year: X.XX
    M7.0+ events per year: X.XX

---

SECTION 4 — HISTORICAL EARTHQUAKE ACTIVITY:

Heading: "Historical Seismic Activity — 50km radius from HSS"
Subheading: "Source: USGS Earthquake Hazards Program 2000-2023"

RECHARTS BAR CHART:
  This chart is hardcoded with approximate annual earthquake counts near UCSD
  (actual calculation from query.csv done in backend but for chart use these values):
  
  Data array — year and count of M3.0+ events:
    2000: 45, 2001: 38, 2002: 42, 2003: 51, 2004: 39,
    2005: 44, 2006: 37, 2007: 48, 2008: 53, 2009: 41,
    2010: 89, 2011: 46, 2012: 43, 2013: 52, 2014: 47,
    2015: 39, 2016: 44, 2017: 38, 2018: 55, 2019: 142,
    2020: 48, 2021: 44, 2022: 41, 2023: 39

  Bar color: #1A56DB blue, hover highlight lighter blue
  XAxis: years
  YAxis: event count
  Width full, height 200px
  Dark background

  Annotation markers on significant events:
    2010 (count 89): "2010 Baja M7.2" — orange vertical label
    2019 (count 142): "2019 Ridgecrest M7.1" — red vertical label

---

SECTION 5 — POLICY ACTIONS:

Three column card row:

Card 1 — Current Policy:
  Policy Type: Earthquake Specialist
  Coverage: $2,000,000
  Annual Premium: $142,000
  Renewal Date: December 31, 2026
  Status: green "Active"

Card 2 — Risk Alerts:
  List of 3 alerts with orange ⚠️:
  "Water damage detected in ceiling — immediate inspection recommended"
  "Projector mounting not anchored to structural concrete"
  "Mobile furniture increases injury risk — retrofit recommended"

Card 3 — Actions:
  Three buttons stacked:
  "Request Structural Assessment" — blue button
    onClick: toast "Request submitted. Our team will contact you within 24 hours."
  "Adjust Coverage Limits" — slate button
    onClick: toast "Redirecting to coverage adjustment portal..."
  "Download Full Report" — slate button
    onClick: show loading toast "Generating report..." for 1.5s then success toast "✓ Report ready — check your email at demo@seismoshield.com"

---

BACK BUTTON:
Top left: "← Back to Portfolio" navigates to /enterprise/dashboard
```

---

## AFTER RUNNING ALL PROMPTS

Test in this order:

1. Backend: open http://localhost:8000/financial-projection — confirm returns real calculated data
2. Backend: open http://localhost:8000/risk-score — confirm returns criteria and sub-factors
3. B2C: go to /risk — type HSS address — should proceed to results
4. B2C: go to /risk — type random address — should show demo message
5. B2C results: confirm speedometer animates to 78, all three criteria expand
6. Enterprise: click "Enterprise Login →" on landing page
7. Enterprise login: click Sign In — should navigate to dashboard
8. Enterprise dashboard: confirm 4 properties in table, HSS row highlighted
9. Enterprise HSS detail: confirm financial chart loads with real calculated data
10. Enterprise HSS detail: switch time horizon tabs — table updates
11. Enterprise HSS detail: hover chart — tooltip shows all values
12. All "Download Full Report" buttons show toast notifications

---

## IF SOMETHING BREAKS

```
[CONTEXT BLOCK]

This file has an error:
[PASTE FILE PATH]

Error message:
[PASTE ERROR]

Fix it. Keep all the real data calculations from the API intact.
Do not replace calculated values with hardcoded ones.
The financial projections must come from the real USGS data calculation.
```

---

## DEMO SCRIPT FOR RISK ASSESSMENT

B2C pitch line:
"Type your address. In under a second, SeismoShield scores your building
on three criteria — seismic hazard from Scripps physics simulations,
building vulnerability from our photo analysis, and 23 years of USGS
earthquake records. HSS scores 78 out of 100. Severe risk."

Enterprise pitch line:
"For insurance companies — this is your underwriting dashboard.
Every building in your portfolio, risk-scored with real data.
Click HSS — you see the financial projection.
Over 10 years, there is a 94% probability of a M5.0+ event near this building.
Expected claims: $1.18 million. Premium revenue: $1.64 million.
Net position: positive — but barely. And that is before a M7.0 hits."

---

*SeismoShield — Risk Assessment + Enterprise Dashboard — DataHacks @ UCSD*
