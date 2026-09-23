import { openDB, type IDBPDatabase } from "idb";
import type { ClassSample, TrainPoint, VisionClass } from "../types";

const DB_NAME = "cv-studio-db";
const DB_VERSION = 3;
const PROJECTS = "projects";
const SESSIONS = "sessions";
const EMBEDS = "embeddings";
const PIPELINES = "pipelines";
const AR = "ar";

export interface ClassifierProject {
  id: string;
  name: string;
  updatedAt: number;
  classes: VisionClass[];
  samples: ClassSample[];
  history: TrainPoint[];
  inputSize: number;
  modelKey: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(PROJECTS)) database.createObjectStore(PROJECTS, { keyPath: "id" });
        if (!database.objectStoreNames.contains(SESSIONS)) database.createObjectStore(SESSIONS, { keyPath: "id" });
        if (!database.objectStoreNames.contains(EMBEDS)) database.createObjectStore(EMBEDS, { keyPath: "id" });
        if (!database.objectStoreNames.contains(PIPELINES)) database.createObjectStore(PIPELINES, { keyPath: "id" });
        if (!database.objectStoreNames.contains(AR)) database.createObjectStore(AR, { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export async function saveClassifierProject(project: ClassifierProject) {
  await (await db()).put(PROJECTS, project);
}

export async function loadClassifierProject(id: string) {
  return (await (await db()).get(PROJECTS, id)) as ClassifierProject | undefined;
}

export async function listClassifierProjects() {
  return (await (await db()).getAll(PROJECTS)) as ClassifierProject[];
}

export async function deleteClassifierProject(id: string) {
  await (await db()).delete(PROJECTS, id);
}

export const DEFAULT_CLASSIFIER_ID = "cv-image-classifier";
export const DEFAULT_MODEL_KEY = "indexeddb://cv-image-classifier-model";
export const DEFAULT_GESTURE_ID = "cv-custom-gesture";
export const DEFAULT_GESTURE_MODEL_KEY = "indexeddb://cv-custom-gesture-model";
export const DEFAULT_REP_SESSION_ID = "cv-rep-session";
export const DEFAULT_EMBED_ID = "cv-embeddings";
export const DEFAULT_AR_ID = "cv-ar-config";

export interface StoredRepSession {
  id: string;
  exercise: string;
  updatedAt: number;
  reps: Array<{ n: number; at: number; durationMs: number; minAngle: number; maxAngle: number; notes: string[] }>;
}

export async function saveRepSession(session: StoredRepSession) {
  await (await db()).put(SESSIONS, session);
}

export async function loadRepSession(id = DEFAULT_REP_SESSION_ID) {
  return (await (await db()).get(SESSIONS, id)) as StoredRepSession | undefined;
}

export interface StoredEmbedItem {
  id: string;
  label: string;
  preview: string;
  vector: number[];
  at: number;
}

export interface StoredEmbedSet {
  id: string;
  updatedAt: number;
  items: StoredEmbedItem[];
}

export async function saveEmbedSet(set: StoredEmbedSet) {
  await (await db()).put(EMBEDS, set);
}

export async function loadEmbedSet(id = DEFAULT_EMBED_ID) {
  return (await (await db()).get(EMBEDS, id)) as StoredEmbedSet | undefined;
}

export interface StoredPipeline {
  id: string;
  name: string;
  updatedAt: number;
  graph: { nodes: unknown[]; edges: unknown[] };
}

export async function savePipeline(pipeline: StoredPipeline) {
  await (await db()).put(PIPELINES, pipeline);
}

export async function loadPipeline(id: string) {
  return (await (await db()).get(PIPELINES, id)) as StoredPipeline | undefined;
}

export async function listPipelines() {
  return (await (await db()).getAll(PIPELINES)) as StoredPipeline[];
}

export async function deletePipeline(id: string) {
  await (await db()).delete(PIPELINES, id);
}

export interface StoredArConfig {
  id: string;
  updatedAt: number;
  enabled: string[];
  opacity: number;
  scale: number;
  custom: Array<{ id: string; anchor: string; dataUrl: string }>;
}

export async function saveArConfig(config: StoredArConfig) {
  await (await db()).put(AR, config);
}

export async function loadArConfig(id = DEFAULT_AR_ID) {
  return (await (await db()).get(AR, id)) as StoredArConfig | undefined;
}
