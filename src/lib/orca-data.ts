/**
 * ORCA — Marine EcOsystem Reasoning with Collaborative Agents
 * Demo dataset. ALL VALUES ARE REALISTIC MOCK DATA (clearly labelled in UI).
 * Live sources referenced: ISRO / INCOIS / IMD / Copernicus.
 */

export type RiskLevel = "green" | "amber" | "red";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MarinePort {
  id: string;
  name: string;
  state: string;
  coast: "east" | "west";
  position: LatLng;
}

export interface OceanConditions {
  sst: number; // deg C
  sstAnomaly: number;
  chlorophyll: number; // mg/m3
  waveHeight: number; // m
  swellPeriod: number; // s
  currentSpeed: number; // knots
  currentDir: string;
  windSpeed: number; // knots
  windDir: string;
  gust: number;
  visibility: number; // km
  rainChance: number; // %
  lightningRisk: RiskLevel;
  cycloneWatch: boolean;
  cycloneName?: string;
  updatedAt: string;
}

export interface PfzZone {
  id: string;
  name: string;
  center: LatLng;
  distanceNm: number;
  bearing: string;
  depthM: number;
  confidence: number; // 0-1
  species: string[];
  sst: number;
  chlorophyll: number;
  frontStrength: "weak" | "moderate" | "strong";
  note: string;
}

export interface Hazard {
  id: string;
  kind: "cyclone" | "lightning" | "high-wave" | "squall" | "fog";
  title: string;
  center: LatLng;
  radiusNm: number;
  severity: RiskLevel;
  detail: string;
  validTill: string;
}

export interface RestrictedZone {
  id: string;
  name: string;
  kind: "imbl" | "marine-park" | "defence" | "shipping-lane";
  polygon: LatLng[];
  note: string;
}

export interface TidePoint {
  t: string;
  height: number;
}

export interface ForecastPoint {
  day: string;
  sst: number;
  waveHeight: number;
  windSpeed: number;
  chlorophyll: number;
  rainChance: number;
}

export interface RouteWaypoint extends LatLng {
  label: string;
  note?: string;
}

export interface PortDossier {
  port: MarinePort;
  conditions: OceanConditions;
  pfz: PfzZone[];
  hazards: Hazard[];
  restricted: RestrictedZone[];
  tide: TidePoint[];
  forecast: ForecastPoint[];
  route: RouteWaypoint[];
  risk: {
    level: RiskLevel;
    score: number; // 0-100
    drivers: string[];
    window: string;
  };
}

export const DATA_SOURCES = [
  {
    id: "isro",
    name: "ISRO / NRSC — Oceansat-3 OCM",
    provides: "Chlorophyll-a, ocean colour, PFZ advisories",
    latency: "Daily composite",
    url: "https://www.nrsc.gov.in",
  },
  {
    id: "incois",
    name: "INCOIS — Indian National Centre for Ocean Information Services",
    provides: "PFZ advisory, SST, wave height, currents, ocean state forecast",
    latency: "3-hourly",
    url: "https://incois.gov.in",
  },
  {
    id: "imd",
    name: "IMD — India Meteorological Department",
    provides: "Cyclone bulletins, wind, rainfall, lightning nowcast",
    latency: "Hourly / bulletin",
    url: "https://mausam.imd.gov.in",
  },
  {
    id: "cmems",
    name: "Copernicus Marine (CMEMS)",
    provides: "SST analysis, surface currents, swell reanalysis",
    latency: "Daily",
    url: "https://marine.copernicus.eu",
  },
  {
    id: "survey",
    name: "Survey of India / INCOIS boundaries",
    provides: "IMBL, marine protected areas, defence & shipping corridors",
    latency: "Static reference",
    url: "https://incois.gov.in",
  },
] as const;

export const PORTS: MarinePort[] = [
  { id: "chennai", name: "Chennai", state: "Tamil Nadu", coast: "east", position: { lat: 13.08, lng: 80.28 } },
  { id: "puducherry", name: "Puducherry", state: "Puducherry", coast: "east", position: { lat: 11.93, lng: 79.83 } },
  { id: "tuticorin", name: "Thoothukudi", state: "Tamil Nadu", coast: "east", position: { lat: 8.76, lng: 78.13 } },
  { id: "vizag", name: "Visakhapatnam", state: "Andhra Pradesh", coast: "east", position: { lat: 17.69, lng: 83.3 } },
  { id: "kochi", name: "Kochi", state: "Kerala", coast: "west", position: { lat: 9.97, lng: 76.24 } },
  { id: "mangaluru", name: "Mangaluru", state: "Karnataka", coast: "west", position: { lat: 12.87, lng: 74.84 } },
  { id: "mumbai", name: "Mumbai", state: "Maharashtra", coast: "west", position: { lat: 18.94, lng: 72.84 } },
  { id: "porbandar", name: "Porbandar", state: "Gujarat", coast: "west", position: { lat: 21.64, lng: 69.6 } },
];

function seeded(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973;
  let s = h || 7;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

const round = (n: number, d = 1) => Number(n.toFixed(d));

function offshore(p: MarinePort, nm: number, bearingDeg: number): LatLng {
  const rad = (bearingDeg * Math.PI) / 180;
  const o = p.position;
  const dLat = (nm / 60) * Math.cos(rad);
  const dLng = ((nm / 60) * Math.sin(rad)) / Math.cos((o.lat * Math.PI) / 180);
  return { lat: round(o.lat + dLat, 3), lng: round(o.lng + dLng, 3) };
}

const BEARING_LABEL = (coast: "east" | "west") => (coast === "east" ? "ENE" : "WSW");

export function buildDossier(portId: string): PortDossier {
  const port = (PORTS.find((p) => p.id === portId) ?? PORTS[0])!;
  const rnd = seeded(port.id);
  const seaward = port.coast === "east" ? 75 : 255;

  const waveHeight = round(0.8 + rnd() * 3.4);
  const windSpeed = round(8 + rnd() * 24);
  const cycloneWatch = port.id === "vizag" || port.id === "chennai" ? rnd() > 0.45 : rnd() > 0.88;
  const lightningRisk: RiskLevel = rnd() > 0.7 ? "amber" : rnd() > 0.9 ? "red" : "green";

  const conditions: OceanConditions = {
    sst: round(26.4 + rnd() * 4.2),
    sstAnomaly: round(-0.6 + rnd() * 1.8),
    chlorophyll: round(0.18 + rnd() * 1.9, 2),
    waveHeight,
    swellPeriod: round(7 + rnd() * 6),
    currentSpeed: round(0.3 + rnd() * 1.6),
    currentDir: port.coast === "east" ? "NNE" : "SSW",
    windSpeed,
    windDir: port.coast === "east" ? "SW" : "NW",
    gust: round(windSpeed * 1.35),
    visibility: round(4 + rnd() * 9),
    rainChance: Math.round(10 + rnd() * 75),
    lightningRisk,
    cycloneWatch,
    ...(cycloneWatch ? { cycloneName: "Depression BOB-04" } : {}),
    updatedAt: new Date().toISOString(),
  };

  const pfz: PfzZone[] = [0, 1, 2].map((i) => {
    const dist = round(12 + i * 9 + rnd() * 6);
    const b = seaward + (i - 1) * 18;
    return {
      id: `${port.id}-pfz-${i + 1}`,
      name: `PFZ ${String.fromCharCode(65 + i)} — ${port.name} offshore`,
      center: offshore(port, dist, b),
      distanceNm: dist,
      bearing: BEARING_LABEL(port.coast),
      depthM: Math.round(28 + i * 22 + rnd() * 25),
      confidence: round(0.62 + rnd() * 0.33, 2),
      species: [
        ["Indian mackerel", "Sardine"],
        ["Yellowfin tuna", "Barracuda"],
        ["Seer fish", "Ribbonfish"],
      ][i] as string[],
      sst: round(conditions.sst + (i - 1) * 0.6),
      chlorophyll: round(conditions.chlorophyll + 0.25 * (2 - i), 2),
      frontStrength: i === 0 ? "strong" : i === 1 ? "moderate" : "weak",
      note:
        i === 0
          ? "Sharp thermal front with chlorophyll gradient — highest aggregation probability."
          : i === 1
            ? "Moderate front, good secondary option if seas build at PFZ A."
            : "Weak signature; only viable in calm seas.",
    };
  });

  const hazards: Hazard[] = [];
  if (cycloneWatch) {
    hazards.push({
      id: `${port.id}-cyc`,
      kind: "cyclone",
      title: `${conditions.cycloneName} — ${port.coast === "east" ? "Bay of Bengal" : "Arabian Sea"}`,
      center: offshore(port, 140, seaward + 25),
      radiusNm: 90,
      severity: "red",
      detail: "System likely to intensify in 24h. Squally weather with gusts to 55 kt expected in the shaded area.",
      validTill: "Next 48 hours",
    });
  }
  if (waveHeight > 2.6) {
    hazards.push({
      id: `${port.id}-wave`,
      kind: "high-wave",
      title: `High wave alert — ${waveHeight} m significant height`,
      center: offshore(port, 45, seaward),
      radiusNm: 55,
      severity: waveHeight > 3.4 ? "red" : "amber",
      detail: "Rough to very rough seas. Small mechanised and country craft advised not to venture out.",
      validTill: "Next 24 hours",
    });
  }
  if (lightningRisk !== "green") {
    hazards.push({
      id: `${port.id}-ltg`,
      kind: "lightning",
      title: "Thunderstorm & lightning nowcast",
      center: offshore(port, 22, seaward - 30),
      radiusNm: 30,
      severity: lightningRisk,
      detail: "Convective cells developing in the afternoon. Avoid metal masts, keep radio watch.",
      validTill: "Next 6 hours",
    });
  }
  if (conditions.visibility < 6) {
    hazards.push({
      id: `${port.id}-fog`,
      kind: "fog",
      title: `Reduced visibility — ${conditions.visibility} km`,
      center: offshore(port, 10, seaward),
      radiusNm: 18,
      severity: "amber",
      detail: "Haze near the coast at dawn. Maintain AIS and sound signals.",
      validTill: "Till 09:00 IST",
    });
  }

  const zoneBox = (c: LatLng, d: number): LatLng[] => [
    { lat: c.lat + d, lng: c.lng - d },
    { lat: c.lat + d, lng: c.lng + d },
    { lat: c.lat - d, lng: c.lng + d },
    { lat: c.lat - d, lng: c.lng - d },
  ];

  const restricted: RestrictedZone[] = [
    {
      id: `${port.id}-imbl`,
      name: port.coast === "east" ? "IMBL — India/Sri Lanka" : "IMBL — India/Pakistan sector",
      kind: "imbl",
      polygon: zoneBox(offshore(port, 105, seaward + 40), 0.55),
      note: "International Maritime Boundary Line. Crossing is prohibited — risk of detention.",
    },
    {
      id: `${port.id}-park`,
      name: "Marine protected area",
      kind: "marine-park",
      polygon: zoneBox(offshore(port, 35, seaward - 55), 0.3),
      note: "No-take zone under Wildlife Protection Act. Trawling prohibited.",
    },
    {
      id: `${port.id}-lane`,
      name: "Main shipping corridor",
      kind: "shipping-lane",
      polygon: zoneBox(offshore(port, 62, seaward + 5), 0.22),
      note: "Dense merchant traffic. Cross at right angles, keep continuous watch.",
    },
  ];

  const tide: TidePoint[] = Array.from({ length: 13 }, (_, i) => ({
    t: `${String(i * 2).padStart(2, "0")}:00`,
    height: round(0.9 + 0.75 * Math.sin((i / 12) * Math.PI * 2 + rnd()) + 0.1 * rnd(), 2),
  }));

  const forecast: ForecastPoint[] = Array.from({ length: 7 }, (_, i) => ({
    day: (["Today", "D+1", "D+2", "D+3", "D+4", "D+5", "D+6"] as const)[i] ?? `D+${i}`,
    sst: round(conditions.sst + Math.sin(i / 2) * 0.7),
    waveHeight: round(Math.max(0.5, waveHeight + Math.sin(i / 1.6) * 0.9)),
    windSpeed: round(Math.max(5, windSpeed + Math.cos(i / 1.8) * 6)),
    chlorophyll: round(Math.max(0.1, conditions.chlorophyll + Math.sin(i / 2.4) * 0.3), 2),
    rainChance: Math.min(95, Math.max(5, Math.round(conditions.rainChance + Math.sin(i) * 20))),
  }));

  const target = pfz[0]!;
  const route: RouteWaypoint[] = [
    { ...port.position, label: `${port.name} harbour`, note: "Departure — slack water recommended" },
    { ...offshore(port, 8, seaward - 10), label: "WP1", note: "Clear of surf zone / fairway buoy" },
    { ...offshore(port, 18, seaward - 34), label: "WP2", note: "Dog-leg to keep 6 nm clear of lightning cells" },
    { ...offshore(port, target.distanceNm - 4, seaward + 8), label: "WP3", note: "Cross shipping corridor at 90°" },
    { ...target.center, label: target.name, note: "Fishing ground — front edge" },
  ];

  const drivers: string[] = [];
  let score = 18;
  if (cycloneWatch) {
    score += 48;
    drivers.push("Cyclonic system within 150 nm (IMD bulletin)");
  }
  if (waveHeight > 2.6) {
    score += 22;
    drivers.push(`Significant wave height ${waveHeight} m (INCOIS ocean state)`);
  }
  if (conditions.windSpeed > 25) {
    score += 14;
    drivers.push(`Winds ${conditions.windSpeed} kt gusting ${conditions.gust} kt`);
  }
  if (lightningRisk !== "green") {
    score += 12;
    drivers.push("Lightning nowcast active within 30 nm");
  }
  if (conditions.visibility < 6) {
    score += 8;
    drivers.push(`Visibility reduced to ${conditions.visibility} km`);
  }
  if (drivers.length === 0) drivers.push("No active marine warning for this sector");
  score = Math.min(97, score);
  const level: RiskLevel = score >= 62 ? "red" : score >= 34 ? "amber" : "green";

  return {
    port,
    conditions,
    pfz,
    hazards,
    restricted,
    tide,
    forecast,
    route,
    risk: {
      level,
      score,
      drivers,
      window:
        level === "red"
          ? "No safe window in the next 24 h"
          : level === "amber"
            ? "Short window 04:00–10:00 IST, return before noon"
            : "Favourable through the next 24 h",
    },
  };
}

export const AGENTS = [
  { id: "planner", name: "Planner Agent", icon: "brain", task: "Decompose the query and dispatch specialist agents" },
  { id: "ocean", name: "Ocean Agent", icon: "waves", task: "SST, currents, chlorophyll and thermal fronts" },
  { id: "weather", name: "Weather Agent", icon: "cloud", task: "Wind, rain, lightning and cyclone bulletins" },
  { id: "satellite", name: "Satellite / PFZ Agent", icon: "satellite", task: "Ocean colour + PFZ advisory correlation" },
  { id: "gis", name: "GIS Agent", icon: "map", task: "Boundaries, restricted zones and distances" },
  { id: "risk", name: "Risk Agent", icon: "alert", task: "Fuse signals into a marine risk level" },
  { id: "route", name: "Route Agent", icon: "route", task: "Optimise a safe track avoiding hazards" },
] as const;

export type AgentId = (typeof AGENTS)[number]["id"];

/** Deterministic agent findings, used for the visible workflow and as AI evidence. */
export function agentFindings(d: PortDossier): Record<AgentId, string[]> {
  const best = d.pfz[0]!;
  return {
    planner: [
      `Query scoped to ${d.port.name} (${d.port.state}) — ${d.port.coast} coast`,
      "Dispatched: Ocean, Weather, Satellite/PFZ, GIS → Risk → Route",
    ],
    ocean: [
      `SST ${d.conditions.sst} °C (anomaly ${d.conditions.sstAnomaly > 0 ? "+" : ""}${d.conditions.sstAnomaly} °C)`,
      `Chlorophyll-a ${d.conditions.chlorophyll} mg/m³`,
      `Waves ${d.conditions.waveHeight} m @ ${d.conditions.swellPeriod} s, current ${d.conditions.currentSpeed} kt ${d.conditions.currentDir}`,
    ],
    weather: [
      `Wind ${d.conditions.windSpeed} kt ${d.conditions.windDir}, gusts ${d.conditions.gust} kt`,
      `Rain probability ${d.conditions.rainChance} %, visibility ${d.conditions.visibility} km`,
      d.conditions.cycloneWatch
        ? `${d.conditions.cycloneName} under watch — intensification likely`
        : "No cyclonic circulation in the sector",
    ],
    satellite: [
      `${d.pfz.length} PFZ candidates from Oceansat-3 OCM + INCOIS advisory`,
      `Best: ${best.name} at ${best.distanceNm} nm ${best.bearing}, confidence ${(best.confidence * 100).toFixed(0)} %`,
      `${best.frontStrength} thermal front, target species ${best.species.join(", ")}`,
    ],
    gis: [
      `${d.restricted.length} restricted features nearby: ${d.restricted.map((r) => r.name).join("; ")}`,
      `Nearest boundary risk: ${d.restricted[0]!.name}`,
    ],
    risk: [`Fused risk score ${d.risk.score}/100 → ${d.risk.level.toUpperCase()}`, ...d.risk.drivers],
    route: [
      `${d.route.length}-waypoint track, ~${d.pfz[0]!.distanceNm + 6} nm total`,
      "Avoids lightning cells, shipping corridor crossed at 90°, 6 nm buffer from IMBL",
    ],
  };
}
