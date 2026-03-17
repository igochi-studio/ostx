import Dexie, { type EntityTable } from "dexie";

// ===== Data Models =====

export interface PoolEntry {
  id?: number;
  content: string;
  sourceShape: "pebble" | "droplet" | "ring" | null;
  sourceId: number | null;
  severity: "rising" | "steady" | "receding";
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface PebbleEntry {
  id?: number;
  title: string;
  weight: "light" | "steady" | "heavy" | "crushing";
  status: "carrying" | "settled" | "released" | "eroded";
  layers: { title: string; done: boolean }[];
  createdAt: Date;
  lastTouched: Date;
  erodedAt: Date | null;
  poolMigratedAt: Date | null;
}

export interface DropletEntry {
  id?: number;
  content: string;
  captureType: "typed" | "voice";
  createdAt: Date;
  surfacedCount: number;
  clusterId: string | null;
  linkedPebbleId: number | null;
}

export interface RingEntry {
  id?: number;
  personName: string;
  orbitDistance: number; // 1 (closest) to 5 (widest)
  weather: "warm" | "cloudy" | "still" | "stormy";
  notes: { content: string; date: Date }[];
  gifts: string[];
  lastInteraction: Date;
  createdAt: Date;
}

export interface WaveSnapshot {
  id?: number;
  date: string; // YYYY-MM-DD
  poolLevel: number; // 0-1
  pebbleCount: number;
  dropletCount: number;
  dominantWeight: "light" | "steady" | "heavy";
}

export interface UserSettings {
  id?: number;
  onboardingComplete: boolean;
  userName: string;
  completionWord: "settled" | "released" | "done";
  soundEnabled: boolean;
  createdAt: Date;
  lastOpenedAt: Date;
}

// ===== Database =====

class OstxDatabase extends Dexie {
  pool!: EntityTable<PoolEntry, "id">;
  pebbles!: EntityTable<PebbleEntry, "id">;
  droplets!: EntityTable<DropletEntry, "id">;
  rings!: EntityTable<RingEntry, "id">;
  waves!: EntityTable<WaveSnapshot, "id">;
  settings!: EntityTable<UserSettings, "id">;

  constructor() {
    super("ostx");

    this.version(1).stores({
      pool: "++id, severity, createdAt, resolvedAt, sourceShape",
      pebbles: "++id, status, weight, createdAt, lastTouched, poolMigratedAt",
      droplets: "++id, createdAt, captureType, clusterId, linkedPebbleId",
      rings: "++id, personName, orbitDistance, weather, lastInteraction",
      waves: "++id, date",
      settings: "++id",
    });
  }
}

export const db = new OstxDatabase();

// ===== Helper Functions =====

// Get or create user settings
export async function getSettings(): Promise<UserSettings> {
  const existing = await db.settings.toCollection().first();
  if (existing) return existing;

  const newSettings: UserSettings = {
    onboardingComplete: false,
    userName: "",
    completionWord: "settled",
    soundEnabled: false,
    createdAt: new Date(),
    lastOpenedAt: new Date(),
  };
  const id = await db.settings.add(newSettings);
  return { ...newSettings, id };
}

export async function updateSettings(
  updates: Partial<UserSettings>
): Promise<void> {
  const settings = await getSettings();
  await db.settings.update(settings.id!, updates);
}

// Pool operations
export async function addToPool(
  content: string,
  source: { shape: PoolEntry["sourceShape"]; id: number | null } = {
    shape: null,
    id: null,
  }
): Promise<number> {
  return db.pool.add({
    content,
    sourceShape: source.shape,
    sourceId: source.id,
    severity: "steady",
    createdAt: new Date(),
    resolvedAt: null,
  });
}

export async function resolvePoolItem(id: number): Promise<void> {
  await db.pool.update(id, { resolvedAt: new Date() });
}

export async function getActivePoolItems(): Promise<PoolEntry[]> {
  return db.pool
    .where("resolvedAt")
    .equals(null as unknown as Date)
    .reverse()
    .sortBy("createdAt");
}

// Pebble operations
export async function addPebble(title: string): Promise<number> {
  return db.pebbles.add({
    title,
    weight: "steady",
    status: "carrying",
    layers: [],
    createdAt: new Date(),
    lastTouched: new Date(),
    erodedAt: null,
    poolMigratedAt: null,
  });
}

export async function settlePebble(id: number): Promise<void> {
  await db.pebbles.update(id, { status: "settled", lastTouched: new Date() });
}

export async function getCarryingPebbles(): Promise<PebbleEntry[]> {
  return db.pebbles.where("status").equals("carrying").reverse().sortBy("createdAt");
}

// Droplet operations
export async function addDroplet(
  content: string,
  captureType: "typed" | "voice" = "typed"
): Promise<number> {
  return db.droplets.add({
    content,
    captureType,
    createdAt: new Date(),
    surfacedCount: 0,
    clusterId: null,
    linkedPebbleId: null,
  });
}

export async function getRecentDroplets(
  limit: number = 50
): Promise<DropletEntry[]> {
  return db.droplets.orderBy("createdAt").reverse().limit(limit).toArray();
}

// Ring operations
export async function addRing(personName: string): Promise<number> {
  return db.rings.add({
    personName,
    orbitDistance: 1,
    weather: "warm",
    notes: [],
    gifts: [],
    lastInteraction: new Date(),
    createdAt: new Date(),
  });
}

export async function getRings(): Promise<RingEntry[]> {
  return db.rings.orderBy("lastInteraction").reverse().toArray();
}

export async function addRingNote(
  id: number,
  note: string
): Promise<void> {
  const ring = await db.rings.get(id);
  if (!ring) return;
  await db.rings.update(id, {
    notes: [...ring.notes, { content: note, date: new Date() }],
    lastInteraction: new Date(),
  });
}

// ===== The Water Cycle Engine =====

// Check for pebbles that should erode into the Pool
export async function runErosionCheck(): Promise<void> {
  const now = Date.now();
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  const fiveDays = 5 * 24 * 60 * 60 * 1000;

  const carrying = await getCarryingPebbles();

  for (const pebble of carrying) {
    const age = now - pebble.lastTouched.getTime();

    // Heavy/crushing pebbles erode faster
    const threshold =
      pebble.weight === "crushing"
        ? threeDays * 0.5
        : pebble.weight === "heavy"
        ? threeDays
        : fiveDays;

    if (age > threshold && !pebble.poolMigratedAt) {
      // Migrate to pool
      await addToPool(`${pebble.title}`, {
        shape: "pebble",
        id: pebble.id!,
      });
      await db.pebbles.update(pebble.id!, {
        poolMigratedAt: new Date(),
        erodedAt: new Date(),
      });
    }
  }
}

// Update ring orbit distances based on interaction recency
export async function updateOrbits(): Promise<void> {
  const rings = await getRings();
  const now = Date.now();

  for (const ring of rings) {
    const daysSince = Math.floor(
      (now - ring.lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
    );

    let newOrbit = 1;
    if (daysSince > 30) newOrbit = 5;
    else if (daysSince > 14) newOrbit = 4;
    else if (daysSince > 7) newOrbit = 3;
    else if (daysSince > 3) newOrbit = 2;

    if (newOrbit !== ring.orbitDistance) {
      await db.rings.update(ring.id!, { orbitDistance: newOrbit });
    }
  }
}

// Save daily wave snapshot
export async function saveWaveSnapshot(): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  const existing = await db.waves.where("date").equals(today).first();
  if (existing) return; // Already captured today

  const poolItems = await getActivePoolItems();
  const pebbles = await getCarryingPebbles();
  const droplets = await getRecentDroplets(100);

  const poolLevel = Math.min(poolItems.length / 6, 1);

  // Calculate dominant weight
  const weights = pebbles.map((p) => p.weight);
  const heavyCount = weights.filter(
    (w) => w === "heavy" || w === "crushing"
  ).length;
  const dominantWeight: WaveSnapshot["dominantWeight"] =
    heavyCount > pebbles.length / 2
      ? "heavy"
      : pebbles.length > 5
      ? "steady"
      : "light";

  await db.waves.add({
    date: today,
    poolLevel,
    pebbleCount: pebbles.length,
    dropletCount: droplets.length,
    dominantWeight,
  });
}

// Check for ring patterns that should surface in the pool
export async function runRingPatternCheck(): Promise<void> {
  const rings = await getRings();
  const now = Date.now();

  for (const ring of rings) {
    const daysSince = Math.floor(
      (now - ring.lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If someone close (orbit 1-2) hasn't been contacted in 14+ days
    // and they're not already in the pool, surface them
    if (daysSince > 14 && ring.orbitDistance <= 2) {
      const existingPoolItem = await db.pool
        .filter(
          (p) =>
            p.sourceShape === "ring" &&
            p.sourceId === ring.id &&
            p.resolvedAt === null
        )
        .first();

      if (!existingPoolItem) {
        await addToPool(
          `it's been ${daysSince} days since ${ring.personName}`,
          { shape: "ring", id: ring.id! }
        );
      }
    }

    // If weather has been "stormy" — surface in pool
    if (ring.weather === "stormy") {
      const existingPoolItem = await db.pool
        .filter(
          (p) =>
            p.sourceShape === "ring" &&
            p.sourceId === ring.id &&
            p.resolvedAt === null
        )
        .first();

      if (!existingPoolItem) {
        await addToPool(
          `things are stormy with ${ring.personName}`,
          { shape: "ring", id: ring.id! }
        );
      }
    }
  }
}

// Run all background processes
export async function runQuietEngine(): Promise<void> {
  await runErosionCheck();
  await updateOrbits();
  await runRingPatternCheck();
  await saveWaveSnapshot();
}
