#!/usr/bin/env node
/**
 * fetch-ucsd-buildings.mjs
 *
 * Pull all building footprints around the UCSD campus from OSM Overpass and
 * emit a GeoJSON FeatureCollection at `public/ucsd_buildings_full.geojson`.
 * Each Feature carries estimated metre heights so deck.gl can extrude them.
 *
 * Run:  node scripts/fetch-ucsd-buildings.mjs
 */

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "..", "public", "ucsd_buildings_full.geojson");

// UCSD campus bounding box (south, west, north, east)
const BBOX = { south: 32.866, west: 117.253, north: 32.9, east: 117.214 };

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const QUERY = `
[out:json][timeout:60];
(
  way["building"](${BBOX.south},-${BBOX.west},${BBOX.north},-${BBOX.east});
  relation["building"](${BBOX.south},-${BBOX.west},${BBOX.north},-${BBOX.east});
);
(._;>;);
out body;
`.trim();

const DEFAULT_FLOOR_HEIGHT = 3.6;
const DEFAULT_HEIGHT = 10;

function parseHeight(tags) {
  if (!tags) return DEFAULT_HEIGHT;

  if (tags.height) {
    const h = parseFloat(String(tags.height).replace(/[^\d.]/g, ""));
    if (Number.isFinite(h) && h > 0) return h;
  }
  if (tags["building:height"]) {
    const h = parseFloat(String(tags["building:height"]).replace(/[^\d.]/g, ""));
    if (Number.isFinite(h) && h > 0) return h;
  }
  if (tags["building:levels"]) {
    const lvl = parseFloat(tags["building:levels"]);
    if (Number.isFinite(lvl) && lvl > 0) return lvl * DEFAULT_FLOOR_HEIGHT;
  }
  if (tags.levels) {
    const lvl = parseFloat(tags.levels);
    if (Number.isFinite(lvl) && lvl > 0) return lvl * DEFAULT_FLOOR_HEIGHT;
  }

  const kind = tags.building;
  if (kind === "church" || kind === "cathedral") return 28;
  if (kind === "university" || kind === "college") return 18;
  if (kind === "hospital") return 24;
  if (kind === "dormitory" || kind === "residential") return 20;
  if (kind === "parking" || kind === "garage") return 12;
  return DEFAULT_HEIGHT;
}

function categoryFor(tags) {
  if (!tags) return "generic";
  const t = tags.building;
  if (["university", "college", "school"].includes(t)) return "education";
  if (["dormitory", "residential", "apartments"].includes(t)) return "residential";
  if (["hospital", "clinic"].includes(t)) return "medical";
  if (["commercial", "retail", "office"].includes(t)) return "commercial";
  if (tags.sport || tags.leisure === "stadium" || tags.leisure === "sports_centre")
    return "athletic";
  if (["parking", "garage"].includes(t)) return "parking";
  return "generic";
}

function buildFeatures(data) {
  const nodes = new Map();
  const ways = new Map();

  for (const el of data.elements) {
    if (el.type === "node") {
      nodes.set(el.id, [el.lon, el.lat]);
    } else if (el.type === "way") {
      ways.set(el.id, el);
    }
  }

  const features = [];

  for (const el of data.elements) {
    if (el.type !== "way" || !el.tags || !el.tags.building) continue;
    const coords = (el.nodes || [])
      .map((nodeId) => nodes.get(nodeId))
      .filter(Boolean);
    if (coords.length < 4) continue;
    // Ensure closed ring
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) coords.push([first[0], first[1]]);

    features.push({
      type: "Feature",
      properties: {
        id: `way/${el.id}`,
        name: el.tags.name || el.tags["name:en"] || "Unnamed building",
        category: categoryFor(el.tags),
        height: parseHeight(el.tags),
        osm_building: el.tags.building,
      },
      geometry: {
        type: "Polygon",
        coordinates: [coords],
      },
    });
  }

  return features;
}

async function main() {
  console.log("[ucsd-buildings] Querying Overpass API…");
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    body: "data=" + encodeURIComponent(QUERY),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "seismoshield-ucsd-buildings/1.0 (https://github.com/haminxx/Data-Hacks)",
    },
  });
  if (!res.ok) {
    throw new Error(`Overpass API returned ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const features = buildFeatures(data);

  const collection = {
    type: "FeatureCollection",
    metadata: {
      source: "OpenStreetMap via Overpass API",
      license: "© OpenStreetMap contributors (ODbL)",
      generated_at: new Date().toISOString(),
      bbox: BBOX,
      count: features.length,
    },
    features,
  };

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(collection));
  console.log(
    `[ucsd-buildings] Wrote ${features.length} building footprints -> ${OUT_PATH}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
