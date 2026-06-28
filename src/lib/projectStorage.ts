import type { ProjectRecord } from "./types";
import { invokeCommand, isTauriAvailable } from "./tauri";

const STORAGE_KEY = "tauri_app_projects_v1";

function readAll(): ProjectRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ProjectRecord[];
  } catch (e) {
    console.error("failed reading projects", e);
    return [];
  }
}

function writeAll(records: ProjectRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error("failed writing projects", e);
  }
}

async function invokeSave(record: ProjectRecord) {
  if (!isTauriAvailable()) {
    return null;
  }

  try {
    const path = await invokeCommand<string>("save_project", { json: JSON.stringify(record) });
    return path;
  } catch (e) {
    console.warn("invoke save_project failed, falling back to localStorage:", e);
    return null;
  }
}

export function getProjects(): ProjectRecord[] {
  return readAll();
}

export async function addProject(record: ProjectRecord) {
  const savedPath = await invokeSave(record);
  if (savedPath) {
    return savedPath;
  }

  const all = readAll();
  all.push(record);
  writeAll(all);
  return null;
}

export function clearProjects() {
  writeAll([]);
}

export default { getProjects, addProject, clearProjects };
